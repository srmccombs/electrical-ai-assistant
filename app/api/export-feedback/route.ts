// Export feedback data endpoint
import { NextResponse } from 'next/server'

export async function GET() {
  // This endpoint allows you to retrieve feedback data
  // In production, you'd store this in a database instead of localStorage
  
  return NextResponse.json({
    message: 'To export feedback, run this in the browser console:',
    instructions: [
      '1. Open browser console (F12)',
      '2. Run: JSON.parse(localStorage.getItem("searchFeedback") || "[]")',
      '3. Copy the output',
      'OR',
      '1. Run: copy(JSON.stringify(JSON.parse(localStorage.getItem("searchFeedback") || "[]"), null, 2))',
      '2. Paste into a text file'
    ],
    note: 'Feedback is stored in browser localStorage for testing purposes'
  })
}