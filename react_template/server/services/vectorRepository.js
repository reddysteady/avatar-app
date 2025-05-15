// server/services/vectorRepository.js
const { supabaseClient } = require('./supabaseClient');
const { embeddingService } = require('./embeddingService');

/**
 * Vector repository service for the RAG pipeline
 * Handles storing and retrieving vector embeddings
 */
const vectorRepository = {
  /**
   * Default similarity threshold for retrieval
   */
  defaultSimilarityThreshold: 0.75,

  /**
   * Default maximum number of matches to return
   */
  defaultMatchCount: 5,
  
  /**
   * Store content chunks with embeddings in the database
   * @param {Array<Object>} chunks - Content chunks with embeddings
   * @param {string} userId - User ID who owns the content
   * @param {string} contentType - Type of content (e.g. youtube_video, instagram_post)
   * @param {string} contentId - ID of the original content
   * @param {string} contentSource - Source of the content (e.g. URL)
   * @param {Object} metadata - Additional metadata for the content
   * @returns {Promise<Array<Object>>} - Stored chunk records
   */
  storeContentChunks: async function(chunks, userId, contentType, contentId, contentSource, metadata = {}) {
    if (!supabaseClient.isConfigured()) {
      throw new Error('Supabase client not initialized');
    }
    
    if (!chunks || chunks.length === 0) {
      return [];
    }
    
    try {
      // Prepare data for insertion
      const records = chunks.map((chunk, index) => ({
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        content_source: contentSource,
        chunk_index: index,
        chunk_text: chunk.text,
        metadata: {
          ...metadata,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          tokenEstimate: chunk.tokenEstimate || 0
        },
        embedding: chunk.embedding
      }));
      
      // Insert into database
      const { data, error } = await supabaseClient.client
        .from('content_chunks')
        .insert(records)
        .select('id, content_id, chunk_index, created_at');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error storing content chunks:', error);
      throw error;
    }
  },
  
  /**
   * Store content source information
   * @param {string} userId - User ID who owns the source
   * @param {string} sourceType - Type of source (e.g. youtube_channel, instagram_account)
   * @param {string} sourceName - Name of the source
   * @param {string} sourceUrl - URL of the source
   * @param {Object} metadata - Additional metadata for the source
   * @returns {Promise<Object>} - Stored source record
   */
  storeContentSource: async function(userId, sourceType, sourceName, sourceUrl, metadata = {}) {
    if (!supabaseClient.isConfigured()) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await supabaseClient.client
        .from('content_sources')
        .insert({
          user_id: userId,
          source_type: sourceType,
          source_name: sourceName,
          source_url: sourceUrl,
          metadata
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error storing content source:', error);
      throw error;
    }
  },
  
  /**
   * Find similar content chunks for a query
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {string} userId - User ID to retrieve content for
   * @param {Object} options - Query options
   * @returns {Promise<Array<Object>>} - Matching content chunks
   */
  findSimilarChunks: async function(queryEmbedding, userId, options = {}) {
    if (!supabaseClient.isConfigured()) {
      throw new Error('Supabase client not initialized');
    }
    
    const {
      threshold = this.defaultSimilarityThreshold,
      matchCount = this.defaultMatchCount,
      contentTypes = [],
      contentIds = [],
      startDate,
      endDate
    } = options;
    
    try {
      // Call the Postgres function to perform vector similarity search
      const { data, error } = await supabaseClient.client.rpc(
        'match_content_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: matchCount,
          user_id_input: userId
        }
      );
      
      if (error) throw error;
      
      if (!data) return [];
      
      // Additional client-side filtering if needed
      let filtered = data;
      
      if (contentTypes.length > 0) {
        filtered = filtered.filter(item => contentTypes.includes(item.content_type));
      }
      
      if (contentIds.length > 0) {
        filtered = filtered.filter(item => contentIds.includes(item.content_id));
      }
      
      if (startDate) {
        const startDateObj = new Date(startDate);
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.metadata?.created_at || item.created_at);
          return itemDate >= startDateObj;
        });
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.metadata?.created_at || item.created_at);
          return itemDate <= endDateObj;
        });
      }
      
      return filtered;
    } catch (error) {
      console.error('Error finding similar chunks:', error);
      throw error;
    }
  },
  
  /**
   * Store a chat history record with query and response
   * @param {string} userId - User ID
   * @param {string} query - User query
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {string} response - System response
   * @param {Array<string>} retrievedChunkIds - IDs of retrieved chunks
   * @returns {Promise<Object>} - Stored history record
   */
  storeChatHistory: async function(userId, query, queryEmbedding, response, retrievedChunkIds = []) {
    if (!supabaseClient.isConfigured()) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await supabaseClient.client
        .from('chat_history')
        .insert({
          user_id: userId,
          user_query: query,
          query_embedding: queryEmbedding,
          system_response: response,
          retrieved_chunk_ids: retrievedChunkIds
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error storing chat history:', error);
      throw error;
    }
  },
  
  /**
   * Get chat history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array<Object>>} - Chat history records
   */
  getChatHistory: async function(userId, limit = 20, offset = 0) {
    if (!supabaseClient.isConfigured()) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await supabaseClient.client
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  },
  
  /**
   * Get content sources for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} - Content source records
   */
  getUserContentSources: async function(userId) {
    if (!supabaseClient.isConfigured()) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await supabaseClient.client
        .from('content_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting user content sources:', error);
      throw error;
    }
  },
  
  /**
   * Get content chunks for a specific content ID
   * @param {string} userId - User ID
   * @param {string} contentId - Content ID
   * @returns {Promise<Array<Object>>} - Content chunk records
   */
  getContentChunks: async function(userId, contentId) {
    if (!supabaseClient.isConfigured()) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await supabaseClient.client
        .from('content_chunks')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .order('chunk_index', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting content chunks:', error);
      throw error;
    }
  }
};

module.exports = {
  vectorRepository
};