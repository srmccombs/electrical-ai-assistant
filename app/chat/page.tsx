/* 
 * PLECTIC AI ASSISTANT - CHAT INTERFACE
 * Version: 3.0.0 - Complete Apple-Inspired Redesign
 * Date: May 31, 2025
 * Changes: Beautiful new interface with modern design
 */
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Minus, X, Send, Zap, Package, AlertCircle, CheckCircle, Clock, Menu, Settings, HelpCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useChat } from 'ai/react'

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
}

interface ListItem extends Product {
  quantity: number
  addedAt: Date
}

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat()
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

  // Extract products from AI response
  const extractProductsFromMessage = (content: string) => {
    const products: Product[] = []
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      const numberedMatch = line.match(/^\d+\.\s*\*\*([A-Z0-9-]+)\*\*/) || 
                           line.match(/^\d+\.\s*([A-Z0-9-]+)/)
      
      if (numberedMatch) {
        const partNumber = numberedMatch[1]
        const nextLines = lines.slice(index, index + 8)
        let brand = ''
        let description = ''
        
        nextLines.forEach(nextLine => {
          const brandMatch = nextLine.match(/\*\*Brand:\*\*\s*(.+)/) ||
                           nextLine.match(/Brand:\s*(.+)/) ||
                           nextLine.match(/- \*\*Brand\*\*:\s*(.+)/)
                           
          const descMatch = nextLine.match(/\*\*Description:\*\*\s*(.+)/) ||
                          nextLine.match(/Description:\s*(.+)/) ||
                          nextLine.match(/- \*\*Description\*\*:\s*(.+)/)
          
          if (brandMatch) brand = brandMatch[1].trim()
          if (descMatch) description = descMatch[1].trim()
        })
        
        if (!brand && partNumber.includes('DMSI')) {
          brand = 'DMSI'
        }
        
        if (!description) {
          const descLine = nextLines.find(line => 
            line.includes(partNumber) && 
            line.length > partNumber.length + 10
          )
          if (descLine) {
            description = descLine.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').replace(partNumber, '').trim()
          }
        }
        
        if (partNumber && (description || brand)) {
          products.push({
            id: Date.now().toString() + index,
            partNumber,
            brand: brand || 'Unknown',
            description: description || 'No description available',
            price: Math.random() * 200 + 50,
            stockLocal: Math.floor(Math.random() * 20),
            stockDistribution: Math.floor(Math.random() * 100),
            leadTime: 'Ships Today',
            category: 'Electrical'
          })
        }
      }
    })
    
    return products
  }

  // Add to list
  const addToList = useCallback((product: Product) => {
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
  }, [])

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

  // Clear conversation
  const clearConversation = () => {
    setMessages([])
  }

  // Send list
  const sendList = () => {
    alert('List sent! (This would email/text the list in production)')
  }

  // Stock indicator component
  const StockIndicator = ({ local, distribution }: { local: number; distribution: number }) => {
    if (local > 0) {
      return (
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-700 font-medium">In Stock Locally</span>
        </div>
      )
    } else if (distribution > 0) {
      return (
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-blue-700 font-medium">Distribution Center</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 text-xs">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span className="text-gray-600">Out of Stock</span>
      </div>
    )
  }

  // Product card component
  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
          <Package size={32} className="text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{product.partNumber}</h4>
              <p className="text-sm text-gray-600">{product.brand}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">${product.price?.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{product.leadTime}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <StockIndicator local={product.stockLocal} distribution={product.stockDistribution} />
            <button
              onClick={() => addToList(product)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add to List
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const totalItems = productList.reduce((sum, item) => sum + item.quantity, 0)
  const hasListItems = productList.length > 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Plectic AI</h1>
              <p className="text-xs text-gray-600">Electrical Product Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings size={20} className="text-gray-600" />
            </button>
            {hasListItems && (
              <button
                onClick={() => setShowMobileList(!showMobileList)}
                className="lg:hidden relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package size={20} className="text-gray-600" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className={`flex-1 flex flex-col ${hasListItems ? 'lg:w-3/5' : 'w-full'}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Find the right products instantly
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Just describe what you need. I'll search our inventory and help you build your order.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['20 amp breakers', 'LC fiber connectors', 'CAT6 blue jacks'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <Zap size={16} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Plectic AI</span>
                        </div>
                      )}
                      
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <p className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {message.content.split('\n')[0]}
                        </p>
                      </div>

                      {message.role === 'assistant' && (() => {
                        const products = extractProductsFromMessage(message.content)
                        if (products.length > 0) {
                          return (
                            <div className="mt-4 space-y-3">
                              {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                              ))}
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                        <Zap size={16} className="text-white animate-pulse" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Plectic AI</span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                        </div>
                        <span className="text-sm text-gray-600">Searching inventory...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-4 py-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className={`relative rounded-2xl border-2 transition-all ${
                searchFocus ? 'border-blue-500 shadow-lg' : 'border-gray-300'
              }`}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e as any)
                    }
                  }}
                  placeholder="Describe what you're looking for..."
                  className="w-full px-4 py-3 pr-12 resize-none rounded-2xl focus:outline-none text-gray-900 placeholder-gray-500"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all ${
                    input.trim() && !isLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Press Enter to search • Shift+Enter for new line
                </p>
                <button
                  type="button"
                  onClick={clearConversation}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear conversation
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Product List - Desktop */}
        {hasListItems && (
          <div className="hidden lg:flex lg:w-2/5 border-l border-gray-200 bg-white flex-col">
            <div className="p-4 border-b border-gray-200">
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

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {productList.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.partNumber}</h4>
                        <p className="text-sm text-gray-600">{item.brand}</p>
                      </div>
                      <button
                        onClick={() => removeFromList(item.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        ${((item.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Subtotal</span>
                  <span>${productList.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>
              </div>
              <button
                onClick={sendList}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Send List for Quote
              </button>
            </div>
          </div>
        )}

        {/* Mobile Product List */}
        {hasListItems && showMobileList && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
                    <p className="text-sm text-gray-600">{productList.length} items • {totalItems} total qty</p>
                  </div>
                  <button
                    onClick={() => setShowMobileList(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {productList.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.partNumber}</h4>
                            <p className="text-sm text-gray-600">{item.brand}</p>
                          </div>
                          <button
                            onClick={() => removeFromList(item.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            ${((item.price || 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <button
                    onClick={sendList}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Send List for Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
