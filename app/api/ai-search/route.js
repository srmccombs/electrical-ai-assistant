// app/api/ai-search/route.js
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request) {
  try {
    const { query, userContext } = await request.json()

    console.log('🤖 AI analyzing query:', query)

    const aiPrompt = `You are an expert electrical distributor AI assistant with 35+ years of experience. 
Your job is to analyze customer requests and provide the best search strategy for finding products in their database.

CUSTOMER QUERY: "${query}"

AVAILABLE PRODUCT TYPES IN DATABASE:
- Fiber Optic Cables (OM1, OM2, OM3, OM4, OS1, OS2)
- Category Cables (Cat5, Cat5e, Cat6, Cat6a, Cat7, Cat8)
- Fiber Connectors (LC, SC, ST, FC, MTP, MPO)
- Adapter Panels and Patch Panels
- Ethernet/Network Cables (UTP, STP, FTP, SFTP)

JACKET RATINGS: CMP (Plenum), CMR (Riser), CMG, LSZH, OFNP, OFNR, OFNG

ANALYZE THE QUERY AND RESPOND WITH ONLY A JSON OBJECT:
{
  "searchStrategy": "connectors|cables|panels|mixed",
  "productType": "CONNECTOR|CABLE|PANEL|MIXED",
  "confidence": 0.0-1.0,
  "detectedSpecs": {
    "fiberType": "OM3|OM4|etc or null",
    "categoryRating": "CAT5|CAT6|etc or null", 
    "connectorType": "LC|SC|etc or null",
    "jacketRating": "CMP|CMR|etc or null",
    "fiberCount": number or null,
    "requestedQuantity": number or null,
    "shielding": "UTP|STP|etc or null",
    "manufacturer": "CORNING|PANDUIT|etc or null"
  },
  "searchTerms": ["primary_search_term", "secondary_term", "fallback_term"],
  "reasoning": "Why you chose this strategy in 1-2 sentences",
  "suggestedFilters": ["filter1", "filter2"],
  "alternativeQueries": ["alternative search if no results"]
}

EXAMPLES:
Query: "12 fiber OM3 cable" → productType: "CABLE", fiberType: "OM3", fiberCount: 12
Query: "Cat 5 plenum blue" → productType: "CABLE", categoryRating: "CAT5", jacketRating: "CMP" 
Query: "24 LC connectors" → productType: "CONNECTOR", connectorType: "LC", fiberCount: 24

Be specific and accurate. This will directly control database searches for a real electrical distributor.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert electrical distributor assistant. Respond ONLY with valid JSON. No explanations or markdown formatting."
        },
        { role: "user", content: aiPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0].message.content.trim()
    console.log('🤖 AI Response:', aiResponse)

    let searchAnalysis
    try {
      searchAnalysis = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
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

    searchAnalysis.originalQuery = query
    searchAnalysis.timestamp = new Date().toISOString()
    searchAnalysis.aiModel = "gpt-4"

    return Response.json({
      success: true,
      analysis: searchAnalysis
    })

  } catch (error) {
    console.error('❌ AI Search API Error:', error)
    return Response.json({
      success: false,
      error: 'AI analysis failed',
      fallback: {
        searchStrategy: "standard",
        productType: "MIXED",
        confidence: 0.3,
        detectedSpecs: {},
        searchTerms: [query || ""],
        reasoning: "Fallback due to AI service error",
        suggestedFilters: [],
        alternativeQueries: []
      }
    }, { status: 500 })
  }
}