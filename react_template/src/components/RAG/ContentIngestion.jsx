import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAvatar } from '../../context/AvatarContext';
import ragService from '../../services/ragService';

/**
 * Component for ingesting content into the RAG pipeline
 */
const ContentIngestion = () => {
  const { user } = useAuth();
  const { avatar } = useAvatar();
  const [sourceType, setSourceType] = useState('youtube_video');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [contentSources, setContentSources] = useState([]);
  const [customText, setCustomText] = useState('');
  const [customTextTitle, setCustomTextTitle] = useState('');

  // Fetch existing content sources
  useEffect(() => {
    const fetchContentSources = async () => {
      if (!user) return;
      
      try {
        const sources = await ragService.getUserContentSources(user.id);
        setContentSources(sources || []);
      } catch (err) {
        console.error('Error fetching content sources:', err);
        setError('Failed to load content sources');
      }
    };
    
    fetchContentSources();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsLoading(true);
    
    try {
      // For custom text, use the text content itself as the sourceId
      const source = sourceType === 'custom_text' ? customText : sourceUrl;
      const metadata = sourceType === 'custom_text' ? { title: customTextTitle || 'Custom Text' } : {};
      
      const options = {};
      if (sourceType === 'youtube_channel') {
        options.maxVideos = 5; // Limit to 5 videos for demonstration
      } else if (sourceType === 'instagram_account') {
        options.maxPosts = 5; // Limit to 5 posts for demonstration
      }
      
      const response = await ragService.ingestContent(
        sourceType,
        source,
        user?.id,
        metadata,
        options
      );
      
      setResult(response.result);
      
      // Refresh content sources
      const sources = await ragService.getUserContentSources(user.id);
      setContentSources(sources || []);
      
      // Clear form
      if (response.status === 'success') {
        setSourceUrl('');
        setCustomText('');
        setCustomTextTitle('');
      }
    } catch (err) {
      console.error('Error ingesting content:', err);
      setError(err.response?.data?.message || err.message || 'Failed to ingest content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }
    
    try {
      await ragService.deleteContent(contentId, user.id);
      
      // Refresh content sources
      const sources = await ragService.getUserContentSources(user.id);
      setContentSources(sources || []);
    } catch (err) {
      console.error('Error deleting content:', err);
      setError('Failed to delete content');
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-700">Please log in to ingest content into your knowledge base.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-6">Content Ingestion</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          <p className="font-semibold">{result.message}</p>
          {result.chunkCount && (
            <p className="text-sm mt-1">Created {result.chunkCount} knowledge chunks</p>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Source Type
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="youtube_video">YouTube Video</option>
            <option value="youtube_channel">YouTube Channel</option>
            <option value="instagram_post">Instagram Post</option>
            <option value="instagram_account">Instagram Account</option>
            <option value="custom_text">Custom Text</option>
          </select>
        </div>
        
        {sourceType !== 'custom_text' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {sourceType.includes('youtube') ? 'YouTube URL' : 'Instagram URL'}
            </label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder={sourceType.includes('youtube') 
                ? 'https://www.youtube.com/watch?v=...'
                : 'https://www.instagram.com/p/...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Title
              </label>
              <input
                type="text"
                value={customTextTitle}
                onChange={(e) => setCustomTextTitle(e.target.value)}
                placeholder="Title for your custom content"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Text
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Enter your custom content here..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Ingesting...' : 'Ingest Content'}
        </button>
      </form>
      
      {/* Content Sources List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Your Knowledge Base Sources</h3>
        
        {contentSources.length === 0 ? (
          <p className="text-gray-500">No content sources yet. Add some using the form above.</p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contentSources.map((source) => (
                  <tr key={source.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {source.source_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.source_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(source.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentIngestion;