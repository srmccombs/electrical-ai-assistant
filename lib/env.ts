// lib/env.ts
// Environment variable validation and type-safe access

interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string

  // OpenAI
  OPENAI_API_KEY: string

  // Optional configurations
  NODE_ENV?: 'development' | 'production' | 'test'
  NEXT_PUBLIC_APP_URL?: string
  AI_CACHE_TTL?: string
  SEARCH_RATE_LIMIT?: string
}

class EnvironmentValidator {
  private config: EnvConfig | null = null

  constructor() {
    this.validate()
  }

  private validate(): void {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ]

    const missing: string[] = []

    // Check for required environment variables
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    })

    if (missing.length > 0) {
      const errorMessage = `
🚨 MISSING REQUIRED ENVIRONMENT VARIABLES 🚨

The following environment variables are required but not set:
${missing.map(v => `  - ${v}`).join('\n')}

Please add them to your .env.local file:

${missing.map(v => `${v}=your_value_here`).join('\n')}

For Vercel deployment, add these in the Vercel dashboard:
Settings > Environment Variables
      `.trim()

      console.error(errorMessage)

      // In development, show a warning but continue
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Running in development mode with missing env vars')
      } else {
        // In production, throw an error
        throw new Error('Missing required environment variables')
      }
    }

    // Create validated config
    this.config = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
      NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      AI_CACHE_TTL: process.env.AI_CACHE_TTL || '3600000', // 1 hour default
      SEARCH_RATE_LIMIT: process.env.SEARCH_RATE_LIMIT || '100'
    }

    // Log successful validation in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully')
      console.log('📋 Loaded configuration:', {
        ...this.config,
        // Mask sensitive values
        NEXT_PUBLIC_SUPABASE_ANON_KEY: this.maskValue(this.config.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        OPENAI_API_KEY: this.maskValue(this.config.OPENAI_API_KEY)
      })
    }
  }

  private maskValue(value: string): string {
    if (!value || value.length < 8) return '***'
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
  }

  public get(): EnvConfig {
    if (!this.config) {
      throw new Error('Environment not validated')
    }
    return this.config
  }

  // Type-safe accessors
  public get supabaseUrl(): string {
    return this.get().NEXT_PUBLIC_SUPABASE_URL
  }

  public get supabaseAnonKey(): string {
    return this.get().NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  public get openAIKey(): string {
    return this.get().OPENAI_API_KEY
  }

  public get isDevelopment(): boolean {
    return this.get().NODE_ENV === 'development'
  }

  public get isProduction(): boolean {
    return this.get().NODE_ENV === 'production'
  }

  public get aiCacheTTL(): number {
    return parseInt(this.get().AI_CACHE_TTL || '3600000', 10)
  }

  public get searchRateLimit(): number {
    return parseInt(this.get().SEARCH_RATE_LIMIT || '100', 10)
  }
}

// Create singleton instance
export const env = new EnvironmentValidator()

// Export for use in other files
export default env

// Example usage:
// import env from '@/lib/env'
//
// const supabaseUrl = env.supabaseUrl
// const isDev = env.isDevelopment
// const cacheTTL = env.aiCacheTTL