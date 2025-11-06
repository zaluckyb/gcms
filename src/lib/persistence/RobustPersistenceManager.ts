import type { Payload, PayloadRequest } from 'payload'
import type { 
  SaveOptions, 
  SaveResult, 
  TransactionContext, 
  PlanItem,
  SaveError,
  ErrorType
} from './types'
import { ConnectionValidator } from './ConnectionValidator'
import { SchemaValidator } from './SchemaValidator'
import { TransactionLogger } from './TransactionLogger'
import { RetryManager } from './RetryManager'

export class RobustPersistenceManager {
  private connectionValidator: ConnectionValidator
  private schemaValidator: SchemaValidator
  private retryManager: RetryManager
  private logger: TransactionLogger

  constructor(private payload: Payload, req?: PayloadRequest) {
    this.connectionValidator = new ConnectionValidator(payload)
    this.schemaValidator = new SchemaValidator()
    this.logger = new TransactionLogger(req || payload)
    this.retryManager = new RetryManager(this.logger)
  }

  async saveWithTransaction(
    contentPlanId: number,
    items: any[],
    options: SaveOptions = {},
    userId?: number
  ): Promise<SaveResult> {
    const context: TransactionContext = {
      transactionId: this.generateTransactionId(),
      startTime: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000,
      contentPlanId,
      userId: userId || 0,
      operation: 'save_generated'
    }

    const contextLogger = this.logger.withContext(context)
    await contextLogger.logTransactionStart(context)

    try {
      // Log transaction start to database
      await this.logTransactionStart(context)

      const result = await this.retryManager.executeWithRetry(context, async () => {
        // Step 1: Validate connection
        await contextLogger.info('Validating database connection')
        const connectionHealth = await this.connectionValidator.validateConnection()
        if (!connectionHealth.connected) {
          throw new Error(`Database connection is not healthy: ${connectionHealth.error || 'Unknown error'}`)
        }
        await contextLogger.info('Database connection validated', { 
          latency: connectionHealth.latency,
          poolStatus: connectionHealth.poolStatus 
        })

        // Step 2: Validate schema if requested
        let schemaValidation = 'skipped'
        if (options.validateSchema !== false) {
          await contextLogger.info('Validating item schemas')
          const validation = await this.schemaValidator.validateItems(items)
          if (!validation.valid) {
            const errorMessage = `Schema validation failed: ${validation.errors.map(e => e.message).join(', ')}`
            await contextLogger.error('Schema validation failed', { errors: validation.errors })
            throw new Error(errorMessage)
          }
          schemaValidation = 'passed'
          await contextLogger.info('Schema validation passed', { 
            itemCount: items.length,
            warnings: validation.warnings.length 
          })
        }

        // Step 3: Sanitize data
        await contextLogger.info('Sanitizing item data')
        const sanitizedItems = await this.schemaValidator.sanitizeItems(items)
        await contextLogger.info('Data sanitization completed', { 
          originalCount: items.length,
          sanitizedCount: sanitizedItems.length 
        })

        // Step 4: Validate unique constraints
        const uniqueValidation = this.schemaValidator.validateUniqueConstraints(sanitizedItems)
        if (!uniqueValidation.valid) {
          const errorMessage = `Unique constraint validation failed: ${uniqueValidation.errors.map(e => e.message).join(', ')}`
          await contextLogger.error('Unique constraint validation failed', { errors: uniqueValidation.errors })
          throw new Error(errorMessage)
        }

        // Step 5: Execute atomic save
        await contextLogger.info('Starting atomic save operation')
        const saveResult = await this.performAtomicSave(context, sanitizedItems)
        await contextLogger.info('Atomic save operation completed successfully')

        return {
          success: true,
          transactionId: context.transactionId,
          itemsSaved: sanitizedItems.length,
          errors: [],
          retryAttempts: context.retryCount,
          executionTime: Date.now() - context.startTime,
          metadata: {
            connectionStatus: 'healthy',
            schemaValidation,
            dataIntegrity: 'verified',
            version: saveResult.version
          }
        }
      })

      await this.logTransactionSuccess(context, result)
      await contextLogger.logTransactionSuccess(context, {
        itemsSaved: result.itemsSaved,
        executionTime: result.executionTime
      })
      
      return result

    } catch (error) {
      const saveError = this.handleSaveError(error, context)
      const errorResult: SaveResult = {
        success: false,
        transactionId: context.transactionId,
        itemsSaved: 0,
        errors: [saveError.message],
        retryAttempts: context.retryCount,
        executionTime: Date.now() - context.startTime,
        metadata: {
          connectionStatus: 'unknown',
          schemaValidation: 'failed',
          dataIntegrity: 'compromised'
        }
      }

      await this.logTransactionFailure(context, error instanceof Error ? error : new Error(String(error)))
      await contextLogger.logTransactionFailure(context, error instanceof Error ? error : new Error(String(error)))
      
      return errorResult
    }
  }

