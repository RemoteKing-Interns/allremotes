"use client";

import React, { useState } from 'react';

const StripeCheckoutButton = ({ amount, items, customerEmail, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
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

      console.log('Stripe session created:', data);

      // Use direct URL redirect (new recommended approach)
      if (data.url) {
        console.log('Redirecting to Stripe URL:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from Stripe');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      onError(error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="btn btn-primary btn-large"
    >
      {isLoading ? 'Redirecting to Stripe...' : `Pay $${amount.toFixed(2)}`}
    </button>
  );
};

export default StripeCheckoutButton;
