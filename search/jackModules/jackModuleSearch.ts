// src/search/jackModules/jackModuleSearch.ts
// Jack Module Search Implementation - Comprehensive Coverage
// Handles all variations of Category 6A/6/5e with UTP/STP shielding
// FIXED: Using flexible ILIKE queries like categoryCableSearch.ts

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

// ===================================================================
// TYPE DEFINITIONS - Jack Module Specific
// ===================================================================

export interface JackModuleSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface JackModuleSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// COMPREHENSIVE SEARCH TERMS - From your massive list!
// ===================================================================

const JACK_MODULE_SEARCH_TERMS = {
  // Category 6A UTP Variations
  cat6a_utp: [
    'Category 6A UTP Jack', 'Category 6A Jack', 'Category 6A UTP Connector',
    'Category 6A UTP Module', 'Category 6A UTP Port', 'Cat6A UTP Jack',
    'Cat 6A UTP Jack', 'CAT6A UTP Jack', 'cat6a utp jack', 'Cat6a UTP Jack',
    'Category Six A UTP Jack', 'Category 6A Augmented UTP Jack',
    'Category 6A Unshielded Jack', 'Cat6A Jack', 'Cat 6A Jack', 'CAT6A Jack',
    'cat6a jack', 'Cat6a Jack', 'CATEGORY 6A UTP JACK', 'category 6a utp jack',
    'CAT 6A UTP JACK', 'cat 6a utp jack', 'Cat6A UTP jack', 'CAT6a UTP JACK',
    'cat6A UTP Jack', 'CATEGORY 6A JACK', 'category 6a jack', 'CAT 6A JACK',
    'cat 6a jack', 'Cat6A jack', 'CAT6a JACK', 'cat6A Jack', 'Cat6A-UTP-Jack',
    'Cat-6A-UTP-Jack', 'Cat 6A-UTP-Connector', 'Cat6A UTP Module',
    'Cat 6A UTP Module', 'C6A UTP Jack', 'C 6A UTP Jack', 'Cat6A_UTP_Port',
    'Cat_6A_UTP_Jack', 'Cat6A-Connector', 'Cat-6A-Jack', 'Cat 6A-Connector',
    'Cat6A Module', 'Cat 6A Module', 'C6A Jack', 'C 6A Jack', 'Cat6A_Port',
    'Cat_6A_Jack', 'CJ688TGBU', 'CJ688TG-BU', 'CJ688', '10 Gigabit Cat6A UTP jack',
    'High-speed Cat6A UTP jack', 'Category 6A UTP keystone jack',
    'Cat 6A UTP keystone connector', 'Category 6A UTP network jack',
    'Cat6A UTP Ethernet jack', 'Cat 6A UTP data jack', 'Category 6A UTP wiring jack',
    'Cat6A UTP RJ45 jack', 'keystone jack cat6a', 'keystone cat6a'
  ],

  // Category 6 UTP Variations
  cat6_utp: [
    'Category 6 UTP Jack', 'Category 6 Jack', 'Category 6 UTP Connector',
    'Category 6 UTP Module', 'Category 6 UTP Port', 'Cat6 UTP Jack',
    'Cat 6 UTP Jack', 'CAT6 UTP Jack', 'cat6 utp jack', 'Cat6 UTP Jack',
    'Category Six UTP Jack', 'Category 6 Unshielded Jack', 'Cat6 Jack',
    'Cat 6 Jack', 'CAT6 Jack', 'cat6 jack', 'Cat6 Jack', 'CATEGORY 6 UTP JACK',
    'category 6 utp jack', 'CAT 6 UTP JACK', 'cat 6 utp jack', 'Cat6 UTP JACK',
    'CAT6 UTP jack', 'cat6 UTP Jack', 'CATEGORY 6 JACK', 'category 6 jack',
    'CAT 6 JACK', 'cat 6 jack', 'Cat6 JACK', 'CAT6 jack', 'cat6 Jack',
    'Cat6-UTP-Jack', 'Cat-6-UTP-Jack', 'Cat 6-UTP-Connector', 'Cat6 UTP Module',
    'Cat 6 UTP Module', 'C6 UTP Jack', 'C 6 UTP Jack', 'Cat6_UTP_Port',
    'Cat_6_UTP_Jack', 'Cat6-Connector', 'Cat-6-Jack', 'Cat 6-Connector',
    'Cat6 Module', 'Cat 6 Module', 'C6 Jack', 'C 6 Jack', 'Cat6_Port',
    'Cat_6_Jack', 'CJ688TG', 'Gigabit Cat6 UTP jack', 'Category 6 UTP network jack',
    'Cat6 UTP Ethernet jack', 'Cat 6 UTP data jack', 'Category 6 UTP wiring jack',
    'Cat6 UTP RJ45 jack', 'Category 6 UTP keystone jack', 'Cat 6 UTP keystone connector',
    'keystone jack cat6', 'keystone cat6'
  ],

  // Category 5e UTP Variations
  cat5e_utp: [
    'Category 5e UTP Jack', 'Category 5e Jack', 'Category 5e UTP Connector',
    'Category 5e UTP Module', 'Category 5e UTP Port', 'Cat5e UTP Jack',
    'Cat 5e UTP Jack', 'CAT5e UTP Jack', 'cat5e utp jack', 'Cat5e UTP Jack',
    'Category Five Enhanced UTP Jack', 'Category 5e Unshielded Jack',
    'Cat5e Jack', 'Cat 5e Jack', 'CAT5e Jack', 'cat5e jack', 'Cat5e Jack',
    'CATEGORY 5E UTP JACK', 'category 5e utp jack', 'CAT 5E UTP JACK',
    'cat 5e utp jack', 'Cat5E UTP JACK', 'CAT5e UTP jack', 'cat5E UTP Jack',
    'CATEGORY 5E JACK', 'category 5e jack', 'CAT 5E JACK', 'cat 5e jack',
    'Cat5E JACK', 'CAT5e jack', 'cat5E Jack', 'Cat5e-UTP-Jack', 'Cat-5e-UTP-Jack',
    'Cat 5e-UTP-Connector', 'Cat5e UTP Module', 'Cat 5e UTP Module',
    'C5e UTP Jack', 'C 5e UTP Jack', 'Cat5e_UTP_Port', 'Cat_5e_UTP_Jack',
    'Cat5e-Connector', 'Cat-5e-Jack', 'Cat 5e-Connector', 'Cat5e Module',
    'Cat 5e Module', 'C5e Jack', 'C 5e Jack', 'Cat5e_Port', 'Cat_5e_Jack',
    'Cat5E UTP Jack', 'Category 5-e UTP Jack', 'Cat5E Jack', 'Category 5-e Jack',
    'CJ5e88TG', 'Enhanced Cat5e UTP jack', 'Category 5e UTP network jack',
    'Cat5e UTP Ethernet jack', 'Cat 5e UTP data jack', 'Category 5e UTP wiring jack',
    'Cat5e UTP RJ45 jack', 'Category 5e UTP keystone jack',
    'Cat 5e UTP keystone connector', 'keystone jack cat5e', 'keystone cat5e'
  ],

  // Category 6A STP/Shielded Variations
  cat6a_stp: [
    'Category 6A Shielded Jack', 'Category 6A STP Jack', 'Category 6A Shielded Connector',
    'Category 6A Shielded Module', 'Category 6A Shielded Port', 'Cat6A Shielded Jack',
    'Cat 6A Shielded Jack', 'CAT6A Shielded Jack', 'cat6a shielded jack',
    'Cat6a Shielded Jack', 'Category Six A Shielded Jack',
    'Category 6A Augmented Shielded Jack', 'CATEGORY 6A SHIELDED JACK',
    'category 6a shielded jack', 'CAT 6A SHIELDED JACK', 'cat 6a shielded jack',
    'Cat6A SHIELDED jack', 'CAT6a SHIELDED JACK', 'cat6A Shielded Jack',
    'Cat6A-STP-Jack', 'Cat-6A-Shielded-Jack', 'Cat 6A-Shielded-Connector',
    'Cat6A Shielded Module', 'Cat 6A Shielded Module', 'C6A Shielded Jack',
    'C 6A Shielded Jack', 'Cat6A_Shielded_Port', 'Cat_6A_Shielded_Jack',
    'Cat6A STP Connector', 'CJ6X88TGBU', 'CJ6X88TG-BU', 'CJ6X88',
    '10 Gigabit Cat6A shielded jack', 'High-speed Cat6A STP jack',
    'Category 6A shielded network jack', 'Cat6A STP Ethernet jack',
    'Cat 6A shielded data jack', 'Category 6A shielded wiring jack',
    'Cat6A shielded RJ45 jack', 'Category 6A shielded keystone jack',
    'Cat 6A STP keystone connector'
  ],

  // Category 6 STP/Shielded Variations
  cat6_stp: [
    'Category 6 Shielded Jack', 'Category 6 STP Jack', 'Category 6 Shielded Connector',
    'Category 6 Shielded Module', 'Category 6 Shielded Port', 'Cat6 Shielded Jack',
    'Cat 6 Shielded Jack', 'CAT6 Shielded Jack', 'cat6 shielded jack',
    'Cat6 Shielded Jack', 'Category Six Shielded Jack', 'CATEGORY 6 SHIELDED JACK',
    'category 6 shielded jack', 'CAT 6 SHIELDED JACK', 'cat 6 shielded jack',
    'Cat6 SHIELDED JACK', 'CAT6 Shielded jack', 'cat6 Shielded Jack',
    'Cat6-STP-Jack', 'Cat-6-Shielded-Jack', 'Cat 6-Shielded-Connector',
    'Cat6 Shielded Module', 'Cat 6 Shielded Module', 'C6 Shielded Jack',
    'C 6 Shielded Jack', 'Cat6_Shielded_Port', 'Cat_6_Shielded_Jack',
    'Cat6 STP Connector', 'Gigabit Cat6 shielded jack',
    'Category 6 shielded network jack', 'Cat6 STP Ethernet jack',
    'Cat 6 shielded data jack', 'Category 6 shielded wiring jack',
    'Cat6 shielded RJ45 jack', 'Category 6 shielded keystone jack',
    'Cat 6 STP keystone connector'
  ],

  // Category 5e STP/Shielded Variations
  cat5e_stp: [
    'Category 5e Shielded Jack', 'Category 5e STP Jack', 'Category 5e Shielded Connector',
    'Category 5e Shielded Module', 'Category 5e Shielded Port', 'Cat5e Shielded Jack',
    'Cat 5e Shielded Jack', 'CAT5e Shielded Jack', 'cat5e shielded jack',
    'Cat5e Shielded Jack', 'Category Five Enhanced Shielded Jack',
    'CATEGORY 5E SHIELDED JACK', 'category 5e shielded jack', 'CAT 5E SHIELDED JACK',
    'cat 5e shielded jack', 'Cat5E SHIELDED JACK', 'CAT5e Shielded jack',
    'cat5E Shielded Jack', 'Cat5e-STP-Jack', 'Cat-5e-Shielded-Jack',
    'Cat 5e-Shielded-Connector', 'Cat5e Shielded Module', 'Cat 5e Shielded Module',
    'C5e Shielded Jack', 'C 5e Shielded Jack', 'Cat5e_Shielded_Port',
    'Cat_5e_Shielded_Jack', 'Cat5e STP Connector', 'Cat5E Sheilded Jack',
    'Category 5-e Shielded Jack', 'Enhanced Cat5e shielded jack',
    'Category 5e shielded network jack', 'Cat5e STP Ethernet jack',
    'Cat 5e shielded data jack', 'Category 5e shielded wiring jack',
    'Cat5e shielded RJ45 jack', 'Category 5e shielded keystone jack',
    'Cat 5e STP keystone connector'
  ]
}

