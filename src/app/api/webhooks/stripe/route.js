import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

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
        await handleCheckoutSessionCompleted(event.data.object);
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

async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);
  
  try {
    // Here you would typically:
    // 1. Create order in database
    // 2. Update inventory
    // 3. Send confirmation email
    // 4. Log for fraud monitoring
    
    const metadata = session.metadata || {};
    const orderData = {
      sessionId: session.id,
      customerEmail: session.customer_email,
      customerPhone: session.customer_details?.phone,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      paymentStatus: session.payment_status,
      metadata: {
        order_value: metadata.order_value,
        requires_extra_verification: metadata.requires_extra_verification,
        customer_type: metadata.customer_type,
        billing_address: session.customer_details?.address,
        shipping_address: session.shipping_details?.address,
      },
      createdAt: new Date(),
    };

    // Log for fraud monitoring
    console.log('Order created:', JSON.stringify(orderData, null, 2));
    
    // TODO: Save to database
    // const db = getDb();
    // await db.collection('orders').insertOne(orderData);
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
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
