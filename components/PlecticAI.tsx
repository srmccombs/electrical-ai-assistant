// PlecticAI.tsx - SIMPLIFIED VERSION WITH FIBER TYPE REFERENCE AND DEBUG MODE
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

import { trackResultClick } from '../services/analytics'
import { searchProducts } from '../services/searchService'
import { logger, LogCategory } from '../utils/logger'

// Import all types from the new types package
import type {
  Product,
  ListItem,
  Message,
  SmartFilters,
  ActiveFilters,
  AISearchAnalysis,
  StockStatus,
  DebugInfo
} from '../types'

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
          <p className="text-sm text-gray-600 mt-1">Searching for: "{searchTerm}"</p>
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
  const [messageFilters, setMessageFilters] = useState<Record<string, { activeFilters: ActiveFilters, filteredProducts: Product[] }>>({})

  // DEBUG MODE STATES - NEW
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [lastSearchDebug, setLastSearchDebug] = useState<DebugInfo | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Computed values
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
      'office white': isActive ? 'bg-gray-200 text-black border-2 border-gray-400' : 'bg-white text-black border border-gray-300 hover:bg-gray-100',
      'black': isActive ? 'bg-black text-white' : 'bg-gray-800 text-white hover:bg-black',
      'gray': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
      'grey': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
      'purple': isActive ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white hover:bg-purple-600',
      'pink': isActive ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white hover:bg-pink-600',
      'violet': isActive ? 'bg-violet-600 text-white' : 'bg-violet-500 text-white hover:bg-violet-600',
      'brown': isActive ? 'bg-amber-700 text-white' : 'bg-amber-600 text-white hover:bg-amber-700',
      'silver': isActive ? 'bg-gray-400 text-black' : 'bg-gray-300 text-black hover:bg-gray-400',
      'gold': isActive ? 'bg-yellow-700 text-white' : 'bg-yellow-600 text-white hover:bg-yellow-700',
      'ivory': isActive ? 'bg-yellow-100 text-gray-800 border border-yellow-300' : 'bg-yellow-50 text-gray-800 border border-yellow-200 hover:bg-yellow-100',
      'electric ivory': isActive ? 'bg-yellow-100 text-gray-800 border border-yellow-300' : 'bg-yellow-50 text-gray-800 border border-yellow-200 hover:bg-yellow-100',
      'light almond': isActive ? 'bg-orange-200 text-gray-800' : 'bg-orange-100 text-gray-800 hover:bg-orange-200',
      'international white': isActive ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100',
      'international gray': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
      'arctic white': isActive ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100'
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
  const handleAddToList = (product: Product) => {
    // Track the click (fire and forget)
    trackResultClick({
      searchTerm: currentSearchTerm,
      clickedPartNumber: product.partNumber
    }).catch(error => logger.error('Failed to track click', error, LogCategory.ANALYTICS))

    // Log the action
    logger.info('Product added to list', {
      partNumber: product.partNumber,
      brand: product.brand
    }, LogCategory.UI)

    // Determine quantity to add - use AI detected quantity if available
    let quantityToAdd = 1
    if (aiAnalysis?.detectedSpecs?.requestedQuantity) {
      quantityToAdd = aiAnalysis.detectedSpecs.requestedQuantity
      logger.info('Using AI detected quantity', { 
        quantity: quantityToAdd,
        partNumber: product.partNumber 
      }, LogCategory.UI)
    }

    // Your existing add to list logic
    const existingIndex = productList.findIndex(
      item => item.partNumber === product.partNumber
    )

    if (existingIndex !== -1) {
      setProductList(prev => {
        const newList = [...prev]
        newList[existingIndex] = {
          ...newList[existingIndex],
          quantity: newList[existingIndex].quantity + quantityToAdd
        }
        return newList
      })
    } else {
      setProductList(prev => [
        ...prev,
        {
          ...product,
          quantity: quantityToAdd,
          addedAt: new Date()
        }
      ])
    }
  }

  // Also track clicks when users click on a product for details
  const handleProductClick = (product: Product) => {
    // Track the click
    trackResultClick({
      searchTerm: currentSearchTerm,
      clickedPartNumber: product.partNumber
    }).catch(error => logger.error('Failed to track click', error, LogCategory.ANALYTICS))

    logger.debug('Product clicked', { partNumber: product.partNumber }, LogCategory.UI)
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
    logger.debug('Product removed from list', { id }, LogCategory.UI)
  }

  const sendList = (): void => {
    alert('List sent! (This would email/text the list in production)')
    logger.track('list_sent', {
      itemCount: productList.length,
      totalQuantity: totalItems
    })
  }

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: You could show a toast notification here
      logger.info('Copied to clipboard', { text }, LogCategory.UI)
    }).catch(err => {
      logger.error('Failed to copy', err, LogCategory.UI)
    })
  }

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const clearConversation = (): void => {
    setMessages([])
    setAiAnalysis(null)
    setMessageFilters({})
    logger.info('Conversation cleared', {}, LogCategory.UI)
  }

  // Helper function to get available filter values based on current filtered products
  const getDynamicFilterOptions = (products: Product[], filterType: string): string[] => {
    const filterString = (items: (string | undefined)[]): string[] =>
      Array.from(new Set(items.filter((item): item is string => Boolean(item))))

    switch (filterType) {
      case 'brand':
        return filterString(products.map(p => p.brand))
      case 'productLine':
        return filterString(products.map(p => p.productLine))
      case 'categoryRating':
        return filterString(products.map(p => p.categoryRating))
      case 'color':
        return filterString(products.map(p => p.jacketColor || p.color))
      case 'shielding':
        return filterString(products.map(p => p.shielding))
      case 'jacketRating':
        return filterString(products.map(p => p.jacketRating))
      case 'panelType':
        return filterString(products.map(p => p.panelType))
      case 'rackUnits':
        return filterString(products.map(p => p.rackUnits?.toString()))
      case 'environment':
        return filterString(products.map(p => p.environment))
      case 'connectorType':
        return filterString(products.map(p => p.connectorType))
      case 'fiberType':
        const allFiberTypes = new Set<string>()
        products.forEach(product => {
          if (product.fiberType) {
            const fiberTypeStr = Array.isArray(product.fiberType)
              ? product.fiberType.join(', ')
              : product.fiberType.toString()
            const types = fiberTypeStr.replace(/[\[\]]/g, '').split(',').map(type => type.trim()).filter(type => type && type !== '-')
            types.forEach(type => allFiberTypes.add(type))
          }
        })
        return Array.from(allFiberTypes).sort()
      case 'packagingType':
        return filterString(products.map(p => p.packagingType))
      case 'productType':
        return filterString(products.map(p => p.productType))
      case 'technology':
        return filterString(products.map(p => p.technology))
      case 'polish':
        return filterString(products.map(p => p.polish))
      case 'housingColor':
        return filterString(products.map(p => p.housingColor))
      case 'bootColor':
        return filterString(products.map(p => p.bootColor))
      case 'pairCount':
        return filterString(products.map(p => p.pairCount))
      case 'conductorGauge':
        return filterString(products.map(p => p.conductorAwg?.toString()))
      case 'application':
        return filterString(products.map(p => p.application))
      case 'terminationType':
        return filterString(products.map(p => p.terminationType))
      case 'adapterColor':
        return filterString(products.map(p => p.adapterColor))
      case 'mountType':
        return filterString(products.map(p => p.mountType))
      default:
        return []
    }
  }

  // Helper component for dynamic filter sections
  const DynamicFilterSection = ({ 
    messageId, 
    filterType, 
    label, 
    activeColor, 
    inactiveColor,
    icon = '',
    customButtonStyle
  }: { 
    messageId: string, 
    filterType: string, 
    label: string, 
    activeColor: string, 
    inactiveColor: string,
    icon?: string,
    customButtonStyle?: (value: string, isActive: boolean) => string
  }) => {
    const currentProducts = messageFilters[messageId]?.filteredProducts || messages.find(m => m.id === messageId)?.products || []
    const availableOptions = getDynamicFilterOptions(currentProducts, filterType)
    const isActive = (value: string) => messageFilters[messageId]?.activeFilters[filterType] === value
    
    if (availableOptions.length === 0) return null
    
    return (
      <div className="mb-3">
        <span className="text-xs font-medium text-gray-600 block mb-1">{label}:</span>
        <div className="flex flex-wrap gap-1">
          {availableOptions.map(option => (
            <button
              key={option}
              onClick={() => {
                const message = messages.find(m => m.id === messageId)
                if (message) {
                  applySmartFilter(messageId, filterType, option, message.products || [])
                }
              }}
              className={customButtonStyle 
                ? customButtonStyle(option, isActive(option))
                : `px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isActive(option)
                      ? activeColor
                      : inactiveColor
                  }`
              }
            >
              {icon} {option}
            </button>
          ))}
          {messageFilters[messageId]?.activeFilters[filterType] && (
            <button
              onClick={() => {
                const message = messages.find(m => m.id === messageId)
                if (message) {
                  clearFilterType(messageId, filterType, message.products || [])
                }
              }}
              className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
            >
              All {label}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ⚠️ DO NOT SIMPLIFY - This comprehensive filter function handles all product types
  const applySmartFilter = (messageId: string, filterType: string, value: string, products: Product[]): void => {
    const currentMsgFilters = messageFilters[messageId] || { activeFilters: {}, filteredProducts: products }
    const newFilters = { ...currentMsgFilters.activeFilters }
    
    if (newFilters[filterType] === value) {
      delete newFilters[filterType]
    } else {
      newFilters[filterType] = value
    }

    logger.debug('Filter applied', { filterType, value, messageId }, LogCategory.UI)

    let filtered = products
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
          case 'terminationType': return product.terminationType === filterValue
          case 'adapterColor': return product.adapterColor === filterValue
          case 'mountType': return product.mountType === filterValue
          default: return true
        }
      })
    })
    
    setMessageFilters(prev => ({
      ...prev,
      [messageId]: { activeFilters: newFilters, filteredProducts: filtered }
    }))
  }

  // ⚠️ DO NOT REMOVE - Clears all active filters
  const clearAllFilters = (messageId: string, products: Product[]): void => {
    setMessageFilters(prev => ({
      ...prev,
      [messageId]: { activeFilters: {}, filteredProducts: products }
    }))
    logger.debug('All filters cleared', { messageId }, LogCategory.UI)
  }

  // ⚠️ DO NOT REMOVE - Clears a specific filter type
  const clearFilterType = (messageId: string, filterType: string, products: Product[]): void => {
    const currentMsgFilters = messageFilters[messageId] || { activeFilters: {}, filteredProducts: products }
    const newFilters = { ...currentMsgFilters.activeFilters }
    delete newFilters[filterType]

    // Re-apply remaining filters
    let filtered = products
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
          case 'terminationType': return product.terminationType === filterValue
          case 'adapterColor': return product.adapterColor === filterValue
          case 'mountType': return product.mountType === filterValue
          default: return true
        }
      })
    })
    
    setMessageFilters(prev => ({
      ...prev,
      [messageId]: { activeFilters: newFilters, filteredProducts: filtered }
    }))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!input.trim() || isLoading) return

    logger.searchStart(input)

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
      const endTimer = logger.startTimer('Search execution')

      const searchResult = await searchProducts({
        query: originalInput,
        limit: 500, // Increased to show more products - users can filter
        includeAI: true
      })

      const searchDuration = endTimer()

      const { products, searchTime, searchType, aiAnalysis: searchAiAnalysis, redirectMessage, smartFilters: resultFilters } = searchResult

      logger.searchComplete(originalInput, products.length, searchDuration)

      // CAPTURE DEBUG INFO
      if (debugMode) {
        const debugInfo: DebugInfo = {
          query: originalInput,
          timestamp: new Date().toISOString(),
          searchType: searchType,
          searchTime: searchTime,
          totalFound: products.length,
          aiAnalysis: searchAiAnalysis,
          redirectMessage: redirectMessage,
          smartFilters: resultFilters,
          tablesSearched: searchType,
          productTypes: products.length > 0 ?
            [...new Set(products.map(p => p.tableName || 'unknown'))].join(', ') :
            'none'
        }
        setLastSearchDebug(debugInfo)
      }

      setLastSearchTime(searchTime)
      setAiAnalysis(searchAiAnalysis || null)

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
      logger.error('Search failed', error, LogCategory.SEARCH)
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
              {totalItems.toLocaleString()} items in list
            </div>
          )}
        </div>
      </header>

      {/* DEBUG MODE TOGGLE - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`fixed bottom-4 right-4 z-40 px-4 py-2 rounded-lg font-medium text-sm shadow-lg transition-all ${
            debugMode 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-800 text-white hover:bg-gray-900'
          }`}
        >
          🐛 Debug: {debugMode ? 'ON' : 'OFF'}
        </button>
      )}

      {/* DEBUG PANEL - Shows search internals when debug mode is on */}
      {debugMode && lastSearchDebug && (
        <div className="fixed bottom-20 right-4 z-40 w-96 max-h-96 overflow-auto bg-black text-green-400 p-4 rounded-lg shadow-2xl font-mono text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">🔍 Search Debug Info</h3>
            <button
              onClick={() => setLastSearchDebug(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-yellow-400">Query:</span> "{lastSearchDebug.query}"
            </div>

            <div>
              <span className="text-yellow-400">Search Type:</span> {lastSearchDebug.searchType}
            </div>

            <div>
              <span className="text-yellow-400">Time:</span> {lastSearchDebug.searchTime}ms
            </div>

            <div>
              <span className="text-yellow-400">Results:</span> {lastSearchDebug.totalFound} products
            </div>

            <div>
              <span className="text-yellow-400">Tables:</span> {lastSearchDebug.productTypes}
            </div>

            {lastSearchDebug.redirectMessage && (
              <div>
                <span className="text-yellow-400">Redirect:</span> {lastSearchDebug.redirectMessage}
              </div>
            )}

            {lastSearchDebug.aiAnalysis && (
              <div className="mt-3 pt-3 border-t border-green-600">
                <div className="text-yellow-400 mb-1">AI Analysis:</div>
                <div className="pl-2 space-y-1">
                  <div><span className="text-blue-400">Product Type:</span> {lastSearchDebug.aiAnalysis.productType}</div>
                  <div><span className="text-blue-400">Confidence:</span> {(lastSearchDebug.aiAnalysis.confidence * 100).toFixed(0)}%</div>
                  <div><span className="text-blue-400">Strategy:</span> {lastSearchDebug.aiAnalysis.searchStrategy}</div>

                  {lastSearchDebug.aiAnalysis.detectedSpecs && Object.keys(lastSearchDebug.aiAnalysis.detectedSpecs).length > 0 && (
                    <div className="mt-2">
                      <div className="text-blue-400">Detected Specs:</div>
                      <div className="pl-2">
                        {Object.entries(lastSearchDebug.aiAnalysis.detectedSpecs).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            {key}: {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                          {message.smartFilters && message.products && message.products.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Filter size={16} className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Smart Filters</span>
                                <span className="text-xs text-blue-600">
                                  ({(messageFilters[message.id]?.filteredProducts || message.products || []).length} of {(message.products || []).length} products)
                                </span>
                                {Object.keys(messageFilters[message.id]?.activeFilters || {}).length > 0 && (
                                  <button
                                    onClick={() => clearAllFilters(message.id, message.products || [])}
                                    className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium"
                                  >
                                    Clear All Filters
                                  </button>
                                )}
                              </div>

                              {/* Brand Filters - Dynamic based on filtered products */}
                              {(() => {
                                const currentProducts = messageFilters[message.id]?.filteredProducts || message.products || []
                                const availableBrands = getDynamicFilterOptions(currentProducts, 'brand')
                                return availableBrands.length > 0 && (
                                  <div className="mb-3">
                                    <span className="text-xs font-medium text-gray-600 block mb-1">Brands:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {availableBrands.map(brand => (
                                        <button
                                          key={brand}
                                          onClick={() => applySmartFilter(message.id, 'brand', brand, message.products || [])}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            messageFilters[message.id]?.activeFilters.brand === brand
                                              ? 'bg-blue-600 text-white'
                                              : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                                          }`}
                                        >
                                          {brand}
                                        </button>
                                      ))}
                                      {messageFilters[message.id]?.activeFilters.brand && (
                                        <button
                                          onClick={() => clearFilterType(message.id, 'brand', message.products || [])}
                                          className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                        >
                                          All Brands
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* Product Line Filters - Dynamic based on filtered products */}
                              {(() => {
                                const currentProducts = messageFilters[message.id]?.filteredProducts || message.products || []
                                const availableProductLines = getDynamicFilterOptions(currentProducts, 'productLine')
                                return availableProductLines.length > 0 && (
                                  <div className="mb-3">
                                    <span className="text-xs font-medium text-gray-600 block mb-1">Product Lines:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {availableProductLines.map(productLine => (
                                        <button
                                          key={productLine}
                                          onClick={() => applySmartFilter(message.id, 'productLine', productLine, message.products || [])}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            messageFilters[message.id]?.activeFilters.productLine === productLine
                                              ? 'bg-indigo-600 text-white'
                                              : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                                          }`}
                                        >
                                          📋 {productLine}
                                        </button>
                                      ))}
                                      {messageFilters[message.id]?.activeFilters.productLine && (
                                        <button
                                          onClick={() => clearFilterType(message.id, 'productLine', message.products || [])}
                                          className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                        >
                                          All Product Lines
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* Category Rating Filters - Dynamic */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="categoryRating"
                                label="Categories"
                                activeColor="bg-green-600 text-white"
                                inactiveColor="bg-white border border-green-300 text-green-700 hover:bg-green-100"
                                icon="📊"
                              />

                              {/* Jacket Rating Filters - Dynamic */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="jacketRating"
                                label="Jacket Ratings"
                                activeColor="bg-orange-600 text-white"
                                inactiveColor="bg-white border border-orange-300 text-orange-700 hover:bg-orange-100"
                                icon="🧥"
                              />

                              {/* ⚠️ DO NOT REMOVE - Color filters with actual cable colors as backgrounds */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="color"
                                label="Colors"
                                activeColor=""
                                inactiveColor=""
                                customButtonStyle={getColorButtonStyle}
                              />

                              {/* Shielding Type Filters - Dynamic */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="shielding"
                                label="Shielding Type"
                                activeColor="bg-purple-600 text-white"
                                inactiveColor="bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
                                icon="🛡️"
                              />

                              {/* Panel Type Filters - Dynamic */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="panelType"
                                label="Panel Types"
                                activeColor="bg-cyan-600 text-white"
                                inactiveColor="bg-white border border-cyan-300 text-cyan-700 hover:bg-cyan-100"
                                icon="📦"
                              />

                              {/* Rack Units Filters - Dynamic */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="rackUnits"
                                label="Rack Units"
                                activeColor="bg-slate-600 text-white"
                                inactiveColor="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                                icon="🏗️"
                              />

                              {/* Environment Filters - Dynamic with custom icons */}
                              {(() => {
                                const currentProducts = messageFilters[message.id]?.filteredProducts || message.products || []
                                const availableEnvironments = getDynamicFilterOptions(currentProducts, 'environment')
                                const isActive = (value: string) => messageFilters[message.id]?.activeFilters.environment === value
                                
                                if (availableEnvironments.length === 0) return null
                                
                                return (
                                  <div className="mb-3">
                                    <span className="text-xs font-medium text-gray-600 block mb-1">Environment:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {availableEnvironments.map(env => (
                                        <button
                                          key={env}
                                          onClick={() => applySmartFilter(message.id, 'environment', env, message.products || [])}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            isActive(env)
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                          }`}
                                        >
                                          {env === 'Indoor' ? '🏢' : '🌧️'} {env}
                                        </button>
                                      ))}
                                      {messageFilters[message.id]?.activeFilters.environment && (
                                        <button
                                          onClick={() => clearFilterType(message.id, 'environment', message.products || [])}
                                          className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                                        >
                                          All Environment
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* Connector Type Filters - Dynamic */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="connectorType"
                                label="Connector Types"
                                activeColor="bg-blue-600 text-white"
                                inactiveColor="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
                                icon="🔌"
                              />

                              {/* Fiber Type Filters - Dynamic */}
                              <DynamicFilterSection
                                messageId={message.id}
                                filterType="fiberType"
                                label="Fiber Types"
                                activeColor="bg-purple-600 text-white"
                                inactiveColor="bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
                              />

                              {/* Additional dynamic filters for other product-specific properties */}
                              
                              {/* Packaging Type Filters - Dynamic */}
                              {message.smartFilters.packagingTypes && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="packagingType"
                                  label="Packaging Types"
                                  activeColor="bg-indigo-600 text-white"
                                  inactiveColor="bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                                  icon="📦"
                                />
                              )}

                              {/* Product Type Filters - Dynamic */}
                              {message.smartFilters.productTypes && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="productType"
                                  label="Product Types"
                                  activeColor="bg-violet-600 text-white"
                                  inactiveColor="bg-white border border-violet-300 text-violet-700 hover:bg-violet-100"
                                />
                              )}

                              {/* Technology Filters - Dynamic */}
                              {message.smartFilters.technologies && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="technology"
                                  label="Technology"
                                  activeColor="bg-teal-600 text-white"
                                  inactiveColor="bg-white border border-teal-300 text-teal-700 hover:bg-teal-100"
                                />
                              )}

                              {/* Polish Type Filters - Dynamic */}
                              {message.smartFilters.polishTypes && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="polish"
                                  label="Polish Types"
                                  activeColor="bg-amber-600 text-white"
                                  inactiveColor="bg-white border border-amber-300 text-amber-700 hover:bg-amber-100"
                                />
                              )}

                              {/* Housing Color Filters - Dynamic */}
                              {message.smartFilters.housingColors && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="housingColor"
                                  label="Housing Colors"
                                  activeColor=""
                                  inactiveColor=""
                                  customButtonStyle={getColorButtonStyle}
                                />
                              )}

                              {/* Boot Color Filters - Dynamic */}
                              {message.smartFilters.bootColors && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="bootColor"  
                                  label="Boot Colors"
                                  activeColor=""
                                  inactiveColor=""
                                  customButtonStyle={getColorButtonStyle}
                                />
                              )}

                              {/* Pair Count Filters - Dynamic */}
                              {message.smartFilters.pairCounts && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="pairCount"
                                  label="Pair Counts"
                                  activeColor="bg-stone-600 text-white"
                                  inactiveColor="bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                                />
                              )}

                              {/* Conductor Gauge Filters - Dynamic */}
                              {message.smartFilters.conductorGauges && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="conductorGauge"
                                  label="Conductor AWG"
                                  activeColor="bg-zinc-600 text-white"
                                  inactiveColor="bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                />
                              )}

                              {/* Application Filters - Dynamic */}
                              {message.smartFilters.applications && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="application"
                                  label="Applications"
                                  activeColor="bg-sky-600 text-white"
                                  inactiveColor="bg-white border border-sky-300 text-sky-700 hover:bg-sky-100"
                                />
                              )}

                              {/* Termination Type Filters - Dynamic */}
                              {message.smartFilters.terminationTypes && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="terminationType"
                                  label="Termination Types"
                                  activeColor="bg-rose-600 text-white"
                                  inactiveColor="bg-white border border-rose-300 text-rose-700 hover:bg-rose-100"
                                />
                              )}

                              {/* Adapter Color Filters - Dynamic */}
                              {message.smartFilters.adapterColors && (
                                <DynamicFilterSection
                                  messageId={message.id}
                                  filterType="adapterColor"
                                  label="Adapter Colors"
                                  activeColor=""
                                  inactiveColor=""
                                  customButtonStyle={getColorButtonStyle}
                                />
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
                                      <th className="px-1 py-2 text-center font-medium w-8"></th>
                                      <th className="px-2 py-2 text-left font-medium w-24">Part #</th>
                                      <th className="px-2 py-2 text-left font-medium w-20">Brand</th>
                                      <th className="px-3 py-2 text-left font-medium min-w-96">Description</th>
                                      {(messageFilters[message.id]?.filteredProducts || message.products || []).some(p => p.tableName === 'rack_mount_fiber_enclosures') ? (
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
                                    {(messageFilters[message.id]?.filteredProducts || message.products || []).map((product, index) => (
                                      <tr
                                        key={`${product.partNumber}_${index}`}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleProductClick(product)}
                                      >
                                        <td className="px-2 py-2 text-center">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation() // Prevent row click
                                              handleAddToList(product)
                                            }}
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
                                        {product.tableName === 'rack_mount_fiber_enclosures' ? (
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

                              {/* Search for More Products - Moved here and made prominent */}
                              {messages.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 p-4 mx-4 my-3 rounded-lg">
                                  <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <Search size={16} />
                                    Search for More Products
                                  </h3>
                                  <div className="flex gap-2">
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
                                        placeholder="e.g., '50 ft of OM4 fiber cable' or 'panduit cat6 jacks'..."
                                        className="w-full px-4 py-2 border border-blue-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                                        rows={1}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleSubmit}
                                      disabled={!input.trim() || isLoading}
                                      className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-md ${
                                        input.trim() && !isLoading
                                          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105' 
                                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      }`}
                                    >
                                      <Brain size={16} />
                                      Search
                                    </button>
                                  </div>
                                </div>
                              )}

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

          {/* Clear Conversation Button */}
          {messages.length > 0 && (
            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={clearConversation}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
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
              <p className="text-sm text-gray-600">{productList.length} items • {totalItems.toLocaleString()} total qty</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="text-xs text-gray-700">
                    <th className="px-3 py-2 text-left">Part Number</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((item, index) => (
                    <tr key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2">
                        <div className="flex items-start gap-1">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.partNumber}</p>
                            <p className="text-xs text-gray-500">{item.brand}</p>
                            {item.panelType && (
                              <p className="text-xs text-blue-600">📦 {item.panelType}</p>
                            )}
                            {item.rackUnits && (
                              <p className="text-xs text-slate-600">🏗️ {item.rackUnits}RU</p>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.partNumber)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                            title="Copy part number"
                          >
                            <Copy size={14} />
                          </button>
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
                          <span className="w-16 text-center text-sm font-medium">{item.quantity.toLocaleString()}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-xs text-gray-700 line-clamp-2">{item.description}</p>
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