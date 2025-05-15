// server/services/contentIngestion.js
const { youtubeService } = require('./youtubeService');
const { instagramContentService } = require('./instagramContentService');
const { textProcessor } = require('./textProcessor');
const { embeddingService } = require('./embeddingService');
const { vectorRepository } = require('./vectorRepository');
const { ContentTypes } = require('../models/contentTypes');

/**
 * Content ingestion service for the RAG pipeline
 * Handles fetching, processing and embedding content from various sources
 */
const contentIngestion = {
  /**
   * Process and ingest YouTube video content
   * @param {string} videoUrl - YouTube video URL or ID
   * @param {string} userId - User ID
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Result of the ingestion
   */
  ingestYouTubeVideo: async function(videoUrl, userId, options = {}) {
    try {
      const videoId = youtubeService.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube video URL or ID');
      }
      
      console.log(`Ingesting YouTube video: ${videoId}`);
      
      // Fetch video details and transcript
      const videoDetails = await youtubeService.getVideoDetails(videoId);
      const transcript = await youtubeService.getVideoTranscript(videoId);
      
      if (!transcript || transcript.length < 100) {
        throw new Error('Failed to get enough transcript content from the video');
      }
      
      // Process and clean transcript
      const cleanedTranscript = textProcessor.cleanTranscript(transcript);
      
      // Chunk the transcript
      const chunks = textProcessor.chunkText(cleanedTranscript, options.chunkSize || 1500, options.overlap || 150);
      
      // Generate embeddings for chunks
      const chunksWithEmbeddings = await embeddingService.embedChunks(chunks);
      
      // Store in vector database
      const metadata = {
        title: videoDetails.title,
        description: videoDetails.description,
        channelTitle: videoDetails.channelTitle,
        publishedAt: videoDetails.publishedAt,
        duration: videoDetails.durationSeconds,
        viewCount: videoDetails.viewCount
      };
      
      const storedChunks = await vectorRepository.storeContentChunks(
        chunksWithEmbeddings,
        userId,
        ContentTypes.YOUTUBE_VIDEO,
        videoId,
        videoDetails.title,
        metadata
      );
      
      // Return success result
      return {
        success: true,
        contentType: ContentTypes.YOUTUBE_VIDEO,
        contentId: videoId,
        contentTitle: videoDetails.title,
        chunksProcessed: storedChunks.length,
        totalTokens: chunksWithEmbeddings.reduce((total, chunk) => total + (chunk.tokenEstimate || 0), 0),
        metadata
      };
    } catch (error) {
      console.error('Error ingesting YouTube video:', error);
      return {
        success: false,
        contentType: ContentTypes.YOUTUBE_VIDEO,
        error: error.message
      };
    }
  },
  
  /**
   * Process and ingest YouTube channel content
   * @param {string} channelUrl - YouTube channel URL or ID
   * @param {string} userId - User ID
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Result of the ingestion
   */
  ingestYouTubeChannel: async function(channelUrl, userId, options = {}) {
    try {
      const channelId = await youtubeService.extractChannelId(channelUrl);
      if (!channelId) {
        throw new Error('Invalid YouTube channel URL or ID');
      }
      
      console.log(`Ingesting YouTube channel: ${channelId}`);
      
      // Get channel details
      const channelDetails = await youtubeService.getChannelDetails(channelId);
      
      // Get videos from channel
      const videosOptions = {
        maxVideos: options.maxVideos || 5,
        minDuration: options.minDuration || 60,
        maxDuration: options.maxDuration || 1800,
        minViewCount: options.minViewCount || 1000
      };
      
      const videos = await youtubeService.getChannelVideos(channelId, videosOptions);
      
      if (!videos || videos.length === 0) {
        throw new Error('No suitable videos found for this channel');
      }
      
      // Store channel as content source
      await vectorRepository.storeContentSource(
        userId,
        ContentTypes.YOUTUBE_CHANNEL,
        channelDetails.title,
        `https://www.youtube.com/channel/${channelId}`,
        {
          description: channelDetails.description,
          subscriberCount: channelDetails.subscriberCount,
          videoCount: channelDetails.videoCount,
          videoIds: videos.map(v => v.id)
        }
      );
      
      // Process each video
      const results = [];
      for (const video of videos) {
        console.log(`Processing video from channel: ${video.id}`);
        const result = await this.ingestYouTubeVideo(video.id, userId, options);
        results.push(result);
      }
      
      // Summarize results
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        contentType: ContentTypes.YOUTUBE_CHANNEL,
        contentId: channelId,
        contentTitle: channelDetails.title,
        totalVideos: videos.length,
        successfulVideos: successCount,
        failedVideos: videos.length - successCount,
        videoResults: results
      };
    } catch (error) {
      console.error('Error ingesting YouTube channel:', error);
      return {
        success: false,
        contentType: ContentTypes.YOUTUBE_CHANNEL,
        error: error.message
      };
    }
  },
  
  /**
   * Process and ingest Instagram post content
   * @param {string} postUrl - Instagram post URL or ID
   * @param {string} userId - User ID
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Result of the ingestion
   */
  ingestInstagramPost: async function(postUrl, userId, options = {}) {
    try {
      const postId = instagramContentService.extractPostId(postUrl);
      if (!postId) {
        throw new Error('Invalid Instagram post URL or ID');
      }
      
      console.log(`Ingesting Instagram post: ${postId}`);
      
      // Fetch post details and comments
      const postDetails = await instagramContentService.getPostData(postId);
      const comments = await instagramContentService.getPostComments(postId);
      
      // Process post caption and comments into text
      let contentText = postDetails.caption || '';
      
      // Add comments to the content text
      if (comments && comments.length > 0) {
        comments.forEach(comment => {
          contentText += `\n\nComment by ${comment.username}: ${comment.text}`;
          
          // Add replies if they exist
          if (comment.replies && comment.replies.data && comment.replies.data.length > 0) {
            comment.replies.data.forEach(reply => {
              contentText += `\nReply by ${reply.username}: ${reply.text}`;
            });
          }
        });
      }
      
      if (contentText.length < 100) {
        throw new Error('Not enough text content in the post and comments');
      }
      
      // Clean and chunk the text
      const cleanedText = textProcessor.cleanText(contentText);
      const chunks = textProcessor.chunkText(cleanedText, options.chunkSize || 1000, options.overlap || 100);
      
      // Generate embeddings for chunks
      const chunksWithEmbeddings = await embeddingService.embedChunks(chunks);
      
      // Store in vector database
      const metadata = {
        caption: postDetails.caption,
        media_type: postDetails.media_type,
        username: postDetails.username,
        timestamp: postDetails.timestamp,
        permalink: postDetails.permalink,
        likes: postDetails.like_count,
        comments: postDetails.comments_count
      };
      
      const storedChunks = await vectorRepository.storeContentChunks(
        chunksWithEmbeddings,
        userId,
        ContentTypes.INSTAGRAM_POST,
        postId,
        postDetails.permalink,
        metadata
      );
      
      // Return success result
      return {
        success: true,
        contentType: ContentTypes.INSTAGRAM_POST,
        contentId: postId,
        contentTitle: postDetails.caption ? postDetails.caption.substring(0, 50) + '...' : 'Instagram Post',
        chunksProcessed: storedChunks.length,
        totalTokens: chunksWithEmbeddings.reduce((total, chunk) => total + (chunk.tokenEstimate || 0), 0),
        metadata
      };
    } catch (error) {
      console.error('Error ingesting Instagram post:', error);
      return {
        success: false,
        contentType: ContentTypes.INSTAGRAM_POST,
        error: error.message
      };
    }
  },
  
  /**
   * Process and ingest Instagram account content
   * @param {string} username - Instagram username
   * @param {string} userId - User ID
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Result of the ingestion
   */
  ingestInstagramAccount: async function(username, userId, options = {}) {
    try {
      const cleanUsername = instagramContentService.extractUsername(username);
      if (!cleanUsername) {
        throw new Error('Invalid Instagram username');
      }
      
      console.log(`Ingesting Instagram account: ${cleanUsername}`);
      
      // Get account details
      const accountDetails = await instagramContentService.getAccountData(cleanUsername);
      
      // Get recent posts
      const maxPosts = options.maxPosts || 10;
      const posts = await instagramContentService.getRecentPosts(cleanUsername, maxPosts);
      
      if (!posts || posts.length === 0) {
        throw new Error('No posts found for this account');
      }
      
      // Store account as content source
      await vectorRepository.storeContentSource(
        userId,
        ContentTypes.INSTAGRAM_ACCOUNT,
        accountDetails.username,
        `https://www.instagram.com/${cleanUsername}/`,
        {
          name: accountDetails.name,
          account_type: accountDetails.account_type,
          media_count: accountDetails.media_count,
          post_ids: posts.map(p => p.id)
        }
      );
      
      // Process each post
      const results = [];
      for (const post of posts) {
        console.log(`Processing post from account: ${post.id}`);
        const result = await this.ingestInstagramPost(post.id, userId, options);
        results.push(result);
      }
      
      // Summarize results
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        contentType: ContentTypes.INSTAGRAM_ACCOUNT,
        contentId: cleanUsername,
        contentTitle: accountDetails.name || cleanUsername,
        totalPosts: posts.length,
        successfulPosts: successCount,
        failedPosts: posts.length - successCount,
        postResults: results
      };
    } catch (error) {
      console.error('Error ingesting Instagram account:', error);
      return {
        success: false,
        contentType: ContentTypes.INSTAGRAM_ACCOUNT,
        error: error.message
      };
    }
  },
  
  /**
   * Process and ingest custom text content
   * @param {string} text - Text content
   * @param {string} userId - User ID
   * @param {string} title - Content title
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Result of the ingestion
   */
  ingestCustomText: async function(text, userId, title, options = {}) {
    try {
      if (!text || text.length < 100) {
        throw new Error('Text content too short');
      }
      
      const contentId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      console.log(`Ingesting custom text: ${contentId}`);
      
      // Clean and chunk the text
      const cleanedText = textProcessor.cleanText(text);
      const chunks = textProcessor.chunkText(cleanedText, options.chunkSize || 1500, options.overlap || 150);
      
      // Generate embeddings for chunks
      const chunksWithEmbeddings = await embeddingService.embedChunks(chunks);
      
      // Extract keywords
      const keywords = textProcessor.extractKeywords(text, 10);
      
      // Store in vector database
      const metadata = {
        title: title || 'Custom Text',
        keywords,
        createdAt: new Date().toISOString()
      };
      
      const storedChunks = await vectorRepository.storeContentChunks(
        chunksWithEmbeddings,
        userId,
        ContentTypes.CUSTOM_TEXT,
        contentId,
        title || 'Custom Text',
        metadata
      );
      
      // Return success result
      return {
        success: true,
        contentType: ContentTypes.CUSTOM_TEXT,
        contentId,
        contentTitle: title || 'Custom Text',
        chunksProcessed: storedChunks.length,
        totalTokens: chunksWithEmbeddings.reduce((total, chunk) => total + (chunk.tokenEstimate || 0), 0),
        metadata
      };
    } catch (error) {
      console.error('Error ingesting custom text:', error);
      return {
        success: false,
        contentType: ContentTypes.CUSTOM_TEXT,
        error: error.message
      };
    }
  }
};

module.exports = {
  contentIngestion
};