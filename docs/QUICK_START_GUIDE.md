# Plectic AI Quick Start Guide

## 🚀 For Developers

### Running Locally
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key and Supabase credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

### Key Files to Know
- `/components/PlecticAI.tsx` - Main UI component
- `/services/searchService.ts` - Search orchestration
- `/app/api/ai-search/route.js` - AI integration
- `/services/analytics.ts` - Tracking implementation
- `/services/aiCache.ts` - Cost-saving cache

### Debug Mode
- Click the 🐛 Debug button (bottom right in dev)
- Shows AI analysis, search internals, and performance

## 🔍 For Testing

### Test Searches
1. **Part Numbers**: "7131100", "ABC-123-456"
2. **Natural Language**: "I need 500ft of cat6 plenum cable"
3. **Fiber**: "24 strand OM4 fiber cable"
4. **Connectors**: "LC connectors for single mode"
5. **Brands**: "panduit", "corning"

### Features to Test
- ✅ Search accuracy
- ✅ Shopping list (add/remove/quantities)
- ✅ Filters (brand, color, rating)
- ✅ AI understanding
- ✅ Part number detection
- ✅ Error handling (try breaking things!)

## 📊 For Product Managers

### What's Working
- Core search across all product types
- AI understands electrical terminology
- Fast response times (<50ms)
- Shopping list management
- Analytics tracking
- Error boundaries

### What's Missing
- User authentication
- Quote generation
- Email integration
- Import tools
- Customer pricing

### Analytics Available
- Search volume and terms
- Response times
- Search types (AI vs direct)
- No-results queries
- Popular searches
- Click-through rates

## 🛠️ For DevOps

### Infrastructure
- **Frontend**: Vercel (auto-deploy from main branch)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI API
- **Analytics**: Built into Supabase

### Monitoring
- Check Vercel dashboard for deployments
- Supabase dashboard for database metrics
- Browser console for debug logs
- Analytics dashboard at `/analytics` (needs component)

### Environment Variables
```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 💼 For Sales

### Demo Talking Points
1. **Natural Language**: "Just type what you need"
2. **Speed**: "Results in milliseconds"
3. **Accuracy**: "Understands your terminology"
4. **No Integration**: "Works with email updates"
5. **ROI**: "75% faster quotes"

### Value Props
- No training required
- Works day one
- No IT involvement
- Cancel anytime
- Proven ROI

## 🐛 Troubleshooting

### Common Issues
1. **"No results found"**
   - Check if products exist in database
   - Try simpler search terms
   - Check debug mode for AI analysis

2. **Slow searches**
   - First search after deploy is slower (cold start)
   - Check network tab for API response times

3. **AI not understanding**
   - Check `/app/api/ai-search/route.js` for prompt
   - May need prompt adjustment for edge cases

4. **Filters not showing**
   - Filters only appear when results have variety
   - Check if all results are identical

## 📞 Support Contacts

- **Technical Issues**: Check error logs in console
- **Database Issues**: Supabase dashboard
- **AI Issues**: OpenAI usage dashboard
- **Deployment Issues**: Vercel dashboard

## 🎯 Next Steps

1. **For Launch**:
   - Add authentication
   - Build quote generation
   - Set up email service
   - Create import tools

2. **For Growth**:
   - Expand product database
   - Add more AI training
   - Build mobile app
   - Create API endpoints