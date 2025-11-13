"use client"

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'

type Props = {
  src?: string
  alt?: string
}

const ParallaxImage: React.FC<Props> = ({ src, alt }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const parent = el.parentElement
        if (!parent) return
        const rect = parent.getBoundingClientRect()
        // Negative when scrolled past top; translate a fraction for parallax
        const offset = Math.max(0, -rect.top * 0.15)
        el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`
      })
    }

    if (!prefersReduced) {
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
    }

    return () => {
      if (!prefersReduced) window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="absolute inset-0 -z-20 will-change-transform">
      {src ? (
        <Image
          src={src}
          alt={alt ?? ''}
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : null}
    </div>
  )
}

export default ParallaxImage