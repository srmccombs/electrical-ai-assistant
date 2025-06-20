# Production Test Checklist - June 20, 2025

## 🧪 Essential Tests to Run on Your Live Site

### 1. Basic Functionality Tests

#### Search Performance
- [ ] **"4 boxes of Category 5e"** → Should return 152+ products in <100ms
- [ ] **"cat6 cable"** → Should return 431+ products
- [ ] **"I need 10 boxes of cat6"** → Should convert to 10,000 feet

#### AI Detection Tests
- [ ] Open browser console (F12) and check for any errors
- [ ] Search for something - you should see AI analysis in console
- [ ] Check that search times are fast (5-50ms, not 500-4000ms)

### 2. Product Type Tests

Run each of these searches and verify results:

#### Category Cables ✓
- [ ] "cat5e cable" → Category 5e cables
- [ ] "category 6 plenum" → Cat6 plenum cables
- [ ] "cat6a shielded" → Cat6A STP cables

#### Jack Modules ✓
- [ ] "panduit jack" → Panduit jack modules
- [ ] "cat6 keystone" → Category 6 jacks
- [ ] "minicom jack" → Mini-Com jacks

#### Faceplates ✓
- [ ] "2 port faceplate" → 2-port wall plates
- [ ] "4 port white faceplate" → 4-port white plates
- [ ] "blank faceplate" → Blank inserts

#### Surface Mount Boxes ✓
- [ ] "smb" → Surface mount boxes
- [ ] "4 port surface mount box" → 4-port SMBs
- [ ] "surface box panduit" → Panduit SMBs

#### Fiber Cables ✓
- [ ] "om4 fiber cable" → OM4 multimode fiber
- [ ] "single mode fiber" → OS2 fiber cables
- [ ] "12 strand fiber" → 12-fiber cables

#### Fiber Connectors ✓
- [ ] "lc connectors" → LC fiber connectors
- [ ] "sc apc connectors" → SC/APC connectors
- [ ] "fiber ends" → Should find connectors

#### Fiber Enclosures ✓
- [ ] "4ru enclosure" → 4U rack mount enclosures
- [ ] "wall mount enclosure" → Wall mount enclosures
- [ ] "12 panel enclosure" → 12-panel capacity

### 3. Shopping List Tests

1. **Add items to cart**:
   - Add some Cat6 cables
   - Add Panduit jacks
   - Search for faceplates - should prioritize Panduit

2. **Test compatibility matching**:
   - With jacks in cart, faceplates should show compatible ones first
   - Clear list and try again

### 4. API Endpoint Tests

Visit these URLs on your site:
- [ ] `/api/test-supabase` → Should show "Database connection successful"
- [ ] `/api/debug-env` → Should show environment variables (safe version)
- [ ] `/admin/decision-engine` → Should show Decision Engine dashboard

### 5. Performance Metrics

Check in browser console for:
- Search times: Should be 5-50ms for most searches
- AI analysis time: Should be <1 second
- No 500 errors or failed API calls

### 6. Mobile Responsiveness
- [ ] Test on mobile device or browser mobile view
- [ ] Search functionality works
- [ ] Shopping list is accessible
- [ ] Filters are usable

## 🚨 Common Issues to Check

1. **If searches return 0 results**:
   - Check browser console for errors
   - Verify NEXT_PUBLIC_USE_V2_SEARCH=true is set
   - Check Vercel function logs

2. **If AI seems broken**:
   - Search for "cat6 cable" and check console
   - Should see AI analysis with detected specs
   - If not, check OPENAI_API_KEY is valid

3. **If searches are slow (>500ms)**:
   - V2 search might not be enabled
   - Check NEXT_PUBLIC_USE_V2_SEARCH environment variable

## 📊 Success Criteria

✅ All product type searches return relevant results
✅ Search performance is consistently <100ms
✅ AI correctly detects product types and quantities
✅ Shopping list compatibility matching works
✅ No console errors or API failures
✅ Mobile experience is smooth

## 🎯 Current Stats to Verify

- Total products: 1,805
- Category cables: 841 (46.6%)
- Jack modules: 448 (24.8%)
- Faceplates: 294 (16.3%)
- Surface mount boxes: 83 (4.6%)
- Search coverage: 100%
- Average search time: 5-50ms

## 📝 Notes Section

Use this space to note any issues found:

```
Issue 1: 
Description: 
Steps to reproduce: 
Expected vs Actual: 

Issue 2:
Description:
Steps to reproduce:
Expected vs Actual:
```

## 🚀 Next Steps After Testing

1. If all tests pass → Ready to share with more users!
2. If issues found → Note them above and we'll fix
3. Consider enabling Decision Engine shadow mode
4. Start loading more products (goal: 5,000+)