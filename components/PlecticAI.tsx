// PlecticAI.tsx - SIMPLIFIED VERSION WITH FIBER TYPE REFERENCE
// Updated: June 6, 2025
// Date created: June 6, 2025

// ⚠️ IMPORTANT: DO NOT REMOVE OR MODIFY THE FOLLOWING FEATURES ⚠️
// 1. Smart Filters with colored backgrounds for cable colors
// 2. All filter types including: brands, colors, jacket ratings, categories, etc.
// 3. The "All X" buttons that clear individual filter types
// 4. The getColorButtonStyle function that shows actual cable colors
// 5. The new AI loading animation (keep this from current version)
// 6. The comprehensive filter UI in the Smart Filters section
// 7. NEW: Simple Fiber Type Reference that shows when needed
// ⚠️ These features are critical to the user experience - DO NOT SIMPLIFY ⚠️

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter, Brain, Shield, Database, Cpu, Activity, Copy } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Search service imports
import {
  searchProducts,
  type Product,
  type AISearchAnalysis,
} from '@/services/searchService'

// ===================================================================
// TYPE DEFINITIONS
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

// ⚠️ DO NOT SIMPLIFY - All these filter types are needed for electrical products
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
  panelTypes?: string[]
  terminationTypes?: string[]
  adapterColors?: string[]
  rackUnits?: string[]
  environments?: string[]
  mountTypes?: string[]
}

// ===================================================================
// FIBER TYPE REFERENCE COMPONENT
// ===================================================================

const FiberTypeReference: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h3 className="text-md font-semibold text-gray-900 mb-3">Fiber Type Quick Reference</h3>
      <div className="space-y-2 text-sm">
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">OM1 (62.5/125):</span>
          <span className="text-gray-600">Obsolete, only for matching existing installations</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">OM2 (50/125):</span>
          <span className="text-gray-600">Obsolete, not recommended for new installations</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">OM3 (50/125):</span>
          <span className="text-gray-600">Good multimode choice, 300m at 10Gb/850nm</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">OM4 (50/125):</span>
          <span className="text-gray-600">Best multimode choice, 550m at 10Gb/850nm</span>
        </div>
        <div className="flex">
          <span className="font-semibold text-gray-700 w-32">OS2 Single-mode:</span>
          <span className="text-gray-600">Best overall choice, 5000m+ at 10Gb/1310nm</span>
        </div>
      </div>
    </div>
  )
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
        return 'bg-green-600'
      case 'yellow':
        return 'bg-yellow-500'
      case 'red':
      default:
        return 'bg-red-600'
    }
  }

  const getTooltipText = (): string => {
    switch (product.stockStatus) {
      case 'branch_stock':
        return 'In Stock - Same Day'
      case 'dc_stock':
        return 'In Stock - Next Day'
      case 'other_stock':
        return 'Available - Other Locations'
      case 'not_in_stock':
      default:
        return 'Special Order'
    }
  }

  return (
    <div
      className={`w-3 h-3 rounded-full ${getButtonStyle()}`}
      title={getTooltipText()}
    />
  )
}

interface AISearchLoadingProps {
  searchTerm: string
}

// ⚠️ DO NOT CHANGE - User specifically likes this new loading animation
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
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Plectic AI Working</h2>
          <p className="text-sm text-gray-600 mt-1">Searching for: &quot;{searchTerm}&quot;</p>
        </div>
      </div>
    </div>
  )
}

