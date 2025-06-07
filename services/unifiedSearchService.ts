// src/services/unifiedSearchService.ts
// Simplified search service using your SQL functions
// Date: June 5, 2025

import { supabase } from '@/lib/supabase'

// ===================================================================
// TYPE DEFINITIONS - Complete and Self-Contained
// ===================================================================

export interface Product {
  id: string
  partNumber: string
  brand: string
  description: string
  price?: number
  stockLocal: number
  stockDistribution: number
  leadTime?: string
  category: string
  imageUrl?: string

  // Category Cable specific
  categoryRating?: string
  jacketRating?: string
  jacketCode?: string
  shielding?: string
  color?: string
  productLine?: string
  pairCount?: string
  conductorAwg?: number

  // Fiber Connector specific
  connectorType?: string
  fiberType?: string
  technology?: string
  polish?: string
  housingColor?: string
  bootColor?: string

  // Adapter Panel specific
  panelType?: string
  adaptersPerPanel?: number
  adapterColor?: string
  terminationType?: string
  supportsAPC?: boolean

  // Fiber Enclosure specific
  mountType?: string
  rackUnits?: number
  panelCapacity?: number
  material?: string
  supportsSpliceTrays?: boolean
  environment?: string

  // Search metadata
  searchRelevance?: number
  tableName?: string
  stockStatus?: string
  stockColor?: string
  stockMessage?: string
}

export interface SearchResult {
  products: Product[]
  searchTime: number
  searchType: string
  totalFound: number
  error?: string
}

export interface SmartFilters {
  brands: string[]
  categories: string[]
  [key: string]: string[] // Allow dynamic filter properties
}

// Database result type from your SQL functions
interface DatabaseSearchResult {
  table_source: string
  part_number: string
  brand: string
  description: string
  category_rating?: string
  jacket_material?: string
  jacket_code?: string
  shielding_type?: string
  jacket_color?: string
  product_line?: string
  pair_count?: string
  conductor_awg?: number
  connector_type?: string
  fiber_category?: string
  technology?: string
  polish?: string
  housing_color?: string
  boot_color?: string
  panel_type?: string
  number_of_adapter_per_panel?: number
  adapter_color?: string
  termination_type?: string
  supports_apc?: boolean
  mount_type?: string
  rack_units?: number
  accepts_number_of_connector_housing_panels?: number
  material?: string
  supports_splice_trays?: boolean
  environment?: string
  unit_price?: string
  stock_quantity?: number
  is_active?: boolean
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Determine category based on table name
 */
const getCategoryFromTable = (tableName: string): string => {
  const categoryMap: Record<string, string> = {
    'category_cables': 'Category Cable',
    'fiber_connectors': 'Fiber Connector',
    'adapter_panels': 'Adapter Panel',
    'rack_mount_fiber_enclosures': 'Fiber Enclosure',
    'wall_mount_fiber_enclosures': 'Fiber Enclosure',
    'fiber_optic_cable': 'Fiber Cable'
  }

  return categoryMap[tableName] || 'Product'
}

/**
 * Generate unique product ID
 */
const generateProductId = (tableName: string, id: string | number): string => {
  const prefixMap: Record<string, string> = {
    'category_cables': 'cat',
    'fiber_connectors': 'conn',
    'adapter_panels': 'panel',
    'rack_mount_fiber_enclosures': 'encl',
    'wall_mount_fiber_enclosures': 'wall',
    'fiber_optic_cable': 'fiber'
  }

  const prefix = prefixMap[tableName] || 'prod'
  return `${prefix}-${id}`
}

/**
 * Format database results into Product objects
 */
const formatSearchResults = (data: DatabaseSearchResult[]): Product[] => {
  return data.map((item) => {
    const product: Product = {
      id: generateProductId(item.table_source, item.part_number),
      partNumber: item.part_number || 'No Part Number',
      brand: item.brand?.trim() || 'Unknown Brand',
      description: item.description?.trim() || 'No description available',
      price: item.unit_price ? parseFloat(item.unit_price) : undefined,
      stockLocal: item.stock_quantity || 0,
      stockDistribution: 100,
      leadTime: item.is_active ? 'Ships Today' : 'Contact for availability',
      category: getCategoryFromTable(item.table_source),
      tableName: item.table_source,
      stockStatus: item.is_active ? 'in_stock' : 'not_in_stock',
      stockColor: item.is_active ? 'green' : 'red',
      stockMessage: item.is_active ? 'In stock' : 'Contact for availability',

      // Add table-specific fields based on table_source
      ...(item.table_source === 'category_cables' && {
        categoryRating: item.category_rating?.trim(),
        jacketRating: item.jacket_material?.trim(),
        jacketCode: item.jacket_code?.trim(),
        shielding: item.shielding_type?.trim(),
        color: item.jacket_color?.trim(),
        productLine: item.product_line?.trim(),
        pairCount: item.pair_count?.trim(),
        conductorAwg: item.conductor_awg
      }),

      ...(item.table_source === 'fiber_connectors' && {
        connectorType: item.connector_type?.trim(),
        fiberType: item.fiber_category?.trim(),
        technology: item.technology?.trim(),
        polish: item.polish?.trim(),
        housingColor: item.housing_color?.trim(),
        bootColor: item.boot_color?.trim()
      }),

      ...(item.table_source === 'adapter_panels' && {
        panelType: item.panel_type?.trim(),
        adaptersPerPanel: item.number_of_adapter_per_panel,
        adapterColor: item.adapter_color?.trim(),
        terminationType: item.termination_type?.trim(),
        supportsAPC: item.supports_apc || false
      }),

      ...(item.table_source === 'rack_mount_fiber_enclosures' && {
        mountType: item.mount_type?.trim(),
        rackUnits: item.rack_units,
        panelCapacity: item.accepts_number_of_connector_housing_panels,
        material: item.material?.trim(),
        supportsSpliceTrays: item.supports_splice_trays || false,
        environment: item.environment?.trim()
      })
    }

    return product
  })
}

/**
 * Generate smart filters from products
 */
const generateSmartFilters = (products: Product[]): SmartFilters => {
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)))
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  return {
    brands: brands.slice(0, 10),
    categories: categories.slice(0, 10)
  }
}

