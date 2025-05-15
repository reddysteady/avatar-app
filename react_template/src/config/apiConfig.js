/**
 * API Configuration
 * Contains API keys, endpoints, and configuration for external services
 */

export const API_CONFIG = {
  // Facebook/Instagram Graph API configuration
  FACEBOOK_APP_ID: '123456789012345', // Replace with your actual Facebook App ID
  
  // Backend API endpoint (if applicable)
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.yourdomain.com'
    : 'http://localhost:8000'
};