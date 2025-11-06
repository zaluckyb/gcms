'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

interface ContentItem {
  id?: string | null
  title: string
  slug: string
  description?: string | null
  keywords?: Array<{ keyword: string; id?: string | null }> | null
}

interface PublishResponse {
  success: boolean
  publishedCount: number
  skippedCount: number
  errors: string[]
  publishedPosts: Array<{
    id: number
    title: string
    slug: string
  }>
  error?: string
}

export default function PublishContentItemsButton() {
  const { id, initialData, collectionSlug } = useDocumentInfo() as any
  const [isPublishing, setIsPublishing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Hydration-safe gating: render stable markup on server, hydrate dynamic content after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Local state for remote fallback
  const [remoteItems, setRemoteItems] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Get content items field (live form value)
  const contentItemsField = useField({ path: 'contentItems' }) as any
  const fieldItems = contentItemsField?.value
  const fieldItemsArray = Array.isArray(fieldItems) ? fieldItems : []

  // Initial data (server-provided when page loads)
  const initialItemsRaw = (initialData?.contentItems ?? initialData?.items) || []
  const initialItemsArray = Array.isArray(initialItemsRaw) ? initialItemsRaw : []

  // Fallback: fetch the document if form + initial are empty/undefined
  useEffect(() => {
    const run = async () => {
      if (!id || collectionSlug !== 'contentPlans') return
      const shouldFetch = fieldItemsArray.length === 0 && initialItemsArray.length === 0
      if (!shouldFetch) {
        setRemoteItems([])
        setDebugInfo(`fieldItems:${fieldItemsArray.length}; initialItems:${initialItemsArray.length}`)
        return
      }
      try {
        const urls = [
          `/api/contentPlans/${id}?depth=2`,
          `/api/content-plans/${id}?depth=2`,
        ]
        let json: any | null = null
        for (const u of urls) {
          try {
            const res = await fetch(u, { cache: 'no-store' })
            if (res.ok) {
              json = await res.json().catch(() => null)
              if (json) break
            }
          } catch {}
        }
        // Payload REST can return the doc directly OR wrapped in { doc }
        const doc = json?.doc ?? json
        const items = Array.isArray(doc?.contentItems)
          ? doc.contentItems
          : Array.isArray(doc?.items)
            ? doc.items
            : []
        setRemoteItems(items)
        setDebugInfo(`fieldItems:${fieldItemsArray.length}; initialItems:${initialItemsArray.length}; remoteItems:${items.length}`)
        console.log('PublishContentItemsButton detection', {
          fieldItemsCount: fieldItemsArray.length,
          initialItemsCount: initialItemsArray.length,
          remoteItemsCount: items.length,
        })
      } catch (e) {
        console.warn('PublishContentItemsButton fallback fetch failed', e)
        setDebugInfo(`fieldItems:${fieldItemsArray.length}; initialItems:${initialItemsArray.length}; remoteItems:error`)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, collectionSlug, fieldItemsArray.length, initialItemsArray.length])

  const effectiveItems: ContentItem[] = useMemo(() => {
    if (!mounted) return []
    if (fieldItemsArray.length > 0) return fieldItemsArray as ContentItem[]
    if (initialItemsArray.length > 0) return initialItemsArray as ContentItem[]
    return (remoteItems as ContentItem[])
  }, [mounted, fieldItemsArray, initialItemsArray, remoteItems])

  const hasContentItems = mounted && effectiveItems.some(
    (it) => it && (it.title || it.slug || it.description || (Array.isArray(it.keywords) && it.keywords.length > 0))
  )

  // Only show on Content Plans collection
  const canShow = collectionSlug === 'contentPlans' && !!id

  const handlePublish = async () => {
    if (!id) {
      setMessage('No content plan ID found')
      return
    }

    if (!hasContentItems) {
      setMessage('No content items to publish')
      return
    }

    setIsPublishing(true)
    setShowConfirmation(false)
    setMessage(null)

    try {
      const response = await fetch(`/api/content-plans/${id}/publish-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const result: PublishResponse = await response.json()

      if (result.success) {
        if (result.publishedCount > 0) {
          setMessage(`✅ Successfully published ${result.publishedCount} content item${result.publishedCount === 1 ? '' : 's'} as draft posts`)

          if (result.publishedPosts.length > 0) {
            console.log('📋 Published posts:', result.publishedPosts.map(p => `• ${p.title} (${p.slug})`).join('\n'))
          }
        }

        if (result.skippedCount > 0) {
          setMessage(`⚠️ ${result.skippedCount} item${result.skippedCount === 1 ? '' : 's'} skipped. ${result.errors.join('; ')}`)
        }

        if (result.errors.length > 0 && result.publishedCount === 0) {
          setMessage(`❌ Publishing failed: ${result.errors.join('; ')}`)
        }
      } else {
        setMessage(`❌ Publishing failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Publishing error:', error)
      setMessage(`❌ Failed to publish content items: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`)
    } finally {
      setIsPublishing(false)
    }
  }

  if (!canShow) {
    return null
  }

  // Prepare a small preview list for visual feedback (client-only)
  const previewItems = (mounted ? effectiveItems : [])
    .filter(it => (it.title || it.slug))
    .slice(0, 5)

  return (
    <div suppressHydrationWarning style={{
      border: '1px solid var(--theme-elevation-1000)',
      borderRadius: 8,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontWeight: 600 }}>Publish Content Items</div>
      <div style={{ color: 'var(--theme-elevation-600)' }}>
        Convert content items to draft posts with automatic field mapping
      </div>

      <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
        Detected items: {mounted ? effectiveItems.length : '—'} {mounted && debugInfo ? `• ${debugInfo}` : ''}
      </div>

      {hasContentItems && previewItems.length > 0 && (
        <div style={{
          border: '1px dashed var(--theme-elevation-600)',
          borderRadius: 6,
          padding: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
            Preview of items to publish
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
            {previewItems.map((it, i) => (
              <li key={`${it.slug}-${i}`}>{it.title || it.slug}</li>
            ))}
          </ul>
          {effectiveItems.length > previewItems.length && (
            <div style={{ fontSize: 11, color: 'var(--theme-elevation-600)', marginTop: 6 }}>
              +{effectiveItems.length - previewItems.length} more
            </div>
          )}
        </div>
      )}

      {!hasContentItems && (
        <div style={{ 
          color: 'var(--theme-warning-500)', 
          fontSize: '14px', 
          marginTop: 4,
        }}>
          {mounted ? 'No content items found in this plan. Add items to enable publishing.' : 'Loading…'}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setShowConfirmation(true)}
          disabled={!mounted || isPublishing || !hasContentItems}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--theme-elevation-1000)',
            background: mounted && hasContentItems ? 'var(--theme-success-500)' : 'var(--theme-elevation-100)',
            color: mounted && hasContentItems ? 'white' : 'var(--theme-elevation-800)',
            cursor: !mounted || isPublishing || !hasContentItems ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>📤</span>
          {isPublishing ? 'Publishing...' : 'Publish as Draft Posts'}
        </button>
      </div>

      {message && (
        <div style={{ 
          color: message.includes('✅') ? 'var(--theme-success-500)' : 
                 message.includes('❌') ? 'var(--theme-error-500)' : 
                 'var(--theme-warning-500)',
          fontSize: '14px',
          marginTop: 8
        }}>
          {message}
        </div>
      )}

      {mounted && showConfirmation && (
        <div className="confirmation-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="confirmation-content" style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 2000,
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              Publish Content Items?
            </h3>
            
            <p style={{ margin: '0 0 20px 0', color: '#666', lineHeight: '1.5' }}>
              This will create draft posts for all {effectiveItems.length} content item{effectiveItems.length === 1 ? '' : 's'}.
              Existing posts with matching slugs will be skipped.
            </p>
            
            <div className="confirmation-actions" style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={isPublishing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--theme-elevation-1000)',
                  background: 'var(--theme-elevation-100)',
                  cursor: isPublishing ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--theme-elevation-1000)',
                  background: 'var(--theme-success-500)',
                  color: 'white',
                  cursor: isPublishing ? 'not-allowed' : 'pointer',
                }}
              >
                Confirm Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}