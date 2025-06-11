// types/search.ts
// Search-related type definitions

import { Product } from './product'
import { SmartFilters } from './filters'

// ===================================================================
// SEARCH OPTIONS AND RESULTS
// ===================================================================

export interface SearchOptions {
  query: string
  limit?: number
  includeAI?: boolean
  shoppingListContext?: {
    hasItems: boolean
    categoryCables?: Array<{
      partNumber: string
      categoryRating: string
      brand: string
      description: string
    }>
    jackModules?: Array<{
      partNumber: string
      categoryRating: string
      brand: string
      productLine: string
      compatibleFaceplates: string
      description: string
    }>
  }
}

export interface SearchResult {
  products: Product[]
  searchTime: number
  searchType: string
  aiAnalysis?: AISearchAnalysis
  redirectMessage?: string
  totalFound?: number
  smartFilters?: SmartFilters
  crossReferenceInfo?: {
    sourcePartNumber?: string
    targetBrand?: string
    crossesFound: number
  }
}

// ===================================================================
// AI ANALYSIS
// ===================================================================

export interface AISearchAnalysis {
  searchStrategy: string
  productType: string
  confidence: number
  detectedSpecs: DetectedSpecs
  searchTerms: string[]
  reasoning?: string
  suggestedFilters?: string[]
  alternativeQueries?: string[]
  originalQuery: string
  timestamp: string
  aiModel: string
}

export interface DetectedSpecs {
  productType?: string
  categoryRating?: string
  jacketRating?: string
  fiberType?: string
  connectorType?: string
  shielding?: string
  color?: string
  length?: number
  requestedQuantity?: number
  manufacturer?: string
  productLine?: string
  rackUnits?: number
  polish?: string
  environment?: string
  fiberCount?: number
  panelType?: string
}

// SmartFilters is now defined in filters.ts to avoid duplication

// ===================================================================
// TABLE-SPECIFIC SEARCH OPTIONS AND RESULTS
// ===================================================================

// Category Cables
export interface CategoryCableSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface CategoryCableSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// Fiber Connectors
export interface FiberConnectorSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface FiberConnectorSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// Fiber Cables
export interface FiberCableSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface FiberCableSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// Adapter Panels
export interface AdapterPanelSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface AdapterPanelSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// Fiber Enclosures
export interface FiberEnclosureSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface FiberEnclosureSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// Jack Modules - ADDED
export interface JackModuleSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface JackModuleSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// INDUSTRY KNOWLEDGE TYPES
// ===================================================================

export interface ValidationResult {
  isValid: boolean
  message?: string
  suggestion?: string
}

export interface BusinessRuleResult {
  originalTerm: string
  processedTerm: string
  wasRedirected: boolean
  redirectMessage: string | null
}

export interface DetectedParts {
  hasParts: boolean
  partNumbers: string[]
  quantity: number | undefined
  remainingText: string
  hasStrandPattern: boolean
  strandCount: number | undefined
}

// ===================================================================
// PRODUCT TABLE TYPE
// ===================================================================

export type ProductTable =
  | 'category_cables'
  | 'fiber_connectors'
  | 'fiber_cables'
  | 'adapter_panels'
  | 'fiber_enclosures'
  | 'rack_mount_fiber_enclosures'
  | 'wall_mount_fiber_enclosures'
  | 'jack_modules'  // ADDED
  | 'faceplates'    // ADDED
  | 'multi_table'

export interface TableInfo {
  name: string
  prefix: string
  hasPartNumber?: boolean
  hasIsActive?: boolean
  columns?: string[]
}

export interface TableDiscoveryResult {
  tables: TableInfo[]
  lastUpdated: Date
  totalTables: number
  searchableTables: number
}