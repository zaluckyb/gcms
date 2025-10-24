"use client"
import React, { useState } from 'react'

export default function ShareMenu() {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined' ? window.location.href : ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      setCopied(false)
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url })
      } catch {}
    } else {
      copyLink()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 text-white px-3 py-1.5 text-xs hover:bg-white/10 transition-colors"
        aria-label="Share"
      >
        Share
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 text-white px-3 py-1.5 text-xs hover:bg-white/10 transition-colors"
        aria-label="Copy link"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}