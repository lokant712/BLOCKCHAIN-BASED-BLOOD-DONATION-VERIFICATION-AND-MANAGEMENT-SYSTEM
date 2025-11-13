import React, { useState } from 'react';
import aiChatService from '../../services/aiChatService';

const ChatbotTest = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your blood donation assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamingResponse('');

    try {
      // Use streaming for assistant response
      let accumulatedResponse = '';
      
      const handleChunk = (chunk) => {
        accumulatedResponse += chunk;
        setStreamingResponse(accumulatedResponse);
      };
      
      // Stream the response
      const finalResponse = await aiChatService.streamChat(newMessages, handleChunk);
      
      // Add complete response to messages
      setMessages([...newMessages, { role: 'assistant', content: finalResponse }]);
      setStreamingResponse('');
    } catch (err) {
      console.error('Chat error:', err);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `Error: ${err.message}` }
      ]);
      setStreamingResponse('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Chatbot Test</h1>
      
      <div className="border rounded-lg p-4 bg-white mb-4 h-96 overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={idx} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded-md max-w-xs ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        
        {streamingResponse && (
          <div className="mb-3 text-left">
            <div className="inline-block px-3 py-2 rounded-md bg-gray-200 text-gray-800 max-w-xs">
              {streamingResponse}
              <span className="inline-block w-2 h-4 bg-gray-500 ml-1 animate-pulse"></span>
            </div>
          </div>
        )}
        
        {loading && !streamingResponse && (
          <div className="mb-3 text-left">
            <div className="inline-block px-3 py-2 rounded-md bg-gray-200 text-gray-800 max-w-xs">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          disabled={loading}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Test Results</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>AI Service Initialized: {aiChatService.genAI ? '✅ Yes' : '❌ No'}</p>
          <p>Model Loaded: {aiChatService.model ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotTest;