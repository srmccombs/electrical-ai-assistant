// Quick check of current decision count
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { count } = await supabase
    .from('search_decisions_audit')
    .select('*', { count: 'exact', head: true })
  
  return NextResponse.json({ 
    decisionCount: count || 0,
    timestamp: new Date().toISOString()
  })
}