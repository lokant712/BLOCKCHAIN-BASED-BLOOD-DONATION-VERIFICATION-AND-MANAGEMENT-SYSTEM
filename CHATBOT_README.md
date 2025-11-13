# Blood Donation Chatbot with Gemini AI

This chatbot implementation uses Google's Gemini AI to provide intelligent assistance for blood donation management.

## Features

- Real-time streaming responses for a conversational experience
- Context-aware responses about blood donation procedures
- Emergency request guidance
- Donor eligibility information
- Blood type compatibility assistance

## Setup

1. **API Key Configuration**
   - The chatbot requires a Google Gemini API key
   - Add your API key to the `.env` file:
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     ```

2. **Installation**
   ```bash
   npm install @google/generative-ai
   ```

3. **Usage**
   - Navigate to the chatbot page at `/chatbot`
   - Start asking questions about blood donation procedures

## How It Works

The chatbot uses the following components:

1. **AI Service** (`src/services/aiChatService.js`)
   - Direct integration with Google's Gemini API
   - Streaming responses for real-time interaction
   - Context management for conversation history

2. **UI Component** (`src/pages/chatbot/index.jsx`)
   - Real-time message display
   - Typing indicators
   - Responsive design

## Customization

You can customize the chatbot's behavior by modifying:

- **System Prompt**: Edit the `systemPrompt` in `aiChatService.js` to change the AI's personality and expertise
- **Model Selection**: Change the model in `aiChatService.js` (default is `gemini-1.5-flash`)
- **UI Styling**: Modify the Tailwind classes in `chatbot/index.jsx`

## Troubleshooting

**Common Issues:**

1. **API Key Errors**
   - Ensure your API key is correctly set in `.env`
   - Verify the key has Gemini API access

2. **Streaming Issues**
   - Check browser compatibility (modern browsers only)
   - Ensure network connectivity

3. **Response Quality**
   - Refine the system prompt for better context
   - Adjust generation parameters (temperature, max tokens)