import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = new URL(request.url).pathname;

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/matches',
    '/dashboard/teams',
    '/dashboard/leaderboard',
    '/dashboard/practice',
  ];
  const authRoutes = ['/login'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(path);

  // Check for BetterAuth session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');

  if (isAuthRoute && sessionCookie) {
    // If user is logged in and trying to access login, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For protected routes, we'll let the page-level checks handle authentication
  // since middleware can't easily use Convex queries
  // Pages will use getUser() which works correctly

  return NextResponse.next();
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
