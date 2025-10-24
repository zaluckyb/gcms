"use client"
import React, { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const body = document.body
      const scrollTop = doc.scrollTop || body.scrollTop
      const scrollHeight = doc.scrollHeight || body.scrollHeight
      const clientHeight = doc.clientHeight
      const total = scrollHeight - clientHeight
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrollTop / total) * 100)) : 0
      setProgress(pct)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}