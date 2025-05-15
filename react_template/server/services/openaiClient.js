// server/services/openaiClient.js
const { Configuration, OpenAIApi } = require('openai');

/**
 * OpenAI client service for the RAG pipeline
 */
const openaiClient = {
  /**
   * OpenAI client instance
   */
  client: null,
  config: null,

  /**
   * Initialize the OpenAI client with API key
   * @param {string} apiKey - OpenAI API key
   */
  initialize: function(apiKey) {
    if (!apiKey) {
      console.error('OpenAI API key is required');
      return false;
    }
    
    try {
      this.config = new Configuration({
        apiKey: apiKey
      });
      this.client = new OpenAIApi(this.config);
      return true;
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      return false;
    }
  },

  /**
   * Check if OpenAI client is configured
   * @returns {boolean} Whether the client is configured
   */
  isConfigured: function() {
    return !!this.client;
  },

  /**
   * Create an embedding for text
   * @param {string} text - Text to create embedding for
   * @param {string} model - OpenAI model to use for embedding
   * @returns {Promise<Array<number>>} - Embedding vector
   */
  createEmbedding: async function(text, model = 'text-embedding-ada-002') {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.createEmbedding({
        model: model,
        input: text
      });
      
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  },

  /**
   * Create a chat completion
   * @param {Array<Object>} messages - Chat messages
   * @param {string} model - OpenAI model to use
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Generated text
   */
  createChatCompletion: async function(messages, model = 'gpt-4-turbo', options = {}) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.createChatCompletion({
        model: model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        top_p: options.top_p || 1.0,
        frequency_penalty: options.frequency_penalty || 0,
        presence_penalty: options.presence_penalty || 0,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error creating chat completion:', error);
      throw error;
    }
  }
};

module.exports = {
  openaiClient
};