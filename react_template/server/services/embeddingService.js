// server/services/embeddingService.js
const { openaiClient } = require('./openaiClient');
const { textProcessor } = require('./textProcessor');

/**
 * Embedding service for the RAG pipeline
 */
const embeddingService = {
  /**
   * Default embedding model to use
   */
  defaultModel: 'text-embedding-ada-002',
  
  /**
   * Maximum content length allowed for single embedding (in tokens)
   */
  maxContentLength: 8000,
  
  /**
   * Generate embeddings for a text or array of texts
   * @param {string|Array<string>} content - Text content to embed
   * @param {string} model - OpenAI embedding model to use
   * @returns {Promise<Object>} - Object with embeddings and metadata
   */
  generateEmbeddings: async function(content, model = this.defaultModel) {
    if (!openaiClient.isConfigured()) {
      throw new Error('OpenAI client not initialized');
    }
    
    // Handle both single string and array of strings
    const isArray = Array.isArray(content);
    const textArray = isArray ? content : [content];
    
    // Process each text item
    const processedItems = textArray.map(text => {
      const cleanedText = textProcessor.cleanText(text);
      const tokenEstimate = textProcessor.estimateTokenCount(cleanedText);
      
      // Check if content is too large
      if (tokenEstimate > this.maxContentLength) {
        throw new Error(`Content too large for embedding. Estimated ${tokenEstimate} tokens exceeds maximum of ${this.maxContentLength}`);
      }
      
      return {
        originalText: text,
        processedText: cleanedText,
        tokenEstimate
      };
    });
    
    // Generate embeddings for each item
    const results = [];
    for (const item of processedItems) {
      try {
        const embedding = await openaiClient.createEmbedding(item.processedText, model);
        
        results.push({
          text: item.originalText,
          processedText: item.processedText,
          embedding,
          tokenEstimate: item.tokenEstimate
        });
      } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
      }
    }
    
    // Return single object or array based on input type
    return isArray ? results : results[0];
  },
  
  /**
   * Generate embeddings for chunks of text
   * @param {Array<Object>} chunks - Array of text chunks with text property
   * @param {string} model - OpenAI embedding model to use
   * @returns {Promise<Array<Object>>} - Chunks with embeddings added
   */
  embedChunks: async function(chunks, model = this.defaultModel) {
    if (!chunks || chunks.length === 0) {
      return [];
    }
    
    // Extract text from chunks
    const texts = chunks.map(chunk => chunk.text);
    
    // Generate embeddings
    const embeddings = await this.generateEmbeddings(texts, model);
    
    // Add embeddings to chunks
    return chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i].embedding,
      tokenEstimate: embeddings[i].tokenEstimate
    }));
  },
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 - First vector
   * @param {Array<number>} vec2 - Second vector
   * @returns {number} - Cosine similarity (-1 to 1)
   */
  cosineSimilarity: function(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  },
  
  /**
   * Find most similar embeddings by cosine similarity
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {Array<Object>} documents - Documents with embedding property
   * @param {Object} options - Similarity search options
   * @returns {Array<Object>} - Matching documents with similarity scores
   */
  findSimilarEmbeddings: function(queryEmbedding, documents, options = {}) {
    const {
      threshold = 0.7,
      maxResults = 5,
      includeScores = true
    } = options;
    
    if (!queryEmbedding || !documents || documents.length === 0) {
      return [];
    }
    
    // Calculate similarity for each document
    const scored = documents.map(doc => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return {
        ...doc,
        similarity
      };
    });
    
    // Filter by threshold and sort by similarity (descending)
    const filtered = scored
      .filter(doc => doc.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
    
    // Remove similarity score if not needed
    if (!includeScores) {
      filtered.forEach(doc => {
        delete doc.similarity;
      });
    }
    
    return filtered;
  }
};

module.exports = {
  embeddingService
};