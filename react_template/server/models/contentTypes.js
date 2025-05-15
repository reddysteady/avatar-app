// server/models/contentTypes.js
/**
 * Content type definitions for the RAG pipeline
 */
const ContentTypes = {
  YOUTUBE_VIDEO: 'youtube_video',
  YOUTUBE_CHANNEL: 'youtube_channel',
  INSTAGRAM_POST: 'instagram_post',
  INSTAGRAM_ACCOUNT: 'instagram_account',
  CUSTOM_TEXT: 'custom_text',
};

/**
 * Validate if a string is a valid content type
 * @param {string} type - The content type to validate
 * @returns {boolean} - Whether the type is valid
 */
const isValidContentType = (type) => {
  return Object.values(ContentTypes).includes(type);
};

module.exports = {
  ContentTypes,
  isValidContentType
};