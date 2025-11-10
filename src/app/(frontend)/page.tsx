// ... existing code ...
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import config from '@/payload.config'
import HomeHero from '@/components/HomeHero'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  await payload.auth({ headers })

  return (
    <main>
      <HomeHero />
    </main>
  )
}
