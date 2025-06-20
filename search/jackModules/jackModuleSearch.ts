// src/search/jackModules/jackModuleSearch.ts
// Jack Module Search Implementation - Enhanced for ALL Product Types
// Dynamically handles Category 6A/6/5e, Blank, F-Type Coax, HDMI Coup, and any future types
// UPDATED: Changed from jacket_color to color field

import { supabase } from '@/lib/supabase'
import {
  detectCategoryRating,
  detectShielding,
  detectColor,
  detectBrand,
  normalizePartNumber
} from '../shared/industryKnowledge'

// Import Product and AISearchAnalysis types
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'
import type { JackModuleRow } from '@/search/shared/types'

// ===================================================================
// TYPE DEFINITIONS - Jack Module Specific
// ===================================================================

export interface JackModuleSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
  shoppingListContext?: {
    hasItems: boolean
    faceplates?: Array<{
      partNumber: string
      numberOfPorts: number
      brand: string
      compatibleJacks: string
      description: string
    }>
  }
}

export interface JackModuleSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// DYNAMIC SEARCH TERMS - Now handles all jack module types!
// ===================================================================

// Category-based search terms (Ethernet types)
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  'Category 6A': [
    'Category 6A', 'Cat6A', 'Cat 6A', 'CAT6A', 'cat6a', 'Cat6a',
    'Category Six A', 'Category 6A Augmented', 'CATEGORY 6A',
    '1 Gigabit', '1Gig', '1G', 'CJ688TGBU', 'CJ688TG-BU', 'CJ688'
  ],
  'Category 6': [
    'Category 6', 'Cat6', 'Cat 6', 'CAT6', 'cat6',
    'Category Six', 'CATEGORY 6', 'Gigabit', 'CJ688TG'
  ],
  'Category 5e': [
    'Category 5e', 'Cat5e', 'Cat 5e', 'CAT5e', 'cat5e',
    'Category Five Enhanced', 'CATEGORY 5E', 'Enhanced Cat5',
    'Category 5-e', 'Cat5E', 'CJ5e88TG'
  ]
}

// Non-category jack module types
const SPECIAL_MODULE_TYPES: Record<string, string[]> = {
  'Blank': [
    'blank', 'blank module', 'blank insert', 'blank jack',
    'filler', 'spacer', 'SFB', 'CMB', 'NKBM'
  ],
  'F-Type Coax': [
    'f-type', 'f type', 'coax', 'coaxial', 'catv', 'cable tv',
    'f connector', 'f-connector', 'SFF', '2 ghz', '2ghz'
  ],
  'HDMI Coup': [
    'hdmi', 'hdmi coupler', 'hdmi coupling', 'hdmi connector',
    'hdmi jack', 'hdmi module', 'hdmi 2.', 'hdmi type a',
    'NKHDM'
  ]
}

// Common jack module terms
const JACK_MODULE_TERMS = [
  'jack', 'jacks', 'jack module', 'jack modules', 'connector', 'connectors',
  'module', 'modules', 'port', 'ports', 'keystone', 'keystone jack',
  'rj45', 'rj45 jack', 'ethernet jack', 'network jack', 'data jack',
  'wiring jack', 'keystone connector', 'mini-com', 'minicom', 'netkey'
]

// Product lines
const PRODUCT_LINES: Record<string, string[]> = {
  'Mini-Com': ['mini-com', 'minicom', 'mini com'],
  'NetKey': ['netkey', 'net key', 'net-key'],
  'netSelect': ['netselect', 'net select', 'net-select'],
  'Xcelerator': ['xcelerator', 'xcel'],
  'Ascent': ['ascent']
}

// ===================================================================
// DETECTION FUNCTIONS - Jack Module Specific
// ===================================================================

/**
 * Enhanced category detection for all jack module types
 */
const detectJackModuleType = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase()

  // Check category-based modules (Cat6A, Cat6, Cat5e)
  for (const [category, terms] of Object.entries(CATEGORY_SEARCH_TERMS)) {
    for (const term of terms) {
      if (query.includes(term.toLowerCase())) {
        console.log(`📊 DETECTED CATEGORY MODULE: ${category} from term: "${term}"`)
        return category
      }
    }
  }

  // Check special module types (Blank, F-Type, HDMI)
  for (const [moduleType, terms] of Object.entries(SPECIAL_MODULE_TYPES)) {
    for (const term of terms) {
      if (query.includes(term.toLowerCase())) {
        console.log(`📊 DETECTED SPECIAL MODULE: ${moduleType} from term: "${term}"`)
        return moduleType
      }
    }
  }

  // Fallback to generic category detection for ethernet types
  const genericCategory = detectCategoryRating(searchTerm)
  if (genericCategory) {
    // Convert CAT6A -> Category 6A format
    const categoryMap: Record<string, string> = {
      'CAT6A': 'Category 6A',
      'CAT6': 'Category 6',
      'CAT5E': 'Category 5e'
    }
    return categoryMap[genericCategory] || null
  }

  return null
}

