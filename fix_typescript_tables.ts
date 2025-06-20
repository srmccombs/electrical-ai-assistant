// Script to show what needs updating in TypeScript files
// Run this to see all the table name updates needed

const tableNameMappings = {
  // Old name -> New name
  'category_cables': 'prod_category_cables',
  'fiber_connectors': 'prod_fiber_connectors',
  'fiber_optic_cable': 'prod_fiber_cables',
  'jack_modules': 'prod_jack_modules',
  'faceplates': 'prod_faceplates',
  'surface_mount_box': 'prod_surface_mount_boxes',
  'adapter_panels': 'prod_adapter_panels',
  'rack_mount_fiber_enclosures': 'prod_rack_mount_enclosures',
  'wall_mount_fiber_enclosures': 'prod_wall_mount_enclosures',
  'modular_plugs': 'prod_modular_plugs',
  
  // Also update references in code
  'knowledge_contributions': 'search_knowledge_contrib',
  'shadow_mode_comparisons': 'search_shadow_comparisons',
  'regression_tests': 'search_regression_tests',
  'search_variations': 'search_term_variations',
  'performance_baselines': 'analytics_performance',
  'branch_locations': 'ops_branch_locations',
  'manufacturers': 'ops_manufacturers',
  'mayer_stock': 'ops_mayer_stock',
} as const

// Files that need updating
const filesToUpdate = [
  'services/searchService.ts',
  'services/crossReferenceService.ts',
  'services/compatibilityService.ts',
  'search/categoryCables/categoryCableSearch.ts',
  'search/fiberConnectors/fiberConnectorSearch.ts',
  'search/fiberCables/fiberCableSearch.ts',
  'search/jackModules/jackModuleSearch.ts',
  'search/faceplates/faceplateSearch.ts',
  'search/surfaceMountBoxes/surfaceMountBoxSearch.ts',
  'search/fiberadapterPanels/fiberadapterPanelSearch.ts',
  'search/fiberenclosure/rack_mount_fiber_enclosure_Search.ts',
  'search/fiberenclosure/wall_mount_fiber_enclosure_Search.ts',
]

console.log('Table name updates needed:')
console.log('==========================')
Object.entries(tableNameMappings).forEach(([old, newName]) => {
  console.log(`${old} → ${newName}`)
})

console.log('\nFiles to update:')
console.log('================')
filesToUpdate.forEach(file => console.log(file))

console.log('\nSearch and replace patterns:')
console.log('===========================')
console.log(`'.from('category_cables')' → '.from('prod_category_cables')'`)
console.log(`"category_cables" → "prod_category_cables"`)
console.log(`'category_cables' → 'prod_category_cables'`)

export { tableNameMappings }