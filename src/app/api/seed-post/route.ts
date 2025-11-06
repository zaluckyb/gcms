import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import fs from 'fs/promises'
import path from 'path'
import payloadConfig from '../../../payload.config'

export async function GET() {
  try {
    // Get Payload instance
    const payloadClient = await getPayload({ config: payloadConfig as any })

    const filePath = path.join(process.cwd(), 'documents', 'seed-post.md')
    const raw = await fs.readFile(filePath, 'utf8')

    let seed
    try {
      seed = JSON.parse(raw)
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: 'Seed file is not valid JSON', details: String(e) },
        { status: 400 },
      )
    }

    // Map only known fields; skip upload relations that require existing media IDs
    const toLexical = (str: string) => ({
      root: {
        type: 'root',
        direction: 'ltr',
        format: '',
        indent: 0,
        children: String(str)
          .split(/\n\n+/)
          .map((para) => ({
            type: 'paragraph',
            format: '',
            indent: 0,
            direction: 'ltr',
            children: [
              {
                type: 'text',
                text: para.replace(/\r?\n/g, ' ').trim(),
                format: 0,
                detail: 0,
                mode: 'normal',
              },
            ],
          })),
      },
    })
    const data: any = {
      title: seed.title,
      slug: seed.slug,
      excerpt: seed.excerpt,
      // Store rich text into the content field expected by the Posts collection
      content:
        typeof seed.content === 'string'
          ? toLexical(seed.content)
          : seed.content,
      datePublished: seed.datePublished,
      dateModified: seed.dateModified,
      status: seed.status || 'draft',
      seo: seed.seo
        ? {
          pageTitle: seed.seo.pageTitle,
          metaDescription: seed.seo.metaDescription,
          metaKeywords: seed.seo.metaKeywords,
          metaAuthor: seed.seo.metaAuthor,
          robots: seed.seo.robots,
          canonicalURL: seed.seo.canonicalURL,
          charset: seed.seo.charset,
          viewport: seed.seo.viewport,
          themeColor: seed.seo.themeColor,
          language: seed.seo.language,
          revisitAfter: seed.seo.revisitAfter,
        }
        : undefined,
      openGraph: seed.openGraph,
      twitter: seed.twitter,
      jsonld: seed.jsonld,
      hreflang: seed.hreflang,
      cdnDomain: seed.cdnDomain,
      analyticsOrAdsDomain: seed.analyticsOrAdsDomain,
      preconnect: seed.preconnect,
      dnsPrefetch: seed.dnsPrefetch,
      preloadImages: seed.preloadImages,
      rssLink: seed.rssLink,
      amphtmlLink: seed.amphtmlLink,
      googleSiteVerification: seed.googleSiteVerification,
      bingMsValidate: seed.bingMsValidate,
      yandexVerification: seed.yandexVerification,
      prevURL: seed.prevURL,
      nextURL: seed.nextURL,
      gtmID: seed.gtmID,
      gaMeasurementID: seed.gaMeasurementID,
      facebookPixelID: seed.facebookPixelID,
    }

    // Avoid upload relation fields unless actual media IDs exist
    delete data.featuredImage
    if (data.openGraph) delete data.openGraph.ogImage
    if (data.twitter) delete data.twitter.twitterImage
    if (data.jsonld?.schemaImages) delete data.jsonld.schemaImages
    if (data.jsonld?.schemaPublisher?.logo) delete data.jsonld.schemaPublisher.logo
    if (data.jsonld?.organization?.logo) delete data.jsonld.organization.logo
    delete data.faviconICO
    delete data.iconSVG
    delete data.appleTouchIcon
    delete data.webAppManifest

    // Upsert by slug: update if exists, otherwise create
    const existing = await payloadClient.find({
      collection: 'posts',
      where: { slug: { equals: data.slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing?.docs?.length) {
      const existingDoc = existing.docs[0]
      const updated = await payloadClient.update({
        collection: 'posts',
        id: existingDoc.id,
        data,
        overrideAccess: true,
      })
      return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug, updated: true })
    }

    const created = await payloadClient.create({ collection: 'posts', data, overrideAccess: true })
    return NextResponse.json({ ok: true, id: created.id, slug: created.slug, created: true })
  } catch (err: any) {
    const details = err?.stack || (err?.errors ? JSON.stringify(err.errors) : String(err))
    return NextResponse.json(
      { ok: false, error: err?.message || String(err), details },
      { status: 500 },
    )
  }
}