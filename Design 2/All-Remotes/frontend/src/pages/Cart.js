import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center" data-testid="empty-cart">
            <ShoppingBag className="h-24 w-24 mx-auto text-text-secondary mb-6" />
            <h1 className="text-3xl font-black mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Your cart is empty
            </h1>
            <p className="text-text-secondary mb-8">
              Browse our products and add items to your cart.
            </p>
            <Link to="/shop" data-testid="continue-shopping">
              <Button className="bg-red-600 text-white hover:bg-red-700 shadow-md">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="cart-title">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2" data-testid="cart-items">
            {cart.map(item => (
              <div
                key={item.id}
                className="bg-white border border-border rounded-sm p-6 mb-4 flex gap-6"
                data-testid={`cart-item-${item.id}`}
              >
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-sm"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-text-secondary mb-3">{item.brand}</p>
                  <p className="text-primary text-xl font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>
                    ${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => {
                      removeFromCart(item.id);
                      toast.success('Item removed from cart');
                    }}
                    className="text-text-secondary hover:text-primary"
                    data-testid={`remove-item-${item.id}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <div className="flex items-center border border-border rounded-sm">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-background"
                      data-testid={`decrease-qty-${item.id}`}
                    >
                      -
                    </button>
                    <span className="px-4 py-1 border-l border-r border-border" data-testid={`quantity-${item.id}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-background"
                      data-testid={`increase-qty-${item.id}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => {
                clearCart();
                toast.success('Cart cleared');
              }}
              data-testid="clear-cart-button"
            >
              Clear Cart
            </Button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-sm p-6 sticky top-20" data-testid="cart-summary">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium" data-testid="subtotal">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="font-medium">FREE</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-black text-2xl text-primary" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="total">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/checkout" data-testid="checkout-button">
                <Button className="w-full bg-red-600 text-white hover:bg-red-700 h-12 text-base font-bold uppercase tracking-wide mb-3 shadow-md">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link to="/shop" data-testid="continue-shopping-link">
                <Button variant="outline" className="w-full border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
