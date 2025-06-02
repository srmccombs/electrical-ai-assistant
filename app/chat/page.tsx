'use client'

import React, { useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'

// Proper TypeScript interfaces
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  // Properly typed state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Properly typed event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call your chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center text-white">
              <MessageCircle size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Chat Assistant</h1>
              <p className="text-xs text-gray-600">Powered by OpenAI</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear Chat
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={28} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI Chat Assistant
              </h2>
              <p className="text-gray-600 mb-8">
                Ask me anything about electrical products, technical specifications, or general questions
              </p>
            </div>
          ) : (
            messages.map((message: ChatMessage) => (
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
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                        <MessageCircle size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <MessageCircle size={14} className="text-white animate-pulse" />
              </div>
              <span className="text-sm text-gray-600">AI is thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me about electrical products, specifications, or anything else..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              input.trim() && !isLoading
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}