// Common jack module terms
const JACK_MODULE_TERMS = [
  'jack', 'jacks', 'jack module', 'jack modules', 'connector', 'connectors',
  'module', 'modules', 'port', 'ports', 'keystone', 'keystone jack',
  'rj45', 'rj45 jack', 'ethernet jack', 'network jack', 'data jack',
  'wiring jack', 'keystone connector'
]

// ===================================================================
// DETECTION FUNCTIONS - Jack Module Specific
// ===================================================================

/**
 * Enhanced category detection for jack modules
 */
const detectJackCategory = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase()

  // Check comprehensive terms first
  for (const [category, terms] of Object.entries(JACK_MODULE_SEARCH_TERMS)) {
    for (const term of terms) {
      if (query.includes(term.toLowerCase())) {
        // Extract base category (remove _utp/_stp suffix)
        const baseCategory = category.split('_')[0].toUpperCase()
        console.log(`📊 DETECTED JACK CATEGORY: ${baseCategory} from term: "${term}"`)
        return baseCategory
      }
    }
  }

  // Fallback to generic detection
  return detectCategoryRating(searchTerm)
}

/**
 * Enhanced shielding detection for jack modules - FIXED to be less aggressive
 */
const detectJackShielding = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase()

  // Check for STP/Shielded terms
  const stpTerms = ['stp', 'shielded', 'shield', 's.t.p.']
  for (const term of stpTerms) {
    if (query.includes(term)) {
      console.log(`🛡️ DETECTED SHIELDING: STP from term: "${term}"`)
      return 'STP'
    }
  }

  // Check for UTP/Unshielded terms (including when no shielding specified)
  const utpTerms = ['utp', 'unshielded', 'u.t.p.']
  for (const term of utpTerms) {
    if (query.includes(term)) {
      console.log(`🛡️ DETECTED SHIELDING: UTP from term: "${term}"`)
      return 'UTP'
    }
  }

  // FIXED: Don't default to UTP - return null if no shielding specified
  console.log(`🛡️ No shielding specified - not applying filter`)
  return null
}

