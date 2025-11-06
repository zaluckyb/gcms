import type { PayloadRequest } from 'payload'
import { performHealthCheck, FallbackLogger } from './fallback-handler'

// Performance metrics interfaces
export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: Date
  tags?: Record<string, string>
}

export interface PerformanceReport {
  timestamp: string
  duration: number
  metrics: PerformanceMetric[]
  errors: Array<{
    message: string
    stack?: string
    timestamp: Date
  }>
  warnings: string[]
  summary: {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    memoryUsage: NodeJS.MemoryUsage
  }
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  size: number
  maxSize: number
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enableMetrics: boolean
  enableProfiling: boolean
  sampleRate: number // 0-1, percentage of requests to monitor
  maxMetricsHistory: number
  alertThresholds: {
    responseTime: number // ms
    errorRate: number // percentage
    memoryUsage: number // percentage
  }
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableMetrics: process.env.NODE_ENV === 'production',
  enableProfiling: process.env.NODE_ENV === 'development',
  sampleRate: 0.1, // Monitor 10% of requests
  maxMetricsHistory: 1000,
  alertThresholds: {
    responseTime: 2000, // 2 seconds
    errorRate: 5, // 5%
    memoryUsage: 80, // 80%
  },
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private config: PerformanceConfig
  private metrics: PerformanceMetric[] = []
  private requestCount = 0
  private errorCount = 0
  private responseTimeSum = 0
  private logger: FallbackLogger
  private cache = new Map<string, any>()
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    maxSize: 1000,
  }

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.logger = new FallbackLogger({
      enableLogging: true,
      logLevel: 'info',
    })
  }

  /**
   * Start monitoring a request
   */
  startRequest(requestId: string, operation: string): PerformanceTimer {
    if (!this.shouldSample()) {
      return new PerformanceTimer(requestId, operation, false)
    }

    this.requestCount++
    return new PerformanceTimer(requestId, operation, true, this)
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.config.enableMetrics) return

    this.metrics.push(metric)

    // Keep metrics history within limits
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsHistory)
    }

    // Check for alerts
    this.checkAlerts(metric)
  }

  /**
   * Record an error
   */
  recordError(error: Error, context?: any): void {
    this.errorCount++
    
    this.logger.error('Performance monitor recorded error', {
      message: error.message,
      stack: error.stack,
      context,
    })

    this.recordMetric({
      name: 'error_count',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      tags: {
        error_type: error.constructor.name,
        ...context,
      },
    })
  }

  /**
   * Record response time
   */
  recordResponseTime(duration: number, operation: string): void {
    this.responseTimeSum += duration

    this.recordMetric({
      name: 'response_time',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags: { operation },
    })
  }

  /**
   * Get current performance report
   */
  getReport(): PerformanceReport {
    const now = new Date()
    const memoryUsage = process.memoryUsage()
    const averageResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0

    // Update cache metrics
    this.updateCacheMetrics()

    return {
      timestamp: now.toISOString(),
      duration: 0, // Will be set by caller if needed
      metrics: [...this.metrics],
      errors: [],
      warnings: this.generateWarnings(),
      summary: {
        totalRequests: this.requestCount,
        averageResponseTime,
        errorRate,
        memoryUsage,
      },
    }
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  reset(): void {
    this.metrics = []
    this.requestCount = 0
    this.errorCount = 0
    this.responseTimeSum = 0
    this.cache.clear()
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.cacheMetrics.maxSize,
    }
  }

  /**
   * Cache operations with metrics
   */
  cacheGet<T>(key: string): T | undefined {
    const value = this.cache.get(key)
    
    if (value !== undefined) {
      this.cacheMetrics.hits++
    } else {
      this.cacheMetrics.misses++
    }

    this.updateCacheMetrics()
    return value
  }

  cacheSet<T>(key: string, value: T, ttl?: number): void {
    // Simple TTL implementation
    if (ttl) {
      setTimeout(() => {
        this.cache.delete(key)
        this.updateCacheMetrics()
      }, ttl)
    }

    this.cache.set(key, value)
    this.updateCacheMetrics()

    // Enforce max size
    if (this.cache.size > this.cacheMetrics.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
  }

  cacheDelete(key: string): boolean {
    const result = this.cache.delete(key)
    this.updateCacheMetrics()
    return result
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics }
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }

  private updateCacheMetrics(): void {
    const total = this.cacheMetrics.hits + this.cacheMetrics.misses
    this.cacheMetrics.hitRate = total > 0 ? (this.cacheMetrics.hits / total) * 100 : 0
    this.cacheMetrics.size = this.cache.size
  }

  private checkAlerts(metric: PerformanceMetric): void {
    const { alertThresholds } = this.config

    if (metric.name === 'response_time' && metric.value > alertThresholds.responseTime) {
      this.logger.warn(`High response time detected: ${metric.value}ms`, metric)
    }

    if (metric.name === 'error_count') {
      const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
      if (errorRate > alertThresholds.errorRate) {
        this.logger.warn(`High error rate detected: ${errorRate.toFixed(2)}%`)
      }
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    if (memoryUsagePercent > alertThresholds.memoryUsage) {
      this.logger.warn(`High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`, memoryUsage)
    }
  }

  private generateWarnings(): string[] {
    const warnings: string[] = []
    const { alertThresholds } = this.config

    // Check average response time
    const avgResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0
    if (avgResponseTime > alertThresholds.responseTime) {
      warnings.push(`Average response time (${avgResponseTime.toFixed(2)}ms) exceeds threshold`)
    }

    // Check error rate
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
    if (errorRate > alertThresholds.errorRate) {
      warnings.push(`Error rate (${errorRate.toFixed(2)}%) exceeds threshold`)
    }

    // Check cache hit rate
    if (this.cacheMetrics.hitRate < 50 && this.cacheMetrics.hits + this.cacheMetrics.misses > 100) {
      warnings.push(`Low cache hit rate: ${this.cacheMetrics.hitRate.toFixed(2)}%`)
    }

    return warnings
  }
}

