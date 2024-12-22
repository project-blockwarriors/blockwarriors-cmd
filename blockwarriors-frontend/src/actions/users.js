"use server";

import { createSupabaseClient } from "@/auth/server";

export async function loginAction(formData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = await createSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: error.message };
  }
}

export async function signupAction(formData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = await createSupabaseClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: error.message };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { errorMessage: null };
  } catch (error) {
    return { errorMessage: error.message };
  }
}

export async function googleSignupAction() {
  try {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;

    return { errorMessage: null, url: data.url };
  } catch (error) {
    return { errorMessage: error.message };
  }
}
