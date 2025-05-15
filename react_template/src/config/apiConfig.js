/**
 * API Configuration
 * Contains API keys, endpoints, and configuration for external services
 */

export const API_CONFIG = {
  // Facebook/Instagram Graph API configuration
  FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID || '123456789012345',
  
  // Backend API endpoint (if applicable)
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.MODE === 'production' 
      ? 'https://api.yourdomain.com'
      : 'http://localhost:5000')
};