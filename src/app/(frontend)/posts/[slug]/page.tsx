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
import { RichText } from '@payloadcms/richtext-lexical/react'
import ReadingProgress from '@/components/ReadingProgress'
import StickyTOC from '@/components/StickyTOC'
import ShareMenu from '@/components/ShareMenu'
import Section from '@/components/Section'
import Container from '@/components/Container'
import PostHeader from '@/components/PostHeader'

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
    })
    
    const post = result.docs?.[0]
    if (!post) {
      return { 
        title: 'Post not found', 
        robots: { index: false, follow: false } 
      }
    }
    
    return buildMetadata(post as PostType, siteConfig)
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
    })
    
    const post = result.docs?.[0]
    if (!post) return notFound()

  const authorLabel = (() => {
    const a = (post as any).author
    if (!a) return null
    if (typeof a === 'object' && 'email' in a) return a.email as string
    if (typeof a === 'string') return a
    return null
  })()

  const readMinutes = Math.max(1, Math.ceil((((post as any)?.jsonld?.wordCount ?? 0) as number) / 200))
  const section = (post as any).articleSection as string | undefined
  const lang = (post as any).inLanguage as string | undefined
  const isPartOf = (post as any).isPartOf as string | undefined

  const displayDate = (post.datePublished ?? post.createdAt ?? new Date().toISOString()) as string

  const displayTitle =
    (post as any).headline ||
    (post as any).title ||
    (post as any)?.seo?.pageTitle ||
    (post as any)?.jsonld?.headline ||
    'Post'

  const displayExcerpt =
    (post as any).description ||
    (post as any).excerpt ||
    (post as any)?.seo?.metaDescription ||
    (post as any)?.jsonld?.schemaDescription ||
    undefined

  const richData = (post as any).articleBody ?? (post as any).content

    return (
      <>
        {/* Canonical + JSON-LD for SEO */}
        <ArticleSEO post={post as PostType} siteConfig={siteConfig} />
        <ReadingProgress />
        <PostHeader title={displayTitle} excerpt={displayExcerpt} date={displayDate} />

      {/* Meta chips & share */}
      <Section>
        <Container>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {authorLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-1.5 text-xs shadow-subtle">
                👤 {authorLabel}
              </span>
            )}
            {post.datePublished && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-1.5 text-xs shadow-subtle">
                📅 {formatDate(post.datePublished)}
              </span>
            )}
            {section && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-1.5 text-xs shadow-subtle">
                🏷️ {section}
              </span>
            )}
            {lang && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-1.5 text-xs shadow-subtle">
                🌐 {lang}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-1.5 text-xs shadow-subtle">
              ⏱️ {readMinutes} min read
            </span>
            {isPartOf && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-1.5 text-xs shadow-subtle">
                📚 {isPartOf}
              </span>
            )}
            <span className="ml-auto"><ShareMenu /></span>
          </div>

          {/* Tags */}
          {Array.isArray((post as any).keywords) && (post as any).keywords.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {(post as any).keywords.map((k: any, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs uppercase tracking-wide rounded-full border border-white/10 bg-white/5 text-white/70 px-2.5 py-1"
                  >
                    {typeof k === 'string' ? k : k?.keyword}
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
                {richData ? <RichText data={richData as any} /> : null}
              </article>

              {/* SameAs links */}
              {Array.isArray((post as any).sameAs) && (post as any).sameAs.length > 0 && (
                <div className="mt-12 w-full max-w-prose">
                  <h3 className="text-sm font-semibold text-white/80 mb-2">References</h3>
                  <ul className="flex flex-wrap gap-3">
                    {(post as any).sameAs.map((ref: any, i: number) => (
                      <li key={i}>
                        <a
                          href={typeof ref === 'string' ? ref : ref?.url}
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
              {Array.isArray((post as any).comments) && (post as any).comments.length > 0 && (
                <section className="mt-12 w-full max-w-prose">
                  <h2 className="text-xl font-semibold mb-4">Comments ({(post as any).commentCount ?? (post as any).comments.length})</h2>
                  <ul className="space-y-4">
                    {(post as any).comments.map((c: any, i: number) => (
                      <li key={i} className="bg-panel/60 border border-line rounded p-4">
                        <div className="text-sm text-white/60 mb-2">
                          {c.author ? (
                            <span>{
                              typeof c.author === 'object' && 'email' in c.author
                                ? (c.author as any).email
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
                {(post as any).dateModified && <div>Last updated {formatDate((post as any).dateModified)}</div>}
                {(post as any).license && (
                  <div className="mt-1">
                    License: <a href={(post as any).license} className="text-accent hover:underline">{(post as any).license}</a>
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