import config from '@payload-config'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  try {
    await payload.db.drizzle.execute(sql`
      UPDATE "posts"
      SET "slug" = CONCAT('post-', "id")
      WHERE ("slug" IS NULL OR "slug" = '');
    `)
    return Response.json({ ok: true })
  } catch (e) {
    const msg = (e as Error)?.message || String(e)
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 })
  }
}