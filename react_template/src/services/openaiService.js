/**
 * Service for interfacing with OpenAI's API to generate AI responses
 * based on the avatar's personality and configured rules
 */

// Constants for API
const OPENAI_API_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o'; // Default to GPT-4o, but can be configured

/**
 * OpenAI service for handling message processing and AI response generation
 */
const openaiService = {
  /**
   * Initialize the OpenAI configuration
   * @param {string} apiKey - The OpenAI API key
   */
  initialize: (apiKey) => {
    const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) {
      console.warn('OpenAI API key is not provided and not found in environment variables');
      return false;
    }
    localStorage.setItem('openai_api_key', key);
    console.log('OpenAI service initialized');
    return true;
  },

  /**
   * Check if the OpenAI service is configured with an API key
   * @returns {boolean} True if the API key is configured
   */
  isConfigured: () => {
    return !!localStorage.getItem('openai_api_key');
  },

  /**
   * Get the configured API key
   * @returns {string|null} The API key or null if not configured
   */
  getApiKey: () => {
    return localStorage.getItem('openai_api_key');
  },

  /**
   * Create a prompt based on the avatar's configuration and the incoming message
   * @param {object} avatarConfig - The avatar configuration (personality, tone, etc.)
   * @param {object} message - The incoming message to respond to
   * @param {array} conversationHistory - Previous messages in the conversation
   * @returns {object} The formatted prompt for the OpenAI API
   */
  createPrompt: (avatarConfig, message, conversationHistory = []) => {
    // Extract avatar configuration
    const {
      name = 'AI Assistant',
      tone = 'friendly',
      personality = 'helpful',
      expertise = [],
      responseLength = 'medium',
      moderationRules = [],
    } = avatarConfig || {};

    // Format conversation history
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.isFromUser ? 'user' : 'assistant',
      content: msg.content
    }));

    // Build system instructions
    let systemInstruction = `You are ${name}, a ${personality} assistant with expertise in ${expertise.join(', ') || 'general topics'}. 
    You should respond in a ${tone} tone.`;

    // Add moderation rules
    if (moderationRules && moderationRules.length > 0) {
      systemInstruction += `\n\nImportant moderation rules to follow:`;
      moderationRules.forEach(rule => {
        systemInstruction += `\n- ${rule}`;
      });
    }

    // Add response length guidance
    const lengthMap = {
      short: 'Keep your responses concise and to the point, ideally 1-2 sentences.',
      medium: 'Provide moderate-length responses with enough detail to be helpful.',
      long: 'Feel free to provide detailed responses with thorough explanations.'
    };
    
    systemInstruction += `\n\n${lengthMap[responseLength] || lengthMap.medium}`;

    // Create the messages array for the API call
    const messages = [
      { role: 'system', content: systemInstruction },
      ...formattedHistory,
      { role: 'user', content: message.content }
    ];

    return messages;
  },

  /**
   * Generate an AI response using the OpenAI API
   * @param {object} avatarConfig - The avatar configuration
   * @param {object} message - The message to respond to
   * @param {array} conversationHistory - Previous messages in the conversation
   * @returns {Promise<string>} The AI-generated response
   */
  generateResponse: async (avatarConfig, message, conversationHistory = []) => {
    try {
      const apiKey = openaiService.getApiKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const messages = openaiService.createPrompt(avatarConfig, message, conversationHistory);
      
      // Model selection based on avatar configuration
      const model = avatarConfig?.preferredModel || DEFAULT_MODEL;
      
      // Temperature controls randomness (0-2): lower for deterministic, higher for creative
      const temperature = avatarConfig?.creativity === 'high' ? 1.0 : 
                         avatarConfig?.creativity === 'low' ? 0.3 : 0.7;

      const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: avatarConfig?.maxResponseLength || 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  },

  /**
   * Check if a message violates content policies before sending
   * @param {string} content - The message content to moderate
   * @returns {Promise<object>} Moderation result with flagged categories if any
   */
  moderateContent: async (content) => {
    try {
      const apiKey = openaiService.getApiKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch(`${OPENAI_API_URL}/moderations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          input: content
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Moderation API error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return {
        flagged: result.results[0].flagged,
        categories: result.results[0].categories,
        categoryScores: result.results[0].category_scores
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }
};

export default openaiService;