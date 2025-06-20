-- Check exact structure of search_terms table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
ORDER BY ordinal_position;