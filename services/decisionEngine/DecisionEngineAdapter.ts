// DecisionEngineAdapter.ts
// Adapter to integrate the new Decision Engine with existing searchService.ts

import { DecisionEngine } from './DecisionEngine'
import { BusinessRuleStage } from './stages/BusinessRuleStage'
import { PartNumberStage } from './stages/PartNumberStage'
import { ContextualStage } from './stages/ContextualStage'
import { AIAnalysisStage } from './stages/AIAnalysisStage'
import { TextDetectionStage } from './stages/TextDetectionStage'
import { FallbackStage } from './stages/FallbackStage'
import { SearchDecision } from './SearchDecision'
import { logger } from '@/utils/logger'
import type { SearchContext } from './types'

// Interface that matches existing searchService expectations
export interface SearchServiceResult {
  query: string
  targetTable: string
  productType?: string
  searchStrategy?: string
  specifications?: any
  confidence?: number
  hints?: any[]
  partNumbers?: string[]
}

export class DecisionEngineAdapter {
  private engine: DecisionEngine
  private shadowMode: boolean
  private oldSearchFunction?: (query: string, context?: any) => Promise<any>

  constructor(shadowMode: boolean = false) {
    this.shadowMode = shadowMode
    
    // Initialize the decision engine with all stages
    this.engine = new DecisionEngine([
      new BusinessRuleStage(),      // Priority 1
      new PartNumberStage(),        // Priority 2
      new ContextualStage(),        // Priority 3
      new AIAnalysisStage(),        // Priority 4
      new TextDetectionStage(),     // Priority 5
      new FallbackStage()           // Priority 100
    ])

    logger.info(`DecisionEngineAdapter initialized in ${shadowMode ? 'SHADOW' : 'PRODUCTION'} mode`)
  }

  // Set the old search function for shadow mode comparison
  setOldSearchFunction(fn: (query: string, context?: any) => Promise<any>): void {
    this.oldSearchFunction = fn
  }

  // Main search method that matches existing interface
  async search(query: string, shoppingListContext?: any): Promise<SearchServiceResult> {
    // Convert shopping list to our context format
    const context: SearchContext = {
      shoppingList: shoppingListContext,
      sessionId: Date.now().toString() // Simple session ID for now
    }

    if (this.shadowMode && this.oldSearchFunction) {
      return this.shadowModeSearch(query, context, shoppingListContext)
    }

    // Production mode - use new engine
    const decision = await this.engine.decide(query, context)
    return this.convertDecisionToResult(decision)
  }

  // Shadow mode comparison
  private async shadowModeSearch(
    query: string, 
    context: SearchContext, 
    originalContext: any
  ): Promise<SearchServiceResult> {
    try {
      // Run both engines in parallel
      const [oldResult, newDecision] = await Promise.allSettled([
        this.oldSearchFunction!(query, originalContext),
        this.engine.decide(query, context)
      ])

      // Extract results
      const oldSuccess = oldResult.status === 'fulfilled' ? oldResult.value : null
      const newSuccess = newDecision.status === 'fulfilled' ? newDecision.value : null

      if (oldSuccess && newSuccess) {
        // Compare results
        await this.compareResults(query, oldSuccess, this.convertDecisionToResult(newSuccess))
      }

      // Always return old result in shadow mode for safety
      if (oldResult.status === 'fulfilled') {
        return oldResult.value
      } else {
        throw oldResult.reason
      }

    } catch (error) {
      logger.error('Shadow mode search error:', error)
      throw error
    }
  }

  // Convert new Decision to old result format
  private convertDecisionToResult(decision: SearchDecision): SearchServiceResult {
    const result: SearchServiceResult = {
      query: decision.query,
      targetTable: decision.table || 'category_cables',
      productType: decision.productType,
      searchStrategy: decision.searchStrategy || 'generic_search',
      confidence: decision.confidence,
      hints: decision.hints
    }

    // Add specifications from metadata
    if (decision.metadata.specifications) {
      result.specifications = decision.metadata.specifications
    }

    // Add part numbers if detected
    if (decision.metadata.partNumbers) {
      result.partNumbers = decision.metadata.partNumbers
    }

    return result
  }

  // Compare old and new results for monitoring
  private async compareResults(
    query: string,
    oldResult: any,
    newResult: SearchServiceResult
  ): Promise<void> {
    const divergence = {
      query,
      timestamp: new Date(),
      oldTable: oldResult.targetTable || oldResult.table,
      newTable: newResult.targetTable,
      oldProductType: oldResult.productType,
      newProductType: newResult.productType,
      tableMismatch: (oldResult.targetTable || oldResult.table) !== newResult.targetTable,
      productTypeMismatch: oldResult.productType !== newResult.productType
    }

    // Log significant divergences
    if (divergence.tableMismatch || divergence.productTypeMismatch) {
      logger.warn('Shadow mode divergence detected:', divergence)
      
      // TODO: Save to shadow_mode_comparisons table
      // await supabase.from('shadow_mode_comparisons').insert({...})
    }
  }

  // Get decision engine statistics
  async getStatistics(timeRange?: { start: Date; end: Date }): Promise<any> {
    if (!timeRange) {
      const end = new Date()
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
      timeRange = { start, end }
    }

    return this.engine.analyzeDecisionPatterns(timeRange)
  }

  // Enable/disable shadow mode
  setShadowMode(enabled: boolean): void {
    this.shadowMode = enabled
    logger.info(`Shadow mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Check if ready for production
  async checkReadiness(): Promise<{
    ready: boolean
    metrics: any
    issues: string[]
  }> {
    const issues: string[] = []
    
    // Check if we have comparison data
    const stats = await this.getStatistics()
    
    if (!stats || stats.totalDecisions < 100) {
      issues.push('Insufficient test data (need at least 100 decisions)')
    }

    // Check confidence levels
    if (stats?.confidenceDistribution?.average < 0.7) {
      issues.push('Average confidence too low')
    }

    // TODO: Check divergence rates from shadow_mode_comparisons

    return {
      ready: issues.length === 0,
      metrics: stats,
      issues
    }
  }
}