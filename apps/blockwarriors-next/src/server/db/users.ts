import { UserProfile } from '@/types/user';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  if (!userId) {
    console.error('getUserProfile called with undefined userId');
    return null;
  }

  try {
    const token = await getToken();
    if (!token) {
      console.error('No auth token available');
      return null;
    }

    let profile = await fetchQuery(
      api.userProfiles.getUserProfile,
      { userId },
      { token }
    );

    // If profile doesn't exist, automatically initialize it from Google OAuth data
    if (!profile) {
      const initResult = await initializeUserProfile(userId);
      if (!initResult.error) {
        // Fetch the newly created profile
        profile = await fetchQuery(
          api.userProfiles.getUserProfile,
          { userId },
          { token }
        );
      }
    }

    return profile;
  } catch (error) {
    console.error('Failed to get user profile from Convex:', error);
    return null;
  }
}

// Initialize user profile from Google OAuth data
export async function initializeUserProfile(
  userId: string
): Promise<{ error: string | null }> {
  if (!userId) {
    return { error: 'User ID is required' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    await fetchMutation(
      api.userProfiles.initializeUserProfile,
      { userId },
      { token }
    );

    return { error: null };
  } catch (error) {
    console.error('Failed to initialize user profile:', error);
    return { error: (error as Error).message };
  }
}

// Update user profile in Convex only (Supabase removed)
export async function updateUserProfile(
  newUserProfile: UserProfile
): Promise<{ data: any; error: string | null }> {
  if (!newUserProfile.user_id) {
    return { data: null, error: 'User ID is required' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    // Validate that required fields are not null before sending to Convex
    if (
      !newUserProfile.first_name?.trim() ||
      !newUserProfile.last_name?.trim() ||
      !newUserProfile.institution?.trim() ||
      !newUserProfile.geographic_location?.trim()
    ) {
      return { data: null, error: 'All profile fields are required and cannot be empty' };
    }

    await fetchMutation(
      api.userProfiles.updateUserProfile,
      {
        userId: newUserProfile.user_id,
        firstName: newUserProfile.first_name,
        lastName: newUserProfile.last_name,
        institution: newUserProfile.institution,
        geographicLocation: newUserProfile.geographic_location,
      },
      { token }
    );

    // Revalidate all dashboard pages to reflect the updated profile
    revalidatePath('/dashboard', 'layout');

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Failed to update user profile in Convex:', error);
    return { data: null, error: (error as Error).message };
  }
}
