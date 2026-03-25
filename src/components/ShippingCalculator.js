"use client";

import React, { useState, useEffect } from 'react';

const ShippingCalculator = ({ address, onShippingSelect, selectedShipping }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (address && address.zipCode && address.city) {
      fetchShippingRates();
    }
  }, [address]);

  const fetchShippingRates = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (data.success) {
        setRates(data.rates);
        
        // Auto-select standard shipping if available
        const standardRate = data.rates.find(rate => 
          rate.id.toLowerCase().includes('standard') || rate.price === Math.min(...data.rates.map(r => r.price))
        );
        
        if (standardRate && !selectedShipping) {
          onShippingSelect(standardRate);
        }
      } else {
        setError('Using fallback shipping rates');
        setRates(data.rates);
      }
    } catch (error) {
      console.error('Shipping rates error:', error);
      setError('Failed to load shipping rates');
      
      // Set fallback rates
      setRates([
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: '3-5 business days',
          price: 12.00,
          estimatedDays: '3-5',
          tracking: true,
          icon: '📦',
        },
        {
          id: 'express',
          name: 'Express Shipping',
          description: '1-2 business days',
          price: 18.00,
          estimatedDays: '1-2',
          tracking: true,
          icon: '🚀',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSelect = (rate) => {
    onShippingSelect(rate);
  };

  if (!address || !address.zipCode) {
    return (
      <div className="shipping-calculator">
        <p>Enter your shipping address to see rates</p>
      </div>
    );
  }

  return (
    <div className="shipping-calculator">
      <h3>Shipping Options</h3>
      
      {loading && (
        <div className="loading">
          <span>🚚</span> Calculating shipping rates...
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {!loading && rates.length > 0 && (
        <div className="shipping-rates">
          {rates.map((rate) => (
            <label
              key={rate.id}
              className={`shipping-option ${selectedShipping?.id === rate.id ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="shipping"
                value={rate.id}
                checked={selectedShipping?.id === rate.id}
                onChange={() => handleShippingSelect(rate)}
              />
              
              <div className="shipping-option-content">
                <div className="shipping-option-header">
                  <span className="shipping-icon">{rate.icon}</span>
                  <div className="shipping-info">
                    <span className="shipping-name">{rate.name}</span>
                    <span className="shipping-description">{rate.description}</span>
                  </div>
                  <div className="shipping-price">
                    ${rate.price.toFixed(2)}
                  </div>
                </div>
                
                {rate.tracking && (
                  <div className="tracking-info">
                    📍 Includes tracking
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      <style jsx>{`
        .shipping-calculator {
          margin: 20px 0;
        }

        .shipping-calculator h3 {
          margin-bottom: 15px;
          color: var(--text-dark);
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: var(--gray-dark);
        }

        .error-message {
          background: #fff3cd;
          color: #856404;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .shipping-rates {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .shipping-option {
          display: block;
          padding: 15px;
          border: 2px solid var(--gray-medium);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .shipping-option:hover {
          border-color: var(--primary-teal);
          background-color: var(--gray-light);
        }

        .shipping-option.selected {
          border-color: var(--primary-teal);
          background-color: rgba(46, 107, 111, 0.1);
        }

        .shipping-option input[type="radio"] {
          display: none;
        }

        .shipping-option-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shipping-option-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .shipping-icon {
          font-size: 24px;
          margin-right: 12px;
        }

        .shipping-info {
          flex: 1;
        }

        .shipping-name {
          font-weight: 600;
          color: var(--text-dark);
          display: block;
        }

        .shipping-description {
          font-size: 14px;
          color: var(--gray-dark);
          display: block;
        }

        .shipping-price {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-teal);
        }

        .tracking-info {
          font-size: 12px;
          color: var(--gray-dark);
          margin-left: 36px;
        }

        @media (max-width: 768px) {
          .shipping-option-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .shipping-price {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default ShippingCalculator;
