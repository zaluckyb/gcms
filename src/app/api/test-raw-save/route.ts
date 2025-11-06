import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing raw database save...')
    const payload = await getPayload({ config })
    
    // Get the database adapter
    const db = payload.db
    
    // First, clear existing items for content plan 2
    console.log('🧹 Clearing existing items...')
    await db.drizzle.execute(`
      DELETE FROM content_plans_items_keywords WHERE _parent_id IN (
        SELECT id FROM content_plans_items WHERE _parent_id = 2
      );
    `)
    await db.drizzle.execute(`
      DELETE FROM content_plans_items WHERE _parent_id = 2;
    `)
    
    // Insert new item directly into the database
    console.log('📝 Inserting new item...')
    const itemResult = await db.drizzle.execute(`
      INSERT INTO content_plans_items (
        _parent_id, _order, date, title, slug, description, approved, post_id
      ) VALUES (
        2, 1, '2025-10-01', 'Test Article: Professional Website Benefits', 
        'test-article-professional-website-benefits', 
        'A test article about professional website benefits.', 
        false, null
      ) RETURNING id;
    `)
    
    console.log('📝 Item insert result:', itemResult)
    
    // Get the inserted item ID
    const itemId = itemResult.rows[0]?.id
    if (!itemId) {
      throw new Error('Failed to get inserted item ID')
    }
    
    // Insert keywords for the item
    console.log('🏷️ Inserting keywords...')
    const keywords = ['professional website', 'business benefits', 'web design ROI']
    for (let i = 0; i < keywords.length; i++) {
      await db.drizzle.execute(`
        INSERT INTO content_plans_items_keywords (_parent_id, _order, value)
        VALUES (${itemId}, ${i + 1}, '${keywords[i]}');
      `)
    }
    
    // Update the content plan status
    console.log('📊 Updating content plan status...')
    await db.drizzle.execute(`
      UPDATE content_plans SET status = 'generated', updated_at = NOW() WHERE id = 2;
    `)
    
    console.log('✅ Raw database save completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Content plan items saved successfully using raw database operations',
      itemId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Raw database save error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}