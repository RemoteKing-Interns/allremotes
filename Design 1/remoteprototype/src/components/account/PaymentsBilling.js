import React, { useState } from 'react';
import './AccountSection.css';

const PaymentsBilling = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: 2,
      type: 'card',
      last4: '8888',
      brand: 'Mastercard',
      expiry: '06/26',
      isDefault: false
    }
  ]);

  const [billingAddresses, setBillingAddresses] = useState([
    {
      id: 1,
      name: 'Home Address',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      isDefault: true
    }
  ]);

  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const handleAddCard = (e) => {
    e.preventDefault();
    // Add card logic
    alert('Card added successfully');
    setShowAddCard(false);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    // Add address logic
    alert('Address added successfully');
    setShowAddAddress(false);
  };

  return (
    <div className="account-section">
      <h2>Payments & Billing</h2>
      
      <div className="section-content">
        <div className="payment-methods-section">
          <div className="section-header">
            <h3>Saved Payment Methods</h3>
            <button 
              className="btn btn-gradient btn-small"
              onClick={() => setShowAddCard(!showAddCard)}
            >
              {showAddCard ? 'Cancel' : '+ Add Card'}
            </button>
          </div>

          {showAddCard && (
            <form onSubmit={handleAddCard} className="account-form">
              <div className="form-group">
                <label>Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="text" placeholder="MM/YY" required />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="text" placeholder="123" required />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary">Add Card</button>
            </form>
          )}

          <div className="payment-methods-list">
            {paymentMethods.map(method => (
              <div key={method.id} className="payment-method-card">
                <div className="method-info">
                  <div className="method-icon">{method.brand === 'Visa' ? '💳' : '💳'}</div>
                  <div>
                    <p className="method-brand">{method.brand} •••• {method.last4}</p>
                    <p className="method-expiry">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="method-actions">
                  {method.isDefault && <span className="default-badge">Default</span>}
                  <button className="btn btn-outline btn-small">Edit</button>
                  <button className="btn btn-outline-red btn-small">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="billing-addresses-section">
          <div className="section-header">
            <h3>Billing Addresses</h3>
            <button 
              className="btn btn-gradient btn-small"
              onClick={() => setShowAddAddress(!showAddAddress)}
            >
              {showAddAddress ? 'Cancel' : '+ Add Address'}
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="account-form">
              <div className="form-group">
                <label>Address Label</label>
                <input type="text" placeholder="Home, Work, etc." required />
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input type="text" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input type="text" required />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary">Add Address</button>
            </form>
          )}

          <div className="addresses-list">
            {billingAddresses.map(address => (
              <div key={address.id} className="address-card">
                <div>
                  <h4>{address.name}</h4>
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} {address.zip}</p>
                  <p>{address.country}</p>
                </div>
                <div className="address-actions">
                  {address.isDefault && <span className="default-badge">Default</span>}
                  <button className="btn btn-outline btn-small">Edit</button>
                  <button className="btn btn-outline-red btn-small">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="transaction-history">
          <h3>Transaction History</h3>
          <div className="transactions-list">
            <div className="transaction-item">
              <div>
                <p className="transaction-description">Order ORD-001</p>
                <p className="transaction-date">Jan 25, 2026</p>
              </div>
              <div className="transaction-amount">-$64.98</div>
            </div>
            <div className="transaction-item">
              <div>
                <p className="transaction-description">Order ORD-002</p>
                <p className="transaction-date">Jan 20, 2026</p>
              </div>
              <div className="transaction-amount">-$49.99</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsBilling;
