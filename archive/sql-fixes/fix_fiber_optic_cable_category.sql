-- Fix Fiber Optic Cable Category Update
-- fiber_category contains: OM1, OM2, OM3, OM4, OM5, OS1, OS2
-- OS1/OS2 = Single-mode
-- OM1/OM2/OM3/OM4/OM5 = Multimode

-- ============================================
-- 6. FIBER CABLES TABLE (CORRECTED)
-- ============================================

-- First, let's see what we're working with
SELECT DISTINCT fiber_category, COUNT(*) as count
FROM fiber_optic_cable
WHERE is_active = true
GROUP BY fiber_category
ORDER BY fiber_category;

-- Update category based on fiber_category (glass type)
UPDATE fiber_optic_cable
SET category = 
    CASE 
        -- Single-mode fibers
        WHEN fiber_category IN ('OS1', 'OS2') THEN 'Single-mode Fiber Cable'
        -- Multimode fibers
        WHEN fiber_category IN ('OM1', 'OM2', 'OM3', 'OM4', 'OM5') THEN 'Multimode Fiber Cable'
        -- Keep existing if already set properly
        WHEN category = 'FIBER OPTIC CABLE' THEN 'Fiber Optic Cable'
        -- Default
        ELSE COALESCE(category, 'Fiber Optic Cable')
    END
WHERE is_active = true;

-- Verify the update
SELECT 
    category, 
    fiber_category,
    COUNT(*) as count 
FROM fiber_optic_cable 
WHERE is_active = true
GROUP BY category, fiber_category
ORDER BY category, fiber_category;

-- Summary by category
SELECT 
    category,
    COUNT(*) as total_products,
    STRING_AGG(DISTINCT fiber_category, ', ' ORDER BY fiber_category) as glass_types
FROM fiber_optic_cable 
WHERE is_active = true
GROUP BY category
ORDER BY category;