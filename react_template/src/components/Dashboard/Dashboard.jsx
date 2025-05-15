import React, { useState, useEffect } from 'react';
import MainLayout from '../Layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useAvatar } from '../../context/AvatarContext';
import { useMessage } from '../../context/MessageContext';
import { useAnalytics } from '../../services/analyticsService';

const Dashboard = () => {
  const { user } = useAuth();
  const { avatar, toggleAvatarActive } = useAvatar();
  const { getUnreadMessagesCount, getRecentMessages, markAsRead } = useMessage();
  const { getMessageMetrics, getResponseMetrics, getPlatformBreakdown } = useAnalytics();
  
  const [isLoading, setIsLoading] = useState(true);
  const [messageStats, setMessageStats] = useState({ total: 0, pending: 0 });
  const [recentMessages, setRecentMessages] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProcessed: 0,
    responseRate: 0,
    averageResponseTime: 0,
    platformBreakdown: { instagram: 0, youtube: 0 }
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get message counts
        const unreadCounts = await getUnreadMessagesCount();
        setMessageStats({
          total: unreadCounts.total || 0,
          pending: unreadCounts.pending || 0
        });
        
        // Get recent messages
        const messages = await getRecentMessages(5);
        setRecentMessages(messages || []);
        
        // Get analytics metrics only if user is available
        if (user) {
          const today = new Date();
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          
          const messageMetrics = await getMessageMetrics(user.id, { startDate: lastWeek, endDate: today });
          const responseMetrics = await getResponseMetrics(user.id, { startDate: lastWeek, endDate: today });
          const platformData = await getPlatformBreakdown(user.id);
          
          setMetrics({
            totalProcessed: messageMetrics?.totalProcessed || 0,
            responseRate: responseMetrics?.responseRate || 0,
            averageResponseTime: responseMetrics?.averageResponseTime || 0,
            platformBreakdown: platformData || { instagram: 0, youtube: 0 }
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [user, getUnreadMessagesCount, getRecentMessages, getMessageMetrics, getResponseMetrics, getPlatformBreakdown]);
  
  const handleToggleAvatar = () => {
    if (avatar) {
      toggleAvatarActive(!avatar.isActive);
    }
  };
  
  const handleMarkAsRead = async (messageId) => {
    try {
      await markAsRead(messageId);
      setRecentMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Avatar Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Avatar Status</h2>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${avatar?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {avatar?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-gray-500 mb-4">
            {avatar?.isActive 
              ? 'Your AI avatar is actively responding to messages across your connected platforms.' 
              : 'Your AI avatar is currently disabled. Enable it to start auto-responding to messages.'}
          </p>
          <div>
            <button
              onClick={handleToggleAvatar}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                avatar?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {avatar?.isActive ? 'Disable Avatar' : 'Enable Avatar'}
            </button>
          </div>
        </div>
        
        {/* Messages Overview Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Messages Overview</h2>
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{messageStats.total}</span>
              <span className="text-sm text-gray-500">Total Unread</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{messageStats.pending}</span>
              <span className="text-sm text-gray-500">Awaiting Review</span>
            </div>
          </div>
          <div className="text-center">
            <a href="/messages" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View All Messages
            </a>
          </div>
        </div>
        
        {/* Quick Stats Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Total Processed</span>
                <span className="font-semibold">{metrics.totalProcessed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, metrics.totalProcessed/10)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Response Rate</span>
                <span className="font-semibold">{Math.round(metrics.responseRate * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics.responseRate * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Avg. Response Time</span>
                <span className="font-semibold">{metrics.averageResponseTime.toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Messages */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Messages</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentMessages.length > 0 ? (
            recentMessages.map(message => (
              <div key={message.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full ${!message.isRead ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{message.senderName} <span className="text-gray-500">via {message.platform}</span></p>
                      <p className="text-sm text-gray-500 truncate max-w-md">{message.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {!message.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(message.id)}
                        className="ml-4 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                {message.response && (
                  <div className="mt-2 ml-5 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <p className="font-medium text-xs text-gray-500">AI Response:</p>
                    {message.response}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No messages yet. Once you start receiving messages, they'll appear here.
            </div>
          )}
          {recentMessages.length > 0 && (
            <div className="p-4 text-center">
              <a href="/messages" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All Messages
              </a>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;