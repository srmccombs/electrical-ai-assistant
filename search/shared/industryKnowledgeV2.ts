// industryKnowledgeV2.ts - Database-driven version with backward compatibility
// This file provides the same interface as industryKnowledge.ts but uses the database

import { searchIntelligence } from './searchIntelligenceService'

// Re-export existing types for compatibility
export interface ValidationResult {
  isValid: boolean
  message?: string
  suggestion?: string
}

export interface BusinessRuleResult {
  originalTerm: string
  processedTerm: string
  wasRedirected: boolean
  redirectMessage: string | null
}

export interface DetectedParts {
  hasParts: boolean
  partNumbers: string[]
  quantity: number | undefined
  remainingText: string
  hasStrandPattern: boolean
  strandCount: number | undefined
}

// ===================================================================
// DETECTION FUNCTIONS - Now using database
// ===================================================================

// Detect jacket type
export const detectJacketType = async (searchTerm: string): Promise<string | null> => {
  console.log(`🧥 Detecting jacket type from: "${searchTerm}"`)
  const result = await searchIntelligence.detectJacketType(searchTerm)
  if (result) {
    console.log(`🧥 DETECTED ${result} from database`)
  }
  return result
}

// Detect category rating
export const detectCategoryRating = async (searchTerm: string): Promise<string | null> => {
  const result = await searchIntelligence.detectCategoryRating(searchTerm)
  if (result) {
    console.log(`📊 DETECTED CATEGORY: ${result} from database`)
  }
  return result
}

// Detect shielding
export const detectShielding = async (searchTerm: string): Promise<string | null> => {
  const attrs = await searchIntelligence.detectAllAttributes(searchTerm)
  if (attrs.shielding) {
    console.log(`🛡️ DETECTED SHIELDING: ${attrs.shielding} from database`)
  }
  return attrs.shielding || null
}

