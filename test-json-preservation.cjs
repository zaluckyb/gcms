const fetch = require('node-fetch')

/**
 * Comprehensive Test Suite for JSON Preservation in ContentPlans Description Field
 * 
 * This test suite verifies that the Description field preserves JSON content
 * while still creating Content Items from valid JSON arrays.
 * 
 * Test Scenarios:
 * 1. Empty description field
 * 2. Valid JSON array (should create Content Items + preserve JSON)
 * 3. Invalid/malformed JSON (should preserve as-is, no Content Items)
 * 4. Non-JSON text content (should preserve as-is, no Content Items)
 * 5. Multiple saves of the same record (should not duplicate Content Items)
 */

const BASE_URL = 'http://localhost:3000/api'

// Test data scenarios
const testScenarios = [
  {
    name: 'Empty Description Field',
    description: '',
    expectedContentItems: 0,
    expectedDescriptionPreserved: true,
    expectedDescription: ''
  },
  {
    name: 'Valid JSON Array',
    description: JSON.stringify([
      {
        "title": "Test Article 1",
        "slug": "test-article-1",
        "description": "First test article description",
        "keywords": ["test", "article", "first"]
      },
      {
        "title": "Test Article 2", 
        "description": "Second test article description",
        "keywords": ["test", "article", "second"]
      }
    ], null, 2),
    expectedContentItems: 2,
    expectedDescriptionPreserved: true
  },
  {
    name: 'Invalid JSON - Missing Bracket',
    description: `[
  {
    "title": "Broken JSON",
    "description": "This JSON is missing a closing bracket"
  }`,
    expectedContentItems: 0,
    expectedDescriptionPreserved: true
  },
  {
    name: 'Non-JSON Text Content',
    description: 'This is just regular text content for the description field. It should be preserved as-is without any Content Items being created.',
    expectedContentItems: 0,
    expectedDescriptionPreserved: true
  },
  {
    name: 'Empty JSON Array',
    description: '[]',
    expectedContentItems: 0,
    expectedDescriptionPreserved: true
  },
  {
    name: 'JSON Object (Not Array)',
    description: JSON.stringify({
      "title": "Single Object",
      "description": "This is a JSON object, not an array"
    }),
    expectedContentItems: 0,
    expectedDescriptionPreserved: true
  }
]

async function runTest(scenario, testIndex) {
  console.log(`\n🧪 Test ${testIndex + 1}: ${scenario.name}`)
  console.log('=' .repeat(50))
  
  try {
    // Create a new content plan for this test
    const createPayload = {
      topic: `Test Plan - ${scenario.name}`,
      description: scenario.description,
      owner: '676b8b8b8b8b8b8b8b8b8b8b', // Replace with actual user ID
      status: 'draft'
    }
    
    console.log('📝 Creating content plan with description:', {
      length: scenario.description.length,
      preview: scenario.description.substring(0, 100) + (scenario.description.length > 100 ? '...' : '')
    })
    
    // Create the content plan
    const createResponse = await fetch(`${BASE_URL}/contentPlans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload)
    })
    
    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status} ${createResponse.statusText}`)
    }
    
    const createdPlan = await createResponse.json()
    console.log('✅ Content plan created:', createdPlan.id)
    
    // Verify the results
    console.log('🔍 Verification Results:')
    console.log(`  Description preserved: ${createdPlan.description === scenario.description ? '✅' : '❌'}`)
    console.log(`  Description length: ${createdPlan.description.length} (expected: ${scenario.description.length})`)
    console.log(`  Content Items count: ${createdPlan.contentItems?.length || 0} (expected: ${scenario.expectedContentItems})`)
    
    if (createdPlan.contentItems && createdPlan.contentItems.length > 0) {
      console.log('  Content Items created:')
      createdPlan.contentItems.forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.title} (${item.slug})`)
      })
    }
    
    // Test multiple saves (duplication prevention)
    if (scenario.expectedContentItems > 0) {
      console.log('\n🔄 Testing duplicate prevention with second save...')
      
      const updateResponse = await fetch(`${BASE_URL}/contentPlans/${createdPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: createdPlan.topic + ' (Updated)',
          description: createdPlan.description // Same JSON content
        })
      })
      
      if (updateResponse.ok) {
        const updatedPlan = await updateResponse.json()
        const duplicatesCreated = updatedPlan.contentItems.length > createdPlan.contentItems.length
        console.log(`  Duplicates prevented: ${!duplicatesCreated ? '✅' : '❌'}`)
        console.log(`  Content Items after update: ${updatedPlan.contentItems.length}`)
      }
    }
    
    // Clean up - delete the test content plan
    await fetch(`${BASE_URL}/contentPlans/${createdPlan.id}`, {
      method: 'DELETE'
    })
    console.log('🗑️ Test content plan cleaned up')
    
    return {
      passed: createdPlan.description === scenario.description && 
              (createdPlan.contentItems?.length || 0) === scenario.expectedContentItems,
      scenario: scenario.name
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return {
      passed: false,
      scenario: scenario.name,
      error: error.message
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting JSON Preservation Test Suite')
  console.log('Testing ContentPlans Description field preservation...\n')
  
  const results = []
  
  for (let i = 0; i < testScenarios.length; i++) {
    const result = await runTest(testScenarios[i], i)
    results.push(result)
    
    // Wait between tests to avoid overwhelming the server
    if (i < testScenarios.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary')
  console.log('=' .repeat(50))
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${index + 1}. ${status} - ${result.scenario}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! JSON preservation is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.')
  }
}

// Run the test suite
runAllTests().catch(console.error)