import aiChatService from '../aiChatService';

describe('AI Chat Service', () => {
  test('should initialize with API key', () => {
    expect(aiChatService.genAI).toBeDefined();
    expect(aiChatService.model).toBeDefined();
  });

  test('should have system prompt for blood donation context', () => {
    expect(aiChatService.systemPrompt).toContain('blood donation');
  });

  // Note: We're not testing actual API calls here to avoid external dependencies
  // In a real test environment, we would mock the Gemini API
});