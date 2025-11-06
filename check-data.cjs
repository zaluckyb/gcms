require('dotenv').config()
const { Pool } = require('pg')

async function checkData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI
  })

  try {
    // Check content plans
    const result = await pool.query(`
      SELECT 
        cp.id,
        cp.topic,
        cp.description
      FROM content_plans cp
      ORDER BY cp.id
    `)

    console.log('Content Plans Status:')
    console.log('====================')
    
    for (const row of result.rows) {
      console.log(`\nID: ${row.id}`)
      console.log(`Topic: ${row.topic}`)
      console.log(`Description Length: ${row.description ? row.description.length : 0}`)
      
      if (row.description && row.description.startsWith('[')) {
        console.log(`Description Type: JSON Array`)
        try {
          const parsed = JSON.parse(row.description)
          console.log(`JSON Items: ${parsed.length}`)
        } catch (e) {
          console.log(`JSON Parse Error: ${e.message}`)
        }
      } else {
        console.log(`Description Type: Text`)
      }
    }

    // Check specific content items for plan 8
    const itemsResult = await pool.query(`
      SELECT title, slug, description, _order
      FROM content_plans_content_items 
      WHERE _parent_id = '8'
      ORDER BY _order
    `)

    if (itemsResult.rows.length > 0) {
      console.log(`\nContent Items for Plan 8:`)
      console.log('========================')
      itemsResult.rows.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`)
        console.log(`   Slug: ${item.slug}`)
        console.log(`   Description: ${item.description?.substring(0, 100)}...`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkData()