// types/analytics.ts
// Analytics-related type definitions

export interface SearchAnalyticsData {
  searchTerm: string
  resultsCount: number
  searchTimeMs: number
  searchType: 'direct' | 'ai' | 'part_number' | 'brand'
  aiProductType?: string
}

export interface ResultClickData {
  searchTerm: string
  clickedPartNumber: string
}

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: Date
}

export interface SearchAnalyticsRow {
  id: string
  search_term: string
  results_count: number
  search_time_ms: number
  search_type: string
  ai_product_type?: string
  clicked_results?: string[]
  created_at: string
}

export interface PopularSearch {
  search_term: string
  search_count: number
  avg_results: number
  last_searched: string
}

export interface SearchAnalyticsSummary {
  search_date: string
  total_searches: number
  unique_searches: number
  avg_search_time_ms: number
  ai_searches: number
  direct_searches: number
  part_number_searches: number
  brand_searches: number
  searches_with_results: number
  searches_without_results: number
  total_clicks: number
}