// src/search/categoryCables/categoryCableSearch.ts
// UPDATED VERSION - Using new jacket_code column for fast, accurate filtering

import { supabase } from '@/lib/supabase'
import {
  detectJacketType,
  detectCategoryRating,
  detectQuantity,
  detectShielding,
  detectColor,
  detectProductLine,
  DATABASE_JACKET_FORMATS
} from '../shared/industryKnowledge'

// Import Product and AISearchAnalysis types
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'

// ===================================================================
// TYPE DEFINITIONS - Category Cable Specific
// ===================================================================

export interface CategoryCableSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface CategoryCableSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// COMPREHENSIVE SEARCH TERMS (keeping existing)
// ===================================================================

const CATEGORY_SEARCH_TERMS = {
  // Category 5e Variations
  cat5e: [
    'Cat5e', 'cat5e', 'CAT5e', 'CAT5E', 'Cat 5e', 'cat 5e', 'CAT 5e', 'CAT 5E',
    'Category 5e', 'category 5e', 'CATEGORY 5e', 'CATEGORY 5E',
    'Category 5 enhanced', 'category 5 enhanced',
    'Cat5E', 'cat5E', 'enhanced cat5', 'enhanced Cat5', 'enhanced CAT5',
    'enhanced category 5'
  ],

  // Category 6 Variations
  cat6: [
    'Cat6', 'cat6', 'CAT6', 'Cat 6', 'cat 6', 'CAT 6',
    'Category 6', 'category 6', 'CATEGORY 6',
    'Category six', 'category six', 'cat six', 'Cat six', 'CAT six',
    'category six unshielded',
    'gigabit cable', 'gigabit ethernet', '1000BaseT', '1000Base-T', '1000 BaseT'
  ],

  // Category 6a Variations
  cat6a: [
    'Cat6a', 'cat6a', 'CAT6a', 'CAT6A', 'Cat 6a', 'cat 6a', 'CAT 6a', 'CAT 6A',
    'Cat6A', 'cat6A', 'Category 6a', 'category 6a', 'CATEGORY 6a', 'CATEGORY 6A',
    'Category 6 augmented', 'category 6 augmented', 'augmented category 6',
    'augmented cat6', 'augmented Cat6',
    'TIA-568-B.2-10', '10-gig cable', '10 gig cable', '10-gigabit', '10 gigabit',
    '10GBaseT', '10GBase-T', '10G BaseT'
  ]
}

// ===================================================================
// JACKET CODE MAPPING - NEW!
// ===================================================================

// Map our detection terms to the actual jacket codes in the database
const JACKET_CODE_MAPPING: Record<string, string> = {
  'PLENUM': 'CMP',
  'RISER': 'CMR',
  'OUTDOOR': 'OSP',
  'LSZH': 'LSZH'
}

// ===================================================================
// HELPER FUNCTIONS - AI ANALYSIS INTEGRATION
// ===================================================================

/**
 * Detect category from comprehensive search terms
 */
const detectCategoryFromTerms = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase()

  // Check each category's terms
  for (const [category, terms] of Object.entries(CATEGORY_SEARCH_TERMS)) {
    for (const term of terms) {
      if (query.includes(term.toLowerCase())) {
        console.log(`📊 DETECTED CATEGORY: ${category.toUpperCase()} from term: "${term}"`)
        return category.toUpperCase()
      }
    }
  }

  return null
}

/**
 * Convert AI jacket rating to database jacket code
 */
const normalizeJacketRating = (aiJacketRating?: string, textDetected?: string | null): string | undefined => {
  let detectedType: string | undefined

  // Prioritize AI analysis
  if (aiJacketRating) {
    const rating = aiJacketRating.toUpperCase()

    if (rating === 'CMP' || rating === 'PLENUM') {
      detectedType = 'PLENUM'
    } else if (rating === 'CMR' || rating === 'RISER' || rating === 'NON_PLENUM' || rating === 'NON-PLENUM' || rating === 'NONPLENUM'|| rating === 'PVC') {
      detectedType = 'RISER'
    } else if (rating === 'OSP' || rating === 'OUTDOOR') {
      detectedType = 'OUTDOOR'
    }
  }

  // Fall back to text detection if no AI result
  if (!detectedType && textDetected) {
    detectedType = textDetected
  }

  // Convert to actual database code
  if (detectedType && JACKET_CODE_MAPPING[detectedType]) {
    return JACKET_CODE_MAPPING[detectedType]
  }

  return undefined
}

/**
 * Convert AI category rating to search format
 */
const normalizeCategoryRating = (aiCategoryRating?: string, textDetected?: string | null): string | undefined => {
  // Prioritize AI analysis
  if (aiCategoryRating) {
    const normalized = aiCategoryRating.toUpperCase()
    if (normalized === 'CAT6' || normalized === 'CATEGORY6') return 'CAT6'
    if (normalized === 'CAT6A' || normalized === 'CATEGORY6A') return 'CAT6A'
    if (normalized === 'CAT5E' || normalized === 'CATEGORY5E') return 'CAT5E'
    if (normalized === 'CAT5' || normalized === 'CATEGORY5') return 'CAT5E'
    return normalized
  }

  // Fall back to comprehensive term detection
  const termsDetected = detectCategoryFromTerms(textDetected || '')
  if (termsDetected) return termsDetected

  // Finally fall back to original text detection
  return textDetected || undefined
}

/**
 * Convert AI color to search format
 */
const normalizeColor = (aiColor?: string, textDetected?: string | null): string | undefined => {
  // Prioritize AI analysis and normalize case
  const color = aiColor || textDetected
  if (color) {
    return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()
  }
  return undefined
}

// ===================================================================
// SEARCH STRATEGIES - SIMPLIFIED WITH jacket_code
// ===================================================================

/**
 * STRATEGY 1: Product Line Search - Now with jacket_code filtering
 */
const searchByProductLine = async (
  productLine: string,
  detectedColor?: string | undefined,
  detectedJacketCode?: string | undefined,
  detectedShielding?: string | null
): Promise<Product[]> => {
  console.log(`📋 STRATEGY 1: Searching by product line: "${productLine}"`)

  let query = supabase
    .from('category_cables')
    .select('*')
    .eq('is_active', true)
    .eq('product_line', productLine)
    .limit(100)

  if (detectedColor) {
    query = query.eq('jacket_color', detectedColor)
    console.log(`🎨 Adding color filter: ${detectedColor}`)
  }

  // NEW: Direct jacket_code filtering
  if (detectedJacketCode) {
    query = query.eq('jacket_code', detectedJacketCode)
    console.log(`🧥 Adding jacket_code filter: ${detectedJacketCode}`)
  }

  // Apply shielding filter at database level
  if (detectedShielding) {
    query = query.eq('Shielding_Type', detectedShielding)
    console.log(`🛡️ Adding shielding filter: ${detectedShielding}`)
  }

  const result = await query
  const products = result.data ? formatCableResults(result.data, 'product_line_match') : []

  console.log(`📋 Product line search found: ${products.length} products`)
  return products
}

/**
 * STRATEGY 2: Multi-Criteria Targeted Search - SIMPLIFIED
 */
