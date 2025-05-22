// src/controllers/googleAuthController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Create Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token (same as in authController)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '30d'
  });
};

// Handle Google OAuth callback with token verification
exports.googleCallback = async (req, res) => {
  try {
    // Get token from request
    const { token } = req.body;
    
    // If no token provided, try the legacy approach
    if (!token) {
      return handleLegacyGoogleAuth(req, res);
    }
    
    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    // Get user info from the token
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    
    console.log('Google auth payload:', { googleId, email, name });
    
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    
    // If not, check if user exists with this email
    if (!user && email) {
      user = await User.findOne({ email });
      
      // If user exists with email but no Google ID, update Google ID
      if (user) {
        user.googleId = googleId;
        await user.save();
      }
    }
    
    // If still no user, create one
    if (!user) {
      // Create random password for the user
      const password = Math.random().toString(36).slice(-8);
      
      user = await User.create({
        name,
        email,
        password,
        googleId
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed. Please try again.'
    });
  }
};

// Legacy method for handling direct data without token verification
const handleLegacyGoogleAuth = async (req, res) => {
  try {
    const { googleId, email, name } = req.body;
    
    // Log the received data for debugging
    console.log("Received Google auth data:", { googleId, email, name });
    
    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required Google authentication data'
      });
    }
    
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    
    // If not, check if user exists with this email
    if (!user && email) {
      user = await User.findOne({ email });
      
      // If user exists with email but no Google ID, update Google ID
      if (user) {
        user.googleId = googleId;
        await user.save();
      }
    }
    
    // If still no user, create one
    if (!user) {
      // Create random password for the user
      const password = Math.random().toString(36).slice(-8);
      
      user = await User.create({
        name,
        email,
        password,
        googleId
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error("Legacy Google auth error:", error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};