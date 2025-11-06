import 'dotenv/config'
import payload from 'payload'
import path from 'node:path'

async function main() {
  const planId = process.argv[2]
  if (!planId) {
    console.error('Usage: node scripts/trigger-content-items-conversion.mjs <contentPlanId>')
    process.exit(1)
  }

  try {
    const secret = process.env.PAYLOAD_SECRET || 'dev-secret'
    process.env.PAYLOAD_SECRET = secret
    await payload.init({ secret, local: true, config: path.resolve('./src/payload.config.ts') })
    console.log('✅ Payload initialized')

    const plan = await payload.findByID({ collection: 'contentPlans', id: planId })
    if (!plan) {
      console.error(`❌ Content plan ${planId} not found`)
      process.exit(1)
    }

    const desc = typeof plan.description === 'string' ? plan.description : ''
    const hasJSON = desc.trim().startsWith('[')
    const hasItems = Array.isArray(plan.contentItems) && plan.contentItems.length > 0
    console.log(`ℹ️ Plan ${planId}: hasJSON=${hasJSON} contentItems=${hasItems ? plan.contentItems.length : 0}`)

    const updated = await payload.update({
      collection: 'contentPlans',
      id: planId,
      data: {
        // ensure conversion precondition passes
        contentItems: [],
        description: desc,
      },
      depth: 2,
    })

    console.log('✅ Update complete. contentItems count:', Array.isArray(updated?.contentItems) ? updated.contentItems.length : 0)
    const sample = Array.isArray(updated?.contentItems) ? updated.contentItems[0] : null
    if (sample) {
      console.log('🔎 Sample item:', {
        title: sample.title,
        slug: sample.slug,
        prompt: sample.prompt,
        audience: sample.audience,
        goal: sample.goal,
        region: sample.region,
        word_count: sample.word_count,
        keywords: Array.isArray(sample.keywords) ? sample.keywords.length : 0,
      })
    }
  } catch (err) {
    console.error('❌ Script failed:', err?.message || err)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()