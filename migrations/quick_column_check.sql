-- Quick column check for all product tables
-- Shows only the columns we care about for search

-- Summary of key columns per table
SELECT 
    table_name,
    array_agg(column_name ORDER BY ordinal_position) as all_columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'prod_fiber_connectors',
    'prod_fiber_cables',
    'prod_jack_modules',
    'prod_faceplates',
    'prod_surface_mount_boxes',
    'prod_adapter_panels',
    'prod_rack_mount_enclosures',
    'prod_wall_mount_enclosures',
    'prod_modular_plugs',
    'prod_category_cables'
)
GROUP BY table_name
ORDER BY table_name;