/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  
  // Enhance security with proper headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: ws: wss:;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self' https://dnmugslmheoxbsubhzci.supabase.co wss://dnmugslmheoxbsubhzci.supabase.co https://api.openai.com; frame-ancestors 'none';"
          }
        ]
      }
    ]
  },
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  
  // Disable x-powered-by header
  poweredByHeader: false
}

module.exports = nextConfig
