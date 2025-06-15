# Decision Engine Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration ✅
Run the following SQL files in your Supabase SQL Editor IN ORDER:

1. First, run the Decision Engine tables:
```sql
-- File: /database/decision_engine_tables.sql
-- Copy and paste the entire contents into Supabase SQL Editor
```

2. Then, run the Knowledge System tables:
```sql
-- File: /database/knowledge_system_tables.sql
-- Copy and paste the entire contents into Supabase SQL Editor
```

### 2. Environment Variables ✅
Add to your `.env.local`:

```bash
# Enable shadow mode for Decision Engine
USE_DECISION_ENGINE=shadow
```

### 3. Verify Local Testing ✅
Test locally before deploying:

```bash
npm run dev
```

Test these critical queries:
- "cat6 plenum cable"
- "surface mount box" or "smb"
- "2 port faceplate"
- "panduit jack cat6"
- "CJ688TGBU"

Visit: http://localhost:3000/admin/decision-engine

## Deployment Steps

### For Vercel Deployment

1. **Add Environment Variable in Vercel Dashboard**:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `USE_DECISION_ENGINE` with value `shadow`
   - Apply to: Production, Preview, Development

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: Add Decision Engine in shadow mode for testing"
   git push origin main
   ```

3. **Vercel will automatically deploy**

### For Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Set environment variable**:
   ```bash
   export USE_DECISION_ENGINE=shadow
   ```

3. **Start production server**:
   ```bash
   npm run start
   ```

## Post-Deployment Verification

### 1. Check Deployment Status
- Visit your production URL
- Ensure the site loads correctly
- No visible changes should occur (shadow mode)

### 2. Verify Shadow Mode is Active
Visit: `https://your-domain.com/admin/decision-engine`

Should show:
- Mode: SHADOW
- Production Ready: NO (initially)

### 3. Test Critical Searches
Run these searches and verify they work:
1. "cat6 plenum cable blue 1000ft"
2. "surface mount box 4 port"
3. "smb black"
4. "2 port faceplate white"
5. "panduit jack minicom"
6. "fiber connector lc om4"

### 4. Monitor Shadow Mode Reports
Check divergences after 1 hour:
- API: `https://your-domain.com/api/admin/shadow-report`
- Dashboard: `https://your-domain.com/admin/decision-engine`

## Monitoring Schedule

### Day 1-3: Initial Monitoring
- Check shadow reports every 4 hours
- Look for high divergence rates
- Monitor performance metrics
- Check error logs

### Day 4-7: Stability Check
- Daily shadow report review
- Verify critical queries still work
- Check confidence scores trending up
- Monitor user complaints (should be none)

### Week 2: Readiness Assessment
- Review accumulated data
- Check readiness API
- Prepare for production switch

## Rollback Plan

If issues arise:

### Immediate Rollback (Vercel)
1. Go to Vercel Environment Variables
2. Change `USE_DECISION_ENGINE` to `disabled`
3. Redeploy

### Immediate Rollback (Manual)
```bash
export USE_DECISION_ENGINE=disabled
npm run build
npm run start
```

## Success Criteria Before Production

- [ ] 1000+ decisions analyzed
- [ ] <5% divergence on critical queries
- [ ] Average confidence >0.7
- [ ] No performance degradation
- [ ] Zero user complaints
- [ ] All regression tests passing

## Troubleshooting

### Shadow Mode Not Working
1. Check environment variable is set
2. Verify database tables exist
3. Check browser console for errors
4. Review server logs

### High Divergence Rate
1. Review specific queries causing divergence
2. Check if TextDetectionStage priorities need adjustment
3. Verify AI prompts are working correctly

### Performance Issues
1. Check AI cache hit rate
2. Verify database indexes are created
3. Monitor Decision Engine overhead (<50ms)

## Contact for Issues

If you encounter problems:
1. Check error logs in Vercel/server
2. Review shadow_mode_comparisons table
3. Check search_decisions_audit for specific queries

## Next Steps After Successful Shadow Mode

1. Review 2 weeks of shadow data
2. Check production readiness
3. Update environment variable to `production`
4. Monitor closely for 24 hours
5. Celebrate improved search stability! 🎉