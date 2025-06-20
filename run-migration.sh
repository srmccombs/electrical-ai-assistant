#!/bin/bash

# Run the search columns migration for all product tables
echo "Running migration to add search columns to all product tables..."
echo "This will:"
echo "  - Add computed_search_terms and search_vector to all 9 product tables"
echo "  - Create search functions that integrate with search_terms table"
echo "  - Set up automatic triggers for search term updates"
echo "  - Create GIN indexes for fast full-text search"
echo ""

# You'll need to update these with your actual database credentials
# Or use environment variables
DATABASE_URL="${DATABASE_URL:-postgresql://username:password@host:port/database}"

# Check if DATABASE_URL is still the default
if [[ "$DATABASE_URL" == "postgresql://username:password@host:port/database" ]]; then
    echo "ERROR: Please set DATABASE_URL environment variable or update this script"
    echo "Example: export DATABASE_URL='your-database-url'"
    exit 1
fi

# Run the migration
echo "Connecting to database..."
echo ""
echo "NOTE: If you get GIN index errors, use the SAFE version instead:"
echo "  psql \$DATABASE_URL -f migrations/006_add_search_columns_all_products_SAFE.sql"
echo ""
psql $DATABASE_URL -f migrations/006_add_search_columns_all_products.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration complete! All product tables now have:"
    echo "   - Sophisticated search with synonym support"
    echo "   - Table-specific attribute searching"
    echo "   - Full-text search indexes"
    echo "   - Automatic search term updates"
    echo ""
    echo "The search system is now fully implemented across all product types!"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi