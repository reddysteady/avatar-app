import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as avatarService from '../services/avatarService';
import openaiService from '../services/openaiService';
import axios from 'axios';

// Create the avatar context
const AvatarContext = createContext();

export const AvatarProvider = ({ children }) => {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load avatar settings when user is authenticated
  useEffect(() => {
    const fetchAvatarSettings = async () => {
      if (!user) {
        setAvatar(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const settings = await avatarService.getAvatarSettings(user.id);
        setAvatar(settings);
      } catch (error) {
        console.error('Error loading avatar settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatarSettings();
  }, [user]);

  // Update avatar settings
  const updateAvatarSettings = useCallback(async (settings) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const updatedSettings = await avatarService.updateAvatarSettings(user.id, settings);
      setAvatar(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating avatar settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Train avatar on user's content
  const trainAvatar = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await avatarService.trainAvatar(user.id);
      return result;
    } catch (error) {
      console.error('Error training avatar:', error);
      throw error;
    }
  }, [user]);

  // Check if avatar is training
  const isTrainingAvatar = useCallback(() => {
    return avatarService.isAvatarTraining();
  }, []);

  // Toggle avatar active status
  const toggleAvatarActive = useCallback(async (isActive) => {
    if (!user) return;
    
    try {
      await avatarService.toggleAvatarActive(user.id, isActive);
      setAvatar(prev => prev ? { ...prev, isActive } : null);
    } catch (error) {
      console.error('Error toggling avatar active status:', error);
      throw error;
    }
  }, [user]);

  // Configure OpenAI with API key
  const configureOpenAI = useCallback(async (apiKey) => {
    try {
      openaiService.initialize(apiKey);
      
      // Update avatar settings to indicate OpenAI is configured
      if (user && avatar) {
        await updateAvatarSettings({
          ...avatar,
          aiConfigured: true,
          aiProvider: 'openai'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error configuring OpenAI:', error);
      throw error;
    }
  }, [user, avatar, updateAvatarSettings]);
  
  // Generate AI response to a message
  const generateAIResponse = useCallback(async (message, conversationHistory = []) => {
    if (!avatar) {
      throw new Error('Avatar settings not available');
    }
    
    if (!openaiService.isConfigured()) {
      throw new Error('OpenAI is not configured with an API key');
    }
    
    try {
      return await openaiService.generateResponse(avatar, message, conversationHistory);
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }, [avatar]);
  
  // Check if OpenAI is configured
  const isOpenAIConfigured = useCallback(() => {
    return openaiService.isConfigured();
  }, []);

  // Moderate content using OpenAI's moderation API
  const moderateContent = useCallback(async (content) => {
    if (!openaiService.isConfigured()) {
      throw new Error('OpenAI is not configured with an API key');
    }
    
    try {
      return await openaiService.moderateContent(content);
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }, []);

  // RAG Pipeline Methods
  const checkRAGStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/rag/status');
      return response.data;
    } catch (error) {
      console.error('Error checking RAG status:', error);
      return {
        status: 'error',
        ready: false,
        message: error.response?.data?.message || error.message
      };
    }
  }, []);

  const queryRAG = useCallback(async (message, influencerId = null) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!influencerId && avatar) {
      influencerId = avatar.id || user.id;
    }

    try {
      const response = await axios.post('/api/rag/query', {
        message,
        influencerId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error querying RAG pipeline:', error);
      throw error;
    }
  }, [user, avatar]);

  const ingestContent = useCallback(async (sourceType, sourceId, metadata = {}, options = {}) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const influencerId = avatar?.id || user.id;

    try {
      const response = await axios.post('/api/rag/ingest', {
        sourceType,
        sourceId,
        influencerId,
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
  }, [user, avatar]);

  const getInfluencerContent = useCallback(async (influencerId = null) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!influencerId && avatar) {
      influencerId = avatar.id || user.id;
    }

    try {
      const response = await axios.get(`/api/rag/content/${influencerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting influencer content:', error);
      throw error;
    }
  }, [user, avatar]);

  const deleteContent = useCallback(async (contentId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await axios.delete(`/api/rag/content/${contentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }, [user]);

  // Provide avatar context value
  const value = {
    avatar,
    loading,
    updateAvatarSettings,
    trainAvatar,
    isTrainingAvatar,
    toggleAvatarActive,
    configureOpenAI,
    generateAIResponse,
    isOpenAIConfigured,
    moderateContent,
    // RAG Pipeline methods
    checkRAGStatus,
    queryRAG,
    ingestContent,
    getInfluencerContent,
    deleteContent
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
};

// Hook to use avatar context
export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
};