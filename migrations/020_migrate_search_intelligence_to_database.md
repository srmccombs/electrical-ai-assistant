# Search Intelligence Database Migration Plan

## Overview
This document outlines the plan to migrate all hardcoded search intelligence from TypeScript code to database tables, enabling dynamic updates without code changes.

## Current Intelligence Locations

### 1. In Code (industryKnowledge.ts)
- **Term Mappings**: 500+ search term variations
- **Detection Functions**: 15+ complex detection algorithms
- **Business Rules**: Validation, redirections, normalizations
- **Industry Knowledge**: Equivalencies, patterns, mappings

### 2. In Database (search_terms table)
- Basic category ratings
- Some product-specific terms
- Limited brand/color mappings
- Basic misspellings

## Migration Strategy

### Phase 1: Enhance search_terms Table
Add missing columns to support all intelligence types:
- `detection_pattern` - Regex patterns for detection
- `priority` - Order of detection (e.g., check "non-plenum" before "plenum")
- `redirect_to` - For business rules like Cat5→Cat5e
- `validation_rules` - JSON for complex validation
- `equivalencies` - Array of equivalent terms
- `conversion_rules` - JSON for quantity conversions

### Phase 2: Create New Tables

#### 1. business_rules
```sql
CREATE TABLE business_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(50), -- 'redirect', 'validation', 'conversion'
    source_term VARCHAR(100),
    target_term VARCHAR(100),
    rule_config JSONB,
    priority INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true
);
```

#### 2. detection_patterns
```sql
CREATE TABLE detection_patterns (
    id SERIAL PRIMARY KEY,
    detection_type VARCHAR(50), -- 'jacket', 'category', 'brand', etc.
    pattern VARCHAR(255),
    result_value VARCHAR(100),
    priority INT DEFAULT 100,
    conditions JSONB -- Additional conditions
);
```

#### 3. term_equivalencies
```sql
CREATE TABLE term_equivalencies (
    id SERIAL PRIMARY KEY,
    primary_term VARCHAR(100),
    equivalent_terms TEXT[],
    context VARCHAR(50) -- 'jacket', 'brand', 'color', etc.
);
```

#### 4. validation_rules
```sql
CREATE TABLE validation_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100),
    blocked_terms TEXT[],
    allowed_terms TEXT[],
    error_message TEXT,
    suggestion TEXT
);
```

### Phase 3: Data Migration

#### 1. Comprehensive Category Terms
- Migrate all variations from COMPREHENSIVE_CATEGORY_TERMS
- Include misspellings and alternate formats
- Add priority for search ordering

#### 2. Jacket Equivalencies
- Migrate JACKET_EQUIVALENCIES mappings
- Include DATABASE_JACKET_FORMATS
- Add detection priority (non-plenum before plenum)

#### 3. Brand Mappings
- Migrate brand detection logic
- Include synonyms (e.g., Siecor → Corning)
- Add common misspellings

#### 4. Color Mappings
- Standard colors
- Special cases (stainless steel variations)
- Color normalization rules

#### 5. Business Rules
- Cat5 → Cat5e redirection
- Quantity conversions (1 box = 1000ft)
- Part number normalization
- Mount type normalization

### Phase 4: Update Application Code

#### 1. Create Database Service
```typescript
// New service to query intelligence from database
class SearchIntelligenceService {
  async getSearchTerms(productType: string)
  async detectJacketType(searchTerm: string)
  async applyBusinessRules(searchTerm: string)
  async validateQuery(query: string)
}
```

#### 2. Replace Hardcoded Logic
- Replace detection functions with database queries
- Use database for all term lookups
- Implement caching for performance

#### 3. Maintain Backward Compatibility
- Keep existing function signatures
- Gradually migrate each function
- Add feature flags for rollback

## Implementation Timeline

### Week 1: Database Schema
- Create new tables
- Add missing columns to search_terms
- Create indexes and constraints

### Week 2: Data Migration
- Migrate all hardcoded data
- Verify data integrity
- Create data validation scripts

### Week 3: Code Updates
- Implement database service
- Update detection functions
- Add caching layer

### Week 4: Testing & Rollout
- Comprehensive testing
- Performance optimization
- Gradual rollout with monitoring

## Benefits

1. **Dynamic Updates**: Change search behavior without code deployment
2. **A/B Testing**: Test different search strategies
3. **Analytics**: Track which terms are used most
4. **Maintenance**: Non-developers can update search terms
5. **Scalability**: Add new products/terms easily

## Migration Scripts

See accompanying SQL files:
- `021_enhance_search_terms_table.sql`
- `022_create_business_rules_tables.sql`
- `023_migrate_search_intelligence_data.sql`
- `024_update_search_functions.sql`