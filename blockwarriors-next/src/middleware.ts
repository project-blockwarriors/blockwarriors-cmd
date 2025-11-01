import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserProfile } from './server/db/users';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const path = new URL(request.url).pathname;

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/matches',
    '/dashboard/teams',
    '/dashboard/leaderboard',
    '/dashboard/practice',
  ];
  const setupRoutes = ['/dashboard/setup'];
  const authRoutes = ['/login'];

  const isProtectedRoute = protectedRoutes.includes(path);
  const isSetupRoute = setupRoutes.includes(path);
  const isAuthRoute = authRoutes.includes(path);

  let user = await getUser(request, response);

  if (isAuthRoute) {
    // If user is logged in, redirect to dashboard
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isProtectedRoute) {
    // If user is not logged in, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is logged in, check for setup completion
    if (!isSetupRoute) {
      try {
        const profile = await getUserProfile(user.id);

        if (!profile?.first_name || !profile?.team) {
          return NextResponse.redirect(
            new URL('/dashboard/setup', request.url)
          );
        }
      } catch (error) {
        console.error('Profile check error:', error);
        return NextResponse.redirect(new URL('/dashboard/setup', request.url));
      }
    }
  }

  return response;
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function getUser(request, response) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabaseClient = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        const supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const user = (await supabaseClient.auth.getUser()).data.user;

  return user;
}
