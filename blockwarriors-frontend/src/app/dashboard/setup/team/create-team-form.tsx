'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createTeam } from '@/actions/teams';
import { Users } from 'lucide-react';

const createTeamSchema = z.object({
  teamName: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(50, 'Team name cannot exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9\s-]+$/,
      'Only letters, numbers, spaces, and hyphens are allowed'
    )
    .transform((value) => value.trim()),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamFormProps {
  userId: string;
}

export function CreateTeamForm({ userId }: CreateTeamFormProps) {
  const router = useRouter();
  const form = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      teamName: '',
    },
  });

  async function onSubmit(data: CreateTeamFormData) {
    try {
      await createTeam(data.teamName, userId);
      router.push('/dashboard/setup');
    } catch (error) {
      console.error('Failed to create team:', error);
      form.setError('teamName', {
        type: 'manual',
        message: 'Failed to create team. Please try again.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Create Your Team</h2>
          </div>
          <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your team name" {...field} />
                </FormControl>
                <FormDescription>
                  Choose a unique name for your team. This will be displayed in
                  tournaments and leaderboards.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          Create Team
        </Button>
      </form>
    </Form>
  );
}
