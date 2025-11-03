import { fetchQuery } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';

// Get the current authenticated user using BetterAuth via Convex
export async function getUser() {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }
    const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });

    // BetterAuth user structure: getAuthUser returns user with _id field
    if (user) {
      const userId = user._id;
      if (!userId) {
        console.error('User object missing id field:', user);
        return null;
      }
      return {
        ...user,
        id: userId,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

export async function protectRoute() {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
