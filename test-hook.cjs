// Test the migration hook logic with the JSON data you provided
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// Your JSON data
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

console.log('Testing migration hook logic...')
console.log('Original data:')
console.log('- Description length:', testData.description.length)
console.log('- ContentItems count:', testData.contentItems.length)

// Simulate the beforeChange hook logic
if (testData.description && 
    (!testData.contentItems || testData.contentItems.length === 0) &&
    typeof testData.description === 'string') {
  
  try {
    // Try to parse the description as JSON
    const parsedData = JSON.parse(testData.description)
    
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      // Convert the JSON structure to contentItems format
      testData.contentItems = parsedData.map((item) => {
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
        }
        
        return contentItem
      })
      
      // Clear the description field after successful conversion
      testData.description = ''
      
      console.log(`\nMigrated ${testData.contentItems.length} content items from JSON description`)
    }
  } catch (error) {
    // If parsing fails, it's not JSON data - leave description as is
    console.log('Description field does not contain valid JSON, skipping migration')
    console.error('Parse error:', error.message)
  }
}

console.log('\nAfter migration:')
console.log('- Description length:', testData.description.length)
console.log('- ContentItems count:', testData.contentItems.length)

if (testData.contentItems.length > 0) {
  console.log('\nConverted content items:')
  testData.contentItems.forEach((item, index) => {
    console.log(`\nItem ${index + 1}:`)
    console.log('  Title:', item.title)
    console.log('  Slug:', item.slug)
    console.log('  Description:', item.description.substring(0, 100) + '...')
    console.log('  Keywords:', item.keywords.map(k => k.keyword).join(', '))
  })
}