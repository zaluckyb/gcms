import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...')
    const payload = await getPayload({ config })
    
    // Try to fetch content plans to test database connection
    const contentPlans = await payload.find({
      collection: 'contentPlans',
      limit: 1,
    })
    
    console.log('✅ Database connection successful')
    console.log('📊 Content plans found:', contentPlans.totalDocs)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      totalContentPlans: contentPlans.totalDocs,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}