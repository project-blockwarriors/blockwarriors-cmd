import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = new URL(request.url).pathname;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon') ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/matches',
    '/dashboard/teams',
    '/dashboard/leaderboard',
    '/dashboard/practice',
    '/dashboard/setup',
  ];
  const authRoutes = ['/login'];

  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + '/')
  );
  const isAuthRoute = authRoutes.includes(path);

  // Check for session cookie (simplest approach from example)
  const sessionCookie = getSessionCookie(request);

  // Handle auth routes - redirect to dashboard if already logged in (has session cookie)
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle protected routes - redirect to login if not authenticated (no session cookie)
  if (!sessionCookie && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original URL as a query parameter so we can redirect back after login
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Add pathname to headers for use in server components
  const response = NextResponse.next();
  response.headers.set('x-pathname', path);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (BetterAuth handles these)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
