import type { PayloadRequest, Payload } from 'payload'
import type { LogEntry, TransactionContext } from './types'

export class TransactionLogger {
  private payload?: Payload
  private req?: PayloadRequest
  private context?: Partial<TransactionContext>

  constructor(reqOrPayload?: PayloadRequest | Payload, context?: Partial<TransactionContext>) {
    if (reqOrPayload) {
      if ('payload' in reqOrPayload) {
        this.req = reqOrPayload
        this.payload = reqOrPayload.payload
      } else {
        this.payload = reqOrPayload
      }
    }
    this.context = context
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      transactionId: this.context?.transactionId,
      contentPlanId: this.context?.contentPlanId,
      userId: this.context?.userId,
      metadata: {
        ...metadata,
        operation: this.context?.operation,
        retryCount: this.context?.retryCount,
      },
      timestamp: new Date(),
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      // Log to console for immediate visibility
      const logMessage = `[${entry.level.toUpperCase()}] ${entry.message}`
      const logData = {
        transactionId: entry.transactionId,
        contentPlanId: entry.contentPlanId,
        userId: entry.userId,
        metadata: entry.metadata,
      }

      switch (entry.level) {
        case 'error':
          console.error(logMessage, logData)
          break
        case 'warn':
          console.warn(logMessage, logData)
          break
        case 'debug':
          console.debug(logMessage, logData)
          break
        default:
          console.log(logMessage, logData)
      }

      // Use Payload logger if available
      if (this.payload?.logger) {
        this.payload.logger[entry.level]?.(entry.message)
      } else if (this.req?.payload?.logger) {
        this.req.payload.logger[entry.level]?.(entry.message)
      }

      // Note: Database persistence removed as contentPlanTransactions collection
      // is for transaction metadata, not individual log entries
    } catch (error) {
      // Fallback to console if all else fails
      console.error('TransactionLogger error:', error)
      console.error('Original log entry:', entry)
    }
  }

  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    const entry = this.createLogEntry('info', message, metadata)
    await this.persistLog(entry)
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    const entry = this.createLogEntry('warn', message, metadata)
    await this.persistLog(entry)
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    const entry = this.createLogEntry('error', message, metadata)
    await this.persistLog(entry)
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    const entry = this.createLogEntry('debug', message, metadata)
    await this.persistLog(entry)
  }

  // Create a new logger instance with updated context
  withContext(context: Partial<TransactionContext>): TransactionLogger {
    return new TransactionLogger(this.req || this.payload, {
      ...this.context,
      ...context,
    })
  }

  // Log transaction lifecycle events
  async logTransactionStart(context: TransactionContext): Promise<void> {
    await this.info('Transaction started', {
      operation: context.operation,
      maxRetries: context.maxRetries,
      timeout: context.timeout,
    })
  }

  async logTransactionSuccess(
    context: TransactionContext,
    result: { itemsSaved: number; executionTime: number }
  ): Promise<void> {
    await this.info('Transaction completed successfully', {
      operation: context.operation,
      itemsSaved: result.itemsSaved,
      executionTime: result.executionTime,
      retryAttempts: context.retryCount,
    })
  }

  async logTransactionFailure(
    context: TransactionContext,
    error: Error
  ): Promise<void> {
    await this.error('Transaction failed', {
      operation: context.operation,
      error: error.message,
      stack: error.stack,
      retryAttempts: context.retryCount,
      executionTime: Date.now() - context.startTime,
    })
  }

  async logRetryAttempt(
    context: TransactionContext,
    attempt: number,
    error: Error
  ): Promise<void> {
    await this.warn(`Retry attempt ${attempt + 1}/${context.maxRetries}`, {
      operation: context.operation,
      error: error.message,
      attempt: attempt + 1,
      maxRetries: context.maxRetries,
    })
  }
}