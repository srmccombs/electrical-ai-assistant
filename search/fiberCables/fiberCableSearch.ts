// src/search/fiberCables/fiberCableSearch.ts
// Fiber Cable Search Implementation - Fixed multimode/single-mode filtering
// Date created: June 6, 225

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'
import type { FiberCableRow } from '@/search/shared/types'
import { detectAndConvertPairToFiber } from '@/search/shared/searchUtils'

// ===================================================================
// TYPE DEFINITIONS - Fiber Cable Specific
// ===================================================================

export interface FiberCableSearchOptions {
  searchTerm: string
  aiAnalysis?: AISearchAnalysis | null
  limit?: number
}

export interface FiberCableSearchResult {
  products: Product[]
  searchStrategy: string
  totalFound: number
  searchTime: number
}

// ===================================================================
// FIBER CABLE SEARCH IMPLEMENTATION
// ===================================================================

export const searchFiberCables = async (
  options: FiberCableSearchOptions
): Promise<FiberCableSearchResult> => {
  const startTime = performance.now()
  const { searchTerm, aiAnalysis, limit = 100 } = options

  console.log('🌈 FIBER CABLES SEARCH')
  console.log('🔍 Original search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    let query = supabase
      .from('prod_fiber_cables')
      .select('*')
      .eq('is_active', true)
      .limit(limit)

    // Cable-specific search terms
    const cableTerms = [
      'loose tube', 'tight buffer', 'tight buffered',
      'armored', 'outdoor', 'indoor/outdoor', 'plenum',
      'riser', 'burial', 'underground', 'aerial',
      'water block', 'gel filled', 'stranded',
      'breakout', 'distribution', 'backbone'
    ]

    // Terms to exclude (these are NOT cables)
    const excludeTerms = [
      'adapter panel', 'panel', 'connector', 'adapter',
      'enclosure', 'housing', 'patch', 'pigtail',
      'jumper', 'coupler', 'splice'
    ]

    const queryLower = searchTerm.toLowerCase()

    // Check for pair-to-fiber conversion
    const pairConversion = detectAndConvertPairToFiber(searchTerm)
    let effectiveSearchTerm = searchTerm
    let requestedStrandCount: number | undefined

    if (pairConversion.detectedPairs && pairConversion.fiberCount) {
      // Use the converted fiber count
      requestedStrandCount = pairConversion.fiberCount
      effectiveSearchTerm = pairConversion.normalizedTerm
      console.log(`🔄 Using pair-to-fiber conversion: ${pairConversion.pairCount} pairs = ${pairConversion.fiberCount} fibers`)
    } else {
      // Check for strand patterns (e.g., "12 strand")
      const strandMatch = queryLower.match(/\b(\d+)\s*strand/i)
      requestedStrandCount = strandMatch && strandMatch[1]
        ? parseInt(strandMatch[1], 10)
        : aiAnalysis?.detectedSpecs?.fiberCount
    }

    if (requestedStrandCount) {
      console.log(`🧶 Strand count detected: ${requestedStrandCount}`)
    }

    // Enhanced fiber type detection - use the effective search term after pair conversion
    const effectiveQueryLower = effectiveSearchTerm.toLowerCase()
    const specificFiberTypes = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2']
    let detectedSpecificType: string | undefined = specificFiberTypes.find(type => effectiveQueryLower.includes(type))
    let detectedModeType: 'multimode' | 'singlemode' | undefined

    // Check for multimode or single-mode (including common abbreviations) - all case-insensitive
    if (effectiveQueryLower.includes('multimode') || effectiveQueryLower.includes('multi-mode') || effectiveQueryLower.includes('multi mode') || 
        effectiveQueryLower.match(/\bmm\b/i)) {  // Case-insensitive word boundary match for MM
      detectedModeType = 'multimode'
      console.log('🎯 MULTIMODE DETECTED - will exclude single-mode cables')
    } else if (effectiveQueryLower.includes('singlemode') || effectiveQueryLower.includes('single-mode') || effectiveQueryLower.includes('single mode') ||
               effectiveQueryLower.match(/\bsm\b/i)) {  // Case-insensitive word boundary match for SM
      detectedModeType = 'singlemode'
      console.log('🎯 SINGLE-MODE DETECTED - will exclude multimode cables')
      // If user says single mode but no specific OS type, default to OS2
      if (!detectedSpecificType) {
        detectedSpecificType = 'os2'
        console.log('📍 Defaulting single mode to OS2')
      }
    }
    
    // Check for core diameter specifications
    if (effectiveQueryLower.includes('9/125')) {
      detectedModeType = 'singlemode'
      detectedSpecificType = 'os2'
      console.log('🎯 9/125 detected - OS2 single mode')
    } else if (effectiveQueryLower.includes('5/125')) {
      detectedModeType = 'multimode'
      // Could be OM3 or OM4, let search be broader
      console.log('🎯 5/125 detected - OM3/OM4 multimode')
    } else if (effectiveQueryLower.includes('62.5/125')) {
      detectedSpecificType = 'om1'
      detectedModeType = 'multimode'
      console.log('🎯 62.5/125 detected - OM1 multimode')
    }

    // If AI detected a fiber type, use it
    if (!detectedSpecificType && !detectedModeType && aiAnalysis?.detectedSpecs?.fiberType) {
      const aiFiberType = aiAnalysis.detectedSpecs.fiberType.toLowerCase()
      if (specificFiberTypes.includes(aiFiberType)) {
        detectedSpecificType = aiFiberType
      } else if (aiFiberType === 'multimode') {
        detectedModeType = 'multimode'
      } else if (aiFiberType === 'singlemode' || aiFiberType === 'single-mode') {
        detectedModeType = 'singlemode'
      }
    }

    // Build search query based on detection
    if (detectedSpecificType) {
      const specificType = detectedSpecificType.toUpperCase()
      console.log(`🎯 SPECIFIC FIBER TYPE DETECTED: ${specificType}`)
      // Note: Cannot use ::text casting in PostgREST, search other fields instead
      query = query.or(`short_description.ilike.%${specificType}%,common_terms.ilike.%${specificType}%,computed_search_terms.ilike.%${specificType}%`)
    } else if (detectedModeType) {
      // For multimode/single-mode, search broadly for fiber cables
      const cableConditions = cableTerms.map(term =>
        `short_description.ilike.%${term}%`
      ).join(',')
      const fiberConditions = specificFiberTypes.map(type =>
        `short_description.ilike.%${type}%`
      ).join(',')
      query = query.or(`${cableConditions},${fiberConditions},short_description.ilike.%fiber%`)
    } else {
      // General fiber cable search
      const cableConditions = cableTerms.map(term =>
        `short_description.ilike.%${term}%`
      ).join(',')
      const fiberConditions = specificFiberTypes.map(type =>
        `short_description.ilike.%${type}%`
      ).join(',')
      query = query.or(`${cableConditions},${fiberConditions},short_description.ilike.%fiber%`)
    }

    // Add fiber count filter if strand count was detected
    if (requestedStrandCount) {
      query = query.eq('fiber_count', requestedStrandCount)
      console.log(`🔢 Adding fiber count filter: ${requestedStrandCount}`)
    }

    const result = await query
    
    if (result.error) {
      console.error('❌ Fiber cable search error:', result.error)
      const endTime = performance.now()
      return {
        products: [],
        searchStrategy: 'error',
        totalFound: 0,
        searchTime: Math.round(endTime - startTime)
      }
    }

    if (result.data && result.data.length > 0) {
      // Filter results to ensure they are actually cables
      const cableProducts = result.data.filter((item: any) => {
        const description = item.short_description?.toLowerCase() || ''

        // Exclude non-cable items
        const hasExcludeTerms = excludeTerms.some(term => description.includes(term.toLowerCase()))
        if (hasExcludeTerms) return false

        // Check for cable indicators
        const hasCableTerms = cableTerms.some(term => description.includes(term.toLowerCase()))
        const hasFiberCount = /\d+\s*fiber/i.test(description)
        const hasCableWords = description.includes('cable') || description.includes('cord')
        const hasFiberTypes = specificFiberTypes.some(type => description.includes(type))

        const isCable = hasCableTerms || hasFiberCount || hasCableWords || hasFiberTypes

        if (!isCable) return false

        // CRITICAL: Filter by mode type (multimode vs single-mode)
        if (detectedModeType) {
          if (detectedModeType === 'multimode') {
            // For multimode, exclude OS1/OS2 (single-mode types)
            const hasSingleMode = description.includes('os1') || description.includes('os2') ||
                                 description.includes('single-mode') || description.includes('singlemode') ||
                                 description.includes('single mode')
            if (hasSingleMode) {
              console.log(`❌ Excluding single-mode cable: ${description.substring(0, 50)}...`)
              return false
            }
          } else if (detectedModeType === 'singlemode') {
            // For single-mode, exclude OM1/OM2/OM3/OM4 (multimode types)
            const hasMultiMode = description.includes('om1') || description.includes('om2') ||
                                description.includes('om3') || description.includes('om4') ||
                                description.includes('om5') ||
                                description.includes('multi-mode') || description.includes('multimode') ||
                                description.includes('multi mode')
            if (hasMultiMode) {
              console.log(`❌ Excluding multimode cable: ${description.substring(0, 50)}...`)
              return false
            }
          }
        }

        // Filter by specific fiber type if detected
        if (detectedSpecificType) {
          const specificTypeUpper = detectedSpecificType.toUpperCase()
          const specificTypeLower = detectedSpecificType.toLowerCase()
          const fiberTypes = item.fiber_types?.map((type: string) => type.toLowerCase()) || []
          const hasSpecificType = description.includes(specificTypeLower) || 
                                  description.includes(specificTypeUpper) ||
                                  fiberTypes.some((type: string) => type.includes(specificTypeLower)) ||
                                  fiberTypes.some((type: string) => type.includes(specificTypeUpper))
          if (!hasSpecificType) return false
        }

        // Filter by strand count if requested
        if (requestedStrandCount) {
          // Check for pair terminology first
          const pairConversion = detectAndConvertPairToFiber(description)
          let actualFiberCount: number | null = null

          if (pairConversion.detectedPairs && pairConversion.fiberCount) {
            actualFiberCount = pairConversion.fiberCount
          } else {
            // Check for direct fiber count
            const fiberCountMatch = description.match(/(\d+)\s*fiber/i)
            actualFiberCount = fiberCountMatch && fiberCountMatch[1] ? parseInt(fiberCountMatch[1], 10) : null
          }

          if (actualFiberCount && actualFiberCount !== requestedStrandCount) {
            return false
          }
        }

        return true
      })

      console.log(`📊 Filtered ${cableProducts.length} cable products from ${result.data.length} total results`)

      if (cableProducts.length > 0) {
        const endTime = performance.now()
        return {
          products: formatCableResults(cableProducts, 'fiber_cable_match'),
          searchStrategy: 'fiber_cable_match',
          totalFound: cableProducts.length,
          searchTime: Math.round(endTime - startTime)
        }
      }
    }

    console.log('❌ No fiber cable results found')
    const endTime = performance.now()
    return {
      products: [],
      searchStrategy: 'no_results',
      totalFound: 0,
      searchTime: Math.round(endTime - startTime)
    }

  } catch (error) {
    console.error('❌ Error in searchFiberCables:', error)
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

const formatCableResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} FIBER CABLE RESULTS (${searchType})`)

  return data.map((item: FiberCableRow) => ({
    id: `fiber-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: parseFloat(item.unit_price || '0') || (Math.random() * 5 + 2),
    stockLocal: item.stock_quantity || 0,
    stockDistribution: 1,
    leadTime: 'Ships Today',
    category: 'Fiber Optic Cable',
    fiberType: extractFiberType(item.short_description) || item.fiber_type || 'Fiber',
    fiberCount: extractFiberCount(item.short_description) || item.fiber_count,
    jacketRating: item.jacket_rating || extractJacketRating(item.short_description),
    productType: 'Fiber Optic Cable',
    application: extractApplication(item.short_description),
    searchRelevance: 1.00,
    tableName: 'fiber_cables',
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }))
}

