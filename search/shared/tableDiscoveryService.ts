// search/shared/tableDiscoveryService.ts
// Dynamic Table Discovery for Supabase - With Full TypeScript Support
// Created: June 6, 2025

import { supabase, type Database } from '@/lib/supabase'
import type { BaseTableRow } from './types'

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

// Get all table names from the Database type
type TableName = keyof Database['public']['Tables']

export interface TableInfo {
  name: TableName | string  // Allow string for dynamic tables not in types yet
  prefix: string
  hasPartNumber: boolean
  hasIsActive: boolean
  columns: string[]
}

export interface TableDiscoveryResult {
  tables: TableInfo[]
  lastUpdated: Date
  totalTables: number
  searchableTables: number
}

// Generic type for any table row with part_number
export interface BaseTableRow {
  id: number
  part_number?: string
  is_active?: boolean
  brand?: string
  short_description?: string
  unit_price?: string
  stock_quantity?: number
  // Allow any other fields that might exist in the database
  [key: string]: any
}

// ===================================================================
// CACHE MANAGEMENT
// ===================================================================

// Cache the table list for performance (5 minutes)
let tableCache: TableDiscoveryResult | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// ===================================================================
// TABLE DISCOVERY IMPLEMENTATION
// ===================================================================

/**
 * Discovers all tables in Supabase that have a part_number column
 * Uses PostgreSQL information schema via RPC functions
 */
export const discoverSearchableTables = async (): Promise<TableDiscoveryResult> => {
  console.log('🔍 Starting dynamic table discovery...')

  // Check cache first
  if (tableCache && (Date.now() - tableCache.lastUpdated.getTime()) < CACHE_DURATION) {
    console.log('✅ Using cached table list')
    return tableCache
  }

  try {
    // Query 1: Get all tables with part_number column
    const { data: tablesWithPartNumber, error: tableError } = await supabase
      .rpc('get_tables_with_column', { column_name: 'part_number' })

    if (tableError) {
      console.error('❌ Error discovering tables:', tableError)
      // Fallback to manual list if RPC fails
      return getFallbackTableList()
    }

    if (!tablesWithPartNumber || tablesWithPartNumber.length === 0) {
      console.warn('⚠️ No tables found with part_number column')
      return getFallbackTableList()
    }

    // Query 2: Get column information for each table
    const tableInfoPromises = tablesWithPartNumber.map(async (tableRow: any) => {
      const tableName = typeof tableRow === 'string' ? tableRow : tableRow.table_name

      try {
        const { data: columns, error: columnError } = await supabase
          .rpc('get_table_columns', { table_name: tableName })

        if (columnError) {
          console.warn(`⚠️ Could not get columns for ${tableName}:`, columnError)
          return null
        }

        // Extract column names from the result
        const columnNames = columns?.map((col: { column_name: string }) => col.column_name) || []

        return {
          name: tableName,
          prefix: generateTablePrefix(tableName),
          hasPartNumber: true,
          hasIsActive: columnNames.includes('is_active'),
          columns: columnNames
        }
      } catch (error) {
        console.error(`❌ Error processing table ${tableName}:`, error)
        return null
      }
    })

    const tableInfoResults = await Promise.all(tableInfoPromises)
    const validTables = tableInfoResults.filter((t): t is TableInfo => t !== null)

    // Create the result
    const result: TableDiscoveryResult = {
      tables: validTables,
      lastUpdated: new Date(),
      totalTables: validTables.length,
      searchableTables: validTables.length
    }

    // Cache the result
    tableCache = result

    console.log(`✅ Discovered ${result.searchableTables} searchable tables`)
    console.log('📊 Tables found:', validTables.map(t => t.name))

    return result

  } catch (error) {
    console.error('❌ Table discovery failed:', error)
    return getFallbackTableList()
  }
}

/**
 * Generate a unique prefix for a table name
 * Examples:
 * - category_cables → cat
 * - fiber_connectors → fib
 * - rack_mount_fiber_enclosures → rmf
 */
const generateTablePrefix = (tableName: string): string => {
  // Strategy 1: Use first letters of each word
  const words = tableName.split('_')

  if (words.length === 1) {
    // Single word: use first 3 letters
    return tableName.substring(0, 3).toLowerCase()
  } else if (words.length === 2) {
    // Two words: use first 2 letters of each
    return (words[0].substring(0, 2) + words[1].substring(0, 1)).toLowerCase()
  } else {
    // Multiple words: use first letter of each (max 4)
    return words.slice(0, 4).map(w => w[0]).join('').toLowerCase()
  }
}

/**
 * Fallback table list if dynamic discovery fails
 * Now with proper types!
 */
// In tableDiscoveryService.ts, update the getFallbackTableList function:

const getFallbackTableList = (): TableDiscoveryResult => {
  console.log('⚠️ Using fallback table list')

  const knownTables: TableInfo[] = [
    { name: 'category_cables' as TableName, prefix: 'cat', hasPartNumber: true, hasIsActive: true, columns: [] },
    { name: 'fiber_connectors' as TableName, prefix: 'con', hasPartNumber: true, hasIsActive: true, columns: [] },
    { name: 'adapter_panels' as TableName, prefix: 'pan', hasPartNumber: true, hasIsActive: true, columns: [] },
    { name: 'rack_mount_fiber_enclosures' as TableName, prefix: 'enc', hasPartNumber: true, hasIsActive: true, columns: [] },
    { name: 'fiber_optic_cable' as TableName, prefix: 'fib', hasPartNumber: true, hasIsActive: true, columns: [] },
    { name: 'jack_modules' as TableName, prefix: 'jac', hasPartNumber: true, hasIsActive: true, columns: [] },  // ADD THIS LINE
  ]

  return {
    tables: knownTables,
    lastUpdated: new Date(),
    totalTables: knownTables.length,
    searchableTables: knownTables.length
  }
}

