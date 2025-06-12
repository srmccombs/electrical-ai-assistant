// src/search/fiberadapterPanels/fiberadapterPanelSearch.ts
// Enhanced Fiber Adapter Panel Search Implementation
// Date created: December 19, 2024

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'

// ===================================================================
// TYPE DEFINITIONS - Adapter Panel Specific
// ===================================================================

export interface AdapterPanelSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
  shoppingListContext?: {
    hasItems: boolean
    fiberEnclosures?: Array<{
      partNumber: string
      panelType: string
      brand: string
      description: string
    }>
  }
}

export interface AdapterPanelSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// DETECTION FUNCTIONS - Industry Knowledge for Adapter Panels
// ===================================================================

/**
 * Detect fiber type from search term with all synonyms
 */
const detectFiberType = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  // Singlemode synonyms
  if (term.includes('single') || term.includes('sm') ||
      term.includes('os1') || term.includes('os2') ||
      term.includes('singlemode') || term.includes('single-mode') ||
      term.includes('9/125')) {
    return 'SINGLEMODE'
  }

  // OM1 synonyms
  if (term.includes('om1') || term.includes('62.5') || term.includes('62.5/125')) {
    return 'OM1'
  }

  // OM3/OM4 synonyms
  if (term.includes('om3')) return 'OM3'
  if (term.includes('om4')) return 'OM4'
  if (term.includes('50/125') || term.includes('50um')) return 'OM3_OR_OM4'

  // OM5
  if (term.includes('om5')) return 'OM5'

  return undefined
}

/**
 * Detect connector type with all variations
 */
const detectConnectorType = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  // LC (most common, typically duplex)
  if (term.includes('lc')) return 'LC'

  // SC variations
  if (term.includes('sc')) return 'SC'

  // ST variations
  if (term.includes('st') && !term.includes('stock') && !term.includes('cost')) {
    return 'ST'
  }

  return undefined
}

/**
 * Detect adapter color
 */
const detectAdapterColor = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  if (term.includes('beige')) return 'Beige'
  if (term.includes('blue')) return 'Blue'
  if (term.includes('aqua')) return 'Aqua'
  if (term.includes('green')) return 'Green'

  return undefined
}

/**
 * Detect fiber count from search term
 */
const detectFiberCount = (searchTerm: string): number | undefined => {
  const patterns = [
    /(\d+)\s*(?:fiber|strand|port|fiber count)/i,
    /(\d+)\s*f\b/i,
    /(\d+)f\b/i
  ]

  for (const pattern of patterns) {
    const match = searchTerm.match(pattern)
    if (match && match[1]) {
      const count = parseInt(match[1], 10)
      if (count > 0 && count <= 144) { // Reasonable fiber count range
        return count
      }
    }
  }

  return undefined
}

/**
 * Detect panel type
 */
const detectPanelType = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  if (term.includes('cch')) return 'CCH'
  if (term.includes('rack')) return 'RACK'
  if (term.includes('wall')) return 'WALL'

  return undefined
}

/**
 * Detect termination type
 */
const detectTerminationType = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  if (term.includes('field') || term.includes('field-terminated')) return 'field-terminated'
  if (term.includes('fuse') || term.includes('fusion')) return 'fuse-on'

  return undefined
}

/**
 * Detect brand with synonyms
 */
const detectBrand = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  // Corning and its synonym Siecor
  if (term.includes('corning') || term.includes('siecor')) return 'Corning'
  if (term.includes('panduit')) return 'Panduit'
  if (term.includes('leviton')) return 'Leviton'
  if (term.includes('dmsi')) return 'DMSI'

  return undefined
}

// ===================================================================
// ADAPTER PANEL SEARCH IMPLEMENTATION
// ===================================================================

