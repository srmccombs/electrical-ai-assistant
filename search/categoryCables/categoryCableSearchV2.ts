// Database-driven category cable search implementation
// This replaces 500+ lines of JavaScript search logic with simple database queries

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'

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

/**
 * Search category cables using PostgreSQL full-text search
 * This leverages the search_terms table and computed_search_terms column
 */
export const searchCategoryCablesV2 = async (
  options: CategoryCableSearchOptions
): Promise<CategoryCableSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100 } = options

  console.log('🚀 DATABASE-DRIVEN CATEGORY CABLE SEARCH')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    // Build the query
    let query = supabase
      .from('prod_category_cables')
      .select('*')
      .limit(limit)

    // Determine what to search for
    let searchString = searchTerm
    
    // If AI detected a specific category rating, use that instead
    if (aiAnalysis?.detectedSpecs?.categoryRating) {
      searchString = aiAnalysis.detectedSpecs.categoryRating
      console.log('🤖 Using AI-detected category rating:', searchString)
    } else {
      // Clean up search term - remove "cable" if searching for category ratings
      if (searchTerm.toLowerCase().includes('category') && searchTerm.toLowerCase().includes('cable')) {
        searchString = searchTerm.replace(/\s*cable\s*$/i, '').trim()
        console.log('📝 Cleaned search term:', searchString)
      }
    }
    
    const { data, error } = await query
      .or(`part_number.ilike.%${searchString}%,short_description.ilike.%${searchString}%,computed_search_terms.ilike.%${searchString}%,common_terms.ilike.%${searchString}%,brand.ilike.%${searchString}%,category_rating.ilike.%${searchString}%`)
      .eq('is_active', true)
      .order('brand', { ascending: true })
      .order('part_number', { ascending: true })

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    const products = data ? formatCableResults(data) : []
    const endTime = performance.now()

    console.log(`✅ V2 Search Results:`)
    console.log(`   - Found: ${products.length} products`)
    console.log(`   - Time: ${Math.round(endTime - startTime)}ms`)
    console.log(`   - Search string used: "${searchString}"`)
    console.log(`   - Original search term: "${searchTerm}"`)
    if (products.length < 10) {
      console.log(`   ⚠️  Low result count - check if more products exist with is_active=false`)
    }

    return {
      products,
      searchStrategy: 'database_fulltext',
      totalFound: products.length,
      searchTime: Math.round(endTime - startTime)
    }

  } catch (error) {
    console.error('❌ Error in searchCategoryCablesV2:', error)
    const endTime = performance.now()

    return {
      products: [],
      searchStrategy: 'error',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }
  }
}

/**
 * Format database results into Product objects
 */
const formatCableResults = (data: CategoryCableRow[]): Product[] => {
  return data.map((item) => ({
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
    jacketRating: item.jacket_code || item.jacket_material?.trim() || undefined,
    jacketCode: item.jacket_code || undefined,
    color: item.jacket_color?.trim() || undefined,
    packagingType: item.packaging_type?.trim() || undefined,
    shielding: item.shielding_type?.trim() || undefined,
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

/**
 * Generate filters from search results
 */
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