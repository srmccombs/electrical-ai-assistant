'use client'

import { useChat } from 'ai/react'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Electrical Products AI Assistant
          </h1>
          <p className="text-gray-600">
            Search inventory, find products, and get technical assistance
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Built by an electrical distribution expert with 35 years of experience
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500">
                <p className="mb-4 font-semibold">Welcome! I can help you find electrical products:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <strong>Product Search:</strong>
                    <br />• Find by part number
                    <br />• Search by brand
                    <br />• Browse categories
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <strong>Technical Help:</strong>
                    <br />• Specifications
                    <br />• Compatibility
                    <br />• Installation tips
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-400">
                  Try: "Show me fiber connectors" or "Find Corning products"
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-yellow-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <p className="text-sm">🔍 Searching products and analyzing...</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex space-x-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about electrical products, part numbers, or technical specs..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Searching...' : 'Send'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Quick examples to try:</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="bg-gray-200 px-2 py-1 rounded cursor-pointer hover:bg-gray-300">"Show me fiber connectors"</span>
            <span className="bg-gray-200 px-2 py-1 rounded cursor-pointer hover:bg-gray-300">"Find adapter panels"</span>
            <span className="bg-gray-200 px-2 py-1 rounded cursor-pointer hover:bg-gray-300">"Search Corning products"</span>
            <span className="bg-gray-200 px-2 py-1 rounded cursor-pointer hover:bg-gray-300">"What do you have in stock?"</span>
          </div>
        </div>
      </div>
    </div>
  )
}