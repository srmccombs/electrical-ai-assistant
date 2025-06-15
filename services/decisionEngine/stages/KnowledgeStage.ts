// KnowledgeStage.ts
// Applies user-contributed knowledge to search decisions

import { DecisionStage } from '../types'
import { SearchDecision } from '../SearchDecision'
import { logger } from '@/utils/logger'
import { supabase } from '@/lib/supabase'

interface KnowledgeEntry {
  id: string
  contribution_type: 'SYNONYM' | 'MAPPING' | 'CONTEXT' | 'CORRECTION' | 'RELATIONSHIP'
  original_term: string
  suggested_term: string
  product_type?: string
  confidence_score: number
  context?: string
}

export class KnowledgeStage implements DecisionStage {
  name = 'KnowledgeStage'
  priority = 6 // After text detection, before fallback

  private knowledgeCache: Map<string, KnowledgeEntry[]> = new Map()
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutes
  private lastCacheUpdate: number = 0

  async process(decision: SearchDecision): Promise<SearchDecision> {
    logger.info(`KnowledgeStage: Processing query "${decision.normalizedQuery}"`)

    try {
      // Get applicable knowledge entries
      const knowledge = await this.getApplicableKnowledge(decision.normalizedQuery)
      
      if (knowledge.length === 0) {
        logger.info('KnowledgeStage: No applicable knowledge found')
        return decision
      }

      logger.info(`KnowledgeStage: Found ${knowledge.length} applicable entries`)

      // Apply each knowledge entry
      let result = decision
      
      for (const entry of knowledge) {
        result = await this.applyKnowledgeEntry(result, entry)
      }

      return result

    } catch (error) {
      logger.error('KnowledgeStage error:', error)
      
      // Don't fail the search if knowledge lookup fails
      return decision.addHint({
        type: 'WARNING',
        priority: 'HINT',
        message: 'User knowledge unavailable',
        data: { error: error instanceof Error ? error.message : String(error) },
        source: 'KnowledgeStage'
      })
    }
  }

  private async getApplicableKnowledge(query: string): Promise<KnowledgeEntry[]> {
    // Check cache first
    if (this.isCacheValid()) {
      return this.searchCache(query)
    }

    // Refresh cache from database
    await this.refreshCache()
    return this.searchCache(query)
  }

  private async refreshCache(): Promise<void> {
    try {
      // Get all approved knowledge contributions
      const { data, error } = await supabase
        .from('knowledge_contributions')
        .select('*')
        .eq('validation_status', 'APPROVED')
        .gte('confidence_score', 0.7)

      if (error) throw error

      // Clear and rebuild cache
      this.knowledgeCache.clear()

      // Group by original term for faster lookup
      const entries = (data || []) as KnowledgeEntry[]
      for (const entry of entries) {
        const key = entry.original_term.toLowerCase()
        
        if (!this.knowledgeCache.has(key)) {
          this.knowledgeCache.set(key, [])
        }
        
        this.knowledgeCache.get(key)!.push(entry)
      }

      this.lastCacheUpdate = Date.now()
      logger.info(`KnowledgeStage: Cache refreshed with ${data?.length || 0} entries`)

    } catch (error) {
      logger.error('Failed to refresh knowledge cache:', error)
    }
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry
  }

  private searchCache(query: string): KnowledgeEntry[] {
    const applicable: KnowledgeEntry[] = []
    const queryWords = query.toLowerCase().split(/\s+/)

    // Check each word in the query
    for (const word of queryWords) {
      const entries = this.knowledgeCache.get(word) || []
      applicable.push(...entries)
    }

    // Also check full query
    const fullQueryEntries = this.knowledgeCache.get(query.toLowerCase()) || []
    applicable.push(...fullQueryEntries)

    // Sort by confidence score
    return applicable.sort((a, b) => b.confidence_score - a.confidence_score)
  }

  private async applyKnowledgeEntry(
    decision: SearchDecision,
    entry: KnowledgeEntry
  ): Promise<SearchDecision> {
    let result = decision

    switch (entry.contribution_type) {
      case 'SYNONYM':
        result = this.applySynonym(result, entry)
        break
        
      case 'MAPPING':
        result = this.applyMapping(result, entry)
        break
        
      case 'CORRECTION':
        result = this.applyCorrection(result, entry)
        break
        
      case 'RELATIONSHIP':
        result = this.applyRelationship(result, entry)
        break
        
      case 'CONTEXT':
        result = this.applyContext(result, entry)
        break
    }

    // Track knowledge application
    await this.trackKnowledgeUsage(entry.id, decision.query)

    return result
  }

