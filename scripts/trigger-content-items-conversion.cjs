require('dotenv').config()
const payload = require('payload')

async function main() {
  const planId = process.argv[2]
  if (!planId) {
    console.error('Usage: node scripts/trigger-content-items-conversion.cjs <contentPlanId>')
    process.exit(1)
  }

  try {
    await payload.init({ secret: process.env.PAYLOAD_SECRET, local: true })
    console.log('✅ Payload initialized')

    const plan = await payload.findByID({ collection: 'contentPlans', id: planId })
    if (!plan) {
      console.error(`❌ Content plan ${planId} not found`)
      process.exit(1)
    }

    const hasJSON = typeof plan.description === 'string' && plan.description.trim().startsWith('[')
    const hasItems = Array.isArray(plan.contentItems) && plan.contentItems.length > 0

    console.log(`ℹ️ Plan ${planId}: hasJSON=${hasJSON} contentItems=${hasItems ? plan.contentItems.length : 0}`)

    // Ensure the conversion hook condition passes: contentItems must be empty
    const updateData = { contentItems: [] }

    // Trigger update to run beforeChange conversion logic
    const updated = await payload.update({
      collection: 'contentPlans',
      id: planId,
      data: updateData,
    })

    console.log('✅ Update complete. contentItems count:', updated?.contentItems?.length || 0)
    if (Array.isArray(updated?.contentItems)) {
      const sample = updated.contentItems[0]
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
    }
  } catch (err) {
    console.error('❌ Script failed:', err?.message || err)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()