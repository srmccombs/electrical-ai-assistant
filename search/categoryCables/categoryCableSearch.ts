// src/search/categoryCables/categoryCableSearch.ts
// FIXED VERSION - Variable declarations moved before usage

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

// Import Product and AISearchAnalysis types from searchService
import type { Product, AISearchAnalysis } from '@/services/searchService'

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
// HELPER FUNCTIONS - AI ANALYSIS INTEGRATION
// ===================================================================

/**
 * Convert AI jacket rating to search format
 */
const normalizeJacketRating = (aiJacketRating?: string, textDetected?: string | null): string | undefined => {
  // Prioritize AI analysis
  if (aiJacketRating) {
    if (aiJacketRating.toUpperCase() === 'CMP') {
      return 'PLENUM'
    }
    if (aiJacketRating.toUpperCase() === 'CMR') {
      return 'RISER'
    }
    if (aiJacketRating.toUpperCase() === 'PLENUM') {
      return 'PLENUM'
    }
    if (aiJacketRating.toUpperCase() === 'RISER') {
      return 'RISER'
    }
  }

  // Fall back to text detection (handle null case)
  return textDetected || undefined
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
    if (normalized === 'CAT5' || normalized === 'CATEGORY5') return 'CAT5'
    return normalized
  }

  // Fall back to text detection (handle null case)
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
// SEARCH STRATEGIES
// ===================================================================

/**
 * STRATEGY 1: Product Line Search - Enhanced with AI
 */
const searchByProductLine = async (
  productLine: string,
  detectedColor?: string | undefined,
  detectedJacket?: string | undefined
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

  if (detectedJacket === 'RISER') {
    query = query.eq('jacket_material', 'Non-Plenum Rated CMR ')
    console.log(`🧥 Adding riser filter: Non-Plenum Rated CMR`)
  } else if (detectedJacket === 'PLENUM') {
    query = query.eq('jacket_material', 'Plenum Rated CMP ')
    console.log(`🧥 Adding plenum filter: Plenum Rated CMP`)
  }

  const result = await query
  console.log(`📊 Product line search result: ${result.data?.length || 0} products found`)

  return result.data ? formatCableResults(result.data, 'product_line_match') : []
}

/**
 * STRATEGY 2: Multi-Criteria Targeted Search
 */
