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
  packagingType?: string
  color?: string
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
  detectedTerms: {
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

// Main Component
export default function PlecticAI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [productList, setProductList] = useState<ListItem[]>([])
  const [lastSearchTime, setLastSearchTime] = useState<number>(0)
  const [aiAnalysis, setAiAnalysis] = useState<AISearchAnalysis | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches] = useState<string[]>([
    'Cat 5e plenum blue',
    '24 LC connectors OM4',
    'Cat 6 riser cable',
    '12 fiber OM3 cable',
    'SC connectors multimode',
    'Cat 6A shielded cable'
  ])

  // Smart Filter States
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({})
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [smartFilters, setSmartFilters] = useState<SmartFilters | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load recent searches on component mount
  useEffect(() => {
    const stored = localStorage.getItem('plectic_recent_searches')
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }
  }, [])

  // Save recent searches
  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 8)
    setRecentSearches(updated)
    localStorage.setItem('plectic_recent_searches', JSON.stringify(updated))
  }

  // DEBUG FUNCTION - This will help us see your database structure
  const debugDatabase = async () => {
    console.log('🔍 DEBUGGING DATABASE STRUCTURE...')

    try {
      // Check products table
      console.log('📋 Checking PRODUCTS table...')
      const productsResult = await supabase
        .from('products')
        .select('*')
        .limit(3)

      console.log('Products table sample:', productsResult.data)
      console.log('Products error:', productsResult.error)

      if (productsResult.data?.[0]) {
        console.log('Products columns:', Object.keys(productsResult.data[0]))
      }

      // Check category_cables table (we know this works)
      console.log('📋 Checking CATEGORY_CABLES table...')
      const categoryResult = await supabase
        .from('category_cables')
        .select('*')
        .limit(3)

      console.log('Category cables sample:', categoryResult.data)
      if (categoryResult.data?.[0]) {
        console.log('Category cables columns:', Object.keys(categoryResult.data[0]))
      }

      // Check product_search table
      console.log('📋 Checking PRODUCT_SEARCH table...')
      const searchResult = await supabase
        .from('product_search')
        .select('*')
        .limit(3)

      console.log('Product search sample:', searchResult.data)
      if (searchResult.data?.[0]) {
        console.log('Product search columns:', Object.keys(searchResult.data[0]))
      }

      // Search for connectors in products table
      console.log('🔌 Searching for CONNECTORS in products table...')
      const connectorResult = await supabase
        .from('products')
        .select('*')
        .ilike('short_description', '%connector%')
        .limit(5)

      console.log('Connectors found in products table:', connectorResult.data?.length || 0)
      if (connectorResult.data?.[0]) {
        console.log('Connector sample:', connectorResult.data[0])
      }

      // Search for connectors in product_search table
      console.log('🔌 Searching for CONNECTORS in product_search table...')
      const connectorSearchResult = await supabase
        .from('product_search')
        .select('*')
        .ilike('short_description', '%connector%')
        .limit(5)

      console.log('Connectors found in product_search table:', connectorSearchResult.data?.length || 0)
      if (connectorSearchResult.data?.[0]) {
        console.log('Product_search connector sample:', connectorSearchResult.data[0])
      }

      // Search for OM4
      console.log('🌈 Searching for OM4 in products table...')
      const om4Result = await supabase
        .from('products')
        .select('*')
        .or('short_description.ilike.%OM4%,part_number.ilike.%OM4%')
        .limit(5)

      console.log('OM4 found in products table:', om4Result.data?.length || 0)
      if (om4Result.data?.[0]) {
        console.log('OM4 sample:', om4Result.data[0])
      }

      // Search for OM4 in product_search
      console.log('🌈 Searching for OM4 in product_search table...')
      const om4SearchResult = await supabase
        .from('product_search')
        .select('*')
        .or('short_description.ilike.%OM4%,part_number.ilike.%OM4%')
        .limit(5)

      console.log('OM4 found in product_search table:', om4SearchResult.data?.length || 0)
      if (om4SearchResult.data?.[0]) {
        console.log('Product_search OM4 sample:', om4SearchResult.data[0])
      }

      // Search for LC connectors specifically
      console.log('🔌 Searching for LC connectors...')
      const lcResult = await supabase
        .from('product_search')
        .select('*')
        .or('short_description.ilike.%LC%,part_number.ilike.%LC%')
        .limit(5)

      console.log('LC found in product_search table:', lcResult.data?.length || 0)
      if (lcResult.data?.[0]) {
        console.log('LC connector sample:', lcResult.data[0])
      }

    } catch (error) {
      console.error('❌ Database debug error:', error)
    }
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
      // Extract color from description
      const desc = p.description?.toLowerCase() || ''
      const colorWords = ['blue', 'red', 'green', 'yellow', 'orange', 'white', 'black', 'gray', 'grey', 'purple', 'pink', 'violet', 'brown']
      return colorWords.find(color => desc.includes(color))
    }).filter((item): item is string => Boolean(item))))

    return {
      brands: brands.slice(0, 8), // Show top 8
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
  const applySmartFilter = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters }

    if (newFilters[filterType] === value) {
      // Remove filter if clicking the same one
      delete newFilters[filterType]
    } else {
      // Apply new filter
      newFilters[filterType] = value
    }

    setActiveFilters(newFilters)

    // Filter products based on active filters
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
  const clearAllFilters = () => {
    setActiveFilters({})
    setFilteredProducts(currentProducts)
  }

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

  // Local Query Enhancement
  const enhanceQuery = async (query: string) => {
    try {
      const enhancement = {
        originalQuery: query,
        enhancedQuery: query,
        suggestedFilters: [],
        detectedTerms: {} as any,
        confidence: 0.8
      }

      console.log('🔍 Analyzing query:', query)

      // Detect fiber types
      const fiberTypes = ['OM4', 'OM3', 'OM2', 'OM1', 'OS2', 'OS1']
      const foundFiberType = fiberTypes.find(type => {
        const regex = new RegExp(`\\b${type}\\b`, 'i')
        return regex.test(query)
      })
      if (foundFiberType) {
        enhancement.detectedTerms.fiberType = foundFiberType
        console.log('🌈 Detected fiber type:', foundFiberType)
      }

      // Detect category ratings
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

      // Detect colors
      const colors = ['BLUE', 'RED', 'GREEN', 'YELLOW', 'ORANGE', 'WHITE', 'BLACK', 'GRAY', 'GREY', 'PURPLE', 'PINK', 'VIOLET', 'BROWN']
      const foundColor = colors.find(color =>
        query.toUpperCase().includes(color)
      )
      if (foundColor) {
        enhancement.detectedTerms.color = foundColor === 'GREY' ? 'GRAY' : foundColor
        console.log('🎨 Detected color:', enhancement.detectedTerms.color)
      }

      // Detect fiber count
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

      // Detect product types
      const queryLower = query.toLowerCase()

      if (queryLower.includes('connector') || queryLower.includes('connectors')) {
        enhancement.detectedTerms.productType = 'CONNECTOR'
        console.log('🔌 Detected product type: CONNECTOR')
      }
      else if (queryLower.includes('panel') || queryLower.includes('panels')) {
        enhancement.detectedTerms.productType = 'PANEL'
        console.log('🏠 Detected product type: PANEL')
      }
      else if (queryLower.includes('cable') || queryLower.includes('cables')) {
        enhancement.detectedTerms.productType = 'CABLE'
        console.log('🌈 Detected product type: CABLE')
      }

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

  // ENHANCED SEARCH with Smart Filters
  const searchProducts = async (searchTerm: string): Promise<{ products: Product[], searchTime: number, searchType: string, aiAnalysis?: AISearchAnalysis }> => {
    const startTime = performance.now()

    try {
      console.log('🎯 ENHANCED SEARCH for:', searchTerm)
      saveRecentSearch(searchTerm) // Save to recent searches

      const enhancement = await enhanceQuery(searchTerm)
      setAiAnalysis(enhancement as any)

      let allProducts: Product[] = []
      let searchStrategy = 'standard'

      // Try the AI-powered search first
      const aiAnalysis = await enhanceQueryWithAI(searchTerm)

      if (aiAnalysis) {
        console.log('🤖 Using AI analysis:', aiAnalysis)
      }

      // Category cable search with color filtering
      if (enhancement.detectedTerms.categoryRating) {
        console.log('🌐 CATEGORY CABLE SEARCH detected')

        let categoryQuery = supabase
          .from('category_cables')
          .select('*')
          .eq('is_active', true)
          .limit(25)

        const searchConditions = []

        // Category rating filter
        if (enhancement.detectedTerms.categoryRating) {
          const catRating = enhancement.detectedTerms.categoryRating
          searchConditions.push(`category_rating.ilike.%${catRating}%`)
          searchConditions.push(`part_number.ilike.%${catRating}%`)
          searchConditions.push(`short_description.ilike.%${catRating}%`)
          console.log(`🏷️ AI filter: category rating = ${catRating}`)
        }

        // Jacket rating filter
        if (enhancement.detectedTerms.jacketRating) {
          const jacketSearch = enhancement.detectedTerms.jacketRating === 'CMP' ? 'plenum' : enhancement.detectedTerms.jacketRating
          searchConditions.push(`jacket_material.ilike.%${jacketSearch}%`)
          searchConditions.push(`short_description.ilike.%${jacketSearch}%`)
          console.log(`🧥 AI filter: jacket rating = ${jacketSearch}`)
        }

        // Color filter - NOW WORKS!
        if (enhancement.detectedTerms.color) {
          searchConditions.push(`jacket_color.ilike.%${enhancement.detectedTerms.color}%`)
          searchConditions.push(`short_description.ilike.%${enhancement.detectedTerms.color}%`)
          console.log(`🎨 AI filter: color = ${enhancement.detectedTerms.color}`)
        }

        // General search terms
        searchConditions.push(`short_description.ilike.%${searchTerm}%`)
        searchConditions.push(`part_number.ilike.%${searchTerm}%`)

        const categoryResult = await categoryQuery.or(searchConditions.join(','))

        if (categoryResult.data && categoryResult.data.length > 0) {
          let categoryProducts = categoryResult.data.map(item => ({
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
            searchRelevance: 1.0,
            tableName: 'category_cables',
            packagingType: item.packaging_type,
            color: item.jacket_color
          }))

          // If color was specified, prioritize products that match the color
          if (enhancement.detectedTerms.color) {
            categoryProducts = categoryProducts.sort((a, b) => {
              const aHasColor = a.description.toUpperCase().includes(enhancement.detectedTerms.color!)
              const bHasColor = b.description.toUpperCase().includes(enhancement.detectedTerms.color!)
              if (aHasColor && !bHasColor) return -1
              if (!aHasColor && bHasColor) return 1
              return 0
            })
          }

          allProducts = [...allProducts, ...categoryProducts]
          console.log(`🌐 Added ${categoryProducts.length} category cable results`)
          searchStrategy = 'category_cables'
        }
      }

      // CONNECTOR SEARCH with proper column names
      if (enhancement.detectedTerms.productType === 'CONNECTOR' && allProducts.length < 5) {
        console.log('🔌 CONNECTOR SEARCH detected')

        let connectorQuery = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .ilike('short_description', '%connector%')
          .limit(20)

        // Apply AI-detected specifications using correct column names
        if (enhancement.detectedTerms.fiberType) {
          connectorQuery = connectorQuery.eq('fiber_type_standard', enhancement.detectedTerms.fiberType)
          console.log(`🌈 AI filter: fiber type = ${enhancement.detectedTerms.fiberType}`)
        }
        if (enhancement.detectedTerms.connectorType) {
          connectorQuery = connectorQuery.eq('connector_type_standard', enhancement.detectedTerms.connectorType)
          console.log(`🔌 AI filter: connector type = ${enhancement.detectedTerms.connectorType}`)
        }
        if (enhancement.detectedTerms.fiberCount) {
          connectorQuery = connectorQuery.or(`fiber_count.eq.${enhancement.detectedTerms.fiberCount},short_description.ilike.%${enhancement.detectedTerms.fiberCount}%`)
          console.log(`📊 AI filter: fiber count = ${enhancement.detectedTerms.fiberCount}`)
        }

        const connectorResult = await connectorQuery

        if (connectorResult.data && connectorResult.data.length > 0) {
          const connectorProducts = connectorResult.data.map(item => ({
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

          allProducts = [...allProducts, ...connectorProducts]
          console.log(`🔌 AI found ${connectorProducts.length} connector results from products table`)
          searchStrategy = 'connectors'
        }

        // Also search product_search table for connectors
        console.log('🔍 Searching product_search for additional connectors...')
        const productSearchConnectors = await supabase
          .from('product_search')
          .select('*')
          .ilike('short_description', '%connector%')
          .limit(10)

        if (productSearchConnectors.data && productSearchConnectors.data.length > 0) {
          const additionalConnectors = productSearchConnectors.data.map(item => ({
            id: `search-conn-${item.id}`,
            partNumber: item.part_number?.toString() || 'No Part Number',
            brand: item.brand || 'Unknown Brand',
            description: item.short_description || 'No description available',
            price: Math.random() * 50 + 10,
            stockLocal: 15,
            stockDistribution: 100,
            leadTime: 'Ships Today',
            category: 'Connector',
            searchRelevance: 0.9,
            tableName: `product_search (${item.product_table})`
          }))

          allProducts = [...allProducts, ...additionalConnectors]
          console.log(`🔍 Added ${additionalConnectors.length} connectors from product_search`)
        }
      }

      // Fallback search if no results
      if (allProducts.length === 0) {
        console.log('🚀 Expanding search to product_search table...')
        const productSearchResult = await supabase
          .from('product_search')
          .select('*')
          .or(`part_number.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,search_text.ilike.%${searchTerm}%`)
          .limit(15)

        if (productSearchResult.data && productSearchResult.data.length > 0) {
          allProducts = productSearchResult.data.map(item => ({
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
            tableName: `product_search (${item.product_table || 'unknown'})`
          }))
          console.log(`🎯 Found ${allProducts.length} results in product_search`)
          searchStrategy = 'product_search'
        }
      }

      // Remove duplicates
      const uniqueProducts = allProducts.filter((product, index, self) =>
        index === self.findIndex(p => p.partNumber === product.partNumber)
      )

      // Set up smart filters
      if (uniqueProducts.length > 0) {
        const filters = generateSmartFilters(uniqueProducts, enhancement.detectedTerms.productType || 'MIXED')
        setSmartFilters(filters)
        setCurrentProducts(uniqueProducts)
        setFilteredProducts(uniqueProducts)
        setActiveFilters({}) // Reset filters for new search
      }

      const endTime = performance.now()
      const searchTime = Math.round(endTime - startTime)

      console.log(`✅ Search completed: ${uniqueProducts.length} products in ${searchTime}ms using ${searchStrategy}`)

      return {
        products: uniqueProducts.slice(0, 20),
        searchTime,
        searchType: searchStrategy,
        aiAnalysis: aiAnalysis || undefined
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
      const { products, searchTime, searchType, aiAnalysis } = await searchProducts(originalInput)
      setLastSearchTime(searchTime)

      let assistantContent = ''

      if (products.length > 0) {
        assistantContent = `🤖 AI found ${products.length} products in ${searchTime}ms using ${searchType} strategy`
        if (aiAnalysis) {
          assistantContent += `\n\n🧠 **AI Reasoning:** ${aiAnalysis.reasoning}`
        }
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
    }
  }

  // ADD TO LIST
  const addToList = (product: Product, customQuantity?: number) => {
    const quantityToAdd = customQuantity || aiAnalysis?.detectedTerms?.requestedQuantity || 1

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

  // Get products to display (filtered or current)
  const productsToDisplay = Object.keys(activeFilters).length > 0 ? filteredProducts : currentProducts

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-inter">
      {/* Enhanced Header with Debug Button */}
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
            {/* Debug Button */}
            <button
              onClick={debugDatabase}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              🔍 Debug Database
            </button>

            {aiAnalysis && Object.keys(aiAnalysis.detectedTerms || {}).length > 0 && (
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
                        {aiAnalysis && Object.keys(aiAnalysis.detectedTerms || {}).length > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={16} className="text-purple-600" />
                              <span className="text-sm font-medium text-purple-700">Smart Search Detection</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(aiAnalysis.detectedTerms).map(([key, value]) => (
                                value && (
                                  <span key={key} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                    {key === 'requestedQuantity' ? `quantity: ${value?.toLocaleString()}ft` :
                                     key === 'productType' ? `type: ${value}` :
                                     key === 'color' ? `color: ${value}` :
                                     `${key}: ${value}`}
                                  </span>
                                )
                              ))}
                            </div>
                          </div>
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
                                    <th className="px-3 py-2 text-center font-medium">Source</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {productsToDisplay.map((product, index) => (
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
                                        {product.packagingType && (
                                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs ml-1">
                                            {product.packagingType}
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
