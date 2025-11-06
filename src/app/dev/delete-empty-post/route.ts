import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

function isEmptyPost(p: any): boolean {
  const title = (p?.title ?? '').toString().trim()
  // Treat posts with missing or too-short titles as empty
  if (!title || title.length < 4) return true

  // Optionally consider completely blank content/excerpt
  const excerpt = (p?.excerpt ?? '').toString().trim()
  const hasBody = Boolean(p?.content) || Boolean(p?.articleBody)
  if (!excerpt && !hasBody) return true

  return false
}

export async function GET() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  await payload.auth({ headers })

  const result = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0,
    draft: true,
    overrideAccess: true,
  })

  const candidates = (result?.docs ?? []).filter(isEmptyPost).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug }))
  return NextResponse.json({ count: candidates.length, candidates })
}

export async function POST() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  await payload.auth({ headers })

  const result = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0,
    draft: true,
    overrideAccess: true,
  })

  const docs = (result?.docs ?? [])
  const targets = docs.filter(isEmptyPost)

  const deletedIds: string[] = []
  const errors: { id: string; error: string }[] = []
  for (const doc of targets) {
    try {
      await payload.delete({ collection: 'posts', id: doc.id, overrideAccess: true })
      deletedIds.push(String(doc.id))
    } catch (e: any) {
      errors.push({ id: String(doc.id), error: String(e?.message || e) })
    }
  }

  return NextResponse.json({ deletedCount: deletedIds.length, deletedIds, errors })
}