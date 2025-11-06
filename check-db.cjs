const { Pool } = require('pg');

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI
  });

  try {
    console.log('🔍 Checking database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check if content_plans table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'content_plans'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ content_plans table exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'content_plans' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check row count
      const count = await client.query('SELECT COUNT(*) FROM content_plans');
      console.log(`📊 Total records: ${count.rows[0].count}`);
      
      // Check recent records
      const recent = await client.query('SELECT id, topic, status, created_at FROM content_plans ORDER BY created_at DESC LIMIT 5');
      console.log('📝 Recent records:');
      recent.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Topic: ${row.topic}, Status: ${row.status}, Created: ${row.created_at}`);
      });
      
    } else {
      console.log('❌ content_plans table does not exist');
      
      // Check what tables do exist
      const allTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('📋 Available tables:');
      allTables.rows.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  }
}

checkDatabase();