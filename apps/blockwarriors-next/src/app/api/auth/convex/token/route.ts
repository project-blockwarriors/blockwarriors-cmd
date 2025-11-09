import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getToken } from '@/lib/auth-server';

// Mark route as dynamic to ensure cookies are available
export const dynamic = 'force-dynamic';

/**
 * API route to get Convex authentication token from BetterAuth session
 * This token can be used to authenticate Convex HTTP client requests
 *
 * The route reads the BetterAuth session cookie and converts it to a
 * Convex authentication token that can be used with Convex HTTP client.
 *
 * Returns 204 No Content when no session exists (expected for unauthenticated users).
 * This prevents browser console errors and is handled gracefully by ConvexBetterAuthProvider.
 */
export async function GET() {
  try {
    // Ensure cookies are available in the Next.js context
    // This must be called before getToken() to make cookies accessible
    await cookies();

    // getToken() reads the BetterAuth session cookie automatically
    // and generates a Convex authentication token via getTokenNextjs
    const token = await getToken();

    if (!token) {
      // Return 204 No Content for unauthenticated users - this is expected and won't log as an error
      // ConvexBetterAuthProvider handles this gracefully with expectAuth: false
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error getting Convex token:', error);
    return NextResponse.json(
      {
        error: 'Failed to get token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
