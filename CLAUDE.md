# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📅 IMPORTANT: Dating Guidelines for Claude

When creating new files or documentation:
1. **ALWAYS include the date in filenames** for plans and documentation:
   - Format: `claudeplan[monthday].md` (e.g., `claudeplanjune19.md`)
   - For SQL migrations: `XXX_description_YYYYMMDD.sql` if creating multiples per day
   
2. **ALWAYS add creation date** at the top of new documentation files:
   - Format: `# Document Title - Month Day, Year`
   - Example: `# Claude's Plan - June 19, 2025`

3. **ALWAYS update status dates** in CLAUDE.md when making significant changes:
   - Format: `### Current Status (Month Day, Year)`
   
4. **If unsure about the date**, ASK THE USER:
   - "What is today's date so I can properly date this file?"
   - Don't assume or guess dates

5. **For code comments**, include date for significant changes:
   - Format: `// Fixed table names - June 19, 2025`

## Project Overview

This is an AI-powered electrical distribution assistant built with Next.js 14 and TypeScript. The application helps users search for electrical components (cables, fiber connectors, adapter panels, enclosures) using natural language queries powered by OpenAI GPT-4o-mini.

### Current Status (June 19, 2025) - V2 SEARCH IMPLEMENTATION STARTED! 🚀
- ✅ Core search functionality complete
- ✅ AI integration with GPT-4o-mini
- ✅ Shopping list management with compatibility filtering
- ✅ Analytics tracking foundation with dashboard
- ✅ Error handling and debug mode
- ✅ AI response caching
- ✅ Cross-reference search functionality
- ✅ Panel capacity search with "next size up" logic
- ✅ Fiber enclosure & adapter panel compatibility
- ✅ Surface mount box search implementation
- ✅ Performance optimization with component extraction
- ✅ Enhanced fiber cable filtering (count, jacket, type, application)
- ✅ Smart filter auto-centering
- ✅ Improved UI with 25% larger display
- ✅ Auto-apply filters for brand compatibility (SMBs, connectors)
- ✅ Fixed faceplate/SMB product separation
- ✅ Database query optimization for shielding filters
- ✅ **DECISION ENGINE DEPLOYED IN SHADOW MODE (June 14, 2025)**
- ✅ **Knowledge System IMPLEMENTED AND ACTIVE**
- ✅ **Search Feedback Button for failed searches (June 16, 2025)**
- ✅ **Ports and Gang filters for Faceplates/SMB (June 16, 2025)**
- ✅ **Product Line filter enabled for Faceplates/SMB (June 16, 2025)**
- ✅ **Stock Status Legend restored (June 16, 2025)**
- ✅ **Toast notifications for copy actions (June 17, 2025)**
- ✅ **Copy List functionality with full product details (June 17, 2025)**
- ✅ **Email List with brand included in format (June 17, 2025)**
- ✅ **OS1/OS2 labeled as "Single-mode" in filters (June 17, 2025)**
- ✅ **Database Standardization Complete (June 19, 2025)**
- ✅ **All product tables have search columns and triggers (June 19, 2025)**
- ✅ **Column names standardized across all tables (June 19, 2025)**
- ✅ **V2 Search Implementation Started (June 19, 2025)**
- ✅ **Category ratings standardized (154 Cat5e, 431 Cat6, 252 Cat6A)**
- ✅ **NEXT_PUBLIC_USE_V2_SEARCH environment variable implemented**
- 🚧 User authentication not implemented
- 🚧 Quote generation not implemented

## 🎉 MAJOR UPDATE: Decision Engine is Live!

The Decision Engine is now deployed and running in shadow mode:
- **Zero User Impact**: Returns existing search results while testing new engine
- **Full Audit Trail**: Every decision is logged to database
- **Admin Dashboard**: Monitor at `/admin/decision-engine`
- **Knowledge System**: User contributions table active with 4 test entries

### Next Steps (IMPORTANT):
1. **Add Vercel Environment Variable**: `USE_DECISION_ENGINE=shadow`
2. **Monitor Shadow Mode**: Check divergences daily for 1-2 weeks
3. **Create Database Function**: `increment_knowledge_usage` (currently disabled)
4. **Switch to Production**: After successful shadow testing

## Common Development Commands

```bash
# Development
npm run dev         # Start development server on http://localhost:3000

# Build & Production
npm run build       # Build for production
npm run start       # Start production server

# Code Quality
npm run lint        # Run ESLint
```

