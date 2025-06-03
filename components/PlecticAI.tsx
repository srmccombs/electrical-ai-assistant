'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter, Brain, Shield, Database, Cpu, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Types
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
  aiAnalysis?: any
  smartFilters?: SmartFilters
}

interface SmartFilters {
  brands: string[]
  packagingTypes: string[]
  jacketRatings: string[]
  fiberTypes: string[]
  connectorTypes: string[]
  categoryRatings: string[]
  colors: string[]
  productType: string
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
  }
  searchTerms: string[]
  reasoning: string
  suggestedFilters: string[]
  alternativeQueries: string[]
  originalQuery: string
  timestamp: string
  aiModel: string
}

// ===================================================================
// PART NUMBER DETECTION AND SEARCH
// ===================================================================

// Detect if search contains part numbers
const detectPartNumbers = (searchTerm: string): {
  hasParts: boolean;
  partNumbers: string[];
  quantity: number | undefined;
  remainingText: string;
} => {
  const query = searchTerm.toLowerCase().trim()

  // Common part number patterns
  const partNumberPatterns = [
    /\b\d{6,}\b/g,           // 6+ digit numbers (7131100)
    /\b[a-z0-9]{6,}-?[a-z0-9]*\b/g,  // Alphanumeric 6+ chars (ABC123, ABC-123)
    /\b[a-z]+\d{4,}\b/g,     // Letters followed by 4+ digits (CAT1234)
    /\b\d{4,}[a-z]+\b/g,     // 4+ digits followed by letters (1234ABC)
    /\b[a-z0-9]+-[a-z0-9-]+\b/g  // Hyphenated patterns (123-456-789)
  ]

  let detectedParts: string[] = []
  let remainingText = query

  // Extract potential part numbers
  partNumberPatterns.forEach(pattern => {
    const matches = query.match(pattern)
    if (matches) {
      matches.forEach(match => {
        // Skip common words that might match patterns
        const skipWords = ['category', 'plenum', 'ethernet', 'network', 'adapter']
        if (!skipWords.includes(match)) {
          detectedParts.push(match)
          remainingText = remainingText.replace(match, '').trim()
        }
      })
    }
  })

  // Extract quantity if present
  const quantityMatch = remainingText.match(/\b(\d{1,6})\s*(ft|feet|foot|pcs|pieces|units?)?\b/)
  const quantity: number | undefined = quantityMatch ? parseInt(quantityMatch[1]) : undefined

  console.log('🔍 Part number detection:', {
    original: searchTerm,
    detectedParts,
    quantity,
    remainingText: remainingText.trim()
  })

  return {
    hasParts: detectedParts.length > 0,
    partNumbers: detectedParts,
    quantity,
    remainingText: remainingText.trim()
  }
}

// Normalize part number for searching (remove spaces, dashes, make lowercase)
const normalizePartNumber = (partNumber: string): string => {
  return partNumber.toLowerCase().replace(/[\s\-_]/g, '')
}

// Search for specific part numbers across all tables
const searchByPartNumber = async (partNumbers: string[], quantity?: number): Promise<Product[]> => {
  console.log('🔢 PART NUMBER SEARCH')
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

        // Search various part number fields and formats
        searchConditions.push(`part_number.ilike.%${original}%`)
        searchConditions.push(`part_number.ilike.%${normalized}%`)

        // Also search with common separators
        if (normalized.length >= 6) {
          const withDash = normalized.slice(0, 3) + '-' + normalized.slice(3)
          const withSpace = normalized.slice(0, 3) + ' ' + normalized.slice(3)
          searchConditions.push(`part_number.ilike.%${withDash}%`)
          searchConditions.push(`part_number.ilike.%${withSpace}%`)
        }
      })

      const query = supabase
        .from(table.name)
        .select('*')
        .eq('is_active', true)
        .or(searchConditions.join(','))
        .limit(20)

      const result = await query

      if (result.data && result.data.length > 0) {
        console.log(`✅ Found ${result.data.length} matches in ${table.name}`)

        // Convert to standard product format
        const products: Product[] = result.data.map((item: any) => ({
          id: `${table.prefix}-${item.id}`,
          partNumber: item.part_number || 'No Part Number',
          brand: item.brand || 'Unknown Brand',
          description: item.short_description || 'No description available',
          price: parseFloat(item.unit_price) || Math.random() * 200 + 50,
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
          // Add type-specific fields
          ...(table.name === 'category_cables' && {
            categoryRating: item.category_rating,
            jacketRating: item.jacket_material,
            color: item.jacket_color
          }),
          ...(table.name === 'fiber_connectors' && {
            connectorType: item.connector_type,
            fiberType: item.fiber_category,
            fiberCount: item.fiber_count
          }),
          ...(table.name === 'adapter_panels' && {
            connectorType: item.connector_type,
            fiberType: item.fiber_category,
            fiberCount: item.fiber_count
          })
        }))

        allResults = [...allResults, ...products]
      }
    } catch (error) {
      console.error(`❌ Error searching ${table.name}:`, error)
    }
  }

  console.log(`🔢 Part number search completed: ${allResults.length} total matches`)

  // If we found results and have a quantity, update the AI analysis
  if (allResults.length > 0 && quantity) {
    console.log(`📏 Detected quantity: ${quantity} for part number search`)
    // This will be used by the Smart Add Button
  }

  return allResults
}

