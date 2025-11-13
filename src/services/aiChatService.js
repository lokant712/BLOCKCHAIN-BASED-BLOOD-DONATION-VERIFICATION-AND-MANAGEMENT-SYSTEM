const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const headers = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
  };
};

class AIChatService {
  async chat(messages, options = {}) {
    const payload = {
      messages,
      system: options.system || null
    };

    console.log('Sending to Gemini:', { baseUrl, payload });

    const res = await fetch(`${baseUrl}/gemini-chat`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload)
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const text = await res.text();
      console.error('Error response:', text);
      console.error('Status:', res.status);
      console.error('Payload sent:', JSON.stringify(payload, null, 2));
      throw new Error(text || 'Gemini chat failed');
    }

    const json = await res.json();
    console.log('Success response:', json);
    return json.reply;
  }
  
  // For streaming responses, we'll fall back to the Supabase function
  async streamChat(messages, onChunk, options = {}) {
    // For streaming, we'll use the regular chat method and simulate streaming
    const response = await this.chat(messages, options);
    
    // Simulate streaming by sending chunks with a small delay
    let sent = 0;
    const chunkSize = Math.max(1, Math.floor(response.length / 10));
    
    while (sent < response.length) {
      const chunk = response.substring(sent, sent + chunkSize);
      onChunk(chunk);
      sent += chunkSize;
      
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return response;
  }
}

export default new AIChatService();