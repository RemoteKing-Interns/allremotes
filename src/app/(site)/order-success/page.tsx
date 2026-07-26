"use client";

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const OrderSuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const confirmedRef = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentIntentId = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const orderId = searchParams.get('order_id');

    const finalize = async () => {
      if (orderId && sessionId && !confirmedRef.current) {
        confirmedRef.current = true;
        // Existing order (payment link) — mark as paid
        try {
          await fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              status: 'processing',
              payment: {
                method: 'stripe',
                status: 'succeeded',
                sessionId,
              },
            }),
          });
          setOrderDetails({ paymentMethod: 'stripe', sessionId, status: 'succeeded', orderId });
        } catch (err) {
          console.error('Failed to confirm order payment:', err);
          setOrderDetails({ paymentMethod: 'stripe', sessionId, status: 'succeeded' });
        }
      } else if (sessionId && !confirmedRef.current) {
        confirmedRef.current = true;
        // Checkout flow: create order from sessionStorage after successful payment
        try {
          const raw = typeof window !== 'undefined' ? sessionStorage.getItem(`pendingOrder_${sessionId}`) : null;
          if (!raw) {
            setOrderDetails({ paymentMethod: 'stripe', sessionId, status: 'succeeded' });
          } else {
            const pending = JSON.parse(raw);
            pending.payment = pending.payment || {};
            pending.payment.sessionId = sessionId;
            const resp = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pending),
            });
            const data = await resp.json().catch(() => null);
            if (!resp.ok) {
              throw new Error(data?.error || 'Failed to create order');
            }
            sessionStorage.removeItem(`pendingOrder_${sessionId}`);
            setOrderDetails({ paymentMethod: 'stripe', sessionId, status: 'succeeded', orderId: data?.id });
          }
        } catch (err) {
          console.error('Order creation error:', err);
          setOrderDetails({ paymentMethod: 'stripe', sessionId, status: 'succeeded' });
        }
      } else if (paymentIntentId && paymentIntentClientSecret) {
        setOrderDetails({ paymentMethod: 'stripe', paymentIntentId, status: 'succeeded' });
      } else {
        setOrderDetails({ paymentMethod: 'other', status: 'pending' });
      }
      setLoading(false);
    };

    finalize();
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

const OrderSuccess = () => {
  return (
    <Suspense fallback={<div className="order-success-page"><div className="container"><div className="loading">Loading...</div></div></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
};

export default OrderSuccess;
