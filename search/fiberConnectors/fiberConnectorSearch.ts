// src/search/fiberConnectors/fiberConnectorSearch.ts
// PROPERLY FIXED VERSION - Shows all connectors, uses table structure
// Date created: December 19, 224

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'
import type { FiberConnectorRow } from '@/search/shared/types'

// ===================================================================
// TYPE DEFINITIONS - Fiber Connector Specific
// ===================================================================

export interface FiberConnectorSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
  shoppingListContext?: {
    fiberCables?: Array<{
      partNumber: string
      fiberType: string
      brand: string
      description: string
    }>
  }
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
  const { searchTerm, aiAnalysis, limit = 100, shoppingListContext } = options

  console.log('🔌 FIBER CONNECTORS TABLE SEARCH')
  console.log('🔍 Original search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)
  
  // Extract fiber types from shopping list if available
  let priorityFiberTypes: string[] = []
  if (shoppingListContext?.fiberCables?.length) {
    priorityFiberTypes = [...new Set(shoppingListContext.fiberCables
      .map(cable => cable.fiberType)
      .filter(Boolean)
    )]
    console.log('🛒 Shopping list fiber types:', priorityFiberTypes)
  }

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
    const connectorTypes = ['lc', 'sc', 'st', 'fc', 'mtp', 'mpo', 'e2', 'mu']
    const fiberCategories = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']
    const polishTypes = ['apc', 'upc', 'pc', 'spc'] // Added polish types

    // Detect what the user is searching for
    let detectedBrand: string | undefined
    let detectedProductLine: string | undefined
    let detectedConnectorType: string | undefined
    let detectedFiberCategory: string | undefined
    let detectedPolish: string | undefined

    // Check each search part against our keyword lists
    searchParts.forEach(part => {
      if (brandKeywords.includes(part)) detectedBrand = part
      if (productLineKeywords.includes(part)) detectedProductLine = part
      if (connectorTypes.includes(part)) detectedConnectorType = part
      if (fiberCategories.includes(part)) detectedFiberCategory = part
      if (polishTypes.includes(part)) detectedPolish = part
    })

    // Also use AI detection if available
    // Only use manufacturer from AI if it wasn't inferred from shopping list
    const brandFromShoppingList = shoppingListContext?.fiberCables && 
                                 shoppingListContext.fiberCables.length > 0 && 
                                 aiAnalysis?.detectedSpecs?.manufacturer &&
                                 shoppingListContext.fiberCables.some(cable => 
                                   cable.brand.toUpperCase() === aiAnalysis.detectedSpecs.manufacturer?.toUpperCase()
                                 )
    
    if (brandFromShoppingList) {
      console.log('🚫 Ignoring AI detected brand from shopping list:', aiAnalysis?.detectedSpecs?.manufacturer)
    }
    
    detectedBrand = detectedBrand || (!brandFromShoppingList ? aiAnalysis?.detectedSpecs?.manufacturer : undefined)
    detectedConnectorType = detectedConnectorType || aiAnalysis?.detectedSpecs?.connectorType
    detectedFiberCategory = detectedFiberCategory || aiAnalysis?.detectedSpecs?.fiberType
    detectedPolish = detectedPolish || aiAnalysis?.detectedSpecs?.polish
    
    // Map OS1/OS2 to Singlemode for fiber connector search
    if (detectedFiberCategory && ['os1', 'os2'].includes(detectedFiberCategory.toLowerCase())) {
      console.log(`🔄 Mapping ${detectedFiberCategory} to Singlemode for connector search`)
      detectedFiberCategory = 'singlemode'
    }
    
    // Also check if user typed common terms in the search (case-insensitive)
    if (!detectedFiberCategory) {
      // Re-split by spaces only for fiber type detection
      const spaceOnlyParts = searchTermLower.split(/\s+/)
      // Check for SM abbreviation or single mode terms - handle all case variations
      if (spaceOnlyParts.some(part => part.toLowerCase() === 'sm') || 
          searchTermLower.includes('single mode') || 
          searchTermLower.includes('singlemode') || 
          searchTermLower.includes('single-mode')) {
        detectedFiberCategory = 'singlemode'
        console.log('🔄 Detected SM/single mode - using Singlemode')
      }
      // Check for MM abbreviation or multimode terms - handle all case variations
      else if (spaceOnlyParts.some(part => part.toLowerCase() === 'mm') || 
               searchTermLower.includes('multimode') || 
               searchTermLower.includes('multi-mode') || 
               searchTermLower.includes('multi mode')) {
        // For multimode, we don't set a specific type to allow all MM types
        console.log('🔄 Detected MM/multimode - will search all multimode types')
      }
    }
    
    // Override with shopping list fiber types if available and no specific fiber type detected
    if (!detectedFiberCategory && priorityFiberTypes.length > 0) {
      console.log('📦 Using fiber types from shopping list:', priorityFiberTypes)
      // We'll use these in the search logic below
    }

    // Final check: If brand came from shopping list, clear it
    if (brandFromShoppingList && detectedBrand === aiAnalysis?.detectedSpecs?.manufacturer?.toLowerCase()) {
      console.log('🚫 Clearing brand that came from shopping list')
      detectedBrand = undefined
    }
    
    console.log('🎯 DETECTED CRITERIA:', {
      brand: detectedBrand,
      productLine: detectedProductLine,
      connectorType: detectedConnectorType,
      fiberCategory: detectedFiberCategory,
      polish: detectedPolish
    })

    // ========== MAIN SEARCH STRATEGY ==========
    // Start with ALL active fiber connectors, then filter based on what was detected

    let query = supabase
      .from('prod_fiber_connectors')
      .select('*')
      .eq('is_active', true)
      .limit(limit)

    // Build conditions array for OR search
    const orConditions: string[] = []

    // STRATEGY 1: If NOTHING specific was detected, search generally
    if (!detectedBrand && !detectedProductLine && !detectedConnectorType && !detectedFiberCategory && !detectedPolish) {
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

      if (detectedPolish) {
        // Search both polish column and short_description for polish type
        orConditions.push(`polish.ilike.%${detectedPolish}%`)
        orConditions.push(`short_description.ilike.%${detectedPolish}%`)
      }
      // REMOVED: Don't add fiber type conditions from shopping list
      // The auto-apply filter in UI will handle this instead

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
      // Don't count brand if it came from shopping list
      // Don't count fiber category if it ONLY came from shopping list (not user query)
      const fiberCategoryFromShoppingListOnly = detectedFiberCategory && 
                                               !searchTermLower.includes('singlemode') && 
                                               !searchTermLower.includes('single mode') &&
                                               !searchTermLower.includes('multimode') &&
                                               !searchTermLower.includes('os1') &&
                                               !searchTermLower.includes('os2') &&
                                               !searchTermLower.includes('om1') &&
                                               !searchTermLower.includes('om2') &&
                                               !searchTermLower.includes('om3') &&
                                               !searchTermLower.includes('om4') &&
                                               !searchTermLower.includes('om5') &&
                                               priorityFiberTypes.length > 0
      
      const countableCriteria = []
      if (!brandFromShoppingList && detectedBrand) countableCriteria.push(detectedBrand)
      if (detectedProductLine) countableCriteria.push(detectedProductLine)
      if (detectedConnectorType) countableCriteria.push(detectedConnectorType)
      if (!fiberCategoryFromShoppingListOnly && detectedFiberCategory) countableCriteria.push(detectedFiberCategory)
      if (detectedPolish) countableCriteria.push(detectedPolish)
      
      const criteriaCount = countableCriteria.length

      if (criteriaCount >= 2) {
        console.log('🔧 Applying AND logic for multi-criteria search')

        // Filter to only products matching ALL specified criteria
        // Skip brand if it came from shopping list
        if (detectedBrand && !brandFromShoppingList) {
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
        if (detectedFiberCategory && !fiberCategoryFromShoppingListOnly) {
          filteredResults = filteredResults.filter(item => {
            const fiberCat = item.fiber_category?.toLowerCase() || ''
            return fiberCat.includes(detectedFiberCategory)
          })
        }
        if (detectedPolish) {
          filteredResults = filteredResults.filter(item => {
            const polish = item.polish?.toLowerCase() || ''
            const description = item.short_description?.toLowerCase() || ''
            return polish.includes(detectedPolish) || description.includes(detectedPolish)
          })
        }

        console.log(`📊 After AND filtering: ${filteredResults.length} products match ALL criteria`)
      }

      const endTime = performance.now()
      return {
        products: formatConnectorResults(filteredResults, 'structured_search', priorityFiberTypes),
        searchStrategy: criteriaCount >= 2 ? 'multi_criteria_match' : 'structured_search',
        totalFound: filteredResults.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    // FALLBACK: If no results, try a broader search
    console.log('🔍 FALLBACK: Trying broader search')

    const fallbackQuery = supabase
      .from('prod_fiber_connectors')
      .select('*')
      .eq('is_active', true)
      .limit(5)

    const fallbackResult = await fallbackQuery
    console.log(`📊 Fallback search result: ${fallbackResult.data?.length || 0} products found`)

    const endTime = performance.now()

    if (fallbackResult.data && fallbackResult.data.length > 0) {
      return {
        products: formatConnectorResults(fallbackResult.data, 'fallback_search', priorityFiberTypes),
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

const formatConnectorResults = (data: any[], searchType: string, priorityFiberTypes?: string[]): Product[] => {
  console.log(`✅ FORMATTING ${data.length} CONNECTOR RESULTS (${searchType})`)

  const products = data.map((item: FiberConnectorRow) => ({
    id: `conn-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: Math.random() * 5 + 15,
    stockLocal: 15,
    stockDistribution: 1,
    leadTime: 'Ships Today',
    category: 'Fiber Connector',
    // Enhanced fields from fiber_connectors CSV
    productLine: item.product_line?.trim() || undefined,
    connectorType: item.connector_type?.trim() || undefined,
    fiberType: Array.isArray(item.fiber_category) ? item.fiber_category.join(', ') : item.fiber_category?.trim(),
    fiberCount: undefined,
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
  
  // Sort results to prioritize matching fiber types from shopping list
  if (priorityFiberTypes && priorityFiberTypes.length > 0) {
    console.log('🎯 Sorting results to prioritize fiber types:', priorityFiberTypes)
    
    products.sort((a, b) => {
      const aFiberType = a.fiberType?.toLowerCase() || ''
      const bFiberType = b.fiberType?.toLowerCase() || ''
      
      // Check if products match priority fiber types
      const aMatchesPriority = priorityFiberTypes.some(type => 
        aFiberType.includes(type.toLowerCase())
      )
      const bMatchesPriority = priorityFiberTypes.some(type => 
        bFiberType.includes(type.toLowerCase())
      )
      
      // Prioritize matching products
      if (aMatchesPriority && !bMatchesPriority) return -1
      if (!aMatchesPriority && bMatchesPriority) return 1
      
      return 0
    })
  }
  
  return products
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