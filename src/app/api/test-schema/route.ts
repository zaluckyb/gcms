import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database schema...')
    const payload = await getPayload({ config })
    
    // Get the database adapter to inspect schema
    const db = payload.db
    
    // Try to get schema information
    const result = await db.drizzle.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name LIKE '%content%' OR table_name LIKE '%plan%' OR table_name LIKE '%item%'
      ORDER BY table_name, ordinal_position;
    `)
    
    console.log('✅ Schema query successful')
    console.log('📊 Content plans table schema:', result)
    
    return NextResponse.json({ 
      success: true, 
      schema: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Schema query error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}