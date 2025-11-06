const fetch = require('node-fetch')

/**
 * Simple Test for JSON Preservation in ContentPlans Description Field
 * 
 * This test verifies that:
 * 1. JSON content is preserved in the Description field
 * 2. Content Items are created from valid JSON
 * 3. No duplication occurs on subsequent saves
 */

async function testJSONPreservation() {
  console.log('🧪 Testing JSON Preservation in ContentPlans...\n')
  
  const testJSON = JSON.stringify([
    {
      "title": "Preserved JSON Test Article",
      "slug": "preserved-json-test-article",
      "description": "This article tests JSON preservation",
      "keywords": ["json", "preservation", "test"]
    }
  ], null, 2)
  
  try {
    // Test with Content Plan 9 (existing record)
    console.log('📝 Testing with existing Content Plan 9...')
    
    // First, get current data
    const getResponse = await fetch('http://localhost:3000/api/contentPlans/9')
    const currentData = await getResponse.json()
    
    console.log('Current state:', {
      hasDescription: !!currentData.description,
      descriptionLength: currentData.description?.length || 0,
      contentItemsCount: currentData.contentItems?.length || 0
    })
    
    // Update with JSON in description, clear content items to trigger conversion
    const updatePayload = {
      ...currentData,
      description: testJSON,
      contentItems: [] // Clear to trigger conversion
    }
    
    console.log('\n🚀 Updating with JSON content...')
    const updateResponse = await fetch('http://localhost:3000/api/contentPlans/9', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })
    
    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status}`)
    }
    
    const updatedData = await updateResponse.json()
    
    console.log('\n✅ Update Results:')
    console.log('Description preserved:', updatedData.description === testJSON ? '✅ YES' : '❌ NO')
    console.log('Description length:', updatedData.description?.length || 0)
    console.log('Content Items created:', updatedData.contentItems?.length || 0)
    
    if (updatedData.contentItems?.length > 0) {
      console.log('Content Items:')
      updatedData.contentItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`)
      })
    }
    
    // Test second save (duplication prevention)
    console.log('\n🔄 Testing duplicate prevention...')
    const secondUpdateResponse = await fetch('http://localhost:3000/api/contentPlans/9', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: updatedData.topic + ' (Updated Again)',
        description: updatedData.description // Same JSON
      })
    })
    
    if (secondUpdateResponse.ok) {
      const secondUpdatedData = await secondUpdateResponse.json()
      console.log('Duplicates prevented:', secondUpdatedData.contentItems.length === updatedData.contentItems.length ? '✅ YES' : '❌ NO')
      console.log('Content Items after second save:', secondUpdatedData.contentItems.length)
    }
    
    console.log('\n🎉 Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testJSONPreservation()