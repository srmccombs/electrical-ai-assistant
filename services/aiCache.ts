// /services/aiCache.ts
// AI Response Cache - Saves money by caching identical AI queries

interface CacheEntry {
  data: any
  timestamp: number
}

// In-memory cache (resets when server restarts)
const AI_CACHE = new Map<string, CacheEntry>()

// Cache duration: 1 hour (3600000 ms)
const CACHE_DURATION = 1000 * 60 * 60

// Maximum cache size to prevent memory issues
const MAX_CACHE_SIZE = 100

// Cache statistics for debugging
let cacheStats = {
  hits: 0,
  misses: 0,
  saves: 0
}

/**
 * Get cached AI analysis if available and not expired
 */
export const getCachedAIAnalysis = async (
  query: string,
  getAIAnalysisFn: (query: string) => Promise<any>,
  shoppingListContext?: any
): Promise<any> => {
  // Create cache key that includes shopping list context
  let cacheKey = query.toLowerCase().trim()
  
  // If there's shopping list context, include key information in the cache key
  if (shoppingListContext?.hasItems) {
    const contextParts: string[] = []
    
    // Include jack module brands and product lines
    if (shoppingListContext.jackModules?.length > 0) {
      const brands = [...new Set(shoppingListContext.jackModules.map((j: any) => j.brand))].sort()
      const productLines = [...new Set(shoppingListContext.jackModules.map((j: any) => j.productLine || j.compatibleFaceplates))].filter(Boolean).sort()
      contextParts.push(`jacks:${brands.join(',')};${productLines.join(',')}`)
    }
    
    // Include cable categories and brands
    if (shoppingListContext.categoryCables?.length > 0) {
      const categories = [...new Set(shoppingListContext.categoryCables.map((c: any) => c.categoryRating))].filter(Boolean).sort()
      const brands = [...new Set(shoppingListContext.categoryCables.map((c: any) => c.brand))].sort()
      contextParts.push(`cables:${categories.join(',')};${brands.join(',')}`)
    }
    
    if (contextParts.length > 0) {
      cacheKey += `|context:${contextParts.join('|')}`
    }
  }

  // Check if we have a cached entry
  const cached = AI_CACHE.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // Cache hit!
    cacheStats.hits++
    console.log(`💰 AI CACHE HIT for: "${query}" (Total hits: ${cacheStats.hits})`)
    return cached.data
  }

  // Cache miss - need to call the actual AI
  cacheStats.misses++
  console.log(`🔍 AI CACHE MISS for: "${query}" (Total misses: ${cacheStats.misses})`)

  try {
    // Call the actual AI analysis function
    const freshData = await getAIAnalysisFn(query)

    if (freshData) {
      // Save to cache
      saveToCache(cacheKey, freshData)
    }

    return freshData
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return null
  }
}

/**
 * Save data to cache with size management
 */
const saveToCache = (key: string, data: any): void => {
  // If cache is getting too big, remove oldest entries
  if (AI_CACHE.size >= MAX_CACHE_SIZE) {
    // Find and remove the oldest entry
    let oldestKey = ''
    let oldestTime = Date.now()

    AI_CACHE.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      AI_CACHE.delete(oldestKey)
      console.log(`🗑️ Removed oldest cache entry: "${oldestKey}"`)
    }
  }

  // Save the new entry
  AI_CACHE.set(key, {
    data,
    timestamp: Date.now()
  })

  cacheStats.saves++
  console.log(`💾 AI CACHE SAVED for: "${key}" (Total saves: ${cacheStats.saves})`)
}

/**
 * Clear the entire cache (useful for testing)
 */
export const clearAICache = (): void => {
  const size = AI_CACHE.size
  AI_CACHE.clear()
  console.log(`🧹 Cleared AI cache (removed ${size} entries)`)
}

/**
 * Get cache statistics (useful for debugging)
 */
export const getCacheStats = () => {
  return {
    ...cacheStats,
    currentSize: AI_CACHE.size,
    maxSize: MAX_CACHE_SIZE,
    cacheDurationMinutes: CACHE_DURATION / 1000 / 60
  }
}

/**
 * Get all cached queries (useful for debugging)
 */
export const getCachedQueries = (): string[] => {
  return Array.from(AI_CACHE.keys())
}