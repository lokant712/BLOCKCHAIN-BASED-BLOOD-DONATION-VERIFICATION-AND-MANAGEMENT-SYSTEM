# AI Chat Service

This service provides integration with Google's Gemini AI for chatbot functionality.

## Features

- Direct integration with Gemini API
- Streaming responses for real-time interaction
- Conversation history management
- Context-aware responses for blood donation domain

## Usage

```javascript
import aiChatService from './aiChatService';

// Simple chat
const messages = [
  { role: 'user', content: 'What is the rarest blood type?' }
];

const response = await aiChatService.chat(messages);

// Streaming chat (for real-time responses)
const handleChunk = (chunk) => {
  // Handle each chunk of the response as it arrives
  console.log(chunk);
};

const finalResponse = await aiChatService.streamChat(messages, handleChunk);
```

## Configuration

The service requires a Google Gemini API key set in environment variables:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Methods

### `chat(messages, options)`
Sends messages to Gemini and returns the complete response.

**Parameters:**
- `messages`: Array of message objects with `role` and `content`
- `options`: Configuration options (optional)

**Returns:** Promise resolving to the AI response text

### `streamChat(messages, onChunk)`
Sends messages to Gemini and streams the response.

**Parameters:**
- `messages`: Array of message objects with `role` and `content`
- `onChunk`: Callback function to handle each chunk of the response

**Returns:** Promise resolving to the complete AI response text

## Error Handling

The service will throw errors for:
- Missing API key
- Network issues
- API rate limits
- Invalid requests

Always wrap calls in try/catch blocks for proper error handling.