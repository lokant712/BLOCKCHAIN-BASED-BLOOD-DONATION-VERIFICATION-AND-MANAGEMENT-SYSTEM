// Supabase Edge Function: gemini-chat
// Proxies chat requests to Google Gemini (Generative AI) using a server-side API key
// Requires environment variable GOOGLE_API_KEY set in Supabase Secrets
/// <reference types="jsr:@supabase/functions-js/edge-runtime" />
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type ChatRequestBody = {
  messages: ChatMessage[]
  model?: string
  system?: string | null
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
const DEFAULT_MODEL = 'gemini-2.0-flash-exp'  // Latest Gemini 2.0 Flash experimental model

// ✅ Helper: Convert messages to Gemini format
function toGeminiContent(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'system' ? 'user' : m.role, // Gemini doesn’t support 'system'
    parts: [{ text: m.content }]
  }))
}

// ✅ Core: Send request to Gemini API
async function callGemini(model: string, messages: ChatMessage[], systemPrompt?: string | null) {
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured in Supabase Secrets.')
    }
  
    console.log('📤 Calling Gemini model:', model)
  
    const payloadMessages = systemPrompt
      ? [{ role: 'user' as const, content: systemPrompt }, ...messages]
      : messages
  
    const body = {
      contents: toGeminiContent(payloadMessages),
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 512
      }
    }
  
    // ✅ Use v1beta for gemini-pro
    const apiVersion = 'v1beta'
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent?key=${GOOGLE_API_KEY}`
  
    console.log('🔗 Gemini URL:', url)
  
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  
  if (!res.ok) {
    const text = await res.text()
    console.error('❌ Gemini API error:', text)
    throw new Error(`Gemini API error: ${text}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return { text }
}
  

// ✅ Edge Function entry point
Deno.serve(async (req) => {
  console.log('🌐 Function triggered:', req.method, req.url)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const body = (await req.json()) as ChatRequestBody
    const model = body.model || DEFAULT_MODEL
    const system = body.system ?? null

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'messages array required' }, { status: 400 })
    }

    const result = await callGemini(model, body.messages, system)
    return Response.json({ reply: result.text }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (e) {
    console.error('⚠️ Function error:', e)
    return Response.json({ error: String(e) }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }
})