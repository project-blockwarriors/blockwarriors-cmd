'use client';

import React from 'react';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { googleSigninAction } from '@/server/actions/users';
import Image from 'next/image';

export default function GoogleSignInButton() {
  const [isGoogleSigninPending, startGoogleSigninTransition] = useTransition();

  const googleSignin = async () => {
    startGoogleSigninTransition(async () => {
      const origin = window.location.origin;
      const { errorMessage, url } = await googleSigninAction(origin);

      if (errorMessage) {
        console.error(errorMessage);
        toast.error('An error occurred');
      } else if (url) {
        window.location.href = url;
      }
    });
  };

  return (
    <button
      onClick={googleSignin}
      disabled={isGoogleSigninPending}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285f4] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGoogleSigninPending ? (
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
