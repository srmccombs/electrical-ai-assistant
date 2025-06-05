// src/search/fiberConnectors/fiberConnectorSearch.ts
// Fiber Connector Search Implementation - Extracted from working code
// Date created: December 19, 2024

import { supabase } from '@/lib/supabase'
import type { Product, AISearchAnalysis } from '@/services/searchService'

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

  console.log('🔌 ENHANCED FIBER CONNECTORS SEARCH')
  console.log('🔍 Original search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    // Enhanced detection using both AI and manual parsing
    const detectedFiberType = aiAnalysis?.detectedSpecs?.fiberType
    const detectedConnectorType = aiAnalysis?.detectedSpecs?.connectorType
    const detectedQuantity = aiAnalysis?.detectedSpecs?.requestedQuantity
    const detectedBrand = aiAnalysis?.detectedSpecs?.manufacturer

    console.log('🎯 ENHANCED DETECTION RESULTS:', {
      fiberType: detectedFiberType,
      connectorType: detectedConnectorType,
      quantity: detectedQuantity,
      brand: detectedBrand
    })

    // STRATEGY 1: Brand-focused search (e.g., "Corning", "Corning fiber connectors")
    const queryLower = searchTerm.toLowerCase()
    const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex']
    const detectedBrandKeyword = brandKeywords.find(brand => queryLower.includes(brand))

    if (detectedBrandKeyword) {
      console.log(`🏢 STRATEGY 1: Brand-focused search for: "${detectedBrandKeyword}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('brand', `%${detectedBrandKeyword}%`)
        .limit(100)

      const result = await query
      console.log(`📊 Brand search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatConnectorResults(result.data, 'brand_match'),
          searchStrategy: 'brand_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 2: Product line search (e.g., "Unicam")
    const productLineKeywords = ['unicam', 'optitap', 'cleartrak', 'fibertight']
    const detectedProductLine = productLineKeywords.find(line => queryLower.includes(line))

    if (detectedProductLine) {
      console.log(`📋 STRATEGY 2: Product line search for: "${detectedProductLine}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('product_line', `%${detectedProductLine}%`)
        .limit(100)

      const result = await query
      console.log(`📊 Product line search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatConnectorResults(result.data, 'product_line_match'),
          searchStrategy: 'product_line_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 3: Connector type specific search (e.g., "LC", "SC", "ST")
    const connectorTypes = ['lc', 'sc', 'st', 'fc', 'mtp', 'mpo', 'e2000', 'mu']
    const detectedConnType = connectorTypes.find(type => queryLower.includes(type))

    if (detectedConnType || detectedConnectorType) {
      const searchConnType = detectedConnType || detectedConnectorType
      console.log(`🔌 STRATEGY 3: Connector type search for: "${searchConnType}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('connector_type', `%${searchConnType}%`)
        .limit(100)

      // Add fiber type filter if detected
      if (detectedFiberType) {
        console.log(`🌈 Adding fiber type filter: ${detectedFiberType}`)
        query = query.or(`fiber_category.ilike.%${detectedFiberType}%,short_description.ilike.%${detectedFiberType}%`)
      }

      const result = await query
      console.log(`📊 Connector type search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatConnectorResults(result.data, 'connector_type_match'),
          searchStrategy: 'connector_type_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 4: Fiber category search (e.g., "OM1", "OM2", "OM3", "OM4", "OS1", "OS2")
    const fiberCategories = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']
    const detectedFiberCat = fiberCategories.find(cat => queryLower.includes(cat))

    if (detectedFiberCat || detectedFiberType) {
      const searchFiberCat = detectedFiberCat || detectedFiberType?.toLowerCase()
      console.log(`🌈 STRATEGY 4: Fiber category search for: "${searchFiberCat}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .or(`fiber_category.ilike.%${searchFiberCat}%,short_description.ilike.%${searchFiberCat}%`)
        .limit(100)

      const result = await query
      console.log(`📊 Fiber category search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatConnectorResults(result.data, 'fiber_category_match'),
          searchStrategy: 'fiber_category_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 5: Part number prefix search
    const partNumberPrefixMatch = searchTerm.match(/^([A-Za-z0-9]{3,8})\b/)
    if (partNumberPrefixMatch && partNumberPrefixMatch[1]) {
      const prefix = partNumberPrefixMatch[1]
      console.log(`🔢 STRATEGY 5: Part number prefix search for: "${prefix}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('part_number', `${prefix}%`)
        .limit(50)

      const result = await query
      console.log(`📊 Part number prefix search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatConnectorResults(result.data, 'part_prefix_match'),
          searchStrategy: 'part_prefix_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 6: Comprehensive multi-field search
    console.log(`🎯 STRATEGY 6: Comprehensive search with multiple criteria`)

    let query = supabase
      .from('fiber_connectors')
      .select('*')
      .eq('is_active', true)
      .limit(150)

    // Build focused search conditions
    const searchConditions: string[] = []

    // Direct term searches across key fields
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`brand.ilike.%${searchTerm}%`)
    searchConditions.push(`product_line.ilike.%${searchTerm}%`)
    searchConditions.push(`product_type.ilike.%${searchTerm}%`)
    searchConditions.push(`technology.ilike.%${searchTerm}%`)
    searchConditions.push(`connector_type.ilike.%${searchTerm}%`)
    searchConditions.push(`common_terms.ilike.%${searchTerm}%`)

    // Apply search conditions
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
      console.log(`🚀 Applying ${searchConditions.length} comprehensive search conditions`)
    }

    const result = await query
    console.log(`📊 Comprehensive search result: ${result.data?.length || 0} products found`)

    if (!result.data || result.data.length === 0) {
      console.log('❌ No results found with comprehensive search')

      // STRATEGY 7: Fallback broad search
      console.log('🔍 STRATEGY 7: Fallback broad search')

      const fallbackQuery = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .or(`short_description.ilike.%connector%,short_description.ilike.%fiber%,category.ilike.%connector%`)
        .limit(25)

      const fallbackResult = await fallbackQuery
      console.log(`📊 Fallback search result: ${fallbackResult.data?.length || 0} products found`)

      if (fallbackResult.data && fallbackResult.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatConnectorResults(fallbackResult.data, 'fallback_search'),
          searchStrategy: 'fallback_search',
          totalFound: fallbackResult.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }

      const endTime = performance.now()
      return {
        products: [],
        searchStrategy: 'no_results',
        totalFound: 0,
        searchTime: Math.round(endTime - startTime)
      }
    }

    const endTime = performance.now()
    return {
      products: formatConnectorResults(result.data, 'comprehensive_search'),
      searchStrategy: 'comprehensive_search',
      totalFound: result.data.length,
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