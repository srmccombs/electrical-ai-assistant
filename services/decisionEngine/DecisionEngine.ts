// DecisionEngine.ts
// Core orchestrator that runs all decision stages in order

import { DecisionStage, SearchContext, StageResult } from './types'
import { SearchDecision } from './SearchDecision'
import { logger } from '@/utils/logger'
import { supabase } from '@/lib/supabase'

export class DecisionEngine {
  private pipeline: DecisionStage[] = []
  private enabled: boolean = true

  constructor(stages: DecisionStage[]) {
    // Sort stages by priority (lower number = higher priority)
    this.pipeline = stages.sort((a, b) => a.priority - b.priority)
    logger.info('Decision Engine initialized with stages:', stages.map(s => s.name))
  }

  async decide(query: string, context?: SearchContext): Promise<SearchDecision> {
    if (!this.enabled) {
      throw new Error('Decision Engine is disabled')
    }

    // Create initial decision
    let decision = new SearchDecision({
      query,
      context,
      stage: 'INITIAL'
    })

    // Log initial query
    await this.logDecision(decision, 'START')

    try {
      // Process through each stage
      for (const stage of this.pipeline) {
        const stageStart = Date.now()
        
        // Skip if decision is already final
        if (decision.isFinal) {
          logger.info(`Skipping ${stage.name} - decision is final`)
          break
        }

        logger.info(`Processing stage: ${stage.name}`)
        
        // Process the stage
        const previousDecision = decision
        const decisionWithStage = decision.setStage(stage.name)
        decision = await stage.process(decisionWithStage)
        
        // Calculate stage duration
        const stageDuration = Date.now() - stageStart
        
        // Log stage result
        await this.logStageResult(stage.name, previousDecision, decision, stageDuration)
        
        // Performance warning
        if (stageDuration > 50) {
          logger.warn(`Stage ${stage.name} took ${stageDuration}ms`)
        }
      }

      // Final validation
      if (!decision.table && !decision.isFinal) {
        logger.warn('No table determined, using fallback')
        decision = decision
          .setTable('category_cables')
          .setSearchStrategy('generic_search')
          .markFinal('No specific product type detected, using cable search')
      }

      // Log final decision
      await this.logDecision(decision, 'COMPLETE')

      return decision
      
    } catch (error) {
      logger.error('Decision Engine error:', error)
      await this.logDecision(decision, 'ERROR', error)
      
      // Return a safe fallback decision
      return decision
        .setTable('category_cables')
        .setSearchStrategy('error_fallback')
        .markFinal('Error in decision engine, using safe fallback')
    }
  }

  // Get current pipeline configuration
  getPipeline(): DecisionStage[] {
    return this.pipeline
  }

  // Add a stage to the pipeline
  addStage(stage: DecisionStage): void {
    this.pipeline.push(stage)
    this.pipeline.sort((a, b) => a.priority - b.priority)
    logger.info(`Added stage ${stage.name} with priority ${stage.priority}`)
  }

  // Remove a stage from the pipeline
  removeStage(stageName: string): void {
    this.pipeline = this.pipeline.filter(s => s.name !== stageName)
    logger.info(`Removed stage ${stageName}`)
  }

