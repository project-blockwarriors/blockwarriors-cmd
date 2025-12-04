'use server';

import { UserProfile } from '@/types/user';
import {
  getUserProfile as getUserProfileDb,
  updateUserProfile as updateUserProfileDb,
} from '../db/users';
import { getToken } from '@/lib/auth-server';

// Profile Management Actions
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  return await getUserProfileDb(userId);
}

export async function updateUserProfile(
  newUserProfile: UserProfile
): Promise<{ data: unknown; error: string | null }> {
  return await updateUserProfileDb(newUserProfile);
}

// Authentication Actions - BetterAuth handles sign-in client-side
// Sign-out can be done client-side with authClient.signOut()
// Keeping this for server-side sign-out if needed
export async function signOutAction(): Promise<{
  errorMessage: string | null;
}> {
  try {
    const token = await getToken();
    if (!token) {
      return { errorMessage: null };
    }
    // BetterAuth handles sign-out client-side
    // This is kept for compatibility but client-side sign-out is preferred
    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: (error as Error).message };
  }
}

// Google sign-in is now handled client-side via authClient.signIn.social()
// This action is no longer needed but kept for backward compatibility
export async function googleSigninAction() {
  // BetterAuth handles this client-side
  return { errorMessage: null, url: null };
}
