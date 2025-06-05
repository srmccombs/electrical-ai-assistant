// VERSION 3.0 - TypeScript Safe with Full Functionality
// Combined Version 1 (3200+ lines functionality) + Version 2 (TypeScript safety)

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter, Brain, Shield, Database, Cpu, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ===================================================================
// TYPE DEFINITIONS - Complete and TypeScript Safe
// ===================================================================

interface Product {
  id: string
  partNumber: string
  brand: string
  description: string
  price?: number
  stockLocal: number
  stockDistribution: number
  leadTime?: string
  category: string
  imageUrl?: string
  fiberType?: string
  jacketRating?: string
  fiberCount?: number
  connectorType?: string
  categoryRating?: string
  shielding?: string
  searchRelevance?: number
  tableName?: string
  packagingType?: string
  color?: string
  // Stock status fields
  stockStatus?: string
  stockColor?: string
  stockMessage?: string
  // Enhanced fields from CSV
  productLine?: string
  pairCount?: string
  conductorAwg?: number
  jacketColor?: string
  cableDiameter?: number
  application?: string
  possibleCross?: string
  commonTerms?: string
  compatibleConnectors?: string
  goWithItems?: string
  // Enhanced fiber connector fields
  productType?: string
  technology?: string
  polish?: string
  housingColor?: string
  bootColor?: string
  ferruleMaterial?: string
}

interface ListItem extends Product {
  quantity: number
  addedAt: Date
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
  timestamp: Date
  searchType?: string
  searchTime?: number
  aiAnalysis?: AISearchAnalysis | null
  smartFilters?: SmartFilters | null
}

interface SmartFilters {
  brands: string[]
  packagingTypes: string[]
  jacketRatings: string[]
  fiberTypes: string[]
  connectorTypes: string[]
  categoryRatings: string[]
  colors: string[]
  shieldingTypes: string[]
  productLines: string[]
  pairCounts: string[]
  conductorGauges: string[]
  applications: string[]
  productType: string
  // Enhanced fiber connector filters
  productTypes: string[]
  technologies: string[]
  polishTypes: string[]
  housingColors: string[]
  bootColors: string[]
}

interface AISearchAnalysis {
  searchStrategy: string
  productType: string
  confidence: number
  detectedSpecs: {
    fiberType?: string
    categoryRating?: string
    connectorType?: string
    jacketRating?: string
    fiberCount?: number
    requestedQuantity?: number
    shielding?: string
    manufacturer?: string
    productType?: string
    color?: string
    application?: string
    productLine?: string
    pairCount?: string
    conductorAwg?: number
  }
  searchTerms: string[]
  reasoning: string
  suggestedFilters: string[]
  alternativeQueries: string[]
  originalQuery: string
  timestamp: string
  aiModel: string
}

interface SearchResult {
  products: Product[]
  searchTime: number
  searchType: string
  aiAnalysis?: AISearchAnalysis
  redirectMessage?: string
}

interface DetectedParts {
  hasParts: boolean
  partNumbers: string[]
  quantity: number | undefined
  remainingText: string
  hasStrandPattern: boolean
  strandCount: number | undefined
}

interface BusinessRuleResult {
  originalTerm: string
  processedTerm: string
  wasRedirected: boolean
  redirectMessage: string | null
}

interface ValidationResult {
  isValid: boolean
  message?: string
  suggestion?: string
}

// ===================================================================
// ENHANCED ELECTRICAL INDUSTRY KNOWLEDGE - CRITICAL FOR ACCURATE SEARCH
// ===================================================================

// CRITICAL: Enhanced Jacket Rating Equivalencies (from your 35 years experience)
const JACKET_EQUIVALENCIES = {
  // RISER = CMR = NON-PLENUM = PVC (all exactly the same thing!)
  riser: ["riser", "cmr", "non-plenum", "non plenum", "nonplenum", "cmr rated", "pvc"],
  // PLENUM = CMP
  plenum: ["plenum", "cmp", "plenum rated", "cmp rated"],
  // OUTDOOR variations
  outdoor: ["outdoor", "osp", "outside plant", "burial", "underground", "gel filled", "gel-filled", "water block", "waterblock"]
} as const

// Your database formats (what's actually stored in jacket_material column)
const DATABASE_JACKET_FORMATS = {
  riser: "Non-Plenum Rated CMR ",
  plenum: "Plenum Rated CMP ",
  cmr: "Non-Plenum Rated CMR ",
  cmp: "Plenum Rated CMP ",
  "non-plenum": "Non-Plenum Rated CMR ",
  pvc: "Non-Plenum Rated CMR ",  // PVC maps to Non-Plenum
  outdoor: "Outdoor/OSP"
} as const

// Enhanced category rating patterns
const CATEGORY_PATTERNS = {
  cat3: ["cat3", "cat 3", "category 3", "category3"],
  cat5e: ["cat5e", "cat 5e", "category 5e", "category5e"],
  cat6: ["cat6", "cat 6", "category 6", "category6"],
  cat6a: ["cat6a", "cat 6a", "category 6a", "category6a"]
} as const

// Pair count variations
const PAIR_COUNT_PATTERNS = {
  "4": ["4 pair", "4-pair", "4pair", "4pr", "4 pr"],
  "25": ["25 pair", "25-pair", "25pair", "25pr", "25 pr"]
} as const

// Shielding variations
const SHIELDING_PATTERNS = {
  stp: ["stp", "shielded", "shielded twisted pair", "foil", "screened"],
  utp: ["utp", "unshielded", "unshielded twisted pair"]
} as const

// Application patterns
const APPLICATION_PATTERNS = {
  indoor: ["indoor", "internal", "inside"],
  outdoor: ["outdoor", "osp", "outside plant", "external", "burial", "underground", "gel filled"],
  "indoor/outdoor": ["indoor/outdoor", "indoor-outdoor", "versatile"]
} as const

// Available in your actual database (from analysis)
const DATABASE_COLORS = ["Black", "Blue", "Brown", "Gray", "Green", "Orange", "Pink", "Red", "Violet", "White", "Yellow"]
const DATABASE_BRANDS = ["Leviton/BerkTek","Panduit","Prysmian","Superior Essex","GenSPEED 10 MTP Category 6A Cable","GenSPEED 5000 Cable","GenSPEED 6 Cable","GenSPEED 6500 Premium Cable","10Gain","Cobra","DataGain","Marathon LAN","Series 77","XP+"]
const DATABASE_PRODUCT_LINES = ["Hyper Plus 5e", "LANMARK 6", "LANMARK-1000", "LANMARK-2000", "LanMArk-SST"]
const DATABASE_AWG_VALUES = [23, 24]
const DATABASE_PAIR_COUNTS = ["4-Pair"]

// ===================================================================
// ENHANCED MISSPELLING DETECTION AND SEARCH
// ===================================================================

// Enhanced jacket type detection with more patterns
const detectJacketType = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase().trim()

  console.log(`🧥 Detecting jacket type from: "${query}"`)

  // Check for riser equivalents (highest priority - most common)
  // INCLUDES PVC (PVC = Riser = CMR = Non-Plenum)
  for (const term of JACKET_EQUIVALENCIES.riser) {
    if (query.includes(term)) {
      console.log(`🧥 DETECTED RISER from term: "${term}"`)
      return "RISER"
    }
  }

  // Check for plenum
  for (const term of JACKET_EQUIVALENCIES.plenum) {
    if (query.includes(term)) {
      console.log(`🧥 DETECTED PLENUM from term: "${term}"`)
      return "PLENUM"
    }
  }

  // Check for outdoor
  for (const term of JACKET_EQUIVALENCIES.outdoor) {
    if (query.includes(term)) {
      console.log(`🧥 DETECTED OUTDOOR from term: "${term}"`)
      return "OUTDOOR"
    }
  }

  console.log(`🧥 No jacket type detected`)
  return null
}

// Enhanced category detection
const detectCategoryRating = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase().trim()

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (query.includes(pattern)) {
        console.log(`📊 DETECTED CATEGORY: ${category.toUpperCase()} from pattern: "${pattern}"`)
        return category.toUpperCase()
      }
    }
  }

  return null
}

// Enhanced shielding detection
const detectShielding = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase().trim()

  for (const [type, patterns] of Object.entries(SHIELDING_PATTERNS)) {
    for (const pattern of patterns) {
      if (query.includes(pattern)) {
        console.log(`🛡️ DETECTED SHIELDING: ${type.toUpperCase()} from pattern: "${pattern}"`)
        return type.toUpperCase()
      }
    }
  }

  return null
}