// ===================================================================
// MAIN SEARCH FUNCTIONS
// ===================================================================

/**
 * Search across all tables using your SQL function
 */
export const searchAllTables = async (searchTerm: string): Promise<SearchResult> => {
  const startTime = performance.now()

  try {
    console.log('🔍 Searching all tables for:', searchTerm)

    // Call your SQL function
    const { data, error } = await supabase
      .rpc('fast_search_all', {
        search_term: searchTerm
      })

    if (error) {
      console.error('❌ Search error:', error)
      return {
        products: [],
        searchTime: Math.round(performance.now() - startTime),
        searchType: 'error',
        totalFound: 0,
        error: error.message
      }
    }

    // Format the results - map table_name to table_source
    const formattedData = (data || []).map((item: any) => ({
      ...item,
      table_source: item.table_name || item.table_source
    }))
    const products = formatSearchResults(formattedData)

    console.log(`✅ Found ${products.length} products`)

    return {
      products,
      searchTime: Math.round(performance.now() - startTime),
      searchType: 'all_tables',
      totalFound: products.length
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return {
      products: [],
      searchTime: Math.round(performance.now() - startTime),
      searchType: 'error',
      totalFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Search by brand using your SQL function
 */
export const searchByBrand = async (brandName: string): Promise<SearchResult> => {
  const startTime = performance.now()

  try {
    console.log('🏢 Searching by brand:', brandName)

    // Get products by brand using the general search
    const { data: productData, error: productError } = await supabase
      .rpc('fast_search_all', {
        search_term: brandName
      })

    if (productError) {
      console.error('❌ Product search error:', productError)
      return {
        products: [],
        searchTime: Math.round(performance.now() - startTime),
        searchType: 'error',
        totalFound: 0,
        error: productError.message
      }
    }

    // Format and filter to ensure only the requested brand
    const formattedData = (productData || []).map((item: any) => ({
      ...item,
      table_source: item.table_name || item.table_source
    }))
    const allProducts = formatSearchResults(formattedData)
    const brandProducts = allProducts.filter(p =>
      p.brand.toLowerCase().includes(brandName.toLowerCase())
    )

    console.log(`✅ Found ${brandProducts.length} ${brandName} products`)

    return {
      products: brandProducts,
      searchTime: Math.round(performance.now() - startTime),
      searchType: 'brand',
      totalFound: brandProducts.length
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return {
      products: [],
      searchTime: Math.round(performance.now() - startTime),
      searchType: 'error',
      totalFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Simple part number search
 */
export const searchByPartNumber = async (partNumber: string): Promise<SearchResult> => {
  const startTime = performance.now()

  try {
    console.log('🔢 Searching for part number:', partNumber)

    // Use the general search function with the part number
    const { data, error } = await supabase
      .rpc('fast_search_all', {
        search_term: partNumber
      })

    if (error) {
      console.error('❌ Part number search error:', error)
      return {
        products: [],
        searchTime: Math.round(performance.now() - startTime),
        searchType: 'error',
        totalFound: 0,
        error: error.message
      }
    }

    // Format results and prioritize exact matches
    const formattedData = (data || []).map((item: any) => ({
      ...item,
      table_source: item.table_name || item.table_source
    }))
    const products = formatSearchResults(formattedData)

    // Sort by exact match first
    products.sort((a, b) => {
      const aExact = a.partNumber.toLowerCase() === partNumber.toLowerCase()
      const bExact = b.partNumber.toLowerCase() === partNumber.toLowerCase()

      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      // Then by starts with
      const aStarts = a.partNumber.toLowerCase().startsWith(partNumber.toLowerCase())
      const bStarts = b.partNumber.toLowerCase().startsWith(partNumber.toLowerCase())

      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      return 0
    })

    console.log(`✅ Found ${products.length} matches for part number ${partNumber}`)

    return {
      products,
      searchTime: Math.round(performance.now() - startTime),
      searchType: 'part_number',
      totalFound: products.length
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return {
      products: [],
      searchTime: Math.round(performance.now() - startTime),
      searchType: 'error',
      totalFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Main search function - decides which SQL function to use
 */
export const search = async (query: string): Promise<SearchResult & { filters?: SmartFilters }> => {
  // Normalize the query
  const normalizedQuery = query.trim().toLowerCase()

  // Check if it's a brand-only search
  const brandKeywords = ['corning', 'panduit', 'leviton', 'superior essex', 'berktek', 'prysmian', 'dmsi', 'siecor']
  const isBrandSearch = brandKeywords.some(brand => normalizedQuery === brand)

  // Check if it looks like a part number (mostly alphanumeric)
  const isPartNumber = /^[a-z0-9\-]+$/i.test(query) && query.length >= 5

  let result: SearchResult

  if (isBrandSearch) {
    console.log('🏢 Detected brand search')
    result = await searchByBrand(query)
  } else if (isPartNumber) {
    console.log('🔢 Detected part number search')
    result = await searchByPartNumber(query)
  } else {
    console.log('🔍 General search')
    result = await searchAllTables(query)
  }

  // Generate filters if we have results
  const filters = result.products.length > 0
    ? generateSmartFilters(result.products)
    : undefined

  return {
    ...result,
    filters
  }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Get search suggestions based on partial input
 */
export const getSearchSuggestions = async (partial: string): Promise<string[]> => {
  if (partial.length < 2) return []

  try {
    const { data } = await supabase
      .rpc('fast_search_all', {
        search_term: partial
      })

    if (!data) return []

    // Extract unique part numbers and brands
    const suggestions = new Set<string>()

    data.forEach((item: any) => {
      if (item.part_number?.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.add(item.part_number)
      }
      if (item.brand?.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.add(item.brand)
      }
    })

    return Array.from(suggestions).slice(0, 5)

  } catch (error) {
    console.error('Error getting suggestions:', error)
    return []
  }
}

/**
 * Test the search functions
 */
export const testSearch = async () => {
  console.log('🧪 Testing search functions...')

  // Test 1: General search
  console.log('\n📋 Test 1: General search for "cat6"')
  const test1 = await search('cat6')
  console.log(`Results: ${test1.totalFound} products in ${test1.searchTime}ms`)

  // Test 2: Brand search
  console.log('\n📋 Test 2: Brand search for "panduit"')
  const test2 = await search('panduit')
  console.log(`Results: ${test2.totalFound} products in ${test2.searchTime}ms`)

  // Test 3: Part number search
  console.log('\n📋 Test 3: Part number search for "7131100"')
  const test3 = await search('7131100')
  console.log(`Results: ${test3.totalFound} products in ${test3.searchTime}ms`)

  // Test 4: Rack unit search
  console.log('\n📋 Test 4: Search for "4RU"')
  const test4 = await search('4RU')
  console.log(`Results: ${test4.totalFound} products in ${test4.searchTime}ms`)

  console.log('\n✅ Tests complete!')
}

// ===================================================================
// EXPORTS
// ===================================================================

export default {
  search,
  searchAllTables,
  searchByBrand,
  searchByPartNumber,
  getSearchSuggestions,
  testSearch
}