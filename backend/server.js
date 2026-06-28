const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const settingsRoutes = require('./routes/settings.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// Simple Rate Limiting Simulation Middleware (Optional/Security requirement)
let requestCounts = {};
app.use((req, res, next) => {
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  
  if (!requestCounts[ip]) {
    requestCounts[ip] = [];
  }
  
  // Clean old requests (older than 1 minute)
  requestCounts[ip] = requestCounts[ip].filter(t => now - t < 60000);
  
  if (requestCounts[ip].length >= 100) { // 100 requests per minute limit
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }
  
  requestCounts[ip].push(now);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Express Error Handler:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error.",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Root check endpoint
app.get('/', (req, res) => {
  res.json({ message: "Gift & Stationery Shop API is online." });
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
