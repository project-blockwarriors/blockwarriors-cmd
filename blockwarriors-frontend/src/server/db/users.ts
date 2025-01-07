import { createSupabaseClient } from '@/auth/server';
import { UserProfile } from '@/types/user';

const publicSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.DEPLOY_PRIME_URL ||
  'http://localhost:3000';

export async function getUserProfile(userId: string) {
  const supabase = await createSupabaseClient();
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
    return null;
  }

  return user;
}

export async function updateUserProfile(newUserProfile: UserProfile) {
  const supabase = await createSupabaseClient();
  const { team, ...updateData } = newUserProfile;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('user_id', newUserProfile.user_id)
    .select();

  if (error) {
    console.error('Failed to update profile:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// User Authentication Actions

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error('Failed to sign in with password:', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function signUpWithPassword(email: string, password: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('Failed to sign up with password:', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function signOut() {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Failed to sign out:', error);
    return { data: null, error: error.message };
  }
  return { error: null };
}

export async function signInWithGoogle() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${publicSiteUrl}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    console.error('Failed to sign in with Google:', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}
