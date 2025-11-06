import { NextRequest, NextResponse } from 'next/server'

// Simple per-process rate limit
const WINDOW_MS = 60_000
const MAX_REQUESTS = 5
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

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 500 })

    const ipHeader = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ip = ipHeader.split(',')[0].trim() || 'anonymous'
    if (rateLimited(ip)) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 })
    }

    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    const json = (await res.json().catch(() => ({}))) as {
      data?: { id?: string; object?: string; owned_by?: string }[]
      error?: { message?: string }
    }
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: json?.error?.message || 'Failed to list models' }, { status: 500 })
    }

    const ids = (json?.data || [])
      .filter((m) => typeof m?.id === 'string')
      .map((m) => String(m.id))
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({ ok: true, models: ids })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}