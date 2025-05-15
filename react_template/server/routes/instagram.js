// server/routes/instagram.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { 
  FACEBOOK_APP_ID, 
  FACEBOOK_APP_SECRET, 
  INSTAGRAM_API_BASE_URL, 
  FACEBOOK_GRAPH_API_BASE_URL,
  OAUTH_REDIRECT_URI
} = require('../config');

/**
 * Generate Instagram authorization URL
 * GET /api/instagram/auth
 */
router.get('/auth', (req, res) => {
  try {
    const { redirect_uri, state } = req.query;
    
    // Validate request
    if (!redirect_uri) {
      return res.status(400).json({ error: 'Missing redirect_uri parameter' });
    }
    
    // Construct Instagram OAuth URL
    const scopes = [
      'instagram_basic', 
      'instagram_content_publish', 
      'instagram_manage_comments', 
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata'
    ].join(',');
    
    const authUrl = `${FACEBOOK_GRAPH_API_BASE_URL}/v18.0/oauth/authorize?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state || ''}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Instagram auth error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * Exchange authorization code for access token
 * POST /api/instagram/token
 */
router.post('/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/v18.0/oauth/access_token`, {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: redirect_uri || OAUTH_REDIRECT_URI,
        code
      }
    });
    
    // Get long-lived token
    const shortLivedToken = tokenResponse.data.access_token;
    const longLivedTokenResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/v18.0/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });
    
    // Get user info
    const userResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/me`, {
      params: {
        fields: 'id,name,accounts{instagram_business_account{id,name,username,profile_picture_url}}',
        access_token: longLivedTokenResponse.data.access_token
      }
    });
    
    let userId = userResponse.data.id;
    let instagramId = null;
    
    // Extract Instagram business account ID if available
    if (userResponse.data.accounts && 
        userResponse.data.accounts.data && 
        userResponse.data.accounts.data.length > 0 && 
        userResponse.data.accounts.data[0].instagram_business_account) {
      instagramId = userResponse.data.accounts.data[0].instagram_business_account.id;
    }
    
    res.json({
      access_token: longLivedTokenResponse.data.access_token,
      token_type: 'bearer',
      expires_in: longLivedTokenResponse.data.expires_in || 5184000, // 60 days default
      user_id: userId,
      instagram_id: instagramId
    });
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to exchange code for token',
      details: error.response?.data || error.message
    });
  }
});

/**
 * Get Instagram user profile
 * GET /api/instagram/profile
 */
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Get user info
    const userResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/me`, {
      params: {
        fields: 'id,name,accounts{instagram_business_account{id,name,username,profile_picture_url,media_count,followers_count,follows_count}}',
        access_token: accessToken
      }
    });
    
    // Format response
    let instagramProfile = null;
    if (userResponse.data.accounts && 
        userResponse.data.accounts.data && 
        userResponse.data.accounts.data.length > 0 && 
        userResponse.data.accounts.data[0].instagram_business_account) {
      instagramProfile = userResponse.data.accounts.data[0].instagram_business_account;
    }
    
    res.json({
      facebook_id: userResponse.data.id,
      name: userResponse.data.name,
      instagram_profile: instagramProfile
    });
  } catch (error) {
    console.error('Profile fetch error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Instagram profile' });
  }
});

/**
 * Get Instagram messages (conversations)
 * GET /api/instagram/messages
 */
