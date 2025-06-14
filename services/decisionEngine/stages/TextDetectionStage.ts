// TextDetectionStage.ts
// Keyword-based detection with electrical industry expertise

import { DecisionStage } from '../types'
import { SearchDecision } from '../SearchDecision'
import { logger } from '@/utils/logger'
import { PRODUCT_TYPES } from '@/config/productTypes'

interface DetectionPattern {
  patterns: RegExp[]
  productType: string
  confidence: number
  priority: number
}

export class TextDetectionStage implements DecisionStage {
  name = 'TextDetectionStage'
  priority = 5 // Fifth priority - after AI

  // Detection patterns ordered by priority (higher number = higher priority)
  private detectionPatterns: DetectionPattern[] = [
    // Surface Mount Box - HIGHEST PRIORITY for SMB
    {
      patterns: [
        /\bsmb\b/i,
        /\bs\.m\.b\b/i,
        /\bsurface\s+mount\s+box/i,
        /\bsurface\s+mount\b.*\bbox/i,
        /\bbiscuit\s+box/i
      ],
      productType: 'SURFACE_MOUNT_BOX',
      confidence: 0.95,
      priority: 100
    },
    
    // Faceplate - High priority
    {
      patterns: [
        /\bfaceplate/i,
        /\bface\s+plate/i,
        /\bwall\s+plate/i,
        /\bwall\s+mount\s+plate/i
      ],
      productType: 'FACEPLATE',
      confidence: 0.90,
      priority: 90
    },
    
    // Jack Module
    {
      patterns: [
        /\bjack\s+module/i,
        /\bkeystone\s+jack/i,
        /\bkeystone/i,
        /\brj45\s+jack/i,
        /\bcat[56]a?\s+jack/i
      ],
      productType: 'JACK_MODULE',
      confidence: 0.85,
      priority: 80
    },
    
    // Fiber Enclosure
    {
      patterns: [
        /\bfiber\s+enclosure/i,
        /\bfiber\s+panel/i,
        /\brack\s+mount\s+enclosure/i,
        /\bwall\s+mount\s+enclosure/i,
        /\b\d+\s*ru\s+enclosure/i,
        /\b\d+\s*panel\s+enclosure/i
      ],
      productType: 'ENCLOSURE',
      confidence: 0.85,
      priority: 70
    },
    
    // Fiber Adapter Panel
    {
      patterns: [
        /\badapter\s+panel/i,
        /\bfiber\s+adapter/i,
        /\bcoupler\s+panel/i,
        /\bfiber\s+patch\s+panel/i
      ],
      productType: 'ADAPTER_PANEL',
      confidence: 0.85,
      priority: 65
    },
    
    // Fiber Connector
    {
      patterns: [
        /\b(lc|sc|st|fc|mtrj)\s+(connector|term)/i,
        /\bfiber\s+connector/i,
        /\bfiber\s+term/i,
        /\b(om[1-4]|os[12])\s+connector/i
      ],
      productType: 'FIBER_CONNECTOR',
      confidence: 0.85,
      priority: 60
    },
    
    // Fiber Cable
    {
      patterns: [
        /\bfiber\s+cable/i,
        /\bfiber\s+optic\s+cable/i,
        /\b(om[1-4]|os[12])\s+fiber/i,
        /\b\d+\s*strand\s+fiber/i,
        /\b(single|multi)mode\s+fiber/i
      ],
      productType: 'FIBER_CABLE',
      confidence: 0.85,
      priority: 55
    },
    
    // Category Cable (lower priority - often the default)
    {
      patterns: [
        /\bcat\s*[56]a?\s+cable/i,
        /\bcategory\s*[56]a?\s+cable/i,
        /\bethernet\s+cable/i,
        /\bnetwork\s+cable/i,
        /\bcat\s*[56]a?\b/i
      ],
      productType: 'CATEGORY_CABLE',
      confidence: 0.80,
      priority: 30
    }
  ]

  async process(decision: SearchDecision): Promise<SearchDecision> {
    logger.info(`TextDetectionStage: Analyzing query "${decision.normalizedQuery}"`)

    // Skip if AI already set high confidence
    if (decision.confidence >= 0.9 && decision.productType) {
      logger.info('TextDetectionStage: Skipping - AI has high confidence')
      return decision
    }

    const detection = this.detectProductType(decision.normalizedQuery)
    
    if (!detection) {
      logger.info('TextDetectionStage: No patterns matched')
      return decision
    }

    logger.info(`TextDetectionStage: Detected ${detection.productType} with confidence ${detection.confidence}`)

    // Get table mapping
    const productConfig = PRODUCT_TYPES[detection.productType]
    if (!productConfig) {
      logger.warn(`No configuration for product type: ${detection.productType}`)
      return decision
    }

    let result = decision
      .setProductType(detection.productType)
      .setTable(productConfig.tableName)
      .setConfidence(detection.confidence)
      .addMetadata('textDetection', {
        pattern: detection.matchedPattern,
        priority: detection.priority
      })

    // Add detection hint
    result = result.addHint({
      type: 'HINT',
      priority: 'HINT',
      message: `Keyword detection: ${detection.productType}`,
      data: {
        pattern: detection.matchedPattern,
        confidence: detection.confidence
      },
      source: 'TextDetectionStage'
    })

    // Mark as final if very high confidence and no AI result
    if (detection.confidence >= 0.95 && !decision.metadata.originalAIAnalysis) {
      result = result.markFinal(`High confidence text detection: ${detection.productType}`)
    }

    return result
  }

  private detectProductType(query: string): any | null {
    let bestMatch: any = null
    let highestPriority = -1

    // Sort patterns by priority (descending)
    const sortedPatterns = [...this.detectionPatterns].sort((a, b) => b.priority - a.priority)

    for (const detection of sortedPatterns) {
      for (const pattern of detection.patterns) {
        if (pattern.test(query)) {
          // If this match has higher priority, use it
          if (detection.priority > highestPriority) {
            bestMatch = {
              productType: detection.productType,
              confidence: detection.confidence,
              priority: detection.priority,
              matchedPattern: pattern.toString()
            }
            highestPriority = detection.priority
          }
          break // Found a match for this detection type
        }
      }
    }

    return bestMatch
  }

  // Check if query contains strong product indicators
  hasStrongProductIndicator(query: string): boolean {
    const strongIndicators = [
      'smb', 'surface mount box',
      'faceplate', 'wall plate',
      'jack module', 'keystone',
      'fiber enclosure', 'rack mount',
      'adapter panel', 'coupler panel'
    ]

    const lowerQuery = query.toLowerCase()
    return strongIndicators.some(indicator => lowerQuery.includes(indicator))
  }

  // Extract all matching patterns (for debugging)
  getAllMatches(query: string): any[] {
    const matches: any[] = []

    for (const detection of this.detectionPatterns) {
      for (const pattern of detection.patterns) {
        if (pattern.test(query)) {
          matches.push({
            productType: detection.productType,
            pattern: pattern.toString(),
            confidence: detection.confidence,
            priority: detection.priority
          })
        }
      }
    }

    return matches.sort((a, b) => b.priority - a.priority)
  }
}