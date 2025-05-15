import axios from 'axios';
import { supabase } from './supabaseClient';

/**
 * Service for interacting with the RAG pipeline
 */
const ragService = {
  /**
   * Check if the RAG pipeline is ready
   * @returns {Promise<Object>} Status information
   */
  checkStatus: async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/rag/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking RAG status:', error);
      return {
        status: 'error',
        ready: false,
        message: error.response?.data?.message || error.message
      };
    }
  },
  
  /**
   * Ingest content into the RAG pipeline
   * @param {string} sourceType - Type of content source
   * @param {string} sourceId - URL or ID of the content
   * @param {string} userId - User ID
   * @param {Object} metadata - Additional metadata
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Ingestion result
   */
  ingestContent: async (sourceType, sourceId, userId, metadata = {}, options = {}) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/rag/ingest`, {
        sourceType,
        sourceId,
        userId,
        metadata,
        options
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error ingesting content:', error);
      throw error;
    }
  },
  
  /**
   * Query the RAG pipeline
   * @param {string} message - User query
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result with AI response
   */
  queryRag: async (message, userId, options = {}) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/rag/query`, {
        message,
        userId,
        options
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error querying RAG:', error);
      throw error;
    }
  },
  
  /**
   * Get content sources for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<Object>>} List of content sources
   */
  getUserContentSources: async (userId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/rag/content/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.contentSources;
    } catch (error) {
      console.error('Error getting user content sources:', error);
      throw error;
    }
  },
  
  /**
   * Delete content by ID
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteContent: async (contentId, userId) => {
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/rag/content/${contentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  },
  
  /**
   * Direct access to Supabase for advanced queries
   */
  supabase
};

export default ragService;