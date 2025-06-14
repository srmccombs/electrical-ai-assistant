# Plectic AI - Electrical Distribution Search Assistant

An AI-powered search assistant for electrical distributors, enabling natural language queries to find electrical components quickly and accurately.

## Overview

Plectic AI transforms how electrical distributors search for products by understanding natural language queries like "I need blue cat6 plenum cable" or "LC connectors for OM4 fiber" and returning relevant results in milliseconds.

### Key Features

- **Natural Language Search**: Ask for products the way you naturally speak
- **AI-Powered Understanding**: Uses OpenAI GPT-4o-mini to understand technical specifications
- **Multi-Product Support**: Searches across cables, connectors, panels, enclosures, jacks, and faceplates
- **Smart Filters**: Automatically generates relevant filters based on search results
- **Shopping List Management**: Build and manage quotes with quantity tracking and compatibility
- **Cross-Reference Search**: Find equivalent products across different manufacturers
- **Compatibility Matching**: Automatically matches compatible products (jacks/faceplates, enclosures/panels)
- **Industry Knowledge**: Built-in understanding of electrical standards and equivalencies
- **Fast Performance**: Average search time ~300ms with AI caching
- **Analytics Dashboard**: Real-time search analytics and performance metrics

## Technology Stack

- **Frontend**: Next.js 14, TypeScript (strict mode), Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Vercel
- **State Management**: React hooks
- **Type System**: Centralized type definitions in `/types`
- **Logging**: Custom logger with performance tracking

## Current Status (June 14, 2025)

### ✅ Implemented
- Core search functionality across 9+ product categories
- Natural language processing with OpenAI
- Shopping list with quantity management and compatibility context
- Smart filter generation
- Business rule implementation (Cat5→Cat5e, jacket ratings, SMB routing)
- AI response caching for cost optimization
- Complete analytics dashboard with charts and metrics
- Cross-reference search across manufacturers
- Panel capacity search with "next size up" logic
- Jack module search with faceplate/SMB compatibility
- Faceplate search with color and port detection
- Surface mount box (SMB) dedicated search
- Box quantity to feet conversion for cables
- Error handling and debug mode
- Stock status indicators
- Fiber type reference guides

### 🚧 In Progress - Decision Engine Migration
- New Decision Engine architecture to prevent cascading search failures
- Shadow mode testing ready for deployment
- Knowledge system tables created
- Admin monitoring dashboard available at `/admin/decision-engine`
- Complete TypeScript type system with centralized definitions
- Environment variable validation
- Enhanced logger with performance tracking

### 🚧 Not Yet Implemented
- User authentication/accounts
- Quote generation and saving
- Email integration
- PDF export
- Admin panel
- Customer-specific pricing
- Real-time inventory sync
- Mobile app

## Product Categories Supported

1. **Category Cables** - Cat5e, Cat6, Cat6a ethernet cables with box quantity conversion
2. **Fiber Cables** - Single mode and multimode fiber optic cables
3. **Fiber Connectors** - LC, SC, ST, FC connectors
4. **Adapter Panels** - Fiber optic adapter panels with enclosure compatibility
5. **Rack Mount Enclosures** - 1U-4U fiber enclosures with panel capacity filtering
6. **Wall Mount Enclosures** - Wall-mounted fiber enclosures with panel capacity filtering
7. **Jack Modules** - RJ45 jacks with faceplate/SMB compatibility matching
8. **Faceplates** - Wall plates with jack compatibility and color/port detection
9. **Surface Mount Boxes** - SMB with jack compatibility

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/electrical-ai-assistant-fresh.git
cd electrical-ai-assistant-fresh
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your keys to `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Decision Engine (optional)
USE_DECISION_ENGINE=shadow  # Options: disabled, shadow, production
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage Examples

### Natural Language Queries
- "I need 500ft of blue cat6 plenum cable"
- "Show me LC connectors for OM4 fiber"
- "Corning products"
- "4RU fiber enclosure"
- "Part number 7131100"
- "cat6 jack panduit minicom"
- "2 port white faceplate"
- "20 2 port smb black"
- "panduit alternative to corning cch-01u"
- "6 panel fiber enclosure"
- "box of 1000ft cat6 plenum"

### Features in Action
1. **Smart Search**: Understands specifications, quantities, and technical requirements
2. **Business Rules**: Automatically redirects Cat5 to Cat5e, detects SMB abbreviations
3. **Filter Generation**: Creates relevant filters based on your search results
4. **Shopping List**: Add items with quantities for quote building
5. **Compatibility**: Automatically matches compatible products (jacks ↔ faceplates)
6. **Cross-Reference**: Find equivalent products across manufacturers
7. **Panel Capacity**: Shows exact match or next size up for fiber enclosures

## Architecture

```
/app              # Next.js app directory
  /api            # API routes
  /analytics      # Analytics dashboard
  /admin          # Admin monitoring pages
/components       # React components
/services         # Business logic services
  /decisionEngine # New Decision Engine implementation
/search           # Product-specific search logic
/config          # Configuration files
/lib             # Utilities and clients
/database         # SQL schemas and migrations
```

## Decision Engine Migration

The Decision Engine is a new architecture that solves cascading search failures when adding new product types.

### Key Features
- **Immutable Decision Pipeline**: Prevents functions from overriding each other
- **Clear Precedence Rules**: Business Rules → Part Numbers → Context → AI → Text → Fallback
- **Shadow Mode Testing**: Run both engines in parallel to verify no regressions
- **Audit Trail**: Every decision is logged for debugging

### Enabling the Decision Engine

1. **Shadow Mode** (recommended first step):
   ```bash
   USE_DECISION_ENGINE=shadow
   ```
   - Runs both old and new engines
   - Logs differences for analysis
   - Returns old results (safe)

2. **Monitor Shadow Mode**:
   - Visit `/admin/decision-engine` to see reports
   - Check API: `/api/admin/shadow-report`
   - Review divergences and confidence scores

3. **Production Mode** (after validation):
   ```bash
   USE_DECISION_ENGINE=production
   ```

### Database Setup
Run the SQL in `/database/decision_engine_tables.sql` to create:
- `search_decisions_audit` - Decision trail
- `shadow_mode_comparisons` - Divergence tracking
- `regression_tests` - Critical query tests
- Performance monitoring tables

## Development

### Running Tests
```bash
npm run test        # Run test suite (when implemented)
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript checks
```

### Debug Mode
Add `?debug=true` to the URL to see search internals including:
- Raw AI analysis
- Search parameters
- Query timing
- Filter generation logic

## Deployment

The application is configured for automatic deployment on Vercel:

1. Push to GitHub
2. Vercel automatically builds and deploys
3. Production URL: [your-app.vercel.app]

## Contributing

This is a private commercial project. For access or questions, contact the development team.

## Performance

- Average search time: ~300ms
- AI response caching: 1-hour TTL
- Database queries: <50ms
- Current catalog: ~500+ products
- Target catalog: 5,000+ products
- Analytics tracking: Real-time
- Cross-reference combinations: 1000+

## Roadmap

### Phase 1 (Completed)
- ✅ Core search functionality
- ✅ AI integration
- ✅ Complete analytics dashboard
- ✅ Cross-reference search
- ✅ Compatibility matching
- ✅ Panel capacity filtering

### Phase 2 (Next)
- User authentication
- Quote generation
- Email integration
- Admin panel

### Phase 3 (Future)
- Mobile app
- Advanced analytics
- ERP integration
- Multi-tenant support

## License

Private commercial software. All rights reserved.

## Support

For technical support or questions, contact the development team.