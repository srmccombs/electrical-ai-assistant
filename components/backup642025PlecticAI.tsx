// src/components/PlecticAI.tsx
// CLEAN VERSION - Uses service layer for all search logic + FIXED SMART FILTERS

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter, Brain, Shield, Database, Cpu, Activity, Copy } from 'lucide-react'

// NEW IMPORTS - Clean service layer
import {
  searchProducts,
  type SearchResult,
  type Product,
  type AISearchAnalysis
} from '@/services/searchService'

// ===================================================================
// TYPE DEFINITIONS - UI Specific Only
// ===================================================================

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
  productTypes: string[]
  technologies: string[]
  polishTypes: string[]
  housingColors: string[]
  bootColors: string[]
}

// ===================================================================
// UI COMPONENTS
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
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Plectic AI Working</h2>
          <p className="text-sm text-gray-600 mt-1">Searching for: &quot;{searchTerm}&quot;</p>
        </div>

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
// MAIN COMPONENT - CLEAN UI ONLY
// ===================================================================

const PlecticAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [productList, setProductList] = useState<ListItem[]>([])
  const [lastSearchTime, setLastSearchTime] = useState<number>(0)
  const [aiAnalysis, setAiAnalysis] = useState<AISearchAnalysis | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches] = useState<string[]>([
    "LANMARK 6 blue CMR",
    "Category 6 plenum",
    "cat5e",
    "Hyper Plus 5e",
    "10136339",
    "GenSPEED 6"
  ])
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('')

  // Smart Filter States
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [smartFilters, setSmartFilters] = useState<SmartFilters | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ===================================================================
  // SMART FILTER HELPER FUNCTIONS - ADDED!
  // ===================================================================

  const getColorButtonStyle = (color: string, isActive: boolean): string => {
    const baseClasses = 'px-2 py-1 text-xs rounded transition-colors'

    if (isActive) {
      return `${baseClasses} bg-blue-600 text-white`
    }

    // Color-specific styling for better UX
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200',
      'black': 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200',
      'white': 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100',
      'red': 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200',
      'green': 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200',
      'yellow': 'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200',
      'orange': 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200',
      'purple': 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200',
      'gray': 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200',
      'brown': 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
    }

    const lowerColor = color.toLowerCase()
    return colorMap[lowerColor] || 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
  }

  const applySmartFilter = (filterType: string, value: string): void => {
    console.log(`🔍 Applying filter: ${filterType} = ${value}`)

    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }))
  }

  const clearAllFilters = (): void => {
    console.log('🧹 Clearing all filters')
    setActiveFilters({})
  }

  // Apply filters to current products whenever activeFilters change
  useEffect(() => {
    if (!currentProducts.length) {
      setFilteredProducts([])
      return
    }

    let filtered = [...currentProducts]

    // Apply each active filter
    Object.entries(activeFilters).forEach(([filterType, value]) => {
      if (!value) return

      filtered = filtered.filter(product => {
        switch (filterType) {
          case 'productLine':
            return product.productLine?.toLowerCase().includes(value.toLowerCase())
          case 'categoryRating':
            return product.categoryRating?.toLowerCase().includes(value.toLowerCase())
          case 'jacketRating':
            return product.jacketRating?.toLowerCase().includes(value.toLowerCase())
          case 'color':
            return product.color?.toLowerCase().includes(value.toLowerCase())
          case 'packagingType':
            return product.packagingType?.toLowerCase().includes(value.toLowerCase())
          case 'brand':
            return product.brand?.toLowerCase().includes(value.toLowerCase())
          case 'shielding':
            return product.shielding?.toLowerCase().includes(value.toLowerCase())
          default:
            return true
        }
      })
    })

    setFilteredProducts(filtered)
    console.log(`🔍 Filtered ${currentProducts.length} products down to ${filtered.length}`)
  }, [activeFilters, currentProducts])

  // ===================================================================
  // UI HELPER FUNCTIONS
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

  const copyPartNumber = async (partNumber: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(partNumber)
      console.log('Part number copied:', partNumber)
    } catch (error) {
      console.error('Failed to copy part number:', error)
    }
  }

  // ===================================================================
  // SEARCH FUNCTIONS - CLEAN! (Using Service Layer)
  // ===================================================================

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
      // CLEAN: Using our service layer
      const searchResult = await searchProducts({
        query: originalInput,
        limit: 50,
        includeAI: true
      })

      const { products, searchTime, searchType, aiAnalysis: searchAiAnalysis, redirectMessage, smartFilters: resultFilters } = searchResult

      setLastSearchTime(searchTime)
      setAiAnalysis(searchAiAnalysis || null)
      saveRecentSearch(originalInput)

      // Update smart filters and products
      if (products.length > 0 && resultFilters) {
        setSmartFilters(resultFilters)
        setCurrentProducts(products)
        setFilteredProducts(products)
        setActiveFilters({})
      }

      let assistantContent = ''

      // Generate response content based on results
      if (searchType === 'validation_error') {
        assistantContent = `❌ ${redirectMessage}`
      } else if (searchType.includes('part_number_match')) {
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
        smartFilters: products.length > 0 && resultFilters ? resultFilters : undefined
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
      // CLEAN: Using our service layer
      const searchResult = await searchProducts({
        query: searchTerm,
        limit: 50,
        includeAI: true
      })

      const { products, searchTime, searchType, aiAnalysis: searchAiAnalysis, redirectMessage } = searchResult
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
  // RENDER - SIMPLIFIED FOR NOW
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
                🤖 Enhanced with Clean Architecture + Smart Filters - 35 Years Electrical Knowledge
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
                    🤖 Clean Architecture with Smart Filters & Complete Electrical Knowledge
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Refactored with service layer + smart filters: <strong>Riser = CMR = Non-Plenum</strong>
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
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Test the clean architecture + smart filters:</h3>
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
                      🤖 Clean Service Layer + Smart Filters - Test Category Cable Search
                    </h3>
                    <div className="relative">
                      <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Try: 'LANMARK 6 blue CMR' or 'Category 6 blue' or 'cat5e'..."
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
                        Clean Search
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-4xl w-full ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`inline-block p-4 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white ml-12' 
                          : 'bg-white border border-gray-200 mr-12'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>

                        {/* Show detected quantity */}
                        {message.role === 'assistant' && message.aiAnalysis && (
                          <QuantityDetectionIndicator aiAnalysis={message.aiAnalysis} />
                        )}

                        {/* SMART FILTERS SECTION - FIXED! */}
                        {message.smartFilters && (
                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-3">
                              Smart Filters ({filteredProducts.length} of {message.products?.length || 0} products)
                            </h4>

                            {/* Product Lines */}
                            {message.smartFilters.productLines?.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-blue-700 mb-2">📋 Product Lines:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {message.smartFilters.productLines.map((line: string) => (
                                    <button
                                      key={line}
                                      onClick={() => applySmartFilter('productLine', line)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        activeFilters.productLine === line
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                                      }`}
                                    >
                                      📋 {line}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Categories */}
                            {message.smartFilters.categoryRatings?.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-blue-700 mb-2">📊 Categories:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {message.smartFilters.categoryRatings.map((category: string) => (
                                    <button
                                      key={category}
                                      onClick={() => applySmartFilter('categoryRating', category)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        activeFilters.categoryRating === category
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                                      }`}
                                    >
                                      📊 {category}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Jacket Rating */}
                            {message.smartFilters.jacketRatings?.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-blue-700 mb-2">🧥 Jacket Rating:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {message.smartFilters.jacketRatings.map((jacket: string) => (
                                    <button
                                      key={jacket}
                                      onClick={() => applySmartFilter('jacketRating', jacket)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        activeFilters.jacketRating === jacket
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                                      }`}
                                    >
                                      🧥 {jacket}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Colors */}
                            {message.smartFilters.colors?.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-blue-700 mb-2">🎨 Colors:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {message.smartFilters.colors.map((color: string) => (
                                    <button
                                      key={color}
                                      onClick={() => applySmartFilter('color', color)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${getColorButtonStyle(color, activeFilters.color === color)}`}
                                    >
                                      {color}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* PACKAGING TYPES - NEW! */}
                            {message.smartFilters.packagingTypes?.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-blue-700 mb-2">📦 Packaging:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {message.smartFilters.packagingTypes.map((pkg: string) => (
                                    <button
                                      key={pkg}
                                      onClick={() => applySmartFilter('packagingType', pkg)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        activeFilters.packagingType === pkg
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                                      }`}
                                    >
                                      📦 {pkg}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Clear Filters */}
                            {Object.keys(activeFilters).length > 0 && (
                              <div className="mt-3">
                                <button
                                  onClick={clearAllFilters}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Clear All Filters
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Show products - UPDATED TO USE FILTERED PRODUCTS */}
                        {message.products && message.products.length > 0 && (
                          <div className="mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-3">
                                {Object.keys(activeFilters).length > 0
                                  ? `Showing ${filteredProducts.length} of ${message.products.length} products`
                                  : `Found ${message.products.length} products`
                                }:
                              </h4>
                              <div className="space-y-2">
                                {(Object.keys(activeFilters).length > 0 ? filteredProducts : message.products)
                                  .slice(0, 10).map((product) => (
                                  <div key={product.id} className="bg-white p-3 rounded border border-gray-200">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{product.description}</div>
                                        <div className="text-sm text-gray-600">
                                          <span className="font-medium">Part #:</span>
                                          <button
                                            onClick={() => copyPartNumber(product.partNumber)}
                                            className="ml-1 text-blue-600 hover:text-blue-800 font-mono"
                                            title="Click to copy part number"
                                          >
                                            {product.partNumber}
                                            <Copy className="inline w-3 h-3 ml-1" />
                                          </button>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          <span className="font-medium">Brand:</span> {product.brand}
                                        </div>
                                        {product.categoryRating && (
                                          <div className="text-sm text-gray-600">
                                            <span className="font-medium">Category:</span> {product.categoryRating}
                                          </div>
                                        )}
                                        {product.jacketRating && (
                                          <div className="text-sm text-gray-600">
                                            <span className="font-medium">Jacket:</span> {product.jacketRating}
                                          </div>
                                        )}
                                        {product.packagingType && (
                                          <div className="text-sm text-gray-600">
                                            <span className="font-medium">Packaging:</span> {product.packagingType}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <StockStatusButton product={product} />
                                        <button
                                          onClick={() => addToList(product)}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <StockStatusLegend />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          {messages.length > 0 && (
            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="🤖 Clean search + smart filters: 'LANMARK 6 blue CMR', 'Category 6', part numbers..."
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
                  Clean Search
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
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Product List</h3>
              <p className="text-sm text-gray-600">{totalItems} total items</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {productList.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{item.description}</div>
                        <div className="text-xs text-gray-600">Part # {item.partNumber}</div>
                      </div>
                      <button
                        onClick={() => removeFromList(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-6 h-6 rounded flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-6 h-6 rounded flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <StockStatusButton product={item} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => alert('List sent! (Would email/text in production)')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium"
              >
                📧 Send List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlecticAI