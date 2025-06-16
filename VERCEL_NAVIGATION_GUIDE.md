# Vercel Navigation Guide - Step by Step

## After You Push Your Code

### Step 1: Go to Vercel Dashboard
1. Open your web browser
2. Go to: https://vercel.com/dashboard
3. You should see your project listed (electrical-ai-assistant-8m8h)

### Step 2: Watch Your Deployment
1. After you push, you'll see a new deployment starting
2. Look for a yellow dot 🟡 that turns green ✅ when done
3. Wait for it to turn green (usually 1-2 minutes)

### Step 3: Test the Debug Endpoint
1. Once deployment is green, click on your project name
2. You'll see your live URL at the top (like: electrical-ai-assistant-8m8h.vercel.app)
3. Add `/api/debug-env` to the end
4. Full URL example: `https://electrical-ai-assistant-8m8h.vercel.app/api/debug-env`
5. You should see something like:
   ```json
   {
     "USE_DECISION_ENGINE": "shadow",
     "NODE_ENV": "production",
     "VERCEL": "1",
     "timestamp": "2025-06-16T16:30:00.000Z"
   }
   ```

### Step 4: Run a Test Search
1. Go to your main site: `https://electrical-ai-assistant-8m8h.vercel.app`
2. Type in search box: "cat6 cable"
3. Press Enter or click Search
4. Wait for results to appear

### Step 5: Check Function Logs
1. Go back to Vercel dashboard: https://vercel.com/dashboard
2. Click on your project name
3. Look at the top menu - you'll see tabs like: Project | Analytics | Speed Insights | Logs | **Functions** | Storage
4. Click on **Functions**
5. You'll see a list of functions like:
   - api/ai-search
   - api/chat
   - api/admin/shadow-report
6. Click on **api/chat** (this is where searches happen)
7. You'll see recent invocations (times the function ran)
8. Click on any recent invocation to see logs

### Step 6: What to Look For in Logs
Look for these messages:
- ✅ "Decision Engine Mode: shadow" - This means it's activated
- ✅ "Shadow mode search started" - Decision Engine is running
- ✅ "Attempting to save decision to database" - It's trying to save
- ❌ "Database error saving decision:" - This will show the actual error
- ❌ Any error messages in red

### Step 7: Check Admin Dashboard
1. Go to: `https://electrical-ai-assistant-8m8h.vercel.app/admin/decision-engine`
2. Look at "Total Decisions" - if it's still 0, we need to check logs
3. Click "Download Raw Report" button to see detailed data

## If You Get Lost

### Finding Your Project URL
1. Go to https://vercel.com/dashboard
2. Click on your project
3. The URL is shown at the top with a "Visit" button

### Finding Logs Another Way
1. From your project page
2. Look for "View Function Logs" link
3. Or click the "Logs" tab at the top

### Common Issues

**Can't see Functions tab?**
- Make sure you're on the project page, not the main dashboard
- The tabs are at the top of the project page

**No recent invocations showing?**
- Run another search on your site
- Wait 30 seconds
- Refresh the Functions page

**Logs are empty?**
- Click on different invocations
- Some might be empty, others will have logs

## Quick Reference URLs

Replace `your-domain` with your actual Vercel URL:
- Main site: `https://your-domain.vercel.app`
- Debug endpoint: `https://your-domain.vercel.app/api/debug-env`
- Admin dashboard: `https://your-domain.vercel.app/admin/decision-engine`
- Vercel dashboard: `https://vercel.com/dashboard`

## Need More Help?

If you get stuck at any step, tell me:
1. What step you're on
2. What you see on the screen
3. Any error messages

I'll help you navigate from there!