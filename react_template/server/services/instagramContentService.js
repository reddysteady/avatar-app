// server/services/instagramContentService.js
const axios = require('axios');

/**
 * Instagram content service for fetching posts, comments and other content
 */
const instagramContentService = {
  /**
   * Extract Instagram post ID from URL
   * @param {string} url - Instagram post URL
   * @returns {string|null} - Extracted post ID or null
   */
  extractPostId: function(url) {
    if (!url) return null;
    
    // Check if it's already just an ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    
    // Try to extract from URL
    const regexPatterns = [
      // instagram.com/p/ID/
      /instagram\.com\/p\/([a-zA-Z0-9_-]+)\/?/,
      // instagram.com/reel/ID/
      /instagram\.com\/reel\/([a-zA-Z0-9_-]+)\/?/,
      // instagram.com/tv/ID/
      /instagram\.com\/tv\/([a-zA-Z0-9_-]+)\/?/
    ];
    
    for (const regex of regexPatterns) {
      const match = url.match(regex);
      if (match) return match[1];
    }
    
    return null;
  },
  
  /**
   * Extract Instagram username from URL
   * @param {string} url - Instagram account URL
   * @returns {string|null} - Extracted username or null
   */
  extractUsername: function(url) {
    if (!url) return null;
    
    // If it's already just a username (no @ symbol)
    if (/^[a-zA-Z0-9._]+$/.test(url)) {
      return url;
    }
    
    // If it starts with @, remove it
    if (url.startsWith('@')) {
      return url.substring(1);
    }
    
    // Try to extract from URL
    const regex = /instagram\.com\/([a-zA-Z0-9._]+)\/?$/;
    const match = url.match(regex);
    
    if (match) return match[1];
    return null;
  },
  
  /**
   * Get Instagram post data using Graph API
   * @param {string} postId - Instagram post ID
   * @returns {Promise<Object>} - Post data
   */
  getPostData: async function(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    try {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!accessToken) {
        // For demo purposes, return mock data if token not available
        return this.getMockPostData(postId);
      }
      
      const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{media_url,media_type,thumbnail_url},comments_count,like_count';
      const response = await axios.get(`https://graph.instagram.com/${postId}?fields=${fields}&access_token=${accessToken}`);
      
      return response.data;
    } catch (error) {
      console.error('Error getting Instagram post:', error);
      
      // For demo purposes, return mock data if API call fails
      return this.getMockPostData(postId);
    }
  },
  
  /**
   * Get Instagram post comments using Graph API
   * @param {string} postId - Instagram post ID
   * @returns {Promise<Array<Object>>} - Comments data
   */
  getPostComments: async function(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    try {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!accessToken) {
        // For demo purposes, return mock comments if token not available
        return this.getMockComments(postId);
      }
      
      const fields = 'text,username,timestamp,like_count,replies{text,username,timestamp}';
      const response = await axios.get(`https://graph.instagram.com/${postId}/comments?fields=${fields}&access_token=${accessToken}`);
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting Instagram comments:', error);
      
      // For demo purposes, return mock comments if API call fails
      return this.getMockComments(postId);
    }
  },
  
  /**
   * Get Instagram account data
   * @param {string} username - Instagram username
   * @returns {Promise<Object>} - Account data
   */
  getAccountData: async function(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    
    try {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!accessToken) {
        // For demo purposes, return mock data if token not available
        return this.getMockAccountData(username);
      }
      
      // In reality, this requires a Business or Creator account and ID lookup
      // For demo purposes, we'll use a simple approach
      const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type,media_count,name&access_token=${accessToken}`);
      
      if (response.data.username !== username) {
        return this.getMockAccountData(username);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting Instagram account data:', error);
      
      // For demo purposes, return mock data if API call fails
      return this.getMockAccountData(username);
    }
  },
  
  /**
   * Get recent posts from an Instagram account
   * @param {string} username - Instagram username
   * @param {number} maxPosts - Maximum number of posts to return
   * @returns {Promise<Array<Object>>} - Posts data
   */
  getRecentPosts: async function(username, maxPosts = 10) {
    if (!username) {
      throw new Error('Username is required');
    }
    
    try {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!accessToken) {
        // For demo purposes, return mock data if token not available
        return this.getMockRecentPosts(username, maxPosts);
      }
      
      // Get user's media
      const response = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count&limit=${maxPosts}&access_token=${accessToken}`);
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting Instagram recent posts:', error);
      
      // For demo purposes, return mock data if API call fails
      return this.getMockRecentPosts(username, maxPosts);
    }
  },
  
  /**
   * Generate mock post data for demonstration
   * @param {string} postId - Post ID
   * @returns {Object} - Mock post data
   */
  getMockPostData: function(postId) {
    return {
      id: postId,
      caption: `This is a mock caption for post ${postId}. #mockdata #testing #instagram`,
      media_type: 'IMAGE',
      media_url: 'https://placeholder.com/instagram_post.jpg',
      permalink: `https://www.instagram.com/p/${postId}/`,
      timestamp: new Date().toISOString(),
      username: 'mock_user',
      comments_count: 15,
      like_count: 42
    };
  },
  
  /**
   * Generate mock comments for demonstration
   * @param {string} postId - Post ID
   * @returns {Array<Object>} - Mock comments
   */
  getMockComments: function(postId) {
    return [
      {
        id: `comment_1_${postId}`,
        text: 'This is an amazing post! 🔥',
        username: 'commenter1',
        timestamp: new Date().toISOString(),
        like_count: 3
      },
      {
        id: `comment_2_${postId}`,
        text: 'Great content as always! Keep it up.',
        username: 'commenter2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        like_count: 1
      },
      {
        id: `comment_3_${postId}`,
        text: 'Looking forward to more posts like this!',
        username: 'commenter3',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        like_count: 0
      }
    ];
  },
  
  /**
   * Generate mock account data for demonstration
   * @param {string} username - Instagram username
   * @returns {Object} - Mock account data
   */
  getMockAccountData: function(username) {
    return {
      id: `mock_id_${username}`,
      username: username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      account_type: 'PERSONAL',
      media_count: 42,
      followers_count: 1234,
      follows_count: 567
    };
  },
  
  /**
   * Generate mock recent posts for demonstration
   * @param {string} username - Instagram username
   * @param {number} count - Number of mock posts to generate
   * @returns {Array<Object>} - Mock posts
   */
  getMockRecentPosts: function(username, count = 10) {
    const posts = [];
    
    for (let i = 1; i <= count; i++) {
      const postId = `mock_post_${i}_${username}`;
      posts.push({
        id: postId,
        caption: `Post number ${i} by ${username}. This is a mock caption generated for demonstration purposes. #content #demo #instagram`,
        media_type: i % 3 === 0 ? 'VIDEO' : 'IMAGE',
        media_url: `https://placeholder.com/post_${i}.jpg`,
        permalink: `https://www.instagram.com/p/${postId}/`,
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
        username: username,
        comments_count: Math.floor(Math.random() * 20),
        like_count: Math.floor(Math.random() * 100)
      });
    }
    
    return posts;
  }
};

module.exports = {
  instagramContentService
};