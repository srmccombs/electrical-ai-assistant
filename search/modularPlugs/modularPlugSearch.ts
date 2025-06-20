// src/search/modularPlugs/modularPlugSearch.ts
// Modular Plug Search Implementation - RJ45 Connectors, Terminators, Network Plugs
// Handles all category ratings, shielding types, AWG sizes, and packaging options

import { supabase } from '@/lib/supabase'
import {
  detectCategoryRating,
  detectShielding,
  detectBrand,
  normalizePartNumber
} from '../shared/industryKnowledge'

// Import Product and AISearchAnalysis types
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'
import type { ModularPlugRow } from '@/search/shared/types'

// ===================================================================
// TYPE DEFINITIONS - Modular Plug Specific
// ===================================================================

export interface ModularPlugSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface ModularPlugSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// COMPREHENSIVE SEARCH TERMS - All variations of modular plugs
// ===================================================================

const MODULAR_PLUG_SEARCH_TERMS = {
  // Primary Terms
  primary: [
    'modular plug', 'modular plugs', 'MODULAR PLUG', 'MODULAR PLUGS',
    'rj45', 'RJ45', 'rj-45', 'RJ-45', 'rj 45', 'RJ 45',
    '8p8c', '8P8C', '8-p-8-c', '8-P-8-C', '8p/8c', '8P/8C',
    'ethernet connector', 'ETHERNET CONNECTOR', 'ethernet connectors',
    'network plug', 'NETWORK PLUG', 'network plugs',
    'ethernet plug', 'ETHERNET PLUG', 'ethernet plugs',
    'network connector', 'NETWORK CONNECTOR', 'network connectors',
    'modular connector', 'MODULAR CONNECTOR', 'modular connectors',
    'crimp connector', 'CRIMP CONNECTOR', 'crimp connectors',
    'terminator plug', 'TERMINATOR PLUG', 'terminator plugs',
    'plug connector', 'PLUG CONNECTOR', 'plug connectors',
    'data connector', 'DATA CONNECTOR', 'data connectors',
    'lan connector', 'LAN CONNECTOR', 'lan connectors',
    'crystal connector', 'CRYSTAL CONNECTOR', 'crystal connectors',
    'termination plug', 'TERMINATION PLUG', 'termination plugs',
    'network termination', 'NETWORK TERMINATION',
    'cable connector', 'CABLE CONNECTOR', 'cable connectors',
    'patch connector', 'PATCH CONNECTOR', 'patch connectors'
  ],

  // Common Misspellings
  misspellings: [
    'rg45', 'RG45', 'rj54', 'RJ54', 'r45', 'R45',
    'rj-45s', 'RJ-45S', 'rj45s', 'RJ45S',
    'rj11', 'RJ11', // Often confused
    '8p-8c', '8P-8C', '8p8-c', '8P8-C',
    'rj455', 'RJ455', 'rj-455', 'RJ-455',
    'rj-54', 'RJ-54', 'r-45', 'R-45'
  ],

  // Industry Slang
  slang: [
    'network terminator', 'cable end', 'crimp end', 'cat plug',
    'data plug', 'lan plug', 'computer plug', 'internet plug',
    'patch plug', 'terminal plug', 'cable terminator', 'jack plug',
    'crystal head', 'end plug', 'wire plug', 'net plug',
    'cable tip', 'data tip', 'crimp-on connector', 'network crimp',
    'cable crimp', 'patch end', 'cable connector end',
    'network cable end', 'ethernet terminator', 'rj terminator',
    '8-position connector', 'crimp on', 'crimps'
  ],

  // Type-Specific Terms
  typeSpecific: [
    'pass-through plug', 'pass-thru plug', 'passthrough plug',
    'ez-rj45', 'EZ-RJ45', 'ez rj45', 'EZ RJ45', 'ez plug',
    'field termination plug', 'field term plug',
    'toolless plug', 'tool-less connector',
    'shielded plug', 'stp plug', 'STP plug',
    'unshielded plug', 'utp plug', 'UTP plug',
    'load bar plug', 'two-piece plug', 'standard plug',
    'non-pass-through plug', 'snagless plug', 'booted plug',
    'inline plug', 'feed-through plug', 'feedthrough plug',
    'poe plug', 'POE plug', 'poe compatible plug',
    'cap45', 'CAP45', 'with cap45'
  ],

  // Category-Specific
  categorySpecific: [
    'cat5e plug', 'cat6 plug', 'cat6a plug', 'cat7 plug',
    'category 5e plug', 'category 6 plug', 'category 6a plug',
    'cat5e connector', 'cat6 connector', 'cat6a connector',
    'cat5e terminator', 'cat6 terminator', 'cat6a terminator',
    'cat8 plug', 'category 8 plug', 'cat8 connector'
  ],

  // AWG-Specific
  awgSpecific: [
    '23 awg plug', '24 awg plug', '23awg plug', '24awg plug',
    '23 awg connector', '24 awg connector',
    '23awg', '24awg', '23 gauge', '24 gauge'
  ],

  // Action-Based Queries
  actionBased: [
    'need to crimp cables', 'need network ends',
    'need to terminate ethernet', 'looking for cable crimps',
    'need connector plugs', 'want to make patch cords',
    'terminate network cables', 'crimp ethernet cables',
    'build network cables', 'install rj45 connectors',
    'make ethernet cables', 'wire up plugs',
    'crimp cables', 'terminate cables', 'make cables'
  ],

  // Quantity/Packaging Terms
  packaging: [
    'box of rj45s', 'bag of plugs', '1 pack terminators',
    'bulk modular plugs', 'pack of rj45', '5 pack plugs',
    'jar of connectors', 'case of terminators',
    'jar pack', 'clamshell pack', 'contractor pack',
    '2 pack', '5 pack', '1 pack', '5 pack',
    'bulk pack', 'bulk plugs', 'bulk connectors'
  ]
}

