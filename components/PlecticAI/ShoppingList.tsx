import React, { memo, useCallback, useMemo } from 'react'
import { Plus, Minus, X, Send, Copy } from 'lucide-react'
import type { ListItem } from '../../types'

interface ShoppingListProps {
  productList: ListItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onSendList: () => void
  onCopyPartNumber: (partNumber: string) => void
}

const ShoppingListItem = memo<{
  item: ListItem
  index: number
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onCopyPartNumber: (partNumber: string) => void
}>(({ item, index, onUpdateQuantity, onRemoveItem, onCopyPartNumber }) => {
  const handleDecrement = useCallback(() => {
    onUpdateQuantity(item.id, -1)
  }, [item.id, onUpdateQuantity])

  const handleIncrement = useCallback(() => {
    onUpdateQuantity(item.id, 1)
  }, [item.id, onUpdateQuantity])

  const handleRemove = useCallback(() => {
    onRemoveItem(item.id)
  }, [item.id, onRemoveItem])

  const handleCopy = useCallback(() => {
    onCopyPartNumber(item.partNumber)
  }, [item.partNumber, onCopyPartNumber])

  const itemTotal = useMemo(() => 
    ((item.price || 0) * item.quantity).toFixed(2),
    [item.price, item.quantity]
  )

  return (
    <tr className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
      <td className="px-3 py-2">
        <div className="flex items-start gap-1">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{item.partNumber}</p>
            <p className="text-xs text-gray-500">{item.brand}</p>
            {item.panelType && (
              <p className="text-xs text-blue-600">📦 {item.panelType}</p>
            )}
            {item.rackUnits && (
              <p className="text-xs text-slate-600">🏗️ {item.rackUnits}RU</p>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
            title="Copy part number"
          >
            <Copy size={14} />
          </button>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={handleDecrement}
            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="w-16 text-center text-sm font-medium">
            {item.quantity.toLocaleString()}
          </span>
          <button
            onClick={handleIncrement}
            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </td>
      <td className="px-3 py-2">
        <p className="text-xs text-gray-700 line-clamp-2">{item.description}</p>
      </td>
      <td className="px-3 py-2 text-right text-sm">
        ${item.price?.toFixed(2)}
      </td>
      <td className="px-3 py-2 text-right text-sm font-medium">
        ${itemTotal}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 transition-colors"
        >
          <X size={16} />
        </button>
      </td>
    </tr>
  )
})

ShoppingListItem.displayName = 'ShoppingListItem'

export const ShoppingList = memo<ShoppingListProps>(({
  productList,
  onUpdateQuantity,
  onRemoveItem,
  onSendList,
  onCopyPartNumber
}) => {
  const totalItems = useMemo(() => 
    productList.reduce((sum, item) => sum + item.quantity, 0),
    [productList]
  )

  const totalPrice = useMemo(() => 
    productList.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2),
    [productList]
  )

  if (productList.length === 0) return null

  return (
    <div className="w-2/5 border-l border-gray-200 bg-white flex flex-col">
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
        <p className="text-sm text-gray-600">
          {productList.length} items • {totalItems.toLocaleString()} total qty
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0">
            <tr className="text-xs text-gray-700">
              <th className="px-3 py-2 text-left">Part Number</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {productList.map((item, index) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onCopyPartNumber={onCopyPartNumber}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Total:</span>
          <span className="text-lg font-bold text-gray-900">
            ${totalPrice}
          </span>
        </div>
        <button
          onClick={onSendList}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Send size={16} />
          Send List for Quote
        </button>
      </div>
    </div>
  )
})

ShoppingList.displayName = 'ShoppingList'