import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug') ?? 'this-is-a-test'

  try {
    const payload = await getPayload({ config: await configPromise })

    // Find the existing post by slug
    const findRes = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    const doc = findRes?.docs?.[0]
    if (!doc) {
      return new Response(JSON.stringify({ ok: false, message: `Post not found for slug: ${slug}` }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    }

    // Minimal valid Lexical rich text content for the article body
    const articleBody = {
       root: {
         type: 'root',
         format: '',
         indent: 0,
         version: 1,
         children: [
           {
             type: 'heading',
             tag: 'h1',
             format: '',
             indent: 0,
             version: 1,
             children: [
               {
                 type: 'text',
                 text: 'Dummy: Exploring Payload CMS with Next.js',
                 format: 0,
                 mode: 'normal',
                 style: '',
                 detail: 0,
                 version: 1,
               },
             ],
           },
           {
             type: 'paragraph',
             format: '',
             indent: 0,
             version: 1,
             children: [
               {
                 type: 'text',
                 text: 'This article demonstrates how content looks when populated. It includes headings, paragraphs, keywords, and comments to mimic a realistic post.',
                 format: 0,
                 mode: 'normal',
                 style: '',
                 detail: 0,
                 version: 1,
               },
             ],
           },
           {
             type: 'paragraph',
             format: '',
             indent: 0,
             version: 1,
             children: [
               {
                 type: 'text',
                 text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                 format: 0,
                 mode: 'normal',
                 style: '',
                 detail: 0,
                 version: 1,
               },
             ],
           },
         ],
       },
    } as const

     const nowISO = new Date().toISOString()

    const d: any = doc
    const data = {
      headline: d.headline || 'Dummy Headline: Payload + Next.js',
      abstract:
        'Quick summary: demonstrating a realistic article layout with filled fields, comments, and metadata.',
      articleSection: 'Technology',
      dateline: 'New York — Oct 23, 2025',
      pageStart: 12,
      pageEnd: 18,
      pagination: 'pp. 12–18',
      speakable: 'Intro and summary sections',
      wordCount: 865,
      about: 'Structured content and headless CMS integration',
      accessMode: 'textual',
      accessibilityFeature: 'altText,captions,highContrast',
      articleBody: articleBody as any,
      author: d.author || undefined,
      datePublished: d.datePublished || nowISO,
      dateModified: nowISO,
      publisher: 'GCMS Publishing',
      inLanguage: 'en',
      keywords: [{ keyword: 'Next.js' }, { keyword: 'Payload' }, { keyword: 'CMS' }],
      license: 'https://creativecommons.org/licenses/by/4.0/',
      comments: [
        {
          content: 'Really enjoying this article! The setup looks clean and the preview is handy.',
          createdAt: nowISO,
        },
        {
          content: 'Can you share the source code for the preview route?',
          createdAt: nowISO,
        },
      ],
      commentCount: 2,
      mainEntityOfPage: `https://example.com/articles/${slug}`,
      isPartOf: 'GCMS Journal',
      url: `http://localhost:3003/posts/${slug}`,
      description:
        'An example article populated with realistic dummy content to verify rendering and layout.',
      identifier: `post-${slug}`,
      sameAs: [{ url: 'https://github.com/example/repo' }, { url: 'https://twitter.com/example' }],
    }

    const updated = await payload.update({
      collection: 'posts',
      id: doc.id,
      data,
      overrideAccess: true,
    })

    return new Response(JSON.stringify({ ok: true, id: updated.id, slug, data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}