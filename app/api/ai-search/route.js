// ENHANCED AI PROMPT - Better Quantity Detection
// Replace your app/api/ai-search/route.js with this version

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
Your job is to analyze customer requests and provide the best search strategy for finding products in their database.

CUSTOMER QUERY: "${query}"

AVAILABLE PRODUCT TYPES IN DATABASE:
- Category Cables (Cat5, Cat5e, Cat6, Cat6a, Cat7, Cat8)
- Fiber Optic Cables (OM1, OM2, OM3, OM4, OS1, OS2)
- Fiber Connectors (LC, SC, ST, FC, MTP, MPO)
- Adapter Panels and Patch Panels
- Ethernet/Network Cables (UTP, STP, FTP, SFTP)

JACKET RATING CLASSIFICATIONS (CRITICAL - these are exact equivalents):
1. PLENUM group: CMP = Plenum (same thing)
2. RISER group: CMR = Riser = Non-Plenum (same thing)  
3. OUTDOOR group: OSP = Outside Plant = Outdoor = Water resistant = Gel filled (same thing)
4. INDOOR_OUTDOOR: Indoor/outdoor rated (separate category)

QUANTITY DETECTION (VERY IMPORTANT):
- Extract any quantities mentioned: "10000 ft", "5000 feet", "1000'", "500 foot"
- Common formats: "10,000 ft", "10000 feet", "10K ft", "5000'"  
- For connectors: "24 connectors", "12 LC", "48 adapters"
- Convert to pure numbers: "10,000 ft" → 10000, "5K ft" → 5000

ANALYZE THE QUERY AND RESPOND WITH ONLY A JSON OBJECT:
{
  "searchStrategy": "cables|connectors|panels|mixed",
  "productType": "CABLE|CONNECTOR|PANEL|MIXED",
  "confidence": 0.0-1.0,
  "detectedSpecs": {
    "fiberType": "OM3|OM4|etc or null",
    "categoryRating": "CAT5|CAT5E|CAT6|CAT6A|etc or null",
    "connectorType": "LC|SC|etc or null",
    "jacketRating": "CMP|CMR|OSP|INDOOR_OUTDOOR or null",
    "fiberCount": number or null,
    "requestedQuantity": number or null,
    "shielding": "UTP|STP|etc or null",
    "manufacturer": "CORNING|PANDUIT|etc or null",
    "color": "BLUE|WHITE|GRAY|RED|GREEN|YELLOW|ORANGE|BLACK or null"
  },
  "searchTerms": ["primary_search_term", "secondary_term", "fallback_term"],
  "reasoning": "Why you chose this strategy in 1-2 sentences",
  "suggestedFilters": ["filter1", "filter2"],
  "alternativeQueries": ["alternative search if no results"]
}

QUANTITY DETECTION EXAMPLES:
Query: "I need 10000 ft of Cat 6 plenum blue" → requestedQuantity: 10000
Query: "10,000 feet of Cat6A cable" → requestedQuantity: 10000  
Query: "5K feet Cat5e blue" → requestedQuantity: 5000
Query: "1000' of fiber cable OM3" → requestedQuantity: 1000
Query: "24 LC connectors OM4" → requestedQuantity: 24
Query: "12 SC adapters" → requestedQuantity: 12

JACKET EXAMPLES:
Query: "Cat 6 plenum blue" → jacketRating: "CMP", requestedQuantity: null
Query: "I need 5000 ft Cat 6 riser red" → jacketRating: "CMR", requestedQuantity: 5000
Query: "outdoor cable 1000 ft" → jacketRating: "OSP", requestedQuantity: 1000

CRITICAL: Always extract requestedQuantity if ANY quantity is mentioned in the query.`

    console.log('🚀 Sending request to OpenAI...')

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert electrical distributor assistant. Respond ONLY with valid JSON. Pay special attention to extracting quantities - if customer mentions '10000 ft' then requestedQuantity should be 10000."
        },
        { role: "user", content: aiPrompt }
      ],
      temperature: 0.2,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0].message.content.trim()
    console.log('✅ AI Response received:', aiResponse.substring(0, 200) + '...')

    let searchAnalysis
    try {
      searchAnalysis = JSON.parse(aiResponse)

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
    searchAnalysis.aiModel = "gpt-4"

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