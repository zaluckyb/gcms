import config from '@payload-config'
import { getPayload } from 'payload'
import { promises as fs } from 'fs'
import path from 'path'

type RawPersona = {
  id?: number
  name: string
  category?: string
  focus?: string
  strengths?: string[]
  uses?: string[]
  personality?: {
    tone?: string
    voice_style?: string
    motivations?: string
    audience_perception?: string
  }
}

function toPayloadPersona(raw: RawPersona) {
  return {
    name: raw.name,
    category: raw.category || '',
    focus: raw.focus || '',
    strengths: (raw.strengths || []).map((s) => ({ value: s })),
    uses: (raw.uses || []).map((u) => ({ value: u })),
    personality: {
      tone: raw.personality?.tone || '',
      voice_style: raw.personality?.voice_style || '',
      motivations: raw.personality?.motivations || '',
      audience_perception: raw.personality?.audience_perception || '',
    },
  }
}

async function readPersonasFile(): Promise<RawPersona[]> {
  const absolute = 'D:/DatabaseCMS/gcms/gcms/documents/personas.md'
  try {
    const content = await fs.readFile(absolute, 'utf8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed?.copywriter_personas)) return parsed.copywriter_personas
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    const fallback = path.resolve(process.cwd(), 'documents/personas.md')
    const content = await fs.readFile(fallback, 'utf8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed?.copywriter_personas)) return parsed.copywriter_personas
    if (Array.isArray(parsed)) return parsed
    return []
  }
}

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  try {
    const rawPersonas = await readPersonasFile()
    let created = 0
    let updated = 0

    for (const raw of rawPersonas) {
      const docData = toPayloadPersona(raw)

      const existing = await payload.find({
        collection: 'personas',
        limit: 1,
        where: { name: { equals: docData.name } },
      })

      if (existing.docs?.length) {
        await payload.update({
          collection: 'personas',
          id: existing.docs[0].id as number,
          data: docData,
          overrideAccess: true,
        })
        updated++
      } else {
        await payload.create({
          collection: 'personas',
          data: docData,
          overrideAccess: true,
        })
        created++
      }
    }

    return Response.json({ ok: true, created, updated, total: rawPersonas.length })
  } catch (e) {
    const msg = (e as Error)?.message || String(e)
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 })
  }
}