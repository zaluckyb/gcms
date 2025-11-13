#!/usr/bin/env node

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { appendFileSync } from 'fs'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const logPath = join(__dirname, "error_log.txt")

// Log to file with timestamp
function logError(message) {
  const timestamp = new Date().toISOString()
  try {
    appendFileSync(logPath, `[${timestamp}] ${message}\n`)
  } catch (err) {
    // Avoid recursive logging if writing fails
    originalConsoleError(
      "Failed to write to log file:",
      err
    )
  }
}

// Intercept console.error
const originalConsoleError = console.error
console.error = (...args) => {
  logError(
    `Console Error: ${args.map((arg) => (arg && arg.stack) || arg).join(" ")}`
  )
  originalConsoleError(...args)
}

const port = Number(process.env.PORT) || 3000
// Use dev mode unless explicitly in production. Prevents attempts to read
// production-only manifests (e.g., routes-manifest.json) during local dev.
const app = next({ dev: process.env.NODE_ENV !== 'production' })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) {
      logError(`Server Start Error: ${err.stack || err}`)
      throw err
    }
    console.log(`> Ready on http://localhost:${port}`)
  })
})

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logError(`Uncaught Exception: ${err.stack || err}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logError(`Unhandled Rejection: ${(reason && reason.stack) || reason}`)
})