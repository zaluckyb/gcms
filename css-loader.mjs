// Custom CSS loader for Node.js ESM to handle CSS imports during type generation
import { pathToFileURL } from 'url'
import path from 'path'

export async function resolve(specifier, context, defaultResolve) {
  // Handle CSS files by redirecting to a stub file
  if (specifier.endsWith('.css')) {
    const stubPath = path.resolve('./css-stub.js')
    return {
      url: pathToFileURL(stubPath).href,
      shortCircuit: true
    }
  }
  
  // For all other files, use the default resolver
  return defaultResolve(specifier, context)
}

export async function load(url, context, defaultLoad) {
  // Handle CSS files by returning empty JavaScript
  if (url.endsWith('.css') || url.includes('.css') || url.includes('ReactCrop.css')) {
    return {
      format: 'module',
      source: 'export default {};',
      shortCircuit: true
    }
  }
  
  // For all other files, use the default loader
  return defaultLoad(url, context)
}