const searchByMultiCriteria = async (
  searchTerm: string,
  aiAnalysis?: AISearchAnalysis | null,
  detectedProductLine?: string | null,
  detectedColor?: string | undefined,
  detectedJacket?: string | undefined,
  detectedCategory?: string | undefined
): Promise<Product[]> => {
  console.log(`🎯 STRATEGY 2: AI-Enhanced Targeted Search: "${searchTerm}"`)
  console.log(`🤖 AI Specs:`, aiAnalysis?.detectedSpecs)

  let query = supabase
    .from('category_cables')
    .select('*')
    .eq('is_active', true)
    .limit(150)

  const searchConditions: string[] = []

  // 1. Direct term searches
  searchConditions.push(`part_number.ilike.%${searchTerm}%`)
  searchConditions.push(`short_description.ilike.%${searchTerm}%`)
  searchConditions.push(`product_line.ilike.%${searchTerm}%`)

  // 2. ENHANCED CATEGORY SEARCH - Use AI analysis first
  if (detectedCategory === 'CAT6') {
    searchConditions.push(`category_rating.ilike.%Category 6%`)
    console.log('🎯 AI + Pattern: CAT6 → "Category 6"')
  } else if (detectedCategory === 'CAT6A') {
    searchConditions.push(`category_rating.ilike.%Category 6A%`)
    console.log('🎯 AI + Pattern: CAT6A → "Category 6A"')
  } else if (detectedCategory === 'CAT5E') {
    searchConditions.push(`category_rating.ilike.%Category 5e%`)
    console.log('🎯 AI + Pattern: CAT5E → "Category 5e"')
  } else if (searchTerm.includes('cat6') || searchTerm.includes('cat 6') || searchTerm.includes('category 6')) {
    searchConditions.push(`category_rating.ilike.%Category 6%`)
    console.log('🎯 Text Pattern: "cat 6" → "Category 6"')
  } else if (searchTerm.includes('cat5e') || searchTerm.includes('cat 5e')) {
    searchConditions.push(`category_rating.ilike.%Category 5e%`)
    console.log('🎯 Text Pattern: "cat 5e" → "Category 5e"')
  } else {
    searchConditions.push(`category_rating.ilike.%${searchTerm}%`)
  }

  // 3. Product line detection
  if (detectedProductLine) {
    searchConditions.push(`product_line.eq.${detectedProductLine}`)
    console.log(`📋 Product line filter: ${detectedProductLine}`)
  }

  // 4. ENHANCED COLOR SEARCH - Use AI analysis first
  if (detectedColor) {
    searchConditions.push(`jacket_color.eq.${detectedColor}`)
    console.log(`🎨 Color filter: ${detectedColor}`)
  }

  // 5. ENHANCED JACKET SEARCH - Use AI analysis with proper CMP/CMR handling
  if (detectedJacket === 'RISER') {
    searchConditions.push(`jacket_material.eq.Non-Plenum Rated CMR `)
    searchConditions.push(`short_description.ilike.%CMR%`)
    console.log(`🧥 Jacket filter: RISER (CMR)`)
  } else if (detectedJacket === 'PLENUM') {
    searchConditions.push(`jacket_material.eq.Plenum Rated CMP `)
    searchConditions.push(`short_description.ilike.%CMP%`)
    console.log(`🧥 Jacket filter: PLENUM (CMP)`)
  }

  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','))
    console.log(`🚀 Applying ${searchConditions.length} search conditions`)
    console.log(`🔍 Search conditions:`, searchConditions)
  }

  const result = await query
  console.log(`📊 Targeted search result: ${result.data?.length || 0} products found`)

  return result.data ? formatCableResults(result.data, 'targeted_search') : []
}

/**
 * STRATEGY 3: Fallback Broad Search - Enhanced with AI
 */
const searchByFallback = async (
  searchTerm: string,
  aiAnalysis?: AISearchAnalysis | null
): Promise<Product[]> => {
  console.log(`🔍 STRATEGY 3: AI-Enhanced Fallback Search: "${searchTerm}"`)

  let query = supabase
    .from('category_cables')
    .select('*')
    .eq('is_active', true)
    .limit(100)

  const searchConditions: string[] = []

  searchConditions.push(`short_description.ilike.%${searchTerm}%`)
  searchConditions.push(`product_line.ilike.%${searchTerm}%`)
  searchConditions.push(`jacket_color.ilike.%${searchTerm}%`)
  searchConditions.push(`part_number.ilike.%${searchTerm}%`)

  // Enhanced category matching with AI backup
  const aiCategory = aiAnalysis?.detectedSpecs?.categoryRating
  if (aiCategory === 'CAT6') {
    searchConditions.push(`category_rating.ilike.%Category 6%`)
    console.log('🎯 AI Fallback: CAT6 → "Category 6"')
  } else if (aiCategory === 'CAT6A') {
    searchConditions.push(`category_rating.ilike.%Category 6A%`)
    console.log('🎯 AI Fallback: CAT6A → "Category 6A"')
  } else if (aiCategory === 'CAT5E') {
    searchConditions.push(`category_rating.ilike.%Category 5e%`)
    console.log('🎯 AI Fallback: CAT5E → "Category 5e"')
  } else if (searchTerm.includes('cat6') || searchTerm.includes('cat 6')) {
    searchConditions.push(`category_rating.ilike.%Category 6%`)
    console.log('🎯 Text Fallback: "cat 6" → "Category 6"')
  } else {
    searchConditions.push(`category_rating.ilike.%${searchTerm}%`)
  }

  query = query.or(searchConditions.join(','))

  const fallbackResult = await query
  console.log(`📊 Fallback search result: ${fallbackResult.data?.length || 0} products found`)

  return fallbackResult.data ? formatCableResults(fallbackResult.data, 'fallback_search') : []
}