const searchByMultiCriteria = async (
  searchTerm: string,
  aiAnalysis?: AISearchAnalysis | null,
  detectedProductLine?: string | null,
  detectedColor?: string | undefined,
  detectedJacketCode?: string | undefined,
  detectedCategory?: string | undefined,
  detectedShielding?: string | null
): Promise<Product[]> => {
  console.log(`🎯 STRATEGY 2: AI-Enhanced Targeted Search: "${searchTerm}"`)
  console.log(`🤖 AI Specs:`, aiAnalysis?.detectedSpecs)

  // For jacket-specific searches, use direct jacket_code filter
  if (detectedJacketCode && !detectedCategory && !detectedProductLine) {
    console.log(`🧥 Jacket-focused search for jacket_code: ${detectedJacketCode}`)

    let query = supabase
      .from('category_cables')
      .select('*')
      .eq('is_active', true)
      .eq('jacket_code', detectedJacketCode)  // Simple, direct filter!
      .limit(150)

    const result = await query
    const products = result.data ? formatCableResults(result.data, 'jacket_search') : []

    console.log(`🧥 Jacket search found: ${products.length} products with jacket_code ${detectedJacketCode}`)
    return products
  }

  // Regular multi-criteria search
  let query = supabase
    .from('category_cables')
    .select('*')
    .eq('is_active', true)
    .limit(150)

  // Apply exact match filters
  if (detectedColor) {
    query = query.eq('jacket_color', detectedColor)
    console.log(`🎨 REQUIRED: Color filter ${detectedColor}`)
  }

  if (detectedProductLine) {
    query = query.eq('product_line', detectedProductLine)
    console.log(`📋 REQUIRED: Product line filter ${detectedProductLine}`)
  }

  if (detectedJacketCode) {
    query = query.eq('jacket_code', detectedJacketCode)
    console.log(`🧥 REQUIRED: Jacket code filter ${detectedJacketCode}`)
  }

  // Apply shielding filter at database level for better performance
  if (detectedShielding) {
    query = query.eq('Shielding_Type', detectedShielding)
    console.log(`🛡️ REQUIRED: Shielding filter ${detectedShielding}`)
  }

  // Build search conditions for category
  const searchConditions: string[] = []

  if (detectedCategory === 'CAT6') {
    searchConditions.push('category_rating.ilike.%Category 6%')
    searchConditions.push('short_description.ilike.%cat6%')
    searchConditions.push('short_description.ilike.%cat 6%')
    searchConditions.push('short_description.ilike.%category 6%')
    console.log('🎯 Using comprehensive CAT6 search terms')
  } else if (detectedCategory === 'CAT6A') {
    searchConditions.push('category_rating.ilike.%Category 6A%')
    searchConditions.push('short_description.ilike.%cat6a%')
    searchConditions.push('short_description.ilike.%cat 6a%')
    searchConditions.push('short_description.ilike.%category 6a%')
    console.log('🎯 Using comprehensive CAT6A search terms')
  } else if (detectedCategory === 'CAT5E') {
    searchConditions.push('category_rating.ilike.%Category 5e%')
    searchConditions.push('short_description.ilike.%cat5e%')
    searchConditions.push('short_description.ilike.%cat 5e%')
    searchConditions.push('short_description.ilike.%category 5e%')
    console.log('🎯 Using comprehensive CAT5E search terms')
  } else {
    // General search - comprehensive across ALL fields
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`common_terms.ilike.%${searchTerm}%`)
    searchConditions.push(`product_line.ilike.%${searchTerm}%`)
    searchConditions.push(`possible_cross.ilike.%${searchTerm}%`)
    searchConditions.push(`application.ilike.%${searchTerm}%`)
    searchConditions.push(`upc_number.ilike.%${searchTerm}%`)
  }

  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','))
  }

  const result = await query
  const products = result.data ? formatCableResults(result.data, 'targeted_search') : []

  console.log(`🎯 Multi-criteria search found: ${products.length} products`)
  return products
}

/**
 * STRATEGY 3: Fallback Broad Search - Enhanced with better filtering
 */
const searchByFallback = async (
  searchTerm: string,
  aiAnalysis?: AISearchAnalysis | null,
  detectedJacketCode?: string | undefined
): Promise<Product[]> => {
  console.log(`🔍 STRATEGY 3: AI-Enhanced Fallback Search: "${searchTerm}"`)

  let query = supabase
    .from('category_cables')
    .select('*')
    .eq('is_active', true)
    .limit(200)

  // If we have a jacket code, apply it as a filter
  if (detectedJacketCode) {
    query = query.eq('jacket_code', detectedJacketCode)
    console.log(`🧥 Fallback search with jacket_code filter: ${detectedJacketCode}`)
  }

  const searchConditions: string[] = []

  // Add comprehensive search conditions across ALL fields
  searchConditions.push(`short_description.ilike.%${searchTerm}%`)
  searchConditions.push(`product_line.ilike.%${searchTerm}%`)
  searchConditions.push(`part_number.ilike.%${searchTerm}%`)
  searchConditions.push(`common_terms.ilike.%${searchTerm}%`)
  searchConditions.push(`possible_cross.ilike.%${searchTerm}%`)
  searchConditions.push(`application.ilike.%${searchTerm}%`)
  searchConditions.push(`brand.ilike.%${searchTerm}%`)
  searchConditions.push(`upc_number.ilike.%${searchTerm}%`)

  // Also search for individual terms across ALL fields
  const terms = searchTerm.split(' ').filter(t => t.length > 2)
  terms.forEach(term => {
    searchConditions.push(`short_description.ilike.%${term}%`)
    searchConditions.push(`common_terms.ilike.%${term}%`)
    searchConditions.push(`jacket_color.ilike.%${term}%`)
    searchConditions.push(`application.ilike.%${term}%`)
    searchConditions.push(`possible_cross.ilike.%${term}%`)
  })

  // Enhanced category matching
  const detectedCategory = detectCategoryFromTerms(searchTerm)
  if (detectedCategory) {
    if (detectedCategory === 'CAT6') {
      searchConditions.push(`category_rating.ilike.%Category 6%`)
    } else if (detectedCategory === 'CAT6A') {
      searchConditions.push(`category_rating.ilike.%Category 6A%`)
    } else if (detectedCategory === 'CAT5E') {
      searchConditions.push(`category_rating.ilike.%Category 5e%`)
    }
  }

  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','))
  }

  const fallbackResult = await query
  console.log(`📊 Fallback search result: ${fallbackResult.data?.length || 0} products found`)

  const products = fallbackResult.data ? formatCableResults(fallbackResult.data, 'fallback_search') : []
  return products
}

