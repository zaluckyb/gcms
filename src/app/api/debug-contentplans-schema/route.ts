import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    
    // Check contentPlans_items table structure
    const itemsColumns = await payload.db.drizzle.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'contentPlans_items'
      ORDER BY ordinal_position;
    `)
    
    // Check contentPlans_items_keywords table structure
    const keywordsColumns = await payload.db.drizzle.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'contentPlans_items_keywords'
      ORDER BY ordinal_position;
    `)
    
    return NextResponse.json({
      success: true,
      contentPlansItemsColumns: itemsColumns,
      contentPlansItemsKeywordsColumns: keywordsColumns,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug contentPlans schema error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}