// Category Cable Search - Router with V2 toggle
// Created: June 19, 2025
// This file routes between old (complex) and new (simple) search based on environment variable

import { searchCategoryCables as searchCategoryCablesOld } from './categoryCableSearch'
import { searchCategoryCablesV2 } from './categoryCableSearchV2'
import type { CategoryCableSearchOptions, CategoryCableSearchResult } from './categoryCableSearchV2'

/**
 * Main search function that routes to V1 or V2 based on environment variable
 */
export async function searchCategoryCables(
  options: CategoryCableSearchOptions
): Promise<CategoryCableSearchResult> {
  // Check if we should use V2 search
  const useV2 = process.env.NEXT_PUBLIC_USE_V2_SEARCH === 'true'
  
  console.log(`🔄 Category Cable Search Router: Using ${useV2 ? 'V2 (fast)' : 'V1 (legacy)'} search`)
  
  if (useV2) {
    // Use new fast database search
    return searchCategoryCablesV2(options)
  } else {
    // Use old complex detection logic
    return searchCategoryCablesOld(options)
  }
}

/**
 * Compare V1 vs V2 performance for testing
 */
export async function compareSearchPerformance(searchTerm: string) {
  console.log('\n🏁 PERFORMANCE COMPARISON')
  console.log('Search term:', searchTerm)
  console.log('=' .repeat(60))
  
  // Run both searches
  const [v1Result, v2Result] = await Promise.all([
    searchCategoryCablesOld({ searchTerm, limit: 50 }),
    searchCategoryCablesV2({ searchTerm, limit: 50 })
  ])
  
  // Compare results
  console.log('\n📊 RESULTS:')
  console.log(`V1 (old): ${v1Result.searchTime}ms - Found ${v1Result.products.length} products`)
  console.log(`V2 (new): ${v2Result.searchTime}ms - Found ${v2Result.products.length} products`)
  
  const speedup = Math.round(v1Result.searchTime / v2Result.searchTime)
  console.log(`\n🚀 V2 is ${speedup}x faster!`)
  console.log(`Time saved: ${v1Result.searchTime - v2Result.searchTime}ms`)
  
  // Check if results match
  const resultsMatch = v1Result.products.length === v2Result.products.length
  console.log(`\n✅ Result count match: ${resultsMatch ? 'YES' : 'NO'}`)
  
  if (!resultsMatch) {
    console.log(`⚠️  V1 found ${v1Result.products.length}, V2 found ${v2Result.products.length}`)
  }
  
  console.log('=' .repeat(60))
  
  return {
    v1Time: v1Result.searchTime,
    v2Time: v2Result.searchTime,
    speedup,
    v1Count: v1Result.products.length,
    v2Count: v2Result.products.length,
    resultsMatch
  }
}

// Re-export types
export type { CategoryCableSearchOptions, CategoryCableSearchResult }