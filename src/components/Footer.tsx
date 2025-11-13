import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Footer as FooterGlobal } from '@/payload-types'

type LinkItem = { label: string; href: string; external?: boolean }

const Footer = async () => {
  const payload = await getPayload({ config: await config })

  let footer: FooterGlobal | null = null
  try {
    footer = await payload.findGlobal({ slug: 'footer', depth: 0 }) as FooterGlobal
  } catch (_err) {
    footer = {
      copyrightText: '© 2025 Web Developer. All rights reserved.',
      footerLinks: [
        { label: 'Solutions', href: '/solutions' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Blog', href: '/posts' },
      ],
      legalLinks: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    } as FooterGlobal
  }

  const footerLinks: LinkItem[] = Array.isArray(footer?.footerLinks)
    ? footer!.footerLinks!.map(l => ({ label: l.label, href: l.href, external: l.external ?? false }))
    : []

  const legalLinks: LinkItem[] = Array.isArray(footer?.legalLinks)
    ? footer!.legalLinks!.map(l => ({ label: l.label, href: l.href, external: l.external ?? false }))
    : []

  const copyrightText = footer?.copyrightText || '© 2025 Web Developer. All rights reserved.'

  return (
    <footer className="bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/70 text-white/70">
      <div className="mx-auto max-w-7xl px-6 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <h2 className="text-sm font-semibold text-white/80">Explore</h2>
          <ul className="mt-3 space-y-2">
            {footerLinks.map((link, i) => (
              <li key={`${link.label}-${i}`}>
                {link.external ? (
                  <a href={link.href} rel="noopener noreferrer" className="hover:text-white">{link.label}</a>
                ) : (
                  <Link href={link.href} prefetch={false} className="hover:text-white">{link.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white/80">Legal</h2>
          <ul className="mt-3 space-y-2">
            {legalLinks.map((link, i) => (
              <li key={`${link.label}-${i}`}>
                {link.external ? (
                  <a href={link.href} rel="noopener noreferrer" className="hover:text-white">{link.label}</a>
                ) : (
                  <Link href={link.href} prefetch={false} className="hover:text-white">{link.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:text-right">
          <p className="text-sm">{copyrightText}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer