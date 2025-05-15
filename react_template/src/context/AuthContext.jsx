import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

// Create the authentication context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const user = await authService.login(email, password);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (name, email, password) => {
    try {
      const user = await authService.register(name, email, password);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Connect social media account
  const connectSocialAccount = useCallback(async (platform, authParams) => {
    try {
      if (!user && platform !== 'instagram') throw new Error('User not authenticated');
      
      // For Instagram, use our enhanced flow
      const result = await authService.connectSocialAccount(platform, authParams);
      
      // If connection was successful, update user state
      if (result && result.connected) {
        setUser(prevUser => ({
          ...prevUser,
          connectedAccounts: {
            ...(prevUser?.connectedAccounts || {}),
            [platform]: true
          }
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error);
      throw error;
    }
  }, [user]);

  // Provide auth context value
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    connectSocialAccount,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};