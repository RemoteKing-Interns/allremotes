"use client";

import React, { useState, useEffect } from 'react';

const OrderVerification = ({ orderData, onVerified, onBlocked }) => {
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    // Send verification email for high-value orders
    if (orderData.amount > 500) {
      sendVerificationEmail();
    }
  }, [orderData]);

  const sendVerificationEmail = async () => {
    try {
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: orderData.customerEmail,
          orderId: orderData.id,
          amount: orderData.amount,
        }),
      });

      if (response.ok) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  };

  const verifyCode = async () => {
    try {
      const response = await fetch('/api/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.verified) {
        setVerificationStatus('verified');
        onVerified(orderData);
      } else {
        setVerificationStatus('failed');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationStatus('failed');
    }
  };

  const verifyPhone = async () => {
    // In production, implement SMS verification
    setPhoneVerified(true);
  };

  const blockOrder = () => {
    setVerificationStatus('blocked');
    onBlocked(orderData);
  };

  const requiresVerification = orderData.amount > 500 || orderData.isHighRisk;

  if (!requiresVerification) {
    return null;
  }

  return (
    <div className="order-verification">
      <h3>🔍 Order Verification Required</h3>
      
      {verificationStatus === 'pending' && (
        <div className="verification-pending">
          <p>
            For your security, we need to verify this order before processing.
          </p>
          
          {emailSent && (
            <div className="email-verification">
              <h4>Email Verification</h4>
              <p>We've sent a verification code to: {orderData.customerEmail}</p>
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="verification-input"
              />
              <button onClick={verifyCode} className="btn btn-primary">
                Verify Code
              </button>
            </div>
          )}

          {orderData.amount > 1000 && (
            <div className="phone-verification">
              <h4>Phone Verification</h4>
              <p>Please verify your phone number for this high-value order.</p>
              <button 
                onClick={verifyPhone} 
                disabled={phoneVerified}
                className={`btn ${phoneVerified ? 'btn-success' : 'btn-primary'}`}
              >
                {phoneVerified ? '✓ Phone Verified' : 'Verify Phone'}
              </button>
            </div>
          )}

          <div className="verification-actions">
            <button onClick={blockOrder} className="btn btn-danger">
              Cancel Order
            </button>
          </div>
        </div>
      )}

      {verificationStatus === 'verified' && (
        <div className="verification-success">
          <p>✅ Order verified successfully!</p>
        </div>
      )}

      {verificationStatus === 'failed' && (
        <div className="verification-failed">
          <p>❌ Verification failed. Please check the code and try again.</p>
        </div>
      )}

      {verificationStatus === 'blocked' && (
        <div className="verification-blocked">
          <p>🚫 Order has been blocked for security reasons.</p>
        </div>
      )}

      <style jsx>{`
        .order-verification {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .verification-pending {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .email-verification,
        .phone-verification {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .verification-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin: 10px 0;
          width: 200px;
        }

        .verification-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .verification-success {
          color: #155724;
          background: #d4edda;
          padding: 10px;
          border-radius: 4px;
        }

        .verification-failed {
          color: #721c24;
          background: #f8d7da;
          padding: 10px;
          border-radius: 4px;
        }

        .verification-blocked {
          color: #721c24;
          background: #f8d7da;
          padding: 10px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default OrderVerification;
