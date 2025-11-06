import type { PayloadRequest } from 'payload'
import type { SiteConfig, Post } from './seo-utils'

// Error types for better error handling
export interface FallbackError {
  code: string
  message: string
  context?: any
  timestamp: Date
}

export interface FallbackOptions {
  enableLogging?: boolean
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
  maxRetries?: number
  retryDelay?: number
  fallbackValues?: Partial<SiteConfig>
}

// Default fallback configuration
const DEFAULT_SITE_CONFIG: Partial<SiteConfig> = {
  siteName: 'My Site',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
  siteDescription: 'A modern website built with Payload CMS',
  seoDefaults: {
    metaAuthor: 'Site Author',
    robots: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1',
    themeColor: '#000000',
    language: 'en-ZA',
    revisitAfter: '7 days',
  },
  openGraphDefaults: {
    ogSiteName: 'My Site',
    ogLocale: 'en_ZA',
    ogType: 'website',
    defaultOgImageAlt: 'Site logo',
  },
  twitterDefaults: {
    twitterCard: 'summary_large_image',
  },
  schemaDefaults: {
    generateJSONLD: true,
    defaultSchemaType: 'Article',
    inLanguage: 'en-ZA',
    isAccessibleForFree: true,
  },
}

// Default post values for fallbacks
const DEFAULT_POST_VALUES = {
  title: 'Untitled Post',
  excerpt: 'No description available',
  status: 'draft',
  datePublished: new Date().toISOString(),
  dateModified: new Date().toISOString(),
}

/**
 * Logger utility for fallback operations
 */
class FallbackLogger {
  private options: FallbackOptions

  constructor(options: FallbackOptions = {}) {
    this.options = {
      enableLogging: true,
      logLevel: 'warn',
      ...options,
    }
  }

