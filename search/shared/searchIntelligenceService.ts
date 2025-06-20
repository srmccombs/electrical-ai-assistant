// Database-driven search intelligence service
// Replaces hardcoded logic in industryKnowledge.ts with database queries

import { supabase } from '@/lib/supabase'

export interface ValidationResult {
  isValid: boolean
  message?: string
  suggestion?: string
}

export interface BusinessRuleResult {
  originalTerm: string
  processedTerm: string
  wasRedirected: boolean
  redirectMessage: string | null
}

export interface DetectedAttributes {
  jacket?: string
  category?: string
  brand?: string
  color?: string
  shielding?: string
  quantity?: number
  awg?: string
  polish?: string
  environment?: string
  productLine?: string
  crossReference?: boolean
  redirectedTo?: string
}

export class SearchIntelligenceService {
  private static instance: SearchIntelligenceService
  private cache = new Map<string, any>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): SearchIntelligenceService {
    if (!SearchIntelligenceService.instance) {
      SearchIntelligenceService.instance = new SearchIntelligenceService()
    }
    return SearchIntelligenceService.instance
  }

  // Detect jacket type using database patterns
  async detectJacketType(searchTerm: string): Promise<string | null> {
    const cacheKey = `jacket:${searchTerm.toLowerCase()}`
    const cached = this.getFromCache(cacheKey)
    if (cached !== undefined) return cached

    try {
      const { data, error } = await supabase
        .rpc('detect_jacket_type', { search_term: searchTerm })

      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error detecting jacket type:', error)
      return null
    }
  }

  // Detect category rating
  async detectCategoryRating(searchTerm: string): Promise<string | null> {
    const cacheKey = `category:${searchTerm.toLowerCase()}`
    const cached = this.getFromCache(cacheKey)
    if (cached !== undefined) return cached

    try {
      const { data, error } = await supabase
        .rpc('detect_category_rating', { search_term: searchTerm })

      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error detecting category:', error)
      return null
    }
  }

  // Apply business rules (redirects, conversions)
  async applyBusinessRules(searchTerm: string): Promise<BusinessRuleResult> {
    try {
      const { data, error } = await supabase
        .rpc('apply_business_rules', { search_term: searchTerm })

      if (error) throw error

      return {
        originalTerm: data.original_term,
        processedTerm: data.processed_term,
        wasRedirected: data.was_redirected,
        redirectMessage: data.redirect_message
      }
    } catch (error) {
      console.error('Error applying business rules:', error)
      return {
        originalTerm: searchTerm,
        processedTerm: searchTerm,
        wasRedirected: false,
        redirectMessage: null
      }
    }
  }

  // Validate search query
  async validateQuery(query: string): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase
        .rpc('validate_search_query', { query_text: query })

      if (error) throw error

      return {
        isValid: data.is_valid,
        message: data.message,
        suggestion: data.suggestion
      }
    } catch (error) {
      console.error('Error validating query:', error)
      return { isValid: true }
    }
  }

  // Detect brand
  async detectBrand(searchTerm: string): Promise<string | null> {
    const cacheKey = `brand:${searchTerm.toLowerCase()}`
    const cached = this.getFromCache(cacheKey)
    if (cached !== undefined) return cached

    try {
      const { data, error } = await supabase
        .rpc('detect_brand', { search_term: searchTerm })

      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error detecting brand:', error)
      return null
    }
  }

  // Detect color
  async detectColor(searchTerm: string): Promise<string | null> {
    const cacheKey = `color:${searchTerm.toLowerCase()}`
    const cached = this.getFromCache(cacheKey)
    if (cached !== undefined) return cached

    try {
      const { data, error } = await supabase
        .rpc('detect_color', { search_term: searchTerm })

      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error detecting color:', error)
      return null
    }
  }

  // Detect all attributes at once
  async detectAllAttributes(searchTerm: string): Promise<DetectedAttributes> {
    const cacheKey = `all:${searchTerm.toLowerCase()}`
    const cached = this.getFromCache(cacheKey)
    if (cached !== undefined) return cached

    try {
      const { data, error } = await supabase
        .rpc('detect_all_attributes', { search_term: searchTerm })

      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error detecting attributes:', error)
      return {}
    }
  }

  // Get search terms for a product
  async getProductSearchTerms(
    tableName: string,
    partNumber: string,
    brand: string,
    category?: string,
    jacket?: string,
    shielding?: string
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_product_search_terms', {
          p_table_name: tableName,
          p_part_number: partNumber,
          p_brand: brand,
          p_category: category,
          p_jacket: jacket,
          p_shielding: shielding
        })

      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Error getting product search terms:', error)
      return []
    }
  }

  // Convert quantity units
  async convertQuantity(
    quantity: number,
    unitFrom: string,
    productContext?: string
  ): Promise<{ value: number; unit: string } | null> {
    try {
      const { data, error } = await supabase
        .rpc('convert_quantity', {
          quantity_value: quantity,
          unit_from: unitFrom,
          product_context: productContext
        })

      if (error) throw error
      
      if (data && data.length > 0) {
        return {
          value: data[0].converted_value,
          unit: data[0].unit_to
        }
      }
      
      return null
    } catch (error) {
      console.error('Error converting quantity:', error)
      return null
    }
  }

  // Cache management
  private getFromCache(key: string): any {
    const item = this.cache.get(key)
    if (item && Date.now() - item.timestamp < this.cacheTimeout) {
      return item.value
    }
    return undefined
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const searchIntelligence = SearchIntelligenceService.getInstance()