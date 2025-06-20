const { createClient } = require('@supabase/supabase-js');

// Hardcode the environment variables for this check
const supabaseUrl = 'https://dnmugslmheoxbsubhzci.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubXVnc2xtaGVveGJzdWJoemNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjQzNDMsImV4cCI6MjA2MzM0MDM0M30.7ccrbEVka0K8HsRzwUSkpH0j30m1z8aEhDRXrtx_mPo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  console.log('=== QUERY 1: Row counts for all product tables ===');
  const tables = [
    'prod_category_cables',
    'prod_fiber_cables',
    'prod_fiber_connectors',
    'prod_jack_modules',
    'prod_modular_plugs',
    'prod_faceplates',
    'prod_surface_mount_boxes',
    'prod_adapter_panels',
    'prod_wall_mount_fiber_enclosures',
    'prod_rack_mount_fiber_enclosures'
  ];

  const counts = [];
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error counting ${table}:`, error.message);
        counts.push({ table_name: table, row_count: 'ERROR' });
      } else {
        counts.push({ table_name: table, row_count: count || 0 });
      }
    } catch (err) {
      console.error(`Error with ${table}:`, err.message);
      counts.push({ table_name: table, row_count: 'ERROR' });
    }
  }

  // Sort by count descending
  counts.sort((a, b) => {
    if (a.row_count === 'ERROR') return 1;
    if (b.row_count === 'ERROR') return -1;
    return b.row_count - a.row_count;
  });

  counts.forEach(({ table_name, row_count }) => {
    console.log(`${table_name}: ${row_count} rows`);
  });

  console.log('\n=== QUERY 2: Check search_terms table status ===');
  try {
    // Total count
    const { count: totalCount } = await supabase
      .from('search_terms')
      .select('*', { count: 'exact', head: true });

    // Unique groups
    const { data: groupsData } = await supabase
      .from('search_terms')
      .select('term_group');
    
    const uniqueGroups = groupsData ? new Set(groupsData.map(row => row.term_group)).size : 0;

    // Active terms
    const { count: activeCount } = await supabase
      .from('search_terms')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    console.log(`Total terms: ${totalCount || 0}`);
    console.log(`Unique groups: ${uniqueGroups}`);
    console.log(`Active terms: ${activeCount || 0}`);
  } catch (err) {
    console.error('Query 2 error:', err.message);
  }

  console.log('\n=== QUERY 3: Check data quality issues ===');
  const qualityChecks = [
    { table: 'prod_category_cables', field: 'common_terms', issue: 'Missing common_terms' },
    { table: 'prod_category_cables', field: 'is_active', value: false, issue: 'Inactive products' },
    { table: 'prod_fiber_cables', field: 'common_terms', issue: 'Missing common_terms' },
    { table: 'prod_fiber_cables', field: 'is_active', value: false, issue: 'Inactive products' },
    { table: 'prod_jack_modules', field: 'common_terms', issue: 'Missing common_terms' },
    { table: 'prod_faceplates', field: 'common_terms', issue: 'Missing common_terms' }
  ];

  let hasIssues = false;
  for (const check of qualityChecks) {
    try {
      let query = supabase.from(check.table).select('*', { count: 'exact', head: true });
      
      if (check.field === 'common_terms') {
        query = query.or('common_terms.is.null,common_terms.eq.');
      } else if (check.field === 'is_active') {
        query = query.eq('is_active', check.value);
      }

      const { count } = await query;
      
      if (count && count > 0) {
        console.log(`${check.table} - ${check.issue}: ${count}`);
        hasIssues = true;
      }
    } catch (err) {
      console.error(`Error checking ${check.table} ${check.issue}:`, err.message);
    }
  }
  
  if (!hasIssues) {
    console.log('No data quality issues found!');
  }

  console.log('\n=== QUERY 4: Check for tables missing audit columns ===');
  for (const table of tables) {
    try {
      // Try to get one row with audit columns
      const { data, error } = await supabase
        .from(table)
        .select('created_by,last_modified_by')
        .limit(1);
      
      if (error) {
        if (error.message.includes('column')) {
          console.log(`${table}: Missing audit columns`);
        } else {
          console.log(`${table}: Error - ${error.message}`);
        }
      } else {
        console.log(`${table}: has_created_by=YES, has_last_modified_by=YES`);
      }
    } catch (err) {
      console.log(`${table}: Error checking - ${err.message}`);
    }
  }

  console.log('\n=== QUERY 5: Check Category 5e products specifically ===');
  try {
    // Total Cat5e
    const { count: totalCat5e } = await supabase
      .from('prod_category_cables')
      .select('*', { count: 'exact', head: true })
      .eq('category_rating', 'Category 5e');

    // Active Cat5e
    const { count: activeCat5e } = await supabase
      .from('prod_category_cables')
      .select('*', { count: 'exact', head: true })
      .eq('category_rating', 'Category 5e')
      .eq('is_active', true);

    // Cat5e with search terms
    const { count: withTerms } = await supabase
      .from('prod_category_cables')
      .select('*', { count: 'exact', head: true })
      .eq('category_rating', 'Category 5e')
      .neq('common_terms', '');

    console.log(`Total Category 5e products: ${totalCat5e || 0}`);
    console.log(`Active Category 5e products: ${activeCat5e || 0}`);
    console.log(`Category 5e with search terms: ${withTerms || 0}`);
  } catch (err) {
    console.error('Query 5 error:', err.message);
  }
}

runQueries().catch(console.error);