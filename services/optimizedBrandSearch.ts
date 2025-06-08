// services/optimizedBrandSearch.ts
// Optimized parallel brand search implementation

import { Product } from '@/types/product'
import { searchCategoryCables as searchCategoryCablesImpl } from '@/search/categoryCables/categoryCableSearch'
import { searchFiberConnectors as searchFiberConnectorsImpl } from '@/search/fiberConnectors/fiberConnectorSearch'
import { searchFiberCables as searchFiberCablesImpl } from '@/search/fiberCables/fiberCableSearch'
import { searchAdapterPanels as searchAdapterPanelsImpl } from '@/search/fiberadapterPanels/fiberadapterPanelSearch'
import { searchRackMountFiberEnclosures as searchRackMountFiberEnclosuresImpl } from '@/search/fiberenclosure/rack_mount_fiber_enclosure_Search'
import { logger } from '@/utils/logger'
import { SEARCH_LIMITS } from '@/config/constants'

interface BrandSearchParams {
  brand: string
  limit?: number
}

/**
 * Optimized brand search that runs all table searches in parallel
 * 3-5x faster than sequential approach
 */
export const searchAllTablesByBrandOptimized = async ({
  brand,
  limit = SEARCH_LIMITS.DEFAULT
}: BrandSearchParams): Promise<Product[]> => {
  logger.info(`Starting parallel brand search for: ${brand}`)
  const startTime = performance.now()

  // Calculate per-table limit
  const perTableLimit = Math.floor(limit / 5)

  // Create AI analysis object for brand search
  const brandAIAnalysis = {
    searchStrategy: 'brand',
    productType: 'MIXED' as const,
    confidence: 1.0,
    detectedSpecs: { manufacturer: brand },
    searchTerms: [brand],
    reasoning: 'Brand-specific search',
    suggestedFilters: [],
    alternativeQueries: [],
    originalQuery: brand,
    timestamp: new Date().toISOString(),
    aiModel: 'enhanced'
  }

  // Define all search operations
  const searchOperations = [
    {
      name: 'fiber_enclosures',
      search: () => searchRackMountFiberEnclosuresImpl({
        searchTerm: brand,
        aiAnalysis: brandAIAnalysis,
        limit: perTableLimit
      })
    },
    {
      name: 'category_cables',
      search: () => searchCategoryCablesImpl({
        searchTerm: brand,
        aiAnalysis: brandAIAnalysis,
        limit: perTableLimit
      })
    },
    {
      name: 'fiber_connectors',
      search: () => searchFiberConnectorsImpl({
        searchTerm: brand,
        aiAnalysis: brandAIAnalysis,
        limit: perTableLimit
      })
    },
    {
      name: 'adapter_panels',
      search: () => searchAdapterPanelsImpl({
        searchTerm: brand,
        aiAnalysis: brandAIAnalysis,
        limit: perTableLimit
      })
    },
    {
      name: 'fiber_cables',
      search: () => searchFiberCablesImpl({
        searchTerm: brand,
        aiAnalysis: brandAIAnalysis,
        limit: perTableLimit
      })
    }
  ]

  // Execute all searches in parallel
  const searchPromises = searchOperations.map(async (operation) => {
    try {
      logger.debug(`Searching ${operation.name} for brand: ${brand}`)
      const result = await operation.search()
      
      // Filter to ensure only the requested brand
      const brandProducts = result.products.filter(p =>
        p.brand.toLowerCase().includes(brand.toLowerCase())
      )
      
      logger.debug(`Found ${brandProducts.length} ${brand} products in ${operation.name}`)
      return brandProducts
    } catch (error) {
      logger.error(`Error searching ${operation.name}:`, error)
      return []
    }
  })

  // Wait for all searches to complete
  const results = await Promise.all(searchPromises)

  // Flatten all results
  const allProducts = results.flat()

  const endTime = performance.now()
  const searchTime = Math.round(endTime - startTime)

  logger.info(`Parallel brand search completed in ${searchTime}ms`, {
    brand,
    totalProducts: allProducts.length,
    searchTime
  })

  return allProducts
}

/**
 * Batch search multiple brands in parallel
 * Useful for comparing products across brands
 */
export const searchMultipleBrands = async (
  brands: string[],
  limitPerBrand: number = 10
): Promise<Record<string, Product[]>> => {
  logger.info(`Starting multi-brand search for: ${brands.join(', ')}`)

  const brandSearchPromises = brands.map(async (brand) => {
    const products = await searchAllTablesByBrandOptimized({
      brand,
      limit: limitPerBrand
    })
    return { brand, products }
  })

  const results = await Promise.all(brandSearchPromises)

  // Convert to object format
  const brandResults: Record<string, Product[]> = {}
  results.forEach(({ brand, products }) => {
    brandResults[brand] = products
  })

  logger.info('Multi-brand search completed', {
    brands: Object.keys(brandResults),
    totalProducts: Object.values(brandResults).reduce((sum, products) => sum + products.length, 0)
  })

  return brandResults
}