// Mock API functions in place of real backend calls
const mockLogin = async (email, password) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would be an API call
  if (email === 'demo@example.com' && password === 'password') {
    return {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      token: 'mock-jwt-token'
    };
  }
  
  throw new Error('Invalid credentials');
};

const mockRegister = async (name, email, password) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would be an API call
  return {
    id: '1',
    name,
    email,
    token: 'mock-jwt-token'
  };
};

const mockConnectSocialAccount = async (platform, authParams) => {
  // For Instagram, use our Instagram service
  if (platform === 'instagram') {
    try {
      // Import Instagram service
      const instagramService = await import('./instagramService').then(module => module.default);
      
      // Handle OAuth callback if code is provided
      if (authParams?.code && authParams?.state) {
        return await instagramService.handleAuthCode(authParams.code, authParams.state);
      }
      
      // Otherwise prepare for auth
      return {
        success: true,
        platform,
        authUrl: instagramService.getAuthUrl()
      };
    } catch (error) {
      console.error('Instagram auth error:', error);
      throw error;
    }
  }
  
  // For other platforms, simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real app, this would initiate OAuth flow
  return { 
    success: true, 
    platform 
  };
};

// Auth service exports
export const login = async (email, password) => {
  try {
    const user = await mockLogin(email, password);
    localStorage.setItem('avatarAppUser', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (name, email, password) => {
  try {
    const user = await mockRegister(name, email, password);
    localStorage.setItem('avatarAppUser', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('avatarAppUser');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('avatarAppUser');
  return user ? JSON.parse(user) : null;
};

export const connectSocialAccount = async (platform, authParams) => {
  try {
    const result = await mockConnectSocialAccount(platform, authParams);
    return result;
  } catch (error) {
    console.error(`Error connecting ${platform}:`, error);
    throw error;
  }
};