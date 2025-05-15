import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../Layout/MainLayout';
import ToneSettings from './ToneSettings';
import ModerationRules from './ModerationRules';
import { useAvatar } from '../../context/AvatarContext';
import openaiService from '../../services/openaiService';

const AvatarConfig = () => {
  const { avatar, updateAvatarSettings, isTrainingAvatar, trainAvatar, configureOpenAI, isOpenAIConfigured } = useAvatar();
  const apiKeyInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('tone');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate checking if avatar is currently in training mode
    setIsTraining(isTrainingAvatar);
    
    let progressInterval;
    if (isTrainingAvatar) {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsTraining(false);
            return 100;
          }
          return prev + 10;
        });
      }, 1000);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isTrainingAvatar]);

  const handleStartTraining = async () => {
    try {
      setIsTraining(true);
      setTrainingProgress(0);
      await trainAvatar();
      
      // Training progress simulation handled by useEffect above
    } catch (error) {
      console.error('Error starting avatar training:', error);
      setIsTraining(false);
    }
  };

  const showSaveMessage = () => {
    setShowSavedMessage(true);
    setTimeout(() => {
      setShowSavedMessage(false);
    }, 3000);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header with tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('tone')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'tone'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tone & Style
              </button>
              <button
                onClick={() => setActiveTab('moderation')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'moderation'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Moderation Rules
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'training'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Training
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'ai'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Configuration
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'tone' && (
              <ToneSettings
                toneSettings={avatar?.toneSettings}
                responseStyle={avatar?.responseStyle}
                onUpdateSettings={(updatedSettings) => {
                  updateAvatarSettings(updatedSettings);
                  showSaveMessage();
                }}
              />
            )}
            
            {activeTab === 'moderation' && (
              <ModerationRules
                moderationRules={avatar?.moderationRules}
                onUpdateRules={(updatedRules) => {
                  updateAvatarSettings({ moderationRules: updatedRules });
                  showSaveMessage();
                }}
              />
            )}
            
            {activeTab === 'training' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Avatar Training</h3>
                <p className="text-gray-500 mb-6">
                  Train your avatar on your content to better match your tone and style. 
                  This process analyzes your posts, comments, and other public content 
                  to help your avatar respond more authentically.
                </p>
                
                {isTraining ? (
                  <div className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-blue-600">Training in progress...</span>
                      <span className="text-sm font-medium text-blue-600">{trainingProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${trainingProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      This may take several minutes. You can leave this page and come back later.
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Last training completed</h4>
                        <p className="text-xs text-gray-500">{avatar?.lastTrainingDate ? new Date(avatar.lastTrainingDate).toLocaleString() : 'Never'}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleStartTraining}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start Training
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      Training typically takes 5-10 minutes depending on content volume.
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">What gets analyzed?</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Public posts and captions
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Comments and replies
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Video descriptions
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'ai' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">AI Configuration</h3>
                <p className="text-gray-500 mb-6">
                  Configure OpenAI integration to enable AI-powered responses. Your avatar will use OpenAI's
                  advanced language models to generate responses that match your configured tone and style.
                </p>
                
                <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <div className="mb-4">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="apiKey"
                        ref={apiKeyInputRef}
                        placeholder="sk-..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                        defaultValue={isOpenAIConfigured() ? '••••••••••••••••••••••••••••••' : ''}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Your API key is stored securely and never shared with third parties.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Model</span>
                      <span className="text-xs text-gray-500">gpt-4</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const apiKey = apiKeyInputRef.current?.value;
                      if (apiKey && !apiKey.startsWith('••')) {
                        configureOpenAI(apiKey);
                        showSaveMessage();
                      } else if (!apiKey) {
                        alert('Please enter a valid OpenAI API key');
                      }
                    }}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isOpenAIConfigured() ? 'Update API Key' : 'Save API Key'}
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">AI-Powered Features</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Tone-matching responses
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Context-aware conversations
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Moderation rule enforcement
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Save notification */}
        {showSavedMessage && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-100 text-green-800 rounded-md shadow-lg px-4 py-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Settings saved successfully!</span>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AvatarConfig;