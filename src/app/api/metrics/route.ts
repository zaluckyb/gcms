import { NextRequest, NextResponse } from 'next/server'
import { handleMetricsEndpoint } from '@/lib/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    const metricsData = handleMetricsEndpoint()
    
    return NextResponse.json(metricsData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Metrics endpoint failed:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}