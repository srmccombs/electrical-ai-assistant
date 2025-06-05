// src/services/searchService.ts
// FIXED VERSION - Now properly imports and uses actual search implementations
// Update: Added fiber connector and fiber cable search implementations
// Update: Added adapter panel fields to Product interface
// Update: Added fiber enclosure search implementation - December 19, 2024
// Update: Fixed fiber enclosure detection and AI routing - June 5, 2025
// Update: Enhanced debugging and brand filtering - June 5, 2025
// Update: Added dynamic table discovery - June 5, 2025

import { supabase } from '@/lib/supabase'
import { searchAllTablesForPartNumber } from '@/search/shared/tableDiscoveryService'

// Import the actual search implementations
import {
  searchCategoryCables as searchCategoryCablesImpl,
  type CategoryCableSearchResult
} from '@/search/categoryCables/categoryCableSearch'

import {
  searchFiberConnectors as searchFiberConnectorsImpl,
  type FiberConnectorSearchResult
} from '@/search/fiberConnectors/fiberConnectorSearch'

import {
  searchFiberCables as searchFiberCablesImpl,
  type FiberCableSearchResult
} from '@/search/fiberCables/fiberCableSearch'

import {
  searchAdapterPanels as searchAdapterPanelsImpl,
  generateAdapterPanelFilters,
  type AdapterPanelSearchResult
} from '@/search/fiberadapterPanels/fiberadapterPanelSearch'

import {
  searchRackMountFiberEnclosures as searchRackMountFiberEnclosuresImpl,
  generateFiberEnclosureFilters,
  type FiberEnclosureSearchResult
} from '@/search/fiberenclosure/rack_mount_fiber_enclosure_Search'

// Import shared industry knowledge
import {
  validateElectricalQuery,
  applyBusinessRules,
  detectPartNumbers,
  normalizePartNumber,
  type ValidationResult,
  type BusinessRuleResult,
  type DetectedParts
} from '@/search/shared/industryKnowledge'

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
  fiberType?: string
  jacketRating?: string
  fiberCount?: number
  connectorType?: string
  categoryRating?: string
  shielding?: string
  searchRelevance?: number
  tableName?: string
  packagingType?: string
  color?: string
  stockStatus?: string
  stockColor?: string
  stockMessage?: string
  productLine?: string
  pairCount?: string
  conductorAwg?: number
  jacketColor?: string
  cableDiameter?: number
  application?: string
  possibleCross?: string
  commonTerms?: string
  compatibleConnectors?: string
  goWithItems?: string
  productType?: string
  technology?: string
  polish?: string
  housingColor?: string
  bootColor?: string
  ferruleMaterial?: string
  // Adapter Panel specific fields
  panelType?: string
  adaptersPerPanel?: number
  adapterColor?: string
  terminationType?: string
  possibleEquivalent?: string
  compatibleEnclosures?: string
  supportsAPC?: boolean
  // NEW: Fiber Enclosure specific fields
  mountType?: string
  rackUnits?: number
  panelCapacity?: number
  material?: string
  supportsSpliceTrays?: boolean
  environment?: string
  spliceTrayModel?: string
  upcCode?: string
}

export interface SmartFilters {
  brands: string[]
  packagingTypes: string[]
  jacketRatings: string[]
  fiberTypes: string[]
  connectorTypes: string[]
  categoryRatings: string[]
  colors: string[]
  shieldingTypes: string[]
  productLines: string[]
  pairCounts: string[]
  conductorGauges: string[]
  applications: string[]
  productType: string
  productTypes: string[]
  technologies: string[]
  polishTypes: string[]
  housingColors: string[]
  bootColors: string[]
  // Adapter Panel filters
  panelTypes?: string[]
  terminationTypes?: string[]
  adapterColors?: string[]
  // NEW: Fiber Enclosure filters
  rackUnits?: string[]
  environments?: string[]
  mountTypes?: string[]
}

export interface AISearchAnalysis {
  searchStrategy: string
  productType: string
  confidence: number
  detectedSpecs: {
    fiberType?: string
    categoryRating?: string
    connectorType?: string
    jacketRating?: string
    fiberCount?: number
    requestedQuantity?: number
    shielding?: string
    manufacturer?: string
    productType?: string
    color?: string
    application?: string
    productLine?: string
    pairCount?: string
    conductorAwg?: number
    rackUnits?: number
    panelType?: string
    environment?: string
  }
  searchTerms: string[]
  reasoning: string
  suggestedFilters: string[]
  alternativeQueries: string[]
  originalQuery: string
  timestamp: string
  aiModel: string
}

export interface SearchResult {
  products: Product[]
  searchTime: number
  searchType: string
  aiAnalysis?: AISearchAnalysis
  redirectMessage?: string
  totalFound?: number
  smartFilters?: SmartFilters
}

export interface SearchOptions {
  query: string
  limit?: number
  includeAI?: boolean
}

// Re-export types from industry knowledge
export type { ValidationResult, BusinessRuleResult, DetectedParts }

// ===================================================================
// AI INTEGRATION - ENHANCED WITH RACK UNIT DETECTION
// ===================================================================

/**
 * Enhanced AI specs detection with rack unit parsing
 */
const enhanceAIAnalysis = (aiAnalysis: AISearchAnalysis | null, searchTerm: string): AISearchAnalysis | null => {
  if (!aiAnalysis) return null

  const term = searchTerm.toLowerCase()
  let wasEnhanced = false

  // Detect rack units if AI missed it
  if (!aiAnalysis.detectedSpecs.rackUnits) {
    const ruPatterns = [
      /(\d+)\s*ru\b/i,
      /(\d+)\s*rack\s*unit/i,
      /(\d+)u\b/i
    ]

    for (const pattern of ruPatterns) {
      const match = term.match(pattern)
      if (match && match[1]) {
        const units = parseInt(match[1], 10)
        if (units >= 1 && units <= 48) {
          console.log(`🔧 Enhanced AI: Detected rack units: ${units}RU`)
          aiAnalysis.detectedSpecs.rackUnits = units
          wasEnhanced = true
          break
        }
      }
    }
  }

  // Fix product type if it says MIXED/PANEL but query has enclosure
  if (term.includes('enclosure') && (aiAnalysis.productType === 'MIXED' || aiAnalysis.productType === 'PANEL')) {
    console.log(`🔧 Enhanced AI: Correcting productType from ${aiAnalysis.productType} to ENCLOSURE`)
    aiAnalysis.productType = 'ENCLOSURE'
    wasEnhanced = true
  }

  // Force enclosure type if we have RU units
  if (aiAnalysis.detectedSpecs.rackUnits && aiAnalysis.productType !== 'ENCLOSURE') {
    console.log(`🔧 Enhanced AI: Forcing productType to ENCLOSURE due to rack units`)
    aiAnalysis.productType = 'ENCLOSURE'
    wasEnhanced = true
  }

  if (wasEnhanced) {
    console.log('✅ ENHANCED AI Analysis:', aiAnalysis)
  }

  return aiAnalysis
}

/**
 * Get AI analysis for search query
 */
const getAIAnalysis = async (query: string): Promise<AISearchAnalysis | null> => {
  try {
    console.log('🤖 Getting AI analysis for:', query)

    const response = await fetch('/api/ai-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        userContext: {
          businessType: 'electrical_distributor'
        }
      }),
    })

    const data = await response.json()

    if (data.success && data.analysis) {
      console.log('✅ AI analysis received:', data.analysis)
      // Enhance the AI analysis with additional detection
      const enhanced = enhanceAIAnalysis(data.analysis, query)
      return enhanced
    } else {
      console.warn('⚠️ AI analysis failed, using fallback')
      return data.fallback || null
    }
  } catch (error) {
    console.error('❌ AI analysis error:', error)
    return null
  }
}

// ===================================================================
// PART NUMBER SEARCH - Dynamic Implementation with Fallback
// ===================================================================

const searchByPartNumber = async (partNumbers: string[], quantity?: number): Promise<Product[]> => {
  console.log('🔢 PART NUMBER SEARCH (Dynamic)')
  console.log('🔍 Searching for part numbers:', partNumbers)

  try {
    // Use the dynamic table discovery service
    const searchResults = await searchAllTablesForPartNumber(partNumbers, 200)

    console.log(`🔍 Dynamic search found ${searchResults.length} raw results`)

    // Convert to standard Product format
    const products: Product[] = searchResults.map((item: any) => {
      // Determine category based on table name
      const category = determineCategoryFromTable(item._tableName)

      return {
        id: `${item._tablePrefix}-${item.id}`,
        partNumber: item.part_number?.toString() || 'No Part Number',
        brand: item.brand?.trim() || 'Unknown Brand',
        description: item.short_description?.trim() || 'No description available',
        price: parseFloat(item.unit_price || '0') || Math.random() * 200 + 50,
        stockLocal: item.stock_quantity || 0,
        stockDistribution: 100,
        leadTime: 'Ships Today',
        category: category,
        searchRelevance: 1.0,
        tableName: item._tableName,
        stockStatus: 'not_in_stock',
        stockColor: 'red',
        stockMessage: 'Not currently in stock - contact for availability',

        // Add table-specific fields dynamically
        ...(item._tableName === 'category_cables' && {
          categoryRating: item.category_rating?.trim() || undefined,
          jacketRating: item.jacket_material?.trim() || undefined,
          color: item.jacket_color?.trim() || undefined,
          shielding: item.Shielding_Type?.trim() || undefined,
          productLine: item.product_line?.trim() || undefined,
          pairCount: item.pair_count?.trim() || undefined,
          conductorAwg: item.conductor_awg || undefined,
          jacketColor: item.jacket_color?.trim() || undefined,
          cableDiameter: item.cable_diameter_in || undefined,
          possibleCross: item.possible_cross?.trim() || undefined
        }),

        ...(item._tableName === 'fiber_connectors' && {
          connectorType: item.connector_type?.trim() || undefined,
          fiberType: item.fiber_category?.trim() || undefined,
          productType: item.product_type?.trim() || undefined,
          technology: item.technology?.trim() || undefined,
          polish: item.polish?.trim() || undefined,
          housingColor: item.housing_color?.trim() || undefined,
          bootColor: item.boot_color?.trim() || undefined,
          productLine: item.product_line?.trim() || undefined,
        }),

        ...(item._tableName === 'adapter_panels' && {
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
          supportsAPC: item.supports_apc || false
        }),

        ...(item._tableName === 'rack_mount_fiber_enclosures' && {
          productType: item.product_type?.trim() || 'Rack Mount Fiber Enclosure',
          mountType: item.mount_type?.trim() || undefined,
          rackUnits: item.rack_units || undefined,
          panelType: item.panel_type?.trim() || undefined,
          panelCapacity: item.accepts_number_of_connector_housing_panels || undefined,
          color: item.color?.trim() || undefined,
          material: item.material?.trim() || undefined,
          supportsSpliceTrays: item.supports_splice_trays || false,
          environment: item.environment?.trim() || undefined,
          possibleEquivalent: item.possible_equivalent?.trim() || undefined,
          commonTerms: item.common_terms?.trim() || undefined,
          spliceTrayModel: item.fiber_enclosure_splice_tray?.trim() || undefined,
          productLine: item.product_line?.trim() || undefined,
          upcCode: item.upc_number?.toString() || undefined
        })
      }
    })

    // Sort results by relevance
    products.sort((a, b) => {
      const aPartNum = a.partNumber.toLowerCase()
      const bPartNum = b.partNumber.toLowerCase()

      for (const searchTerm of partNumbers) {
        const searchLower = searchTerm.toLowerCase()

        // Exact matches get highest priority
        if (aPartNum === searchLower && bPartNum !== searchLower) return -1
        if (bPartNum === searchLower && aPartNum !== searchLower) return 1

        // Prefix matches get second priority
        if (aPartNum.startsWith(searchLower) && !bPartNum.startsWith(searchLower)) return -1
        if (bPartNum.startsWith(searchLower) && !aPartNum.startsWith(searchLower)) return 1
      }

      return 0
    })

    console.log(`🔢 Part number search completed: ${products.length} formatted products`)
    return products

  } catch (error) {
    console.error('❌ Error in dynamic part number search:', error)

    // Fallback to hardcoded search if dynamic fails
    console.log('⚠️ Falling back to hardcoded table search')
    return searchByPartNumberHardcoded(partNumbers, quantity)
  }
}

// ===================================================================
// PART NUMBER SEARCH - Hardcoded Fallback Implementation
// ===================================================================

const searchByPartNumberHardcoded = async (partNumbers: string[], quantity?: number): Promise<Product[]> => {
  console.log('🔢 PART NUMBER SEARCH (Hardcoded Fallback)')
  console.log('🔍 Searching for part numbers:', partNumbers)

  let allResults: Product[] = []

  // Define all tables to search - INCLUDING rack_mount_fiber_enclosure
  const tables: Array<{ name: string; prefix: string }> = [
    { name: 'category_cables', prefix: 'cat' },
    { name: 'fiber_connectors', prefix: 'conn' },
    { name: 'adapter_panels', prefix: 'panel' },
    { name: 'rack_mount_fiber_enclosures', prefix: 'encl' },
    { name: 'products', prefix: 'prod' }
  ]

  // Search each table
  for (const table of tables) {
    try {
      console.log(`🔍 Searching ${table.name} for part numbers...`)

      // Build search conditions for each part number variation
      const searchConditions: string[] = []

      partNumbers.forEach(partNum => {
        const normalized = normalizePartNumber(partNum)
        const original = partNum

        // Exact matches first
        searchConditions.push(`part_number.eq.${original}`)
        searchConditions.push(`part_number.eq.${normalized}`)

        // Prefix matches
        searchConditions.push(`part_number.ilike.${original}%`)
        searchConditions.push(`part_number.ilike.${normalized}%`)

        // Contains matches
        searchConditions.push(`part_number.ilike.%${original}%`)
        searchConditions.push(`part_number.ilike.%${normalized}%`)
      })

      const query = supabase
        .from(table.name)
        .select('*')
        .eq('is_active', true)
        .or(searchConditions.join(','))
        .limit(50)

      const result = await query

      if (result.data && result.data.length > 0) {
        console.log(`✅ Found ${result.data.length} matches in ${table.name}`)

        // Convert to standard product format
        const products: Product[] = result.data.map((item: any) => ({
          id: `${table.prefix}-${item.id}`,
          partNumber: item.part_number?.toString() || 'No Part Number',
          brand: item.brand?.trim() || 'Unknown Brand',
          description: item.short_description?.trim() || 'No description available',
          price: parseFloat(item.unit_price || '0') || Math.random() * 200 + 50,
          stockLocal: item.stock_quantity || 0,
          stockDistribution: 100,
          leadTime: 'Ships Today',
          category: table.name === 'category_cables' ? 'Category Cable' :
                   table.name === 'fiber_connectors' ? 'Fiber Connector' :
                   table.name === 'adapter_panels' ? 'Adapter Panel' :
                   table.name === 'rack_mount_fiber_enclosures' ? 'Fiber Enclosure' : 'Product',
          searchRelevance: 1.0,
          tableName: table.name,
          stockStatus: 'not_in_stock',
          stockColor: 'red',
          stockMessage: 'Not currently in stock - contact for availability',
          // Add type-specific fields
          ...(table.name === 'category_cables' && {
            categoryRating: item.category_rating?.trim() || undefined,
            jacketRating: item.jacket_material?.trim() || undefined,
            color: item.jacket_color?.trim() || undefined,
            shielding: item.Shielding_Type?.trim() || undefined,
            productLine: item.product_line?.trim() || undefined,
            pairCount: item.pair_count?.trim() || undefined,
            conductorAwg: item.conductor_awg || undefined,
            jacketColor: item.jacket_color?.trim() || undefined,
            cableDiameter: item.cable_diameter_in || undefined,
            possibleCross: item.possible_cross?.trim() || undefined
          }),
          ...(table.name === 'adapter_panels' && {
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
            supportsAPC: item.supports_apc || false
          }),
          ...(table.name === 'rack_mount_fiber_enclosures' && {
            productType: item.product_type?.trim() || 'Rack Mount Fiber Enclosure',
            mountType: item.mount_type?.trim() || undefined,
            rackUnits: item.rack_units || undefined,
            panelType: item.panel_type?.trim() || undefined,
            panelCapacity: item.accepts_number_of_connector_housing_panels || undefined,
            color: item.color?.trim() || undefined,
            material: item.material?.trim() || undefined,
            supportsSpliceTrays: item.supports_splice_trays || false,
            environment: item.environment?.trim() || undefined,
            possibleEquivalent: item.possible_equivalent?.trim() || undefined,
            commonTerms: item.common_terms?.trim() || undefined,
            spliceTrayModel: item.fiber_enclosure_splice_tray?.trim() || undefined,
            productLine: item.product_line?.trim() || undefined,
            upcCode: item.upc_number?.toString() || undefined
          })
        }))

        allResults = [...allResults, ...products]
      }
    } catch (error) {
      console.error(`❌ Error searching ${table.name}:`, error)
    }
  }

  // Sort results by relevance
  allResults.sort((a, b) => {
    const aPartNum = a.partNumber.toLowerCase()
    const bPartNum = b.partNumber.toLowerCase()

    for (const searchTerm of partNumbers) {
      const searchLower = searchTerm.toLowerCase()

      // Exact matches get highest priority
      if (aPartNum === searchLower && bPartNum !== searchLower) return -1
      if (bPartNum === searchLower && aPartNum !== searchLower) return 1

      // Prefix matches get second priority
      if (aPartNum.startsWith(searchLower) && !bPartNum.startsWith(searchLower)) return -1
      if (bPartNum.startsWith(searchLower) && !aPartNum.startsWith(searchLower)) return 1
    }

    return 0
  })

  console.log(`🔢 Part number search completed: ${allResults.length} total matches`)
  return allResults
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

// Helper function to determine category from table name
const determineCategoryFromTable = (tableName: string): string => {
  if (tableName.includes('cable')) return 'Cable'
  if (tableName.includes('connector')) return 'Connector'
  if (tableName.includes('panel')) return 'Panel'
  if (tableName.includes('enclosure')) return 'Enclosure'
  if (tableName.includes('tool')) return 'Tool'
  if (tableName.includes('tester')) return 'Tester'
  if (tableName.includes('switch')) return 'Switch'
  if (tableName.includes('power')) return 'Power'
  return 'Product'
}

// ===================================================================
// SMART FILTERS GENERATION - Enhanced for All Product Types
// ===================================================================

const generateSmartFilters = (products: Product[]): SmartFilters => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  const brands = filterString(products.map(p => p.brand))
  const packagingTypes = filterString(products.map(p => p.packagingType))
  const jacketRatings = filterString(products.map(p => p.jacketRating))
  const categoryRatings = filterString(products.map(p => p.categoryRating))
  const shieldingTypes = filterString(products.map(p => p.shielding))
  const productLines = filterString(products.map(p => p.productLine))
  const pairCounts = filterString(products.map(p => p.pairCount))
  const conductorGauges = filterString(products.map(p => p.conductorAwg?.toString()))
  const applications = filterString(products.map(p => p.application))
  const colors = filterString(products.map(p => p.jacketColor || p.color))

  // Fiber connector specific filters
  const fiberTypes = filterString(products.map(p => p.fiberType))
  const connectorTypes = filterString(products.map(p => p.connectorType))
  const productTypes = filterString(products.map(p => p.productType))
  const technologies = filterString(products.map(p => p.technology))
  const polishTypes = filterString(products.map(p => p.polish))
  const housingColors = filterString(products.map(p => p.housingColor))
  const bootColors = filterString(products.map(p => p.bootColor))

  // Adapter panel specific filters
  const panelTypes = filterString(products.map(p => p.panelType))
  const terminationTypes = filterString(products.map(p => p.terminationType))
  const adapterColors = filterString(products.map(p => p.adapterColor))

  // Fiber enclosure specific filters
  const rackUnits = filterString(products.map(p => p.rackUnits?.toString()))
  const environments = filterString(products.map(p => p.environment))
  const mountTypes = filterString(products.map(p => p.mountType))

  // Check what types of products we have
  const hasAdapterPanels = products.some(p => p.tableName === 'adapter_panels')
  const hasFiberEnclosures = products.some(p => p.tableName === 'rack_mount_fiber_enclosures')

  return {
    brands: brands.slice(0, 8),
    packagingTypes: packagingTypes.slice(0, 6),
    jacketRatings: jacketRatings.slice(0, 4),
    fiberTypes: fiberTypes.slice(0, 6),
    connectorTypes: connectorTypes.slice(0, 6),
    categoryRatings: categoryRatings.slice(0, 4),
    colors: colors.slice(0, 6),
    shieldingTypes: shieldingTypes.slice(0, 4),
    productLines: productLines.slice(0, 6),
    pairCounts: pairCounts.slice(0, 4),
    conductorGauges: conductorGauges.slice(0, 4),
    applications: applications.slice(0, 4),
    productType: products[0]?.category || 'MIXED',
    productTypes: productTypes.slice(0, 6),
    technologies: technologies.slice(0, 6),
    polishTypes: polishTypes.slice(0, 4),
    housingColors: housingColors.slice(0, 6),
    bootColors: bootColors.slice(0, 6),
    // Add adapter panel filters only if we have adapter panels
    ...(hasAdapterPanels && {
      panelTypes: panelTypes.slice(0, 4),
      terminationTypes: terminationTypes.slice(0, 4),
      adapterColors: adapterColors.slice(0, 6)
    }),
    // Add fiber enclosure filters only if we have fiber enclosures
    ...(hasFiberEnclosures && {
      rackUnits: rackUnits.slice(0, 6),
      environments: environments.slice(0, 3),
      mountTypes: mountTypes.slice(0, 3)
    })
  }
}

// ===================================================================
// TABLE DETERMINATION LOGIC - ENHANCED FOR BETTER ENCLOSURE DETECTION
// ===================================================================

type ProductTable = 'category_cables' | 'fiber_connectors' | 'adapter_panels' | 'fiber_cables' | 'fiber_enclosures' | 'multi_table'

const determineTargetTable = (aiAnalysis: AISearchAnalysis | null, searchTerm: string): ProductTable => {
  const query = searchTerm.toLowerCase()

  // PRIORITY 1: Check if AI says ENCLOSURE
  if (aiAnalysis?.productType === 'ENCLOSURE') {
    console.log('🏗️ AI productType is ENCLOSURE - routing to fiber_enclosures')
    return 'fiber_enclosures'
  }

  // PRIORITY 2: Check for fiber enclosure keywords
  const enclosureTerms = [
    'enclosure', 'housing', 'rack mount', 'cabinet',
    'cch-', 'fap-', 'splice tray',
    'fiber enclosure', 'fiber optic enclosure', 'patch panel enclosure'
  ]
  const hasEnclosureTerms = enclosureTerms.some(term => query.includes(term))

  // Check for RU pattern (rack units)
  const hasRUPattern = /\b\d+\s*ru\b/i.test(query) || /\b\d+u\b/i.test(query) || /\b\d+\s*rack\s*unit/i.test(query)

  // Check if AI detected rack units
  const hasDetectedRackUnits = aiAnalysis?.detectedSpecs?.rackUnits !== undefined && aiAnalysis?.detectedSpecs?.rackUnits !== null

  if (hasEnclosureTerms || hasRUPattern || hasDetectedRackUnits) {
    console.log('🏗️ Enclosure indicators detected - routing to fiber_enclosures', {
      hasEnclosureTerms,
      hasRUPattern,
      hasDetectedRackUnits,
      rackUnits: aiAnalysis?.detectedSpecs?.rackUnits
    })
    return 'fiber_enclosures'
  }

  // Check for strand patterns
  const strandMatch = query.match(/\b(\d+)\s*strand/i)
  if (strandMatch) {
    console.log(`🧶 STRAND PATTERN DETECTED: ${strandMatch[1]} strand - routing to fiber_cables`)
    return 'fiber_cables'
  }

  // Check for brand-only searches
  const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'berktek', 'prysmian', 'dmsi', 'siecor']
  const queryWords = query.trim().split(/\s+/)

  if (queryWords.length === 1 && brandKeywords.includes(queryWords[0])) {
    console.log(`🏢 BRAND-ONLY SEARCH DETECTED: "${queryWords[0]}" - routing to multi_table`)
    return 'multi_table'
  }

  // Enhanced connector detection
  const connectorTerms = ['connector', 'connectors', 'lc', 'sc', 'st', 'fc', 'mtp', 'mpo']
  const hasConnectorTerms = connectorTerms.some(term => query.includes(term))

  if (hasConnectorTerms && !query.includes('panel') && !query.includes('adapter')) {
    console.log('🔌 Keyword routing to fiber_connectors')
    return 'fiber_connectors'
  }

  // Panel detection (but not enclosure panels)
  if ((query.includes('panel') || query.includes('adapter panel') || query.includes('coupling')) && !hasEnclosureTerms) {
    console.log('🏠 Keyword routing to adapter_panels')
    return 'adapter_panels'
  }

  // Fiber cable detection
  const fiberTerms = ['fiber', 'fibre', 'om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']
  const hasFiberTerms = fiberTerms.some(term => query.includes(term))

  if (hasFiberTerms && !hasConnectorTerms && !query.includes('panel') && !hasEnclosureTerms) {
    console.log('🔺 Keyword routing to fiber_cables')
    return 'fiber_cables'
  }

  // Default to category cables for typical electrical searches
  console.log('📊 Default routing to category_cables')
  return 'category_cables'
}

// ===================================================================
// BRAND SEARCH - NEW DEDICATED FUNCTION
// ===================================================================

const searchAllTablesByBrand = async (brand: string, limit: number): Promise<Product[]> => {
  console.log(`🏢 MULTI-TABLE BRAND SEARCH FOR: ${brand}`)
  let allProducts: Product[] = []

  // Search fiber enclosures FIRST for brand
  try {
    console.log(`🏗️ Searching fiber enclosures for brand: ${brand}`)
    const enclosureResult = await searchRackMountFiberEnclosuresImpl({
      searchTerm: brand,
      aiAnalysis: {
        searchStrategy: 'brand',
        productType: 'MIXED',
        confidence: 1.0,
        detectedSpecs: { manufacturer: brand },
        searchTerms: [brand],
        reasoning: 'Brand search',
        suggestedFilters: [],
        alternativeQueries: [],
        originalQuery: brand,
        timestamp: new Date().toISOString(),
        aiModel: 'enhanced'
      },
      limit: Math.floor(limit / 5)
    })
    if (enclosureResult.products.length > 0) {
      console.log(`✅ Found ${enclosureResult.products.length} ${brand} enclosures`)
      allProducts = [...allProducts, ...enclosureResult.products]
    }
  } catch (error) {
    console.error('Error searching enclosures:', error)
  }

  // Search category cables
  try {
    console.log(`📊 Searching category cables for brand: ${brand}`)
    const cableResult = await searchCategoryCablesImpl({
      searchTerm: brand,
      aiAnalysis: {
        searchStrategy: 'brand',
        productType: 'MIXED',
        confidence: 1.0,
        detectedSpecs: { manufacturer: brand },
        searchTerms: [brand],
        reasoning: 'Brand search',
        suggestedFilters: [],
        alternativeQueries: [],
        originalQuery: brand,
        timestamp: new Date().toISOString(),
        aiModel: 'enhanced'
      },
      limit: Math.floor(limit / 5)
    })
    // Filter to ensure only the requested brand
    const brandProducts = cableResult.products.filter(p =>
      p.brand.toLowerCase().includes(brand.toLowerCase())
    )
    if (brandProducts.length > 0) {
      console.log(`✅ Found ${brandProducts.length} ${brand} cables`)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    console.error('Error searching cables:', error)
  }

  // Search fiber connectors
  try {
    console.log(`🔌 Searching fiber connectors for brand: ${brand}`)
    const connectorResult = await searchFiberConnectorsImpl({
      searchTerm: brand,
      aiAnalysis: {
        searchStrategy: 'brand',
        productType: 'MIXED',
        confidence: 1.0,
        detectedSpecs: { manufacturer: brand },
        searchTerms: [brand],
        reasoning: 'Brand search',
        suggestedFilters: [],
        alternativeQueries: [],
        originalQuery: brand,
        timestamp: new Date().toISOString(),
        aiModel: 'enhanced'
      },
      limit: Math.floor(limit / 5)
    })
    // Filter to ensure only the requested brand
    const brandProducts = connectorResult.products.filter(p =>
      p.brand.toLowerCase().includes(brand.toLowerCase())
    )
    if (brandProducts.length > 0) {
      console.log(`✅ Found ${brandProducts.length} ${brand} connectors`)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    console.error('Error searching connectors:', error)
  }

  // Search adapter panels
  try {
    console.log(`🏠 Searching adapter panels for brand: ${brand}`)
    const panelResult = await searchAdapterPanelsImpl({
      searchTerm: brand,
      aiAnalysis: {
        searchStrategy: 'brand',
        productType: 'MIXED',
        confidence: 1.0,
        detectedSpecs: { manufacturer: brand },
        searchTerms: [brand],
        reasoning: 'Brand search',
        suggestedFilters: [],
        alternativeQueries: [],
        originalQuery: brand,
        timestamp: new Date().toISOString(),
        aiModel: 'enhanced'
      },
      limit: Math.floor(limit / 5)
    })
    // Filter to ensure only the requested brand
    const brandProducts = panelResult.products.filter(p =>
      p.brand.toLowerCase().includes(brand.toLowerCase())
    )
    if (brandProducts.length > 0) {
      console.log(`✅ Found ${brandProducts.length} ${brand} panels`)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    console.error('Error searching panels:', error)
  }

  // Search fiber cables
  try {
    console.log(`🔺 Searching fiber cables for brand: ${brand}`)
    const fiberResult = await searchFiberCablesImpl({
      searchTerm: brand,
      aiAnalysis: {
        searchStrategy: 'brand',
        productType: 'MIXED',
        confidence: 1.0,
        detectedSpecs: { manufacturer: brand },
        searchTerms: [brand],
        reasoning: 'Brand search',
        suggestedFilters: [],
        alternativeQueries: [],
        originalQuery: brand,
        timestamp: new Date().toISOString(),
        aiModel: 'enhanced'
      },
      limit: Math.floor(limit / 5)
    })
    // Filter to ensure only the requested brand
    const brandProducts = fiberResult.products.filter(p =>
      p.brand.toLowerCase().includes(brand.toLowerCase())
    )
    if (brandProducts.length > 0) {
      console.log(`✅ Found ${brandProducts.length} ${brand} fiber cables`)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    console.error('Error searching fiber cables:', error)
  }

  console.log(`🎯 TOTAL BRAND SEARCH RESULTS: ${allProducts.length} products for ${brand}`)
  return allProducts
}

// ===================================================================
// MAIN SEARCH SERVICE - FIXED TO USE REAL IMPLEMENTATIONS
// ===================================================================

export const searchProducts = async (options: SearchOptions): Promise<SearchResult> => {
  const startTime = performance.now()
  const { query, limit = 50, includeAI = true } = options

  try {
    console.log('🎯 SEARCH SERVICE - Enhanced search for:', query)

    // Step 1: Validate query
    const validation = validateElectricalQuery(query)
    if (!validation.isValid) {
      return {
        products: [],
        searchTime: Math.round(performance.now() - startTime),
        searchType: 'validation_error',
        redirectMessage: validation.message
      }
    }

    // Step 2: Apply business rules (Cat5 → Cat5e)
    const processedQuery = applyBusinessRules(query)
    console.log('🔄 Query after business rules:', processedQuery.processedTerm)

    // Step 3: Check for part numbers first
    const partNumberDetection = detectPartNumbers(processedQuery.processedTerm)

    if (partNumberDetection.hasParts) {
      console.log('🔢 PART NUMBER DETECTED - Using part number search')
      const partResults = await searchByPartNumber(partNumberDetection.partNumbers, partNumberDetection.quantity)

      if (partResults.length > 0) {
        const smartFilters = generateSmartFilters(partResults)

        return {
          products: partResults.slice(0, limit),
          searchTime: Math.round(performance.now() - startTime),
          searchType: 'part_number_match',
          redirectMessage: processedQuery.redirectMessage || undefined,
          totalFound: partResults.length,
          smartFilters
        }
      }
    }

    // Step 4: Get AI Analysis (if enabled) - with enhancement
    let aiAnalysis: AISearchAnalysis | null = null
    if (includeAI) {
      aiAnalysis = await getAIAnalysis(processedQuery.processedTerm)

      // Add debug code AFTER getting the AI analysis
      console.log('🔍 BEFORE enhancement:', {
        productType: aiAnalysis?.productType,
        rackUnits: aiAnalysis?.detectedSpecs?.rackUnits
      })

      // Now enhance the AI analysis
      aiAnalysis = enhanceAIAnalysis(aiAnalysis, processedQuery.processedTerm)

      // Add debug code AFTER enhancement
      console.log('🔍 AFTER enhancement:', {
        productType: aiAnalysis?.productType,
        rackUnits: aiAnalysis?.detectedSpecs?.rackUnits
      })
    }

    // Step 5: Determine Target Table
    const targetTable = determineTargetTable(aiAnalysis, processedQuery.processedTerm)
    console.log(`🎯 Target table: ${targetTable}`)

    let products: Product[] = []
    let searchStrategy = 'clean_architecture'

    // Step 6: Execute Table-Specific Search
    switch (targetTable) {
      case 'category_cables':
        console.log('📊 Executing REAL category cables search')
        const cableResult = await searchCategoryCablesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = cableResult.products
        searchStrategy = `category_cables_${cableResult.searchStrategy}`
        break

      case 'fiber_connectors':
        console.log('🔌 Executing REAL fiber connectors search')
        const connectorResult = await searchFiberConnectorsImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = connectorResult.products
        searchStrategy = `fiber_connectors_${connectorResult.searchStrategy}`
        break

      case 'adapter_panels':
        console.log('🏠 Executing REAL adapter panels search')
        const panelResult = await searchAdapterPanelsImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = panelResult.products
        searchStrategy = `adapter_panels_${panelResult.searchStrategy}`
        break

      case 'fiber_cables':
        console.log('🔺 Executing REAL fiber cables search')
        const fiberResult = await searchFiberCablesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = fiberResult.products
        searchStrategy = `fiber_cables_${fiberResult.searchStrategy}`
        break

      case 'fiber_enclosures':
        console.log('🏗️ Executing REAL fiber enclosures search')
        const enclosureResult = await searchRackMountFiberEnclosuresImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = enclosureResult.products
        searchStrategy = `fiber_enclosures_${enclosureResult.searchStrategy}`
        break

      case 'multi_table':
        console.log('🚀 Executing enhanced multi-table brand search')
        // For brand-only searches, use the dedicated brand search function
        const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'berktek', 'prysmian', 'dmsi', 'siecor']
        const queryLower = processedQuery.processedTerm.toLowerCase().trim()

        if (brandKeywords.includes(queryLower)) {
          products = await searchAllTablesByBrand(queryLower, limit)
          searchStrategy = 'multi_table_brand_search'
        } else {
          // Regular multi-table search
          const categoryCableResult = await searchCategoryCablesImpl({
            searchTerm: processedQuery.processedTerm,
            aiAnalysis,
            limit: Math.floor(limit / 5)
          })
          products = [...categoryCableResult.products]

          if (products.length < limit) {
            const connResults = await searchFiberConnectorsImpl({
              searchTerm: processedQuery.processedTerm,
              aiAnalysis,
              limit: Math.floor((limit - products.length) / 4)
            })
            products = [...products, ...connResults.products]
          }

          if (products.length < limit) {
            const panelResults = await searchAdapterPanelsImpl({
              searchTerm: processedQuery.processedTerm,
              aiAnalysis,
              limit: Math.floor((limit - products.length) / 3)
            })
            products = [...products, ...panelResults.products]
          }

          if (products.length < limit) {
            const enclosureResults = await searchRackMountFiberEnclosuresImpl({
              searchTerm: processedQuery.processedTerm,
              aiAnalysis,
              limit: Math.floor((limit - products.length) / 2)
            })
            products = [...products, ...enclosureResults.products]
          }

          if (products.length < limit) {
            const fiberCableResults = await searchFiberCablesImpl({
              searchTerm: processedQuery.processedTerm,
              aiAnalysis,
              limit: limit - products.length
            })
            products = [...products, ...fiberCableResults.products]
          }

          searchStrategy = 'multi_table_search'
        }
        break

      default:
        console.log('📊 Default category cables search')
        const defaultResult = await searchCategoryCablesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = defaultResult.products
        searchStrategy = `category_cables_default_${defaultResult.searchStrategy}`
    }

    // Generate smart filters if we have products
    const smartFilters = products.length > 0 ? generateSmartFilters(products) : undefined

    const endTime = performance.now()
    const searchTime = Math.round(endTime - startTime)

    console.log(`✅ Search service completed: ${products.length} products found in ${searchTime}ms`)

    return {
      products: products.slice(0, limit),
      searchTime,
      searchType: searchStrategy,
      aiAnalysis: aiAnalysis || undefined,
      redirectMessage: processedQuery.redirectMessage || undefined,
      totalFound: products.length,
      smartFilters
    }

  } catch (error: unknown) {
    console.error('❌ Search service error:', error)
    const endTime = performance.now()

    return {
      products: [],
      searchTime: Math.round(endTime - startTime),
      searchType: 'error',
      redirectMessage: 'An unexpected error occurred during search'
    }
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

// Types are already exported at their definitions above