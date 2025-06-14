// BusinessRuleStage.ts
// Applies immutable electrical industry business rules

import { DecisionStage, BusinessRule } from '../types'
import { SearchDecision } from '../SearchDecision'
import { logger } from '@/utils/logger'

// Individual Business Rules
class Cat5ToCat5eRule implements BusinessRule {
  name = 'Cat5 to Cat5e Redirect'
  description = 'Cat5 is obsolete, always redirect to Cat5e'

  applies(decision: SearchDecision): boolean {
    const query = decision.normalizedQuery
    // Check for cat5 but NOT cat5e
    return /\bcat\s*5\b/i.test(query) && !/\bcat\s*5e\b/i.test(query)
  }

  apply(decision: SearchDecision): SearchDecision {
    const updatedQuery = decision.query.replace(/\bcat\s*5\b/gi, 'Cat5e')
    const updatedNormalized = decision.normalizedQuery.replace(/\bcat\s*5\b/gi, 'cat5e')
    
    return decision
      .redirect(updatedQuery, 'Cat5 is obsolete, redirecting to Cat5e (industry standard)')
      .with({ normalizedQuery: updatedNormalized })
  }
}

class JacketEquivalencyRule implements BusinessRule {
  name = 'Jacket Type Equivalencies'
  description = 'Apply electrical industry jacket type equivalencies'

  private equivalencies = {
    'plenum': ['cmp', 'plenum'],
    'non-plenum': ['cmr', 'riser', 'pvc', 'non-plenum', 'nonplenum']
  }

  applies(decision: SearchDecision): boolean {
    const query = decision.normalizedQuery
    // Check if query contains any jacket-related terms
    const allTerms = Object.values(this.equivalencies).flat()
    return allTerms.some(term => query.includes(term))
  }

  apply(decision: SearchDecision): SearchDecision {
    let normalizedQuery = decision.normalizedQuery

    // Apply plenum mappings
    for (const plenumTerm of this.equivalencies.plenum) {
      if (normalizedQuery.includes(plenumTerm)) {
        // Standardize to 'plenum'
        normalizedQuery = normalizedQuery.replace(
          new RegExp(`\\b${plenumTerm}\\b`, 'gi'),
          'plenum'
        )
      }
    }

    // Apply non-plenum mappings
    for (const nonPlenumTerm of this.equivalencies['non-plenum']) {
      if (normalizedQuery.includes(nonPlenumTerm)) {
        // Standardize to 'non-plenum'
        normalizedQuery = normalizedQuery.replace(
          new RegExp(`\\b${nonPlenumTerm}\\b`, 'gi'),
          'non-plenum'
        )
      }
    }

    if (normalizedQuery === decision.normalizedQuery) {
      return decision // No changes
    }

    return decision.applyMappings(this.equivalencies, 'Applied jacket type equivalencies')
  }
}

class QuantityConversionRule implements BusinessRule {
  name = 'Box Quantity Conversion'
  description = 'Convert box quantities to feet for cables'

  applies(decision: SearchDecision): boolean {
    const query = decision.normalizedQuery
    return /\b\d+\s*(box|boxes)\b/i.test(query)
  }

  apply(decision: SearchDecision): SearchDecision {
    const query = decision.normalizedQuery
    const boxMatch = query.match(/\b(\d+)\s*(box|boxes)\b/i)
    
    if (!boxMatch) return decision

    const boxCount = parseInt(boxMatch[1])
    const feet = boxCount * 1000 // 1 box = 1000 feet for category cables
    
    const updatedQuery = query.replace(
      boxMatch[0],
      `${feet}ft`
    )

    return decision
      .with({ 
        normalizedQuery: updatedQuery,
        hints: [{
          type: 'HINT',
          priority: 'HINT',
          message: `Converted ${boxCount} box${boxCount > 1 ? 'es' : ''} to ${feet} feet`,
          data: { originalQuantity: boxMatch[0], convertedQuantity: `${feet}ft` },
          source: 'BusinessRuleStage'
        }]
      })
      .addMetadata('quantityConversion', {
        from: boxMatch[0],
        to: `${feet}ft`,
        multiplier: 1000
      })
  }
}

