import { mockAvatarConfig } from '../mockData/avatarConfig';

// Mock API functions in place of real backend calls
const fetchAvatarSettings = async (userId) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would fetch data from an API
  return { ...mockAvatarConfig };
};

const mockUpdateAvatarSettings = async (userId, settings) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  // In a real app, this would update data via an API
  Object.assign(mockAvatarConfig, settings);
  return { ...mockAvatarConfig };
};

const mockTrainAvatar = async (userId) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would trigger a training process
  mockAvatarConfig.isTraining = true;
  mockAvatarConfig.trainingStartedAt = new Date().toISOString();
  
  // Simulate delayed training completion
  setTimeout(() => {
    mockAvatarConfig.isTraining = false;
    mockAvatarConfig.lastTrainingDate = new Date().toISOString();
  }, 10000); // 10 seconds for demo
  
  return { success: true };
};

const mockToggleAvatarActive = async (userId, isActive) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a real app, this would toggle via an API
  mockAvatarConfig.isActive = isActive;
  return { success: true, isActive };
};

// Avatar service exports
export const getAvatarSettings = async (userId) => {
  try {
    return await fetchAvatarSettings(userId);
  } catch (error) {
    console.error('Error fetching avatar settings:', error);
    throw error;
  }
};

export const updateAvatarSettings = async (userId, settings) => {
  try {
    return await mockUpdateAvatarSettings(userId, settings);
  } catch (error) {
    console.error('Error updating avatar settings:', error);
    throw error;
  }
};

export const trainAvatar = async (userId) => {
  try {
    return await mockTrainAvatar(userId);
  } catch (error) {
    console.error('Error starting avatar training:', error);
    throw error;
  }
};

export const isAvatarTraining = () => {
  return mockAvatarConfig.isTraining || false;
};

export const toggleAvatarActive = async (userId, isActive) => {
  try {
    return await mockToggleAvatarActive(userId, isActive);
  } catch (error) {
    console.error('Error toggling avatar status:', error);
    throw error;
  }
};