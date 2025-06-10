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
// DYNAMIC SEARCH TERMS - Now handles all jack module types!
// ===================================================================

// Category-based search terms (Ethernet types)
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  'Category 6A': [
    'Category 6A', 'Cat6A', 'Cat 6A', 'CAT6A', 'cat6a', 'Cat6a',
    'Category Six A', 'Category 6A Augmented', 'CATEGORY 6A',
    '10 Gigabit', '10Gig', '10G', 'CJ688TGBU', 'CJ688TG-BU', 'CJ688'
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
    'hdmi jack', 'hdmi module', 'hdmi 2.0', 'hdmi type a',
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
  detectedProductLine?: string | null
): Promise<Product[]> => {
  console.log(`🎯 STRATEGY 2: Multi-Criteria Search`)
  console.log({
    moduleType: detectedModuleType,
    shielding: detectedShielding,
    color: detectedColor,
    brand: detectedBrand,
    productLine: detectedProductLine
  })

  let query = supabase
    .from('jack_modules')
    .select('*')
    .eq('is_active', true)
    .limit(1000) // Get more products for better variety

  // Apply exact match filters
  if (detectedBrand) {
    query = query.ilike('brand', `%${detectedBrand}%`)
  }

  if (detectedProductLine) {
    query = query.ilike('product_line', `%${detectedProductLine}%`)
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
      searchConditions.push(`category_rating.ilike.%${detectedModuleType}%`)
      
      // Also search in descriptions for the category
      const shortCategory = detectedModuleType.replace('Category ', 'Cat')
      searchConditions.push(`short_description.ilike.%${shortCategory}%`)
      searchConditions.push(`short_description.ilike.%${detectedModuleType}%`)
      searchConditions.push(`common_terms.ilike.%${shortCategory}%`)
    } else {
      // For special modules (Blank, F-Type Coax, HDMI Coup)
      searchConditions.push(`category_rating.ilike.%${detectedModuleType}%`)
      searchConditions.push(`short_description.ilike.%${detectedModuleType}%`)
      
      // Add specific terms for each type
      const specialTerms = SPECIAL_MODULE_TYPES[detectedModuleType] || []
      specialTerms.forEach(term => {
        searchConditions.push(`short_description.ilike.%${term}%`)
        searchConditions.push(`common_terms.ilike.%${term}%`)
      })
    }
    console.log(`🎯 Using ${detectedModuleType} search terms`)
  } else {
    // General jack module search
    searchConditions.push(`product_type.ilike.%jack%`)
    searchConditions.push(`short_description.ilike.%jack%`)
    searchConditions.push(`short_description.ilike.%module%`)
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
  }

  // Color search - using 'color' field now, not 'jacket_color'
  if (detectedColor) {
    searchConditions.push(`color.ilike.%${detectedColor}%`)
    searchConditions.push(`short_description.ilike.%${detectedColor}%`)
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
      if (diverseProducts.length < 200) {
        // Add products with different shielding types if available
        const utpItem = items.find(i => i.shielding_type === 'UTP')
        const stpItem = items.find(i => i.shielding_type === 'STP')
        
        if (utpItem) diverseProducts.push(utpItem)
        if (stpItem && diverseProducts.length < 200) diverseProducts.push(stpItem)
        
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
    .from('jack_modules')
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
  limit: number
): Promise<Product[]> => {
  console.log(`🔍 STRATEGY 4: Fallback Search: "${searchTerm}"`)

  // First, get a diverse sample by fetching products from different brands/product lines
  const diverseQuery = supabase
    .from('jack_modules')
    .select('*')
    .eq('is_active', true)
    .order('brand', { ascending: true })
    .order('product_line', { ascending: true })
    .order('category_rating', { ascending: true })
    .limit(1000) // Get many products for maximum diversity

  const searchConditions: string[] = []

  // Extract meaningful words (skip common words)
  const skipWords = ['i', 'need', 'want', 'looking', 'for', 'the', 'a', 'an']
  const words = searchTerm.split(' ').filter(w =>
    w.length > 1 && !skipWords.includes(w.toLowerCase())
  )

  console.log(`🔍 Searching for words:`, words)

  // Search for jack-related terms broadly
  searchConditions.push(`product_type.ilike.%jack%`)
  searchConditions.push(`short_description.ilike.%jack%`)
  searchConditions.push(`common_terms.ilike.%jack%`)

  // Also search for each meaningful word
  words.forEach(word => {
    searchConditions.push(`short_description.ilike.%${word}%`)
    searchConditions.push(`common_terms.ilike.%${word}%`)
    searchConditions.push(`part_number.ilike.%${word}%`)
    searchConditions.push(`category_rating.ilike.%${word}%`)
  })

  // Add brand search
  searchConditions.push(`brand.ilike.%${searchTerm}%`)
  searchConditions.push(`product_line.ilike.%${searchTerm}%`)

  const query = diverseQuery.or(searchConditions.join(','))

  const { data: resultData, error: resultError } = await query as { data: any[] | null, error: any }
  console.log(`🔍 Fallback search query result:`, resultError || `${resultData?.length} items`)

  if (!resultError && resultData && resultData.length > 0) {
    // Get unique combinations of brand + product_line to ensure diversity
    const seenCombos = new Set<string>()
    const diverseProducts: any[] = []
    
    // First pass: get one product from each unique brand/product_line combo
    for (const item of resultData) {
      const combo = `${item.brand || 'Unknown'}_${item.product_line || 'None'}`
      if (!seenCombos.has(combo) && diverseProducts.length < limit) {
        seenCombos.add(combo)
        diverseProducts.push(item)
      }
    }
    
    // Second pass: fill remaining slots with other products
    for (const item of resultData) {
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
  const { searchTerm, aiAnalysis, limit = 100 } = options

  console.log('🔌 JACK MODULE SEARCH')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

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

    let products: Product[] = []
    let searchStrategy = 'unknown'

    // Check if it looks like a part number search
    const isPartNumber = /^[A-Z0-9]{3,}/.test(searchTerm.toUpperCase()) ||
                        searchTerm.split(/[\s-]/).some(part => /^[A-Z0-9]{4,}$/.test(part))

    // STRATEGY 1: Part Number Search
    if (isPartNumber || (!detectedModuleType && !detectedShielding && searchTerm.length < 20)) {
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
    if (detectedModuleType || detectedBrand || detectedProductLine || detectedColor) {
      console.log(`🚀 STRATEGY 2: Multi-Criteria Search`)
      products = await searchByMultiCriteria(
        searchTerm,
        aiAnalysis,
        detectedModuleType,
        detectedShielding,
        detectedColor,
        detectedBrand,
        detectedProductLine
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
        null   // No specific product line
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

    // CRITICAL: Use correct column names
    categoryRating: item.category_rating?.trim() || undefined,
    productType: item.product_type?.trim() || 'Jack Module',
    productLine: item.product_line?.trim() || undefined,
    color: item.color?.trim() || undefined,  // Using 'color' column now
    jacketColor: item.color?.trim() || undefined, // Add jacketColor for UI consistency
    shielding: item.shielding_type?.trim() || undefined,
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
    productLines: uniqueProductLines.slice(0, 10), // Increased to 10 to match searchService
    categoryRatings: sortedCategoryRatings.slice(0, 10), // Show more types now
    shieldingTypes: filterString(products.map(p => p.shielding)).slice(0, 2), // Usually just UTP/STP
    colors: filterString(products.map(p => p.color)).slice(0, 12), // Jack modules come in many colors
    productTypes: filterString(products.map(p => p.productType)).slice(0, 4)
  }
}