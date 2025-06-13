// types/product.ts
// Product-related type definitions

export interface Product {
  id: string
  partNumber: string
  brand: string
  description: string
  price?: number
  stockLocal: number
  stockDistribution: number
  leadTime?: string
  category: string
  imageUrl?: string
  fiberType?: string
  jacketRating?: string        // Display value (e.g., "Non-Plenum Rated CMR")
  jacketCode?: string          // Filter value (e.g., "CMR")
  fiberCount?: number
  connectorType?: string
  categoryRating?: string
  shielding?: string
  searchRelevance?: number
  tableName?: string
  packagingType?: string
  color?: string
  stockStatus?: string
  stockColor?: string
  stockMessage?: string
  productLine?: string
  pairCount?: string
  conductorAwg?: number
  jacketColor?: string
  cableDiameter?: number
  application?: string
  possibleCross?: string
  commonTerms?: string
  compatibleConnectors?: string
  goWithItems?: string
  productType?: string
  technology?: string
  polish?: string
  housingColor?: string
  bootColor?: string
  ferruleMaterial?: string

  // Adapter Panel specific fields
  panelType?: string
  adaptersPerPanel?: number
  adapterColor?: string
  terminationType?: string
  possibleEquivalent?: string
  compatibleEnclosures?: string
  supportsAPC?: boolean

  // Fiber Enclosure specific fields
  mountType?: string
  rackUnits?: number
  panelCapacity?: number
  material?: string
  supportsSpliceTrays?: boolean
  environment?: string
  spliceTrayModel?: string
  upcCode?: string

  // Jack Module specific fields
  installationToolsRequired?: string
  compatibleFaceplates?: string
  upcNumber?: string  // Note: You have upcCode above, but jack modules use upcNumber
  
  // Surface Mount Box specific fields
  mountingDepth?: number
  compatibleJacks?: string
  numberOfPorts?: number
  numberGang?: number
  
  // Cross-reference UI field
  isSourceProduct?: boolean // Mark source product in cross-reference results
  
  // Product datasheet fields
  datasheetId?: string
  datasheetUrl?: string
}

export interface ListItem extends Product {
  quantity: number
  addedAt: Date
}

export type StockStatus = 'branch_stock' | 'dc_stock' | 'other_stock' | 'not_in_stock'
export type StockColor = 'green' | 'yellow' | 'red'

export interface StockInfo {
  status: StockStatus
  color: StockColor
  message: string
}

// Note: ProductTable is also defined in search.ts, so we'll remove it from here to avoid conflicts