import React, { useState } from 'react';

const ModerationRules = ({ moderationRules, onUpdateRules }) => {
  const [blockOffensiveLanguage, setBlockOffensiveLanguage] = useState(
    moderationRules?.blockOffensiveLanguage || true
  );
  const [routePersonalQuestions, setRoutePersonalQuestions] = useState(
    moderationRules?.routePersonalQuestions || true
  );
  const [blockPoliticalTopics, setBlockPoliticalTopics] = useState(
    moderationRules?.blockPoliticalTopics || false
  );
  
  const [customBlocked, setCustomBlocked] = useState(
    moderationRules?.customBlockedKeywords?.join('\n') || ''
  );
  const [customRouted, setCustomRouted] = useState(
    moderationRules?.customRoutedKeywords?.join('\n') || ''
  );
  
  const [newRule, setNewRule] = useState('');
  const [newRuleType, setNewRuleType] = useState('block');
  
  const handleSave = () => {
    const updatedRules = {
      blockOffensiveLanguage,
      routePersonalQuestions,
      blockPoliticalTopics,
      customBlockedKeywords: customBlocked
        .split('\n')
        .filter(keyword => keyword.trim() !== ''),
      customRoutedKeywords: customRouted
        .split('\n')
        .filter(keyword => keyword.trim() !== ''),
    };
    
    onUpdateRules(updatedRules);
  };
  
  const addCustomRule = () => {
    if (!newRule.trim()) return;
    
    if (newRuleType === 'block') {
      setCustomBlocked(prev => prev ? `${prev}\n${newRule}` : newRule);
    } else {
      setCustomRouted(prev => prev ? `${prev}\n${newRule}` : newRule);
    }
    
    setNewRule('');
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-6">Moderation Rules</h3>
      
      <p className="text-gray-500 mb-6">
        Configure how your avatar handles different types of messages. You can choose to automatically
        block certain messages or route them for manual review.
      </p>
      
      {/* Default Rules */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Default Rules</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="block-offensive"
              type="checkbox"
              checked={blockOffensiveLanguage}
              onChange={() => setBlockOffensiveLanguage(!blockOffensiveLanguage)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="block-offensive" className="ml-3">
              <div className="text-sm font-medium text-gray-700">Block offensive language</div>
              <p className="text-sm text-gray-500">Messages containing offensive language will be automatically blocked</p>
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="route-personal"
              type="checkbox"
              checked={routePersonalQuestions}
              onChange={() => setRoutePersonalQuestions(!routePersonalQuestions)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="route-personal" className="ml-3">
              <div className="text-sm font-medium text-gray-700">Route personal questions</div>
              <p className="text-sm text-gray-500">Personal questions will be sent to you for manual review</p>
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="block-political"
              type="checkbox"
              checked={blockPoliticalTopics}
              onChange={() => setBlockPoliticalTopics(!blockPoliticalTopics)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="block-political" className="ml-3">
              <div className="text-sm font-medium text-gray-700">Block political topics</div>
              <p className="text-sm text-gray-500">Messages about political topics will be automatically blocked</p>
            </label>
          </div>
        </div>
      </div>
      
      {/* Custom Rules */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Rules</h4>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Enter keyword or phrase"
              className="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            <select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block sm:text-sm border-gray-300 rounded-md"
            >
              <option value="block">Block</option>
              <option value="route">Route</option>
            </select>
            <button
              type="button"
              onClick={addCustomRule}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Add keywords or phrases that should be blocked or routed for manual review
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Blocked Keywords */}
          <div>
            <label htmlFor="blocked-keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Blocked Keywords (one per line)
            </label>
            <textarea
              id="blocked-keywords"
              rows={5}
              value={customBlocked}
              onChange={(e) => setCustomBlocked(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., spam, affiliate link"
            />
          </div>
          
          {/* Routed Keywords */}
          <div>
            <label htmlFor="routed-keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Manually Reviewed Keywords (one per line)
            </label>
            <textarea
              id="routed-keywords"
              rows={5}
              value={customRouted}
              onChange={(e) => setCustomRouted(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., collaboration, sponsorship"
            />
          </div>
        </div>
      </div>
      
      {/* Notification Settings */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Settings</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="email-alerts"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
            <label htmlFor="email-alerts" className="ml-3">
              <div className="text-sm font-medium text-gray-700">Email alerts for exceptions</div>
              <p className="text-sm text-gray-500">Get notified when messages are routed for manual review</p>
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="daily-summary"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="daily-summary" className="ml-3">
              <div className="text-sm font-medium text-gray-700">Daily summary report</div>
              <p className="text-sm text-gray-500">Receive a daily summary of moderated messages</p>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ModerationRules;