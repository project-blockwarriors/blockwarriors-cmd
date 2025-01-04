'use server';

import { createSupabaseClient } from '@/auth/server';
import { getUser } from '@/auth/server';
import { UserProfile } from '@/types/user';

// Profile Management Actions
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const supabase = await createSupabaseClient();
  // Fetch user profile and team information
  const { data: user, error } = (await supabase
    .from('users')
    .select(
      `
      first_name,
      last_name,
      institution,
      geographic_location,
      team:teams (
        id,
        team_name,
        leader_id
      )
    `
    )
    .eq('user_id', userId)
    .single()) as { data: UserProfile | null; error: any };

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch user data:', error);
  }

  if (!user) return null;

  return user;
}

export async function updateUserProfile(newUserProfile: UserProfile) {
  try {
    const supabase = await createSupabaseClient();

    // Remove team from the update payload since it's a relation
    const { team, ...updateData } = newUserProfile;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', newUserProfile.user_id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
}

// Authentication Actions
export async function signinAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { errorMessage: null };
  } catch (error: any) {
    return { errorMessage: error.message };
  }
}

export async function signupAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createSupabaseClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return { errorMessage: null };
  } catch (error: any) {
    return { errorMessage: error.message };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { errorMessage: null };
  } catch (error: any) {
    return { errorMessage: error.message };
  }
}

export async function googleSigninAction() {
  try {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    return { errorMessage: null, url: data.url };
  } catch (error) {
    return { errorMessage: error.message };
  }
}
