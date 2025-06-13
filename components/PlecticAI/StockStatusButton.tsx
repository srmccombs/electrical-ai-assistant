import React, { memo } from 'react'
import type { Product, StockStatus } from '../../types'

interface StockStatusButtonProps {
  product: Product
}

export const StockStatusButton = memo<StockStatusButtonProps>(({ product }) => {
  const getButtonStyle = (): string => {
    switch (product.stockColor) {
      case 'green':
        return 'bg-green-600'
      case 'yellow':
        return 'bg-yellow-500'
      case 'red':
      default:
        return 'bg-red-600'
    }
  }

  const getTooltipText = (): string => {
    switch (product.stockStatus) {
      case 'branch_stock':
        return 'In Stock - Same Day'
      case 'dc_stock':
        return 'In Stock - Next Day'
      case 'other_stock':
        return 'Available - Other Locations'
      case 'not_in_stock':
      default:
        return 'Special Order'
    }
  }

  return (
    <div
      title={getTooltipText()}
      className={`w-3 h-3 rounded-full ${getButtonStyle()}`}
    />
  )
})

StockStatusButton.displayName = 'StockStatusButton'