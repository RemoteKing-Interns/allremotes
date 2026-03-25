import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import FraudDetection from '../../../../lib/fraudDetection';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const fraudDetection = new FraudDetection();

export async function POST(request) {
  try {
    const { amount, items, customer_email } = await request.json();

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

    // Order validation and fraud checks
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: isHighValueOrder ? 'always' : 'automatic',
        },
      },
      line_items,
      mode: 'payment',
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
      },
    });

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
