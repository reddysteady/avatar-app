// server/config.js
require('dotenv').config();

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  
  // Instagram/Facebook API configuration
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  
  // Instagram API endpoints
  INSTAGRAM_API_BASE_URL: 'https://graph.instagram.com',
  FACEBOOK_GRAPH_API_BASE_URL: 'https://graph.facebook.com',
  
  // OAuth configuration
  OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI || 'http://localhost:5173/instagram-callback',
  
  // Security
  SESSION_SECRET: process.env.SESSION_SECRET || 'instagram-avatar-app-secret',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development'
};