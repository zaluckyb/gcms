const fetch = require('node-fetch')

async function triggerSave() {
  try {
    console.log('Attempting to trigger save for content plan 9...')
    
    // First, get the current data
    const getResponse = await fetch('http://localhost:3000/api/contentPlans/9', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!getResponse.ok) {
      console.error('Failed to get content plan 9:', getResponse.status, getResponse.statusText)
      return
    }
    
    const currentData = await getResponse.json()
    console.log('Current data retrieved')
    console.log('Description length:', currentData.description ? currentData.description.length : 0)
    console.log('ContentItems count:', currentData.contentItems ? currentData.contentItems.length : 0)
    
    // Trigger a save by sending the same data back (this should trigger the beforeChange hook)
    const saveResponse = await fetch('http://localhost:3000/api/contentPlans/9', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentData)
    })
    
    if (!saveResponse.ok) {
      console.error('Failed to save content plan 9:', saveResponse.status, saveResponse.statusText)
      const errorText = await saveResponse.text()
      console.error('Error details:', errorText)
      return
    }
    
    const savedData = await saveResponse.json()
    console.log('\nSave operation completed!')
    console.log('Description length after save:', savedData.description ? savedData.description.length : 0)
    console.log('ContentItems count after save:', savedData.contentItems ? savedData.contentItems.length : 0)
    
    if (savedData.contentItems && savedData.contentItems.length > 0) {
      console.log('\nContent items after conversion:')
      savedData.contentItems.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.title}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

triggerSave()