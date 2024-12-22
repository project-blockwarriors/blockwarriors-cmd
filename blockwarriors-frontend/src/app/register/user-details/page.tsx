'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient, supabase } from '@/auth/client'; // Import Supabase client
import { User } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userAgent } from 'next/server';

const formSchema = z.object({
  userName: z.string().min(3).max(100),
  userEmail: z.string().email(),
  institution: z.string().min(3).max(100),
  geographicLocation: z.string().min(3).max(100),
});

async function RegistrationPage() {

  const [user, setUser] = useState<User | null>(null);

  const { auth } = createSupabaseClient();

  auth.onAuthStateChange((event, session) => {
    setUser(session?.user || null);
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: '',
      userEmail: '',
      institution: '',
      geographicLocation: '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (values) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        throw new Error('Failed to retrieve user information. Please log in again.');
      }

      const userId = userData.user.id;

      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            user_name: values.userName,
            email: values.userEmail,
            institution: values.institution,
            geographic_location: values.geographicLocation,
            user_id: userId,
          },
        ]);

      if (dbError) {
        throw dbError;
      }

      // Redirect to the next step
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Registration Page</h1>
      {errorMessage && <div>{errorMessage}</div>}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <input {...form.register('userName')} placeholder="Username" />
        <input {...form.register('userEmail')} placeholder="Email" disabled />
        <input {...form.register('institution')} placeholder="Institution" />
        <input {...form.register('geographicLocation')} placeholder="Geographic Location" />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}