class BrandSynonymRule implements BusinessRule {
  name = 'Brand Synonym Mapping'
  description = 'Apply known brand synonyms and variations'

  private brandMappings = {
    'corning': ['corning', 'siecor'],
    'berktek': ['berktek', 'leviton'],
    'general cable': ['general cable', 'prysmian'],
    'commscope': ['commscope', 'systimax']
  }

  applies(decision: SearchDecision): boolean {
    const query = decision.normalizedQuery
    const allBrands = Object.values(this.brandMappings).flat()
    return allBrands.some(brand => query.includes(brand))
  }

  apply(decision: SearchDecision): SearchDecision {
    let hasChanges = false
    const hints: any[] = []

    for (const [canonical, synonyms] of Object.entries(this.brandMappings)) {
      for (const synonym of synonyms) {
        if (decision.normalizedQuery.includes(synonym) && synonym !== canonical) {
          hints.push({
            type: 'HINT',
            priority: 'SUGGEST',
            message: `${synonym} is now ${canonical}`,
            data: { originalBrand: synonym, currentBrand: canonical },
            source: 'BusinessRuleStage'
          })
          hasChanges = true
        }
      }
    }

    if (!hasChanges) return decision

    return decision.addHints(hints)
  }
}

class PolishTypeRule implements BusinessRule {
  name = 'Fiber Polish Type Standards'
  description = 'Standardize fiber connector polish types'

  private polishMappings = {
    'APC': ['apc', 'angled physical contact', 'angled polish', 'green'],
    'UPC': ['upc', 'ultra physical contact', 'ultra polish', 'blue'],
    'PC': ['pc', 'physical contact', 'standard polish']
  }

  applies(decision: SearchDecision): boolean {
    const query = decision.normalizedQuery
    const allTerms = Object.values(this.polishMappings).flat()
    return allTerms.some(term => query.includes(term))
  }

  apply(decision: SearchDecision): SearchDecision {
    const hints: any[] = []
    let hasHints = false

    for (const [standard, variations] of Object.entries(this.polishMappings)) {
      for (const variation of variations) {
        if (decision.normalizedQuery.includes(variation)) {
          if (variation !== standard.toLowerCase()) {
            hints.push({
              type: 'HINT',
              priority: 'HINT',
              message: `${variation} refers to ${standard} polish type`,
              data: { detected: variation, standard },
              source: 'BusinessRuleStage'
            })
            hasHints = true
          }
        }
      }
    }

    if (!hasHints) return decision

    return decision.addHints(hints)
  }
}

// Main Business Rule Stage
export class BusinessRuleStage implements DecisionStage {
  name = 'BusinessRuleStage'
  priority = 1 // Highest priority - runs first

  private rules: BusinessRule[] = [
    new Cat5ToCat5eRule(),
    new JacketEquivalencyRule(),
    new QuantityConversionRule(),
    new BrandSynonymRule(),
    new PolishTypeRule()
  ]

  async process(decision: SearchDecision): Promise<SearchDecision> {
    logger.info(`BusinessRuleStage: Processing query "${decision.query}"`)
    
    let result = decision
    const appliedRules: string[] = []

    // Apply each rule in order
    for (const rule of this.rules) {
      if (rule.applies(result)) {
        logger.info(`Applying rule: ${rule.name}`)
        result = rule.apply(result)
        appliedRules.push(rule.name)
      }
    }

    // Add metadata about which rules were applied
    if (appliedRules.length > 0) {
      result = result.addMetadata('businessRulesApplied', appliedRules)
    }

    logger.info(`BusinessRuleStage: Applied ${appliedRules.length} rules`)
    
    return result
  }

  // Allow adding custom rules
  addRule(rule: BusinessRule): void {
    this.rules.push(rule)
    logger.info(`Added business rule: ${rule.name}`)
  }

  // Get all rules
  getRules(): BusinessRule[] {
    return this.rules
  }
}