import { mockAnalyticsData } from '../mockData/analytics';
import { createContext, useContext, useCallback } from 'react';

// Mock API functions in place of real backend calls
const fetchMessageMetrics = async (userId, dateRange) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // In a real app, this would be an API call with the date range params
  return mockAnalyticsData.messageMetrics;
};

const fetchResponseMetrics = async (userId, dateRange) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would be an API call with the date range params
  return mockAnalyticsData.responseMetrics;
};

const fetchPlatformBreakdown = async (userId, dateRange) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // In a real app, this would be an API call with the date range params
  return mockAnalyticsData.platformBreakdown;
};

const fetchMessageCategories = async (userId, dateRange) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 450));
  
  // In a real app, this would be an API call with the date range params
  return mockAnalyticsData.messageCategories;
};

// Create analytics context
const AnalyticsContext = createContext();

// Analytics provider component
export const AnalyticsProvider = ({ children }) => {
  const getMessageMetrics = useCallback(async (userId, dateRange) => {
    try {
      return await fetchMessageMetrics(userId, dateRange);
    } catch (error) {
      console.error('Error fetching message metrics:', error);
      throw error;
    }
  }, []);

  const getResponseMetrics = useCallback(async (userId, dateRange) => {
    try {
      return await fetchResponseMetrics(userId, dateRange);
    } catch (error) {
      console.error('Error fetching response metrics:', error);
      throw error;
    }
  }, []);

  const getPlatformBreakdown = useCallback(async (userId, dateRange) => {
    try {
      return await fetchPlatformBreakdown(userId, dateRange);
    } catch (error) {
      console.error('Error fetching platform breakdown:', error);
      throw error;
    }
  }, []);

  const getMessageCategories = useCallback(async (userId, dateRange) => {
    try {
      return await fetchMessageCategories(userId, dateRange);
    } catch (error) {
      console.error('Error fetching message categories:', error);
      throw error;
    }
  }, []);

  return (
    <AnalyticsContext.Provider value={{
      getMessageMetrics,
      getResponseMetrics,
      getPlatformBreakdown,
      getMessageCategories
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook to use analytics context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};