// ===================================================================
// POST-PROCESSING AND FILTERING
// ===================================================================

const applyIntelligentFiltering = (
  products: Product[],
  detectedCategory?: string | undefined,
  detectedShielding?: string | null,
  aiAnalysis?: AISearchAnalysis | null
): Product[] => {
  let filteredResults = products

  // Use AI analysis for more precise filtering
  const finalCategory = detectedCategory || aiAnalysis?.detectedSpecs?.categoryRating
  const finalShielding = detectedShielding || aiAnalysis?.detectedSpecs?.shielding

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
// MAIN SEARCH FUNCTION - FIXED VARIABLE DECLARATIONS
// ===================================================================

export const searchCategoryCables = async (
  options: CategoryCableSearchOptions
): Promise<CategoryCableSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100 } = options

  console.log('🌐 CATEGORY CABLES SEARCH - AI Analysis Integration Fixed')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    // ENHANCED DETECTION - Declare all variables FIRST
    const textDetectedJacket = detectJacketType(searchTerm)
    const textDetectedCategory = detectCategoryRating(searchTerm)
    const textDetectedColor = detectColor(searchTerm)
    const textDetectedProductLine = detectProductLine(searchTerm)
    const textDetectedShielding = detectShielding(searchTerm)
    const textDetectedQuantity = detectQuantity(searchTerm)

    // NORMALIZE AI ANALYSIS (Now variables are declared above)
    const detectedJacket = normalizeJacketRating(
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
    const detectedQuantity = aiAnalysis?.detectedSpecs?.requestedQuantity || textDetectedQuantity
    const detectedShielding = aiAnalysis?.detectedSpecs?.shielding || textDetectedShielding
    const detectedProductLine = textDetectedProductLine // Keep text detection for product lines

    console.log('🎯 FINAL DETECTION RESULTS (AI + Text):', {
      jacket: `${detectedJacket} (AI: ${aiAnalysis?.detectedSpecs?.jacketRating}, Text: ${textDetectedJacket})`,
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
      products = await searchByProductLine(detectedProductLine, detectedColor, detectedJacket)
      if (products.length > 0) {
        searchStrategy = 'product_line_match'
        products = applyIntelligentFiltering(products, detectedCategory, detectedShielding, aiAnalysis)
        const endTime = performance.now()
        return {
          products: products.slice(0, limit),
          searchStrategy,
          totalFound: products.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    // STRATEGY 2: Multi-Criteria Search (ENHANCED WITH AI)
    console.log(`🚀 STRATEGY 2: AI-Enhanced Multi-Criteria Search`)
    products = await searchByMultiCriteria(
      searchTerm,
      aiAnalysis,
      detectedProductLine,
      detectedColor,
      detectedJacket,
      detectedCategory
    )

    if (products.length > 0) {
      searchStrategy = 'targeted_search'
      products = applyIntelligentFiltering(products, detectedCategory, detectedShielding, aiAnalysis)
    } else {
      // STRATEGY 3: Fallback Search (ENHANCED WITH AI)
      console.log(`🚀 STRATEGY 3: AI-Enhanced Fallback Search`)
      products = await searchByFallback(searchTerm, aiAnalysis)
      searchStrategy = 'fallback_search'
      products = applyIntelligentFiltering(products, detectedCategory, detectedShielding, aiAnalysis)
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
    jacketRating: item.jacket_material?.includes('Plenum') ? 'CMP' :
                 item.jacket_material?.includes('Non-Plenum') ? 'CMR' :
                 item.jacket_material?.trim() || undefined,
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