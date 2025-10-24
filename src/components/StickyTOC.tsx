"use client"
import React, { useEffect, useState } from 'react'

type TocItem = { id: string; text: string; level: number }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function StickyTOC({ articleId = 'article-content' }: { articleId?: string }) {
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    const article = document.getElementById(articleId)
    if (!article) return
    const headings = Array.from(article.querySelectorAll('h2, h3, h4')) as HTMLElement[]
    const newItems: TocItem[] = []
    headings.forEach((h) => {
      const text = h.textContent?.trim() || ''
      if (!text) return
      let id = h.id
      if (!id) {
        id = slugify(text)
        // Ensure uniqueness
        let uniq = id
        let i = 1
        while (document.getElementById(uniq)) {
          uniq = `${id}-${i++}`
        }
        h.id = uniq
        id = uniq
      }
      const level = h.tagName === 'H2' ? 2 : h.tagName === 'H3' ? 3 : 4
      newItems.push({ id, text, level })
    })
    setItems(newItems)
  }, [articleId])

  if (items.length === 0) return null

  return (
    <nav aria-label="On this page" className="sticky top-24 h-fit rounded-lg border border-line bg-panel/60 p-4">
      <h3 className="text-sm font-semibold text-white/80 mb-3">On this page</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 2 ? 'font-medium' : item.level === 3 ? 'pl-3' : 'pl-6'}>
            <a
              href={`#${item.id}`}
              className="text-white/70 hover:text-accent hover:underline"
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(item.id)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}