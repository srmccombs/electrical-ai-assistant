// src/services/searchService.ts
// FIXED VERSION - Now properly imports and uses actual search implementations
// Update: Added fiber connector and fiber cable search implementations
// Update: Added adapter panel fields to Product interface
// Update: Added fiber enclosure search implementation - December 19, 2024
// Update: Fixed fiber enclosure detection and AI routing - June 5, 2025
// Update: Enhanced debugging and brand filtering - June 5, 2025
// Update: Added dynamic table discovery - June 5, 2025
// Update: Added analytics tracking - June 7, 2025

import { supabase } from '@/lib/supabase'
import { searchAllTablesForPartNumber } from '@/search/shared/tableDiscoveryService'
import { getCachedAIAnalysis } from '@/services/aiCache'
import { trackSearch } from '@/services/analytics'
import { logger, LogCategory } from '@/utils/logger'

// Import types from the new types package
import type {
  Product,
  SmartFilters,
  AISearchAnalysis,
  SearchResult,
  SearchOptions,
  ValidationResult,
  BusinessRuleResult,
  DetectedParts,
  CategoryCableSearchResult,
  FiberConnectorSearchResult,
  FiberCableSearchResult,
  AdapterPanelSearchResult,
  FiberEnclosureSearchResult,
  ProductTable,
  TableInfo
} from '@/types'

// Add this import at the top with the other imports
import { PRODUCT_TYPES, getProductTypeByTable, getProductTypeByKeywords } from '@/config/productTypes'

// Import the actual search implementations
import {
  searchCategoryCables as searchCategoryCablesImpl,
} from '@/search/categoryCables/categoryCableSearch'

import {
  searchFiberConnectors as searchFiberConnectorsImpl,
} from '@/search/fiberConnectors/fiberConnectorSearch'

import {
  searchFiberCables as searchFiberCablesImpl,
} from '@/search/fiberCables/fiberCableSearch'

import {
  searchAdapterPanels as searchAdapterPanelsImpl,
  generateAdapterPanelFilters,
} from '@/search/fiberadapterPanels/fiberadapterPanelSearch'

import {
  searchRackMountFiberEnclosures as searchRackMountFiberEnclosuresImpl,
  generateFiberEnclosureFilters,
} from '@/search/fiberenclosure/rack_mount_fiber_enclosure_Search'

import {
  searchWallMountFiberEnclosures as searchWallMountFiberEnclosuresImpl
} from '@/search/fiberenclosure/wall_mount_fiber_enclosure_Search'

import {
  searchJackModules as searchJackModulesImpl,
} from '@/search/jackModules/jackModuleSearch'

// Import shared industry knowledge
import {
  validateElectricalQuery,
  applyBusinessRules,
  detectPartNumbers,
  normalizePartNumber,
  detectCrossReferenceRequest,
} from '@/search/shared/industryKnowledge'

// Import cross-reference service
import { findCrossReferences } from '@/services/crossReferenceService'

// Import datasheet service
import { getDatasheetUrls } from '@/services/datasheetService'

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
          logger.debug(`Enhanced AI: Detected rack units: ${units}RU`, {}, LogCategory.AI)
          aiAnalysis.detectedSpecs.rackUnits = units
          wasEnhanced = true
          break
        }
      }
    }
  }

  // Fix product type if it says MIXED/PANEL but query has enclosure
  if (term.includes('enclosure') && (aiAnalysis.productType === 'MIXED' || aiAnalysis.productType === 'PANEL')) {
    logger.debug(`Enhanced AI: Correcting productType from ${aiAnalysis.productType} to ENCLOSURE`, {}, LogCategory.AI)
    aiAnalysis.productType = 'ENCLOSURE'
    wasEnhanced = true
  }

  // Force enclosure type if we have RU units
  if (aiAnalysis.detectedSpecs.rackUnits && aiAnalysis.productType !== 'ENCLOSURE') {
    logger.debug(`Enhanced AI: Forcing productType to ENCLOSURE due to rack units`, {}, LogCategory.AI)
    aiAnalysis.productType = 'ENCLOSURE'
    wasEnhanced = true
  }

  if (wasEnhanced) {
    logger.info('Enhanced AI Analysis complete', { aiAnalysis }, LogCategory.AI)
  }

  return aiAnalysis
}

/**
 * Get AI analysis for search query (with caching)
 */
const getAIAnalysis = async (query: string): Promise<AISearchAnalysis | null> => {
  // Use the cache wrapper
  return getCachedAIAnalysis(query, async (q) => {
    try {
      logger.debug('Getting FRESH AI analysis', { query: q }, LogCategory.AI)

      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: q,
          userContext: {
            businessType: 'electrical_distributor'
          }
        }),
      })

      const data = await response.json()

      if (data.success && data.analysis) {
        logger.aiAnalysis(q, data.analysis)
        // Enhance the AI analysis with additional detection
        const enhanced = enhanceAIAnalysis(data.analysis, q)
        return enhanced
      } else {
        logger.warn('AI analysis failed, using fallback', { query: q }, LogCategory.AI)
        return data.fallback || null
      }
    } catch (error) {
      logger.error('AI analysis error', error, LogCategory.AI)
      return null
    }
  })
}

// ===================================================================
// PART NUMBER SEARCH - Dynamic Implementation with Fallback
// ===================================================================

const searchByPartNumber = async (partNumbers: string[], quantity?: number): Promise<Product[]> => {
  logger.info('Part number search started', { partNumbers, quantity }, LogCategory.SEARCH)

  try {
    // Use the dynamic table discovery service
    const searchResults = await searchAllTablesForPartNumber(partNumbers, 200)

    logger.info(`Dynamic search found ${searchResults.length} raw results`, {}, LogCategory.DATABASE)

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

    // Enrich with datasheet URLs
    if (products.length > 0) {
      try {
        const datasheetUrls = await getDatasheetUrls(products)
        products.forEach(product => {
          const url = datasheetUrls.get(product.partNumber)
          if (url) {
            product.datasheetUrl = url
          }
        })
      } catch (error) {
        logger.error('Failed to fetch datasheet URLs for part number search', error, LogCategory.SEARCH)
      }
    }

    logger.info(`Part number search completed`, { resultCount: products.length }, LogCategory.SEARCH)
    return products

  } catch (error) {
    logger.error('Error in dynamic part number search', error, LogCategory.DATABASE)

    // Fallback to hardcoded search if dynamic fails
    logger.warn('Falling back to hardcoded table search', {}, LogCategory.DATABASE)
    return searchByPartNumberHardcoded(partNumbers, quantity)
  }
}

// ===================================================================
// PART NUMBER SEARCH - Hardcoded Fallback Implementation
// ===================================================================

