import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    const userMessage = messages[messages.length - 1]?.content || ''
    
    // Search products if user is asking about inventory/products
    let searchResults = ''
    if (userMessage.toLowerCase().includes('show') || 
        userMessage.toLowerCase().includes('find') || 
        userMessage.toLowerCase().includes('search') ||
        userMessage.toLowerCase().includes('adapter') ||
        userMessage.toLowerCase().includes('fiber') ||
        userMessage.toLowerCase().includes('connector') ||
        userMessage.toLowerCase().includes('product')) {
      
      const { data, error } = await supabase
        .from('product_search')
        .select('*')
        .limit(10)
      
      if (data && data.length > 0) {
        searchResults = `\n\nHere are products from your inventory:\n${data.map(product => 
          `• ${product.part_number} - ${product.brand} - ${product.short_description}`
        ).join('\n')}`
      }
    }

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: `You are an expert electrical distributor assistant with 35 years of experience in the electrical distribution business, specializing in datacom, fiber optic, and networking products. You help electrical contractors and technicians find the right products for their projects.

Key responsibilities:
- Help find specific products by part number, brand, or description
- Provide technical specifications and compatibility information  
- Suggest alternative products when exact matches aren't available
- Answer questions about installation, applications, and best practices
- Use professional electrical industry terminology
- Focus on products that distributors typically stock (90% of day-to-day sales)

Always be helpful, accurate, and professional. If you show product results, format them clearly with part numbers, brands, and descriptions. Your goal is to help electrical distributors find the correct products their customers need.${searchResults}`
        },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Error processing request', { status: 500 })
  }
}