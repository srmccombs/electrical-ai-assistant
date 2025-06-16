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
  const readiness = await decisionAdapter.checkReadiness()
  
  let report = `Decision Engine Production Readiness Report\n`
  report += `=========================================\n\n`
  report += `Status: ${readiness.ready ? '✅ READY' : '❌ NOT READY'}\n\n`
  
  if (readiness.metrics) {
    report += `Metrics:\n`
    report += `- Total Decisions: ${readiness.metrics.totalDecisions}\n`
    report += `- Average Confidence: ${readiness.metrics.confidenceDistribution?.average?.toFixed(2) || 'N/A'}\n`
    report += `- Product Type Distribution:\n`
    
    if (readiness.metrics.productTypeDistribution) {
      Object.entries(readiness.metrics.productTypeDistribution).forEach(([type, count]) => {
        report += `  - ${type}: ${count}\n`
      })
    }
  }
  
  if (readiness.issues.length > 0) {
    report += `\nIssues to Address:\n`
    readiness.issues.forEach(issue => {
      report += `- ${issue}\n`
    })
  }
  
  return {
    ready: readiness.ready,
    report
  }
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