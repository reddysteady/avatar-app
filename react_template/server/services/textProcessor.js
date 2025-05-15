// server/services/textProcessor.js
/**
 * Text processor service for the RAG pipeline
 * Handles text cleaning, chunking, and preprocessing
 */
const textProcessor = {
  /**
   * Clean text by removing excessive whitespace, etc.
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  cleanText: function(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
      .replace(/\n+/g, '\n')        // Replace multiple newlines with single newline
      .replace(/\t+/g, ' ')         // Replace tabs with spaces
      .replace(/\r/g, '')          // Remove carriage returns
      .trim();                     // Trim whitespace from start and end
  },

  /**
   * Clean a transcript by removing timestamps, speaker labels, etc.
   * @param {string} transcript - Transcript to clean
   * @returns {string} - Cleaned transcript
   */
  cleanTranscript: function(transcript) {
    if (!transcript) return '';
    
    return transcript
      .replace(/\[\d+:\d+:\d+\]/g, '')          // Remove timestamps like [00:01:23]
      .replace(/\(\d+:\d+\)/g, '')               // Remove timestamps like (01:23)
      .replace(/^Speaker \d+:?\s*/gm, '')        // Remove speaker labels
      .replace(/^[A-Z][a-z]+:?\s*/gm, '')        // Remove potential speaker names
      .replace(/\s+/g, ' ')                      // Replace multiple spaces
      .replace(/\n+/g, '\n')                     // Replace multiple newlines
      .trim();                                   // Trim whitespace
  },

  /**
   * Split text into chunks with option for overlap
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Maximum size of each chunk
   * @param {number} overlap - Number of characters to overlap between chunks
   * @returns {Array<Object>} - Array of chunks with text and position info
   */
  chunkText: function(text, chunkSize = 1500, overlap = 150) {
    if (!text) return [];
    
    const chunks = [];
    let startChar = 0;
    
    // If text is smaller than chunk size, return as single chunk
    if (text.length <= chunkSize) {
      return [{
        text: text,
        startChar: 0,
        endChar: text.length
      }];
    }
    
    while (startChar < text.length) {
      // Calculate end position
      let endChar = startChar + chunkSize;
      
      // If we're not at the end, try to break at a sentence or paragraph boundary
      if (endChar < text.length) {
        // Look for paragraph break
        const paraBreak = text.lastIndexOf('\n\n', endChar);
        // Look for sentence break (period followed by space)
        const sentenceBreak = text.lastIndexOf('. ', endChar);
        
        // Prefer paragraph breaks if they're not too far back
        if (paraBreak > startChar && paraBreak > endChar - 200) {
          endChar = paraBreak + 1;
        } 
        // Otherwise use sentence breaks
        else if (sentenceBreak > startChar && sentenceBreak > endChar - 100) {
          endChar = sentenceBreak + 1;
        }
      } else {
        // If we're at the end, just use the full text length
        endChar = text.length;
      }
      
      // Extract chunk
      const chunkText = text.substring(startChar, endChar).trim();
      
      // Add to chunks list if not empty
      if (chunkText) {
        chunks.push({
          text: chunkText,
          startChar: startChar,
          endChar: endChar
        });
      }
      
      // Move start position for next chunk, accounting for overlap
      startChar = endChar - overlap;
      
      // Safety check to prevent infinite loop
      if (startChar >= text.length) break;
    }
    
    return chunks;
  },

  /**
   * Estimate the token count for a given text
   * Using a rough approximation of 4 characters per token
   * @param {string} text - Text to estimate token count for
   * @returns {number} - Estimated token count
   */
  estimateTokenCount: function(text) {
    if (!text) return 0;
    
    // Rough estimate: 1 token = ~4 characters for English text
    return Math.ceil(text.length / 4);
  },
  
  /**
   * Extract keywords from text
   * @param {string} text - Text to extract keywords from
   * @param {number} maxKeywords - Maximum number of keywords to extract
   * @returns {Array<string>} - Array of keywords
   */
  extractKeywords: function(text, maxKeywords = 10) {
    if (!text) return [];
    
    // Remove common stop words
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
      'which', 'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than',
      'such', 'both', 'through', 'about', 'for', 'is', 'of', 'while', 'during',
      'to', 'from', 'in', 'out', 'on', 'off', 'with'
    ]);
    
    // Split into words, filter out stop words, convert to lowercase
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(entry => entry[0]);
  }
};

module.exports = {
  textProcessor
};