// integration.ts
// How to integrate the new Decision Engine with your existing searchService.ts

import { DecisionEngineAdapter } from './DecisionEngineAdapter'
import { logger } from '@/utils/logger'

// Create the adapter based on environment variable
const isShadowMode = process.env.USE_DECISION_ENGINE === 'shadow'
const decisionAdapter = new DecisionEngineAdapter(isShadowMode)

// Integration function to be called from searchService.ts
export async function searchWithDecisionEngine(
  query: string,
  shoppingListContext?: any,
  oldSearchFunction?: (query: string, context?: any) => Promise<any>
): Promise<any> {
  
  // Set the old function for comparison (only needed in shadow mode)
  if (oldSearchFunction) {
    decisionAdapter.setOldSearchFunction(oldSearchFunction)
  }

  // Use the new engine (in shadow mode it will still return old results)
  return decisionAdapter.search(query, shoppingListContext)
}

// Function to check if we're ready to switch to production
export async function checkProductionReadiness(): Promise<{
  ready: boolean
  report: string
}> {
  // Import supabase here to check actual database
  const { supabase } = await import('@/lib/supabase')
  
  // Get actual decision count from database
  const { count: decisionCount } = await supabase
    .from('search_decisions_audit')
    .select('*', { count: 'exact', head: true })
  
  // Get confidence scores
  const { data: confidenceData } = await supabase
    .from('search_decisions_audit')
    .select('confidence_score')
    .not('confidence_score', 'is', null)
  
  const avgConfidence = confidenceData && confidenceData.length > 0
    ? confidenceData.reduce((sum, row) => sum + (row.confidence_score || 0), 0) / confidenceData.length
    : 0
  
  const ready = (decisionCount || 0) >= 100 && avgConfidence >= 0.75
  
  let report = `Decision Engine Production Readiness Report\n`
  report += `=========================================\n\n`
  report += `Status: ${ready ? '✅ READY' : '❌ NOT READY'}\n\n`
  report += `Metrics:\n`
  report += `- Total Decisions: ${decisionCount || 0}\n`
  report += `- Average Confidence: ${avgConfidence.toFixed(2)}\n`
  
  // Try to get metrics from adapter too
  try {
    const readiness = await decisionAdapter.checkReadiness()
    if (readiness.metrics?.productTypeDistribution) {
      report += `- Product Type Distribution:\n`
      Object.entries(readiness.metrics.productTypeDistribution).forEach(([type, count]) => {
        report += `  - ${type}: ${count}\n`
      })
    }
  } catch (e) {
    // Ignore adapter errors
  }
  
  if (!ready) {
    report += `\nIssues to Address:\n`
    if ((decisionCount || 0) < 100) {
      report += `- Need more test data (${decisionCount}/100 decisions)\n`
    }
    if (avgConfidence < 0.75) {
      report += `- Average confidence too low (${avgConfidence.toFixed(2)}/0.75)\n`
    }
  }
  
  return { ready, report }
}

// Function to switch to production mode
export function switchToProduction(): void {
  logger.info('🚀 Switching Decision Engine to PRODUCTION mode')
  decisionAdapter.setShadowMode(false)
}

// Example of how to modify your existing searchService.ts:
/*

// In searchService.ts, add at the top:
import { searchWithDecisionEngine } from './decisionEngine/integration'

// Then modify your main search function:
export async function searchProducts(
  query: string,
  shoppingListContext?: ShoppingListContext
): Promise<SearchResult> {
  
  // Use feature flag to enable new engine
  const useNewEngine = process.env.USE_DECISION_ENGINE === 'true'
  
  if (useNewEngine) {
    // Pass the old search logic as a function for shadow mode comparison
    return searchWithDecisionEngine(
      query,
      shoppingListContext,
      async (q, ctx) => {
        // Your existing search logic here
        return existingSearchLogic(q, ctx)
      }
    )
  }
  
  // Original search logic
  return existingSearchLogic(query, shoppingListContext)
}

*/

// Monitoring function to track shadow mode divergences
export async function getShadowModeReport(hours: number = 24): Promise<any> {
  try {
    const stats = await decisionAdapter.getStatistics({
      start: new Date(Date.now() - hours * 60 * 60 * 1000),
      end: new Date()
    })

    // For now, return a structured report with available data
    return {
      period: `Last ${hours} hours`,
      statistics: stats,
      divergences: {
        total: 0,
        byType: {},
        criticalQueries: []
      },
      summary: {
        totalSearches: stats?.totalDecisions || 0,
        divergenceRate: 0,
        averageConfidence: stats?.confidenceDistribution?.average || 0,
        productTypeDistribution: stats?.productTypeDistribution || {}
      }
    }
  } catch (error) {
    logger.error('Error generating shadow mode report:', error)
    throw error
  }
}