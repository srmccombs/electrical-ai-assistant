// DecisionEngine.test.ts
// Comprehensive test suite for the Decision Engine

import { DecisionEngine } from '../DecisionEngine'
import { SearchDecision } from '../SearchDecision'
import { BusinessRuleStage } from '../stages/BusinessRuleStage'
import { PartNumberStage } from '../stages/PartNumberStage'
import { ContextualStage } from '../stages/ContextualStage'
import { TextDetectionStage } from '../stages/TextDetectionStage'
import { FallbackStage } from '../stages/FallbackStage'
import type { SearchContext } from '../types'

describe('Decision Engine', () => {
  let engine: DecisionEngine

  beforeEach(() => {
    // Create engine with all stages except AI (to avoid API calls in tests)
    engine = new DecisionEngine([
      new BusinessRuleStage(),
      new PartNumberStage(),
      new ContextualStage(),
      new TextDetectionStage(),
      new FallbackStage()
    ])
  })

  describe('Business Rules', () => {
    test('Cat5 redirects to Cat5e', async () => {
      const decision = await engine.decide('cat5 cable blue 1000ft')
      
      expect(decision.query).toContain('Cat5e')
      expect(decision.normalizedQuery).toContain('cat5e')
      expect(decision.auditTrail).toContainEqual(
        expect.objectContaining({
          action: 'REDIRECT',
          reason: expect.stringContaining('Cat5 is obsolete')
        })
      )
    })

    test('Jacket equivalencies are applied', async () => {
      const decision = await engine.decide('cat6 cmr cable')
      
      expect(decision.normalizedQuery).toContain('non-plenum')
      expect(decision.metadata.businessRulesApplied).toContain('Jacket Type Equivalencies')
    })

    test('Box quantity converts to feet', async () => {
      const decision = await engine.decide('2 boxes cat6 cable')
      
      expect(decision.normalizedQuery).toContain('2000ft')
      expect(decision.hints).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Converted 2 boxes to 2000 feet')
        })
      )
    })
  })

  describe('Part Number Detection', () => {
    test('Detects Panduit part numbers', async () => {
      const decision = await engine.decide('CJ688TGBU')
      
      expect(decision.productType).toBe('MULTI_TABLE')
      expect(decision.searchStrategy).toBe('part_number_search')
      expect(decision.isFinal).toBe(true)
      expect(decision.metadata.partNumbers).toContain('CJ688TGBU')
    })

    test('Detects numeric part numbers', async () => {
      const decision = await engine.decide('7131100')
      
      expect(decision.productType).toBe('MULTI_TABLE')
      expect(decision.metadata.partNumbers).toContain('7131100')
    })

    test('Ignores common words that look like part numbers', async () => {
      const decision = await engine.decide('cat6 cable')
      
      expect(decision.productType).not.toBe('MULTI_TABLE')
      expect(decision.metadata.partNumbers).toBeUndefined()
    })
  })

  describe('Contextual Stage', () => {
    test('Suggests compatible brands for faceplates when jacks in cart', async () => {
      const context: SearchContext = {
        shoppingList: {
          jackModules: [
            { brand: 'Panduit', category: 'Cat6', product_line: 'Mini-Com' }
          ]
        }
      }
      
      const decision = await engine.decide('faceplate', context)
      
      expect(decision.hints).toContainEqual(
        expect.objectContaining({
          type: 'COMPATIBILITY',
          message: expect.stringContaining('Panduit')
        })
      )
    })

    test('Filters for fiber compatibility', async () => {
      const context: SearchContext = {
        shoppingList: {
          fiberProducts: [
            { description: 'OM4 fiber cable', fiber_type: 'OM4' }
          ]
        }
      }
      
      const decision = await engine.decide('fiber connector', context)
      
      expect(decision.hints).toContainEqual(
        expect.objectContaining({
          type: 'COMPATIBILITY',
          data: expect.objectContaining({
            requiredFiberTypes: ['OM4']
          })
        })
      )
    })
  })

  describe('Text Detection', () => {
    test('SMB detection has highest priority', async () => {
      const decision = await engine.decide('smb faceplate')
      
      expect(decision.productType).toBe('SURFACE_MOUNT_BOX')
      expect(decision.table).toBe('surface_mount_box')
    })

    test('Detects faceplates correctly', async () => {
      const decision = await engine.decide('2 port faceplate white')
      
      expect(decision.productType).toBe('FACEPLATE')
      expect(decision.table).toBe('faceplates')
    })

    test('Detects jack modules', async () => {
      const decision = await engine.decide('cat6 keystone jack')
      
      expect(decision.productType).toBe('JACK_MODULE')
      expect(decision.table).toBe('jack_modules')
    })

    test('Detects fiber enclosures', async () => {
      const decision = await engine.decide('4ru fiber enclosure')
      
      expect(decision.productType).toBe('ENCLOSURE')
    })
  })

  describe('Fallback Behavior', () => {
    test('Brand-only searches use multi-table', async () => {
      const decision = await engine.decide('panduit')
      
      expect(decision.productType).toBe('MULTI_TABLE')
      expect(decision.searchStrategy).toBe('brand_search')
    })

    test('Unmatched queries default to cables', async () => {
      const decision = await engine.decide('random text that matches nothing')
      
      expect(decision.productType).toBe('CATEGORY_CABLE')
      expect(decision.table).toBe('category_cables')
      expect(decision.confidence).toBeLessThan(0.5)
    })

    test('Cross-reference patterns detected', async () => {
      const decision = await engine.decide('alternative to panduit cj688tgbu')
      
      expect(decision.productType).toBe('CROSS_REFERENCE')
      expect(decision.searchStrategy).toBe('cross_reference')
    })
  })

  describe('Decision Immutability', () => {
    test('Decisions cannot be mutated', async () => {
      const decision = await engine.decide('cat6 cable')
      const originalQuery = decision.query
      
      // Try to mutate (this should create a new decision)
      const newDecision = decision.setProductType('FIBER_CABLE')
      
      expect(decision.query).toBe(originalQuery)
      expect(decision.productType).not.toBe('FIBER_CABLE')
      expect(newDecision.productType).toBe('FIBER_CABLE')
      expect(decision).not.toBe(newDecision)
    })
  })

  describe('Audit Trail', () => {
    test('Every stage is recorded in audit trail', async () => {
      const decision = await engine.decide('cat5 cable')
      
      const stages = decision.auditTrail.map(entry => entry.stage)
      expect(stages).toContain('BUSINESS_RULE')
      expect(decision.metadata.stagesProcessed).toContain('BusinessRuleStage')
    })

    test('Audit entries have timestamps', async () => {
      const decision = await engine.decide('cat6 cable')
      
      decision.auditTrail.forEach(entry => {
        expect(entry.timestamp).toBeInstanceOf(Date)
      })
    })
  })

  describe('Performance', () => {
    test('Decision completes within 300ms', async () => {
      const start = Date.now()
      await engine.decide('cat6 plenum cable 1000ft blue')
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(300)
    })

    test('Simple queries complete faster', async () => {
      const start = Date.now()
      await engine.decide('cable')
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Priority Order', () => {
    test('Business rules apply before text detection', async () => {
      const decision = await engine.decide('cat5 smb')
      
      // Should redirect cat5 to cat5e first
      expect(decision.query).toContain('Cat5e')
      // Then detect SMB
      expect(decision.productType).toBe('SURFACE_MOUNT_BOX')
    })

    test('Part numbers override text detection', async () => {
      const decision = await engine.decide('CJ688TGBU faceplate')
      
      // Part number should win
      expect(decision.productType).toBe('MULTI_TABLE')
      expect(decision.searchStrategy).toBe('part_number_search')
    })
  })

  describe('Edge Cases', () => {
    test('Empty query handled gracefully', async () => {
      const decision = await engine.decide('')
      
      expect(decision.productType).toBe('CATEGORY_CABLE')
      expect(decision.confidence).toBeLessThan(0.5)
    })

    test('Very long queries are handled', async () => {
      const longQuery = 'cat6 ' + 'cable '.repeat(100) + 'blue'
      const decision = await engine.decide(longQuery)
      
      expect(decision).toBeDefined()
      expect(decision.productType).toBe('CATEGORY_CABLE')
    })

    test('Special characters are normalized', async () => {
      const decision = await engine.decide('cat6! @cable# $blue%')
      
      expect(decision.normalizedQuery).toBe('cat6 cable blue')
    })
  })
})