/**
 * Enhanced shielding detection for jack modules
 */
const detectJackShielding = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase()

  // Only applies to ethernet jack modules
  const isEthernetModule = Object.values(CATEGORY_SEARCH_TERMS)
    .flat()
    .some(term => query.includes(term.toLowerCase()))

  if (!isEthernetModule) {
    return null // Non-ethernet modules don't have shielding
  }

  // Check for STP/Shielded terms
  const stpTerms = ['stp', 'shielded', 'shield', 's.t.p.']
  for (const term of stpTerms) {
    if (query.includes(term)) {
      console.log(`🛡️ DETECTED SHIELDING: STP from term: "${term}"`)
      return 'STP'
    }
  }

  // Check for UTP/Unshielded terms
  const utpTerms = ['utp', 'unshielded', 'u.t.p.']
  for (const term of utpTerms) {
    if (query.includes(term)) {
      console.log(`🛡️ DETECTED SHIELDING: UTP from term: "${term}"`)
      return 'UTP'
    }
  }

  // Don't default - return null if no shielding specified
  console.log(`🛡️ No shielding specified - not applying filter`)
  return null
}

/**
 * Detect product line
 */
const detectProductLine = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase()

  for (const [line, terms] of Object.entries(PRODUCT_LINES)) {
    for (const term of terms) {
      if (query.includes(term)) {
        console.log(`📋 DETECTED PRODUCT LINE: ${line}`)
        return line
      }
    }
  }

  return null
}

// ===================================================================
// SEARCH STRATEGIES
// ===================================================================

/**
 * STRATEGY 1: Part Number Search - Most common way to search
 */
const searchByPartNumber = async (
  searchTerm: string,
  limit: number
): Promise<Product[]> => {
  console.log(`🔢 STRATEGY 1: Part Number Search: "${searchTerm}"`)

  const normalized = normalizePartNumber(searchTerm)

  let query = supabase
    .from('prod_jack_modules')
    .select('*')
    .eq('is_active', true)
    .limit(limit)

  // Build search conditions for part number - also check other fields
  const searchConditions = [
    `part_number.ilike.${searchTerm}%`,      // Starts with original
    `part_number.ilike.${normalized}%`,      // Starts with normalized
    `part_number.ilike.%${searchTerm}%`,    // Contains original
    `part_number.ilike.%${normalized}%`,     // Contains normalized
    `short_description.ilike.%${searchTerm}%`, // Check description
    `common_terms.ilike.%${searchTerm}%`,      // Check common terms
    `possible_cross.ilike.%${searchTerm}%`     // Check cross references
  ]

  query = query.or(searchConditions.join(','))

  const { data: resultData, error: resultError } = await query as { data: any[] | null, error: any }
  const products = resultData ? formatJackModuleResults(resultData, 'part_number_search') : []

  console.log(`🔢 Part number search found: ${products.length} products`)
  return products
}

/**
 * STRATEGY 2: Multi-Criteria Search with FLEXIBLE MATCHING
 */