// Enhanced quantity detection
const detectQuantity = (searchTerm: string): number | null => {
  // Look for patterns like "1000ft", "500 ft", "1000 feet", etc.
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

// Enhanced color detection
const detectColor = (searchTerm: string): string | null => {
  const colors = ["black", "blue", "brown", "gray", "grey", "green", "orange", "pink", "red", "violet", "white", "yellow"]
  const query = searchTerm.toLowerCase()

  for (const color of colors) {
    if (query.includes(color)) {
      console.log(`🎨 DETECTED COLOR: ${color}`)
      return color
    }
  }

  return null
}

// Enhanced product line detection with actual CSV values
const detectProductLine = (searchTerm: string): string | null => {
  const productLines = [
    { search: ["hyper plus 5e", "hyper plus", "hyper"], actual: "Hyper Plus 5e" },
    { search: ["lanmark 6", "lanmark6", "lanmark-6"], actual: "LANMARK 6" },
    { search: ["lanmark-1000", "lanmark 1000"], actual: "LANMARK-1000" },
    { search: ["lanmark-2000", "lanmark 2000"], actual: "LANMARK-2000" },
    { search: ["lanmark-sst", "lanmarksst"], actual: "LanMArk-SST" }
  ]

  const query = searchTerm.toLowerCase()

  for (const line of productLines) {
    for (const searchTerm of line.search) {
      if (query.includes(searchTerm)) {
        console.log(`📋 DETECTED PRODUCT LINE: ${line.actual} from search term: ${searchTerm}`)
        return line.actual
      }
    }
  }

  return null
}

// ENHANCED: Detect if search contains part numbers or strand patterns
const detectPartNumbers = (searchTerm: string): DetectedParts => {
  const query = searchTerm.toLowerCase().trim()

  // NEW: Check for strand patterns first
  const strandMatch = query.match(/\b(\d+)\s*strand/i)
  const hasStrandPattern = Boolean(strandMatch)
  const strandCount = strandMatch && strandMatch[1] ? parseInt(strandMatch[1], 10) : undefined

  if (hasStrandPattern) {
    console.log(`🧶 Strand pattern detected: ${strandCount} strand - treating as fiber cable search`)
  }

  // ENHANCED: Skip common electrical industry terms that aren't part numbers
  const electricalTermsToSkip = [
    'connector', 'connectors', 'adapter', 'adapters', 'panel', 'panels',
    'cable', 'cables', 'fiber', 'fibre', 'optic', 'optics', 'optical',
    'ethernet', 'network', 'category', 'plenum', 'riser', 'outdoor', 'indoor',
    'single', 'multimode', 'singlemode', 'corning', 'panduit', 'leviton',
    'superior', 'essex', 'enclosure', 'housing', 'patch', 'pigtail',
    'jumper', 'coupler', 'splice', 'terminal', 'termination'
  ]

  // Enhanced part number patterns - more restrictive to avoid false positives
  const partNumberPatterns = [
    /\b\d{6,}\b/g,           // 6+ digit numbers only (7131100, 10136339)
    /\b[a-z]{2,4}\d{4,}\b/g, // 2-4 letters followed by 4+ digits (ABC1234)
    /\b\d{4,}[a-z]{2,4}\b/g, // 4+ digits followed by 2-4 letters (1234ABC)
    /\b[a-z0-9]{3,}-[a-z0-9]{3,}-?[a-z0-9]*\b/g  // Clear hyphenated patterns (123-456-789)
  ]

  let detectedParts: string[] = []
  let remainingText = query

  // Extract potential part numbers
  partNumberPatterns.forEach(pattern => {
    const matches = query.match(pattern)
    if (matches) {
      matches.forEach(match => {
        // Skip electrical industry terms and strand patterns
        const isElectricalTerm = electricalTermsToSkip.includes(match.toLowerCase())
        const isStrandNumber = strandMatch && strandMatch[1] && match === strandMatch[1]

        // Additional check: make sure it's not a common word combination
        const isCommonPhrase = query.includes(`${match} connector`) ||
                              query.includes(`${match} cable`) ||
                              query.includes(`fiber ${match}`) ||
                              query.includes(`optic ${match}`)

        if (!isElectricalTerm && !isStrandNumber && !isCommonPhrase) {
          detectedParts.push(match)
          remainingText = remainingText.replace(match, '').trim()
        }
      })
    }
  })

  // Extract quantity if present (but not if it's the strand count)
  const quantityMatch = remainingText.match(/\b(\d{1,6})\s*(ft|feet|foot|pcs|pieces|units?)?\b/)
  let quantity: number | undefined
  if (quantityMatch && quantityMatch[1] && (!strandCount || parseInt(quantityMatch[1], 10) !== strandCount)) {
    quantity = parseInt(quantityMatch[1], 10)
  }

  console.log('🔍 Enhanced detection:', {
    original: searchTerm,
    detectedParts,
    quantity,
    hasStrandPattern,
    strandCount,
    remainingText: remainingText.trim(),
    skippedElectricalTerms: true
  })

  return {
    hasParts: detectedParts.length > 0,
    partNumbers: detectedParts,
    quantity,
    remainingText: remainingText.trim(),
    hasStrandPattern,
    strandCount
  }
}

// Normalize part number for searching (remove spaces, dashes, make lowercase)
const normalizePartNumber = (partNumber: string): string => {
  return partNumber.toLowerCase().replace(/[\s\-_]/g, '')
}

// ENHANCED: Search for specific part numbers across all tables with prefix matching
const searchByPartNumber = async (partNumbers: string[], quantity?: number): Promise<Product[]> => {
  console.log('🔢 ENHANCED PART NUMBER SEARCH')
  console.log('🔍 Searching for part numbers:', partNumbers)

  let allResults: Product[] = []

  // Define all tables to search
  const tables: Array<{ name: string; prefix: string }> = [
    { name: 'category_cables', prefix: 'cat' },
    { name: 'fiber_connectors', prefix: 'conn' },
    { name: 'adapter_panels', prefix: 'panel' },
    { name: 'products', prefix: 'prod' }
  ]

  // Search each table
  for (const table of tables) {
    try {
      console.log(`🔍 Searching ${table.name} for part numbers...`)

      // Build search conditions for each part number variation
      const searchConditions: string[] = []

      partNumbers.forEach(partNum => {
        const normalized = normalizePartNumber(partNum)
        const original = partNum

        // ENHANCED: Exact matches first
        searchConditions.push(`part_number.eq.${original}`)
        searchConditions.push(`part_number.eq.${normalized}`)

        // ENHANCED: Prefix matches (user requested feature - first few characters)
        searchConditions.push(`part_number.ilike.${original}%`)
        searchConditions.push(`part_number.ilike.${normalized}%`)

        // ENHANCED: Contains matches (for middle/end matches)
        searchConditions.push(`part_number.ilike.%${original}%`)
        searchConditions.push(`part_number.ilike.%${normalized}%`)

        // Also search with common separators
        if (normalized.length >= 3) {
          // Try with dashes and spaces at different positions
          const withDash = normalized.slice(0, 3) + '-' + normalized.slice(3)
          const withSpace = normalized.slice(0, 3) + ' ' + normalized.slice(3)
          searchConditions.push(`part_number.ilike.%${withDash}%`)
          searchConditions.push(`part_number.ilike.%${withSpace}%`)

          // Also try prefix matches with separators
          searchConditions.push(`part_number.ilike.${withDash}%`)
          searchConditions.push(`part_number.ilike.${withSpace}%`)
        }
      })

      const query = supabase
        .from(table.name)
        .select('*')
        .eq('is_active', true)
        .or(searchConditions.join(','))
        .limit(50) // Increased limit for partial matches

      const result = await query

      if (result.data && result.data.length > 0) {
        console.log(`✅ Found ${result.data.length} matches in ${table.name}`)

        // Convert to standard product format
        const products: Product[] = result.data.map((item: any) => ({
          id: `${table.prefix}-${item.id}`,
          partNumber: item.part_number?.toString() || 'No Part Number',
          brand: item.brand || 'Unknown Brand',
          description: item.short_description || 'No description available',
          price: parseFloat(item.unit_price || '0') || Math.random() * 200 + 50,
          stockLocal: item.stock_quantity || 0,
          stockDistribution: 100,
          leadTime: 'Ships Today',
          category: table.name === 'category_cables' ? 'Category Cable' :
                   table.name === 'fiber_connectors' ? 'Fiber Connector' :
                   table.name === 'adapter_panels' ? 'Adapter Panel' : 'Product',
          searchRelevance: 1.0,
          tableName: table.name,
          stockStatus: 'not_in_stock',
          stockColor: 'red',
          stockMessage: 'Not currently in stock - contact for availability',
          // Add type-specific fields for category cables
          ...(table.name === 'category_cables' && {
            categoryRating: item.category_rating || undefined,
            jacketRating: item.jacket_material || undefined,
            color: item.jacket_color || undefined,
            shielding: item.Shielding_Type || undefined,
            productLine: item.product_line || undefined,
            pairCount: item.pair_count || undefined,
            conductorAwg: item.conductor_awg || undefined,
            jacketColor: item.jacket_color || undefined,
            cableDiameter: item.cable_diameter_in || undefined,
            possibleCross: item.possible_cross || undefined
          }),
          // Add type-specific fields for fiber connectors
          ...(table.name === 'fiber_connectors' && {
            productLine: item.product_line || undefined,
            connectorType: item.connector_type || undefined,
            fiberType: Array.isArray(item.fiber_category) ? item.fiber_category.join(', ') : item.fiber_category,
            fiberCount: item.fiber_count || undefined,
            productType: item.product_type || undefined,
            technology: item.technology || undefined,
            polish: item.polish || undefined,
            housingColor: item.housing_color || undefined,
            bootColor: item.boot_color || undefined,
            ferruleMaterial: item.ferrule_material || undefined,
            commonTerms: item.common_terms || undefined
          })
        }))

        allResults = [...allResults, ...products]
      }
    } catch (error) {
      console.error(`❌ Error searching ${table.name}:`, error)
    }
  }

  // Sort results by relevance (exact matches first, then prefix matches)
  allResults.sort((a, b) => {
    const aPartNum = a.partNumber.toLowerCase()
    const bPartNum = b.partNumber.toLowerCase()

    for (const searchTerm of partNumbers) {
      const searchLower = searchTerm.toLowerCase()

      // Exact matches get highest priority
      if (aPartNum === searchLower && bPartNum !== searchLower) return -1
      if (bPartNum === searchLower && aPartNum !== searchLower) return 1

      // Prefix matches get second priority
      if (aPartNum.startsWith(searchLower) && !bPartNum.startsWith(searchLower)) return -1
      if (bPartNum.startsWith(searchLower) && !aPartNum.startsWith(searchLower)) return 1
    }

    return 0
  })

  console.log(`🔢 Enhanced part number search completed: ${allResults.length} total matches`)
  return allResults
}

// 1. QUERY VALIDATION SYSTEM
const validateElectricalQuery = (query: string): ValidationResult => {
  const blockedTerms = [
    // Medical
    'cancer', 'medicine', 'doctor', 'prescription', 'surgery', 'treatment',
    'health', 'medical', 'hospital', 'clinic', 'patient', 'drug',

    // Food/Cooking
    'recipe', 'cooking', 'restaurant', 'food', 'kitchen', 'meal',
    'diet', 'nutrition', 'ingredients', 'baking',

    // Automotive
    'car', 'vehicle', 'automotive', 'engine', 'tire', 'brake',
    'transmission', 'gasoline', 'motor oil',

    // Finance
    'investment', 'stock', 'cryptocurrency', 'bitcoin', 'trading',
    'mortgage', 'loan', 'banking', 'finance'
  ]

  const electricalTerms = [
    // Cables
    'cable', 'wire', 'cat5e', 'cat6', 'cat6a', 'fiber', 'ethernet',
    'plenum', 'riser', 'armored', 'shielded', 'utp', 'stp',

    // Components
    'connector', 'panel', 'switch', 'outlet', 'receptacle',
    'breaker', 'fuse', 'conduit', 'raceway',

    // Specifications
    'awg', 'volt', 'amp', 'watt', 'ohm', 'impedance',
    'gauge', 'strand', 'solid', 'stranded'
  ]

  const queryLower = query.toLowerCase()

  // Check for blocked terms
  const hasBlockedTerms = blockedTerms.some(term => queryLower.includes(term))
  if (hasBlockedTerms) {
    return {
      isValid: false,
      message: "I'm specialized in electrical and telecommunications products. Please search for cables, connectors, panels, or other electrical infrastructure items."
    }
  }

  // Check for electrical terms or numbers
  const hasElectricalTerms = electricalTerms.some(term => queryLower.includes(term))
  const hasNumbers = /\d/.test(query)
  const hasElectricalPattern = /\b(cat|category|om|os)\s*\d/i.test(query)

  if (hasElectricalTerms || hasNumbers || hasElectricalPattern) {
    return { isValid: true }
  }

  return {
    isValid: true,
    suggestion: "For best results, try searching for specific electrical products like 'Cat6 cable', 'fiber connector', or part numbers."
  }
}

// 2. CAT5 → CAT5E BUSINESS RULE
const applyBusinessRules = (searchTerm: string): BusinessRuleResult => {
  let processedTerm = searchTerm.toLowerCase()

  // CRITICAL BUSINESS RULE: Redirect Cat5 to Cat5e
  const cat5Patterns = [
    /\bcat\s*5\b/gi,
    /\bcategory\s*5\b/gi,
    /\bcat-5\b/gi,
    /\bcat5\b/gi
  ]

  let redirected = false
  cat5Patterns.forEach(pattern => {
    if (pattern.test(processedTerm)) {
      processedTerm = processedTerm.replace(pattern, 'cat5e')
      redirected = true
    }
  })

  if (redirected) {
    console.log('🔄 BUSINESS RULE: Redirected Cat5 → Cat5e')
  }

  return {
    originalTerm: searchTerm,
    processedTerm,
    wasRedirected: redirected,
    redirectMessage: redirected ? 'Showing Cat5e results (Cat5e is the current standard)' : null
  }
}

// 3. REALISTIC PROFESSIONAL SEARCHES (How electrical distributors actually search)
const getUpdatedPopularSearches = (): string[] => [
  "GenSPEED 5000",     // Uses actual product_line value "LANMARK 6"
  "GenSPEED 6",        // Uses actual category_rating "Category 6"
  "Fiber Optic Connectors",          // Tests fiber connector search
  "LC Connectors",   // Tests connector type search
  "Corning",           // Tests brand search across all products
  "OM4 Connectors"         // Tests fiber type search
]

// ===================================================================
// ENHANCED COMPREHENSIVE CATEGORY CABLES SEARCH - FIXED FOR REAL DATA
// ===================================================================
const searchCategoryCables = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
  console.log('🌐 ENHANCED CATEGORY CABLES SEARCH')
  console.log('🔍 Original search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    // Enhanced detection using both AI and manual parsing
    const detectedJacket = detectJacketType(searchTerm)
    const detectedCategory = detectCategoryRating(searchTerm) || aiAnalysis?.detectedSpecs?.categoryRating
    const detectedQuantity = detectQuantity(searchTerm) || aiAnalysis?.detectedSpecs?.requestedQuantity
    const detectedShielding = detectShielding(searchTerm) || aiAnalysis?.detectedSpecs?.shielding
    const detectedColor = detectColor(searchTerm) || aiAnalysis?.detectedSpecs?.color
    const detectedProductLine = detectProductLine(searchTerm)

    console.log('🎯 ENHANCED DETECTION RESULTS:', {
      jacket: detectedJacket,
      category: detectedCategory,
      quantity: detectedQuantity,
      shielding: detectedShielding,
      color: detectedColor,
      productLine: detectedProductLine
    })

    // STRATEGY 1: If we detected a specific product line, search for that first
    if (detectedProductLine) {
      console.log(`📋 STRATEGY 1: Searching by product line: "${detectedProductLine}"`)

      let query = supabase
        .from('category_cables')
        .select('*')
        .eq('is_active', true)
        .eq('product_line', detectedProductLine)
        .limit(100)

      // Add additional filters if detected
      if (detectedColor) {
        const colorToSearch = detectedColor.charAt(0).toUpperCase() + detectedColor.slice(1) // "Blue" not "blue"
        query = query.eq('jacket_color', colorToSearch)
        console.log(`🎨 Adding color filter: ${colorToSearch}`)
      }

      if (detectedJacket === 'RISER') {
        query = query.eq('jacket_material', 'Non-Plenum Rated CMR ')
        console.log(`🧥 Adding riser filter: Non-Plenum Rated CMR`)
      } else if (detectedJacket === 'PLENUM') {
        query = query.eq('jacket_material', 'Plenum Rated CMP ')
        console.log(`🧥 Adding plenum filter: Plenum Rated CMP`)
      }

      const result = await query
      console.log(`📊 Product line search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        return formatCableResults(result.data, 'product_line_match')
      }
    }

    // STRATEGY 2: Search by main criteria with targeted conditions
    console.log(`🎯 STRATEGY 2: Targeted search with multiple criteria`)

    let query = supabase
      .from('category_cables')
      .select('*')
      .eq('is_active', true)
      .limit(150)

    // Build focused search conditions (max 8-10 conditions to avoid URL issues)
    const searchConditions: string[] = []

    // 1. Direct term searches
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`product_line.ilike.%${searchTerm}%`)

    // 2. If we detected specific product line
    if (detectedProductLine) {
      searchConditions.push(`product_line.eq.${detectedProductLine}`)
    }

    // 3. If we detected specific color
    if (detectedColor) {
      const colorToSearch = detectedColor.charAt(0).toUpperCase() + detectedColor.slice(1)
      searchConditions.push(`jacket_color.eq.${colorToSearch}`)
    }

    // 4. Jacket material searches (with exact database values)
    if (detectedJacket === 'RISER') {
      searchConditions.push(`jacket_material.eq.Non-Plenum Rated CMR `)
      searchConditions.push(`short_description.ilike.%CMR%`)
    } else if (detectedJacket === 'PLENUM') {
      searchConditions.push(`jacket_material.eq.Plenum Rated CMP `)
      searchConditions.push(`short_description.ilike.%CMP%`)
    }

    // Apply search conditions
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
      console.log(`🚀 Applying ${searchConditions.length} targeted search conditions`)
    }

    const result = await query
    console.log(`📊 Targeted search result: ${result.data?.length || 0} products found`)

    if (!result.data || result.data.length === 0) {
      console.log('❌ No results found with targeted search')

      // STRATEGY 3: Fallback broad search
      console.log('🔍 STRATEGY 3: Fallback broad search')

      const fallbackQuery = supabase
        .from('category_cables')
        .select('*')
        .eq('is_active', true)
        .or(`short_description.ilike.%${searchTerm}%,product_line.ilike.%${searchTerm}%,jacket_color.ilike.%${searchTerm}%`)
        .limit(50)

      const fallbackResult = await fallbackQuery
      console.log(`📊 Fallback search result: ${fallbackResult.data?.length || 0} products found`)

      if (fallbackResult.data && fallbackResult.data.length > 0) {
        return formatCableResults(fallbackResult.data, 'fallback_search')
      }

      return []
    }

    // Apply intelligent post-filtering
    let filteredResults = result.data

    // Category filtering (be specific about Cat6 vs Cat6A)
    if (detectedCategory) {
      const beforeCount = filteredResults.length

      filteredResults = filteredResults.filter(item => {
        const category = item.category_rating?.toLowerCase() || ''

        if (detectedCategory === 'CAT6') {
          return category.includes('category 6') && !category.includes('6a')
        } else if (detectedCategory === 'CAT6A') {
          return category.includes('6a')
        } else if (detectedCategory === 'CAT5E') {
          return category.includes('5e')
        }

        return true
      })

      console.log(`🎯 Category filter (${detectedCategory}): ${beforeCount} → ${filteredResults.length} products`)
    }

    // Shielding filtering
    if (detectedShielding) {
      const beforeCount = filteredResults.length

      filteredResults = filteredResults.filter(item => {
        const shielding = item.Shielding_Type?.toUpperCase() || ''
        return shielding === detectedShielding
      })

      console.log(`🛡️ Shielding filter (${detectedShielding}): ${beforeCount} → ${filteredResults.length} products`)
    }

    return formatCableResults(filteredResults, 'targeted_search')

  } catch (error) {
    console.error('❌ Error in searchCategoryCables:', error)
    return []
  }
}

// Helper function to format cable results consistently
const formatCableResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} CABLE RESULTS (${searchType})`)

  return data.map((item: any) => ({
    id: `cat-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand || 'Unknown Brand',
    description: item.short_description || 'No description available',
    price: Math.random() * 150 + 50,
    stockLocal: 25,
    stockDistribution: 100,
    leadTime: 'Ships Today',
    category: 'Category Cable',
    categoryRating: item.category_rating?.trim() || undefined, // Remove trailing spaces
    jacketRating: item.jacket_material?.includes('Plenum') ? 'CMP' :
                 item.jacket_material?.includes('Non-Plenum') ? 'CMR' :
                 item.jacket_material?.trim() || undefined,
    color: item.jacket_color?.trim() || undefined,
    packagingType: item.packaging_type || undefined,
    shielding: item.Shielding_Type || undefined,
    // Enhanced fields from CSV
    productLine: item.product_line || undefined,
    pairCount: item.pair_count || undefined,
    conductorAwg: item.conductor_awg || undefined,
    jacketColor: item.jacket_color?.trim() || undefined,
    cableDiameter: item.cable_diameter_in || undefined,
    application: item.application || undefined,
    possibleCross: item.possible_cross || undefined,
    searchRelevance: 1.0,
    tableName: 'category_cables',
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }))
}

// ===================================================================
// ENHANCED COMPREHENSIVE FIBER CONNECTORS SEARCH - SIMILAR TO CABLES
// ===================================================================
const searchFiberConnectors = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
  console.log('🔌 ENHANCED FIBER CONNECTORS SEARCH')
  console.log('🔍 Original search term:', searchTerm)
  console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

  try {
    // Enhanced detection using both AI and manual parsing
    const detectedFiberType = aiAnalysis?.detectedSpecs?.fiberType
    const detectedConnectorType = aiAnalysis?.detectedSpecs?.connectorType
    const detectedQuantity = aiAnalysis?.detectedSpecs?.requestedQuantity
    const detectedBrand = aiAnalysis?.detectedSpecs?.manufacturer

    console.log('🎯 ENHANCED DETECTION RESULTS:', {
      fiberType: detectedFiberType,
      connectorType: detectedConnectorType,
      quantity: detectedQuantity,
      brand: detectedBrand
    })

    // STRATEGY 1: Brand-focused search (e.g., "Corning", "Corning fiber connectors")
    const queryLower = searchTerm.toLowerCase()
    const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex']
    const detectedBrandKeyword = brandKeywords.find(brand => queryLower.includes(brand))

    if (detectedBrandKeyword) {
      console.log(`🏢 STRATEGY 1: Brand-focused search for: "${detectedBrandKeyword}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('brand', `%${detectedBrandKeyword}%`)
        .limit(100)

      const result = await query
      console.log(`📊 Brand search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        return formatConnectorResults(result.data, 'brand_match')
      }
    }

    // STRATEGY 2: Product line search (e.g., "Unicam")
    const productLineKeywords = ['unicam', 'optitap', 'cleartrak', 'fibertight']
    const detectedProductLine = productLineKeywords.find(line => queryLower.includes(line))

    if (detectedProductLine) {
      console.log(`📋 STRATEGY 2: Product line search for: "${detectedProductLine}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('product_line', `%${detectedProductLine}%`)
        .limit(100)

      const result = await query
      console.log(`📊 Product line search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        return formatConnectorResults(result.data, 'product_line_match')
      }
    }

    // STRATEGY 3: Connector type specific search (e.g., "LC", "SC", "ST")
    const connectorTypes = ['lc', 'sc', 'st', 'fc', 'mtp', 'mpo', 'e2000', 'mu']
    const detectedConnType = connectorTypes.find(type => queryLower.includes(type))

    if (detectedConnType || detectedConnectorType) {
      const searchConnType = detectedConnType || detectedConnectorType
      console.log(`🔌 STRATEGY 3: Connector type search for: "${searchConnType}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('connector_type', `%${searchConnType}%`)
        .limit(100)

      const result = await query
      console.log(`📊 Connector type search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        return formatConnectorResults(result.data, 'connector_type_match')
      }
    }

    // STRATEGY 4: Fiber category search (e.g., "OM1", "OM2", "OM3", "OM4", "OS1", "OS2")
    const fiberCategories = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']
    const detectedFiberCat = fiberCategories.find(cat => queryLower.includes(cat))

    if (detectedFiberCat || detectedFiberType) {
      const searchFiberCat = detectedFiberCat || detectedFiberType
      console.log(`🌈 STRATEGY 4: Fiber category search for: "${searchFiberCat}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .or(`fiber_category.ilike.%${searchFiberCat}%,short_description.ilike.%${searchFiberCat}%`)
        .limit(100)

      const result = await query
      console.log(`📊 Fiber category search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        return formatConnectorResults(result.data, 'fiber_category_match')
      }
    }

    // STRATEGY 5: Part number prefix search (first few characters)
    const partNumberPrefixMatch = searchTerm.match(/^([A-Za-z0-9]{3,8})\b/)
    if (partNumberPrefixMatch && partNumberPrefixMatch[1]) {
      const prefix = partNumberPrefixMatch[1]
      console.log(`🔢 STRATEGY 5: Part number prefix search for: "${prefix}"`)

      let query = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .ilike('part_number', `${prefix}%`)
        .limit(50)

      const result = await query
      console.log(`📊 Part number prefix search result: ${result.data?.length || 0} products found`)

      if (result.data && result.data.length > 0) {
        return formatConnectorResults(result.data, 'part_prefix_match')
      }
    }

    // STRATEGY 6: Comprehensive multi-field search
    console.log(`🎯 STRATEGY 6: Comprehensive search with multiple criteria`)

    let query = supabase
      .from('fiber_connectors')
      .select('*')
      .eq('is_active', true)
      .limit(150)

    // Build focused search conditions
    const searchConditions: string[] = []

    // 1. Direct term searches across key fields
    searchConditions.push(`part_number.ilike.%${searchTerm}%`)
    searchConditions.push(`short_description.ilike.%${searchTerm}%`)
    searchConditions.push(`brand.ilike.%${searchTerm}%`)
    searchConditions.push(`product_line.ilike.%${searchTerm}%`)
    searchConditions.push(`product_type.ilike.%${searchTerm}%`)
    searchConditions.push(`technology.ilike.%${searchTerm}%`)
    searchConditions.push(`connector_type.ilike.%${searchTerm}%`)
    searchConditions.push(`common_terms.ilike.%${searchTerm}%`)

    // 2. If we have specific detections, add those as OR conditions
    if (detectedBrandKeyword) {
      searchConditions.push(`brand.ilike.%${detectedBrandKeyword}%`)
    }

    if (detectedConnType) {
      searchConditions.push(`connector_type.ilike.%${detectedConnType}%`)
    }

    if (detectedFiberCat) {
      searchConditions.push(`fiber_category.ilike.%${detectedFiberCat}%`)
    }

    // Apply search conditions
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
      console.log(`🚀 Applying ${searchConditions.length} comprehensive search conditions`)
    }

    const result = await query
    console.log(`📊 Comprehensive search result: ${result.data?.length || 0} products found`)

    if (!result.data || result.data.length === 0) {
      console.log('❌ No results found with comprehensive search')

      // STRATEGY 7: Fallback broad search for general terms
      console.log('🔍 STRATEGY 7: Fallback broad search')

      const fallbackQuery = supabase
        .from('fiber_connectors')
        .select('*')
        .eq('is_active', true)
        .or(`short_description.ilike.%connector%,short_description.ilike.%fiber%,category.ilike.%connector%`)
        .limit(25)

      const fallbackResult = await fallbackQuery
      console.log(`📊 Fallback search result: ${fallbackResult.data?.length || 0} products found`)

      if (fallbackResult.data && fallbackResult.data.length > 0) {
        return formatConnectorResults(fallbackResult.data, 'fallback_search')
      }

      return []
    }

    return formatConnectorResults(result.data, 'comprehensive_search')

  } catch (error) {
    console.error('❌ Error in searchFiberConnectors:', error)
    return []
  }
}

// Helper function to format connector results consistently
const formatConnectorResults = (data: any[], searchType: string): Product[] => {
  console.log(`✅ FORMATTING ${data.length} CONNECTOR RESULTS (${searchType})`)

  return data.map((item: any) => ({
    id: `conn-${item.id}`,
    partNumber: item.part_number?.toString() || 'No Part Number',
    brand: item.brand || 'Unknown Brand',
    description: item.short_description || 'No description available',
    price: Math.random() * 50 + 15,
    stockLocal: 15,
    stockDistribution: 100,
    leadTime: 'Ships Today',
    category: 'Fiber Connector',
    // Enhanced fields from fiber_connectors CSV
    productLine: item.product_line || undefined,
    connectorType: item.connector_type || undefined,
    fiberType: Array.isArray(item.fiber_category) ? item.fiber_category.join(', ') : item.fiber_category,
    fiberCount: item.fiber_count || undefined,
    productType: item.product_type || undefined,
    technology: item.technology || undefined,
    polish: item.polish || undefined,
    housingColor: item.housing_color || undefined,
    bootColor: item.boot_color || undefined,
    ferruleMaterial: item.ferrule_material || undefined,
    commonTerms: item.common_terms || undefined,
    searchRelevance: 1.0,
    tableName: 'fiber_connectors',
    stockStatus: 'not_in_stock',
    stockColor: 'red',
    stockMessage: 'Not currently in stock - contact for availability'
  }))
}

// ADAPTER PANELS SEARCH
const searchAdapterPanels = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
  console.log('🏠 ADAPTER PANELS SEARCH')

  let query = supabase
    .from('adapter_panels')
    .select('*')
    .eq('is_active', true)
    .limit(50)

  const searchConditions = []

  if (aiAnalysis?.detectedSpecs?.fiberType) {
    const fiberType = aiAnalysis.detectedSpecs.fiberType
    searchConditions.push(`fiber_category.ilike.%${fiberType}%`)
    searchConditions.push(`short_description.ilike.%${fiberType}%`)
  }

  if (aiAnalysis?.detectedSpecs?.fiberCount) {
    const fiberCount = aiAnalysis.detectedSpecs.fiberCount
    searchConditions.push(`fiber_count.eq.${fiberCount}`)
  }

  if (aiAnalysis?.detectedSpecs?.connectorType) {
    const connType = aiAnalysis.detectedSpecs.connectorType
    searchConditions.push(`connector_type.ilike.%${connType}%`)
  }

  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','))
  } else {
    const panelTerms = ['adapter', 'panel', 'patch', 'fiber']
    const panelConditions = panelTerms.map(term =>
      `short_description.ilike.%${term}%`
    ).join(',')
    query = query.or(`${panelConditions},part_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
  }

  const result = await query

  if (result.data && result.data.length > 0) {
    return result.data.map((item: any) => ({
      id: `panel-${item.id}`,
      partNumber: item.part_number || 'No Part Number',
      brand: item.brand || 'Unknown Brand',
      description: item.short_description || 'No description available',
      price: Math.random() * 200 + 75,
      stockLocal: 10,
      stockDistribution: 100,
      leadTime: 'Ships Today',
      category: 'Adapter Panel',
      connectorType: item.connector_type,
      fiberType: item.fiber_category,
      fiberCount: item.fiber_count,
      searchRelevance: 1.0,
      tableName: 'adapter_panels',
      stockStatus: 'not_in_stock',
      stockColor: 'red',
      stockMessage: 'Not currently in stock - contact for availability'
    }))
  }

  return []
}

// FIBER CABLES SEARCH - FIXED TYPESCRIPT ISSUE
const searchFiberCables = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
  console.log('🌈 FIBER CABLES SEARCH')

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .limit(50)

  const cableTerms = [
    'loose tube', 'tight buffer', 'tight buffered',
    'armored', 'outdoor', 'indoor/outdoor', 'plenum',
    'riser', 'burial', 'underground', 'aerial',
    'water block', 'gel filled', 'stranded',
    'breakout', 'distribution', 'backbone'
  ]

  const excludeTerms = [
    'adapter panel', 'panel', 'connector', 'adapter',
    'enclosure', 'housing', 'patch', 'pigtail',
    'jumper', 'coupler', 'splice'
  ]

  const queryLower = searchTerm.toLowerCase()
  const strandMatch = queryLower.match(/\b(\d+)\s*strand/i)
  const requestedStrandCount = strandMatch && strandMatch[1] ? parseInt(strandMatch[1], 10) : aiAnalysis?.detectedSpecs?.fiberCount

  if (requestedStrandCount) {
    console.log(`🧶 Strand count detected: ${requestedStrandCount}`)
  }

  // Enhanced fiber type detection - FIXED THE TYPESCRIPT ISSUE
  const specificFiberTypes = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2']

  // First check direct string match
  let detectedSpecificType: string | undefined = specificFiberTypes.find(type => queryLower.includes(type))

  // If not found and AI detected a fiber type, check if it's in our specific list
  if (!detectedSpecificType && aiAnalysis?.detectedSpecs?.fiberType) {
    const aiFiberType = aiAnalysis.detectedSpecs.fiberType.toLowerCase()
    if (specificFiberTypes.includes(aiFiberType)) {
      detectedSpecificType = aiFiberType
    }
  }

  if (detectedSpecificType) {
    const specificType = detectedSpecificType.toUpperCase()
    console.log(`🎯 SPECIFIC FIBER TYPE DETECTED: ${specificType}`)
    query = query.or(`short_description.ilike.%${specificType}%,fiber_type_standard.ilike.%${specificType}%`)
  } else {
    const cableConditions = cableTerms.map(term =>
      `short_description.ilike.%${term}%`
    ).join(',')
    const fiberConditions = specificFiberTypes.map(type =>
      `short_description.ilike.%${type}%`
    ).join(',')
    query = query.or(`${cableConditions},${fiberConditions},short_description.ilike.%fiber%`)
  }

  const result = await query

  if (result.data && result.data.length > 0) {
    const cableProducts = result.data.filter(item => {
      const description = item.short_description?.toLowerCase() || ''

      const hasExcludeTerms = excludeTerms.some(term => description.includes(term.toLowerCase()))
      if (hasExcludeTerms) return false

      const hasCableTerms = cableTerms.some(term => description.includes(term.toLowerCase()))
      const hasFiberCount = /\d+\s*fiber/i.test(description)
      const hasCableWords = description.includes('cable') || description.includes('cord')
      const hasFiberTypes = specificFiberTypes.some(type => description.includes(type))

      const isCable = hasCableTerms || hasFiberCount || hasCableWords || hasFiberTypes

      if (!isCable) return false

      if (detectedSpecificType) {
        const specificTypeUpper = detectedSpecificType.toUpperCase()
        const hasSpecificType = description.includes(detectedSpecificType) || description.includes(specificTypeUpper)
        if (!hasSpecificType) return false
      }

      if (requestedStrandCount) {
        const fiberCountMatch = description.match(/(\d+)\s*fiber/i)
        const actualFiberCount = fiberCountMatch && fiberCountMatch[1] ? parseInt(fiberCountMatch[1], 10) : null

        if (actualFiberCount && actualFiberCount !== requestedStrandCount) {
          return false
        }
      }

      return true
    })

    if (cableProducts.length > 0) {
      return cableProducts.map((item: any) => ({
        id: `fiber-${item.id}`,
        partNumber: item.part_number || 'No Part Number',
        brand: 'Fiber Brand',
        description: item.short_description || 'No description available',
        price: parseFloat(item.unit_price) || (Math.random() * 500 + 200),
        stockLocal: item.stock_quantity || 0,
        stockDistribution: 100,
        leadTime: 'Ships Today',
        category: 'Fiber Optic Cable',
        fiberType: detectedSpecificType ? detectedSpecificType.toUpperCase() : 'Fiber',
        fiberCount: requestedStrandCount,
        searchRelevance: 1.0,
        tableName: 'fiber_cables',
        stockStatus: 'not_in_stock',
        stockColor: 'red',
        stockMessage: 'Not currently in stock - contact for availability'
      }))
    }
  }

  return []
}

// Enhanced AI query processing with better jacket detection
const enhanceQueryWithAI = async (query: string): Promise<AISearchAnalysis | null> => {
  try {
    console.log('🤖 Enhanced AI processing for:', query)

    // Pre-process with electrical industry knowledge
    const detectedJacket = detectJacketType(query)
    const detectedCategory = detectCategoryRating(query)
    const detectedQuantity = detectQuantity(query)
    const detectedShielding = detectShielding(query)
    const detectedColor = detectColor(query)
    const detectedProductLine = detectProductLine(query)

    console.log('🔧 Pre-AI detection:', {
      jacket: detectedJacket,
      category: detectedCategory,
      quantity: detectedQuantity,
      shielding: detectedShielding,
      color: detectedColor,
      productLine: detectedProductLine
    })

    const response = await fetch('/api/ai-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        userContext: {
          businessType: 'electrical_distributor',
          detectedSpecs: {
            jacketRating: detectedJacket,
            categoryRating: detectedCategory,
            requestedQuantity: detectedQuantity,
            shielding: detectedShielding,
            color: detectedColor,
            productLine: detectedProductLine
          }
        }
      }),
    })

    const data = await response.json()

    if (data.success) {
      const analysis = data.analysis

      // Override/enhance AI analysis with our electrical industry knowledge
      analysis.detectedSpecs = analysis.detectedSpecs || {}

      // Force override jacket detection if we detected it
      if (detectedJacket && !analysis.detectedSpecs.jacketRating) {
        analysis.detectedSpecs.jacketRating = detectedJacket
        analysis.confidence = Math.max(analysis.confidence, 0.95)
        console.log(`🧥 OVERRODE AI: Force-detected jacket rating: ${detectedJacket}`)
      }

      // Force override category detection
      if (detectedCategory && !analysis.detectedSpecs.categoryRating) {
        analysis.detectedSpecs.categoryRating = detectedCategory
        analysis.confidence = Math.max(analysis.confidence, 0.95)
        console.log(`📊 OVERRODE AI: Force-detected category: ${detectedCategory}`)
      }

      // Force override quantity detection
      if (detectedQuantity && !analysis.detectedSpecs.requestedQuantity) {
        analysis.detectedSpecs.requestedQuantity = detectedQuantity
        analysis.confidence = Math.max(analysis.confidence, 0.95)
        console.log(`📏 OVERRODE AI: Force-detected quantity: ${detectedQuantity}`)
      }

      // Force override other specs with actual CSV values
      if (detectedShielding && !analysis.detectedSpecs.shielding) {
        analysis.detectedSpecs.shielding = detectedShielding
        console.log(`🛡️ OVERRODE AI: Force-detected shielding: ${detectedShielding}`)
      }

      if (detectedColor && !analysis.detectedSpecs.color) {
        analysis.detectedSpecs.color = detectedColor.toUpperCase() // "BLUE" not "blue"
        console.log(`🎨 OVERRODE AI: Force-detected color: ${detectedColor}`)
      }

      if (detectedProductLine && !analysis.detectedSpecs.productLine) {
        analysis.detectedSpecs.productLine = detectedProductLine // Use actual CSV value
        console.log(`📋 OVERRODE AI: Force-detected product line: ${detectedProductLine}`)
      }

      // Enhance reasoning with electrical industry context
      if (detectedJacket === 'RISER') {
        analysis.reasoning += ` | ELECTRICAL INDUSTRY KNOWLEDGE: "Riser" means CMR = Non-Plenum rated cable.`
      }

      console.log('✅ Enhanced AI analysis:', analysis)
      return analysis
    } else {
      console.warn('⚠️ AI analysis failed, using fallback')
      return data.fallback
    }
  } catch (error) {
    console.error('❌ AI enhancement error:', error)
    return null
  }
}

// Determine Target Table Based on AI Analysis
const determineTargetTable = (aiAnalysis: AISearchAnalysis | null, searchTerm: string): string => {
  const query = searchTerm.toLowerCase()

  // Check for strand patterns first
  const strandMatch = query.match(/\b(\d+)\s*strand/i)
  if (strandMatch) {
    console.log(`🧶 STRAND PATTERN DETECTED: ${strandMatch[1]} strand - routing to fiber_cables`)
    return 'fiber_cables'
  }

  // NEW: Check for brand-only searches first
  const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'berktek', 'prysmian']
  const queryWords = query.trim().split(/\s+/)

  // If it's just a brand name (single word that matches a brand), route to multi-table
  if (queryWords.length === 1 && brandKeywords.includes(queryWords[0])) {
    console.log(`🏢 BRAND-ONLY SEARCH DETECTED: "${queryWords[0]}" - routing to multi_table`)
    return 'multi_table'
  }

  // Use AI analysis if available and confident
  if (aiAnalysis && aiAnalysis.confidence >= 0.7) {
    if (aiAnalysis.productType === 'CONNECTOR' || aiAnalysis.searchStrategy === 'connectors') {
      console.log('🤖 AI routing to fiber_connectors')
      return 'fiber_connectors'
    }

    if (aiAnalysis.productType === 'PANEL' || aiAnalysis.searchStrategy === 'panels') {
      console.log('🤖 AI routing to adapter_panels')
      return 'adapter_panels'
    }

    if (aiAnalysis.productType === 'CABLE' || aiAnalysis.searchStrategy === 'cables') {
      if (aiAnalysis.detectedSpecs?.fiberType ||
          aiAnalysis.detectedSpecs?.fiberCount ||
          query.includes('fiber') ||
          query.includes('om1') || query.includes('om2') || query.includes('om3') ||
          query.includes('om4') || query.includes('om5') || query.includes('os1') || query.includes('os2')) {
        console.log('🤖 AI routing to fiber_cables')
        return 'fiber_cables'
      } else {
        console.log('🤖 AI routing to category_cables')
        return 'category_cables'
      }
    }
  }

  // Enhanced keyword-based detection for fiber connectors
  const connectorTerms = [
    'connector', 'connectors', 'lc connector', 'sc connector', 'st connector',
    'fc connector', 'mtp connector', 'mpo connector', 'e2000 connector',
    'mu connector', 'fiber connector', 'fibre connector', 'optical connector',
    'fiber optic connector', 'fibre optic connector'
  ]

  const hasConnectorTerms = connectorTerms.some(term => query.includes(term))

  // Specific connector type detection
  const connectorTypes = ['lc', 'sc', 'st', 'fc', 'mtp', 'mpo', 'e2000', 'mu']
  const hasSpecificConnectorType = connectorTypes.some(type => {
    // Look for the connector type as a standalone word or followed by common terms
    const regex = new RegExp(`\\b${type}\\b|\\b${type}\\s+(connector|connectors|fiber|fibre)`, 'i')
    return regex.test(query)
  })

  if (hasConnectorTerms || hasSpecificConnectorType) {
    console.log('🔌 Keyword routing to fiber_connectors')
    return 'fiber_connectors'
  }

  // Panel detection
  if (query.includes('adapter panel') || query.includes('patch panel') ||
      query.includes('fiber panel') ||
      (query.includes('panel') && (query.includes('fiber') || query.includes('adapter')))) {
    console.log('🏠 Keyword routing to adapter_panels')
    return 'adapter_panels'
  }

  // Fiber cable detection
  const fiberTerms = [
    'fiber', 'fibre',
    'om1', 'om2', 'om3', 'om4', 'om5',
    'os1', 'os2',
    'singlemode', 'single-mode', 'single mode', 'sm',
    'multimode', 'multi-mode', 'multi mode', 'mm'
  ]
  const hasFiberTerms = fiberTerms.some(term => query.includes(term))

  if (hasFiberTerms && !hasConnectorTerms) {
    console.log('🌈 Keyword routing to fiber_cables')
    return 'fiber_cables'
  }

  // Category cable detection
  if (!hasFiberTerms && (
      query.includes('cat') || query.includes('category') ||
      query.includes('utp') || query.includes('stp') ||
      query.includes('ethernet') || query.includes('network cable'))) {
    console.log('📊 Keyword routing to category_cables')
    return 'category_cables'
  }

  // Jacket type detection suggests category cables
  if (!hasFiberTerms && detectJacketType(query)) {
    console.log('🧥 Jacket type routing to category_cables')
    return 'category_cables'
  }

  // Default to category cables unless we detect fiber-specific terms
  console.log('🔍 Default routing to category_cables')
  return 'category_cables'
}

// Multi-table search with brand priority
const searchMultipleTables = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
  console.log('🚀 MULTI-TABLE SEARCH')
  console.log('🔍 Search term:', searchTerm)

  let allProducts: Product[] = []

  // NEW: Check if this is a brand search to prioritize order
  const brandKeywords = ['corning', 'panduit', 'leviton', 'superior', 'essex', 'berktek', 'prysmian']
  const isBrandSearch = brandKeywords.some(brand => searchTerm.toLowerCase().includes(brand))

  if (isBrandSearch) {
    console.log('🏢 BRAND SEARCH DETECTED - Prioritizing fiber connectors and cables')

    // For brand searches, prioritize fiber connectors first (most likely for brands like Corning)
    const connectorResults = await searchFiberConnectors(aiAnalysis, searchTerm)
    allProducts = [...allProducts, ...connectorResults]
    console.log(`🔌 Brand search - Fiber connectors: ${connectorResults.length} results`)

    // Then category cables
    if (allProducts.length < 15) {
      const categoryResults = await searchCategoryCables(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...categoryResults]
      console.log(`📊 Brand search - Category cables: ${categoryResults.length} results`)
    }

    // Then adapter panels
    if (allProducts.length < 20) {
      const adapterResults = await searchAdapterPanels(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...adapterResults]
      console.log(`🏠 Brand search - Adapter panels: ${adapterResults.length} results`)
    }

    // Finally fiber cables
    if (allProducts.length < 25) {
      const fiberResults = await searchFiberCables(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...fiberResults]
      console.log(`🌈 Brand search - Fiber cables: ${fiberResults.length} results`)
    }

  } else {
    console.log('🔍 GENERAL SEARCH - Using standard priority order')

    // Standard search order for non-brand searches
    const categoryResults = await searchCategoryCables(aiAnalysis, searchTerm)
    allProducts = [...allProducts, ...categoryResults]

    if (allProducts.length < 10) {
      const connectorResults = await searchFiberConnectors(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...connectorResults]
    }

    if (allProducts.length < 15) {
      const adapterResults = await searchAdapterPanels(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...adapterResults]
    }

    if (allProducts.length < 20) {
      const fiberResults = await searchFiberCables(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...fiberResults]
    }
  }

  console.log(`🚀 Multi-table search completed: ${allProducts.length} total results`)
  return allProducts
}

// Generate Smart Filters from Products
const generateSmartFilters = (products: Product[], productType: string): SmartFilters => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  const brands = filterString(products.map(p => p.brand))
  const packagingTypes = filterString(products.map(p => p.packagingType))
  const jacketRatings = filterString(products.map(p => p.jacketRating))
  const categoryRatings = filterString(products.map(p => p.categoryRating))
  const shieldingTypes = filterString(products.map(p => p.shielding))
  const productLines = filterString(products.map(p => p.productLine))
  const pairCounts = filterString(products.map(p => p.pairCount))
  const conductorGauges = filterString(products.map(p => p.conductorAwg?.toString()))
  const applications = filterString(products.map(p => p.application))
  const colors = filterString(products.map(p => p.jacketColor || p.color))

  // Enhanced fiber connector specific filters
  const fiberTypes = filterString(products.map(p => p.fiberType))
  const connectorTypes = filterString(products.map(p => p.connectorType))
  const productTypes = filterString(products.map(p => p.productType))
  const technologies = filterString(products.map(p => p.technology))
  const polishTypes = filterString(products.map(p => p.polish))
  const housingColors = filterString(products.map(p => p.housingColor))
  const bootColors = filterString(products.map(p => p.bootColor))

  return {
    brands: brands.slice(0, 8),
    packagingTypes: packagingTypes.slice(0, 6),
    jacketRatings: jacketRatings.slice(0, 4),
    fiberTypes: fiberTypes.slice(0, 6),
    connectorTypes: connectorTypes.slice(0, 6),
    categoryRatings: categoryRatings.slice(0, 4),
    shieldingTypes: shieldingTypes.slice(0, 4),
    productLines: productLines.slice(0, 6),
    pairCounts: pairCounts.slice(0, 4),
    conductorGauges: conductorGauges.slice(0, 4),
    applications: applications.slice(0, 4),
    colors: colors.slice(0, 6),
    productType,
    // Enhanced fiber connector filters
    productTypes: productTypes.slice(0, 6),
    technologies: technologies.slice(0, 6),
    polishTypes: polishTypes.slice(0, 4),
    housingColors: housingColors.slice(0, 6),
    bootColors: bootColors.slice(0, 6)
  }
}

