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

  // Extract products from AI response
  const extractProductsFromMessage = (content: string) => {
    const products: Product[] = []
    const lines = content.split('\n')
    
    lines.forEach(line => {
      // Look for numbered items with part numbers
      const numberedMatch = line.match(/^\d+\.\s*\*\*([A-Z0-9-]+)\*\*/)
      if (numberedMatch) {
        const partNumber = numberedMatch[1]
        
        // Look for brand and description in next lines
        const nextLines = lines.slice(lines.indexOf(line), lines.indexOf(line) + 3)
        let brand = 'Unknown'
        let description = ''
        
        nextLines.forEach(nextLine => {
          const brandMatch = nextLine.match(/- \*\*Brand\*\*:\s*(.+)/)
          const descMatch = nextLine.match(/- \*\*Description\*\*:\s*(.+)/)
          
          if (brandMatch) brand = brandMatch[1].trim()
          if (descMatch) description = descMatch[1].trim()
        })
        
        if (partNumber && description) {
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
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Product List?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete all items from your list? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearList}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-800">Plectic AI Assistant</h1>
          <p className="text-sm text-gray-600">Ask questions to build your product list</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-800 mb-3">Start building your product list!</h3>
                <div className="space-y-2 text-sm text-left">
                  <div>• Ask: "Show me LC connectors"</div>
                  <div>• Click "Add to List" on products you need</div>
                  <div>• Keep asking questions to find more products</div>
                  <div>• Send your complete list for pricing</div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-lg px-4 py-3' 
                    : 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        AI
                      </div>
                      <span className="text-xs text-gray-500">Plectic Assistant</span>
                    </div>
                  )}
                  
                  <div className={`${message.role === 'user' ? 'text-sm' : 'text-sm text-gray-800'}`}>
                    {message.role === 'assistant' ? (
                      // For assistant messages, show products with add buttons
                      <div>
                        {message.content.split('\n').map((line, lineIndex) => {
                          // Check if this line contains a product
                          const productMatch = line.match(/^\d+\.\s*\*\*([A-Z0-9-]+)\*\*/)
                          if (productMatch) {
                            const products = extractProductsFromMessage(message.content)
                            const currentProduct = products.find(p => p.partNumber === productMatch[1])
                            
                            if (currentProduct) {
                              return (
                                <div key={lineIndex} className="border-l-4 border-blue-500 pl-4 py-3 mb-3 bg-blue-50 rounded-r">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-semibold text-blue-700 text-base">
                                        {currentProduct.partNumber}
                                      </div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        {currentProduct.description}
                                      </div>
                                      <div className="text-xs text-green-600 mt-1">
                                        {currentProduct.availability} • {currentProduct.price}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => addToList(currentProduct)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors ml-3"
                                    >
                                      Add to List
                                    </button>
                                  </div>
                                </div>
                              )
                            }
                          }
                          
                          // Regular text lines (skip product detail lines)
                          if (!line.includes('- **Brand**:') && !line.includes('- **Description**:') && 
                              !line.includes('- **Compatibility**:') && line.trim()) {
                            return (
                              <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                                {line}
                              </div>
                            )
                          }
                          return null
                        }).filter(Boolean)}
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
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs text-gray-500">Plectic Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Searching products...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area with Clear Conversation Button */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
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
                className="w-full h-16 border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
            >
              {isLoading ? 'Searching...' : 'Ask'}
            </button>
          </form>
          
          {/* Clear Conversation Button - Bottom Left */}
          <div className="mt-3">
            <button
              onClick={clearConversation}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              Clear Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Product List (Only shows when items exist) */}
      {hasListItems && (
        <div className="w-2/5 bg-white border-l border-gray-200 flex flex-col">
          {/* List Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-800">Product List</h2>
                <p className="text-xs text-gray-600">{currentList.length} items</p>
              </div>
            </div>
          </div>

          {/* List Items - Perfect Alignment Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {currentList.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  {/* Grid Layout for Perfect Alignment */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Change Qty Button - Column 1 */}
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="col-span-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-1 py-1 rounded text-xs font-medium transition-colors text-center"
                    >
                      +
                    </button>
                    
                    {/* Qty Display - Column 2 */}
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-medium">{item.quantity}</span>
                    </div>
                    
                    {/* Part Number - Column 3-5 */}
                    <div className="col-span-3">
                      <div className="font-medium text-blue-600 text-sm truncate">
                        {item.partNumber}
                      </div>
                    </div>
                    
                    {/* Description - Column 6-10 */}
                    <div className="col-span-5">
                      <div className="text-xs text-gray-700 line-clamp-2">
                        {item.description}
                      </div>
                    </div>
                    
                    {/* Delete Button - Column 11-12 */}
                    <button
                      onClick={() => removeFromList(item.id)}
                      className="col-span-2 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {/* Decrease Qty Button (below the + button) */}
                  <div className="grid grid-cols-12 gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="col-span-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-1 py-1 rounded text-xs font-medium transition-colors text-center"
                    >
                      -
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* List Footer with Delete List Button */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-3">
              <button className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
                Request Pricing ({currentList.length} items)
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
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