// 1. QUERY VALIDATION SYSTEM
const validateElectricalQuery = (query: string): { isValid: boolean; message?: string; suggestion?: string } => {
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
const applyBusinessRules = (searchTerm: string): {
  originalTerm: string;
  processedTerm: string;
  wasRedirected: boolean;
  redirectMessage: string | null
} => {
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

// 3. UPDATED POPULAR SEARCHES (No Cat5 references + Part Number Examples)
const getUpdatedPopularSearches = (): string[] => [
  "1000 ft Cat5e plenum blue",
  "Cat6 ethernet cable",
  "24 fiber OM3 cable",
  "LC to SC fiber connector",
  "5000 7131100",  // Part number example
  "OM4 multimode fiber",
  "RJ45 connectors",
  "ABC-123"        // Part number example
]

// Stock Status Button Component
const StockStatusButton = ({ product }: { product: Product }) => {
  const getButtonStyle = () => {
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

  const getButtonText = () => {
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

  const getTooltipMessage = () => {
    switch (product.stockStatus) {
      case 'branch_stock':
        return 'Available at your branch - ships today'
      case 'dc_stock':
        return 'Available at distribution center - next morning delivery'
      case 'other_stock':
        return 'Available at other locations - 2-3 day delivery'
      case 'not_in_stock':
      default:
        return 'Not currently in stock - contact for availability'
    }
  }

  return (
    <button
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${getButtonStyle()}`}
      title={getTooltipMessage()}
      onClick={() => {
        console.log('Stock details for:', product.partNumber)
      }}
    >
      {getButtonText()}
    </button>
  )
}

// Stock Status Legend Component
const StockStatusLegend = () => {
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

// ===================================================================
// PROFESSIONAL AI SEARCH LOADING COMPONENT
// ===================================================================
const AISearchLoading = ({ searchTerm }: { searchTerm: string }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [dots, setDots] = useState('')

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
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-pulse">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Plectic AI Working</h2>
          <p className="text-sm text-gray-600 mt-1">Searching for: "{searchTerm}"</p>
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

// Main Component
export default function PlecticAI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [productList, setProductList] = useState<ListItem[]>([])
  const [lastSearchTime, setLastSearchTime] = useState<number>(0)
  const [aiAnalysis, setAiAnalysis] = useState<AISearchAnalysis | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches] = useState<string[]>(getUpdatedPopularSearches())
  const [currentSearchTerm, setCurrentSearchTerm] = useState('')

  // Smart Filter States
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({})
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [smartFilters, setSmartFilters] = useState<SmartFilters | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ENHANCED ADD TO LIST FUNCTION
  const addToList = (product: Product, customQuantity?: number) => {
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

  // Quantity Detection Indicator Component
  const QuantityDetectionIndicator = ({ aiAnalysis }: { aiAnalysis: any }) => {
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
          Click "Add" buttons to automatically add this quantity to your list
        </p>
      </div>
    )
  }

  // Load recent searches on component mount
  useEffect(() => {
    const stored = localStorage.getItem('plectic_recent_searches')
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }
  }, [])

  // Save recent searches
  const saveRecentSearch = (query: string): void => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 8)
    setRecentSearches(updated)
    localStorage.setItem('plectic_recent_searches', JSON.stringify(updated))
  }

  // Generate Smart Filters from Products
  const generateSmartFilters = (products: Product[], productType: string): SmartFilters => {
    const brands = Array.from(new Set(products.map(p => p.brand).filter((item): item is string => Boolean(item))))
    const packagingTypes = Array.from(new Set(products.map(p => p.packagingType).filter((item): item is string => Boolean(item))))
    const jacketRatings = Array.from(new Set(products.map(p => p.jacketRating).filter((item): item is string => Boolean(item))))
    const fiberTypes = Array.from(new Set(products.map(p => p.fiberType).filter((item): item is string => Boolean(item))))
    const connectorTypes = Array.from(new Set(products.map(p => p.connectorType).filter((item): item is string => Boolean(item))))
    const categoryRatings = Array.from(new Set(products.map(p => p.categoryRating).filter((item): item is string => Boolean(item))))
    const colors = Array.from(new Set(products.map(p => {
      const desc = p.description?.toLowerCase() || ''
      const colorWords = ['blue', 'red', 'green', 'yellow', 'orange', 'white', 'black', 'gray', 'grey', 'purple', 'pink', 'violet', 'brown']
      return colorWords.find(color => desc.includes(color))
    }).filter((item): item is string => Boolean(item))))

    return {
      brands: brands.slice(0, 8),
      packagingTypes: packagingTypes.slice(0, 6),
      jacketRatings: jacketRatings.slice(0, 4),
      fiberTypes: fiberTypes.slice(0, 4),
      connectorTypes: connectorTypes.slice(0, 4),
      categoryRatings: categoryRatings.slice(0, 4),
      colors: colors.slice(0, 6),
      productType
    }
  }

  // Apply Smart Filter
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
          case 'fiberType': return product.fiberType === filterValue
          case 'connectorType': return product.connectorType === filterValue
          case 'categoryRating': return product.categoryRating === filterValue
          case 'color': return product.description?.toLowerCase().includes(filterValue.toLowerCase())
          default: return true
        }
      })
    })

    setFilteredProducts(filtered)
    console.log(`🔍 Applied filter ${filterType}=${value}, ${filtered.length} products remaining`)
  }

  // Clear all filters
  const clearAllFilters = (): void => {
    setActiveFilters({})
    setFilteredProducts(currentProducts)
  }

  // Smooth scroll to bottom
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  // AI-Enhanced Query Processing
  const enhanceQueryWithAI = async (query: string): Promise<AISearchAnalysis | null> => {
    try {
      console.log('🤖 Sending query to AI for analysis:', query)

      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userContext: {
            businessType: 'electrical_distributor',
            searchHistory: messages.slice(-3)
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ AI Analysis received:', data.analysis)
        return data.analysis
      } else {
        console.warn('⚠️ AI analysis failed, using fallback:', data.fallback)
        return data.fallback
      }
    } catch (error) {
      console.error('❌ AI enhancement error:', error)
      return null
    }
  }

  // =============================================================================
  // SEARCH FUNCTIONS
  // =============================================================================

  // Determine Target Table Based on AI Analysis
  const determineTargetTable = (aiAnalysis: AISearchAnalysis | null, searchTerm: string): string => {
    const query = searchTerm.toLowerCase()

    // Use AI analysis FIRST if available and confident
    if (aiAnalysis && aiAnalysis.confidence > 0.8) {
      console.log(`🤖 Using AI analysis (confidence: ${aiAnalysis.confidence})`)

      if (aiAnalysis.productType === 'PANEL' || aiAnalysis.searchStrategy === 'panels') {
        console.log('🤖 AI detected: ADAPTER PANELS')
        return 'adapter_panels'
      }

      if (aiAnalysis.productType === 'CONNECTOR' || aiAnalysis.searchStrategy === 'connectors') {
        console.log('🤖 AI detected: FIBER CONNECTORS')
        return 'fiber_connectors'
      }

      if (aiAnalysis.productType === 'CABLE' || aiAnalysis.searchStrategy === 'cables') {
        console.log('🤖 AI detected: CABLES')
        // Determine if fiber or category cable
        if (aiAnalysis.detectedSpecs?.fiberType) {
          console.log('🤖 AI detected: FIBER CABLES')
          return 'fiber_cables'
        } else if (aiAnalysis.detectedSpecs?.categoryRating) {
          console.log('🤖 AI detected: CATEGORY CABLES')
          return 'category_cables'
        }
      }
    }

    // FALLBACK TO KEYWORD DETECTION
    console.log('🔍 Using keyword detection fallback')

    // FIBER OPTIC CABLES - HIGHEST PRIORITY (must come first)
    const fiberTerms = ['fiber', 'fibre', 'om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']
    const hasFiberTerms = fiberTerms.some(term => query.includes(term))

    if (hasFiberTerms && !query.includes('connector') && !query.includes('panel')) {
      console.log('🌈 FIBER TERMS DETECTED - Looking for fiber optic cables')
      console.log('🔍 Detected fiber terms:', fiberTerms.filter(term => query.includes(term)))
      return 'fiber_cables'
    }

    // Adapter panel indicators (check before general connector search)
    if (query.includes('adapter panel') || query.includes('patch panel') ||
        query.includes('fiber panel') ||
        (query.includes('panel') && (hasFiberTerms || query.includes('adapter')))) {
      console.log('🏠 PANEL KEYWORDS DETECTED - Looking for adapter panels')
      return 'adapter_panels'
    }

    // Individual fiber connector indicators
    if (query.includes('connector') && !query.includes('panel') ||
        query.includes(' lc ') || query.includes(' sc ') || query.includes(' st ') ||
        query.includes('unicam') || query.includes('corning')) {
      console.log('🔌 CONNECTOR KEYWORDS DETECTED - Looking for fiber connectors')
      return 'fiber_connectors'
    }

    // Category cable indicators (Cat5, Cat6, plenum, riser) - BUT NOT if fiber is mentioned
    if (!hasFiberTerms && (
        aiAnalysis?.detectedSpecs?.categoryRating ||
        query.includes('cat') || query.includes('category') ||
        query.includes('utp') || query.includes('stp') ||
        query.includes('ethernet') || query.includes('network cable'))) {
      console.log('🌐 CATEGORY CABLE KEYWORDS DETECTED')
      return 'category_cables'
    }

    // Plenum/Riser only go to category cables if no fiber mentioned
    if (!hasFiberTerms && (query.includes('plenum') || query.includes('riser'))) {
      console.log('🧥 JACKET KEYWORDS DETECTED - Looking for category cables')
      return 'category_cables'
    }

    // General panels/housings (products table)
    if (query.includes('housing') || query.includes('enclosure') ||
        query.includes('cch') || query.includes('dmsi')) {
      console.log('🏠 HOUSING KEYWORDS DETECTED - Looking in products table')
      return 'products_panels'
    }

    // Default to multi-table search for complex queries
    console.log('🚀 Using multi-table search fallback')
    return 'multi_table'
  }

  // PRECISE JACKET FILTERING - searchCategoryCables
  const searchCategoryCables = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
    console.log('🌐 CATEGORY CABLES SEARCH (838 products)')
    console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

    // Step 1: Get a broader set of results from database
    let query = supabase
      .from('category_cables')
      .select('*')
      .eq('is_active', true)
      .limit(100)

    // Use broad database search for category
    if (aiAnalysis?.detectedSpecs?.categoryRating) {
      const catRating = aiAnalysis.detectedSpecs.categoryRating
      console.log(`🏷️ AI detected category: ${catRating}`)

      if (catRating === 'CAT6') {
        query = query.or(`category_rating.ilike.%Category 6%,category_rating.ilike.%Cat 6%`)
      } else if (catRating === 'CAT6A') {
        query = query.or(`category_rating.ilike.%Category 6A%,category_rating.ilike.%Cat 6A%`)
      } else if (catRating === 'CAT5E') {
        query = query.or(`category_rating.ilike.%Category 5e%,category_rating.ilike.%Cat 5e%`)
      } else if (catRating === 'CAT5') {
        query = query.or(`category_rating.ilike.%Category 5%,category_rating.ilike.%Cat 5%`)
      }
    } else {
      query = query.ilike('category_rating', '%Category%')
    }

    console.log('🚀 Executing broad database query...')
    const result = await query

    console.log(`📊 Database result: ${result.data?.length || 0} products found`)

    if (!result.data || result.data.length === 0) {
      console.log('❌ No results found in category_cables')
      return []
    }

    // Step 2: Apply precise filtering with jacket classifications
    let filteredResults = result.data

    // Filter for specific category (exact match)
    if (aiAnalysis?.detectedSpecs?.categoryRating) {
      const targetCategory = aiAnalysis.detectedSpecs.categoryRating
      const beforeCount = filteredResults.length

      filteredResults = filteredResults.filter(item => {
        const category = item.category_rating?.toLowerCase() || ''

        if (targetCategory === 'CAT6') {
          return (category.includes('category 6') || category.includes('cat 6')) &&
                 !category.includes('6a')
        } else if (targetCategory === 'CAT6A') {
          return category.includes('6a')
        } else if (targetCategory === 'CAT5E') {
          return category.includes('5e')
        } else if (targetCategory === 'CAT5') {
          return category.includes('category 5') && !category.includes('5e')
        }
        return true
      })

      console.log(`🎯 Category filter (${targetCategory}): ${beforeCount} → ${filteredResults.length} products`)
    }

    // PRECISE jacket filtering based on classifications
    if (aiAnalysis?.detectedSpecs?.jacketRating) {
      const targetJacket = aiAnalysis.detectedSpecs.jacketRating
      const beforeCount = filteredResults.length

      filteredResults = filteredResults.filter(item => {
        const jacket = item.jacket_material?.toLowerCase() || ''
        const description = item.short_description?.toLowerCase() || ''

        console.log(`🔍 Checking jacket: "${jacket}" for target: ${targetJacket}`)

        if (targetJacket === 'CMP' || targetJacket === 'PLENUM') {
          // ONLY plenum/CMP - exclude riser/CMR
          const isPlenum = jacket.includes('plenum') || jacket.includes('cmp') || description.includes('plenum')
          const isRiser = jacket.includes('riser') || jacket.includes('cmr') || description.includes('riser')

          // Must be plenum AND NOT riser
          return isPlenum && !isRiser

        } else if (targetJacket === 'CMR' || targetJacket === 'RISER') {
          // ONLY riser/CMR/non-plenum - exclude plenum
          const isRiser = jacket.includes('riser') || jacket.includes('cmr') || description.includes('riser')
          const isPlenum = jacket.includes('plenum') || jacket.includes('cmp') || description.includes('plenum')

          // Must be riser AND NOT plenum
          return isRiser && !isPlenum

        } else if (targetJacket === 'OUTDOOR' || targetJacket === 'OSP') {
          // Outside plant/outdoor/water resistant/gel filled
          return jacket.includes('outdoor') || jacket.includes('osp') ||
                 jacket.includes('outside') || jacket.includes('plant') ||
                 jacket.includes('water') || jacket.includes('gel') ||
                 description.includes('outdoor') || description.includes('gel')

        } else if (targetJacket === 'INDOOR_OUTDOOR') {
          // Indoor/outdoor rated
          return (jacket.includes('indoor') && jacket.includes('outdoor')) ||
                 description.includes('indoor/outdoor')
        }

        return true
      })

      console.log(`🧥 Jacket filter (${targetJacket}): ${beforeCount} → ${filteredResults.length} products`)
    }

    // Filter for specific color
    if (aiAnalysis?.detectedSpecs?.color) {
      const targetColor = aiAnalysis.detectedSpecs.color.toLowerCase()
      const beforeCount = filteredResults.length

      filteredResults = filteredResults.filter(item => {
        const color = item.jacket_color?.toLowerCase() || ''
        return color.includes(targetColor)
      })

      console.log(`🎨 Color filter (${targetColor}): ${beforeCount} → ${filteredResults.length} products`)
    }

    // Show final results
    if (filteredResults.length > 0) {
      return filteredResults.map((item: any) => ({
        id: `cat-${item.id}`,
        partNumber: item.part_number || 'No Part Number',
        brand: item.brand || 'Unknown Brand',
        description: item.short_description || 'No description available',
        price: Math.random() * 150 + 50,
        stockLocal: 25,
        stockDistribution: 100,
        leadTime: 'Ships Today',
        category: 'Category Cable',
        categoryRating: item.category_rating,
        jacketRating: item.jacket_material?.includes('Plenum') ? 'CMP' :
                     item.jacket_material?.includes('Riser') ? 'CMR' :
                     item.jacket_material,
        color: item.jacket_color,
        packagingType: item.packaging_type,
        searchRelevance: 1.0,
        tableName: 'category_cables',
        stockStatus: 'not_in_stock',
        stockColor: 'red',
        stockMessage: 'Not currently in stock - contact for availability'
      }))
    }

    console.log('❌ No products match all criteria')
    return []
  }

  // FIBER CONNECTORS SEARCH
  const searchFiberConnectors = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
    console.log('🔌 FIBER CONNECTORS SEARCH')

    let query = supabase
      .from('fiber_connectors')
      .select('*')
      .eq('is_active', true)
      .limit(20)

    let hasFilters = false

    // Filter by connector type first
    if (aiAnalysis?.detectedSpecs?.connectorType) {
      const connType = aiAnalysis.detectedSpecs.connectorType
      query = query.ilike('connector_type', `%${connType}%`)
      hasFilters = true
      console.log(`🔌 AI detected connector: ${connType} - applying filter`)
    }

    // Then filter by fiber type
    if (aiAnalysis?.detectedSpecs?.fiberType) {
      const fiberType = aiAnalysis.detectedSpecs.fiberType
      query = query.ilike('fiber_category', `%${fiberType}%`)
      hasFilters = true
      console.log(`🌈 AI detected fiber type: ${fiberType} - applying filter`)
    }

    // If no AI filters, fall back to text search
    if (!hasFilters) {
      query = query.or(`short_description.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      console.log(`🔍 No AI filters, using text search for: ${searchTerm}`)
    }

    const result = await query

    if (result.data && result.data.length > 0) {
      return result.data.map((item: any) => ({
        id: `conn-${item.id}`,
        partNumber: item.part_number || 'No Part Number',
        brand: item.brand || 'Unknown Brand',
        description: item.short_description || 'No description available',
        price: Math.random() * 50 + 15,
        stockLocal: 15,
        stockDistribution: 100,
        leadTime: 'Ships Today',
        category: 'Fiber Connector',
        connectorType: item.connector_type,
        fiberType: Array.isArray(item.fiber_category) ? item.fiber_category.join(', ') : item.fiber_category,
        fiberCount: item.fiber_count,
        searchRelevance: 1.0,
        tableName: 'fiber_connectors',
        stockStatus: 'not_in_stock',
        stockColor: 'red',
        stockMessage: 'Not currently in stock - contact for availability'
      }))
    }

    return []
  }

  // ADAPTER PANELS SEARCH
  const searchAdapterPanels = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
    console.log('🏠 ADAPTER PANELS SEARCH')
    console.log('🤖 AI Analysis:', aiAnalysis?.detectedSpecs)

    let query = supabase
      .from('adapter_panels')
      .select('*')
      .eq('is_active', true)
      .limit(50) // Increased limit for better results

    const searchConditions = []

    // FIBER TYPE (OM1, OM2, OM3, OM4, etc.) - MOST IMPORTANT
    if (aiAnalysis?.detectedSpecs?.fiberType) {
      const fiberType = aiAnalysis.detectedSpecs.fiberType
      console.log(`🌈 AI detected fiber type: ${fiberType}`)
      searchConditions.push(`fiber_category.ilike.%${fiberType}%`)
      searchConditions.push(`short_description.ilike.%${fiberType}%`)
    }

    // Fiber count
    if (aiAnalysis?.detectedSpecs?.fiberCount) {
      const fiberCount = aiAnalysis.detectedSpecs.fiberCount
      console.log(`📊 AI detected fiber count: ${fiberCount}`)
      searchConditions.push(`fiber_count.eq.${fiberCount}`)
    }

    // Connector type
    if (aiAnalysis?.detectedSpecs?.connectorType) {
      const connType = aiAnalysis.detectedSpecs.connectorType
      console.log(`🔌 AI detected connector: ${connType}`)
      searchConditions.push(`connector_type.ilike.%${connType}%`)
    }

    // If we have AI-detected specs, use them
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
      console.log(`🎯 Using AI-detected specs: ${searchConditions.length} conditions`)
    } else {
      // Fallback: Search for panel-related terms
      const panelTerms = ['adapter', 'panel', 'patch', 'fiber']
      const panelConditions = panelTerms.map(term =>
        `short_description.ilike.%${term}%`
      ).join(',')
      query = query.or(`${panelConditions},part_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      console.log('🔍 Using fallback panel search terms')
    }

    console.log('🚀 Executing adapter panel query...')
    const result = await query

    console.log(`📊 Adapter panel result: ${result.data?.length || 0} products found`)

    if (result.data && result.data.length > 0) {
      // Log what we found for debugging
      console.log('🏠 Found adapter panels:', result.data.slice(0, 3).map(item => ({
        part: item.part_number,
        connector: item.connector_type,
        fiber: item.fiber_category,
        count: item.fiber_count,
        description: item.short_description?.substring(0, 50) + '...'
      })))

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
        fiberType: item.fiber_category, // Add this for display
        fiberCount: item.fiber_count,
        searchRelevance: 1.0,
        tableName: 'adapter_panels',
        stockStatus: 'not_in_stock',
        stockColor: 'red',
        stockMessage: 'Not currently in stock - contact for availability'
      }))
    }

    console.log('❌ No adapter panels found')
    return []
  }

  // FIBER OPTIC CABLES SEARCH
  const searchFiberCables = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
    console.log('🌈 FIBER OPTIC CABLES SEARCH - CABLES ONLY')

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

    // Check for specific fiber types in the search term
    const queryLower = searchTerm.toLowerCase()
    const fiberTypes = ['om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2']
    const detectedFiberType = fiberTypes.find(type => queryLower.includes(type))

    // Add AI detected fiber type OR detected fiber type from search term
    if (aiAnalysis?.detectedSpecs?.fiberType || detectedFiberType) {
      const fiberType = aiAnalysis?.detectedSpecs?.fiberType || detectedFiberType
      console.log(`🌈 Searching for fiber type: ${fiberType}`)
      query = query.or(`short_description.ilike.%${fiberType}%,fiber_type_standard.ilike.%${fiberType}%`)
    } else {
      const cableConditions = cableTerms.map(term =>
        `short_description.ilike.%${term}%`
      ).join(',')
      // Also search for general fiber terms
      const fiberConditions = fiberTypes.map(type =>
        `short_description.ilike.%${type}%`
      ).join(',')
      query = query.or(`${cableConditions},${fiberConditions}`)
      console.log('🔍 Searching for fiber cables with cable-specific terms and fiber types')
    }

    console.log('🚀 Executing fiber cable query...')
    const result = await query

    console.log(`📊 Initial fiber result: ${result.data?.length || 0} products found`)

    if (result.data && result.data.length > 0) {
      const cableProducts = result.data.filter(item => {
        const description = item.short_description?.toLowerCase() || ''

        const hasCableTerms = cableTerms.some(term => description.includes(term.toLowerCase()))
        const hasExcludeTerms = excludeTerms.some(term => description.includes(term.toLowerCase()))
        const hasFiberCount = /\d+\s*fiber/i.test(description)
        const hasCableWords = description.includes('cable') || description.includes('cord')
        const hasFiberTypes = fiberTypes.some(type => description.includes(type))

        // It's a cable if: (has cable terms OR fiber count OR cable words OR fiber types) AND doesn't have exclude terms
        return (hasCableTerms || hasFiberCount || hasCableWords || hasFiberTypes) && !hasExcludeTerms
      })

      console.log(`📊 After cable filtering: ${cableProducts.length} actual cables found`)

      if (cableProducts.length > 0) {
        console.log('🌈 Found fiber CABLES:', cableProducts.slice(0, 3).map(item => ({
          part: item.part_number,
          description: item.short_description?.substring(0, 70) + '...'
        })))

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
          fiberType: detectedFiberType || aiAnalysis?.detectedSpecs?.fiberType || 'Fiber',
          searchRelevance: 1.0,
          tableName: 'fiber_cables',
          stockStatus: 'not_in_stock',
          stockColor: 'red',
          stockMessage: 'Not currently in stock - contact for availability'
        }))
      }
    }

    console.log('❌ No fiber optic CABLES found')
    return []
  }

  const searchPanelsAndAdapters = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
    console.log('🏠 PRODUCTS TABLE SEARCH (panels/housings)')

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(20)

    const searchConditions = []

    if (aiAnalysis?.detectedSpecs?.fiberCount) {
      searchConditions.push(`fiber_count.eq.${aiAnalysis.detectedSpecs.fiberCount}`)
    }

    if (aiAnalysis?.detectedSpecs?.connectorType) {
      const connType = aiAnalysis.detectedSpecs.connectorType
      searchConditions.push(`connector_type_standard.ilike.%${connType}%`)
    }

    if (aiAnalysis?.detectedSpecs?.fiberType) {
      searchConditions.push(`fiber_type_standard.eq.${aiAnalysis.detectedSpecs.fiberType}`)
    }

    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
    } else {
      query = query.or(`short_description.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%`)
    }

    const result = await query

    if (result.data && result.data.length > 0) {
      return result.data.map((item: any) => ({
        id: item.id,
        partNumber: item.part_number || 'No Part Number',
        brand: 'Brand Name',
        description: item.short_description || 'No description available',
        price: parseFloat(item.unit_price) || (Math.random() * 200 + 50),
        stockLocal: item.stock_quantity || 0,
        stockDistribution: 100,
        leadTime: 'Ships Today',
        category: 'Panel/Housing',
        fiberType: item.fiber_type_standard,
        connectorType: item.connector_type_standard,
        fiberCount: item.fiber_count,
        searchRelevance: 1.0,
        tableName: 'products',
        stockStatus: 'not_in_stock',
        stockColor: 'red',
        stockMessage: 'Not currently in stock - contact for availability'
      }))
    }

    return []
  }

  // MULTI-TABLE FALLBACK SEARCH
  const searchMultipleTables = async (aiAnalysis: AISearchAnalysis | null, searchTerm: string): Promise<Product[]> => {
    console.log('🚀 MULTI-TABLE SEARCH')

    let allProducts: Product[] = []
    const query = searchTerm.toLowerCase()

    // Check for fiber terms more comprehensively
    const fiberTerms = ['fiber', 'fibre', 'om1', 'om2', 'om3', 'om4', 'om5', 'os1', 'os2', 'singlemode', 'multimode']
    const hasFiberTerms = fiberTerms.some(term => query.includes(term))

    if (hasFiberTerms) {
      console.log('🌈 Fiber terms detected in multi-table search - prioritizing fiber cables')
      console.log('🔍 Detected fiber terms:', fiberTerms.filter(term => query.includes(term)))

      const fiberResults = await searchFiberCables(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...fiberResults]
      console.log(`📊 Fiber cables found: ${fiberResults.length}`)

      if (allProducts.length < 10) {
        const connectorResults = await searchFiberConnectors(aiAnalysis, searchTerm)
        allProducts = [...allProducts, ...connectorResults]
        console.log(`📊 Fiber connectors found: ${connectorResults.length}`)
      }

      if (allProducts.length < 15) {
        const adapterResults = await searchAdapterPanels(aiAnalysis, searchTerm)
        allProducts = [...allProducts, ...adapterResults]
        console.log(`📊 Adapter panels found: ${adapterResults.length}`)
      }
    } else {
      // No fiber mentioned - try category cables first (largest table - 838 products)
      console.log('🌐 No fiber terms - trying category cables first')
      const categoryResults = await searchCategoryCables(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...categoryResults]
      console.log(`📊 Category cables found: ${categoryResults.length}`)

      if (allProducts.length < 10) {
        const connectorResults = await searchFiberConnectors(aiAnalysis, searchTerm)
        allProducts = [...allProducts, ...connectorResults]
        console.log(`📊 Fiber connectors found: ${connectorResults.length}`)
      }

      if (allProducts.length < 15) {
        const adapterResults = await searchAdapterPanels(aiAnalysis, searchTerm)
        allProducts = [...allProducts, ...adapterResults]
        console.log(`📊 Adapter panels found: ${adapterResults.length}`)
      }
    }

    // Try products table if still not enough
    if (allProducts.length < 20) {
      const productResults = await searchPanelsAndAdapters(aiAnalysis, searchTerm)
      allProducts = [...allProducts, ...productResults]
      console.log(`📊 Products table found: ${productResults.length}`)
    }

    console.log(`✅ Multi-table search completed: ${allProducts.length} total products`)
    return allProducts
  }

  // ENHANCED MAIN SEARCH FUNCTION
  const searchProducts = async (searchTerm: string): Promise<{ products: Product[], searchTime: number, searchType: string, aiAnalysis?: AISearchAnalysis, redirectMessage?: string }> => {
    const startTime = performance.now()

    try {
      console.log('🎯 ENHANCED SEARCH for:', searchTerm)

      // Step 1: Validate query first
      const validation = validateElectricalQuery(searchTerm)
      if (!validation.isValid) {
        throw new Error(validation.message)
      }

      // Step 2: Apply business rules (Cat5 → Cat5e)
      const processedQuery = applyBusinessRules(searchTerm)
      console.log('🔄 Query after business rules:', processedQuery.processedTerm)

      // Step 3: Check for part numbers FIRST
      const partNumberDetection = detectPartNumbers(processedQuery.processedTerm)

      if (partNumberDetection.hasParts) {
        console.log('🔢 PART NUMBER DETECTED - Using part number search')
        console.log('📋 Part numbers found:', partNumberDetection.partNumbers)

        // Search by part number
        const partResults = await searchByPartNumber(
          partNumberDetection.partNumbers,
          partNumberDetection.quantity
        )

        if (partResults.length > 0) {
          // Save to recent searches
          saveRecentSearch(processedQuery.processedTerm)

          // Create fake AI analysis for quantity detection
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

          // Generate smart filters if we have multiple results
          if (partResults.length > 1) {
            const filters = generateSmartFilters(partResults, 'PART_NUMBER')
            setSmartFilters(filters)
            setCurrentProducts(partResults)
            setFilteredProducts(partResults)
            setActiveFilters({})
          }

          const endTime = performance.now()
          const searchTime = Math.round(endTime - startTime)

          console.log(`✅ Part number search completed: ${partResults.length} products in ${searchTime}ms`)

          return {
            products: partResults,
            searchTime,
            searchType: 'part_number_match',
            aiAnalysis: partNumberAI,
            redirectMessage: processedQuery.redirectMessage || undefined
          }
        } else {
          console.log('🔢 No part number matches found, falling back to regular search')
        }
      }

      // Step 4: Regular search flow (if no part numbers or no part number matches)
      saveRecentSearch(processedQuery.processedTerm)

      // Step 5: Get AI Analysis (using processed term)
      const aiAnalysis = await enhanceQueryWithAI(processedQuery.processedTerm)
      setAiAnalysis(aiAnalysis)

      let allProducts: Product[] = []
      let searchStrategy = 'enhanced'

      // Step 6: Determine Target Table
      const targetTable = determineTargetTable(aiAnalysis, processedQuery.processedTerm)
      console.log(`🎯 Target table: ${targetTable}`)

      // Step 7: Execute Table-Specific Search
      switch (targetTable) {
        case 'fiber_cables':
          allProducts = await searchFiberCables(aiAnalysis, processedQuery.processedTerm)
          searchStrategy = 'fiber_cables_enhanced'
          break

        case 'category_cables':
          allProducts = await searchCategoryCables(aiAnalysis, processedQuery.processedTerm)
          searchStrategy = 'category_cables_enhanced'
          break

        case 'fiber_connectors':
          allProducts = await searchFiberConnectors(aiAnalysis, processedQuery.processedTerm)
          searchStrategy = 'fiber_connectors_enhanced'
          break

        case 'adapter_panels':
          allProducts = await searchAdapterPanels(aiAnalysis, processedQuery.processedTerm)
          searchStrategy = 'adapter_panels_enhanced'
          break

        case 'products_panels':
          allProducts = await searchPanelsAndAdapters(aiAnalysis, processedQuery.processedTerm)
          searchStrategy = 'products_enhanced'
          break

        default:
          allProducts = await searchMultipleTables(aiAnalysis, processedQuery.processedTerm)
          searchStrategy = 'multi_table_enhanced'
      }

      // Step 8: Generate Smart Filters
      if (allProducts.length > 0) {
        const filters = generateSmartFilters(allProducts, aiAnalysis?.detectedSpecs?.productType || 'MIXED')
        setSmartFilters(filters)
        setCurrentProducts(allProducts)
        setFilteredProducts(allProducts)
        setActiveFilters({})
      }

      const endTime = performance.now()
      const searchTime = Math.round(endTime - startTime)

      console.log(`✅ Enhanced search completed: ${allProducts.length} products in ${searchTime}ms using ${searchStrategy}`)

      return {
        products: allProducts.slice(0, 20),
        searchTime,
        searchType: searchStrategy,
        aiAnalysis: aiAnalysis || undefined,
        redirectMessage: processedQuery.redirectMessage || undefined
      }

    } catch (error) {
      console.error('❌ Enhanced search error:', error)
      const endTime = performance.now()

      // If it's a validation error, return it properly
      if (error.message.includes('specialized in electrical')) {
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
        searchType: 'error'
      }
    }
  }

  // ENHANCED HANDLE SUBMIT
  const handleSubmit = async () => {
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
      const { products, searchTime, searchType, aiAnalysis, redirectMessage } = await searchProducts(originalInput)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      // Check if it was a validation error
      if (searchType === 'validation_error') {
        assistantContent = `❌ ${redirectMessage}`
      } else if (searchType === 'part_number_match') {
        // Special message for part number matches
        assistantContent = `🔢 **Part Number Match Found!** Found ${products.length} product${products.length > 1 ? 's' : ''} in ${searchTime}ms`

        if (aiAnalysis?.detectedSpecs?.requestedQuantity) {
          assistantContent += `\n\n📏 **Quantity Detected:** ${aiAnalysis.detectedSpecs.requestedQuantity.toLocaleString()} units`
        }

        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        assistantContent += `\n\n✅ **Part number search successful** - Click "Add" to add items to your list`
      } else if (products.length > 0) {
        assistantContent = `🤖 AI found ${products.length} products in ${searchTime}ms using ${searchType} strategy`

        // Show redirect message if Cat5 was redirected
        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        if (aiAnalysis) {
          assistantContent += `\n\n🧠 **AI Reasoning:** ${aiAnalysis.reasoning}`
        }
      } else {
        assistantContent = `🔍 **No exact matches found for "${originalInput}"**
        
${redirectMessage ? `🔄 **${redirectMessage}**\n\n` : ''}Let me help you find what you need:

**For Part Numbers, try:**
• "7131100" - Direct part number search
• "10000 ABC-123" - Quantity + part number
• "XYZ123" - Alphanumeric part numbers

**For Product Types, try:**
• "Cat5e plenum" - Category 5e plenum rated (current standard)
• "OM4 fiber cable" - Fiber optic cables
• "24 LC connectors" - Fiber connectors

**Search Tips:**
• Use exact part numbers for fastest results
• Include quantities: "1000 ft", "24 connectors"  
• Try product descriptions: "plenum cable blue"`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: searchType !== 'validation_error' && products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime,
        aiAnalysis,
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

  // PERFORM SEARCH HELPER
  const performSearch = async (searchTerm: string) => {
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
      const { products, searchTime, searchType, aiAnalysis, redirectMessage } = await searchProducts(searchTerm)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      if (searchType === 'validation_error') {
        assistantContent = `❌ ${redirectMessage}`
      } else if (searchType === 'part_number_match') {
        assistantContent = `🔢 **Part Number Match!** Found ${products.length} product${products.length > 1 ? 's' : ''} in ${searchTime}ms`

        if (aiAnalysis?.detectedSpecs?.requestedQuantity) {
          assistantContent += ` with quantity ${aiAnalysis.detectedSpecs.requestedQuantity.toLocaleString()}`
        }

        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        if (aiAnalysis) {
          assistantContent += `\n\n✅ **${aiAnalysis.reasoning}**`
        }
      } else if (products.length > 0) {
        assistantContent = `🤖 AI found ${products.length} products in ${searchTime}ms:`

        if (redirectMessage) {
          assistantContent += `\n\n🔄 **${redirectMessage}**`
        }

        if (aiAnalysis) {
          assistantContent += `\n\n🧠 **AI Reasoning:** ${aiAnalysis.reasoning}`
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
        aiAnalysis,
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

  // UPDATE QUANTITY
  const updateQuantity = (id: string, delta: number): void => {
    setProductList(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
      }
      return item
    }).filter(Boolean) as ListItem[])
  }

  // REMOVE FROM LIST
  const removeFromList = (id: string): void => {
    setProductList(prev => prev.filter(item => item.id !== id))
  }

  // SEND LIST
  const sendList = (): void => {
    alert('List sent! (This would email/text the list in production)')
  }

  const totalItems = productList.reduce((sum, item) => sum + item.quantity, 0)
  const hasListItems = productList.length > 0

  // Get products to display (filtered or current)
  const productsToDisplay = Object.keys(activeFilters).length > 0 ? filteredProducts : currentProducts

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
                🤖 AI-Powered Electrical Distributor - Your Database Only
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
                    🤖 AI-Powered Electrical Expert
                  </h2>
                  <p className="text-gray-600 mb-4">
                    I use advanced AI to understand your needs and search only your database for the perfect products
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
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Try these popular searches:</h3>
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
                      🤖 Describe What You Need - AI Will Find It In Your Database
                    </h3>
                    <div className="relative">
                      <textarea
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                          }
                        }}
                        placeholder="Just describe what you need: 'Cat5e plenum blue', 'fiber optic connectors', 'network cable for office'..."
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
                        AI Search
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
                          <span className="text-sm font-medium text-gray-700">Plectic AI Expert</span>
                          {message.searchTime && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              {message.searchTime}ms • {message.searchType}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-700 mb-3 whitespace-pre-line">{message.content}</div>

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
                                        : 'bg-purple-100 text-purple-700'
                                    }`}
                                  >
                                    {key === 'requestedQuantity' ? `📏 ${value?.toLocaleString()} ft` :
                                     key === 'productType' ? `type: ${value}` :
                                     key === 'color' ? `color: ${value}` :
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

                        {/* Smart Filter Buttons */}
                        {smartFilters && message.products && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
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

                            {/* Brand Filters */}
                            {smartFilters.brands.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Brands:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.brands.map(brand => (
                                    <button
                                      key={brand}
                                      onClick={() => applySmartFilter('brand', brand)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.brand === brand
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                                      }`}
                                    >
                                      {brand}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Packaging Type Filters */}
                            {smartFilters.packagingTypes.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-600 block mb-1">Packaging:</span>
                                <div className="flex flex-wrap gap-1">
                                  {smartFilters.packagingTypes.map(type => (
                                    <button
                                      key={type}
                                      onClick={() => applySmartFilter('packagingType', type)}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.packagingType === type
                                          ? 'bg-green-600 text-white'
                                          : 'bg-white border border-green-300 text-green-700 hover:bg-green-100'
                                      }`}
                                    >
                                      {type}
                                    </button>
                                  ))}
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
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        activeFilters.color === color
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
                                      }`}
                                    >
                                      {color}
                                    </button>
                                  ))}
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
                                      {rating}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Product Table */}
                        {message.products && (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                              <p className="text-sm font-semibold text-gray-700">
                                🤖 AI-Found Products - Add to your list:
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                  <tr className="text-xs text-gray-700">
                                    <th className="px-3 py-2 text-center font-medium">Action</th>
                                    <th className="px-3 py-2 text-left font-medium">Part Number</th>
                                    <th className="px-3 py-2 text-left font-medium">Brand</th>
                                    <th className="px-3 py-2 text-left font-medium">Description</th>
                                    <th className="px-3 py-2 text-center font-medium">Type</th>
                                    <th className="px-3 py-2 text-right font-medium">Price</th>
                                    <th className="px-3 py-2 text-center font-medium">Stock Status</th>
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
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          onClick={() => addToList(product)}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                          title={aiAnalysis?.detectedSpecs?.requestedQuantity ? `Add ${aiAnalysis.detectedSpecs.requestedQuantity.toLocaleString()} units` : 'Add 1 unit'}
                                        >
                                          {aiAnalysis?.detectedSpecs?.requestedQuantity ? (
                                            <>
                                              <span>Add {aiAnalysis.detectedSpecs.requestedQuantity >= 1000 ? `${(aiAnalysis.detectedSpecs.requestedQuantity/1000).toFixed(0)}K` : aiAnalysis.detectedSpecs.requestedQuantity}</span>
                                              {aiAnalysis.detectedSpecs.requestedQuantity >= 1000 && (
                                                <span className="text-blue-200 text-xs">units</span>
                                              )}
                                            </>
                                          ) : (
                                            'Add'
                                          )}
                                        </button>
                                      </td>
                                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                        {product.partNumber}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-700">{product.brand}</td>
                                      <td className="px-3 py-2 text-sm text-gray-700">{product.description}</td>
                                      <td className="px-3 py-2 text-center">
                                        {product.fiberType && (
                                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                            {product.fiberType}
                                          </span>
                                        )}
                                        {product.categoryRating && (
                                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                            {product.categoryRating}
                                          </span>
                                        )}
                                        {product.packagingType && (
                                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs ml-1">
                                            {product.packagingType}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm font-medium text-right">${product.price?.toFixed(2)}</td>
                                      <td className="px-3 py-2 text-center">
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    placeholder="🤖 Describe what you need and AI will find it in your database..."
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
                  AI Search
                </button>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([])
                    setAiAnalysis(null)
                    setSmartFilters(null)
                    setActiveFilters({})
                    setCurrentProducts([])
                    setFilteredProducts([])
                  }}
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