// ===================================================================
// COMPONENTS - TypeScript Safe
// ===================================================================

interface StockStatusButtonProps {
  product: Product
}

const StockStatusButton: React.FC<StockStatusButtonProps> = ({ product }) => {
  const getButtonStyle = (): string => {
    switch (product.stockColor) {
      case 'green':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600'
      case 'yellow':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
      case 'red':
      default:
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
    }
  }

  const getButtonText = (): string => {
    switch (product.stockStatus) {
      case 'branch_stock':
        return 'In Stock'
      case 'dc_stock':
        return 'Next Day'
      case 'other_stock':
        return 'Available'
      case 'not_in_stock':
      default:
        return 'Special Order'
    }
  }

  return (
    <button
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${getButtonStyle()}`}
      title={product.stockMessage}
    >
      {getButtonText()}
    </button>
  )
}

const StockStatusLegend: React.FC = () => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Stock Status Legend:</h4>
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>In Stock - Same Day (Branch/DC)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Available - Other Locations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span>Special Order</span>
        </div>
      </div>
    </div>
  )
}

interface AISearchLoadingProps {
  searchTerm: string
}

const AISearchLoading: React.FC<AISearchLoadingProps> = ({ searchTerm }) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [dots, setDots] = useState<string>('')

  const searchSteps = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Analyzing Request",
      desc: "Understanding your product needs with advanced AI",
      color: "from-purple-500 to-blue-500"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Searching Your Database",
      desc: "Scanning your private inventory system securely",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Filter className="w-6 h-6" />,
      title: "Applying Smart Filters",
      desc: "Filtering results with electrical expertise",
      color: "from-cyan-500 to-green-500"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Optimizing Results",
      desc: "Ranking products by relevance and availability",
      color: "from-green-500 to-yellow-500"
    }
  ]

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % searchSteps.length)
    }, 1500)

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => {
      clearInterval(stepInterval)
      clearInterval(dotsInterval)
    }
  }, [searchSteps.length])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-pulse">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Plectic AI Working</h2>
          <p className="text-sm text-gray-600 mt-1">Searching for: &quot;{searchTerm}&quot;</p>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className={`w-full h-20 bg-gradient-to-r ${searchSteps[currentStep].color} rounded-xl flex items-center justify-center text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
            <div className="relative z-10 flex items-center gap-3">
              {searchSteps[currentStep].icon}
              <div>
                <div className="font-semibold">{searchSteps[currentStep].title}{dots}</div>
                <div className="text-xs opacity-90">{searchSteps[currentStep].desc}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 mb-6">
          {searchSteps.map((step, index) => (
            <div key={index} className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 ${
              index === currentStep ? 'bg-blue-50 border border-blue-200' : 
              index < currentStep ? 'bg-green-50 border border-green-200' : 
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                index === currentStep ? 'bg-blue-600 text-white animate-pulse' : 
                index < currentStep ? 'bg-green-600 text-white' : 
                'bg-gray-300 text-gray-600'
              }`}>
                {index < currentStep ? <CheckCircle className="w-4 h-4" /> :
                 index === currentStep ? <Activity className="w-4 h-4" /> :
                 <div className="w-2 h-2 bg-current rounded-full"></div>}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  index === currentStep ? 'text-blue-700' : 
                  index < currentStep ? 'text-green-700' : 
                  'text-gray-500'
                }`}>
                  {step.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Secure & Private</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Your data stays in your database. We never search the internet or share your information.
          </p>
        </div>
      </div>
    </div>
  )
}

interface QuantityDetectionIndicatorProps {
  aiAnalysis: AISearchAnalysis | null
}

const QuantityDetectionIndicator: React.FC<QuantityDetectionIndicatorProps> = ({ aiAnalysis }) => {
  const detectedQuantity = aiAnalysis?.detectedSpecs?.requestedQuantity

  if (!detectedQuantity) return null

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
        <span className="text-sm font-medium text-green-700">
          Quantity Detected: {detectedQuantity.toLocaleString()} {detectedQuantity >= 100 ? 'ft' : 'units'}
        </span>
      </div>
      <p className="text-xs text-green-600 mt-1">
        Click &quot;Add&quot; buttons to automatically add this quantity to your list
      </p>
    </div>
  )
}

// ===================================================================
// MAIN COMPONENT - TypeScript Safe
// ===================================================================

const PlecticAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [productList, setProductList] = useState<ListItem[]>([])
  const [lastSearchTime, setLastSearchTime] = useState<number>(0)
  const [aiAnalysis, setAiAnalysis] = useState<AISearchAnalysis | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches] = useState<string[]>(getUpdatedPopularSearches())
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('')

  // Smart Filter States
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [smartFilters, setSmartFilters] = useState<SmartFilters | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ===================================================================
  // HELPER FUNCTIONS
  // ===================================================================

  const addToList = (product: Product, customQuantity?: number): void => {
    const quantityToAdd = customQuantity || aiAnalysis?.detectedSpecs?.requestedQuantity || 1

    console.log(`📦 Adding to list:`, {
      product: product.partNumber,
      customQuantity,
      aiDetectedQuantity: aiAnalysis?.detectedSpecs?.requestedQuantity,
      finalQuantity: quantityToAdd
    })

    setProductList(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        )
      }
      return [...prev, { ...product, quantity: quantityToAdd, addedAt: new Date() }]
    })
  }

  const saveRecentSearch = (query: string): void => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 8)
    setRecentSearches(updated)
    localStorage.setItem('plectic_recent_searches', JSON.stringify(updated))
  }

  const applySmartFilter = (filterType: string, value: string): void => {
    const newFilters = { ...activeFilters }

    if (newFilters[filterType] === value) {
      delete newFilters[filterType]
    } else {
      newFilters[filterType] = value
    }

    setActiveFilters(newFilters)

    let filtered = currentProducts

    Object.entries(newFilters).forEach(([type, filterValue]) => {
      filtered = filtered.filter(product => {
        switch (type) {
          case 'brand': return product.brand === filterValue
          case 'packagingType': return product.packagingType === filterValue
          case 'jacketRating': return product.jacketRating === filterValue
          case 'categoryRating': return product.categoryRating === filterValue
          case 'shielding': return product.shielding === filterValue
          case 'productLine': return product.productLine === filterValue
          case 'pairCount': return product.pairCount === filterValue
          case 'conductorGauge': return product.conductorAwg?.toString() === filterValue
          case 'application': return product.application === filterValue
          // Enhanced fiber connector filters
          case 'fiberType': return product.fiberType?.includes(filterValue)
          case 'connectorType': return product.connectorType === filterValue
          case 'productType': return product.productType === filterValue
          case 'technology': return product.technology === filterValue
          case 'polish': return product.polish === filterValue
          case 'housingColor': return product.housingColor === filterValue
          case 'bootColor': return product.bootColor === filterValue
          case 'color':
            const jacketColor = product.jacketColor || ''
            const desc = product.description?.toLowerCase() || ''
            return desc.includes(filterValue.toLowerCase()) || jacketColor.toLowerCase().includes(filterValue.toLowerCase())
          default: return true
        }
      })
    })

    setFilteredProducts(filtered)
    console.log(`🔍 Applied filter ${filterType}=${value}, ${filtered.length} products remaining`)
  }

  const clearAllFilters = (): void => {
    setActiveFilters({})
    setFilteredProducts(currentProducts)
  }

  const clearFilterType = (filterType: string): void => {
    const newFilters = { ...activeFilters }
    delete newFilters[filterType]
    setActiveFilters(newFilters)

    let filtered = currentProducts
    Object.entries(newFilters).forEach(([type, filterValue]) => {
      filtered = filtered.filter(product => {
        switch (type) {
          case 'brand': return product.brand === filterValue
          case 'packagingType': return product.packagingType === filterValue
          case 'jacketRating': return product.jacketRating === filterValue
          case 'categoryRating': return product.categoryRating === filterValue
          case 'shielding': return product.shielding === filterValue
          case 'productLine': return product.productLine === filterValue
          case 'pairCount': return product.pairCount === filterValue
          case 'conductorGauge': return product.conductorAwg?.toString() === filterValue
          case 'application': return product.application === filterValue
          // Enhanced fiber connector filters
          case 'fiberType': return product.fiberType?.includes(filterValue)
          case 'connectorType': return product.connectorType === filterValue
          case 'productType': return product.productType === filterValue
          case 'technology': return product.technology === filterValue
          case 'polish': return product.polish === filterValue
          case 'housingColor': return product.housingColor === filterValue
          case 'bootColor': return product.bootColor === filterValue
          case 'color':
            const jacketColor = product.jacketColor || ''
            const desc = product.description?.toLowerCase() || ''
            return desc.includes(filterValue.toLowerCase()) || jacketColor.toLowerCase().includes(filterValue.toLowerCase())
          default: return true
        }
      })
    })

    setFilteredProducts(filtered)
    console.log(`🔍 Cleared filter type ${filterType}, ${filtered.length} products remaining`)
  }

  const getColorButtonStyle = (color: string, isActive: boolean): string => {
    const colorStyles: Record<string, string> = {
      'blue': isActive ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600',
      'red': isActive ? 'bg-red-600 text-white' : 'bg-red-500 text-white hover:bg-red-600',
      'green': isActive ? 'bg-green-600 text-white' : 'bg-green-500 text-white hover:bg-green-600',
      'yellow': isActive ? 'bg-yellow-600 text-black' : 'bg-yellow-400 text-black hover:bg-yellow-500',
      'orange': isActive ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600',
      'white': isActive ? 'bg-gray-200 text-black border-2 border-gray-400' : 'bg-white text-black border border-gray-300 hover:bg-gray-100',
      'black': isActive ? 'bg-black text-white' : 'bg-gray-800 text-white hover:bg-black',
      'gray': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
      'grey': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
      'purple': isActive ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white hover:bg-purple-600',
      'pink': isActive ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white hover:bg-pink-600',
      'violet': isActive ? 'bg-violet-600 text-white' : 'bg-violet-500 text-white hover:bg-violet-600',
      'brown': isActive ? 'bg-amber-700 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'
    }

    return colorStyles[color.toLowerCase()] || (isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600')
  }

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const updateQuantity = (id: string, delta: number): void => {
    setProductList(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta)
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
        }
        return item
      }).filter((item): item is ListItem => item !== null)
    })
  }

  const removeFromList = (id: string): void => {
    setProductList(prev => prev.filter(item => item.id !== id))
  }

  const sendList = (): void => {
    alert('List sent! (This would email/text the list in production)')
  }

  // ===================================================================
  // SEARCH FUNCTIONS
  // ===================================================================

  const searchProducts = async (searchTerm: string): Promise<SearchResult> => {
    const startTime = performance.now()

    try {
      console.log('🎯 ENHANCED SEARCH for:', searchTerm)

      // Step 1: Validate query first
      const validation = validateElectricalQuery(searchTerm)
      if (!validation.isValid) {
        throw new Error(validation.message || 'Invalid query')
      }

      // Step 2: Apply business rules (Cat5 → Cat5e)
      const processedQuery = applyBusinessRules(searchTerm)
      console.log('🔄 Query after business rules:', processedQuery.processedTerm)

      // Step 3: Check for part numbers FIRST, but handle strand patterns specially
      const partNumberDetection = detectPartNumbers(processedQuery.processedTerm)

      // Handle strand patterns as fiber cable searches (not part number searches)
      if (partNumberDetection.hasStrandPattern && !partNumberDetection.hasParts) {
        console.log(`🧶 STRAND PATTERN DETECTED: ${partNumberDetection.strandCount} strand - routing to fiber cable search`)

        // Create AI analysis for strand search
        const strandAI: AISearchAnalysis = {
          searchStrategy: 'cables',
          productType: 'CABLE',
          confidence: 0.95,
          detectedSpecs: {
            fiberCount: partNumberDetection.strandCount,
            requestedQuantity: partNumberDetection.quantity,
            productType: 'FIBER_CABLE',
            fiberType: 'FIBER'
          },
          searchTerms: [`${partNumberDetection.strandCount} strand fiber cable`],
          reasoning: `Customer requested ${partNumberDetection.strandCount} strand fiber optic cable${partNumberDetection.quantity ? ` with quantity ${partNumberDetection.quantity}` : ''}`,
          suggestedFilters: ['fiber optic', 'strand count'],
          alternativeQueries: [`${partNumberDetection.strandCount} fiber cable`, `fiber optic ${partNumberDetection.strandCount} strand`],
          originalQuery: processedQuery.processedTerm,
          timestamp: new Date().toISOString(),
          aiModel: 'strand-pattern-detection'
        }

        setAiAnalysis(strandAI)

        // For now, return empty results since we're focusing on category cables
        return {
          products: [],
          searchTime: 100,
          searchType: 'strand_pattern_not_supported',
          aiAnalysis: strandAI,
          redirectMessage: "Strand patterns detected - currently optimized for category cables only"
        }
      }

      // Regular part number detection
      if (partNumberDetection.hasParts) {
        console.log('🔢 PART NUMBER DETECTED - Using part number search')
        const partResults = await searchByPartNumber(partNumberDetection.partNumbers, partNumberDetection.quantity)

        if (partResults.length > 0) {
          saveRecentSearch(processedQuery.processedTerm)

          const partNumberAI: AISearchAnalysis = {
            searchStrategy: 'part_number',
            productType: 'PART_NUMBER',
            confidence: 1.0,
            detectedSpecs: {
              requestedQuantity: partNumberDetection.quantity
            },
            searchTerms: partNumberDetection.partNumbers,
            reasoning: `Found exact part number match${partNumberDetection.quantity ? ` with quantity ${partNumberDetection.quantity}` : ''}`,
            suggestedFilters: [],
            alternativeQueries: [],
            originalQuery: processedQuery.processedTerm,
            timestamp: new Date().toISOString(),
            aiModel: 'part-number-detection'
          }

          setAiAnalysis(partNumberAI)

          const endTime = performance.now()
          const searchTime = Math.round(endTime - startTime)

          return {
            products: partResults,
            searchTime,
            searchType: 'part_number_match',
            aiAnalysis: partNumberAI,
            redirectMessage: processedQuery.redirectMessage || undefined
          }
        }
      }

      // Step 4: Regular search flow
      saveRecentSearch(processedQuery.processedTerm)

      // Step 5: Get AI Analysis (using processed term)
      const aiAnalysisResult = await enhanceQueryWithAI(processedQuery.processedTerm)
      setAiAnalysis(aiAnalysisResult)

      // Step 6: Determine Target Table
      const targetTable = determineTargetTable(aiAnalysisResult, processedQuery.processedTerm)
      console.log(`🎯 Target table: ${targetTable}`)

      let products: Product[] = []
      let searchStrategy = 'enhanced'

      // Step 7: Execute Table-Specific Search
      switch (targetTable) {
        case 'fiber_cables':
          products = await searchFiberCables(aiAnalysisResult, processedQuery.processedTerm)
          searchStrategy = 'fiber_cables_enhanced'
          break

        case 'category_cables':
          products = await searchCategoryCables(aiAnalysisResult, processedQuery.processedTerm)
          searchStrategy = 'category_cables_enhanced'
          break

        case 'fiber_connectors':
          products = await searchFiberConnectors(aiAnalysisResult, processedQuery.processedTerm)
          searchStrategy = 'fiber_connectors_enhanced'
          break

        case 'adapter_panels':
          products = await searchAdapterPanels(aiAnalysisResult, processedQuery.processedTerm)
          searchStrategy = 'adapter_panels_enhanced'
          break

        case 'multi_table':
          products = await searchMultipleTables(aiAnalysisResult, processedQuery.processedTerm)
          searchStrategy = 'multi_table_brand_search'
          break

        default:
          products = await searchMultipleTables(aiAnalysisResult, processedQuery.processedTerm)
          searchStrategy = 'multi_table_enhanced'
      }

      // Step 8: Generate Smart Filters
      if (products.length > 0) {
        const filters = generateSmartFilters(products, aiAnalysisResult?.detectedSpecs?.productType || 'MIXED')
        setSmartFilters(filters)
        setCurrentProducts(products)
        setFilteredProducts(products)
        setActiveFilters({})
      }

      const endTime = performance.now()
      const searchTime = Math.round(endTime - startTime)

      console.log(`✅ Enhanced search completed: ${products.length} products in ${searchTime}ms`)

      return {
        products: products.slice(0, 50),
        searchTime,
        searchType: searchStrategy,
        aiAnalysis: aiAnalysisResult || undefined,
        redirectMessage: processedQuery.redirectMessage || undefined
      }

    } catch (error: unknown) {
      console.error('❌ Enhanced search error:', error)
      const endTime = performance.now()

      // If it's a validation error, return it properly
      if (error instanceof Error && error.message.includes('specialized in electrical')) {
        return {
          products: [],
          searchTime: Math.round(endTime - startTime),
          searchType: 'validation_error',
          redirectMessage: error.message
        }
      }

      return {
        products: [],
        searchTime: Math.round(endTime - startTime),
        searchType: 'error',
        redirectMessage: 'An unexpected error occurred during search'
      }
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const originalInput = input
    setCurrentSearchTerm(originalInput)
    setInput('')
    setIsLoading(true)

    try {
      const { products, searchTime, searchType, aiAnalysis: searchAiAnalysis, redirectMessage } = await searchProducts(originalInput)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      // Check if it was a validation error
      if (searchType === 'validation_error') {
        assistantContent = `❌ ${redirectMessage}`
      } else if (searchType === 'part_number_match') {
        assistantContent = `🔢 **Part Number Match Found!** Found ${products.length} product${products.length > 1 ? 's' : ''} in ${searchTime}ms`

        if (searchAiAnalysis?.detectedSpecs?.requestedQuantity) {
          assistantContent += `\n\n📏 **Quantity Detected:** ${searchAiAnalysis.detectedSpecs.requestedQuantity.toLocaleString()} units`
        }

        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        assistantContent += `\n\n✅ **Part number search successful** - Click "Add" to add items to your list`
      } else if (products.length > 0) {
        assistantContent = `🤖 Found ${products.length} products in ${searchTime}ms using enhanced electrical industry search`

        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        if (searchAiAnalysis) {
          assistantContent += `\n\n🧠 **AI + Industry Knowledge:**`
          if (searchAiAnalysis.detectedSpecs?.jacketRating) {
            assistantContent += `\n🧥 Jacket: ${searchAiAnalysis.detectedSpecs.jacketRating} ${searchAiAnalysis.detectedSpecs.jacketRating === 'RISER' ? '(CMR/Non-Plenum)' : ''}`
          }
          if (searchAiAnalysis.detectedSpecs?.categoryRating) {
            assistantContent += `\n📊 Category: ${searchAiAnalysis.detectedSpecs.categoryRating}`
          }
          if (searchAiAnalysis.detectedSpecs?.requestedQuantity) {
            assistantContent += `\n📏 Quantity: ${searchAiAnalysis.detectedSpecs.requestedQuantity.toLocaleString()} ft`
          }
          if (searchAiAnalysis.detectedSpecs?.shielding) {
            assistantContent += `\n🛡️ Shielding: ${searchAiAnalysis.detectedSpecs.shielding}`
          }
          if (searchAiAnalysis.detectedSpecs?.color) {
            assistantContent += `\n🎨 Color: ${searchAiAnalysis.detectedSpecs.color}`
          }
          if (searchAiAnalysis.detectedSpecs?.productLine) {
            assistantContent += `\n📋 Product Line: ${searchAiAnalysis.detectedSpecs.productLine}`
          }
        }
      } else {
        assistantContent = `🔍 No products found for "${originalInput}" in ${searchTime}ms`

        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        assistantContent += `\n\n**Try these variations:**
• "LANMARK 6 blue CMR" or "LANMARK 6 blue non-plenum"
• "Category 6 blue" or "Category 6 plenum"
• Include part numbers: "10136339"
• Try product lines: "Hyper Plus 5e"
• Add specific terms: "Non-Plenum Rated CMR"`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: searchType !== 'validation_error' && products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime,
        aiAnalysis: searchAiAnalysis,
        smartFilters: products.length > 0 && smartFilters ? smartFilters : undefined
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, there was an error with the enhanced search. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setCurrentSearchTerm('')
    }
  }

  const performSearch = async (searchTerm: string): Promise<void> => {
    if (!searchTerm.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: searchTerm,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentSearchTerm(searchTerm)
    setInput('')
    setIsLoading(true)

    try {
      const { products, searchTime, searchType, aiAnalysis: searchAiAnalysis, redirectMessage } = await searchProducts(searchTerm)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      if (searchType === 'validation_error') {
        assistantContent = `❌ ${redirectMessage}`
      } else if (products.length > 0) {
        assistantContent = `🤖 AI found ${products.length} products in ${searchTime}ms:`

        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        if (searchAiAnalysis) {
          assistantContent += `\n\n🧠 **AI Reasoning:** ${searchAiAnalysis.reasoning}`
        }
      } else {
        assistantContent = `🤖 AI analyzed your request but found no products in ${searchTime}ms. Try different terms or exact part numbers.`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: searchType !== 'validation_error' && products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime,
        aiAnalysis: searchAiAnalysis,
        smartFilters: products.length > 0 && smartFilters ? smartFilters : undefined
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, there was an error with the AI search. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setCurrentSearchTerm('')
    }
  }

  // ===================================================================
  // EFFECTS
  // ===================================================================

  useEffect(() => {
    const stored = localStorage.getItem('plectic_recent_searches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing recent searches:', error)
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================

  const totalItems = productList.reduce((sum, item) => sum + item.quantity, 0)
  const hasListItems = productList.length > 0
  const productsToDisplay = Object.keys(activeFilters).length > 0 ? filteredProducts : currentProducts

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value)
  }

  const clearConversation = (): void => {
    setMessages([])
    setAiAnalysis(null)
    setSmartFilters(null)
    setActiveFilters({})
    setCurrentProducts([])
    setFilteredProducts([])
  }

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-inter">
      {/* AI Search Loading Overlay */}
      {isLoading && currentSearchTerm && (
        <AISearchLoading searchTerm={currentSearchTerm} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Plectic AI</h1>
              <p className="text-xs text-gray-600">
                🤖 Enhanced with 35 Years Electrical Industry Knowledge - Riser = CMR = Non-Plenum
                {lastSearchTime > 0 && (
                  <span className="ml-2 text-green-600">
                    Last search: {lastSearchTime}ms
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiAnalysis && Object.keys(aiAnalysis.detectedSpecs || {}).length > 0 && (
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Brain size={14} />
                AI Active
              </div>
            )}
            {hasListItems && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {totalItems} items in list
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${hasListItems ? 'w-3/5' : 'w-full'}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain size={28} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    🤖 Enhanced AI with Complete Electrical Industry Knowledge
                  </h2>
                  <p className="text-gray-600 mb-4">
                    I understand all electrical terminology: <strong>Riser = CMR = Non-Plenum</strong> and search ALL your CSV columns
                  </p>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="max-w-2xl mx-auto mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Your recent searches:</h3>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {recentSearches.slice(0, 4).map((search, index) => (
                          <button
                            key={index}
                            onClick={() => performSearch(search)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
                          >
                            🔄 {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Try these searches to test enhanced functionality:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {popularSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => performSearch(search)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-left transition-colors"
                        >
                          🤖 {search}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Large Search Area */}
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-lg font-medium text-gray-700 mb-3 text-left">
                      🤖 Enhanced Search - Uses ALL CSV Columns + Industry Knowledge
                    </h3>
                    <div className="relative">
                      <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Try: 'LANMARK 6 blue CMR' or 'Category 6 blue' or 'Hyper Plus 5e'..."
                        className="w-full px-6 py-4 border-2 border-blue-500 rounded-lg resize-none focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-600 text-base"
                        rows={6}
                        autoFocus
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                          input.trim()
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Brain size={16} />
                        Enhanced AI Search
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'user' ? (
                      <div className="flex justify-end mb-3">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-md">
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <Brain size={14} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Enhanced Plectic AI</span>
                          {message.searchTime && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              {message.searchTime}ms • {message.searchType}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-700 mb-3 whitespace-pre-line">{message.content}</div>

                        {/* Smart Filter Buttons */}
                        {smartFilters && message.products && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 sticky top-4 z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Filter size={16} className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Smart Filters</span>
                                <span className="text-xs text-blue-600">
                                  ({productsToDisplay.length} of {message.products.length} products)
                                </span>
                              </div>
                              {Object.keys(activeFilters).length > 0 && (
                                <button
                                  onClick={clearAllFilters}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                  Clear All
                                </button>
                              )}
                            </div>

                            {/* Product Line Filters */}
                            {smartFilters.productLines.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Product Lines:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.productLines.map(productLine => (
                                    <button
                                      key={productLine}
                                      onClick={() => applySmartFilter('productLine', productLine)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.productLine === productLine
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                                      }`}
                                    >
                                      📋 {productLine}
                                    </button>
                                  ))}
                                  {activeFilters.productLine && (
                                    <button
                                      onClick={() => clearFilterType('productLine')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Product Lines
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Category Rating Filters */}
                            {smartFilters.categoryRatings.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Categories:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.categoryRatings.map(rating => (
                                    <button
                                      key={rating}
                                      onClick={() => applySmartFilter('categoryRating', rating)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.categoryRating === rating
                                          ? 'bg-green-600 text-white'
                                          : 'bg-white border border-green-300 text-green-700 hover:bg-green-100'
                                      }`}
                                    >
                                      📊 {rating}
                                    </button>
                                  ))}
                                  {activeFilters.categoryRating && (
                                    <button
                                      onClick={() => clearFilterType('categoryRating')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Categories
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Jacket Rating Filters */}
                            {smartFilters.jacketRatings.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Jacket Rating:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.jacketRatings.map(rating => (
                                    <button
                                      key={rating}
                                      onClick={() => applySmartFilter('jacketRating', rating)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.jacketRating === rating
                                          ? 'bg-orange-600 text-white'
                                          : 'bg-white border border-orange-300 text-orange-700 hover:bg-orange-100'
                                      }`}
                                    >
                                      🧥 {rating}
                                    </button>
                                  ))}
                                  {activeFilters.jacketRating && (
                                    <button
                                      onClick={() => clearFilterType('jacketRating')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Jacket Ratings
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Connector Type Filters - For Fiber Connectors */}
                            {smartFilters.connectorTypes.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Connector Types:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.connectorTypes.map(connType => (
                                    <button
                                      key={connType}
                                      onClick={() => applySmartFilter('connectorType', connType)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.connectorType === connType
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                                      }`}
                                    >
                                      🔌 {connType}
                                    </button>
                                  ))}
                                  {activeFilters.connectorType && (
                                    <button
                                      onClick={() => clearFilterType('connectorType')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Connector Types
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Fiber Type Filters - For Fiber Connectors */}
                            {smartFilters.fiberTypes.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Fiber Types:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.fiberTypes.map(fiberType => (
                                    <button
                                      key={fiberType}
                                      onClick={() => applySmartFilter('fiberType', fiberType)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.fiberType === fiberType
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
                                      }`}
                                    >
                                      🌈 {fiberType}
                                    </button>
                                  ))}
                                  {activeFilters.fiberType && (
                                    <button
                                      onClick={() => clearFilterType('fiberType')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Fiber Types
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Product Type Filters - For Fiber Connectors */}
                            {smartFilters.productTypes.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Product Types:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.productTypes.map(prodType => (
                                    <button
                                      key={prodType}
                                      onClick={() => applySmartFilter('productType', prodType)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.productType === prodType
                                          ? 'bg-teal-600 text-white'
                                          : 'bg-white border border-teal-300 text-teal-700 hover:bg-teal-100'
                                      }`}
                                    >
                                      📦 {prodType}
                                    </button>
                                  ))}
                                  {activeFilters.productType && (
                                    <button
                                      onClick={() => clearFilterType('productType')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Product Types
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Technology Filters - For Fiber Connectors */}
                            {smartFilters.technologies.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Technologies:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.technologies.map(tech => (
                                    <button
                                      key={tech}
                                      onClick={() => applySmartFilter('technology', tech)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.technology === tech
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                                      }`}
                                    >
                                      ⚡ {tech}
                                    </button>
                                  ))}
                                  {activeFilters.technology && (
                                    <button
                                      onClick={() => clearFilterType('technology')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Technologies
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Color Filters */}
                            {smartFilters.colors.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Colors:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.colors.map(color => (
                                    <button
                                      key={color}
                                      onClick={() => applySmartFilter('color', color)}
                                      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                                        getColorButtonStyle(color, activeFilters.color === color)
                                      }`}
                                    >
                                      {color}
                                    </button>
                                  ))}
                                  {activeFilters.color && (
                                    <button
                                      onClick={() => clearFilterType('color')}
                                      className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                    >
                                      All Colors
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Show AI Analysis Details */}
                        {aiAnalysis && Object.keys(aiAnalysis.detectedSpecs || {}).length > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={16} className="text-purple-600" />
                              <span className="text-sm font-medium text-purple-700">Smart Search Detection</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(aiAnalysis.detectedSpecs).map(([key, value]) => (
                                value && (
                                  <span
                                    key={key}
                                    className={`px-2 py-1 rounded text-xs ${
                                      key === 'requestedQuantity' 
                                        ? 'bg-green-100 text-green-700 font-semibold' 
                                        : key === 'shielding'
                                        ? 'bg-orange-100 text-orange-700 font-semibold'
                                        : key === 'jacketRating'
                                        ? 'bg-red-100 text-red-700 font-semibold'
                                        : key === 'productLine'
                                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                                        : 'bg-purple-100 text-purple-700'
                                    }`}
                                  >
                                    {key === 'requestedQuantity' ? `📏 ${value?.toLocaleString()} ft` :
                                     key === 'shielding' ? `🛡️ ${value} ${value === 'STP' ? '(Shielded)' : value === 'UTP' ? '(Unshielded)' : ''}` :
                                     key === 'jacketRating' ? `🧥 ${value} ${value === 'RISER' ? '(CMR/Non-Plenum)' : value === 'PLENUM' ? '(CMP)' : ''}` :
                                     key === 'productLine' ? `📋 ${value}` :
                                     key === 'productType' ? `type: ${value}` :
                                     key === 'color' ? `🎨 ${value}` :
                                     `${key}: ${value}`}
                                  </span>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity Detection Indicator */}
                        {aiAnalysis && (
                          <QuantityDetectionIndicator aiAnalysis={aiAnalysis} />
                        )}

                        {/* Product Table with Max Height and Scroll */}
                        {message.products && (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                              <p className="text-sm font-semibold text-gray-700">
                                🤖 Enhanced AI Results - All CSV Columns Searched:
                              </p>
                            </div>

                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                              <table className="w-full min-w-max">
                                <thead className="bg-gray-100 border-b border-gray-200">
 c                                 <tr className="text-xs text-gray-700">
                                    <th className="px-2 py-2 text-center font-medium w-16">Add</th>
                                    <th className="px-2 py-2 text-left font-medium w-24">Part #</th>
                                    <th className="px-2 py-2 text-left font-medium w-20">Brand</th>
                                    <th className="px-2 py-2 text-left font-medium w-28">Product Line</th>
                                    <th className="px-3 py-2 text-left font-medium min-w-96">Description</th>
                                    {/* Show different columns based on product type */}
                                    {productsToDisplay.some(p => p.tableName === 'fiber_connectors') ? (
                                      <>
                                        <th className="px-2 py-2 text-center font-medium w-20">Connector Type</th>
                                        <th className="px-2 py-2 text-center font-medium w-20">Fiber Type</th>
                                        <th className="px-2 py-2 text-center font-medium w-20">Product Type</th>
                                        <th className="px-2 py-2 text-center font-medium w-20">Technology</th>
                                      </>
                                    ) : (
                                      <>
                                        <th className="px-2 py-2 text-center font-medium w-20">Category</th>
                                        <th className="px-2 py-2 text-center font-medium w-20">Jacket</th>
                                        <th className="px-2 py-2 text-center font-medium w-20">Shielding</th>
                                        <th className="px-2 py-2 text-center font-medium w-16">Color</th>
                                      </>
                                    )}
                                    <th className="px-2 py-2 text-right font-medium w-20">Price</th>
                                    <th className="px-2 py-2 text-center font-medium w-24">Stock</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(productsToDisplay && productsToDisplay.length > 0 ? productsToDisplay : message.products || []).map((product, index) => (
                                    <tr
                                      key={product.id}
                                      className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                      }`}
                                    >
                                      <td className="px-2 py-2 text-center">
                                        <button
                                          onClick={() => addToList(product)}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                          title={aiAnalysis?.detectedSpecs?.requestedQuantity ? `Add ${aiAnalysis.detectedSpecs.requestedQuantity.toLocaleString()} ft` : 'Add 1 unit'}
                                        >
                                          Add
                                        </button>
                                      </td>
                                      <td className="px-2 py-2 text-xs font-medium text-gray-900">
                                        {product.partNumber}
                                      </td>
                                      <td className="px-2 py-2 text-xs text-gray-700">{product.brand}</td>
                                      <td className="px-2 py-2 text-xs text-indigo-600 font-medium">
                                        {product.productLine || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-700 min-w-96">
                                        <div className="whitespace-normal leading-tight">
                                          {product.description}
                                        </div>
                                      </td>
                                      {/* Show different columns based on product type */}
                                      {product.tableName === 'fiber_connectors' ? (
                                        <>
                                          <td className="px-2 py-2 text-center">
                                            <span className="bg-blue-100 text-blue-700 px-1 py-1 rounded text-xs">
                                              {product.connectorType || '-'}
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <span className="bg-purple-100 text-purple-700 px-1 py-1 rounded text-xs">
                                              {product.fiberType || '-'}
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <span className="bg-teal-100 text-teal-700 px-1 py-1 rounded text-xs">
                                              {product.productType || '-'}
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <span className="bg-indigo-100 text-indigo-700 px-1 py-1 rounded text-xs">
                                              {product.technology || '-'}
                                            </span>
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td className="px-2 py-2 text-center">
                                            <span className="bg-green-100 text-green-700 px-1 py-1 rounded text-xs">
                                              {product.categoryRating}
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <span className={`px-1 py-1 rounded text-xs ${
                                              product.jacketRating?.includes('Plenum') || product.jacketRating?.includes('CMP')
                                                ? 'bg-red-100 text-red-700' 
                                                : product.jacketRating?.includes('Non-Plenum') || product.jacketRating?.includes('CMR')
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                              {product.jacketRating?.includes('Plenum') ? 'Plenum' :
                                               product.jacketRating?.includes('Non-Plenum') ? 'Riser' :
                                               product.jacketRating || '-'}
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            {product.shielding && (
                                              <span className={`px-1 py-1 rounded text-xs ${
                                                product.shielding === 'STP' 
                                                  ? 'bg-orange-100 text-orange-700' 
                                                  : 'bg-gray-100 text-gray-700'
                                              }`}>
                                                {product.shielding === 'STP' ? '🛡️ STP' : '🔓 UTP'}
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-2 py-2 text-center text-xs">
                                            {product.jacketColor || product.color || '-'}
                                          </td>
                                        </>
                                      )}
                                      <td className="px-2 py-2 text-xs font-medium text-right">
                                        ${product.price?.toFixed(2)}
                                      </td>
                                      <td className="px-2 py-2 text-center">
                                        <StockStatusButton product={product} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <StockStatusLegend />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Enhanced Input Area */}
          {messages.length > 0 && (
            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="🤖 Enhanced search: 'LANMARK 6 blue CMR', 'Category 6', part numbers..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={1}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                    input.trim() && !isLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Brain size={16} />
                  Enhanced Search
                </button>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={clearConversation}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors text-base border-2 border-red-700"
                >
                  🗑️ Clear Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product List */}
        {hasListItems && (
          <div className="w-2/5 border-l border-gray-200 bg-white flex flex-col">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
                  <p className="text-sm text-gray-600">{productList.length} items • {totalItems} total qty</p>
                </div>
                <button
                  onClick={() => setProductList([])}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                  <tr className="text-xs text-gray-700">
                    <th className="px-3 py-2 text-left">Part Number</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((item, index) => (
                    <tr key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.partNumber}</p>
                          <p className="text-xs text-gray-500">{item.brand}</p>
                          {item.productLine && (
                            <p className="text-xs text-indigo-600 font-medium">
                              📋 {item.productLine}
                            </p>
                          )}
                          {item.shielding && (
                            <p className="text-xs text-orange-600 font-medium">
                              {item.shielding === 'STP' ? '🛡️ Shielded' : '🔓 Unshielded'}
                            </p>
                          )}
                          {item.conductorAwg && (
                            <p className="text-xs text-amber-600 font-medium">
                              ⚡ {item.conductorAwg} AWG
                            </p>
                          )}
                          {item.jacketRating && (
                            <p className="text-xs text-red-600 font-medium">
                              🧥 {item.jacketRating?.includes('Plenum') ? 'Plenum' :
                                  item.jacketRating?.includes('Non-Plenum') ? 'Riser (CMR)' :
                                  item.jacketRating}
                            </p>
                          )}
                          {/* Fiber connector specific info */}
                          {item.connectorType && (
                            <p className="text-xs text-blue-600 font-medium">
                              🔌 {item.connectorType}
                            </p>
                          )}
                          {item.fiberType && (
                            <p className="text-xs text-purple-600 font-medium">
                              🌈 {item.fiberType}
                            </p>
                          )}
                          {item.technology && (
                            <p className="text-xs text-indigo-600 font-medium">
                              ⚡ {item.technology}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-sm">${item.price?.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-sm font-medium">${((item.price || 0) * item.quantity).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeFromList(item.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  ${productList.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2)}
                </span>
              </div>
              <button
                onClick={sendList}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Send List for Quote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlecticAI