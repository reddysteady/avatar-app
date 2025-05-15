import React, { useState } from 'react';

const MessageFilters = ({ onFilterChange }) => {
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  
  const handlePlatformChange = (e) => {
    const value = e.target.value;
    setPlatform(value);
    onFilterChange({ platform: value });
  };
  
  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatus(value);
    onFilterChange({ status: value });
  };
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search });
  };
  
  const handleClearSearch = () => {
    setSearch('');
    onFilterChange({ search: '' });
  };

  return (
    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
      {/* Platform Filter */}
      <div className="flex-shrink-0">
        <select
          value={platform}
          onChange={handlePlatformChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Platforms</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
        </select>
      </div>
      
      {/* Status Filter */}
      <div className="flex-shrink-0">
        <select
          value={status}
          onChange={handleStatusChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="AWAITING_REVIEW">Needs Review</option>
          <option value="RESPONDED">Responded</option>
          <option value="IGNORED">Ignored</option>
        </select>
      </div>
      
      {/* Search */}
      <div className="flex-grow">
        <form onSubmit={handleSearchSubmit} className="flex rounded-md shadow-sm">
          <div className="relative flex items-stretch flex-grow">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
              placeholder="Search messages..."
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageFilters;