// Test the enhanced migration hook logic with detailed logging
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// Test data with the JSON from the user
const testData = {
  description: `[ { 
     "content_plan_id": "1", 
     "title": "The Complete Guide to Professional Web Development Services", 
     "slug": "professional-web-development-services-guide", 
     "description": "An overview of all the key services a professional web developer offers — from custom coding to SEO optimization and ongoing maintenance.", 
     "keywords": ["web development services", "website developers South Africa", "professional web design"] 
   }, 
   { 
     "content_plan_id": "2", 
     "title": "Why Every Business Needs a Custom Website Design", 
     "slug": "why-every-business-needs-custom-website-design", 
     "description": "Explore the importance of a tailor-made website design that reflects your brand and converts visitors into customers.", 
     "keywords": ["custom website design", "responsive web design", "business website South Africa"] 
   }, 
   { 
     "content_plan_id": "3", 
     "title": "The Role of Front-End Development in Modern Websites", 
     "slug": "front-end-development-modern-websites", 
     "description": "Explain how front-end development ensures a smooth, responsive, and visually appealing user experience across all devices.", 
     "keywords": ["front-end development", "responsive websites", "UI design"] 
   }]`,
  contentItems: []
}

console.log('🧪 Testing Enhanced Migration Hook Logic...\n')

// Simulate the enhanced beforeChange hook
console.log('🔄 ContentPlans beforeChange hook triggered')
console.log('📝 Data received:', {
  hasDescription: !!testData.description,
  descriptionLength: testData.description ? testData.description.length : 0,
  hasContentItems: !!testData.contentItems,
  contentItemsLength: testData.contentItems ? testData.contentItems.length : 0
})

// Migration: Convert JSON data from description field to contentItems array
if (testData.description && 
    (!testData.contentItems || testData.contentItems.length === 0) &&
    typeof testData.description === 'string') {
  
  console.log('🔍 Attempting to parse description as JSON...')
  
  try {
    // Try to parse the description as JSON
    const parsedData = JSON.parse(testData.description)
    console.log('✅ JSON parsing successful:', {
      type: Array.isArray(parsedData) ? 'Array' : typeof parsedData,
      length: Array.isArray(parsedData) ? parsedData.length : 'N/A'
    })
    
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      console.log('🔄 Converting JSON array to contentItems...')
      
      // Convert the JSON structure to contentItems format
      testData.contentItems = parsedData.map((item, index) => {
        console.log(`  Processing item ${index + 1}: ${item.title}`)
        
        const contentItem = {
          title: item.title || '',
          slug: item.slug || generateSlug(item.title || ''),
          description: item.description || '',
          keywords: []
        }
        
        // Convert keywords array to nested structure
        if (item.keywords && Array.isArray(item.keywords)) {
          contentItem.keywords = item.keywords.map((keyword) => ({
            keyword: keyword.trim()
          }))
          console.log(`    Added ${contentItem.keywords.length} keywords`)
        }
        
        return contentItem
      })
      
      // Clear the description field after successful conversion
      testData.description = ''
      
      console.log(`🎉 Successfully migrated ${testData.contentItems.length} content items from JSON description`)
    } else {
      console.log('⚠️ Parsed data is not a non-empty array, skipping conversion')
    }
  } catch (error) {
    // If parsing fails, it's not JSON data - leave description as is
    console.log('❌ Description field does not contain valid JSON, skipping migration:', error.message)
  }
} else {
  console.log('⏭️ Skipping migration - conditions not met:', {
    hasDescription: !!testData.description,
    hasContentItems: !!(testData.contentItems && testData.contentItems.length > 0),
    descriptionType: typeof testData.description
  })
}

console.log('\n📊 Final Results:')
console.log('- Description length:', testData.description.length)
console.log('- ContentItems count:', testData.contentItems.length)

if (testData.contentItems.length > 0) {
  console.log('\n📋 Converted Content Items:')
  testData.contentItems.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.title}`)
    console.log(`   Slug: ${item.slug}`)
    console.log(`   Description: ${item.description.substring(0, 80)}...`)
    console.log(`   Keywords: ${item.keywords.map(k => k.keyword).join(', ')}`)
  })
}