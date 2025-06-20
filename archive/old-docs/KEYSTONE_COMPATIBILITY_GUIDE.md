# Keystone Compatibility Guide

## What is Keystone?
Keystone is an industry-standard jack opening size (approximately 14.5mm x 16.0mm) that allows modular jacks to snap into compatible faceplates and panels. It's not a brand or product line, but a physical standard.

## Common Keystone-Compatible Product Lines

### PANDUIT
- **NetKey** ✅ Keystone-compatible
- **Mini-Com** ❌ NOT Keystone-compatible (proprietary size)

### Hubbell
- **iSTATION** ✅ Keystone-compatible
- **netSELECT** ❌ NOT Keystone-compatible (proprietary)

### Leviton
- **QuickPort** ❌ NOT Keystone-compatible (similar but different size)
- **Keystone** ✅ Obviously Keystone-compatible

### Other Brands Often Keystone-Compatible
- **ICC** - Most products are Keystone
- **Dynacom** - Keystone product line
- **Generic/Unbranded** - Usually Keystone
- **Monoprice** - Typically Keystone
- **Cable Matters** - Usually Keystone
- **StarTech** - Typically Keystone

## How to Identify in Your Database

1. **Product Line = "Keystone"** - Obviously compatible
2. **Product Line = "NetKey"** (Panduit) - Keystone-compatible
3. **Description contains "keystone"** - Usually compatible
4. **Description contains "modular"** - Often Keystone
5. **Generic brands** - Usually Keystone standard

## What's NOT Keystone-Compatible

1. **Panduit Mini-Com** - Smaller proprietary size
2. **Hubbell netSELECT** - Different mounting system  
3. **Leviton QuickPort** - Similar concept, different size
4. **Ortronics TracJack** - Proprietary system
5. **Systimax MGS** - Proprietary CommScope system

## Database Update Strategy

1. First, identify all NetKey faceplates and mark them Keystone-compatible
2. Review other product lines using the guide above
3. Check descriptions for "keystone" or "modular" keywords
4. Be conservative - only mark as Keystone-compatible if you're sure
5. Never mark Mini-Com, QuickPort, or netSELECT as Keystone-compatible