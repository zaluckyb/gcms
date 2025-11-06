import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add headers to prevent navigation abort issues
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  // Handle admin routes specifically
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Prevent caching for admin routes to avoid navigation issues
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    
    // Add CSP headers to prevent performance measurement issues
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    )
  }
  
  return response
}

export const config = {
  matcher: [
    // Exclude all Next.js internal routes to avoid interfering with navigation/HMR/RSC
    '/((?!api|_next/|favicon.ico).*)',
  ],
}