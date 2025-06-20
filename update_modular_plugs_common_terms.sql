-- Update common_terms for modular_plugs to improve searchability
-- This will help with searches for "rj45", "modular plug", "crimp", etc.

UPDATE modular_plugs
SET common_terms = CONCAT_WS(' ',
    'modular plug',
    'modular plugs', 
    'rj45',
    'rj-45',
    '8p8c',
    'ethernet connector',
    'network plug',
    'crimp connector',
    'terminator plug',
    CASE 
        WHEN short_description ILIKE '%feed-through%' OR short_description ILIKE '%feed through%' 
        THEN 'pass-through passthrough feed-through ez-rj45 ezrj45'
        ELSE ''
    END,
    CASE 
        WHEN shielding_type = 'STP' THEN 'shielded stp'
        WHEN shielding_type = 'UTP' THEN 'unshielded utp'
        ELSE ''
    END,
    CASE 
        WHEN conductor_awg = 23 THEN '23awg 23 awg'
        WHEN conductor_awg = 24 THEN '24awg 24 awg'
        ELSE ''
    END,
    LOWER(brand),
    LOWER(product_line),
    CASE 
        WHEN packaging_qty = 20 THEN '20 pack 20-pack 20pk'
        WHEN packaging_qty = 50 THEN '50 pack 50-pack 50pk'
        WHEN packaging_qty = 100 THEN '100 pack 100-pack 100pk 100pc'
        WHEN packaging_qty = 500 THEN '500 pack 500-pack 500pk 500pc'
        ELSE ''
    END,
    'crimp crimps crimping terminate termination'
)
WHERE is_active = true;

-- Check results
SELECT 
    part_number,
    brand,
    short_description,
    common_terms
FROM modular_plugs
WHERE is_active = true
LIMIT 5;

-- Test search capability
SELECT COUNT(*) as rj45_searchable
FROM modular_plugs
WHERE is_active = true
  AND (common_terms ILIKE '%rj45%' OR short_description ILIKE '%rj45%');
  
SELECT COUNT(*) as modular_plug_searchable
FROM modular_plugs
WHERE is_active = true
  AND (common_terms ILIKE '%modular plug%' OR short_description ILIKE '%modular plug%');