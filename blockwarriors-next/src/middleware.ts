import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUser } from "./auth/server";
import { isProfileComplete } from "./server/actions/users";

export async function middleware(request: NextRequest) {
  const path = new URL(request.url).pathname;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/favicon") ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const protectedRoutes = [
    "/dashboard",
    "/dashboard/matches",
    "/dashboard/teams",
    "/dashboard/leaderboard",
    "/dashboard/practice",
  ];
  const setupRoutes = ["/dashboard/setup"];
  const authRoutes = ["/login"];

  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );
  const isSetupRoute = setupRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );
  const isAuthRoute = authRoutes.includes(path);

  // Check for session cookie (simplest approach from example)
  const sessionCookie = getSessionCookie(request);

  // Handle auth routes - redirect to dashboard if already logged in (has session cookie)
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Handle protected routes - redirect to login if not authenticated (no session cookie)
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow setup routes through - they will handle their own auth checks
  if (isSetupRoute) {
    return NextResponse.next();
  }

  // For protected routes with session cookie, verify user and check profile completeness
  if (isProtectedRoute && sessionCookie) {
    try {
      const user = await getUser();
      if (!user) {
        // Session cookie exists but user lookup failed - might be expired or invalid
        // Log for debugging but allow through - the page will handle auth check
        console.warn("Session cookie exists but getUser() returned null - allowing through for page-level auth check");
        return NextResponse.next();
      }

      // Check profile completeness
      if (user.id) {
        try {
          const profileComplete = await isProfileComplete(user.id);
          if (!profileComplete) {
            return NextResponse.redirect(new URL("/dashboard/setup", request.url));
          }
        } catch (error) {
          console.error("Error checking profile completeness in middleware:", error);
          // Allow through on error - individual pages will handle it
        }
      }
    } catch (error) {
      console.error("Error verifying user in middleware:", error);
      // Allow through on error - individual pages will handle authentication
      // This prevents infinite redirect loops if getUser() fails
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