export const searchAdapterPanels = async (
  options: AdapterPanelSearchOptions
): Promise<AdapterPanelSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 50, shoppingListContext } = options

  console.log('🏠 ENHANCED ADAPTER PANELS SEARCH')
  console.log('🔍 Original search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)
  console.log('🛒 Shopping list context:', shoppingListContext)

  try {
    // Check for fiber enclosure compatibility from shopping list
    let requiredPanelTypes: string[] = []
    if (shoppingListContext?.hasItems && shoppingListContext.fiberEnclosures && shoppingListContext.fiberEnclosures.length > 0) {
      // Get all unique panel types from fiber enclosures in shopping list
      requiredPanelTypes = [...new Set(shoppingListContext.fiberEnclosures
        .map(enc => enc.panelType)
        .filter(pt => pt && pt.trim() !== ''))]
      
      console.log('🔗 COMPATIBILITY: Filtering for panel types from fiber enclosures:', requiredPanelTypes)
    }

    // Enhanced detection with all the knowledge you provided
    const detectedFiberType = detectFiberType(searchTerm) || aiAnalysis?.detectedSpecs?.fiberType
    const detectedConnectorType = detectConnectorType(searchTerm) || aiAnalysis?.detectedSpecs?.connectorType
    const detectedFiberCount = detectFiberCount(searchTerm) || aiAnalysis?.detectedSpecs?.fiberCount
    const detectedColor = detectAdapterColor(searchTerm)
    const detectedPanelType = detectPanelType(searchTerm)
    const detectedTerminationType = detectTerminationType(searchTerm)
    const detectedBrand = detectBrand(searchTerm)

    console.log('🎯 DETECTED ATTRIBUTES:', {
      fiberType: detectedFiberType,
      connectorType: detectedConnectorType,
      fiberCount: detectedFiberCount,
      color: detectedColor,
      panelType: detectedPanelType,
      terminationType: detectedTerminationType,
      brand: detectedBrand
    })

    let query = supabase
      .from('adapter_panels')
      .select('*')
      .eq('is_active', true)
      .limit(limit)

    const searchConditions: string[] = []

    // 1. Part number search (including partial matches)
    const partNumberPattern = searchTerm.trim().toUpperCase()
    if (partNumberPattern.length >= 3) {
      searchConditions.push(`part_number.ilike.${partNumberPattern}%`)
      console.log(`🔢 Adding part number prefix search: ${partNumberPattern}`)
    } else {
      searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    }

    // 2. Brand search with synonyms
    if (detectedBrand) {
      if (detectedBrand === 'Corning') {
        // Handle Corning/Siecor synonym
        searchConditions.push(`brand.ilike.%Corning%`)
        searchConditions.push(`brand.ilike.%Siecor%`)
        console.log(`🏢 Adding brand filter: Corning/Siecor`)
      } else {
        searchConditions.push(`brand.ilike.%${detectedBrand}%`)
        console.log(`🏢 Adding brand filter: ${detectedBrand}`)
      }
    }

    // 3. Fiber type search with all variations
    if (detectedFiberType) {
      switch (detectedFiberType) {
        case 'SINGLEMODE':
          searchConditions.push(`fiber_category.ilike.%OS2%`)
          searchConditions.push(`fiber_category.ilike.%OS1%`)
          searchConditions.push(`fiber_category.ilike.%SM%`)
          searchConditions.push(`fiber_category.ilike.%Single%`)
          searchConditions.push(`short_description.ilike.%singlemode%`)
          searchConditions.push(`short_description.ilike.%single-mode%`)
          searchConditions.push(`short_description.ilike.%9/125%`)
          console.log(`🌈 Adding singlemode fiber filters`)
          break
        case 'OM1':
          searchConditions.push(`fiber_category.ilike.%OM1%`)
          searchConditions.push(`short_description.ilike.%62.5%`)
          console.log(`🌈 Adding OM1 fiber filters`)
          break
        case 'OM3':
          searchConditions.push(`fiber_category.ilike.%OM3%`)
          console.log(`🌈 Adding OM3 fiber filter`)
          break
        case 'OM4':
          searchConditions.push(`fiber_category.ilike.%OM4%`)
          console.log(`🌈 Adding OM4 fiber filter`)
          break
        case 'OM3_OR_OM4':
          searchConditions.push(`fiber_category.ilike.%OM3%`)
          searchConditions.push(`fiber_category.ilike.%OM4%`)
          searchConditions.push(`short_description.ilike.%50/125%`)
          console.log(`🌈 Adding OM3/OM4 fiber filters`)
          break
        default:
          searchConditions.push(`fiber_category.ilike.%${detectedFiberType}%`)
      }
    }

    // 4. Connector type search with variations
    if (detectedConnectorType) {
      searchConditions.push(`connector_type.ilike.%${detectedConnectorType}%`)
      searchConditions.push(`short_description.ilike.%${detectedConnectorType}%`)

      // Add variations for ST
      if (detectedConnectorType === 'ST') {
        searchConditions.push(`connector_type.ilike.%ST Simplex%`)
      }
      console.log(`🔌 Adding connector type filter: ${detectedConnectorType}`)
    }

    // 5. Fiber count search
    if (detectedFiberCount) {
      searchConditions.push(`fiber_count.eq.${detectedFiberCount}`)
      console.log(`🧶 Adding fiber count filter: ${detectedFiberCount}`)
    }

    // 6. Color search
    if (detectedColor) {
      searchConditions.push(`adapter_color.ilike.%${detectedColor}%`)
      console.log(`🎨 Adding color filter: ${detectedColor}`)
    }

    // 7. Panel type search (prioritize shopping list compatibility)
    if (requiredPanelTypes.length > 0) {
      // If we have fiber enclosures in shopping list, ONLY show compatible panels
      const panelTypeConditions = requiredPanelTypes.map(pt => `panel_type.ilike.%${pt}%`)
      searchConditions.push(...panelTypeConditions)
      console.log(`🔗 Adding panel type filters from shopping list: ${requiredPanelTypes.join(', ')}`)
    } else if (detectedPanelType) {
      // Otherwise use detected panel type from search term
      searchConditions.push(`panel_type.ilike.%${detectedPanelType}%`)
      console.log(`📦 Adding detected panel type filter: ${detectedPanelType}`)
    }

    // 8. Termination type search
    if (detectedTerminationType) {
      searchConditions.push(`termination_type.ilike.%${detectedTerminationType}%`)
      console.log(`🔧 Adding termination type filter: ${detectedTerminationType}`)
    }

    // 9. General search terms
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`common_terms.ilike.%${searchTerm}%`)

    // 10. Add specific adapter panel keywords
    const panelKeywords = ['adapter', 'panel', 'coupling', 'patch', 'fiber', 'enclosure', 'cassette']
    const hasKeywords = panelKeywords.some(kw => searchTerm.toLowerCase().includes(kw))

    if (hasKeywords) {
      const keywordConditions = panelKeywords.map(kw =>
        `short_description.ilike.%${kw}%`
      ).join(',')
      searchConditions.push(...keywordConditions.split(','))
    }

    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
      console.log(`🚀 Applying ${searchConditions.length} search conditions`)
    }

    const result = await query
    
    if (result.error) {
      console.error('❌ Adapter panel search error:', result.error)
      const endTime = performance.now()
      return {
        products: [],
        searchStrategy: 'error',
        totalFound: 0,
        searchTime: Math.round(endTime - startTime)
      }
    }
    
    console.log(`📊 Adapter panel search result: ${result.data?.length || 0} products found`)

    if (result.data && result.data.length > 0) {
      // Post-process results for better relevance
      let processedResults = result.data

      // Filter by specific attributes if detected
      if (detectedFiberType === 'SINGLEMODE') {
        processedResults = processedResults.filter((item: any) => {
          const fiberCat = item.fiber_category?.toLowerCase() || ''
          const desc = item.short_description?.toLowerCase() || ''
          return fiberCat.includes('os') || fiberCat.includes('sm') ||
                 desc.includes('single') || desc.includes('9/125')
        })
      }
      
      // Apply compatibility filtering if we have fiber enclosures in shopping list
      if (requiredPanelTypes.length > 0) {
        console.log(`🔗 Post-filtering ${processedResults.length} results for panel type compatibility`)
        processedResults = processedResults.filter((item: any) => {
          const itemPanelType = item.panel_type?.toUpperCase() || ''
          return requiredPanelTypes.some(reqType => 
            itemPanelType.includes(reqType.toUpperCase())
          )
        })
        console.log(`🔗 After compatibility filter: ${processedResults.length} results`)
      }

      const endTime = performance.now()
      return {
        products: formatPanelResults(processedResults, 'adapter_panel_match'),
        searchStrategy: 'adapter_panel_match',
        totalFound: processedResults.length,
        searchTime: Math.round(endTime - startTime)
      }
    }

    console.log('❌ No adapter panel results found')
    const endTime = performance.now()
    return {
      products: [],
      searchStrategy: 'no_results',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }

  } catch (error) {
    console.error('❌ Error in searchAdapterPanels:', error)
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

const formatPanelResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} ADAPTER PANEL RESULTS (${searchType})`)

  return data.map((item: any) => ({
    id: `panel-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: Math.random() * 200 + 75,
    stockLocal: 10,
    stockDistribution: 100,
    leadTime: 'Ships Today',
    category: 'Adapter Panel',
    // Enhanced attributes from your database
    connectorType: item.connector_type?.trim() || undefined,
    fiberType: item.fiber_category?.trim() || undefined,
    fiberCount: item.fiber_count || undefined,
    panelType: item.panel_type?.trim() || undefined,
    productLine: item.product_line?.trim() || undefined,
    adaptersPerPanel: item.number_of_adapter_per_panel || undefined,
    adapterColor: item.adapter_color?.trim() || undefined,
    terminationType: item.termination_type?.trim() || undefined,
    possibleEquivalent: item.possible_equivalent?.trim() || undefined,
    compatibleEnclosures: item.compatible_enclosures?.trim() || undefined,
    commonTerms: item.common_terms?.trim() || undefined,
    supportsAPC: item.supports_apc || false,
    searchRelevance: 1.0,
    tableName: 'adapter_panels',
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }))
}

export const generateAdapterPanelFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  // Type-safe extraction with proper undefined handling
  const panelProducts = products.filter(p => p.tableName === 'adapter_panels')

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    connectorTypes: filterString(products.map(p => p.connectorType)).slice(0, 6),
    fiberTypes: filterString(products.map(p => p.fiberType)).slice(0, 6),
    fiberCounts: filterString(products.map(p => p.fiberCount?.toString())).slice(0, 6),
    panelTypes: filterString(panelProducts.map(p => p.panelType)).slice(0, 4),
    colors: filterString(panelProducts.map(p => p.adapterColor)).slice(0, 6),
    terminationTypes: filterString(panelProducts.map(p => p.terminationType)).slice(0, 4)
  }
}