// Helper to extract fiber type from description
const extractFiberType = (description?: string): string | undefined => {
  if (!description) return undefined

  const desc = description.toUpperCase()
  const fiberTypes = ['OM1', 'OM2', 'OM3', 'OM4', 'OM5', 'OS1', 'OS2']

  for (const type of fiberTypes) {
    if (desc.includes(type)) {
      return type
    }
  }

  if (desc.includes('SINGLEMODE') || desc.includes('SINGLE-MODE')) {
    return 'Singlemode'
  }

  if (desc.includes('MULTIMODE') || desc.includes('MULTI-MODE')) {
    return 'Multimode'
  }

  return undefined
}

// Helper to extract fiber count from description
const extractFiberCount = (description?: string): number | undefined => {
  if (!description) return undefined

  // First check for pair terminology and convert
  const pairConversion = detectAndConvertPairToFiber(description)
  if (pairConversion.detectedPairs && pairConversion.fiberCount) {
    return pairConversion.fiberCount
  }

  // Then check for direct fiber/strand count
  const match = description.match(/(\d+)\s*(?:fiber|strand)/i)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }

  return undefined
}

// Helper to extract jacket rating from description
const extractJacketRating = (description?: string): string | undefined => {
  if (!description) return undefined
  
  const desc = description.toUpperCase()
  if (desc.includes('PLENUM') || desc.includes('CMP')) return 'Plenum'
  if (desc.includes('RISER') || desc.includes('CMR')) return 'Riser'
  if (desc.includes('OUTDOOR') || desc.includes('OUTSIDE')) return 'Outdoor'
  if (desc.includes('INDOOR/OUTDOOR')) return 'Indoor/Outdoor'
  if (desc.includes('DIRECT BURIAL') || desc.includes('BURIAL')) return 'Direct Burial'
  
  return undefined
}

