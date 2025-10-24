import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getHeaders, draftMode } from 'next/headers.js'
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  await payload.auth({ headers })
  const isDraft = (await draftMode()).isEnabled
  const result = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 2, draft: isDraft })
  const post = result.docs?.[0]
  if (!post) return { title: 'Post not found' }
  return { title: post.headline ?? 'Post', description: post.description ?? undefined }
}

export default async function PostBySlugPage({ params }: { params: { slug: string } }) {
  const { slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  await payload.auth({ headers })
  const isDraft = (await draftMode()).isEnabled
  const result = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 2, draft: isDraft })
  const post = result.docs?.[0]
  if (!post) return notFound()

  const authorLabel = (() => {
    const a = post.author
    if (!a) return null
    if (typeof a === 'object' && 'email' in a) return a.email as string
    if (typeof a === 'string') return a
    return null
  })()

  const readMinutes = Math.max(1, Math.ceil(((post.wordCount ?? 0) as number) / 200))
  const section = post.articleSection as string | undefined
  const lang = post.inLanguage as string | undefined
  const isPartOf = post.isPartOf as string | undefined

  const displayDate = (post.datePublished ?? post.createdAt ?? new Date().toISOString()) as string

  return (
    <>
      <ReadingProgress />
      <PostHeader title={post.headline ?? 'Post'} excerpt={post.description ?? undefined} date={displayDate} />

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
          {Array.isArray(post.keywords) && post.keywords.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((k: any, i: number) => (
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
                <RichText data={post.articleBody} />
              </article>

              {/* SameAs links */}
              {Array.isArray(post.sameAs) && post.sameAs.length > 0 && (
                <div className="mt-12 w-full max-w-prose">
                  <h3 className="text-sm font-semibold text-white/80 mb-2">References</h3>
                  <ul className="flex flex-wrap gap-3">
                    {post.sameAs.map((ref: any, i: number) => (
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
              {Array.isArray(post.comments) && post.comments.length > 0 && (
                <section className="mt-12 w-full max-w-prose">
                  <h2 className="text-xl font-semibold mb-4">Comments ({post.commentCount ?? post.comments.length})</h2>
                  <ul className="space-y-4">
                    {post.comments.map((c: any, i: number) => (
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
                {post.dateModified && <div>Last updated {formatDate(post.dateModified)}</div>}
                {post.license && (
                  <div className="mt-1">
                    License: <a href={post.license} className="text-accent hover:underline">{post.license}</a>
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
}