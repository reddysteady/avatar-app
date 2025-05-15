/**
 * Instagram API Configuration
 * Contains settings for Instagram Graph API integration
 */
export const INSTAGRAM_CONFIG = {
  // App credentials - these should be provided via environment variables
  appId: import.meta.env.VITE_FACEBOOK_APP_ID,
  
  // API settings
  apiVersion: 'v19.0',
  
  // Authorization settings
  redirectUri: 'https://avatar-app-5b819d-ekz8f-ad0ffb.mgx.dev/auth/instagram/callback',
  
  // Required permissions (scopes)
  scopes: [
    'instagram_basic',
    'instagram_manage_comments',
    'instagram_manage_messages',
    'pages_read_engagement',
    'pages_manage_metadata'
  ],
  
  // API endpoints - using our secure server proxy
  endpoints: {
    // Server base URL - adjust as needed based on your deployment setup
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    
    // Instagram API endpoints
    exchangeToken: '/instagram/exchange-token',
    userInfo: '/instagram/user-info',
    conversations: '/instagram/conversations',
    messages: '/instagram/messages',
    sendMessage: '/instagram/send-message'
  }
};

/**
 * Default message templates for avatar responses
 */
export const MESSAGE_TEMPLATES = {
  greeting: "Hi there! Thanks for reaching out. I'm the AI assistant for {{businessName}}. How can I help you today?",
  outOfHours: "Thanks for your message! Our business hours are {{businessHours}}. We'll get back to you as soon as we're open.",
  followUp: "Just checking in on our previous conversation. Is there anything else I can help you with?",
};