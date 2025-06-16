// Test endpoint to verify Decision Engine is working
import { NextResponse } from 'next/server'
import { searchProducts } from '@/services/searchService'

export async function GET() {
  try {
    console.log('Test Decision Engine endpoint called')
    
    // Run a test search
    const result = await searchProducts({
      query: 'cat6 cable test',
      shoppingListContext: {}
    })
    
    // Check if Decision Engine is in the logs
    return NextResponse.json({
      success: true,
      message: 'Test search completed',
      resultCount: result.products?.length || 0,
      targetTable: result.targetTable,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}