import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { 
  buildMetadata, 
  buildJsonLd, 
  type Post as PostType, 
  type SiteConfig 
} from '@/lib/seo-utils'
import { getSiteConfigSafely } from '@/lib/fallback-handler'
import { headers as getHeaders, draftMode } from 'next/headers'
import RichTextContent from '@/components/RichTextContent'
import ReadingProgress from '@/components/ReadingProgress'
import StickyTOC from '@/components/StickyTOC'
import ShareMenu from '@/components/ShareMenu'
import Section from '@/components/Section'
import Container from '@/components/Container'
import PostHeader from '@/components/PostHeader'
import { PostNeighborNav } from '@/components/PostNeighborNav'
import type { Post as PayloadPost, User, Category, Tag } from '@/payload-types'

// typed helpers for Payload where filters used below
type Comparison<T> = { equals?: T; less_than?: T; greater_than?: T; not_equals?: T }

type PostWhere = Partial<{
  status: Comparison<PayloadPost['status']>
  id: Comparison<PayloadPost['id']>
  slug: Comparison<string>
  datePublished: Comparison<string>
  createdAt: Comparison<string>
}>

// optional extensions used by the page for legacy fields
type ExtendedPost = PayloadPost & {
  keywords?: Array<string | { keyword?: string }>
  sameAs?: Array<string | { url?: string }>
  comments?: Array<{ author?: string | User; createdAt?: string; content?: string }>
  commentCount?: number
  license?: string
  articleSection?: string
  inLanguage?: string
  isPartOf?: string
}

// Normalize media for neighbor nav to avoid number union
const toNeighborMedia = (img: unknown): { url?: string; alt?: string; filename?: string } | null => {
  if (img && typeof img === 'object') {
    const m = img as { url?: string; alt?: string; filename?: string }
    return { url: m.url, alt: m.alt, filename: m.filename }
  }
  return null
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).format(date)
  } catch {
    return ''
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  await payload.auth({ headers })
  const isDraft = (await draftMode()).isEnabled
  
  try {
    // Get site configuration
    const siteConfig = await getSiteConfigSafely(payload)
    
    // Get post
    const result = await payload.find({ 
      collection: 'posts', 
      where: { slug: { equals: slug } }, 
      limit: 1, 
      depth: 2, 
      draft: isDraft, 
      overrideAccess: isDraft 
    }) as { docs: PayloadPost[] }
    
    const post = result.docs?.[0]
    if (!post) {
      return { 
        title: 'Post not found', 
        robots: { index: false, follow: false } 
      }
    }
    
    return buildMetadata(post as unknown as PostType, siteConfig)
  } catch (error) {
    console.error('Error generating metadata:', error)
    return { 
      title: 'Error loading post', 
      robots: { index: false, follow: false } 
    }
  }
}
 
export default async function PostBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  await payload.auth({ headers })
  const isDraft = (await draftMode()).isEnabled
  
  try {
    // Get site configuration
    const siteConfig = await getSiteConfigSafely(payload)
    
    // Get post
    const result = await payload.find({ 
      collection: 'posts', 
      where: { slug: { equals: slug } }, 
      limit: 1, 
      depth: 2, 
      draft: isDraft, 
      overrideAccess: isDraft 
    }) as { docs: PayloadPost[] }
    
    const post = result.docs?.[0]
    if (!post) return notFound()

  const ext = post as ExtendedPost

  const authorLabel = (() => {
    const a = post.author
    if (!a) return null
    if (typeof a === 'object' && 'email' in a) return (a.email ?? null) as string | null
    return null
  })()

  const readMinutes = Math.max(1, Math.ceil((post.jsonld?.wordCount ?? 0) / 200))
  const section = ext.articleSection ?? (Array.isArray(post.categories) && post.categories.length > 0
    ? (typeof post.categories[0] === 'object' ? (post.categories[0] as Category).name ?? undefined : undefined)
    : undefined)
  const lang = ext.inLanguage ?? siteConfig.schemaDefaults?.inLanguage ?? undefined
  const isPartOf = ext.isPartOf

  const displayDate = (post.datePublished ?? post.createdAt ?? new Date().toISOString())

  const displayTitle =
    post.title ||
    post.seo?.pageTitle ||
    post.jsonld?.headline ||
    'Post'

  const displayExcerpt =
    post.excerpt ||
    post.seo?.metaDescription ||
    post.jsonld?.schemaDescription ||
    undefined

  const richData: PayloadPost['content'] | null = post.content ?? null

  // Determine previous and next posts by publish date (fallback to createdAt)
  const orderField: 'datePublished' | 'createdAt' = post.datePublished ? 'datePublished' : 'createdAt'
  const pivotDate: string = (post[orderField] ?? new Date().toISOString()) as string

  const statusFilter: PostWhere = isDraft ? {} : { status: { equals: 'published' } }

  const prevWhere: PostWhere = orderField === 'datePublished'
    ? { ...statusFilter, datePublished: { less_than: pivotDate } }
    : { ...statusFilter, createdAt: { less_than: pivotDate } }

  const prevRes = await payload.find({
    collection: 'posts',
    where: prevWhere,
    sort: `-${orderField}`,
    limit: 1,
    depth: 1,
    draft: isDraft,
    overrideAccess: isDraft,
  }) as { docs: PayloadPost[] }

  const nextWhere: PostWhere = orderField === 'datePublished'
    ? { ...statusFilter, datePublished: { greater_than: pivotDate } }
    : { ...statusFilter, createdAt: { greater_than: pivotDate } }

  const nextRes = await payload.find({
    collection: 'posts',
    where: nextWhere,
    sort: orderField,
    limit: 1,
    depth: 1,
    draft: isDraft,
    overrideAccess: isDraft,
  }) as { docs: PayloadPost[] }

  const prevPost = prevRes.docs?.[0]
  const nextPost = nextRes.docs?.[0]

  // Fallback: wrap-around neighbors to ensure navigation is always present
  let prevFallback: PayloadPost | null = null
  if (!prevPost) {
    const resPrev = await payload.find({
      collection: 'posts',
      where: { ...statusFilter, id: { not_equals: post.id } },
      sort: `-${orderField}`,
      limit: 1,
      depth: 1,
      draft: isDraft,
      overrideAccess: isDraft,
    })
    prevFallback = (resPrev as { docs: PayloadPost[] }).docs?.[0] ?? null
  }

  let nextFallback: PayloadPost | null = null
  if (!nextPost) {
    const resNext = await payload.find({
      collection: 'posts',
      where: { ...statusFilter, id: { not_equals: post.id } },
      sort: orderField,
      limit: 1,
      depth: 1,
      draft: isDraft,
      overrideAccess: isDraft,
    })
    nextFallback = (resNext as { docs: PayloadPost[] }).docs?.[0] ?? null
  }

  const prevToShow: PayloadPost | null = prevPost ?? prevFallback ?? null
  const nextToShow: PayloadPost | null = nextPost ?? nextFallback ?? null

    return (
      <>
        {/* Canonical + JSON-LD for SEO */}
        <ArticleSEO post={post as unknown as PostType} siteConfig={siteConfig} />
        <ReadingProgress />
        {/* Hero header with featured image background when available */}
        {(() => {
          const img = post.featuredImage as unknown as { url?: string; filename?: string; alt?: string } | null
          const bgUrl = img?.url ?? (img?.filename ? `/api/media/file/${img.filename}` : undefined)
          const bgAlt = img?.alt ?? ''
          return (
            <PostHeader
              title={displayTitle}
              excerpt={displayExcerpt}
              date={displayDate}
              bgImageUrl={bgUrl}
              bgAlt={bgAlt}
              meta={{
                authorLabel,
                section,
                lang,
                readMinutes,
                isPartOf,
                showShare: true,
              }}
            />
          )
        })()}

      <Section>
        <Container>
          {/* Tags */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs uppercase tracking-wide rounded-full border border-white/10 bg-white/5 text-white/70 px-2.5 py-1"
                  >
                    {typeof t === 'object' ? (t as Tag).name : `tag-${String(t)}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main content grid with sticky TOC */}
          <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
            <div>
              {/* Article */}
              <article id="article-content" className="prose prose-invert prose-lg w-full max-w-prose prose-a:text-accent prose-a:underline prose-hr:border-line prose-img:rounded-xl2 prose-code:bg-panel/60 prose-code:border prose-code:border-line prose-code:rounded prose-code:px-1.5">
  {richData ? <RichTextContent content={richData} /> : null}
              </article>

              {/* Prev / Next navigation */}
              <div className="mt-10 w-full max-w-prose">
                <PostNeighborNav
                  prev={{
                    slug: prevToShow?.slug,
                    title: prevToShow?.title,
                    featuredImage: toNeighborMedia(prevToShow?.featuredImage),
                  }}
                  next={{
                    slug: nextToShow?.slug,
                    title: nextToShow?.title,
                    featuredImage: toNeighborMedia(nextToShow?.featuredImage),
                  }}
                />
              </div>

              {/* SameAs links */}
              {Array.isArray(ext.sameAs) && ext.sameAs.length > 0 && (
                <div className="mt-12 w-full max-w-prose">
                  <h3 className="text-sm font-semibold text-white/80 mb-2">References</h3>
                  <ul className="flex flex-wrap gap-3">
                    {ext.sameAs.map((ref, i) => (
                      <li key={i}>
                        <a
                          href={typeof ref === 'string' ? ref : ref?.url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          {typeof ref === 'string' ? ref : ref?.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Comments */}
              {Array.isArray(ext.comments) && ext.comments.length > 0 && (
                <section className="mt-12 w-full max-w-prose">
                  <h2 className="text-xl font-semibold mb-4">Comments ({ext.commentCount ?? ext.comments.length})</h2>
                  <ul className="space-y-4">
                    {ext.comments.map((c, i) => (
                      <li key={i} className="bg-panel/60 border border-line rounded p-4">
                        <div className="text-sm text-white/60 mb-2">
                          {c.author ? (
                            <span>{
                              typeof c.author === 'object' && 'email' in c.author
                                ? (c.author as User).email ?? ''
                                : String(c.author)
                            }</span>
                          ) : (
                            <span>Anonymous</span>
                          )}
                          {c.createdAt && <span className="ml-2">• {formatDate(c.createdAt)}</span>}
                        </div>
                        <p className="text-white/80">{c.content}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="mt-12 w-full max-w-prose text-sm text-white/60">
                {post.dateModified && <div>Last updated {formatDate(post.dateModified)}</div>}
                {ext.license && (
                  <div className="mt-1">
                    License: <a href={ext.license} className="text-accent hover:underline">{ext.license}</a>
                  </div>
                )}
              </footer>
            </div>
            <aside className="hidden lg:block">
              <StickyTOC articleId="article-content" />
            </aside>
          </div>
        </Container>
      </Section>
    </>
    )
  } catch (error) {
    console.error('Error loading post:', error)
    return notFound()
  }
}

function ArticleSEO({ post, siteConfig }: { post: PostType; siteConfig: SiteConfig }) {
  const canonical = post?.seo?.canonicalURL || `${siteConfig.siteUrl}/posts/${post?.slug}`
  const graph = buildJsonLd(post, siteConfig)

  return (
    <>
      <link rel="canonical" href={canonical} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </>
  )
}