// Test script for STP cable search
import { searchCategoryCables } from './search/categoryCables/categoryCableSearch.js';

async function testSTPSearch() {
  console.log('Testing Cat6 STP search...\n');
  
  // Simulate AI analysis result
  const aiAnalysis = {
    detectedSpecs: {
      categoryRating: 'CAT6',
      shielding: 'STP',
      color: 'RED',
      requestedQuantity: 5000
    }
  };
  
  try {
    const result = await searchCategoryCables({
      searchTerm: 'Cat 6 STP Cable RED 5000FT',
      aiAnalysis: aiAnalysis,
      limit: 20
    });
    
    console.log('\n=== SEARCH RESULTS ===');
    console.log(`Strategy: ${result.searchStrategy}`);
    console.log(`Total Found: ${result.totalFound}`);
    console.log(`Search Time: ${result.searchTime}ms`);
    console.log(`\nProducts returned: ${result.products.length}`);
    
    if (result.products.length > 0) {
      console.log('\nFirst 5 products:');
      result.products.slice(0, 5).forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.partNumber}`);
        console.log(`   Brand: ${product.brand}`);
        console.log(`   Description: ${product.description}`);
        console.log(`   Category: ${product.categoryRating}`);
        console.log(`   Shielding: ${product.shielding}`);
        console.log(`   Color: ${product.color || product.jacketColor}`);
      });
    } else {
      console.log('\nNo products found!');
    }
    
  } catch (error) {
    console.error('Error during search:', error);
  }
}

// Run the test
testSTPSearch();