// ===================================================================
// DETECTION FUNCTIONS - Specific to modular plugs
// ===================================================================

// Detect AWG size from search term
function detectAWGSize(searchTerm: string): string | null {
  const awgPattern = /\b(23|24)\s*awg\b|\bawg\s*(23|24)\b|(?:^|\s)(23|24)awg\b/i
  const match = searchTerm.match(awgPattern)
  
  if (match) {
    return match[1] || match[2] || match[3]
  }
  
  return null
}

// Detect packaging quantity
function detectPackagingQty(searchTerm: string): number | null {
  const qtyPattern = /\b(\d+)\s*(?:pack|pc|pcs|piece|count|jar|box)\b|(?:pack|jar|box)\s*of\s*(\d+)\b/i
  const match = searchTerm.match(qtyPattern)
  
  if (match) {
    const qty = parseInt(match[1] || match[2])
    // Common packaging quantities
    if ([2, 5, 1, 5].includes(qty)) {
      return qty
    }
  }
  
  return null
}

// Detect pass-through/feed-through type
function detectPassThrough(searchTerm: string): boolean {
  const passThroughTerms = [
    'pass-through', 'pass through', 'passthrough', 'pass-thru', 'pass thru',
    'feed-through', 'feed through', 'feedthrough', 'feed-thru',
    'ez-rj45', 'ez rj45', 'ezrj45', 'ez plug', 'poe feed-through'
  ]
  
  const lowerTerm = searchTerm.toLowerCase()
  return passThroughTerms.some(term => lowerTerm.includes(term))
}

// Detect product line
function detectProductLine(searchTerm: string): string | null {
  if (/pro\s*series|proseries/i.test(searchTerm)) {
    return 'Simply 45 PRO SERIES'
  }
  if (/installer\s*series|installerseries/i.test(searchTerm)) {
    return 'Simply 45 INSTALLER SERIES'
  }
  return null
}

// Check if search term contains modular plug keywords
function isModularPlugSearch(searchTerm: string): boolean {
  const lowerTerm = searchTerm.toLowerCase()
  
  // Check all term categories
  const allTerms = [
    ...MODULAR_PLUG_SEARCH_TERMS.primary,
    ...MODULAR_PLUG_SEARCH_TERMS.misspellings,
    ...MODULAR_PLUG_SEARCH_TERMS.slang,
    ...MODULAR_PLUG_SEARCH_TERMS.typeSpecific,
    ...MODULAR_PLUG_SEARCH_TERMS.categorySpecific,
    ...MODULAR_PLUG_SEARCH_TERMS.awgSpecific,
    ...MODULAR_PLUG_SEARCH_TERMS.actionBased,
    ...MODULAR_PLUG_SEARCH_TERMS.packaging
  ]
  
  return allTerms.some(term => {
    const termLower = term.toLowerCase()
    return lowerTerm.includes(termLower) || 
           lowerTerm.split(/\s+/).some(word => word === termLower)
  })
}

// ===================================================================
// MAIN SEARCH FUNCTION
// ===================================================================

export async function searchModularPlugs(
  options: ModularPlugSearchOptions
): Promise<ModularPlugSearchResult> {
  const startTime = Date.now()
  const { searchTerm: rawSearchTerm, aiAnalysis, limit = 5 } = options
  
  // Trim the search term to avoid issues with trailing spaces
  const searchTerm = rawSearchTerm.trim()

  console.log('🔌 MODULAR PLUG SEARCH CALLED!')
  console.log('🔍 Search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis)

  try {
    // Build search parameters
    const searchParams = {
      categoryRating: detectCategoryRating(searchTerm) || aiAnalysis?.detectedSpecs?.categoryRating,
      shieldingType: detectShielding(searchTerm) || aiAnalysis?.detectedSpecs?.shielding,
      awgSize: detectAWGSize(searchTerm),
      packagingQty: detectPackagingQty(searchTerm),
      passThrough: detectPassThrough(searchTerm),
      productLine: detectProductLine(searchTerm),
      brand: detectBrand(searchTerm),
      partNumber: normalizePartNumber(searchTerm)
    }

    // Log search parameters
    console.log('Modular Plug Search Parameters:', searchParams)
    
    // Debug: Check actual values
    console.log('Debug - Actual filter values:', {
      categoryRating: searchParams.categoryRating || 'NONE',
      shieldingType: searchParams.shieldingType || 'NONE', 
      awgSize: searchParams.awgSize || 'NONE',
      packagingQty: searchParams.packagingQty || 'NONE',
      passThrough: searchParams.passThrough || 'NONE',
      productLine: searchParams.productLine || 'NONE',
      brand: searchParams.brand || 'NONE',
      partNumber: searchParams.partNumber || 'NONE'
    })

    // Start building query
    let query = supabase
      .from('prod_modular_plugs')
      .select('*')
      .eq('is_active', true)
      .order('brand', { ascending: true })
      .order('part_number', { ascending: true })
      .limit(limit)

    // Check if this is a generic modular plug search first
    const lowerTerm = searchTerm.toLowerCase()
    const isGenericSearch = lowerTerm.includes('modular plug') || 
                           lowerTerm.includes('modluar plug') ||
                           lowerTerm.includes('modular plugs') ||
                           lowerTerm.includes('cable ends') ||
                           lowerTerm.includes('clear ends') ||
                           lowerTerm.includes('cable end') ||
                           lowerTerm.includes('rj45 plug') ||
                           lowerTerm.includes('rj-45 plug') ||
                           lowerTerm === 'plugs' ||
                           lowerTerm === 'plug' ||
                           lowerTerm === 'rj45 plugs' ||
                           lowerTerm === 'rj-45 plugs'
    
    if (isGenericSearch) {
      console.log('✅ Generic modular plug search detected - returning all active products')
      // Don't apply any filters - just return all active modular plugs
      // The base query already filters for is_active = true
    } else {
      // Apply filters based on detected parameters
      
      // 1. Part number search (highest priority)
      if (searchParams.partNumber) {
        query = query.or(
          `part_number.ilike.%${searchParams.partNumber}%,` +
          `part_number.ilike.%${searchParams.partNumber.replace(/-/g, '')}%`
        )
      }
      // 2. Category rating filter
      else if (searchParams.categoryRating) {
        // Use contains for array field
        query = query.contains('category_rating', [searchParams.categoryRating])
      }

      // 3. Additional filters (can be combined)
      if (searchParams.shieldingType) {
        query = query.eq('shielding_type', searchParams.shieldingType)
      }

      if (searchParams.awgSize) {
        query = query.eq('conductor_awg', searchParams.awgSize)
      }

      if (searchParams.packagingQty) {
        query = query.eq('packaging_qty', searchParams.packagingQty)
      }

      if (searchParams.productLine) {
        query = query.eq('product_line', searchParams.productLine)
      }

      if (searchParams.brand) {
        query = query.ilike('brand', `%${searchParams.brand}%`)
      }

      // 4. If no specific filters were applied, use text search
      const hasFilters = !!(searchParams.partNumber || searchParams.categoryRating || 
          searchParams.shieldingType || searchParams.awgSize || 
          searchParams.packagingQty || searchParams.productLine || 
          searchParams.brand || (searchParams.passThrough === true))
          
      if (!hasFilters) {
        console.log('🔍 No specific filters detected, using text search')
        
        // For specific searches like "rj45", search in description
        if (lowerTerm.includes('rj45') || 
            lowerTerm.includes('rj-45') ||
            lowerTerm.includes('crimp') ||
            lowerTerm.includes('connector') ||
            lowerTerm.includes('plug')) {
          console.log('🔍 Searching for RJ45/connector/plug terms in descriptions')
          // Search for any of these terms in the description
          query = query.or(
            `short_description.ilike.%RJ45%,` +
            `short_description.ilike.%RJ-45%,` +
            `short_description.ilike.%plug%,` +
            `short_description.ilike.%Plug%,` +
            `short_description.ilike.%modular%`
          )
        }
        // For other searches, use broader text search
        else {
          const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 2)
          if (searchWords.length > 0) {
            console.log('🔍 Text search for words:', searchWords)
            // Search in short_description for any of the words
            const orConditions = searchWords.map(word => 
              `short_description.ilike.%${word}%`
            ).join(',')
            
            query = query.or(orConditions)
          }
        }
      } else {
        console.log('🔍 Using specific filters:', searchParams)
      }
    }

    // Execute query
    console.log('🔍 Executing Supabase query for modular plugs...')
    const { data, error, count } = await query

    if (error) {
      console.error('Modular plug search error:', error)
      throw error
    }

    console.log(`📊 Query results: ${data?.length || 0} products found`)
    
    // Check if table is empty
    if (!data || data.length === 0) {
      console.warn('⚠️ No modular plugs found. Possible reasons:')
      console.warn('   1. Table is empty - CSV data needs to be imported')
      console.warn('   2. All products are inactive (is_active = false)')
      console.warn('   3. Search filters are too restrictive')
      
      // Quick check for table data
      const checkQuery = await supabase
        .from('prod_modular_plugs')
        .select('count', { count: 'exact', head: true })
      
      console.log(`   Total records in table: ${checkQuery.count || 0}`)
    }

    const products = ((data as unknown as ModularPlugRow[]) || []).map(item => ({
      // Core Product fields with proper mapping
      id: `plug-${item.id}`,
      partNumber: item.part_number || 'No Part Number',
      brand: item.brand || 'Unknown Brand',
      description: item.short_description || 'No description available',
      price: parseFloat(item.unit_price || '') || Math.random() * 5 + 1, // Default price if not available
      stockLocal: item.stock_quantity || 0,
      stockDistribution: 1,
      leadTime: 'Ships Today',
      searchRelevance: 1.0,
      tableName: 'modular_plugs' as const,
      table: 'modular_plugs' as const,
      
      // Stock status
      stockStatus: 'in_stock' as const,
      stockColor: 'green',
      stockMessage: 'In Stock - Ships Today',
      
      // Modular plug specific fields
      category: 'Modular Plug',
      categoryRating: item.category_rating,
      shielding: item.shielding_type,
      conductorAwg: item.conductor_awg,
      packagingQty: item.packaging_qty,
      productLine: item.product_line,
      
      // Additional fields
      commonTerms: item.common_terms,
      possibleEquivalent: item.compatible_boots
    }))

    // Build search strategy description
    let searchStrategy = 'Modular Plug Search'
    if (searchParams.partNumber) {
      searchStrategy = `Part Number: ${searchParams.partNumber}`
    } else if (searchParams.categoryRating) {
      searchStrategy = `Category: ${searchParams.categoryRating}`
      if (searchParams.shieldingType) searchStrategy += ` ${searchParams.shieldingType}`
      if (searchParams.awgSize) searchStrategy += ` ${searchParams.awgSize}AWG`
    } else if (searchParams.brand) {
      searchStrategy = `Brand: ${searchParams.brand}`
    }

    return {
      products: products as Product[],
      searchStrategy,
      totalFound: products.length,
      searchTime: Date.now() - startTime
    }

  } catch (error) {
    console.error('Error in searchModularPlugs:', error)
    return {
      products: [],
      searchStrategy: 'Error',
      totalFound: 0,
      searchTime: Date.now() - startTime
    }
  }
}

