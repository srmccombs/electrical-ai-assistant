// Script to update all table names in TypeScript files
// This helps automate the table name migration

import * as fs from 'fs'
import * as path from 'path'

const TABLE_MAPPINGS = {
  // Product tables
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
  
  // Search tables
  'shadow_mode_comparisons': 'search_shadow_comparisons',
  'knowledge_contributions': 'search_knowledge_contrib',
  'regression_tests': 'search_regression_tests',
  'prompts': 'search_ai_prompts',
  'search_variations': 'search_term_variations',
  
  // Analytics tables
  'performance_baselines': 'analytics_performance',
  'popular_searches': 'analytics_popular_searches',
  'search_analytics_summary': 'analytics_search_summary',
  
  // Operational tables
  'branch_locations': 'ops_branch_locations',
  'location_types': 'ops_location_types',
  'manufacturers': 'ops_manufacturers',
  'distributors': 'ops_distributors',
  'distributor_inventory': 'ops_distributor_inventory',
  'mayer_stock': 'ops_mayer_stock',
  'customer_product_lists': 'ops_customer_lists',
  'customer_list_items': 'ops_customer_list_items',
  'selection_sessions': 'ops_selection_sessions',
  
  // Documentation tables
  'product_datasheets': 'docs_product_datasheets',
  'product_datasheet_links': 'docs_datasheet_links',
}

// Files to update
const filesToUpdate = [
  'services/searchService.ts',
  'search/fiberConnectors/fiberConnectorSearch.ts',
  'search/jackModules/jackModuleSearch.ts',
  'search/faceplates/faceplateSearch.ts',
  'search/surfaceMountBoxes/surfaceMountBoxSearch.ts',
  'services/compatibilityService.ts',
  'services/crossReferenceService.ts',
  'config/productTypes.ts',
  'config/constants.ts',
]

console.log('🔄 Updating table names in TypeScript files...\n')

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`)
    return
  }
  
  let content = fs.readFileSync(fullPath, 'utf8')
  let changesMade = false
  
  Object.entries(TABLE_MAPPINGS).forEach(([oldName, newName]) => {
    // Replace in strings (both single and double quotes)
    const patterns = [
      new RegExp(`'${oldName}'`, 'g'),
      new RegExp(`"${oldName}"`, 'g'),
      new RegExp(`\\.from\\('${oldName}'\\)`, 'g'),
      new RegExp(`\\.from\\("${oldName}"\\)`, 'g'),
      new RegExp(`tableName: '${oldName}'`, 'g'),
      new RegExp(`tableName: "${oldName}"`, 'g'),
    ]
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        content = content.replace(pattern, (match) => {
          return match.replace(oldName, newName)
        })
        changesMade = true
      }
    })
  })
  
  if (changesMade) {
    fs.writeFileSync(fullPath, content)
    console.log(`✅ Updated: ${filePath}`)
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`)
  }
})

console.log('\n✨ Table name updates complete!')
console.log('\n📝 Next steps:')
console.log('1. Run the search migration SQL scripts')
console.log('2. Test the application thoroughly')
console.log('3. Update any environment variables if needed')