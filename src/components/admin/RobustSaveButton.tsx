"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

interface SaveOptions {
  maxRetries?: number
  timeout?: number
  validateSchema?: boolean
  enableLogging?: boolean
}

interface SaveResult {
  success: boolean
  transactionId: string
  itemsSaved: number
  retryAttempts: number
  executionTime: number
  errors?: string[]
  metadata?: {
    connectionStatus: string
    schemaValidation: string
    dataIntegrity: string
    version?: number
  }
}

interface ConnectionHealth {
  connected: boolean
  latency?: number
  poolStatus?: any
  error?: string
  serverInfo?: any
  stability?: any
}

const RobustSaveButton = () => {
  const { id, initialData, collectionSlug } = useDocumentInfo() as any
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<SaveResult | null>(null)
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth | null>(null)
  const [saveOptions, setSaveOptions] = useState<SaveOptions>({
    maxRetries: 3,
    timeout: 30000,
    validateSchema: true,
    enableLogging: true
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const docId = React.useMemo(() => {
    return id || initialData?.id || initialData?._id || null
  }, [id, initialData])

  const canRun = !!docId && collectionSlug === 'contentPlans'

  // Form field hooks
  const itemsField = useField<any[]>({ path: 'items' })
  const statusField = useField<string>({ path: 'status' })

  const currentItems = itemsField.value || initialData?.items || []
  const itemsArray = Array.isArray(currentItems) ? currentItems : []

  const shouldShowButton = Boolean(canRun && itemsArray.length > 0)

  // Check connection health on component mount
  useEffect(() => {
    if (canRun) {
      checkConnectionHealth()
    }
  }, [canRun])

  const checkConnectionHealth = useCallback(async () => {
    if (!docId) return
    
    setCheckingHealth(true)
    try {
      const res = await fetch(`/api/contentPlans/${docId}/connection-health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await res.json()
      if (res.ok && data.ok) {
        setConnectionHealth(data.health)
      } else {
        setConnectionHealth({ connected: false, error: data.error || 'Unknown error' })
      }
    } catch (error) {
      setConnectionHealth({ connected: false, error: String(error) })
    } finally {
      setCheckingHealth(false)
    }
  }, [docId])

  const validateItems = useCallback(async () => {
    if (!docId || itemsArray.length === 0) return
    
    setValidating(true)
    setValidationResult(null)
    try {
      const res = await fetch(`/api/contentPlans/${docId}/validate-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsArray })
      })
      
      const data = await res.json()
      if (res.ok && data.ok) {
        setValidationResult(data.validation)
        if (data.validation.valid) {
          setMessage(`✅ Validation passed! ${itemsArray.length} items are valid.`)
        } else {
          setMessage(`❌ Validation failed: ${data.validation.errors.length} error(s) found.`)
        }
      } else {
        setMessage(`❌ Validation failed: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Validation error: ${String(error)}`)
    } finally {
      setValidating(false)
    }
  }, [docId, itemsArray])

  const robustSave = useCallback(async () => {
    if (!docId) {
      setMessage('Save the document first to get an ID.')
      return
    }
    
    if (itemsArray.length === 0) {
      setMessage('No items to save. Generate content first.')
      return
    }
    
    setLoading(true)
    setMessage(null)
    setLastResult(null)
    
    try {
      const res = await fetch(`/api/contentPlans/${docId}/robust-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: itemsArray,
          options: saveOptions
        })
      })
      
      const data = await res.json()
      
      if (res.ok && data.ok) {
        const result: SaveResult = {
          success: true,
          transactionId: data.transactionId,
          itemsSaved: data.itemsSaved,
          retryAttempts: data.retryAttempts,
          executionTime: data.executionTime,
          metadata: data.metadata
        }
        setLastResult(result)
        
        // Update status field
        if (statusField?.setValue) {
          statusField.setValue('generated')
        }
        
        let successMsg = `✅ Robust save completed! ${data.itemsSaved} items saved`
        if (data.retryAttempts > 0) {
          successMsg += ` (${data.retryAttempts} retries)`
        }
        successMsg += ` in ${data.executionTime}ms`
        
        setMessage(successMsg)
        
        // Refresh connection health after successful save
        setTimeout(() => checkConnectionHealth(), 1000)
        
      } else {
        const result: SaveResult = {
          success: false,
          transactionId: data.transactionId || 'unknown',
          itemsSaved: 0,
          retryAttempts: data.retryAttempts || 0,
          executionTime: data.executionTime || 0,
          errors: data.errors || [data.error || 'Unknown error'],
          metadata: data.metadata
        }
        setLastResult(result)
        
        let errorMsg = `❌ Robust save failed: ${data.errors?.[0] || data.error || 'Unknown error'}`
        if (data.retryAttempts > 0) {
          errorMsg += ` (${data.retryAttempts} retries attempted)`
        }
        
        setMessage(errorMsg)
      }
    } catch (error) {
      setMessage(`❌ Network error: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [docId, itemsArray, saveOptions, statusField, checkConnectionHealth])

  const getConnectionStatusColor = () => {
    if (!connectionHealth) return 'text-gray-500'
    return connectionHealth.connected ? 'text-green-600' : 'text-red-600'
  }

  const getConnectionStatusText = () => {
    if (checkingHealth) return 'Checking...'
    if (!connectionHealth) return 'Unknown'
    if (connectionHealth.connected) {
      const latency = connectionHealth.latency ? ` (${connectionHealth.latency}ms)` : ''
      return `Connected${latency}`
    }
    return `Disconnected: ${connectionHealth.error || 'Unknown error'}`
  }

  if (!shouldShowButton) {
    return null
  }

  return (
    <div className="robust-save-component" style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      padding: '16px', 
      marginTop: '16px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
          Robust Data Persistence
        </h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
          Advanced save with transaction logging, retry logic, and validation
        </p>
      </div>

      {/* Connection Health Status */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: connectionHealth?.connected ? '#10b981' : '#ef4444',
          marginRight: '8px'
        }} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Database: </span>
        <span className={getConnectionStatusColor()} style={{ fontSize: '14px', marginLeft: '4px' }}>
          {getConnectionStatusText()}
        </span>
        <button
          type="button"
          onClick={checkConnectionHealth}
          disabled={checkingHealth}
          style={{
            marginLeft: 'auto',
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: checkingHealth ? 'not-allowed' : 'pointer'
          }}
        >
          {checkingHealth ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={validateItems}
          disabled={validating || itemsArray.length === 0}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: (validating || itemsArray.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {validating ? 'Validating...' : 'Validate Items'}
        </button>

        <button
          type="button"
          onClick={robustSave}
          disabled={loading || itemsArray.length === 0 || !connectionHealth?.connected}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: (loading || itemsArray.length === 0 || !connectionHealth?.connected) ? '#9ca3af' : '#3b82f6',
            color: '#ffffff',
            cursor: (loading || itemsArray.length === 0 || !connectionHealth?.connected) ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {loading ? 'Saving...' : `Robust Save (${itemsArray.length} items)`}
        </button>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer'
          }}
        >
          {showAdvanced ? 'Hide' : 'Options'}
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div style={{ 
          marginBottom: '12px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Save Options</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px' }}>
              Max Retries:
              <input
                type="number"
                min="0"
                max="10"
                value={saveOptions.maxRetries}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))}
                style={{ 
                  width: '100%', 
                  padding: '4px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px',
                  marginTop: '2px'
                }}
              />
            </label>
            
            <label style={{ fontSize: '12px' }}>
              Timeout (ms):
              <input
                type="number"
                min="5000"
                max="120000"
                step="5000"
                value={saveOptions.timeout}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
                style={{ 
                  width: '100%', 
                  padding: '4px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px',
                  marginTop: '2px'
                }}
              />
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={saveOptions.validateSchema}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, validateSchema: e.target.checked }))}
                style={{ marginRight: '4px' }}
              />
              Schema Validation
            </label>
            
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={saveOptions.enableLogging}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, enableLogging: e.target.checked }))}
                style={{ marginRight: '4px' }}
              />
              Enable Logging
            </label>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div style={{ 
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: validationResult.valid ? '#f0fdf4' : '#fef2f2',
          borderRadius: '4px',
          border: `1px solid ${validationResult.valid ? '#bbf7d0' : '#fecaca'}`
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Validation: {validationResult.valid ? '✅ Passed' : '❌ Failed'}
          </div>
          {validationResult.errors?.length > 0 && (
            <div style={{ fontSize: '12px', color: '#dc2626' }}>
              Errors: {validationResult.errors.map((err: any) => err.message).join(', ')}
            </div>
          )}
          {validationResult.warnings?.length > 0 && (
            <div style={{ fontSize: '12px', color: '#d97706' }}>
              Warnings: {validationResult.warnings.map((warn: any) => warn.message).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Last Save Result */}
      {lastResult && (
        <div style={{ 
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: lastResult.success ? '#f0fdf4' : '#fef2f2',
          borderRadius: '4px',
          border: `1px solid ${lastResult.success ? '#bbf7d0' : '#fecaca'}`
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Last Save Result
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Transaction ID: {lastResult.transactionId}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Items Saved: {lastResult.itemsSaved} | Retries: {lastResult.retryAttempts} | Time: {lastResult.executionTime}ms
          </div>
          {lastResult.metadata && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Connection: {lastResult.metadata.connectionStatus} | 
              Schema: {lastResult.metadata.schemaValidation} | 
              Integrity: {lastResult.metadata.dataIntegrity}
              {lastResult.metadata.version && ` | Version: ${lastResult.metadata.version}`}
            </div>
          )}
          {lastResult.errors && lastResult.errors.length > 0 && (
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
              Errors: {lastResult.errors.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div style={{ 
          padding: '8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

export default RobustSaveButton