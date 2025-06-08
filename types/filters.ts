// types/filters.ts
// Filter-related type definitions

export interface SmartFilters {
  brands: string[]
  packagingTypes: string[]
  jacketRatings: string[]
  fiberTypes: string[]
  connectorTypes: string[]
  categoryRatings: string[]
  colors: string[]
  shieldingTypes: string[]
  productLines: string[]
  pairCounts: string[]
  conductorGauges: string[]
  applications: string[]
  productType: string
  productTypes: string[]
  technologies: string[]
  polishTypes: string[]
  housingColors: string[]
  bootColors: string[]
  // Adapter Panel filters
  panelTypes?: string[]
  terminationTypes?: string[]
  adapterColors?: string[]
  // Fiber Enclosure filters
  rackUnits?: string[]
  environments?: string[]
  mountTypes?: string[]
}

export type FilterType = keyof SmartFilters

export interface ActiveFilters {
  [key: string]: string
}

export interface FilterOption {
  value: string
  label: string
  count?: number
  color?: string
  icon?: string
}

export interface FilterGroup {
  type: FilterType
  label: string
  options: FilterOption[]
  multiSelect?: boolean
  colorCoded?: boolean
}