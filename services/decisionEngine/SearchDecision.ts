// SearchDecision.ts
// Immutable decision object that tracks all search routing decisions

import { v4 as uuidv4 } from 'uuid'
import {
  SearchDecision as ISearchDecision,
  DecisionHint,
  AuditEntry,
  SearchContext,
  DecisionMetadata
} from './types'

export class SearchDecision implements ISearchDecision {
  readonly id: string
  readonly query: string
  readonly normalizedQuery: string
  readonly stage: string
  readonly confidence: number
  readonly productType?: string
  readonly searchStrategy?: string
  readonly table?: string
  readonly hints: DecisionHint[]
  readonly auditTrail: AuditEntry[]
  readonly isFinal: boolean
  readonly context?: SearchContext
  readonly metadata: DecisionMetadata

  constructor(data: Partial<ISearchDecision> & { query: string }) {
    this.id = data.id || uuidv4()
    this.query = data.query
    this.normalizedQuery = data.normalizedQuery || this.normalizeQuery(data.query)
    this.stage = data.stage || 'INITIAL'
    this.confidence = data.confidence || 0
    this.productType = data.productType
    this.searchStrategy = data.searchStrategy
    this.table = data.table
    this.hints = data.hints || []
    this.auditTrail = data.auditTrail || []
    this.isFinal = data.isFinal || false
    this.context = data.context
    this.metadata = data.metadata || {
      startTime: Date.now(),
      currentTime: Date.now(),
      stagesProcessed: []
    }
  }

  // Create a new decision with updated properties (immutability)
  private with(updates: Partial<ISearchDecision>): SearchDecision {
    const newAuditEntry: AuditEntry = {
      stage: this.stage,
      action: this.getActionFromUpdates(updates),
      value: this.getValueFromUpdates(updates),
      reason: updates.auditTrail?.[0]?.reason || 'No reason provided',
      confidence: updates.confidence || this.confidence,
      timestamp: new Date()
    }

    return new SearchDecision({
      ...this.toJSON(),
      ...updates,
      auditTrail: [...this.auditTrail, newAuditEntry],
      metadata: {
        ...this.metadata,
        currentTime: Date.now(),
        stagesProcessed: updates.stage 
          ? [...this.metadata.stagesProcessed, updates.stage]
          : this.metadata.stagesProcessed
      }
    })
  }

  // Business Rule Methods
  redirect(newQuery: string, reason: string): SearchDecision {
    return this.with({
      query: newQuery,
      normalizedQuery: this.normalizeQuery(newQuery),
      stage: 'BUSINESS_RULE',
      auditTrail: [{
        stage: 'BUSINESS_RULE',
        action: 'REDIRECT',
        value: { from: this.query, to: newQuery },
        reason,
        confidence: 1.0,
        timestamp: new Date()
      }]
    })
  }

  applyMappings(mappings: Record<string, string[]>, reason: string): SearchDecision {
    let normalizedQuery = this.normalizedQuery
    
    for (const [term, equivalents] of Object.entries(mappings)) {
      for (const equivalent of equivalents) {
        if (normalizedQuery.includes(equivalent.toLowerCase())) {
          normalizedQuery = normalizedQuery.replace(
            new RegExp(equivalent, 'gi'),
            term
          )
        }
      }
    }

    if (normalizedQuery === this.normalizedQuery) {
      return this // No changes
    }

    return this.with({
      normalizedQuery,
      stage: 'BUSINESS_RULE',
      auditTrail: [{
        stage: 'BUSINESS_RULE',
        action: 'APPLY_MAPPINGS',
        value: mappings,
        reason,
        confidence: 1.0,
        timestamp: new Date()
      }]
    })
  }

  // Product Type and Strategy Methods
  setProductType(productType: string, confidence: number = 1.0): SearchDecision {
    return this.with({
      productType,
      confidence,
      stage: this.stage
    })
  }

  setSearchStrategy(strategy: string): SearchDecision {
    return this.with({
      searchStrategy: strategy,
      stage: this.stage
    })
  }

  setTable(table: string): SearchDecision {
    return this.with({
      table,
      stage: this.stage
    })
  }

  setStage(stage: string): SearchDecision {
    return this.with({ stage })
  }

  setConfidence(confidence: number): SearchDecision {
    return this.with({ confidence })
  }

  // Hint Management
  addHint(hint: DecisionHint): SearchDecision {
    return this.with({
      hints: [...this.hints, hint]
    })
  }

  addHints(hints: DecisionHint[]): SearchDecision {
    return this.with({
      hints: [...this.hints, ...hints]
    })
  }

  // Finalization
  markFinal(reason: string = 'Decision finalized'): SearchDecision {
    return this.with({
      isFinal: true,
      auditTrail: [{
        stage: this.stage,
        action: 'FINALIZE',
        value: { productType: this.productType, table: this.table },
        reason,
        confidence: this.confidence,
        timestamp: new Date()
      }]
    })
  }

  // Query Analysis Helpers
  hasKeyword(keyword: string): boolean {
    return this.normalizedQuery.includes(keyword.toLowerCase())
  }

  hasAnyKeyword(keywords: string[]): boolean {
    return keywords.some(kw => this.hasKeyword(kw))
  }

  hasAllKeywords(keywords: string[]): boolean {
    return keywords.every(kw => this.hasKeyword(kw))
  }

  getWords(): string[] {
    return this.normalizedQuery.split(/\s+/).filter(w => w.length > 0)
  }

  // Metadata Methods
  addMetadata(key: string, value: any): SearchDecision {
    return this.with({
      metadata: {
        ...this.metadata,
        [key]: value
      }
    })
  }

  setAIAnalysis(analysis: any): SearchDecision {
    return this.with({
      metadata: {
        ...this.metadata,
        originalAIAnalysis: analysis
      }
    })
  }

  setTextDetection(results: any): SearchDecision {
    return this.with({
      metadata: {
        ...this.metadata,
        textDetectionResults: results
      }
    })
  }

  // Context Methods
  setContext(context: SearchContext): SearchDecision {
    return this.with({ context })
  }

  hasShoppingListItems(): boolean {
    if (!this.context?.shoppingList) return false
    
    const list = this.context.shoppingList
    return !!(
      list.jackModules?.length ||
      list.cables?.length ||
      list.faceplates?.length ||
      list.surfaceMountBoxes?.length ||
      list.fiberProducts?.length
    )
  }

  // Utility Methods
  toJSON(): ISearchDecision {
    return {
      id: this.id,
      query: this.query,
      normalizedQuery: this.normalizedQuery,
      stage: this.stage,
      confidence: this.confidence,
      productType: this.productType,
      searchStrategy: this.searchStrategy,
      table: this.table,
      hints: this.hints,
      auditTrail: this.auditTrail,
      isFinal: this.isFinal,
      context: this.context,
      metadata: this.metadata
    }
  }

  getDuration(): number {
    return this.metadata.currentTime - this.metadata.startTime
  }

  getStagesProcessed(): string[] {
    return this.metadata.stagesProcessed
  }

  // Private Helpers
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private getActionFromUpdates(updates: Partial<ISearchDecision>): string {
    if (updates.productType) return 'SET_PRODUCT_TYPE'
    if (updates.table) return 'SET_TABLE'
    if (updates.searchStrategy) return 'SET_STRATEGY'
    if (updates.confidence !== undefined) return 'SET_CONFIDENCE'
    if (updates.hints) return 'ADD_HINTS'
    if (updates.stage) return 'SET_STAGE'
    return 'UPDATE'
  }

  private getValueFromUpdates(updates: Partial<ISearchDecision>): any {
    if (updates.productType) return updates.productType
    if (updates.table) return updates.table
    if (updates.searchStrategy) return updates.searchStrategy
    if (updates.confidence !== undefined) return updates.confidence
    if (updates.hints) return updates.hints
    if (updates.stage) return updates.stage
    return updates
  }
}