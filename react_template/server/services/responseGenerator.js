// server/services/responseGenerator.js
const { openaiClient } = require('./openaiClient');

/**
 * Response generator service for the RAG pipeline
 * Generates AI responses based on retrieved content and avatar personality
 */
const responseGenerator = {
  /**
   * Default system prompt format for generating responses
   */
  defaultSystemPrompt: `You are an AI assistant that provides helpful, accurate, and concise responses. 
Use the provided context to answer the user's question. 
If the context doesn't contain relevant information, say that you don't have enough information and suggest what might help.
Don't make up information that isn't supported by the context.
Always maintain a friendly, helpful tone.`,

  /**
   * Format for context to be added to the prompt
   */
  contextFormat: `
----- CONTEXT START -----
{context}
----- CONTEXT END -----
`,

  /**
   * Generate a response to a user query using retrieved context
   * @param {string} query - User query
   * @param {Array<string>} contextTexts - Retrieved context texts
   * @param {Object} avatarConfig - Avatar configuration for personalization
   * @returns {Promise<string>} - Generated response
   */
  generateResponse: async function(query, contextTexts = [], avatarConfig = {}) {
    if (!openaiClient.isConfigured()) {
      throw new Error('OpenAI client not initialized');
    }
    
    try {
      // Combine context texts if any
      let contextSection = '';
      if (contextTexts && contextTexts.length > 0) {
        const combinedContext = contextTexts.join('\n\n---\n\n');
        contextSection = this.contextFormat.replace('{context}', combinedContext);
      }
      
      // Personalize system prompt based on avatar config
      const systemPrompt = this.buildSystemPrompt(avatarConfig);
      
      // Prepare messages for OpenAI
      const messages = [
        {
          role: 'system',
          content: systemPrompt + contextSection
        },
        {
          role: 'user',
          content: query
        }
      ];
      
      // Generate completion
      const response = await openaiClient.createChatCompletion(
        messages,
        avatarConfig.model || 'gpt-4-turbo',
        {
          temperature: avatarConfig.temperature || 0.7,
          max_tokens: avatarConfig.maxTokens || 1000
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Sorry, I encountered an error while generating a response. Please try again later.';
    }
  },

  /**
   * Build a personalized system prompt based on avatar configuration
   * @param {Object} avatarConfig - Avatar configuration
   * @returns {string} - Personalized system prompt
   */
  buildSystemPrompt: function(avatarConfig = {}) {
    // If no avatar config or personality, use default
    if (!avatarConfig || Object.keys(avatarConfig).length === 0) {
      return this.defaultSystemPrompt;
    }
    
    // Extract avatar personality settings
    const {
      name,
      description,
      tone,
      writingStyle,
      knowledgeLevel,
      personality,
      customInstructions
    } = avatarConfig;
    
    let prompt = `You are ${name || 'an AI assistant'}`;
    
    if (description) {
      prompt += `, ${description}`;
    }
    
    prompt += '.\n\n';
    
    // Add tone and writing style
    if (tone) {
      prompt += `Maintain a ${tone} tone in your responses. `;
    }
    
    if (writingStyle) {
      prompt += `Write in a ${writingStyle} style. `;
    }
    
    prompt += '\n\n';
    
    // Add knowledge level
    if (knowledgeLevel) {
      prompt += `Your expertise level is ${knowledgeLevel}. `;
      
      if (knowledgeLevel.toLowerCase() === 'expert') {
        prompt += 'Use domain-specific terminology where appropriate. ';
      } else if (knowledgeLevel.toLowerCase() === 'beginner') {
        prompt += 'Explain concepts in simple terms. ';
      }
      
      prompt += '\n\n';
    }
    
    // Add personality traits
    if (personality) {
      prompt += `Your personality traits include: ${personality}. Reflect these traits in your responses.\n\n`;
    }
    
    // Add instructions for handling context
    prompt += `Use the provided context to answer the user's question. 
If the context doesn't contain relevant information, say that you don't have enough information and suggest what might help.
Don't make up information that isn't supported by the context.\n\n`;
    
    // Add custom instructions if provided
    if (customInstructions) {
      prompt += `${customInstructions}\n\n`;
    }
    
    return prompt;
  },
  
  /**
   * Generate a summary of content
   * @param {string} content - Content to summarize
   * @param {number} maxLength - Maximum length of summary in characters
   * @returns {Promise<string>} - Generated summary
   */
  generateSummary: async function(content, maxLength = 200) {
    if (!openaiClient.isConfigured()) {
      throw new Error('OpenAI client not initialized');
    }
    
    try {
      const messages = [
        {
          role: 'system',
          content: `Summarize the following text concisely in ${maxLength} characters or less. Capture the key points while maintaining accuracy.`
        },
        {
          role: 'user',
          content: content
        }
      ];
      
      const summary = await openaiClient.createChatCompletion(
        messages,
        'gpt-3.5-turbo',
        {
          temperature: 0.5,
          max_tokens: 100
        }
      );
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return content.substring(0, maxLength) + '...';
    }
  }
};

module.exports = {
  responseGenerator
};