'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from '@/components/ui/form';
import { z } from 'zod';
import { useRegistration } from '../../context/RegistrationContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/auth/client'; // Import Supabase client

const formSchema = z.object({
  userName: z.string().min(3).max(100),
  userEmail: z.string().email(),
  institution: z.string().min(3).max(100),
  geographicLocation: z.string().min(3).max(100),
});

export default function UserDetailsPage() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: '',
      userEmail: '',
      institution: '',
      geographicLocation: '',
    },
  });
  const { setRegistrationData } = useRegistration();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Step 1: Sign up the user using Supabase authentication
      const { data: userData, error } = await supabase.auth.signUp({
        email: values.userEmail,
        password: 'temporary-password', // Use a temporary password or a password setup link
      });

      if (error) {
        throw error; // Handle authentication error
      }

      // Step 2: Insert user details into the 'users' table in Supabase
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            user_name: values.userName,
            email: values.userEmail,
            institution: values.institution,
            geographic_location: values.geographicLocation,
            user_id: userData?.user?.id, // Linking to the user created by Supabase
          },
        ]);

      if (dbError) {
        throw dbError; // Handle database insertion error
      }

      // Step 3: Set registration data in context
      setRegistrationData((prev) => ({
        ...prev,
        userName: values.userName,
        userEmail: values.userEmail,
        institution: values.institution,
        geographicLocation: values.geographicLocation,
      }));

      // Step 4: Redirect to the next page
      router.push('/register/team-selection');
    } catch (error: any) {
      setErrorMessage(error.message); // Display error message
    } finally {
      setIsLoading(false); // Stop loading state
    }
  };

  return (
    <div className="space-y-8">
      <h1>User Details</h1>
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}

      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your institution" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="geographicLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Geographic Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your geographic location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Next'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
