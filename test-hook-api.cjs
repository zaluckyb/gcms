const fetch = require('node-fetch')

async function testContentPlanUpdate() {
  try {
    console.log('🧪 Testing ContentPlan hook with direct API call...')
    
    // First, get the current data
    const getResponse = await fetch('http://localhost:3000/api/contentPlans/9')
    const currentData = await getResponse.json()
    
    console.log('📄 Current data:', {
      id: currentData.id,
      topic: currentData.topic,
      hasDescription: !!currentData.description,
      descriptionLength: currentData.description ? currentData.description.length : 0,
      hasContentItems: !!currentData.contentItems,
      contentItemsCount: currentData.contentItems ? currentData.contentItems.length : 0
    })
    
    // Prepare the update payload with JSON in description
    const updatePayload = {
      ...currentData,
      description: `[
  {
    "content_plan_id": "1",
    "title": "The Complete Guide to Professional Web Development Services",
    "slug": "complete-guide-professional-web-development-services-guide",
    "description": "An overview of all the key services a professional web developer offers — from custom coding to SEO optimization.",
    "keywords": ["web development services", "website developers South Africa", "professional web design"]
  }
]`,
      contentItems: [] // Clear content items to trigger migration
    }
    
    console.log('🚀 Sending PATCH request to trigger hook...')
    
    // Make the PATCH request
    const response = await fetch('http://localhost:3000/api/contentPlans/9', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    console.log('✅ API call successful!')
    console.log('📊 Result:', {
      id: result.id,
      topic: result.topic,
      hasDescription: !!result.description,
      descriptionLength: result.description ? result.description.length : 0,
      hasContentItems: !!result.contentItems,
      contentItemsCount: result.contentItems ? result.contentItems.length : 0
    })
    
    if (result.contentItems && result.contentItems.length > 0) {
      console.log('🎉 Content items found after update:')
      result.contentItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.slug})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error testing hook:', error.message)
  }
}

testContentPlanUpdate()