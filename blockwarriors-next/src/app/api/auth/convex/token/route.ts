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
      return NextResponse.json(
        { error: 'Not authenticated', message: 'No active session found' },
        { status: 401 }
      );
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
