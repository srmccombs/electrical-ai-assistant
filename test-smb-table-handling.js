// Test script to verify SMB table handling when table doesn't exist
// Run with: node test-smb-table-handling.js

import { searchSurfaceMountBoxes } from './search/surfaceMountBoxes/surfaceMountBoxSearch.js';
import { discoverSearchableTables } from './search/shared/tableDiscoveryService.js';

async function testSMBTableHandling() {
  console.log('=== Testing SMB Table Handling ===\n');

  try {
    // First, check what tables are available
    console.log('1. Checking available tables...');
    const { tables } = await discoverSearchableTables();
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`  - ${table.name}`));
    
    const hasSMBTable = tables.some(t => t.name === 'surface_mount_box');
    console.log(`\nSurface mount box table exists: ${hasSMBTable}\n`);

    // Test 1: Basic SMB search
    console.log('2. Testing basic SMB search...');
    const result1 = await searchSurfaceMountBoxes({
      searchTerm: '2 port surface mount box',
      limit: 10
    });
    
    console.log('Result 1:');
    console.log(`  Strategy: ${result1.searchStrategy}`);
    console.log(`  Products found: ${result1.totalFound}`);
    console.log(`  Message: ${result1.message || 'No message'}`);
    console.log(`  Search time: ${result1.searchTime}ms`);
    
    if (result1.products.length > 0) {
      console.log(`  Sample products:`);
      result1.products.slice(0, 3).forEach(p => {
        console.log(`    - ${p.partNumber} (${p.brand}) from ${p.tableName}`);
      });
    }

    // Test 2: SMB search with AI analysis
    console.log('\n3. Testing SMB search with AI analysis...');
    const result2 = await searchSurfaceMountBoxes({
      searchTerm: 'panduit 4 port smb black',
      aiAnalysis: {
        productType: 'SURFACE_MOUNT_BOX',
        searchStrategy: 'surface_mount_box_search',
        confidence: 0.9,
        explanation: 'User is looking for a Panduit surface mount box',
        detectedSpecs: {
          manufacturer: 'Panduit',
          numberOfPorts: 4,
          color: 'black'
        }
      },
      limit: 10
    });
    
    console.log('Result 2:');
    console.log(`  Strategy: ${result2.searchStrategy}`);
    console.log(`  Products found: ${result2.totalFound}`);
    console.log(`  Message: ${result2.message || 'No message'}`);
    console.log(`  Search time: ${result2.searchTime}ms`);

    // Test 3: Direct test of cross-table search
    console.log('\n4. Testing if SMB products exist in other tables...');
    const { searchAllTablesForPartNumber } = await import('./search/shared/tableDiscoveryService.js');
    const crossTableResults = await searchAllTablesForPartNumber(['SMB', 'SURFACE MOUNT'], 5);
    
    console.log(`Found ${crossTableResults.length} SMB-related products across all tables:`);
    crossTableResults.forEach(item => {
      console.log(`  - ${item.part_number} in table: ${item._tableName}`);
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSMBTableHandling().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});