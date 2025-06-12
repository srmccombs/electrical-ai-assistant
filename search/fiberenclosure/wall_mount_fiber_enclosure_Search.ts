// src/search/fiberenclosure/wall_mount_fiber_enclosure_Search.ts
// Wall Mount Fiber Enclosure Search Implementation
// Created: June 6, 2025

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'

// Import shared detection functions from industryKnowledge
import {
  detectBrand,
  detectColor,
  detectEnvironment,
  detectPartNumbers
} from '@/search/shared/industryKnowledge'

// ===================================================================
// TYPE DEFINITIONS - Wall Mount Fiber Enclosure Specific
// ===================================================================

export interface WallMountFiberEnclosureSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface WallMountFiberEnclosureSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// COMPREHENSIVE SEARCH TERMS
// ===================================================================

// All the ways someone might ask for a wall mount fiber enclosure
const WALL_MOUNT_SEARCH_TERMS = [
  // Basic terms
  'fiber enclosure', 'fibre enclosure',

  // Wall mount variations
  'wall mount fiber enclosure', 'wall mount fibre enclosure',
  'wallmount fiber enclosure', 'wallmount fibre enclosure',
  'wall mount fiber box', 'wall mount fibre box',
  'wallmount fiber box', 'wallmount fibre box',
  'wall mount fiber panel', 'wall mount fibre panel',
  'wallmount fiber panel', 'wallmount fibre panel',
  'wall mount fiber cassette', 'wall mount fibre cassette',
  'wallmount fiber cassette', 'wallmount fibre cassette',
  'wall mount fiber chassis', 'wall mount fibre chassis',
  'wallmount fiber chassis', 'wallmount fibre chassis',

  // Optical variations
  'wall mount optical enclosure', 'wall mount optical box',
  'wall mount optical panel', 'wall mount optical cassette',
  'wall mount optical chassis',

  // Fiber optic variations
  'fiber optic wall mount enclosure', 'fibre optic wall mount enclosure',
  'fiber optic wallmount enclosure', 'fibre optic wallmount enclosure',
  'fiber optic wall enclosure', 'fibre optic wall enclosure',

  // Termination box variations
  'wall mount fiber termination box', 'wall mount fibre termination box',

  // Patch panel variations
  'fiber patch panel wall mount', 'fibre patch panel wall mount',

  // Different cases (ALL CAPS, Title Case, etc.)
  'WALL MOUNT FIBER ENCLOSURE', 'WALL MOUNT FIBRE ENCLOSURE',
  'WALLMOUNT FIBER ENCLOSURE', 'WALLMOUNT FIBRE ENCLOSURE',
  'Wall Mount Fiber Enclosure', 'Wall Mount Fibre Enclosure',
  'Wallmount Fiber Enclosure', 'Wallmount Fibre Enclosure'
]

// ===================================================================
// DETECTION FUNCTIONS - Wall Mount Specific
// ===================================================================

/**
 * Detect if search is for wall mount fiber enclosure
 */
const detectWallMountRequest = (searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase()

  // Check for explicit wall mount terms
  const wallMountIndicators = [
    'wall mount', 'wallmount', 'wall-mount',
    'wall mounted', 'wallmounted', 'wall-mounted',
    'wall box', 'wall panel', 'wall enclosure'
  ]

  return wallMountIndicators.some(indicator => term.includes(indicator))
}

/**
 * Detect mount type (wall mount vs din-rail)
 */
const detectMountType = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  if (term.includes('din rail') || term.includes('din-rail') || term.includes('dinrail')) {
    console.log(`🏭 Detected mount type: DIN-Rail`)
    return 'DIN-Rail'
  }

  if (detectWallMountRequest(searchTerm)) {
    console.log(`🏠 Detected mount type: Wall Mount`)
    return 'Wall Mount'
  }

  return undefined
}

/**
 * Detect panel type (CCH, FAP, etc.)
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

  // LGX variations (common for wall mount)
  if (term.includes('lgx')) {
    console.log(`📦 Detected panel type: LGX`)
    return 'LGX'
  }

  return undefined
}

/**
 * Detect fiber capacity
 */
const detectFiberCapacity = (searchTerm: string): number | undefined => {
  const term = searchTerm.toLowerCase()

  const patterns = [
    /(\d+)\s*fiber/i,
    /(\d+)\s*fibre/i,
    /(\d+)\s*port/i,
    /(\d+)\s*strand/i
  ]

  for (const pattern of patterns) {
    const match = term.match(pattern)
    if (match && match[1]) {
      const capacity = parseInt(match[1], 10)
      if (capacity >= 1 && capacity <= 288) { // Reasonable capacity range
        console.log(`🔢 Detected fiber capacity: ${capacity}`)
        return capacity
      }
    }
  }

  return undefined
}

