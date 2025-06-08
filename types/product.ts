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

export type ProductTable =
  | 'category_cables'
  | 'fiber_connectors'
  | 'adapter_panels'
  | 'fiber_cables'
  | 'fiber_enclosures'
  | 'rack_mount_fiber_enclosures'
  | 'wall_mount_fiber_enclosures'
  | 'multi_table'

export interface TableInfo {
  name: string
  prefix: string
}