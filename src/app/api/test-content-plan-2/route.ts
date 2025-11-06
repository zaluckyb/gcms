import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing content plan ID 2...')
    const payload = await getPayload({ config })
    
    // Try to fetch content plan with ID 2
    const contentPlan = await payload.findByID({
      collection: 'contentPlans',
      id: 2,
    })
    
    console.log('✅ Content plan 2 found:', contentPlan.topic)
    console.log('📊 Current items count:', contentPlan.contentItems?.length || 0)
    console.log('📊 Current status:', contentPlan.status)
    
    return NextResponse.json({ 
      success: true, 
      contentPlan: {
        id: contentPlan.id,
        topic: contentPlan.topic,
        status: contentPlan.status,
        itemsCount: contentPlan.contentItems?.length || 0,
        items: contentPlan.contentItems || [],
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Content plan 2 fetch error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing save to content plan ID 2...')
    const payload = await getPayload({ config })
    
    // Test data that mimics what the UI would send
    const testItems = [
      {
        date: '2025-10-01',
        title: 'Test Article: Professional Website Benefits',
        slug: 'test-article-professional-website-benefits',
        description: 'A test article about professional website benefits.',
        keywords: [
          { keyword: 'professional website' },
          { keyword: 'business benefits' },
          { keyword: 'web design ROI' },
        ],
      }
    ]
    
    // Ensure no ID fields are present in the items
    const cleanItems = testItems.map(item => {
      const cleanItem = { ...item }
      // Remove any potential ID fields
      delete (cleanItem as any).id
      delete (cleanItem as any)._id
      
      // Clean keywords array too
      if (cleanItem.keywords) {
        cleanItem.keywords = cleanItem.keywords.map(keyword => {
          const cleanKeyword = { ...keyword }
          delete (cleanKeyword as any).id
          delete (cleanKeyword as any)._id
          return cleanKeyword
        })
      }
      
      return cleanItem
    })

    console.log('🧪 Testing save with test data:', JSON.stringify(cleanItems, null, 2))

    // First clear existing items
    await payload.update({
      collection: 'contentPlans',
      id: 2,
      data: {
        contentItems: [],
      },
    })

    // Then update with test items
    const result = await payload.update({
      collection: 'contentPlans',
      id: 2,
      data: {
        status: 'active',
        contentItems: cleanItems,
      },
    })

    console.log('✅ Successfully updated content plan 2')
    
    return NextResponse.json({ 
      success: true, 
      itemsSaved: testItems.length,
      result: result.id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Content plan 2 save error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}