// Helper to extract application from description - returns the full application string
const extractApplication = (description?: string): string | undefined => {
  if (!description) return undefined
  
  // Look for bracketed application lists
  const bracketMatch = description.match(/\[(.*?)\]/g)
  if (bracketMatch && bracketMatch.length > 0) {
    // Return the full bracketed content
    return bracketMatch[0]
  }
  
  // Fallback to simple detection if no brackets found
  const desc = description.toUpperCase()
  if (desc.includes('BACKBONE')) return 'Backbone'
  if (desc.includes('HORIZONTAL')) return 'Horizontal'
  if (desc.includes('DISTRIBUTION')) return 'Distribution'
  if (desc.includes('DATACENTER') || desc.includes('DATA CENTER')) return 'Data Center'
  if (desc.includes('CAMPUS')) return 'Campus'
  if (desc.includes('BUILDING')) return 'Building'
  if (desc.includes('RISER')) return 'Riser'
  
  return undefined
}

export const generateFiberCableFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    fiberTypes: filterString(products.map(p => p.fiberType)).slice(0, 6),
    fiberCounts: filterString(products.map(p => p.fiberCount?.toString())).slice(0, 6),
    jacketRatings: filterString(products.map(p => p.jacketRating)).slice(0, 6),
    productTypes: filterString(products.map(p => p.productType)).slice(0, 6),
    applications: filterString(products.map(p => p.application)).slice(0, 6)
  }
}