// ===================================================================
// MAIN COMPONENT
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
    "Category 5e Cable",
    "Category 6 Cable",
    "Fiber Optic Cable",
    "Fiber Optic Enclosures",
    "Fiber Optic Adapter Panels",
    "Fiber Optic Connectors",
    "CCH-02U",
    "4RU fiber enclosure"
  ])
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [smartFilters, setSmartFilters] = useState<SmartFilters | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Computed values
  const safeCurrentProducts = currentProducts || []
  const safeFilteredProducts = filteredProducts || []
  const productsToDisplay = Object.keys(activeFilters).length > 0 ? safeFilteredProducts : safeCurrentProducts
  const totalItems = productList.reduce((sum, item) => sum + item.quantity, 0)
  const hasListItems = productList.length > 0

  // ⚠️ DO NOT REMOVE - This function creates actual colored backgrounds for cable colors
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

  // Helper function to extract unique fiber types from products
  const extractUniqueFiberTypes = (products: Product[]): string[] => {
    const allFiberTypes = new Set<string>()

    products.forEach(product => {
      if (product.fiberType) {
        const fiberTypeStr = Array.isArray(product.fiberType)
          ? product.fiberType.join(', ')
          : product.fiberType.toString()

        // Parse fiber types that might be in formats like "[OM3, OM4]" or "OM3, OM4"
        const cleanedStr = fiberTypeStr.replace(/[\[\]]/g, '') // Remove brackets
        const types = cleanedStr.split(',').map(type => type.trim()).filter(type => type)

        types.forEach(type => {
          if (type && type !== '-') {
            allFiberTypes.add(type)
          }
        })
      }
    })

    // Sort fiber types in a logical order
    const sortedTypes = Array.from(allFiberTypes).sort((a, b) => {
      // Sort OM types numerically, then OS types
      const aMatch = a.match(/^(OM|OS)(\d+)$/i)
      const bMatch = b.match(/^(OM|OS)(\d+)$/i)

      if (aMatch && bMatch) {
        if (aMatch[1].toUpperCase() === bMatch[1].toUpperCase()) {
          return parseInt(aMatch[2]) - parseInt(bMatch[2])
        }
        return aMatch[1].toUpperCase() === 'OM' ? -1 : 1
      }

      return a.localeCompare(b)
    })

    return sortedTypes
  }

  // Helper functions
  const addToList = (product: Product, customQuantity?: number): void => {
    const quantityToAdd = customQuantity || aiAnalysis?.detectedSpecs?.requestedQuantity || 1
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

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const clearConversation = (): void => {
    setMessages([])
    setAiAnalysis(null)
    setSmartFilters(null)
    setActiveFilters({})
    setCurrentProducts([])
    setFilteredProducts([])
  }

  // ⚠️ DO NOT SIMPLIFY - This comprehensive filter function handles all product types
  const applySmartFilter = (filterType: string, value: string): void => {
    const newFilters = { ...activeFilters }
    if (newFilters[filterType] === value) {
      delete newFilters[filterType]
    } else {
      newFilters[filterType] = value
    }
    setActiveFilters(newFilters)

    let filtered = safeCurrentProducts
    Object.entries(newFilters).forEach(([type, filterValue]) => {
      filtered = filtered.filter(product => {
        switch (type) {
          case 'brand': return product.brand === filterValue
          case 'categoryRating': return product.categoryRating === filterValue
          case 'panelType': return product.panelType === filterValue
          case 'rackUnits': return product.rackUnits?.toString() === filterValue
          case 'environment': return product.environment === filterValue
          case 'packagingType': return product.packagingType === filterValue
          case 'jacketRating': return product.jacketRating === filterValue
          case 'shielding': return product.shielding === filterValue
          case 'productLine': return product.productLine === filterValue
          case 'pairCount': return product.pairCount === filterValue
          case 'conductorGauge': return product.conductorAwg?.toString() === filterValue
          case 'application': return product.application === filterValue
          case 'fiberType':
            // Enhanced fiber type filtering - check if product supports the selected fiber type
            if (!product.fiberType) return false
            // Handle both array format "[OM3, OM4]" and comma-separated "OM3, OM4"
            const fiberTypeStr = Array.isArray(product.fiberType)
              ? product.fiberType.join(', ')
              : product.fiberType.toString()
            return fiberTypeStr.toLowerCase().includes(filterValue.toLowerCase())
          case 'connectorType': return product.connectorType === filterValue
          case 'productType': return product.productType === filterValue
          case 'technology': return product.technology === filterValue
          case 'polish': return product.polish === filterValue
          case 'housingColor': return product.housingColor === filterValue
          case 'bootColor': return product.bootColor === filterValue
          case 'color':
            const jacketColor = product.jacketColor || product.color || ''
            const desc = product.description?.toLowerCase() || ''
            return desc.includes(filterValue.toLowerCase()) || jacketColor.toLowerCase().includes(filterValue.toLowerCase())
          default: return true
        }
      })
    })
    setFilteredProducts(filtered)
  }

  // ⚠️ DO NOT REMOVE - Clears all active filters
  const clearAllFilters = (): void => {
    setActiveFilters({})
    setFilteredProducts(safeCurrentProducts)
  }

  // ⚠️ DO NOT REMOVE - Clears a specific filter type
  const clearFilterType = (filterType: string): void => {
    const newFilters = { ...activeFilters }
    delete newFilters[filterType]
    setActiveFilters(newFilters)

    // Re-apply remaining filters
    let filtered = safeCurrentProducts
    Object.entries(newFilters).forEach(([type, filterValue]) => {
      filtered = filtered.filter(product => {
        // Same filter logic as applySmartFilter
        switch (type) {
          case 'brand': return product.brand === filterValue
          case 'categoryRating': return product.categoryRating === filterValue
          case 'panelType': return product.panelType === filterValue
          case 'rackUnits': return product.rackUnits?.toString() === filterValue
          case 'environment': return product.environment === filterValue
          case 'packagingType': return product.packagingType === filterValue
          case 'jacketRating': return product.jacketRating === filterValue
          case 'shielding': return product.shielding === filterValue
          case 'productLine': return product.productLine === filterValue
          case 'pairCount': return product.pairCount === filterValue
          case 'conductorGauge': return product.conductorAwg?.toString() === filterValue
          case 'application': return product.application === filterValue
          case 'fiberType':
            // Enhanced fiber type filtering - check if product supports the selected fiber type
            if (!product.fiberType) return false
            const fiberTypeStr = Array.isArray(product.fiberType)
              ? product.fiberType.join(', ')
              : product.fiberType.toString()
            return fiberTypeStr.toLowerCase().includes(filterValue.toLowerCase())
          case 'connectorType': return product.connectorType === filterValue
          case 'productType': return product.productType === filterValue
          case 'technology': return product.technology === filterValue
          case 'polish': return product.polish === filterValue
          case 'housingColor': return product.housingColor === filterValue
          case 'bootColor': return product.bootColor === filterValue
          case 'color':
            const jacketColor = product.jacketColor || product.color || ''
            const desc = product.description?.toLowerCase() || ''
            return desc.includes(filterValue.toLowerCase()) || jacketColor.toLowerCase().includes(filterValue.toLowerCase())
          default: return true
        }
      })
    })
    setFilteredProducts(filtered)
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
      const searchResult = await searchProducts({
        query: originalInput,
        limit: 50,
        includeAI: true
      })

      const { products, searchTime, searchType, aiAnalysis: searchAiAnalysis, redirectMessage, smartFilters: resultFilters } = searchResult

      setLastSearchTime(searchTime)
      setAiAnalysis(searchAiAnalysis || null)

      if (products.length > 0 && resultFilters) {
        setSmartFilters(resultFilters)
        setCurrentProducts(products || [])
        setFilteredProducts(products || [])
        setActiveFilters({})
      }

      let assistantContent = `🤖 Found ${products.length} products in ${searchTime}ms using enhanced electrical industry search`
      if (redirectMessage) {
        assistantContent += `\n\n🔄 **${redirectMessage}**`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime,
        aiAnalysis: searchAiAnalysis || null,
        smartFilters: products.length > 0 && resultFilters ? resultFilters : null
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, there was an error with the search. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setCurrentSearchTerm('')
    }
  }

  const performSearch = async (searchTerm: string): Promise<void> => {
    setInput(searchTerm)
    // Wait a tick for state to update
    setTimeout(() => handleSubmit(), 0)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
                Enhanced with Fiber Enclosures & Smart Filters
                {lastSearchTime > 0 && (
                  <span className="ml-2 text-green-600">
                    Last search: {lastSearchTime}ms
                  </span>
                )}
              </p>
            </div>
          </div>
          {hasListItems && (
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {totalItems} items in list
            </div>
          )}
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Search for fiber enclosures, cables, connectors, and more
                  </h2>

                  {/* Popular Searches */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Try these searches:</h3>
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

                  {/* Search Input */}
                  <div className="relative max-w-2xl mx-auto">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmit()
                        }
                      }}
                      placeholder="Try: 'CCH-02U', '4RU fiber enclosure', 'Corning enclosure'..."
                      className="w-full px-6 py-4 border-2 border-blue-500 rounded-lg resize-none focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-600 text-base"
                      rows={3}
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
                      Search
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === 'user' ? (
                        <div className="flex justify-end mb-3">
                          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-md">
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <div className="text-sm text-gray-700 mb-3 whitespace-pre-line">{message.content}</div>

                          {/* ⚠️ DO NOT SIMPLIFY - This is the comprehensive Smart Filters UI */}
                          {smartFilters && message.products && message.products.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Filter size={16} className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Smart Filters</span>
                                <span className="text-xs text-blue-600">
                                  ({productsToDisplay.length} of {message.products.length} products)
                                </span>
                                {Object.keys(activeFilters).length > 0 && (
                                  <button
                                    onClick={clearAllFilters}
                                    className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium"
                                  >
                                    Clear All Filters
                                  </button>
                                )}
                              </div>

                              {/* Brand Filters */}
                              {smartFilters.brands && smartFilters.brands.length > 0 && (
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
                                    {activeFilters.brand && (
                                      <button
                                        onClick={() => clearFilterType('brand')}
                                        className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                      >
                                        All Brands
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Product Line Filters */}
                              {smartFilters.productLines && smartFilters.productLines.length > 0 && (
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
                              {smartFilters.categoryRatings && smartFilters.categoryRatings.length > 0 && (
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
                              {smartFilters.jacketRatings && smartFilters.jacketRatings.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-gray-600 block mb-1">Jacket Ratings:</span>
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

                              {/* ⚠️ DO NOT REMOVE - Color filters with actual cable colors as backgrounds */}
                              {smartFilters.colors && smartFilters.colors.length > 0 && (
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

                              {/* Shielding Type Filters */}
                              {smartFilters.shieldingTypes && smartFilters.shieldingTypes.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-gray-600 block mb-1">Shielding:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {smartFilters.shieldingTypes.map(shielding => (
                                      <button
                                        key={shielding}
                                        onClick={() => applySmartFilter('shielding', shielding)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                          activeFilters.shielding === shielding
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
                                        }`}
                                      >
                                        🛡️ {shielding}
                                      </button>
                                    ))}
                                    {activeFilters.shielding && (
                                      <button
                                        onClick={() => clearFilterType('shielding')}
                                        className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                      >
                                        All Shielding Types
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Panel Type Filters (for fiber enclosures) */}
                              {smartFilters.panelTypes && smartFilters.panelTypes.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-gray-600 block mb-1">Panel Types:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {smartFilters.panelTypes.map(panelType => (
                                      <button
                                        key={panelType}
                                        onClick={() => applySmartFilter('panelType', panelType)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                          activeFilters.panelType === panelType
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-white border border-cyan-300 text-cyan-700 hover:bg-cyan-100'
                                        }`}
                                      >
                                        📦 {panelType}
                                      </button>
                                    ))}
                                    {activeFilters.panelType && (
                                      <button
                                        onClick={() => clearFilterType('panelType')}
                                        className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                      >
                                        All Panel Types
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Rack Units Filters (for fiber enclosures) */}
                              {smartFilters.rackUnits && smartFilters.rackUnits.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-gray-600 block mb-1">Rack Units:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {smartFilters.rackUnits.map(ru => (
                                      <button
                                        key={ru}
                                        onClick={() => applySmartFilter('rackUnits', ru)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                          activeFilters.rackUnits === ru
                                            ? 'bg-slate-600 text-white'
                                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                      >
                                        🏗️ {ru}RU
                                      </button>
                                    ))}
                                    {activeFilters.rackUnits && (
                                      <button
                                        onClick={() => clearFilterType('rackUnits')}
                                        className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                      >
                                        All Rack Units
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Environment Filters (for fiber enclosures) */}
                              {smartFilters.environments && smartFilters.environments.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-gray-600 block mb-1">Environment:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {smartFilters.environments.map(env => (
                                      <button
                                        key={env}
                                        onClick={() => applySmartFilter('environment', env)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                          activeFilters.environment === env
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                      >
                                        {env === 'Indoor' ? '🏢' : '🌧️'} {env}
                                      </button>
                                    ))}
                                    {activeFilters.environment && (
                                      <button
                                        onClick={() => clearFilterType('environment')}
                                        className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                      >
                                        All Environments
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Connector Type Filters */}
                              {smartFilters.connectorTypes && smartFilters.connectorTypes.length > 0 && (
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

                              {/* Fiber Type Filters */}
                              {smartFilters.fiberTypes && smartFilters.fiberTypes.length > 0 && (
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-gray-600 block mb-1">Fiber Types:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      // Extract individual fiber types from all products
                                      const uniqueFiberTypes = extractUniqueFiberTypes(message.products || [])
                                      return uniqueFiberTypes.map(fiberType => (
                                        <button
                                          key={fiberType}
                                          onClick={() => applySmartFilter('fiberType', fiberType)}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            activeFilters.fiberType === fiberType
                                              ? 'bg-purple-600 text-white'
                                              : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
                                          }`}
                                        >
                                          {fiberType}
                                        </button>
                                      ))
                                    })()}
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

                              {/* Additional filters for other properties if needed */}
                            </div>
                          )}

                          {/* Product Table */}
                          {message.products && message.products.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                <table className="w-full min-w-max">
                                  <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr className="text-xs text-gray-700">
                                      <th className="px-2 py-2 text-center font-medium w-16">Add</th>
                                      <th className="px-1 py-2 text-center font-medium w-8"></th>
                                      <th className="px-2 py-2 text-left font-medium w-24">Part #</th>
                                      <th className="px-2 py-2 text-left font-medium w-20">Brand</th>
                                      <th className="px-3 py-2 text-left font-medium min-w-96">Description</th>
                                      {productsToDisplay.some(p => p.tableName === 'rack_mount_fiber_enclosure') ? (
                                        <>
                                          <th className="px-2 py-2 text-center font-medium w-20">Panel Type</th>
                                          <th className="px-2 py-2 text-center font-medium w-20">Rack Units</th>
                                          <th className="px-2 py-2 text-center font-medium w-20">Capacity</th>
                                          <th className="px-2 py-2 text-center font-medium w-20">Environment</th>
                                        </>
                                      ) : (
                                        <>
                                          <th className="px-2 py-2 text-center font-medium w-20">Category</th>
                                          <th className="px-2 py-2 text-center font-medium w-20">Type</th>
                                          <th className="px-2 py-2 text-center font-medium w-20">Feature</th>
                                          <th className="px-2 py-2 text-center font-medium w-16">Info</th>
                                        </>
                                      )}
                                      <th className="px-2 py-2 text-right font-medium w-20">Price</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(productsToDisplay.length > 0 ? productsToDisplay : message.products).map((product, index) => (
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
                                          >
                                            Add
                                          </button>
                                        </td>
                                        <td className="px-1 py-2 text-center">
                                          <StockStatusButton product={product} />
                                        </td>
                                        <td className="px-2 py-2 text-xs font-medium text-gray-900">
                                          {product.partNumber}
                                        </td>
                                        <td className="px-2 py-2 text-xs text-gray-700">{product.brand}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 min-w-96">
                                          <div className="whitespace-normal leading-tight">
                                            {product.description}
                                          </div>
                                        </td>
                                        {product.tableName === 'rack_mount_fiber_enclosure' ? (
                                          <>
                                            <td className="px-2 py-2 text-center">
                                              <span className="bg-blue-100 text-blue-700 px-1 py-1 rounded text-xs">
                                                {product.panelType || '-'}
                                              </span>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                              <span className="bg-slate-100 text-slate-700 px-1 py-1 rounded text-xs">
                                                {product.rackUnits ? `${product.rackUnits}RU` : '-'}
                                              </span>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                              <span className="bg-purple-100 text-purple-700 px-1 py-1 rounded text-xs">
                                                {product.panelCapacity ? `${product.panelCapacity} panels` : '-'}
                                              </span>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                              <span className={`px-1 py-1 rounded text-xs ${
                                                product.environment === 'Outdoor'
                                                  ? 'bg-emerald-100 text-emerald-700' 
                                                  : 'bg-gray-100 text-gray-700'
                                              }`}>
                                                {product.environment || 'Indoor'}
                                              </span>
                                            </td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="px-2 py-2 text-center">
                                              <span className="bg-green-100 text-green-700 px-1 py-1 rounded text-xs">
                                                {product.categoryRating || product.category || '-'}
                                              </span>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                              <span className="bg-blue-100 text-blue-700 px-1 py-1 rounded text-xs">
                                                {product.productType || '-'}
                                              </span>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                              <span className="bg-gray-100 text-gray-700 px-1 py-1 rounded text-xs">
                                                {product.productLine || '-'}
                                              </span>
                                            </td>
                                            <td className="px-2 py-2 text-center text-xs">
                                              {product.color || '-'}
                                            </td>
                                          </>
                                        )}
                                        <td className="px-2 py-2 text-xs font-medium text-right">
                                          ${product.price?.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Stock Status Legend */}
                              <div className="bg-gray-50 border-t border-gray-200 p-3">
                                <h4 className="text-xs font-medium text-gray-700 mb-2">Stock Status Legend:</h4>
                                <div className="flex flex-wrap gap-4 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                    <span>In Stock - Same Day (Branch/DC)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span>Available - Other Locations</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                    <span>Special Order</span>
                                  </div>
                                </div>
                              </div>

                               {/* FIBER TYPE REFERENCE - Shows when conditions are met */}
                                {(() => {
                                  // Check if we're showing fiber optic cables
                                    const showingFiberCables = message.products.some(p =>
                                  p.category === 'Fiber Optic Cable'
                                  )

                                // Count unique fiber types in smart filters
                                const uniqueFiberTypes = extractUniqueFiberTypes(message.products || [])
                                const hasTwoOrMoreFiberTypes = uniqueFiberTypes.length >= 2

                                // Show reference if both conditions are met
                                if (showingFiberCables && hasTwoOrMoreFiberTypes) {
                                  return <FiberTypeReference />
                                }

                                return null
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
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
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    placeholder="Search for more products..."
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
                  Search
                </button>
              </div>
              <button
                type="button"
                onClick={clearConversation}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Clear Conversation
              </button>
            </div>
          )}
        </div>

        {/* Product List */}
        {hasListItems && (
          <div className="w-2/5 border-l border-gray-200 bg-white flex flex-col">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
              <p className="text-sm text-gray-600">{productList.length} items • {totalItems} total qty</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
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
                          {item.panelType && (
                            <p className="text-xs text-blue-600">📦 {item.panelType}</p>
                          )}
                          {item.rackUnits && (
                            <p className="text-xs text-slate-600">🏗️ {item.rackUnits}RU</p>
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
                      <td className="px-3 py-2 text-right text-sm font-medium">
                        ${((item.price || 0) * item.quantity).toFixed(2)}
                      </td>
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