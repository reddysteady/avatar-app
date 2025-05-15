// server/services/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase client service for the RAG pipeline
 */
const supabaseClient = {
  /**
   * Supabase client instance
   */
  client: null,

  /**
   * Initialize the Supabase client
   * @param {string} url - Supabase URL
   * @param {string} key - Supabase API key
   * @returns {boolean} - Whether initialization was successful
   */
  initialize: function(url, key) {
    if (!url || !key) {
      console.error('Supabase URL and key are required');
      return false;
    }
    
    try {
      this.client = createClient(url, key);
      return true;
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      return false;
    }
  },

  /**
   * Check if Supabase client is configured
   * @returns {boolean} - Whether the client is configured
   */
  isConfigured: function() {
    return !!this.client;
  },

  /**
   * Setup the database schema for RAG pipeline
   * This creates the necessary tables and functions if they don't exist
   * @returns {Promise<boolean>} - Whether setup was successful
   */
  setupSchema: async function() {
    if (!this.client) {
      console.error('Supabase client not initialized');
      return false;
    }

    try {
      // Create vector extension if it doesn't exist
      await this.client.rpc('create_vector_extension_if_not_exists');

      // Create content_chunks table for storing embeddings
      const { error: tableError } = await this.client.query(`
        CREATE TABLE IF NOT EXISTS content_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL,
          content_type VARCHAR NOT NULL,
          content_id VARCHAR NOT NULL,
          content_source VARCHAR,
          chunk_index INTEGER DEFAULT 0,
          chunk_text TEXT NOT NULL,
          metadata JSONB,
          embedding VECTOR(1536),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      
      if (tableError) throw tableError;

      // Create content_sources table
      const { error: sourcesError } = await this.client.query(`
        CREATE TABLE IF NOT EXISTS content_sources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL,
          source_type VARCHAR NOT NULL,
          source_url VARCHAR,
          source_name VARCHAR NOT NULL,
          included_video_ids JSONB,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      
      if (sourcesError) throw sourcesError;

      // Create chat_history table
      const { error: historyError } = await this.client.query(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL,
          user_query TEXT NOT NULL,
          query_embedding VECTOR(1536),
          system_response TEXT NOT NULL,
          retrieved_chunk_ids UUID[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      
      if (historyError) throw historyError;

      // Create index on user_id
      const { error: indexError } = await this.client.query(`
        CREATE INDEX IF NOT EXISTS content_chunks_user_id_idx ON content_chunks (user_id);
        CREATE INDEX IF NOT EXISTS content_sources_user_id_idx ON content_sources (user_id);
        CREATE INDEX IF NOT EXISTS chat_history_user_id_idx ON chat_history (user_id);
      `);
      
      if (indexError) throw indexError;

      // Create function to match content chunks
      const { error: functionError } = await this.client.query(`
        CREATE OR REPLACE FUNCTION match_content_chunks(
          query_embedding VECTOR(1536),
          match_threshold FLOAT,
          match_count INT,
          user_id_input VARCHAR
        ) RETURNS TABLE(
          id UUID,
          content_id VARCHAR,
          content_type VARCHAR,
          content_text TEXT,
          metadata JSONB,
          similarity FLOAT
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            content_chunks.id,
            content_chunks.content_id,
            content_chunks.content_type,
            content_chunks.chunk_text as content_text,
            content_chunks.metadata,
            1 - (content_chunks.embedding <=> query_embedding) as similarity
          FROM content_chunks
          WHERE 
            user_id = user_id_input 
            AND 1 - (embedding <=> query_embedding) > match_threshold
          ORDER BY similarity DESC
          LIMIT match_count;
        END;
        $$;
      `);
      
      if (functionError) throw functionError;

      console.log('Supabase schema setup successfully');
      return true;
    } catch (error) {
      console.error('Error setting up Supabase schema:', error);
      return false;
    }
  },

  /**
   * Helper function to create vector extension
   * @returns {Promise<void>}
   */
  createVectorExtension: async function() {
    try {
      await this.client.rpc('create_vector_extension_if_not_exists');
    } catch (error) {
      console.error('Error creating vector extension:', error);
      throw error;
    }
  }
};

module.exports = {
  supabaseClient
};