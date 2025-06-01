/* 
 * PLECTIC AI ASSISTANT - CHAT INTERFACE
 * Version: 2.0.1 - Fixed Add Buttons & Perfect Alignment
 * Date: January 1, 2025
 * Changes: Working Add buttons, perfect Excel-style alignment, functional list building
 */
'use client'

import { useChat } from 'ai/react'
import { useState, useEffect } from 'react'

interface Product {
  partNumber: string
  brand: string
  description: string
  price?: string
  availability?: string
}

interface ListItem extends Product {
  quantity: number
  id: string
}

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat()
  const [currentList, setCurrentList] = useState<ListItem[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Add item to list - FIXED
  const addToList = (product: Product) => {
    console.log('Adding product:', product) // Debug log
    const existingItem = currentList.find(item => item.partNumber === product.partNumber)
    
    if (existingItem) {
      setCurrentList(currentList.map(item => 
        item.partNumber === product.partNumber 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      const newItem: ListItem = {
        ...product,
        quantity: 1,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }
      setCurrentList(prev => [...prev, newItem])
    }
  }

  // Remove item from list
  const removeFromList = (id: string) => {
    setCurrentList(currentList.filter(item => item.id !== id))
  }

  // Update quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromList(id)
    } else {
      setCurrentList(currentList.map(item => 
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  // Clear conversation
  const clearConversation = () => {
    setMessages([])
  }

  // Clear list with confirmation
  const clearList = () => {
    setCurrentList([])
    setShowDeleteConfirm(false)
  }

  // Extract products from AI response - IMPROVED
  const extractProductsFromMessage = (content: string) => {
    const products: Product[] = []
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      // Look for numbered items with part numbers
      const numberedMatch = line.match(/^\d+\.\s*\*\*([A-Z0-9-]+)\*\*/) || 
                           line.match(/^\d+\.\s*([A-Z0-9-]+)/)
      
      if (numberedMatch) {
        const partNumber = numberedMatch[1]
        const nextLines = lines.slice(index, index + 8)
        let brand = ''
        let description = ''
        
        // Look for brand and description patterns
        nextLines.forEach(nextLine => {
          // Multiple brand patterns
          const brandMatch = nextLine.match(/\*\*Brand:\*\*\s*(.+)/) ||
                           nextLine.match(/Brand:\s*(.+)/) ||
                           nextLine.match(/- \*\*Brand\*\*:\s*(.+)/)
                           
          // Multiple description patterns  
          const descMatch = nextLine.match(/\*\*Description:\*\*\s*(.+)/) ||
                          nextLine.match(/Description:\s*(.+)/) ||
                          nextLine.match(/- \*\*Description\*\*:\s*(.+)/)
          
          if (brandMatch) brand = brandMatch[1].trim()
          if (descMatch) description = descMatch[1].trim()
        })
        
        // If no explicit brand/description found, try to extract from part number pattern
        if (!brand || !description) {
          // For DMSI products, brand is DMSI
          if (partNumber.includes('DMSI')) {
            brand = 'DMSI'
          }
          // Try to find description in nearby lines
          if (!description) {
            const descLine = nextLines.find(line => 
              line.includes(partNumber) && 
              line.length > partNumber.length + 10
            )
            if (descLine) {
              description = descLine.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').replace(partNumber, '').trim()
            }
          }
        }
        
        if (partNumber && (description || brand)) {
          products.push({
            partNumber,
            brand: brand || 'Unknown',
            description: description || 'No description available',
            price: '$' + (Math.random() * 200 + 50).toFixed(2),
            availability: Math.random() > 0.3 ? 'In Stock' : 'Limited Stock'
          })
        }
      }
    })
    
    console.log('Extracted products:', products) // Debug log
    return products
  }

  const hasListItems = currentList.length > 0

  return (
    <div className="h-screen bg-gray-50 flex relative">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Product List?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete all items from your list? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={clearList}
                className="px-4 py-2 bg-red-600 border-2 border-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Chat Interface */}
      <div className={`flex flex-col transition-all duration-300 ${hasListItems ? 'w-3/5' : 'w-full'}`}>
        {/* Header */}
        <div className="bg-white border-b-2 border-blue-500 p-4">
          <h1 className="text-2xl font-bold text-blue-600">Plectic AI Assistant</h1>
          <p className="text-sm text-gray-600">Ask questions to build your product list</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-800 mb-3">Start building your product list!</h3>
                <div className="space-y-2 text-sm text-left">
                  <div>• Ask: "Show me LC connectors"</div>
                  <div>• Click "Add" on products you need</div>
                  <div>• Keep asking questions to find more products</div>
                  <div>• Send your complete list for pricing</div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${
                  message.role === 'user' 
                    ? 'bg-blue-600 border-2 border-blue-700 text-white rounded-lg px-4 py-3' 
                    : 'bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        AI
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Plectic Assistant</span>
                    </div>
                  )}
                  
                  <div className={`${message.role === 'user' ? 'text-sm' : 'text-sm text-gray-800'}`}>
                    {message.role === 'assistant' ? (
                      <div>
                        {(() => {
                          const products = extractProductsFromMessage(message.content)
                          const hasProducts = products.length > 0
                          
                          if (hasProducts) {
                            return (
                              <div>
                                {/* Show intro text */}
                                {message.content.split('\n').map((line, lineIndex) => {
                                  if (!line.match(/^\d+\./) && !line.includes('**') && line.trim() && 
                                      !line.toLowerCase().includes('application') && 
                                      !line.toLowerCase().includes('ideal for') &&
                                      !line.toLowerCase().includes('designed for') &&
                                      !line.toLowerCase().includes('compatible with')) {
                                    return (
                                      <div key={lineIndex} className="mb-4">
                                        {line}
                                      </div>
                                    )
                                  }
                                  return null
                                }).filter(Boolean)}
                                
                                {/* PERFECT EXCEL-STYLE TABLE */}
                                <div className="mt-4 border-2 border-blue-300 rounded-lg overflow-hidden">
                                  {/* Header Row - Perfect Alignment */}
                                  <div className="bg-blue-600 text-white">
                                    <div className="grid grid-cols-10 gap-0">
                                      <div className="col-span-2 p-3 text-center font-semibold text-sm border-r border-blue-500">
                                        Add to List
                                      </div>
                                      <div className="col-span-1 p-3 text-center font-semibold text-sm border-r border-blue-500">
                                        Qty
                                      </div>
                                      <div className="col-span-2 p-3 font-semibold text-sm border-r border-blue-500">
                                        Brand
                                      </div>
                                      <div className="col-span-2 p-3 font-semibold text-sm border-r border-blue-500">
                                        Part Number
                                      </div>
                                      <div className="col-span-3 p-3 font-semibold text-sm">
                                        Description
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Product Rows - Perfect Alignment */}
                                  {products.map((product, index) => (
                                    <div key={index} className="bg-white border-b border-blue-200 hover:bg-blue-50 transition-colors">
                                      <div className="grid grid-cols-10 gap-0">
                                        {/* Add Button - Perfectly Centered */}
                                        <div className="col-span-2 p-3 flex justify-center items-center border-r border-blue-200">
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault()
                                              console.log('Button clicked for:', product.partNumber)
                                              addToList(product)
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors border border-blue-600 shadow-sm"
                                          >
                                            Add
                                          </button>
                                        </div>
                                        
                                        {/* Quantity */}
                                        <div className="col-span-1 p-3 text-center text-sm font-medium text-gray-700 border-r border-blue-200 flex items-center justify-center">
                                          1
                                        </div>
                                        
                                        {/* Brand */}
                                        <div className="col-span-2 p-3 text-sm font-medium text-blue-700 border-r border-blue-200 flex items-center">
                                          {product.brand}
                                        </div>
                                        
                                        {/* Part Number */}
                                        <div className="col-span-2 p-3 text-sm font-semibold text-gray-800 border-r border-blue-200 flex items-center">
                                          {product.partNumber}
                                        </div>
                                        
                                        {/* Description */}
                                        <div className="col-span-3 p-3 text-xs text-gray-700 flex items-center">
                                          {product.description}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          } else {
                            // No products found, show regular message
                            return (
                              <div>
                                {message.content.split('\n').map((line, lineIndex) => {
                                  if (line.trim()) {
                                    return (
                                      <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                                        {line}
                                      </div>
                                    )
                                  }
                                  return null
                                }).filter(Boolean)}
                              </div>
                            )
                          }
                        })()}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Plectic Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Searching products...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Large Input Area */}
        <div className="bg-white border-t-2 border-blue-500 p-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => handleInputChange({ target: { value: e.target.value } } as any)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
                placeholder="Ask about electrical products to build your list..."
                className="w-full min-h-[80px] max-h-[200px] border-2 border-blue-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={isLoading}
                style={{ height: 'auto', minHeight: '80px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                }}
              />
              <div className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
            >
              {isLoading ? 'Searching...' : 'Ask'}
            </button>
          </form>
          
          <div className="mt-4">
            <button
              onClick={clearConversation}
              className="bg-gray-500 hover:bg-gray-600 border-2 border-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Clear Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Product List */}
      {hasListItems && (
        <div className="w-2/5 bg-white border-l-2 border-blue-500 flex flex-col">
          <div className="bg-blue-600 text-white p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Product List</h2>
                <p className="text-blue-100 text-sm">{currentList.length} items</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* PERFECT EXCEL-STYLE LIST HEADER */}
            <div className="border-2 border-blue-300 rounded-lg overflow-hidden">
              <div className="bg-blue-100 border-b border-blue-300">
                <div className="grid grid-cols-12 gap-0">
                  <div className="col-span-1 p-2 text-center font-semibold text-sm text-blue-800 border-r border-blue-300">+</div>
                  <div className="col-span-1 p-2 text-center font-semibold text-sm text-blue-800 border-r border-blue-300">Qty</div>
                  <div className="col-span-2 p-2 font-semibold text-sm text-blue-800 border-r border-blue-300">Brand</div>
                  <div className="col-span-4 p-2 font-semibold text-sm text-blue-800 border-r border-blue-300">Part Number</div>
                  <div className="col-span-3 p-2 font-semibold text-sm text-blue-800 border-r border-blue-300">Description</div>
                  <div className="col-span-1 p-2 text-center font-semibold text-sm text-blue-800">Del</div>
                </div>
              </div>
              
              {/* PERFECT EXCEL-STYLE LIST ITEMS */}
              {currentList.map((item) => (
                <div key={item.id} className="bg-white border-b border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="grid grid-cols-12 gap-0">
                    <div className="col-span-1 p-2 flex justify-center items-center border-r border-blue-200">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-bold w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="col-span-1 p-2 text-center font-semibold text-sm border-r border-blue-200 flex items-center justify-center">
                      {item.quantity}
                    </div>
                    
                    <div className="col-span-2 p-2 text-sm font-medium text-blue-700 border-r border-blue-200 flex items-center truncate">
                      {item.brand}
                    </div>
                    
                    <div className="col-span-4 p-2 text-sm font-semibold text-gray-800 border-r border-blue-200 flex items-center truncate">
                      {item.partNumber}
                    </div>
                    
                    <div className="col-span-3 p-2 text-xs text-gray-700 border-r border-blue-200 flex items-center">
                      <div className="line-clamp-2">{item.description}</div>
                    </div>
                    
                    <div className="col-span-1 p-2 flex justify-center items-center">
                      <button
                        onClick={() => removeFromList(item.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-bold w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-blue-500 p-4 bg-blue-50">
            <div className="flex gap-3">
              <button className="flex-1 bg-green-600 hover:bg-green-700 border-2 border-green-700 text-white py-3 px-4 rounded-lg font-bold transition-colors">
                Request Pricing ({currentList.length} items)
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 border-2 border-red-700 text-white py-3 px-4 rounded-lg font-bold transition-colors"
              >
                Delete List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
