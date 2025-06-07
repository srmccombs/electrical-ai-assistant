// src/services/simpleSearchService.ts
// Simple search service that uses your fast_search_all SQL function
// Perfect for beginners!

import { supabase } from '@/lib/supabase'

// What a product looks like
export interface Product {
  tableName: string
  partNumber: string
  brand: string
  description: string
}

// What search results look like
export interface SearchResult {
  products: Product[]
  searchTime: number
  error?: string
}

/**
 * Simple search - just calls your SQL function!
 */
export async function simpleSearchProducts(searchTerm: string): Promise<SearchResult> {
  const startTime = Date.now()

  try {
    console.log('🔍 Searching for:', searchTerm)

    // Call your SQL function
    const { data, error } = await supabase
      .rpc('fast_search_all', {
        search_term: searchTerm
      })

    if (error) {
      console.error('Search error:', error)
      return {
        products: [],
        searchTime: Date.now() - startTime,
        error: error.message
      }
    }

    // Format the results
    const products: Product[] = (data || []).map(item => ({
      tableName: item.table_name,
      partNumber: item.part_number,
      brand: item.brand,
      description: item.description
    }))

    console.log(`✅ Found ${products.length} products`)

    return {
      products,
      searchTime: Date.now() - startTime
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      products: [],
      searchTime: Date.now() - startTime,
      error: 'Search failed'
    }
  }
}

/**
 * Test the search
 */
export async function testSearch() {
  console.log('🧪 Testing search...')

  // Test 1: Cat6
  const test1 = await searchProducts('cat6')
  console.log('Cat6 results:', test1.products.length)

  // Test 2: Panduit
  const test2 = await searchProducts('panduit')
  console.log('Panduit results:', test2.products.length)

  // Test 3: Non-plenum
  const test3 = await searchProducts('non-plenum')
  console.log('Non-plenum results:', test3.products.length)

  console.log('✅ Tests complete!')
}

// Example usage in a React component:
/*
import { searchProducts } from '@/services/simpleSearchService'

// In your component:
const handleSearch = async (query: string) => {
  const results = await searchProducts(query)

  if (results.error) {
    console.error('Search failed:', results.error)
    return
  }

  console.log(`Found ${results.products.length} products in ${results.searchTime}ms`)
  // Update your UI with results.products
}
*/