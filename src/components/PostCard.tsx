import React from 'react'
import Link from 'next/link'

function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
  } catch {
    return ''
  }
}

function getReadMinutes(wordCount?: number | null): number {
  const wc = typeof wordCount === 'number' && wordCount > 0 ? wordCount : 400
  return Math.max(1, Math.ceil(wc / 200))
}

export default function PostCard({ post }: { post: Post }) {
  const authorLabel = (() => {
    const a =
      (post.openGraph as any)?.articleAuthor ||
      // Fallback for any custom author field that may exist
      (post as unknown as { author?: string | { email?: string; name?: string } }).author
    if (!a) return null
    if (typeof a === 'object' && 'email' in a) return (a as { email?: string }).email || null
    if (typeof a === 'object' && 'name' in a) return (a as { name?: string }).name || null
    if (typeof a === 'string') return a
    return null
  })()

  const imageURL = (() => {
    const img =
      (post.featuredImage as Media | number | null | undefined) ||
      (post?.openGraph?.ogImage as Media | number | null | undefined) ||
      (post?.twitter?.twitterImage as Media | number | null | undefined)
    if (!img) return null
    if (typeof img === 'object') {
      if ('url' in img && img.url) return img.url as string
      if ('filename' in img && img.filename) return `/api/media/file/${img.filename}`
    }
    return null
  })()

  const imageAlt = (() => {
    const img =
      (post.featuredImage as Media | number | null | undefined) ||
      (post?.openGraph?.ogImage as Media | number | null | undefined) ||
      (post?.twitter?.twitterImage as Media | number | null | undefined)
    if (img && typeof img === 'object' && 'alt' in img && img.alt) return img.alt as string
    const cardTitle = post.jsonld?.headline || post.title
    return (post.openGraph as any)?.ogImageAlt || (post.twitter as any)?.twitterImageAlt || cardTitle || 'Article image'
  })()

  const href = post.slug ? `/posts/${post.slug}` : `/posts/${post.id}`
  const section = (post.openGraph as any)?.articleSection as string | undefined
  const date = formatDate(post.datePublished)
  const readMins = getReadMinutes(post.jsonld?.wordCount as number | undefined)

  return (
    <li className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        {/* Cover media */}
        {imageURL ? (
          <div className="relative w-full h-44 md:h-56">
            <Image
              src={imageURL}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority={false}
            />
          </div>
        ) : (
          <div className="w-full h-44 md:h-56 bg-slate-100 flex items-center justify-center text-slate-400">No image</div>
        )}

        {/* Content */}
        <div className="p-5">
          {section && (
            <div className="text-xs text-slate-500 mb-1">By {section}</div>
          )}
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900 group-hover:underline">
            {post.jsonld?.headline || post.title}
          </h2>
          {(post.excerpt || post.seo?.metaDescription) && (
            <p className="mt-2 text-slate-700" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.excerpt || post.seo?.metaDescription}
            </p>
          )}

          {/* Author and meta */}
          <div className="mt-4 flex items-center text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs">
                {(authorLabel ?? 'A').slice(0, 1).toUpperCase()}
              </div>
              <span className="font-medium">{authorLabel ?? 'Unknown author'}</span>
            </div>
            <span className="ml-3">{date}</span>
            <span className="ml-3">• {readMins} min read</span>
          </div>
        </div>
      </Link>
    </li>
  )
}
import Image from 'next/image'
import type { Post, Media } from '../payload-types'