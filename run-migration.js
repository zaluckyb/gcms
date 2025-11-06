const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Read the migration file
const migrationPath = path.join(__dirname, 'src/migrations/20251104_170359_add_content_items_fields.ts')
const migrationContent = fs.readFileSync(migrationPath, 'utf8')

console.log('Migration content:')
console.log(migrationContent)

// Try to run the migration with force
try {
  console.log('\nAttempting to run migration...')
  const result = execSync('npm run payload migrate', {
    stdio: 'pipe',
    env: { ...process.env, FORCE_MIGRATION: 'true' }
  })
  console.log('Migration result:', result.toString())
} catch (error) {
  console.error('Migration failed:', error.message)
  console.log('You may need to manually run the migration or restart the dev server.')
}