  private async performAtomicSave(
    context: TransactionContext,
    items: PlanItem[]
  ): Promise<{ version: number }> {
    const contextLogger = this.logger.withContext(context)
    
    // Get current document to verify it exists
    const currentDoc = await this.payload.findByID({
      collection: 'contentPlans',
      id: context.contentPlanId
    })

    if (!currentDoc) {
      throw new Error(`Content plan ${context.contentPlanId} not found`)
    }

    await contextLogger.info('Starting database transaction', { 
      contentPlanId: context.contentPlanId,
      itemCount: items.length 
    })

    // Transform PlanItem[] to ContentPlans.contentItems schema
    const itemsForPayload = items.map(item => ({
      title: item.title,
      slug: item.slug,
      description: item.description ?? '',
      keywords: (item.keywords ?? [])
        .map(k => ({ keyword: typeof (k as any) === 'string' ? (k as any) : (k as any).value }))
        .filter(k => typeof k.keyword === 'string' && k.keyword.trim().length > 0),
    }))

    // Use Payload's built-in transaction support if available
    // For now, we'll use a two-step approach with error handling
    try {
      // Step 1: Clear existing items
      await contextLogger.info('Clearing existing items')
      await this.payload.update({
        collection: 'contentPlans',
        id: context.contentPlanId,
        data: { 
          contentItems: []
        }
      })

      // Step 2: Save new items
      await contextLogger.info('Saving new items')
      const updatedDoc = await this.payload.update({
        collection: 'contentPlans',
        id: context.contentPlanId,
        data: {
          contentItems: itemsForPayload,
          status: 'active'
        }
      })

      // Verify the save was successful
      if (!updatedDoc || !Array.isArray((updatedDoc as any).contentItems) || (updatedDoc as any).contentItems.length !== itemsForPayload.length) {
        throw new Error('Save verification failed: item count mismatch')
      }

      await contextLogger.info('Transaction completed successfully', { 
        savedItemCount: (updatedDoc as any).contentItems.length
      })

      return { version: 1 }

    } catch (error) {
      await contextLogger.error('Transaction failed, attempting rollback', { 
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Attempt to rollback by restoring original state
      try {
        await this.payload.update({
          collection: 'contentPlans',
          id: context.contentPlanId,
          data: { 
            contentItems: (currentDoc as any).contentItems || []
          }
        })
        await contextLogger.info('Rollback completed successfully')
      } catch (rollbackError) {
        await contextLogger.error('Rollback failed', { 
          rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
        })
      }
      
      throw error
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async logTransactionStart(context: TransactionContext): Promise<void> {
    try {
      await this.payload.create({
        collection: 'contentPlanTransactions',
        data: {
          transactionId: context.transactionId,
          contentPlanId: context.contentPlanId,
          // userId removed to match schema
          operation: context.operation,
          status: 'in_progress',
          retryCount: 0,
          metadata: {
            maxRetries: context.maxRetries,
            timeout: context.timeout,
          },
        }
      })
    } catch (error) {
      await this.logger.error('Failed to log transaction start', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  private async logTransactionSuccess(context: TransactionContext, result: SaveResult): Promise<void> {
    try {
      await this.payload.create({
        collection: 'contentPlanTransactions',
        data: {
          transactionId: context.transactionId,
          contentPlanId: context.contentPlanId,
          // userId removed to match schema
          operation: context.operation,
          status: 'committed',
          executionTimeMs: result.executionTime,
          completedAt: new Date().toISOString(),
          metadata: {
            connectionStatus: result.metadata.connectionStatus,
            schemaValidation: result.metadata.schemaValidation,
            dataIntegrity: result.metadata.dataIntegrity,
            itemsSaved: result.itemsSaved,
          },
        }
      })
    } catch (error) {
      await this.logger.error('Failed to log transaction success', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  private async logTransactionFailure(context: TransactionContext, error: Error): Promise<void> {
    try {
      await this.payload.create({
        collection: 'contentPlanTransactions',
        data: {
          transactionId: context.transactionId,
          contentPlanId: context.contentPlanId,
          // userId removed to match schema
          operation: context.operation,
          status: 'failed',
          errorDetails: error.message,
          retryCount: context.retryCount,
          executionTimeMs: Date.now() - context.startTime,
          completedAt: new Date().toISOString(),
          metadata: {
            stack: error.stack,
          }
        }
      })
    } catch (logError) {
      await this.logger.error('Failed to log transaction failure', { error: logError instanceof Error ? logError.message : String(logError) })
    }
  }

  private handleSaveError(error: unknown, context: TransactionContext): SaveError {
    const err = error instanceof Error ? error : new Error(String(error))

    const message = err.message.toLowerCase()
    let errorType: ErrorType = 'UNKNOWN_ERROR'
    if (message.includes('connection') || message.includes('network')) errorType = 'CONNECTION_ERROR'
    else if (message.includes('timeout')) errorType = 'TIMEOUT_ERROR'
    else if (message.includes('constraint') || message.includes('duplicate')) errorType = 'CONSTRAINT_VIOLATION'
    else if (message.includes('deadlock')) errorType = 'DEADLOCK_ERROR'
    else if (message.includes('serialization')) errorType = 'SERIALIZATION_ERROR'
    else if (message.includes('validation') || message.includes('invalid')) errorType = 'VALIDATION_ERROR'
    else if (message.includes('schema') || message.includes('column')) errorType = 'SCHEMA_ERROR'

    const recoverable = (
      errorType === 'CONNECTION_ERROR' ||
      errorType === 'TIMEOUT_ERROR' ||
      errorType === 'DEADLOCK_ERROR' ||
      errorType === 'SERIALIZATION_ERROR'
    )

    this.logger.error('Save operation failed', {
      error: err.message,
      errorType,
      context
    })

    return {
      type: errorType,
      message: err.message,
      transactionId: context.transactionId,
      retryCount: context.retryCount,
      timestamp: new Date(),
      recoverable,
      details: {
        stack: err.stack,
        context
      }
    }
  }

  // Utilities to expose validation for testing
  async validateItems(items: any[]) {
    return this.schemaValidator.validateItems(items)
  }
}