// ===================================================================
// POST-PROCESSING AND FILTERING - MUCH SIMPLER NOW!
// ===================================================================

/**
 * Apply intelligent filtering - Now simplified with jacket_code
 */
const applyIntelligentFiltering = (
  products: Product[],
  detectedCategory?: string | undefined,
  detectedShielding?: string | null,
  detectedJacketCode?: string | undefined,
  aiAnalysis?: AISearchAnalysis | null
): Product[] => {
  let filteredResults = products

  // Use AI analysis for more precise filtering
  const finalCategory = detectedCategory || aiAnalysis?.detectedSpecs?.categoryRating
  const finalShielding = detectedShielding || aiAnalysis?.detectedSpecs?.shielding

  // NO NEED for post-filtering by jacket anymore - it's handled in the query!

  // Apply category filtering
  if (finalCategory) {
    const beforeCount = filteredResults.length

    filteredResults = filteredResults.filter(item => {
      const category = item.categoryRating?.toLowerCase().trim() || ''

      if (finalCategory === 'CAT6') {
        return category.includes('category 6') && !category.includes('6a')
      } else if (finalCategory === 'CAT6A') {
        return category.includes('category 6a')
      } else if (finalCategory === 'CAT5E') {
        return category.includes('category 5e')
      } else if (finalCategory === 'CAT5') {
        return category.includes('category 5') && !category.includes('5e')
      }

      return true
    })

    console.log(`🎯 Category filter (${finalCategory}): ${beforeCount} → ${filteredResults.length} products`)
  }

  // Apply shielding filtering
  if (finalShielding) {
    const beforeCount = filteredResults.length

    filteredResults = filteredResults.filter(item => {
      const shielding = item.shielding?.toUpperCase().trim() || ''
      return shielding === finalShielding
    })

    console.log(`🛡️ Shielding filter (${finalShielding}): ${beforeCount} → ${filteredResults.length} products`)
  }

  return filteredResults
}

// ===================================================================
// MAIN SEARCH FUNCTION
// ===================================================================