// ===================================================================
// FILTER GENERATION - Create smart filters from results
// ===================================================================

export function generateModularPlugFilters(products: Product[]): any {
  const filters: any = {}

  // Category Rating filter
  const categories = new Set<string>()
  products.forEach(product => {
    const categoryRating = product.categoryRating
    if (Array.isArray(categoryRating)) {
      categoryRating.forEach(cat => {
        if (cat) categories.add(cat)
      })
    }
  })
  if (categories.size > 0) {
    filters['Category Rating'] = Array.from(categories).sort()
  }

  // Shielding Type filter
  const shieldingTypes = new Set<string>()
  products.forEach(product => {
    if (product.shielding) {
      shieldingTypes.add(product.shielding)
    }
  })
  if (shieldingTypes.size > 1) {
    filters['Shielding'] = Array.from(shieldingTypes).sort()
  }

  // AWG filter
  const awgSizes = new Set<string>()
  products.forEach(product => {
    if (product.conductorAwg) {
      awgSizes.add(product.conductorAwg.toString())
    }
  })
  if (awgSizes.size > 1) {
    filters['AWG'] = Array.from(awgSizes).sort()
  }

  // Packaging Quantity filter
  const packagingQtys = new Set<number>()
  products.forEach(product => {
    if ((product as any).packagingQty) {
      packagingQtys.add((product as any).packagingQty)
    }
  })
  if (packagingQtys.size > 1) {
    filters['Pack Size'] = Array.from(packagingQtys).sort((a, b) => a - b)
  }

  // Product Line filter
  const productLines = new Set<string>()
  products.forEach(product => {
    if (product.productLine) {
      productLines.add(product.productLine)
    }
  })
  if (productLines.size > 1) {
    filters['Product Line'] = Array.from(productLines).sort()
  }

  // Brand filter
  const brands = new Set<string>()
  products.forEach(product => {
    if (product.brand) {
      brands.add(product.brand)
    }
  })
  if (brands.size > 1) {
    filters['Brand'] = Array.from(brands).sort()
  }

  return filters
}

// Export search terms for use in other modules
export { MODULAR_PLUG_SEARCH_TERMS, isModularPlugSearch }