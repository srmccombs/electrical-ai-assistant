'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, Sparkles, Filter, Brain } from 'lucide-react'
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
  }
  searchTerms: string[]
  reasoning: string
  suggestedFilters: string[]
  alternativeQueries: string[]
  originalQuery: string
  timestamp: string
  aiModel: string
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
  const [aiAnalysis, setAiAnalysis] = useState<AISearchAnalysis | null>(null)
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

  // ✅ NEW: AI-Enhanced Query Processing
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
            searchHistory: messages.slice(-3) // Send recent context
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

  // ✅ ENHANCED: AI-Powered Product Search
  const searchProducts = async (searchTerm: string): Promise<{ products: Product[], searchTime: number, searchType: string, aiAnalysis?: AISearchAnalysis }> => {
    const startTime = performance.now()

    try {
      console.log('🎯 STARTING AI-ENHANCED SEARCH for:', searchTerm)

      // Step 1: Get AI analysis
      const analysis = await enhanceQueryWithAI(searchTerm)
      setAiAnalysis(analysis)

      let allProducts: Product[] = []
      let searchStrategy = analysis?.searchStrategy || 'standard'

      if (!analysis) {
        console.log('🔄 Falling back to basic search...')
        // Fallback to basic search if AI fails
        const fallbackResult = await supabase
          .from('product_search')
          .select('*')
          .or(`part_number.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`)
          .limit(10)

        if (fallbackResult.data) {
          allProducts = fallbackResult.data.map(item => ({
            id: `search-${item.id}`,
            partNumber: item.part_number?.toString() || 'No Part Number',
            brand: item.brand || 'Unknown Brand',
            description: item.short_description || 'No description available',
            price: Math.random() * 75 + 25,
            stockLocal: 10,
            stockDistribution: 100,
            leadTime: 'Ships Today',
            category: item.category || 'Product',
            searchRelevance: 0.7,
            tableName: 'product_search (fallback)'
          }))
        }
      } else {
        console.log('🤖 Using AI-guided search strategy:', analysis.searchStrategy)
        console.log('🎯 AI detected specs:', analysis.detectedSpecs)

        // Step 2: Use AI analysis to search database strategically

        // CONNECTOR SEARCH (AI-guided)
        if (analysis.productType === 'CONNECTOR' || analysis.searchStrategy === 'connectors') {
          console.log('🔌 AI-GUIDED CONNECTOR SEARCH')

          let connectorQuery = supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .ilike('short_description', '%connector%')
            .limit(20)

          // Apply AI-detected specifications
          if (analysis.detectedSpecs.fiberType) {
            connectorQuery = connectorQuery.eq('fiber_type_standard', analysis.detectedSpecs.fiberType)
            console.log(`🌈 AI filter: fiber type = ${analysis.detectedSpecs.fiberType}`)
          }
          if (analysis.detectedSpecs.connectorType) {
            connectorQuery = connectorQuery.eq('connector_type_standard', analysis.detectedSpecs.connectorType)
            console.log(`🔌 AI filter: connector type = ${analysis.detectedSpecs.connectorType}`)
          }
          if (analysis.detectedSpecs.fiberCount) {
            connectorQuery = connectorQuery.or(`fiber_count.eq.${analysis.detectedSpecs.fiberCount},short_description.ilike.%${analysis.detectedSpecs.fiberCount}%`)
            console.log(`📊 AI filter: fiber count = ${analysis.detectedSpecs.fiberCount}`)
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
              tableName: 'products (AI-guided connectors)'
            }))
            console.log(`🔌 AI found ${allProducts.length} connector results`)
          }
        }

        // CATEGORY CABLE SEARCH (AI-guided)
        if ((analysis.productType === 'CABLE' && analysis.detectedSpecs.categoryRating) ||
            analysis.searchStrategy === 'cables' ||
            allProducts.length < 3) {
          console.log('🌐 AI-GUIDED CATEGORY CABLE SEARCH')

          let categoryQuery = supabase
            .from('category_cables')
            .select('*')
            .eq('is_active', true)
            .limit(20)

          const searchConditions = []

          // Use AI-detected category rating
          if (analysis.detectedSpecs.categoryRating) {
            const catRating = analysis.detectedSpecs.categoryRating
            searchConditions.push(`category_rating.ilike.%${catRating}%`)
            searchConditions.push(`part_number.ilike.%${catRating}%`)
            searchConditions.push(`short_description.ilike.%${catRating}%`)
            console.log(`🏷️ AI filter: category rating = ${catRating}`)
          }

          // Use AI-detected jacket rating
          if (analysis.detectedSpecs.jacketRating) {
            const jacketSearch = analysis.detectedSpecs.jacketRating === 'CMP' ? 'plenum' : analysis.detectedSpecs.jacketRating
            searchConditions.push(`jacket_material.ilike.%${jacketSearch}%`)
            searchConditions.push(`approvals_listings.ilike.%${jacketSearch}%`)
            searchConditions.push(`short_description.ilike.%${jacketSearch}%`)
            console.log(`🧥 AI filter: jacket rating = ${jacketSearch}`)
          }

          // Use AI-detected shielding
          if (analysis.detectedSpecs.shielding) {
            searchConditions.push(`shielding_type.ilike.%${analysis.detectedSpecs.shielding}%`)
            console.log(`🛡️ AI filter: shielding = ${analysis.detectedSpecs.shielding}`)
          }

          // Use AI search terms if no specific conditions
          if (searchConditions.length === 0 && analysis.searchTerms.length > 0) {
            analysis.searchTerms.forEach(term => {
              searchConditions.push(`short_description.ilike.%${term}%`)
              searchConditions.push(`part_number.ilike.%${term}%`)
            })
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
              tableName: 'category_cables (AI-guided)'
            }))

            allProducts = [...allProducts, ...categoryProducts]
            console.log(`🌐 AI found ${categoryProducts.length} category cable results`)
          }
        }

        // AI-GUIDED FALLBACK SEARCH
        if (allProducts.length < 3) {
          console.log('🚀 AI expanding search with alternative terms...')

          // Try AI's alternative search terms
          const searchTermsToTry = [
            ...analysis.searchTerms,
            ...analysis.alternativeQueries,
            searchTerm
          ]

          for (const term of searchTermsToTry.slice(0, 3)) {
            if (allProducts.length >= 10) break

            const fallbackResult = await supabase
              .from('product_search')
              .select('*')
              .or(`part_number.ilike.%${term}%,short_description.ilike.%${term}%,search_text.ilike.%${term}%`)
              .limit(5)

            if (fallbackResult.data && fallbackResult.data.length > 0) {
              const searchData = fallbackResult.data.map(item => ({
                id: `search-${item.id}-${term}`,
                partNumber: item.part_number?.toString() || 'No Part Number',
                brand: item.brand || 'Unknown Brand',
                description: item.short_description || 'No description available',
                price: Math.random() * 75 + 25,
                stockLocal: 10,
                stockDistribution: 100,
                leadTime: 'Ships Today',
                category: item.category || 'Product',
                searchRelevance: 0.8,
                tableName: `product_search (AI term: ${term})`
              }))

              allProducts = [...allProducts, ...searchData]
              console.log(`🔍 AI term "${term}" found ${searchData.length} results`)
            }
          }
        }
      }

      // Remove duplicates and limit results
      const uniqueProducts = allProducts.filter((product, index, self) =>
        index === self.findIndex(p => p.partNumber === product.partNumber)
      )

      const endTime = performance.now()
      const searchTime = Math.round(endTime - startTime)

      console.log(`✅ AI-Enhanced search completed: ${uniqueProducts.length} products in ${searchTime}ms`)

      return {
        products: uniqueProducts.slice(0, 20),
        searchTime,
        searchType: `ai-${searchStrategy}`,
        aiAnalysis: analysis || undefined
      }

    } catch (error) {
      console.error('❌ AI-Enhanced search error:', error)
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
      const { products, searchTime, searchType, aiAnalysis } = await searchProducts(originalInput)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      if (products.length > 0) {
        assistantContent = `🤖 AI found ${products.length} products in ${searchTime}ms using ${searchType} strategy`
        if (aiAnalysis) {
          assistantContent += `\n\n🧠 **AI Reasoning:** ${aiAnalysis.reasoning}`
        }
      } else {
        assistantContent = `🤖 AI analyzed "${originalInput}" but found no matching products in your database.`

        if (aiAnalysis && aiAnalysis.alternativeQueries.length > 0) {
          assistantContent += `\n\n💡 **AI Suggestions to try:**\n${aiAnalysis.alternativeQueries.map(q => `• "${q}"`).join('\n')}`
        }

        assistantContent += `\n\n**AI-Powered Search Tips:**
• Try "24 LC connectors OM4" for fiber connectors
• Try "Cat5e plenum blue" for category cables  
• Try "12 fiber OM3 cable" for fiber optic cables
• The AI understands technical electrical terminology!`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime,
        aiAnalysis
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, there was an error with the AI-enhanced search. Please try again.",
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
      const { products, searchTime, searchType, aiAnalysis } = await searchProducts(searchTerm)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      if (products.length > 0) {
        assistantContent = `🤖 AI found ${products.length} products in ${searchTime}ms:`
        if (aiAnalysis) {
          assistantContent += `\n\n🧠 **AI Reasoning:** ${aiAnalysis.reasoning}`
        }
      } else {
        assistantContent = `🤖 AI analyzed your request but found no products in ${searchTime}ms. Try different terms.`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date(),
        searchType,
        searchTime,
        aiAnalysis
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
    }
  }

  // ADD TO LIST
  const addToList = (product: Product, customQuantity?: number) => {
    const quantityToAdd = customQuantity || aiAnalysis?.detectedSpecs.requestedQuantity || 1

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
      {/* Enhanced Header with AI Stats */}
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
            {aiAnalysis && (
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Brain size={14} />
                AI Active (Confidence: {Math.round((aiAnalysis.confidence || 0) * 100)}%)
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

                  {/* Enhanced Search Examples */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Try these AI-powered searches:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <button
                        onClick={() => performSearch('5000ft Cat 5 plenum blue')}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-left transition-colors"
                      >
                        🤖 5000ft Cat 5 plenum blue
                      </button>
                      <button
                        onClick={() => performSearch('12 fiber OM3 cable')}
                        className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-left transition-colors"
                      >
                        🤖 12 fiber OM3 cable
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
                      🤖 Describe What You Need - AI Will Find It In Your Database
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
                        placeholder="Just describe what you need: 'Cat 5 plenum blue', 'fiber optic connectors', 'network cable for office'..."
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
                        {message.aiAnalysis && Object.keys(message.aiAnalysis.detectedSpecs || {}).length > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain size={16} className="text-purple-600" />
                              <span className="text-sm font-medium text-purple-700">AI Analysis</span>
                              <span className="text-xs bg-purple-100 px-2 py-1 rounded">
                                {message.aiAnalysis.confidence ? Math.round(message.aiAnalysis.confidence * 100) : 0}% confidence
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(message.aiAnalysis.detectedSpecs).map(([key, value]) => (
                                value && (
                                  <span key={key} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                    {key === 'requestedQuantity' ? `qty: ${value?.toLocaleString()}ft` :
                                     key === 'productType' ? `type: ${value}` :
                                     `${key}: ${value}`}
                                  </span>
                                )
                              ))}
                            </div>
                          </div>
                        )}

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
                    <Brain size={14} className="text-white animate-pulse" />
                  </div>
                  <span className="text-sm text-gray-600">🤖 AI is analyzing your request and searching your database...</span>
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
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors text-base border-2 border-red-700"
                >
                  🗑️ Clear Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product List (same as before) */}
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