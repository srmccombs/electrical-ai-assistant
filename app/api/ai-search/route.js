// COMPLETE FILE: app/api/ai-search/route.js
// Copy this entire file and replace your existing route.js

import OpenAI from 'openai'

let openai
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
} catch (error) {
  console.error('❌ OpenAI initialization failed:', error.message)
}

export async function POST(request) {
  try {
    console.log('🤖 AI Search API called')

    if (!openai) {
      console.error('❌ OpenAI not initialized - check your API key')
      return Response.json({
        success: false,
        error: 'Service temporarily unavailable',
        fallback: {
          searchStrategy: "standard",
          productType: "MIXED",
          confidence: 0.3,
          detectedSpecs: {},
          searchTerms: [""],
          reasoning: "Service temporarily unavailable",
          suggestedFilters: [],
          alternativeQueries: []
        }
      }, { status: 503 })
    }

    // Validate request body
    let query, userContext
    try {
      const body = await request.json()
      query = body.query
      userContext = body.userContext
    } catch (e) {
      return Response.json({
        success: false,
        error: 'Invalid request format'
      }, { status: 400 })
    }

    // Validate query parameter
    if (!query || typeof query !== 'string') {
      return Response.json({
        success: false,
        error: 'Query parameter is required and must be a string'
      }, { status: 400 })
    }

    // Limit query length to prevent abuse
    if (query.length > 500) {
      return Response.json({
        success: false,
        error: 'Query too long. Maximum 500 characters allowed.'
      }, { status: 400 })
    }

    console.log('🔍 Analyzing query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''))

    const aiPrompt = `You are an expert electrical distributor AI assistant with 35+ years of experience.
Your job is to analyze customer requests and provide the MOST SPECIFIC search strategy.

CUSTOMER QUERY: "${query}"

CRITICAL ROUTING RULES (follow these exactly):

1. If query mentions "jack", "keystone", "RJ45 jack", "ethernet jack", "mini-com", or jack part numbers (CJ688, CJ5e88, CJ6X88):
   → searchStrategy: "jack_modules", productType: "JACK_MODULE"

2. If query mentions "connectors" + fiber type (LC, SC, ST, FC, MTP, MPO, OM1-5, OS1-2):
   → searchStrategy: "connectors", productType: "CONNECTOR"

3. If query mentions cable length (ft, feet, meters) + fiber type:
   → searchStrategy: "cables", productType: "CABLE"

4. If query mentions "panel" or "patch panel" (but NOT jack):
   → searchStrategy: "panels", productType: "PANEL"

5. If query mentions category cable (Cat5, Cat6, ethernet) WITHOUT "jack":
   → searchStrategy: "cables", productType: "CABLE"

6. If query mentions "enclosure", "housing", "rack mount", or rack units (RU, 1U, 2U, 4U):
   → searchStrategy: "enclosures", productType: "ENCLOSURE"

7. ONLY use "mixed" for very general queries with no specific product type

JACK MODULE EXAMPLES (VERY IMPORTANT):
- "cat6a jack" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "panduit keystone" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "CJ688TGBU" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "mini-com cat6 utp" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "100 cat5e jacks" → productType: "JACK_MODULE", searchStrategy: "jack_modules", requestedQuantity: 100
- "shielded cat6a jack blue" → productType: "JACK_MODULE", searchStrategy: "jack_modules"

OTHER EXAMPLES:
- "lc connectors om4" → productType: "CONNECTOR", searchStrategy: "connectors" 
- "sc adapters multimode" → productType: "CONNECTOR", searchStrategy: "connectors"
- "1000 ft om3 cable" → productType: "CABLE", searchStrategy: "cables"
- "cat6 plenum blue" → productType: "CABLE", searchStrategy: "cables"
- "fiber patch panel" → productType: "PANEL", searchStrategy: "panels"
- "4RU enclosure" → productType: "ENCLOSURE", searchStrategy: "enclosures"
- "fiber optic" (general) → productType: "MIXED", searchStrategy: "mixed"

QUANTITY DETECTION (VERY IMPORTANT):
- Extract any quantities: "10000 ft", "24 connectors", "12 LC", "48 adapters", "100 jacks"
- Convert to numbers: "10,000 ft" → 10000, "24 LC" → 24

RESPOND WITH ONLY JSON:
{
  "searchStrategy": "jack_modules|connectors|cables|panels|enclosures|mixed",
  "productType": "JACK_MODULE|CONNECTOR|CABLE|PANEL|ENCLOSURE|MIXED",
  "confidence": 0.0-1.0,
  "detectedSpecs": {
    "fiberType": "OM3|OM4|OS1|OS2|singlemode|multimode or null",
    "categoryRating": "CAT5|CAT5E|CAT6|CAT6A|etc or null",
    "connectorType": "LC|SC|ST|FC|MTP|MPO|etc or null",
    "jacketRating": "CMP|CMR|OSP|INDOOR_OUTDOOR or null",
    "fiberCount": number or null,
    "requestedQuantity": number or null,
    "shielding": "UTP|STP|etc or null",
    "manufacturer": "CORNING|PANDUIT|etc or null",
    "color": "BLUE|WHITE|GRAY|RED|GREEN|YELLOW|ORANGE|BLACK or null",
    "productLine": "Mini-Com|etc or null",
    "rackUnits": number or null
  },
  "searchTerms": ["primary_term"],
  "reasoning": "Brief explanation",
  "suggestedFilters": ["filter1"],
  "alternativeQueries": ["backup_query"]
}`

    console.log('🚀 Sending request to OpenAI...')

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert electrical distributor. Respond ONLY with valid JSON. Be SPECIFIC - if query mentions 'jack' or 'keystone', use productType: 'JACK_MODULE' and searchStrategy: 'jack_modules'."
        },
        { role: "user", content: aiPrompt }
      ],
      temperature: 0.1, // Lower temperature for more consistent results
      max_tokens: 800
    })

    const aiResponse = completion.choices[0].message.content.trim()
    console.log('✅ AI Response received:', aiResponse)

    let searchAnalysis
    try {
      searchAnalysis = JSON.parse(aiResponse)

      // FORCE FIX: If query contains jack-related terms but AI said "MIXED", fix it
      const queryLower = query.toLowerCase()
      if ((queryLower.includes('jack') || queryLower.includes('keystone') ||
           queryLower.includes('rj45') || queryLower.includes('mini-com') ||
           queryLower.includes('cj688') || queryLower.includes('cj5e88')) &&
          searchAnalysis.productType === 'MIXED') {
        console.log('🔧 FORCE FIX: Correcting MIXED to JACK_MODULE')
        searchAnalysis.productType = 'JACK_MODULE'
        searchAnalysis.searchStrategy = 'jack_modules'
        searchAnalysis.confidence = 0.95
        searchAnalysis.reasoning = 'Force corrected to jack modules based on keyword detection'
      }

      // FORCE FIX: If query contains "connectors" but AI said "MIXED", fix it
      if (queryLower.includes('connector') && searchAnalysis.productType === 'MIXED') {
        console.log('🔧 FORCE FIX: Correcting MIXED to CONNECTOR')
        searchAnalysis.productType = 'CONNECTOR'
        searchAnalysis.searchStrategy = 'connectors'
        searchAnalysis.confidence = 0.95
        searchAnalysis.reasoning = 'Force corrected to connectors based on keyword detection'
      }

      // Log the detected quantity for debugging
      if (searchAnalysis.detectedSpecs?.requestedQuantity) {
        console.log(`📏 AI detected quantity: ${searchAnalysis.detectedSpecs.requestedQuantity}`)
      } else {
        console.log('📏 No quantity detected in query')
      }

    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
      console.error('Raw AI response:', aiResponse)
      searchAnalysis = {
        searchStrategy: "mixed",
        productType: "MIXED",
        confidence: 0.5,
        detectedSpecs: {},
        searchTerms: [query],
        reasoning: "Fallback analysis due to parsing error",
        suggestedFilters: [],
        alternativeQueries: [query]
      }
    }

    // Add metadata
    searchAnalysis.originalQuery = query
    searchAnalysis.timestamp = new Date().toISOString()
    searchAnalysis.aiModel = "gpt-4o-mini"

    console.log('🎯 Final analysis:', searchAnalysis)

    return Response.json({
      success: true,
      analysis: searchAnalysis
    })

  } catch (error) {
    console.error('❌ AI Search API Error:', error)

    // Don't expose internal error details to client
    return Response.json({
      success: false,
      error: 'AI analysis temporarily unavailable',
      fallback: {
        searchStrategy: "standard",
        productType: "MIXED",
        confidence: 0.3,
        detectedSpecs: {},
        searchTerms: [query || ""],
        reasoning: "Using fallback search",
        suggestedFilters: [],
        alternativeQueries: []
      }
    }, { status: 200 })
  }
}