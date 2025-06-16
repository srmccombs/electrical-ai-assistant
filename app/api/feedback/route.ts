// API endpoint to save search feedback
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { searchQuery, resultCount, feedback } = await request.json()
    
    // Save to a feedback table (you'll need to create this table)
    const { error } = await supabase
      .from('search_feedback')
      .insert({
        search_query: searchQuery,
        result_count: resultCount,
        feedback_text: feedback,
        user_agent: request.headers.get('user-agent'),
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error saving feedback:', error)
      // Fallback to console log so feedback isn't lost
      console.log('SEARCH FEEDBACK:', { searchQuery, resultCount, feedback })
      return NextResponse.json({ success: true, message: 'Feedback logged' })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save feedback' }, { status: 500 })
  }
}