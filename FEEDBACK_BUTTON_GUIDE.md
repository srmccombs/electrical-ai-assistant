# Search Feedback Button Implementation Guide

## Overview
The "Give Feedback" button was implemented to allow remote testers to report failed searches or provide feedback about search results. This feedback is sent to a database so you can monitor it remotely without accessing testers' browsers.

## How It Works

### 1. When the Button Appears
The feedback button appears automatically when:
- A search returns 0 results ("No products found")
- The system displays the "no results" message

### 2. User Experience
When a tester clicks "Report Issue":
1. An input field appears asking "What were you looking for?"
2. They type their feedback (e.g., "I was looking for 4-port faceplates in ivory")
3. They click "Send" or press Enter
4. The button shows "✓ Feedback submitted!" confirmation
5. After 2 seconds, it returns to the normal button state

### 3. Where Feedback Is Stored
Feedback is saved in TWO places:
1. **Supabase Database** (primary) - Allows remote monitoring
2. **Browser localStorage** (backup) - In case database fails

### 4. What Data Is Collected
For each feedback submission:
- `search_query`: The original search that failed
- `result_count`: How many results were returned (usually 0)
- `feedback_text`: What the user typed in the feedback field
- `user_agent`: Browser/device information
- `created_at`: Timestamp of submission

## Setting Up the Database Table

You need to create a table in Supabase to store the feedback:

```sql
CREATE TABLE search_feedback (
  id SERIAL PRIMARY KEY,
  search_query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  feedback_text TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX idx_search_feedback_created_at ON search_feedback(created_at DESC);
```

## Viewing Feedback in Supabase

1. Log into your Supabase dashboard
2. Navigate to the Table Editor
3. Select the `search_feedback` table
4. You'll see all feedback entries with:
   - What search failed
   - What the tester was actually looking for
   - When it happened
   - What browser/device they used

## Example Feedback Entries

Here's what you might see in the database:

| search_query | feedback_text | created_at |
|-------------|--------------|------------|
| "fiber ends" | "Looking for LC fiber connectors" | 2025-01-16 14:32:00 |
| "SMB 2 port" | "Surface mount boxes with 2 ports" | 2025-01-16 14:45:00 |
| "face plates" | "White keystone faceplates" | 2025-01-16 15:12:00 |

## Using Feedback to Improve Search

The feedback helps identify:
1. **Terminology gaps** - Terms customers use that aren't in your database
2. **Search logic issues** - Valid searches that return no results
3. **Missing products** - Products customers expect but aren't found
4. **User intent** - Understanding what customers really want

## Monitoring Best Practices

1. **Check daily** during testing phase
2. **Look for patterns** - Multiple users searching for same thing
3. **Update knowledge base** - Add new terms to product keywords
4. **Fix search logic** - Adjust filters that are too restrictive
5. **Add missing products** - If many users search for products you don't have

## Technical Implementation Details

### Frontend Component
- Location: `/components/SearchFeedbackButton.tsx`
- Appears conditionally when no results found
- Sends feedback to API endpoint

### API Endpoint
- Location: `/app/api/feedback/route.ts`
- Receives feedback from frontend
- Saves to Supabase database
- Returns success/failure response

### Integration
- Added to `PlecticAI-Optimized.tsx` in the "No products found" section
- Automatically passes search query and result count

## Troubleshooting

If feedback isn't appearing in database:
1. Check if `search_feedback` table exists in Supabase
2. Verify Supabase connection in production environment
3. Check browser console for API errors
4. Look in browser localStorage as backup (key: "searchFeedback")

## Future Enhancements

Consider adding:
- Email notifications for critical feedback
- Categorization of feedback types
- Analytics dashboard for feedback trends
- Auto-creation of tasks from feedback