import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { findOrderBySessionId, createOrderRecord } from '../../../../lib/order-create';
import { readPendingOrder, deletePendingOrder } from '../../../../lib/pending-order-store';

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('Stripe is not configured');
  }
  return new Stripe(stripeSecretKey);
}

export async function POST(request) {
  try {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripe, event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(stripe, session) {
  console.log('Checkout session completed:', session.id);

  try {
    // Idempotency: the client's success page usually creates the order first.
    // If it already exists, there is nothing left to do.
    const existing = await findOrderBySessionId(session.id);
    if (existing) {
      console.log(`[Webhook] Order ${existing.id} already exists for session ${session.id}, skipping`);
      return;
    }

    // Preferred path: the full order payload stashed server-side when the
    // session was created (customer, items, pricing, shipping address).
    const pending = await readPendingOrder(session.id);
    if (pending?.body && Array.isArray(pending.body.items) && pending.body.items.length > 0) {
      const body = {
        ...pending.body,
        payment: {
          ...(pending.body.payment || {}),
          method: 'stripe',
          status: 'succeeded',
          sessionId: session.id,
        },
      };
      const order = await createOrderRecord(body);
      await deletePendingOrder(session.id);
      console.log(`[Webhook] Order ${order.id} created from stashed pending order for session ${session.id}`);
      return;
    }

    // Fallback: reconstruct what we can from Stripe alone. The shipping
    // address the customer typed is not sent to Stripe, so flag the order
    // for manual review before fulfilment.
    console.warn(`[Webhook] No stashed order for session ${session.id}, reconstructing from Stripe`);
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    const shippingName = session.metadata?.shipping_name || 'Shipping';
    const shippingCents = Number(session.metadata?.shipping_cost) || session.total_details?.amount_shipping || 0;
    const items = lineItems.data
      .filter((li) => !(shippingCents > 0 && (li.description || '') === shippingName))
      .map((li) => {
        const unit = (li.price?.unit_amount ?? li.amount_subtotal) / 100;
        return {
          id: '',
          name: li.description || 'Item',
          sku: '',
          category: '',
          quantity: li.quantity || 1,
          unitPrice: unit,
          lineTotal: li.amount_total / 100,
          price: unit,
        };
      });
    const customerEmail = session.customer_email || session.customer_details?.email || null;
    const orderBody = {
      customer: {
        fullName: session.customer_details?.name || customerEmail || 'Customer',
        email: customerEmail,
      },
      items,
      pricing: {
        currency: 'aud',
        subtotal: Math.max(session.amount_total - shippingCents, 0) / 100,
        shipping: shippingCents / 100,
        total: session.amount_total / 100,
      },
      shipping: session.customer_details?.address || {},
      shippingMethod: 'untracked',
      postageService: 'Reconstructed from Stripe',
      couponCode: session.metadata?.coupon_code || null,
      payment: {
        method: 'stripe',
        status: 'succeeded',
        sessionId: session.id,
      },
      status: 'processing',
      needsReview: true,
    };
    const order = await createOrderRecord(orderBody);
    console.log(`[Webhook] Order ${order.id} reconstructed from Stripe for session ${session.id} (needsReview: shipping address missing)`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    // Re-throw so Stripe retries the delivery for transient failures (DB, etc.)
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Additional monitoring for successful payments
  if (paymentIntent.amount > 10000) { // Over $100
    console.log('High-value payment detected:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer: paymentIntent.customer,
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  // Monitor failed payments for potential fraud
  const lastPaymentError = paymentIntent.last_payment_error;
  if (lastPaymentError) {
    console.log('Payment failure reason:', {
      type: lastPaymentError.type,
      code: lastPaymentError.code,
      message: lastPaymentError.message,
    });
  }
}

async function handleDisputeCreated(dispute) {
  console.log('Dispute created:', dispute.id);
  
  // Immediate alert for disputes
  console.warn('⚠️ CHARGEBACK ALERT:', {
    disputeId: dispute.id,
    chargeId: dispute.charge,
    amount: dispute.amount,
    reason: dispute.reason,
    status: dispute.status,
    created: dispute.created,
  });
  
  // TODO: Send notification to admin
  // TODO: Prepare evidence for dispute response
}
