# Analytics Queries for Plectic AI

This document contains SQL queries to analyze search behavior, performance, and business insights from the Plectic AI search analytics tables.

## Database Tables Overview

- `search_analytics` - Raw search event data
- `search_analytics_summary` - Daily aggregated statistics
- `popular_searches` - Most searched terms with metrics

## Daily Statistics Queries

### Last 30 Days Overview
```sql
-- Get last 30 days of search statistics
SELECT 
  search_date,
  total_searches,
  unique_users as unique_sessions,
  avg_search_time_ms,
  avg_results_count,
  no_results_count,
  ROUND((no_results_count::numeric / total_searches * 100), 1) as no_results_percentage
FROM search_analytics_summary
WHERE search_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY search_date DESC;
```

### Weekly Summary
```sql
-- Get weekly summary
SELECT 
  DATE_TRUNC('week', search_date) as week_start,
  SUM(total_searches) as weekly_searches,
  COUNT(DISTINCT search_date) as days_with_searches,
  ROUND(AVG(avg_search_time_ms)) as avg_search_time_ms,
  SUM(no_results_count) as total_no_results
FROM search_analytics_summary
WHERE search_date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', search_date)
ORDER BY week_start DESC;
```

## Popular Searches Analysis

### Top 20 Most Popular Searches
```sql
-- Top 20 most popular searches
SELECT 
  search_term,
  search_count,
  avg_results,
  last_searched
FROM popular_searches
LIMIT 20;
```

### Popular Searches with Low Results
These searches might indicate products you need to add to inventory:
```sql
-- Popular searches with low results (might need more products)
SELECT 
  search_term,
  search_count,
  avg_results
FROM popular_searches
WHERE avg_results < 5
  AND search_count > 2
ORDER BY search_count DESC
LIMIT 20;
```

## Detailed Performance Analytics

### Search Performance by Type
```sql
-- Search performance by type
SELECT 
  search_type,
  COUNT(*) as search_count,
  ROUND(AVG(search_time_ms)) as avg_time_ms,
  ROUND(AVG(results_count)) as avg_results,
  COUNT(CASE WHEN results_count = 0 THEN 1 END) as no_results_count
FROM search_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY search_type
ORDER BY search_count DESC;
```

### AI Product Type Distribution
```sql
-- AI product type distribution
SELECT 
  ai_product_type,
  COUNT(*) as search_count,
  ROUND(AVG(results_count)) as avg_results
FROM search_analytics
WHERE ai_product_type IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ai_product_type
ORDER BY search_count DESC;
```

## User Engagement Metrics

### Click-Through Rate by Day
```sql
-- Searches with clicks (engagement rate)
SELECT 
  DATE(created_at) as search_date,
  COUNT(*) as total_searches,
  COUNT(clicked_result) as searches_with_clicks,
  ROUND((COUNT(clicked_result)::numeric / COUNT(*) * 100), 1) as click_rate_percentage
FROM search_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY search_date DESC;
```

### Most Clicked Products
```sql
-- Most clicked products
SELECT 
  clicked_result as part_number,
  COUNT(*) as click_count
FROM search_analytics
WHERE clicked_result IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY clicked_result
ORDER BY click_count DESC
LIMIT 20;
```

### Searches Without Clicks
These might need better product matching or descriptions:
```sql
-- Search terms that never get clicks (might need better results)
SELECT 
  search_term,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results
FROM search_analytics
WHERE clicked_result IS NULL
  AND results_count > 0
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY search_term
HAVING COUNT(*) > 1
ORDER BY search_count DESC
LIMIT 20;
```

## Usage Patterns

### Hour of Day Analysis
```sql
-- Hour of day analysis (when do people search?)
SELECT 
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as search_count,
  ROUND(AVG(search_time_ms)) as avg_search_time_ms
FROM search_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;
```

## Business Insights

### Products Being Searched But Not Found
High-value opportunities for inventory expansion:
```sql
-- Products being searched but not in stock
SELECT 
  search_term,
  COUNT(*) as search_count,
  MAX(created_at) as last_searched
FROM search_analytics
WHERE results_count = 0
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY search_term
HAVING COUNT(*) >= 3
ORDER BY search_count DESC;
```

### Brand Search Performance
```sql
-- Brand search performance
SELECT 
  search_term as brand,
  COUNT(*) as search_count,
  ROUND(AVG(results_count)) as avg_products_shown,
  ROUND(AVG(search_time_ms)) as avg_search_time_ms
FROM search_analytics
WHERE search_type = 'brand'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY search_term
ORDER BY search_count DESC;
```

## Quick Performance Checks

### Today's Statistics
```sql
-- Today's search activity
SELECT 
  COUNT(*) as searches_today,
  COUNT(DISTINCT session_id) as unique_sessions,
  ROUND(AVG(search_time_ms)) as avg_search_time_ms,
  COUNT(CASE WHEN results_count = 0 THEN 1 END) as no_results_count,
  COUNT(clicked_result) as clicks_today
FROM search_analytics
WHERE DATE(created_at) = CURRENT_DATE;
```

### Cache Performance
```sql
-- AI cache hit rate (last 7 days)
SELECT 
  COUNT(CASE WHEN ai_cached = true THEN 1 END) as cache_hits,
  COUNT(CASE WHEN ai_cached = false THEN 1 END) as cache_misses,
  ROUND(COUNT(CASE WHEN ai_cached = true THEN 1 END)::numeric / 
        COUNT(*)::numeric * 100, 1) as cache_hit_rate
FROM search_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND ai_response IS NOT NULL;
```

## Monitoring Alerts

### Slow Searches
```sql
-- Searches taking longer than 1 second
SELECT 
  search_term,
  search_time_ms,
  results_count,
  created_at
FROM search_analytics
WHERE search_time_ms > 1000
  AND created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY search_time_ms DESC;
```

### Error Detection
```sql
-- Failed searches or errors
SELECT 
  DATE(created_at) as error_date,
  COUNT(*) as error_count,
  array_agg(DISTINCT search_term) as sample_searches
FROM search_analytics
WHERE search_time_ms > 5000 
   OR (results_count = 0 AND search_type != 'brand')
GROUP BY DATE(created_at)
HAVING COUNT(*) > 5
ORDER BY error_date DESC;
```

## Usage Instructions

1. **Connect to Supabase**: Use the SQL editor in your Supabase dashboard
2. **Run Queries**: Copy and paste any query above
3. **Export Results**: Click "Download CSV" for spreadsheet analysis
4. **Schedule Reports**: Consider setting up weekly email reports with key metrics

## Key Metrics to Track

- **Search Volume**: Daily/weekly search counts
- **No Results Rate**: Should be <10%
- **Click-Through Rate**: Target >50%
- **Search Performance**: Average <500ms
- **Cache Hit Rate**: Target >60%

## Business Actions from Analytics

1. **Add Missing Products**: Use "Products Being Searched But Not Found" query
2. **Optimize Slow Searches**: Monitor searches >1 second
3. **Improve Low-Click Results**: Review searches without clicks
4. **Stock Popular Items**: Focus on most-clicked products
5. **Peak Hour Staffing**: Use hour-of-day analysis

---

Last Updated: January 2025