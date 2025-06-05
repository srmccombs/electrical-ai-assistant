// PlecticAI.tsx - Complete working file with Fiber Enclosure support
// Updated: December 19, 2024

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter, Brain, Shield, Database, Cpu, Activity, Copy } from 'lucide-react'

// FIXED IMPORTS - Make sure the path matches your project structure
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
      title={product.stockMessage || 'Stock information'}
    >
      {getButtonText()}
    </button>
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
    "GenSPEED 5000",
    "GenSPEED 6",
    "Fiber Optic Connectors",
    "LC Connectors",
    "Corning",
    "OM4 Connectors",
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
    await handleSubmit()
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
                Enhanced with Fiber Enclosures
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

                          {/* Smart Filters */}
                          {smartFilters && message.products && message.products.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Filter size={16} className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Smart Filters</span>
                                <span className="text-xs text-blue-600">
                                  ({productsToDisplay.length} of {message.products.length} products)
                                </span>
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
                                  </div>
                                </div>
                              )}

                              {/* Panel Type Filters */}
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
                                  </div>
                                </div>
                              )}

                              {/* Rack Units Filters */}
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
                                  </div>
                                </div>
                              )}

                              {/* Environment Filters */}
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
                                  </div>
                                </div>
                              )}
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
                                      <th className="px-2 py-2 text-center font-medium w-24">Stock</th>
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
                                        <td className="px-2 py-2 text-center">
                                          <StockStatusButton product={product} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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