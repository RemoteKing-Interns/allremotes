import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { CheckCircle, Loader2, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('checking');
  const [transaction, setTransaction] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const { clearCart } = useCart();

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    }
  }, [sessionId]);

  const sendConfirmationEmail = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/send-confirmation`);
      setEmailSent(true);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Non-blocking - don't fail the success page
    }
  };

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);
      const data = response.data;

      setTransaction(data);

      if (data.payment_status === 'paid') {
        setStatus('success');
        clearCart();
        // Send confirmation emails
        if (data.order_id) {
          sendConfirmationEmail(data.order_id);
        }
        return;
      } else if (data.status === 'expired') {
        setStatus('expired');
        return;
      }

      setAttempts(attempts + 1);
      setTimeout(() => pollPaymentStatus(), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center" data-testid="checkout-success-page">
          {status === 'checking' && (
            <div data-testid="status-checking">
              <Loader2 className="h-24 w-24 mx-auto text-primary animate-spin mb-6" />
              <h1 className="text-3xl font-black mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Processing Your Payment
              </h1>
              <p className="text-text-secondary">
                Please wait while we confirm your payment...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div data-testid="status-success">
              <CheckCircle className="h-24 w-24 mx-auto text-status-success mb-6" />
              <h1 className="text-3xl font-black mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Payment Successful!
              </h1>
              <p className="text-text-secondary mb-4">
                Thank you for your order.
              </p>
              
              {/* Email confirmation notice */}
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-8">
                <Mail className="h-4 w-4" />
                <span>{emailSent ? 'Confirmation email sent!' : 'Sending confirmation email...'}</span>
              </div>
              
              {transaction && (
                <div className="bg-white border border-border rounded-sm p-6 mb-8 text-left">
                  <h3 className="font-bold mb-3">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Order ID:</span>
                      <span className="font-medium">{transaction.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Amount:</span>
                      <span className="font-medium">${transaction.amount.toFixed(2)} {transaction.currency.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Status:</span>
                      <span className="font-medium text-status-success">Paid</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <Link to="/dashboard" data-testid="view-orders-button">
                  <Button className="bg-primary text-white hover:bg-primary/90">
                    View My Orders
                  </Button>
                </Link>
                <Link to="/shop" data-testid="continue-shopping-button">
                  <Button variant="outline">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div data-testid="status-expired">
              <h1 className="text-3xl font-black mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Payment Session Expired
              </h1>
              <p className="text-text-secondary mb-8">
                Your payment session has expired. Please try again.
              </p>
              <Link to="/checkout" data-testid="try-again-button">
                <Button>Try Again</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div data-testid="status-error">
              <h1 className="text-3xl font-black mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Error Checking Payment
              </h1>
              <p className="text-text-secondary mb-8">
                There was an error checking your payment status. Please contact support.
              </p>
              <Link to="/dashboard" data-testid="contact-support-button">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          )}

          {status === 'timeout' && (
            <div data-testid="status-timeout">
              <h1 className="text-3xl font-black mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Payment Check Timeout
              </h1>
              <p className="text-text-secondary mb-8">
                We couldn't confirm your payment. Please check your email for confirmation or contact support.
              </p>
              <Link to="/dashboard" data-testid="dashboard-button">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
