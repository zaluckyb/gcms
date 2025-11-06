import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

function getSlug(req: NextRequest): string | null {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  return slug && slug.trim().length > 0 ? slug.trim() : null
}

export async function GET(req: NextRequest) {
  const slug = getSlug(req)
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'Missing slug query param' }, { status: 400 })
  }

  const payload = await getPayload({ config: payloadConfig })
  // Authenticate using incoming headers in case admin session cookies exist
  await payload.auth({ headers: req.headers })

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const doc = result.docs?.[0]
  if (!doc) {
    return NextResponse.json({ ok: true, found: false, slug })
  }

  return NextResponse.json({
    ok: true,
    found: true,
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    status: doc.status,
  })
}

export async function POST(req: NextRequest) {
  const slug = getSlug(req)
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'Missing slug query param' }, { status: 400 })
  }

  const payload = await getPayload({ config: payloadConfig })
  await payload.auth({ headers: req.headers })

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const doc = result.docs?.[0]
  if (!doc) {
    return NextResponse.json({ ok: false, error: 'Post not found', slug }, { status: 404 })
  }

  await payload.delete({ collection: 'posts', id: doc.id })

  return NextResponse.json({ ok: true, deleted: true, id: doc.id, slug, title: doc.title })
}