import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import CategoryPage from './pages/CategoryPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products/:category" element={<ProductList />} />
                <Route path="/products/all" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/garage-gate" element={<CategoryPage />} />
                <Route path="/garage-gate/*" element={<CategoryPage />} />
                <Route path="/automotive" element={<CategoryPage />} />
                <Route path="/automotive/*" element={<CategoryPage />} />
                <Route path="/for-the-home" element={<CategoryPage />} />
                <Route path="/for-the-home/*" element={<CategoryPage />} />
                <Route path="/locksmithing" element={<CategoryPage />} />
                <Route path="/locksmithing/*" element={<CategoryPage />} />
                <Route path="/shop-by-brand" element={<CategoryPage />} />
                <Route path="/shop-by-brand/*" element={<CategoryPage />} />
                <Route path="/support" element={<CategoryPage />} />
                <Route path="/support/*" element={<CategoryPage />} />
                <Route path="/contact" element={<CategoryPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={<Account />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
