import React, { memo, useCallback, useMemo } from 'react'
import { Filter } from 'lucide-react'
import type { Product, SmartFilters, ActiveFilters } from '../../types'

interface FilterSectionProps {
  messageId: string
  products: Product[]
  smartFilters: SmartFilters
  activeFilters: ActiveFilters
  filteredProducts: Product[]
  autoAppliedFilters?: { [filterType: string]: string }
  onApplyFilter: (messageId: string, filterType: string, value: string, products: Product[]) => void
  onClearFilter: (messageId: string, filterType: string, products: Product[]) => void
}

interface DynamicFilterSectionProps {
  messageId: string
  filterType: string
  label: string
  activeColor: string
  inactiveColor: string
  icon?: string
  customButtonStyle?: (value: string, isActive: boolean) => string
  products: Product[]
  filteredProducts: Product[]
  activeFilters: ActiveFilters
  onApplyFilter: (messageId: string, filterType: string, value: string, products: Product[]) => void
  onClearFilter: (messageId: string, filterType: string, products: Product[]) => void
}

// Memoized color button style function
const getColorButtonStyle = (color: string, isActive: boolean): string => {
  const colorStyles: Record<string, string> = {
    'blue': isActive ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600',
    'red': isActive ? 'bg-red-600 text-white' : 'bg-red-500 text-white hover:bg-red-600',
    'green': isActive ? 'bg-green-600 text-white' : 'bg-green-500 text-white hover:bg-green-600',
    'yellow': isActive ? 'bg-yellow-600 text-black' : 'bg-yellow-400 text-black hover:bg-yellow-500',
    'orange': isActive ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600',
    'white': isActive ? 'bg-gray-200 text-black border-2 border-gray-400' : 'bg-white text-black border border-gray-300 hover:bg-gray-100',
    'office white': isActive ? 'bg-gray-200 text-black border-2 border-gray-400' : 'bg-white text-black border border-gray-300 hover:bg-gray-100',
    'black': isActive ? 'bg-black text-white' : 'bg-gray-800 text-white hover:bg-black',
    'gray': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
    'grey': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
    'purple': isActive ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white hover:bg-purple-600',
    'pink': isActive ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white hover:bg-pink-600',
    'violet': isActive ? 'bg-violet-600 text-white' : 'bg-violet-500 text-white hover:bg-violet-600',
    'brown': isActive ? 'bg-amber-700 text-white' : 'bg-amber-600 text-white hover:bg-amber-700',
    'silver': isActive ? 'bg-gray-400 text-black' : 'bg-gray-300 text-black hover:bg-gray-400',
    'gold': isActive ? 'bg-yellow-700 text-white' : 'bg-yellow-600 text-white hover:bg-yellow-700',
    'ivory': isActive ? 'bg-yellow-100 text-gray-800 border border-yellow-300' : 'bg-yellow-50 text-gray-800 border border-yellow-200 hover:bg-yellow-100',
    'electric ivory': isActive ? 'bg-yellow-100 text-gray-800 border border-yellow-300' : 'bg-yellow-50 text-gray-800 border border-yellow-200 hover:bg-yellow-100',
    'light almond': isActive ? 'bg-orange-200 text-gray-800' : 'bg-orange-100 text-gray-800 hover:bg-orange-200',
    'international white': isActive ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100',
    'international gray': isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600',
    'arctic white': isActive ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100'
  }

  return colorStyles[color.toLowerCase()] || (isActive ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600')
}

// Extract dynamic filter options with memoization
const getDynamicFilterOptions = (products: Product[], filterType: string): string[] => {
  const filterString = (items: (string | undefined)[]): string[] =>
    Array.from(new Set(items.filter((item): item is string => Boolean(item))))

  switch (filterType) {
    case 'brand':
      return filterString(products.map(p => p.brand))
    case 'productLine':
      return filterString(products.map(p => p.productLine))
    case 'categoryRating':
      return filterString(products.map(p => p.categoryRating))
    case 'color':
      return filterString(products.map(p => p.jacketColor || p.color))
    case 'shielding':
      return filterString(products.map(p => p.shielding))
    case 'jacketRating':
      return filterString(products.map(p => p.jacketRating))
    case 'panelType':
      return filterString(products.map(p => p.panelType))
    case 'rackUnits':
      return filterString(products.map(p => p.rackUnits?.toString()))
    case 'environment':
      return filterString(products.map(p => p.environment))
    case 'connectorType':
      return filterString(products.map(p => p.connectorType))
    case 'fiberType':
      const allFiberTypes = new Set<string>()
      products.forEach(product => {
        if (product.fiberType) {
          const fiberTypeStr = Array.isArray(product.fiberType)
            ? product.fiberType.join(', ')
            : product.fiberType.toString()
          
          // Extract individual fiber types from comma-separated strings
          const types = fiberTypeStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
          types.forEach(type => {
            // Clean up fiber types by removing brackets and other artifacts
            const cleanType = type
              .replace(/\[/g, '')  // Remove opening brackets
              .replace(/\]/g, '')  // Remove closing brackets
              .trim()
            
            if (cleanType.length > 0 && cleanType !== '-') {
              allFiberTypes.add(cleanType)
            }
          })
        }
      })
      return Array.from(allFiberTypes).sort()
    case 'packagingType':
      return filterString(products.map(p => p.packagingType))
    case 'productType':
      return filterString(products.map(p => p.productType))
    case 'technology':
      return filterString(products.map(p => p.technology))
    case 'polish':
      return filterString(products.map(p => p.polish))
    case 'housingColor':
      return filterString(products.map(p => p.housingColor))
    case 'bootColor':
      return filterString(products.map(p => p.bootColor))
    case 'pairCount':
      return filterString(products.map(p => p.pairCount))
    case 'conductorGauge':
      return filterString(products.map(p => p.conductorAwg?.toString()))
    case 'application':
      // Parse bracketed application lists to extract individual applications
      const allApplications = new Set<string>()
      products.forEach(product => {
        if (product.application) {
          // Check if it's a bracketed list like [DUCTS, UNDERGROUND CONDUIT, INTRABUILDING]
          if (product.application.startsWith('[') && product.application.endsWith(']')) {
            // Remove brackets and split by comma
            const apps = product.application
              .slice(1, -1)  // Remove brackets
              .split(',')
              .map(app => app.trim())
              .filter(app => app.length > 0)
            
            apps.forEach(app => allApplications.add(app))
          } else {
            // Single application value
            allApplications.add(product.application)
          }
        }
      })
      // Sort alphabetically and remove duplicates
      return Array.from(allApplications).sort()
    case 'terminationType':
      return filterString(products.map(p => p.terminationType))
    case 'adapterColor':
      return filterString(products.map(p => p.adapterColor))
    case 'mountType':
      return filterString(products.map(p => p.mountType))
    case 'fiberCount':
      // Sort fiber counts numerically
      const counts = filterString(products.map(p => p.fiberCount?.toString()))
      return counts.sort((a, b) => parseInt(a) - parseInt(b))
    case 'ports':
      // Sort port counts numerically
      const ports = filterString(products.map(p => p.numberOfPorts?.toString()))
      return ports.sort((a, b) => parseInt(a) - parseInt(b))
    case 'gang':
      // Sort gang counts numerically
      const gangs = filterString(products.map(p => p.numberGang?.toString()))
      return gangs.sort((a, b) => parseInt(a) - parseInt(b))
    default:
      return []
  }
}

// Memoized Dynamic Filter Section
const DynamicFilterSection = memo<DynamicFilterSectionProps>(({ 
  messageId, 
  filterType, 
  label, 
  activeColor, 
  inactiveColor,
  icon = '',
  customButtonStyle,
  products,
  filteredProducts,
  activeFilters,
  onApplyFilter,
  onClearFilter
}) => {
  const currentProducts = filteredProducts
  const availableOptions = useMemo(() => getDynamicFilterOptions(currentProducts, filterType), [currentProducts, filterType])
  const isActive = useCallback((value: string) => activeFilters[filterType] === value, [activeFilters, filterType])
  
  if (availableOptions.length === 0) return null
  
  return (
    <div className="mb-3">
      <span className="text-xs font-medium text-gray-600 block mb-1">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {availableOptions.map(option => (
          <button
            key={option}
            onClick={() => onApplyFilter(messageId, filterType, option, products)}
            className={customButtonStyle 
              ? customButtonStyle(option, isActive(option))
              : `px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isActive(option)
                    ? activeColor
                    : inactiveColor
                }`
            }
          >
            {icon} {option}
          </button>
        ))}
        {activeFilters[filterType] && (
          <button
            onClick={() => onClearFilter(messageId, filterType, products)}
            className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
          >
            All {label}
          </button>
        )}
      </div>
    </div>
  )
})

DynamicFilterSection.displayName = 'DynamicFilterSection'

// Main Filter Section Component
export const FilterSection = memo<FilterSectionProps>(({
  messageId,
  products,
  smartFilters,
  activeFilters,
  filteredProducts,
  autoAppliedFilters,
  onApplyFilter,
  onClearFilter
}) => {
  // Memoize the color button style function
  const memoizedGetColorButtonStyle = useCallback(getColorButtonStyle, [])

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Smart Filters</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {filteredProducts.length} of {products.length} products
        </span>
        {autoAppliedFilters && Object.keys(autoAppliedFilters).length > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
            <span className="text-green-600">✓</span>
            Filters applied based on your shopping list
          </span>
        )}
      </div>

      {/* Brand Filters - Custom Implementation */}
      {(() => {
        const currentProducts = filteredProducts
        const availableBrands = getDynamicFilterOptions(currentProducts, 'brand')
        const isActive = (brand: string) => activeFilters.brand === brand
        
        if (availableBrands.length === 0) return null
        
        return (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-600 block mb-1">Brands:</span>
            <div className="flex flex-wrap gap-1">
              {availableBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => onApplyFilter(messageId, 'brand', brand, products)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isActive(brand)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {brand}
                </button>
              ))}
              {activeFilters.brand && (
                <button
                  onClick={() => onClearFilter(messageId, 'brand', products)}
                  className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                >
                  All Brands
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Product Line Filters - Only show when jack modules are present */}
      {(() => {
        const hasJackModules = products.some(p => 
          p.tableName === 'jack_modules' || 
          p.productType === 'Jack Module' ||
          p.category === 'Jack Module'
        )
        
        if (!hasJackModules) return null
        
        const currentProducts = filteredProducts
        const availableProductLines = getDynamicFilterOptions(currentProducts, 'productLine')
        const isActive = (line: string) => activeFilters.productLine === line
        
        if (availableProductLines.length === 0) return null
        
        return (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-600 block mb-1">Product Lines:</span>
            <div className="flex flex-wrap gap-1">
              {availableProductLines.map(line => (
                <button
                  key={line}
                  onClick={() => onApplyFilter(messageId, 'productLine', line, products)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isActive(line)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {line}
                </button>
              ))}
              {activeFilters.productLine && (
                <button
                  onClick={() => onClearFilter(messageId, 'productLine', products)}
                  className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                >
                  All Product Lines
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Dynamic Filter Sections */}
      <DynamicFilterSection
        messageId={messageId}
        filterType="categoryRating"
        label="Categories"
        activeColor="bg-green-600 text-white"
        inactiveColor="bg-white border border-green-300 text-green-700 hover:bg-green-100"
        icon="📊"
        products={products}
        filteredProducts={filteredProducts}
        activeFilters={activeFilters}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      {/* Show jacket rating for both category cables and fiber cables */}
      {(products.some(p => p.jacketRating) || products.some(p => p.tableName === 'fiber_cables')) && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="jacketRating"
          label="Jacket Ratings"
          activeColor="bg-orange-600 text-white"
          inactiveColor="bg-white border border-orange-300 text-orange-700 hover:bg-orange-100"
          icon="🧥"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      <DynamicFilterSection
        messageId={messageId}
        filterType="color"
        label="Colors"
        activeColor=""
        inactiveColor=""
        customButtonStyle={memoizedGetColorButtonStyle}
        products={products}
        filteredProducts={filteredProducts}
        activeFilters={activeFilters}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      <DynamicFilterSection
        messageId={messageId}
        filterType="shielding"
        label="Shielding Type"
        activeColor="bg-purple-600 text-white"
        inactiveColor="bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
        icon="🛡️"
        products={products}
        filteredProducts={filteredProducts}
        activeFilters={activeFilters}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      <DynamicFilterSection
        messageId={messageId}
        filterType="panelType"
        label="Panel Types"
        activeColor="bg-cyan-600 text-white"
        inactiveColor="bg-white border border-cyan-300 text-cyan-700 hover:bg-cyan-100"
        icon="📦"
        products={products}
        filteredProducts={filteredProducts}
        activeFilters={activeFilters}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      <DynamicFilterSection
        messageId={messageId}
        filterType="rackUnits"
        label="Rack Units"
        activeColor="bg-slate-600 text-white"
        inactiveColor="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
        icon="🏗️"
        products={products}
        filteredProducts={filteredProducts}
        activeFilters={activeFilters}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      {/* Environment Filters - Custom icons */}
      {(() => {
        const currentProducts = filteredProducts
        const availableEnvironments = getDynamicFilterOptions(currentProducts, 'environment')
        const isActive = (value: string) => activeFilters.environment === value
        
        if (availableEnvironments.length === 0) return null
        
        return (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-600 block mb-1">Environment:</span>
            <div className="flex flex-wrap gap-1">
              {availableEnvironments.map(env => (
                <button
                  key={env}
                  onClick={() => onApplyFilter(messageId, 'environment', env, products)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isActive(env)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {env === 'Indoor' ? '🏢' : '🌧️'} {env}
                </button>
              ))}
              {activeFilters.environment && (
                <button
                  onClick={() => onClearFilter(messageId, 'environment', products)}
                  className="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
                >
                  All Environment
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Additional Dynamic Filters */}
      <DynamicFilterSection
        messageId={messageId}
        filterType="connectorType"
        label="Connector Types"
        activeColor="bg-blue-600 text-white"
        inactiveColor="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
        icon="🔌"
        products={products}
        filteredProducts={filteredProducts}
        activeFilters={activeFilters}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      <DynamicFilterSection
        messageId={messageId}
        filterType="fiberType"
        label="Fiber Types"
        activeColor="bg-purple-600 text-white"
        inactiveColor="bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
        products={products}
        filteredProducts={filteredProducts}
        activeFilters={activeFilters}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      {/* Conditional filters based on smartFilters */}
      {smartFilters.packagingTypes && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="packagingType"
          label="Packaging Types"
          activeColor="bg-indigo-600 text-white"
          inactiveColor="bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
          icon="📦"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {/* Product Types filter removed to save space per user request */}

      {smartFilters.technologies && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="technology"
          label="Technology"
          activeColor="bg-teal-600 text-white"
          inactiveColor="bg-white border border-teal-300 text-teal-700 hover:bg-teal-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.polishTypes && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="polish"
          label="Polish Types"
          activeColor="bg-amber-600 text-white"
          inactiveColor="bg-white border border-amber-300 text-amber-700 hover:bg-amber-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.housingColors && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="housingColor"
          label="Housing Colors"
          activeColor=""
          inactiveColor=""
          customButtonStyle={memoizedGetColorButtonStyle}
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.bootColors && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="bootColor"
          label="Boot Colors"
          activeColor=""
          inactiveColor=""
          customButtonStyle={memoizedGetColorButtonStyle}
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.pairCounts && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="pairCount"
          label="Pair Counts"
          activeColor="bg-rose-600 text-white"
          inactiveColor="bg-white border border-rose-300 text-rose-700 hover:bg-rose-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.conductorGauges && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="conductorGauge"
          label="Wire Gauge"
          activeColor="bg-stone-600 text-white"
          inactiveColor="bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {/* Show applications for all products that have it */}
      {products.some(p => p.application) && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="application"
          label="Applications"
          activeColor="bg-lime-600 text-white"
          inactiveColor="bg-white border border-lime-300 text-lime-700 hover:bg-lime-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {/* Fiber Count Filter - For fiber cables */}
      {products.some(p => p.fiberCount) && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="fiberCount"
          label="Fiber Count"
          activeColor="bg-indigo-600 text-white"
          inactiveColor="bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.terminationTypes && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="terminationType"
          label="Termination Types"
          activeColor="bg-fuchsia-600 text-white"
          inactiveColor="bg-white border border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.adapterColors && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="adapterColor"
          label="Adapter Colors"
          activeColor=""
          inactiveColor=""
          customButtonStyle={memoizedGetColorButtonStyle}
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.mountTypes && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="mountType"
          label="Mount Types"
          activeColor="bg-sky-600 text-white"
          inactiveColor="bg-white border border-sky-300 text-sky-700 hover:bg-sky-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.ports && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="ports"
          label="Ports"
          activeColor="bg-teal-600 text-white"
          inactiveColor="bg-white border border-teal-300 text-teal-700 hover:bg-teal-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}

      {smartFilters.gang && (
        <DynamicFilterSection
          messageId={messageId}
          filterType="gang"
          label="Gang"
          activeColor="bg-amber-600 text-white"
          inactiveColor="bg-white border border-amber-300 text-amber-700 hover:bg-amber-100"
          products={products}
          filteredProducts={filteredProducts}
          activeFilters={activeFilters}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      )}
    </div>
  )
})

FilterSection.displayName = 'FilterSection'

export { getColorButtonStyle }