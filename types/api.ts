// types/api.ts
// API-related type definitions

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AISearchRequest {
  query: string
  userContext: {
    businessType: string
  }
}

export interface AISearchResponse {
  success: boolean
  analysis?: AISearchAnalysis
  fallback?: AISearchAnalysis
  error?: string
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface SupabaseResponse<T> {
  data: T | null
  error: Error | null
}

// Re-import types needed
import type { AISearchAnalysis } from './search'