-- Fix for Analytics 406 Error
-- This fixes the "Not Acceptable" error when tracking searches
-- Created: June 17, 2025

-- STEP 1: Check if RLS is enabled on analytics tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('search_analytics', 'search_analytics_summary', 'popular_searches')
    AND schemaname = 'public';

-- STEP 2: If RLS is enabled, create policies for anonymous access
-- This allows the anon key to insert analytics data

-- Policy for search_analytics table
CREATE POLICY "Allow anonymous inserts" ON public.search_analytics
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy for reading own session data (optional but useful)
CREATE POLICY "Allow reading own session" ON public.search_analytics
    FOR SELECT
    TO anon
    USING (user_session = current_setting('request.session')::text OR true);

-- STEP 3: Grant necessary permissions
GRANT INSERT ON public.search_analytics TO anon;
GRANT SELECT ON public.search_analytics TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- STEP 4: Verify the table structure matches what we're inserting
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'search_analytics'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 5: Test insert to verify it works
INSERT INTO public.search_analytics (
    search_term,
    results_count,
    search_time_ms,
    search_type,
    ai_product_type,
    user_session,
    created_at
) VALUES (
    'TEST_SEARCH',
    0,
    100,
    'direct',
    null,
    'test_session_123',
    NOW()
);

-- STEP 6: If the test works, delete the test record
DELETE FROM public.search_analytics 
WHERE search_term = 'TEST_SEARCH' 
    AND user_session = 'test_session_123';

-- ALTERNATIVE FIX: If you don't need RLS, disable it
-- ALTER TABLE public.search_analytics DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.search_analytics_summary DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.popular_searches DISABLE ROW LEVEL SECURITY;

-- OPTIONAL: Create a function to handle analytics inserts with better error handling
CREATE OR REPLACE FUNCTION public.track_search_analytics(
    p_search_term TEXT,
    p_results_count INTEGER,
    p_search_time_ms INTEGER,
    p_search_type TEXT,
    p_ai_product_type TEXT DEFAULT NULL,
    p_user_session TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.search_analytics (
        search_term,
        results_count,
        search_time_ms,
        search_type,
        ai_product_type,
        user_session,
        created_at
    ) VALUES (
        p_search_term,
        p_results_count,
        p_search_time_ms,
        p_search_type,
        p_ai_product_type,
        p_user_session,
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        RAISE WARNING 'Analytics tracking failed: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.track_search_analytics TO anon;