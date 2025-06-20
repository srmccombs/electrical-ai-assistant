// crossReferenceService.ts
// Service for handling product cross-references across brands

import { supabase } from '@/lib/supabase'
import { detectBrand, normalizePartNumber } from '@/search/shared/industryKnowledge'
import { logger, LogCategory } from '@/utils/logger'
import type { Product } from '@/types'

export interface CrossReferenceResult {
  sourceProduct: Product | null
  crossReferences: Product[]
  searchType: 'exact_cross' | 'brand_equivalent' | 'fallback'
  message?: string
}

export interface ParsedCrossReference {
  brand: string
  partNumber: string
}

/**
 * Parse the possible_cross field which contains comma-separated brand:part_number pairs
 */
const parsePossibleCross = (possibleCross: string | null): ParsedCrossReference[] => {
  if (!possibleCross) return []
  
  const crosses: ParsedCrossReference[] = []
  
  // Split by comma and parse each entry
  const entries = possibleCross.split(',')
  
  for (let i = 0; i < entries.length; i += 2) {
    // Format is: brand:BrandName,part_number:PartNumber
    const brandEntry = entries[i]
    const partEntry = entries[i + 1]
    
    if (brandEntry && partEntry) {
      const brandMatch = brandEntry.match(/brand:(.+)/)
      const partMatch = partEntry.match(/part_number:(.+)/)
      
      if (brandMatch && partMatch) {
        crosses.push({
          brand: brandMatch[1].trim(),
          partNumber: partMatch[1].trim()
        })
      }
    }
  }
  
  return crosses
}

/**
 * Find cross-references for a given part number
 */
export const findCrossReferences = async (
  partNumber: string,
  targetBrand?: string,
  limit: number = 5
): Promise<CrossReferenceResult> => {
  const startTime = performance.now()
  
  logger.info('Cross-reference search started', { 
    partNumber, 
    targetBrand 
  }, LogCategory.SEARCH)
  
  try {
    // Step 1: Find the source product
    const normalizedPartNumber = normalizePartNumber(partNumber)
    
    // Search in multiple tables for the part number
    const tables = ['category_cables', 'fiber_connectors', 'adapter_panels', 'rack_mount_fiber_enclosures', 'jack_modules']
    let sourceProduct: Product | null = null
    let possibleCrossData: string | null = null
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .or(`part_number.eq.${partNumber},part_number.eq.${normalizedPartNumber},part_number.ilike.${partNumber}%`)
        .limit(1)
        .single()
      
      if (data && !error) {
        // Found the source product
        sourceProduct = formatProductFromTable(data, table)
        possibleCrossData = (data as any).possible_cross || null
        logger.info(`Found source product in ${table}`, { partNumber }, LogCategory.DATABASE)
        break
      }
    }
    
    if (!sourceProduct) {
      logger.warn('Source product not found', { partNumber }, LogCategory.SEARCH)
      return {
        sourceProduct: null,
        crossReferences: [],
        searchType: 'fallback',
        message: `Part number ${partNumber} not found in database`
      }
    }
    
    // Step 2: Parse cross-references
    const parsedCrosses = parsePossibleCross(possibleCrossData)
    logger.debug(`Found ${parsedCrosses.length} cross-references`, { parsedCrosses }, LogCategory.SEARCH)
    
    // Step 3: Filter by target brand if specified
    let filteredCrosses = parsedCrosses
    if (targetBrand) {
      // Normalize the target brand name
      const normalizedTargetBrand = detectBrand(targetBrand) || targetBrand
      
      filteredCrosses = parsedCrosses.filter(cross => {
        const crossBrandNormalized = detectBrand(cross.brand) || cross.brand
        return crossBrandNormalized.toLowerCase() === normalizedTargetBrand.toLowerCase()
      })
      
      logger.debug(`Filtered to ${filteredCrosses.length} crosses for brand: ${normalizedTargetBrand}`, {}, LogCategory.SEARCH)
    }
    
    // Step 4: Fetch the actual cross-reference products
    const crossProducts: Product[] = []
    
    for (const cross of filteredCrosses) {
      // Search for the cross-reference product in all tables
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('part_number', cross.partNumber)
          .eq('is_active', true)
          .limit(1)
          .single()
        
        if (data && !error) {
          const product = formatProductFromTable(data, table)
          crossProducts.push(product)
          break
        }
      }
    }
    
    const searchTime = Math.round(performance.now() - startTime)
    
    logger.info('Cross-reference search completed', {
      sourcePartNumber: partNumber,
      targetBrand,
      crossesFound: crossProducts.length,
      searchTime
    }, LogCategory.SEARCH)
    
    return {
      sourceProduct,
      crossReferences: crossProducts,
      searchType: filteredCrosses.length > 0 ? 'exact_cross' : 'brand_equivalent',
      message: crossProducts.length > 0
        ? `Found ${crossProducts.length} equivalent products${targetBrand ? ` for ${targetBrand}` : ''}`
        : targetBrand 
          ? `No cross-references found for ${targetBrand}. Showing all available crosses.`
          : 'No cross-references found for this product.'
    }
    
  } catch (error) {
    logger.error('Cross-reference search error', error, LogCategory.SEARCH)
    return {
      sourceProduct: null,
      crossReferences: [],
      searchType: 'fallback',
      message: 'Error searching for cross-references'
    }
  }
}

/**
 * Format raw database product into standard Product type
 */
const formatProductFromTable = (data: any, tableName: string): Product => {
  const baseProduct: Product = {
    id: `${tableName}-${data.id}`,
    partNumber: data.part_number?.toString() || 'No Part Number',
    brand: data.brand?.trim() || 'Unknown Brand',
    description: data.short_description?.trim() || 'No description available',
    price: parseFloat(data.unit_price || '') || Math.random() * 2 + 5,
    stockLocal: data.stock_quantity || 0,
    stockDistribution: 1,
    leadTime: 'Ships Today',
    category: determineCategoryFromTable(tableName),
    searchRelevance: 1.,
    tableName: tableName,
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }
  
  // Add table-specific fields
  switch (tableName) {
    case 'category_cables':
      return {
        ...baseProduct,
        categoryRating: data.category_rating?.trim() || undefined,
        jacketRating: data.jacket_material?.trim() || undefined,
        color: data.jacket_color?.trim() || undefined,
        shielding: data.Shielding_Type?.trim() || undefined,
        productLine: data.product_line?.trim() || undefined,
        possibleCross: data.possible_cross?.trim() || undefined
      }
    
    case 'jack_modules':
      return {
        ...baseProduct,
        categoryRating: data.category_rating?.trim() || undefined,
        color: data.color?.trim() || undefined,
        shielding: data.shielding_type?.trim() || undefined,
        productLine: data.product_line?.trim() || undefined,
        possibleCross: data.possible_cross?.trim() || undefined
      }
    
    default:
      return {
        ...baseProduct,
        possibleCross: data.possible_cross?.trim() || undefined
      }
  }
}

const determineCategoryFromTable = (tableName: string): string => {
  const categoryMap: Record<string, string> = {
    'category_cables': 'Category Cable',
    'fiber_connectors': 'Fiber Connector',
    'adapter_panels': 'Adapter Panel',
    'rack_mount_fiber_enclosures': 'Fiber Enclosure',
    'wall_mount_fiber_enclosures': 'Fiber Enclosure',
    'fiber_optic_cable': 'Fiber Cable',
    'jack_modules': 'Jack Module'
  }
  
  return categoryMap[tableName] || 'Product'
}