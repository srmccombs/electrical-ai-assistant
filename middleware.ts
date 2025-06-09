import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (consider using Upstash Redis for production)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute

// Generate a simple API key for now (in production, use a proper auth system)
const API_KEY = process.env.API_SECRET_KEY || 'temp-api-key-replace-this'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Configure allowed origins (update this for production)
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    const origin = request.headers.get('origin')
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
  }
  
  // Apply rate limiting and authentication to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key')
    
    // For now, allow requests without API key in development
    // In production, enforce this strictly
    if (process.env.NODE_ENV === 'production' && apiKey !== API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401, headers: response.headers }
      )
    }
    
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const userRateLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now }
    
    // Reset window if needed
    if (now - userRateLimit.lastReset > RATE_LIMIT_WINDOW) {
      userRateLimit.count = 0
      userRateLimit.lastReset = now
    }
    
    userRateLimit.count++
    rateLimitMap.set(ip, userRateLimit)
    
    // Clean up old entries periodically
    if (rateLimitMap.size > 1000) {
      const cutoff = now - RATE_LIMIT_WINDOW * 2
      for (const [key, value] of rateLimitMap.entries()) {
        if (value.lastReset < cutoff) {
          rateLimitMap.delete(key)
        }
      }
    }
    
    if (userRateLimit.count > RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: response.headers }
      )
    }
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - userRateLimit.count).toString())
    response.headers.set('X-RateLimit-Reset', (userRateLimit.lastReset + RATE_LIMIT_WINDOW).toString())
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}