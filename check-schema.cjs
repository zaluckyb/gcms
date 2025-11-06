const { Pool } = require('pg')
require('dotenv').config()

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI
  })

  try {
    // Check content_plans table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'content_plans'
      ORDER BY ordinal_position;
    `)

    console.log('content_plans table structure:')
    console.table(result.rows)

    // Check if the tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'content_plans%'
      ORDER BY table_name;
    `)

    console.log('\nContent plans related tables:')
    console.table(tablesResult.rows)

  } catch (error) {
    console.error('Error checking schema:', error)
  } finally {
    await pool.end()
  }
}

checkSchema()