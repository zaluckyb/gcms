import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { extractPlainText, countWords } from '@/lib/seo-utils'
import type { Post, Site } from '@/payload-types'

type GenerateSEOBody = {
  id?: string | number
  forceOverwrite?: boolean
}

function clampString(str: string, max: number): string {
  if (typeof str !== 'string') return ''
  return str.length > max ? str.slice(0, max).trim() : str.trim()
}

// Removed unused helper "words" to satisfy ESLint and keep file focused

function dedupeKeywords(input: string): string {
  const list = input
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of list) {
    if (!seen.has(k)) {
      seen.add(k)
      out.push(k)
    }
  }
  if (out.length > 8) out.splice(8)
  return out.join(', ')
}

async function callOpenAI(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')

  const model = process.env.SEO_MODEL || 'gpt-4o-mini'
  const body = {
    model,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error?.message || 'OpenAI call failed')
  }
  const content = json?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('No content from OpenAI')
  }
  return content
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: payloadConfig })
    await payload.auth({ headers: req.headers })

    const body = (await req.json().catch(() => ({}))) as GenerateSEOBody
    const id = body?.id
    const force = !!body?.forceOverwrite
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    }

    const doc = (await payload.findByID({ collection: 'posts', id, depth: 1 })) as Post
    if (!doc) {
      return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 })
    }

    const site = (await payload.findGlobal({ slug: 'site' }).catch(() => null)) as Site | null
    const SITE_NAME = site?.siteName || process.env.SITE_NAME || 'Website'
    const SITE_URL = site?.siteUrl || process.env.SITE_URL || ''
    const nowIso = new Date().toISOString()

    const contentPlain = extractPlainText(doc.content || [])
    const localWordCount = countWords(contentPlain)
    const localReadingTime = localWordCount > 0 ? Math.max(1, Math.ceil(localWordCount / 200)) : 0

    const inferredSlug = (doc.slug || '') as string
    const safeSlug = inferredSlug || String(doc.title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `post-${id}`
    const postUrl = SITE_URL ? `${SITE_URL.replace(/\/$/, '')}/posts/${safeSlug}` : ''

    const featuredImageUrl = (typeof doc.featuredImage === 'object' && doc.featuredImage && 'url' in doc.featuredImage) ? doc.featuredImage.url : ''
    const authorName = (doc.author && typeof doc.author === 'object' && 'name' in doc.author) ? (doc.author as { name: string }).name : ''

    const systemPrompt = `You are an expert technical SEO specialist and content strategist.
You must output ONLY valid JSON as specified by the provided JSON schema.
Do not include any text outside of the JSON.
Follow modern SEO best practices (2025): INP-first performance awareness, E-E-A-T tone guidelines, precise metadata, and clean JSON-LD.
Respect character limits and avoid keyword stuffing. Keep language natural and high quality.`

    const userPrompt = `Generate SEO fields for a blog post. Use ONLY the title and content below.
Do not invent facts.
If some site/post info is missing, make sensible, non-fantastical defaults or leave fields empty as instructed.

Site context:
- siteName: ${SITE_NAME}
- siteUrl: ${SITE_URL}
- postUrl: ${postUrl}
- featuredImageUrl (optional): ${featuredImageUrl || ''}
- authorName (optional): ${authorName || ''}
- nowIso: ${nowIso}

Inputs:
- title: ${doc.title || ''}
- content (HTML or rich text → treat as rendered plain text for summaries and counts):
${contentPlain}

Your tasks:
1) Create a compelling, human-sounding excerpt (20–40 words). No emojis, no hashtags.
2) Create an SEO metaDescription that is highly relevant to the page (150–160 chars). No trailing ellipses unless necessary.
3) Generate metaKeywords: between 3 and 8 comma-separated keywords, all lowercase, highly relevant; avoid duplicates, brand names unless in title; no stuffing.
4) Produce a pageTitle (<= 60 chars) that improves CTR, keeps the main topic, and reads naturally. Prefer title case.
5) Set canonicalURL = ${postUrl} exactly.
6) Create Open Graph:
   - ogTitle (<= 60 chars; can match pageTitle or close variant)
   - ogDescription (110–200 chars; persuasive, not spammy)
   - Leave ogImage empty (we won’t set images here).
7) Create Twitter equivalents:
   - twitterTitle (<= 70 chars)
   - twitterDescription (110–200 chars)
   - Leave twitterImage empty.
8) Create JSON-LD (BlogPosting):
   - headline (<= 110 chars; can match pageTitle)
   - description (match metaDescription, or a close semantically equivalent variant)
   - wordCount (integer, count words from provided content)
   - datePublished (ISO; if unknown, leave empty string "")
   - dateModified (ISO; set to ${nowIso})
   - authorName (if provided; else empty string "")
   - mainEntityOfPage.@id = ${postUrl}
   - publisher.name = ${SITE_NAME}
   - image (array) — if featuredImageUrl provided, include it as the sole item; else empty array.
   Ensure valid Schema.org BlogPosting (https://schema.org/BlogPosting).

9) Provide a qualityReport object for internal use (seoComputed):
   - titleLength, metaDescriptionLength, ogDescriptionLength, twitterDescriptionLength
   - keywordCount
   - checks:
       { hasPrimaryTopic:boolean, noKeywordStuffing:boolean, naturalTone:boolean, uniqueVsTitle:boolean, withinCharLimits:boolean }
   - suggestions: short array (<=5) of actionable improvements.

Respect all limits. Output MUST match this JSON schema exactly.

{
  "excerpt": "string (20-40 words)",
  "seo": {
    "pageTitle": "string (<=60 chars)",
    "metaDescription": "string (150-160 chars)",
    "metaKeywords": "string (3-8 comma-separated, lowercase, no extra spaces)",
    "canonicalURL": "string (absolute URL)"
  },
  "openGraph": {
    "ogTitle": "string (<=60 chars)",
    "ogDescription": "string (110-200 chars)"
  },
  "twitter": {
    "twitterTitle": "string (<=70 chars)",
    "twitterDescription": "string (110-200 chars)"
  },
  "jsonld": {
    "headline": "string (<=110 chars)",
    "schemaDescription": "string (≈ metaDescription)",
    "wordCount": 123,
    "datePublished": "string ISO or empty",
    "dateModified": "string ISO",
    "authorName": "string or empty",
    "image": ["absolute URL"]
  },
  "qualityReport": {
    "titleLength": 0,
    "metaDescriptionLength": 0,
    "ogDescriptionLength": 0,
    "twitterDescriptionLength": 0,
    "keywordCount": 0,
    "checks": {
      "hasPrimaryTopic": true,
      "noKeywordStuffing": true,
      "naturalTone": true,
      "uniqueVsTitle": true,
      "withinCharLimits": true
    },
    "suggestions": ["string", "string"]
  }
}`

    let content: string
    try {
      content = await callOpenAI(systemPrompt, userPrompt)
    } catch (_ignore: unknown) {
      // One minimal retry with strict JSON reminder
      content = await callOpenAI(systemPrompt, userPrompt + '\n\nReturn ONLY valid JSON. No commentary.')
    }

    type SEOOutput = {
      excerpt?: string
      seo?: {
        pageTitle?: string
        metaDescription?: string
        metaKeywords?: string
        canonicalURL?: string
      }
      openGraph?: {
        ogTitle?: string
        ogDescription?: string
      }
      twitter?: {
        twitterTitle?: string
        twitterDescription?: string
      }
      jsonld?: {
        headline?: string
        schemaDescription?: string
        wordCount?: number
        datePublished?: string
        dateModified?: string
        authorName?: string
        image?: string[]
      }
      qualityReport?: Record<string, unknown>
    }
    let output: SEOOutput
    try {
      output = JSON.parse(content)
    } catch (_e) {
      return NextResponse.json({ ok: false, error: 'Model returned invalid JSON' }, { status: 400 })
    }

    // Basic validation & adjustments
    let adjusted = false
    output.seo = output.seo ?? {}
    output.openGraph = output.openGraph ?? {}
    output.twitter = output.twitter ?? {}
    output.jsonld = output.jsonld ?? {}
    output.qualityReport = output.qualityReport ?? {}

    // Enforce canonical
    if (postUrl && output.seo && typeof output.seo === 'object' && output.seo.canonicalURL !== postUrl) {
      output.seo.canonicalURL = postUrl
      adjusted = true
    }

    // Trim to char limits
    const limits = {
      pageTitle: 60,
      metaDescription: 160,
      ogDescription: 200,
      twitterTitle: 70,
      twitterDescription: 200,
      headline: 110,
    }
    const seo = output.seo
    const openGraph = output.openGraph
    const twitter = output.twitter
    const jsonld = output.jsonld
    
    seo.pageTitle = clampString(seo.pageTitle ?? '', limits.pageTitle)
    seo.metaDescription = clampString(seo.metaDescription ?? '', limits.metaDescription)
    openGraph.ogTitle = clampString(openGraph.ogTitle ?? seo.pageTitle ?? '', limits.pageTitle)
    openGraph.ogDescription = clampString(openGraph.ogDescription ?? seo.metaDescription ?? '', limits.ogDescription)
    twitter.twitterTitle = clampString(twitter.twitterTitle ?? seo.pageTitle ?? '', limits.twitterTitle)
    twitter.twitterDescription = clampString(twitter.twitterDescription ?? seo.metaDescription ?? '', limits.twitterDescription)
    jsonld.headline = clampString(jsonld.headline ?? seo.pageTitle ?? '', limits.headline)
    jsonld.schemaDescription = clampString(jsonld.schemaDescription ?? seo.metaDescription ?? '', limits.metaDescription)

    // Keywords normalization
    seo.metaKeywords = dedupeKeywords(seo.metaKeywords ?? '')
    const kwCount = seo.metaKeywords ? seo.metaKeywords.split(',').filter(Boolean).length : 0
    if (kwCount < 3 || kwCount > 8) adjusted = true

    // Image array logic
    jsonld.image = Array.isArray(jsonld.image) ? jsonld.image : []
    if (!featuredImageUrl && jsonld.image.length > 0) {
      jsonld.image = []
      adjusted = true
    }
    if (featuredImageUrl && jsonld.image.length === 0) {
      jsonld.image = [featuredImageUrl]
      adjusted = true
    }

    // Word count tolerance: replace with local if off by >10%
    const modelWC = Number(jsonld.wordCount ?? 0) || 0
    if (localWordCount && (modelWC < localWordCount * 0.9 || modelWC > localWordCount * 1.1)) {
      jsonld.wordCount = localWordCount
      adjusted = true
    }

    // Build updates per rules
    const updates: Partial<Post> = {}

    // Excerpt
    const excerptEmpty = !doc.excerpt || String(doc.excerpt).trim().length === 0
    if (force || excerptEmpty) updates.excerpt = output.excerpt ?? ''

    // SEO overrides
    updates.seo = { ...(doc.seo || {}) }
    const updatesSeo = updates.seo!
    if (force || !doc.seo?.pageTitle) updatesSeo.pageTitle = seo.pageTitle ?? ''
    if (force || !doc.seo?.metaDescription) updatesSeo.metaDescription = seo.metaDescription ?? ''
    if (force || !doc.seo?.metaKeywords) updatesSeo.metaKeywords = seo.metaKeywords ?? ''
    if (force || !doc.seo?.canonicalURL) updatesSeo.canonicalURL = seo.canonicalURL ?? postUrl

    // Open Graph
    updates.openGraph = { ...(doc.openGraph || {}) }
    const updatesOpenGraph = updates.openGraph!
    if (force || !doc.openGraph?.ogTitle) updatesOpenGraph.ogTitle = openGraph.ogTitle ?? updatesSeo.pageTitle
    if (force || !doc.openGraph?.ogDescription) updatesOpenGraph.ogDescription = openGraph.ogDescription ?? updatesSeo.metaDescription
    // ogImage left untouched

    // Twitter
    updates.twitter = { ...(doc.twitter || {}) }
    const updatesTwitter = updates.twitter!
    if (force || !doc.twitter?.twitterTitle) updatesTwitter.twitterTitle = twitter.twitterTitle ?? updatesSeo.pageTitle
    if (force || !doc.twitter?.twitterDescription) updatesTwitter.twitterDescription = twitter.twitterDescription ?? updatesSeo.metaDescription
    // twitterImage left untouched

    // JSON-LD overrides
    updates.jsonld = { ...(doc.jsonld || {}) }
    const updatesJsonld = updates.jsonld!
    if (force || !doc.jsonld?.headline) updatesJsonld.headline = jsonld.headline ?? updatesSeo.pageTitle
    if (force || !doc.jsonld?.schemaDescription) updatesJsonld.schemaDescription = jsonld.schemaDescription ?? updatesSeo.metaDescription
    // wordCount mirrors local
    updatesJsonld.wordCount = localWordCount

    // Metadata
    updates.metadata = { ...(doc.metadata || {}) }
    const updatesMetadata = updates.metadata!
    updatesMetadata.wordCount = localWordCount
    updatesMetadata.readingTime = localReadingTime
    updatesMetadata.lastModified = nowIso

    // Dates
    updates.dateModified = nowIso
    if (doc.status === 'published' && !doc.datePublished) {
      updates.datePublished = nowIso
    }

    // Computed quality report
    updates.seoComputed = {
      generatedAt: nowIso,
      modelVersion: process.env.SEO_MODEL || 'gpt-4o-mini',
      report: output.qualityReport || {},
    }

    // Never modify: title, slug, content, featuredImage, author, tags, categories, status, ogImage/twitterImage
    const updated = await payload.update({ collection: 'posts', id, data: updates })

    // Return the updated document so the admin UI can update form fields dynamically
    return NextResponse.json({ ok: true, id: updated.id, adjusted, post: updated })
  } catch (err: unknown) {
    const error = err as Error
    const details = error?.stack || String(err)
    return NextResponse.json({ ok: false, error: error?.message || String(err), details }, { status: 500 })
  }
}