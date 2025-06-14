// app/api/admin/shadow-report/route.ts
// Shadow Mode Report API endpoint

import { NextRequest, NextResponse } from 'next/server'
import { getShadowModeReport } from '@/services/decisionEngine/integration'

export async function GET(request: NextRequest) {
  try {
    // Get hours parameter from query string (default 24)
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24')
    
    // Get the shadow mode report
    const report = await getShadowModeReport(hours)
    
    // Return as JSON with formatted report
    return NextResponse.json({
      success: true,
      report,
      generated: new Date().toISOString(),
      hours
    })
    
  } catch (error) {
    console.error('Error generating shadow mode report:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate shadow mode report',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}