// src/search/shared/industryKnowledge.ts
// Your 35 years of electrical industry knowledge - centralized and reusable
// FIXED: Detection order for jacket types - check "non-plenum" BEFORE "plenum"
// UPDATE: Added detectBrand and detectEnvironment functions for consistency

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

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
// COMPREHENSIVE SEARCH TERMS
// ===================================================================

export const COMPREHENSIVE_CATEGORY_TERMS = {
  // Category 5e Variations
  cat5e: [
    'Cat5e', 'cat5e', 'CAT5e', 'CAT5E', 'Cat 5e', 'cat 5e', 'CAT 5e', 'CAT 5E',
    'Category 5e', 'category 5e', 'CATEGORY 5e', 'CATEGORY 5E',
    'Category 5 enhanced', 'category 5 enhanced',
    'Cat5E', 'cat5E', 'enhanced cat5', 'enhanced Cat5', 'enhanced CAT5',
    'enhanced category 5'
  ],

  // Category 6 Variations
  cat6: [
    'Cat6', 'cat6', 'CAT6', 'Cat 6', 'cat 6', 'CAT 6',
    'Category 6', 'category 6', 'CATEGORY 6',
    'Category six', 'category six', 'cat six', 'Cat six', 'CAT six',
    'category six unshielded',
    'gigabit cable', 'gigabit ethernet', '1000BaseT', '1000Base-T', '1000 BaseT'
  ],

  // Category 6a Variations
  cat6a: [
    'Cat6a', 'cat6a', 'CAT6a', 'CAT6A', 'Cat 6a', 'cat 6a', 'CAT 6a', 'CAT 6A',
    'Cat6A', 'cat6A', 'Category 6a', 'category 6a', 'CATEGORY 6a', 'CATEGORY 6A',
    'Category 6 augmented', 'category 6 augmented', 'augmented category 6',
    'augmented cat6', 'augmented Cat6',
    'TIA-568-B.2-10', '10-gig cable', '10 gig cable', '10-gigabit', '10 gigabit',
    '10GBaseT', '10GBase-T', '10G BaseT'
  ]
}

export const COMPREHENSIVE_CABLE_TYPE_TERMS = {
  utp: [
    'UTP', 'utp', 'U.T.P.', 'u.t.p.',
    'unshielded twisted pair', 'unshielded-twisted-pair', 'unshieldedtwistedpair'
  ],
  stp: [
    'STP', 'stp', 'S.T.P.', 's.t.p.',
    'shielded twisted pair', 'shielded-twisted-pair', 'shieldedtwistedpair'
  ]
}

export const COMPREHENSIVE_JACKET_TERMS = {
  // RISER terms - includes non-plenum variations
  riser: [
    'non-plenum', 'non plenum', 'nonplenum', 'non-plenum rated',
    'riser', 'riser rated', 'riser-rated', 'riserrated',
    'CMR', 'cmr', 'C.M.R.', 'c.m.r.', 'PVC', 'pvc'
  ],
  // PLENUM terms - ONLY actual plenum
  plenum: [
    'plenum rated', 'plenum-rated', 'plenumrated',
    'CMP', 'cmp', 'C.M.P.', 'c.m.p.'
    // NOTE: "plenum" by itself is checked AFTER non-plenum terms
  ]
}

// ===================================================================
// ELECTRICAL INDUSTRY KNOWLEDGE
// ===================================================================

// CRITICAL: Enhanced Jacket Rating Equivalencies (from your experience)
export const JACKET_EQUIVALENCIES = {
  // RISER = CMR = NON-PLENUM = PVC (all exactly the same thing!)
  riser: [
    "non-plenum", "non plenum", "nonplenum", "non-plenum rated",
    "riser", "cmr", "cmr rated", "pvc"
  ],
  // PLENUM = CMP
  plenum: ["plenum rated", "cmp", "cmp rated", "plenum-rated"],
  // OUTDOOR variations
  outdoor: ["outdoor", "osp", "outside plant", "burial", "underground", "gel filled", "gel-filled", "water block", "waterblock"]
} as const

// Your database formats (what's actually stored in jacket_material column)
export const DATABASE_JACKET_FORMATS = {
  riser: "Non-Plenum Rated CMR ",
  plenum: "Plenum Rated CMP ",
  cmr: "Non-Plenum Rated CMR ",
  cmp: "Plenum Rated CMP ",
  "non-plenum": "Non-Plenum Rated CMR ",
  pvc: "Non-Plenum Rated CMR ",  // PVC maps to Non-Plenum
  outdoor: "Outdoor/OSP"
} as const

