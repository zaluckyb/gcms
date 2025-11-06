"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

export default function GenerateSEOButton() {
  const { id, initialData, collectionSlug } = useDocumentInfo() as any
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [updatedDoc, setUpdatedDoc] = useState<any | null>(null)

  const docId = useMemo(() => {
    return id || initialData?.id || initialData?._id || null
  }, [id, initialData])

  const canRun = !!docId && collectionSlug === 'posts'

  // Prepare setters for targeted fields to update UI without page reload
  const excerptField = useField({ path: 'excerpt' }) as any
  const pageTitleField = useField({ path: 'seo.pageTitle' }) as any
  const metaDescriptionField = useField({ path: 'seo.metaDescription' }) as any
  const metaKeywordsField = useField({ path: 'seo.metaKeywords' }) as any
  const canonicalURLField = useField({ path: 'seo.canonicalURL' }) as any
  const ogTitleField = useField({ path: 'openGraph.ogTitle' }) as any
  const ogDescField = useField({ path: 'openGraph.ogDescription' }) as any
  const twitterTitleField = useField({ path: 'twitter.twitterTitle' }) as any
  const twitterDescField = useField({ path: 'twitter.twitterDescription' }) as any
  const headlineField = useField({ path: 'jsonld.headline' }) as any
  const schemaDescField = useField({ path: 'jsonld.schemaDescription' }) as any
  const wordCountField = useField({ path: 'jsonld.wordCount' }) as any

  const run = useCallback(async () => {
    if (!docId) {
      setMessage('Save the document first to get an ID.')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin-actions/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, forceOverwrite: force }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to generate SEO')
      }
      // If server returned the updated document, use it; otherwise fetch
      let doc: any = data?.post || null
      if (!doc) {
        const getRes = await fetch(`/api/posts/${docId}?depth=1`, { method: 'GET' })
        const getJson = await getRes.json().catch(() => null)
        // Payload REST typically returns the doc directly
        doc = getJson || null
      }
      if (doc) {
        setUpdatedDoc(doc)
        setMessage(
          data?.adjusted
            ? 'SEO generated with minor adjustments (length/keywords).'
            : 'SEO generated and fields updated.'
        )
      } else {
        setMessage('SEO generated, but failed to fetch updated document.')
      }
    } catch (e: any) {
      setMessage(String(e?.message || e || 'Unexpected error'))
    } finally {
      setLoading(false)
    }
  }, [docId, force])

  // Apply updated document values to form fields to reflect changes immediately
  useEffect(() => {
    if (!updatedDoc) return
    try {
      const safe = updatedDoc || {}
      // Excerpt
      if (excerptField?.setValue) excerptField.setValue(safe.excerpt ?? '')
      // SEO
      if (pageTitleField?.setValue) pageTitleField.setValue(safe.seo?.pageTitle ?? '')
      if (metaDescriptionField?.setValue) metaDescriptionField.setValue(safe.seo?.metaDescription ?? '')
      if (metaKeywordsField?.setValue) metaKeywordsField.setValue(safe.seo?.metaKeywords ?? '')
      if (canonicalURLField?.setValue) canonicalURLField.setValue(safe.seo?.canonicalURL ?? '')
      // Open Graph
      if (ogTitleField?.setValue) ogTitleField.setValue(safe.openGraph?.ogTitle ?? '')
      if (ogDescField?.setValue) ogDescField.setValue(safe.openGraph?.ogDescription ?? '')
      // Twitter
      if (twitterTitleField?.setValue) twitterTitleField.setValue(safe.twitter?.twitterTitle ?? '')
      if (twitterDescField?.setValue) twitterDescField.setValue(safe.twitter?.twitterDescription ?? '')
      // JSON-LD
      if (headlineField?.setValue) headlineField.setValue(safe.jsonld?.headline ?? '')
      if (schemaDescField?.setValue) schemaDescField.setValue(safe.jsonld?.schemaDescription ?? '')
      if (wordCountField?.setValue) wordCountField.setValue(safe.jsonld?.wordCount ?? 0)
    } catch (err) {
      // If something goes wrong, keep current form state untouched
      console.warn('Failed to apply updated fields to form:', err)
    }
  }, [updatedDoc])

  return (
    <div style={{
      border: '1px solid var(--theme-elevation-1000)',
      borderRadius: 8,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontWeight: 600 }}>Generate SEO</div>
      <div style={{ color: 'var(--theme-elevation-600)' }}>
        Autofill excerpt, SEO, OG/Twitter, JSON-LD, and metadata from title & content.
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={force}
          onChange={(e) => setForce(e.target.checked)}
        />
        Force overwrite existing values
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={run}
          disabled={!canRun || loading}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--theme-elevation-1000)',
            background: 'var(--theme-success-500)',
            color: 'white',
            cursor: canRun && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Generating…' : 'Generate SEO'}
        </button>
      </div>
      {message && (
        <div style={{ color: 'var(--theme-elevation-800)' }}>{message}</div>
      )}
      {!canRun && (
        <div style={{ color: 'var(--theme-error-500)' }}>
          This action is available on Posts after saving.
        </div>
      )}
    </div>
  )
}