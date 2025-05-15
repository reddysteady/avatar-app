import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import instagramService from '../../services/instagramService';
import MainLayout from '../Layout/MainLayout';

const SocialConnect = () => {
  const { user, connectSocialAccount } = useAuth();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState({
    instagram: false,
    youtube: false
  });
  const [connected, setConnected] = useState({
    instagram: false,
    youtube: false
  });
  const [error, setError] = useState('');

  const handleConnect = async (platform) => {
    setError('');
    setConnecting(prev => ({ ...prev, [platform]: true }));

    try {
      if (platform === 'instagram') {
        // Use our Instagram service to get the authorization URL
        const authUrl = instagramService.getAuthUrl();
        window.location.href = authUrl;
        return; // Don't complete the flow yet - will resume after redirect
      } else {
        // Use mock implementation for other platforms
        await connectSocialAccount(platform);
        setConnected(prev => ({ ...prev, [platform]: true }));
      }
    } catch (err) {
      setError(`Failed to connect ${platform}. ${err.message || ''}`);
      console.error(err);
    } finally {
      setConnecting(prev => ({ ...prev, [platform]: false }));
    }
  };
  
  // Check if user is already connected with Instagram
  useEffect(() => {
    const checkInstagramConnection = async () => {
      try {
        // Check if the Instagram connection is already established
        const isAuthenticated = instagramService.isAuthenticated();
        
        if (isAuthenticated) {
          setConnected(prev => ({ ...prev, instagram: true }));
        }
        
        // We don't need to check for callback parameters here anymore
        // since that's handled by the InstagramCallback component
      } catch (err) {
        console.error('Error checking Instagram connection:', err);
      }
    };
    
    checkInstagramConnection();
  }, []);

  const handleContinue = () => {
    if (connected.instagram || connected.youtube) {
      navigate('/avatar');
    } else {
      setError('Please connect at least one social media account to continue');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Connect your social media accounts</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Connect your social media accounts to enable your AI Avatar to respond to messages on these platforms.</p>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="mt-8 space-y-6">
              {/* Instagram Connection */}
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium">Instagram</h4>
                    <p className="text-sm text-gray-500">Connect to respond to Instagram DMs</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect('instagram')}
                  disabled={connecting.instagram || connected.instagram}
                  className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    connected.instagram 
                      ? 'bg-green-100 text-green-800 cursor-default' 
                      : connecting.instagram 
                        ? 'bg-gray-100 text-gray-500 cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {connected.instagram 
                    ? 'Connected' 
                    : connecting.instagram 
                      ? 'Connecting...' 
                      : 'Connect'}
                </button>
              </div>

              {/* YouTube Connection */}
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium">YouTube</h4>
                    <p className="text-sm text-gray-500">Connect to respond to YouTube comments</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect('youtube')}
                  disabled={connecting.youtube || connected.youtube}
                  className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    connected.youtube 
                      ? 'bg-green-100 text-green-800 cursor-default' 
                      : connecting.youtube 
                        ? 'bg-gray-100 text-gray-500 cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {connected.youtube 
                    ? 'Connected' 
                    : connecting.youtube 
                      ? 'Connecting...' 
                      : 'Connect'}
                </button>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleContinue}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue to Avatar Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SocialConnect;