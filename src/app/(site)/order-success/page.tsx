"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const OrderSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentIntentId = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

    if (sessionId) {
      // This is a successful Stripe Checkout session
      setOrderDetails({
        paymentMethod: 'stripe',
        sessionId,
        status: 'succeeded'
      });
    } else if (paymentIntentId && paymentIntentClientSecret) {
      // This is a successful Stripe payment redirect
      setOrderDetails({
        paymentMethod: 'stripe',
        paymentIntentId,
        status: 'succeeded'
      });
    } else {
      // This might be a COD order or other payment method
      setOrderDetails({
        paymentMethod: 'other',
        status: 'pending'
      });
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="container">
          <div className="loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <div className="container">
        <div className="order-success">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for your purchase!</p>
          <p>Your order has been confirmed and will be processed soon.</p>
          
          {orderDetails?.sessionId && (
            <p style={{ marginTop: 10, opacity: 0.9 }}>
              Session ID: <strong>{orderDetails.sessionId}</strong>
            </p>
          )}
          
          {orderDetails?.paymentIntentId && (
            <p style={{ marginTop: 10, opacity: 0.9 }}>
              Payment ID: <strong>{orderDetails.paymentIntentId}</strong>
            </p>
          )}
          
          <div style={{ marginTop: 30, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={() => router.push("/")}
              className="btn btn-primary"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => router.push("/account")}
              className="btn btn-secondary"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
