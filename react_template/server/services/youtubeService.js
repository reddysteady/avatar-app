// server/services/youtubeService.js
const axios = require('axios');

/**
 * YouTube service for fetching video content and transcripts
 */
const youtubeService = {
  /**
   * Extract YouTube video ID from URL or ID string
   * @param {string} urlOrId - YouTube URL or video ID
   * @returns {string|null} - Extracted video ID or null
   */
  extractVideoId: function(urlOrId) {
    if (!urlOrId) return null;
    
    // If it's already just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
      return urlOrId;
    }
    
    // Try to extract from URL
    const regexPatterns = [
      // youtu.be/ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // youtube.com/watch?v=ID
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      // youtube.com/v/ID
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      // youtube.com/embed/ID
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const regex of regexPatterns) {
      const match = urlOrId.match(regex);
      if (match) return match[1];
    }
    
    return null;
  },
  
  /**
   * Extract YouTube channel ID from URL or username
   * @param {string} urlOrUsername - YouTube channel URL or username
   * @returns {Promise<string|null>} - Extracted channel ID or null
   */
  extractChannelId: async function(urlOrUsername) {
    if (!urlOrUsername) return null;
    
    // Check if it's a channel ID already (starts with UC and has 22 chars)
    if (/^UC[a-zA-Z0-9_-]{20,22}$/.test(urlOrUsername)) {
      return urlOrUsername;
    }
    
    // Try to extract from URL
    const channelRegexes = [
      // youtube.com/channel/ID
      /youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/,
      // youtube.com/c/username
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      // youtube.com/user/username
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      // youtube.com/@username
      /youtube\.com\/@([a-zA-Z0-9_-]+)/
    ];
    
    for (const regex of channelRegexes) {
      const match = urlOrUsername.match(regex);
      if (match) {
        // For /c/ or /user/ paths, we need to look up the channel ID
        // using the YouTube API, but that requires API key setup
        // For now, return the username which we can use later
        return match[1];
      }
    }
    
    // If it's just a username, return as is for now
    return urlOrUsername;
  },
  
  /**
   * Get YouTube video details
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} - Video details
   */
  getVideoDetails: async function(videoId) {
    if (!videoId) {
      throw new Error('Video ID is required');
    }
    
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }
      
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: apiKey
        }
      });
      
      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }
      
      const video = response.data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      const statistics = video.statistics;
      
      // Parse duration from ISO 8601 format (e.g., PT1H2M3S)
      let durationSeconds = 0;
      const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
      const durationMatch = contentDetails.duration.match(durationRegex);
      if (durationMatch) {
        const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
        const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
        const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
        durationSeconds = hours * 3600 + minutes * 60 + seconds;
      }
      
      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        thumbnails: snippet.thumbnails,
        durationSeconds,
        viewCount: parseInt(statistics.viewCount || '0'),
        likeCount: parseInt(statistics.likeCount || '0'),
        commentCount: parseInt(statistics.commentCount || '0')
      };
    } catch (error) {
      console.error('Error getting video details:', error);
      throw error;
    }
  },
  
  /**
   * Get YouTube channel details
   * @param {string} channelId - YouTube channel ID
   * @returns {Promise<Object>} - Channel details
   */
  getChannelDetails: async function(channelId) {
    if (!channelId) {
      throw new Error('Channel ID is required');
    }
    
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }
      
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
        params: {
          part: 'snippet,statistics',
          id: channelId,
          key: apiKey
        }
      });
      
      if (response.data.items.length === 0) {
        // Try searching by username if not found by ID
        const searchResponse = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
          params: {
            part: 'snippet,statistics',
            forUsername: channelId,
            key: apiKey
          }
        });
        
        if (searchResponse.data.items.length === 0) {
          throw new Error('Channel not found');
        }
        
        return this.formatChannelData(searchResponse.data.items[0]);
      }
      
      return this.formatChannelData(response.data.items[0]);
    } catch (error) {
      console.error('Error getting channel details:', error);
      throw error;
    }
  },
  
  /**
   * Format channel data from API response
   * @param {Object} channel - API channel data
   * @returns {Object} - Formatted channel data
   */
  formatChannelData: function(channel) {
    const snippet = channel.snippet;
    const statistics = channel.statistics;
    
    return {
      id: channel.id,
      title: snippet.title,
      description: snippet.description,
      customUrl: snippet.customUrl,
      publishedAt: snippet.publishedAt,
      thumbnails: snippet.thumbnails,
      subscriberCount: parseInt(statistics.subscriberCount || '0'),
      videoCount: parseInt(statistics.videoCount || '0'),
      viewCount: parseInt(statistics.viewCount || '0')
    };
  },
  
  /**
   * Get videos from a YouTube channel
   * @param {string} channelId - YouTube channel ID
   * @param {Object} options - Options for filtering videos
   * @returns {Promise<Array<Object>>} - List of videos
   */
  getChannelVideos: async function(channelId, options = {}) {
    if (!channelId) {
      throw new Error('Channel ID is required');
    }
    
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }
      
      const {
        maxVideos = 10,
        minDuration = 60,    // 1 minute
        maxDuration = 3600,  // 1 hour
        minViewCount = 100,
        publishedAfter = '',
        publishedBefore = ''
      } = options;
      
      // First get the channel's uploads playlist ID
      const channelResponse = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
        params: {
          part: 'contentDetails',
          id: channelId,
          key: apiKey
        }
      });
      
      if (channelResponse.data.items.length === 0) {
        throw new Error('Channel not found');
      }
      
      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
      
      // Get videos from uploads playlist
      const playlistResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: Math.min(50, maxVideos * 2), // Get more than needed to filter
          key: apiKey
        }
      });
      
      if (playlistResponse.data.items.length === 0) {
        return [];
      }
      
      // Extract video IDs
      const videoIds = playlistResponse.data.items.map(item => item.contentDetails.videoId);
      
      // Get detailed video data
      const videosResponse = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoIds.join(','),
          key: apiKey
        }
      });
      
      if (videosResponse.data.items.length === 0) {
        return [];
      }
      
      // Process video data and apply filters
      const videos = videosResponse.data.items
        .map(video => {
          // Parse duration
          let durationSeconds = 0;
          const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
          const durationMatch = video.contentDetails.duration.match(durationRegex);
          if (durationMatch) {
            const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
            const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
            const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
            durationSeconds = hours * 3600 + minutes * 60 + seconds;
          }
          
          return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            thumbnails: video.snippet.thumbnails,
            channelTitle: video.snippet.channelTitle,
            durationSeconds,
            viewCount: parseInt(video.statistics.viewCount || '0'),
            likeCount: parseInt(video.statistics.likeCount || '0'),
            commentCount: parseInt(video.statistics.commentCount || '0')
          };
        })
        .filter(video => {
          // Apply filters
          if (video.durationSeconds < minDuration || video.durationSeconds > maxDuration) {
            return false;
          }
          
          if (video.viewCount < minViewCount) {
            return false;
          }
          
          if (publishedAfter) {
            const afterDate = new Date(publishedAfter);
            const videoDate = new Date(video.publishedAt);
            if (videoDate < afterDate) {
              return false;
            }
          }
          
          if (publishedBefore) {
            const beforeDate = new Date(publishedBefore);
            const videoDate = new Date(video.publishedAt);
            if (videoDate > beforeDate) {
              return false;
            }
          }
          
          return true;
        })
        // Sort by view count descending (most popular first)
        .sort((a, b) => b.viewCount - a.viewCount)
        // Limit to requested number
        .slice(0, maxVideos);
      
      return videos;
    } catch (error) {
      console.error('Error getting channel videos:', error);
      throw error;
    }
  },
  
  /**
   * Get video transcript using YouTube API or third-party service
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<string>} - Video transcript
   */
  getVideoTranscript: async function(videoId) {
    if (!videoId) {
      throw new Error('Video ID is required');
    }
    
    try {
      // In a real implementation, we would use YouTube's captions API here
      // or a service like youtube-transcript-api
      // For now, let's mock the response for demonstration purposes
      
      // Wait a bit to simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock transcript
      const transcript = `This is a mocked transcript for video ID ${videoId}. 
      In a real implementation, we would fetch the actual transcript using YouTube's API.
      The transcript would contain the spoken content of the video, including timestamps.
      This would be processed and chunked for use in the RAG pipeline.
      For now, we're just returning this placeholder text for demonstration purposes.`;
      
      return transcript;
    } catch (error) {
      console.error('Error getting video transcript:', error);
      return `Unable to retrieve transcript for video ${videoId}: ${error.message}`;
    }
  }
};

module.exports = {
  youtubeService
};