// Enhanced category rating patterns
export const CATEGORY_PATTERNS = {
  cat3: ["cat3", "cat 3", "category 3", "category3"],
  cat5e: ["cat5e", "cat 5e", "category 5e", "category5e"],
  cat6: ["cat6", "cat 6", "category 6", "category6"],
  cat6a: ["cat6a", "cat 6a", "category 6a", "category6a"]
} as const

// Pair count variations
export const PAIR_COUNT_PATTERNS = {
  "4": ["4 pair", "4-pair", "4pair", "4pr", "4 pr"],
  "25": ["25 pair", "25-pair", "25pair", "25pr", "25 pr"]
} as const

// Shielding variations
export const SHIELDING_PATTERNS = {
  stp: ["stp", "shielded", "shielded twisted pair", "foil", "screened"],
  utp: ["utp", "unshielded", "unshielded twisted pair"]
} as const

// Application patterns
export const APPLICATION_PATTERNS = {
  indoor: ["indoor", "internal", "inside"],
  outdoor: ["outdoor", "osp", "outside plant", "external", "burial", "underground", "gel filled"],
  "indoor/outdoor": ["indoor/outdoor", "indoor-outdoor", "IO"]
} as const

// Available in your actual database (from analysis)
export const DATABASE_COLORS = ["Black", "Blue", "Brown", "Gray", "Green", "Orange", "Pink", "Red", "Violet", "White", "Yellow"]
export const DATABASE_BRANDS = ["Leviton/BerkTek","Panduit","Prysmian","Superior Essex","GenSPEED 10 MTP Category 6A Cable","GenSPEED 5000 Cable","GenSPEED 6 Cable","GenSPEED 6500 Premium Cable","10Gain","Cobra","DataGain","Marathon LAN","Series 77","XP+","Corning","Siecor","DMSI","Legrand"]
export const DATABASE_PRODUCT_LINES = ["Hyper Plus 5e", "LANMARK 6", "LANMARK-1000", "LANMARK-2000", "LanMArk-SST"]
export const DATABASE_AWG_VALUES = [23, 24]
export const DATABASE_PAIR_COUNTS = ["4-Pair"]

// ===================================================================
// DETECTION FUNCTIONS - YOUR INDUSTRY EXPERTISE
// ===================================================================

