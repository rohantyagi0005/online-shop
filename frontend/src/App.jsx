import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/AdminDashboard';
import AdminInventory from './pages/AdminInventory';
import AdminSettings from './pages/AdminSettings';
import AdminOrders from './pages/AdminOrders';

function App() {
  const [cart, setCart] = useState([]);

  // Load cart from local storage on startup
  useEffect(() => {
    const savedCart = localStorage.getItem('gift_shop_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Save cart to local storage whenever it changes
  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('gift_shop_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (product, quantity) => {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    const newCart = [...cart];
    
    if (existingIndex > -1) {
      // Calculate final target quantity and cap it to available stock
      const newQty = newCart[existingIndex].quantity + quantity;
      newCart[existingIndex].quantity = Math.min(newQty, product.stock_quantity);
    } else {
      newCart.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        discount_price: product.discount_price,
        stock_quantity: product.stock_quantity,
        quantity: Math.min(quantity, product.stock_quantity),
        images: product.images
      });
    }
    
    saveCart(newCart);
  };

  const handleUpdateCartQty = (id, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    const newCart = cart.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.min(quantity, item.stock_quantity) };
      }
      return item;
    });
    saveCart(newCart);
  };

  const handleRemoveFromCart = (id) => {
    const newCart = cart.filter(item => item.id !== id);
    saveCart(newCart);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Layout cartCount={cartCount}>
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail onAddToCart={handleAddToCart} />} />
              <Route path="/cart" element={
                <Cart 
                  cart={cart} 
                  onUpdateCartQty={handleUpdateCartQty} 
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart} 
                />
              } />
              
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout cart={cart} onClearCart={handleClearCart} />
                </ProtectedRoute>
              } />
              
              <Route path="/order-confirmation" element={
                <ProtectedRoute>
                  <OrderConfirmation />
                </ProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin Routes (Guarded by Role) */}
              <Route path="/admin" element={
                <ProtectedRoute roleRequired="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/inventory" element={
                <ProtectedRoute roleRequired="admin">
                  <AdminInventory />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/settings" element={
                <ProtectedRoute roleRequired="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/orders" element={
                <ProtectedRoute roleRequired="admin">
                  <AdminOrders />
                </ProtectedRoute>
              } />

              {/* Redirect any unhandled paths to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
