import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Header as HeaderGlobal, Media } from '@/payload-types'

type NavLink = { label: string; href: string; external?: boolean; highlight?: boolean }

const getMediaUrl = (media: Media | number | null | undefined): string | null => {
  if (!media) return null
  if (typeof media === 'object') {
    // Payload may embed url or filename depending on depth
    if ('url' in media && media.url) return media.url as string
    if ('filename' in media && media.filename) return `/api/media/file/${media.filename}`
  }
  return null
}

const Header = async () => {
  const payload = await getPayload({ config: await config })
  let header: HeaderGlobal | null = null
  try {
    header = await payload.findGlobal({ slug: 'header', depth: 1 }) as HeaderGlobal
  } catch (_err) {
    // Fallback when DB schema hasn’t been migrated yet
    header = {
      logo: null,
      logoWidth: 400,
      logoHeight: 200,
      navLinks: [
        { label: 'Solutions', href: '/solutions' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Blog', href: '/posts' },
        { label: 'Sign In', href: '/admin', highlight: true },
      ],
    } as HeaderGlobal
  }

  const logoUrl = getMediaUrl(header?.logo as Media | number | null)
  const logoWidth = header?.logoWidth ?? 400
  const logoHeight = header?.logoHeight ?? 200
  const navLinks: NavLink[] = Array.isArray(header?.navLinks) ? header!.navLinks!.map(l => ({
    label: l.label,
    href: l.href,
    external: l.external ?? false,
    highlight: l.highlight ?? false,
  })) : []

  return (
    <header className="bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/70">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" prefetch={false} className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt="Webdeveloper logo" width={logoWidth} height={logoHeight} priority />
          ) : (
            <span className="text-emerald-400 font-semibold">webdeveloper</span>
          )}
        </Link>

        <nav className="flex items-center gap-8">
          {navLinks.map((link, i) => (
            link.external ? (
              <a
                key={`${link.label}-${i}`}
                href={link.href}
                rel="noopener noreferrer"
                className={link.highlight ? 'text-emerald-400 font-medium' : 'text-white/80 hover:text-white'}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={`${link.label}-${i}`}
                href={link.href}
                prefetch={false}
                className={link.highlight ? 'text-emerald-400 font-medium' : 'text-white/80 hover:text-white'}
              >
                {link.label}
              </Link>
            )
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header