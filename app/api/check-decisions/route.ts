// Direct check of decision engine database
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check search_decisions_audit table
    const { data: decisions, error: decisionsError } = await supabase
      .from('search_decisions_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Check shadow_mode_comparisons table
    const { data: comparisons, error: comparisonsError } = await supabase
      .from('shadow_mode_comparisons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Count total decisions
    const { count: decisionCount } = await supabase
      .from('search_decisions_audit')
      .select('*', { count: 'exact', head: true })
    
    // Count total comparisons
    const { count: comparisonCount } = await supabase
      .from('shadow_mode_comparisons')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      decisionCount: decisionCount || 0,
      comparisonCount: comparisonCount || 0,
      recentDecisions: decisions || [],
      recentComparisons: comparisons || [],
      errors: {
        decisions: decisionsError?.message,
        comparisons: comparisonsError?.message
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}