# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered electrical distribution assistant built with Next.js 14 and TypeScript. The application helps users search for electrical components (cables, fiber connectors, adapter panels, enclosures) using natural language queries powered by OpenAI GPT-4o-mini.

### Current Status (June 16, 2025) - DECISION ENGINE DEPLOYED! 🎉
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