  // Enable/disable the engine
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    logger.info(`Decision Engine ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Private logging methods
  private async logDecision(
    decision: SearchDecision,
    event: 'START' | 'COMPLETE' | 'ERROR',
    error?: any
  ): Promise<void> {
    try {
      await supabase.from('search_decisions_audit').insert({
        query_id: decision.id,
        original_query: decision.query,
        normalized_query: decision.normalizedQuery,
        decision_stage: event,
        stage_order: event === 'START' ? 0 : 999,
        decision_type: event,
        decision_value: {
          productType: decision.productType,
          table: decision.table,
          strategy: decision.searchStrategy,
          error: error?.message
        },
        confidence_score: decision.confidence,
        reason: error ? error.message : `Decision engine ${event.toLowerCase()}`,
        is_final: decision.isFinal
      })
    } catch (logError) {
      logger.error('Failed to log decision:', logError)
    }
  }

  private async logStageResult(
    stageName: string,
    previousDecision: SearchDecision,
    newDecision: SearchDecision,
    duration: number
  ): Promise<void> {
    try {
      // Determine what changed
      const changes: any = {}
      
      if (previousDecision.productType !== newDecision.productType) {
        changes.productType = {
          from: previousDecision.productType,
          to: newDecision.productType
        }
      }
      
      if (previousDecision.table !== newDecision.table) {
        changes.table = {
          from: previousDecision.table,
          to: newDecision.table
        }
      }
      
      if (previousDecision.confidence !== newDecision.confidence) {
        changes.confidence = {
          from: previousDecision.confidence,
          to: newDecision.confidence
        }
      }

      // Log to audit table
      await supabase.from('search_decisions_audit').insert({
        query_id: newDecision.id,
        original_query: newDecision.query,
        normalized_query: newDecision.normalizedQuery,
        decision_stage: stageName,
        stage_order: this.pipeline.findIndex(s => s.name === stageName) + 1,
        decision_type: 'STAGE_RESULT',
        decision_value: {
          changes,
          duration,
          hints: newDecision.hints.filter(h => h.source === stageName)
        },
        confidence_score: newDecision.confidence,
        reason: newDecision.auditTrail[newDecision.auditTrail.length - 1]?.reason || 'Stage completed',
        is_final: newDecision.isFinal
      })
    } catch (error) {
      logger.error('Failed to log stage result:', error)
    }
  }

  // Analyze decision patterns for learning
  async analyzeDecisionPatterns(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('search_decisions_audit')
        .select('*')
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString())
        .eq('decision_type', 'COMPLETE')

      if (error) throw error

      // Analyze patterns
      const patterns = {
        totalDecisions: data.length,
        productTypeDistribution: this.groupBy(data, d => d.decision_value?.productType),
        confidenceDistribution: this.analyzeConfidence(data),
        stageEffectiveness: await this.analyzeStageEffectiveness(data),
        commonFailures: this.findCommonFailures(data)
      }

      return patterns
    } catch (error) {
      logger.error('Failed to analyze decision patterns:', error)
      return null
    }
  }

  // Helper methods for analysis
  private groupBy(data: any[], keyFn: (item: any) => string): Record<string, number> {
    return data.reduce((acc, item) => {
      const key = keyFn(item) || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }

  private analyzeConfidence(data: any[]): any {
    const confidences = data.map(d => d.confidence_score).filter(c => c != null)
    
    return {
      average: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      min: Math.min(...confidences),
      max: Math.max(...confidences),
      distribution: this.createHistogram(confidences, 10)
    }
  }

  private createHistogram(values: number[], bins: number): Record<string, number> {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const binSize = (max - min) / bins
    const histogram: Record<string, number> = {}

    for (let i = 0; i < bins; i++) {
      const binStart = min + (i * binSize)
      const binEnd = binStart + binSize
      const binLabel = `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`
      histogram[binLabel] = values.filter(v => v >= binStart && v < binEnd).length
    }

    return histogram
  }

  private async analyzeStageEffectiveness(decisions: any[]): Promise<any> {
    const stageStats: Record<string, any> = {}

    for (const stage of this.pipeline) {
      const stageDecisions = decisions.filter(d => 
        d.decision_value?.changes && 
        Object.keys(d.decision_value.changes).length > 0
      )

      stageStats[stage.name] = {
        totalProcessed: stageDecisions.length,
        madeChanges: stageDecisions.filter(d => d.decision_stage === stage.name).length,
        averageDuration: 0 // Would need to track this separately
      }
    }

    return stageStats
  }

  private findCommonFailures(data: any[]): any[] {
    return data
      .filter(d => !d.decision_value?.table || d.confidence_score < 0.5)
      .map(d => ({
        query: d.original_query,
        confidence: d.confidence_score,
        result: d.decision_value
      }))
      .slice(0, 10) // Top 10 failures
  }
}