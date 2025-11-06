const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gcms',
  password: 'password',
  port: 5432,
})

async function debugContentPlan9() {
  try {
    console.log('🔍 Debugging Content Plan 9...\n')
    
    // Get content plan 9 data
    const planResult = await pool.query('SELECT * FROM content_plans WHERE id = 9')
    
    if (planResult.rows.length === 0) {
      console.log('❌ Content Plan 9 not found')
      return
    }
    
    const plan = planResult.rows[0]
    console.log('📋 Content Plan 9 Data:')
    console.log('- ID:', plan.id)
    console.log('- Topic:', plan.topic)
    console.log('- Description length:', plan.description ? plan.description.length : 0)
    console.log('- Description preview:', plan.description ? plan.description.substring(0, 200) + '...' : 'Empty')
    console.log('- Updated at:', plan.updated_at)
    console.log('- Created at:', plan.created_at)
    
    // Check if description contains JSON
    if (plan.description) {
      console.log('\n🔍 Analyzing Description Field:')
      try {
        const parsed = JSON.parse(plan.description)
        console.log('✅ Description contains valid JSON')
        console.log('- Type:', Array.isArray(parsed) ? 'Array' : typeof parsed)
        if (Array.isArray(parsed)) {
          console.log('- Array length:', parsed.length)
          console.log('- First item keys:', Object.keys(parsed[0] || {}))
        }
      } catch (error) {
        console.log('❌ Description is not valid JSON:', error.message)
      }
    }
    
    // Check for content items
    const itemsResult = await pool.query('SELECT * FROM content_plans_content_items WHERE _parent_id = $1 ORDER BY _order', [9])
    
    console.log('\n📝 Content Items for Plan 9:')
    console.log('- Count:', itemsResult.rows.length)
    
    if (itemsResult.rows.length > 0) {
      itemsResult.rows.forEach((item, index) => {
        console.log(`\n  Item ${index + 1}:`)
        console.log('    - ID:', item.id)
        console.log('    - Title:', item.title)
        console.log('    - Slug:', item.slug)
        console.log('    - Description:', item.description ? item.description.substring(0, 100) + '...' : 'Empty')
        console.log('    - Order:', item._order)
      })
      
      // Check keywords for first item
      if (itemsResult.rows.length > 0) {
        const keywordsResult = await pool.query('SELECT * FROM content_plans_content_items_keywords WHERE _parent_id = $1', [itemsResult.rows[0].id])
        console.log('\n🏷️ Keywords for first item:')
        console.log('- Count:', keywordsResult.rows.length)
        keywordsResult.rows.forEach((keyword, index) => {
          console.log(`  ${index + 1}. ${keyword.keyword}`)
        })
      }
    } else {
      console.log('❌ No content items found - conversion has not happened')
    }
    
    // Check recent activity
    console.log('\n⏰ Recent Activity Check:')
    const recentPlans = await pool.query('SELECT id, topic, updated_at FROM content_plans WHERE updated_at > NOW() - INTERVAL \'1 hour\' ORDER BY updated_at DESC')
    console.log('Recently updated content plans:', recentPlans.rows.length)
    recentPlans.rows.forEach(plan => {
      console.log(`- Plan ${plan.id}: ${plan.topic} (updated: ${plan.updated_at})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

debugContentPlan9()