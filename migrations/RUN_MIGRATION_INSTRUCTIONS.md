# 🚀 Database Migration Instructions

## Overview
We're going to:
1. Delete 10 unused tables
2. Rename 36 tables with prefixes (prod_, search_, ops_, etc.)
3. Update views to use new table names

## ⚠️ Before You Start
- ✅ You said database is backed up - Great!
- Have Supabase SQL Editor open
- Keep this instruction file open

## 📋 Step-by-Step Instructions

### STEP 1: Delete Unused Tables
1. Open Supabase SQL Editor
2. Copy ALL the content from `001_delete_unused_tables.sql`
3. Paste it into SQL Editor
4. Click "Run" button
5. You should see "Remaining tables after cleanup" with a list
6. ✅ This deletes 10 tables we don't need

### STEP 2: Rename Tables
1. In SQL Editor, clear the previous query
2. Copy ALL the content from `002_rename_tables_simplified.sql`
3. Paste it into SQL Editor
4. Click "Run" button
5. You should see a nice organized list with categories like:
   - 1. Products
   - 2. Search System
   - 3. Analytics
   - etc.
6. ✅ This renames 36 tables with prefixes

### STEP 3: Recreate Views
1. In SQL Editor, clear the previous query
2. Copy ALL the content from `003_recreate_views.sql`
3. Paste it into SQL Editor
4. Click "Run" button
5. You should see "Views recreated successfully!"
6. ✅ This updates all views to use new table names

## ✅ Verification
After all 3 steps, run this query to see your new organized database:

```sql
SELECT 
    CASE 
        WHEN tablename LIKE 'prod_%' THEN '🛍️ Products'
        WHEN tablename LIKE 'search_%' THEN '🔍 Search'
        WHEN tablename LIKE 'analytics_%' THEN '📊 Analytics'
        WHEN tablename LIKE 'ops_%' THEN '⚙️ Operations'
        WHEN tablename LIKE 'docs_%' THEN '📄 Documentation'
        ELSE '❓ Other'
    END as category,
    COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY category
ORDER BY category;
```

## 🚨 If Something Goes Wrong

If you see an error at any step:
1. Type `ROLLBACK;` in SQL Editor and run it
2. This will undo the current step
3. Let me know what error you saw

## 📝 What Happens Next

After running all 3 migrations:
- Your Supabase dashboard will show organized table names
- Tables will be grouped by prefix (prod_, search_, etc.)
- The app will need code updates (I'll help with that next)

## 🎯 Expected Result

You should have approximately:
- 10 product tables (prod_*)
- 8 search tables (search_*)
- 3 analytics tables/views (analytics_*)
- 6 operational tables (ops_*)
- 2 documentation tables (docs_*)
- Total: ~29 tables (down from 46!)

Ready? Start with Step 1! 🚀