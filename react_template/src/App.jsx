import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { AvatarProvider } from './context/AvatarContext';
import { AnalyticsProvider } from './services/analyticsService';

// Auth components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import SocialConnect from './components/Auth/SocialConnect';
import InstagramCallback from './components/Auth/InstagramCallback';

// Main app components
import Dashboard from './components/Dashboard/Dashboard';
import MessageList from './components/Messages/MessageList';
import MessageDetails from './components/Messages/MessageDetails';
import AvatarConfig from './components/Avatar/AvatarConfig';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';

// RAG components
import ContentIngestion from './components/RAG/ContentIngestion';
import QueryInterface from './components/RAG/QueryInterface';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AvatarProvider>
          <MessageProvider>
            <AnalyticsProvider>
              <Routes>
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/social-connect" element={<SocialConnect />} />
                <Route path="/instagram-callback" element={<InstagramCallback />} />
                
                {/* App routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/messages" element={<MessageList />} />
                <Route path="/messages/:id" element={<MessageDetails />} />
                <Route path="/avatar" element={<AvatarConfig />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                
                {/* RAG routes */}
                <Route path="/rag/ingestion" element={<ContentIngestion />} />
                <Route path="/rag/query" element={<QueryInterface />} />
                
                {/* Redirect to login or dashboard based on auth state */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AnalyticsProvider>
          </MessageProvider>
        </AvatarProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;