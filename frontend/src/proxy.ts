import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Array of public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/signup']

// Array of auth-related routes
const authRoutes = ['/auth/login', '/auth/signup']

export function proxy(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Check if it's an API route or static asset (manifest, icons, service worker, etc.)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(png|ico|js|json|webmanifest)$/)
  ) {
    return NextResponse.next()
  }

  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)

  // 1. If user is logged in
  if (authToken) {
    // If they try to access login/signup or the landing page, redirect to dashboard
    if (isAuthRoute || pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } 
  // 2. If user is NOT logged in
  else {
    // If they try to access a protected route (anything not in publicRoutes), redirect to login
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware to all routes except _next
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