router.get('/messages', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Get pages first
    const pagesResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/me/accounts`, {
      params: { access_token: accessToken }
    });
    
    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return res.status(404).json({ error: 'No Facebook pages found' });
    }
    
    // Get the first page's conversations
    const pageId = pagesResponse.data.data[0].id;
    const pageAccessToken = pagesResponse.data.data[0].access_token;
    
    const conversationsResponse = await axios.get(
      `${FACEBOOK_GRAPH_API_BASE_URL}/${pageId}/conversations`, 
      {
        params: {
          fields: 'participants,messages{message,from,to,created_time}',
          access_token: pageAccessToken
        }
      }
    );
    
    // Format the conversations into a simpler structure
    const formattedConversations = conversationsResponse.data.data.map(conversation => {
      return {
        id: conversation.id,
        participants: conversation.participants.data,
        messages: conversation.messages ? conversation.messages.data.map(msg => ({
          id: msg.id,
          message: msg.message,
          from: msg.from,
          to: msg.to,
          created_time: msg.created_time
        })) : [],
      };
    });
    
    res.json(formattedConversations);
  } catch (error) {
    console.error('Messages fetch error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Instagram messages',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * Send Instagram message
 * POST /api/instagram/message
 */
router.post('/message', async (req, res) => {
  try {
    const { recipient_id, message } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!recipient_id || !message) {
      return res.status(400).json({ error: 'Missing recipient_id or message' });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Get pages first to get page access token
    const pagesResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/me/accounts`, {
      params: { access_token: accessToken }
    });
    
    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return res.status(404).json({ error: 'No Facebook pages found' });
    }
    
    // Use the first page's access token
    const pageId = pagesResponse.data.data[0].id;
    const pageAccessToken = pagesResponse.data.data[0].access_token;
    
    // Send the message using the Page messaging API
    const sendResponse = await axios.post(
      `${FACEBOOK_GRAPH_API_BASE_URL}/${pageId}/messages`,
      {
        recipient: { id: recipient_id },
        message: { text: message }
      },
      {
        params: { access_token: pageAccessToken }
      }
    );
    
    res.json({
      success: true,
      message_id: sendResponse.data.message_id
    });
  } catch (error) {
    console.error('Message send error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.response?.data || error.message
    });
  }
});

/**
 * Reply to an Instagram comment
 * POST /api/instagram/comment/reply
 */
router.post('/comment/reply', async (req, res) => {
  try {
    const { comment_id, message } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!comment_id || !message) {
      return res.status(400).json({ error: 'Missing comment_id or message' });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Get pages first to get page access token
    const pagesResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/me/accounts`, {
      params: { access_token: accessToken }
    });
    
    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return res.status(404).json({ error: 'No Facebook pages found' });
    }
    
    // Use the first page's access token
    const pageAccessToken = pagesResponse.data.data[0].access_token;
    
    // Reply to the comment using the Page API
    const replyResponse = await axios.post(
      `${FACEBOOK_GRAPH_API_BASE_URL}/${comment_id}/replies`,
      { message },
      {
        params: { access_token: pageAccessToken }
      }
    );
    
    res.json({
      success: true,
      comment_id: replyResponse.data.id
    });
  } catch (error) {
    console.error('Comment reply error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to reply to comment',
      details: error.response?.data || error.message
    });
  }
});

/**
 * Send Instagram message with thread_id
 * This is an alternative to the /message endpoint for continuing conversations
 */
router.post('/message/thread', async (req, res) => {
  try {
    const { thread_id, message } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!thread_id || !message) {
      return res.status(400).json({ error: 'Missing thread_id or message' });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Get pages first to get page access token
    const pagesResponse = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/me/accounts`, {
      params: { access_token: accessToken }
    });
    
    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return res.status(404).json({ error: 'No Facebook pages found' });
    }
    
    // Use the first page's access token
    const pageId = pagesResponse.data.data[0].id;
    const pageAccessToken = pagesResponse.data.data[0].access_token;
    
    // Send the message to the existing thread
    const sendResponse = await axios.post(
      `${FACEBOOK_GRAPH_API_BASE_URL}/${thread_id}/messages`,
      { message: { text: message } },
      {
        params: { access_token: pageAccessToken }
      }
    );
    
    res.json({
      success: true,
      message_id: sendResponse.data.message_id
    });
  } catch (error) {
    console.error('Thread message error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to send message to thread',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;