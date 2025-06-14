# Decision Engine Architecture Documentation

## Overview

The Decision Engine is a new search architecture that solves cascading failures when adding new product types. It uses an immutable decision pipeline with clear precedence rules.

## Core Problem Solved

**Before**: Multiple systems (AI, text detection, business rules) conflicted and overrode each other unpredictably
**After**: Single pipeline with immutable decisions and clear priority order

## Architecture Components

### 1. Decision Pipeline (Priority Order)

1. **BusinessRuleStage** (Priority 1)
   - Cat5 → Cat5e redirect
   - Jacket equivalencies (non-plenum = CMR = riser = PVC)
   - Box quantity conversions (1 box = 1000ft)
   - Brand synonyms (Corning = Siecor)

2. **PartNumberStage** (Priority 2)
   - Detects part numbers (CJ688TGBU, 7131100, etc.)
   - Routes to multi-table search
   - Bypasses other detection for direct lookups

3. **ContextualStage** (Priority 3)
   - Shopping list compatibility
   - Brand matching (Panduit jacks → Panduit faceplates)
   - Fiber type matching (OM4 cables → OM4 connectors)

4. **AIAnalysisStage** (Priority 4)
   - GPT-4o-mini with electrical context
   - Enhanced prompts for SMB/faceplate disambiguation
   - 1-hour cache for performance

5. **TextDetectionStage** (Priority 5)
   - SMB detection: Priority 100 (highest)
   - Faceplate detection: Priority 90
   - Jack module detection: Priority 80
   - Prevents keyword conflicts

6. **KnowledgeStage** (Priority 6)
   - User-contributed synonyms
   - Product relationships
   - Regional terminology

7. **FallbackStage** (Priority 100)
   - Brand-only searches
   - Cross-reference detection
   - Default to category cables

### 2. Immutable Decision Object

```typescript
SearchDecision {
  query: string              // Original query
  normalizedQuery: string    // Processed query
  productType?: string       // SURFACE_MOUNT_BOX, FACEPLATE, etc.
  table?: string            // Target database table
  confidence: number        // 0-1 confidence score
  hints: DecisionHint[]     // Compatibility suggestions
  auditTrail: AuditEntry[]  // Every modification logged
  isFinal: boolean          // Stops further processing
}
```

### 3. Key Design Principles

1. **Immutability**: Decisions can't be mutated, only new decisions created
2. **Audit Trail**: Every change is logged with reason
3. **Clear Precedence**: Earlier stages have higher priority
4. **No Overrides**: Later stages can't override earlier decisions
5. **Graceful Degradation**: Failures don't break search

## Migration Strategy

### Phase 1: Shadow Mode (Week 1-2)
- Run new engine alongside old
- Compare results, log divergences
- No customer impact

### Phase 2: Beta Testing (Week 3)
- Enable for selected companies
- Monitor success metrics
- Validate critical queries

### Phase 3: Progressive Rollout (Week 4)
- 10% → 25% → 50% → 100%
- Feature flags for instant rollback
- Continuous monitoring

### Phase 4: Knowledge System (Week 5+)
- Enable user contributions
- A/B test new knowledge
- Build competitive moat

## Critical Queries That Must Work

1. "cat6 plenum cable" → category_cables
2. "surface mount box" → surface_mount_box  
3. "2 port faceplate" → faceplates
4. "panduit jack cat6" → jack_modules
5. "fiber connector lc" → fiber_connectors
6. "4ru enclosure" → rack/wall_mount_fiber_enclosures

## Performance Requirements

- Decision time: <50ms
- Total search time: <300ms
- Cache hit rate: >80%
- Success rate: >95%

## Debugging

Every search creates an audit trail in `search_decisions_audit` table:
- Query ID for tracking
- Stage-by-stage decisions
- Confidence scores
- Timing information

## Files Created

```
services/decisionEngine/
├── DecisionEngine.ts          # Core orchestrator
├── SearchDecision.ts          # Immutable decision object
├── DecisionEngineAdapter.ts   # Integration with existing code
├── integration.ts             # Helper functions
├── types.ts                   # TypeScript interfaces
├── stages/
│   ├── BusinessRuleStage.ts   # Industry rules
│   ├── PartNumberStage.ts     # Part number detection
│   ├── ContextualStage.ts     # Shopping list context
│   ├── AIAnalysisStage.ts     # GPT-4 integration
│   ├── TextDetectionStage.ts  # Keyword patterns
│   ├── KnowledgeStage.ts      # User contributions
│   └── FallbackStage.ts       # Default handling
└── __tests__/
    └── DecisionEngine.test.ts # Comprehensive tests
```