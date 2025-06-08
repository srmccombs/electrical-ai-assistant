// /services/analytics.ts
// This file should ONLY contain service functions, NO React components!

import { supabase } from '@/lib/supabase'

// Generate a session ID that persists in memory during the session
// Note: This resets on page refresh since we can't use localStorage
let sessionId: string | null = null

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  return sessionId
}

// Types for analytics tracking
export interface SearchAnalytics {
  searchTerm: string
  resultsCount: number
  searchTimeMs: number
  searchType: 'direct' | 'ai' | 'part_number' | 'brand'
  aiProductType?: string
}

export interface ClickAnalytics {
  searchTerm: string
  clickedPartNumber: string
}

// Track a search query
export const trackSearch = async (data: SearchAnalytics): Promise<void> => {
  try {
    const startTime = Date.now()

    const { error } = await supabase
      .from('search_analytics')
      .insert({
        search_term: data.searchTerm.trim(),
        results_count: data.resultsCount,
        search_time_ms: data.searchTimeMs,
        search_type: data.searchType,
        ai_product_type: data.aiProductType || null,
        user_session: getSessionId(),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Analytics tracking error:', error)
    } else {
      const trackingTime = Date.now() - startTime
      console.log(`Analytics tracked in ${trackingTime}ms`)
    }
  } catch (error) {
    // Silently fail - don't break the app if analytics fails
    console.error('Analytics error:', error)
  }
}

// Track when a user clicks on a search result
export const trackResultClick = async (data: ClickAnalytics): Promise<void> => {
  try {
    // Find the most recent search for this term in this session
    const { data: recentSearch, error: searchError } = await supabase
      .from('search_analytics')
      .select('id')
      .eq('search_term', data.searchTerm)
      .eq('user_session', getSessionId())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (searchError || !recentSearch) {
      console.log('No recent search found to update')
      return
    }

    // Update the search record with the clicked result
    const { error: updateError } = await supabase
      .from('search_analytics')
      .update({ clicked_result: data.clickedPartNumber })
      .eq('id', (recentSearch as any).id)

    if (updateError) {
      console.error('Error updating click analytics:', updateError)
    }
  } catch (error) {
    console.error('Click tracking error:', error)
  }
}

// Get search analytics summary for a date range
export const getSearchAnalytics = async (startDate: Date, endDate: Date) => {
  try {
    const { data, error } = await supabase
      .from('search_analytics_summary')
      .select('*')
      .gte('search_date', startDate.toISOString())
      .lte('search_date', endDate.toISOString())
      .order('search_date', { ascending: false })

    if (error) {
      console.error('Error fetching analytics:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return null
  }
}

// Get popular searches
export const getPopularSearches = async () => {
  try {
    const { data, error } = await supabase
      .from('popular_searches')
      .select('*')
      .limit(20)

    if (error) {
      console.error('Error fetching popular searches:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Popular searches fetch error:', error)
    return []
  }
}

// Get searches with no results (to improve)
export const getNoResultSearches = async (days: number = 7) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('search_analytics')
      .select('search_term, COUNT(*)')
      .eq('results_count', 0)
      .gte('created_at', startDate.toISOString())
      .limit(50)

    if (error) {
      console.error('Error fetching no-result searches:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('No-result searches fetch error:', error)
    return []
  }
}

// Helper to format analytics data for display
export const formatAnalyticsData = (data: any[]) => {
  return data.map(item => ({
    ...item,
    search_date: new Date(item.search_date).toLocaleDateString(),
    avg_search_time_ms: Math.round(item.avg_search_time_ms),
    avg_results_count: Math.round(item.avg_results_count),
    no_results_percentage: ((item.no_results_count / item.total_searches) * 100).toFixed(1)
  }))
}