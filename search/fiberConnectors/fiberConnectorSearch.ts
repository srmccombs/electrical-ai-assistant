// src/search/fiberConnectors/fiberConnectorSearch.ts
// PROPERLY FIXED VERSION - Shows all connectors, uses table structure
// Date created: December 19, 2024

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'

// ===================================================================
// TYPE DEFINITIONS - Fiber Connector Specific
// ===================================================================

export interface FiberConnectorSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface FiberConnectorSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// FIBER CONNECTOR SEARCH IMPLEMENTATION
// ===================================================================

export const searchFiberConnectors = async (
  options: FiberConnectorSearchOptions
): Promise<FiberConnectorSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100 } = options

  console.log('🔌 FIBER CONNECTORS TABLE SEARCH')
  console.log('🔍 Original search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    const searchTermLower = searchTerm.toLowerCase()

    // Parse search term by common delimiters
    const searchParts = searchTermLower.split(/[\/\s,]+/).filter(part => part.length > 0)
    console.log('📝 Parsed search parts:', searchParts)

    // Keyword lists for detection
    const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'afl', '3m', 'commscope']
    const productLineKeywords = [
      'unicam', 'optitap', 'cleartrak', 'fibertight',
      'opticam', 'optisplice', 'opticore', 'pretium'
    ]
    const connectorTypes = ['lc', 'sc', 'st', 'fc', 'mtp', 'mpo', 'e2000', 'mu']
    const fiberCategories = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']

    // Detect what the user is searching for
    let detectedBrand: string | undefined
    let detectedProductLine: string | undefined
    let detectedConnectorType: string | undefined
    let detectedFiberCategory: string | undefined

    // Check each search part against our keyword lists
    searchParts.forEach(part => {
      if (brandKeywords.includes(part)) detectedBrand = part
      if (productLineKeywords.includes(part)) detectedProductLine = part
      if (connectorTypes.includes(part)) detectedConnectorType = part
      if (fiberCategories.includes(part)) detectedFiberCategory = part
    })

    // Also use AI detection if available
    detectedBrand = detectedBrand || aiAnalysis?.detectedSpecs?.manufacturer
    detectedConnectorType = detectedConnectorType || aiAnalysis?.detectedSpecs?.connectorType
    detectedFiberCategory = detectedFiberCategory || aiAnalysis?.detectedSpecs?.fiberType

    console.log('🎯 DETECTED CRITERIA:', {
      brand: detectedBrand,
      productLine: detectedProductLine,
      connectorType: detectedConnectorType,
      fiberCategory: detectedFiberCategory
    })

    // ========== MAIN SEARCH STRATEGY ==========
    // Start with ALL active fiber connectors, then filter based on what was detected

    let query = supabase
      .from('fiber_connectors')
      .select('*')
      .eq('is_active', true)
      .limit(limit)

    // Build conditions array for OR search
    const orConditions: string[] = []

    // STRATEGY 1: If NOTHING specific was detected, search generally
    if (!detectedBrand && !detectedProductLine && !detectedConnectorType && !detectedFiberCategory) {
      console.log('📊 GENERAL SEARCH: Looking for all fiber connectors or matching description')

      // For generic searches like "fiber connectors", "connectors", etc.
      if (searchTermLower.includes('connector') || searchTermLower.includes('fiber')) {
        // Return all fiber connectors
        console.log('✅ Returning ALL fiber connectors')
      } else {
        // Otherwise search across all text fields
        orConditions.push(`part_number.ilike.%${searchTerm}%`)
        orConditions.push(`short_description.ilike.%${searchTerm}%`)
        orConditions.push(`brand.ilike.%${searchTerm}%`)
        orConditions.push(`product_line.ilike.%${searchTerm}%`)
        orConditions.push(`common_terms.ilike.%${searchTerm}%`)
      }
    }

    // STRATEGY 2: If specific criteria detected, use structured search
    else {
      console.log('🎯 STRUCTURED SEARCH: Using detected criteria')

      // For each detected criterion, add it to the search
      if (detectedBrand) {
        orConditions.push(`brand.ilike.%${detectedBrand}%`)
      }

      if (detectedProductLine) {
        orConditions.push(`product_line.ilike.%${detectedProductLine}%`)
      }

      if (detectedConnectorType) {
        orConditions.push(`connector_type.ilike.%${detectedConnectorType}%`)
      }

      if (detectedFiberCategory) {
        orConditions.push(`fiber_category.ilike.%${detectedFiberCategory}%`)
      }

      // Also include the full search term for part numbers
      orConditions.push(`part_number.ilike.%${searchTerm}%`)
    }

    // Apply OR conditions if any exist
    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','))
      console.log(`🔍 Applying ${orConditions.length} search conditions`)
    }

    // Execute the search
    const result = await query
    console.log(`📊 Search result: ${result.data?.length || 0} products found`)

    // If we have results, check if we need to apply AND logic for multi-criteria searches
    if (result.data && result.data.length > 0) {
      let filteredResults: any[] = result.data

      // Only apply AND filtering if user specified multiple specific criteria
      const criteriaCount = [detectedBrand, detectedProductLine, detectedConnectorType, detectedFiberCategory]
        .filter(Boolean).length

      if (criteriaCount >= 2) {
        console.log('🔧 Applying AND logic for multi-criteria search')

        // Filter to only products matching ALL specified criteria
        if (detectedBrand) {
          filteredResults = filteredResults.filter(item =>
            item.brand?.toLowerCase().includes(detectedBrand)
          )
        }
        if (detectedProductLine) {
          filteredResults = filteredResults.filter(item =>
            item.product_line?.toLowerCase().includes(detectedProductLine)
          )
        }
        if (detectedConnectorType) {
          filteredResults = filteredResults.filter(item =>
            item.connector_type?.toLowerCase().includes(detectedConnectorType)
          )
        }
        if (detectedFiberCategory) {
          filteredResults = filteredResults.filter(item => {
            const fiberCat = item.fiber_category?.toLowerCase() || ''
            return fiberCat.includes(detectedFiberCategory)
          })
        }

        console.log(`📊 After AND filtering: ${filteredResults.length} products match ALL criteria`)
      }

      const endTime = performance.now()
      return {
        products: formatConnectorResults(filteredResults, 'structured_search'),
        searchStrategy: criteriaCount >= 2 ? 'multi_criteria_match' : 'structured_search',
        totalFound: filteredResults.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    // FALLBACK: If no results, try a broader search
    console.log('🔍 FALLBACK: Trying broader search')

    const fallbackQuery = supabase
      .from('fiber_connectors')
      .select('*')
      .eq('is_active', true)
      .limit(50)

    const fallbackResult = await fallbackQuery
    console.log(`📊 Fallback search result: ${fallbackResult.data?.length || 0} products found`)

    const endTime = performance.now()

    if (fallbackResult.data && fallbackResult.data.length > 0) {
      return {
        products: formatConnectorResults(fallbackResult.data, 'fallback_search'),
        searchStrategy: 'fallback_search',
        totalFound: fallbackResult.data.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    return {
      products: [],
      searchStrategy: 'no_results',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }

  } catch (error) {
    console.error('❌ Error in searchFiberConnectors:', error)
    const endTime = performance.now()

    return {
      products: [],
      searchStrategy: 'error',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

const formatConnectorResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} CONNECTOR RESULTS (${searchType})`)

  return data.map((item: any) => ({
    id: `conn-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: Math.random() * 50 + 15,
    stockLocal: 15,
    stockDistribution: 100,
    leadTime: 'Ships Today',
    category: 'Fiber Connector',
    // Enhanced fields from fiber_connectors CSV
    productLine: item.product_line?.trim() || undefined,
    connectorType: item.connector_type?.trim() || undefined,
    fiberType: Array.isArray(item.fiber_category) ? item.fiber_category.join(', ') : item.fiber_category?.trim(),
    fiberCount: item.fiber_count || undefined,
    productType: item.product_type?.trim() || undefined,
    technology: item.technology?.trim() || undefined,
    polish: item.polish?.trim() || undefined,
    housingColor: item.housing_color?.trim() || undefined,
    bootColor: item.boot_color?.trim() || undefined,
    ferruleMaterial: item.ferrule_material?.trim() || undefined,
    commonTerms: item.common_terms?.trim() || undefined,
    searchRelevance: 1.0,
    tableName: 'fiber_connectors',
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }))
}

export const generateFiberConnectorFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    productLines: filterString(products.map(p => p.productLine)).slice(0, 6),
    connectorTypes: filterString(products.map(p => p.connectorType)).slice(0, 6),
    fiberTypes: filterString(products.map(p => p.fiberType)).slice(0, 6),
    productTypes: filterString(products.map(p => p.productType)).slice(0, 6),
    technologies: filterString(products.map(p => p.technology)).slice(0, 6),
    polishTypes: filterString(products.map(p => p.polish)).slice(0, 4),
    housingColors: filterString(products.map(p => p.housingColor)).slice(0, 6),
    bootColors: filterString(products.map(p => p.bootColor)).slice(0, 6)
  }
}