  private applySynonym(decision: SearchDecision, entry: KnowledgeEntry): SearchDecision {
    // Replace the original term with the suggested term
    const updatedQuery = decision.normalizedQuery.replace(
      new RegExp(`\\b${entry.original_term}\\b`, 'gi'),
      entry.suggested_term
    )

    if (updatedQuery === decision.normalizedQuery) {
      return decision // No change
    }

    return decision
      .with({ normalizedQuery: updatedQuery })
      .addHint({
        type: 'HINT',
        priority: 'SUGGEST',
        message: `Users often search for "${entry.suggested_term}" when looking for "${entry.original_term}"`,
        data: {
          original: entry.original_term,
          suggested: entry.suggested_term,
          confidence: entry.confidence_score
        },
        source: 'KnowledgeStage'
      })
      .addMetadata('appliedKnowledge', {
        type: 'SYNONYM',
        entry: entry.id
      })
  }

  private applyMapping(decision: SearchDecision, entry: KnowledgeEntry): SearchDecision {
    // If the query contains the original term, suggest the product type
    if (decision.normalizedQuery.includes(entry.original_term.toLowerCase())) {
      const suggestedType = entry.suggested_term // For mappings, suggested_term is the product type
      
      return decision
        .setProductType(suggestedType)
        .setConfidence(entry.confidence_score)
        .addHint({
          type: 'HINT',
          priority: 'SUGGEST',
          message: `"${entry.original_term}" typically refers to ${suggestedType}`,
          data: {
            mappedTerm: entry.original_term,
            productType: suggestedType
          },
          source: 'KnowledgeStage'
        })
    }

    return decision
  }

  private applyCorrection(decision: SearchDecision, entry: KnowledgeEntry): SearchDecision {
    // Apply spelling/terminology corrections
    const correctedQuery = decision.normalizedQuery.replace(
      new RegExp(entry.original_term, 'gi'),
      entry.suggested_term
    )

    if (correctedQuery === decision.normalizedQuery) {
      return decision
    }

    return decision
      .redirect(correctedQuery, `Corrected "${entry.original_term}" to "${entry.suggested_term}"`)
      .addMetadata('appliedKnowledge', {
        type: 'CORRECTION',
        entry: entry.id
      })
  }

  private applyRelationship(decision: SearchDecision, entry: KnowledgeEntry): SearchDecision {
    // Add hints about related products
    return decision.addHint({
      type: 'SUGGEST',
      priority: 'SUGGEST',
      message: `Customers who search for "${entry.original_term}" also need "${entry.suggested_term}"`,
      data: {
        relatedProduct: entry.suggested_term,
        confidence: entry.confidence_score
      },
      source: 'KnowledgeStage'
    })
  }

  private applyContext(decision: SearchDecision, entry: KnowledgeEntry): SearchDecision {
    // Add contextual information
    return decision.addHint({
      type: 'HINT',
      priority: 'HINT',
      message: entry.context || `Additional context for "${entry.original_term}"`,
      data: {
        term: entry.original_term,
        context: entry.context
      },
      source: 'KnowledgeStage'
    })
  }

  private async trackKnowledgeUsage(entryId: string, query: string): Promise<void> {
    try {
      // Update usage metrics (fire and forget)
      await supabase.rpc('increment_knowledge_usage', {
        knowledge_id: entryId,
        search_query: query
      }).then(() => {
        logger.info(`Tracked usage of knowledge entry ${entryId}`)
      }).catch(error => {
        logger.error('Failed to track knowledge usage:', error)
      })
    } catch (error) {
      // Don't let tracking failures affect search
      logger.error('Knowledge tracking error:', error)
    }
  }

  // Force cache refresh (useful after new contributions)
  async refreshKnowledge(): Promise<void> {
    await this.refreshCache()
  }

  // Get cache statistics
  getCacheStats(): {
    size: number
    lastUpdate: Date
    isValid: boolean
  } {
    return {
      size: this.knowledgeCache.size,
      lastUpdate: new Date(this.lastCacheUpdate),
      isValid: this.isCacheValid()
    }
  }
}