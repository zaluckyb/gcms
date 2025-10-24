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

export default function PostCard({ post }: { post: any }) {
  const authorLabel = (() => {
    const a = post.author
    if (!a) return null
    if (typeof a === 'object' && 'email' in a) return (a as any).email as string
    if (typeof a === 'object' && 'name' in a) return (a as any).name as string
    if (typeof a === 'string') return a
    return null
  })()

  const imageURL = (() => {
    const img = post.image
    if (!img) return null
    if (typeof img === 'object') {
      if ('url' in img && img.url) return (img as any).url as string
      if ('filename' in img && img.filename) return `/api/media/file/${(img as any).filename}`
    }
    return null
  })()

  const href = post.slug ? `/posts/${post.slug}` : `/posts/${post.id}`
  const section = post.articleSection as string | undefined
  const date = formatDate(post.datePublished)
  const readMins = getReadMinutes(post.wordCount as number | undefined)

  return (
    <li className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        {/* Cover media */}
        {imageURL ? (
          <img
            src={imageURL}
            alt={post.headline ?? 'Article image'}
            className="w-full h-44 md:h-56 object-cover"
          />
        ) : (
          <div className="w-full h-44 md:h-56 bg-slate-100 flex items-center justify-center text-slate-400">No image</div>
        )}

        {/* Content */}
        <div className="p-5">
          {section && (
            <div className="text-xs text-slate-500 mb-1">By {section}</div>
          )}
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900 group-hover:underline">
            {post.headline}
          </h2>
          {post.description && (
            <p className="mt-2 text-slate-700" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.description}
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