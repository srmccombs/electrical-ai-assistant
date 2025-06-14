// PartNumberStage.ts
// Handles direct part number detection and lookup

import { DecisionStage } from '../types'
import { SearchDecision } from '../SearchDecision'
import { logger } from '@/utils/logger'

interface PartNumberDetection {
  hasParts: boolean
  partNumbers: string[]
  confidence: number
}

export class PartNumberStage implements DecisionStage {
  name = 'PartNumberStage'
  priority = 2 // Second priority - after business rules

  // Common part number patterns in electrical distribution
  private partNumberPatterns = [
    // Panduit format: CJ688TGBU, NK5EPC10MY
    /\b[A-Z]{2,4}\d{2,4}[A-Z]{2,4}\w*\b/,
    
    // Numeric with dashes: 12-345-678, 123-45-6789
    /\b\d{2,3}-\d{2,3}-\d{3,4}\b/,
    
    // Alphanumeric with dashes: ABC-123-DEF
    /\b[A-Z]{2,4}-\d{2,4}-[A-Z]{2,4}\b/,
    
    // Pure numeric 6+ digits: 123456, 7131100
    /\b\d{6,10}\b/,
    
    // Mixed format: 5E2000, 6AS2000
    /\b\d[A-Z]{1,2}\d{3,4}\b/,
    
    // Corning format: 012E8P-31131-29
    /\b\d{3}[A-Z]\d[A-Z]-\d{5}-\d{2}\b/,
    
    // Leviton format: 47605-ACS, 5G108-RW5
    /\b\d{5}-[A-Z]{2,3}\b/,
    /\b\d[A-Z]\d{3}-[A-Z]{1,3}\d?\b/
  ]

  async process(decision: SearchDecision): Promise<SearchDecision> {
    logger.info(`PartNumberStage: Analyzing query "${decision.query}"`)

    const detection = this.detectPartNumbers(decision.query)
    
    if (!detection.hasParts) {
      logger.info('PartNumberStage: No part numbers detected')
      return decision
    }

    logger.info(`PartNumberStage: Detected ${detection.partNumbers.length} part numbers:`, detection.partNumbers)

    // For part number searches, we want to search across all tables
    return decision
      .setProductType('MULTI_TABLE')
      .setSearchStrategy('part_number_search')
      .setTable('multi_table')
      .setConfidence(detection.confidence)
      .markFinal('Direct part number search across all product tables')
      .addMetadata('partNumbers', detection.partNumbers)
      .addHint({
        type: 'HINT',
        priority: 'FORCE',
        message: `Searching for part number${detection.partNumbers.length > 1 ? 's' : ''}: ${detection.partNumbers.join(', ')}`,
        data: { partNumbers: detection.partNumbers },
        source: 'PartNumberStage'
      })
  }

  private detectPartNumbers(query: string): PartNumberDetection {
    const words = query.split(/\s+/)
    const detectedParts: string[] = []
    let hasStrongMatch = false

    for (const word of words) {
      // Skip common words that might match patterns
      if (this.isCommonWord(word)) continue

      // Check against each pattern
      for (const pattern of this.partNumberPatterns) {
        if (pattern.test(word)) {
          detectedParts.push(word)
          
          // Strong indicators of part numbers
          if (word.includes('-') || word.length >= 7) {
            hasStrongMatch = true
          }
          break
        }
      }
    }

    // Calculate confidence based on detection strength
    let confidence = 0.5
    
    if (detectedParts.length > 0) {
      confidence = 0.7
      
      if (hasStrongMatch) {
        confidence = 0.9
      }
      
      // If the entire query is just part numbers, very high confidence
      if (detectedParts.join(' ').length >= query.length * 0.8) {
        confidence = 0.95
      }
    }

    return {
      hasParts: detectedParts.length > 0,
      partNumbers: detectedParts,
      confidence
    }
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'cat5', 'cat5e', 'cat6', 'cat6a',
      'fiber', 'cable', 'connector', 'jack',
      'blue', 'white', 'black', 'red', 'green',
      'plenum', 'riser', 'indoor', 'outdoor',
      '1000ft', '500ft', '250ft'
    ]
    
    return commonWords.includes(word.toLowerCase())
  }

  // Check if a string looks like a catalog number
  isCatalogNumber(text: string): boolean {
    // Must have both letters and numbers
    const hasLetters = /[A-Za-z]/.test(text)
    const hasNumbers = /\d/.test(text)
    
    if (!hasLetters || !hasNumbers) return false
    
    // Check against patterns
    return this.partNumberPatterns.some(pattern => pattern.test(text))
  }

  // Extract potential part numbers from text
  extractPartNumbers(text: string): string[] {
    const words = text.split(/\s+/)
    const partNumbers: string[] = []

    for (const word of words) {
      if (this.isCatalogNumber(word) && !this.isCommonWord(word)) {
        partNumbers.push(word)
      }
    }

    return partNumbers
  }
}