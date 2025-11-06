require('dotenv').config()
const { Pool } = require('pg')

async function triggerMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI
  })

  try {
    // Get content plans that have JSON data in description
    const result = await pool.query(`
      SELECT id, description 
      FROM content_plans 
      WHERE description IS NOT NULL 
      AND description != '' 
      AND description LIKE '[%'
    `)

    console.log(`Found ${result.rows.length} content plans with JSON data`)

    for (const row of result.rows) {
      console.log(`Processing content plan ID: ${row.id}`)
      console.log(`Description: ${row.description.substring(0, 100)}...`)
      
      // Trigger an update to activate the migration hook
      await pool.query(`
        UPDATE content_plans 
        SET updated_at = NOW() 
        WHERE id = $1
      `, [row.id])
    }

    console.log('Migration trigger completed')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

triggerMigration()