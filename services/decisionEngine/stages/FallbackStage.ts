// FallbackStage.ts
// Final stage that ensures every query gets a reasonable result

import { DecisionStage } from '../types'
import { SearchDecision } from '../SearchDecision'
import { logger } from '@/utils/logger'

export class FallbackStage implements DecisionStage {
  name = 'FallbackStage'
  priority = 100 // Lowest priority - runs last

  async process(decision: SearchDecision): Promise<SearchDecision> {
    logger.info('FallbackStage: Checking if fallback needed')

    // If we already have a table and product type, we're good
    if (decision.table && decision.productType) {
      logger.info('FallbackStage: Decision already complete')
      return decision
    }

    // Check for brand-only searches
    const words = decision.getWords()
    if (words.length === 1 && this.isBrandName(words[0])) {
      logger.info(`FallbackStage: Brand-only search detected: ${words[0]}`)
      
      return decision
        .setProductType('MULTI_TABLE')
        .setTable('multi_table')
        .setSearchStrategy('brand_search')
        .setConfidence(0.8)
        .markFinal('Brand-only search across all products')
        .addHint({
          type: 'HINT',
          priority: 'HINT',
          message: `Searching all products from ${words[0]}`,
          data: { brand: words[0] },
          source: 'FallbackStage'
        })
    }

    // Check for cross-reference patterns
    if (this.isCrossReference(decision.normalizedQuery)) {
      logger.info('FallbackStage: Cross-reference search detected')
      
      return decision
        .setProductType('CROSS_REFERENCE')
        .setTable('multi_table')
        .setSearchStrategy('cross_reference')
        .setConfidence(0.7)
        .markFinal('Cross-reference search')
        .addHint({
          type: 'HINT',
          priority: 'HINT',
          message: 'Searching for equivalent products',
          data: { searchType: 'cross_reference' },
          source: 'FallbackStage'
        })
    }

    // Default to category cables as the safest fallback
    logger.info('FallbackStage: Using default cable search')
    
    return decision
      .setProductType('CATEGORY_CABLE')
      .setTable('category_cables')
      .setSearchStrategy('generic_search')
      .setConfidence(0.3)
      .markFinal('No specific product type detected, defaulting to cable search')
      .addHint({
        type: 'WARNING',
        priority: 'HINT',
        message: 'Could not determine specific product type, showing cable results',
        data: { fallbackReason: 'no_match' },
        source: 'FallbackStage'
      })
  }

  private isBrandName(word: string): boolean {
    const brands = [
      'panduit', 'corning', 'belden', 'commscope', 'leviton',
      'berktek', 'systimax', 'mohawk', 'superior', 'general',
      'berk-tek', 'ortronics', 'siemon', 'hubbell', 'legrand',
      'adc', 'apc', 'tripp-lite', 'tripplite', 'blackbox',
      'cables-to-go', 'c2g', 'startech', 'monoprice'
    ]
    
    return brands.includes(word.toLowerCase())
  }

  private isCrossReference(query: string): boolean {
    const crossRefPatterns = [
      /alternative\s+(to|for)/i,
      /replacement\s+(for|of)/i,
      /equivalent\s+(to|of)/i,
      /substitute\s+(for|of)/i,
      /instead\s+of/i,
      /similar\s+to/i,
      /like\s+\w+\s+but/i,
      /\w+\s+version\s+of/i
    ]
    
    return crossRefPatterns.some(pattern => pattern.test(query))
  }
}