## Key Architecture Components

### API Routes
- `/app/api/ai-search/route.js` - Analyzes natural language queries using OpenAI to determine product types and search parameters
- `/app/api/chat/route.ts` - Handles real-time chat interactions with streaming responses

### Search Service Architecture
The search system (`/services/searchService.ts`) orchestrates:
1. Query validation and business rule application (Cat5 → Cat5e redirection)
2. Part number detection for direct lookups
3. AI analysis to determine product type and specifications
4. Table-specific search implementations based on product type
5. Smart filter generation from results

### Specialized Search Implementations
Located in `/search/` directory:
- `categoryCables/` - Searches for ethernet cables (Cat5e, Cat6, etc.) with box quantity conversion
- `fiberCables/` - Searches for fiber optic cables
- `fiberConnectors/` - Searches for fiber connectors (LC, SC, ST, etc.) - includes "fiber ends" synonym
- `fiberadapterPanels/` - Searches for adapter panels with fiber enclosure compatibility
- `fiberenclosure/` - Searches for both rack mount and wall mount fiber enclosures with panel capacity filtering
- `jackModules/` - Searches for RJ45 jacks with faceplate/SMB compatibility
- `faceplates/` - Searches for wall plates with jack compatibility - includes Ports and Gang filters
- `surfaceMountBoxes/` - Searches for surface mount boxes (SMB) with jack compatibility - includes Ports and Gang filters
- `shared/industryKnowledge.ts` - Contains business rules and electrical industry patterns
- `shared/tableDiscoveryService.ts` - Dynamic table discovery for new product types

### Database Integration
Uses Supabase (PostgreSQL) with tables:
- `category_cables` - Ethernet cables (Cat5e, Cat6, Cat6a)
- `fiber_connectors` - LC, SC, ST, FC connectors
- `adapter_panels` - Fiber adapter panels with panel_type field
- `rack_mount_fiber_enclosures` - Rack mount enclosures with panel capacity filtering
- `wall_mount_fiber_enclosures` - Wall mount enclosures with panel capacity filtering
- `fiber_cables` - Single mode and multimode fiber cables
- `jack_modules` - RJ45 jacks with brand/product line compatibility
- `faceplates` - Wall plates with compatible_jacks field
- `surface_mount_box` - Surface mount boxes (SMB) with jack compatibility ✅ Created June 2025
- Dynamic table discovery via `tableDiscoveryService.ts`

Analytics tables:
- `search_analytics` - Tracks all searches and performance
- `search_analytics_summary` - Daily aggregated statistics
- `popular_searches` - Most searched terms

### UI Components
- `PlecticAI.tsx` - Main chat interface component with:
  - Real-time streaming responses
  - Shopping list with quantity management and compatibility context
  - Smart filter generation
  - Debug mode toggle
  - Fiber type reference guide
  - Stock status indicators
  - Cross-reference results display
  - Product compatibility matching (jacks/faceplates, enclosures/panels)
  - Toast notifications for copy confirmations
  - Copy List button to copy entire shopping list
  - Email List button with brand included in format
- `Toast.tsx` - Toast notification component with dynamic positioning
- `ErrorBoundary.tsx` - Graceful error handling wrapper
- `AnalyticsDashboard.tsx` - Complete analytics dashboard with charts and metrics
- `app/analytics/page.tsx` - Analytics dashboard page

## Environment Variables Required

```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Important Business Rules

1. **Cat5 → Cat5e Redirection**: All Cat5 searches automatically redirect to Cat5e (current standard)
2. **Jacket Rating Mappings**: 
   - PVC = Riser = CMR = Non-Plenum (all equivalent)
   - CMP = Plenum
3. **Brand-Only Searches**: Single brand name queries search across all product tables
4. **Part Number Priority**: Direct part number matches take precedence over AI analysis
5. **SMB Detection**: "SMB" and variations route to surface_mount_box table
6. **Compatibility Matching**:
   - Jack modules ↔ Faceplates/Surface Mount Boxes (brand + product line)
   - Fiber Enclosures ↔ Adapter Panels (panel_type field)
7. **Panel Capacity Search**: Shows exact match or next size up (e.g., request 6 panels → show 8, not 12)
8. **Box Quantity Conversion**: Detects "box of X" and converts to feet for cables
9. **Fiber Terminology**: "fiber ends" is synonym for "fiber connectors"
10. **Fiber Pair Conversion**: Automatically converts fiber pairs to fiber count (3 pair = 6 fiber)
11. **Popular Searches Update**: "Face Plates" changed to "Datacom Face Plates"

## TypeScript Configuration

Strict mode is enabled. Key compiler options:
- `strict: true`
- Target: ES2017
- Module: ESNext
- JSX: preserve

## Testing the Decision Engine

1. **Shadow Mode Testing** (current state):
   - Visit any search query - it will use BOTH engines
   - Old engine results are shown to users
   - New engine results are logged for comparison
   - Check `/admin/decision-engine` for divergence reports

2. **Knowledge System Testing**:
   - Try "s.m.b" → should suggest "surface mount box"
   - Try "cat 5" → should redirect to "cat5e"
   - These use the knowledge_contributions table

3. **Critical Queries to Test**:
   - "smb" → Must go to surface_mount_box (not faceplates)
   - "2 port faceplate" → Must go to faceplates (not SMB)
   - "cat6 jack panduit" → Must go to jack_modules
   - "fiber connector lc" → Must go to fiber_connectors

## Development Tips

1. When modifying search logic, test with various query patterns:
   - Part numbers: "7131100", "ABC-123-456"
   - Specifications: "cat6 plenum blue 1000ft"
   - Brand searches: "corning", "panduit"
   - Fiber queries: "LC connectors OM4", "12 strand fiber cable"
   - Jack searches: "cat6 jack panduit", "minicom jack modules"
   - Faceplate searches: "2 port white faceplate"
   - SMB searches: "20 2 port smb black"
   - Cross-reference: "panduit alternative to corning cch-01u"
   - Panel capacity: "6 panel fiber enclosure", "4 panel wall mount"

2. The AI analysis can be enhanced in `searchService.ts` using the `enhanceAIAnalysis` function for cases where GPT misses specifications

3. Each product type has its own filter generation logic - check the respective search implementation files

4. Shopping list functionality stores items in browser localStorage with quantity tracking

## Recent Updates (June 2025)

### Completed Features
- ✅ Error boundary for graceful error handling
- ✅ Debug mode for development troubleshooting
- ✅ Product types configuration centralized
- ✅ AI response caching (1-hour TTL)
- ✅ Search analytics tracking system with dashboard
- ✅ Performance metrics collection
- ✅ Popular searches tracking
- ✅ Cross-reference search with multi-manufacturer support
- ✅ Panel capacity filtering for fiber enclosures
- ✅ Jack module search with compatibility matching
- ✅ Faceplate search with color and port detection
- ✅ Surface mount box (SMB) dedicated search with database table
- ✅ Fiber enclosure & adapter panel compatibility
- ✅ Box quantity to feet conversion for cables
- ✅ TypeScript strict mode compliance

### June 16, 2025 Updates
- ✅ Fixed TypeScript errors in faceplateSearch.ts
- ✅ Added "fiber ends" as synonym for "fiber connectors"
- ✅ Implemented fiber pair-to-fiber count conversion (3 pair = 6 fiber)
- ✅ Added SearchFeedbackButton component for failed searches
- ✅ Created /api/feedback endpoint to save feedback to database
- ✅ Created FEEDBACK_BUTTON_GUIDE.md documentation
- ✅ Changed "Face Plates" to "Datacom Face Plates" in popular searches
- ✅ Re-added Stock Status Legend to product display
- ✅ Added Ports and Gang filters for Faceplates and Surface Mount Boxes
- ✅ Removed emoji icons from Ports and Gang filters
- ✅ Enabled Product Line filter for Faceplates and SMB
- ✅ Removed Product Types filter to save space

### June 17, 2025 Updates
- ✅ Added Toast notification component with dynamic positioning
- ✅ Implemented copy confirmation notifications for part numbers
- ✅ Added "Copy List" button to copy entire shopping list
- ✅ Enhanced Email List functionality to include Brand field
- ✅ Updated list format: "Qty - Part Number - Brand - Description"
- ✅ Added "Copy" label above copy icons in shopping list header
- ✅ Updated fiber type filters: OS1/OS2 now show as "Single-mode"
- ✅ Removed duplicate orange Clear List button from main header
- ✅ All changes TypeScript strict mode compliant

## TypeScript Best Practices

When working with TypeScript in this project:

1. **Error Handling**: Always type check errors in catch blocks
   ```typescript
   // Good
   catch (error) {
     const message = error instanceof Error ? error.message : String(error)
   }
   
   // Bad
   catch (error) {
     console.log(error.message) // TypeScript error: 'error' is of type 'unknown'
   }
   ```

2. **Decision Engine**: When extending SearchDecision functionality:
   - Use public methods like `with()` for immutable updates
   - Don't access private methods from outside the class
   - Ensure all interface properties are defined in types.ts

3. **ESLint Configuration**: Use `.eslintrc.json` with `"extends": "next/core-web-vitals"`
- ✅ Component extraction for performance (FilterSection, ProductTable, SearchInput, ShoppingList)
- ✅ React memoization throughout (React.memo, useMemo, useCallback)
- ✅ Enhanced fiber cable filters (jacket rating, product type, application, fiber count)
- ✅ Application filter parsing for bracketed lists
- ✅ Smart filter auto-centering on search results
- ✅ UI improvements (25% larger display, Clear Search button, conditional Clear List)
- ✅ Fiber Type Reference only shows with 2+ fiber types
- ✅ Auto-apply brand filters for SMBs when jack modules in cart
- ✅ Fixed faceplate searches excluding SMB products
- ✅ Fixed SMB database query errors (removed array field from ilike)
- ✅ Fixed Cat6 STP cable searches with proper shielding filters
- ✅ Search Feedback Button - Allows users to report failed searches
- ✅ Ports/Gang filters - Enhanced filtering for faceplates and SMBs
- ✅ Product Line filter - Enabled for better product matching

### Services Added
- `services/aiCache.ts` - Reduces API costs with intelligent caching
- `services/analytics.ts` - Comprehensive analytics tracking
- `services/crossReferenceService.ts` - Multi-manufacturer cross-reference search
- `services/datasheetService.ts` - Product datasheet URL generation
- `config/productTypes.ts` - Centralized product configuration
- `config/constants.ts` - Application-wide constants

### Known Limitations
- No user authentication system
- No quote generation or saving
- No email integration
- No admin panel for product management
- Limited product database (goal: 5,000+ products)
- Some fiber enclosures have NULL panel capacity values
- Analytics tracking returns 406 errors (needs backend fix)

## 🗄️ Database Structure (Updated June 20, 2025)

### Standardized Table Names:
- `prod_category_cables` - Ethernet cables
- `prod_fiber_cables` - Fiber optic cables
- `prod_fiber_connectors` - Fiber connectors
- `prod_adapter_panels` - Fiber adapter panels
- `prod_jack_modules` - RJ45 jacks
- `prod_modular_plugs` - RJ45 plugs
- `prod_faceplates` - Wall plates
- `prod_surface_mount_boxes` - Surface mount boxes
- `prod_wall_mount_fiber_enclosures` - Wall mount fiber enclosures
- `prod_rack_mount_fiber_enclosures` - Rack mount fiber enclosures

### Standardized Column Names:
- `category_rating` - For Cat5e, Cat6, etc. (not cable_type)
- `shielding_type` - All lowercase (was Shielding_Type)
- `jacket_material` - Not jacket_rating
- `jacket_color` - Not just color
- `number_of_ports` - Not ports
- `panel_capacity` - Was accepts_number_of_connector_housing_panels
- `fiber_types` - Array type in all fiber tables

### Search Infrastructure:
- All tables have `computed_search_terms` and `search_vector`
- Automatic triggers update search terms on changes
- GIN indexes for full-text search performance

## 🗄️ Archived Files (Updated June 20, 2025)
Old SQL fixes and documentation have been moved to:
- `/archive/sql-fixes/` - One-time SQL fix scripts (34 files)
- `/archive/old-docs/` - Historical documentation (48 files) - Updated today!
- `/archive/sql-fixes/old-migrations/` - Superseded migration files (25 files) - Updated today!

## 🎯 CRITICAL: Making Search Work at Scale (1000+ users/day)

### MANDATORY Table Requirements for Search Performance

1. **EVERY table MUST have these columns EXACTLY**:
   ```sql
   part_number VARCHAR(255) NOT NULL UNIQUE
   brand VARCHAR(100) NOT NULL
   short_description TEXT NOT NULL
   category VARCHAR(100) NOT NULL
   is_active BOOLEAN DEFAULT true
   common_terms TEXT -- CRITICAL: Populate with ALL search variations
   ```

2. **common_terms column is CRITICAL - MUST include**:
   - Primary product name + ALL variations
   - Common misspellings
   - Industry slang/abbreviations
   - Both singular AND plural forms
   - Hyphenated AND non-hyphenated versions
   - Brand-specific terminology
   
   Example: `"patch panel patch-panel patchpanel patch panels fiber panel lc panel panduit pan corning ccg"`

3. **Brand names MUST be EXACT and CONSISTENT**:
   - "PANDUIT" not "Panduit" or "panduit"
   - NO trailing spaces (use TRIM())
   - Use brand_normalized column for matching

4. **Category values MUST be Title Case and Consistent**:
   - "Patch Panel" not "patch_panel" or "PATCH PANEL"
   - Same category name across related products

5. **For compatibility features, use PostgreSQL arrays**:
   - `compatible_jacks TEXT[]` format: '{"Keystone", "Mini-Com"}'
   - This enables smart shopping list features

### What Kills Search Performance

1. **Missing or empty common_terms** - Users can't find products
2. **Inconsistent brand names** - Filtering fails
3. **NULL or empty category** - Products don't appear in filters
4. **is_active = false or NULL** - Products invisible
5. **Trailing spaces in ANY field** - Matching fails

### Before Creating ANY New Table

1. Use `PRODUCT_TABLE_TEMPLATE.sql` as your starting point
2. ALWAYS populate common_terms with 10+ search variations
3. ALWAYS trim and validate brand names
4. ALWAYS set proper category value
5. Test with these queries BEFORE going live:
   ```sql
   -- Must return 0 for all
   SELECT COUNT(*) FROM [table] WHERE TRIM(brand) != brand;
   SELECT COUNT(*) FROM [table] WHERE category IS NULL OR category = '';
   SELECT COUNT(*) FROM [table] WHERE common_terms IS NULL OR common_terms = '';
   ```

## Decision Engine Migration (IN PROGRESS)

### Overview
We're migrating to a new Decision Engine architecture to solve cascading search failures when adding new product types. The engine uses an immutable decision pipeline with clear precedence rules.

### Key Problems Being Solved
1. **SMB vs Faceplate conflicts**: SMB detection now has highest priority
2. **AI vs Text Detection conflicts**: Clear precedence order prevents overrides
3. **Shopping list context**: Provides hints without forcing overrides
4. **Regression prevention**: Every successful search becomes a test case

### Migration Status
- ✅ Decision Engine core implemented
- ✅ All decision stages created (Business Rules, Part Number, Context, AI, Text Detection, Knowledge, Fallback)
- ✅ Shadow mode adapter ready
- ✅ Test suite complete
- ✅ Migration guide documented
- 🚧 Shadow mode deployment pending
- 🚧 Production rollout pending

### To Enable Shadow Mode
1. Set environment variable: `USE_DECISION_ENGINE=shadow`
2. Deploy and monitor for 1-2 weeks
3. Check `/api/admin/shadow-report` for divergences
4. When ready, switch to `USE_DECISION_ENGINE=production`

### Critical Queries to Test
- "cat6 plenum cable" → category_cables
- "surface mount box" or "smb" → surface_mount_box
- "2 port faceplate" → faceplates
- "panduit jack cat6" → jack_modules
- "CJ688TGBU" → multi_table (part number)

See `DECISION_ENGINE_ARCHITECTURE.md` and `MIGRATION_GUIDE.md` for full details.

## Knowledge System Design (PLANNED)

### Overview
Allow users to contribute electrical industry knowledge, creating a self-improving search that beats Google.

### Key Features
1. **Add Knowledge Buttons**: Context-sensitive throughout the app
2. **Validation Framework**: Auto-approve trusted users, expert review for others
3. **Gamification**: Company leaderboards, individual badges, impact metrics
4. **Learning Algorithms**: Hourly synonym updates, daily pattern detection

### Database Tables Created
- `knowledge_contributions` - User submissions
- `user_reputation` - Individual scores
- `company_knowledge_stats` - Company rankings
- `learning_patterns` - Detected patterns
- `ab_test_results` - Test outcomes

See `KNOWLEDGE_SYSTEM_DESIGN.md` for full implementation plan.