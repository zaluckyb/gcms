import React from 'react'
import Image from 'next/image'
import Container from './Container'
import ShareMenu from './ShareMenu'
import ParallaxImage from './ParallaxImage'

type Props = {
  title: string
  excerpt?: string
  date: string
  bgImageUrl?: string
  bgAlt?: string
  meta?: {
    authorLabel?: string | null
    section?: string
    lang?: string
    readMinutes?: number
    isPartOf?: string
    showShare?: boolean
  }
}

const PostHeader: React.FC<Props> = ({ title, excerpt, date, bgImageUrl, bgAlt, meta }) => {
  const displayDate = (() => {
    try {
      return new Date(date).toLocaleDateString()
    } catch {
      return date
    }
  })()

  return (
    <header
      className={`relative overflow-hidden border-b border-line ${bgImageUrl ? '' : 'bg-gradient-to-br from-ink via-slate to-panel'} h-[42vh] sm:h-[50vh] md:h-[60vh] min-h-[320px]`}
    >
      {/* Background image fills hero; decorative */}
      {bgImageUrl && <ParallaxImage src={bgImageUrl} alt={bgAlt} />}

      {/* Contrast scrim for accessibility (kept subtle) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-10 ${bgImageUrl ? '' : 'opacity-100'}`}
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.08))',
        }}
      />

      {/* Optional accent glow behind everything */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-30 opacity-35`}
        style={{
          background:
            'radial-gradient(1000px 400px at 10% -20%, rgba(18,181,229,0.18), transparent)',
        }}
      />

      {/* Hero content overlaid on the image as one unit */}
      <Container>
        <div className="relative z-0 flex h-full">
          <div className="w-full flex h-full flex-col">
            {/* Title block sits above, chips anchor to bottom */}
            <div className="pt-10 sm:pt-12">
              <time className="text-sm text-white/80">{displayDate}</time>
              <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                {title}
              </h1>
              {excerpt && (
                <p className="mt-4 max-w-prose text-lg leading-relaxed text-white/85">
                  {excerpt}
                </p>
              )}
            </div>

            {/* Meta chips & share inside hero, anchored to the bottom */}
            <div className="mt-auto pb-6 sm:pb-8 flex flex-wrap items-center gap-2">
              {meta?.authorLabel && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 text-white/85 px-3 py-1.5 text-xs shadow-subtle">
                  👤 {meta.authorLabel}
                </span>
              )}
              {meta?.section && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 text-white/85 px-3 py-1.5 text-xs shadow-subtle">
                  🏷️ {meta.section}
                </span>
              )}
              {meta?.lang && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 text-white/85 px-3 py-1.5 text-xs shadow-subtle">
                  🌐 {meta.lang}
                </span>
              )}
              {typeof meta?.readMinutes === 'number' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 text-white/85 px-3 py-1.5 text-xs shadow-subtle">
                  ⏱️ {meta.readMinutes} min read
                </span>
              )}
              {meta?.isPartOf && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 text-white/85 px-3 py-1.5 text-xs shadow-subtle">
                  📚 {meta.isPartOf}
                </span>
              )}
              {meta?.showShare && (
                <span className="ml-auto">
                  <ShareMenu />
                </span>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}

export default PostHeader