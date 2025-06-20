# ⚠️ TRIGGERS DISABLED - IMPORTANT NOTES

## Current Status (As of Migration)
- **ALL database triggers are DISABLED**
- **Trigger definitions backed up in `disabled_triggers_backup` table**
- **Mayer stock sync is OFF** (not needed for 1 month)

## What This Means
1. **No automatic updates** - Search vectors won't update automatically
2. **No mayer stock sync** - New products won't sync to ops_mayer_stock
3. **No other automatic processes** - Any other triggers are paused

## After Migration Complete

### To See What Needs Re-enabling:
```sql
-- View all disabled triggers
SELECT * FROM disabled_triggers_backup ORDER BY table_name;

-- View migration notes
SELECT * FROM migration_notes ORDER BY id;
```

### To Re-enable Triggers:

1. **Search triggers** - Will be created fresh by migration (don't restore old ones)

2. **Other triggers** - Re-enable after testing:
```sql
-- Re-enable all triggers on a specific table
ALTER TABLE prod_category_cables ENABLE TRIGGER ALL;

-- Or re-enable a specific trigger
ALTER TABLE table_name ENABLE TRIGGER trigger_name;
```

3. **Mayer Stock Sync** - Recreate when needed (in 1 month):
```sql
-- Will need to reference ops_mayer_stock not mayer_stock
-- Full function definition saved in disabled_triggers_backup
```

## Priority Order for Re-enabling

1. ✅ **Search triggers** - Handled by migration automatically
2. 🔄 **Inventory sync** - When you start tracking inventory
3. 🔄 **Mayer stock** - In 1 month when needed
4. 🔄 **Other business logic** - As identified during testing

## Verification Commands

```sql
-- Check if triggers are enabled on a table
SELECT 
    tablename,
    COUNT(*) FILTER (WHERE tgenabled = 'O') as enabled_triggers,
    COUNT(*) FILTER (WHERE tgenabled = 'D') as disabled_triggers
FROM pg_tables t
LEFT JOIN pg_trigger tr ON t.tablename::regclass = tr.tgrelid
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

---
**Remember**: This is temporary for migration. The system will work fine without triggers for development/testing.