import React, { useState } from 'react';

const ToneSettings = ({ toneSettings, responseStyle, onUpdateSettings }) => {
  const [tone, setTone] = useState(toneSettings?.primaryTone || 'casual');
  const [casualToFormalRatio, setCasualToFormalRatio] = useState(toneSettings?.casualToFormalRatio || 50);
  const [enthusiasmLevel, setEnthusiasmLevel] = useState(toneSettings?.enthusiasmLevel || 50);
  const [useEmojis, setUseEmojis] = useState(toneSettings?.useEmojis || false);
  const [responseLength, setResponseLength] = useState(toneSettings?.responseLength || 2); // 1=short, 2=medium, 3=long
  
  const [isShortAndDirect, setIsShortAndDirect] = useState(responseStyle?.isShortAndDirect || false);
  const [isDetailedAndThorough, setIsDetailedAndThorough] = useState(responseStyle?.isDetailedAndThorough || false);
  const [isEmojiHeavy, setIsEmojiHeavy] = useState(responseStyle?.isEmojiHeavy || false);
  
  const [forbiddenPhrases, setForbiddenPhrases] = useState(responseStyle?.forbiddenPhrases?.join('\n') || '');
  const [preferredPhrases, setPreferredPhrases] = useState(responseStyle?.preferredPhrases?.join('\n') || '');
  
  const handleSave = () => {
    // Prepare updated settings objects
    const updatedToneSettings = {
      primaryTone: tone,
      casualToFormalRatio: casualToFormalRatio,
      enthusiasmLevel: enthusiasmLevel,
      useEmojis: useEmojis,
      responseLength: responseLength
    };
    
    const updatedResponseStyle = {
      isShortAndDirect: isShortAndDirect,
      isDetailedAndThorough: isDetailedAndThorough,
      isEmojiHeavy: isEmojiHeavy,
      forbiddenPhrases: forbiddenPhrases.split('\n').filter(phrase => phrase.trim() !== ''),
      preferredPhrases: preferredPhrases.split('\n').filter(phrase => phrase.trim() !== ''),
      maxCharacters: responseLength === 1 ? 150 : responseLength === 2 ? 300 : 500
    };
    
    onUpdateSettings({
      toneSettings: updatedToneSettings,
      responseStyle: updatedResponseStyle
    });
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-6">Tone & Style Settings</h3>
      
      {/* Primary Tone Selection */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Primary Tone</h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTone('casual')}
            className={`px-4 py-3 text-sm border rounded-md ${
              tone === 'casual' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Casual
          </button>
          <button
            type="button"
            onClick={() => setTone('professional')}
            className={`px-4 py-3 text-sm border rounded-md ${
              tone === 'professional' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Professional
          </button>
          <button
            type="button"
            onClick={() => setTone('friendly')}
            className={`px-4 py-3 text-sm border rounded-md ${
              tone === 'friendly' 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Friendly
          </button>
        </div>
      </div>
      
      {/* Casual to Formal Slider */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">Casual to Formal</h4>
          <span className="text-sm text-gray-500">{casualToFormalRatio}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={casualToFormalRatio}
          onChange={(e) => setCasualToFormalRatio(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Very Casual</span>
          <span>Very Formal</span>
        </div>
      </div>
      
      {/* Enthusiasm Level Slider */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">Enthusiasm Level</h4>
          <span className="text-sm text-gray-500">{enthusiasmLevel}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={enthusiasmLevel}
          onChange={(e) => setEnthusiasmLevel(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Reserved</span>
          <span>Enthusiastic</span>
        </div>
      </div>
      
      {/* Emoji Toggle */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Emoji Usage</h4>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setUseEmojis(!useEmojis)}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              useEmojis ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={useEmojis}
          >
            <span className="sr-only">Use emojis</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                useEmojis ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></span>
          </button>
          <span className="ml-3 text-sm text-gray-700">
            {useEmojis ? 'Using emojis in responses' : 'Not using emojis in responses'}
          </span>
        </div>
      </div>
      
      {/* Response Length */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Response Length</h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setResponseLength(1)}
            className={`px-4 py-3 text-sm border rounded-md ${
              responseLength === 1
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Short
          </button>
          <button
            type="button"
            onClick={() => setResponseLength(2)}
            className={`px-4 py-3 text-sm border rounded-md ${
              responseLength === 2
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => setResponseLength(3)}
            className={`px-4 py-3 text-sm border rounded-md ${
              responseLength === 3
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>
      
      {/* Response Style */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Response Style</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="short-direct"
              name="response-style"
              type="checkbox"
              checked={isShortAndDirect}
              onChange={() => setIsShortAndDirect(!isShortAndDirect)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="short-direct" className="ml-3 text-sm text-gray-700">
              Short & Direct
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="detailed-thorough"
              name="response-style"
              type="checkbox"
              checked={isDetailedAndThorough}
              onChange={() => setIsDetailedAndThorough(!isDetailedAndThorough)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="detailed-thorough" className="ml-3 text-sm text-gray-700">
              Detailed & Thorough
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="emoji-heavy"
              name="response-style"
              type="checkbox"
              checked={isEmojiHeavy}
              onChange={() => setIsEmojiHeavy(!isEmojiHeavy)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emoji-heavy" className="ml-3 text-sm text-gray-700">
              Emoji-Heavy
            </label>
          </div>
        </div>
      </div>
      
      {/* Advanced Settings */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Settings</h4>
        
        <div className="mb-4">
          <label htmlFor="forbidden-phrases" className="block text-sm font-medium text-gray-700 mb-1">
            Phrases to Avoid (one per line)
          </label>
          <textarea
            id="forbidden-phrases"
            rows={3}
            value={forbiddenPhrases}
            onChange={(e) => setForbiddenPhrases(e.target.value)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g., obviously, clearly, as I said before"
          />
        </div>
        
        <div>
          <label htmlFor="preferred-phrases" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Phrases (one per line)
          </label>
          <textarea
            id="preferred-phrases"
            rows={3}
            value={preferredPhrases}
            onChange={(e) => setPreferredPhrases(e.target.value)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g., I appreciate your question, Thanks for reaching out, Great point"
          />
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

export default ToneSettings;