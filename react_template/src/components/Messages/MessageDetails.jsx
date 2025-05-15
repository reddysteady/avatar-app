import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../Layout/MainLayout';
import { useMessage } from '../../context/MessageContext';
import { useAvatar } from '../../context/AvatarContext';

const MessageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, updateMessage, sendResponse, sendAIResponse, aiProcessing } = useMessage();
  const { isOpenAIConfigured, avatar } = useAvatar();
  
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true);
        const messageData = await getMessage(id);
        
        if (!messageData) {
          navigate('/messages');
          return;
        }
        
        setMessage(messageData);
        
        // Pre-fill response field with existing response if available
        if (messageData.response && !messageData.isAutoResponded) {
          setResponseText(messageData.response);
        }
        
        // Mark as read if needed
        if (!messageData.isRead) {
          await updateMessage(id, { isRead: true });
        }
      } catch (error) {
        console.error('Error loading message details:', error);
        setError('Failed to load message. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMessage();
    }
  }, [id, getMessage, updateMessage, navigate]);
  
  const handleSendResponse = async (e) => {
    e.preventDefault();
    
    if (!responseText.trim()) return;
    
    try {
      setIsSending(true);
      setError('');
      
      await sendResponse(id, responseText, false);
      
      setMessage(prev => ({
        ...prev,
        response: responseText,
        isAutoResponded: false,
        status: 'RESPONDED',
        respondedAt: new Date().toISOString()
      }));
      
      // Show success alert
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error sending response:', error);
      setError('Failed to send response. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleGenerateAIResponse = async () => {
    try {
      setError('');
      
      if (!isOpenAIConfigured()) {
        setError('OpenAI API key is not configured. Please add your API key in Avatar Settings.');
        return;
      }
      
      if (!avatar || !avatar.isActive) {
        setError('Avatar is not active. Please activate your avatar in settings.');
        return;
      }
      
      const updatedMessage = await sendAIResponse(id);
      setMessage(updatedMessage);
      
      // Show success alert
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      setError(`Failed to generate AI response: ${error.message}`);
    }
  };
  
  const handleApproveAIResponse = async () => {
    if (!message?.response) return;
    
    try {
      setIsSending(true);
      
      await sendResponse(id, message.response, true);
      
      setMessage(prev => ({
        ...prev,
        isReviewed: true,
        status: 'RESPONDED',
        respondedAt: new Date().toISOString()
      }));
      
      // Show success alert
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error approving AI response:', error);
      setError('Failed to approve response. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!message) {
    return (
      <MainLayout>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-gray-500">Message not found</div>
          <button
            onClick={() => navigate('/messages')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Messages
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Message Details</h2>
            <button
              onClick={() => navigate('/messages')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Messages
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Message Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-full ${message.platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500' : 'bg-red-600'} flex items-center justify-center text-white`}>
                  {message.platform === 'instagram' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">
                    {message.senderName}
                    <span className="text-sm font-normal text-gray-500 ml-2">via {message.platform}</span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  message.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  message.status === 'AUTO_RESPONDING' ? 'bg-blue-100 text-blue-800' :
                  message.status === 'AWAITING_REVIEW' ? 'bg-purple-100 text-purple-800' :
                  message.status === 'RESPONDED' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {message.status === 'PENDING' ? 'Pending' :
                   message.status === 'AUTO_RESPONDING' ? 'Processing' :
                   message.status === 'AWAITING_REVIEW' ? 'Needs Review' :
                   message.status === 'RESPONDED' ? 'Responded' :
                   message.status === 'IGNORED' ? 'Ignored' : message.status}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
          
          {/* AI Response Section */}
          {message.response && (
            <div className="mb-6 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {message.isAutoResponded ? 'AI Generated Response' : 'Your Response'}
              </h3>
              <div className={`bg-gray-50 p-4 rounded-md ${message.status === 'AWAITING_REVIEW' ? 'border border-yellow-300' : ''}`}>
                <p className="text-gray-800 whitespace-pre-wrap">{message.response}</p>
              </div>
              
              {/* Review Controls for AI Responses */}
              {message.isAutoResponded && message.status === 'AWAITING_REVIEW' && (
                <div className="mt-4 flex space-x-3">
                  <button 
                    onClick={handleApproveAIResponse}
                    disabled={isSending}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
                  >
                    {isSending ? 'Sending...' : 'Send As-Is'}
                  </button>
                  <button 
                    onClick={() => setResponseText(message.response)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit & Send
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Manual Response Form */}
          {(message.status !== 'RESPONDED' || !message.response) && (
            <div className={message.response ? "border-t pt-6" : ""}>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {message.response ? 'Edit Response' : 'Send a Response'}
              </h3>
              
              <form onSubmit={handleSendResponse}>
                <div className="mb-4">
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  ></textarea>
                </div>
                
                {error && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 text-sm text-red-700">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-between space-x-2">
                  <button
                    type="button"
                    onClick={handleGenerateAIResponse}
                    disabled={aiProcessing || isSending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300"
                  >
                    {aiProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-2.207 2.207L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Generate AI Response
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={!responseText.trim() || isSending || aiProcessing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  >
                    {isSending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Response'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* Success alert */}
      {showSuccessAlert && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-100 text-green-800 rounded-md shadow-lg px-4 py-3">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Response sent successfully!</span>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MessageDetails;