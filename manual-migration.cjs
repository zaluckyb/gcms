require('dotenv').config()
const { Pool } = require('pg')

// Helper function to generate URL-friendly slugs
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

async function manualMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI
  })

  try {
    // Get content plans with JSON data
    const result = await pool.query(`
      SELECT id, topic, description
      FROM content_plans 
      WHERE description IS NOT NULL 
      AND description != '' 
      AND description LIKE '[%'
    `)

    console.log(`Found ${result.rows.length} content plans with JSON data`)

    for (const row of result.rows) {
      console.log(`\nProcessing content plan: ${row.topic} (ID: ${row.id})`)
      
      try {
        const parsedData = JSON.parse(row.description)
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log(`  Converting ${parsedData.length} items...`)
          
          // Clear existing content items for this plan
          await pool.query(`DELETE FROM content_plans_content_items WHERE _parent_id = $1`, [row.id.toString()])
          await pool.query(`DELETE FROM content_plans_content_items_keywords WHERE _parent_id = $1`, [row.id.toString()])
          
          // Insert new content items
          for (let i = 0; i < parsedData.length; i++) {
            const item = parsedData[i]
            const slug = item.slug || generateSlug(item.title || '')
            
            // Insert content item
            const itemResult = await pool.query(`
              INSERT INTO content_plans_content_items 
              (_parent_id, title, slug, description, _order, id) 
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `, [
              row.id.toString(),
              item.title || '',
              slug,
              item.description || '',
              i,
              `${row.id}_${i}`
            ])
            
            // Insert keywords for this item
            if (item.keywords && Array.isArray(item.keywords)) {
              for (let j = 0; j < item.keywords.length; j++) {
                await pool.query(`
                  INSERT INTO content_plans_content_items_keywords 
                  (_parent_id, keyword, _order, id) 
                  VALUES ($1, $2, $3, $4)
                `, [
                  `${row.id}_${i}`,
                  item.keywords[j].trim(),
                  j,
                  `${row.id}_${i}_${j}`
                ])
              }
            }
          }
          
          // Clear the description field
          await pool.query(`UPDATE content_plans SET description = '' WHERE id = $1`, [row.id])
          
          console.log(`  ✓ Successfully migrated ${parsedData.length} content items`)
        }
      } catch (error) {
        console.error(`  ✗ Error processing plan ${row.id}:`, error.message)
      }
    }

    console.log('\nMigration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await pool.end()
  }
}

manualMigration()