// Simple test script to verify chatbot functionality
import aiChatService from './src/services/aiChatService';

async function testChatbot() {
  console.log('Testing chatbot service...');
  
  // Check if the service is properly initialized
  if (!aiChatService.genAI) {
    console.log('❌ AI service not initialized properly');
    return;
  }
  
  console.log('✅ AI service initialized');
  
  // Test chat functionality with a simple message
  const testMessages = [
    { role: 'user', content: 'What is the rarest blood type?' }
  ];
  
  try {
    console.log('Sending test message...');
    const response = await aiChatService.chat(testMessages);
    console.log('✅ Chat service working');
    console.log('Response:', response.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Chat service error:', error.message);
  }
  
  // Test streaming functionality
  try {
    console.log('Testing streaming functionality...');
    const streamTestMessages = [
      { role: 'user', content: 'Explain the blood donation process in 3 steps.' }
    ];
    
    let chunksReceived = 0;
    const handleChunk = (chunk) => {
      chunksReceived++;
      if (chunksReceived <= 3) {
        console.log(`Received chunk ${chunksReceived}:`, chunk.substring(0, 30) + '...');
      }
    };
    
    const streamResponse = await aiChatService.streamChat(streamTestMessages, handleChunk);
    console.log('✅ Streaming test completed');
    console.log('Stream response length:', streamResponse.length);
  } catch (error) {
    console.log('❌ Streaming test error:', error.message);
  }
  
  console.log('Test completed');
}

testChatbot();