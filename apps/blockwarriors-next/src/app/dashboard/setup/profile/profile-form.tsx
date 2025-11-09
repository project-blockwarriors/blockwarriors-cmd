'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateUserProfile } from '@/server/actions/users';
import { UserProfile } from '@/types/user';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  user_id: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  institution: z.string().min(1, 'Institution is required'),
  geographic_location: z.string().min(1, 'Geographic location is required'),
  team: z.any().nullable(),
});

export interface ProfileFormProps {
  initialData: UserProfile;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();

  const form = useForm<UserProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: UserProfile) {
    try {
      await updateUserProfile(data);
      router.push('/dashboard/setup');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="John" 
                  {...field} 
                  value={field.value || ''} 
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Doe" 
                  {...field} 
                  value={field.value || ''} 
                  required
                />
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
              <FormLabel>Institution *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Princeton University" 
                  {...field} 
                  value={field.value || ''} 
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="geographic_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Geographic Location *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Princeton, NJ" 
                  {...field} 
                  value={field.value || ''} 
                  required
                />
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
  );
}
