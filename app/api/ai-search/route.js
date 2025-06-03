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
        error: 'OpenAI not configured',
        fallback: {
          searchStrategy: "standard",
          productType: "MIXED",
          confidence: 0.3,
          detectedSpecs: {},
          searchTerms: [""],
          reasoning: "OpenAI API not available - using fallback",
          suggestedFilters: [],
          alternativeQueries: []
        }
      }, { status: 200 })
    }

    const { query, userContext } = await request.json()
    console.log('🔍 Analyzing query:', query)

    const aiPrompt = `You are an expert electrical distributor AI assistant with 35+ years of experience.
Your job is to analyze customer requests and provide the MOST SPECIFIC search strategy.

CUSTOMER QUERY: "${query}"

CRITICAL ROUTING RULES (follow these exactly):

1. If query mentions "connectors" + fiber type (LC, SC, ST, FC, MTP, MPO, OM1-5, OS1-2):
   → searchStrategy: "connectors", productType: "CONNECTOR"

2. If query mentions cable length (ft, feet, meters) + fiber type:
   → searchStrategy: "cables", productType: "CABLE"

3. If query mentions "panel" or "patch panel":
   → searchStrategy: "panels", productType: "PANEL"

4. If query mentions category cable (Cat5, Cat6, ethernet):
   → searchStrategy: "cables", productType: "CABLE"

5. ONLY use "mixed" for very general queries with no specific product type

EXAMPLES:
- "lc connectors om4" → productType: "CONNECTOR", searchStrategy: "connectors" 
- "sc adapters multimode" → productType: "CONNECTOR", searchStrategy: "connectors"
- "1000 ft om3 cable" → productType: "CABLE", searchStrategy: "cables"
- "cat6 plenum blue" → productType: "CABLE", searchStrategy: "cables"
- "fiber patch panel" → productType: "PANEL", searchStrategy: "panels"
- "fiber optic" (general) → productType: "MIXED", searchStrategy: "mixed"

QUANTITY DETECTION (VERY IMPORTANT):
- Extract any quantities: "10000 ft", "24 connectors", "12 LC", "48 adapters"
- Convert to numbers: "10,000 ft" → 10000, "24 LC" → 24

RESPOND WITH ONLY JSON:
{
  "searchStrategy": "connectors|cables|panels|mixed",
  "productType": "CONNECTOR|CABLE|PANEL|MIXED",
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
    "color": "BLUE|WHITE|GRAY|RED|GREEN|YELLOW|ORANGE|BLACK or null"
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
          content: "You are an expert electrical distributor. Respond ONLY with valid JSON. Be SPECIFIC - if query mentions 'connectors', use productType: 'CONNECTOR' and searchStrategy: 'connectors'."
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

      // FORCE FIX: If query contains "connectors" but AI said "MIXED", fix it
      const queryLower = query.toLowerCase()
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

    let errorType = 'unknown'
    if (error.message?.includes('API key')) {
      errorType = 'api_key'
    } else if (error.message?.includes('quota')) {
      errorType = 'quota_exceeded'
    } else if (error.message?.includes('network') || error.code === 'ENOTFOUND') {
      errorType = 'network'
    }

    return Response.json({
      success: false,
      error: `AI analysis failed (${errorType})`,
      fallback: {
        searchStrategy: "standard",
        productType: "MIXED",
        confidence: 0.3,
        detectedSpecs: {},
        searchTerms: [query || ""],
        reasoning: `Fallback due to ${errorType} - using basic search`,
        suggestedFilters: [],
        alternativeQueries: [],
        errorType
      }
    }, { status: 200 })
  }
}