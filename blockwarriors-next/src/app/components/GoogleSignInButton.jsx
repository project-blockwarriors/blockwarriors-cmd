'use client';

import React from 'react';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ActiveButton from './ActiveButton';
import { googleSigninAction } from '@/server/actions/users';

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
    <ActiveButton
      text={
        isGoogleSigninPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Sign in with Google'
        )
      }
      onClick={googleSignin}
      className="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm"
    />
  );
}
