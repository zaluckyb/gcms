"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'
import type { PlanItem } from '@/lib/openai/contentPlan'
import styles from './GeneratePlanButton.module.css'

interface DebugInfo {
  prompt: string
  rawResponse: string
  parsedResponse: any
  finalItems: any[]
  errors: string[]
  warnings: string[]
}

const GeneratePlanButton = () => {
  const { id, initialData, collectionSlug } = useDocumentInfo() as any
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [updatedDoc, setUpdatedDoc] = useState<any | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [saving, setSaving] = useState(false)
  // Removed publishing state – publish is now handled by MaterializePostsButton


  const docId = useMemo(() => {
    return id || initialData?.id || initialData?._id || null
  }, [id, initialData])

  const canRun = !!docId && collectionSlug === 'contentPlans'

  // Form field hooks
  const statusField = useField<string>({ path: 'status' })
  const itemsField = useField<PlanItem>({ path: 'contentItems' })
  const topicField = useField<string>({ path: 'topic' })
  const audienceField = useField<string>({ path: 'audience' })
  const daysField = useField<number>({ path: 'days' })
  const startDateField = useField<string>({ path: 'startDate' })
  const strategyNotesField = useField<string>({ path: 'strategyNotes' })

  // Current values from form fields
  const currentStatus = statusField.value || initialData?.status
  // Prefer live form value, fall back to persisted items
  const currentItems = itemsField.value || initialData?.contentItems || []
  const currentTopic = topicField.value || initialData?.topic
  const currentAudience = audienceField.value || initialData?.audience
  const currentDays = daysField.value || initialData?.days
  const currentStartDate = startDateField.value || initialData?.startDate
  const currentStrategyNotes = strategyNotesField.value || initialData?.strategyNotes

  // Ensure currentItems is an array (since it's now a JSON field)
  const itemsArray = Array.isArray(currentItems) ? currentItems : []

  // Check for approved items that haven't been published yet
  // Publishing logic moved to MaterializePostsButton

  // Show button when:
  // 1. Document is saved (canRun = true)
  // 2. Topic exists
  const shouldShowButton = Boolean(canRun && currentTopic)
  
  // Show publish button when there are approved items to publish
  // Always show the publish button when on Content Plans; disable if no approved items
  // Publish button removed from this component

  // Generate prompt preview based on current form values
  const generatePromptPreview = useMemo(() => {
    if (!currentTopic) return ''
    
    const days = Math.max(1, Number(currentDays ?? 30))
    const topic = (currentTopic || 'Content').trim()
    const audience = (currentAudience || 'Readers').trim()
    const strategyNotes = currentStrategyNotes || ''

    return `Create a ${days}-day content plan for the topic "${topic}" targeting "${audience}".

${strategyNotes ? `Strategy Notes: ${strategyNotes}` : ''}

Generate diverse, engaging content ideas that would appeal to ${audience}. Each piece should be unique and valuable.

Return a JSON array with exactly ${days} items, each containing:
- title: Compelling, specific title (not generic)
- description: 2-3 sentence description of the content
- keywords: Array of 3-5 relevant SEO keywords

Format:
[
  {
    "title": "Specific, engaging title",
    "description": "Detailed description of what this content covers and why it's valuable.",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Make each title unique and avoid repetitive patterns. Focus on practical, actionable content that ${audience} would find valuable.`
  }, [currentTopic, currentAudience, currentDays, currentStrategyNotes])

  const generatePreview = useCallback(async () => {
    if (!docId) {
      setMessage('Save the document first to get an ID.')
      return
    }
    if (!currentTopic) {
      setMessage('Please enter a topic before generating the plan.')
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch(`/api/contentPlans/${docId}/generate-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          audience: currentAudience,
          days: currentDays,
          startDate: currentStartDate,
          strategyNotes: currentStrategyNotes,
        }),
      })
      
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to generate content plan preview')
      }
      
      // Store debug information
      if (data.debug) {
        setDebugInfo(data.debug)
        setShowDebug(true) // Auto-show debug panel when new data arrives
      }
      
      // Directly populate the UI form fields instead of storing in preview state
      const generatedItems = data.items || []
      console.log('🔍 Generated items received from API:', JSON.stringify(generatedItems, null, 2))
      
      if (itemsField?.setValue && generatedItems.length > 0) {
        console.log('🔍 Setting items field with:', JSON.stringify(generatedItems, null, 2))
        itemsField.setValue(generatedItems)
        // Also update status to 'generated' to indicate items are populated
        if (statusField?.setValue) {
          statusField.setValue('generated')
        }
      }
      
      const hasErrors = data.debug?.errors?.length > 0
      const hasWarnings = data.debug?.warnings?.length > 0
      let statusMsg = `Generated ${data.itemsGenerated || 0} content plan items! Review and edit them below, then save the document.`
      
      if (hasErrors) {
        statusMsg += ` ⚠️ ${data.debug.errors.length} error(s) detected.`
      }
      if (hasWarnings) {
        statusMsg += ` ⚠️ ${data.debug.warnings.length} warning(s).`
      }
      
      setMessage(statusMsg)
    } catch (e: any) {
      // Hide raw error details from UI
      setMessage('Failed to generate content plan preview. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [docId, currentTopic, currentAudience, currentDays, currentStartDate, currentStrategyNotes, itemsField, statusField])

  const saveGeneratedItems = useCallback(async () => {
    if (!docId) {
      setMessage('Save the document first to get an ID.')
      return
    }
    const itemsToSave = Array.isArray(itemsField?.value) ? itemsField.value : []
    if (itemsToSave.length === 0) {
      setMessage('There are no items to save. Generate first.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/contentPlans/${docId}/save-generated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to save generated items')
      }
      setMessage(`Saved ${data.itemsSaved || itemsToSave.length} generated item${(data.itemsSaved || itemsToSave.length) > 1 ? 's' : ''}.`)
      if (statusField?.setValue) statusField.setValue('generated')
    } catch (e: any) {
      const errMsg = String(e?.message || e || 'Unexpected error')
      // Hide raw error details from UI
      setMessage('Failed to save generated items. Please try again.')
      setShowDebug(true)
      setDebugInfo(prev => ({
        prompt: prev?.prompt || '',
        rawResponse: prev?.rawResponse || '',
        parsedResponse: prev?.parsedResponse || null,
        finalItems: prev?.finalItems || itemsToSave,
        errors: [...(prev?.errors || []), errMsg],
        warnings: prev?.warnings || [],
      }))
    } finally {
      setSaving(false)
    }
  }, [docId, itemsField, statusField])

  // Removed publish handler – handled by MaterializePostsButton

  // Apply updated document values to form fields
  useEffect(() => {
    if (!updatedDoc) return
    try {
      const safe = updatedDoc || {}
      // Update status and items fields
      if (statusField?.setValue) statusField.setValue(safe.status ?? 'draft')
      if (itemsField?.setValue) itemsField.setValue(safe.contentItems ?? [])
    } catch (err) {
      console.warn('Failed to apply updated fields to form:', err)
    }
  }, [updatedDoc, statusField, itemsField])

  // Helper function to copy text to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage(`${label} copied to clipboard!`)
      setTimeout(() => setMessage(null), 2000)
    } catch (err) {
      setMessage(`Failed to copy ${label.toLowerCase()}`)
    }
  }

  // Helper function to format JSON
  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  if (!shouldShowButton) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        🤖 AI Content Plan Generator
      </div>
      <div className={styles.description}>
        {currentStatus === 'generated' 
          ? 'Regenerate AI-powered content ideas (this will replace existing items).'
          : 'Generate AI-powered content ideas based on your topic, audience, and strategy notes.'
        }
      </div>

      {/* Prompt Preview Section */}
      {generatePromptPreview && (
        <div className={styles.promptPreview}>
          <div className={styles.promptHeader}>
            📝 Prompt Preview - What will be sent to ChatGPT:
          </div>
          <div className={styles.promptContent}>
            {/* Current Form Values Summary */}
            <div className={styles.formValuesSummary}>
              <div className={styles.formValuesTitle}>
                📊 Current Form Values:
              </div>
              <div className={styles.formValuesContent}>
                <strong>Topic:</strong> {currentTopic || 'Not set'}<br/>
                <strong>Audience:</strong> {currentAudience || 'Readers (default)'}<br/>
                <strong>Days:</strong> {currentDays || '30 (default)'}<br/>
                <strong>Start Date:</strong> {currentStartDate ? currentStartDate : 'Today (default)'}<br/>
                <strong>Strategy Notes:</strong> {currentStrategyNotes ? `"${currentStrategyNotes.substring(0, 100)}${currentStrategyNotes.length > 100 ? '...' : ''}"` : 'None'}
              </div>
            </div>

            {/* Full Prompt Text */}
            <pre className={styles.promptText}>
              {generatePromptPreview}
            </pre>
          </div>
        </div>
      )}

      <div className={styles.buttonContainer}>
        <button
          type="button"
          onClick={generatePreview}
          disabled={!canRun || loading || !currentTopic}
          className={styles.generateButton}
        >
          {loading ? '🔄 Generating...' : '🤖 Generate Plan Items'}
        </button>
        <button
          type="button"
          onClick={saveGeneratedItems}
          disabled={!canRun || saving || !Array.isArray(itemsField?.value) || (itemsField?.value?.length ?? 0) === 0}
          className={styles.saveButton}
        >
          {saving ? '💾 Saving...' : `💾 Save Generated Items (${Array.isArray(itemsField?.value) ? itemsField.value.length : 0})`}
        </button>
      </div>
      {message && (
        <div className={
          (message.includes('Successfully') || message.startsWith('Saved ')) 
            ? styles.successMessage 
            : styles.errorMessage
        }>
          {message}
        </div>
      )}
      {!canRun && (
        <div className={styles.notAvailableMessage}>
          This action is available on Content Plans after saving.
        </div>
      )}
      {!currentTopic && canRun && (
        <div className={styles.warningMessage}>
          Please enter a topic to generate the content plan.
        </div>
      )}



      {/* Debug Panel */}
      {debugInfo && (
        <div className={styles.debugPanel}>
          <div 
            className={styles.debugHeader}
            onClick={() => setShowDebug(!showDebug)}
          >
            <div className={styles.debugTitle}>
              🔍 ChatGPT Debug Information
              {debugInfo.errors.length > 0 && (
                <span className={styles.debugErrorCount}>
                  ({debugInfo.errors.length} error{debugInfo.errors.length !== 1 ? 's' : ''})
                </span>
              )}
              {debugInfo.warnings.length > 0 && (
                <span className={styles.debugWarningCount}>
                  ({debugInfo.warnings.length} warning{debugInfo.warnings.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            <div className={styles.debugToggle}>
              {showDebug ? '▼' : '▶'}
            </div>
          </div>

          {showDebug && (
            <div className={styles.debugContent}>
              {/* Errors */}
              {debugInfo.errors.length > 0 && (
                <div className={styles.debugSection}>
                  <div className={styles.debugErrorTitle}>
                    🚨 Errors:
                  </div>
                  {debugInfo.errors.map((error, index) => (
                    <div key={index} className={styles.debugErrorItem}>
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {debugInfo.warnings.length > 0 && (
                <div className={styles.debugSection}>
                  <div className={styles.debugWarningTitle}>
                    ⚠️ Warnings:
                  </div>
                  {debugInfo.warnings.map((warning, index) => (
                    <div key={index} className={styles.debugWarningItem}>
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              {/* Prompt */}
              <div className={styles.debugSection}>
                <div className={styles.debugSectionHeader}>
                  <div className={styles.debugSectionTitle}>
                    📝 Prompt Sent to ChatGPT:
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(debugInfo.prompt, 'Prompt')}
                    className={styles.copyButton}
                  >
                    📋 Copy
                  </button>
                </div>
                <pre className={styles.debugCodeBlock}>
                  {debugInfo.prompt}
                </pre>
              </div>

              {/* Raw Response */}
              <div className={styles.debugSection}>
                <div className={styles.debugSectionHeader}>
                  <div className={styles.debugSectionTitle}>
                    🤖 Raw ChatGPT Response:
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(debugInfo.rawResponse, 'Raw Response')}
                    className={styles.copyButton}
                  >
                    📋 Copy
                  </button>
                </div>
                <pre className={styles.debugCodeBlock}>
                  {debugInfo.rawResponse}
                </pre>
              </div>

              {/* Parsed Response */}
              {debugInfo.parsedResponse && (
                <div className={styles.debugSection}>
                  <div className={styles.debugSectionHeader}>
                    <div className={styles.debugSectionTitle}>
                      🔧 Parsed JSON Response:
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formatJSON(debugInfo.parsedResponse), 'Parsed Response')}
                      className={styles.copyButton}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <pre className={styles.debugCodeBlock}>
                    {formatJSON(debugInfo.parsedResponse)}
                  </pre>
                </div>
              )}

              {/* Final Items */}
              <div className={styles.debugSection}>
                <div className={styles.debugSectionHeader}>
                  <div className={styles.debugSectionTitle}>
                    ✅ Final Items Sent to Database:
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formatJSON(debugInfo.finalItems), 'Final Items')}
                    className={styles.copyButton}
                  >
                    📋 Copy
                  </button>
                </div>
                <pre className={styles.debugCodeBlock}>
                  {formatJSON(debugInfo.finalItems)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GeneratePlanButton