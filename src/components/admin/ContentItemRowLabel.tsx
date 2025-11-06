'use client'
import React, { useEffect, useState } from 'react'

type Props = {
  data?: any,
  index?: number,
}

const safeIndex = (i?: number) => {
  const n = Number.isFinite(i!) ? (i as number) : 0
  return Math.max(0, n)
}

const ContentItemRowLabel: React.FC<Props> = ({ data, index }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const idx = safeIndex(index)
  const title = data?.title?.trim?.()

  // Render stable label on server; add index client-side to avoid SSR mismatch
  const label = title || (mounted ? `Content Item ${idx + 1}` : 'Content Item')

  return <span suppressHydrationWarning>{label}</span>
}

export default ContentItemRowLabel