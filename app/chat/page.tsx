/* 
 * PLECTIC AI ASSISTANT - CHAT INTERFACE
 * Version: 2.0.0 - Excel Style with Add Buttons
 * Date: January 1, 2025
 * Changes: Large input, clean formatting, working Add buttons, blue theme
 */
'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'

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

  // Add item to list
  const addToList = (product: Product) => {
    const existingItem = currentList.find(item => item.partNumber === product.partNumber)
    
    if (existingItem) {
      // Increase quantity if item already exists
      setCurrentList(currentList.map(item => 
        item.partNumber === product.partNumber 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Add new item to list
      const newItem: ListItem = {
        ...product,
        quantity: 1,
        id: Date.now().toString()
      }
      setCurrentList([...currentList, newItem])
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

  // Extract products from AI response - FIXED formatting
  const extractProductsFromMessage = (content: string) => {
    const products: Product[] = []
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      // Look for numbered items with part numbers (remove ** formatting)
      const numberedMatch = line.match(/^\d+\.\s*\*\*([A-Z0-9-]+)\*\*/)
      if (numberedMatch) {
        const partNumber = numberedMatch[1]
        
        // Look for brand and description in next lines
        const nextLines = lines.slice(index, index + 5)
        let brand = ''
        let description = ''
        
        nextLines.forEach(nextLine => {
          // Remove ** formatting from brand and description
          const brandMatch = nextLine.match(/- \*\*Brand:\*\*\s*(.+)/)
          const descMatch = nextLine.match(/- \*\*Description:\*\*\s*(.+)/)
          
          if (brandMatch) brand = brandMatch[1].trim()
          if (descMatch) description = descMatch[1].trim()
        })
        
        if (partNumber && description && brand) {
          products.push({
            partNumber,
            brand,
            description,
            price: '$' + (Math.random() * 200 + 50).toFixed(2),
            availability: Math.random() > 0.3 ? 'In Stock' : 'Limited Stock'
          })
        }
      }
    })
    
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
                        {/* Clean display without application info and product extraction */}
                        {(() => {
                          const products = extractProductsFromMessage(message.content)
                          const hasProducts = products.length > 0
                          
                          if (hasProducts) {
                            return (
                              <div>
                                {/* Show intro text */}
                                {message.content.split('\n').map((line, lineIndex) => {
                                  if (!line.match(/^\d+\./) && !line.includes('- **') && line.trim() && 
                                      !line.toLowerCase().includes('application') && !line.toLowerCase().includes('ideal for')) {
                                    return (
                                      <div key={lineIndex} className="mb-4">
                                        {line}
                                      </div>
                                    )
                                  }
                                  return null
                                }).filter(Boolean)}
                                
                                {/* Excel-style product table - THIS IS LINE ~125 */}
                                <div className="mt-4">
                                  {/* Header Row */}
                                  <div className="grid grid-cols-12 gap-2 bg-blue-600 text-white p-3 rounded-t-lg font-semibold text-sm">
                                    <div className="col-span-2 text-center">Add to List</div>
                                    <div className="col-span-1 text-center">Qty</div>
                                    <div className="col-span-2">Brand</div>
                                    <div className="col-span-3">Part Number</div>
                                    <div className="col-span-4">Description</div>
                                  </div>
                                  
                                  {/* Product Rows */}
                                  {products.map((product, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 bg-white border-l-2 border-r-2 border-b-2 border-blue-200 p-3 hover:bg-blue-50 transition-colors">
                                      {/* Add Button */}
                                      <div className="col-span-2 flex justify-center">
                                        <button
                                          onClick={() => addToList(product)}
                                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors border-2 border-blue-600"
                                        >
                                          Add
                                        </button>
                                      </div>
                                      
                                      {/* Quantity (always 1 for new items) */}
                                      <div className="col-span-1 text-center text-sm font-medium text-gray-700">
                                        1
                                      </div>
                                      
                                      {/* Brand */}
                                      <div className="col-span-2 text-sm font-medium text-blue-700">
                                        {product.brand}
                                      </div>
                                      
                                      {/* Part Number */}
                                      <div className="col-span-3 text-sm font-semibold text-gray-800">
                                        {product.partNumber}
                                      </div>
                                      
                                      {/* Description */}
                                      <div className="col-span-4 text-xs text-gray-700">
                                        {product.description}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Bottom border */}
                                  <div className="border-b-2 border-blue-200 rounded-b-lg"></div>
                                </div>
                              </div>
                            )
                          } else {
                            // No products found, show regular message
                            return (
                              <div>
                                {message.content.split('\n').map((line, lineIndex) => {
                                  if (line.trim() && !line.toLowerCase().includes('application') && !line.toLowerCase().includes('ideal for')) {
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
                      // User messages - simple display
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

        {/* Large Input Area - Claude/ChatGPT Style */}
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
          
          {/* Clear Conversation Button - Bottom Left */}
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

      {/* Right Side - Product List (Only shows when items exist) */}
      {hasListItems && (
        <div className="w-2/5 bg-white border-l-2 border-blue-500 flex flex-col">
          {/* List Header */}
          <div className="bg-blue-600 text-white p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Product List</h2>
                <p className="text-blue-100 text-sm">{currentList.length} items</p>
              </div>
            </div>
          </div>

          {/* List Items - Excel Style Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 bg-blue-100 border-2 border-blue-300 p-3 font-semibold text-sm text-blue-800">
              <div className="col-span-1 text-center">+</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2">Brand</div>
              <div className="col-span-4">Part Number</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1 text-center">Del</div>
            </div>
            
            {/* Product Rows */}
            <div className="space-y-1">
              {currentList.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 border-2 border-blue-200 bg-white hover:bg-blue-50 p-3 transition-colors">
                  {/* Increase Qty Button */}
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="col-span-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-bold transition-colors text-center py-1"
                  >
                    +
                  </button>
                  
                  {/* Qty Display */}
                  <div className="col-span-1 text-center font-semibold text-sm">
                    {item.quantity}
                  </div>
                  
                  {/* Brand */}
                  <div className="col-span-2 text-sm font-medium text-blue-700 truncate">
                    {item.brand}
                  </div>
                  
                  {/* Part Number */}
                  <div className="col-span-4 text-sm font-semibold text-gray-800 truncate">
                    {item.partNumber}
                  </div>
                  
                  {/* Description */}
                  <div className="col-span-3 text-xs text-gray-700 line-clamp-2">
                    {item.description}
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromList(item.id)}
                    className="col-span-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-bold transition-colors text-center py-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* List Footer */}
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
