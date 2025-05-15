import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../Layout/MainLayout';
import MessageFilters from './MessageFilters';
import { useMessage } from '../../context/MessageContext';

const MessageList = () => {
  const { getMessages, markAsRead } = useMessage();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    platform: 'all',
    status: 'all',
    search: '',
  });
  
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const fetchedMessages = await getMessages(activeFilters);
        setMessages(fetchedMessages || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [getMessages, activeFilters]);
  
  const handleMarkAsRead = async (messageId) => {
    try {
      await markAsRead(messageId);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  const handleFilterChange = (filters) => {
    setActiveFilters(prev => ({ ...prev, ...filters }));
  };
  
  const getPlatformIcon = (platform) => {
    switch(platform.toLowerCase()) {
      case 'instagram':
        return (
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
        );
      case 'youtube':
        return (
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white">
            <span className="text-xs">{platform.charAt(0).toUpperCase()}</span>
          </div>
        );
    }
  };
  
  const getStatusBadge = (message) => {
    if (message.status === 'PENDING') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    } else if (message.status === 'AUTO_RESPONDING') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Processing</span>;
    } else if (message.status === 'AWAITING_REVIEW') {
      return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Needs Review</span>;
    } else if (message.status === 'RESPONDED') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Responded</span>;
    } else if (message.status === 'IGNORED') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Ignored</span>;
    }
    return null;
  };

  return (
    <MainLayout>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-2 md:mb-0">Messages</h2>
          <MessageFilters onFilterChange={handleFilterChange} />
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {messages.map(message => (
              <Link to={`/messages/${message.id}`} key={message.id} className="block hover:bg-gray-50">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getPlatformIcon(message.platform)}
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">{message.senderName}</h4>
                          {!message.isRead && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate max-w-md">{message.content}</p>
                        <div className="flex items-center mt-1">
                          {getStatusBadge(message)}
                          <span className="ml-2 text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleMarkAsRead(message.id);
                        }}
                        className={`text-xs ${message.isRead ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
                        disabled={message.isRead}
                      >
                        {message.isRead ? 'Read' : 'Mark as read'}
                      </button>
                    </div>
                  </div>
                  
                  {message.response && (
                    <div className="mt-2 ml-12 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                      <span className="text-xs font-medium text-gray-500 block mb-1">
                        {message.isAutoResponded ? 'AI Response:' : 'Your Response:'}
                      </span>
                      <p className="line-clamp-2">{message.response}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages found</h3>
            <p className="text-gray-500">
              {activeFilters.search || activeFilters.platform !== 'all' || activeFilters.status !== 'all' 
                ? 'Try adjusting your filters to see more messages'
                : 'Once you receive messages, they\'ll appear here.'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MessageList;