// Integration tests
describe('Decision Engine Integration', () => {
  test('Full SMB vs Faceplate scenario', async () => {
    const engine = new DecisionEngine([
      new BusinessRuleStage(),
      new PartNumberStage(),
      new ContextualStage(),
      new TextDetectionStage(),
      new FallbackStage()
    ])

    // Test various SMB queries
    const smbQueries = [
      'smb',
      'surface mount box',
      '4 port smb black',
      'smb box for cat6 jacks'
    ]

    for (const query of smbQueries) {
      const decision = await engine.decide(query)
      expect(decision.productType).toBe('SURFACE_MOUNT_BOX')
      expect(decision.table).toBe('surface_mount_box')
    }

    // Test faceplate queries
    const faceplateQueries = [
      'faceplate',
      '2 port wall plate',
      'white faceplate for keystone'
    ]

    for (const query of faceplateQueries) {
      const decision = await engine.decide(query)
      expect(decision.productType).toBe('FACEPLATE')
      expect(decision.table).toBe('faceplates')
    }
  })

  test('Shopping list compatibility flow', async () => {
    const engine = new DecisionEngine([
      new BusinessRuleStage(),
      new PartNumberStage(),
      new ContextualStage(),
      new TextDetectionStage(),
      new FallbackStage()
    ])

    const context: SearchContext = {
      shoppingList: {
        jackModules: [
          { brand: 'Panduit', category: 'Cat6', product_line: 'Mini-Com' },
          { brand: 'Leviton', category: 'Cat6', product_line: 'QuickPort' }
        ]
      }
    }

    const decision = await engine.decide('faceplate', context)
    
    expect(decision.productType).toBe('FACEPLATE')
    expect(decision.hints.some(h => 
      h.type === 'COMPATIBILITY' && 
      h.message.includes('Panduit') && 
      h.message.includes('Leviton')
    )).toBe(true)
  })
})