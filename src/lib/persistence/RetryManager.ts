import type { TransactionContext, ErrorType } from './types'
import { TransactionLogger } from './TransactionLogger'

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

export class RetryManager {
  private logger: TransactionLogger

  constructor(logger?: TransactionLogger) {
    this.logger = logger || new TransactionLogger()
  }

  async executeWithRetry<T>(
    context: TransactionContext,
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error
    const contextLogger = this.logger.withContext(context)
    
    for (let attempt = 0; attempt <= context.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateBackoffDelay(attempt)
          await contextLogger.info(`Waiting ${delay}ms before retry attempt ${attempt}`)
          await this.sleep(delay)
        }
        
        // Update retry count in context
        context.retryCount = attempt
        
        // Execute operation with timeout
        return await this.withTimeout(operation(), context.timeout)
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Log the error
        await contextLogger.error(`Attempt ${attempt + 1} failed`, {
          error: lastError.message,
          stack: lastError.stack,
          attempt: attempt + 1,
          maxRetries: context.maxRetries
        })
        
        // Check if we should retry
        if (!this.isRetryableError(lastError) || attempt === context.maxRetries) {
          await contextLogger.error('Operation failed after all retry attempts', {
            totalAttempts: attempt + 1,
            finalError: lastError.message
          })
          throw new RetryError(
            `Operation failed after ${attempt + 1} attempts: ${lastError.message}`,
            attempt + 1,
            lastError
          )
        }
        
        await contextLogger.logRetryAttempt(context, attempt, lastError)
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new RetryError(
      `Operation failed after ${context.maxRetries + 1} attempts: ${lastError!.message}`,
      context.maxRetries + 1,
      lastError!
    )
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    // Base delay: 1000ms, max delay: 10000ms
    const baseDelay = 1000
    const maxDelay = 10000
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
    
    // Add jitter (±25% of the delay)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
    
    return Math.max(100, Math.floor(exponentialDelay + jitter))
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    const errorType = this.categorizeError(error)
    
    // Retryable error types
    const retryableTypes: ErrorType[] = [
      'CONNECTION_ERROR',
      'TIMEOUT_ERROR',
      'DEADLOCK_ERROR',
      'SERIALIZATION_ERROR'
    ]
    
    // Non-retryable error types
    const nonRetryableTypes: ErrorType[] = [
      'CONSTRAINT_VIOLATION',
      'VALIDATION_ERROR',
      'SCHEMA_ERROR'
    ]
    
    if (nonRetryableTypes.includes(errorType)) {
      return false
    }
    
    if (retryableTypes.includes(errorType)) {
      return true
    }
    
    // Additional message-based checks
    const retryablePatterns = [
      'connection',
      'timeout',
      'deadlock',
      'serialization failure',
      'could not serialize access',
      'connection terminated',
      'server closed the connection',
      'connection reset',
      'network error',
      'temporary failure'
    ]
    
    const nonRetryablePatterns = [
      'invalid input syntax',
      'duplicate key value',
      'foreign key constraint',
      'check constraint',
      'not null constraint',
      'unique constraint',
      'permission denied',
      'authentication failed',
      'invalid credentials'
    ]
    
    // Check for non-retryable patterns first
    for (const pattern of nonRetryablePatterns) {
      if (message.includes(pattern)) {
        return false
      }
    }
    
    // Check for retryable patterns
    for (const pattern of retryablePatterns) {
      if (message.includes(pattern)) {
        return true
      }
    }
    
    // Default to non-retryable for unknown errors
    return false
  }

  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    
    if (message.includes('connection') || message.includes('network')) {
      return 'CONNECTION_ERROR'
    }
    if (message.includes('timeout')) {
      return 'TIMEOUT_ERROR'
    }
    if (message.includes('constraint') || message.includes('duplicate key')) {
      return 'CONSTRAINT_VIOLATION'
    }
    if (message.includes('deadlock')) {
      return 'DEADLOCK_ERROR'
    }
    if (message.includes('serialization') || message.includes('could not serialize')) {
      return 'SERIALIZATION_ERROR'
    }
    if (message.includes('invalid input syntax') || message.includes('invalid')) {
      return 'VALIDATION_ERROR'
    }
    if (message.includes('schema') || message.includes('column') || message.includes('table')) {
      return 'SCHEMA_ERROR'
    }
    
    return 'UNKNOWN_ERROR'
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    if (timeoutMs <= 0) {
      return promise
    }

    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Utility method to execute a simple retry without full context
  async simpleRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000)
          await this.sleep(delay)
        }
        
        return await operation()
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (!this.isRetryableError(lastError) || attempt === maxRetries) {
          throw lastError
        }
      }
    }
    
    throw lastError!
  }
}