// utils/logger.ts
// Centralized logging utility with Plectic AI specific features

const isDevelopment = process.env.NODE_ENV === 'development'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export enum LogCategory {
  SEARCH = '🔍',
  AI = '🤖',
  DATABASE = '🗄️',
  ANALYTICS = '📊',
  CACHE = '💾',
  API = '🌐',
  UI = '🎨',
  PERFORMANCE = '⚡',
  BUSINESS = '💼',
  ERROR = '❌'
}

interface LogContext {
  category?: LogCategory
  userId?: string
  sessionId?: string
  searchId?: string
  [key: string]: any
}

class Logger {
  private level: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.WARN
  private context: LogContext = {}

  constructor() {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise
        })
      })
    }
  }

  private formatMessage(level: string, category: string, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] ${category} [${level}] ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    return this.level <= level
  }

  // Set context for subsequent logs
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  clearContext(): void {
    this.context = {}
  }

  debug(message: string, data?: any, category: LogCategory = LogCategory.UI): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(
        this.formatMessage('DEBUG', category, message),
        { ...this.context, ...data }
      )
    }
  }

  info(message: string, data?: any, category: LogCategory = LogCategory.UI): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(
        this.formatMessage('INFO', category, message),
        { ...this.context, ...data }
      )
    }
  }

  warn(message: string, data?: any, category: LogCategory = LogCategory.UI): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(
        this.formatMessage('WARN', category, message),
        { ...this.context, ...data }
      )
    }
  }

  error(message: string, error?: any, category: LogCategory = LogCategory.ERROR): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(
        this.formatMessage('ERROR', category, message),
        { ...this.context, error: error?.message || error, stack: error?.stack }
      )
    }
  }

  // Search-specific logging methods
  searchStart(query: string, options?: any): void {
    this.info('Search started', { query, ...options }, LogCategory.SEARCH)
  }

  searchComplete(query: string, resultCount: number, timeMs: number): void {
    this.info('Search completed', {
      query,
      resultCount,
      timeMs,
      performance: timeMs < 300 ? 'excellent' : timeMs < 500 ? 'good' : 'slow'
    }, LogCategory.SEARCH)
  }

  aiAnalysis(query: string, analysis: any): void {
    this.debug('AI analysis complete', {
      query,
      productType: analysis?.productType,
      confidence: analysis?.confidence,
      strategy: analysis?.searchStrategy
    }, LogCategory.AI)
  }

  // Performance tracking
  startTimer(label: string): () => number {
    const start = performance.now()
    return () => {
      const duration = Math.round(performance.now() - start)
      this.debug(`${label} completed`, { durationMs: duration }, LogCategory.PERFORMANCE)
      return duration
    }
  }

  // Production-safe event tracking
  track(event: string, properties?: Record<string, any>): void {
    const trackingData = {
      event,
      ...this.context,
      ...properties,
      timestamp: new Date().toISOString()
    }

    if (!isDevelopment) {
      // In production, this would send to analytics service
      // For now, just log critical events in a structured way
      console.log(JSON.stringify({
        type: 'ANALYTICS_EVENT',
        ...trackingData
      }))
    } else {
      this.debug(`Track: ${event}`, properties, LogCategory.ANALYTICS)
    }
  }

  // Table operation logging
  tableOperation(operation: string, table: string, details?: any): void {
    this.debug(`Database ${operation}`, {
      table,
      ...details
    }, LogCategory.DATABASE)
  }

  // Cache operations
  cacheHit(key: string): void {
    this.debug('Cache hit', { key }, LogCategory.CACHE)
  }

  cacheMiss(key: string): void {
    this.debug('Cache miss', { key }, LogCategory.CACHE)
  }

  cacheSet(key: string, ttl?: number): void {
    this.debug('Cache set', { key, ttl }, LogCategory.CACHE)
  }
}

// Create singleton instance
export const logger = new Logger()

// Export everything for external use
export default logger

// Example usage:
// import { logger, LogCategory } from '@/utils/logger'
//
// // Simple logging
// logger.info('User clicked product', { productId: 'CAT6-001' })
//
// // Search logging
// logger.searchStart('cat6 cable')
// logger.searchComplete('cat6 cable', 45, 287)
//
// // Performance tracking
// const endTimer = logger.startTimer('Database query')
// // ... do operation ...
// const duration = endTimer() // Logs automatically
//
// // With context
// logger.setContext({ userId: 'user-123', sessionId: 'sess-456' })
// logger.track('product_added_to_list', { productId: 'CAT6-001' })
// logger.clearContext()