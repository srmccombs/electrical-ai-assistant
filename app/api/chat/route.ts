import { NextRequest } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@supabase/supabase-js'

// Import the correct function based on AI SDK version
// Try this first - for newer AI SDK versions
import { streamText } from 'ai'

// If above doesn't work, try this instead:
// import { generateText } from 'ai'

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    let messages
    try {
      const body = await req.json()
      messages = body.messages
    } catch (e) {
      return new Response('Invalid request format', { status: 400 })
    }

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages must be a non-empty array', { status: 400 })
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response('Each message must have role and content', { status: 400 })
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return new Response('Invalid message role', { status: 400 })
      }
      if (typeof msg.content !== 'string' || msg.content.length > 5000) {
        return new Response('Message content must be a string under 5000 characters', { status: 400 })
      }
    }

    // Limit total messages to prevent abuse
    if (messages.length > 20) {
      return new Response('Too many messages. Maximum 20 allowed.', { status: 400 })
    }

    // Initialize Supabase client only if needed
    // Note: Currently not used in this endpoint
    
    // Check if OpenAI is properly configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return new Response('Service temporarily unavailable', { status: 503 })
    }

    // Use OpenAI with the AI SDK
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    return result.toDataStreamResponse()

  } catch (error) {
    console.error('Chat API error:', error)
    // Don't expose internal error details
    return new Response('Service temporarily unavailable', { status: 503 })
  }
}

// Alternative version if streamText doesn't work:
/*
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    return Response.json({ content: result.text })

  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Error processing chat request', { status: 500 })
  }
}
*/