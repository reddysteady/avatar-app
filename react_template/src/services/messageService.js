import { mockMessages } from '../mockData/messages';

// Mock API functions in place of real backend calls
// This would be replaced with actual API calls in a production app
const fetchMessages = async (filters = {}) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredMessages = [...mockMessages];
  
  // Apply filters
  if (filters.platform && filters.platform !== 'all') {
    filteredMessages = filteredMessages.filter(msg => msg.platform.toLowerCase() === filters.platform.toLowerCase());
  }
  
  if (filters.status && filters.status !== 'all') {
    filteredMessages = filteredMessages.filter(msg => msg.status === filters.status);
  }
  
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredMessages = filteredMessages.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm) || 
      msg.senderName.toLowerCase().includes(searchTerm)
    );
  }
  
  return filteredMessages;
};

const fetchMessage = async (messageId) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const message = mockMessages.find(msg => msg.id === messageId);
  return message || null;
};

const mockUpdateMessage = async (messageId, updates) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a real app, this would be an API call
  const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
  if (messageIndex >= 0) {
    mockMessages[messageIndex] = { 
      ...mockMessages[messageIndex], 
      ...updates
    };
    return mockMessages[messageIndex];
  }
  return null;
};

const mockSendResponse = async (messageId, responseText, isAIApproved = false) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would be an API call
  const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
  if (messageIndex >= 0) {
    mockMessages[messageIndex] = { 
      ...mockMessages[messageIndex], 
      response: responseText,
      status: 'RESPONDED',
      isAutoResponded: isAIApproved,
      respondedAt: new Date().toISOString()
    };
    return mockMessages[messageIndex];
  }
  return null;
};

const mockGetUnreadCount = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const total = mockMessages.filter(msg => !msg.isRead).length;
  const pending = mockMessages.filter(msg => msg.status === 'AWAITING_REVIEW').length;
  
  return { total, pending };
};

// Message service exports
export const getMessages = async (filters = {}) => {
  try {
    // Check if requesting Instagram messages specifically
    if (filters.platform && filters.platform.toLowerCase() === 'instagram') {
      try {
        // Try to use real Instagram API
        const { getAllMessages, isAuthenticated } = await import('./instagramService');
        
        if (isAuthenticated()) {
          // Use real Instagram API
          return await getAllMessages(filters);
        }
      } catch (instagramError) {
        console.warn('Failed to fetch real Instagram messages, falling back to mock data:', instagramError);
      }
    }
    
    // Fall back to mock data for all other cases
    return await fetchMessages(filters);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const getMessage = async (messageId) => {
  try {
    return await fetchMessage(messageId);
  } catch (error) {
    console.error('Error fetching message details:', error);
    throw error;
  }
};

export const updateMessage = async (messageId, updates) => {
  try {
    return await mockUpdateMessage(messageId, updates);
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

export const markAsRead = async (messageId) => {
  try {
    return await mockUpdateMessage(messageId, { isRead: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

export const sendResponse = async (messageId, responseText, isAIApproved = false) => {
  try {
    // Get the message details first to determine if it's from Instagram
    const message = await getMessage(messageId);
    
    if (message && message.platform && message.platform.toLowerCase() === 'instagram') {
      try {
        // Try to use real Instagram API
        const { sendResponse: sendInstagramResponse, isAuthenticated } = await import('./instagramService');
        
        if (isAuthenticated()) {
          // Use real Instagram API for Instagram messages
          const result = await sendInstagramResponse(
            messageId, 
            responseText, 
            message.isComment, 
            message.conversationId
          );
          
          // Update local message status after successful API call
          return await mockUpdateMessage(messageId, {
            response: responseText,
            status: 'RESPONDED',
            isAutoResponded: isAIApproved,
            respondedAt: new Date().toISOString()
          });
        }
      } catch (instagramError) {
        console.warn('Failed to send response via Instagram API, falling back to mock:', instagramError);
      }
    }
    
    // Fall back to mock implementation for all other cases
    return await mockSendResponse(messageId, responseText, isAIApproved);
  } catch (error) {
    console.error('Error sending response:', error);
    throw error;
  }
};

export const getUnreadMessagesCount = async () => {
  try {
    return await mockGetUnreadCount();
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

export const getRecentMessages = async (limit = 5) => {
  try {
    const messages = await fetchMessages();
    return messages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    throw error;
  }
};

// Get messages in a thread/conversation for AI context
export const getThreadMessages = async (threadId, limit = 10) => {
  try {
    // In a real app, this would call the API with the threadId
    // For mock implementation, filter messages by threadId
    const messages = await fetchMessages();
    return messages
      .filter(msg => msg.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Chronological order
      .slice(-limit); // Get the last 'limit' messages
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    throw error;
  }
};