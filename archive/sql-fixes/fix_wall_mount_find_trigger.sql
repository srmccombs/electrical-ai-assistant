-- Find the correct trigger name for wall_mount_fiber_enclosures

-- List all triggers on wall_mount_fiber_enclosures table
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        WHEN tgenabled = 'R' THEN 'REPLICA'
        WHEN tgenabled = 'A' THEN 'ALWAYS'
        ELSE 'UNKNOWN'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.wall_mount_fiber_enclosures'::regclass
ORDER BY tgname;

-- Alternative method to find triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'wall_mount_fiber_enclosures'
    AND trigger_schema = 'public'
ORDER BY trigger_name;