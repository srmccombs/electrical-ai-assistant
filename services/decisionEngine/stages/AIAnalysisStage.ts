// AIAnalysisStage.ts
// Integrates OpenAI GPT-4 for intelligent product type detection

import { DecisionStage } from '../types'
import { SearchDecision } from '../SearchDecision'
import { logger } from '@/utils/logger'
import { getCachedAIAnalysis } from '@/services/aiCache'
import OpenAI from 'openai'
import { PRODUCT_TYPES } from '@/config/productTypes'

interface AISearchAnalysis {
  productType: string
  searchStrategy: string
  specifications: {
    brand?: string
    category?: string
    color?: string
    length?: string
    connectorType?: string
    fiberType?: string
    jacketRating?: string
    shielding?: string
    conductorCount?: string
    portCount?: string
    mountType?: string
  }
  confidence: number
  reasoning: string
}

export class AIAnalysisStage implements DecisionStage {
  name = 'AIAnalysisStage'
  priority = 4 // Fourth priority - after context

  private openai: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for AI Analysis')
    }
    
    this.openai = new OpenAI({ apiKey })
  }

  async process(decision: SearchDecision): Promise<SearchDecision> {
    logger.info(`AIAnalysisStage: Analyzing query "${decision.normalizedQuery}"`)

    try {
      // Use cached AI analysis
      const analysis = await getCachedAIAnalysis(
        decision.normalizedQuery,
        async (query) => {
          // This function is called only if there's no cache hit
          const contextInfo = this.buildContextFromHints(decision)
          return await this.analyzeWithAI(query, contextInfo)
        },
        decision.context?.shoppingListContext
      )

      // Apply the analysis
      return this.applyAIAnalysis(decision, analysis)

    } catch (error) {
      logger.error('AIAnalysisStage error:', error)
      
      // Don't fail the entire search if AI fails
      return decision.addHint({
        type: 'WARNING',
        priority: 'HINT',
        message: 'AI analysis unavailable, using keyword detection',
        data: { error: error.message },
        source: 'AIAnalysisStage'
      })
    }
  }

  private buildContextFromHints(decision: SearchDecision): string {
    const hints = decision.hints
    const contextParts: string[] = []

    // Add shopping list context
    hints.forEach(hint => {
      if (hint.type === 'COMPATIBILITY' && hint.data) {
        if (hint.data.compatibleBrands) {
          contextParts.push(`User has ${hint.data.compatibleBrands.join(', ')} products in cart`)
        }
        if (hint.data.requiredCategories) {
          contextParts.push(`Looking for ${hint.data.requiredCategories.join('/')} compatible products`)
        }
        if (hint.data.requiredFiberTypes) {
          contextParts.push(`Needs ${hint.data.requiredFiberTypes.join('/')} fiber compatibility`)
        }
      }
    })

    // Add business rule context
    if (decision.metadata.businessRulesApplied) {
      contextParts.push(`Applied rules: ${decision.metadata.businessRulesApplied.join(', ')}`)
    }

    return contextParts.length > 0 ? `\nContext: ${contextParts.join('. ')}` : ''
  }

  private async analyzeWithAI(query: string, context: string): Promise<AISearchAnalysis> {
    const productTypesList = Object.entries(PRODUCT_TYPES)
      .map(([key, config]) => `- ${key}: ${config.displayName} (keywords: ${config.aiKeywords.join(', ')})`)
      .join('\n')

    const prompt = `You are an AI assistant specialized in electrical distribution products. Analyze the following search query and determine the product type and specifications.

CRITICAL ELECTRICAL INDUSTRY RULES:
1. "SMB" ALWAYS means "Surface Mount Box" in electrical context (never cables or other products)
2. "Cat5" should always redirect to "Cat5e" (Cat5 is obsolete)
3. These jacket types are equivalent: non-plenum = CMR = riser = PVC
4. "Plenum" = CMP rated jacket
5. Brand names: Corning = Siecor, BerkTek = Leviton
6. Fiber polish types: APC (green/angled), UPC (blue/standard), PC (legacy)

AVAILABLE PRODUCT TYPES:
${productTypesList}

SEARCH QUERY: "${query}"${context}

Analyze this query and respond with a JSON object containing:
1. productType: The EXACT product type key from the list above (e.g., "CATEGORY_CABLE", "FIBER_CONNECTOR")
2. searchStrategy: One of: "exact_match", "filtered_search", "cross_reference", "generic_search"
3. specifications: Extract ALL relevant specifications (brand, category, color, length, etc.)
4. confidence: A number between 0 and 1 indicating confidence in the analysis
5. reasoning: Brief explanation of why you chose this product type

Important:
- If the query mentions "SMB" or "surface mount box", productType MUST be "SURFACE_MOUNT_BOX"
- If the query mentions "faceplate" or "wall plate", productType MUST be "FACEPLATE"
- If the query mentions "jack" or "keystone", productType MUST be "JACK_MODULE"
- For ambiguous queries, prefer the most specific product type that matches
- Extract ALL specifications mentioned, even if they seem minor`

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an electrical product expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0]?.message?.content
      
      if (!response) {
        throw new Error('No response from AI')
      }

      const analysis = JSON.parse(response) as AISearchAnalysis
      
      // Validate the response
      if (!this.isValidProductType(analysis.productType)) {
        logger.warn(`AI returned invalid product type: ${analysis.productType}`)
        analysis.productType = 'CATEGORY_CABLE' // Safe default
        analysis.confidence *= 0.5 // Reduce confidence
      }

      return analysis

    } catch (error) {
      logger.error('AI API error:', error)
      throw error
    }
  }

  private applyAIAnalysis(decision: SearchDecision, analysis: AISearchAnalysis): SearchDecision {
    let result = decision
      .setProductType(analysis.productType)
      .setSearchStrategy(analysis.searchStrategy)
      .setConfidence(analysis.confidence)
      .setAIAnalysis(analysis)

    // Map product type to table
    const productConfig = PRODUCT_TYPES[analysis.productType]
    if (productConfig) {
      result = result.setTable(productConfig.tableName)
    }

    // Add specifications as metadata
    if (analysis.specifications && Object.keys(analysis.specifications).length > 0) {
      result = result.addMetadata('specifications', analysis.specifications)
    }

    // Add AI reasoning as hint
    result = result.addHint({
      type: 'HINT',
      priority: 'HINT',
      message: analysis.reasoning,
      data: {
        productType: analysis.productType,
        confidence: analysis.confidence,
        specifications: analysis.specifications
      },
      source: 'AIAnalysisStage'
    })

    // High confidence AI results can be final
    if (analysis.confidence >= 0.9 && productConfig) {
      result = result.markFinal(`High confidence AI analysis: ${analysis.productType}`)
    }

    return result
  }

  private isValidProductType(productType: string): boolean {
    return productType in PRODUCT_TYPES
  }

  // Enhanced prompt for specific scenarios
  private getEnhancedPrompt(query: string): string {
    const lowerQuery = query.toLowerCase()
    
    // SMB-specific enhancement
    if (lowerQuery.includes('smb') || lowerQuery.includes('surface mount')) {
      return '\nIMPORTANT: This query is asking about Surface Mount Boxes (SMB), not cables or other products.'
    }
    
    // Faceplate-specific enhancement
    if (lowerQuery.includes('faceplate') || lowerQuery.includes('wall plate')) {
      return '\nIMPORTANT: This query is asking about faceplates/wall plates for mounting jack modules.'
    }
    
    // Jack module enhancement
    if (lowerQuery.includes('jack') || lowerQuery.includes('keystone')) {
      return '\nIMPORTANT: This query is asking about jack modules (keystone jacks) for terminating cables.'
    }
    
    return ''
  }
}