// utils/typeGuards.ts
// Type guards and validation utilities

import { Product } from '@/types/product'
import { AISearchAnalysis } from '@/types/search'

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard to check if a string is not empty
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Type guard to check if a value is a valid Product
 */
export function isValidProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false
  
  const product = value as any
  return (
    isNonEmptyString(product.id) &&
    isNonEmptyString(product.partNumber) &&
    isNonEmptyString(product.brand) &&
    isNonEmptyString(product.description)
  )
}

/**
 * Type guard to check if AI analysis is valid
 */
export function isValidAIAnalysis(value: unknown): value is AISearchAnalysis {
  if (!value || typeof value !== 'object') return false
  
  const analysis = value as any
  return (
    isNonEmptyString(analysis.searchStrategy) &&
    isNonEmptyString(analysis.productType) &&
    typeof analysis.confidence === 'number' &&
    Array.isArray(analysis.searchTerms)
  )
}

/**
 * Safe JSON parse with type checking
 */
export function safeJsonParse<T>(
  json: string,
  validator?: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json)
    if (validator && !validator(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * Filter out null/undefined values from arrays
 */
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isDefined)
}

/**
 * Get a nested property safely
 */
export function getNestedProperty<T>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current?.[key] === undefined) {
      return defaultValue
    }
    current = current[key]
  }

  return current
}

/**
 * Ensure a value is an array
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Type-safe object keys
 */
export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[]
}

/**
 * Type-safe object entries
 */
export function objectEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}