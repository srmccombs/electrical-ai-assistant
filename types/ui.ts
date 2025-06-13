// types/ui.ts
// UI component type definitions

import type { Product } from './product'
import type { AISearchAnalysis } from './search'
import type { SmartFilters } from './filters'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
  timestamp: Date
  searchType?: string
  searchTime?: number
  aiAnalysis?: AISearchAnalysis | null
  smartFilters?: SmartFilters | null
  redirectMessage?: string
  autoApplyFilters?: { [filterType: string]: string }
}

export interface DebugInfo {
  query: string
  timestamp: string
  searchType: string
  searchTime: number
  totalFound: number
  aiAnalysis?: AISearchAnalysis
  redirectMessage?: string
  smartFilters?: SmartFilters
  tablesSearched?: string
  productTypes?: string
}

export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

export interface ColorButtonStyle {
  [key: string]: string
}