  log(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: any) {
    if (!this.options.enableLogging) return

    const levels = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(this.options.logLevel || 'warn')
    const messageLevelIndex = levels.indexOf(level)

    if (messageLevelIndex <= currentLevelIndex) {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] [FALLBACK-${level.toUpperCase()}] ${message}`
      
      if (context) {
        console[level](logMessage, context)
      } else {
        console[level](logMessage)
      }
    }
  }

  error(message: string, context?: any) {
    this.log('error', message, context)
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context)
  }

  info(message: string, context?: any) {
    this.log('info', message, context)
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context)
  }
}

/**
 * Retry mechanism for operations that might fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; delay?: number; logger?: FallbackLogger } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, logger } = options
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (logger) {
        logger.warn(`Operation failed on attempt ${attempt}/${maxRetries}`, {
          error: error instanceof Error ? error.message : String(error),
          attempt,
        })
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError!
}

/**
 * Safe site configuration retrieval with fallbacks
 */
export async function getSiteConfigSafely(
  payload: any,
  options: FallbackOptions = {}
): Promise<SiteConfig> {
  const logger = new FallbackLogger(options)
  
  try {
    // Try to fetch site configuration from Payload
    const siteConfig = await withRetry(
      async () => {
        const result = await payload.findGlobal({
          slug: 'site',
          depth: 1,
        })
        return result
      },
      { maxRetries: options.maxRetries || 2, logger }
    )

    if (siteConfig) {
      logger.debug('Site configuration loaded successfully')
      return mergeSiteConfigWithDefaults(siteConfig, options.fallbackValues)
    }
  } catch (error) {
    logger.error('Failed to load site configuration from database', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  // Return merged defaults if database fetch fails
  logger.warn('Using fallback site configuration')
  return mergeSiteConfigWithDefaults({}, options.fallbackValues)
}

/**
 * Safe post retrieval with fallbacks
 */
export async function getPostSafely(
  payload: any,
  slug: string,
  options: FallbackOptions = {}
): Promise<Post | null> {
  const logger = new FallbackLogger(options)
  
  try {
    const post = await withRetry(
      async () => {
        const result = await payload.find({
          collection: 'posts',
          where: {
            slug: {
              equals: slug,
            },
          },
          limit: 1,
          depth: 2,
        })
        return result.docs[0] || null
      },
      { maxRetries: options.maxRetries || 2, logger }
    )

    if (post) {
      logger.debug(`Post "${slug}" loaded successfully`)
      return sanitizePost(post)
    }
  } catch (error) {
    logger.error(`Failed to load post "${slug}" from database`, {
      error: error instanceof Error ? error.message : String(error),
      slug,
    })
  }

  logger.warn(`Post "${slug}" not found or failed to load`)
  return null
}

/**
 * Merge site configuration with defaults
 */
function mergeSiteConfigWithDefaults(
  siteConfig: Partial<SiteConfig>,
  customFallbacks?: Partial<SiteConfig>
): SiteConfig {
  const fallbacks = { ...DEFAULT_SITE_CONFIG, ...customFallbacks }
  
  return {
    siteName: siteConfig.siteName || fallbacks.siteName,
    siteUrl: siteConfig.siteUrl || fallbacks.siteUrl,
    siteDescription: siteConfig.siteDescription || fallbacks.siteDescription,
    siteTagline: siteConfig.siteTagline || fallbacks.siteTagline,
    seoDefaults: {
      ...fallbacks.seoDefaults,
      ...siteConfig.seoDefaults,
    },
    openGraphDefaults: {
      ...fallbacks.openGraphDefaults,
      ...siteConfig.openGraphDefaults,
    },
    twitterDefaults: {
      ...fallbacks.twitterDefaults,
      ...siteConfig.twitterDefaults,
    },
    schemaDefaults: {
      ...fallbacks.schemaDefaults,
      ...siteConfig.schemaDefaults,
      organization: {
        ...fallbacks.schemaDefaults?.organization,
        ...siteConfig.schemaDefaults?.organization,
      },
      publisher: {
        ...fallbacks.schemaDefaults?.publisher,
        ...siteConfig.schemaDefaults?.publisher,
      },
      webSite: {
        ...fallbacks.schemaDefaults?.webSite,
        ...siteConfig.schemaDefaults?.webSite,
        searchAction: {
          ...fallbacks.schemaDefaults?.webSite?.searchAction,
          ...siteConfig.schemaDefaults?.webSite?.searchAction,
        },
      },
    },
    faviconICO: siteConfig.faviconICO || fallbacks.faviconICO,
    iconSVG: siteConfig.iconSVG || fallbacks.iconSVG,
    appleTouchIcon: siteConfig.appleTouchIcon || fallbacks.appleTouchIcon,
    webAppManifest: siteConfig.webAppManifest || fallbacks.webAppManifest,
    cdnDomain: siteConfig.cdnDomain || fallbacks.cdnDomain,
    analyticsOrAdsDomain: siteConfig.analyticsOrAdsDomain || fallbacks.analyticsOrAdsDomain,
    preconnect: siteConfig.preconnect || fallbacks.preconnect || [],
    dnsPrefetch: siteConfig.dnsPrefetch || fallbacks.dnsPrefetch || [],
    rssLink: siteConfig.rssLink || fallbacks.rssLink,
    googleSiteVerification: siteConfig.googleSiteVerification || fallbacks.googleSiteVerification,
    bingMsValidate: siteConfig.bingMsValidate || fallbacks.bingMsValidate,
    yandexVerification: siteConfig.yandexVerification || fallbacks.yandexVerification,
    gtmID: siteConfig.gtmID || fallbacks.gtmID,
    gaMeasurementID: siteConfig.gaMeasurementID || fallbacks.gaMeasurementID,
    facebookPixelID: siteConfig.facebookPixelID || fallbacks.facebookPixelID,
  }
}

/**
 * Sanitize and validate post data
 */
function sanitizePost(post: any): Post {
  return {
    id: post.id,
    title: post.title || DEFAULT_POST_VALUES.title,
    slug: post.slug,
    excerpt: post.excerpt || DEFAULT_POST_VALUES.excerpt,
    datePublished: post.datePublished || DEFAULT_POST_VALUES.datePublished,
    dateModified: post.dateModified || DEFAULT_POST_VALUES.dateModified,
    content: post.content,
    featuredImage: post.featuredImage,
    status: post.status || DEFAULT_POST_VALUES.status,
    seo: post.seo || {},
    openGraph: post.openGraph || {},
    twitter: post.twitter || {},
    jsonld: post.jsonld || {},
    hreflang: Array.isArray(post.hreflang) ? post.hreflang : [],
    preloadImages: Array.isArray(post.preloadImages) ? post.preloadImages : [],
  }
}

/**
 * Create a fallback error object
 */
export function createFallbackError(
  code: string,
  message: string,
  context?: any
): FallbackError {
  return {
    code,
    message,
    context,
    timestamp: new Date(),
  }
}

/**
 * Handle errors gracefully and return appropriate fallback responses
 */
export function handleFallbackError(
  error: Error | FallbackError,
  operation: string,
  logger?: FallbackLogger
): FallbackError {
  const fallbackError = error instanceof Error 
    ? createFallbackError('OPERATION_FAILED', error.message, { operation })
    : error

  if (logger) {
    logger.error(`Fallback error in ${operation}`, fallbackError)
  }

  return fallbackError
}

/**
 * Validate required environment variables and provide fallbacks
 */
export function validateEnvironment(logger?: FallbackLogger): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check critical environment variables
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    warnings.push('NEXT_PUBLIC_SITE_URL is not set, using fallback URL')
  }

  if (!process.env.DATABASE_URI && !process.env.POSTGRES_URL) {
    errors.push('Database connection string is missing')
  }

  if (!process.env.PAYLOAD_SECRET) {
    errors.push('PAYLOAD_SECRET is required for security')
  }

  // Log results
  if (logger) {
    if (errors.length > 0) {
      logger.error('Environment validation failed', { errors })
    }
    if (warnings.length > 0) {
      logger.warn('Environment validation warnings', { warnings })
    }
    if (errors.length === 0 && warnings.length === 0) {
      logger.info('Environment validation passed')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Health check function for monitoring system status
 */
export async function performHealthCheck(
  payload: any,
  options: FallbackOptions = {}
): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }>
  timestamp: string
}> {
  const logger = new FallbackLogger(options)
  const checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }> = {}
  
  // Database connectivity check
  try {
    const start = Date.now()
    await payload.find({ collection: 'posts', limit: 1 })
    checks.database = {
      status: 'pass',
      duration: Date.now() - start,
    }
  } catch (error) {
    checks.database = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
    }
  }

  // Site configuration check
  try {
    const start = Date.now()
    await getSiteConfigSafely(payload, { enableLogging: false })
    checks.siteConfig = {
      status: 'pass',
      duration: Date.now() - start,
    }
  } catch (error) {
    checks.siteConfig = {
      status: 'fail',
      message: 'Site configuration unavailable',
    }
  }

  // Environment check
  const envValidation = validateEnvironment()
  checks.environment = {
    status: envValidation.isValid ? 'pass' : 'fail',
    message: envValidation.errors.length > 0 ? envValidation.errors.join(', ') : undefined,
  }

  // Determine overall status
  const failedChecks = Object.values(checks).filter(check => check.status === 'fail')
  let status: 'healthy' | 'degraded' | 'unhealthy'
  
  if (failedChecks.length === 0) {
    status = 'healthy'
  } else if (failedChecks.length <= 1) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }

  const result = {
    status,
    checks,
    timestamp: new Date().toISOString(),
  }

  logger.info(`Health check completed: ${status}`, result)
  return result
}

/**
 * Export the logger for external use
 */
export { FallbackLogger }