// ===================================================================
// SEARCH IMPLEMENTATION - WITH TYPESCRIPT SUPPORT
// ===================================================================

/**
 * Search all discovered tables for part numbers
 * Now with better type safety!
 */
export const searchAllTablesForPartNumber = async (
  partNumbers: string[],
  limit: number = 50
): Promise<BaseTableRow[]> => {
  console.log('🔎 Searching all tables for part numbers:', partNumbers)

  // Get the current table list
  const { tables } = await discoverSearchableTables()

  if (!tables || tables.length === 0) {
    console.warn('⚠️ No tables available for search')
    return []
  }

  // Search each table in parallel
  const searchPromises = tables.map(async (table) => {
    try {
      console.log(`🔍 Searching ${table.name}...`)

      // Build search query - we still need 'as any' for dynamic table names
      // but now we have better type safety elsewhere
      const query = supabase
        .from(table.name as any)
        .select('*')
        .limit(Math.floor(limit / tables.length))

      // Add is_active filter if table has it
      if (table.hasIsActive) {
        query.eq('is_active', true)
      }

      // Build OR conditions for part numbers
      const searchConditions: string[] = []
      partNumbers.forEach(partNum => {
        // Ensure partNum is a string and trim it
        const cleanPartNum = String(partNum).trim()
        if (cleanPartNum) {
          searchConditions.push(`part_number.eq.${cleanPartNum}`)
          searchConditions.push(`part_number.ilike.${cleanPartNum}%`)
          searchConditions.push(`part_number.ilike.%${cleanPartNum}%`)
        }
      })

      if (searchConditions.length > 0) {
        query.or(searchConditions.join(','))
      }

      const { data, error } = await query

      if (error) {
        console.warn(`⚠️ Error searching ${table.name}:`, error)
        return []
      }

      // Add table metadata to each result
      return (data || []).map((item: BaseTableRow) => ({
        ...item,
        _tableName: table.name,
        _tablePrefix: table.prefix
      }))

    } catch (error) {
      console.error(`❌ Failed to search ${table.name}:`, error)
      return []
    }
  })

  // Wait for all searches to complete
  const results = await Promise.all(searchPromises)

  // Flatten and return all results
  const allResults = results.flat()
  console.log(`✅ Found ${allResults.length} total matches across ${tables.length} tables`)

  return allResults
}

/**
 * Type-safe search for specific known tables
 * Use this when you know the table name at compile time
 */
export const searchKnownTable = async <T extends TableName>(
  tableName: T,
  partNumbers: string[],
  limit: number = 50
): Promise<(Database['public']['Tables'][T]['Row'] & { _tableName: string; _tablePrefix: string })[]> => {
  try {
    console.log(`🔍 Searching ${tableName} for part numbers:`, partNumbers)

    // Build the query with full type safety!
    const query = supabase
      .from(tableName)
      .select('*')
      .limit(limit)

    // Build OR conditions
    const searchConditions: string[] = []
    partNumbers.forEach(partNum => {
      const cleanPartNum = String(partNum).trim()
      if (cleanPartNum) {
        searchConditions.push(`part_number.eq.${cleanPartNum}`)
        searchConditions.push(`part_number.ilike.${cleanPartNum}%`)
        searchConditions.push(`part_number.ilike.%${cleanPartNum}%`)
      }
    })

    if (searchConditions.length > 0) {
      query.or(searchConditions.join(','))
    }

    const { data, error } = await query

    if (error) {
      console.error(`❌ Error searching ${tableName}:`, error)
      return []
    }

    // Add metadata and return with full type safety
    return (data || []).map((item: BaseTableRow) => ({
      ...item,
      _tableName: tableName,
      _tablePrefix: generateTablePrefix(tableName)
    }))

  } catch (error) {
    console.error(`❌ Failed to search ${tableName}:`, error)
    return []
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Clear the table cache (useful after adding new tables)
 */
export const clearTableCache = (): void => {
  tableCache = null
  console.log('🧹 Table cache cleared')
}

/**
 * Get current cache status
 */
export const getCacheStatus = (): { isCached: boolean; age: number | null } => {
  if (!tableCache) {
    return { isCached: false, age: null }
  }

  const age = Date.now() - tableCache.lastUpdated.getTime()
  return { isCached: true, age }
}

/**
 * Test the RPC functions to ensure they're working
 */
export const testRPCFunctions = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Test get_tables_with_column
    const { data: tables, error: tableError } = await supabase
      .rpc('get_tables_with_column', { column_name: 'part_number' })

    if (tableError) {
      return { success: false, message: `get_tables_with_column failed: ${tableError.message}` }
    }

    // Test get_table_columns if we have at least one table
    if (tables && tables.length > 0) {
      const firstTableObj = tables[0]
      const firstTable = typeof firstTableObj === 'string' ? firstTableObj : firstTableObj.table_name
      const { data: columns, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: firstTable })

      if (columnError) {
        return { success: false, message: `get_table_columns failed: ${columnError.message}` }
      }

      return { success: true, message: `✅ Both RPC functions working! Found ${tables.length} tables.` }
    }

    return { success: true, message: '✅ RPC functions working but no tables found with part_number column.' }
  } catch (error: any) {
    return { success: false, message: `Test failed: ${error?.message || error}` }
  }
}