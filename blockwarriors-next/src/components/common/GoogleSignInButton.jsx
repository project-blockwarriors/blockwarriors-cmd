'use client';

import React from 'react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authClient } from '@/lib/auth-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function GoogleSignInButton() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social(
        {
          provider: "google",
        },
        {
          onSuccess: () => {
            toast.success("Signed in with Google successfully!");
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Failed to sign in with Google");
          },
        }
      );
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Google sign in error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isGoogleLoading}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGoogleLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Image
            src="/google-logo.svg"
            alt="Google logo"
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
          />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}
