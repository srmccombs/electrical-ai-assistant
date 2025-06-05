// src/services/tableDiscoveryService.ts
// Dynamic Table Discovery for Supabase
// Created: December 20, 2024

import { supabase } from '@/lib/supabase'

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

export interface TableInfo {
  name: string
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
 * Uses PostgreSQL information schema
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

    // Query 2: Get column information for each table
    const tableInfoPromises = tablesWithPartNumber.map(async (tableName: string) => {
      const { data: columns, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: tableName })

      if (columnError) {
        console.warn(`⚠️ Could not get columns for ${tableName}`)
        return null
      }

      return {
        name: tableName,
        prefix: generateTablePrefix(tableName),
        hasPartNumber: true,
        hasIsActive: columns.includes('is_active'),
        columns: columns
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
 */
const getFallbackTableList = (): TableDiscoveryResult => {
  console.log('⚠️ Using fallback table list')

  return {
    tables: [
      { name: 'category_cables', prefix: 'cat', hasPartNumber: true, hasIsActive: true, columns: [] },
      { name: 'fiber_connectors', prefix: 'con', hasPartNumber: true, hasIsActive: true, columns: [] },
      { name: 'adapter_panels', prefix: 'pan', hasPartNumber: true, hasIsActive: true, columns: [] },
      { name: 'rack_mount_fiber_enclosures', prefix: 'enc', hasPartNumber: true, hasIsActive: true, columns: [] },
      { name: 'products', prefix: 'pro', hasPartNumber: true, hasIsActive: true, columns: [] }
    ],
    lastUpdated: new Date(),
    totalTables: 5,
    searchableTables: 5
  }
}

// ===================================================================
// SEARCH IMPLEMENTATION
// ===================================================================

/**
 * Search all discovered tables for part numbers
 */
export const searchAllTablesForPartNumber = async (
  partNumbers: string[],
  limit: number = 50
): Promise<any[]> => {
  console.log('🔎 Searching all tables for part numbers:', partNumbers)

  // Get the current table list
  const { tables } = await discoverSearchableTables()

  // Search each table in parallel
  const searchPromises = tables.map(async (table) => {
    try {
      console.log(`🔍 Searching ${table.name}...`)

      // Build search query
      let query = supabase
        .from(table.name)
        .select('*')
        .limit(Math.floor(limit / tables.length)) // Distribute limit across tables

      // Add is_active filter if table has it
      if (table.hasIsActive) {
        query = query.eq('is_active', true)
      }

      // Build OR conditions for part numbers
      const searchConditions: string[] = []
      partNumbers.forEach(partNum => {
        searchConditions.push(`part_number.eq.${partNum}`)
        searchConditions.push(`part_number.ilike.${partNum}%`)
        searchConditions.push(`part_number.ilike.%${partNum}%`)
      })

      if (searchConditions.length > 0) {
        query = query.or(searchConditions.join(','))
      }

      const { data, error } = await query

      if (error) {
        console.warn(`⚠️ Error searching ${table.name}:`, error)
        return []
      }

      // Add table metadata to each result
      return (data || []).map(item => ({
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

// ===================================================================
// RPC FUNCTION DEFINITIONS (Add these to Supabase)
// ===================================================================

/*
-- Add these functions to your Supabase SQL editor:

-- Function 1: Get all tables with a specific column
CREATE OR REPLACE FUNCTION get_tables_with_column(column_name text)
RETURNS TABLE(table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.table_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = column_name
    AND c.table_name NOT LIKE 'pg_%'
    AND c.table_name NOT LIKE '%_view'
  ORDER BY c.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Get all columns for a specific table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tables_with_column(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
*/