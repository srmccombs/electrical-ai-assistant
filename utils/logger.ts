// utils/logger.ts
// Centralized logging utility for development and production

const isDevelopment = process.env.NODE_ENV === 'development'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.WARN

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level}] ${message}`
  }

  debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message), data || '')
    }
  }

  info(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message), data || '')
    }
  }

  warn(message: string, data?: any) {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), data || '')
    }
  }

  error(message: string, error?: any) {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), error || '')
    }
  }

  // Production-safe logging for critical events
  track(event: string, properties?: Record<string, any>) {
    // In production, this could send to analytics service
    if (!isDevelopment) {
      // Future: Send to analytics/monitoring service
      // For now, just log critical events
      console.log(`[TRACK] ${event}`, properties)
    } else {
      this.debug(`Track: ${event}`, properties)
    }
  }
}

export const logger = new Logger()

// Example usage:
// import { logger } from '@/utils/logger'
// 
// logger.debug('Search started', { query: 'cat6 cable' })
// logger.info('Found products', { count: 10 })
// logger.warn('API slow response', { duration: 3000 })
// logger.error('Search failed', error)
// logger.track('search_performed', { query: 'cat6', results: 10 })