import React, { memo, useCallback, useMemo, useState } from 'react'
import type { Product } from '../../types'
import { StockStatusButton } from './StockStatusButton'
// import { trackResultClick } from '../../services/analytics' // TODO: Fix to work without search term
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ProductTableProps {
  products: Product[]
  onAddToList: (product: Product) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const ProductRow = memo<{ product: Product; onAddToList: (product: Product) => void }>(
  ({ product, onAddToList }) => {
    const handleAddClick = useCallback(() => {
      // TODO: Fix trackResultClick to work without search term
      // trackResultClick({ searchTerm: '', clickedPartNumber: product.partNumber })
      onAddToList(product)
    }, [product, onAddToList])

    const handleDatasheetClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
    }, [])

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-2 py-2 text-center">
          <button
            onClick={handleAddClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
          >
            Add
          </button>
        </td>
        <td className="px-1 py-2 text-center">
          <StockStatusButton product={product} />
        </td>
        <td className="px-2 py-2 text-xs font-medium text-gray-900">
          <div className="flex items-center gap-2">
            {product.partNumber}
            {product.isSourceProduct && (
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                SOURCE
              </span>
            )}
          </div>
        </td>
        <td className="px-2 py-2 text-xs text-gray-700">{product.brand}</td>
        <td className="px-3 py-2 text-sm text-gray-700 min-w-96">
          <div className="whitespace-normal leading-tight">
            {product.description}
          </div>
        </td>
        <td className="px-2 py-2 text-center">
          {product.datasheetUrl ? (
            <a
              href={product.datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="View Product Sheet"
              onClick={handleDatasheetClick}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
          ) : null}
        </td>
        
        {/* Conditional columns based on product type */}
        {product.tableName === 'rack_mount_fiber_enclosures' ? (
          <>
            <td className="px-2 py-2 text-center">
              <span className="bg-blue-100 text-blue-700 px-1 py-1 rounded text-xs">
                {product.panelType || '-'}
              </span>
            </td>
            <td className="px-2 py-2 text-center">
              <span className="bg-slate-100 text-slate-700 px-1 py-1 rounded text-xs">
                {product.rackUnits ? `${product.rackUnits}RU` : '-'}
              </span>
            </td>
            <td className="px-2 py-2 text-center">
              {product.panelCapacity ? (
                <span className="bg-green-100 text-green-700 px-1 py-1 rounded text-xs">
                  {product.panelCapacity} panels
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
          </>
        ) : product.tableName === 'wall_mount_fiber_enclosures' ? (
          <>
            <td className="px-2 py-2 text-center">
              <span className="bg-blue-100 text-blue-700 px-1 py-1 rounded text-xs">
                {product.panelType || '-'}
              </span>
            </td>
            <td className="px-2 py-2 text-center">
              {product.panelCapacity ? (
                <span className="bg-green-100 text-green-700 px-1 py-1 rounded text-xs">
                  {product.panelCapacity} panels
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
          </>
        ) : product.tableName === 'adapter_panels' ? (
          <>
            <td className="px-2 py-2 text-center">
              <span className="bg-purple-100 text-purple-700 px-1 py-1 rounded text-xs">
                {product.panelType || '-'}
              </span>
            </td>
            <td className="px-2 py-2 text-center">
              <span className="bg-blue-100 text-blue-700 px-1 py-1 rounded text-xs">
                {product.numberOfPorts ? `${product.numberOfPorts} ports` : '-'}
              </span>
            </td>
          </>
        ) : null}
      </tr>
    )
  }
)

ProductRow.displayName = 'ProductRow'

export const ProductTable = memo<ProductTableProps>(({ products, onAddToList, isExpanded = false, onToggleExpand }) => {
  // Use internal state if no external control is provided
  const [internalExpanded, setInternalExpanded] = useState(false)
  const expanded = onToggleExpand ? isExpanded : internalExpanded
  
  // Determine table headers based on product types
  const tableHeaders = useMemo(() => {
    if (products.length === 0) return null

    const firstProduct = products[0]
    const baseHeaders = (
      <>
        <th className="px-2 py-2 text-center font-medium w-16">Add</th>
        <th className="px-1 py-2 text-center font-medium w-8"></th>
        <th className="px-2 py-2 text-left font-medium w-24">Part #</th>
        <th className="px-2 py-2 text-left font-medium w-20">Brand</th>
        <th className="px-3 py-2 text-left font-medium">Description</th>
        <th className="px-2 py-2 text-center font-medium w-16">Sheet</th>
      </>
    )

    // Add conditional headers based on product type
    if (firstProduct.tableName === 'rack_mount_fiber_enclosures') {
      return (
        <>
          {baseHeaders}
          <th className="px-2 py-2 text-center font-medium w-24">Panel Type</th>
          <th className="px-2 py-2 text-center font-medium w-16">Size</th>
          <th className="px-2 py-2 text-center font-medium w-24">Capacity</th>
        </>
      )
    } else if (firstProduct.tableName === 'wall_mount_fiber_enclosures') {
      return (
        <>
          {baseHeaders}
          <th className="px-2 py-2 text-center font-medium w-24">Panel Type</th>
          <th className="px-2 py-2 text-center font-medium w-24">Capacity</th>
        </>
      )
    } else if (firstProduct.tableName === 'adapter_panels') {
      return (
        <>
          {baseHeaders}
          <th className="px-2 py-2 text-center font-medium w-24">Panel Type</th>
          <th className="px-2 py-2 text-center font-medium w-20">Ports</th>
        </>
      )
    }

    return baseHeaders
  }, [products])

  if (products.length === 0) return null

  return (
    <div className="relative">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className={`overflow-auto ${!expanded ? 'max-h-[400px]' : ''}`}>
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <tr className="text-xs text-gray-700">
                {tableHeaders}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.map((product, index) => (
                <ProductRow
                  key={`${product.tableName}-${product.partNumber}-${index}`}
                  product={product}
                  onAddToList={onAddToList}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {products.length > 5 && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Showing {products.length} results
          {!expanded && ' - scroll to see more'}
        </div>
      )}
    </div>
  )
})

ProductTable.displayName = 'ProductTable'