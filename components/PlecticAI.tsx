'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

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
}

interface SearchEnhancement {
  originalQuery: string
  enhancedQuery: string
  suggestedFilters: string[]
  detectedTerms: {
    fiberType?: string
    jacketRating?: string
    fiberCount?: number
    connectorType?: string
    manufacturer?: string
    categoryRating?: string
    shielding?: string
    requestedQuantity?: number
    productType?: string
  }
  confidence: number
}

// Main Component
export default function PlecticAI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [productList, setProductList] = useState<ListItem[]>([])
  const [showMobileList, setShowMobileList] = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState<number>(0)
  const [searchEnhancement, setSearchEnhancement] = useState<SearchEnhancement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Smooth scroll to bottom
  const scrollToBottom = () => {
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
  const enhanceQuery = async (query: string): Promise<SearchEnhancement> => {
    try {
      const enhancement: SearchEnhancement = {
        originalQuery: query,
        enhancedQuery: query,
        suggestedFilters: [],
        detectedTerms: {},
        confidence: 0.8
      }

      console.log('🔍 Analyzing query:', query)

      // IMPROVED: Detect fiber types with better matching
      const fiberTypes = ['OM4', 'OM3', 'OM2', 'OM1', 'OS2', 'OS1']
      const foundFiberType = fiberTypes.find(type => {
        const regex = new RegExp(`\\b${type}\\b`, 'i')
        return regex.test(query)
      })
      if (foundFiberType) {
        enhancement.detectedTerms.fiberType = foundFiberType
        console.log('🌈 Detected fiber type:', foundFiberType)
      }

      // ENHANCED Cat5 detection
      const categoryRatings = ['CAT5E', 'CAT6A', 'CAT6', 'CAT5', 'CAT7', 'CAT8']
      const queryNormalized = query.toUpperCase().replace(/\s+/g, ' ').replace(/CATEGORY\s+/g, 'CAT')

      const foundCategoryRating = categoryRatings.find(rating => {
        if (rating === 'CAT5' && (queryNormalized.includes('CAT 5') || queryNormalized.includes('CAT5')) && !queryNormalized.includes('CAT5E')) return true
        if (rating === 'CAT5E' && (queryNormalized.includes('CAT 5E') || queryNormalized.includes('CAT5E'))) return true
        if (rating === 'CAT6' && (queryNormalized.includes('CAT 6') || queryNormalized.includes('CAT6')) && !queryNormalized.includes('CAT6A')) return true
        if (rating === 'CAT6A' && (queryNormalized.includes('CAT 6A') || queryNormalized.includes('CAT6A'))) return true
        return queryNormalized.includes(rating)
      })

      if (foundCategoryRating) {
        enhancement.detectedTerms.categoryRating = foundCategoryRating.replace('CATEGORY ', 'CAT')
      }

      // Detect jacket ratings
      const jacketRatings = ['CMP', 'CMR', 'CMG', 'LSZH', 'OFNP', 'OFNR', 'OFNG', 'PLENUM', 'RISER']
      const foundJacketRating = jacketRatings.find(rating =>
        query.toUpperCase().includes(rating)
      )
      if (foundJacketRating) {
        enhancement.detectedTerms.jacketRating = foundJacketRating === 'PLENUM' ? 'CMP' : foundJacketRating
      }

      // Detect shielding types
      const shieldingTypes = ['UTP', 'STP', 'FTP', 'SFTP', 'UNSHIELDED', 'SHIELDED']
      const foundShielding = shieldingTypes.find(shielding =>
        query.toUpperCase().includes(shielding)
      )
      if (foundShielding) {
        enhancement.detectedTerms.shielding = foundShielding
      }

      // IMPROVED: Detect fiber count with better patterns
      const fiberCountPatterns = [
        /(\d+)\s*(?:fiber|count|strand)/i,
        /(\d+)\s+(?:LC|SC|ST|FC|MTP|MPO)/i,
        /(\d+)\s+(?:connector|connectors)/i,
        /(\d+)\s*(?:F|f)\b/i,
        /(\d+)[-\s]*(?:way|port)/i
      ]

      let detectedCount = null
      for (const pattern of fiberCountPatterns) {
        const match = query.match(pattern)
        if (match) {
          detectedCount = parseInt(match[1])
          console.log(`📊 Detected fiber count: ${detectedCount}`)
          break
        }
      }

      if (detectedCount) {
        enhancement.detectedTerms.fiberCount = detectedCount
      }

      // Detect connector types
      const connectorTypes = ['LC', 'SC', 'ST', 'FC', 'MTP', 'MPO', 'RJ45', 'RJ-45']
      const foundConnectorType = connectorTypes.find(type =>
        query.toUpperCase().includes(type)
      )
      if (foundConnectorType) {
        enhancement.detectedTerms.connectorType = foundConnectorType
      }

      // Detect manufacturers
      const manufacturers = ['CORNING', 'PANDUIT', 'PRYSMIAN', 'OFS', 'COMMSCOPE', 'BELDEN', 'SUPERIOR ESSEX']
      const foundManufacturer = manufacturers.find(mfg =>
        query.toUpperCase().includes(mfg)
      )
      if (foundManufacturer) {
        enhancement.detectedTerms.manufacturer = foundManufacturer
      }

      // Detect requested quantities
      const quantityMatch = query.match(/(\d+(?:,\d+)?)\s*(?:ft|foot|feet|meter|m)\b/i)
      if (quantityMatch) {
        const quantity = parseInt(quantityMatch[1].replace(/,/g, ''))
        enhancement.detectedTerms.requestedQuantity = quantity
      }

      // IMPROVED: Detect product types
      const queryLower = query.toLowerCase()

      if (queryLower.includes('connector') || queryLower.includes('connectors')) {
        enhancement.detectedTerms.productType = 'CONNECTOR'
        console.log('🔌 Detected product type: CONNECTOR')
      }
      else if (queryLower.includes('panel') || queryLower.includes('panels') ||
               queryLower.includes('adapter panel') || queryLower.includes('patch panel')) {
        enhancement.detectedTerms.productType = 'PANEL'
        console.log('🏠 Detected product type: PANEL')
      }
      else if (queryLower.includes('cable') || queryLower.includes('cables')) {
        enhancement.detectedTerms.productType = 'CABLE'
        console.log('🌈 Detected product type: CABLE')
      }

      enhancement.enhancedQuery = query
      return enhancement

    } catch (error) {
      console.error('Query enhancement error:', error)
      return {
        originalQuery: query,
        enhancedQuery: query,
        suggestedFilters: [],
        detectedTerms: {},
        confidence: 0.5
      }
    }
  }

  // ENHANCED SEARCH
  const searchProducts = async (searchTerm: string): Promise<{ products: Product[], searchTime: number, searchType: string }> => {
    const startTime = performance.now()

    try {
      console.log('🎯 ENHANCED SEARCH for:', searchTerm)

      const enhancement = await enhanceQuery(searchTerm)
      setSearchEnhancement(enhancement)

      let allProducts: Product[] = []
      let searchStrategy = 'standard'

      // Detect search types
      const isConnectorSearch = enhancement.detectedTerms.productType === 'CONNECTOR' ||
                               ['connector', 'connectors'].some(term => searchTerm.toLowerCase().includes(term))

      const isAdapterPanelSearch = enhancement.detectedTerms.productType === 'PANEL' ||
                                  ['panel', 'panels', 'adapter panel', 'patch panel'].some(term =>
                                    searchTerm.toLowerCase().includes(term))

      const isFiberCableSearch = (enhancement.detectedTerms.fiberType ||
                                 ['fiber', 'optic'].some(term => searchTerm.toLowerCase().includes(term))) &&
                                enhancement.detectedTerms.productType === 'CABLE' &&
                                !isConnectorSearch && !isAdapterPanelSearch

      const isCategorySearch = enhancement.detectedTerms.categoryRating ||
                              ['cat5e', 'cat6', 'cat6a', 'cat5', 'cat 5', 'cat 6', 'cat7', 'cat8', 'ethernet', 'network cable', 'utp', 'stp'].some(term =>
                                searchTerm.toLowerCase().includes(term))

      // CONNECTOR SEARCH
      if (isConnectorSearch) {
        console.log('🔌 CONNECTOR SEARCH detected')
        searchStrategy = 'connectors'

        let connectorQuery = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .ilike('short_description', '%connector%')
          .limit(20)

        if (enhancement.detectedTerms.fiberType) {
          connectorQuery = connectorQuery.eq('fiber_type_standard', enhancement.detectedTerms.fiberType)
        }
        if (enhancement.detectedTerms.connectorType) {
          connectorQuery = connectorQuery.eq('connector_type_standard', enhancement.detectedTerms.connectorType)
        }
        if (enhancement.detectedTerms.fiberCount) {
          connectorQuery = connectorQuery.or(`fiber_count.eq.${enhancement.detectedTerms.fiberCount},short_description.ilike.%${enhancement.detectedTerms.fiberCount}%`)
        }

        const connectorResult = await connectorQuery

        if (connectorResult.data && connectorResult.data.length > 0) {
          allProducts = connectorResult.data.map(item => ({
            id: item.id?.toString() || Date.now().toString(),
            partNumber: item.part_number || 'No Part Number',
            brand: 'Brand Name',
            description: item.short_description || 'No description available',
            price: parseFloat(item.unit_price) || (Math.random() * 50 + 10),
            stockLocal: item.stock_quantity || 0,
            stockDistribution: 100,
            leadTime: 'Ships Today',
            category: 'Fiber Connector',
            fiberType: item.fiber_type_standard,
            connectorType: item.connector_type_standard,
            fiberCount: item.fiber_count,
            searchRelevance: 1.0,
            tableName: 'products (connectors)'
          }))
          console.log(`🔌 Found ${allProducts.length} connector results`)
        }
      }

      // CATEGORY CABLE SEARCH
      if (isCategorySearch && allProducts.length < 5) {
        console.log('🌐 CATEGORY CABLE SEARCH detected')
        searchStrategy = allProducts.length > 0 ? `${searchStrategy}+categories` : 'category-cables'

        let categoryQuery = supabase
          .from('category_cables')
          .select('*')
          .eq('is_active', true)
          .limit(20)

        const searchConditions = []

        if (enhancement.detectedTerms.categoryRating) {
          const catRating = enhancement.detectedTerms.categoryRating
          searchConditions.push(`category_rating.ilike.%${catRating}%`)
          searchConditions.push(`part_number.ilike.%${catRating}%`)
          searchConditions.push(`short_description.ilike.%${catRating}%`)
        }

        if (enhancement.detectedTerms.jacketRating) {
          const jacketSearch = enhancement.detectedTerms.jacketRating === 'CMP' ? 'plenum' : enhancement.detectedTerms.jacketRating
          searchConditions.push(`jacket_material.ilike.%${jacketSearch}%`)
          searchConditions.push(`approvals_listings.ilike.%${jacketSearch}%`)
          searchConditions.push(`short_description.ilike.%${jacketSearch}%`)
        }

        if (searchConditions.length > 0) {
          categoryQuery = categoryQuery.or(searchConditions.join(','))
        }

        const categoryResult = await categoryQuery

        if (categoryResult.data && categoryResult.data.length > 0) {
          const categoryProducts = categoryResult.data.map(item => ({
            id: item.id?.toString() || Date.now().toString(),
            partNumber: item.part_number || 'No Part Number',
            brand: item.brand || 'Unknown Brand',
            description: item.short_description || 'No description available',
            price: Math.random() * 150 + 50,
            stockLocal: 25,
            stockDistribution: 100,
            leadTime: 'Ships Today',
            category: 'Category Cable',
            categoryRating: item.category_rating,
            jacketRating: item.jacket_material?.includes('plenum') ? 'CMP' :
                         item.jacket_material?.includes('riser') ? 'CMR' : undefined,
            shielding: item.shielding_type,
            searchRelevance: 1.0,
            tableName: 'category_cables'
          }))

          allProducts = [...allProducts, ...categoryProducts]
          console.log(`🌐 Found ${categoryProducts.length} category cable results`)
        }
      }

      // Fallback search if needed
      if (allProducts.length < 3) {
        console.log('🚀 Expanding search to additional tables...')

        const fallbackResult = await supabase
          .from('product_search')
          .select('*')
          .or(`part_number.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,search_text.ilike.%${searchTerm}%`)
          .limit(10)

        if (fallbackResult.data && fallbackResult.data.length > 0) {
          const searchData = fallbackResult.data.map(item => ({
            id: `search-${item.id}`,
            partNumber: item.part_number?.toString() || 'No Part Number',
            brand: item.brand || 'Unknown Brand',
            description: item.short_description || 'No description available',
            price: Math.random() * 75 + 25,
            stockLocal: 10,
            stockDistribution: 100,
            leadTime: 'Ships Today',
            category: item.category || 'Product',
            searchRelevance: 0.9,
            tableName: `product_search (${item.product_table})`
          }))

          allProducts = [...allProducts, ...searchData]
        }
      }

      const uniqueProducts = allProducts.filter((product, index, self) =>
        index === self.findIndex(p => p.partNumber === product.partNumber)
      )

      const endTime = performance.now()
      const searchTime = Math.round(endTime - startTime)

      return {
        products: uniqueProducts.slice(0, 20),
        searchTime,
        searchType: searchStrategy
      }

    } catch (error) {
      console.error('❌ Enhanced search error:', error)
      const endTime = performance.now()
      return {
        products: [],
        searchTime: Math.round(endTime - startTime),
        searchType: 'error'
      }
    }
  }

  // HANDLE SUBMIT
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
    setInput('')
    setIsLoading(true)

    try {
      const { products, searchTime, searchType } = await searchProducts(originalInput)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      if (products.length > 0) {
        assistantContent = `🚀 Found ${products.length} products in ${searchTime}ms:`
      } else {
        assistantContent = `🔍 **No exact matches found for "${originalInput}"**

Let me help you find what you need:

**For Fiber Connectors, try:**
• "24 LC connectors OM4" - LC connectors for OM4 fiber
• "12 SC connectors OM3" - SC connectors for OM3 fiber  

**For Category Cables, try:**
• "Cat5 plenum" - Category 5 plenum rated
• "Cat 5 blue plenum" - With spaces and color
• "Cat6 cable" - Standard Category 6

**Search Tips:**
• Use "connectors" for individual connectors vs "cable" for cables vs "panel" for panels
• Include ratings: "plenum", "CMP", "Cat6A", "OM3", "OM4"
• Add counts: "24 connectors", "12 fiber cable"`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, there was an error searching the products. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
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
    setInput('')
    setIsLoading(true)

    try {
      const { products, searchTime, searchType } = await searchProducts(searchTerm)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      if (products.length > 0) {
        assistantContent = `🚀 Found ${products.length} products in ${searchTime}ms:`
      } else {
        assistantContent = `🚀 No products found in ${searchTime}ms. Try broader terms.`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, there was an error searching the products. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // ADD TO LIST
  const addToList = (product: Product, customQuantity?: number) => {
    const quantityToAdd = customQuantity || searchEnhancement?.detectedTerms.requestedQuantity || 1

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

  // UPDATE QUANTITY
  const updateQuantity = (id: string, delta: number) => {
    setProductList(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
      }
      return item
    }).filter(Boolean) as ListItem[])
  }

  // REMOVE FROM LIST
  const removeFromList = (id: string) => {
    setProductList(prev => prev.filter(item => item.id !== id))
  }

  // SEND LIST
  const sendList = () => {
    alert('List sent! (This would email/text the list in production)')
  }

  const totalItems = productList.reduce((sum, item) => sum + item.quantity, 0)
  const hasListItems = productList.length > 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-inter">
      {/* Enhanced Header with Search Stats */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Plectic AI</h1>
              <p className="text-xs text-gray-600">
                🎯 Smart Cable Expert - Fiber + Category Cables + Panels + Connectors
                {lastSearchTime > 0 && (
                  <span className="ml-2 text-green-600">
                    Last search: {lastSearchTime}ms
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {searchEnhancement && Object.keys(searchEnhancement.detectedTerms).length > 0 && (
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Sparkles size={14} />
                Smart Search
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
                    <Search size={28} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    🎯 Smart Cable Expert
                  </h2>
                  <p className="text-gray-600 mb-4">
                    I'll help you find fiber cables, category cables, adapter panels, and connectors
                  </p>

                  {/* Enhanced Search Examples */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Try these smart searches:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <button
                        onClick={() => performSearch('5000ft Cat 5 plenum blue')}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-left transition-colors"
                      >
                        🎯 5000ft Cat 5 plenum blue
                      </button>
                      <button
                        onClick={() => performSearch('12 fiber OM3 cable')}
                        className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-left transition-colors"
                      >
                        🎯 12 fiber OM3 cable
                      </button>
                      <button
                        onClick={() => performSearch('24 LC fiber connectors OM4')}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-left transition-colors"
                      >
                        🔌 24 LC fiber connectors OM4
                      </button>
                      <button
                        onClick={() => performSearch('500ft Cat6A UTP')}
                        className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-left transition-colors"
                      >
                        500ft Cat6A UTP
                      </button>
                    </div>
                  </div>

                  {/* Large Search Area */}
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-lg font-medium text-gray-700 mb-3 text-left">
                      🎯 Ask Me About Any Cable, Panel, or Connector
                    </h3>
                    <div className="relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                          }
                        }}
                        placeholder="Tell me what you need: 'Cat 5 plenum blue', '12 fiber OM3 cable', '24 LC connectors OM4'..."
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
                        <Search size={16} />
                        Search
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
                            <Zap size={14} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Plectic AI Cable Expert</span>
                          {message.searchTime && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              {message.searchTime}ms • {message.searchType}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-700 mb-3 whitespace-pre-line">{message.content}</div>

                        {/* Show AI Enhancement Details */}
                        {searchEnhancement && Object.keys(searchEnhancement.detectedTerms).length > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={16} className="text-purple-600" />
                              <span className="text-sm font-medium text-purple-700">Smart Search Detection</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(searchEnhancement.detectedTerms).map(([key, value]) => (
                                <span key={key} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                  {key === 'requestedQuantity' ? `quantity: ${value?.toLocaleString()}ft` :
                                   key === 'productType' ? `type: ${value}` :
                                   `${key}: ${value}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {message.products && (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                              <p className="text-sm font-semibold text-gray-700">
                                🎯 Product Options - Select items to add to your list:
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
                                    <th className="px-3 py-2 text-center font-medium">Source</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {message.products.map((product, index) => (
                                    <tr
                                      key={product.id}
                                      className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                      }`}
                                    >
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          onClick={() => addToList(product)}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                        >
                                          Add
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
                                      </td>
                                      <td className="px-3 py-2 text-sm font-medium text-right">${product.price?.toFixed(2)}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                          {product.tableName}
                                        </span>
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
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-white animate-pulse" />
                  </div>
                  <span className="text-sm text-gray-600">🎯 Finding the perfect products for you...</span>
                </div>
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
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    placeholder="🎯 Tell me what you need: 'Cat 5 plenum blue', '12 fiber OM3 cable', '24 LC connectors OM4'..."
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
                  <Search size={16} />
                  Ask
                </button>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([])
                    setSearchEnhancement(null)
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