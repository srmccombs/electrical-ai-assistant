'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle } from 'lucide-react'

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
}

// Main Component
export default function PlecticAI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [productList, setProductList] = useState<ListItem[]>([])
  const [showMobileList, setShowMobileList] = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)
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

  // Simulate product search with Excel-style data
  const searchProducts = async (query: string): Promise<Product[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockProducts: Product[] = [
      {
        id: '1',
        partNumber: 'CCH-CP12-E4-DMSI',
        brand: 'DMSI',
        description: '12 Fiber OM3/OM4 LC Adapter Panel - Aqua',
        price: 125.50,
        stockLocal: 15,
        stockDistribution: 200,
        leadTime: 'Ships Today',
        category: 'Fiber Panels'
      },
      {
        id: '2',
        partNumber: 'FAP6WSTZ',
        brand: 'Panduit',
        description: '6 Port LC Duplex Fiber Adapter Panel',
        price: 89.99,
        stockLocal: 0,
        stockDistribution: 50,
        leadTime: '1-2 Days',
        category: 'Fiber Panels'
      },
      {
        id: '3',
        partNumber: 'CCH-CP24-E4-DMSI',
        brand: 'DMSI',
        description: '24 Fiber OM3/OM4 LC Adapter Panel - Aqua',
        price: 189.00,
        stockLocal: 8,
        stockDistribution: 100,
        leadTime: 'Ships Today',
        category: 'Fiber Panels'
      }
    ]

    return mockProducts
  }

  // Handle message submission
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const products = await searchProducts(input)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: products.length > 0
          ? `Found ${products.length} products matching your search:`
          : "No products found. Try different search terms.",
        products: products.length > 0 ? products : undefined,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Add to list
  const addToList = (product: Product) => {
    setProductList(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1, addedAt: new Date() }]
    })
  }

  // Update quantity
  const updateQuantity = (id: string, delta: number) => {
    setProductList(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
      }
      return item
    }).filter(Boolean) as ListItem[])
  }

  // Remove from list
  const removeFromList = (id: string) => {
    setProductList(prev => prev.filter(item => item.id !== id))
  }

  // Send list
  const sendList = () => {
    alert('List sent! (This would email/text the list in production)')
  }

  const totalItems = productList.reduce((sum, item) => sum + item.quantity, 0)
  const hasListItems = productList.length > 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-inter">
      {/* Compact Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Plectic AI</h1>
              <p className="text-xs text-gray-600">Electrical Product Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                    Find products instantly
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Search by part number, description, or category
                  </p>

                  {/* Large Search Area */}
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-lg font-medium text-gray-700 mb-3 text-left">
                      Type your search here
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
                        placeholder="Example: Show me all 20 amp breakers in stock..."
                        className="w-full px-6 py-4 border-2 border-blue-500 rounded-lg resize-none focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-600 text-base"
                        rows={6}
                        autoFocus
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                          input.trim()
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
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
                          <span className="text-sm font-medium text-gray-700">Plectic AI</span>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">{message.content}</p>

                        {message.products && (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {/* Table Header */}
                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                              <p className="text-sm font-semibold text-gray-700">Select products to add to your list:</p>
                            </div>

                            {/* Excel-style Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                  <tr className="text-xs text-gray-700">
                                    <th className="px-3 py-2 text-center font-medium">Action</th>
                                    <th className="px-3 py-2 text-left font-medium">Part Number</th>
                                    <th className="px-3 py-2 text-left font-medium">Brand</th>
                                    <th className="px-3 py-2 text-left font-medium">Description</th>
                                    <th className="px-3 py-2 text-right font-medium">Price</th>
                                    <th className="px-3 py-2 text-center font-medium">Stock</th>
                                    <th className="px-3 py-2 text-center font-medium">Lead Time</th>
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
                                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{product.partNumber}</td>
                                      <td className="px-3 py-2 text-sm text-gray-700">{product.brand}</td>
                                      <td className="px-3 py-2 text-sm text-gray-700">{product.description}</td>
                                      <td className="px-3 py-2 text-sm font-medium text-right">${product.price?.toFixed(2)}</td>
                                      <td className="px-3 py-2 text-center">
                                        {product.stockLocal > 0 ? (
                                          <span className="inline-flex items-center gap-1 text-xs">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-green-700 font-medium">Local</span>
                                          </span>
                                        ) : product.stockDistribution > 0 ? (
                                          <span className="inline-flex items-center gap-1 text-xs">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-blue-700 font-medium">DC</span>
                                          </span>
                                        ) : (
                                          <span className="text-xs text-gray-500">Out</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-center text-xs text-gray-600">{product.leadTime}</td>
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
                  <span className="text-sm text-gray-600">Searching inventory...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Only show when there are messages */}
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
                    placeholder="Search for products (e.g., 'fiber panels', '20 amp breakers')..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={1}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                    input.trim() && !isLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Search
                </button>
              </div>
              <button
                type="button"
                onClick={() => setMessages([])}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
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