/**
 * Detect product line (e.g., mini-com)
 */
const detectProductLine = (searchTerm: string): string | null => {
  const productLines = [
    { search: ['mini-com', 'minicom', 'mini com'], actual: 'Mini-Com' }
  ]

  const query = searchTerm.toLowerCase()

  for (const line of productLines) {
    for (const searchTerm of line.search) {
      if (query.includes(searchTerm)) {
        console.log(`📋 DETECTED PRODUCT LINE: ${line.actual}`)
        return line.actual
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
    .from('jack_modules')
    .select('*')
    .eq('is_active', true)
    .limit(limit)

  // Build search conditions for part number
  const searchConditions = [
    `part_number.ilike.${searchTerm}%`,      // Starts with original
    `part_number.ilike.${normalized}%`,      // Starts with normalized
    `part_number.ilike.%${searchTerm}%`,    // Contains original
    `part_number.ilike.%${normalized}%`     // Contains normalized
  ]

  query = query.or(searchConditions.join(','))

  const result = await query
  const products = result.data ? formatJackModuleResults(result.data, 'part_number_search') : []

  console.log(`🔢 Part number search found: ${products.length} products`)
  return products
}

/**
 * STRATEGY 2: Multi-Criteria Search with FLEXIBLE MATCHING - FIXED like categoryCableSearch
 */
const searchByMultiCriteria = async (
  searchTerm: string,
  aiAnalysis?: AISearchAnalysis | null,
  detectedCategory?: string | null,
  detectedShielding?: string | null,
  detectedColor?: string | null,
  detectedBrand?: string | null,
  detectedProductLine?: string | null
): Promise<Product[]> => {
  console.log(`🎯 STRATEGY 2: Multi-Criteria Search`)
  console.log({
    category: detectedCategory,
    shielding: detectedShielding,
    color: detectedColor,
    brand: detectedBrand,
    productLine: detectedProductLine
  })

  // First, let's check if the table has ANY active records
  const testQuery = await supabase
    .from('jack_modules')
    .select('*')
    .eq('is_active', true)
    .limit(5)

  console.log(`🔍 TEST QUERY: Found ${testQuery.data?.length || 0} active jack modules in database`)
  if (testQuery.data && testQuery.data.length > 0) {
    console.log(`🔍 Sample record:`, testQuery.data[0])
  }

  let query = supabase
    .from('jack_modules')
    .select('*')
    .eq('is_active', true)
    .limit(200)

  // Apply exact match filters first (but not for category!)
  if (detectedBrand) {
    query = query.ilike('brand', `%${detectedBrand}%`)
  }

  if (detectedProductLine) {
    query = query.ilike('product_line', `%${detectedProductLine}%`)
  }

  // Only apply shielding filter if explicitly detected
  if (detectedShielding) {
    console.log(`🛡️ Applying shielding filter: ${detectedShielding}`)
    query = query.eq('shielding_type', detectedShielding.toUpperCase())
  } else {
    console.log(`🛡️ No shielding filter applied - showing all shielding types`)
  }

  // Build OR conditions for flexible searching
  const searchConditions: string[] = []

  // FIXED: Use flexible category search like categoryCableSearch.ts
  if (detectedCategory === 'CAT6') {
    searchConditions.push('category_rating.ilike.%Category 6%')
    searchConditions.push('short_description.ilike.%cat6%')
    searchConditions.push('short_description.ilike.%cat 6%')
    searchConditions.push('short_description.ilike.%category 6%')
    searchConditions.push('common_terms.ilike.%cat6%')
    searchConditions.push('common_terms.ilike.%cat 6%')
    console.log('🎯 Using comprehensive CAT6 search terms')
  } else if (detectedCategory === 'CAT6A') {
    searchConditions.push('category_rating.ilike.%Category 6A%')
    searchConditions.push('short_description.ilike.%cat6a%')
    searchConditions.push('short_description.ilike.%cat 6a%')
    searchConditions.push('short_description.ilike.%category 6a%')
    searchConditions.push('common_terms.ilike.%cat6a%')
    searchConditions.push('common_terms.ilike.%cat 6a%')
    console.log('🎯 Using comprehensive CAT6A search terms')
  } else if (detectedCategory === 'CAT5E') {
    searchConditions.push('category_rating.ilike.%Category 5e%')
    searchConditions.push('short_description.ilike.%cat5e%')
    searchConditions.push('short_description.ilike.%cat 5e%')
    searchConditions.push('short_description.ilike.%category 5e%')
    searchConditions.push('common_terms.ilike.%cat5e%')
    searchConditions.push('common_terms.ilike.%cat 5e%')
    console.log('🎯 Using comprehensive CAT5E search terms')
  } else {
    // General jack module search
    searchConditions.push(`short_description.ilike.%jack%`)
    searchConditions.push(`short_description.ilike.%module%`)
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
  }

  // Color search - case insensitive
  if (detectedColor) {
    searchConditions.push(`jacket_color.ilike.%${detectedColor}%`)
    searchConditions.push(`short_description.ilike.%${detectedColor}%`)
  }

  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','))
  }

  const result = await query
  console.log(`🎯 Multi-criteria search query result:`, result.error || `${result.data?.length} items`)

  const products = result.data ? formatJackModuleResults(result.data, 'multi_criteria_search') : []

  console.log(`🎯 Multi-criteria search found: ${products.length} products`)
  return products
}

