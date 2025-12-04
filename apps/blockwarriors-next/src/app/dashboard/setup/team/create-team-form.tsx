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
import { createTeam } from '@/server/actions/teams';
import { Users } from 'lucide-react';

const createTeamSchema = z.object({
  teamName: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(3, 'Team name must be at least 3 characters')
        .max(50, 'Team name cannot exceed 50 characters')
        .regex(
          /^[a-zA-Z0-9\s-]+$/,
          'Only letters, numbers, spaces, and hyphens are allowed'
        )
    ),
});


type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamFormProps {
  userId: string;
}

export function CreateTeamForm({ userId }: CreateTeamFormProps) {
  const router = useRouter();
  const form = useForm<CreateTeamFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTeamSchema as any),
    defaultValues: {
      teamName: '',
    },
  });

  async function onSubmit(data: CreateTeamFormData) {
    const {error} = await createTeam(data.teamName, userId);
    if (error) {
      console.error('Failed to create team:', error);
      form.setError('teamName', {
        type: 'manual',
        message: 'Failed to create team. Please try again.',
      });
    }
    else {router.push('/dashboard/setup')}
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create Your Team</h2>
              <p className="text-sm text-muted-foreground">Start building your championship team</p>
            </div>
          </div>
          <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Team Name <span className="text-primary">*</span></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your team name" 
                    {...field} 
                    className="border-primary/20 focus:border-primary"
                  />
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
          <Users className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </form>
    </Form>
  );
}
