Perfect—let’s give your `/posts` archive and single post pages that clean “modern tech / Payload-style” vibe: dark hero, bold type, card grid, airy spacing, and a focused reading layout.

Below is a **drop-in mini kit** for Next.js (App Router) + Tailwind. It’s intentionally small but production-ready and easy to extend.

---

# 1) Tailwind tokens (theme + prose)

**`tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0F19',
        slate: '#131827',
        panel: '#0F1422',
        line: '#22283A',
        accent: '#12B5E5',
      },
      maxWidth: {
        wrapper: '72rem', // 1152px
        prose: '72ch',
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.15)',
        subtle: '0 2px 10px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        xl2: '1.25rem', // 20px
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
```

**`app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Smooth, minimal look */
html,
body {
  @apply bg-white text-white antialiased;
  background: #0b0f19;
}

/* Prose defaults for single post */
.prose {
  --tw-prose-body: #e6eaf2;
  --tw-prose-headings: #fff;
  --tw-prose-links: #12b5e5;
  --tw-prose-bold: #fff;
  --tw-prose-quotes: #e6eaf2;
  --tw-prose-code: #e6eaf2;
  --tw-prose-th-borders: #22283a;
  --tw-prose-td-borders: #22283a;
}
```

---

# 2) Tiny primitives

**`components/Container.tsx`**

```tsx
export default function Container({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`mx-auto w-full max-w-wrapper px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}
```

**`components/Section.tsx`**

```tsx
export default function Section({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>{children}</section>
}
```

**`components/HeroDark.tsx`**

```tsx
import Container from './Container'

export default function HeroDark({
  title,
  kicker,
  children,
}: {
  title: string
  kicker?: string
  children?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ink via-slate to-panel" />
      <Container className="relative">
        <div className="py-16 sm:py-24 lg:py-28">
          {kicker && <p className="mb-3 text-sm font-medium text-accent/90">{kicker}</p>}
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">{title}</h1>
          {children && <div className="mt-4 text-lg text-white/70 max-w-prose">{children}</div>}
        </div>
      </Container>
    </div>
  )
}
```

---

# 3) Archive (card grid with soft depth)

**Post types (replace with your data source):**

```ts
// lib/posts.ts (mock)
export type Post = {
  slug: string
  title: string
  excerpt: string
  date: string // ISO
  image?: string // optional
  tags?: string[]
}

export async function getAllPosts(): Promise<Post[]> {
  return [
    { slug: 'hello-world', title: 'Hello, World', excerpt: 'Kickoff post.', date: '2025-10-01' },
    // …pull from your CMS/MDX/db
  ]
}
```

**`components/PostCard.tsx`**

```tsx
import Link from 'next/link'
import type { Post } from '@/lib/posts'

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block rounded-xl2 border border-line bg-panel/60 hover:bg-panel transition-colors shadow-subtle"
    >
      {post.image && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-xl2">
          {/* Use next/image in real project */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-white/70 line-clamp-2">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
          <span className="inline-flex gap-1">
            {(post.tags ?? []).slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full border border-line/70 px-2 py-0.5 text-white/60"
              >
                {t}
              </span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  )
}
```

**`app/posts/page.tsx` (Archive)**

```tsx
import HeroDark from '@/components/HeroDark'
import Section from '@/components/Section'
import Container from '@/components/Container'
import PostCard from '@/components/PostCard'
import { getAllPosts } from '@/lib/posts'

export const metadata = { title: 'Posts' }

export default async function PostsPage() {
  const posts = await getAllPosts()

  return (
    <>
      <HeroDark title="Insights & Updates" kicker="Blog">
        Curated articles on building modern tech products. Clean layouts, high contrast, and zero
        fluff.
      </HeroDark>

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
```

---

# 4) Single post (reader-friendly, TOC + progress)

**Minimal TOC + progress (optional but very “modern tech blog”)**

**`components/ReadingProgress.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      setProgress(Math.min(100, (doc.scrollTop / total) * 100))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-40 h-1 bg-ink/50">
      <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  )
}
```

**`components/PostHeader.tsx`**

```tsx
import Container from './Container'

export default function PostHeader({
  title,
  excerpt,
  date,
}: {
  title: string
  excerpt?: string
  date: string
}) {
  return (
    <div className="border-b border-line bg-gradient-to-br from-ink via-slate to-panel">
      <Container>
        <div className="py-12 sm:py-16">
          <time className="text-sm text-white/60">{new Date(date).toLocaleDateString()}</time>
          <h1 className="mt-3 text-3xl sm:text-5xl font-semibold text-white">{title}</h1>
          {excerpt && <p className="mt-4 max-w-prose text-lg text-white/70">{excerpt}</p>}
        </div>
      </Container>
    </div>
  )
}
```

**`app/posts/[slug]/page.tsx` (Single)**

> Replace the `getPostBySlug` with your CMS/MDX. This version renders simple HTML content safely.

```tsx
import Container from '@/components/Container'
import Section from '@/components/Section'
import PostHeader from '@/components/PostHeader'
import ReadingProgress from '@/components/ReadingProgress'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts'

async function getPostBySlug(slug: string): Promise<Post & { html: string }> {
  const post = (await getAllPosts()).find((p) => p.slug === slug)!
  return {
    ...post,
    html: `
      <h2>Subheading</h2>
      <p>This is a sample paragraph to show the Payload-like reading experience.</p>
      <pre><code>console.log("code blocks styled via @tailwindcss/typography");</code></pre>
      <h3>Another section</h3>
      <p>Use MDX or your CMS to feed real content here.</p>
    `,
  }
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)

  return (
    <>
      <ReadingProgress />
      <PostHeader title={post.title} excerpt={post.excerpt} date={post.date} />
      <Section>
        <Container>
          <article className="prose prose-invert w-full max-w-prose">
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: post.html }} />
          </article>
        </Container>
      </Section>
    </>
  )
}
```

---

# 5) Quick style notes (to match the vibe)

- **Dark intro surfaces** (archive hero + post header) with a very subtle gradient; content areas use **ink/slate/panel** neutrals.
- **Soft depth**: `shadow-subtle` on cards, **thin borders** using `line` color.
- **Bold but short headlines**; body at 16–18px; max width ~72ch.
- **Gentle motion**: only hover lift on cards + reading progress bar.
- **High contrast** and clean icons (if/when added).
