// src/search/fiberCables/fiberCableSearch.ts
// Fiber Cable Search Implementation - Fixed multimode/single-mode filtering
// Date created: June 6, 2025

import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { AISearchAnalysis } from '@/types/search'

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
      .from('fiber_optic_cable')
      .select('*')
      .eq('is_active', true)
      .limit(50)

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

    // Check for strand patterns (e.g., "12 strand")
    const strandMatch = queryLower.match(/\b(\d+)\s*strand/i)
    const requestedStrandCount = strandMatch && strandMatch[1]
      ? parseInt(strandMatch[1], 10)
      : aiAnalysis?.detectedSpecs?.fiberCount

    if (requestedStrandCount) {
      console.log(`🧶 Strand count detected: ${requestedStrandCount}`)
    }

    // Enhanced fiber type detection
    const specificFiberTypes = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2']
    let detectedSpecificType: string | undefined = specificFiberTypes.find(type => queryLower.includes(type))
    let detectedModeType: 'multimode' | 'singlemode' | undefined

    // Check for multimode or single-mode
    if (queryLower.includes('multimode') || queryLower.includes('multi-mode') || queryLower.includes('multi mode')) {
      detectedModeType = 'multimode'
      console.log('🎯 MULTIMODE DETECTED - will exclude single-mode cables')
    } else if (queryLower.includes('singlemode') || queryLower.includes('single-mode') || queryLower.includes('single mode')) {
      detectedModeType = 'singlemode'
      console.log('🎯 SINGLE-MODE DETECTED - will exclude multimode cables')
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
      query = query.or(`short_description.ilike.%${specificType}%,fiber_type_standard.ilike.%${specificType}%`)
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
          const hasSpecificType = description.includes(detectedSpecificType) || description.includes(specificTypeUpper)
          if (!hasSpecificType) return false
        }

        // Filter by strand count if requested
        if (requestedStrandCount) {
          const fiberCountMatch = description.match(/(\d+)\s*fiber/i)
          const actualFiberCount = fiberCountMatch && fiberCountMatch[1] ? parseInt(fiberCountMatch[1], 10) : null

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

  return data.map((item: any) => ({
    id: `fiber-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand?.trim() || 'Unknown Brand',
    description: item.short_description?.trim() || 'No description available',
    price: parseFloat(item.unit_price) || (Math.random() * 500 + 200),
    stockLocal: item.stock_quantity || 0,
    stockDistribution: 100,
    leadTime: 'Ships Today',
    category: 'Fiber Optic Cable',
    fiberType: extractFiberType(item.short_description) || 'Fiber',
    fiberCount: extractFiberCount(item.short_description),
    searchRelevance: 1.0,
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

  const match = description.match(/(\d+)\s*(?:fiber|strand)/i)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }

  return undefined
}

export const generateFiberCableFilters = (products: Product[]) => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  return {
    brands: filterString(products.map(p => p.brand)).slice(0, 8),
    fiberTypes: filterString(products.map(p => p.fiberType)).slice(0, 6),
    fiberCounts: filterString(products.map(p => p.fiberCount?.toString())).slice(0, 6)
  }
}