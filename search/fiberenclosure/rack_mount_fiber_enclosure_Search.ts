// src/search/fiberenclosure/rack_mount_fiber_enclosure_Search.ts
// Enhanced Rack Mount Fiber Enclosure Search Implementation
// Fixed: December 2, 224 - Corrected table name to rack_mount_fiber_enclosures

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'
import type { RackMountEnclosureRow, BaseProductRow } from '@/search/shared/types'
import { normalizeMountType, normalizeMountTypes } from '@/search/shared/industryKnowledge'

// ===================================================================
// TYPE DEFINITIONS - Fiber Enclosure Specific
// ===================================================================

export interface FiberEnclosureSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface FiberEnclosureSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// DETECTION FUNCTIONS - Industry Knowledge for Fiber Enclosures
// ===================================================================

/**
 * Detect rack units (RU) from search term
 * Examples: "1RU", "4RU", "2 RU", "4 rack units"
 */
const detectRackUnits = (searchTerm: string): number | undefined => {
  const term = searchTerm.toLowerCase()

  const patterns = [
    /(\d+)\s*ru\b/i,
    /(\d+)\s*rack\s*unit/i,
    /(\d+)u\b/i,
    /(\d+)\s*u\s/i
  ]

  for (const pattern of patterns) {
    const match = term.match(pattern)
    if (match && match[1]) {
      const units = parseInt(match[1], 10)
      if (units >= 1 && units <= 48) { // Reasonable RU range
        console.log(`🏗️ Detected rack units: ${units}RU`)
        return units
      }
    }
  }

  return undefined
}


/**
 * Detect panel type with all variations
 * CCH and FAP are the main types that must match adapter panels
 */
const detectPanelType = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  // CCH variations
  if (term.includes('cch')) {
    console.log(`📦 Detected panel type: CCH`)
    return 'CCH'
  }

  // FAP variations
  if (term.includes('fap') || term.includes('fiber adapter panel')) {
    console.log(`📦 Detected panel type: FAP`)
    return 'FAP'
  }

  return undefined
}

/**
 * Detect color preferences
 */
const detectColor = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  const colors = [
    { search: ['black'], actual: 'Black' },
    { search: ['white'], actual: 'White' },
    { search: ['gray', 'grey'], actual: 'Gray' }
  ]

  for (const color of colors) {
    for (const searchTerm of color.search) {
      if (term.includes(searchTerm)) {
        console.log(`🎨 Detected color: ${color.actual}`)
        return color.actual
      }
    }
  }

  return undefined
}

/**
 * Detect environment type
 */
const detectEnvironment = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  if (term.includes('outdoor') || term.includes('outside')) {
    console.log(`🌧️ Detected environment: Outdoor`)
    return 'Outdoor'
  }

  if (term.includes('indoor') || term.includes('inside')) {
    console.log(`🏢 Detected environment: Indoor`)
    return 'Indoor'
  }

  return undefined
}

/**
 * Detect splice tray support requirement
 */
const detectSpliceTraySupport = (searchTerm: string): boolean | undefined => {
  const term = searchTerm.toLowerCase()

  if (term.includes('splice') || term.includes('fusion')) {
    console.log(`🔧 Detected splice tray support requirement`)
    return true
  }

  return undefined
}

/**
 * Detect brand with Corning/Siecor synonym support
 */
const detectBrand = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  // Corning and its synonym Siecor
  if (term.includes('corning') || term.includes('siecor')) {
    console.log(`🏢 Detected brand: Corning (includes Siecor synonym)`)
    return 'Corning'
  }
  if (term.includes('panduit')) return 'Panduit'
  if (term.includes('leviton')) return 'Leviton'
  if (term.includes('dmsi')) return 'DMSI'

  return undefined
}

/**
 * Detect panel capacity from search term
 * Examples: "2 panel", "4 panel enclosure", "6 panel fiber enclosure", "holds 6 panels"
 */