const searchByPartNumberHardcoded = async (partNumbers: string[], quantity?: number): Promise<Product[]> => {
  logger.info('Part number search (Hardcoded Fallback)', { partNumbers }, LogCategory.SEARCH)

  let allResults: Product[] = []

  // Define all tables to search - INCLUDING rack_mount_fiber_enclosure
  const tables: TableInfo[] = [
    { name: 'category_cables', prefix: 'cat' },
    { name: 'fiber_connectors', prefix: 'conn' },
    { name: 'adapter_panels', prefix: 'panel' },
    { name: 'rack_mount_fiber_enclosures', prefix: 'encl' },
    { name: 'products', prefix: 'prod' }
  ]

  // Search each table
  for (const table of tables) {
    try {
      logger.tableOperation('search', table.name, { partNumbers })

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
        logger.info(`Found ${result.data.length} matches in ${table.name}`, {}, LogCategory.DATABASE)

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
      logger.error(`Error searching ${table.name}`, error, LogCategory.DATABASE)
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

  logger.info(`Part number search completed`, { totalMatches: allResults.length }, LogCategory.SEARCH)
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
  const hasJackModules = products.some(p => p.tableName === 'jack_modules')

  return {
    brands: brands, // Show all brands
    packagingTypes: packagingTypes.slice(0, 6),
    jacketRatings: jacketRatings.slice(0, 4),
    fiberTypes: fiberTypes.slice(0, 6),
    connectorTypes: connectorTypes.slice(0, 6),
    categoryRatings: categoryRatings, // Show all categories
    colors: colors, // Show all colors
    shieldingTypes: shieldingTypes, // Show all shielding types
    productLines: productLines, // Show all product lines
    pairCounts: pairCounts.slice(0, 4),
    conductorGauges: conductorGauges.slice(0, 4),
    applications: applications.slice(0, 4),
    productType: products[0]?.category || 'MIXED',
    productTypes: productTypes, // Show all product types
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
  ,
    // Add jack module filters only if we have jack modules
    ...(hasJackModules && {
      installationTools: filterString(products.map(p => p.installationToolsRequired)).slice(0, 4),
      compatibleFaceplates: filterString(products.map(p => p.compatibleFaceplates)).slice(0, 6)
    })

  }
}

// ===================================================================
// TABLE DETERMINATION LOGIC - ENHANCED FOR BETTER ENCLOSURE DETECTION
// ===================================================================

const determineTargetTable = (aiAnalysis: AISearchAnalysis | null, searchTerm: string): ProductTable => {
  const query = searchTerm.toLowerCase()

  logger.debug('Available product types', { types: Object.keys(PRODUCT_TYPES) }, LogCategory.SEARCH)

  // PRIORITY 1: Check if AI says ENCLOSURE
  if (aiAnalysis?.productType === 'ENCLOSURE') {
    logger.info('AI productType is ENCLOSURE - routing to fiber_enclosures', {}, LogCategory.AI)
    return 'fiber_enclosures'
  }

  // PRIORITY 2: Check for fiber enclosure keywords
  const enclosureTerms = [
    'enclosure', 'housing', 'rack mount', 'cabinet',
    'cch-', 'fap-', 'splice tray', 'wall mount',
    'fiber enclosure', 'fiber optic enclosure', 'patch panel enclosure',
    'wall-mount', 'wallmount'
  ]
  const hasEnclosureTerms = enclosureTerms.some(term => query.includes(term))

  // Check for RU pattern (rack units)
  const hasRUPattern = /\b\d+\s*ru\b/i.test(query) || /\b\d+u\b/i.test(query) || /\b\d+\s*rack\s*unit/i.test(query)

  // Check if AI detected rack units
  const hasDetectedRackUnits = aiAnalysis?.detectedSpecs?.rackUnits !== undefined && aiAnalysis?.detectedSpecs?.rackUnits !== null

  if (hasEnclosureTerms || hasRUPattern || hasDetectedRackUnits) {
    logger.info('Enclosure indicators detected - routing to fiber_enclosures', {
      hasEnclosureTerms,
      hasRUPattern,
      hasDetectedRackUnits,
      rackUnits: aiAnalysis?.detectedSpecs?.rackUnits
    }, LogCategory.SEARCH)
    return 'fiber_enclosures'
  }

  // Check for strand patterns
  const strandMatch = query.match(/\b(\d+)\s*strand/i)
  if (strandMatch) {
    logger.info(`STRAND PATTERN DETECTED: ${strandMatch[1]} strand - routing to fiber_cables`, {}, LogCategory.SEARCH)
    return 'fiber_cables'
  }

// PRIORITY 3: Check for jack module keywords
  const jackTerms = [
    'jack', 'jack module', 'keystone', 'keystone jack',
    'rj45 jack', 'ethernet jack', 'network jack', 'data jack',
    'mini-com', 'minicom', 'cj688', 'cj5e88', 'cj6x88',
    'blank module', 'blank insert', 'blank jack',
    'f-type', 'f type', 'coax jack', 'coaxial jack', 'catv jack',
    'hdmi jack', 'hdmi module', 'hdmi coupler', 'hdmi coupling'
  ]

  // Check if it's a jack module search
  const hasJackTerms = jackTerms.some(term => query.includes(term))
  const hasJackPattern = /\b(cat|category)\s*\d+[ae]?\s*(utp|stp|shielded)?\s*jack/i.test(query)
  const hasBlankPattern = /\bblank\s*(module|insert|jack)/i.test(query)
  const hasCoaxPattern = /\b(f-?type|coax|catv)\s*(jack|module|coupler)/i.test(query)
  const hasHDMIPattern = /\bhdmi\s*(jack|module|coupler|coupling)/i.test(query)

  if (hasJackTerms || hasJackPattern || hasBlankPattern || hasCoaxPattern || hasHDMIPattern) {
    // Make sure it's not a patch panel or faceplate
    if (!query.includes('panel') && !query.includes('faceplate') && !query.includes('plate')) {
      logger.info('Keyword routing to jack_modules', {}, LogCategory.SEARCH)
      return 'jack_modules'
    }
  }



  // Check for brand-only searches
  const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'berktek', 'prysmian', 'dmsi', 'siecor', 'hubbell']
  const queryWords = query.trim().split(/\s+/)

  if (queryWords.length === 1 && brandKeywords.includes(queryWords[0])) {
    logger.info(`BRAND-ONLY SEARCH DETECTED: "${queryWords[0]}" - routing to multi_table`, {}, LogCategory.SEARCH)
    return 'multi_table'
  }

  // Enhanced connector detection
  const connectorTerms = ['connector', 'connectors', 'lc', 'sc', 'st', 'fc', 'mtp', 'mpo']
  const hasConnectorTerms = connectorTerms.some(term => query.includes(term))

  if (hasConnectorTerms && !query.includes('panel') && !query.includes('adapter')) {
    logger.info('Keyword routing to fiber_connectors', {}, LogCategory.SEARCH)
    return 'fiber_connectors'
  }

  // Panel detection (but not enclosure panels)
  if ((query.includes('panel') || query.includes('adapter panel') || query.includes('coupling')) && !hasEnclosureTerms) {
    logger.info('Keyword routing to adapter_panels', {}, LogCategory.SEARCH)
    return 'adapter_panels'
  }

  // Fiber cable detection
  const fiberTerms = ['fiber', 'fibre', 'om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']
  const hasFiberTerms = fiberTerms.some(term => query.includes(term))

  if (hasFiberTerms && !hasConnectorTerms && !query.includes('panel') && !hasEnclosureTerms) {
    logger.info('Keyword routing to fiber_cables', {}, LogCategory.SEARCH)
    return 'fiber_cables'
  }

  // Default to category cables for typical electrical searches
  logger.info('Default routing to category_cables', {}, LogCategory.SEARCH)
  return 'category_cables'
}

// ===================================================================
// BRAND SEARCH - NEW DEDICATED FUNCTION
// ===================================================================

const searchAllTablesByBrand = async (brand: string, limit: number): Promise<Product[]> => {
  logger.info(`MULTI-TABLE BRAND SEARCH FOR: ${brand}`, {}, LogCategory.SEARCH)
  let allProducts: Product[] = []

  // Search fiber enclosures FIRST for brand
  try {
    logger.debug(`Searching fiber enclosures for brand: ${brand}`, {}, LogCategory.SEARCH)
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
      logger.info(`Found ${enclosureResult.products.length} ${brand} enclosures`, {}, LogCategory.SEARCH)
      allProducts = [...allProducts, ...enclosureResult.products]
    }
  } catch (error) {
    logger.error('Error searching enclosures', error, LogCategory.SEARCH)
  }

  // Search category cables
  try {
    logger.debug(`Searching category cables for brand: ${brand}`, {}, LogCategory.SEARCH)
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
      logger.info(`Found ${brandProducts.length} ${brand} cables`, {}, LogCategory.SEARCH)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    logger.error('Error searching cables', error, LogCategory.SEARCH)
  }

  // Search fiber connectors
  try {
    logger.debug(`Searching fiber connectors for brand: ${brand}`, {}, LogCategory.SEARCH)
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
      logger.info(`Found ${brandProducts.length} ${brand} connectors`, {}, LogCategory.SEARCH)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    logger.error('Error searching connectors', error, LogCategory.SEARCH)
  }

  // Search adapter panels
  try {
    logger.debug(`Searching adapter panels for brand: ${brand}`, {}, LogCategory.SEARCH)
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
      logger.info(`Found ${brandProducts.length} ${brand} panels`, {}, LogCategory.SEARCH)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    logger.error('Error searching panels', error, LogCategory.SEARCH)
  }

  // Search fiber cables
  try {
    logger.debug(`Searching fiber cables for brand: ${brand}`, {}, LogCategory.SEARCH)
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
      logger.info(`Found ${brandProducts.length} ${brand} fiber cables`, {}, LogCategory.SEARCH)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    logger.error('Error searching fiber cables', error, LogCategory.SEARCH)
  }

  logger.info(`TOTAL BRAND SEARCH RESULTS: ${allProducts.length} products for ${brand}`, {}, LogCategory.SEARCH)
  return allProducts
}

