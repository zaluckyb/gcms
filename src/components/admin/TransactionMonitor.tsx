"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

interface Transaction {
  id: number
  transactionId: string
  contentPlanId: number
  operation: string
  status: 'pending' | 'in_progress' | 'committed' | 'failed' | 'rolled_back'
  errorDetails?: string
  metadata?: any
  retryCount: number
  executionTimeMs?: number
  createdAt: string
  updatedAt: string
  completedAt?: string
}

const TransactionMonitor = () => {
  const { id, initialData, collectionSlug } = useDocumentInfo() as any
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const docId = React.useMemo(() => {
    return id || initialData?.id || initialData?._id || null
  }, [id, initialData])

  const canRun = !!docId && collectionSlug === 'contentPlans'

  const fetchTransactions = useCallback(async () => {
    if (!docId) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/contentPlanTransactions?where[contentPlanId][equals]=${docId}&sort=-createdAt&limit=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.docs || [])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [docId])

  useEffect(() => {
    if (canRun) {
      fetchTransactions()
    }
  }, [canRun, fetchTransactions])

  useEffect(() => {
    if (autoRefresh && canRun) {
      const interval = setInterval(fetchTransactions, 5000) // Refresh every 5 seconds
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [autoRefresh, canRun, fetchTransactions])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'committed': return '#10b981'
      case 'failed': return '#ef4444'
      case 'pending': return '#f59e0b'
      case 'in_progress': return '#3b82f6'
      case 'rolled_back': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'committed': return '✅'
      case 'failed': return '❌'
      case 'pending': return '⏳'
      case 'in_progress': return '🔄'
      case 'rolled_back': return '↩️'
      default: return '❓'
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (!canRun) {
    return null
  }

  return (
    <div className="transaction-monitor" style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      padding: '16px', 
      marginTop: '16px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
            Transaction History
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
            Recent persistence operations for this content plan
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            Auto-refresh
          </label>
          
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px', 
          color: '#6b7280',
          fontSize: '14px'
        }}>
          {loading ? 'Loading transactions...' : 'No transactions found for this content plan.'}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '120px 1fr 100px 80px 120px 150px',
            gap: '8px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151'
          }}>
            <div>Status</div>
            <div>Transaction ID</div>
            <div>Operation</div>
            <div>Duration</div>
            <div>Retries</div>
            <div>Created</div>
          </div>
          
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '120px 1fr 100px 80px 120px 150px',
                gap: '8px',
                padding: '12px',
                borderBottom: '1px solid #f3f4f6',
                fontSize: '14px',
                alignItems: 'center'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: getStatusColor(transaction.status),
                fontWeight: '500'
              }}>
                <span style={{ marginRight: '4px' }}>
                  {getStatusIcon(transaction.status)}
                </span>
                {transaction.status}
              </div>
              
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '12px',
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {transaction.transactionId}
              </div>
              
              <div style={{ fontSize: '12px' }}>
                {transaction.operation}
              </div>
              
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatDuration(transaction.executionTimeMs)}
              </div>
              
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {transaction.retryCount > 0 ? (
                  <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                    {transaction.retryCount} retries
                  </span>
                ) : (
                  'No retries'
                )}
              </div>
              
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatDate(transaction.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Details for Failed Transactions */}
      {transactions.some(t => t.status === 'failed' && t.errorDetails) && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
            Recent Errors
          </h4>
          {transactions
            .filter(t => t.status === 'failed' && t.errorDetails)
            .slice(0, 3)
            .map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  padding: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {transaction.transactionId} - {formatDate(transaction.createdAt)}
                </div>
                <div style={{ fontSize: '14px', color: '#dc2626' }}>
                  {transaction.errorDetails}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Summary Statistics */}
      {transactions.length > 0 && (
        <div style={{ 
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
            Summary (Last 20 transactions)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
                {transactions.filter(t => t.status === 'committed').length}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Successful</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>
                {transactions.filter(t => t.status === 'failed').length}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Failed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
                {transactions.filter(t => t.retryCount > 0).length}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>With Retries</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6' }}>
                {transactions.filter(t => t.executionTimeMs && t.executionTimeMs > 5000).length}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Slow (&gt;5s)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionMonitor