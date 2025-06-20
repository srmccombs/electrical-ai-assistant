#!/bin/bash

# Script to update all TypeScript files with new table names
# Run this from the project root

echo "🔄 Updating TypeScript files with new table names..."

# Define the replacements
declare -A replacements=(
    ["'category_cables'"]="'prod_category_cables'"
    ["\"category_cables\""]="\"prod_category_cables\""
    ["'fiber_connectors'"]="'prod_fiber_connectors'"
    ["\"fiber_connectors\""]="\"prod_fiber_connectors\""
    ["'fiber_optic_cable'"]="'prod_fiber_cables'"
    ["\"fiber_optic_cable\""]="\"prod_fiber_cables\""
    ["'jack_modules'"]="'prod_jack_modules'"
    ["\"jack_modules\""]="\"prod_jack_modules\""
    ["'faceplates'"]="'prod_faceplates'"
    ["\"faceplates\""]="\"prod_faceplates\""
    ["'surface_mount_box'"]="'prod_surface_mount_boxes'"
    ["\"surface_mount_box\""]="\"prod_surface_mount_boxes\""
    ["'adapter_panels'"]="'prod_adapter_panels'"
    ["\"adapter_panels\""]="\"prod_adapter_panels\""
    ["'rack_mount_fiber_enclosures'"]="'prod_rack_mount_enclosures'"
    ["\"rack_mount_fiber_enclosures\""]="\"prod_rack_mount_enclosures\""
    ["'wall_mount_fiber_enclosures'"]="'prod_wall_mount_enclosures'"
    ["\"wall_mount_fiber_enclosures\""]="\"prod_wall_mount_enclosures\""
    ["'modular_plugs'"]="'prod_modular_plugs'"
    ["\"modular_plugs\""]="\"prod_modular_plugs\""
    [".from('category_cables')"]=".from('prod_category_cables')"
    [".from('fiber_connectors')"]=".from('prod_fiber_connectors')"
    [".from('fiber_optic_cable')"]=".from('prod_fiber_cables')"
    [".from('jack_modules')"]=".from('prod_jack_modules')"
    [".from('faceplates')"]=".from('prod_faceplates')"
    [".from('surface_mount_box')"]=".from('prod_surface_mount_boxes')"
)

# Files to update
files=(
    "search/fiberConnectors/fiberConnectorSearch.ts"
    "search/fiberCables/fiberCableSearch.ts"
    "search/jackModules/jackModuleSearch.ts"
    "search/faceplates/faceplateSearch.ts"
    "search/surfaceMountBoxes/surfaceMountBoxSearch.ts"
    "search/fiberadapterPanels/fiberadapterPanelSearch.ts"
    "search/fiberenclosure/rack_mount_fiber_enclosure_Search.ts"
    "search/fiberenclosure/wall_mount_fiber_enclosure_Search.ts"
    "search/modularPlugs/modularPlugSearch.ts"
    "services/compatibilityService.ts"
    "services/crossReferenceService.ts"
    "services/datasheetService.ts"
    "config/constants.ts"
)

# Update each file
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating $file..."
        for old in "${!replacements[@]}"; do
            new="${replacements[$old]}"
            # Use sed with backup
            sed -i.bak "s|$old|$new|g" "$file"
        done
        # Remove backup file
        rm -f "$file.bak"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "✅ TypeScript files updated!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run build' to check for TypeScript errors"
echo "2. Test the application thoroughly"
echo "3. Update any environment variables if needed"