// ===================================================================
// MAIN SEARCH SERVICE - WITH ANALYTICS TRACKING
// ===================================================================

export const searchProducts = async (options: SearchOptions): Promise<SearchResult> => {
  const startTime = performance.now()
  const endTimer = logger.startTimer('Total search execution')

  // Initialize tracking variables
  let searchType: 'direct' | 'ai' | 'part_number' | 'brand' | 'cross_reference' = 'direct'
  let aiProductType: string | undefined

  logger.searchStart(options.query, options)

  // Fix: Ensure we're destructuring correctly
  if (!options || typeof options.query !== 'string') {
    logger.error('Invalid options passed to searchProducts', { options }, LogCategory.SEARCH)

    // Track failed search
    const searchTimeMs = Math.round(performance.now() - startTime)
    trackSearch({
      searchTerm: options?.query || 'invalid',
      resultsCount: 0,
      searchTimeMs,
      searchType: 'direct',
      aiProductType: undefined
    }).catch(error => logger.error('Analytics tracking failed', error, LogCategory.ANALYTICS))

    return {
      products: [],
      searchTime: searchTimeMs,
      searchType: 'error',
      redirectMessage: 'Invalid search parameters'
    }
  }

  const { query, limit = 200, includeAI = true } = options

  try {
    logger.info('SEARCH SERVICE - Enhanced search started', { query }, LogCategory.SEARCH)

    // Step 1: Validate query
    const validation = validateElectricalQuery(query)
    if (!validation.isValid) {
      const searchTimeMs = Math.round(performance.now() - startTime)

      // Track validation error
      trackSearch({
        searchTerm: query,
        resultsCount: 0,
        searchTimeMs,
        searchType: 'direct',
        aiProductType: undefined
      }).catch(error => logger.error('Analytics tracking failed', error, LogCategory.ANALYTICS))

      return {
        products: [],
        searchTime: searchTimeMs,
        searchType: 'validation_error',
        redirectMessage: validation.message
      }
    }

    // Step 2: Apply business rules (Cat5 → Cat5e)
    const processedQuery = applyBusinessRules(query)
    logger.debug('Query after business rules', { original: query, processed: processedQuery.processedTerm }, LogCategory.BUSINESS)

    // Step 2.5: Check for cross-reference request
    const crossRefRequest = detectCrossReferenceRequest(processedQuery.processedTerm)
    
    if (crossRefRequest.isCrossRequest) {
      logger.info('Cross-reference request detected', crossRefRequest, LogCategory.SEARCH)
      searchType = 'cross_reference'
      
      const crossResult = await findCrossReferences(
        crossRefRequest.partNumber || query,
        crossRefRequest.targetBrand
      )
      
      // Create a combined result with source and crosses
      const allProducts: Product[] = []
      if (crossResult.sourceProduct) {
        allProducts.push({
          ...crossResult.sourceProduct,
          isSourceProduct: true // Mark as source for UI
        })
      }
      allProducts.push(...crossResult.crossReferences)
      
      // Enrich cross-reference results with datasheet URLs
      if (allProducts.length > 0) {
        try {
          const datasheetUrls = await getDatasheetUrls(allProducts)
          allProducts.forEach(product => {
            const url = datasheetUrls.get(product.partNumber)
            if (url) {
              product.datasheetUrl = url
            }
          })
        } catch (error) {
          logger.error('Failed to fetch datasheet URLs for cross-reference', error, LogCategory.SEARCH)
        }
      }
      
      const searchTimeMs = Math.round(performance.now() - startTime)
      
      // Track the cross-reference search
      trackSearch({
        searchTerm: query,
        resultsCount: allProducts.length,
        searchTimeMs,
        searchType: 'cross_reference',
        aiProductType: 'CROSS_REFERENCE'
      }).catch(error => logger.error('Analytics tracking failed', error, LogCategory.ANALYTICS))
      
      endTimer()
      logger.searchComplete(query, allProducts.length, searchTimeMs)
      
      return {
        products: allProducts,
        searchTime: searchTimeMs,
        searchType: 'cross_reference',
        redirectMessage: crossResult.message,
        totalFound: allProducts.length,
        smartFilters: allProducts.length > 0 ? generateSmartFilters(allProducts) : undefined,
        crossReferenceInfo: {
          sourcePartNumber: crossRefRequest.partNumber,
          targetBrand: crossRefRequest.targetBrand,
          crossesFound: crossResult.crossReferences.length
        }
      }
    }

    // Step 3: Check for part numbers first
    const partNumberDetection = detectPartNumbers(processedQuery.processedTerm)

    if (partNumberDetection.hasParts) {
      logger.info('PART NUMBER DETECTED - Using part number search', { partNumbers: partNumberDetection.partNumbers }, LogCategory.SEARCH)
      searchType = 'part_number'

      const partResults = await searchByPartNumber(partNumberDetection.partNumbers, partNumberDetection.quantity)

      if (partResults.length > 0) {
        const smartFilters = generateSmartFilters(partResults)
        const searchTimeMs = Math.round(performance.now() - startTime)

        // Track successful part number search
        trackSearch({
          searchTerm: query,
          resultsCount: partResults.length,
          searchTimeMs,
          searchType: 'part_number',
          aiProductType: undefined
        }).catch(error => logger.error('Analytics tracking failed', error, LogCategory.ANALYTICS))

        endTimer()
        logger.searchComplete(query, partResults.length, searchTimeMs)

        // Create a minimal AI analysis with detected quantity for part number searches
        const partNumberAiAnalysis: AISearchAnalysis = {
          searchStrategy: 'part_number',
          productType: 'MIXED',
          confidence: 1.0,
          detectedSpecs: {
            requestedQuantity: partNumberDetection.quantity
          },
          searchTerms: partNumberDetection.partNumbers,
          reasoning: 'Direct part number match',
          originalQuery: query,
          timestamp: new Date().toISOString(),
          aiModel: 'none'
        }

        return {
          products: partResults.slice(0, limit),
          searchTime: searchTimeMs,
          searchType: 'part_number_match',
          redirectMessage: processedQuery.redirectMessage || undefined,
          totalFound: partResults.length,
          smartFilters,
          aiAnalysis: partNumberAiAnalysis
        }
      }
    }

    // Step 4: Get AI Analysis (if enabled) - with enhancement
    let aiAnalysis: AISearchAnalysis | null = null
    if (includeAI) {
      searchType = 'ai'
      aiAnalysis = await getAIAnalysis(processedQuery.processedTerm)

      logger.debug('BEFORE enhancement', {
        productType: aiAnalysis?.productType,
        rackUnits: aiAnalysis?.detectedSpecs?.rackUnits
      }, LogCategory.AI)

      // Now enhance the AI analysis
      aiAnalysis = enhanceAIAnalysis(aiAnalysis, processedQuery.processedTerm)

      // Store AI product type for analytics
      aiProductType = aiAnalysis?.productType

      logger.debug('AFTER enhancement', {
        productType: aiAnalysis?.productType,
        rackUnits: aiAnalysis?.detectedSpecs?.rackUnits
      }, LogCategory.AI)
    }

    // Step 5: Determine Target Table
    const targetTable = determineTargetTable(aiAnalysis, processedQuery.processedTerm)
    logger.info(`Target table determined: ${targetTable}`, {}, LogCategory.SEARCH)

    // Check if it's a brand search
    const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'berktek', 'prysmian', 'dmsi', 'siecor']
    const queryWords = processedQuery.processedTerm.toLowerCase().trim().split(/\s+/)
    if (queryWords.length === 1 && brandKeywords.includes(queryWords[0])) {
      searchType = 'brand'
    }

    let products: Product[] = []
    let searchStrategy = 'clean_architecture'

    // Step 6: Execute Table-Specific Search
    switch (targetTable) {
      case 'category_cables':
        logger.info('Executing category cables search', {}, LogCategory.SEARCH)
        const cableResult = await searchCategoryCablesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = cableResult.products
        searchStrategy = `category_cables_${cableResult.searchStrategy}`
        break

      case 'fiber_connectors':
        logger.info('Executing fiber connectors search', {}, LogCategory.SEARCH)
        const connectorResult = await searchFiberConnectorsImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = connectorResult.products
        searchStrategy = `fiber_connectors_${connectorResult.searchStrategy}`
        break

      case 'adapter_panels':
        logger.info('Executing adapter panels search', {}, LogCategory.SEARCH)
        const panelResult = await searchAdapterPanelsImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = panelResult.products
        searchStrategy = `adapter_panels_${panelResult.searchStrategy}`
        break

      case 'fiber_cables':
        logger.info('Executing fiber cables search', {}, LogCategory.SEARCH)
        const fiberResult = await searchFiberCablesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = fiberResult.products
        searchStrategy = `fiber_cables_${fiberResult.searchStrategy}`
        break

  case 'jack_modules':
        logger.info('Executing jack modules search', {}, LogCategory.SEARCH)
        const jackResult = await searchJackModulesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = jackResult.products
        searchStrategy = `jack_modules_${jackResult.searchStrategy}`
        break



      case 'fiber_enclosures':
        logger.info('Executing fiber enclosures search', {}, LogCategory.SEARCH)

        // Determine if it's wall mount, rack mount, or generic
        const enclosureQuery = processedQuery.processedTerm.toLowerCase()
        const isWallMount = enclosureQuery.includes('wall mount') ||
                           enclosureQuery.includes('wall-mount') ||
                           enclosureQuery.includes('wallmount')

        const isRackMount = enclosureQuery.includes('rack mount') ||
                           enclosureQuery.includes('rack-mount') ||
                           enclosureQuery.includes('rackmount') ||
                           /\d+\s*ru\b/i.test(enclosureQuery) || // e.g., "4RU"
                           /\d+u\b/i.test(enclosureQuery) // e.g., "4U"

        if (isWallMount) {
          // User specifically wants wall mount
          logger.info('Detected WALL MOUNT enclosure request', {}, LogCategory.SEARCH)
          const wallEnclosureResult = await searchWallMountFiberEnclosuresImpl({
            searchTerm: processedQuery.processedTerm,
            aiAnalysis,
            limit
          })
          products = wallEnclosureResult.products
          searchStrategy = `wall_mount_enclosures_${wallEnclosureResult.searchStrategy}`
        } else if (isRackMount) {
          // User specifically wants rack mount
          logger.info('Detected RACK MOUNT enclosure request', {}, LogCategory.SEARCH)
          const enclosureResult = await searchRackMountFiberEnclosuresImpl({
            searchTerm: processedQuery.processedTerm,
            aiAnalysis,
            limit
          })
          products = enclosureResult.products
          searchStrategy = `rack_mount_enclosures_${enclosureResult.searchStrategy}`
        } else {
          // Generic "fiber enclosure" search - show BOTH types
          logger.info('Generic fiber enclosure search - showing BOTH wall and rack mount', {}, LogCategory.SEARCH)

          // Get wall mount enclosures
          const wallResult = await searchWallMountFiberEnclosuresImpl({
            searchTerm: processedQuery.processedTerm,
            aiAnalysis,
            limit: Math.floor(limit / 2) // Split the limit
          })

          // Get rack mount enclosures
          const rackResult = await searchRackMountFiberEnclosuresImpl({
            searchTerm: processedQuery.processedTerm,
            aiAnalysis,
            limit: Math.floor(limit / 2)
          })

          // Combine results
          products = [...wallResult.products, ...rackResult.products]

          // Sort by relevance if available, otherwise mix them
          products.sort((a, b) => {
            const aRelevance = a.searchRelevance || 0.5
            const bRelevance = b.searchRelevance || 0.5
            return bRelevance - aRelevance
          })

          searchStrategy = 'mixed_fiber_enclosures'
          logger.info(`Found ${wallResult.products.length} wall mount and ${rackResult.products.length} rack mount enclosures`, {}, LogCategory.SEARCH)
        }
        break

      case 'multi_table':
        logger.info('Executing enhanced multi-table brand search', {}, LogCategory.SEARCH)
        // For brand-only searches, use the dedicated brand search function
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
        logger.info('Default category cables search', {}, LogCategory.SEARCH)
        const defaultResult = await searchCategoryCablesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = defaultResult.products
        searchStrategy = `category_cables_default_${defaultResult.searchStrategy}`
    }

    // Enrich products with datasheet URLs if available
    if (products.length > 0) {
      try {
        const datasheetUrls = await getDatasheetUrls(products)
        products.forEach(product => {
          const url = datasheetUrls.get(product.partNumber)
          if (url) {
            product.datasheetUrl = url
          }
        })
      } catch (error) {
        logger.error('Failed to fetch datasheet URLs', error, LogCategory.SEARCH)
      }
    }

    // Generate smart filters if we have products
    const smartFilters = products.length > 0 ? generateSmartFilters(products) : undefined

    const endTime = performance.now()
    const searchTime = Math.round(endTime - startTime)

    endTimer()
    logger.searchComplete(query, products.length, searchTime)

    // Track successful search
    trackSearch({
      searchTerm: query,
      resultsCount: products.length,
      searchTimeMs: searchTime,
      searchType,
      aiProductType
    }).catch(error => {
      logger.error('Analytics tracking failed', error, LogCategory.ANALYTICS)
    })

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
    logger.error('Search service error', error, LogCategory.SEARCH)
    const endTime = performance.now()
    const searchTimeMs = Math.round(endTime - startTime)

    endTimer()

    // Track failed search
    trackSearch({
      searchTerm: query,
      resultsCount: 0,
      searchTimeMs,
      searchType,
      aiProductType
    }).catch(trackError => logger.error('Analytics tracking failed', trackError, LogCategory.ANALYTICS))

    return {
      products: [],
      searchTime: searchTimeMs,
      searchType: 'error',
      redirectMessage: 'An unexpected error occurred during search'
    }
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

export default searchProducts