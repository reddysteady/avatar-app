import React, { createContext, useContext, useState, useCallback } from 'react';
import * as messageService from '../services/messageService';
import { useAvatar } from './AvatarContext';

// Create the message context
const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { avatar, generateAIResponse, isOpenAIConfigured } = useAvatar();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  // Get all messages with optional filters
  const getMessages = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await messageService.getMessages(filters);
      setMessages(data);
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a single message by ID
  const getMessage = useCallback(async (messageId) => {
    try {
      return await messageService.getMessage(messageId);
    } catch (error) {
      console.error('Error fetching message details:', error);
      return null;
    }
  }, []);

  // Update a message
  const updateMessage = useCallback(async (messageId, updates) => {
    try {
      const updatedMessage = await messageService.updateMessage(messageId, updates);
      
      // Update local state if the message exists in it
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        )
      );
      
      return updatedMessage;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }, []);

  // Mark a message as read
  const markAsRead = useCallback(async (messageId) => {
    try {
      const updatedMessage = await messageService.markAsRead(messageId);
      
      // Update local state if the message exists in it
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      
      return updatedMessage;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }, []);

  // Send a response to a message
  const sendResponse = useCallback(async (messageId, responseText, isAIApproved = false) => {
    try {
      const updatedMessage = await messageService.sendResponse(messageId, responseText, isAIApproved);
      
      // Update local state if the message exists in it
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        )
      );
      
      return updatedMessage;
    } catch (error) {
      console.error('Error sending response:', error);
      throw error;
    }
  }, []);
  
  // Generate and send an AI response
  const sendAIResponse = useCallback(async (messageId) => {
    // Check if AI is configured and avatar is active
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI is not configured. Please add an API key in Avatar Settings.');
    }
    
    if (!avatar || !avatar.isActive) {
      throw new Error('Avatar is not active. Please activate your avatar in settings.');
    }
    
    try {
      setAiProcessing(true);
      
      // Get message details
      const message = await getMessage(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Get conversation history if needed
      let conversationHistory = [];
      if (message.threadId) {
        const threadMessages = await messageService.getThreadMessages(message.threadId);
        conversationHistory = threadMessages.filter(msg => msg.id !== messageId);
      }
      
      // Generate AI response
      const aiResponseText = await generateAIResponse(message, conversationHistory);
      
      // Send the AI-generated response
      const updatedMessage = await sendResponse(messageId, aiResponseText, true);
      return updatedMessage;
    } catch (error) {
      console.error('Error generating/sending AI response:', error);
      throw error;
    } finally {
      setAiProcessing(false);
    }
  }, [avatar, getMessage, generateAIResponse, isOpenAIConfigured, sendResponse]);

  // Get unread messages count
  const getUnreadMessagesCount = useCallback(async () => {
    try {
      return await messageService.getUnreadMessagesCount();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { total: 0, pending: 0 };
    }
  }, []);

  // Get recent messages
  const getRecentMessages = useCallback(async (limit = 5) => {
    try {
      return await messageService.getRecentMessages(limit);
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return [];
    }
  }, []);

  // Provide message context value
  const value = {
    messages,
    loading,
    aiProcessing,
    getMessages,
    getMessage,
    updateMessage,
    markAsRead,
    sendResponse,
    sendAIResponse,
    getUnreadMessagesCount,
    getRecentMessages
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

// Hook to use message context
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};