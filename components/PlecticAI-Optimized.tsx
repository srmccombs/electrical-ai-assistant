// PlecticAI-Optimized.tsx - Performance optimized version with extracted components
// Updated: January 2025
// All electrical industry expertise and features preserved

'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter, Brain, Shield, Database, Cpu, Activity, Copy, ChevronDown, ChevronUp } from 'lucide-react'

import { trackResultClick } from '../services/analytics'
import { searchProducts } from '../services/searchService'
import { logger, LogCategory } from '../utils/logger'

// Import extracted components
import { FilterSection, ProductTable, SearchInput, ShoppingList } from './PlecticAI/index'

// Import all types
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
// FIBER TYPE REFERENCE COMPONENT - Memoized
// ===================================================================

const FiberTypeReference = memo(() => {
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
})

FiberTypeReference.displayName = 'FiberTypeReference'

// ===================================================================
// AI SEARCH LOADING COMPONENT - Memoized
// ===================================================================

interface AISearchLoadingProps {
  searchTerm: string
}

const AISearchLoading = memo<AISearchLoadingProps>(({ searchTerm }) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [dots, setDots] = useState<string>('')

  const searchSteps = useMemo(() => [
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
  ], [])

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
})

AISearchLoading.displayName = 'AISearchLoading'

// ===================================================================
// DEBUG PANEL COMPONENT - Memoized
// ===================================================================

interface DebugPanelProps {
  debugInfo: DebugInfo | null
  onClose: () => void
}