// FIXED: Enhanced jacket type detection with correct order
export const detectJacketType = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase().trim()

  console.log(`🧥 Detecting jacket type from: "${query}"`)

  // CRITICAL: Check for NON-PLENUM variations FIRST
  if (query.includes('non-plenum') || query.includes('non plenum') || query.includes('nonplenum')) {
    console.log(`🧥 DETECTED RISER from non-plenum variation`)
    return "RISER"
  }

  // Then check for other RISER terms (CMR, PVC, riser)
  const riserOnlyTerms = ['riser', 'cmr', 'c.m.r.', 'pvc']
  for (const term of riserOnlyTerms) {
    if (query.includes(term)) {
      console.log(`🧥 DETECTED RISER from term: "${term}"`)
      return "RISER"
    }
  }

  // Check for PLENUM terms (including standalone "plenum")
  const plenumTerms = ['plenum rated', 'plenum-rated', 'plenumrated', 'cmp', 'c.m.p.']
  for (const term of plenumTerms) {
    if (query.includes(term)) {
      console.log(`🧥 DETECTED PLENUM from term: "${term}"`)
      return "PLENUM"
    }
  }

  // Finally check for standalone "plenum" (only if NOT part of "non-plenum")
  if (query.includes('plenum')) {
    console.log(`🧥 DETECTED PLENUM from standalone "plenum"`)
    return "PLENUM"
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

// Enhanced category detection with comprehensive terms
export const detectCategoryRating = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase().trim()

  // First check comprehensive terms
  for (const [category, terms] of Object.entries(COMPREHENSIVE_CATEGORY_TERMS)) {
    for (const term of terms) {
      if (query.includes(term.toLowerCase())) {
        console.log(`📊 DETECTED CATEGORY: ${category.toUpperCase()} from comprehensive term: "${term}"`)
        return category.toUpperCase()
      }
    }
  }

  // Fallback to original patterns
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

// Enhanced shielding detection with comprehensive terms
export const detectShielding = (searchTerm: string): string | null => {
  const query = searchTerm.toLowerCase().trim()

  // Check comprehensive terms first
  for (const [type, terms] of Object.entries(COMPREHENSIVE_CABLE_TYPE_TERMS)) {
    for (const term of terms) {
      if (query.includes(term.toLowerCase())) {
        console.log(`🛡️ DETECTED SHIELDING: ${type.toUpperCase()} from comprehensive term: "${term}"`)
        return type.toUpperCase()
      }
    }
  }

  // Fallback to original patterns
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
export const detectQuantity = (searchTerm: string): number | null => {
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
export const detectColor = (searchTerm: string): string | null => {
  const colors = ["black", "blue", "brown", "gray", "grey", "green", "orange", "pink", "red", "violet", "white", "yellow"]
  const query = searchTerm.toLowerCase()

  for (const color of colors) {
    if (query.includes(color)) {
      // Normalize gray/grey to gray
      const normalizedColor = color === 'grey' ? 'gray' : color
      console.log(`🎨 DETECTED COLOR: ${normalizedColor}`)
      return normalizedColor.charAt(0).toUpperCase() + normalizedColor.slice(1)
    }
  }

  return null
}

// NEW: Brand detection function - centralized for reuse
export const detectBrand = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  // Define brand mappings with synonyms
  const brandMappings = [
    { keywords: ['corning', 'siecor'], brand: 'Corning' }, // Siecor is Corning synonym
    { keywords: ['panduit'], brand: 'Panduit' },
    { keywords: ['leviton', 'berktek'], brand: 'Leviton' }, // BerkTek is Leviton brand
    { keywords: ['dmsi'], brand: 'DMSI' },
    { keywords: ['legrand'], brand: 'Legrand' },
    { keywords: ['superior essex', 'superior', 'essex'], brand: 'Superior Essex' },
    { keywords: ['prysmian'], brand: 'Prysmian' },
    { keywords: ['hubbell', 'hubell'], brand: 'Hubbell' } // Added Hubbell for jack modules
  ]

  for (const mapping of brandMappings) {
    for (const keyword of mapping.keywords) {
      if (term.includes(keyword)) {
        console.log(`🏢 Detected brand: ${mapping.brand}`)
        return mapping.brand
      }
    }
  }

  return undefined
}

// NEW: Environment detection function - centralized for reuse
export const detectEnvironment = (searchTerm: string): string | undefined => {
  const term = searchTerm.toLowerCase()

  if (term.includes('outdoor') || term.includes('outside') || term.includes('external')) {
    console.log(`🌧️ Detected environment: Outdoor`)
    return 'Outdoor'
  }

  if (term.includes('indoor') || term.includes('inside') || term.includes('internal')) {
    console.log(`🏢 Detected environment: Indoor`)
    return 'Indoor'
  }

  return undefined
}

// Enhanced product line detection with actual CSV values
export const detectProductLine = (searchTerm: string): string | null => {
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
export const detectPartNumbers = (searchTerm: string): DetectedParts => {
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
    'jumper', 'coupler', 'splice', 'terminal', 'termination',
    'non-plenum', 'nonplenum', 'cmr', 'cmp', 'pvc', 'wall', 'mount', 'rack'
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

// ===================================================================
// BUSINESS RULES - YOUR EXPERTISE
// ===================================================================

// 1. QUERY VALIDATION SYSTEM
export const validateElectricalQuery = (query: string): ValidationResult => {
  // Type guard to ensure query is a string
  if (typeof query !== 'string') {
    console.error('validateElectricalQuery received non-string:', query)
    return {
      isValid: false,
      message: 'Invalid search query format'
    }
  }

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
    'breaker', 'fuse', 'conduit', 'raceway', 'enclosure',

    // Specifications
    'awg', 'volt', 'amp', 'watt', 'ohm', 'impedance',
    'gauge', 'strand', 'solid', 'stranded',

    // Mounting
    'wall', 'mount', 'rack', 'surface'
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
export const applyBusinessRules = (searchTerm: string): BusinessRuleResult => {
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

// Normalize part number for searching (remove spaces, dashes, make lowercase)
export const normalizePartNumber = (partNumber: string): string => {
  return partNumber.toLowerCase().replace(/[\s\-_]/g, '')
}