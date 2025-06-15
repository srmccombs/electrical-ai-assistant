// Decision Engine Types
// Central type definitions for the new search decision architecture

import type { SearchDecision } from './SearchDecision'

export interface DecisionStage {
  name: string
  priority: number
  process(decision: SearchDecision): Promise<SearchDecision>
}

export interface ISearchDecision {
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
}

export interface DecisionHint {
  type: 'COMPATIBILITY' | 'FILTER' | 'SUGGEST' | 'HINT' | 'WARNING'
  priority: 'FORCE' | 'FILTER' | 'SUGGEST' | 'HINT'
  message: string
  data: any
  source: string
}

export interface AuditEntry {
  stage: string
  action: string
  value: any
  reason: string
  confidence: number
  timestamp: Date
}

export interface SearchContext {
  shoppingList?: {
    jackModules?: any[]
    cables?: any[]
    faceplates?: any[]
    surfaceMountBoxes?: any[]
    fiberProducts?: any[]
  }
  userLocation?: string
  companyId?: string
  userId?: string
  sessionId?: string
}

export interface DecisionMetadata {
  startTime: number
  currentTime: number
  stagesProcessed: string[]
  originalAIAnalysis?: any
  textDetectionResults?: any
  businessRulesApplied?: string[]
  specifications?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface BusinessRule {
  name: string
  description: string
  applies(decision: SearchDecision): boolean
  apply(decision: SearchDecision): SearchDecision
}

export enum ContextPriority {
  FORCE = 'FORCE',       // Override everything
  FILTER = 'FILTER',     // Apply as filter
  SUGGEST = 'SUGGEST',   // Show first but include others
  HINT = 'HINT'          // Just information
}

export interface StageResult {
  decision: SearchDecision
  performance: {
    duration: number
    cacheHit?: boolean
  }
}

// Type guards
export function isSearchDecision(obj: any): obj is SearchDecision {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.query === 'string' &&
    typeof obj.confidence === 'number' &&
    Array.isArray(obj.auditTrail)
}

export function hasProductType(decision: SearchDecision): boolean {
  return decision.productType !== undefined && decision.productType !== null
}

export function hasTable(decision: SearchDecision): boolean {
  return decision.table !== undefined && decision.table !== null
}