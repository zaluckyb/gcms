'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Media = {
  url?: string,
  alt?: string,
  filename?: string,
}

type Neighbor = {
  slug?: string,
  title?: string,
  featuredImage?: Media | null,
}

type Props = {
  prev?: Neighbor | null,
  next?: Neighbor | null,
}

export const PostNeighborNav: React.FC<Props> = ({ prev, next }) => {
  const router = useRouter()

  const prevHref = prev?.slug ? `/posts/${prev.slug}` : undefined
  const nextHref = next?.slug ? `/posts/${next.slug}` : undefined

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevHref) router.push(prevHref)
      if (e.key === 'ArrowRight' && nextHref) router.push(nextHref)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevHref, nextHref, router])

  const Card: React.FC<{
    label: string,
    neighbor?: Neighbor | null,
    href?: string,
    ariaLabel: string,
    hint: string,
  }> = ({ label, neighbor, href, ariaLabel, hint }) => {
    const bg = neighbor?.featuredImage?.url ?? (neighbor?.featuredImage?.filename ? `/media/${neighbor.featuredImage.filename}` : undefined)
    return href ? (
      <Link
        href={href}
        prefetch={false}
        aria-label={ariaLabel}
        className='group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500'
      >
        {bg ? (
          <Image
            src={bg}
            alt={neighbor?.featuredImage?.alt ?? neighbor?.title ?? ''}
            fill
            sizes='(min-width: 768px) 50vw, 100vw'
            className='absolute inset-0 object-cover opacity-25 group-hover:opacity-35 blur-[1px]'
            priority={false}
          />
        ) : null}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent' />
        <div className='relative z-10 p-6'>
          <div className='text-xs uppercase tracking-wide text-neutral-400'>{label}</div>
          <div className='mt-1 text-lg font-medium text-white line-clamp-2'>{neighbor?.title ?? 'Untitled'}</div>
          <div className='mt-3 text-xs text-neutral-400'>{hint}</div>
        </div>
      </Link>
    ) : (
      <div className='relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6'>
        <div className='text-xs uppercase tracking-wide text-neutral-400'>{label}</div>
        <div className='mt-1 text-lg font-medium text-white'>No post</div>
      </div>
    )
  }

  return (
    <nav aria-label='Post navigation' className='mt-12'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Card
          label='Previous'
          neighbor={prev}
          href={prevHref}
          ariaLabel={`Go to previous post: ${prev?.title ?? ''}`}
          hint='Press ←'
        />
        <Card
          label='Next'
          neighbor={next}
          href={nextHref}
          ariaLabel={`Go to next post: ${next?.title ?? ''}`}
          hint='Press →'
        />
      </div>
    </nav>
  )
}