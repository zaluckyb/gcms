// Core types for robust persistence system
export interface SaveOptions {
  timeout?: number
  maxRetries?: number
  validateSchema?: boolean
  enableOptimisticLocking?: boolean
  enableLogging?: boolean
}

export interface SaveResult {
  success: boolean
  transactionId: string
  itemsSaved: number
  errors: string[]
  retryAttempts: number
  executionTime: number
  metadata: {
    connectionStatus: string
    schemaValidation: string
    dataIntegrity: string
    version?: number
  }
}

export interface TransactionContext {
  transactionId: string
  startTime: number
  retryCount: number
  maxRetries: number
  timeout: number
  contentPlanId: number
  userId: number
  operation: 'save_generated' | 'update' | 'delete'
}

export interface ConnectionHealth {
  connected: boolean
  latency: number
  poolStatus: {
    total: number
    idle: number
    active: number
  } | null
  lastCheck: Date
  version?: string
  error?: string
}

export interface ValidationError {
  index: number
  field: string
  message: string
  value: unknown
}

export interface ValidationWarning {
  index: number
  field: string
  message: string
  value: unknown
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface PlanItem {
  date: string
  title: string
  slug: string
  description?: string
  keywords: Array<{ value: string }>
  approved: boolean
  post?: string | null
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  transactionId?: string
  contentPlanId?: number
  userId?: number
  metadata?: Record<string, any>
  timestamp: Date
}

export type ErrorType = 
  | 'CONNECTION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CONSTRAINT_VIOLATION'
  | 'DEADLOCK_ERROR'
  | 'SERIALIZATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'SCHEMA_ERROR'
  | 'UNKNOWN_ERROR'

export interface SaveError {
  type: ErrorType
  message: string
  transactionId: string
  retryCount: number
  timestamp: Date
  recoverable: boolean
  details: {
    stack?: string
    context: TransactionContext
  }
}

export interface PerformanceMetrics {
  averageExecutionTime: number
  successRate: number
  retryRate: number
  connectionPoolUtilization: number
  errorDistribution: Record<string, number>
  totalOperations: number
  lastUpdated: Date
}