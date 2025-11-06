import React from 'react'
import { getPayload } from 'payload'
import { headers as getHeaders, draftMode } from 'next/headers'
import config from '@/payload.config'
import { getSiteConfigSafely } from '@/lib/fallback-handler'
import HeroDark from '@/components/HeroDark'
import Section from '@/components/Section'
import Container from '@/components/Container'
import PostCard from '@/components/PostCard'

export async function generateMetadata() {
  try {
    const payload = await getPayload({ config: await config })
    const siteConfig = await getSiteConfigSafely(payload)
    
    return {
      title: 'Posts',
      description: 'Browse our latest articles and insights',
      alternates: {
        canonical: '/posts',
      },
      openGraph: {
        title: `Posts | ${siteConfig.siteName}`,
        description: 'Browse our latest articles and insights',
        url: `${siteConfig.siteUrl}/posts`,
        type: 'website',
      },
    }
  } catch (error) {
    console.error('Error generating posts metadata:', error)
    return { title: 'Posts' }
  }
}

export default async function PostsIndexPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  await payload.auth({ headers })

  const isDraft = (await draftMode()).isEnabled
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 24,
    sort: '-datePublished',
    draft: isDraft,
  })

  const posts = result?.docs ?? []

  return (
    <>
      <HeroDark title="Insights & Updates" kicker="Blog">
        Curated articles on building modern tech products. Clean layouts, high contrast, and zero
        fluff.
      </HeroDark>

      <Section>
        <Container>
          {posts.length === 0 ? (
            <p className="text-white/70">No posts found.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  )
}