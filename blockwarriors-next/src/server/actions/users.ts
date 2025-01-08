'use server';

import { UserProfile } from '@/types/user';
import {
  getUserProfile as getUserProfileDb,
  updateUserProfile as updateUserProfileDb,
  signInWithPassword,
  signUpWithPassword,
  signOut,
  signInWithGoogle,
} from '../db/users';

// Profile Management Actions
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  return await getUserProfileDb(userId);
}

export async function updateUserProfile(
  newUserProfile: UserProfile
): Promise<{ data: any; error: string | null }> {
  return await updateUserProfileDb(newUserProfile);
}

// Authentication Actions
export async function signinAction(
  formData: FormData
): Promise<{ errorMessage: string | null }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await signInWithPassword(email, password);
  return { errorMessage: error };
}

export async function signupAction(
  formData: FormData
): Promise<{ errorMessage: string | null }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await signUpWithPassword(email, password);
  return { errorMessage: error };
}

export async function signOutAction(): Promise<{
  errorMessage: string | null;
}> {
  const { error } = await signOut();
  return { errorMessage: error };
}

export async function googleSigninAction() {
  const { data, error } = await signInWithGoogle();
  return { errorMessage: error, url: data?.url };
}
