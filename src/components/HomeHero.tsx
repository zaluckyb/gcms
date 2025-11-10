import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  title?: string
  subtitle?: string
  description?: string
  brandMarkSrc?: string
}

const HomeHero = ({
  title = 'Web Development South Africa',
  subtitle = 'Web',
  description =
    'We design, build, and scale high‑performing websites and apps. Modern stacks, accessible UX, and conversion‑focused execution.',
  brandMarkSrc = '/api/media/file/webdeveloper-logo-shape.png',
}: Props) => {
  return (
    <section aria-label="Hero" className="relative isolate overflow-hidden bg-black">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-neutral-900 to-black" />

      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <div>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
              <span className="text-emerald-400">{subtitle}</span>{' '}
              {title.replace(/^Web\s*/, '')}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/70 max-w-prose">
              {description}
            </p>

            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/posts"
                className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-white ring-1 ring-emerald-500 hover:bg-emerald-500/10 transition-colors"
              >
                Learn More
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black hover:bg-emerald-400 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right: Brand mark image only */}
          <div className="flex items-center justify-center">
            <Image src={brandMarkSrc} alt="Brand mark" width={460} height={460} priority />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeHero