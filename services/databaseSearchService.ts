// Database-driven search service
// This is the new, optimized search that leverages PostgreSQL full-text search

import { supabase } from '@/lib/supabase'
import type { Product, SearchResult, SmartFilters } from '@/types'

interface DatabaseSearchOptions {
  searchTerm: string
  tableNames?: string[]
  limit?: number
  offset?: number
  filters?: {
    brand?: string
    category?: string
    jacketCode?: string
    shielding?: string
  }
}

/**
 * Main database search function using PostgreSQL full-text search
 */
export async function searchProductsDatabase(
  options: DatabaseSearchOptions
): Promise<SearchResult> {
  const startTime = performance.now()
  const { searchTerm, tableNames, limit = 100, offset = 0, filters } = options

  try {
    // Use the search function we created in the database
    const { data, error } = await (supabase as any)
      .rpc('search_products_advanced', {
        p_search_term: searchTerm,
        p_table_name: tableNames?.[0] || null,
        p_limit: limit,
        p_offset: offset
      })

    if (error) {
      console.error('Database search error:', error)
      throw error
    }

    // Format results into Product objects
    const products: Product[] = (data || []).map((item: any) => ({
      id: `${item.table_name}-${item.id}`,
      partNumber: item.part_number,
      brand: item.brand,
      description: item.description,
      price: 0, // Add pricing logic here
      stockLocal: 0,
      stockDistribution: 0,
      leadTime: 'Contact for availability',
      category: getCategoryFromTable(item.table_name),
      tableName: item.table_name,
      searchRelevance: item.rank,
      matchedTerms: item.matched_terms,
      // Add other fields as needed
    }))

    // Apply post-search filters if provided
    let filteredProducts = products
    if (filters) {
      if (filters.brand) {
        filteredProducts = filteredProducts.filter(p => 
          p.brand?.toLowerCase() === filters.brand?.toLowerCase()
        )
      }
      // Add other filter logic as needed
    }

    const endTime = performance.now()

    return {
      products: filteredProducts,
      searchTime: Math.round(endTime - startTime),
      searchType: 'database_fulltext',
      totalFound: filteredProducts.length,
      smartFilters: generateSmartFilters(filteredProducts) as unknown as SmartFilters,
      aiAnalysis: undefined
    }

  } catch (error) {
    console.error('Search error:', error)
    const endTime = performance.now()
    
    return {
      products: [],
      searchTime: Math.round(endTime - startTime),
      searchType: 'database_fulltext',
      totalFound: 0,
      smartFilters: { brands: [] } as SmartFilters,
      aiAnalysis: undefined
    }
  }
}

/**
 * Search using the materialized view for ultra-fast results
 */
export async function searchProductsFast(searchTerm: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('mv_product_search')
    .select('*')
    .textSearch('search_vector', searchTerm, {
      type: 'plain',
      config: 'english'
    })
    .limit(50)

  if (error) {
    console.error('Fast search error:', error)
    return []
  }

  return (data || []).map(formatProduct)
}

/**
 * Get search suggestions based on user input
 */
export async function getSearchSuggestions(term: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('search_suggestions')
    .select('suggested_term')
    .ilike('original_term', `${term}%`)
    .limit(5)

  if (error) {
    console.error('Suggestions error:', error)
    return []
  }

  return (data as any[])?.map(s => s.suggested_term) || []
}

/**
 * Track search analytics
 */
export async function trackSearchAnalytics(
  searchTerm: string,
  resultsCount: number,
  duration: number,
  userSession?: string
): Promise<void> {
  try {
    await supabase
      .from('search_analytics_enhanced')
      .insert({
        search_term: searchTerm,
        cleaned_search_term: searchTerm.toLowerCase().trim(),
        results_count: resultsCount,
        search_duration_ms: duration,
        user_session: userSession,
        search_type: 'database',
        result_quality_score: resultsCount > 0 ? 1.0 : 0.0
      })
  } catch (error) {
    console.error('Analytics tracking error:', error)
  }
}

// Helper functions

function getCategoryFromTable(tableName: string): string {
  const categoryMap: Record<string, string> = {
    'prod_category_cables': 'Category Cable',
    'prod_fiber_connectors': 'Fiber Connector',
    'prod_fiber_cables': 'Fiber Cable',
    'prod_jack_modules': 'Jack Module',
    'prod_faceplates': 'Faceplate',
    'prod_surface_mount_boxes': 'Surface Mount Box',
    'prod_adapter_panels': 'Adapter Panel',
    'prod_rack_mount_enclosures': 'Rack Mount Enclosure',
    'prod_wall_mount_enclosures': 'Wall Mount Enclosure',
    'prod_modular_plugs': 'Modular Plug'
  }
  return categoryMap[tableName] || 'Unknown'
}

function formatProduct(data: any): Product {
  return {
    id: `${data.table_name}-${data.id}`,
    partNumber: data.part_number,
    brand: data.brand,
    description: data.short_description,
    price: 0,
    stockLocal: 0,
    stockDistribution: 0,
    leadTime: 'Contact for availability',
    category: getCategoryFromTable(data.table_name),
    tableName: data.table_name,
    // Add specific fields based on product type
    ...(data.category_rating && { categoryRating: data.category_rating }),
    ...(data.jacket_code && { jacketCode: data.jacket_code }),
    ...(data.shielding_type && { shielding: data.shielding_type }),
    ...(data.jacket_color && { color: data.jacket_color })
  }
}

function generateSmartFilters(products: Product[]): Record<string, string[]> {
  const filters: Record<string, Set<string>> = {
    brands: new Set(),
    categories: new Set(),
    jacketCodes: new Set(),
    shielding: new Set(),
    colors: new Set()
  }

  products.forEach(product => {
    if (product.brand) filters.brands.add(product.brand)
    if (product.category) filters.categories.add(product.category)
    if (product.jacketCode) filters.jacketCodes.add(product.jacketCode)
    if (product.shielding) filters.shielding.add(product.shielding)
    if (product.color) filters.colors.add(product.color)
  })

  // Convert sets to sorted arrays
  return Object.entries(filters).reduce((acc, [key, set]) => {
    acc[key] = Array.from(set).sort().slice(0, 10) // Limit to top 10
    return acc
  }, {} as Record<string, string[]>)
}

// Export convenience functions for specific product types
export async function searchCategoryCables(searchTerm: string) {
  return searchProductsDatabase({
    searchTerm,
    tableNames: ['prod_category_cables']
  })
}

export async function searchFiberConnectors(searchTerm: string) {
  return searchProductsDatabase({
    searchTerm,
    tableNames: ['prod_fiber_connectors']
  })
}

// Add more specific search functions as needed