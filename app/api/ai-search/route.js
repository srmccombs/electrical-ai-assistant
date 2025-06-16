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

    // Extract shopping list context if provided
    const shoppingListContext = userContext?.shoppingListContext
    let compatibilityContext = ''
    
    if (shoppingListContext?.hasItems) {
      // Handle category cables context
      if (shoppingListContext?.categoryCables?.length > 0) {
        const categoriesInCart = [...new Set(shoppingListContext.categoryCables.map(cable => cable.categoryRating))].filter(Boolean)
        const brandsInCart = [...new Set(shoppingListContext.categoryCables.map(cable => cable.brand))].filter(Boolean)
        
        compatibilityContext += `\n\nSHOPPING LIST CONTEXT (for compatibility matching):
- Customer has ${shoppingListContext.categoryCables.length} category cable(s) in their list
- Categories in cart: ${categoriesInCart.join(', ') || 'Various'}
- Brands in cart: ${brandsInCart.join(', ') || 'Various'}

When searching for jack modules or faceplates:
- Prioritize products compatible with ${categoriesInCart.join(', ')} cables
- Consider brand compatibility with ${brandsInCart.join(', ')}
- Include in detectedSpecs: categoryRating that matches items in cart`
        
        console.log('🛒 Shopping list context detected (cables):', {
          cablesInCart: shoppingListContext.categoryCables.length,
          categories: categoriesInCart,
          brands: brandsInCart
        })
      }
      
      // Handle jack modules context
      if (shoppingListContext?.jackModules?.length > 0) {
        const jackCategoriesInCart = [...new Set(shoppingListContext.jackModules.map(jack => jack.categoryRating))].filter(Boolean)
        const jackBrandsInCart = [...new Set(shoppingListContext.jackModules.map(jack => jack.brand))].filter(Boolean)
        const jackProductLinesInCart = [...new Set(shoppingListContext.jackModules.map(jack => jack.productLine))].filter(Boolean)
        
        // Get compatible faceplates values
        const compatibleFaceplatesValues = [...new Set(shoppingListContext.jackModules.map(jack => jack.compatibleFaceplates))].filter(Boolean)
        
        compatibilityContext += `\n\nJACK MODULE CONTEXT (for faceplate compatibility):
- Customer has ${shoppingListContext.jackModules.length} jack module(s) in their list
- Jack categories: ${jackCategoriesInCart.join(', ') || 'Various'}
- Jack brands: ${jackBrandsInCart.join(', ') || 'Various'}
- Jack product lines: ${jackProductLinesInCart.join(', ') || 'Various'}
- Compatible faceplates: ${compatibleFaceplatesValues.join(', ') || 'Not specified'}

When searching for faceplates or surface mount boxes:
- STRONGLY prioritize ${jackBrandsInCart.join(', ')} brand faceplates/boxes
- IMPORTANT: Use the compatible_faceplates value exactly as shown: "${compatibleFaceplatesValues[0] || jackProductLinesInCart[0]}"
- Include in detectedSpecs: manufacturer="${jackBrandsInCart[0]}" and productLine="${compatibleFaceplatesValues[0] || jackProductLinesInCart[0]}"
- DO NOT add curly braces {} around the productLine value
- If the compatible_faceplates contains comma-separated values like "netSelect, ISTATION", use it exactly as is`
        
        console.log('🛒 Shopping list context detected (jack modules):', {
          jackModulesInCart: shoppingListContext.jackModules.length,
          categories: jackCategoriesInCart,
          brands: jackBrandsInCart,
          productLines: jackProductLinesInCart
        })
      }
      
      // Handle fiber cables context
      if (shoppingListContext?.fiberCables?.length > 0) {
        const fiberTypesInCart = [...new Set(shoppingListContext.fiberCables.map(cable => cable.fiberType))].filter(Boolean)
        const brandsInCart = [...new Set(shoppingListContext.fiberCables.map(cable => cable.brand))].filter(Boolean)
        
        compatibilityContext += `\n\nFIBER CABLE CONTEXT (for connector compatibility):
- Customer has ${shoppingListContext.fiberCables.length} fiber cable(s) in their list
- Fiber types in cart: ${fiberTypesInCart.join(', ') || 'Various'}
- Brands in cart: ${brandsInCart.join(', ') || 'Various'}

When searching for fiber connectors:
- STRONGLY prioritize connectors matching fiber types: ${fiberTypesInCart.join(', ')}
- Include in detectedSpecs: fiberType="${fiberTypesInCart[0] || ''}"
- Filter results to show ${fiberTypesInCart.join(' or ')} compatible connectors first
- Consider brand compatibility with ${brandsInCart.join(', ')}`
        
        console.log('🛒 Shopping list context detected (fiber cables):', {
          fiberCablesInCart: shoppingListContext.fiberCables.length,
          fiberTypes: fiberTypesInCart,
          brands: brandsInCart
        })
      }
    }

    const aiPrompt = `You are an expert electrical distributor AI assistant with 35+ years of experience.
Your job is to analyze customer requests and provide the MOST SPECIFIC search strategy.

CUSTOMER QUERY: "${query}"${compatibilityContext}

CRITICAL ROUTING RULES (follow these exactly):

1. If query mentions "jack", "keystone", "RJ45 jack", "ethernet jack", "mini-com", or jack part numbers (CJ688, CJ5e88, CJ6X88):
   → searchStrategy: "jack_modules", productType: "JACK_MODULE"

2. If query mentions "faceplate", "face plate", "wall plate", "wallplate":
   → searchStrategy: "faceplates", productType: "FACEPLATE"

2a. If query mentions "surface mount box", "SMB", "S.M.B", "SM box", "surface box":
   → searchStrategy: "surface_mount_box", productType: "SURFACE_MOUNT_BOX"
   IMPORTANT: "SMB" = Surface Mount Box, a separate product from faceplates!

3. If query mentions "connectors", "fiber ends", "fiber end", "fibre ends", "fibre end" + fiber type (LC, SC, ST, FC, MTP, MPO, OM1-5, OS1-2):
   → searchStrategy: "connectors", productType: "CONNECTOR"
   Note: "fiber ends" is a common industry term for fiber connectors

4. If query mentions cable length (ft, feet, meters) + fiber type:
   → searchStrategy: "cables", productType: "CABLE"

5. If query mentions "panel" or "patch panel" (but NOT jack):
   → searchStrategy: "panels", productType: "PANEL"

6. If query mentions category cable (Cat5, Cat6, ethernet) WITHOUT "jack":
   → searchStrategy: "cables", productType: "CABLE"

7. If query mentions "enclosure", "housing", "rack mount", or rack units (RU, 1U, 2U, 4U):
   → searchStrategy: "enclosures", productType: "ENCLOSURE"

8. ONLY use "mixed" for very general queries with no specific product type

JACK MODULE EXAMPLES (VERY IMPORTANT):
- "cat6a jack" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "panduit keystone" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "CJ688TGBU" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "mini-com cat6 utp" → productType: "JACK_MODULE", searchStrategy: "jack_modules"
- "100 cat5e jacks" → productType: "JACK_MODULE", searchStrategy: "jack_modules", requestedQuantity: 100
- "shielded cat6a jack blue" → productType: "JACK_MODULE", searchStrategy: "jack_modules"

FACEPLATE EXAMPLES (VERY IMPORTANT):
- "2 port faceplate" → productType: "FACEPLATE", searchStrategy: "faceplates"
- "single gang wall plate" → productType: "FACEPLATE", searchStrategy: "faceplates"
- "panduit faceplate white" → productType: "FACEPLATE", searchStrategy: "faceplates"
- "blank faceplate" → productType: "FACEPLATE", searchStrategy: "faceplates"
- "keystone faceplate" → productType: "FACEPLATE", searchStrategy: "faceplates"

SURFACE MOUNT BOX EXAMPLES (VERY IMPORTANT):
- "4 port surface mount box" → productType: "SURFACE_MOUNT_BOX", searchStrategy: "surface_mount_box"
- "1 port SMB" → productType: "SURFACE_MOUNT_BOX", searchStrategy: "surface_mount_box"
- "10 SMB" → productType: "SURFACE_MOUNT_BOX", searchStrategy: "surface_mount_box", requestedQuantity: 10
- "2 port S.M.B" → productType: "SURFACE_MOUNT_BOX", searchStrategy: "surface_mount_box"
- "surface box white" → productType: "SURFACE_MOUNT_BOX", searchStrategy: "surface_mount_box"

FIBER CONNECTOR EXAMPLES WITH POLISH:
- "sc apc connectors" → productType: "CONNECTOR", searchStrategy: "connectors", connectorType: "SC", polish: "APC"
- "lc upc connectors om4" → productType: "CONNECTOR", searchStrategy: "connectors", connectorType: "LC", polish: "UPC", fiberType: "OM4"
- "48 fiber connectors sc apc" → productType: "CONNECTOR", searchStrategy: "connectors", connectorType: "SC", polish: "APC", requestedQuantity: 48
- "angled polish sc connectors" → productType: "CONNECTOR", searchStrategy: "connectors", connectorType: "SC", polish: "APC"
- "green sc connectors" → productType: "CONNECTOR", searchStrategy: "connectors", connectorType: "SC", polish: "APC" (green = APC)

FIBER ENDS EXAMPLES (common industry term for fiber connectors):
- "fiber ends lc" → productType: "CONNECTOR", searchStrategy: "connectors", connectorType: "LC"
- "20 fiber ends sc apc" → productType: "CONNECTOR", searchStrategy: "connectors", connectorType: "SC", polish: "APC", requestedQuantity: 20
- "singlemode fiber ends" → productType: "CONNECTOR", searchStrategy: "connectors", fiberType: "OS2"
- "om4 fiber ends" → productType: "CONNECTOR", searchStrategy: "connectors", fiberType: "OM4"

OTHER EXAMPLES:
- "lc connectors om4" → productType: "CONNECTOR", searchStrategy: "connectors", fiberType: "OM4"
- "sc adapters multimode" → productType: "CONNECTOR", searchStrategy: "connectors", fiberType: null
- "1000 ft om3 cable" → productType: "CABLE", searchStrategy: "cables", fiberType: "OM3"
- "300ft of 12 fiber" → productType: "CABLE", searchStrategy: "cables", fiberType: null, fiberCount: 12
- "12 strand fiber cable" → productType: "CABLE", searchStrategy: "cables", fiberType: null, fiberCount: 12
- "6 pair fiber cable" → productType: "CABLE", searchStrategy: "cables", fiberType: null, fiberCount: 12
- "12pr om4" → productType: "CABLE", searchStrategy: "cables", fiberType: "OM4", fiberCount: 24
- "3-pare singlemode" → productType: "CABLE", searchStrategy: "cables", fiberType: "OS2", fiberCount: 6
- "6 piar multimode" → productType: "CABLE", searchStrategy: "cables", fiberType: null, fiberCount: 12
- "cat6 plenum blue" → productType: "CABLE", searchStrategy: "cables"
- "fiber patch panel" → productType: "PANEL", searchStrategy: "panels"
- "4RU enclosure" → productType: "ENCLOSURE", searchStrategy: "enclosures"
- "fiber optic" (general) → productType: "MIXED", searchStrategy: "mixed"

QUANTITY DETECTION (VERY IMPORTANT):
- Extract any quantities: "10000 ft", "24 connectors", "12 LC", "48 adapters", "100 jacks"
- Convert to numbers: "10,000 ft" → 10000, "24 LC" → 24

FIBER TYPE MAPPING (CRITICAL for real-world usage):
- User says "single mode", "singlemode", "SM", "sm", "Single Mode", "SINGLE MODE", "single-mode" → Map to: "OS2" 
- User says "multimode", "MM", "mm", "Multi Mode", "MULTIMODE", "multi-mode" → Map to: null (show all multimode)
- User says "50/125" → Map to: "OM3" or "OM4" (modern multimode)
- User says "62.5/125" → Map to: "OM1" (legacy multimode)  
- User says "9/125" → Map to: "OS2" (single mode)
- IMPORTANT: Most users say "single mode" not "OS2", but database uses OS1/OS2
- CRITICAL: Treat ALL case variations as equivalent (SM = sm = Sm = sM)
- CRITICAL: If NO fiber type is specified (just "fiber" or "12 fiber"), set fiberType: null (show ALL fiber types)

FIBER PAIR-TO-COUNT CONVERSION (VERY IMPORTANT - "these guys can't spell"):
- 1 pair = 2 fibers (1 pr = 2 fibers)
- 3 pair = 6 fibers (3 pr = 6 fibers) 
- 6 pair = 12 fibers (6 pr = 12 fibers)
- 12 pair = 24 fibers (12 pr = 24 fibers)
- Common misspellings: "pr", "prs", "pare", "pares", "piar", "piars", "par", "pars"
- Formats: "3pair", "3 pair", "3-pair", "3pr", "3 pr", "3-pr", "3 pare", "3-pare"
- ALWAYS convert pair count to fiber count for fiberCount field (multiply by 2)
- Examples:
  - "12 pair fiber" → fiberCount: 24
  - "6pr cable" → fiberCount: 12
  - "3 pare om4" → fiberCount: 6, fiberType: "OM4"
  - "12-pr singlemode" → fiberCount: 24, fiberType: "OS2"

POLISH TYPE DETECTION (VERY IMPORTANT):
- APC = Angled Physical Contact (8-degree angle, green color, lowest back reflection)
- UPC = Ultra Physical Contact (blue color, standard for most applications)
- PC = Physical Contact (older standard, rarely used)
- SPC = Super Physical Contact (improved PC, rarely used)
- IMPORTANT: If user says "APC" or "angled polish", set polish: "APC"
- IMPORTANT: APC connectors are typically green and critical for high-performance applications

RESPOND WITH ONLY JSON:
{
  "searchStrategy": "jack_modules|faceplates|surface_mount_box|connectors|cables|panels|enclosures|mixed",
  "productType": "JACK_MODULE|FACEPLATE|SURFACE_MOUNT_BOX|CONNECTOR|CABLE|PANEL|ENCLOSURE|MIXED",
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
    "rackUnits": number or null,
    "polish": "APC|UPC|PC|SPC or null"
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

      // FORCE FIX: If query contains faceplate-related terms but AI said "MIXED", fix it
      if ((queryLower.includes('faceplate') || queryLower.includes('face plate') ||
           queryLower.includes('wall plate') || queryLower.includes('wallplate') ||
           queryLower.includes('surface mount box') || queryLower.includes('smb') ||
           queryLower.includes('s.m.b') || queryLower.includes('sm box')) &&
          searchAnalysis.productType === 'MIXED') {
        console.log('🔧 FORCE FIX: Correcting MIXED to FACEPLATE')
        searchAnalysis.productType = 'FACEPLATE'
        searchAnalysis.searchStrategy = 'faceplates'
        searchAnalysis.confidence = 0.95
        searchAnalysis.reasoning = 'Force corrected to faceplates based on keyword detection'
      }

      // ADDITIONAL FORCE FIX: If query contains SMB-related terms but AI said "CABLE" or "FACEPLATE", fix it
      if ((queryLower.includes('smb') || queryLower.includes('s.m.b') || 
           queryLower.includes('sm box') || queryLower.includes('surface mount box')) &&
          (searchAnalysis.productType === 'CABLE' || searchAnalysis.productType === 'MIXED' || searchAnalysis.productType === 'FACEPLATE')) {
        console.log('🔧 FORCE FIX: Correcting ' + searchAnalysis.productType + ' to SURFACE_MOUNT_BOX for SMB')
        searchAnalysis.productType = 'SURFACE_MOUNT_BOX'
        searchAnalysis.searchStrategy = 'surface_mount_box'
        searchAnalysis.confidence = 0.95
        searchAnalysis.reasoning = 'Force corrected to surface mount box - SMB = Surface Mount Box'
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