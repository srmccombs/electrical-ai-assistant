import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
  position?: { x: number; y: number }
  align?: 'center' | 'left' | 'right'
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  duration = 2000,
  position,
  align = 'center'
}) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isVisible && position) {
      // Calculate position to show above the button
      const padding = 10
      const toastHeight = 44 // Approximate height of toast
      setCoords({
        top: position.y - toastHeight - padding,
        left: position.x
      })
    }
  }, [isVisible, position])

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getTransform = () => {
    switch (align) {
      case 'left':
        return 'translateX(-100%)' // Move left by full width
      case 'right':
        return 'translateX(0)' // No transform, stays at position
      case 'center':
      default:
        return 'translateX(-50%)' // Center on position
    }
  }

  const positionStyles = position 
    ? {
        position: 'fixed' as const,
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: getTransform()
      }
    : {
        position: 'fixed' as const,
        bottom: '1rem',
        right: '1rem'
      }

  return (
    <div 
      className="z-50 animate-in fade-in duration-200"
      style={positionStyles}
    >
      <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}