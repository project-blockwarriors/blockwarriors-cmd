import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from '@/lib/auth-server';

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

  // Check for session cookie first (quick check)
  const sessionCookie = getSessionCookie(request);

  // If there's a session cookie, verify the token is actually valid
  // This prevents redirect loops when cookie exists but token is invalid
  let isAuthenticated = false;
  if (sessionCookie) {
    try {
      const token = await getToken();
      isAuthenticated = !!token;
    } catch {
      // If token verification fails, treat as unauthenticated
      isAuthenticated = false;
    }
  }

  // Handle auth routes - redirect to dashboard if already logged in (has valid token)
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle protected routes - redirect to login if not authenticated (no valid token)
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original URL as a query parameter so we can redirect back after login
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Add pathname to request headers for use in server components
  // Set it on request headers so it can be read by server components via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', path);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
