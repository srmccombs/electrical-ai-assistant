// Quick script to check if STP cables exist in database
import { supabase } from './lib/supabase.js';

async function checkSTPCables() {
  console.log('Checking for STP cables in database...\n');
  
  try {
    // Check for any STP cables
    const { data: stpCables, error } = await supabase
      .from('category_cables')
      .select('part_number, brand, short_description, category_rating, Shielding_Type, jacket_color')
      .eq('Shielding_Type', 'STP')
      .eq('is_active', true)
      .limit(10);
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log(`Found ${stpCables?.length || 0} STP cables\n`);
    
    if (stpCables && stpCables.length > 0) {
      console.log('Sample STP cables:');
      stpCables.forEach((cable, index) => {
        console.log(`\n${index + 1}. ${cable.part_number}`);
        console.log(`   Brand: ${cable.brand}`);
        console.log(`   Description: ${cable.short_description}`);
        console.log(`   Category: ${cable.category_rating}`);
        console.log(`   Shielding: ${cable.Shielding_Type}`);
        console.log(`   Color: ${cable.jacket_color}`);
      });
    }
    
    // Also check for Cat6 STP specifically
    const { data: cat6StpCables, error: cat6Error } = await supabase
      .from('category_cables')
      .select('part_number, brand, short_description, category_rating, Shielding_Type, jacket_color')
      .eq('Shielding_Type', 'STP')
      .ilike('category_rating', '%Category 6%')
      .eq('is_active', true)
      .limit(5);
    
    if (!cat6Error && cat6StpCables) {
      console.log(`\n\nFound ${cat6StpCables.length} Cat6 STP cables specifically`);
      
      // Check for red Cat6 STP cables
      const { data: redCat6Stp } = await supabase
        .from('category_cables')
        .select('part_number, brand, short_description, category_rating, Shielding_Type, jacket_color')
        .eq('Shielding_Type', 'STP')
        .ilike('category_rating', '%Category 6%')
        .eq('jacket_color', 'Red')
        .eq('is_active', true)
        .limit(5);
      
      if (redCat6Stp && redCat6Stp.length > 0) {
        console.log(`\nFound ${redCat6Stp.length} RED Cat6 STP cables!`);
        console.log('First one:', redCat6Stp[0]);
      } else {
        console.log('\nNo RED Cat6 STP cables found in database');
      }
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Run the check
checkSTPCables();