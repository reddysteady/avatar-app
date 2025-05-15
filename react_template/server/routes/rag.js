// server/routes/rag.js
const express = require('express');
const router = express.Router();
const { contentIngestion } = require('../services/contentIngestion');
const { queryProcessor } = require('../services/queryProcessor');
const { responseGenerator } = require('../services/responseGenerator');
const { vectorRepository } = require('../services/vectorRepository');
const { embeddingService } = require('../services/embeddingService');
const { openaiClient } = require('../services/openaiClient');
const { ContentTypes, isValidContentType } = require('../models/contentTypes');

// Authentication middleware
const authenticateUser = (req, res, next) => {
  // In a real implementation, verify auth token and set req.user
  // For now, we'll use the userId from the request body or query
  const userId = req.body.userId || req.query.userId || req.params.userId;
  
  if (!userId) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Authentication required'
    });
  }
  
  // Set user info in request object
  req.user = { id: userId };
  next();
};

/**
 * @route GET /api/rag/status
 * @description Check if the RAG pipeline is ready
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    // Check Supabase connection
    const isVectorRepoReady = await vectorRepository.checkSetup();
    
    // Check OpenAI configuration
    const isOpenAIReady = openaiClient.isConfigured();
    
    return res.json({
      status: 'success',
      ready: isVectorRepoReady && isOpenAIReady,
      components: {
        vectorDatabase: isVectorRepoReady,
        openai: isOpenAIReady
      }
    });
  } catch (error) {
    console.error('Error checking RAG status:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      ready: false
    });
  }
});

/**
 * @route POST /api/rag/ingest
 * @description Ingest content into the RAG pipeline
 * @access Private
 */
router.post('/ingest', authenticateUser, async (req, res) => {
  try {
    const { 
      sourceType, 
      sourceId, 
      influencerId = null,
      metadata = {}, 
      options = {} 
    } = req.body;
    
    // Use influencer ID if provided, otherwise use authenticated user ID
    const userId = influencerId || req.user.id;
    
    if (!sourceType || !sourceId) {
      return res.status(400).json({
        status: 'error',
        message: 'Source type and source ID are required'
      });
    }
    
    let result;
    
    // Process different content types
    switch (sourceType) {
      case ContentTypes.YOUTUBE_VIDEO:
        result = await contentIngestion.ingestYouTubeVideo(sourceId, userId);
        break;
        
      case ContentTypes.YOUTUBE_CHANNEL:
        result = await contentIngestion.ingestYouTubeChannel(sourceId, userId, options);
        break;
        
      case ContentTypes.INSTAGRAM_POST:
        result = await contentIngestion.ingestInstagramPost(sourceId, userId);
        break;
        
      case ContentTypes.INSTAGRAM_ACCOUNT:
        result = await contentIngestion.ingestInstagramAccount(sourceId, userId, options);
        break;
        
      case ContentTypes.CUSTOM_TEXT:
        result = await contentIngestion.ingestCustomText(
          sourceId, 
          userId, 
          metadata.title || 'Custom Text', 
          metadata
        );
        break;
        
      default:
        return res.status(400).json({
          status: 'error',
          message: `Unsupported source type: ${sourceType}`
        });
    }
    
    return res.json({
      status: 'success',
      result
    });
  } catch (error) {
    console.error('Error ingesting content:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route POST /api/rag/query
 * @description Query the RAG pipeline
 * @access Private
 */
router.post('/query', authenticateUser, async (req, res) => {
  try {
    const { 
      message, 
      influencerId = null,
      options = {} 
    } = req.body;
    
    // Use influencer ID if provided, otherwise use authenticated user ID
    const userId = influencerId || req.user.id;
    
    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Query message is required'
      });
    }
    
    // Process the query
    const queryResults = await queryProcessor.processQuery(message, userId, options);
    
    // Get avatar settings
    // In a real implementation, these would come from a database
    const avatarSettings = options.avatarSettings || {
      personality: {
        name: options.name || 'AI Assistant',
        tone: options.tone || 'friendly and helpful',
        style: options.style || 'conversational',
        background: options.background || 'an AI assistant representing the influencer'
      },
      temperature: options.temperature || 0.7
    };
    
    // Generate response
    const response = await responseGenerator.generateResponse(
      message,
      queryResults.context,
      avatarSettings,
      options
    );
    
    // Store query and response
    await queryProcessor.storeQueryAndResponse(queryResults, response, userId);
    
    return res.json({
      status: 'success',
      query: message,
      response: response,
      sources: queryResults.similarContent.map(content => ({
        id: content.id,
        text: content.content_text?.substring(0, 100) + '...',
        similarity: content.similarity,
        metadata: content.metadata
      }))
    });
  } catch (error) {
    console.error('Error processing query:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/rag/content/:userId
 * @description Get content sources for a user
 * @access Private
 */
router.get('/content/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own content
    if (userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to access this content'
      });
    }
    
    const contentSources = await vectorRepository.getUserContentSources(userId);
    
    return res.json({
      status: 'success',
      contentSources
    });
  } catch (error) {
    console.error('Error getting content sources:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/rag/content/:contentId
 * @description Delete content by ID
 * @access Private
 */
router.delete('/content/:contentId', authenticateUser, async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const success = await vectorRepository.deleteContent(contentId, req.user.id);
    
    return res.json({
      status: 'success',
      message: `Content deleted successfully`,
      contentId
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;