const DebugPanel = memo<DebugPanelProps>(({ debugInfo, onClose }) => {
  if (!debugInfo) return null

  return (
    <div className="fixed bottom-20 right-4 z-40 w-96 max-h-96 overflow-auto bg-black text-green-400 p-4 rounded-lg shadow-2xl font-mono text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">🔍 Search Debug Info</h3>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-yellow-400">Query:</span> {debugInfo.query}
        </div>
        <div>
          <span className="text-yellow-400">Time:</span> {debugInfo.searchTime}ms
        </div>
        <div>
          <span className="text-yellow-400">Type:</span> {debugInfo.searchType}
        </div>
        <div>
          <span className="text-yellow-400">Results:</span> {debugInfo.totalFound}
        </div>
        {debugInfo.redirectMessage && (
          <div>
            <span className="text-yellow-400">Redirect:</span> {debugInfo.redirectMessage}
          </div>
        )}
        {debugInfo.aiAnalysis && (
          <div>
            <span className="text-yellow-400">AI Analysis:</span>
            <pre className="text-cyan-400 text-xs whitespace-pre-wrap mt-1">
              {JSON.stringify(debugInfo.aiAnalysis, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
})

DebugPanel.displayName = 'DebugPanel'

// ===================================================================
// MAIN COMPONENT - Optimized with memoization
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
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({})
  
  // Debug mode states
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [lastSearchDebug, setLastSearchDebug] = useState<DebugInfo | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Computed values with memoization
  const totalItems = useMemo(() => 
    productList.reduce((sum, item) => sum + item.quantity, 0),
    [productList]
  )
  const hasListItems = productList.length > 0

  // Memoized callbacks
  const handleAddToList = useCallback((product: Product) => {
    // Track the click
    trackResultClick({
      searchTerm: currentSearchTerm,
      clickedPartNumber: product.partNumber
    }).catch(error => logger.error('Failed to track click', error, LogCategory.ANALYTICS))

    logger.info('Product added to list', {
      partNumber: product.partNumber,
      brand: product.brand
    }, LogCategory.UI)

    // Determine quantity to add
    let quantityToAdd = 1
    if (aiAnalysis?.detectedSpecs?.requestedQuantity) {
      quantityToAdd = aiAnalysis.detectedSpecs.requestedQuantity
      logger.info('Using AI detected quantity', { 
        quantity: quantityToAdd,
        partNumber: product.partNumber 
      }, LogCategory.UI)
    }

    // Add to list logic
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
  }, [currentSearchTerm, aiAnalysis, productList])

  const updateQuantity = useCallback((id: string, delta: number): void => {
    setProductList(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta)
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
        }
        return item
      }).filter((item): item is ListItem => item !== null)
    })
  }, [])

  const removeFromList = useCallback((id: string): void => {
    setProductList(prev => prev.filter(item => item.id !== id))
    logger.debug('Product removed from list', { id }, LogCategory.UI)
  }, [])

  const sendList = useCallback((): void => {
    alert('List sent! (This would email/text the list in production)')
    logger.track('list_sent', {
      itemCount: productList.length,
      totalQuantity: totalItems
    })
  }, [productList.length, totalItems])

  const copyToClipboard = useCallback((text: string): void => {
    navigator.clipboard.writeText(text).then(() => {
      logger.info('Copied to clipboard', { text }, LogCategory.UI)
    }).catch(err => {
      logger.error('Failed to copy', err, LogCategory.UI)
    })
  }, [])

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const clearConversation = useCallback((): void => {
    setMessages([])
    setAiAnalysis(null)
    setMessageFilters({})
    setExpandedTables({})
    logger.info('Conversation cleared', {}, LogCategory.UI)
  }, [])
  
  const toggleTableExpand = useCallback((messageId: string): void => {
    setExpandedTables(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }, [])

  // Smart filter functions with memoization
  const applySmartFilter = useCallback((messageId: string, filterType: string, value: string, products: Product[]): void => {
    const currentFilters = messageFilters[messageId]?.activeFilters || {}
    const newFilters: ActiveFilters = { ...currentFilters, [filterType]: value }
    
    // Apply all active filters
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
          case 'application': 
            // Check if the filter value exists in the product's application field
            if (!product.application) return false
            // Handle bracketed lists
            if (product.application.startsWith('[') && product.application.endsWith(']')) {
              // Check if the selected application is in the bracketed list
              return product.application.toUpperCase().includes(filterValue.toUpperCase())
            }
            // Handle single values
            return product.application.toUpperCase() === filterValue.toUpperCase()
          case 'fiberType':
            if (!product.fiberType) return false
            const fiberTypeStr = Array.isArray(product.fiberType)
              ? product.fiberType.join(', ')
              : product.fiberType.toString()
            // Clean both the product fiber type and filter value for comparison
            const cleanProductType = fiberTypeStr.replace(/\[|\]/g, '').toLowerCase()
            const cleanFilterValue = filterValue.replace(/\[|\]/g, '').toLowerCase()
            return cleanProductType.includes(cleanFilterValue)
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
          case 'fiberCount': return product.fiberCount?.toString() === filterValue
          default: return true
        }
      })
    })
    
    setMessageFilters(prev => ({
      ...prev,
      [messageId]: { activeFilters: newFilters, filteredProducts: filtered }
    }))
  }, [messageFilters])

  const clearFilterType = useCallback((messageId: string, filterType: string, products: Product[]): void => {
    const currentFilters = messageFilters[messageId]?.activeFilters || {}
    const newFilters = { ...currentFilters }
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
          case 'application': 
            // Check if the filter value exists in the product's application field
            if (!product.application) return false
            // Handle bracketed lists
            if (product.application.startsWith('[') && product.application.endsWith(']')) {
              // Check if the selected application is in the bracketed list
              return product.application.toUpperCase().includes(filterValue.toUpperCase())
            }
            // Handle single values
            return product.application.toUpperCase() === filterValue.toUpperCase()
          case 'fiberType':
            if (!product.fiberType) return false
            const fiberTypeStr = Array.isArray(product.fiberType)
              ? product.fiberType.join(', ')
              : product.fiberType.toString()
            // Clean both the product fiber type and filter value for comparison
            const cleanProductType = fiberTypeStr.replace(/\[|\]/g, '').toLowerCase()
            const cleanFilterValue = filterValue.replace(/\[|\]/g, '').toLowerCase()
            return cleanProductType.includes(cleanFilterValue)
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
          case 'fiberCount': return product.fiberCount?.toString() === filterValue
          default: return true
        }
      })
    })
    
    setMessageFilters(prev => ({
      ...prev,
      [messageId]: { activeFilters: newFilters, filteredProducts: filtered }
    }))
  }, [messageFilters])

  const handleSubmit = useCallback(async (): Promise<void> => {
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

      // Check if search is for compatible products
      const searchLower = originalInput.toLowerCase()
      const isSearchingForCompatibleProducts = 
        searchLower.includes('faceplate') || 
        searchLower.includes('face plate') || 
        searchLower.includes('wall plate') ||
        searchLower.includes('surface mount') ||
        searchLower.includes('surface box') ||
        searchLower.includes('adapter panel') ||
        searchLower.includes('adapter panels') ||
        searchLower.includes('fiber panel') ||
        searchLower.includes('mounting box') ||
        searchLower.includes('jack') ||
        searchLower.includes('keystone') ||
        searchLower.includes('mini-com') ||
        searchLower.includes('minicom') ||
        searchLower.includes('fiber connector') ||
        searchLower.includes('lc connector') ||
        searchLower.includes('sc connector') ||
        searchLower.includes('st connector') ||
        searchLower.includes('fc connector') ||
        searchLower.includes('mtp connector') ||
        searchLower.includes('mpo connector')

      // Prepare shopping list context
      let shoppingListContext = undefined
      if (isSearchingForCompatibleProducts && productList.length > 0) {
        const categoryCables = productList
          .filter(item => item.category === 'Ethernet Cable' || item.tableName === 'category_cables')
          .map(item => ({
            partNumber: item.partNumber,
            categoryRating: item.categoryRating || '',
            brand: item.brand,
            description: item.description
          }))

        const jackModules = productList
          .filter(item => item.category === 'Jack Module' || item.tableName === 'jack_modules' || item.productType === 'Jack Module')
          .map(item => ({
            partNumber: item.partNumber,
            categoryRating: item.categoryRating || '',
            brand: item.brand,
            productLine: item.productLine || '',
            compatibleFaceplates: item.compatibleFaceplates || '',
            description: item.description
          }))

        const fiberEnclosures = productList
          .filter(item => 
            item.tableName === 'rack_mount_fiber_enclosures' || 
            item.tableName === 'wall_mount_fiber_enclosures' ||
            item.category === 'Fiber Enclosure' ||
            item.productType?.includes('Fiber Enclosure')
          )
          .map(item => ({
            partNumber: item.partNumber,
            panelType: item.panelType || '',
            brand: item.brand,
            description: item.description,
            tableName: item.tableName || ''
          }))

        const fiberCables = productList
          .filter(item => 
            item.tableName === 'fiber_cables' || 
            item.category === 'Fiber Cable' ||
            item.productType?.includes('Fiber Cable') ||
            (item.description?.toLowerCase().includes('fiber cable') || 
             item.description?.toLowerCase().includes('fiber optic cable'))
          )
          .map(item => ({
            partNumber: item.partNumber,
            fiberType: item.fiberType || '',
            brand: item.brand,
            description: item.description
          }))

        if (categoryCables.length > 0 || jackModules.length > 0 || fiberEnclosures.length > 0 || fiberCables.length > 0) {
          shoppingListContext = {
            hasItems: true,
            categoryCables,
            jackModules,
            fiberEnclosures,
            fiberCables
          }
          
          logger.info('Including shopping list context for compatibility', {
            searchType: isSearchingForCompatibleProducts ? 'compatible product' : 'standard',
            categoryCablesCount: categoryCables.length,
            jackModulesCount: jackModules.length,
            fiberEnclosuresCount: fiberEnclosures.length,
            fiberCablesCount: fiberCables.length
          }, LogCategory.SEARCH)
        }
      }

      const searchResult = await searchProducts({
        query: originalInput,
        limit: 500,
        includeAI: true,
        shoppingListContext
      })

      const searchDuration = endTimer()
      const { products, searchTime, searchType, aiAnalysis: searchAiAnalysis, redirectMessage, smartFilters: resultFilters } = searchResult

      logger.searchComplete(originalInput, products.length, searchDuration)

      // Capture debug info
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
      
      // Add cross-reference specific message
      if (searchType === 'cross_reference' && searchResult.crossReferenceInfo) {
        const { sourcePartNumber, targetBrand, crossesFound } = searchResult.crossReferenceInfo
        assistantContent = `🔄 Cross-Reference Results for ${sourcePartNumber}${targetBrand ? ` in ${targetBrand}` : ''}\n\n`
        assistantContent += `Found ${crossesFound} equivalent products${redirectMessage ? `\n${redirectMessage}` : ''}`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date(),
        smartFilters: resultFilters,
        redirectMessage: redirectMessage,
        autoApplyFilters: searchResult.autoApplyFilters
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Auto-apply filters if provided - with a small delay to ensure message is rendered
      if (searchResult.autoApplyFilters && products.length > 0) {
        setTimeout(() => {
          const messageId = assistantMessage.id
          // Log available fiber types for debugging
          const availableFiberTypes = new Set<string>()
          products.forEach(product => {
            if (product.fiberType) {
              const fiberTypeStr = Array.isArray(product.fiberType)
                ? product.fiberType.join(', ')
                : product.fiberType.toString()
              
              const types = fiberTypeStr.split(',').map(t => t.trim()).filter(t => t && t !== '-')
              types.forEach(type => {
                // Clean up fiber types by removing brackets
                const cleanType = type.replace(/\[|\]/g, '').trim()
                if (cleanType.length > 0) {
                  availableFiberTypes.add(cleanType)
                }
              })
            }
          })
          
          logger.info('Available fiber types in products', { 
            fiberTypes: Array.from(availableFiberTypes),
            productCount: products.length,
            autoApplyFilters: searchResult.autoApplyFilters
          }, LogCategory.UI)
          
          // Apply each auto-filter
          if (searchResult.autoApplyFilters) {
            Object.entries(searchResult.autoApplyFilters).forEach(([filterType, value]) => {
              logger.info('Auto-applying filter', { messageId, filterType, value }, LogCategory.UI)
              applySmartFilter(messageId, filterType, value, products)
            })
          }
          
          // Force another small delay to ensure state updates are visible
          setTimeout(() => {
            const currentFilters = messageFilters[messageId]?.activeFilters || {}
            logger.info('Filters after auto-apply', {
              messageId,
              activeFilters: currentFilters,
              hasAutoApplied: Object.keys(currentFilters).length > 0
            }, LogCategory.UI)
          }, 100)
        }, 50) // Small delay to ensure message is in DOM
      }

      // Save recent search
      setRecentSearches(prev => {
        const updated = [originalInput, ...prev.filter(s => s !== originalInput)].slice(0, 5)
        return updated
      })

    } catch (error) {
      logger.error('Search error', error, LogCategory.SEARCH)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error while searching. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, productList, debugMode])

  const performSearch = useCallback((searchTerm: string): void => {
    setInput(searchTerm)
    setTimeout(() => handleSubmit(), 100)
  }, [handleSubmit])

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Check if we should show fiber type reference based on filter options
  const shouldShowFiberReference = useCallback((messageId: string) => {
    const messageFilter = messageFilters[messageId]
    const message = messages.find(m => m.id === messageId)
    if (!message || !message.products) return false
    
    const currentProducts = messageFilter?.filteredProducts || message.products
    const fiberTypes = new Set<string>()
    
    currentProducts.forEach(product => {
      if (product.fiberType) {
        const fiberTypeStr = Array.isArray(product.fiberType)
          ? product.fiberType.join(', ')
          : product.fiberType.toString()
        
        const types = fiberTypeStr.split(',').map(t => t.trim()).filter(t => t && t !== '-')
        types.forEach(type => {
          // Only count recognized fiber types
          if (type.match(/^(OM[1-5]|OS[12])$/i)) {
            fiberTypes.add(type.toUpperCase())
          }
        })
      }
    })
    
    // Show reference only if 2 or more fiber types are available
    return fiberTypes.size >= 2
  }, [messages, messageFilters])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Plectic AI</h1>
          </div>
          <span className="text-sm text-gray-600">Your AI Electrical Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          {hasListItems && (
            <>
              <button
                onClick={() => setProductList([])}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors text-base font-medium shadow-md"
              >
                Clear List
              </button>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {totalItems.toLocaleString()} items in list
              </div>
            </>
          )}
        </div>
      </header>

      {/* Debug Mode Toggle */}
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

      {/* Debug Panel */}
      {debugMode && (
        <DebugPanel 
          debugInfo={lastSearchDebug} 
          onClose={() => setLastSearchDebug(null)} 
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${hasListItems ? 'w-3/5' : 'w-full'}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-5xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Search for fiber enclosures, cables, connectors, and more
                  </h2>

                  {/* Popular Searches */}
                  <div className="max-w-3xl mx-auto mb-8">
                    <h3 className="text-base font-medium text-gray-500 mb-3">Try these searches:</h3>
                    <div className="grid grid-cols-2 gap-3 text-base">
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
                  <SearchInput
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    recentSearches={recentSearches}
                    popularSearches={popularSearches}
                    className="max-w-2xl mx-auto"
                  />
                </div>
              ) : (
                <>
                  
                  {messages.map((message) => {
                    const currentFilters = messageFilters[message.id] || { 
                      activeFilters: {}, 
                      filteredProducts: message.products || [] 
                    }
                    const displayProducts = currentFilters.filteredProducts

                    return (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-full ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'} rounded-lg shadow-md p-5`}>
                          <p className={`text-base ${message.role === 'user' ? 'text-white' : 'text-gray-800'} whitespace-pre-wrap`}>
                            {message.content}
                          </p>
                          
                          {/* Products Display - Always show structure even with 0 products */}
                          {message.role === 'assistant' && (
                            <>
                              {/* Smart Filters - Show even if no products */}
                              {message.smartFilters && (
                                <div ref={(el) => {
                                  // Auto-scroll to center filters only once when they first appear
                                  if (el && messages[messages.length - 1].id === message.id && !el.hasAttribute('data-scrolled')) {
                                    el.setAttribute('data-scrolled', 'true')
                                    setTimeout(() => {
                                      el.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center'
                                      })
                                    }, 500)
                                  }
                                }}>
                                  <FilterSection
                                    messageId={message.id}
                                    products={message.products || []}
                                    smartFilters={message.smartFilters}
                                    activeFilters={currentFilters.activeFilters}
                                    filteredProducts={displayProducts}
                                    autoAppliedFilters={message.autoApplyFilters}
                                    onApplyFilter={applySmartFilter}
                                    onClearFilter={clearFilterType}
                                  />
                                </div>
                              )}

                              {/* Clear Search Button and Products Table */}
                              <div className="mt-4">
                                {/* Always show Clear Search button */}
                                <div className="flex justify-between items-center mb-2">
                                  <button
                                    onClick={clearConversation}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                                  >
                                    Clear Search
                                  </button>
                                  {displayProducts.length > 5 && (
                                    <button
                                      onClick={() => toggleTableExpand(message.id)}
                                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                      {expandedTables[message.id] ? (
                                        <>
                                          <ChevronUp className="w-4 h-4" />
                                          Reduce Product View
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-4 h-4" />
                                          Expand Product View
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                                
                                {/* Show ProductTable only if there are products */}
                                {displayProducts.length > 0 ? (
                                  <ProductTable
                                    products={displayProducts}
                                    onAddToList={handleAddToList}
                                    isExpanded={expandedTables[message.id] || false}
                                    onToggleExpand={() => toggleTableExpand(message.id)}
                                  />
                                ) : (
                                  <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                                    <p className="text-gray-600">No products found. Try adjusting your search or clearing filters.</p>
                                  </div>
                                )}
                              </div>

                              {/* Fiber Type Reference */}
                              {shouldShowFiberReference(message.id) && <FiberTypeReference />}

                              {/* Additional Search Input */}
                              {messages[messages.length - 1].id === message.id && (
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                  <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Search size={20} />
                                    Search for More Products
                                  </h3>
                                  <SearchInput
                                    value={input}
                                    onChange={setInput}
                                    onSubmit={handleSubmit}
                                    isLoading={isLoading}
                                    placeholder="e.g., '50 ft of OM4 fiber cable' or 'panduit cat6 jacks'..."
                                    showSuggestions={false}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Bottom Search Input - Removed as requested */}
        </div>

        {/* Shopping List */}
        <ShoppingList
          productList={productList}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromList}
          onSendList={sendList}
          onCopyPartNumber={copyToClipboard}
        />
      </div>

      {/* Loading Overlay */}
      {isLoading && <AISearchLoading searchTerm={currentSearchTerm} />}
    </div>
  )
}

export default PlecticAI