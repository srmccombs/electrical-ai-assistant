-- CHECK_PRIMARY_KEY_FIRST.sql
-- Run this first to see what the current primary key is

-- 1. Show all columns and their properties for prod_surface_mount_boxes
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END as constraint_type
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.table_name = 'prod_surface_mount_boxes'
    AND tc.constraint_type = 'PRIMARY KEY'
) pk ON c.column_name = pk.column_name
WHERE c.table_name = 'prod_surface_mount_boxes'
ORDER BY c.ordinal_position;

-- 2. Show the actual constraint name
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'prod_surface_mount_boxes'
AND constraint_type = 'PRIMARY KEY';

-- 3. Show first 5 rows to see the data
SELECT * FROM prod_surface_mount_boxes LIMIT 5;