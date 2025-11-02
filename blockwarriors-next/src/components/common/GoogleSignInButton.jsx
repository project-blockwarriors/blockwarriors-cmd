'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { authClient } from '@/lib/auth-client';

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  const googleSignin = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={googleSignin}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285f4] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
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
