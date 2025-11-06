const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gcms',
  password: 'password',
  port: 5432,
})

async function checkContentPlan9() {
  try {
    console.log('Checking Content Plan 9...')
    
    // Get content plan 9
    const planResult = await pool.query('SELECT * FROM content_plans WHERE id = 9')
    
    if (planResult.rows.length === 0) {
      console.log('Content Plan 9 not found')
      return
    }
    
    const plan = planResult.rows[0]
    console.log('\nContent Plan 9:')
    console.log('ID:', plan.id)
    console.log('Topic:', plan.topic)
    console.log('Description length:', plan.description ? plan.description.length : 0)
    console.log('Description preview:', plan.description ? plan.description.substring(0, 200) + '...' : 'Empty')
    
    // Check for content items
    const itemsResult = await pool.query('SELECT * FROM content_plans_content_items WHERE _parent_id = $1', [9])
    
    console.log('\nContent Items for Plan 9:')
    console.log('Count:', itemsResult.rows.length)
    
    if (itemsResult.rows.length > 0) {
      itemsResult.rows.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`)
        console.log('  ID:', item.id)
        console.log('  Title:', item.title)
        console.log('  Slug:', item.slug)
        console.log('  Description:', item.description ? item.description.substring(0, 100) + '...' : 'Empty')
      })
    } else {
      console.log('No content items found - conversion may not have happened')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkContentPlan9()