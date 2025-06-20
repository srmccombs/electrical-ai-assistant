-- Optional: Add a category column to modular_plugs table for clearer identification
-- This makes it consistent with other tables like jack_modules

-- Add category column if it doesn't exist
ALTER TABLE modular_plugs 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Modular Plug';

-- Update all existing records
UPDATE modular_plugs
SET category = 'Modular Plug'
WHERE is_active = true;

-- Verify the update
SELECT 
    part_number,
    brand,
    category,
    short_description
FROM modular_plugs
WHERE is_active = true
LIMIT 10;