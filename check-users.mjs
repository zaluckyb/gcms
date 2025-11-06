import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URI
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `)
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ users table does not exist')
      return
    }
    
    console.log('✅ users table exists')

    // Count users
    const count = await client.query('SELECT COUNT(*) FROM users')
    console.log(`\n📊 Total users: ${count.rows[0].count}`)

    // Get users
    const users = await client.query(`
      SELECT id, email, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    
    if (users.rows.length > 0) {
      console.log('\n👥 Users:')
      users.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Email: ${row.email}, Created: ${row.created_at}`)
      })
    } else {
      console.log('\n👥 No users found')
    }

    // Check content_plans with owner relationships
    console.log('\n🔗 ContentPlans with owner relationships:')
    const plansWithOwners = await client.query(`
      SELECT cp.id, cp.topic, cp.status, cp.owner_id, u.email as owner_email
      FROM content_plans cp
      LEFT JOIN users u ON cp.owner_id = u.id
      ORDER BY cp.created_at DESC
    `)
    
    plansWithOwners.rows.forEach(row => {
      console.log(`  Plan ID: ${row.id}, Topic: ${row.topic}, Owner ID: ${row.owner_id}, Owner Email: ${row.owner_email || 'NOT FOUND'}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkUsers()