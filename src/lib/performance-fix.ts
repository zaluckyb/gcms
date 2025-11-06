'use client'

// Performance API fix for Next.js 16 + React 19 compatibility issues
export function initPerformanceFix() {
  if (typeof window === 'undefined') return

  // Override the Performance.measure method to handle negative timestamps
  const originalMeasure = window.performance.measure.bind(window.performance)
  
  window.performance.measure = function(name: string, startMark?: string, endMark?: string) {
    try {
      // Check if the marks exist and have valid timestamps
      if (startMark && endMark) {
        const startEntry = window.performance.getEntriesByName(startMark)[0]
        const endEntry = window.performance.getEntriesByName(endMark)[0]
        
        if (startEntry && endEntry && endEntry.startTime < startEntry.startTime) {
          console.warn(`Skipping performance measurement '${name}' due to negative duration`)
          return {} as PerformanceMeasure
        }
      }
      
      return originalMeasure(name, startMark, endMark)
    } catch (error) {
      if (error instanceof Error && error.message.includes('negative time stamp')) {
        console.warn(`Skipping performance measurement '${name}' due to negative timestamp:`, error.message)
        return {} as PerformanceMeasure
      }
      throw error
    }
  }

  // Handle navigation abort errors
  const originalFetch = window.fetch.bind(window)
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    try {
      return await originalFetch(input, init)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Navigation aborted, this is expected behavior:', error.message)
        throw error
      }
      throw error
    }
  }

  // Suppress specific console errors that are known issues
  const originalConsoleError = console.error
  console.error = function(...args: any[]) {
    const message = args.join(' ')
    
    // Filter out known Next.js 16 + React 19 compatibility issues
    if (
      message.includes('negative time stamp') ||
      message.includes('ERR_ABORTED') ||
      message.includes('flushComponentPerformance')
    ) {
      console.warn('Suppressed known compatibility issue:', ...args)
      return
    }
    
    originalConsoleError.apply(console, args)
  }
}

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  initPerformanceFix()
}