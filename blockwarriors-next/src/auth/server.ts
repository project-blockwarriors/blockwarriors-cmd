import { getToken } from "@/lib/auth-server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/lib/convex";

// User type for Better Auth
export interface User {
  id: string; 
  email?: string;
  name?: string; // Full name from Better Auth (e.g., "John Doe")
  emailVerified?: boolean;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get the current authenticated user
export async function getUser(): Promise<User | null> {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }

    // Query Convex to get the current user
    try {
      const user = await fetchQuery(
        api.auth.getCurrentUser,
        {},
        { token }
      );

      if (!user) {
        return null;
      }

      // Better Auth with Convex returns user as a Convex document with _id
      // The _id is the Convex document ID - this is what we use as userId for linking to userProfiles
      // This userId is stored in userProfiles.userId to link profiles to Better Auth users
      if (!user._id || !user.createdAt || !user.updatedAt) {
        console.error("User object some fields are missing:", user);
        return null;
      }

      return {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      };
    } catch (queryError) {
      console.error("Error querying Convex for user:", queryError);
      return null;
    }
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

export async function protectRoute() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

