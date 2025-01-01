'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  university: z.string().min(3, 'University name must be at least 3 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
  const router = useRouter();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      university: '',
    },
  });

  useEffect(() => {
    // Load existing profile data from local storage
    const setupStatus = localStorage.getItem('setupStatus');
    if (setupStatus) {
      const { profile } = JSON.parse(setupStatus);
      if (profile) {
        const defaultValues = {
          name: profile.name || '',
          university: profile.university || '',
        };
        // Only reset if values are different
        const currentValues = form.getValues();
        if (JSON.stringify(currentValues) !== JSON.stringify(defaultValues)) {
          form.reset(defaultValues);
        }
      }
    }
  }, []); // Only run once on mount

  function onSubmit(data: ProfileFormData) {
    // Save to local storage
    const setupStatus = localStorage.getItem('setupStatus');
    const status = setupStatus ? JSON.parse(setupStatus) : {};
    
    localStorage.setItem('setupStatus', JSON.stringify({
      ...status,
      profileComplete: true,
      profile: {
        name: data.name,
        university: data.university,
      },
    }));

    router.push('/dashboard/setup');
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to BlockWarriors! 🚀</h1>
          <p className="text-muted-foreground">Tell us about yourself to personalize your experience</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input placeholder="University Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/setup')}
              >
                Cancel
              </Button>
              <Button type="submit">Save Profile</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
