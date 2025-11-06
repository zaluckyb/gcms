import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing document save functionality...')
    const payload = await getPayload({ config })
    
    // Get a user for authentication
    const users = await payload.find({
      collection: 'users',
      limit: 1
    })
    
    if (!users.docs.length) {
      throw new Error('No users found for authentication')
    }
    
    const user = users.docs[0]
    console.log(`👤 Using user: ${user.email}`)
    
    // Get the content plan
    console.log('📋 Fetching content plan...')
    const contentPlan = await payload.findByID({
      collection: 'contentPlans',
      id: 2,
      user
    })
    
    console.log(`✅ Content plan found: "${contentPlan.topic}"`)
    console.log(`📊 Current status: ${contentPlan.status}`)
    console.log(`📝 Items count: ${contentPlan.contentItems?.length || 0}`)
    
    // Test 1: Try to save without items array
    console.log('💾 Test 1: Attempting to save without items array...')
    
    try {
      const updatedDoc = await payload.update({
        collection: 'contentPlans',
        id: 2,
        data: {
          notes: `Test save without items at ${new Date().toISOString()}`
        },
        user
      })
      
      console.log('✅ Test 1: Save without items successful!')
      
      // Test 2: Try to save with empty items array
      console.log('💾 Test 2: Attempting to save with empty items array...')
      
      const updatedDoc2 = await payload.update({
        collection: 'contentPlans',
        id: 2,
        data: {
          notes: `Test save with empty items at ${new Date().toISOString()}`,
          contentItems: []
        },
        user
      })
      
      console.log('✅ Test 2: Save with empty items successful!')
      
      // Test 3: Try to save with the existing items
      console.log('💾 Test 3: Attempting to save with existing items...')
      
      const updatedDoc3 = await payload.update({
        collection: 'contentPlans',
        id: 2,
        data: {
          notes: `Test save with existing items at ${new Date().toISOString()}`,
          contentItems: contentPlan.contentItems || []
        },
        user
      })
      
      console.log('✅ Test 3: Save with existing items successful!')
      
      return NextResponse.json({
        success: true,
        message: 'All document save tests successful',
        tests: {
          test1: 'Save without items - SUCCESS',
          test2: 'Save with empty items - SUCCESS', 
          test3: 'Save with existing items - SUCCESS'
        },
        timestamp: new Date().toISOString()
      })
      
    } catch (saveError) {
      console.error('❌ Document save failed:', saveError)
      console.error('❌ Save error details:', {
        message: (saveError as Error)?.message,
        name: (saveError as Error)?.name,
        stack: (saveError as Error)?.stack?.split('\n').slice(0, 10).join('\n') // First 10 lines of stack
      })
      
      return NextResponse.json({
        success: false,
        error: 'Document save failed',
        errorDetails: {
          message: (saveError as Error)?.message,
          name: (saveError as Error)?.name,
          type: 'save_error',
          stack: (saveError as Error)?.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines
        },
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Test document save error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}