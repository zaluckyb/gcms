import OpenAI from 'openai'

export type PlanItem = {
  date: string
  title: string
  slug: string
  description?: string
  keywords?: string[]
}

export type GenerateOptions = {
  topic: string
  audience?: string
  days?: number
  startDate?: string
  strategyNotes?: string
}

function makeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GenerateResult {
  items: PlanItem[]
  debug: {
    prompt: string
    rawResponse: string
    parsedResponse: unknown
    finalItems: PlanItem[]
    errors: string[]
    warnings: string[]
  }
}

export async function generatePlanWithOpenAI(opts: GenerateOptions): Promise<GenerateResult> {
  const days = Math.max(1, Number(opts.days ?? 30))
  const start = opts.startDate ? new Date(opts.startDate) : new Date()
  const topic = (opts.topic || 'Content').trim()
  const audience = (opts.audience || 'Readers').trim()
  const strategyNotes = opts.strategyNotes || ''

  // Initialize debug information
  const debug = {
    prompt: '',
    rawResponse: '',
    parsedResponse: null as any,
    finalItems: [] as PlanItem[],
    errors: [] as string[],
    warnings: [] as string[]
  }

  try {
    const prompt = `Create a ${days}-day content plan for the topic "${topic}" targeting "${audience}".

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

    // Store the prompt in debug
    debug.prompt = prompt

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content strategist expert. Generate diverse, high-quality content ideas. Return only valid JSON without any markdown formatting or additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      debug.errors.push('No content generated from OpenAI')
      throw new Error('No content generated from OpenAI')
    }

    // Store raw response in debug
    debug.rawResponse = content

    // LOG 1: Raw ChatGPT response
    console.log('=== RAW CHATGPT RESPONSE ===')
    console.log('Content length:', content.length)
    console.log('Raw content:', content)
    console.log('Content type:', typeof content)
    console.log('================================')

    // Parse the JSON response
    let generatedItems: Array<{ title: string, description: string, keywords: string[] }> = []
    try {
      generatedItems = JSON.parse(content)

      // Store parsed response in debug
      debug.parsedResponse = generatedItems

      // LOG 2: Parsed JSON structure
      console.log('=== PARSED JSON FROM CHATGPT ===')
      console.log('Parsed items count:', generatedItems.length)
      console.log('Parsed structure:', JSON.stringify(generatedItems, null, 2))
      console.log('First item keys:', generatedItems[0] ? Object.keys(generatedItems[0]) : 'No items')

      // LOG 3: Check for unexpected fields
      generatedItems.forEach((item, index) => {
        const itemKeys = Object.keys(item)
        const expectedKeys = ['title', 'description', 'keywords']
        const unexpectedKeys = itemKeys.filter(key => !expectedKeys.includes(key))

        if (unexpectedKeys.length > 0) {
          const warning = `Unexpected fields in item ${index}: ${unexpectedKeys.join(', ')}`
          debug.warnings.push(warning)
          console.log(`⚠️  UNEXPECTED FIELDS in item ${index}:`, unexpectedKeys)
          console.log(`Item ${index} full object:`, JSON.stringify(item, null, 2))
        }

        // Check for ObjectId-like strings in any field
        Object.entries(item).forEach(([key, value]) => {
          if (typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)) {
            const error = `Potential ObjectId detected in item ${index}, field ${key}: ${value}`
            debug.errors.push(error)
            console.log(`🚨 POTENTIAL OBJECTID DETECTED in item ${index}, field ${key}:`, value)
          }
        })
      })
      console.log('===================================')

    } catch (parseError) {
      const errorMsg = `Failed to parse OpenAI response: ${(parseError as Error)?.message || parseError}`
      debug.errors.push(errorMsg)
      console.error('Failed to parse OpenAI response:', content)
      console.error('Parse error details:', parseError)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Validate and clean the response - strip any unexpected fields
    const cleanedItems = generatedItems.map((item, index) => {
      const cleaned = {
        title: item.title || `Untitled Content ${index + 1}`,
        description: item.description || 'No description provided',
        keywords: Array.isArray(item.keywords) ? item.keywords : []
      }

      // Log if we had to clean anything
      const originalKeys = Object.keys(item)
      const cleanedKeys = Object.keys(cleaned)
      const removedKeys = originalKeys.filter(key => !cleanedKeys.includes(key))

      if (removedKeys.length > 0) {
        const warning = `Cleaned item ${index}, removed fields: ${removedKeys.join(', ')}`
        debug.warnings.push(warning)
        console.log(`🧹 CLEANED item ${index}, removed fields:`, removedKeys)
      }

      return cleaned
    })

    // Convert to PlanItem format with dates
    const items: PlanItem[] = cleanedItems.slice(0, days).map((item, index) => {
      const d = new Date(start)
      d.setDate(d.getDate() + index)

      return {
        date: d.toISOString(),
        title: item.title,
        slug: makeSlug(item.title),
        description: item.description,
        keywords: item.keywords || [],
      }
    })

    // LOG 4: Final items array that will be sent to database
    console.log('=== FINAL ITEMS FOR DATABASE ===')
    console.log('Final items count:', items.length)
    console.log('Final items structure:', JSON.stringify(items, null, 2))

    // Check final items for any ObjectId-like strings
    items.forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)) {
          const error = `ObjectId in final items - item ${index}, field ${key}: ${value}`
          debug.errors.push(error)
          console.log(`🚨 OBJECTID IN FINAL ITEMS - item ${index}, field ${key}:`, value)
        }
      })
    })
    console.log('===================================')

    // If we didn't get enough items, fill with fallback content
    while (items.length < days) {
      const d = new Date(start)
      d.setDate(d.getDate() + items.length)
      const dayNum = items.length + 1

      items.push({
        date: d.toISOString(),
        title: `${topic}: Day ${dayNum} Content for ${audience}`,
        slug: makeSlug(`${topic}-day-${dayNum}-${audience}`),
        description: `Additional content focused on ${topic} for ${audience}.`,
        keywords: [topic, audience, 'content plan'],
      })

      debug.warnings.push(`Added fallback content item ${dayNum}`)
    }

    // Store final items in debug
    debug.finalItems = items

    return { items, debug }

  } catch (error) {
    const errorMsg = `OpenAI API error: ${(error as Error)?.message || error}`
    debug.errors.push(errorMsg)
    console.error('OpenAI API error:', error)

    // Fallback to basic content generation if API fails
    const items: PlanItem[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dayNum = i + 1

      items.push({
        date: d.toISOString(),
        title: `${topic}: Day ${dayNum} — ${audience} Focus`,
        slug: makeSlug(`${topic}-day-${dayNum}-${audience}`),
        description: `Day ${dayNum} content exploring ${topic} specifically for ${audience}. ${strategyNotes}`,
        keywords: [topic, audience, 'content strategy', `day ${dayNum}`],
      })

      debug.warnings.push(`Generated fallback content item ${dayNum} due to API error`)
    }

    debug.finalItems = items
    return { items, debug }
  }
}