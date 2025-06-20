# Analytics 406 Error Fix Guide

## Problem
The search analytics tracking is returning 406 "Not Acceptable" errors when trying to insert data into the `search_analytics` table.

## Root Causes
1. **Row Level Security (RLS)** - The table has RLS enabled but no policy allowing anonymous inserts
2. **Missing Permissions** - The `anon` role doesn't have INSERT permission
3. **Schema Mismatch** - The data being sent doesn't match the table schema

## Quick Fix Steps

### 1. Check Current Status
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'search_analytics';
```

### 2. Option A: Disable RLS (Simplest)
```sql
ALTER TABLE public.search_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_searches DISABLE ROW LEVEL SECURITY;
```

### 3. Option B: Add RLS Policies (More Secure)
```sql
-- Allow anonymous inserts
CREATE POLICY "Allow anonymous inserts" ON public.search_analytics
    FOR INSERT TO anon WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON public.search_analytics TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
```

### 4. Test the Fix
```sql
-- Test insert
INSERT INTO search_analytics (
    search_term, results_count, search_time_ms, 
    search_type, user_session, created_at
) VALUES (
    'TEST', 0, 100, 'direct', 'test_session', NOW()
);

-- If successful, delete test
DELETE FROM search_analytics WHERE search_term = 'TEST';
```

## Frontend Update (Optional)

If the issue persists, update the analytics service to handle errors better:

```typescript
// In /services/analytics.ts
export const trackSearch = async (data: SearchAnalytics): Promise<void> => {
  try {
    const { error } = await supabase
      .from('search_analytics')
      .insert({
        search_term: data.searchTerm.trim(),
        results_count: data.resultsCount,
        search_time_ms: data.searchTimeMs,
        search_type: data.searchType,
        ai_product_type: data.aiProductType || null,
        user_session: getSessionId(),
        created_at: new Date().toISOString()
      })
      .select() // Add this to get better error messages

    if (error) {
      // Log the specific error for debugging
      console.error('Analytics tracking error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    }
  } catch (error) {
    console.error('Analytics error:', error)
  }
}
```

## Verification

After applying the fix:
1. Perform a search in your application
2. Check Supabase logs for any errors
3. Query the search_analytics table to confirm data is being inserted:

```sql
SELECT COUNT(*) as total_searches,
       MAX(created_at) as last_search
FROM search_analytics
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Long-term Solution

Consider creating a dedicated analytics API endpoint that handles the insert server-side with proper authentication and validation. This provides better security and error handling.

## Related Files
- `/services/analytics.ts` - Frontend analytics service
- `/services/searchService.ts` - Where trackSearch is called
- `fix_analytics_406_error.sql` - SQL script with all fixes

Last Updated: June 17, 2025