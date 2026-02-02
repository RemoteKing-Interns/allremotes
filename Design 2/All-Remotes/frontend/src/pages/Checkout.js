import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!email || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        user_email: email,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: getCartTotal()
      };

      const orderResponse = await axios.post(`${API}/orders`, orderData);
      const order = orderResponse.data;

      const checkoutData = {
        order_id: order.id,
        origin_url: window.location.origin
      };

      const sessionResponse = await axios.post(`${API}/checkout/session`, checkoutData);

      if (sessionResponse.data.url) {
        window.location.href = sessionResponse.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout session. Please try again.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="checkout-title">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-border rounded-sm p-6 mb-6" data-testid="customer-details-form">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Customer Details
              </h2>

              <form onSubmit={handleCheckout}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name *</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      data-testid="name-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Email *</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      data-testid="email-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white hover:bg-red-700 h-12 text-base font-bold uppercase tracking-wide shadow-md"
                  data-testid="proceed-to-payment-button"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-secondary">
                  <Lock className="h-4 w-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-sm p-6 sticky top-20" data-testid="order-summary">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm" data-testid={`summary-item-${item.id}`}>
                    <span className="text-text-secondary">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium" data-testid="summary-subtotal">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="font-medium">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-lg">Total (AUD)</span>
                  <span className="font-black text-2xl text-primary" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="summary-total">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
