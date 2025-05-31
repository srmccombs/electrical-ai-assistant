'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const [showProductPanel, setShowProductPanel] = useState(false)
  const [currentProducts, setCurrentProducts] = useState<any[]>([])

  // Extract products from AI response
  const extractProducts = (content: string) => {
    const products: any[] = []
    const lines = content.split('\n')
    
    lines.forEach(line => {
      // Look for numbered items with part numbers
      const numberedMatch = line.match(/^\d+\.\s*\*\*([A-Z0-9-]+)\*\*/)
      if (numberedMatch) {
        const partNumber = numberedMatch[1]
        
        // Look for brand in next lines
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
            partNumber: partNumber,
            brand: brand,
            description: description,
            price: '

  // Process messages to show products panel
  const latestMessage = messages[messages.length - 1]
  if (latestMessage && latestMessage.role === 'assistant' && currentProducts.length === 0) {
    extractProducts(latestMessage.content)
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Side - Chat Interface */}
      <div className={`flex flex-col ${showProductPanel ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-800">Electrical Products AI Assistant</h1>
          <p className="text-sm text-gray-600">Search inventory and get technical assistance</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-800 mb-3">Welcome! I can help you find:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Fiber connectors, adapters, and panels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Part numbers and specifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Technical recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Inventory availability</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Try: "Show me LC connectors" or "Find Corning panels"
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-lg px-4 py-2' 
                    : 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        AI
                      </div>
                      <span className="text-xs text-gray-500">Assistant</span>
                    </div>
                  )}
                  <div className={`${message.role === 'user' ? 'text-sm' : 'text-sm text-gray-800'}`}>
                    {message.content.split('\n').map((line, lineIndex) => {
                      // Don't show product lines in chat if we have a product panel
                      if (showProductPanel && line.startsWith('•') && line.includes(' - ')) {
                        return null
                      }
                      return (
                        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                          {line}
                        </div>
                      )
                    }).filter(Boolean)}
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
                  <span className="text-xs text-gray-500">Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Searching products...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
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
                placeholder="Ask about electrical products, part numbers, or technical specs..."
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
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Product Panel */}
      {showProductPanel && (
        <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col">
          {/* Product Panel Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-gray-800">Product Results</h2>
              <p className="text-xs text-gray-600">{currentProducts.length} products found</p>
            </div>
            <button 
              onClick={() => setShowProductPanel(false)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {currentProducts.map((product, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-blue-600 text-lg">
                        {product.brand}, {product.partNumber}
                      </div>
                      <div className="text-sm text-gray-800 mt-1">
                        {product.description}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 ml-4">{product.price}</div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.availability === 'In Stock' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.availability}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...currentProducts]
                            newProducts[index].quantity = parseInt(e.target.value) || 1
                            setCurrentProducts(newProducts)
                          }}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition-colors">
                        Details
                      </button>
                      <button className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 transition-colors">
                        Add to Quote
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Panel Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Request Quote for All
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                Export List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} + (Math.random() * 200 + 50).toFixed(2), // Mock pricing
            availability: Math.random() > 0.3 ? 'In Stock' : 'Limited Stock',
            quantity: 1
          })
        }
      }
    })
    
    if (products.length > 0) {
      setCurrentProducts(products)
      setShowProductPanel(true)
    }
  }

  // Process messages to show products panel
  const latestMessage = messages[messages.length - 1]
  if (latestMessage && latestMessage.role === 'assistant' && currentProducts.length === 0) {
    extractProducts(latestMessage.content)
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Side - Chat Interface */}
      <div className={`flex flex-col ${showProductPanel ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-800">Electrical Products AI Assistant</h1>
          <p className="text-sm text-gray-600">Search inventory and get technical assistance</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-800 mb-3">Welcome! I can help you find:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Fiber connectors, adapters, and panels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Part numbers and specifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Technical recommendations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Inventory availability</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Try: "Show me LC connectors" or "Find Corning panels"
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-lg px-4 py-2' 
                    : 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        AI
                      </div>
                      <span className="text-xs text-gray-500">Assistant</span>
                    </div>
                  )}
                  <div className={`${message.role === 'user' ? 'text-sm' : 'text-sm text-gray-800'}`}>
                    {message.content.split('\n').map((line, lineIndex) => {
                      // Don't show product lines in chat if we have a product panel
                      if (showProductPanel && line.startsWith('•') && line.includes(' - ')) {
                        return null
                      }
                      return (
                        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                          {line}
                        </div>
                      )
                    }).filter(Boolean)}
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
                  <span className="text-xs text-gray-500">Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Searching products...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about electrical products, part numbers, or technical specs..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Product Panel */}
      {showProductPanel && (
        <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col">
          {/* Product Panel Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-gray-800">Product Results</h2>
              <p className="text-xs text-gray-600">{currentProducts.length} products found</p>
            </div>
            <button 
              onClick={() => setShowProductPanel(false)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {currentProducts.map((product, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-blue-600">{product.partNumber}</div>
                    <div className="text-lg font-bold text-green-600">{product.price}</div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Brand:</span> {product.brand}
                  </div>
                  
                  <div className="text-sm text-gray-800 mb-3">
                    {product.description}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.availability === 'In Stock' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.availability}
                    </span>
                    
                    <div className="flex gap-2">
                      <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition-colors">
                        View Details
                      </button>
                      <button className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 transition-colors">
                        Add to Quote
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Panel Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Request Quote for All
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                Export List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