const detectPanelCapacity = (searchTerm: string): number | undefined => {
  const term = searchTerm.toLowerCase()

  // First, find all numbers in the search term
  const numbers = term.match(/\d+/g)
  if (!numbers) return undefined

  // Look for panel-related keywords
  const panelKeywords = ['panel', 'adapter', 'capacity', 'holds', 'slot']
  
  // For each number, check if it's followed by a panel keyword
  for (const num of numbers) {
    const numValue = parseInt(num, 10)
    
    // Create a regex to find this specific number followed by panel keywords
    const numPattern = new RegExp(`\\b${num}\\s*(${panelKeywords.join('|')})`, 'i')
    
    if (numPattern.test(term)) {
      if (numValue >= 1 && numValue <= 144) { // Reasonable panel range
        console.log(`📊 Detected panel capacity request: ${numValue} panels`)
        return numValue
      }
    }
  }

  // Fallback patterns for special cases
  const patterns = [
    /holds?\s*(\d+)\s*panel/i,
    /capacity\s*(?:of\s*)?(\d+)/i,
    /(\d+)\s*fap/i,
    /(\d+)\s*cch/i
  ]

  for (const pattern of patterns) {
    const match = term.match(pattern)
    if (match && match[1]) {
      const panels = parseInt(match[1], 10)
      if (panels >= 1 && panels <= 144) {
        console.log(`📊 Detected panel capacity request: ${panels} panels (fallback pattern)`)
        return panels
      }
    }
  }

  return undefined
}

/**
 * Extract common enclosure terms and synonyms
 */
const extractCommonTerms = (searchTerm: string): string[] => {
  const term = searchTerm.toLowerCase()
  const detectedTerms: string[] = []

  const synonymGroups = [
    ['enclosure', 'housing', 'cabinet', 'box'],
    ['patch panel', 'patch', 'distribution'],
    ['rack mount', 'rackmount', 'rack-mount'],
    ['fiber', 'fibre', 'optical'],
    ['termination', 'terminal', 'breakout']
  ]

  for (const group of synonymGroups) {
    for (const synonym of group) {
      if (term.includes(synonym)) {
        detectedTerms.push(...group)
        break
      }
    }
  }

  return Array.from(new Set(detectedTerms))
}

// ===================================================================
// FIBER ENCLOSURE SEARCH IMPLEMENTATION
// ===================================================================

