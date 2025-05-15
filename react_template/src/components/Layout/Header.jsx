import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          {window.location.pathname.includes('/dashboard') ? 'Dashboard' :
           window.location.pathname.includes('/messages') ? 'Messages' :
           window.location.pathname.includes('/avatar') ? 'Avatar Settings' :
           window.location.pathname.includes('/analytics') ? 'Analytics' :
           window.location.pathname.includes('/social-connect') ? 'Social Connections' : ''}
        </h1>
      </div>
      
      {user ? (
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <div className="relative">
              <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <button 
              onClick={handleLogout}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div>
          <Link to="/login" className="text-blue-600 hover:text-blue-800 mr-4">Login</Link>
          <Link to="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Sign up</Link>
        </div>
      )}
    </header>
  );
};

export default Header;