-- Check current search_terms table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data
SELECT * FROM search_terms LIMIT 5;

-- Check total count
SELECT COUNT(*) as total_mappings FROM search_terms;