require('dotenv').config()
const payload = require('payload')

async function runMigration() {
  try {
    // Initialize Payload
    await payload.init({
      secret: process.env.PAYLOAD_SECRET,
      local: true,
    })

    console.log('Payload initialized successfully')

    // Get all content plans
    const contentPlans = await payload.find({
      collection: 'contentPlans',
      limit: 100,
    })

    console.log(`Found ${contentPlans.docs.length} content plans`)

    for (const plan of contentPlans.docs) {
      console.log(`\nProcessing content plan: ${plan.topic} (ID: ${plan.id})`)
      
      // Check if description contains JSON and contentItems is empty
      if (plan.description && 
          (!plan.contentItems || plan.contentItems.length === 0) &&
          typeof plan.description === 'string') {
        
        try {
          const parsedData = JSON.parse(plan.description)
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log(`  Found JSON data with ${parsedData.length} items`)
            
            // Update the record to trigger the migration hook
            await payload.update({
              collection: 'contentPlans',
              id: plan.id,
              data: {
                // Just trigger an update - the hook will handle the conversion
                updatedAt: new Date().toISOString()
              }
            })
            
            console.log(`  Migration triggered for content plan ${plan.id}`)
          } else {
            console.log(`  Description is not a valid JSON array`)
          }
        } catch (error) {
          console.log(`  Description is not valid JSON, skipping`)
        }
      } else {
        console.log(`  No migration needed (description empty or contentItems already exist)`)
      }
    }

    console.log('\nMigration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    process.exit(0)
  }
}

runMigration()