import type { Payload } from 'payload'
import type { ConnectionHealth } from './types'

export class ConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'ConnectionError'
  }
}

export class ConnectionValidator {
  constructor(private payload: Payload) {}

  async validateConnection(): Promise<ConnectionHealth> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity with a simple query
      const result = await this.payload.db.pool.query('SELECT version(), NOW() as current_time')
      const latency = Date.now() - startTime
      
      // Get connection pool statistics
      const pool = this.payload.db.pool as any
      
      return {
        connected: true,
        latency,
        poolStatus: {
          total: pool?.totalCount || pool?._clients?.length || 0,
          idle: pool?.idleCount || pool?._idle?.length || 0,
          active: (pool?.totalCount || pool?._clients?.length || 0) - (pool?.idleCount || pool?._idle?.length || 0)
        },
        lastCheck: new Date(),
        version: result.rows[0]?.version
      }
      
    } catch (error) {
      const latency = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      return {
        connected: false,
        latency,
        poolStatus: null,
        lastCheck: new Date(),
        error: errorMessage
      }
    }
  }

  async validateConnectionWithTimeout(timeoutMs: number = 5000): Promise<ConnectionHealth> {
    return Promise.race([
      this.validateConnection(),
      new Promise<ConnectionHealth>((_, reject) => 
        setTimeout(() => reject(new ConnectionError('Connection validation timeout')), timeoutMs)
      )
    ])
  }

  async ensureConnection(): Promise<void> {
    const health = await this.validateConnectionWithTimeout(3000)
    
    if (!health.connected) {
      throw new ConnectionError(
        `Database connection failed: ${health.error || 'Unknown error'}`,
        health.error ? new Error(health.error) : undefined
      )
    }

    // Check if latency is too high (> 5 seconds)
    if (health.latency > 5000) {
      throw new ConnectionError(
        `Database connection is too slow: ${health.latency}ms latency`
      )
    }

    // Check pool status
    if (health.poolStatus) {
      const { total, active } = health.poolStatus
      
      // Warn if pool utilization is very high (> 90%)
      if (total > 0 && (active / total) > 0.9) {
        console.warn(`High database pool utilization: ${active}/${total} connections active`)
      }
    }
  }

  async getDetailedConnectionInfo(): Promise<ConnectionHealth & { 
    poolDetails?: any
    serverInfo?: any 
  }> {
    const health = await this.validateConnection()
    
    if (!health.connected) {
      return health
    }

    try {
      // Get additional server information
      const serverInfoQuery = await this.payload.db.pool.query(`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          inet_server_addr() as server_address,
          inet_server_port() as server_port,
          pg_postmaster_start_time() as server_start_time,
          pg_is_in_recovery() as is_replica
      `)

      // Get pool configuration details
      const pool = this.payload.db.pool as any
      const poolDetails = {
        totalCount: pool?.totalCount,
        idleCount: pool?.idleCount,
        waitingCount: pool?.waitingCount,
        options: {
          max: pool?.options?.max,
          min: pool?.options?.min,
          idleTimeoutMillis: pool?.options?.idleTimeoutMillis,
          connectionTimeoutMillis: pool?.options?.connectionTimeoutMillis,
        }
      }

      return {
        ...health,
        poolDetails,
        serverInfo: serverInfoQuery.rows[0]
      }
    } catch (error) {
      // Return basic health info if detailed query fails
      console.warn('Failed to get detailed connection info:', error)
      return health
    }
  }

  async testConnectionStability(durationMs: number = 10000): Promise<{
    stable: boolean
    averageLatency: number
    maxLatency: number
    minLatency: number
    failureCount: number
    testCount: number
  }> {
    const startTime = Date.now()
    const results: number[] = []
    let failureCount = 0
    let testCount = 0

    while (Date.now() - startTime < durationMs) {
      testCount++
      try {
        const health = await this.validateConnection()
        if (health.connected) {
          results.push(health.latency)
        } else {
          failureCount++
        }
      } catch (error) {
        failureCount++
      }
      
      // Wait 100ms between tests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const averageLatency = results.length > 0 
      ? results.reduce((sum, lat) => sum + lat, 0) / results.length 
      : 0
    
    const maxLatency = results.length > 0 ? Math.max(...results) : 0
    const minLatency = results.length > 0 ? Math.min(...results) : 0
    
    // Consider stable if failure rate is < 5% and average latency is reasonable
    const failureRate = testCount > 0 ? failureCount / testCount : 1
    const stable = failureRate < 0.05 && averageLatency < 1000

    return {
      stable,
      averageLatency,
      maxLatency,
      minLatency,
      failureCount,
      testCount
    }
  }
}