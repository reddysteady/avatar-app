import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation links
  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { path: '/messages', label: 'Messages', icon: 'fas fa-comment' },
    { path: '/avatar', label: 'Avatar Settings', icon: 'fas fa-user-circle' },
    { path: '/analytics', label: 'Analytics', icon: 'fas fa-chart-bar' },
    { path: '/rag/query', label: 'AI Knowledge Chat', icon: 'fas fa-robot' },
    { path: '/rag/ingestion', label: 'Content Manager', icon: 'fas fa-database' }
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
      {/* App Logo and Title */}
      <div className="p-4 border-b border-gray-700 mb-4">
        <h1 className="text-2xl font-bold">Avatar App</h1>
        <p className="text-sm text-gray-400">AI-driven social media assistant</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1">
        <ul>
          {navLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={`flex items-center px-4 py-3 hover:bg-gray-700 transition-colors ${
                  isActive(link.path) ? 'bg-gray-700 text-blue-400' : ''
                }`}
              >
                <i className={`${link.icon} w-5 mr-3`}></i>
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        {user ? (
          <div>
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-lg">{user.name ? user.name.charAt(0) : 'U'}</span>
              </div>
              <div>
                <p className="font-medium">{user.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user.email || 'No email'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors text-sm"
            >
              <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <NavLink
              to="/login"
              className="px-4 py-2 bg-blue-600 text-center rounded hover:bg-blue-700 transition-colors"
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className="px-4 py-2 bg-gray-700 text-center rounded hover:bg-gray-600 transition-colors"
            >
              Register
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;