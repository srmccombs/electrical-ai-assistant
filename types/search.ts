// types/search.ts
// Search-related type definitions

import type { Product } from './product'
import type { SmartFilters } from './filters'

export interface SearchOptions {
  query: string
  limit?: number
  includeAI?: boolean
}

export interface SearchResult {
  products: Product[]
  searchTime: number
  searchType: string
  aiAnalysis?: AISearchAnalysis
  redirectMessage?: string
  totalFound?: number
  smartFilters?: SmartFilters
}

export interface AISearchAnalysis {
  searchStrategy: string
  productType: string
  confidence: number
  detectedSpecs: DetectedSpecs
  searchTerms: string[]
  reasoning: string
  suggestedFilters: string[]
  alternativeQueries: string[]
  originalQuery: string
  timestamp: string
  aiModel: string
}

export interface DetectedSpecs {
  fiberType?: string
  categoryRating?: string
  connectorType?: string
  jacketRating?: string
  fiberCount?: number
  requestedQuantity?: number
  shielding?: string
  manufacturer?: string
  productType?: string
  color?: string
  application?: string
  productLine?: string
  pairCount?: string
  conductorAwg?: number
  rackUnits?: number
  panelType?: string
  environment?: string
}

// Industry Knowledge Types
export interface ValidationResult {
  isValid: boolean
  message?: string
  suggestedQuery?: string
}

export interface BusinessRuleResult {
  processedTerm: string
  redirectMessage?: string
  appliedRules: string[]
}

export interface DetectedParts {
  hasParts: boolean
  partNumbers: string[]
  quantity?: number
}

// Search Implementation Types
export interface CategoryCableSearchResult {
  products: Product[]
  searchStrategy: string
}

export interface FiberConnectorSearchResult {
  products: Product[]
  searchStrategy: string
}

export interface FiberCableSearchResult {
  products: Product[]
  searchStrategy: string
}

export interface AdapterPanelSearchResult {
  products: Product[]
  searchStrategy: string
}

export interface FiberEnclosureSearchResult {
  products: Product[]
  searchStrategy: string
}