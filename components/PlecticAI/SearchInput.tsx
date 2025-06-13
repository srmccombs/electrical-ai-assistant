import React, { memo, useRef, useCallback, useState, useEffect } from 'react'
import { Search, Send, Zap, Clock } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  recentSearches?: string[]
  popularSearches?: string[]
}

export const SearchInput = memo<SearchInputProps>(({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Try: 'CCH-02U', '4RU fiber enclosure', 'Corning enclosure'...",
  className = "",
  showSuggestions = true,
  recentSearches = [],
  popularSearches = []
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion)
    setShowDropdown(false)
    onSubmit()
  }, [onChange, onSubmit])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleFocus = useCallback(() => {
    if (showSuggestions && (recentSearches.length > 0 || popularSearches.length > 0)) {
      setShowDropdown(true)
    }
  }, [showSuggestions, recentSearches, popularSearches])

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestions
    setTimeout(() => setShowDropdown(false), 200)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full resize-none overflow-hidden bg-white text-gray-900 placeholder-gray-500 pr-12 p-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={1}
        disabled={isLoading}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim() || isLoading}
        className={`absolute right-2 bottom-2 p-2 rounded transition-all ${
          value.trim() && !isLoading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          <Send size={20} />
        )}
      </button>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && showDropdown && !value && (recentSearches.length > 0 || popularSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <Clock size={12} />
                Recent Searches
              </h4>
              <div className="space-y-1">
                {recentSearches.slice(0, 3).map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {popularSearches.length > 0 && (
            <div className="p-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <Zap size={12} />
                Popular Searches
              </h4>
              <div className="space-y-1">
                {popularSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

SearchInput.displayName = 'SearchInput'