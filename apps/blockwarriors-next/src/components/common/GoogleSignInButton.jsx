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
      className="flex items-center justify-center gap-3 w-full px-4 py-3 text-sm font-medium text-white bg-white/10 border border-primary/20 rounded-lg hover:bg-white/20 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      ) : (
        <>
          <Image
            src="/google-logo.svg"
            alt="Google logo"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}
