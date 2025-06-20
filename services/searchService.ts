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
import { TABLE_NAMES } from '@/config/tableNames'

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
// Updated June 19, 2025 - Now uses router that checks V2 environment variable
import {
  searchCategoryCables as searchCategoryCablesImpl,
} from '@/search/categoryCables'  // Changed to use index.ts router

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

import {
  searchFaceplates as searchFaceplatesImpl,
} from '@/search/faceplates/faceplateSearch'

import {
  searchSurfaceMountBoxes as searchSurfaceMountBoxesImpl,
} from '@/search/surfaceMountBoxes/surfaceMountBoxSearch'

import {
  searchModularPlugs as searchModularPlugsImpl,
  generateModularPlugFilters,
} from '@/search/modularPlugs/modularPlugSearch'

// Database result type for search results from dynamic table discovery
interface DatabaseSearchResult {
  id: number
  part_number?: string
  brand?: string
  short_description?: string
  unit_price?: string
  stock_quantity?: number
  _tableName: string
  _tablePrefix: string
  // Category cable specific fields
  category_rating?: string
  jacket_material?: string
  jacket_code?: string
  jacket_color?: string
  Shielding_Type?: string
  product_line?: string
  pair_count?: string
  conductor_awg?: number
  cable_diameter_in?: number
  packaging_type?: string
  application?: string
  possible_cross?: string
  // Fiber connector specific fields
  connector_type?: string
  fiber_category?: string
  product_type?: string
  technology?: string
  polish?: string
  housing_color?: string
  boot_color?: string
  // Adapter panel specific fields
  fiber_count?: number
  panel_type?: string
  number_of_adapter_per_panel?: number
  adapter_color?: string
  termination_type?: string
  possible_equivalent?: string
  compatible_enclosures?: string
  common_terms?: string
  supports_apc?: boolean
  // Rack mount enclosure specific fields
  mount_type?: string
  rack_units?: number
  accepts_number_of_connector_housing_panels?: number
  color?: string
  material?: string
  supports_splice_trays?: boolean
  environment?: string
  fiber_enclosure_splice_tray?: string
  upc_number?: string
  // Modular plug specific fields
  shielding_type?: string
  packaging_qty?: number
  compatible_boots?: string
  // Allow any other fields that might exist
  [key: string]: any
}

// Import shared industry knowledge
import {
  validateElectricalQuery,
  applyBusinessRules,
  detectPartNumbers,
  normalizePartNumber,
  detectCrossReferenceRequest,
  detectQuantity,
  normalizeMountType,
  normalizeMountTypes,
} from '@/search/shared/industryKnowledge'

// Import cross-reference service
import { findCrossReferences } from '@/services/crossReferenceService'

// Import datasheet service
import { getDatasheetUrls } from '@/services/datasheetService'

// Decision Engine Integration
import { searchWithDecisionEngine } from './decisionEngine/integration'

// Feature flag for Decision Engine
const DECISION_ENGINE_MODE = process.env.USE_DECISION_ENGINE || 'disabled'

// ===================================================================
// AI INTEGRATION - ENHANCED WITH RACK UNIT DETECTION
// ===================================================================

/**
 * Enhanced AI specs detection with rack unit parsing and box quantity conversion
 */