// Detect quantity
export const detectQuantity = async (searchTerm: string): Promise<number | null> => {
  const query = searchTerm.toLowerCase()
  
  // First check for box patterns
  const boxMatch = query.match(/(\d+)\s*box(?:es)?|(\d+)\s*bx\b/i)
  if (boxMatch) {
    const boxes = parseInt(boxMatch[1] || boxMatch[2], 10)
    const conversion = await searchIntelligence.convertQuantity(boxes, 'box', 'category_cable')
    if (conversion) {
      console.log(`📦 DETECTED BOXES: ${boxes} boxes = ${conversion.value} ${conversion.unit}`)
      return conversion.value
    }
  }
  
  // Check for "box of" pattern
  if (query.includes('box of') && !query.match(/\d+\s*(?:ft|feet|foot|')/)) {
    const conversion = await searchIntelligence.convertQuantity(1, 'box', 'category_cable')
    if (conversion) {
      console.log(`📦 DETECTED: Single box = ${conversion.value} ${conversion.unit}`)
      return conversion.value
    }
  }
  
  // Standard quantity patterns
  const quantityMatches = [
    /(\d+)\s*ft\b/i,
    /(\d+)\s*feet\b/i,
    /(\d+)\s*foot\b/i,
    /(\d+)\s*'\b/i
  ]

  for (const pattern of quantityMatches) {
    const match = searchTerm.match(pattern)
    if (match && match[1]) {
      const quantity = parseInt(match[1], 10)
      console.log(`📏 DETECTED QUANTITY: ${quantity} from pattern: "${match[0]}"`)
      return quantity
    }
  }

  return null
}

// Detect color
export const detectColor = async (searchTerm: string): Promise<string | null> => {
  const result = await searchIntelligence.detectColor(searchTerm)
  if (result) {
    console.log(`🎨 DETECTED COLOR: ${result}`)
  }
  return result
}

// Detect surface mount box
export const detectSurfaceMountBox = async (searchTerm: string): Promise<boolean> => {
  const attrs = await searchIntelligence.detectAllAttributes(searchTerm)
  // Check if any SMB-related terms were detected
  const query = searchTerm.toLowerCase()
  const smbTerms = ['smb', 's.m.b', 'surface mount box', 'surface box']
  const detected = smbTerms.some(term => query.includes(term))
  
  if (detected) {
    console.log(`📦 DETECTED SURFACE MOUNT BOX`)
  }
  
  return detected
}

// Detect faceplate type
export const detectFaceplateType = async (searchTerm: string): Promise<{ isKeystone?: boolean, gangCount?: number }> => {
  const query = searchTerm.toLowerCase()
  const result: { isKeystone?: boolean, gangCount?: number } = {}
  
  // Keystone detection
  const keystoneVariations = [
    'keystone', 'key stone', 'key-stone',
    'kyst', 'kystone', 'keystne', 'keyston',
    'modular', 'snap-in', 'snap in'
  ]
  
  for (const variant of keystoneVariations) {
    if (query.includes(variant)) {
      result.isKeystone = true
      console.log(`🔑 DETECTED KEYSTONE TYPE`)
      break
    }
  }
  
  // Gang count detection
  const gangMatch = query.match(/(\d+)\s*(?:gang|gng|position|pos)\b/i)
  if (gangMatch && gangMatch[1]) {
    result.gangCount = parseInt(gangMatch[1])
    console.log(`🔢 DETECTED GANG COUNT: ${result.gangCount}`)
  }
  
  return result
}

// Detect brand
export const detectBrand = async (searchTerm: string): Promise<string | undefined> => {
  const result = await searchIntelligence.detectBrand(searchTerm)
  return result || undefined
}

// Detect polish type
export const detectPolishType = async (searchTerm: string): Promise<string | null> => {
  const attrs = await searchIntelligence.detectAllAttributes(searchTerm)
  if (attrs.polish) {
    console.log(`💎 Detected polish type: ${attrs.polish}`)
  }
  return attrs.polish || null
}

// Detect cross-reference request
export const detectCrossReferenceRequest = async (searchTerm: string): Promise<{ isCrossRequest: boolean, partNumber?: string, targetBrand?: string }> => {
  const attrs = await searchIntelligence.detectAllAttributes(searchTerm)
  
  if (!attrs.crossReference) {
    return { isCrossRequest: false }
  }
  
  // Extract part number and target brand from the search term
  const term = searchTerm.toLowerCase()
  
  // Extract part number
  const partNumberPatterns = [
    /\b(\d{4,}\w*)\b/,
    /\b([A-Z]{2,4}[-\s]?\d{3,})\b/i,
    /\b(\d+[-\s]\d+[-\s]\d+)\b/,
  ]
  
  let partNumber: string | undefined
  for (const pattern of partNumberPatterns) {
    const match = term.match(pattern)
    if (match) {
      partNumber = match[1]
      break
    }
  }
  
  // Extract target brand
  const targetBrand = await detectBrand(term)
  
  console.log(`🔄 Cross-reference request detected: partNumber=${partNumber}, targetBrand=${targetBrand}`)
  
  return {
    isCrossRequest: true,
    partNumber,
    targetBrand
  }
}

// Detect environment
export const detectEnvironment = async (searchTerm: string): Promise<string | undefined> => {
  const attrs = await searchIntelligence.detectAllAttributes(searchTerm)
  if (attrs.environment) {
    console.log(`🌧️ Detected environment: ${attrs.environment}`)
  }
  return attrs.environment || undefined
}

// Detect product line
export const detectProductLine = async (searchTerm: string): Promise<string | null> => {
  const attrs = await searchIntelligence.detectAllAttributes(searchTerm)
  if (attrs.productLine) {
    console.log(`📋 DETECTED PRODUCT LINE: ${attrs.productLine}`)
  }
  return attrs.productLine || null
}

// Detect part numbers (keeping original logic for now)
export const detectPartNumbers = (searchTerm: string): DetectedParts => {
  const query = searchTerm.toLowerCase().trim()

  // Check for strand patterns
  const strandMatch = query.match(/\b(\d+)\s*strand/i)
  const hasStrandPattern = Boolean(strandMatch)
  const strandCount = strandMatch && strandMatch[1] ? parseInt(strandMatch[1], 10) : undefined

  if (hasStrandPattern) {
    console.log(`🧶 Strand pattern detected: ${strandCount} strand`)
  }

  // Skip common electrical terms
  const electricalTermsToSkip = [
    'connector', 'connectors', 'adapter', 'adapters', 'panel', 'panels',
    'cable', 'cables', 'fiber', 'fibre', 'optic', 'optics', 'optical',
    'ethernet', 'network', 'category', 'plenum', 'riser', 'outdoor', 'indoor',
    'single', 'multimode', 'singlemode', 'corning', 'panduit', 'leviton',
    'superior', 'essex', 'enclosure', 'housing', 'patch', 'pigtail',
    'jumper', 'coupler', 'splice', 'terminal', 'termination',
    'non-plenum', 'nonplenum', 'cmr', 'cmp', 'pvc', 'wall', 'mount', 'rack'
  ]

  // Part number patterns
  const partNumberPatterns = [
    /\b\d{6,}\b/g,
    /\b[a-z]{2,4}\d{4,}\b/g,
    /\b\d{4,}[a-z]{2,4}\b/g,
    /\b[a-z0-9]{3,}-[a-z0-9]{3,}-?[a-z0-9]*\b/g
  ]

  let detectedParts: string[] = []
  let remainingText = query

  // Extract potential part numbers
  partNumberPatterns.forEach(pattern => {
    const matches = query.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const isElectricalTerm = electricalTermsToSkip.includes(match.toLowerCase())
        const isStrandNumber = strandMatch && strandMatch[1] && match === strandMatch[1]

        if (!isElectricalTerm && !isStrandNumber) {
          detectedParts.push(match)
          remainingText = remainingText.replace(match, '').trim()
        }
      })
    }
  })

  // Extract quantity
  const quantityMatch = remainingText.match(/\b(\d{1,6})\s*(ft|feet|foot|pcs|pieces|units?)?\b/)
  let quantity: number | undefined
  if (quantityMatch && quantityMatch[1] && (!strandCount || parseInt(quantityMatch[1], 10) !== strandCount)) {
    quantity = parseInt(quantityMatch[1], 10)
  }

  return {
    hasParts: detectedParts.length > 0,
    partNumbers: detectedParts,
    quantity,
    remainingText: remainingText.trim(),
    hasStrandPattern,
    strandCount
  }
}

