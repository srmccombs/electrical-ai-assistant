# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered electrical distribution assistant built with Next.js 14 and TypeScript. The application helps users search for electrical components (cables, fiber connectors, adapter panels, enclosures) using natural language queries powered by OpenAI GPT-4o-mini.

### Current Status (Jan 2025)
- ✅ Core search functionality complete
- ✅ AI integration with GPT-4o-mini
- ✅ Shopping list management
- ✅ Analytics tracking foundation
- ✅ Error handling and debug mode
- ✅ AI response caching
- 🚧 User authentication not implemented
- 🚧 Quote generation not implemented
- 🚧 Email integration not implemented

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
- `categoryCables/` - Searches for ethernet cables (Cat5e, Cat6, etc.)
- `fiberCables/` - Searches for fiber optic cables
- `fiberConnectors/` - Searches for fiber connectors (LC, SC, ST, etc.)
- `fiberadapterPanels/` - Searches for adapter panels
- `fiberenclosure/` - Searches for both rack mount and wall mount fiber enclosures
- `shared/industryKnowledge.ts` - Contains business rules and electrical industry patterns
- `shared/tableDiscoveryService.ts` - Dynamic table discovery for new product types

### Database Integration
Uses Supabase (PostgreSQL) with tables:
- `category_cables` - Ethernet cables (Cat5e, Cat6, Cat6a)
- `fiber_connectors` - LC, SC, ST, FC connectors
- `adapter_panels` - Fiber adapter panels
- `rack_mount_fiber_enclosures` - Rack mount enclosures
- `wall_mount_fiber_enclosures` - Wall mount enclosures
- `fiber_cables` - Single mode and multimode fiber cables
- Dynamic table discovery via `tableDiscoveryService.ts`

Analytics tables:
- `search_analytics` - Tracks all searches and performance
- `search_analytics_summary` - Daily aggregated statistics
- `popular_searches` - Most searched terms

### UI Components
- `PlecticAI.tsx` - Main chat interface component with:
  - Real-time streaming responses
  - Shopping list with quantity management
  - Smart filter generation
  - Debug mode toggle
  - Fiber type reference guide
  - Stock status indicators
- `ErrorBoundary.tsx` - Graceful error handling wrapper
- `app/analytics/page.tsx` - Analytics dashboard page (component pending)

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

## TypeScript Configuration

Strict mode is enabled. Key compiler options:
- `strict: true`
- Target: ES2017
- Module: ESNext
- JSX: preserve

## Development Tips

1. When modifying search logic, test with various query patterns:
   - Part numbers: "7131100", "ABC-123-456"
   - Specifications: "cat6 plenum blue 1000ft"
   - Brand searches: "corning", "panduit"
   - Fiber queries: "LC connectors OM4", "12 strand fiber cable"

2. The AI analysis can be enhanced in `searchService.ts` using the `enhanceAIAnalysis` function for cases where GPT misses specifications

3. Each product type has its own filter generation logic - check the respective search implementation files

4. Shopping list functionality stores items in browser localStorage with quantity tracking

## Recent Updates (January 2025)

### Completed Features
- ✅ Error boundary for graceful error handling
- ✅ Debug mode for development troubleshooting
- ✅ Product types configuration centralized
- ✅ AI response caching (1-hour TTL)
- ✅ Search analytics tracking system
- ✅ Performance metrics collection
- ✅ Popular searches tracking

### Services Added
- `services/aiCache.ts` - Reduces API costs with intelligent caching
- `services/analytics.ts` - Comprehensive analytics tracking
- `config/productTypes.ts` - Centralized product configuration

### Known Limitations
- No user authentication system
- No quote generation or saving
- No email integration
- No admin panel for product management
- Analytics dashboard component not yet implemented
- Limited to ~368 products (goal: 5,000+)