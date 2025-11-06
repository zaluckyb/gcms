import { readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(req: Request, context: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await context.params
    // Media directory relative to project root
    const mediaDir = path.join(process.cwd(), 'media')
    const filePath = path.join(mediaDir, filename)

    // Validate file exists
    const s = await stat(filePath)
    if (!s.isFile()) {
      return new Response('Not found', { status: 404 })
    }

    // Basic content-type inference by extension
    const ext = path.extname(filename).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.gif' ? 'image/gif'
      : ext === '.webp' ? 'image/webp'
      : ext === '.svg' ? 'image/svg+xml'
      : 'application/octet-stream'

    const file = await readFile(filePath)
    return new Response(file, {
      status: 200,
      headers: {
        'content-type': contentType,
        'content-length': String(s.size),
        'cache-control': 'public, max-age=3600',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}