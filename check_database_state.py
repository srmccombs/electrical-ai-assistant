import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
    exit(1)

supabase: Client = create_client(url, key)

# Query 1: Get row counts for all product tables
print("=== QUERY 1: Row counts for all product tables ===")
query1 = """
SELECT 'prod_category_cables' as table_name, COUNT(*) as row_count FROM prod_category_cables
UNION ALL
SELECT 'prod_fiber_cables', COUNT(*) FROM prod_fiber_cables
UNION ALL
SELECT 'prod_fiber_connectors', COUNT(*) FROM prod_fiber_connectors
UNION ALL
SELECT 'prod_jack_modules', COUNT(*) FROM prod_jack_modules
UNION ALL
SELECT 'prod_modular_plugs', COUNT(*) FROM prod_modular_plugs
UNION ALL
SELECT 'prod_faceplates', COUNT(*) FROM prod_faceplates
UNION ALL
SELECT 'prod_surface_mount_boxes', COUNT(*) FROM prod_surface_mount_boxes
UNION ALL
SELECT 'prod_adapter_panels', COUNT(*) FROM prod_adapter_panels
UNION ALL
SELECT 'prod_wall_mount_fiber_enclosures', COUNT(*) FROM prod_wall_mount_fiber_enclosures
UNION ALL
SELECT 'prod_rack_mount_fiber_enclosures', COUNT(*) FROM prod_rack_mount_fiber_enclosures
ORDER BY row_count DESC
"""

try:
    result1 = supabase.rpc('execute_sql', {'query': query1}).execute()
    if result1.data:
        for row in result1.data:
            print(f"{row['table_name']}: {row['row_count']} rows")
    else:
        # Try direct table queries as fallback
        tables = [
            'prod_category_cables', 'prod_fiber_cables', 'prod_fiber_connectors',
            'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates',
            'prod_surface_mount_boxes', 'prod_adapter_panels',
            'prod_wall_mount_fiber_enclosures', 'prod_rack_mount_fiber_enclosures'
        ]
        for table in tables:
            try:
                count = supabase.table(table).select("*", count='exact').execute()
                print(f"{table}: {count.count} rows")
            except Exception as e:
                print(f"{table}: Error - {str(e)}")
except Exception as e:
    print(f"Query 1 error: {str(e)}")

print("\n=== QUERY 2: Check search_terms table status ===")
try:
    # Get total count
    total_result = supabase.table('search_terms').select("*", count='exact').execute()
    total_count = total_result.count if total_result else 0
    
    # Get unique term groups
    groups_result = supabase.table('search_terms').select("term_group").execute()
    unique_groups = len(set(row['term_group'] for row in groups_result.data)) if groups_result.data else 0
    
    # Get active terms
    active_result = supabase.table('search_terms').select("*", count='exact').eq('is_active', True).execute()
    active_count = active_result.count if active_result else 0
    
    print(f"Total terms: {total_count}")
    print(f"Unique groups: {unique_groups}")
    print(f"Active terms: {active_count}")
except Exception as e:
    print(f"Query 2 error: {str(e)}")

print("\n=== QUERY 3: Check data quality issues ===")
try:
    # Check prod_category_cables
    cables_missing = supabase.table('prod_category_cables').select("*", count='exact').or_('common_terms.is.null,common_terms.eq.').execute()
    cables_inactive = supabase.table('prod_category_cables').select("*", count='exact').eq('is_active', False).execute()
    
    # Check prod_fiber_cables
    fiber_missing = supabase.table('prod_fiber_cables').select("*", count='exact').or_('common_terms.is.null,common_terms.eq.').execute()
    fiber_inactive = supabase.table('prod_fiber_cables').select("*", count='exact').eq('is_active', False).execute()
    
    # Check prod_jack_modules
    jack_missing = supabase.table('prod_jack_modules').select("*", count='exact').or_('common_terms.is.null,common_terms.eq.').execute()
    
    # Check prod_faceplates
    face_missing = supabase.table('prod_faceplates').select("*", count='exact').or_('common_terms.is.null,common_terms.eq.').execute()
    
    if cables_missing.count and cables_missing.count > 0:
        print(f"prod_category_cables - Missing common_terms: {cables_missing.count}")
    if cables_inactive.count and cables_inactive.count > 0:
        print(f"prod_category_cables - Inactive products: {cables_inactive.count}")
    if fiber_missing.count and fiber_missing.count > 0:
        print(f"prod_fiber_cables - Missing common_terms: {fiber_missing.count}")
    if fiber_inactive.count and fiber_inactive.count > 0:
        print(f"prod_fiber_cables - Inactive products: {fiber_inactive.count}")
    if jack_missing.count and jack_missing.count > 0:
        print(f"prod_jack_modules - Missing common_terms: {jack_missing.count}")
    if face_missing.count and face_missing.count > 0:
        print(f"prod_faceplates - Missing common_terms: {face_missing.count}")
    
    if not any([cables_missing.count, cables_inactive.count, fiber_missing.count, 
                fiber_inactive.count, jack_missing.count, face_missing.count]):
        print("No data quality issues found!")
except Exception as e:
    print(f"Query 3 error: {str(e)}")

print("\n=== QUERY 4: Check for tables missing audit columns ===")
print("Note: This query requires direct database access. Checking tables individually...")
tables_to_check = [
    'prod_category_cables', 'prod_fiber_cables', 'prod_fiber_connectors',
    'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates',
    'prod_surface_mount_boxes', 'prod_adapter_panels',
    'prod_wall_mount_fiber_enclosures', 'prod_rack_mount_fiber_enclosures'
]

for table in tables_to_check:
    try:
        # Try to select audit columns to see if they exist
        result = supabase.table(table).select("created_by,last_modified_by").limit(1).execute()
        print(f"{table}: has_created_by=YES, has_last_modified_by=YES")
    except Exception as e:
        if "column" in str(e).lower():
            print(f"{table}: Missing audit columns")
        else:
            print(f"{table}: Error checking - {str(e)}")

print("\n=== QUERY 5: Check Category 5e products specifically ===")
try:
    # Total Cat5e products
    total_cat5e = supabase.table('prod_category_cables').select("*", count='exact').eq('category_rating', 'Category 5e').execute()
    
    # Active Cat5e products
    active_cat5e = supabase.table('prod_category_cables').select("*", count='exact').eq('category_rating', 'Category 5e').eq('is_active', True).execute()
    
    # Cat5e with search terms
    with_terms = supabase.table('prod_category_cables').select("*", count='exact').eq('category_rating', 'Category 5e').neq('common_terms', '').execute()
    
    print(f"Total Category 5e products: {total_cat5e.count if total_cat5e else 0}")
    print(f"Active Category 5e products: {active_cat5e.count if active_cat5e else 0}")
    print(f"Category 5e with search terms: {with_terms.count if with_terms else 0}")
except Exception as e:
    print(f"Query 5 error: {str(e)}")