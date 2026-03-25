"use client";

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
        payment_method_data: {
          billing_details: {
            // You can collect billing details here if needed
          },
        },
      },
      redirect: 'always',
    });

    if (error) {
      setMessage(error.message);
      onError(error);
      setIsProcessing(false);
    }
    // If successful, user will be redirected to Stripe, no need to handle success here
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="form-group">
        <label htmlFor="card-element">Card Details</label>
        <div className="card-element-container">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {message && (
        <div className={`payment-message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isProcessing || !stripe || !elements}
        className="btn btn-primary btn-large"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

const StripePaymentForm = ({ amount, items, customerEmail, onSuccess, onError }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create payment intent when component mounts
  React.useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            items,
            customer_email: customerEmail,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Payment intent creation error:', error);
        onError(error);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, items, customerEmail]);

  if (isLoading) {
    return <div className="loading">Loading payment form...</div>;
  }

  if (!clientSecret) {
    return <div className="error">Failed to load payment form. Please try again.</div>;
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2e6b6f',
      colorBackground: '#ffffff',
      colorText: '#333333',
      colorDanger: '#a0312d',
      fontFamily: 'Nunito, sans-serif',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};

export default StripePaymentForm;