/**
 * Detect panel capacity from search term
 * Examples: "2 panel", "4 panel enclosure", "6 panel fiber enclosure"
 */
const detectPanelCapacity = (searchTerm: string): number | undefined => {
  const term = searchTerm.toLowerCase()
  console.log(`[detectPanelCapacity] Searching in: "${term}"`)

  // First, find all numbers in the search term
  const numbers = term.match(/\d+/g)
  if (!numbers) {
    console.log(`[detectPanelCapacity] No numbers found in search term`)
    return undefined
  }
  console.log(`[detectPanelCapacity] Found numbers:`, numbers)

  // Look for panel-related keywords
  const panelKeywords = ['panel', 'adapter', 'capacity', 'holds', 'slot', 'fap', 'cassette']
  
  // For each number, check if it's followed by a panel keyword
  for (const num of numbers) {
    const numValue = parseInt(num, 10)
    
    // Create a regex to find this specific number followed by panel keywords
    const numPattern = new RegExp(`\\b${num}\\s*(${panelKeywords.join('|')})`, 'i')
    console.log(`[detectPanelCapacity] Testing pattern for ${num}:`, numPattern)
    
    if (numPattern.test(term)) {
      console.log(`[detectPanelCapacity] Pattern matched for ${num}!`)
      if (numValue >= 1 && numValue <= 24) { // Reasonable panel range for wall mount
        console.log(`📊 Detected panel capacity request: ${numValue} panels`)
        return numValue
      }
    } else {
      console.log(`[detectPanelCapacity] Pattern did NOT match for ${num}`)
    }
  }

  // Fallback patterns for special cases
  const patterns = [
    /holds?\s*(\d+)\s*panel/i,
    /capacity\s*(?:of\s*)?(\d+)/i,
    /(\d+)\s*fap/i,
    /(\d+)\s*cassette/i
  ]

  for (const pattern of patterns) {
    const match = term.match(pattern)
    if (match && match[1]) {
      const panels = parseInt(match[1], 10)
      if (panels >= 1 && panels <= 24) {
        console.log(`📊 Detected panel capacity request: ${panels} panels (fallback pattern)`)
        return panels
      }
    }
  }

  return undefined
}

/**
 * Check if any wall mount search term matches
 */
const matchesWallMountSearchTerms = (searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase()
  return WALL_MOUNT_SEARCH_TERMS.some(searchPattern =>
    term.includes(searchPattern.toLowerCase())
  )
}

// ===================================================================
// WALL MOUNT FIBER ENCLOSURE SEARCH IMPLEMENTATION
// ===================================================================

