import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import type { Post } from '@/payload-types'

// In-memory rate limit (per process). Suitable as a safety net.
const WINDOW_MS = 60_000
const MAX_REQUESTS = 3
const buckets = new Map<string, { count: number; start: number }>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now - entry.start > WINDOW_MS) {
    buckets.set(key, { count: 1, start: now })
    return false
  }
  entry.count += 1
  buckets.set(key, entry)
  return entry.count > MAX_REQUESTS
}

function getClientKey(req: NextRequest, userId?: string | number | null): string {
  const ipHeader = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  const ip = ipHeader.split(',')[0].trim()
  return String(userId || ip || 'anonymous')
}

// Try to parse JSON content; if it fails, attempt to extract the first JSON block
function safeParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {}
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }
  return null
}

async function callOpenAIForArticle(
  prompt: string,
  opts?: { instructions?: string[]; model?: string },
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')

const model = (opts?.model && String(opts.model)) || process.env.ARTICLE_MODEL || 'gpt-5'
  const instructions = Array.isArray(opts?.instructions) ? opts!.instructions.filter(Boolean) : []

  // Helper to call OpenAI chat with graceful retry when 'temperature' is unsupported
  async function chatWithTemperatureFallback(
    body: { model: string; temperature?: number; messages: { role: 'system' | 'user'; content: string }[] },
  ) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
    type ChatCompletion = {
      choices?: { message?: { content?: string | null } | null }[]
      error?: { message?: string }
    }
    const json = (await res.json().catch(() => ({}))) as ChatCompletion
    if (!res.ok) {
      const msg = json?.error?.message || ''
      const tempUnsupported = /temperature/i.test(msg) && /unsupported|does not support|Only the default \(1\)/i.test(msg)
      if (tempUnsupported && typeof body.temperature !== 'undefined') {
        const { temperature, ...rest } = body
        const res2 = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(rest),
        })
        const json2 = (await res2.json().catch(() => ({}))) as ChatCompletion
        if (!res2.ok) throw new Error(json2?.error?.message || 'OpenAI call failed')
        return json2
      }
      throw new Error(json?.error?.message || 'OpenAI call failed')
    }
    return json
  }

  // Step 1: Generate a JSON prompt via a "Senior AI Prompt Engineer"
  const engineerSystem = `You are a Senior AI Prompt Engineer.
Goal: create a high-quality generation prompt from the provided Post Content Draft to produce a world-class article.
Output the prompt strictly as JSON (no commentary). Include clear fields such as objectives, audience, voice, outline, constraints, keywords, sources, editorial_rules. If editorial instructions are provided, include them under 'editorial_rules'.`
  const editorialList = instructions.length
    ? `Editorial instructions:\n${instructions.map((i) => `- ${i}`).join('\n')}\n\n`
    : ''
  const engineerUser = `${editorialList}Post Content Draft (JSON or text):\n${prompt}\n\nReturn only JSON.`

  const step1 = {
    model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: engineerSystem },
      { role: 'user', content: engineerUser },
    ],
  }

  const j1 = await chatWithTemperatureFallback(step1)
  const promptJsonText = j1?.choices?.[0]?.message?.content || ''
  const promptJson = safeParseJson(promptJsonText)

  // If we couldn't build a structured prompt, fallback to one-step generation
  const writerSystem = `You are a senior content writer creating well-structured, factually careful articles.
Write in clear, engaging English with scannable sections and natural subheadings.
SEO heading rules: Do not use H1; use H2 for main sections and H3 for subsections.
If a 'headers' outline is provided, follow it faithfully using H2/H3.
Output strictly in Markdown without code fences. Avoid HTML.`

  if (!promptJson) {
    const fallbackUser = `${editorialList}Draft input (use as source, expand and structure logically):\n${prompt}\n\nHeading rules: Use H2 for main sections and H3 for subsections. Do not include any H1.`
    const body = {
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: writerSystem },
        { role: 'user', content: fallbackUser },
      ],
    }
    const json = await chatWithTemperatureFallback(body)
    const content = json?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') throw new Error('No content from OpenAI')
    return content
  }

  // Step 2: Use the generated prompt JSON to write the article
  const writerUser = `Use the following generation prompt (JSON) to write the article:\n${JSON.stringify(
    promptJson,
  )}\n\nUse the Post Content Draft below as source context. Return Markdown only (no code fences, no JSON).\n\nHeading rules: Use H2 for main sections and H3 for subsections. Do not include any H1.\n\nDraft input:\n${prompt}`

  const step2 = {
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: writerSystem },
      { role: 'user', content: writerUser },
    ],
  }

  const j2 = await chatWithTemperatureFallback(step2)
  const content2 = j2?.choices?.[0]?.message?.content
  if (!content2 || typeof content2 !== 'string') throw new Error('No content from OpenAI (step 2)')
  return content2
}

