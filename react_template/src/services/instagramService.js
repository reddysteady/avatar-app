/**
 * Instagram service for handling authentication and API calls
 */
const instagramService = {
  /**
   * Check if the user is authenticated with Instagram
   * @returns {boolean} True if the user is authenticated
   */
  isAuthenticated: () => {
    const tokens = localStorage.getItem('instagramTokens');
    return !!tokens;
  },
  
  /**
   * Get all messages from Instagram with optional filters
   * @param {Object} filters - Optional filters to apply
   * @returns {Promise<Array>} Array of formatted messages
   */
  getAllMessages: async (filters = {}) => {
    try {
      // Get raw messages from Instagram API
      const rawMessages = await instagramService.getMessages();
      
      // Format the messages to match our app's message format
      let formattedMessages = rawMessages.map(msg => ({
        id: msg.id,
        senderName: msg.from.name || 'Instagram User',
        senderPicture: msg.from.profile_picture || '',
        content: msg.message || msg.text || '',
        timestamp: msg.timestamp || new Date().toISOString(),
        platform: 'Instagram',
        status: 'AWAITING_REVIEW',
        isRead: false,
        conversationId: msg.thread_id || msg.conversation_id || msg.id,
        isComment: msg.is_comment || false
      }));
      
      // Apply filters if provided
      if (filters.status && filters.status !== 'all') {
        formattedMessages = formattedMessages.filter(msg => msg.status === filters.status);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        formattedMessages = formattedMessages.filter(msg => 
          msg.content.toLowerCase().includes(searchTerm) || 
          msg.senderName.toLowerCase().includes(searchTerm)
        );
      }
      
      return formattedMessages;
    } catch (error) {
      console.error('Error getting all Instagram messages:', error);
      throw error;
    }
  },
  

  /**
   * Get the Instagram authorization URL
   * @returns {string} The authorization URL
   */
  getAuthUrl: () => {
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store the state in localStorage to verify later
    localStorage.setItem('instagramAuthState', state);
    
    // Construct the Instagram authorization URL using our server proxy
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const redirectUri = `${window.location.origin}/instagram-callback`;
    
    // Our server will handle the redirect to Instagram
    const authUrl = `${apiBaseUrl}/instagram/auth?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    return authUrl;
  },

  /**
   * Handle the Instagram auth code from the callback
   * @param {string} code - The authorization code from Instagram
   * @param {string} state - The state parameter for verification
   * @returns {Promise<object>} The result of the authentication
   */
  handleAuthCode: async (code, state) => {
    // Verify state parameter to prevent CSRF attacks
    const savedState = localStorage.getItem('instagramAuthState');
    if (!savedState || savedState !== state) {
      throw new Error('Invalid state parameter');
    }
    
    // Clear the state from localStorage
    localStorage.removeItem('instagramAuthState');
    
    try {
      // Exchange the code for an access token using our server proxy
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/instagram/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/instagram-callback` }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to exchange code for token');
      }
      
      const data = await response.json();
      
      // Store the tokens in localStorage
      localStorage.setItem('instagramTokens', JSON.stringify({
        accessToken: data.access_token,
        userId: data.user_id,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        timestamp: Date.now(),
      }));
      
      return {
        connected: true,
        platform: 'instagram',
        userId: data.user_id,
      };
    } catch (error) {
      console.error('Error exchanging auth code:', error);
      throw error;
    }
  },

  /**
   * Get the Instagram access token
   * @returns {Promise<string>} The access token
   */
  getAccessToken: async () => {
    const tokensString = localStorage.getItem('instagramTokens');
    if (!tokensString) {
      throw new Error('Not authenticated with Instagram');
    }
    
    const tokens = JSON.parse(tokensString);
    
    // Check if the token is expired (tokens usually expire in 60 days)
    const now = Date.now();
    const tokenAge = now - tokens.timestamp;
    const expiresInMs = tokens.expiresIn * 1000;
    
    if (tokenAge > expiresInMs) {
      // Token expired, we need to refresh it
      // Note: Instagram doesn't provide a refresh token mechanism in the same way as other platforms
      // We would typically require the user to re-authenticate
      localStorage.removeItem('instagramTokens');
      throw new Error('Instagram token expired, please re-authenticate');
    }
    
    return tokens.accessToken;
  },

  /**
   * Get user profile information from Instagram
   * @returns {Promise<object>} The user profile
   */
  getUserProfile: async () => {
    try {
      const accessToken = await instagramService.getAccessToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${apiBaseUrl}/instagram/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch Instagram profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      throw error;
    }
  },

  /**
   * Get the user's Instagram messages
   * @returns {Promise<Array>} Array of messages
   */
  getMessages: async () => {
    try {
      const accessToken = await instagramService.getAccessToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${apiBaseUrl}/instagram/messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch Instagram messages');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram messages:', error);
      throw error;
    }
  },

  /**
   * Send a message using the Instagram API
   * @param {string} recipientId - The Instagram user ID to send the message to
   * @param {string} message - The message to send
   * @returns {Promise<object>} The result of sending the message
   */
  sendMessage: async (recipientId, message) => {
    try {
      const accessToken = await instagramService.getAccessToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${apiBaseUrl}/instagram/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          message,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send Instagram message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending Instagram message:', error);
      throw error;
    }
  },

  /**
   * Disconnect from Instagram
   */
  disconnect: () => {
    localStorage.removeItem('instagramTokens');
  },
  
  /**
   * Send a response to an Instagram message or comment
   * @param {string} messageId - The ID of the message to respond to
   * @param {string} responseText - The text to send
   * @param {boolean} isComment - Whether this is a response to a comment
   * @param {string} conversationId - The conversation/thread ID for direct messages
   * @returns {Promise<object>} Result of the response operation
   */
  sendResponse: async (messageId, responseText, isComment = false, conversationId = null) => {
    try {
      const accessToken = await instagramService.getAccessToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      if (isComment) {
        // Handle comment reply
        const response = await fetch(`${apiBaseUrl}/instagram/comment/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            comment_id: messageId,
            message: responseText,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to reply to Instagram comment');
        }
        
        return await response.json();
      } else {
        // Handle direct message response
        if (!conversationId) {
          throw new Error('Conversation ID is required for direct message responses');
        }
        
        // For direct messages, we need to send to the conversation/thread
        const response = await fetch(`${apiBaseUrl}/instagram/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            thread_id: conversationId,
            message: responseText,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to send Instagram message response');
        }
        
        return await response.json();
      }
    } catch (error) {
      console.error('Error sending Instagram response:', error);
      throw error;
    }
  }
};

export default instagramService;