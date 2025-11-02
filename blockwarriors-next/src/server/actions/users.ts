"use server";

import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/lib/convex";
import { getToken } from "@/lib/auth-server";
import { UserProfile } from "@/types/user";

// Get user profile by userId
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    if (!userId || typeof userId !== 'string') {
      console.error("Invalid userId provided to getUserProfile:", userId);
      return null;
    }

    const token = await getToken();
    if (!token) {
      return null;
    }

    const profile = await fetchQuery(
      api.userProfiles.getUserProfile,
      { userId },
      { token }
    );

    if (!profile) {
      return null;
    }

    // Transform to UserProfile type
    return {
      user_id: profile.userId,
      first_name: profile.firstName,
      last_name: profile.lastName,
      institution: profile.institution,
      team: profile.teamId ? { id: profile.teamId as any, team_name: "", leader_id: "" } : null, // Will need to fetch team separately if needed
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

// Check if profile is complete
export async function isProfileComplete(userId: string): Promise<boolean> {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      console.error("Invalid userId provided to isProfileComplete:", userId);
      return false;
    }

    const token = await getToken();
    if (!token) {
      return false;
    }

    const isComplete = await fetchQuery(
      api.userProfiles.isProfileComplete,
      { userId },
      { token }
    );

    return isComplete ?? false;
  } catch (error) {
    console.error("Error checking profile completeness:", error);
    return false;
  }
}

// Auto-create profile from Better Auth user's full name (parses into first/last)
// Useful for OAuth users who already have a name in Better Auth
export async function createProfileFromAuthUser(
  userId: string,
  fullName: string
): Promise<void> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error("Invalid userId provided");
    }

    if (!fullName || !fullName.trim()) {
      throw new Error("Full name is required");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    await fetchMutation(
      api.userProfiles.createProfileFromAuthUser,
      {
        userId,
        fullName: fullName.trim(),
      },
      { token }
    );
  } catch (error) {
    console.error("Error auto-creating profile:", error);
    throw error;
  }
}

// Create or update user profile
export async function createOrUpdateProfile(
  userId: string,
  profileData: {
    firstName: string;
    lastName: string;
    institution: string | null;
  }
): Promise<void> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error("Invalid userId provided");
    }

    if (!profileData.firstName || !profileData.lastName) {
      throw new Error("First name and last name are required");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    await fetchMutation(
      api.userProfiles.createOrUpdateProfile,
      {
        userId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        institution: profileData.institution,
      },
      { token }
    );
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    throw error;
  }
}