export const searchRackMountFiberEnclosures = async (
  options: FiberEnclosureSearchOptions
): Promise<FiberEnclosureSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 5 } = options

  console.log('🏗️ ========== FIBER ENCLOSURE SEARCH START ==========')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis)

  try {
    // First, let's check how many total records we have
    console.log('📊 Checking total enclosure inventory...')
    const countQuery = await supabase
      .from('prod_rack_mount_fiber_enclosures')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Total records in table: ${countQuery.count}`)

    // Check how many are active
    const activeCountQuery = await supabase
      .from('prod_rack_mount_fiber_enclosures')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    console.log(`✅ Active records: ${activeCountQuery.count}`)

    // If no active records, let's see what we have
    if (activeCountQuery.count === 0) {
      console.log('⚠️ No active enclosures found! Checking inactive records...')
      const inactiveQuery = await supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('part_number, brand, is_active')
        .limit(5)

      console.log('📊 Sample inactive records:', inactiveQuery.data)
    }

    // Enhanced detection with all the industry knowledge
    const detectedRackUnits = detectRackUnits(searchTerm) || aiAnalysis?.detectedSpecs?.rackUnits
    const detectedPanelType = detectPanelType(searchTerm) || aiAnalysis?.detectedSpecs?.panelType
    const detectedColor = detectColor(searchTerm) || aiAnalysis?.detectedSpecs?.color
    const detectedEnvironment = detectEnvironment(searchTerm) || aiAnalysis?.detectedSpecs?.environment
    const detectedSpliceTraySupport = detectSpliceTraySupport(searchTerm)
    const detectedBrand = detectBrand(searchTerm) || aiAnalysis?.detectedSpecs?.manufacturer
    const detectedPanelCapacity = detectPanelCapacity(searchTerm)
    const commonTerms = extractCommonTerms(searchTerm)

    console.log('🎯 DETECTED ATTRIBUTES:', {
      rackUnits: detectedRackUnits,
      panelType: detectedPanelType,
      color: detectedColor,
      environment: detectedEnvironment,
      spliceTraySupport: detectedSpliceTraySupport,
      brand: detectedBrand,
      panelCapacity: detectedPanelCapacity,
      commonTerms
    })

    // STRATEGY : Direct rack unit search (highest priority for "4RU fiber enclosure")
    if (detectedRackUnits) {
      console.log(`🎯 STRATEGY : Direct rack unit search for ${detectedRackUnits}RU`)

      let query = supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('*')
        .eq('rack_units', detectedRackUnits)
        .eq('is_active', true)
        .limit(limit)

      const result = await query
      console.log(`📊 Rack unit search result:`, {
        error: result.error,
        count: result.data?.length,
        firstItem: result.data?.[0]
      })

      if (!result.error && result.data && result.data.length > 0) {
        const endTime = performance.now()
        console.log(`✅ Found ${result.data.length} ${detectedRackUnits}RU enclosures`)
        return {
          products: formatEnclosureResults(result.data, 'rack_unit_match'),
          searchStrategy: 'rack_unit_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }

      // If no active results, try without is_active filter
      console.log(`⚠️ No active ${detectedRackUnits}RU enclosures, trying all records...`)
      const allQuery = await supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('*')
        .eq('rack_units', detectedRackUnits)
        .limit(limit)

      if (!allQuery.error && allQuery.data && allQuery.data.length > 0) {
        console.log(`📦 Found ${allQuery.data.length} ${detectedRackUnits}RU enclosures (including inactive)`)
        const endTime = performance.now()
        return {
          products: formatEnclosureResults(allQuery.data, 'rack_unit_match_all'),
          searchStrategy: 'rack_unit_match_all',
          totalFound: allQuery.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY ".5: Panel capacity search (e.g., "6 panel fiber enclosure")
    if (detectedPanelCapacity) {
      console.log(`📊 STRATEGY ".5: Panel capacity search for ${detectedPanelCapacity} panels`)
      
      // First, try to find exact match
      let query = supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('*')
        .eq('panel_capacity', detectedPanelCapacity)
        .eq('is_active', true)
        .limit(limit)

      const exactResult = await query
      console.log(`📊 Exact panel capacity search result:`, {
        error: exactResult.error,
        count: exactResult.data?.length
      })

      if (!exactResult.error && exactResult.data && exactResult.data.length > 0) {
        const endTime = performance.now()
        console.log(`✅ Found ${exactResult.data.length} enclosures with exactly ${detectedPanelCapacity} panels`)
        return {
          products: formatEnclosureResults(exactResult.data, 'panel_capacity_exact'),
          searchStrategy: 'panel_capacity_exact',
          totalFound: exactResult.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
      
      // If no exact match, find the next size up
      console.log(`⚠️ No exact match for ${detectedPanelCapacity} panels, looking for next size up...`)
      
      let nextSizeQuery = supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('*')
        .gt('panel_capacity', detectedPanelCapacity)
        .eq('is_active', true)
        .order('panel_capacity', { ascending: true })
        .limit(limit)

      const nextSizeResult = await nextSizeQuery as any
      console.log(`📊 Next size up search result:`, {
        error: nextSizeResult.error,
        count: nextSizeResult.data?.length,
        sizes: nextSizeResult.data?.map((item: BaseProductRow) => (item as any).panel_capacity).slice(0, 5)
      })

      if (!nextSizeResult.error && nextSizeResult.data && nextSizeResult.data.length > 0) {
        // Filter to only show the smallest size that's larger than requested
        const nextSize = nextSizeResult.data[0].panel_capacity
        const filteredResults = nextSizeResult.data.filter((item: any) => 
          item.panel_capacity === nextSize
        )
        
        const endTime = performance.now()
        console.log(`✅ Found ${filteredResults.length} enclosures with ${nextSize} panels (next size up from ${detectedPanelCapacity})`)
        return {
          products: formatEnclosureResults(filteredResults, 'panel_capacity_next_size'),
          searchStrategy: 'panel_capacity_next_size',
          totalFound: filteredResults.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 1: Brand search (e.g., "Corning")
    const queryLower = searchTerm.toLowerCase().trim()
    const brandKeywords = ['corning', 'siecor', 'panduit', 'leviton', 'dmsi']
    const isBrandOnlySearch = brandKeywords.includes(queryLower)

    if (isBrandOnlySearch || detectedBrand) {
      console.log(`🏢 STRATEGY 1: Brand search for: "${detectedBrand || queryLower}"`)

      let query = supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('*')
        .eq('is_active', true)
        .limit(limit)

      if (detectedBrand === 'Corning' || queryLower === 'corning' || queryLower === 'siecor') {
        query = query.or('brand.ilike.%Corning%,brand.ilike.%Siecor%')
      } else {
        const brandToSearch = detectedBrand || queryLower
        query = query.ilike('brand', `%${brandToSearch}%`)
      }

      const result = await query
      console.log(`📊 Brand search result:`, {
        error: result.error,
        count: result.data?.length,
        brands: (result.data as unknown as BaseProductRow[])?.map((item: BaseProductRow) => item.brand).filter(Boolean).slice(0, 5)
      })

      if (!result.error && result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatEnclosureResults(result.data as unknown as RackMountEnclosureRow[], 'brand_match'),
          searchStrategy: 'brand_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }

      // Try without is_active filter
      console.log(`⚠️ No active ${detectedBrand || queryLower} enclosures, trying all records...`)
      let allBrandQuery = supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('*')
        .limit(limit)

      if (detectedBrand === 'Corning' || queryLower === 'corning' || queryLower === 'siecor') {
        allBrandQuery = allBrandQuery.or('brand.ilike.%Corning%,brand.ilike.%Siecor%')
      } else {
        const brandToSearch = detectedBrand || queryLower
        allBrandQuery = allBrandQuery.ilike('brand', `%${brandToSearch}%`)
      }

      const allBrandResult = await allBrandQuery
      if (!allBrandResult.error && allBrandResult.data && allBrandResult.data.length > 0) {
        console.log(`📦 Found ${allBrandResult.data.length} ${detectedBrand || queryLower} enclosures (including inactive)`)
        const endTime = performance.now()
        return {
          products: formatEnclosureResults(allBrandResult.data, 'brand_match_all'),
          searchStrategy: 'brand_match_all',
          totalFound: allBrandResult.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 2: General enclosure search (but check for panel capacity first!)
    if (searchTerm.toLowerCase().includes('enclosure') || searchTerm.toLowerCase().includes('housing')) {
      console.log(`🏗️ STRATEGY 2: General enclosure search`)
      
      // If we detected panel capacity but haven't handled it yet, handle it now
      if (detectedPanelCapacity) {
        console.log(`📊 Panel capacity detected in general search: ${detectedPanelCapacity} panels`)
        
        // First try exact match
        let exactQuery = supabase
          .from('prod_rack_mount_fiber_enclosures')
          .select('*')
          .eq('panel_capacity', detectedPanelCapacity)
          .eq('is_active', true)
          .limit(limit)

        const exactResult = await exactQuery
        
        if (!exactResult.error && exactResult.data && exactResult.data.length > 0) {
          const endTime = performance.now()
          console.log(`✅ Found ${exactResult.data.length} enclosures with exactly ${detectedPanelCapacity} panels`)
          return {
            products: formatEnclosureResults(exactResult.data, 'panel_capacity_exact_general'),
            searchStrategy: 'panel_capacity_exact_general',
            totalFound: exactResult.data.length,
            searchTime: Math.round(endTime - startTime)
          }
        }
        
        // No exact match, find next size up
        console.log(`⚠️ No exact match for ${detectedPanelCapacity} panels in general search, looking for next size up...`)
        
        let nextSizeQuery = supabase
          .from('prod_rack_mount_fiber_enclosures')
          .select('*')
          .gt('panel_capacity', detectedPanelCapacity)
          .eq('is_active', true)
          .order('panel_capacity', { ascending: true })
          .limit(limit)

        const nextSizeResult = await nextSizeQuery as any
        
        if (!nextSizeResult.error && nextSizeResult.data && nextSizeResult.data.length > 0) {
          // Filter to only show the smallest size that's larger than requested
          const nextSize = nextSizeResult.data[0].panel_capacity
          const filteredResults = nextSizeResult.data.filter((item: any) => 
            item.panel_capacity === nextSize
          )
          
          const endTime = performance.now()
          console.log(`✅ Found ${filteredResults.length} enclosures with ${nextSize} panels (next size up from ${detectedPanelCapacity})`)
          return {
            products: formatEnclosureResults(filteredResults, 'panel_capacity_next_size_general'),
            searchStrategy: 'panel_capacity_next_size_general',
            totalFound: filteredResults.length,
            searchTime: Math.round(endTime - startTime)
          }
        }
      }

      // Regular general enclosure search without panel capacity
      const query = await supabase
        .from('prod_rack_mount_fiber_enclosures')
        .select('*')
        .eq('is_active', true)
        .limit(limit)

      console.log(`📊 General enclosure search result:`, {
        error: query.error,
        count: query.data?.length
      })

      if (!query.error && query.data && query.data.length > 0) {
        let sortedResults = [...query.data]

        if (detectedRackUnits || detectedBrand || detectedPanelType) {
          sortedResults.sort((a: any, b: any) => {
            let scoreA = 0
            let scoreB = 0

            if (detectedRackUnits) {
              if (a.rack_units === detectedRackUnits) scoreA += 1
              if (b.rack_units === detectedRackUnits) scoreB += 1
            }

            if (detectedBrand) {
              if (a.brand?.toLowerCase().includes(detectedBrand.toLowerCase())) scoreA += 5
              if (b.brand?.toLowerCase().includes(detectedBrand.toLowerCase())) scoreB += 5
            }

            if (detectedPanelType) {
              if (a.panel_type === detectedPanelType) scoreA += 5
              if (b.panel_type === detectedPanelType) scoreB += 5
            }

            return scoreB - scoreA
          })
        }

        const endTime = performance.now()
        return {
          products: formatEnclosureResults(sortedResults, 'general_enclosure_search'),
          searchStrategy: 'general_enclosure_search',
          totalFound: sortedResults.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 3: Comprehensive search
    console.log(`🎯 STRATEGY 3: Comprehensive search across all fields`)

    let query = supabase
      .from('prod_rack_mount_fiber_enclosures')
      .select('*')
      .eq('is_active', true)
      .limit(limit)

    const searchConditions: string[] = []
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    searchConditions.push(`brand.ilike.%${searchTerm}%`)
    searchConditions.push(`product_line.ilike.%${searchTerm}%`)
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`common_terms.ilike.%${searchTerm}%`)
    searchConditions.push(`category.ilike.%${searchTerm}%`)
    searchConditions.push(`product_type.ilike.%${searchTerm}%`)

    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
    }

    const result = await query
    console.log(`📊 Comprehensive search result:`, {
      error: result.error,
      count: result.data?.length
    })

    if (!result.error && result.data && result.data.length > 0) {
      const endTime = performance.now()
      return {
        products: formatEnclosureResults(result.data, 'comprehensive_search'),
        searchStrategy: 'comprehensive_search',
        totalFound: result.data.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    // FINAL FALLBACK: Get ALL enclosures (active or not)
    console.log('🔍 FINAL FALLBACK: Getting ALL enclosures regardless of status')

    const fallbackQuery = await supabase
      .from('prod_rack_mount_fiber_enclosures')
      .select('*')
      .limit(limit)

    console.log(`📊 Final fallback result:`, {
      error: fallbackQuery.error,
      count: fallbackQuery.data?.length,
      data: fallbackQuery.data
    })

    if (!fallbackQuery.error && fallbackQuery.data && fallbackQuery.data.length > 0) {
      console.log('📦 Returning ALL enclosures (active and inactive)')
      const endTime = performance.now()
      return {
        products: formatEnclosureResults(fallbackQuery.data, 'fallback_all'),
        searchStrategy: 'fallback_all',
        totalFound: fallbackQuery.data.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    // No results found at all
    console.log('❌ No fiber enclosure results found in any strategy')
    const endTime = performance.now()
    return {
      products: [],
      searchStrategy: 'no_results',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }

  } catch (error) {
    console.error('❌ Error in searchRackMountFiberEnclosures:', error)
    const endTime = performance.now()

    return {
      products: [],
      searchStrategy: 'error',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }
  } finally {
    console.log('🏗️ ========== FIBER ENCLOSURE SEARCH END ==========')
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

const formatEnclosureResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} FIBER ENCLOSURE RESULTS (${searchType})`)

  return data.map((item: RackMountEnclosureRow) => {
    // Log if we're including inactive products
    if (item.is_active === false) {
      console.log(`⚠️ Including inactive product: ${item.part_number} - ${item.brand}`)
    }

    const product: Product = {
      id: `enclosure-${item.id}`,
      partNumber: item.part_number?.toString() || 'No Part Number',
      brand: item.brand?.trim() || 'Unknown Brand',
      description: item.short_description?.trim() || 'No description available',
      price: Math.random() * 5 + 1, // Price range for enclosures
      stockLocal: item.is_active ? Math.floor(Math.random() * 10) : 0,
      stockDistribution: item.is_active ? 5 : 0,
      leadTime: item.is_active ? 'Ships in 2-3 days' : 'Contact for availability',
      category: 'Fiber Enclosure',
      // Enhanced attributes from your database
      productLine: item.product_line?.trim() || undefined,
      productType: item.product_type?.trim() || 'Rack Mount Fiber Enclosure',
      mountType: item.mount_type?.trim() || 'Rack Mount',
      rackUnits: item.rack_units || undefined,
      panelType: item.panel_type?.trim() || undefined,
      panelCapacity: item.accepts_number_of_connector_housing_panels || undefined,
      color: item.color?.trim() || undefined,
      material: item.material?.trim() || undefined,
      supportsSpliceTrays: item.supports_splice_trays || false,
      environment: item.environment?.trim() || undefined,
      possibleEquivalent: item.possible_equivalent?.trim() || undefined,
      commonTerms: item.common_terms?.trim() || undefined,
      spliceTrayModel: item.fiber_enclosure_splice_tray?.trim() || undefined,
      upcCode: item.upc_number?.toString() || undefined,
      searchRelevance: 1.0,
      tableName: 'rack_mount_fiber_enclosures',
      stockStatus: item.is_active ? 'not_in_stock' : 'discontinued',
      stockColor: item.is_active ? 'red' : 'gray',
      stockMessage: item.is_active ? 'Special order - contact for availability' : 'Discontinued - contact for alternatives'
    }

    console.log(`📦 Formatted: ${product.partNumber} - ${product.brand} - ${product.rackUnits}RU (Active: ${item.is_active})`)
    return product
  })
}

/**
 * Generate smart filters for fiber enclosures
 */
export const generateFiberEnclosureFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  // Type-safe extraction with proper undefined handling
  const enclosureProducts = products.filter(p => p.tableName === 'rack_mount_fiber_enclosures')

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    panelTypes: filterString(enclosureProducts.map(p => p.panelType)).slice(0, 4),
    rackUnits: filterString(enclosureProducts.map(p => p.rackUnits?.toString())).slice(0, 6),
    colors: filterString(enclosureProducts.map(p => p.color)).slice(0, 6),
    environments: filterString(enclosureProducts.map(p => p.environment)).slice(0, 3),
    productLines: filterString(enclosureProducts.map(p => p.productLine)).slice(0, 6),
    mountTypes: filterString(enclosureProducts.flatMap(p => p.mountType ? normalizeMountTypes(p.mountType) : [])).slice(0, 3)
  }
}

// ===================================================================
// CROSS-REFERENCE FUNCTIONS - For finding compatible components
// ===================================================================

/**
 * Find compatible adapter panels for a given enclosure
 * Panel types must match (CCH enclosures hold CCH panels, etc.)
 */
export const findCompatibleAdapterPanels = async (
  enclosurePanelType: string,
  limit: number = 1
): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('prod_adapter_panels')
      .select('*')
      .eq('is_active', true)
      .eq('panel_type', enclosurePanelType)
      .limit(limit)

    if (error) throw error

    if (data && data.length > 0) {
      console.log(`🔗 Found ${data.length} compatible adapter panels for ${enclosurePanelType} enclosures`)
      return formatPanelResults(data, 'compatible_panels')
    }

    return []
  } catch (error) {
    console.error('❌ Error finding compatible adapter panels:', error)
    return []
  }
}

/**
 * Find splice trays compatible with specific enclosure models
 */
export const findCompatibleSpliceTrays = async (
  enclosurePartNumber: string
): Promise<Product[]> => {
  // This would need a splice_trays table or reference data
  // For now, return empty array as placeholder
  console.log(`🔧 Would search for splice trays compatible with ${enclosurePartNumber}`)
  return []
}

// Helper function to format adapter panel results (reused from adapter panel search)
const formatPanelResults = (data: any[], searchType: string): Product[] => {
  return data.map((item: RackMountEnclosureRow) => ({
    id: `panel-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: Math.random() * 2 + 75,
    stockLocal: 1,
    stockDistribution: 1,
    leadTime: 'Ships Today',
    category: 'Adapter Panel',
    panelType: item.panel_type?.trim() || undefined,
    productLine: item.product_line?.trim() || undefined,
    possibleEquivalent: item.possible_equivalent?.trim() || undefined,
    commonTerms: item.common_terms?.trim() || undefined,
    searchRelevance: 1.0,
    tableName: 'adapter_panels',
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }))
}