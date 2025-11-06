require('dotenv').config()

async function testMigration() {
  try {
    const response = await fetch('http://localhost:3000/api/contentPlans/8', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Just trigger an update to activate the migration hook
        notes: 'Migration test - ' + new Date().toISOString()
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Update successful:', result.id)
      console.log('Content Items:', result.contentItems?.length || 0)
    } else {
      console.error('Update failed:', response.status, response.statusText)
      const error = await response.text()
      console.error('Error details:', error)
    }
  } catch (error) {
    console.error('Request failed:', error)
  }
}

testMigration()