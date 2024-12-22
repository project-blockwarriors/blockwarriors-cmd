'use client';

import { z } from 'zod';
import { useRegistration } from '@/app/context/RegistrationContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/auth/client'; // Import Supabase client
import GoogleSignInButton from '@/app/components/GoogleSignInButton';

const formSchema = z.object({
  userName: z.string().min(3).max(100),
  userEmail: z.string().email(),
  institution: z.string().min(3).max(100),
  geographicLocation: z.string().min(3).max(100),
});

export default function UserSignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div className="space-y-8">
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <GoogleSignInButton></GoogleSignInButton>
    </div>
  );
}
