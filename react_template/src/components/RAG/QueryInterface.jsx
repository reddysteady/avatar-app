import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAvatar } from '../../context/AvatarContext';
import ragService from '../../services/ragService';

/**
 * Component for querying the RAG pipeline
 */
const QueryInterface = () => {
  const { user } = useAuth();
  const { avatar } = useAvatar();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');
  const [systemStatus, setSystemStatus] = useState(null);
  const messagesEndRef = useRef(null);

  // Check RAG system status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await ragService.checkStatus();
        setSystemStatus(status);
      } catch (err) {
        console.error('Error checking RAG status:', err);
        setSystemStatus({
          ready: false,
          status: 'error',
          message: 'Could not connect to RAG system'
        });
      }
    };
    
    checkStatus();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    if (!user) {
      setError('You must be logged in to use this feature');
      return;
    }
    
    const userQuery = query;
    setQuery('');
    setError('');
    
    // Add user message to conversation
    setConversations(prev => [
      ...prev, 
      { role: 'user', content: userQuery }
    ]);
    
    setIsLoading(true);
    
    try {
      // Get avatar settings for personality
      const avatarSettings = avatar ? {
        name: avatar.personality?.name || 'AI Assistant',
        tone: avatar.personality?.tone || 'helpful and friendly',
        style: avatar.personality?.style || 'conversational',
        background: avatar.personality?.background,
        temperature: avatar.settings?.temperature || 0.7,
        moderationRules: avatar.moderationRules
      } : {};
      
      const response = await ragService.queryRag(
        userQuery,
        user.id,
        { avatarSettings }
      );
      
      // Add AI response to conversation
      setConversations(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: response.response,
          sources: response.sources 
        }
      ]);
    } catch (err) {
      console.error('Error querying RAG:', err);
      setError(err.response?.data?.message || err.message || 'Failed to get response');
      
      // Add error message to conversation
      setConversations(prev => [
        ...prev, 
        { 
          role: 'system', 
          content: 'Sorry, I encountered an error while processing your query. Please try again later.',
          error: true 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-700">Please log in to chat with your AI avatar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-semibold">Chat with AI Avatar</h2>
        <div className="flex items-center mt-2">
          <div className={`h-3 w-3 rounded-full ${systemStatus?.ready ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
          <span className="text-sm">
            {systemStatus?.ready ? 'RAG System Online' : 'RAG System Offline'}
          </span>
        </div>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">Hi there! I'm your AI avatar trained on your content.</p>
            <p>Ask me anything about your content, and I'll use my knowledge to give you an answer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-3/4 rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-100 text-blue-900' 
                      : message.role === 'system' 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Display sources if available */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-semibold">Sources:</p>
                      <div className="mt-1 space-y-1">
                        {message.sources.slice(0, 3).map((source, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            {source.metadata?.source || source.content_type}
                          </div>
                        ))}
                        {message.sources.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{message.sources.length - 3} more sources
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Input form */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your content..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || !systemStatus?.ready}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim() || !systemStatus?.ready}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
        {!systemStatus?.ready && (
          <p className="text-xs text-red-600 mt-1">
            The RAG system is currently offline. Please try again later.
          </p>
        )}
      </div>
    </div>
  );
};

export default QueryInterface;