/**
 * STRATEGY 3: Fallback Broad Search - FIXED to search for individual words
 */
const searchByFallback = async (
  searchTerm: string,
  limit: number
): Promise<Product[]> => {
  console.log(`🔍 STRATEGY 3: Fallback Search: "${searchTerm}"`)

  // First, let's check what's in the table
  const checkQuery = await supabase
    .from('jack_modules')
    .select('*')
    .limit(10)

  console.log(`🔍 FALLBACK CHECK: Total jack modules in table: ${checkQuery.data?.length || 0}`)
  if (checkQuery.data && checkQuery.data.length > 0) {
    console.log(`🔍 Sample jack module columns:`, Object.keys(checkQuery.data[0]))
    console.log(`🔍 Sample category_rating values:`, checkQuery.data.map((item: any) => item.category_rating).filter(Boolean).slice(0, 3))
  }

  let query = supabase
    .from('jack_modules')
    .select('*')
    .eq('is_active', true)
    .limit(limit)

  const searchConditions: string[] = []

  // Extract meaningful words (skip common words)
  const skipWords = ['i', 'need', 'want', 'looking', 'for', 'the', 'a', 'an']
  const words = searchTerm.split(' ').filter(w =>
    w.length > 1 && !skipWords.includes(w.toLowerCase())
  )

  console.log(`🔍 Searching for words:`, words)

  // Search for jack-related terms broadly
  searchConditions.push(`short_description.ilike.%jack%`)
  searchConditions.push(`common_terms.ilike.%jack%`)
  searchConditions.push(`product_type.ilike.%jack%`)

  // Also search for each meaningful word
  words.forEach(word => {
    searchConditions.push(`short_description.ilike.%${word}%`)
    searchConditions.push(`common_terms.ilike.%${word}%`)
    searchConditions.push(`part_number.ilike.%${word}%`)
  })

  // Search for category patterns
  if (searchTerm.toLowerCase().includes('cat6') || searchTerm.toLowerCase().includes('cat 6')) {
    searchConditions.push(`category_rating.ilike.%6%`)
  }
  if (searchTerm.toLowerCase().includes('cat5e') || searchTerm.toLowerCase().includes('cat 5e')) {
    searchConditions.push(`category_rating.ilike.%5e%`)
  }
  if (searchTerm.toLowerCase().includes('cat6a') || searchTerm.toLowerCase().includes('cat 6a')) {
    searchConditions.push(`category_rating.ilike.%6a%`)
  }

  // Add brand search
  searchConditions.push(`brand.ilike.%${searchTerm}%`)
  searchConditions.push(`product_line.ilike.%${searchTerm}%`)

  query = query.or(searchConditions.join(','))

  const result = await query
  console.log(`🔍 Fallback search query result:`, result.error || `${result.data?.length} items`)

  const products = result.data ? formatJackModuleResults(result.data, 'fallback_search') : []

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
  const { searchTerm, aiAnalysis, limit = 100 } = options

  console.log('🔌 JACK MODULE SEARCH')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    // Use industry knowledge detection functions
    const detectedCategory = detectCategoryRating(searchTerm) ||
                           aiAnalysis?.detectedSpecs?.categoryRating

    const detectedShielding = detectJackShielding(searchTerm) ||
                            aiAnalysis?.detectedSpecs?.shielding

    const detectedColor = detectColor(searchTerm) ||
                         aiAnalysis?.detectedSpecs?.color

    const detectedBrand = detectBrand(searchTerm) ||
                         aiAnalysis?.detectedSpecs?.manufacturer

    const detectedProductLine = detectProductLine(searchTerm)

    console.log('🎯 DETECTION RESULTS:', {
      category: detectedCategory,    // This will be "CAT6", "CAT6A", or "CAT5E"
      shielding: detectedShielding,  // This will be "UTP", "STP", or null
      color: detectedColor,          // This will be "Blue", "Red", etc.
      brand: detectedBrand,          // This will be "PANDUIT"
      productLine: detectedProductLine
    })

    let products: Product[] = []
    let searchStrategy = 'unknown'

    // Check if it looks like a part number search
    const isPartNumber = /^[A-Z0-9]{3,}/.test(searchTerm.toUpperCase()) ||
                        searchTerm.split(/[\s-]/).some(part => /^[A-Z0-9]{4,}$/.test(part))

    // STRATEGY 1: Part Number Search
    if (isPartNumber || (!detectedCategory && !detectedShielding && searchTerm.length < 20)) {
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

    // STRATEGY 2: Multi-Criteria Search - Always try this for category searches
    if (detectedCategory || detectedBrand || detectedProductLine || detectedColor) {
      console.log(`🚀 STRATEGY 2: Multi-Criteria Search`)
      products = await searchByMultiCriteria(
        searchTerm,
        aiAnalysis,
        detectedCategory,
        detectedShielding,  // This might be null now
        detectedColor,
        detectedBrand,
        detectedProductLine
      )
      searchStrategy = 'multi_criteria_search'
    }

    // STRATEGY 3: Fallback Search
    if (products.length === 0) {
      console.log(`🚀 STRATEGY 3: Fallback Search`)
      products = await searchByFallback(searchTerm, limit)
      searchStrategy = 'fallback_search'
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

  return data.map((item: any) => ({
    id: `jack-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: Math.random() * 30 + 10,
    stockLocal: Math.floor(Math.random() * 50),
    stockDistribution: 500,
    leadTime: 'Ships Today',
    category: 'Jack Module',

    // CRITICAL: Use correct column names (lowercase)
    categoryRating: item.category_rating?.trim() || undefined,
    productType: item.product_type?.trim() || 'Jack Module',
    productLine: item.product_line?.trim() || undefined,
    color: item.jacket_color?.trim() || undefined,  // jacket_color not Jacket_Color
    shielding: item.shielding_type?.trim() || undefined,  // shielding_type not Shielding_Type
    pairCount: item.pair_count?.trim() || undefined,

    commonTerms: item.common_terms?.trim() || undefined,
    compatibleFaceplates: item.compatible_faceplates?.trim() || undefined,
    installationToolsRequired: item.installation_tools_required?.trim() || undefined,
    possibleCross: item.possible_cross?.trim() || undefined,
    goWithItems: item.go_with_items?.trim() || undefined,
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

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    productLines: filterString(products.map(p => p.productLine)).slice(0, 6),
    categoryRatings: filterString(products.map(p => p.categoryRating)).slice(0, 4),
    shieldingTypes: filterString(products.map(p => p.shielding)).slice(0, 2), // Usually just UTP/STP
    colors: filterString(products.map(p => p.color)).slice(0, 12), // Jack modules come in many colors
    productTypes: filterString(products.map(p => p.productType)).slice(0, 4)
  }
}