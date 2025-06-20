-- Quick reference for updating application code
-- These are the table name changes you need to make in your TypeScript files

-- PRODUCT TABLES:
-- OLD NAME                      → NEW NAME
-- category_cables               → prod_category_cables
-- fiber_connectors              → prod_fiber_connectors
-- fiber_optic_cable             → prod_fiber_cables
-- jack_modules                  → prod_jack_modules
-- faceplates                    → prod_faceplates
-- surface_mount_box             → prod_surface_mount_boxes
-- adapter_panels                → prod_adapter_panels
-- rack_mount_fiber_enclosures   → prod_rack_mount_enclosures
-- wall_mount_fiber_enclosures   → prod_wall_mount_enclosures
-- modular_plugs                 → prod_modular_plugs

-- SEARCH TABLES:
-- knowledge_contributions        → search_knowledge_contrib
-- shadow_mode_comparisons        → search_shadow_comparisons
-- regression_tests               → search_regression_tests
-- search_variations              → search_term_variations

-- ANALYTICS TABLES:
-- performance_baselines          → analytics_performance
-- popular_searches               → analytics_popular_searches (VIEW)
-- search_analytics_summary       → analytics_search_summary (VIEW)

-- OPERATIONAL TABLES:
-- branch_locations               → ops_branch_locations
-- manufacturers                 → ops_manufacturers
-- mayer_stock                   → ops_mayer_stock

-- Test query to verify table names:
SELECT tablename, 
       CASE 
         WHEN tablename LIKE 'prod_%' THEN '✅ Product'
         WHEN tablename LIKE 'search_%' THEN '✅ Search'
         WHEN tablename LIKE 'analytics_%' THEN '✅ Analytics'
         WHEN tablename LIKE 'ops_%' THEN '✅ Operations'
         WHEN tablename LIKE 'docs_%' THEN '✅ Documentation'
         ELSE '❌ Needs prefix'
       END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY status DESC, tablename;