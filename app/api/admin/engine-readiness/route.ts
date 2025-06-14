// app/api/admin/engine-readiness/route.ts
// Decision Engine Production Readiness Check

import { NextRequest, NextResponse } from 'next/server'
import { checkProductionReadiness } from '@/services/decisionEngine/integration'

export async function GET(request: NextRequest) {
  try {
    // Check if the Decision Engine is ready for production
    const { ready, report } = await checkProductionReadiness()
    
    return NextResponse.json({
      success: true,
      ready,
      report,
      timestamp: new Date().toISOString(),
      currentMode: process.env.USE_DECISION_ENGINE || 'disabled'
    })
    
  } catch (error) {
    console.error('Error checking engine readiness:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check engine readiness',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}