// Detect AWG size
export const detectAWGSize = async (searchTerm: string): Promise<string | null> => {
  const attrs = await searchIntelligence.detectAllAttributes(searchTerm)
  return attrs.awg || null
}

// Detect packaging quantity
export const detectPackagingQty = (searchTerm: string): number | null => {
  const qtyPattern = /\b(\d+)\s*(?:pack|pc|pcs|piece|count|jar|box)\b|(?:pack|jar|box)\s*of\s*(\d+)\b/i
  const match = searchTerm.match(qtyPattern)
  
  if (match) {
    const qty = parseInt(match[1] || match[2])
    if ([20, 50, 100, 500].includes(qty)) {
      return qty
    }
  }
  
  return null
}

// Detect pass-through
export const detectPassThrough = (searchTerm: string): boolean => {
  const passThroughTerms = [
    'pass-through', 'pass through', 'passthrough', 'pass-thru',
    'feed-through', 'feed through', 'feedthrough', 'ez-rj45',
    'ez rj45', 'poe feed-through'
  ]
  const lowerTerm = searchTerm.toLowerCase()
  return passThroughTerms.some(term => lowerTerm.includes(term))
}

// ===================================================================
// BUSINESS RULES
// ===================================================================

// Validate electrical query
export const validateElectricalQuery = async (query: string): Promise<ValidationResult> => {
  if (typeof query !== 'string') {
    return {
      isValid: false,
      message: 'Invalid search query format'
    }
  }

  return await searchIntelligence.validateQuery(query)
}

// Apply business rules
export const applyBusinessRules = async (searchTerm: string): Promise<BusinessRuleResult> => {
  return await searchIntelligence.applyBusinessRules(searchTerm)
}

// Normalize part number
export const normalizePartNumber = (partNumber: string): string => {
  return partNumber.toLowerCase().replace(/[\s\-_]/g, '')
}

// Normalize mount types
export const normalizeMountTypes = (mountType: string | undefined): string[] => {
  if (!mountType) return []
  
  let cleanMountType = mountType.trim()
  
  if (cleanMountType.startsWith('"') && cleanMountType.endsWith('"')) {
    cleanMountType = cleanMountType.slice(1, -1).trim()
  }
  
  const types = cleanMountType.split(',').map(t => normalizeSingleMountType(t.trim())).filter(Boolean)
  
  return [...new Set(types)]
}

export const normalizeMountType = (mountType: string | undefined): string | undefined => {
  const types = normalizeMountTypes(mountType)
  return types.length > 0 ? types[0] : undefined
}

const normalizeSingleMountType = (mountType: string): string => {
  const mountTypeMappings: { [key: string]: string } = {
    'WALL-MOUNT': 'Wall Mount',
    'WALL MOUNT': 'Wall Mount',
    'Wall Mount': 'Wall Mount',
    'wall mount': 'Wall Mount',
    'RACK-MOUNT': 'Rack Mount',
    'RACK MOUNT': 'Rack Mount',
    'Rack Mount': 'Rack Mount',
    'rack mount': 'Rack Mount',
    'DIN-Rail': 'DIN Rail',
    'DIN Rail': 'DIN Rail',
    'din-rail': 'DIN Rail',
    'din rail': 'DIN Rail',
    'SURFACE-MOUNT': 'Surface Mount',
    'SURFACE MOUNT': 'Surface Mount',
    'Surface Mount': 'Surface Mount',
    'surface mount': 'Surface Mount'
  }
  
  return mountTypeMappings[mountType] || mountType
}

// ===================================================================
// LEGACY EXPORTS - For backward compatibility
// ===================================================================

// These will be removed once all code is updated to use async functions
export const COMPREHENSIVE_CATEGORY_TERMS = {}
export const COMPREHENSIVE_CABLE_TYPE_TERMS = {}
export const COMPREHENSIVE_JACKET_TERMS = {}
export const MODULAR_PLUG_TERMS = {}
export const JACKET_EQUIVALENCIES = {}
export const DATABASE_JACKET_FORMATS = {}
export const CATEGORY_PATTERNS = {}
export const PAIR_COUNT_PATTERNS = {}
export const SHIELDING_PATTERNS = {}
export const APPLICATION_PATTERNS = {}
export const DATABASE_COLORS = []
export const DATABASE_BRANDS = []
export const DATABASE_PRODUCT_LINES = []
export const DATABASE_AWG_VALUES = []
export const DATABASE_PAIR_COUNTS = []