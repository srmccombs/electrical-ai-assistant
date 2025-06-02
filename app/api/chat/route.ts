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
    const { messages } = await req.json()

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
    return new Response('Error processing chat request', { status: 500 })
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