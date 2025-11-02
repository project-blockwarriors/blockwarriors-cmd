import { UserProfile } from '@/types/user';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';

// Get user profile from Convex only (Supabase removed)
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

    const profile = await fetchQuery(
      api.userProfiles.getUserProfile,
      { userId },
      { token }
    );

    return profile;
  } catch (error) {
    console.error('Failed to get user profile from Convex:', error);
    return null;
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

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Failed to update user profile in Convex:', error);
    return { data: null, error: (error as Error).message };
  }
}
