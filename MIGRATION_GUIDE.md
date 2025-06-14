# Decision Engine Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from your current search architecture to the new Decision Engine without breaking existing functionality.

## Phase 1: Shadow Mode Deployment (Week 1)

### Step 1: Add Environment Variable

Add to your `.env.local`:
```
USE_DECISION_ENGINE=shadow
```

### Step 2: Modify searchService.ts

At the top of your `searchService.ts`, add:

```typescript
import { searchWithDecisionEngine } from './decisionEngine/integration'

// Add feature flag
const DECISION_ENGINE_MODE = process.env.USE_DECISION_ENGINE || 'disabled'
```

### Step 3: Wrap Your Main Search Function

Find your main search function (likely `searchProducts` or similar) and modify it:

```typescript
export async function searchProducts(
  query: string,
  shoppingListContext?: ShoppingListContext
): Promise<SearchResult> {
  
  // Decision Engine integration
  if (DECISION_ENGINE_MODE === 'shadow' || DECISION_ENGINE_MODE === 'production') {
    try {
      return await searchWithDecisionEngine(
        query,
        shoppingListContext,
        async (q, ctx) => {
          // Your existing search logic wrapped in a function
          return performExistingSearch(q, ctx)
        }
      )
    } catch (error) {
      logger.error('Decision Engine error, falling back:', error)
      // Fall back to original logic on error
      return performExistingSearch(query, shoppingListContext)
    }
  }
  
  // Original search logic
  return performExistingSearch(query, shoppingListContext)
}

// Extract your existing logic into a separate function
async function performExistingSearch(
  query: string,
  shoppingListContext?: ShoppingListContext
): Promise<SearchResult> {
  // Your current search implementation goes here
  // (Move existing code from searchProducts)
}
```

### Step 4: Create Database Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create search decisions audit table
CREATE TABLE IF NOT EXISTS search_decisions_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL,
    original_query TEXT NOT NULL,
    normalized_query TEXT,
    decision_stage VARCHAR(50) NOT NULL,
    stage_order INT NOT NULL,
    decision_type VARCHAR(50),
    decision_value JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    reason TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_decision_query ON search_decisions_audit(query_id);
CREATE INDEX idx_decision_stage ON search_decisions_audit(decision_stage);

-- Create shadow mode comparisons table
CREATE TABLE IF NOT EXISTS shadow_mode_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    old_engine_result JSONB NOT NULL,
    new_engine_result JSONB NOT NULL,
    divergence_type VARCHAR(50),
    divergence_severity VARCHAR(20),
    old_engine_time_ms INT,
    new_engine_time_ms INT,
    user_clicked_result VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shadow_divergence ON shadow_mode_comparisons(divergence_type);
CREATE INDEX idx_shadow_time ON shadow_mode_comparisons(created_at);
```

### Step 5: Deploy and Monitor

1. Deploy to production with shadow mode enabled
2. Monitor for 1-2 weeks
3. Check shadow mode reports daily:

```typescript
// Add this endpoint to check shadow mode performance
app.get('/api/admin/shadow-report', async (req, res) => {
  const report = await getShadowModeReport(24) // Last 24 hours
  res.json({ report })
})
```

## Phase 2: Validation (Week 2)

### Step 1: Create Critical Query Tests

Create a file `criticalQueries.json`:

```json
{
  "critical_queries": [
    {
      "query": "cat6 plenum cable",
      "expected_table": "category_cables",
      "expected_product_type": "CATEGORY_CABLE"
    },
    {
      "query": "surface mount box",
      "expected_table": "surface_mount_box",
      "expected_product_type": "SURFACE_MOUNT_BOX"
    },
    {
      "query": "2 port faceplate",
      "expected_table": "faceplates",
      "expected_product_type": "FACEPLATE"
    },
    {
      "query": "panduit jack cat6",
      "expected_table": "jack_modules",
      "expected_product_type": "JACK_MODULE"
    }
  ]
}
```

### Step 2: Run Validation Script

Create `validateDecisionEngine.ts`:

```typescript
import { DecisionEngineAdapter } from './services/decisionEngine/DecisionEngineAdapter'
import criticalQueries from './criticalQueries.json'

async function validateEngine() {
  const adapter = new DecisionEngineAdapter(false) // Production mode
  const results = []

  for (const test of criticalQueries.critical_queries) {
    const result = await adapter.search(test.query)
    
    results.push({
      query: test.query,
      passed: result.targetTable === test.expected_table &&
              result.productType === test.expected_product_type,
      expected: test,
      actual: {
        table: result.targetTable,
        productType: result.productType
      }
    })
  }

  const passed = results.filter(r => r.passed).length
  console.log(`Validation Results: ${passed}/${results.length} passed`)
  
  return results
}
```

### Step 3: Check Production Readiness

```typescript
import { checkProductionReadiness } from './services/decisionEngine/integration'

async function checkReadiness() {
  const { ready, report } = await checkProductionReadiness()
  console.log(report)
  
  if (!ready) {
    console.error('⚠️  Not ready for production!')
  } else {
    console.log('✅ Ready for production!')
  }
}
```

## Phase 3: Progressive Rollout (Week 3)

### Step 1: Enable for Beta Users

Update your search function to roll out gradually:

```typescript
const BETA_COMPANY_IDS = ['company-1', 'company-2'] // Your beta testers

export async function searchProducts(
  query: string,
  shoppingListContext?: ShoppingListContext,
  userId?: string,
  companyId?: string
): Promise<SearchResult> {
  
  // Determine if user should use new engine
  const useNewEngine = shouldUseNewEngine(userId, companyId)
  
  if (useNewEngine) {
    // Use production mode for beta users
    process.env.USE_DECISION_ENGINE = 'production'
  }
  
  // ... rest of implementation
}

function shouldUseNewEngine(userId?: string, companyId?: string): boolean {
  // Beta companies always use new engine
  if (companyId && BETA_COMPANY_IDS.includes(companyId)) {
    return true
  }
  
  // Percentage rollout
  const rolloutPercentage = parseInt(process.env.ROLLOUT_PERCENTAGE || '0')
  if (userId) {
    const hash = simpleHash(userId)
    return (hash % 100) < rolloutPercentage
  }
  
  return false
}
```

### Step 2: Monitor Key Metrics

Add monitoring for critical metrics:

```typescript
// Track search success rate
async function trackSearchSuccess(
  query: string,
  resultsFound: boolean,
  engineType: 'old' | 'new'
) {
  await supabase.from('search_metrics').insert({
    query,
    success: resultsFound,
    engine_type: engineType,
    timestamp: new Date()
  })
}
```

### Step 3: Gradual Increase

Week 3, Day 1: 10% of users
Week 3, Day 3: 25% of users
Week 3, Day 5: 50% of users
Week 4, Day 1: 100% of users

Update `ROLLOUT_PERCENTAGE` environment variable accordingly.

## Phase 4: Full Production (Week 4)

### Step 1: Switch to Production Mode

Update `.env.local`:
```
USE_DECISION_ENGINE=production
ROLLOUT_PERCENTAGE=100
```

### Step 2: Remove Shadow Mode Code

After 1 week of stable production:

1. Remove the shadow mode comparison logic
2. Remove the old search function wrapper
3. Clean up environment variables

### Step 3: Enable Knowledge System

Add the Knowledge Stage to the pipeline:

```typescript
import { KnowledgeStage } from './stages/KnowledgeStage'

// In DecisionEngineAdapter constructor
this.engine = new DecisionEngine([
  new BusinessRuleStage(),
  new PartNumberStage(),
  new ContextualStage(),
  new AIAnalysisStage(),
  new TextDetectionStage(),
  new KnowledgeStage(),      // Add this
  new FallbackStage()
])
```

## Rollback Plan

If issues arise at any stage:

### Immediate Rollback (< 1 minute)

Change environment variable:
```
USE_DECISION_ENGINE=disabled
```

### Partial Rollback

Reduce rollout percentage:
```
ROLLOUT_PERCENTAGE=10
```

### Debug Specific Issues

Check the audit trail:
```sql
SELECT * FROM search_decisions_audit 
WHERE original_query LIKE '%problem query%'
ORDER BY created_at DESC;
```

## Success Criteria

Before moving to each phase, ensure:

### Shadow Mode → Beta
- [ ] < 5% divergence rate on critical queries
- [ ] No performance degradation (< 300ms p99)
- [ ] No increase in error rates

### Beta → Progressive Rollout
- [ ] All critical queries pass validation
- [ ] Beta users report no issues
- [ ] Search success rate ≥ current baseline

### Progressive → Full Production
- [ ] < 1% user complaints
- [ ] Search success rate improved by 5%+
- [ ] All regression tests passing

## Monitoring Dashboard

Create a simple monitoring page:

```typescript
// pages/admin/decision-engine.tsx
export default function DecisionEngineMonitor() {
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    fetch('/api/admin/engine-stats')
      .then(res => res.json())
      .then(setStats)
  }, [])
  
  return (
    <div>
      <h1>Decision Engine Status</h1>
      <div>Mode: {process.env.USE_DECISION_ENGINE}</div>
      <div>Rollout: {process.env.ROLLOUT_PERCENTAGE}%</div>
      {stats && (
        <>
          <div>Decisions Today: {stats.totalDecisions}</div>
          <div>Avg Confidence: {stats.avgConfidence}</div>
          <div>Success Rate: {stats.successRate}%</div>
        </>
      )}
    </div>
  )
}
```

## Common Issues & Solutions

### Issue: High Divergence Rate
**Solution**: Review shadow_mode_comparisons table for patterns, adjust TextDetectionStage priorities

### Issue: Slow Performance
**Solution**: Check AI cache hit rate, ensure KnowledgeStage cache is working

### Issue: Wrong Product Types
**Solution**: Review search_decisions_audit for the query, adjust detection patterns

### Issue: Missing Business Rules
**Solution**: Add new rules to BusinessRuleStage, test thoroughly

## Questions?

If you encounter any issues during migration:

1. Check the audit trail for the specific query
2. Review the decision stages in order
3. Look for patterns in the shadow mode comparisons
4. Adjust stage priorities or detection patterns as needed

The new architecture is designed to be debuggable - every decision is logged and can be traced.