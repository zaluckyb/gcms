'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'
import type { Post } from '@/payload-types'

// Simple utility to debounce rapid clicks
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type LengthOption = 'short' | 'standard' | 'long'

interface DocumentInfoLite {
  id?: string | number
  initialData?: { id?: string | number; _id?: string | number } | null
  collectionSlug?: string
}

interface FieldHook<T> {
  value: T
  setValue: (v: T) => void
}

const DEFAULT_INSTRUCTIONS = [
  'Avoid common AI writing structures such as “Introduction,” “Conclusion,” or “Summary.”',
  'Do not use transitional clichés like “In conclusion,” “Overall,” or “To summarize.”',
  'Write with a natural human editorial voice — conversational, thoughtful, and contextually connected.',
  'Avoid AI jargon such as “cutting-edge,” “synergy,” or “leveraging technology.” Use precise and concrete terms.',
  'End with a reflective or forward-looking insight, not a summary section.',
  'Vary sentence rhythm and structure to feel organic and journalistic.',
  'Use SEO headers: H2 for sections, H3 for subsections. Do not use H1.',
]

const GenerateArticleButton: React.FC = () => {
  const { id, initialData, collectionSlug } = (useDocumentInfo() as unknown as DocumentInfoLite)

  // Instructions editor state
  const [instructions, setInstructions] = useState<string[]>([])
  const [draftInstruction, setDraftInstruction] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [updatedDoc, setUpdatedDoc] = useState<Post | null>(null)
  const [models, setModels] = useState<string[]>([
    'gpt-5',
    'gpt-5-mini',
    'gpt-4.1',
    'gpt-4o',
    'gpt-4o-mini',
  ])
const [selectedModel, setSelectedModel] = useState<string>('gpt-5')
  const [customModel, setCustomModel] = useState<string>('')

  const docId = useMemo(
    () => id || initialData?.id || initialData?._id || null,
    [id, initialData],
  )
  const canRun = !!docId && collectionSlug === 'posts'

  // fields we need to read/write
  const draftField = useField({ path: 'postContentDraft' }) as unknown as FieldHook<string | undefined>
  const contentField = useField({ path: 'content' }) as unknown as FieldHook<Post['content'] | undefined>

  const draftValue = (draftField?.value as string | undefined) ?? ''

  const persistInstructionsIntoDraft = useCallback(
    (list: string[]) => {
      let base: Record<string, unknown>
      try {
        base = JSON.parse(draftValue || '{}') as Record<string, unknown>
      } catch {
        base = {}
      }
      base.instructions = list
      const next = JSON.stringify(base, null, 2)
      draftField?.setValue?.(next)
      setMessage('Instructions saved into Post Content Draft.')
    },
    [draftValue, draftField],
  )

  const persistDraftPatch = useCallback(
    (patch: Record<string, unknown>) => {
      let base: Record<string, unknown>
      try {
        base = JSON.parse(draftValue || '{}') as Record<string, unknown>
      } catch {
        base = {}
      }
      Object.assign(base, patch)
      const next = JSON.stringify(base, null, 2)
      draftField?.setValue?.(next)
    },
    [draftValue, draftField],
  )

  // Initialize instructions from JSON inside draft
  useEffect(() => {
    try {
      const obj = JSON.parse(draftValue || '{}') as { instructions?: unknown }
      const list = Array.isArray(obj?.instructions)
        ? (obj.instructions as unknown[]).map(String).filter((s) => s.trim().length > 0)
        : []
      // model from draft if present
      try {
        const parsed = JSON.parse(draftValue || '{}') as { model?: unknown }
        if (typeof parsed?.model === 'string' && parsed.model.trim().length > 0) {
          setSelectedModel(parsed.model)
        }
      } catch {}

      if (list.length === 0) {
        setInstructions(DEFAULT_INSTRUCTIONS)
        // Persist defaults into the draft so the API picks them up
        persistInstructionsIntoDraft(DEFAULT_INSTRUCTIONS)
      } else {
        setInstructions(list)
      }
    } catch {
      // No valid JSON found — set defaults and persist into a fresh object
      setInstructions(DEFAULT_INSTRUCTIONS)
      persistInstructionsIntoDraft(DEFAULT_INSTRUCTIONS)
    }
  }, [draftValue, persistInstructionsIntoDraft])

  // Load available models from server (no API key exposure)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin-actions/openai-models', { method: 'GET' })
        const data: { ok?: boolean; models?: string[] } | null = await res.json().catch(() => null)
        if (alive && res.ok && Array.isArray(data?.models) && data!.models.length) {
          // Prefer chat/completion models likely relevant
          const filtered = data!.models.filter((id) => /gpt|o1|4o|4\.1|5/i.test(id))
          setModels(filtered.length ? filtered : data!.models)
        }
      } catch {
        // ignore
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const run = useCallback(async () => {
    if (!docId) {
      setMessage('Save the document first to get an ID.')
      return
    }
    if (!draftValue || !String(draftValue).trim()) {
      setMessage('Post Content Draft is empty. Add draft text first.')
      return
    }

    const confirmed = window.confirm(
      'Use the draft to generate an article and overwrite Content?',
    )
    if (!confirmed) return

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin-actions/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, model: (customModel.trim() || selectedModel).trim() }),
      })
      const data: { ok?: boolean; error?: string; post?: Post } | null = await res
        .json()
        .catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to generate the article')
      }
      const doc = data?.post
      if (doc && contentField?.setValue) {
        contentField.setValue(doc.content)
      }
      setUpdatedDoc(doc || null)
      setMessage('Article generated and content updated.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setMessage(msg)
    } finally {
      setLoading(false)
      await sleep(150)
    }
  }, [docId, draftValue, contentField])

  useEffect(() => {
    if (!updatedDoc) return
    // No-op: we already applied content via setValue
  }, [updatedDoc])

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-1000)',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'var(--theme-elevation-0)',
        marginTop: 12,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.2 }}>Create Article</div>
          <div style={{ color: 'var(--theme-elevation-600)', fontSize: 13 }}>
            Generates a full article from the Post Content Draft and writes it into Content.
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Post Content Draft</span>
        <textarea
          value={draftValue || ''}
          readOnly
          rows={8}
          aria-label='Post Content Draft'
          style={{
            width: '100%',
            resize: 'vertical',
            border: '1px solid var(--theme-elevation-1000)',
            borderRadius: 6,
            background: 'var(--theme-elevation-50)',
            padding: 8,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 12,
            color: 'var(--theme-elevation-900)',
          }}
        />
      </label>

      {/* Model selection */}
      <div
        style={{
          border: '1px solid var(--theme-elevation-1000)',
          borderRadius: 6,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'var(--theme-elevation-50)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>OpenAI Model</div>
        <div style={{ color: 'var(--theme-elevation-700)', fontSize: 12 }}>
          Choose the model used to generate the article. You can also enter a custom model ID.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={selectedModel}
            onChange={(e) => {
              const val = e.target.value
              setSelectedModel(val)
              setCustomModel('')
              persistDraftPatch({ model: val })
              setMessage('Model saved into Post Content Draft.')
            }}
            style={{
              flex: 0,
              minWidth: 220,
              border: '1px solid var(--theme-elevation-1000)',
              borderRadius: 6,
              background: 'var(--theme-elevation-0)',
              padding: '6px 8px',
              fontSize: 13,
            }}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            value={customModel}
            onChange={(e) => {
              const v = e.target.value
              setCustomModel(v)
              if (v.trim()) {
                persistDraftPatch({ model: v.trim() })
                setMessage('Model saved into Post Content Draft.')
              }
            }}
            placeholder='Custom model id (optional)'
            style={{
              flex: 1,
              border: '1px solid var(--theme-elevation-1000)',
              borderRadius: 6,
              background: 'var(--theme-elevation-0)',
              padding: '6px 8px',
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* Instructions editor */}
      <div
        style={{
          border: '1px solid var(--theme-elevation-1000)',
          borderRadius: 6,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'var(--theme-elevation-50)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Editorial Instructions</div>
        <div style={{ color: 'var(--theme-elevation-700)', fontSize: 12 }}>
          Add guidance that should be embedded in the draft JSON and used when generating the article.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={draftInstruction}
            onChange={(e) => setDraftInstruction(e.target.value)}
            placeholder='e.g., Avoid sections titled “Introduction” or “Conclusion”.'
            style={{
              flex: 1,
              border: '1px solid var(--theme-elevation-1000)',
              borderRadius: 6,
              background: 'var(--theme-elevation-0)',
              padding: '6px 8px',
              fontSize: 13,
            }}
          />
          <button
            type='button'
            onClick={() => {
              const text = draftInstruction.trim()
              if (!text) return
              const next = [...instructions, text]
              setInstructions(next)
              setDraftInstruction('')
              persistInstructionsIntoDraft(next)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--theme-elevation-1000)',
              background: 'var(--theme-success-500)',
              color: 'white',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
        {!!instructions?.length && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {instructions.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  background: 'var(--theme-elevation-0)',
                  border: '1px solid var(--theme-elevation-1000)',
                  borderRadius: 6,
                  padding: '6px 8px',
                }}
              >
                <div style={{ fontSize: 13 }}>{item}</div>
                <button
                  type='button'
                  onClick={() => {
                    const next = instructions.filter((_, i) => i !== idx)
                    setInstructions(next)
                    persistInstructionsIntoDraft(next)
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--theme-elevation-1000)',
                    background: 'var(--theme-error-500)',
                    color: 'white',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type='button'
          onClick={run}
          disabled={!canRun || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 6,
            border: '1px solid var(--theme-elevation-1000)',
            background: 'var(--theme-success-500)',
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 500,
            color: 'white',
            cursor: canRun && !loading ? 'pointer' : 'not-allowed',
            opacity: !canRun || loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Generating…' : 'Create Article'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--theme-elevation-700)' }}>This will overwrite Content.</span>
      </div>

      {message && (
        <div
          style={{
            border: '1px solid var(--theme-elevation-1000)',
            borderRadius: 6,
            background: 'var(--theme-elevation-50)',
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--theme-elevation-800)',
          }}
        >
          {message}
        </div>
      )}
      {!canRun && (
        <div
          style={{
            borderRadius: 6,
            background: 'var(--theme-error-100)',
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--theme-error-700)',
          }}
        >
          This action is available on Posts after saving.
        </div>
      )}
    </div>
  )
}

export default GenerateArticleButton