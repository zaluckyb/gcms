import 'dotenv/config'
import payload from 'payload'
import path from 'node:path'

async function run() {
  const secret = process.env.PAYLOAD_SECRET || 'dev-secret'
  process.env.PAYLOAD_SECRET = secret
  await payload.init({ secret, local: true, config: path.resolve('./src/payload.config.ts') })

  try {
    const media = await payload.find({ collection: 'media', limit: 1 })
    if (!media.docs.length) {
      console.log('No media found. Please upload an image in Admin first.')
      process.exit(0)
    }

    const logoId = media.docs[0].id

    const updated = await payload.updateGlobal({
      slug: 'header',
      data: { logo: logoId },
      overrideAccess: true,
    })

    console.log('Updated Header with logo id:', logoId)
    console.log('Header now:', { id: updated.id, logo: updated.logo })
  } catch (err) {
    console.error('Failed to set header logo:', err)
    process.exit(1)
  }
}

run()