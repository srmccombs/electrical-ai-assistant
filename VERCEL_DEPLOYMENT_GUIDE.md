# Vercel Deployment Guide - June 20, 2025

## 🚀 Required Environment Variables

Add these in your Vercel project settings under Settings → Environment Variables:

### Production Environment Variables

```bash
# OpenAI API Key (Required for AI search)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://dnmugslmheoxbsubhzci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubXVnc2xtaGVveGJzdWJoemNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjQzNDMsImV4cCI6MjA2MzM0MDM0M30.7ccrbEVka0K8HsRzwUSkpH0j30m1z8aEhDRXrtx_mPo

# Enable V2 Search (Required)
NEXT_PUBLIC_USE_V2_SEARCH=true

# Decision Engine (Optional - for shadow mode testing)
USE_DECISION_ENGINE=shadow
```

## 📋 Pre-Deployment Checklist

### 1. Database Setup ✅
- [ ] Run `FIX_SURFACE_MOUNT_BOXES_TABLE.sql` in Supabase
- [ ] Run `ADD_AUDIT_COLUMNS_TO_TABLES.sql` in Supabase
- [ ] Verify all product tables have `id` column as primary key
- [ ] Verify search_terms table has 362+ active terms

### 2. Code Status ✅
- [x] Next.js updated to 14.2.30 (security fixes)
- [x] AI service endpoint fixed for server-side calls
- [x] TypeScript strict mode compliant
- [x] All build errors resolved

### 3. Environment Variables in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above for "Production" environment
5. Click "Save" for each variable

### 4. Optional Variables
```bash
# For monitoring (optional)
NEXT_PUBLIC_USE_ANALYTICS=true

# For Decision Engine production mode (after shadow testing)
USE_DECISION_ENGINE=production

# Custom domain (if you have one)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 🚨 Important Notes

1. **OPENAI_API_KEY**: Make sure this key has sufficient credits. The app makes ~50-100 API calls per day in production.

2. **Supabase Keys**: These are your project-specific keys. Don't share them publicly.

3. **V2 Search**: Keep `NEXT_PUBLIC_USE_V2_SEARCH=true` for database-driven search (10-100x faster).

4. **Decision Engine**: Start with `shadow` mode for 1-2 weeks to test, then switch to `production`.

## 🔍 Post-Deployment Verification

After deployment, test these queries:
1. "4 boxes of Category 5e" → Should return 152 products
2. "cat6 cable" → Should return 431 products  
3. "panduit jack" → Should return jack modules
4. "2 port faceplate" → Should return faceplates
5. "fiber connector LC" → Should return fiber connectors

## 📊 Monitoring

Check these endpoints after deployment:
- `/api/test-supabase` - Database connection
- `/api/debug-env` - Environment variables (safe version)
- `/admin/decision-engine` - Decision Engine status
- `/analytics` - Search analytics dashboard

## 🐛 Troubleshooting

If searches return 0 results:
1. Check Vercel function logs for errors
2. Verify environment variables are set
3. Check Supabase connection
4. Ensure `is_active=true` on products

If AI search fails:
1. Verify OPENAI_API_KEY is valid
2. Check OpenAI API credit balance
3. Function will fall back to keyword search

## 📈 Performance Targets

- Search response time: < 100ms (achieved: 5-50ms)
- AI analysis time: < 1 second
- Page load time: < 2 seconds
- Database queries: < 50ms