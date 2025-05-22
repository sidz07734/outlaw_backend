// src/server.js
// Load env vars FIRST before anything else
const dotenv = require('dotenv');
dotenv.config();

// Log environment variables at startup (without exposing sensitive data)
console.log('Application starting with configuration:', {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  EMAIL_USER_SET: !!process.env.EMAIL_USER,
  EMAIL_APP_PASSWORD_SET: !!process.env.EMAIL_APP_PASSWORD
});

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/bookings', bookingRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email configuration: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
});