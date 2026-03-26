import { NextResponse } from 'next/server';
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
    const { amount, items, customer_email } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'aud',
      metadata: {
        items: JSON.stringify(items),
        customer_email: customer_email || ''
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
