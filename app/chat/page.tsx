/* 
 * PLECTIC AI ASSISTANT - CHAT INTERFACE
 * Version: 3.1.0 - Excel-Style Compact Layout
 * Date: May 31, 2025
 * Changes: Compact table layout, Excel-style display, immediate 60/40 split
 */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Minus, X, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'
//import { useChat } from 'ai/react'

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
    // const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const handleInputChange = (e: any) => setInput(e.target.value)
  const handleSubmit = (e: any) => {
    e.preventDefault()
    console.log('Chat submitted:', input)
    setInput('')
  }

  const [productList, setProductList] = useState<ListItem[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  // Clear conversation
  const clearConversation = () => {
    setMessages([])
  }

  // Clear list
  const clearList = () => {
    setProductList([])
    setShowDeleteConfirm(false)
  }

  // Send list
  const sendList = () => {
    alert('List sent! (This would email/text the list in production)')
  }

  const totalItems = productList.reduce((sum, item) => sum + item.quantity, 0)
  const hasListItems = productList.length > 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Compact Header */}
      <header className="bg-white border-b border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Plectic AI Assistant</h1>
              <p className="text-xs text-gray-600">Ask questions to build your product list</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section - 60% when list has items */}
        <div className={`flex-1 flex flex-col ${hasListItems ? 'w-3/5' : 'w-full'}`}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Start by searching for products. Try "Show me fiber panels" or "List all breakers"
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'user' ? (
                      <div className="flex justify-end mb-2">
                        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg max-w-md">
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-600">Plectic AI</span>
                        </div>
                        
                        {(() => {
                          const products = extractProductsFromMessage(message.content)
                          if (products.length > 0) {
                            return (
                              <div>
                                <p className="text-sm text-gray-700 mb-3">
                                  {message.content.split('\n')[0]}
                                </p>
                                
                                {/* EXCEL-STYLE TABLE */}
                                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                                  {/* Table Header */}
                                  <div className="bg-gray-100 border-b border-gray-300 px-3 py-2">
                                    <p className="text-sm font-semibold text-gray-700">Add items to list:</p>
                                  </div>
                                  
                                  {/* Table Headers */}
                                  <div className="grid grid-cols-12 gap-0 bg-gray-50 border-b border-gray-300 text-xs font-semibold text-gray-700">
                                    <div className="col-span-1 p-2 text-center border-r border-gray-200">Add</div>
                                    <div className="col-span-2 p-2 border-r border-gray-200">Part Number</div>
                                    <div className="col-span-1 p-2 border-r border-gray-200">Brand</div>
                                    <div className="col-span-5 p-2 border-r border-gray-200">Description</div>
                                    <div className="col-span-1 p-2 text-right border-r border-gray-200">Price</div>
                                    <div className="col-span-1 p-2 text-center border-r border-gray-200">Stock</div>
                                    <div className="col-span-1 p-2 text-center">Lead Time</div>
                                  </div>
                                  
                                  {/* Product Rows */}
                                  {products.map((product, index) => (
                                    <div 
                                      key={product.id} 
                                      className={`grid grid-cols-12 gap-0 text-xs hover:bg-blue-50 ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                      }`}
                                    >
                                      <div className="col-span-1 p-2 text-center border-r border-gray-200">
                                        <button
                                          onClick={() => addToList(product)}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                        >
                                          Add
                                        </button>
                                      </div>
                                      <div className="col-span-2 p-2 font-medium border-r border-gray-200">{product.partNumber}</div>
                                      <div className="col-span-1 p-2 border-r border-gray-200">{product.brand}</div>
                                      <div className="col-span-5 p-2 border-r border-gray-200">{product.description}</div>
                                      <div className="col-span-1 p-2 text-right font-medium border-r border-gray-200">${product.price?.toFixed(2)}</div>
                                      <div className="col-span-1 p-2 text-center border-r border-gray-200">
                                        {product.stockLocal > 0 ? (
                                          <span className="text-green-600 font-medium">✓ Local</span>
                                        ) : product.stockDistribution > 0 ? (
                                          <span className="text-blue-600">DC</span>
                                        ) : (
                                          <span className="text-red-600">Out</span>
                                        )}
                                      </div>
                                      <div className="col-span-1 p-2 text-center text-gray-600">{product.leadTime}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div className="bg-gray-100 rounded-lg p-3">
                                <p className="text-sm text-gray-700">{message.content}</p>
                              </div>
                            )
                          }
                        })()}
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Searching inventory...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-300 bg-white p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
                placeholder="Ask about electrical products..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
                rows={2}
              />
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearConversation}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Product List - 40% */}
        {hasListItems && (
          <div className="w-2/5 bg-white border-l border-gray-300 flex flex-col">
            {/* List Header */}
            <div className="bg-gray-100 border-b border-gray-300 p-3 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-900">Product List</h2>
                <p className="text-xs text-gray-600">{productList.length} items • {totalItems} total qty</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b border-gray-200">
                    <th className="p-2 text-left">Part #</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 font-medium">{item.partNumber}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2 text-right">${item.price?.toFixed(2)}</td>
                      <td className="p-2 text-right font-medium">${((item.price || 0) * item.quantity).toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeFromList(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* List Footer */}
            <div className="border-t border-gray-300 p-3 bg-gray-50">
              <div className="flex justify-between text-sm mb-3">
                <span className="font-semibold">Total:</span>
                <span className="font-bold">${productList.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2)}</span>
              </div>
              <button
                onClick={sendList}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Send List for Quote
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-xl">
            <h3 className="font-semibold mb-2">Clear Product List?</h3>
            <p className="text-sm text-gray-600 mb-4">This will remove all items from your list.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={clearList}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              >
                Clear List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
