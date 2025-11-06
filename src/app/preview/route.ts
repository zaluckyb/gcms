import type { CollectionSlug } from 'payload'
import { getPayload } from 'payload'
import { draftMode, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const collection = searchParams.get('collection') as CollectionSlug | null
  const slug = searchParams.get('slug')
  const previewSecret = searchParams.get('previewSecret') ?? ''
  const token = searchParams.get('token') ?? ''

  if (!path || !collection || !slug) {
    return new Response('Insufficient search params', { status: 400 })
  }

  if (!path.startsWith('/')) {
    return new Response('Path must be relative and start with /', { status: 400 })
  }

  const envSecret = process.env.PREVIEW_SECRET ?? ''
  if (envSecret && previewSecret !== envSecret) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  // Enable Next.js draft mode
  (await draftMode()).enable()

  // Persist the admin session token so SSR queries can authenticate
  if (token) {
    (await cookies()).set('payload-token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  // Optionally verify the doc exists to fail fast (non-blocking)
  try {
    const payload = await getPayload({ config: await configPromise })
    const result = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
    if (!result?.docs?.[0]) {
      // Continue regardless; frontend can render 404
    }
  } catch {
    // Swallow errors; preview should still redirect
  }

  // Redirect to the front-end path
  redirect(path)
}