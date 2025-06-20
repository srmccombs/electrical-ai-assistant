// Table name mappings for database reorganization
// This file centralizes all table names to make updates easier

export const TABLE_NAMES = {
  // Product Tables
  CATEGORY_CABLES: 'prod_category_cables',
  FIBER_CONNECTORS: 'prod_fiber_connectors',
  FIBER_CABLES: 'prod_fiber_cables',
  JACK_MODULES: 'prod_jack_modules',
  FACEPLATES: 'prod_faceplates',
  SURFACE_MOUNT_BOXES: 'prod_surface_mount_boxes',
  ADAPTER_PANELS: 'prod_adapter_panels',
  RACK_MOUNT_ENCLOSURES: 'prod_rack_mount_fiber_enclosures',
  WALL_MOUNT_ENCLOSURES: 'prod_wall_mount_fiber_enclosures',
  MODULAR_PLUGS: 'prod_modular_plugs',
  
  // Search & AI Tables
  SEARCH_ANALYTICS: 'search_analytics',
  SEARCH_FEEDBACK: 'search_feedback',
  SEARCH_DECISIONS_AUDIT: 'search_decisions_audit',
  SEARCH_SHADOW_COMPARISONS: 'search_shadow_comparisons',
  SEARCH_KNOWLEDGE_CONTRIB: 'search_knowledge_contrib',
  SEARCH_REGRESSION_TESTS: 'search_regression_tests',
  SEARCH_AI_PROMPTS: 'search_ai_prompts',
  SEARCH_TERM_VARIATIONS: 'search_term_variations',
  SEARCH_TERMS: 'search_terms', // New table we just created
  
  // Analytics Tables/Views
  ANALYTICS_PERFORMANCE: 'analytics_performance',
  ANALYTICS_POPULAR_SEARCHES: 'analytics_popular_searches',
  ANALYTICS_SEARCH_SUMMARY: 'analytics_search_summary',
  
  // Operational Tables
  OPS_BRANCH_LOCATIONS: 'ops_branch_locations',
  OPS_LOCATION_TYPES: 'ops_location_types',
  OPS_MANUFACTURERS: 'ops_manufacturers',
  OPS_DISTRIBUTORS: 'ops_distributors',
  OPS_DISTRIBUTOR_INVENTORY: 'ops_distributor_inventory',
  OPS_MAYER_STOCK: 'ops_mayer_stock',
  OPS_CUSTOMER_LISTS: 'ops_customer_lists',
  OPS_CUSTOMER_LIST_ITEMS: 'ops_customer_list_items',
  OPS_SELECTION_SESSIONS: 'ops_selection_sessions',
  
  // Documentation Tables
  DOCS_PRODUCT_DATASHEETS: 'docs_product_datasheets',
  DOCS_DATASHEET_LINKS: 'docs_datasheet_links',
  
  // Views
  VIEW_PRODUCT_SEARCH: 'view_product_search',
  VIEW_PRODUCTS_COMPLETE: 'view_products_complete',
  VIEW_MAYER_STOCK_SUMMARY: 'view_mayer_stock_summary',
  VIEW_MISSING_DATASHEETS: 'view_missing_datasheets',
  
  // Legacy/Uncertain Tables (keep old names for now)
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  PRODUCT_ATTRIBUTES: 'product_attributes',
  COMPATIBLE_PRODUCTS: 'compatible_products',
  GO_WITH_ITEMS: 'go_with_items',
} as const

// Old to new mapping for migration
export const TABLE_MIGRATION_MAP = {
  'category_cables': TABLE_NAMES.CATEGORY_CABLES,
  'fiber_connectors': TABLE_NAMES.FIBER_CONNECTORS,
  'fiber_optic_cable': TABLE_NAMES.FIBER_CABLES,
  'jack_modules': TABLE_NAMES.JACK_MODULES,
  'faceplates': TABLE_NAMES.FACEPLATES,
  'surface_mount_box': TABLE_NAMES.SURFACE_MOUNT_BOXES,
  'adapter_panels': TABLE_NAMES.ADAPTER_PANELS,
  'rack_mount_fiber_enclosures': TABLE_NAMES.RACK_MOUNT_ENCLOSURES,
  'wall_mount_fiber_enclosures': TABLE_NAMES.WALL_MOUNT_ENCLOSURES,
  'modular_plugs': TABLE_NAMES.MODULAR_PLUGS,
  'shadow_mode_comparisons': TABLE_NAMES.SEARCH_SHADOW_COMPARISONS,
  'knowledge_contributions': TABLE_NAMES.SEARCH_KNOWLEDGE_CONTRIB,
  'regression_tests': TABLE_NAMES.SEARCH_REGRESSION_TESTS,
  'prompts': TABLE_NAMES.SEARCH_AI_PROMPTS,
  'search_variations': TABLE_NAMES.SEARCH_TERM_VARIATIONS,
  'performance_baselines': TABLE_NAMES.ANALYTICS_PERFORMANCE,
  'branch_locations': TABLE_NAMES.OPS_BRANCH_LOCATIONS,
  'location_types': TABLE_NAMES.OPS_LOCATION_TYPES,
  'manufacturers': TABLE_NAMES.OPS_MANUFACTURERS,
  'distributors': TABLE_NAMES.OPS_DISTRIBUTORS,
  'distributor_inventory': TABLE_NAMES.OPS_DISTRIBUTOR_INVENTORY,
  'mayer_stock': TABLE_NAMES.OPS_MAYER_STOCK,
  'customer_product_lists': TABLE_NAMES.OPS_CUSTOMER_LISTS,
  'customer_list_items': TABLE_NAMES.OPS_CUSTOMER_LIST_ITEMS,
  'selection_sessions': TABLE_NAMES.OPS_SELECTION_SESSIONS,
  'product_datasheets': TABLE_NAMES.DOCS_PRODUCT_DATASHEETS,
  'product_datasheet_links': TABLE_NAMES.DOCS_DATASHEET_LINKS,
} as const

// Helper function to get table name (supports gradual migration)
export function getTableName(oldName: string): string {
  // Check if we're using new names (environment variable)
  if (process.env.USE_NEW_TABLE_NAMES === 'true') {
    return TABLE_MIGRATION_MAP[oldName as keyof typeof TABLE_MIGRATION_MAP] || oldName
  }
  return oldName
}

// Product table list for dynamic queries
export const PRODUCT_TABLES = [
  TABLE_NAMES.CATEGORY_CABLES,
  TABLE_NAMES.FIBER_CONNECTORS,
  TABLE_NAMES.FIBER_CABLES,
  TABLE_NAMES.JACK_MODULES,
  TABLE_NAMES.FACEPLATES,
  TABLE_NAMES.SURFACE_MOUNT_BOXES,
  TABLE_NAMES.ADAPTER_PANELS,
  TABLE_NAMES.RACK_MOUNT_ENCLOSURES,
  TABLE_NAMES.WALL_MOUNT_ENCLOSURES,
  TABLE_NAMES.MODULAR_PLUGS,
]

// Search-related tables
export const SEARCH_TABLES = [
  TABLE_NAMES.SEARCH_ANALYTICS,
  TABLE_NAMES.SEARCH_FEEDBACK,
  TABLE_NAMES.SEARCH_DECISIONS_AUDIT,
  TABLE_NAMES.SEARCH_SHADOW_COMPARISONS,
  TABLE_NAMES.SEARCH_KNOWLEDGE_CONTRIB,
  TABLE_NAMES.SEARCH_REGRESSION_TESTS,
  TABLE_NAMES.SEARCH_TERMS,
]