// Convert Markdown to minimal Lexical JSON compatible with Payload richText-lexical
function markdownToLexical(md: string): Post['content'] {
  const blocks = md
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean)

  const children: unknown[] = []

  const makeText = (text: string) => ({
    type: 'text',
    text,
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    version: 1,
  })

  const makeParagraph = (text: string) => ({
    type: 'paragraph',
    format: '',
    indent: 0,
    direction: 'ltr',
    version: 1,
    children: [makeText(text.replace(/\s+/g, ' '))],
  })

  const makeHeading = (text: string, level: number) => ({
    type: 'heading',
    tag: level <= 2 ? 'h2' : 'h3',
    format: '',
    indent: 0,
    direction: 'ltr',
    version: 1,
    children: [makeText(text)],
  })

  for (const block of blocks) {
    if (/^#{1,6}\s+/.test(block)) {
      const hashMatch = block.match(/^#{1,6}/)
      const levelRaw = hashMatch ? hashMatch[0].length : 2
      // Clamp to avoid H1: map 1->2, 2->2, 3-6->3
      const level = levelRaw <= 2 ? 2 : 3
      const text = block.replace(/^#{1,6}\s+/, '').trim()
      children.push(makeHeading(text, level))
    } else {
      children.push(makeParagraph(block))
    }
  }

  if (children.length === 0) {
    children.push(makeParagraph(md.trim()))
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      direction: 'ltr',
      version: 1,
      children: children as unknown as Post['content']['root']['children'],
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: payloadConfig })

    // Attempt to authenticate and extract user id for rate limiting key
    const authRes = await payload.auth({ headers: req.headers }).catch(() => null)
    const userId = (authRes as unknown as { user?: { id?: string | number } } | null)?.user?.id ?? null

    const body = (await req.json().catch(() => ({}))) as {
      id?: string | number
      model?: string
    }

    const id = body?.id
    // extract instructions from JSON draft if available

    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })

    const key = getClientKey(req, userId)
    if (rateLimited(key)) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const doc = (await payload.findByID({ collection: 'posts', id, depth: 0 })) as Post
    if (!doc) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 })

    const draft = doc.postContentDraft || ''
    if (!draft || typeof draft !== 'string' || !draft.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Post Content Draft is empty. Add draft text first.' },
        { status: 400 },
      )
    }

    let md: string
    let instructions: string[] = []
    let printableDraft = draft
    try {
      const parsed = JSON.parse(draft)
      instructions = Array.isArray(parsed?.instructions)
        ? parsed.instructions.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0)
        : []
      printableDraft = JSON.stringify(parsed, null, 2)
    } catch {
      // leave instructions empty; printableDraft is raw draft string
    }
    const modelOverride = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : undefined
    const fallbackModel = process.env.ARTICLE_FALLBACK_MODEL || 'gpt-4o-mini'

    try {
      md = await callOpenAIForArticle(printableDraft, { instructions, model: modelOverride })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      const looksLikeModelIssue = /model/i.test(message) && /(not found|does not exist|unknown|deprecated)/i.test(message)
      const nextModel = looksLikeModelIssue ? fallbackModel : (modelOverride || process.env.ARTICLE_MODEL || 'gpt-5')
      // Retry with stricter instruction and possibly a safer fallback model
      md = await callOpenAIForArticle(
        printableDraft + '\n\nReturn Markdown only. No code fences, no JSON.',
        { instructions, model: nextModel },
      )
    }

    // Convert Markdown to Lexical JSON compatible with Payload richText-lexical
    const content = markdownToLexical(md)

    // Update post content only, keep all other metadata
    const updated = (await payload.update({
      collection: 'posts',
      id,
      data: { content },
    })) as Post

    return NextResponse.json({ ok: true, post: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    // eslint-disable-next-line no-console
    console.error('generate-article error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}