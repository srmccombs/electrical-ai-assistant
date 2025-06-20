// search/shared/types.ts
// Shared types for all search modules

import type { Product } from '@/types/product'

// Base database row type that all product tables share
export interface BaseProductRow {
  id: number
  part_number?: string
  brand?: string
  short_description?: string
  unit_price?: string
  stock_quantity?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// Category Cable specific database row
export interface CategoryCableRow extends BaseProductRow {
  category_rating?: string
  jacket_material?: string
  jacket_code?: string
  jacket_color?: string
  Shielding_Type?: string
  product_line?: string
  pair_count?: string
  conductor_awg?: number
  cable_diameter_in?: number
  packaging_type?: string
  application?: string
  possible_cross?: string
}

// Fiber Connector specific database row
export interface FiberConnectorRow extends BaseProductRow {
  connector_type?: string
  fiber_category?: string
  product_type?: string
  technology?: string
  polish?: string
  housing_color?: string
  boot_color?: string
  product_line?: string
  ferrule_material?: string
  common_terms?: string
  compatible_connectors?: string
  go_with_items?: string
  possible_equivalent?: string
}

// Adapter Panel specific database row
export interface AdapterPanelRow extends BaseProductRow {
  connector_type?: string
  fiber_category?: string
  fiber_count?: number
  panel_type?: string
  product_line?: string
  number_of_adapter_per_panel?: number
  adapter_color?: string
  termination_type?: string
  possible_equivalent?: string
  compatible_enclosures?: string
  common_terms?: string
  supports_apc?: boolean
}

// Rack Mount Enclosure specific database row
export interface RackMountEnclosureRow extends BaseProductRow {
  product_type?: string
  mount_type?: string
  rack_units?: number
  panel_type?: string
  accepts_number_of_connector_housing_panels?: number
  color?: string
  material?: string
  supports_splice_trays?: boolean
  environment?: string
  fiber_enclosure_splice_tray?: string
  upc_number?: string
  product_line?: string
  possible_equivalent?: string
  common_terms?: string
}

// Wall Mount Enclosure specific database row
export interface WallMountEnclosureRow extends BaseProductRow {
  mount_type?: string
  panel_type?: string
  material?: string
  environment?: string
  panel_capacity?: number
  color?: string
  product_line?: string
  possible_equivalent?: string
  common_terms?: string
}

// Fiber Cable specific database row
export interface FiberCableRow extends BaseProductRow {
  fiber_type?: string
  fiber_count?: number
  jacket_rating?: string
  jacket_color?: string
  common_terms?: string
  packaging_type?: string
  product_line?: string
}

// Jack Module specific database row
export interface JackModuleRow extends BaseProductRow {
  category_rating?: string
  shielding_type?: string
  color?: string
  product_line?: string
  pair_count?: string
  installation_tools_required?: string
  compatible_faceplates?: string
  upc_number?: string
  common_terms?: string
}

// Faceplate specific database row
export interface FaceplateRow extends BaseProductRow {
  number_of_ports?: number
  number_gang?: number
  color?: string
  type?: string
  compatible_jacks?: string
  common_terms?: string
  product_line?: string
}

// Surface Mount Box specific database row
export interface SurfaceMountBoxRow extends BaseProductRow {
  number_of_ports?: number
  number_gang?: number
  color?: string
  type?: string
  mounting_depth?: number
  compatible_jacks?: string
  common_terms?: string
  product_line?: string
}

// Modular Plug specific database row
export interface ModularPlugRow extends BaseProductRow {
  category_rating?: string
  shielding_type?: string
  conductor_awg?: string
  packaging_qty?: number
  product_line?: string
  packaging_type?: string
  compatible_boots?: string
  common_terms?: string
}

// Union type for all product row types
export type ProductRow = 
  | CategoryCableRow
  | FiberConnectorRow
  | AdapterPanelRow
  | RackMountEnclosureRow
  | WallMountEnclosureRow
  | FiberCableRow
  | JackModuleRow
  | FaceplateRow
  | SurfaceMountBoxRow
  | ModularPlugRow

// Generic type for when we don't know the specific product type
export type AnyProductRow = BaseProductRow & Record<string, any>