export const searchWallMountFiberEnclosures = async (
  options: WallMountFiberEnclosureSearchOptions
): Promise<WallMountFiberEnclosureSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 50 } = options

  console.log('🏠 ========== WALL MOUNT FIBER ENCLOSURE SEARCH START ==========')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis)

  try {
    // First, let's check if the table exists
    console.log('📊 Checking wall mount table status...')
    
    const tableCheck = await supabase
      .from('wall_mount_fiber_enclosures')
      .select('id', { count: 'exact' })
      .limit(1)

    console.log(`📊 Wall mount table check:`, {
      error: tableCheck.error,
      count: tableCheck.count
    })

    if (tableCheck.error) {
      console.error('❌ Table access error:', tableCheck.error)
      // Return empty result instead of throwing
      const endTime = performance.now()
      return {
        products: [],
        searchStrategy: 'table_error',
        totalFound: 0,
        searchTime: Math.round(endTime - startTime)
      }
    }

    // Enhanced detection
    const detectedMountType = detectMountType(searchTerm)
    const detectedPanelType = detectPanelType(searchTerm) || aiAnalysis?.detectedSpecs?.panelType
    const detectedFiberCapacity = detectFiberCapacity(searchTerm)
    
    // Debug panel capacity detection
    console.log(`🔍 Detecting panel capacity for: "${searchTerm}"`)
    const detectedPanelCapacity = detectPanelCapacity(searchTerm)
    console.log(`🔍 Panel capacity detection result: ${detectedPanelCapacity}`)
    
    const detectedBrandValue = detectBrand(searchTerm) || aiAnalysis?.detectedSpecs?.manufacturer
    const detectedColorValue = detectColor(searchTerm) || aiAnalysis?.detectedSpecs?.color
    const detectedEnvironmentValue = detectEnvironment(searchTerm) || aiAnalysis?.detectedSpecs?.environment
    const isWallMountRequest = detectWallMountRequest(searchTerm) || matchesWallMountSearchTerms(searchTerm)

    console.log('🎯 DETECTED ATTRIBUTES:', {
      mountType: detectedMountType,
      panelType: detectedPanelType,
      fiberCapacity: detectedFiberCapacity,
      panelCapacity: detectedPanelCapacity,
      brand: detectedBrandValue,
      color: detectedColorValue,
      environment: detectedEnvironmentValue,
      isWallMountRequest
    })

    // STRATEGY 0: Direct part number search
    const { hasParts, partNumbers } = detectPartNumbers(searchTerm)
    if (hasParts && partNumbers.length > 0) {
      console.log(`🎯 STRATEGY 0: Direct part number search for: ${partNumbers.join(', ')}`)

      let query = supabase
        .from('wall_mount_fiber_enclosures')
        .select('*')
        .limit(limit)

      // Build OR conditions for part numbers
      const partNumberConditions = partNumbers.map(pn => `part_number.ilike.%${pn}%`)
      query = query.or(partNumberConditions.join(','))

      const result = await query

      if (!result.error && result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatWallMountResults(result.data, 'part_number_match'),
          searchStrategy: 'part_number_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 0.5: Panel capacity search (e.g., "6 panel fiber enclosure") - MOVED UP!
    if (detectedPanelCapacity) {
      console.log(`📊 STRATEGY 0.5: Panel capacity search for ${detectedPanelCapacity} panels`)
      
      // First, try to find exact match
      let query = supabase
        .from('wall_mount_fiber_enclosures')
        .select('*')
        .eq('accepts_number_of_connector_housing_panels', detectedPanelCapacity)
        .not('accepts_number_of_connector_housing_panels', 'is', null)
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
          products: formatWallMountResults(exactResult.data, 'panel_capacity_exact'),
          searchStrategy: 'panel_capacity_exact',
          totalFound: exactResult.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
      
      // If no exact match, find the next size up
      console.log(`⚠️ No exact match for ${detectedPanelCapacity} panels, looking for next size up...`)
      
      let nextSizeQuery = supabase
        .from('wall_mount_fiber_enclosures')
        .select('*')
        .gt('accepts_number_of_connector_housing_panels', detectedPanelCapacity)
        .not('accepts_number_of_connector_housing_panels', 'is', null)
        .order('accepts_number_of_connector_housing_panels', { ascending: true })
        .limit(limit)

      const nextSizeResult = await nextSizeQuery as any
      console.log(`📊 Next size up search result:`, {
        error: nextSizeResult.error,
        count: nextSizeResult.data?.length,
        sizes: nextSizeResult.data?.map((item: any) => item.accepts_number_of_connector_housing_panels).slice(0, 5)
      })

      if (!nextSizeResult.error && nextSizeResult.data && nextSizeResult.data.length > 0) {
        // Filter to only show the smallest size that's larger than requested
        const nextSize = nextSizeResult.data[0].accepts_number_of_connector_housing_panels
        const filteredResults = nextSizeResult.data.filter((item: any) => 
          item.accepts_number_of_connector_housing_panels === nextSize
        )
        
        const endTime = performance.now()
        console.log(`✅ Found ${filteredResults.length} enclosures with ${nextSize} panels (next size up from ${detectedPanelCapacity})`)
        return {
          products: formatWallMountResults(filteredResults, 'panel_capacity_next_size'),
          searchStrategy: 'panel_capacity_next_size',
          totalFound: filteredResults.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 1: Brand-only search
    const queryLower = searchTerm.toLowerCase().trim()
    const brandKeywords = ['corning', 'siecor', 'panduit', 'leviton', 'dmsi', 'legrand']
    const isBrandOnlySearch = brandKeywords.includes(queryLower)

    if (isBrandOnlySearch || detectedBrandValue) {
      console.log(`🏢 STRATEGY 1: Brand search for: "${detectedBrandValue || queryLower}"`)

      let query = supabase
        .from('wall_mount_fiber_enclosures')
        .select('*')
        .limit(limit)

      if (detectedBrandValue === 'Corning' || queryLower === 'corning' || queryLower === 'siecor') {
        query = query.or('brand.ilike.%Corning%,brand.ilike.%Siecor%')
      } else {
        const brandToSearch = detectedBrandValue || queryLower
        query = query.ilike('brand', `%${brandToSearch}%`)
      }

      const result = await query

      if (!result.error && result.data && result.data.length > 0) {
        const endTime = performance.now()
        return {
          products: formatWallMountResults(result.data, 'brand_match'),
          searchStrategy: 'brand_match',
          totalFound: result.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 2: Search vector search (if available)
    if (isWallMountRequest) {
      console.log(`🔎 STRATEGY 2: Search vector search for wall mount enclosures`)

      // First, try using the search_vector if it exists
      const vectorQuery = supabase
        .from('wall_mount_fiber_enclosures')
        .select('*')
        .textSearch('search_vector', searchTerm, {
          type: 'websearch',
          config: 'english'
        })
        .limit(limit)

      const vectorResult = await vectorQuery

      if (!vectorResult.error && vectorResult.data && vectorResult.data.length > 0) {
        console.log(`✅ Found ${vectorResult.data.length} results using search vector`)
        const endTime = performance.now()
        return {
          products: formatWallMountResults(vectorResult.data, 'vector_search'),
          searchStrategy: 'vector_search',
          totalFound: vectorResult.data.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 3: Common terms search
    if (isWallMountRequest || matchesWallMountSearchTerms(searchTerm)) {
      console.log(`🔍 STRATEGY 3: Common terms search`)

      let query = supabase
        .from('wall_mount_fiber_enclosures')
        .select('*')
        .limit(limit)

      // Search in common_terms field for all variations
      const commonTermConditions: string[] = []
      WALL_MOUNT_SEARCH_TERMS.forEach(term => {
        commonTermConditions.push(`common_terms.ilike.%${term}%`)
      })

      if (commonTermConditions.length > 0) {
        query = query.or(commonTermConditions.join(','))
      }

      const result = await query

      if (!result.error && result.data && result.data.length > 0) {
        // Apply additional filtering/sorting based on detected attributes
        let sortedResults = [...result.data]

        if (detectedPanelType || detectedFiberCapacity || detectedMountType) {
          sortedResults.sort((a: any, b: any) => {
            let scoreA = 0
            let scoreB = 0

            if (detectedPanelType) {
              if (a.panel_type === detectedPanelType) scoreA += 10
              if (b.panel_type === detectedPanelType) scoreB += 10
            }

            if (detectedFiberCapacity) {
              if (a.max_fiber_capacity === detectedFiberCapacity) scoreA += 5
              if (b.max_fiber_capacity === detectedFiberCapacity) scoreB += 5
            }

            if (detectedMountType && detectedMountType === 'DIN-Rail') {
              if (a.mount_type?.includes('DIN-Rail')) scoreA += 5
              if (b.mount_type?.includes('DIN-Rail')) scoreB += 5
            }

            return scoreB - scoreA
          })
        }

        const endTime = performance.now()
        return {
          products: formatWallMountResults(sortedResults, 'common_terms_search'),
          searchStrategy: 'common_terms_search',
          totalFound: sortedResults.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 4: Comprehensive search across all fields
    console.log(`🎯 STRATEGY 4: Comprehensive search across all fields`)

    let query = supabase
      .from('wall_mount_fiber_enclosures')
      .select('*')
      .limit(limit)

    // First check if we have active products
    const activeCheck = await supabase
      .from('wall_mount_fiber_enclosures')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    console.log(`📊 Active products check:`, {
      error: activeCheck.error,
      count: activeCheck.count
    })

    // If we have active products, filter by them
    // If NO active products exist, don't filter by is_active
    if (!activeCheck.error && activeCheck.count && activeCheck.count > 0) {
      query = query.eq('is_active', true)
      console.log('📊 Filtering by is_active = true')
    } else {
      console.log('⚠️ No active products found, searching all products')
    }

    const searchConditions: string[] = []
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    searchConditions.push(`brand.ilike.%${searchTerm}%`)
    searchConditions.push(`product_line.ilike.%${searchTerm}%`)
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`common_terms.ilike.%${searchTerm}%`)
    searchConditions.push(`category.ilike.%${searchTerm}%`)
    searchConditions.push(`product_type.ilike.%${searchTerm}%`)
    searchConditions.push(`mount_type.ilike.%${searchTerm}%`)

    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
    }

    const result = await query

    console.log(`📊 Comprehensive search result:`, {
      error: result.error,
      count: result.data?.length,
      firstItem: result.data?.[0]
    })

    if (!result.error && result.data && result.data.length > 0) {
      const endTime = performance.now()
      return {
        products: formatWallMountResults(result.data, 'comprehensive_search'),
        searchStrategy: 'comprehensive_search',
        totalFound: result.data.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    // FINAL STRATEGY: Just get ALL wall mount enclosures
    console.log('🔍 FINAL STRATEGY: Getting ALL wall mount enclosures')

    const allQuery = await supabase
      .from('wall_mount_fiber_enclosures')
      .select('*')
      .limit(limit)

    console.log(`📊 All enclosures query result:`, {
      error: allQuery.error,
      count: allQuery.data?.length,
      data: allQuery.data
    })

    if (!allQuery.error && allQuery.data && allQuery.data.length > 0) {
      const endTime = performance.now()
      return {
        products: formatWallMountResults(allQuery.data, 'all_wall_mount'),
        searchStrategy: 'all_wall_mount',
        totalFound: allQuery.data.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    // No results found at all
    console.log('❌ No wall mount fiber enclosure results found in any strategy')
    const endTime = performance.now()
    return {
      products: [],
      searchStrategy: 'no_results',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }

  } catch (error) {
    console.error('❌ Error in searchWallMountFiberEnclosures:', error)
    const endTime = performance.now()

    return {
      products: [],
      searchStrategy: 'error',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }
  } finally {
    console.log('🏠 ========== WALL MOUNT FIBER ENCLOSURE SEARCH END ==========')
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

const formatWallMountResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} WALL MOUNT FIBER ENCLOSURE RESULTS (${searchType})`)

  return data.map((item: any) => {
    // Check if is_active is boolean or string
    const isActive = item.is_active === true || item.is_active === 'true' || item.is_active === '1'

    const product: Product = {
      id: `wall-enclosure-${item.id}`,
      partNumber: item.part_number?.toString() || 'No Part Number',
      brand: item.brand?.trim() || 'Unknown Brand',
      description: item.short_description?.trim() || 'No description available',
      price: Math.random() * 300 + 50, // Price range for wall mount enclosures
      stockLocal: isActive ? Math.floor(Math.random() * 5) : 0,
      stockDistribution: isActive ? 25 : 0,
      leadTime: isActive ? 'Ships in 3-5 days' : 'Contact for availability',
      category: 'Fiber Enclosure',
      // Enhanced attributes from your database
      productLine: item.product_line?.trim() || undefined,
      productType: item.product_type?.trim() || 'Wall Mount Fiber Enclosure',
      mountType: item.mount_type?.trim() || 'Wall Mount',
      panelType: item.panel_type?.trim() || undefined,
      panelCapacity: item.accepts_number_of_connector_housing_panels || undefined,
      color: item.color?.trim() || undefined,
      material: item.material?.trim() || undefined,
      supportsSpliceTrays: item.supports_splice_trays === true || item.supports_splice_trays === 'true',
      environment: item.environment?.trim() || 'Indoor',
      possibleEquivalent: item.possible_equivalent?.trim() || undefined,
      goWithItems: item.go_with_items?.trim() || undefined,
      commonTerms: item.common_terms?.trim() || undefined,
      upcCode: item.upc_number?.toString() || undefined,
      searchRelevance: 1.0,
      tableName: 'wall_mount_fiber_enclosures',
      stockStatus: isActive ? 'not_in_stock' : 'discontinued',
      stockColor: isActive ? 'red' : 'gray',
      stockMessage: isActive ? 'Special order - contact for availability' : 'Discontinued - contact for alternatives'
    }

    console.log(`📦 Formatted: ${product.partNumber} - ${product.brand} - ${product.mountType} (Active: ${isActive})`)
    return product
  })
}

/**
 * Generate smart filters for wall mount fiber enclosures
 */
export const generateWallMountFiberEnclosureFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  const wallMountProducts = products.filter(p => p.tableName === 'wall_mount_fiber_enclosures')

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    panelTypes: filterString(wallMountProducts.map(p => p.panelType)).slice(0, 4),
    mountTypes: filterString(wallMountProducts.map(p => p.mountType)).slice(0, 3),
    colors: filterString(wallMountProducts.map(p => p.color)).slice(0, 6),
    environments: filterString(wallMountProducts.map(p => p.environment)).slice(0, 3),
    productLines: filterString(wallMountProducts.map(p => p.productLine)).slice(0, 6),
    materials: filterString(wallMountProducts.map(p => p.material)).slice(0, 4)
  }
}