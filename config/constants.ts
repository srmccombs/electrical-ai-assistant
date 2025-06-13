// config/constants.ts
// Centralized configuration and constants

// Search Limits
export const SEARCH_LIMITS = {
  DEFAULT: 50,
  PART_NUMBER: 200,
  BRAND_SEARCH_PER_TABLE: 10,
  MAX_RESULTS: 500,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
} as const

// Supported Brands
export const ELECTRICAL_BRANDS = [
  'corning',
  'panduit',
  'leviton',
  'superior',
  'essex',
  'berktek',
  'prysmian',
  'dmsi',
  'siecor'
] as const

// Table Configuration
export const TABLE_CONFIG = {
  PREFIXES: {
    category_cables: 'cat',
    fiber_connectors: 'conn',
    adapter_panels: 'panel',
    rack_mount_fiber_enclosures: 'encl',
    products: 'prod'
  },
  NAMES: {
    CATEGORY_CABLES: 'category_cables',
    FIBER_CONNECTORS: 'fiber_connectors',
    ADAPTER_PANELS: 'adapter_panels',
    FIBER_ENCLOSURES: 'rack_mount_fiber_enclosures',
    PRODUCTS: 'products'
  }
} as const

// API Configuration
export const API_CONFIG = {
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_TEMPERATURE: 0.1,
  OPENAI_MAX_TOKENS: 800,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3
} as const

// UI Configuration
export const UI_CONFIG = {
  LOADING_ANIMATION_INTERVAL: 1500,
  MESSAGE_ANIMATION_DELAY: 50,
  SEARCH_DEBOUNCE_MS: 300,
  MAX_CHAT_HISTORY: 50,
  SHOPPING_LIST_STORAGE_KEY: 'electrical-shopping-list'
} as const

// Stock Status Configuration
export const STOCK_STATUS = {
  IN_STOCK: {
    status: 'in_stock',
    color: 'green',
    message: 'In Stock - Ships Today'
  },
  LOW_STOCK: {
    status: 'low_stock',
    color: 'yellow',
    message: 'Low Stock - Order Soon'
  },
  OUT_OF_STOCK: {
    status: 'out_of_stock',
    color: 'red',
    message: 'Out of Stock - Contact for Availability'
  },
  SPECIAL_ORDER: {
    status: 'special_order',
    color: 'blue',
    message: 'Special Order - Contact for Lead Time'
  }
} as const

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  SEARCH_FAILED: 'Unable to search products. Please try again.',
  AI_UNAVAILABLE: 'AI analysis unavailable. Using standard search.',
  NO_RESULTS: 'No products found. Try different search terms.',
  INVALID_QUERY: 'Please enter a valid search query.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.'
} as const

// Business Rules
export const BUSINESS_RULES = {
  CAT5_REDIRECT: {
    enabled: true,
    message: 'Showing Cat5e results (Cat5e is the current standard)'
  },
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 200
} as const

// Fiber Type Compatibility Mapping
export const FIBER_TYPE_MAPPING = {
  'OM1': ['OM1', 'Multimode', '62.5/125'],
  'OM2': ['OM2', 'Multimode', '50/125'],
  'OM3': ['OM3', 'Multimode', '50/125', 'Aqua'],
  'OM4': ['OM4', 'Multimode', '50/125', 'Aqua', 'Violet'],
  'OM5': ['OM5', 'Multimode', '50/125', 'Lime Green'],
  'OS1': ['OS1', 'OS2', 'Singlemode', '9/125', 'Single Mode'],
  'OS2': ['OS2', 'OS1', 'Singlemode', '9/125', 'Single Mode']
} as const

export type ElectricalBrand = typeof ELECTRICAL_BRANDS[number]
export type TableName = keyof typeof TABLE_CONFIG.NAMES
export type StockStatusType = keyof typeof STOCK_STATUS
export type FiberType = keyof typeof FIBER_TYPE_MAPPING