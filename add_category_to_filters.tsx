// Add Category Filter to Smart Filters
// Add this to FilterSection.tsx after the other filter sections

// Category Filter Section (add after Product Line filter, around line 367)
{(() => {
  // Extract unique categories from products
  const categories = new Set<string>()
  products.forEach(product => {
    if (product.category) {
      categories.add(product.category)
    }
  })
  
  // Only show if there are multiple categories
  if (categories.size <= 1) return null
  
  const availableCategories = Array.from(categories).sort()
  const isActive = (category: string) => activeFilters.category === category
  
  return (
    <div className="mb-3">
      <span className="text-xs font-medium text-gray-600 block mb-1">Product Type:</span>
      <div className="flex flex-wrap gap-1">
        {availableCategories.map(category => (
          <button
            key={category}
            onClick={() => onApplyFilter(messageId, 'category', category, products)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              isActive(category)
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
            }`}
          >
            {category}
          </button>
        ))}
        {activeFilters.category && (
          <button
            onClick={() => onClearFilter(messageId, 'category', products)}
            className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
          >
            All Types
          </button>
        )}
      </div>
    </div>
  )
})()}