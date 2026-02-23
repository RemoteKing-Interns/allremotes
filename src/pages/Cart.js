import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const Cart = () => {
  const {
    cart,
    hasDiscount,
    discountRate,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartOriginalTotal,
    getCartDiscountTotal,
    getItemPriceBreakdown,
    getItemLineTotal,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const isModalOpen = Boolean(selectedItem);
  const isAnyModalOpen = isModalOpen || showCheckoutModal;

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedItem(null);
        setShowCheckoutModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1>Shopping Cart</h1>
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <Link to="/products/all" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      setShowCheckoutModal(true);
      return;
    }
    navigate('/checkout');
  };

  const originalTotal = getCartOriginalTotal();
  const discountedTotal = getCartTotal();
  const discountTotal = getCartDiscountTotal();

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>
        <div className="cart-content">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-item-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150x150?text=Remote';
                  }}
                />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-category">
                    {item.category === 'car' ? '🚗 Car Remote' : '🚪 Garage Remote'}
                  </p>
                  {(() => {
                    const pricing = getItemPriceBreakdown(item);
                    return (
                      <p className="cart-item-price">
                        {pricing.hasDiscount && (
                          <span className="price-original">AU${pricing.originalPrice.toFixed(2)}</span>
                        )}
                        <span className="price-current">AU${pricing.finalPrice.toFixed(2)}</span>
                      </p>
                    );
                  })()}
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      −
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="btn-view"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                </div>
                {(() => {
                  const pricing = getItemPriceBreakdown(item);
                  const originalLine = pricing.originalPrice * item.quantity;
                  const lineTotal = getItemLineTotal(item);
                  return (
                    <div className="cart-item-total">
                      {pricing.hasDiscount && (
                        <span className="line-total-original">AU${originalLine.toFixed(2)}</span>
                      )}
                      <span>AU${lineTotal.toFixed(2)}</span>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>AU${originalTotal.toFixed(2)}</span>
            </div>
            {hasDiscount && (
              <div className="summary-row discount">
                <span>Member Discount ({Math.round(discountRate * 100)}%)</span>
                <span>-AU${discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>AU${discountedTotal.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} className="btn btn-primary btn-large btn-checkout">
              Proceed to Checkout
            </button>
            <button onClick={clearCart} className="btn btn-outline btn-clear">
              Clear Cart
            </button>
            <Link to="/products/all" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="cart-modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div
            className="cart-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Product details"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cart-modal-close"
              onClick={() => setSelectedItem(null)}
              aria-label="Close"
            >
              x
            </button>
            <div className="cart-modal-body">
              <img
                src={selectedItem?.image}
                alt={selectedItem?.name || 'Product'}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300?text=Remote';
                }}
              />
              <div className="cart-modal-info">
                <p className="cart-modal-brand">{selectedItem?.brand || 'Remote Pro'}</p>
                <h3>{selectedItem?.name}</h3>
                {selectedItem?.description && (
                  <p className="cart-modal-description">{selectedItem.description}</p>
                )}
                <div className="cart-modal-meta">
                  <div>
                    <span>Category</span>
                    <strong>{selectedItem?.category === 'car' ? 'Car Remote' : 'Garage Remote'}</strong>
                  </div>
                  <div>
                    <span>Condition</span>
                    <strong>{selectedItem?.condition || 'Brand New'}</strong>
                  </div>
                </div>
                <div className="cart-modal-pricing">
                  <div>
                    <span>Price</span>
                    {(() => {
                      const pricing = getItemPriceBreakdown(selectedItem || {});
                      return pricing.hasDiscount ? (
                        <div className="modal-price-stack">
                          <span className="modal-price-original">AU${pricing.originalPrice.toFixed(2)}</span>
                          <strong className="modal-price-discounted">AU${pricing.finalPrice.toFixed(2)}</strong>
                        </div>
                      ) : (
                        <strong>AU${pricing.finalPrice.toFixed(2)}</strong>
                      );
                    })()}
                  </div>
                  <div>
                    <span>Quantity</span>
                    <strong>{selectedItem?.quantity}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    {(() => {
                      const lineTotal = getItemLineTotal(selectedItem || {});
                      const pricing = getItemPriceBreakdown(selectedItem || {});
                      const originalLine = pricing.originalPrice * (selectedItem?.quantity || 1);
                      return pricing.hasDiscount ? (
                        <div className="modal-price-stack">
                          <span className="modal-price-original">AU${originalLine.toFixed(2)}</span>
                          <strong className="modal-price-discounted">AU${lineTotal.toFixed(2)}</strong>
                        </div>
                      ) : (
                        <strong>AU${lineTotal.toFixed(2)}</strong>
                      );
                    })()}
                  </div>
                </div>
                <div className="cart-modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setSelectedItem(null)}
                  >
                    Continue Shopping
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCheckout}
                  >
                    Go to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCheckoutModal && (
        <div className="cart-modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
          <div
            className="cart-modal checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Checkout options"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cart-modal-close"
              onClick={() => setShowCheckoutModal(false)}
              aria-label="Close"
            >
              x
            </button>
            <div className="checkout-modal-body">
              <h3>Continue to Checkout</h3>
              <p>Select how you want to checkout.</p>
              <div className="checkout-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    navigate('/login');
                  }}
                >
                  Login & Checkout
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    navigate('/checkout?guest=1');
                  }}
                >
                  Guest Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
