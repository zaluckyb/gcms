import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { handleHealthCheck } from '@/lib/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const healthData = await handleHealthCheck(payload)
    
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: {
          timestamp: new Date().toISOString(),
          duration: 0,
          metrics: [],
          errors: [
            {
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            },
          ],
          warnings: ['Health check endpoint failed'],
          summary: {
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 100,
            memoryUsage: process.memoryUsage(),
          },
        },
        health: {
          status: 'unhealthy',
          checks: {},
          timestamp: new Date().toISOString(),
        },
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}