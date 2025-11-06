import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg

async function checkContentPlans() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Check if content_plans table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'content_plans'
    `)
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ content_plans table does not exist')
      return
    }
    
    console.log('✅ content_plans table exists')

    // Get table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'content_plans'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Table structure:')
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    // Count records
    const count = await client.query('SELECT COUNT(*) FROM content_plans')
    console.log(`\n📊 Total records: ${count.rows[0].count}`)

    // Get recent records
    const recent = await client.query(`
      SELECT id, status, topic, audience, created_at, updated_at
      FROM content_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    
    if (recent.rows.length > 0) {
      console.log('\n📝 Recent records:')
      recent.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Status: ${row.status}, Topic: ${row.topic}, Created: ${row.created_at}`)
      })
    } else {
      console.log('\n📝 No records found')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkContentPlans()