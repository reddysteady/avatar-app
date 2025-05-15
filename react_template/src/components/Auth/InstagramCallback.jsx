import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../Layout/MainLayout';

/**
 * Component to handle Instagram OAuth callback
 * This component is rendered when the user is redirected back from Instagram
 * after authorizing our application
 */
const InstagramCallback = () => {
  const { connectSocialAccount } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    loading: true,
    success: false,
    error: null
  });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus({ loading: true, success: false, error: null });
        
        // Get the code and state from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          throw new Error('Authorization code not found in the URL');
        }
        
        // Exchange the code for an access token
        await connectSocialAccount('instagram', { code, state });
        
        // Clear the URL parameters for security
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setStatus({
          loading: false,
          success: true,
          error: null
        });
        
        // Redirect to the social connect page after a short delay
        setTimeout(() => {
          navigate('/social-connect');
        }, 2000);
        
      } catch (error) {
        console.error('Instagram callback error:', error);
        setStatus({
          loading: false,
          success: false,
          error: error.message || 'Failed to connect with Instagram'
        });
      }
    };
    
    handleCallback();
  }, [connectSocialAccount, navigate]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold text-center mb-4">
            Instagram Connection
          </h1>
          
          {status.loading && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-600">Connecting to Instagram...</p>
            </div>
          )}
          
          {status.success && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">Successfully connected with Instagram!</p>
              <p className="text-gray-500 text-sm mt-2">Redirecting you back...</p>
            </div>
          )}
          
          {status.error && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Connection failed</p>
              <p className="text-gray-500 text-sm mt-2">{status.error}</p>
              <button 
                onClick={() => navigate('/social-connect')}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Back to Connect Page
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default InstagramCallback;