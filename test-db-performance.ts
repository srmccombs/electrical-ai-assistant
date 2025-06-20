// Test direct database search performance
import { supabase } from './lib/supabase'

async function testDatabaseSearchPerformance() {
  console.log('🚀 Testing direct database search performance...\n')
  
  const searches = [
    'cat6 cable',
    'fiber optic connectors',
    'datacom faceplates',
    'OM4',
    'modular plugs'
  ]
  
  for (const searchTerm of searches) {
    // Test 1: Direct full-text search (should be 5-50ms)
    const start1 = performance.now()
    const { data: textSearchData, error: error1 } = await supabase
      .from('prod_category_cables')
      .select('*')
      .textSearch('search_vector', searchTerm)
      .limit(10)
    const time1 = Math.round(performance.now() - start1)
    
    // Test 2: Old style with multiple conditions (slower)
    const start2 = performance.now()
    const { data: oldStyleData, error: error2 } = await supabase
      .from('prod_category_cables')
      .select('*')
      .or(`part_number.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .limit(10)
    const time2 = Math.round(performance.now() - start2)
    
    console.log(`Search: "${searchTerm}"`)
    console.log(`  ✅ Text Search: ${time1}ms (found ${textSearchData?.length || 0} results)`)
    console.log(`  ❌ Old Style:   ${time2}ms (found ${oldStyleData?.length || 0} results)`)
    console.log(`  🚀 Speed improvement: ${Math.round(time2/time1)}x faster\n`)
  }
}

// Run the test
testDatabaseSearchPerformance()