export const searchCategoryCables = async (
  options: CategoryCableSearchOptions
): Promise<CategoryCableSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100 } = options

  console.log('🌐 CATEGORY CABLES SEARCH - With jacket_code Column')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    // ENHANCED DETECTION - Declare all variables FIRST
    const textDetectedJacket = detectJacketType(searchTerm)
    const textDetectedCategory = detectCategoryFromTerms(searchTerm) || detectCategoryRating(searchTerm)
    const textDetectedColor = detectColor(searchTerm)
    const textDetectedProductLine = detectProductLine(searchTerm)
    const textDetectedShielding = detectShielding(searchTerm)
    const textDetectedQuantity = detectQuantity(searchTerm)

    // NORMALIZE AI ANALYSIS - Convert to jacket codes
    const detectedJacketCode = normalizeJacketRating(
      aiAnalysis?.detectedSpecs?.jacketRating,
      textDetectedJacket
    )
    const detectedCategory = normalizeCategoryRating(
      aiAnalysis?.detectedSpecs?.categoryRating,
      textDetectedCategory
    )
    const detectedColor = normalizeColor(
      aiAnalysis?.detectedSpecs?.color,
      textDetectedColor
    )
    // For box conversions, prioritize text detection over AI
    const detectedQuantity = textDetectedQuantity && textDetectedQuantity > (aiAnalysis?.detectedSpecs?.requestedQuantity || 0) 
      ? textDetectedQuantity 
      : (aiAnalysis?.detectedSpecs?.requestedQuantity || textDetectedQuantity)
    const detectedShielding = aiAnalysis?.detectedSpecs?.shielding || textDetectedShielding
    const detectedProductLine = textDetectedProductLine

    console.log('🎯 FINAL DETECTION RESULTS (AI + Text):', {
      jacketCode: `${detectedJacketCode} (AI: ${aiAnalysis?.detectedSpecs?.jacketRating}, Text: ${textDetectedJacket})`,
      category: `${detectedCategory} (AI: ${aiAnalysis?.detectedSpecs?.categoryRating}, Text: ${textDetectedCategory})`,
      color: `${detectedColor} (AI: ${aiAnalysis?.detectedSpecs?.color}, Text: ${textDetectedColor})`,
      quantity: `${detectedQuantity} (AI: ${aiAnalysis?.detectedSpecs?.requestedQuantity}, Text: ${textDetectedQuantity})`,
      shielding: detectedShielding,
      productLine: detectedProductLine
    })

    let products: Product[] = []
    let searchStrategy = 'unknown'

    // STRATEGY 1: Product Line Search
    if (detectedProductLine) {
      console.log(`🚀 STRATEGY 1: Product Line Search for "${detectedProductLine}"`)
      products = await searchByProductLine(detectedProductLine, detectedColor, detectedJacketCode, detectedShielding)
      if (products.length > 0) {
        searchStrategy = 'product_line_match'
        products = applyIntelligentFiltering(products, detectedCategory, detectedShielding, detectedJacketCode, aiAnalysis)
        const endTime = performance.now()
        return {
          products: products.slice(0, limit),
          searchStrategy,
          totalFound: products.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 2: Multi-Criteria Search
    console.log(`🚀 STRATEGY 2: AI-Enhanced Multi-Criteria Search`)
    products = await searchByMultiCriteria(
      searchTerm,
      aiAnalysis,
      detectedProductLine,
      detectedColor,
      detectedJacketCode,
      detectedCategory,
      detectedShielding
    )

    if (products.length > 0) {
      searchStrategy = 'targeted_search'
      products = applyIntelligentFiltering(products, detectedCategory, detectedShielding, detectedJacketCode, aiAnalysis)
    } else {
      // STRATEGY 3: Fallback Search
      console.log(`🚀 STRATEGY 3: AI-Enhanced Fallback Search`)
      products = await searchByFallback(searchTerm, aiAnalysis, detectedJacketCode)
      searchStrategy = 'fallback_search'
      products = applyIntelligentFiltering(products, detectedCategory, detectedShielding, detectedJacketCode, aiAnalysis)
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
    console.error('❌ Error in searchCategoryCables:', error)
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

const formatCableResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} CABLE RESULTS (${searchType})`)

  return data.map((item: any) => ({
    id: `cat-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: Math.random() * 150 + 50,
    stockLocal: 25,
    stockDistribution: 100,
    leadTime: 'Ships Today',
    category: 'Category Cable',
    categoryRating: item.category_rating?.trim() || undefined,
    // NEW: Include both for display and the code for future use
    jacketRating: item.jacket_code || item.jacket_material?.trim() || undefined,
    jacketCode: item.jacket_code || undefined,  // NEW field
    color: item.jacket_color?.trim() || undefined,
    packagingType: item.packaging_type?.trim() || undefined,
    shielding: item.Shielding_Type?.trim() || undefined,
    productLine: item.product_line?.trim() || undefined,
    pairCount: item.pair_count?.trim() || undefined,
    conductorAwg: item.conductor_awg || undefined,
    jacketColor: item.jacket_color?.trim() || undefined,
    cableDiameter: item.cable_diameter_in || undefined,
    application: item.application?.trim() || undefined,
    possibleCross: item.possible_cross?.trim() || undefined,
    searchRelevance: 1.0,
    tableName: 'category_cables',
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }))
}

export const generateCategoryCableFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    productLines: filterString(products.map(p => p.productLine)).slice(0, 6),
    categoryRatings: filterString(products.map(p => p.categoryRating)).slice(0, 4),
    jacketRatings: filterString(products.map(p => p.jacketRating)).slice(0, 4),
    shieldingTypes: filterString(products.map(p => p.shielding)).slice(0, 4),
    colors: filterString(products.map(p => p.jacketColor || p.color)).slice(0, 6),
    pairCounts: filterString(products.map(p => p.pairCount)).slice(0, 4),
    conductorGauges: filterString(products.map(p => p.conductorAwg?.toString())).slice(0, 4),
    applications: filterString(products.map(p => p.application)).slice(0, 4),
    packagingTypes: filterString(products.map(p => p.packagingType)).slice(0, 6)
  }
}