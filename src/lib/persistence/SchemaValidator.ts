import Joi from 'joi'
import type { ValidationError, ValidationWarning, ValidationResult, PlanItem } from './types'

export class SchemaValidationError extends Error {
  constructor(message: string, public errors: ValidationError[]) {
    super(message)
    this.name = 'SchemaValidationError'
  }
}

const planItemSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'date.base': 'Date must be a valid date',
    'date.iso': 'Date must be in ISO format',
    'any.required': 'Date is required'
  }),
  title: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Title must not be empty',
    'string.max': 'Title must not exceed 255 characters',
    'any.required': 'Title is required'
  }),
  slug: Joi.string().min(1).max(255).pattern(/^[a-z0-9-]+$/).required().messages({
    'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens',
    'any.required': 'Slug is required'
  }),
  description: Joi.string().allow('').max(1000).optional().messages({
    'string.max': 'Description must not exceed 1000 characters'
  }),
  keywords: Joi.array().items(
    Joi.object({
      value: Joi.string().min(1).max(100).required().messages({
        'string.min': 'Keyword value must not be empty',
        'string.max': 'Keyword value must not exceed 100 characters',
        'any.required': 'Keyword value is required'
      })
    })
  ).default([]).messages({
    'array.base': 'Keywords must be an array'
  }),
  approved: Joi.boolean().default(false).messages({
    'boolean.base': 'Approved must be a boolean value'
  }),
  // Accept string identifiers (numeric, hex, slug-like) or null
  post: Joi.string().allow(null).max(255).optional().messages({
    'string.base': 'Post must be a string or null',
    'string.max': 'Post must not exceed 255 characters'
  })
})

export class SchemaValidator {
  async validateItems(items: any[]): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    if (!Array.isArray(items)) {
      errors.push({
        index: -1,
        field: 'items',
        message: 'Items must be an array',
        value: items
      })
      return { valid: false, errors, warnings }
    }

    for (let i = 0; i < items.length; i++) {
      try {
        await planItemSchema.validateAsync(items[i], { abortEarly: false })
        
        // Additional business logic validations
        const item = items[i]
        
        // Check for duplicate slugs within the array
        const duplicateSlugIndex = items.findIndex((otherItem, otherIndex) => 
          otherIndex !== i && otherItem.slug === item.slug
        )
        if (duplicateSlugIndex !== -1) {
          warnings.push({
            index: i,
            field: 'slug',
            message: `Duplicate slug found at index ${duplicateSlugIndex}`,
            value: item.slug
          })
        }

        // Check if date is in the past (warning, not error)
        if (item.date) {
          const itemDate = new Date(item.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (itemDate < today) {
            warnings.push({
              index: i,
              field: 'date',
              message: 'Date is in the past',
              value: item.date
            })
          }
        }

        // Check for very long titles (warning)
        if (item.title && item.title.length > 100) {
          warnings.push({
            index: i,
            field: 'title',
            message: 'Title is quite long, consider shortening for better SEO',
            value: item.title
          })
        }

      } catch (error) {
        if (error instanceof Joi.ValidationError) {
          for (const detail of error.details) {
            errors.push({
              index: i,
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            })
          }
        } else {
          errors.push({
            index: i,
            field: 'unknown',
            message: error instanceof Error ? error.message : String(error),
            value: items[i]
          })
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  async sanitizeItems(items: any[]): Promise<PlanItem[]> {
    if (!Array.isArray(items)) {
      throw new SchemaValidationError('Items must be an array', [])
    }

    const sanitizedItems: PlanItem[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      try {
        // Create a clean item object
        const cleanItem: any = { ...item }
        
        // Remove any problematic ID fields that might contain ObjectId strings
        delete cleanItem.id
        delete cleanItem._id
        
        // Sanitize all string values to remove ObjectId-like patterns (except for 'post')
        Object.keys(cleanItem).forEach(key => {
          const value = cleanItem[key]
          if (typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)) {
            if (key !== 'post') {
              console.warn(`⚠️ Detected and sanitized ObjectId-like string in ${key}: ${value}`)
              cleanItem[key] = `sanitized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
          }
        })
        
        // Normalize 'post' to string identifier or null
        if (cleanItem.post != null) {
          if (typeof cleanItem.post === 'string') {
            // Keep as-is; allow numeric strings, hex, slugs
            cleanItem.post = cleanItem.post
          } else if (typeof cleanItem.post === 'object') {
            // Extract id and coerce to string if present
            const idVal = cleanItem.post?.id
            cleanItem.post = idVal != null ? String(idVal) : null
          } else if (typeof cleanItem.post === 'number') {
            cleanItem.post = String(cleanItem.post)
          } else {
            cleanItem.post = null
          }
        } else {
          cleanItem.post = null
        }
        
        // Ensure date is properly formatted
        if (cleanItem.date) {
          try {
            cleanItem.date = new Date(cleanItem.date).toISOString()
          } catch (dateError) {
            console.error(`❌ Item ${i} date error:`, dateError)
            cleanItem.date = new Date().toISOString()
          }
        } else {
          cleanItem.date = new Date().toISOString()
        }
        
        // Ensure title is a string
        if (!cleanItem.title || typeof cleanItem.title !== 'string') {
          cleanItem.title = `Untitled Content ${i + 1}`
        }
        
        // Ensure slug is a string and properly formatted
        if (!cleanItem.slug || typeof cleanItem.slug !== 'string') {
          cleanItem.slug = cleanItem.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .substring(0, 255)
        }
        
        // Ensure description is a string
        if (cleanItem.description && typeof cleanItem.description !== 'string') {
          cleanItem.description = String(cleanItem.description)
        }
        
        // Ensure keywords array is properly formatted
        if (cleanItem.keywords && Array.isArray(cleanItem.keywords)) {
          cleanItem.keywords = cleanItem.keywords.map((keyword: any) => {
            if (typeof keyword === 'string') {
              return { value: keyword }
            }
            if (keyword && typeof keyword === 'object') {
              // Strip internal IDs and keep only value
              const v = keyword.value ?? String(keyword)
              return { value: v }
            }
            return { value: String(keyword) }
          }).filter((k: any) => k.value && k.value.trim().length > 0)
        } else {
          cleanItem.keywords = []
        }

        // Default approved to false if undefined
        if (typeof cleanItem.approved !== 'boolean') {
          cleanItem.approved = false
        }
        
        // Validate the cleaned item against schema
        const { value: validatedItem } = await planItemSchema.validateAsync(cleanItem)
        sanitizedItems.push(validatedItem)
        
      } catch (error) {
        console.error(`Failed to sanitize item ${i}:`, error)
        throw new SchemaValidationError(
          `Failed to sanitize item ${i}: ${error instanceof Error ? error.message : String(error)}`,
          [{
            index: i,
            field: 'item',
            message: error instanceof Error ? error.message : String(error),
            value: item
          }]
        )
      }
    }

    return sanitizedItems
  }

  async validateSingleItem(item: any): Promise<ValidationResult> {
    return this.validateItems([item])
  }

  async sanitizeSingleItem(item: any): Promise<PlanItem> {
    const result = await this.sanitizeItems([item])
    return result[0]
  }

  // Validate that slugs are unique within the array
  validateUniqueConstraints(items: PlanItem[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const slugs = new Set<string>()
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (slugs.has(item.slug)) {
        errors.push({
          index: i,
          field: 'slug',
          message: 'Slug must be unique within the content plan',
          value: item.slug
        })
      } else {
        slugs.add(item.slug)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}