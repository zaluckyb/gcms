import 'dotenv/config'
import payload from 'payload'
import path from 'node:path'
import pg from 'pg'

const { Pool } = pg

async function main() {
  const secret = process.env.PAYLOAD_SECRET || 'dev-secret'
  process.env.PAYLOAD_SECRET = secret

  await payload.init({ secret, local: true, config: path.resolve('./src/payload.config.ts') })
  console.log('✅ Payload initialized')

  // Pick an existing user for required owner relationship
  const users = await payload.find({ collection: 'users', limit: 1 })
  if (!users?.docs?.length) {
    console.error('❌ No users found; cannot create a content plan with required owner')
    process.exit(1)
  }
  const ownerId = users.docs[0].id
  console.log('👤 Using owner id:', ownerId)

  // Create a test content plan with one content item including image_prompts array
  const testTopic = `Test Plan - image_prompts ${new Date().toISOString()}`
  const createRes = await payload.create({
    collection: 'contentPlans',
    data: {
      owner: ownerId,
      topic: testTopic,
      status: 'draft',
      contentItems: [
        {
          title: 'Test Item for image_prompts',
          slug: 'test-item-image-prompts',
          description: 'Verifying dynamic image prompts persistence',
          image_prompts: [
            { prompt: 'A futuristic city skyline at sunset, neon glow' },
            { prompt: 'A cozy reading nook by a window, soft morning light' },
          ],
        },
      ],
    },
    depth: 2,
  })

  console.log('🆕 Created content plan:', createRes.id)
  const item = Array.isArray(createRes?.contentItems) ? createRes.contentItems[0] : null
  if (!item) {
    console.error('❌ No content item was created; aborting')
    await payload.delete({ collection: 'contentPlans', where: { id: { equals: createRes.id } }, overrideAccess: true })
    process.exit(1)
  }
  console.log('🧩 Content item id:', item.id)

  // Verify in Postgres child table
  const pool = new Pool({ connectionString: process.env.DATABASE_URI })
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT id, _order, prompt FROM content_plans_content_items_image_prompts WHERE _parent_id = $1 ORDER BY _order;`,
      [item.id]
    )
    console.log('🔎 Found image_prompts rows:', rows.length)
    rows.forEach(r => console.log('  -', r))
  } finally {
    client.release()
    await pool.end()
  }

  // Cleanup the test document to keep DB clean
  await payload.delete({ collection: 'contentPlans', where: { id: { equals: createRes.id } }, overrideAccess: true })
  console.log('🧹 Cleaned up test content plan')
}

main().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})