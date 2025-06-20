-- Fix for fiber_connectors trigger error
-- The sync trigger expects fields that don't exist in fiber_connectors

-- Option 1: Temporarily disable the trigger
ALTER TABLE fiber_connectors DISABLE TRIGGER sync_fiber_connectors_to_mayer;

-- Now run the category update
UPDATE fiber_connectors
SET category = 
    CASE 
        WHEN connector_type = 'LC' THEN 'LC Fiber Connector'
        WHEN connector_type = 'SC' THEN 'SC Fiber Connector'
        WHEN connector_type = 'ST' THEN 'ST Fiber Connector'
        WHEN connector_type = 'FC' THEN 'FC Fiber Connector'
        ELSE 'Fiber Connector'
    END
WHERE category IS NULL OR category = '';

-- Re-enable the trigger
ALTER TABLE fiber_connectors ENABLE TRIGGER sync_fiber_connectors_to_mayer;

-- Verify the update
SELECT category, connector_type, COUNT(*) as count 
FROM fiber_connectors 
WHERE is_active = true
GROUP BY category, connector_type
ORDER BY category, connector_type;