const enhanceAIAnalysis = (aiAnalysis: AISearchAnalysis | null, searchTerm: string): AISearchAnalysis | null => {
  if (!aiAnalysis) return null

  const term = searchTerm.toLowerCase()
  let wasEnhanced = false
  
  // Check for modular plug terms that AI often misses - MUST BE FIRST
  if ((term.includes('modular plug') || term.includes('modluar plug') || term.includes('modualr plug') ||
       term.includes('cable ends') || term.includes('clear ends') || term.includes('cable end') ||
       term.includes('crimp connector') || term.includes('terminator plug') || 
       term.includes('ethernet connector') || term.includes('network plug') ||
       (term.includes('plug') && (term.includes('rj45') || term.includes('rj-45'))) ||
       (term.includes('crimp') && !term.includes('tool'))) &&
      !term.includes('jack') && !term.includes('keystone') && !term.includes('module')) {
    logger.info('Enhanced AI: Detected Modular Plug - overriding AI analysis', {
      originalProductType: aiAnalysis.productType,
      newProductType: 'MODULAR_PLUG'
    }, LogCategory.AI)
    aiAnalysis.productType = 'MODULAR_PLUG'
    aiAnalysis.searchStrategy = 'modular_plugs'
    aiAnalysis.confidence = 0.95
    aiAnalysis.reasoning = 'Detected modular plug/RJ45 connector terminology'
    wasEnhanced = true
  }
  
  // Check for SMB (Surface Mount Box) abbreviations that AI often misses
  else if ((term.includes('smb') || term.includes('s.m.b') || term.includes('sm box')) &&
      !term.includes('jack module') && !term.includes('keystone')) {
    logger.info('Enhanced AI: Detected SMB/Surface Mount Box - overriding AI analysis', {}, LogCategory.AI)
    aiAnalysis.productType = 'SURFACE_MOUNT_BOX'
    aiAnalysis.searchStrategy = TABLE_NAMES.SURFACE_MOUNT_BOXES
    aiAnalysis.confidence = 0.95
    aiAnalysis.reasoning = 'Detected SMB (Surface Mount Box) abbreviation'
    wasEnhanced = true
  }
  
  // Check if text detection found box quantities that AI missed
  const textDetectedQuantity = detectQuantity(searchTerm)
  if (textDetectedQuantity && textDetectedQuantity > (aiAnalysis.detectedSpecs.requestedQuantity || 0)) {
    logger.debug(`Enhanced AI: Using text-detected quantity ${textDetectedQuantity} (from boxes) instead of AI quantity ${aiAnalysis.detectedSpecs.requestedQuantity}`, {}, LogCategory.AI)
    aiAnalysis.detectedSpecs.requestedQuantity = textDetectedQuantity
    wasEnhanced = true
  }

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
const getAIAnalysis = async (query: string, shoppingListContext?: SearchOptions['shoppingListContext']): Promise<AISearchAnalysis | null> => {
  // Use the cache wrapper with shopping list context
  return getCachedAIAnalysis(query, async (q) => {
    try {
      logger.debug('Getting FRESH AI analysis', { query: q, hasShoppingListContext: !!shoppingListContext }, LogCategory.AI)

      // Skip AI calls during build/static generation
      if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_VERCEL_URL) {
        logger.warn('Skipping AI call during build', { query: q }, LogCategory.AI)
        return null
      }
      
      // In server-side code, we need to use absolute URLs
      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      const response = await fetch(`${baseUrl}/api/ai-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: q,
          userContext: {
            businessType: 'electrical_distributor',
            shoppingListContext
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
  }, shoppingListContext)
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
    const products: Product[] = (searchResults as DatabaseSearchResult[]).map((item: DatabaseSearchResult) => {
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
          mountType: item.mount_type?.trim() || 'Rack Mount',
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
        }),

        ...(item._tableName === 'modular_plugs' && {
          categoryRating: item.category_rating || undefined,
          shieldingType: item.shielding_type?.trim() || undefined,
          conductorAwg: item.conductor_awg || undefined,
          packagingQty: item.packaging_qty || undefined,
          productLine: item.product_line?.trim() || undefined,
          commonTerms: item.common_terms?.trim() || undefined,
          compatibleBoots: item.compatible_boots || undefined
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
            mountType: item.mount_type?.trim() || 'Rack Mount',
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
  if (tableName.includes('modular_plugs')) return 'Modular Plug'
  if (tableName.includes('jack_modules')) return 'Jack Module'
  if (tableName.includes('faceplates')) return 'Faceplate'
  if (tableName.includes(TABLE_NAMES.SURFACE_MOUNT_BOXES)) return 'Surface Mount Box'
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
  
  // Extract all mount types (handling products with multiple mount options)
  const allMountTypes: string[] = []
  const rawMountTypes: string[] = []
  products.forEach(p => {
    if (p.mountType) {
      rawMountTypes.push(p.mountType)
      const types = normalizeMountTypes(p.mountType)
      allMountTypes.push(...types)
    }
  })
  
  // Debug logging
  logger.info('Mount type extraction', {
    uniqueRawMountTypes: [...new Set(rawMountTypes)],
    uniqueNormalizedTypes: [...new Set(allMountTypes)],
    filterResult: filterString(allMountTypes)
  }, LogCategory.SEARCH)
  
  const mountTypes = filterString(allMountTypes)
  
  // Faceplate and SMB specific filters
  const numberOfPorts = filterString(products.map(p => p.numberOfPorts?.toString()))
  const numberGang = filterString(products.map(p => p.numberGang?.toString()))

  // Check what types of products we have
  const hasAdapterPanels = products.some(p => p.tableName === 'adapter_panels')
  const hasFiberEnclosures = products.some(p => p.tableName === 'rack_mount_fiber_enclosures')
  const hasJackModules = products.some(p => p.tableName === 'jack_modules')
  const hasFaceplates = products.some(p => p.tableName === 'faceplates')
  const hasSurfaceMountBoxes = products.some(p => p.tableName === TABLE_NAMES.SURFACE_MOUNT_BOXES)
  const hasModularPlugs = products.some(p => p.tableName === 'modular_plugs')

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
    // productTypes removed per user request to save space
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
    }),
    // Add faceplate and SMB filters
    ...((hasFaceplates || hasSurfaceMountBoxes) && {
      ports: numberOfPorts,
      gang: numberGang
    }),
    // Add modular plug filters only if we have modular plugs
    ...(hasModularPlugs && {
      awgSizes: filterString(products.map(p => p.conductorAwg?.toString())),
      packagingSizes: filterString(products.map(p => (p as any).packagingQty?.toString())),
      packagingType: filterString(products.map(p => p.packagingType))
    })

  }
}

// ===================================================================
// TABLE DETERMINATION LOGIC - ENHANCED FOR BETTER ENCLOSURE DETECTION
// ===================================================================

const determineTargetTable = (aiAnalysis: AISearchAnalysis | null, searchTerm: string): ProductTable => {
  const query = searchTerm.toLowerCase()

  logger.debug('Available product types', { types: Object.keys(PRODUCT_TYPES) }, LogCategory.SEARCH)
  
  // Log the full AI analysis for debugging
  logger.info('determineTargetTable - AI Analysis received', {
    hasAiAnalysis: !!aiAnalysis,
    productType: aiAnalysis?.productType,
    searchStrategy: aiAnalysis?.searchStrategy,
    confidence: aiAnalysis?.confidence,
    searchTerm: searchTerm
  }, LogCategory.SEARCH)

  // Check if aiAnalysis is null or undefined
  if (!aiAnalysis) {
    logger.warn('determineTargetTable - AI Analysis is null/undefined, using keyword fallback', {}, LogCategory.SEARCH)
  }

  // PRIORITY 1: Check if AI says ENCLOSURE
  if (aiAnalysis?.productType === 'ENCLOSURE') {
    logger.info('AI productType is ENCLOSURE - routing to fiber_enclosures', {}, LogCategory.AI)
    return 'fiber_enclosures'
  }

  // PRIORITY 1.5: Check if AI says FACEPLATE (includes SMB)
  logger.info('Checking if AI productType is FACEPLATE', {
    aiProductType: aiAnalysis?.productType,
    isFaceplate: aiAnalysis?.productType === 'FACEPLATE',
    aiAnalysisExists: !!aiAnalysis
  }, LogCategory.SEARCH)
  
  if (aiAnalysis?.productType === 'FACEPLATE') {
    logger.info('AI productType is FACEPLATE - routing to faceplates', {}, LogCategory.AI)
    return 'faceplates'
  }
  
  // PRIORITY 1.55: Check if AI says SURFACE_MOUNT_BOX
  if (aiAnalysis?.productType === 'SURFACE_MOUNT_BOX') {
    logger.info('AI productType is SURFACE_MOUNT_BOX - routing to surface_mount_box', {}, LogCategory.AI)
    return TABLE_NAMES.SURFACE_MOUNT_BOXES
  }

  // PRIORITY 1.6: Check if AI says JACK_MODULE
  if (aiAnalysis?.productType === 'JACK_MODULE') {
    logger.info('AI productType is JACK_MODULE - routing to jack_modules', {}, LogCategory.AI)
    return 'jack_modules'
  }

  // PRIORITY 1.65: Check if AI says MODULAR_PLUG
  if (aiAnalysis?.productType === 'MODULAR_PLUG') {
    logger.info('AI productType is MODULAR_PLUG - routing to modular_plugs', {}, LogCategory.AI)
    return 'modular_plugs'
  }
  
  // PRIORITY 1.651: Double-check for modular plug in case enhancement failed
  const lowerQuery = query.toLowerCase()
  if ((lowerQuery.includes('modular plug') || lowerQuery.includes('modluar plug') || lowerQuery.includes('modualr plug') ||
       lowerQuery.includes('cable ends') || lowerQuery.includes('clear ends') || lowerQuery.includes('cable end') ||
       lowerQuery.includes('crimp connector') || lowerQuery.includes('terminator plug') || 
       lowerQuery.includes('ethernet connector') || lowerQuery.includes('network plug') ||
       (lowerQuery.includes('plug') && (lowerQuery.includes('rj45') || lowerQuery.includes('rj-45'))) ||
       (lowerQuery.includes('crimp') && !lowerQuery.includes('tool'))) &&
      !lowerQuery.includes('jack') && !lowerQuery.includes('keystone') && !lowerQuery.includes('module')) {
    logger.info('FALLBACK: Modular plug detected via keyword check - routing to modular_plugs', {}, LogCategory.SEARCH)
    return 'modular_plugs'
  }

  // PRIORITY 1.7: Check if AI says CONNECTOR
  if (aiAnalysis?.productType === 'CONNECTOR') {
    logger.info('AI productType is CONNECTOR - routing to fiber_connectors', {}, LogCategory.AI)
    return 'fiber_connectors'
  }

  // PRIORITY 1.8: Check if AI says PANEL
  if (aiAnalysis?.productType === 'PANEL') {
    logger.info('AI productType is PANEL - routing to adapter_panels', {}, LogCategory.AI)
    return 'adapter_panels'
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

// PRIORITY 3: Check for modular plug keywords FIRST (before jack modules)
  const modularPlugTerms = [
    'modular plug', 'rj45', 'rj-45', 'rj 45', '8p8c',
    'ethernet connector', 'network plug', 'ethernet plug',
    'network connector', 'modular connector', 'crimp connector',
    'terminator plug', 'data connector', 'lan connector',
    'pass-through plug', 'ez-rj45', 'feed-through',
    'crimp', 'crimps', 'network crimp', 'cable crimp',
    'cable ends', 'clear ends', 'cable end', 'clear end'
  ]
  
  const hasModularPlugTerms = modularPlugTerms.some(term => query.includes(term))
  
  // Check for modular plug before jack module
  logger.info('Checking modular plug terms', { 
    hasModularPlugTerms, 
    hasJack: query.includes('jack'),
    hasKeystone: query.includes('keystone'),
    query 
  }, LogCategory.SEARCH)
  
  if (hasModularPlugTerms && !query.includes('jack') && !query.includes('keystone')) {
    logger.info('Modular Plug detected - routing to modular_plugs', {}, LogCategory.SEARCH)
    return 'modular_plugs'
  }

  // PRIORITY 4: Check for jack module keywords
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

  // PRIORITY 5: Check for surface mount box keywords
  const smbTerms = [
    'surface mount box', 'surface mount', 'surface box',
    'mounting box', 'box mount', 'smb', 's.m.b', 'sm box',
    'surface-mount', 'surfacemount', 's m b'
  ]
  
  const hasSMBTerms = smbTerms.some(term => query.includes(term))
  
  if (hasSMBTerms) {
    logger.info('Surface Mount Box detected - routing to surface_mount_box', {}, LogCategory.SEARCH)
    return TABLE_NAMES.SURFACE_MOUNT_BOXES
  }
  
  // PRIORITY 6: Check for faceplate keywords
  const faceplateTerms = [
    'faceplate', 'face plate', 'wall plate', 'wallplate',
    'gang plate', 'gang box', 'outlet frame', 'port plate'
  ]
  
  const hasFaceplateTerms = faceplateTerms.some(term => query.includes(term))
  
  if (hasFaceplateTerms) {
    logger.info('Faceplate detected - routing to faceplates', {}, LogCategory.SEARCH)
    return 'faceplates'
  }

  // Check for brand-only searches
  const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'berktek', 'prysmian', 'dmsi', 'siecor', 'hubbell']
  const queryWords = query.trim().split(/\s+/)

  if (queryWords.length === 1 && brandKeywords.includes(queryWords[0])) {
    logger.info(`BRAND-ONLY SEARCH DETECTED: "${queryWords[0]}" - routing to multi_table`, {}, LogCategory.SEARCH)
    return 'multi_table'
  }

  // Enhanced connector detection - use word boundaries to avoid false positives
  const connectorTerms = ['connector', 'connectors']
  const connectorTypes = ['lc', 'sc', 'st', 'fc', 'mtp', 'mpo']
  
  // Check for connector terms or standalone connector types (not part of other words like STP)
  const hasConnectorTerms = connectorTerms.some(term => query.includes(term)) ||
    connectorTypes.some(type => {
      const regex = new RegExp(`\\b${type}\\b`, 'i')
      return regex.test(query)
    })

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
  logger.info('Default routing to category_cables - no specific product type matched', {
    aiProductType: aiAnalysis?.productType,
    searchTerm: query,
    hadEnclosureTerms: hasEnclosureTerms,
    hadJackTerms: hasJackTerms,
    hadFaceplateTerms: hasFaceplateTerms,
    hadConnectorTerms: hasConnectorTerms,
    hadFiberTerms: hasFiberTerms
  }, LogCategory.SEARCH)
  return 'category_cables'
}

// ===================================================================
// BRAND SEARCH - NEW DEDICATED FUNCTION
// ===================================================================

const searchAllTablesByBrand = async (brand: string, limit: number, shoppingListContext?: SearchOptions['shoppingListContext']): Promise<Product[]> => {
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
      limit: Math.floor(limit / 5),
      shoppingListContext: shoppingListContext ? {
        fiberCables: shoppingListContext.fiberCables
      } : undefined
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

  // Search modular plugs
  try {
    logger.debug(`Searching modular plugs for brand: ${brand}`, {}, LogCategory.SEARCH)
    const modularPlugResult = await searchModularPlugsImpl({
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
    const brandProducts = modularPlugResult.products.filter(p =>
      p.brand.toLowerCase().includes(brand.toLowerCase())
    )
    if (brandProducts.length > 0) {
      logger.info(`Found ${brandProducts.length} ${brand} modular plugs`, {}, LogCategory.SEARCH)
      allProducts = [...allProducts, ...brandProducts]
    }
  } catch (error) {
    logger.error('Error searching modular plugs', error, LogCategory.SEARCH)
  }

  logger.info(`TOTAL BRAND SEARCH RESULTS: ${allProducts.length} products for ${brand}`, {}, LogCategory.SEARCH)
  return allProducts
}

// ===================================================================
// MAIN SEARCH SERVICE - WITH ANALYTICS TRACKING
// ===================================================================

export const searchProducts = async (options: SearchOptions): Promise<SearchResult> => {
  // Log Decision Engine mode for debugging
  logger.info('Decision Engine Mode:', { mode: DECISION_ENGINE_MODE }, LogCategory.SEARCH)
  
  // Decision Engine Integration
  if (DECISION_ENGINE_MODE === 'shadow') {
    // Shadow mode - run both engines and compare
    logger.info('Running in shadow mode', { query: options.query }, LogCategory.SEARCH)
    try {
      // Run the Decision Engine to get routing decision
      const decisionResult = await searchWithDecisionEngine(
        options.query,
        options.shoppingListContext,
        async (q, ctx) => {
          // This function is called by shadow mode to get old results
          return performOriginalSearch({ ...options, query: q, shoppingListContext: ctx })
        }
      )
      
      // In shadow mode, the adapter returns the old result
      // So we can return it directly
      return decisionResult
    } catch (error) {
      logger.error('Decision Engine shadow mode error, falling back:', error, LogCategory.SEARCH)
      return performOriginalSearch(options)
    }
  } else if (DECISION_ENGINE_MODE === 'production') {
    // Production mode - use Decision Engine for routing only
    try {
      // Get routing decision from Decision Engine
      const routingDecision = await searchWithDecisionEngine(
        options.query,
        options.shoppingListContext
      )
      
      // Use the routing decision to call the appropriate search
      // This will be implemented after we verify shadow mode works
      logger.info('Decision Engine production mode not fully implemented yet', 
        { decision: routingDecision }, 
        LogCategory.SEARCH
      )
      
      // For now, fall back to original search
      return performOriginalSearch(options)
    } catch (error) {
      logger.error('Decision Engine production mode error:', error, LogCategory.SEARCH)
      return performOriginalSearch(options)
    }
  }

  // Original search logic (when Decision Engine is disabled)
  return performOriginalSearch(options)
}

// Extract original search logic into separate function
const performOriginalSearch = async (options: SearchOptions): Promise<SearchResult> => {
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

  const { query, limit = 200, includeAI = true, shoppingListContext } = options

  try {
    logger.info('SEARCH SERVICE - Enhanced search started', { 
      query, 
      hasShoppingListContext: !!shoppingListContext 
    }, LogCategory.SEARCH)

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
      aiAnalysis = await getAIAnalysis(processedQuery.processedTerm, shoppingListContext)

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
      
      // Add explicit logging for modular plug searches
      if (processedQuery.processedTerm.toLowerCase().includes('modular plug')) {
        logger.info('🔌 MODULAR PLUG DEBUG - After Enhancement', {
          searchTerm: processedQuery.processedTerm,
          enhancedProductType: aiAnalysis?.productType,
          enhancedStrategy: aiAnalysis?.searchStrategy,
          confidence: aiAnalysis?.confidence
        }, LogCategory.SEARCH)
      }
    }

    // Step 5: Determine Target Table
    const targetTable = determineTargetTable(aiAnalysis, processedQuery.processedTerm)
    logger.info(`Target table determined: ${targetTable}`, {}, LogCategory.SEARCH)
    
    // Add explicit logging for modular plug routing
    if (processedQuery.processedTerm.toLowerCase().includes('modular plug')) {
      logger.info('🔌 MODULAR PLUG DEBUG - Target Table', {
        determinedTable: targetTable,
        shouldBeModularPlugs: targetTable === 'modular_plugs' ? '✅ CORRECT' : '❌ WRONG'
      }, LogCategory.SEARCH)
    }

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
          limit,
          shoppingListContext: shoppingListContext ? {
            fiberCables: shoppingListContext.fiberCables
          } : undefined
        })
        products = connectorResult.products
        searchStrategy = `fiber_connectors_${connectorResult.searchStrategy}`
        break

      case 'adapter_panels':
        logger.info('Executing adapter panels search', {}, LogCategory.SEARCH)
        const panelResult = await searchAdapterPanelsImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit,
          shoppingListContext
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
          limit,
          shoppingListContext
        })
        products = jackResult.products
        searchStrategy = `jack_modules_${jackResult.searchStrategy}`
        break

      case 'faceplates':
        logger.info('Executing faceplates search', {}, LogCategory.SEARCH)
        const faceplateResult = await searchFaceplatesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit,
          shoppingListContext
        })
        products = faceplateResult.products
        searchStrategy = `faceplates_${faceplateResult.searchStrategy}`
        break

      case TABLE_NAMES.SURFACE_MOUNT_BOXES:
        logger.info('Executing surface mount box search', {}, LogCategory.SEARCH)
        const smbResult = await searchSurfaceMountBoxesImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit,
          shoppingListContext
        })
        products = smbResult.products
        searchStrategy = `surface_mount_box_${smbResult.searchStrategy}`
        
        // Handle table not found message
        if (smbResult.message && smbResult.searchStrategy === 'table_not_found') {
          logger.warn('SMB table not found, returning with message', { message: smbResult.message }, LogCategory.SEARCH)
          // Store the message to be returned
          processedQuery.redirectMessage = smbResult.message
        }
        break

      case 'modular_plugs':
        logger.info('Executing modular plugs search', {}, LogCategory.SEARCH)
        const modularPlugResult = await searchModularPlugsImpl({
          searchTerm: processedQuery.processedTerm,
          aiAnalysis,
          limit
        })
        products = modularPlugResult.products
        searchStrategy = `modular_plugs_${modularPlugResult.searchStrategy}`
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
          products = await searchAllTablesByBrand(queryLower, limit, shoppingListContext)
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
              limit: Math.floor((limit - products.length) / 4),
              shoppingListContext: shoppingListContext ? {
                fiberCables: shoppingListContext.fiberCables
              } : undefined
            })
            products = [...products, ...connResults.products]
          }

          if (products.length < limit) {
            const panelResults = await searchAdapterPanelsImpl({
              searchTerm: processedQuery.processedTerm,
              aiAnalysis,
              limit: Math.floor((limit - products.length) / 3),
              shoppingListContext
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
    
    // Generate auto-apply filters based on shopping list context
    let autoApplyFilters: { [filterType: string]: string } | undefined
    
    // Check if we're searching for surface mount boxes and have jack modules in the shopping list
    if (targetTable === TABLE_NAMES.SURFACE_MOUNT_BOXES && shoppingListContext?.jackModules && shoppingListContext.jackModules.length > 0) {
      // Extract unique brands from jack modules in shopping list
      const jackBrands = [...new Set(shoppingListContext.jackModules.map(jack => jack.brand).filter(Boolean))]
      
      if (jackBrands.length > 0 && smartFilters?.brands) {
        // Find the first matching brand that exists in the available filters
        for (const brand of jackBrands) {
          const matchingBrand = smartFilters.brands.find(filterBrand => 
            filterBrand.toLowerCase() === brand.toLowerCase()
          )
          
          if (matchingBrand) {
            autoApplyFilters = {
              brand: matchingBrand
            }
            logger.info('Auto-applying brand filter for SMB based on jack modules in shopping list', { 
              jackBrand: brand,
              appliedBrand: matchingBrand,
              availableBrands: smartFilters.brands
            }, LogCategory.SEARCH)
            break
          }
        }
      }
    }
    
    // Check if we're searching for fiber connectors and have fiber cables in the shopping list
    if (targetTable === 'fiber_connectors' && shoppingListContext?.fiberCables && shoppingListContext.fiberCables.length > 0) {
      // Extract unique fiber types from shopping list
      const shoppingListFiberTypes = new Set<string>()
      shoppingListContext.fiberCables.forEach(cable => {
        if (cable.fiberType) {
          // Handle multiple fiber types (e.g., "OM3, OM4")
          const types = cable.fiberType.split(',').map(t => t.trim()).filter(t => t)
          types.forEach(type => {
            // Normalize fiber type (e.g., "OS2" -> "Singlemode", "OM3" -> "OM3")
            if (type.toUpperCase().startsWith('OS')) {
              shoppingListFiberTypes.add('Singlemode')
              // Also add the original OS type in case it's used in the database
              shoppingListFiberTypes.add(type.toUpperCase())
            } else if (type.toUpperCase().match(/^OM[1-5]$/)) {
              shoppingListFiberTypes.add(type.toUpperCase())
            } else if (type.toLowerCase() === 'singlemode' || type.toLowerCase() === 'single mode') {
              shoppingListFiberTypes.add('Singlemode')
            } else if (type.toLowerCase() === 'multimode' || type.toLowerCase() === 'multi mode') {
              shoppingListFiberTypes.add('Multimode')
            }
          })
        }
      })
      
      logger.info('Shopping list fiber types detected', {
        shoppingListFiberTypes: Array.from(shoppingListFiberTypes),
        smartFilterFiberTypes: smartFilters?.fiberTypes || []
      }, LogCategory.SEARCH)
      
      // If we have fiber types from shopping list and they exist in the filter options
      if (shoppingListFiberTypes.size > 0 && smartFilters?.fiberTypes) {
        // Find the first matching fiber type that exists in the available filters
        // Check both exact match and partial match (e.g., "OM4" in "Multimode, OM4")
        for (const fiberType of shoppingListFiberTypes) {
          // First try exact match (case-insensitive)
          let matchingFilterType = smartFilters.fiberTypes.find(filterType => 
            filterType.toLowerCase() === fiberType.toLowerCase()
          )
          
          // If no exact match, try partial match (e.g., "OM4" within "Multimode, OM4")
          if (!matchingFilterType) {
            matchingFilterType = smartFilters.fiberTypes.find(filterType => 
              filterType.toLowerCase().includes(fiberType.toLowerCase()) ||
              fiberType.toLowerCase().includes(filterType.toLowerCase())
            )
          }
          
          if (matchingFilterType) {
            autoApplyFilters = {
              fiberType: matchingFilterType // Use the actual filter value, not our normalized one
            }
            logger.info('Auto-applying fiber type filter based on shopping list', { 
              requestedType: fiberType,
              appliedType: matchingFilterType,
              matchType: matchingFilterType.toLowerCase() === fiberType.toLowerCase() ? 'exact' : 'partial',
              shoppingListFiberTypes: Array.from(shoppingListFiberTypes),
              availableFilterOptions: smartFilters.fiberTypes
            }, LogCategory.SEARCH)
            break
          }
        }
        
        // If no match found, log the actual values for debugging
        if (!autoApplyFilters) {
          logger.warn('No matching fiber type found in filter options', {
            shoppingListTypes: Array.from(shoppingListFiberTypes),
            availableTypes: smartFilters.fiberTypes,
            note: 'Check if fiber types are stored differently (e.g., "Multimode, OM4" vs "OM4")'
          }, LogCategory.SEARCH)
        }
      }
    }

    // Auto-apply product line filter for faceplates based on jack modules in shopping list
    if (targetTable === 'faceplates' && shoppingListContext?.jackModules && shoppingListContext.jackModules.length > 0) {
      logger.info('Checking for auto-apply filters for faceplates based on jack modules', {
        jackModuleCount: shoppingListContext.jackModules.length
      }, LogCategory.SEARCH)

      // Extract unique compatible faceplate values from all jack modules
      const compatibleFaceplateTypes = new Set<string>()
      
      shoppingListContext.jackModules.forEach((jack) => {
        if (jack.compatibleFaceplates) {
          // Handle various formats: "Keystone", '["NetKey", "Keystone"]', ARRAY['NetKey', 'Keystone']
          const faceplateValue: string = String(jack.compatibleFaceplates)
          
          // Handle PostgreSQL array format ["NetKey", "Keystone"] or ARRAY['NetKey', 'Keystone']
          if (Array.isArray(jack.compatibleFaceplates)) {
            jack.compatibleFaceplates.forEach((val: string) => {
              if (val && val.trim()) {
                compatibleFaceplateTypes.add(val.trim())
              }
            })
          } else {
            // Handle string representation
            let cleanValue = faceplateValue
            
            // Remove ARRAY prefix if present
            if (cleanValue.startsWith('ARRAY[')) {
              cleanValue = cleanValue.substring(6, cleanValue.length - 1)
            }
            
            // Parse JSON array if it's a string representation
            try {
              if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
                const parsed = JSON.parse(cleanValue) as unknown
                if (Array.isArray(parsed)) {
                  parsed.forEach((val: unknown) => {
                    if (typeof val === 'string' && val.trim()) {
                      compatibleFaceplateTypes.add(val.trim())
                    }
                  })
                  return
                }
              }
            } catch (e) {
              // Not JSON, continue with string parsing
            }
            
            // Handle PostgreSQL array format {value1,value2}
            if (cleanValue.startsWith('{') && cleanValue.endsWith('}')) {
              cleanValue = cleanValue.slice(1, -1)
            }
            
            // Handle comma-separated values
            if (cleanValue.includes(',')) {
              cleanValue.split(',').forEach((val: string) => {
                const trimmed = val.trim().replace(/['"]/g, '')
                if (trimmed) {
                  compatibleFaceplateTypes.add(trimmed)
                }
              })
            } else {
              // Single value
              const trimmed = cleanValue.trim().replace(/['"]/g, '')
              if (trimmed) {
                compatibleFaceplateTypes.add(trimmed)
              }
            }
          }
        }
      })

      logger.info('Extracted compatible faceplate types from jack modules', {
        compatibleTypes: Array.from(compatibleFaceplateTypes)
      }, LogCategory.SEARCH)

      // Don't auto-apply product line filters for faceplates
      // When searching for faceplates with jack modules in cart, we want to show ALL compatible options
      // Both Keystone and NetKey faceplates work with keystone-style jacks
      // Users should see all options and can manually filter if needed
      logger.info('Not auto-applying product line filter for faceplates - showing all compatible options', {
        compatibleTypes: Array.from(compatibleFaceplateTypes),
        availableProductLines: smartFilters?.productLines || []
      }, LogCategory.SEARCH)
    }

    // Auto-apply product line filter for jack modules based on faceplates in shopping list
    if (targetTable === 'jack_modules' && shoppingListContext?.faceplates && shoppingListContext.faceplates.length > 0) {
      logger.info('Checking for auto-apply filters for jack modules based on faceplates', {
        faceplateCount: shoppingListContext.faceplates.length
      }, LogCategory.SEARCH)

      // Extract unique compatible jack values from all faceplates
      const compatibleJackTypes = new Set<string>()
      
      shoppingListContext.faceplates.forEach((faceplate) => {
        if (faceplate.compatibleJacks) {
          // Handle various formats similar to above
          const jackValue: string = String(faceplate.compatibleJacks)
          
          // Handle PostgreSQL array format
          if (Array.isArray(faceplate.compatibleJacks)) {
            faceplate.compatibleJacks.forEach((val: string) => {
              if (val && val.trim()) {
                compatibleJackTypes.add(val.trim())
              }
            })
          } else {
            // Handle string representation
            let cleanValue = jackValue
            
            // Remove ARRAY prefix if present
            if (cleanValue.startsWith('ARRAY[')) {
              cleanValue = cleanValue.substring(6, cleanValue.length - 1)
            }
            
            // Parse JSON array if it's a string representation
            try {
              if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
                const parsed = JSON.parse(cleanValue) as unknown
                if (Array.isArray(parsed)) {
                  parsed.forEach((val: unknown) => {
                    if (typeof val === 'string' && val.trim()) {
                      compatibleJackTypes.add(val.trim())
                    }
                  })
                  return
                }
              }
            } catch (e) {
              // Not JSON, continue with string parsing
            }
            
            // Handle PostgreSQL array format {value1,value2}
            if (cleanValue.startsWith('{') && cleanValue.endsWith('}')) {
              cleanValue = cleanValue.slice(1, -1)
            }
            
            // Handle comma-separated values
            if (cleanValue.includes(',')) {
              cleanValue.split(',').forEach((val: string) => {
                const trimmed = val.trim().replace(/['"]/g, '')
                if (trimmed) {
                  compatibleJackTypes.add(trimmed)
                }
              })
            } else {
              // Single value
              const trimmed = cleanValue.trim().replace(/['"]/g, '')
              if (trimmed) {
                compatibleJackTypes.add(trimmed)
              }
            }
          }
        }
      })

      logger.info('Extracted compatible jack types from faceplates', {
        compatibleTypes: Array.from(compatibleJackTypes)
      }, LogCategory.SEARCH)

      // Try to find a matching product line in the available filters
      if (compatibleJackTypes.size > 0 && smartFilters?.productLines && smartFilters.productLines.length > 0) {
        // Use same priority order
        const priorityOrder: string[] = ['Mini-Com', 'NetKey', 'Keystone', 'XCELERATOR', 'netSelect']
        
        for (const priority of priorityOrder) {
          if (compatibleJackTypes.has(priority)) {
            const matchingProductLine = smartFilters.productLines.find((line: string) => 
              line.toLowerCase() === priority.toLowerCase()
            )
            
            if (matchingProductLine) {
              autoApplyFilters = {
                productLine: matchingProductLine
              }
              logger.info('Auto-applying product line filter for jack modules based on priority', { 
                jackType: priority,
                appliedProductLine: matchingProductLine
              }, LogCategory.SEARCH)
              break
            }
          }
        }
        
        // If no priority match, try any match
        if (autoApplyFilters && !autoApplyFilters.productLine) {
          for (const jackType of compatibleJackTypes) {
            const matchingProductLine = smartFilters.productLines.find((line: string) => 
              line.toLowerCase() === jackType.toLowerCase()
            )
            
            if (matchingProductLine) {
              autoApplyFilters = {
                productLine: matchingProductLine
              }
              logger.info('Auto-applying product line filter for jack modules', { 
                jackType: jackType,
                appliedProductLine: matchingProductLine
              }, LogCategory.SEARCH)
              break
            }
          }
        }
      }
    }

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
      smartFilters,
      autoApplyFilters
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