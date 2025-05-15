// server/services/queryProcessor.js
const { embeddingService } = require('./embeddingService');
const { vectorRepository } = require('./vectorRepository');
const { textProcessor } = require('./textProcessor');
const { responseGenerator } = require('./responseGenerator');

/**
 * Query processor service for the RAG pipeline
 * Handles processing user queries and retrieving relevant content
 */
const queryProcessor = {
  /**
   * Default similarity threshold for retrieval
   */
  defaultSimilarityThreshold: 0.75,

  /**
   * Default maximum number of chunks to retrieve
   */
  defaultMaxChunks: 5,
  
  /**
   * Process a user query and generate a response
   * @param {string} query - User query
   * @param {string} userId - User ID
   * @param {Object} avatarConfig - Avatar configuration
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Query results with response
   */
  processQuery: async function(query, userId, avatarConfig = {}, options = {}) {
    try {
      console.log(`Processing query for user ${userId}: ${query}`);
      
      // Clean the query text
      const cleanedQuery = textProcessor.cleanText(query);
      
      // Generate embedding for the query
      const queryEmbeddingResult = await embeddingService.generateEmbeddings(cleanedQuery);
      const queryEmbedding = queryEmbeddingResult.embedding;
      
      // Retrieve similar chunks
      const threshold = options.threshold || this.defaultSimilarityThreshold;
      const maxChunks = options.maxChunks || this.defaultMaxChunks;
      
      const similarChunks = await vectorRepository.findSimilarChunks(
        queryEmbedding,
        userId,
        {
          threshold,
          matchCount: maxChunks,
          contentTypes: options.contentTypes,
          contentIds: options.contentIds
        }
      );
      
      // If no chunks found, handle gracefully
      if (!similarChunks || similarChunks.length === 0) {
        console.log('No similar chunks found for query');
        
        // Generate a response without context
        const noContextResponse = await responseGenerator.generateResponse(
          cleanedQuery,
          [],
          avatarConfig
        );
        
        // Store chat history
        await vectorRepository.storeChatHistory(
          userId,
          cleanedQuery,
          queryEmbedding,
          noContextResponse,
          []
        );
        
        return {
          query: cleanedQuery,
          response: noContextResponse,
          similarChunks: [],
          hasResults: false
        };
      }
      
      // Generate a response with the retrieved context
      const retrievedChunkTexts = similarChunks.map(chunk => chunk.content_text);
      const response = await responseGenerator.generateResponse(
        cleanedQuery,
        retrievedChunkTexts,
        avatarConfig
      );
      
      // Store chat history
      const chunkIds = similarChunks.map(chunk => chunk.id);
      await vectorRepository.storeChatHistory(
        userId,
        cleanedQuery,
        queryEmbedding,
        response,
        chunkIds
      );
      
      return {
        query: cleanedQuery,
        response,
        similarChunks,
        hasResults: true
      };
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  },
  
  /**
   * Get chat history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of entries to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array<Object>>} - Chat history entries
   */
  getChatHistory: async function(userId, limit = 20, offset = 0) {
    try {
      return await vectorRepository.getChatHistory(userId, limit, offset);
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  },
  
  /**
   * Get user content sources
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Content sources
   */
  getContentSources: async function(userId) {
    try {
      return await vectorRepository.getUserContentSources(userId);
    } catch (error) {
      console.error('Error getting content sources:', error);
      throw error;
    }
  },
  
  /**
   * Search for content by keyword
   * @param {string} keyword - Keyword to search for
   * @param {string} userId - User ID
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  searchByKeyword: async function(keyword, userId, options = {}) {
    try {
      // Clean the keyword
      const cleanedKeyword = textProcessor.cleanText(keyword);
      
      // Generate embedding for the keyword
      const keywordEmbeddingResult = await embeddingService.generateEmbeddings(cleanedKeyword);
      const keywordEmbedding = keywordEmbeddingResult.embedding;
      
      // Retrieve similar chunks
      const threshold = options.threshold || 0.7; // Lower threshold for keyword search
      const maxChunks = options.maxChunks || 20; // More results for search
      
      const similarChunks = await vectorRepository.findSimilarChunks(
        keywordEmbedding,
        userId,
        {
          threshold,
          matchCount: maxChunks,
          contentTypes: options.contentTypes,
          contentIds: options.contentIds
        }
      );
      
      // Group results by content source
      const groupedResults = {};
      similarChunks.forEach(chunk => {
        const contentId = chunk.content_id;
        if (!groupedResults[contentId]) {
          groupedResults[contentId] = {
            contentId,
            contentType: chunk.content_type,
            matches: [],
            maxSimilarity: 0
          };
        }
        
        groupedResults[contentId].matches.push({
          chunkId: chunk.id,
          text: chunk.content_text,
          similarity: chunk.similarity
        });
        
        // Track highest similarity score
        if (chunk.similarity > groupedResults[contentId].maxSimilarity) {
          groupedResults[contentId].maxSimilarity = chunk.similarity;
        }
      });
      
      // Convert to array and sort by max similarity
      const results = Object.values(groupedResults)
        .sort((a, b) => b.maxSimilarity - a.maxSimilarity);
      
      return {
        keyword: cleanedKeyword,
        results,
        totalMatches: similarChunks.length,
        hasResults: similarChunks.length > 0
      };
    } catch (error) {
      console.error('Error searching by keyword:', error);
      throw error;
    }
  }
};

module.exports = {
  queryProcessor
};