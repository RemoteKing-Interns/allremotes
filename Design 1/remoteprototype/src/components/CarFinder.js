import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import './CarFinder.css';

const CarFinder = () => {
  const { getProducts } = useStore();
  const products = getProducts() || [];
  const [activeTab, setActiveTab] = useState('rego');
  const [regoData, setRegoData] = useState({
    rego: '',
    state: ''
  });
  const [manualData, setManualData] = useState({
    brand: '',
    model: '',
    year: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const states = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

  const carBrands = [
    'Toyota', 'Holden', 'Ford', 'Mazda', 'Mitsubishi', 'Nissan', 'Hyundai', 
    'Subaru', 'Honda', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus',
    'Kia', 'Jeep', 'Land Rover', 'Porsche', 'Jaguar', 'Volvo', 'Other'
  ];

  const handleRegoSearch = (e) => {
    e.preventDefault();
    // Simulate finding car details from rego
    // In real app, this would be an API call
    const mockCarDetails = {
      brand: 'Toyota',
      model: 'Camry',
      year: '2020'
    };
    
    // Filter products for car category
    const carProducts = products.filter(p => p.category === 'car');
    setSearchResults(carProducts);
    setHasSearched(true);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualData.brand) {
      alert('Please enter at least the car brand');
      return;
    }

    // Filter products based on brand (in real app, this would match actual product data)
    const carProducts = products.filter(p => {
      if (p.category !== 'car') return false;
      // Match by brand in product name or description
      const brandLower = manualData.brand.toLowerCase();
      return p.name.toLowerCase().includes(brandLower) || 
             p.description.toLowerCase().includes(brandLower) ||
             (p.brand && p.brand.toLowerCase().includes(brandLower));
    });

    setSearchResults(carProducts);
    setHasSearched(true);
  };

  const handleClear = () => {
    setRegoData({ rego: '', state: '' });
    setManualData({ brand: '', model: '', year: '' });
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="car-finder-section">
      <div className="container">
        <div className="car-finder-box">
          <h2>Find Your Car Remote</h2>
          <p className="finder-subtitle">Enter your vehicle details to find compatible remotes</p>

          <div className="finder-tabs">
            <button
              className={`finder-tab ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('manual');
                handleClear();
              }}
            >
              Manual Entry
            </button>
            <button
              className={`finder-tab ${activeTab === 'rego' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('rego');
                handleClear();
              }}
            >
              By Registration
            </button>
          </div>

          <div className="finder-content">
            {activeTab === 'rego' ? (
              <form onSubmit={handleRegoSearch} className="finder-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rego">Registration Number</label>
                    <input
                      type="text"
                      id="rego"
                      value={regoData.rego}
                      onChange={(e) => setRegoData({...regoData, rego: e.target.value.toUpperCase()})}
                      placeholder="ABC123"
                      required
                      maxLength={10}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <select
                      id="state"
                      value={regoData.state}
                      onChange={(e) => setRegoData({...regoData, state: e.target.value})}
                      required
                    >
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-finder">
                    Find Remote
                  </button>
                  {hasSearched && (
                    <button type="button" onClick={handleClear} className="btn btn-outline">
                      Clear
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleManualSearch} className="finder-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="brand">Car Brand / Make *</label>
                    <select
                      id="brand"
                      value={manualData.brand}
                      onChange={(e) => setManualData({...manualData, brand: e.target.value})}
                      required
                    >
                      <option value="">Select Brand</option>
                      {carBrands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <input
                      type="text"
                      id="model"
                      value={manualData.model}
                      onChange={(e) => setManualData({...manualData, model: e.target.value})}
                      placeholder="e.g., Camry"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="year">Year</label>
                    <input
                      type="text"
                      id="year"
                      value={manualData.year}
                      onChange={(e) => setManualData({...manualData, year: e.target.value})}
                      placeholder="e.g., 2020"
                      maxLength="4"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-finder">
                    Find Remote
                  </button>
                  {hasSearched && (
                    <button type="button" onClick={handleClear} className="btn btn-outline">
                      Clear
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {hasSearched && (
            <div className="finder-results">
              <h3>
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} Compatible Remote${searchResults.length !== 1 ? 's' : ''}`
                  : 'No Compatible Remotes Found'
                }
              </h3>
              {searchResults.length > 0 ? (
                <div className="results-grid">
                  {searchResults.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>We couldn't find any remotes matching your vehicle details.</p>
                  <p>Please try different search criteria or <Link to="/products/car">browse all car remotes</Link>.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarFinder;
