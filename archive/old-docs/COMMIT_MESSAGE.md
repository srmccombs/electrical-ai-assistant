# Suggested Commit Message

```
feat: Add Decision Engine architecture in shadow mode

BREAKING CHANGE: None - Shadow mode ensures no user impact

## What's New
- Implemented Decision Engine to prevent cascading search failures
- Added immutable decision pipeline with clear precedence rules
- Created 7 decision stages: Business Rules, Part Numbers, Context, AI, Text Detection, Knowledge, Fallback
- Integrated shadow mode for safe testing alongside existing search

## Key Improvements
- SMB vs Faceplate conflicts resolved (SMB priority: 100)
- Prevents functions from overriding each other
- Full audit trail for every search decision
- Regression test framework for critical queries

## Shadow Mode Features
- Runs both old and new engines in parallel
- Logs divergences for analysis
- Returns old results (100% safe)
- Admin dashboard at /admin/decision-engine

## Database Changes
- Added search_decisions_audit table
- Added shadow_mode_comparisons table
- Added regression_tests table
- Added knowledge system tables (not active yet)

## Configuration
- Set USE_DECISION_ENGINE=shadow to enable
- Default is 'disabled' for safety

## Monitoring
- Admin dashboard: /admin/decision-engine
- Shadow report API: /api/admin/shadow-report
- Readiness check API: /api/admin/engine-readiness

This deployment enables shadow mode testing with zero user impact.
After 1-2 weeks of validation, can switch to production mode.
```

## For GitHub PR Description (if using PRs):

### Title: 
feat: Decision Engine Architecture (Shadow Mode)

### Description:
This PR introduces the Decision Engine architecture to solve cascading search failures when adding new product types.

**Problem Solved:**
- Adding new product types (like SMB) was breaking existing searches (faceplates, jacks)
- Multiple detection systems were overriding each other unpredictably
- No clear precedence rules for search routing

**Solution:**
- Immutable decision pipeline with clear precedence
- Shadow mode testing (runs both engines, compares results)
- Full audit trail for debugging

**Testing:**
- Comprehensive test suite included
- Shadow mode ensures zero user impact
- Critical queries verified in tests

**Deployment:**
1. Merge this PR
2. Run SQL migration in Supabase
3. Set USE_DECISION_ENGINE=shadow
4. Monitor for 1-2 weeks
5. Switch to production when ready

**No breaking changes** - Shadow mode returns old results while testing new engine.