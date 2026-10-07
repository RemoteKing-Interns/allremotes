import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import FraudDetection from '../../../../lib/fraudDetection';
import { getDb, mongoEnabled } from '../../../../lib/mongo';
import { emailHash } from '../../../../lib/pii-crypto';
import { stashPendingOrder } from '../../../../lib/pending-order-store';
import { belowMinCartValue, MIN_CART_SUBTOTAL } from '../../../../lib/cartRules';

const fraudDetection = new FraudDetection();

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('Stripe is not configured');
  }
  return new Stripe(stripeSecretKey);
}

// Extra payment methods (BNPL etc.) enabled via STRIPE_PAYMENT_METHODS, e.g.
// "card,afterpay_clearpay" or "card,zip". Only recognised methods pass
// through — anything unrecognised is dropped, and the list always falls back
// to card. Methods must also be activated on the Stripe account, otherwise
// session creation would fail at checkout.
const RECOGNISED_PAYMENT_METHODS = new Set([
  'card',
  'afterpay_clearpay',
  'zip',
  'klarna',
  'link',
]);

function getConfiguredPaymentMethodTypes() {
  const configured = String(process.env.STRIPE_PAYMENT_METHODS || 'card')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const allowed = configured.filter((m) => RECOGNISED_PAYMENT_METHODS.has(m));
  const unknown = configured.filter((m) => !RECOGNISED_PAYMENT_METHODS.has(m));
  if (unknown.length > 0) {
    console.warn('STRIPE_PAYMENT_METHODS contained unknown methods, ignoring them:', unknown);
  }
  return allowed.length > 0 ? allowed : ['card'];
}

export async function POST(request) {
  try {
    const stripe = getStripeClient();
    const { amount, items, customer_email, shippingCost, shippingName, couponCode, order } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Convert items to Stripe line items format
    const line_items = items.map(item => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
          description: `Category: ${item.category || 'Remote Control'}`,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if there's a shipping cost
    if (shippingCost && shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: shippingName || 'Shipping',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Order validation and fraud checks
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (belowMinCartValue(items.map((i) => Number(i.price || 0)), totalAmount)) {
      return NextResponse.json(
        { error: `Items under $${MIN_CART_SUBTOTAL} can only be purchased when the cart total reaches $${MIN_CART_SUBTOTAL}` },
        { status: 400 }
      );
    }

    // Server-side coupon validation — never trust the client's discount.
    // An assigned/invalid coupon fails the checkout rather than charging full price.
    let discounts;
    if (couponCode) {
      let coupon = null;
      if (mongoEnabled()) {
        const db = await getDb();
        coupon = await db.collection("coupons").findOne({
          code: String(couponCode).toUpperCase(),
          isActive: true,
        });
      }
      const now = new Date();
      const valid = coupon
        && !(coupon.validFrom && new Date(coupon.validFrom) > now)
        && !(coupon.validUntil && new Date(coupon.validUntil) < now)
        && !(coupon.maxUses && coupon.usedCount >= coupon.maxUses)
        && !(coupon.minPurchase && totalAmount < coupon.minPurchase)
        && !(coupon.customerEmailHash && (!customer_email || emailHash(customer_email) !== coupon.customerEmailHash));
      if (!valid) {
        return NextResponse.json(
          { error: 'Coupon code is invalid or not assigned to this customer' },
          { status: 400 }
        );
      }
      const discountAmt = coupon.discountPercent
        ? Math.min(totalAmount, Math.round(totalAmount * coupon.discountPercent) / 100)
        : Math.min(totalAmount, Number(coupon.discountAmount) || 0);
      if (discountAmt > 0) {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(discountAmt * 100),
          currency: 'aud',
          duration: 'once',
          name: coupon.code,
        });
        discounts = [{ coupon: stripeCoupon.id }];
      }
    }
    const isHighValueOrder = totalAmount > 500; // 3D Secure for orders over $500
    const isNewCustomer = customer_email ? !customer_email.includes('@') : false; // Basic check

    // Fraud detection
    const orderData = {
      amount: totalAmount,
      customerEmail: customer_email,
      isNewCustomer,
      items,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    };

    const riskAnalysis = await fraudDetection.validateOrder(orderData);
    
    // Log suspicious activity
    if (riskAnalysis.isSuspicious) {
      fraudDetection.logSuspiciousActivity(orderData, riskAnalysis);
    }

    // Block high-risk orders
    if (fraudDetection.shouldBlockOrder(orderData, riskAnalysis)) {
      return NextResponse.json(
        { error: 'Order blocked due to suspicious activity' },
        { status: 400 }
      );
    }
    
    // Get the actual origin from the request
    const origin = request.headers.get('origin') || request.headers.get('referer') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    
    // Create checkout session with fraud protection
    const session = await stripe.checkout.sessions.create({
      payment_method_types: getConfiguredPaymentMethodTypes(),
      payment_method_options: {
        card: {
          request_three_d_secure: isHighValueOrder ? 'always' : 'automatic',
        },
      },
      line_items,
      mode: 'payment',
      ...(discounts ? { discounts } : {}),
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      customer_email: customer_email,
      phone_number_collection: {
        enabled: isHighValueOrder, // Require phone for high-value orders
      },
      billing_address_collection: isHighValueOrder ? 'required' : 'auto',
      metadata: {
        order_value: totalAmount.toString(),
        requires_extra_verification: isHighValueOrder.toString(),
        customer_type: isNewCustomer ? 'new' : 'returning',
        shipping_cost: Math.round((shippingCost || 0) * 100).toString(),
        shipping_name: shippingName || 'Shipping',
        coupon_code: couponCode || '',
      },
    });

    // Server-side stash so the webhook can create the order even if the
    // customer's browser never makes it back to /order-success.
    if (order && typeof order === 'object') {
      await stashPendingOrder(session.id, order);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