/**
 * Performance timer for measuring operation duration
 */
export class PerformanceTimer {
  private startTime: number
  private endTime?: number
  private enabled: boolean
  private monitor?: PerformanceMonitor

  constructor(
    private requestId: string,
    private operation: string,
    enabled: boolean,
    monitor?: PerformanceMonitor
  ) {
    this.enabled = enabled
    this.monitor = monitor
    this.startTime = enabled ? performance.now() : 0
  }

  /**
   * End the timer and record the metric
   */
  end(tags?: Record<string, string>): number {
    if (!this.enabled) return 0

    this.endTime = performance.now()
    const duration = this.endTime - this.startTime

    if (this.monitor) {
      this.monitor.recordResponseTime(duration, this.operation)
      this.monitor.recordMetric({
        name: `${this.operation}_duration`,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags: {
          request_id: this.requestId,
          ...tags,
        },
      })
    }

    return duration
  }

  /**
   * Get current duration without ending the timer
   */
  getCurrentDuration(): number {
    if (!this.enabled) return 0
    return performance.now() - this.startTime
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor()

/**
 * Middleware function for Express/Next.js to monitor requests
 */
export function createPerformanceMiddleware(monitor: PerformanceMonitor = globalPerformanceMonitor) {
  return (req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timer = monitor.startRequest(requestId, req.method + ' ' + req.path)

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId)

    // Monitor response
    const originalSend = res.send
    res.send = function(data: any) {
      const duration = timer.end({
        method: req.method,
        path: req.path,
        status_code: res.statusCode.toString(),
      })

      // Record additional metrics
      if (data) {
        monitor.recordMetric({
          name: 'response_size',
          value: Buffer.byteLength(data, 'utf8'),
          unit: 'bytes',
          timestamp: new Date(),
          tags: {
            request_id: requestId,
            method: req.method,
            path: req.path,
          },
        })
      }

      return originalSend.call(this, data)
    }

    // Handle errors
    const originalNext = next
    next = function(error?: any) {
      if (error) {
        monitor.recordError(error, {
          request_id: requestId,
          method: req.method,
          path: req.path,
        })
      }
      return originalNext(error)
    }

    next()
  }
}

/**
 * Health check endpoint handler
 */
export async function handleHealthCheck(
  payload: any,
  monitor: PerformanceMonitor = globalPerformanceMonitor
): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  performance: PerformanceReport
  health: any
}> {
  const timer = monitor.startRequest('health_check', 'health_check')
  
  try {
    // Get health check results
    const healthResult = await performHealthCheck(payload, {
      enableLogging: false,
    })

    // Get performance report
    const performanceReport = monitor.getReport()

    timer.end({ operation: 'health_check' })

    return {
      status: healthResult.status,
      timestamp: new Date().toISOString(),
      performance: performanceReport,
      health: healthResult,
    }
  } catch (error) {
    monitor.recordError(error as Error, { operation: 'health_check' })
    timer.end({ operation: 'health_check', error: 'true' })
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      performance: monitor.getReport(),
      health: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {},
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * Performance metrics endpoint handler
 */
export function handleMetricsEndpoint(
  monitor: PerformanceMonitor = globalPerformanceMonitor
): PerformanceReport {
  return monitor.getReport()
}

/**
 * Utility function to measure async operations
 */
export async function measureAsync<T>(
  operation: () => Promise<T>,
  operationName: string,
  monitor: PerformanceMonitor = globalPerformanceMonitor
): Promise<T> {
  const timer = monitor.startRequest(`async_${Date.now()}`, operationName)
  
  try {
    const result = await operation()
    timer.end({ success: 'true' })
    return result
  } catch (error) {
    monitor.recordError(error as Error, { operation: operationName })
    timer.end({ success: 'false' })
    throw error
  }
}

/**
 * Utility function to measure sync operations
 */
export function measureSync<T>(
  operation: () => T,
  operationName: string,
  monitor: PerformanceMonitor = globalPerformanceMonitor
): T {
  const timer = monitor.startRequest(`sync_${Date.now()}`, operationName)
  
  try {
    const result = operation()
    timer.end({ success: 'true' })
    return result
  } catch (error) {
    monitor.recordError(error as Error, { operation: operationName })
    timer.end({ success: 'false' })
    throw error
  }
}