const searchByMultiCriteria = async (
  searchTerm: string,
  aiAnalysis?: AISearchAnalysis | null,
  detectedModuleType?: string | null,
  detectedShielding?: string | null,
  detectedColor?: string | null,
  detectedBrand?: string | null,
  detectedProductLine?: string | null,
  compatibleBrands?: string[],
  compatibleProductLines?: string[]
): Promise<Product[]> => {
  console.log(`🎯 STRATEGY 2: Multi-Criteria Search`)
  console.log({
    moduleType: detectedModuleType,
    shielding: detectedShielding,
    color: detectedColor,
    brand: detectedBrand,
    productLine: detectedProductLine,
    compatibleBrands,
    compatibleProductLines
  })

  let query = supabase
    .from('prod_jack_modules')
    .select('*')
    .eq('is_active', true)
    .limit(100) // Get more products for better variety

  // Apply exact match filters
  if (detectedBrand) {
    query = query.ilike('brand', `%${detectedBrand}%`)
  }

  if (detectedProductLine) {
    query = query.ilike('product_line', `%${detectedProductLine}%`)
  }

  // Apply compatibility filters from shopping list context
  if (compatibleBrands && compatibleBrands.length > 0 && !detectedBrand) {
    // If no brand was detected in search but we have compatible brands from faceplates
    const brandConditions = compatibleBrands.map(brand => `brand.ilike.%${brand}%`).join(',')
    query = query.or(brandConditions)
    console.log('🛒 Applying brand compatibility filter from faceplates:', compatibleBrands)
  }

  if (compatibleProductLines && compatibleProductLines.length > 0 && !detectedProductLine) {
    // If no product line was detected in search but we have compatible product lines from faceplates
    const productLineConditions = compatibleProductLines.map(pl => `product_line.ilike.%${pl}%`).join(',')
    query = query.or(productLineConditions)
    console.log('🛒 Applying product line compatibility filter from faceplates:', compatibleProductLines)
  }

  // Only apply shielding filter if explicitly detected (only for ethernet modules)
  if (detectedShielding) {
    console.log(`🛡️ Applying shielding filter: ${detectedShielding}`)
    query = query.eq('shielding_type', detectedShielding.toUpperCase())
  }

  // Build OR conditions for flexible searching
  const searchConditions: string[] = []

  // Module type specific search
  if (detectedModuleType) {
    // For category modules (Cat6A, Cat6, Cat5e)
    if (detectedModuleType.includes('Category')) {
      // For exact category matching, we need to be more precise
      // to avoid Cat6 matching Cat6A products or Cat5e matching Cat6
      if (detectedModuleType === 'Category 5e') {
        // Build a specific query for ONLY Category 5e products
        let cat5eQuery = supabase
          .from('prod_jack_modules')
          .select('*')
          .eq('is_active', true)
          .limit(100)
        
        // Apply brand filter if detected
        if (detectedBrand) {
          cat5eQuery = cat5eQuery.ilike('brand', `%${detectedBrand}%`)
        }
        
        // Apply product line filter if detected  
        if (detectedProductLine) {
          cat5eQuery = cat5eQuery.ilike('product_line', `%${detectedProductLine}%`)
        }
        
        // Apply color filter if detected
        if (detectedColor) {
          cat5eQuery = cat5eQuery.ilike('color', `%${detectedColor}%`)
        }
        
        // Apply shielding filter if explicitly detected
        if (detectedShielding) {
          cat5eQuery = cat5eQuery.eq('shielding_type', detectedShielding.toUpperCase())
        }
        
        // Use specific OR conditions to get ONLY Category 5e
        cat5eQuery = cat5eQuery.or(
          `category_rating.eq.Category 5e,` +
          `category_rating.eq.Category 5e   ,` + // Note: some entries have spaces
          `category_rating.ilike.Category 5e,` +
          `category_rating.ilike.Cat5e,` +
          `category_rating.ilike.Cat 5e`
        )
        
        // Execute this specific query and return early
        const { data: cat5eData, error: cat5eError } = await cat5eQuery
        
        if (!cat5eError && cat5eData) {
          // No need to filter out other categories since we only matched Cat5e
          console.log(`🎯 Category 5e specific search found: ${cat5eData.length} products`)
          return formatJackModuleResults(cat5eData, 'multi_criteria_search')
        }
      } else if (detectedModuleType === 'Category 6') {
        // Build a specific query to exclude Cat6A products
        let cat6Query = supabase
          .from('prod_jack_modules')
          .select('*')
          .eq('is_active', true)
          .limit(100)
        
        // Apply brand filter if detected
        if (detectedBrand) {
          cat6Query = cat6Query.ilike('brand', `%${detectedBrand}%`)
        }
        
        // Apply product line filter if detected  
        if (detectedProductLine) {
          cat6Query = cat6Query.ilike('product_line', `%${detectedProductLine}%`)
        }
        
        // Apply color filter if detected
        if (detectedColor) {
          cat6Query = cat6Query.ilike('color', `%${detectedColor}%`)
        }
        
        // Apply shielding filter if explicitly detected
        if (detectedShielding) {
          cat6Query = cat6Query.eq('shielding_type', detectedShielding.toUpperCase())
        }
        
        // Use specific OR conditions to get ONLY Category 6 (not 6A)
        // Include ALL available fields for comprehensive search
        cat6Query = cat6Query.or(
          `category_rating.eq.Category 6,` +
          `category_rating.eq.Category 6 ,` +
          `category_rating.ilike.Category 6,` +
          `short_description.ilike.%Category 6%,` +
          `short_description.ilike.%Cat6%,` +
          `common_terms.ilike.%Category 6%,` +
          `common_terms.ilike.%Cat6%,` +
          `product_type.ilike.%Cat6%,` +
          `possible_cross.ilike.%Cat6%`
        )
        
        // Execute this specific query and return early
        const { data: cat6Data, error: cat6Error } = await cat6Query
        
        if (!cat6Error && cat6Data) {
          // Filter out any Cat6A that might have slipped through
          const filteredData = cat6Data.filter((item: any) => {
            const rating = item.category_rating?.toLowerCase() || ''
            const desc = item.short_description?.toLowerCase() || ''
            const commonTerms = item.common_terms?.toLowerCase() || ''
            const productType = item.product_type?.toLowerCase() || ''
            // Exclude if it contains '6a' or '6A' in any field
            return !rating.includes('6a') && !desc.includes('cat6a') && !desc.includes('cat 6a') &&
                   !commonTerms.includes('6a') && !productType.includes('6a')
          })
          
          const products = formatJackModuleResults(filteredData, 'multi_criteria_search')
          console.log(`🎯 Category 6 specific search found: ${products.length} products (excluded Cat6A)`)
          return products
        }
      } else if (detectedModuleType === 'Category 6A') {
        // Build a specific query for ONLY Category 6A products
        let cat6aQuery = supabase
          .from('prod_jack_modules')
          .select('*')
          .eq('is_active', true)
          .limit(100)
        
        // Apply brand filter if detected
        if (detectedBrand) {
          cat6aQuery = cat6aQuery.ilike('brand', `%${detectedBrand}%`)
        }
        
        // Apply product line filter if detected  
        if (detectedProductLine) {
          cat6aQuery = cat6aQuery.ilike('product_line', `%${detectedProductLine}%`)
        }
        
        // Apply color filter if detected
        if (detectedColor) {
          cat6aQuery = cat6aQuery.ilike('color', `%${detectedColor}%`)
        }
        
        // Apply shielding filter if explicitly detected
        if (detectedShielding) {
          cat6aQuery = cat6aQuery.eq('shielding_type', detectedShielding.toUpperCase())
        }
        
        // Use specific OR conditions to get ONLY Category 6A
        cat6aQuery = cat6aQuery.or(
          `category_rating.eq.Category 6A,` +
          `category_rating.ilike.Category 6A,` +
          `category_rating.ilike.Cat6A,` +
          `category_rating.ilike.Cat 6A`
        )
        
        // Execute this specific query and return early
        const { data: cat6aData, error: cat6aError } = await cat6aQuery
        
        if (!cat6aError && cat6aData) {
          console.log(`🎯 Category 6A specific search found: ${cat6aData.length} products`)
          return formatJackModuleResults(cat6aData, 'multi_criteria_search')
        }
      } else {
        // For other categories, use generic approach - search ALL fields
        searchConditions.push(`category_rating.ilike.%${detectedModuleType}%`)
        const shortCategory = detectedModuleType.replace('Category ', 'Cat')
        searchConditions.push(`short_description.ilike.%${shortCategory}%`)
        searchConditions.push(`short_description.ilike.%${detectedModuleType}%`)
        searchConditions.push(`common_terms.ilike.%${shortCategory}%`)
        searchConditions.push(`common_terms.ilike.%${detectedModuleType}%`)
        searchConditions.push(`product_type.ilike.%${shortCategory}%`)
        searchConditions.push(`possible_cross.ilike.%${shortCategory}%`)
        searchConditions.push(`compatible_faceplates.ilike.%${shortCategory}%`)
      }
    } else {
      // For special modules (Blank, F-Type Coax, HDMI Coup) - search ALL fields
      searchConditions.push(`category_rating.ilike.%${detectedModuleType}%`)
      searchConditions.push(`short_description.ilike.%${detectedModuleType}%`)
      searchConditions.push(`product_type.ilike.%${detectedModuleType}%`)
      searchConditions.push(`common_terms.ilike.%${detectedModuleType}%`)
      
      // Add specific terms for each type - search in ALL fields
      const specialTerms = SPECIAL_MODULE_TYPES[detectedModuleType] || []
      specialTerms.forEach(term => {
        searchConditions.push(`short_description.ilike.%${term}%`)
        searchConditions.push(`common_terms.ilike.%${term}%`)
        searchConditions.push(`product_type.ilike.%${term}%`)
        searchConditions.push(`possible_cross.ilike.%${term}%`)
      })
    }
    console.log(`🎯 Using ${detectedModuleType} search terms across ALL fields`)
  } else {
    // General jack module search - comprehensive search across ALL fields
    searchConditions.push(`product_type.ilike.%jack%`)
    searchConditions.push(`short_description.ilike.%jack%`)
    searchConditions.push(`short_description.ilike.%module%`)
    searchConditions.push(`common_terms.ilike.%jack%`)
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`common_terms.ilike.%${searchTerm}%`)
    searchConditions.push(`product_line.ilike.%${searchTerm}%`)
    searchConditions.push(`possible_cross.ilike.%${searchTerm}%`)
  }

  // Color search - using 'color' field now, not 'jacket_color' - search ALL relevant fields
  if (detectedColor) {
    searchConditions.push(`color.ilike.%${detectedColor}%`)
    searchConditions.push(`short_description.ilike.%${detectedColor}%`)
    searchConditions.push(`common_terms.ilike.%${detectedColor}%`)
  }

  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','))
  }

  const { data: resultData, error: resultError } = await query as { data: any[] | null, error: any }
  console.log(`🎯 Multi-criteria search query result:`, resultError || `${resultData?.length} items`)

  if (!resultError && resultData && resultData.length > 0) {
    // Ensure diversity in the results
    const seenCombos = new Set<string>()
    const diverseProducts: any[] = []
    
    // Group products by brand and product_line
    const grouped = new Map<string, any[]>()
    for (const item of resultData) {
      const key = `${item.brand || 'Unknown'}_${item.product_line || 'None'}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(item)
    }
    
    // First pass: get at least one product from each unique combo
    for (const [combo, items] of grouped.entries()) {
      if (diverseProducts.length < 2) {
        // Add products with different shielding types if available
        const utpItem = items.find(i => i.shielding_type === 'UTP')
        const stpItem = items.find(i => i.shielding_type === 'STP')
        
        if (utpItem) diverseProducts.push(utpItem)
        if (stpItem && diverseProducts.length < 2) diverseProducts.push(stpItem)
        
        // If no UTP/STP found, just add the first item
        if (!utpItem && !stpItem && items.length > 0) {
          diverseProducts.push(items[0])
        }
      }
    }
    
    // Second pass: fill remaining slots
    for (const item of resultData) {
      if (diverseProducts.length >= 200) break
      if (!diverseProducts.includes(item)) {
        diverseProducts.push(item)
      }
    }
    
    console.log(`🎯 Ensured diversity: ${grouped.size} unique brand/product_line combos`)
    
    // Return ALL products, let the user filter them
    console.log(`🎯 Returning all ${diverseProducts.length} products for user filtering`)
    
    const products = formatJackModuleResults(diverseProducts, 'multi_criteria_search')
    console.log(`🎯 Multi-criteria search found: ${products.length} products`)
    return products
  }

  const products = resultData ? formatJackModuleResults(resultData, 'multi_criteria_search') : []
  console.log(`🎯 Multi-criteria search found: ${products.length} products`)
  return products
}

/**
 * STRATEGY 3: Category-Specific Search (for category_rating field)
 */
const searchByCategoryRating = async (
  categoryRating: string,
  limit: number
): Promise<Product[]> => {
  console.log(`📂 STRATEGY 3: Category Rating Search: "${categoryRating}"`)

  const query = supabase
    .from('prod_jack_modules')
    .select('*')
    .eq('is_active', true)
    .ilike('category_rating', `%${categoryRating}%`)
    .limit(limit)

  const { data: resultData, error: resultError } = await query as { data: any[] | null, error: any }
  const products = resultData ? formatJackModuleResults(resultData, 'category_rating_search') : []

  console.log(`📂 Category rating search found: ${products.length} products`)
  return products
}

/**
 * STRATEGY 4: Fallback Broad Search - Enhanced for better product diversity
 */
const searchByFallback = async (
  searchTerm: string,
  limit: number,
  aiAnalysis?: AISearchAnalysis | null
): Promise<Product[]> => {
  console.log(`🔍 STRATEGY 4: Fallback Search: "${searchTerm}"`)
  console.log(`🤖 AI Analysis available:`, !!aiAnalysis)

  // Start with base query
  let query = supabase
    .from('prod_jack_modules')
    .select('*')
    .eq('is_active', true)
    .order('brand', { ascending: true })
    .order('product_line', { ascending: true })
    .order('category_rating', { ascending: true })
    .limit(limit) // Get many products for initial filtering

  // Apply AI detected filters if available
  if (aiAnalysis?.detectedSpecs) {
    // Brand filter from AI
    if (aiAnalysis.detectedSpecs.manufacturer) {
      query = query.ilike('brand', `%${aiAnalysis.detectedSpecs.manufacturer}%`)
      console.log(`🏢 Applying AI brand filter in fallback: ${aiAnalysis.detectedSpecs.manufacturer}`)
    }
    
    // Category filter from AI
    if (aiAnalysis.detectedSpecs.categoryRating) {
      const categoryMap: Record<string, string> = {
        'CAT6A': 'Category 6A',
        'CAT6': 'Category 6',
        'CAT5E': 'Category 5e'
      }
      const mappedCategory = categoryMap[aiAnalysis.detectedSpecs.categoryRating]
      if (mappedCategory) {
        // For Category 6, exclude Cat6A
        if (mappedCategory === 'Category 6') {
          query = query.ilike('category_rating', '%Category 6%')
          console.log(`📊 Applying AI category filter in fallback: ${mappedCategory} (will filter Cat6A in post-processing)`)
        } else {
          query = query.ilike('category_rating', `%${mappedCategory}%`)
          console.log(`📊 Applying AI category filter in fallback: ${mappedCategory}`)
        }
      }
    }
  }

  const searchConditions: string[] = []

  // Extract meaningful words (skip common words and typos)
  const skipWords = ['i', 'need', 'want', 'looking', 'for', 'the', 'a', 'an']
  const words = searchTerm.split(' ').filter(w => {
    if (w.length <= 1 || skipWords.includes(w.toLowerCase())) return false
    // Skip potential typos of 'cat' (like 'cabt')
    if (w.toLowerCase().match(/^ca[bt]t?\d*$/i)) {
      console.log(`🔍 Skipping potential typo: ${w}`)
      return false
    }
    return true
  })

  console.log(`🔍 Searching for words:`, words)

  // Search for jack-related terms broadly across ALL fields
  searchConditions.push(`product_type.ilike.%jack%`)
  searchConditions.push(`short_description.ilike.%jack%`)
  searchConditions.push(`common_terms.ilike.%jack%`)
  searchConditions.push(`category_rating.ilike.%jack%`)
  searchConditions.push(`possible_cross.ilike.%jack%`)
  
  // Also search for "jacks" (plural)
  if (searchTerm.toLowerCase().includes('jacks')) {
    searchConditions.push(`short_description.ilike.%jacks%`)
    searchConditions.push(`common_terms.ilike.%jacks%`)
  }

  // Also search for each meaningful word across ALL fields
  words.forEach(word => {
    searchConditions.push(`short_description.ilike.%${word}%`)
    searchConditions.push(`common_terms.ilike.%${word}%`)
    searchConditions.push(`part_number.ilike.%${word}%`)
    searchConditions.push(`product_line.ilike.%${word}%`)
    searchConditions.push(`color.ilike.%${word}%`)
    searchConditions.push(`possible_cross.ilike.%${word}%`)
    searchConditions.push(`compatible_faceplates.ilike.%${word}%`)
    searchConditions.push(`upc_number.ilike.%${word}%`)
  })

  // Only add OR conditions if we have some
  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','))
  }

  const { data: resultData, error: resultError } = await query as { data: any[] | null, error: any }
  console.log(`🔍 Fallback search query result:`, resultError || `${resultData?.length} items`)

  if (!resultError && resultData && resultData.length > 0) {
    // Filter results based on AI analysis if available
    let filteredResults = resultData
    
    // For Category 6, exclude Cat6A products
    if (aiAnalysis?.detectedSpecs?.categoryRating === 'CAT6') {
      filteredResults = filteredResults.filter(item => {
        const category = item.category_rating?.toLowerCase() || ''
        const desc = item.short_description?.toLowerCase() || ''
        return !category.includes('6a') && !desc.includes('cat6a') && !desc.includes('cat 6a')
      })
      console.log(`🎯 Filtered Cat6 results: ${resultData.length} → ${filteredResults.length}`)
    }
    
    // Get unique combinations of brand + product_line to ensure diversity
    const seenCombos = new Set<string>()
    const diverseProducts: any[] = []
    
    // First pass: get one product from each unique brand/product_line combo
    for (const item of filteredResults) {
      const combo = `${item.brand || 'Unknown'}_${item.product_line || 'None'}`
      if (!seenCombos.has(combo) && diverseProducts.length < limit) {
        seenCombos.add(combo)
        diverseProducts.push(item)
      }
    }
    
    // Second pass: fill remaining slots with other products
    for (const item of filteredResults) {
      if (diverseProducts.length >= limit) break
      if (!diverseProducts.includes(item)) {
        diverseProducts.push(item)
      }
    }
    
    console.log(`🔍 Diversity check - unique brand/product_line combos: ${seenCombos.size}`)
    const products = formatJackModuleResults(diverseProducts.slice(0, limit), 'fallback_search')
    console.log(`🔍 Fallback search found: ${products.length} products`)
    return products
  }

  const products = resultData ? formatJackModuleResults(resultData, 'fallback_search') : []
  console.log(`🔍 Fallback search found: ${products.length} products`)
  return products
}

// ===================================================================
// MAIN SEARCH FUNCTION
// ===================================================================

export const searchJackModules = async (
  options: JackModuleSearchOptions
): Promise<JackModuleSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100, shoppingListContext } = options

  console.log('🔌 JACK MODULE SEARCH')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)
  console.log('🛒 Shopping list context:', {
    hasContext: !!shoppingListContext?.hasItems,
    faceplatesCount: shoppingListContext?.faceplates?.length || 0
  })

  try {
    // Use enhanced detection functions
    const detectedModuleType = detectJackModuleType(searchTerm) ||
                             aiAnalysis?.detectedSpecs?.categoryRating

    const detectedShielding = detectJackShielding(searchTerm) ||
                            aiAnalysis?.detectedSpecs?.shielding

    const detectedColor = detectColor(searchTerm) ||
                         aiAnalysis?.detectedSpecs?.color

    const detectedBrand = detectBrand(searchTerm) ||
                         aiAnalysis?.detectedSpecs?.manufacturer

    const detectedProductLine = detectProductLine(searchTerm)

    console.log('🎯 DETECTION RESULTS:', {
      moduleType: detectedModuleType,
      shielding: detectedShielding,
      color: detectedColor,
      brand: detectedBrand,
      productLine: detectedProductLine
    })

    // Extract compatibility info from shopping list context
    let compatibleBrands: string[] = []
    let compatibleProductLines: string[] = []
    
    if (shoppingListContext?.hasItems && shoppingListContext.faceplates && shoppingListContext.faceplates.length > 0) {
      // Get unique brands from faceplates in cart
      const brands = new Set<string>()
      const productLines = new Set<string>()
      
      shoppingListContext.faceplates.forEach(faceplate => {
        console.log('🛒 Processing faceplate:', {
          partNumber: faceplate.partNumber,
          brand: faceplate.brand,
          compatibleJacks: faceplate.compatibleJacks,
          compatibleJacksType: typeof faceplate.compatibleJacks
        })
        
        if (faceplate.brand) {
          brands.add(faceplate.brand)
        }
        
        // Extract product lines from compatible jacks field
        if (faceplate.compatibleJacks) {
          // Handle PostgreSQL array format or string format
          let compatibleValues: string[] = []
          
          if (Array.isArray(faceplate.compatibleJacks)) {
            // Already an array
            compatibleValues = faceplate.compatibleJacks
          } else if (typeof faceplate.compatibleJacks === 'string') {
            // Parse string representation
            const jackValue = faceplate.compatibleJacks
            
            // Try to parse as JSON array
            try {
              if (jackValue.startsWith('[') && jackValue.endsWith(']')) {
                compatibleValues = JSON.parse(jackValue)
              }
            } catch (e) {
              // Not JSON, try other formats
            }
            
            // Handle PostgreSQL array format {value1,value2}
            if (compatibleValues.length === 0 && jackValue.startsWith('{') && jackValue.endsWith('}')) {
              compatibleValues = jackValue.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''))
            }
            
            // Handle comma-separated values
            if (compatibleValues.length === 0 && jackValue.includes(',')) {
              compatibleValues = jackValue.split(',').map(v => v.trim())
            }
            
            // Single value or pattern matching
            if (compatibleValues.length === 0) {
              // Check for common patterns
              if (jackValue.toLowerCase().includes('mini-com')) {
                productLines.add('Mini-Com')
              }
              if (jackValue.toLowerCase().includes('netkey')) {
                productLines.add('NetKey')
              }
              if (jackValue.toLowerCase().includes('keystone')) {
                productLines.add('Keystone')
              }
              if (jackValue.toLowerCase().includes('netselect')) {
                productLines.add('netSelect')
              }
              if (jackValue.toLowerCase().includes('xcelerator')) {
                productLines.add('XCELERATOR')
              }
              if (jackValue.toLowerCase().includes('istation')) {
                productLines.add('ISTATION')
              }
              if (jackValue.toLowerCase().includes('nextspeed')) {
                productLines.add('NEXTSPEED')
              }
            }
          }
          
          // Add all compatible values to product lines
          compatibleValues.forEach(value => {
            if (value && value.trim()) {
              productLines.add(value.trim())
            }
          })
        }
      })
      
      compatibleBrands = Array.from(brands)
      compatibleProductLines = Array.from(productLines)
      
      console.log('🛒 Detected compatibility requirements from faceplates:', {
        brands: compatibleBrands,
        productLines: compatibleProductLines,
        faceplatesInCart: shoppingListContext.faceplates.length
      })
    }

    let products: Product[] = []
    let searchStrategy = 'unknown'

    // Check if it looks like a part number search
    const isPartNumber = /^[A-Z-9]{3,}/.test(searchTerm.toUpperCase()) ||
                        searchTerm.split(/[\s-]/).some(part => /^[A-Z-9]{4,}$/.test(part))

    // STRATEGY 1: Part Number Search
    if (isPartNumber || (!detectedModuleType && !detectedShielding && searchTerm.length < 2)) {
      console.log(`🚀 STRATEGY 1: Part Number Search`)
      products = await searchByPartNumber(searchTerm, limit)
      searchStrategy = 'part_number_search'

      if (products.length > 0) {
        const endTime = performance.now()
        return {
          products: products.slice(0, limit),
          searchStrategy,
          totalFound: products.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 2: Multi-Criteria Search - Always try this for module type searches
    if (detectedModuleType || detectedBrand || detectedProductLine || detectedColor || (compatibleBrands.length > 0 || compatibleProductLines.length > 0)) {
      console.log(`🚀 STRATEGY 2: Multi-Criteria Search`)
      products = await searchByMultiCriteria(
        searchTerm,
        aiAnalysis,
        detectedModuleType,
        detectedShielding,
        detectedColor,
        detectedBrand,
        detectedProductLine,
        compatibleBrands,
        compatibleProductLines
      )
      searchStrategy = 'multi_criteria_search'
    }
    
    // STRATEGY 2.5: If searching for generic "jack" or "jack modules", use multi-criteria without specific filters
    if (products.length === 0 && (searchTerm.toLowerCase() === 'jack' || searchTerm.toLowerCase() === 'jack modules' || searchTerm.toLowerCase().includes('jack module'))) {
      console.log(`🚀 STRATEGY 2.5: Generic Jack Module Search`)
      products = await searchByMultiCriteria(
        searchTerm,
        aiAnalysis,
        null,  // No specific module type
        null,  // No specific shielding
        null,  // No specific color
        null,  // No specific brand
        null,  // No specific product line
        compatibleBrands,  // Still pass compatibility filters
        compatibleProductLines
      )
      searchStrategy = 'generic_jack_search'
    }

    // STRATEGY 3: Direct Category Rating Search
    if (products.length === 0 && detectedModuleType) {
      console.log(`🚀 STRATEGY 3: Category Rating Search`)
      products = await searchByCategoryRating(detectedModuleType, limit)
      searchStrategy = 'category_rating_search'
    }

    // STRATEGY 4: Fallback Search
    if (products.length === 0) {
      console.log(`🚀 STRATEGY 4: Fallback Search`)
      products = await searchByFallback(searchTerm, limit, aiAnalysis)
      searchStrategy = 'fallback_search'
      
      // Post-process to filter out Cat6A when searching for Cat6
      if (aiAnalysis?.detectedSpecs?.categoryRating === 'CAT6') {
        const beforeCount = products.length
        products = products.filter(p => {
          const category = p.categoryRating?.toLowerCase() || ''
          const desc = p.description?.toLowerCase() || ''
          return !category.includes('6a') && !desc.includes('cat6a') && !desc.includes('cat 6a')
        })
        if (beforeCount !== products.length) {
          console.log(`🎯 Filtered out ${beforeCount - products.length} Cat6A products from Cat6 search`)
        }
      }
    }

    const endTime = performance.now()

    console.log(`✅ SEARCH COMPLETE: Found ${products.length} products using ${searchStrategy}`)

    return {
      products: products.slice(0, limit),
      searchStrategy,
      totalFound: products.length,
      searchTime: Math.round(endTime - startTime)
    }

  } catch (error) {
    console.error('❌ Error in searchJackModules:', error)
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

const formatJackModuleResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} JACK MODULE RESULTS (${searchType})`)
  
  // Debug: Check first few items for product_line values
  if (data.length > 0) {
    console.log(`🔍 Sample jack module data:`)
    data.slice(0, 5).forEach((item, idx) => {
      console.log(`  Item ${idx + 1}: brand="${item.brand}", product_line="${item.product_line}", shielding="${item.shielding_type}", category="${item.category_rating}"`)
    })
    
    // Check diversity of results
    const uniqueBrands = new Set(data.map(item => item.brand).filter(Boolean))
    const uniqueProductLines = new Set(data.map(item => item.product_line).filter(Boolean))
    const uniqueShielding = new Set(data.map(item => item.shielding_type).filter(Boolean))
    
    console.log(`🔍 Result diversity:`)
    console.log(`  Unique brands: ${Array.from(uniqueBrands).join(', ')}`)
    console.log(`  Unique product lines: ${Array.from(uniqueProductLines).join(', ')}`)
    console.log(`  Unique shielding types: ${Array.from(uniqueShielding).join(', ')}`)
  }

  return data.map((item: JackModuleRow) => ({
    id: `jack-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: Math.random() * 3 + 1,
    stockLocal: Math.floor(Math.random() * 5),
    stockDistribution: 5,
    leadTime: 'Ships Today',
    category: 'Jack Module',

    // CRITICAL: Use correct column names
    categoryRating: item.category_rating?.trim() || undefined,
    productType: 'Jack Module',
    productLine: item.product_line?.trim() || undefined,
    color: item.color?.trim() || undefined,  // Using 'color' column now
    jacketColor: item.color?.trim() || undefined, // Add jacketColor for UI consistency
    shielding: item.shielding_type?.trim() || undefined,
    pairCount: item.pair_count?.trim() || undefined,

    commonTerms: item.common_terms?.trim() || undefined,
    compatibleFaceplates: item.compatible_faceplates?.trim() || undefined,
    installationToolsRequired: item.installation_tools_required?.trim() || undefined,
    possibleCross: undefined,
    goWithItems: undefined,
    upcNumber: item.upc_number?.toString() || undefined,

    searchRelevance: 1.0,
    tableName: 'jack_modules',
    stockStatus: 'in_stock' as const,
    stockColor: 'green' as const,
    stockMessage: 'In stock - Ships today'
  }))
}

export const generateJackModuleFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  // Get unique category ratings
  const categoryRatings = filterString(products.map(p => p.categoryRating))
  
  // Sort category ratings to ensure ethernet types come first
  const ethernetCategories = ['Category 6A', 'Category 6', 'Category 5e']
  const sortedCategoryRatings = [
    ...categoryRatings.filter(c => ethernetCategories.includes(c)),
    ...categoryRatings.filter(c => !ethernetCategories.includes(c))
  ]

  // Debug logging to check product lines
  const allProductLines = products.map(p => p.productLine).filter(Boolean)
  const uniqueProductLines = filterString(allProductLines)
  console.log(`🔍 Found ${uniqueProductLines.length} unique product lines:`, uniqueProductLines)

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    productLines: uniqueProductLines.slice(0, 1), // Increased to 1 to match searchService
    categoryRatings: sortedCategoryRatings.slice(0, 1), // Show more types now
    shieldingTypes: filterString(products.map(p => p.shielding)).slice(0, 2), // Usually just UTP/STP
    colors: filterString(products.map(p => p.color)).slice(0, 12), // Jack modules come in many colors
    productTypes: filterString(products.map(p => p.productType)).slice(0, 4)
  }
}