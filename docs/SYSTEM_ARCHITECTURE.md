# Plectic AI System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLECTIC AI ASSISTANT                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │   Browser   │────▶│  Next.js App │────▶│  Supabase DB    │   │
│  │  (React UI) │◀────│   (Vercel)   │◀────│  (PostgreSQL)   │   │
│  └─────────────┘     └──────────────┘     └──────────────────┘   │
│         ▲                    │                                     │
│         │                    ▼                                     │
│         │            ┌──────────────┐                             │
│         └────────────│  OpenAI API  │                             │
│                      │ (GPT-4o-mini)│                             │
│                      └──────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Strategy

### Current Implementation (Fast Deployment)
- Distributors email weekly inventory CSV/Excel files
- Admin uploads to Supabase via simple import tool
- No direct ERP connection needed
- Deploy in days, not months

### Future Implementation (After SOC2)
- Direct ERP integration
- Real-time inventory updates
- Automated data sync
- Full API access

## 📊 Database Structure

### Product Tables
1. **category_cables** - Ethernet cables (Cat5e, Cat6, etc.)
2. **fiber_connectors** - LC, SC, ST connectors
3. **fiber_optic_cable** - Single-mode/multi-mode fiber
4. **adapter_panels** - Patch panels and adapters
5. **rack_mount_fiber_enclosures** - Rack mount enclosures
6. **wall_mount_fiber_enclosures** - Wall mount enclosures
7. **products** - Unified table (currently unused)

### Support Tables
- **search_variations** - Industry terminology mappings
- **customer_product_lists** - Saved quotes
- **compatible_products** - Product relationships
- **go_with_items** - Suggested add-ons

## 🎯 Key Components

### Frontend (PlecticAI.tsx)
- React component with TypeScript
- Real-time search interface with streaming
- Smart filters with visual indicators
- Shopping list management with localStorage
- Debug mode for development
- Error boundary integration
- Responsive design

### Search Service (searchService.ts)
- Query validation
- Business rule application
- AI integration with caching (aiCache.ts)
- Table routing logic
- Result formatting
- Analytics tracking integration

### AI Analysis (/api/ai-search/route.js)
- OpenAI GPT-4o-mini integration
- Natural language understanding
- Product type detection
- Specification extraction
- Quantity parsing
- Response caching for cost optimization

### Specialized Search Modules
- `/search/categoryCables/` - Cat5e, Cat6 search
- `/search/fiberConnectors/` - Connector search
- `/search/fiberCables/` - Fiber cable search
- `/search/fiberadapterPanels/` - Panel search
- `/search/fiberenclosure/` - Rack & wall mount enclosure search
- `/search/shared/` - Industry knowledge and table discovery

### Support Services
- `/services/aiCache.ts` - AI response caching (1hr TTL, 100 entry limit)
- `/services/analytics.ts` - Search and click tracking
- `/services/simpleSearchService.ts` - Direct database search
- `/services/unifiedSearchService.ts` - Cross-table search logic
- `/services/optimizedBrandSearch.ts` - Brand-specific optimizations

## 🚀 Deployment Architecture

### Current Stack
- **Frontend**: Vercel (automatic deploys from GitHub)
- **Database**: Supabase (managed PostgreSQL)
- **File Storage**: Supabase Storage (for datasheets)
- **AI**: OpenAI API (pay-per-use)
- **Analytics**: Built-in search tracking

### Scaling Plan
1. **Phase 1**: Single Supabase instance (current)
2. **Phase 2**: Database replication for performance
3. **Phase 3**: Multi-region deployment
4. **Phase 4**: Enterprise dedicated instances

## 🔐 Security Model

### Current (Pre-SOC2)
- No direct ERP connections
- Manual data updates via secure upload
- User authentication for access
- HTTPS encryption
- API key management

### Future (Post-SOC2)
- Full SOC2 compliance
- Direct ERP integration
- Advanced audit logging
- Role-based access control
- Data encryption at rest

## 📈 Performance Optimization

### Search Performance
- PostgreSQL full-text search with indexes
- Pre-computed search vectors
- Intelligent caching
- Query optimization

### AI Performance
- GPT-4o-mini for cost efficiency ($0.15/1M input, $0.60/1M output)
- In-memory response caching (1 hour TTL)
- Cache hit tracking for cost monitoring
- Fallback search strategies when AI fails
- Rate limiting protection

### Error Handling
- Global error boundary for React components
- Graceful fallbacks for search failures
- User-friendly error messages
- Development mode with detailed stack traces
- Automatic error recovery with page reload

## 🛠️ Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   # Runs on http://localhost:3000
   ```

2. **Testing**
   - Manual search testing
   - AI response validation
   - Database query performance
   - UI/UX testing

3. **Deployment**
   - Push to GitHub
   - Automatic Vercel deployment
   - Database migrations via Supabase

## 📊 Monitoring & Analytics

### Current Metrics (Implemented)
- Search query tracking with session IDs
- Response time monitoring (search_time_ms)
- Search type classification (direct/ai/part_number/brand)
- Results count tracking
- Click-through tracking
- No-results search identification
- Popular searches aggregation
- AI product type analysis

### Analytics Features
- Real-time search tracking
- Session-based analytics
- Search performance metrics
- User behavior patterns
- Analytics dashboard (beta)

### Planned Metrics
- Conversion rates
- Quote-to-order tracking
- Customer lifetime value
- Product recommendation effectiveness