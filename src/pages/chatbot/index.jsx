import React, { useState, useRef, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import aiChatService from '../../services/aiChatService';

const ChatBotPage = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your blood donation assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
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
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
      setStreamingResponse('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-100px)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Blood Donation Assistant</h1>
      
      <div className="flex-1 border rounded-lg p-4 bg-white mb-4 overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={idx} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
              m.role === 'user' 
                ? 'bg-red-600 text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        
        {/* Streaming response */}
        {streamingResponse && (
          <div className="mb-4 text-left">
            <div className="inline-block px-4 py-2 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none max-w-[80%]">
              {streamingResponse}
              <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse"></span>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && !streamingResponse && (
          <div className="mb-4 text-left">
            <div className="inline-block px-4 py-2 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center space-x-2">
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask about blood donation, donors, or emergency procedures..." 
          disabled={loading}
          className="flex-1"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <Button 
          type="submit" 
          disabled={loading || !input.trim()} 
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </form>
      
      <div className="mt-2 text-sm text-gray-500">
        <p>Powered by Gemini AI • Ask about blood types, donation procedures, or emergency requests</p>
      </div>
    </div>
  );
};

export default ChatBotPage;