// Debug endpoint to check environment variables
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    USE_DECISION_ENGINE: process.env.USE_DECISION_ENGINE || 'not set',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    timestamp: new Date().toISOString()
  })
}