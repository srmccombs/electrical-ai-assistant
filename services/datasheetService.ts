// datasheetService.ts
// Service for handling product datasheet links

import { supabase } from '@/lib/supabase'
import { logger, LogCategory } from '@/utils/logger'

interface DatasheetLink {
  product_table: string
  part_number: string
  datasheet_id: string
  link_type: string
}

interface DatasheetInfo {
  datasheet_id: string
  file_url: string
  document_title?: string
  manufacturer?: string
}

// Cache datasheet links to reduce database queries
const datasheetCache = new Map<string, string>()

/**
 * Get datasheet URLs for a list of products
 * @param products Array of products with part numbers and table names
 * @returns Map of part numbers to datasheet URLs
 */
export const getDatasheetUrls = async (
  products: Array<{ partNumber: string; tableName?: string }>
): Promise<Map<string, string>> => {
  if (products.length === 0) return new Map()

  try {
    // Get unique part numbers
    const partNumbers = [...new Set(products.map(p => p.partNumber))]
    
    // Check cache first
    const uncachedPartNumbers = partNumbers.filter(pn => !datasheetCache.has(pn))
    
    if (uncachedPartNumbers.length > 0) {
      // Fetch datasheet links from database
      const { data: links, error } = await supabase
        .from('product_datasheet_links')
        .select('product_table, part_number, datasheet_id, link_type')
        .in('part_number', uncachedPartNumbers)
        .eq('link_type', 'primary')

      if (error) {
        logger.error('Error fetching datasheet links', error, LogCategory.DATABASE)
        return new Map()
      }

      // Process the links and fetch actual URLs from product_datasheets table
      if (links && links.length > 0) {
        // Get unique datasheet IDs
        const datasheetIds = [...new Set(links.map((link: DatasheetLink) => link.datasheet_id))]
        
        // Fetch datasheet info including URLs
        const { data: datasheets, error: dsError } = await supabase
          .from('product_datasheets')
          .select('datasheet_id, file_url, document_title, manufacturer')
          .in('datasheet_id', datasheetIds)
          .eq('is_active', true)
        
        if (dsError) {
          logger.error('Error fetching datasheet info', dsError, LogCategory.DATABASE)
        } else if (datasheets) {
          // Create a map of datasheet_id to URL
          const datasheetMap = new Map<string, string>()
          datasheets.forEach((ds: DatasheetInfo) => {
            if (ds.file_url) {
              datasheetMap.set(ds.datasheet_id, ds.file_url)
            }
          })
          
          // Map URLs to part numbers
          links.forEach((link: DatasheetLink) => {
            const url = datasheetMap.get(link.datasheet_id)
            if (url) {
              datasheetCache.set(link.part_number, url)
            }
          })
        }
      }
    }

    // Build result map from cache
    const resultMap = new Map<string, string>()
    partNumbers.forEach(pn => {
      const url = datasheetCache.get(pn)
      if (url) {
        resultMap.set(pn, url)
      }
    })

    return resultMap
  } catch (error) {
    logger.error('Error in getDatasheetUrls', error, LogCategory.DATABASE)
    return new Map()
  }
}


/**
 * Clear the datasheet cache (useful after updates)
 */
export const clearDatasheetCache = (): void => {
  datasheetCache.clear()
  logger.info('Datasheet cache cleared', {}, LogCategory.SYSTEM)
}