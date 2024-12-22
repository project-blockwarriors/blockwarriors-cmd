'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select, { SingleValue } from 'react-select';
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from '@/components/ui/form';
import { z } from 'zod';
import { useRegistration } from '@/app/context/RegistrationContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/auth/client'; // Supabase client import

const formSchema = z.object({
  teamName: z.string().min(3).max(100),
});

export default function TeamSelectionPage() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: '',
    },
  });

  const { registrationData, setRegistrationData } = useRegistration();
  const router = useRouter();
  const [teamOptions, setTeamOptions] = useState<{ value: string; label: string }[]>([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('teams').select('team_name');
      if (error) {
        console.error('Error fetching teams:', error.message);
        return;
      }

      // Map data into options for react-select
      const options = data.map((team) => ({
        value: team.team_name,
        label: team.team_name,
      }));
      setTeamOptions(options);
    };

    fetchTeams();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        setErrorMessage('Failed to retrieve user information. Please log in again.');
        return;
      }     

      const userId = data.user.id; // Extract the user ID safely

      let teamName = values.teamName;

      if (isCreatingTeam) {
        // Insert the new team into the Supabase `teams` table
        const { error } = await supabase
          .from('teams')
          .insert([{ team_name: teamName }]);

        if (error) {
          setErrorMessage('Failed to create team. Please try again.');
          return;
        }
      }

      // Update the user's team in the Supabase `users` table
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ team: teamName }) // Updating the `team` column
        .eq('id', userId); // Update for the current user

      if (userUpdateError) {
        setErrorMessage('Failed to update user team. Please try again.');
        return;
      }

      // Update registration context
      setRegistrationData((prev) => ({
        ...prev,
        teamName,
      }));

      // Redirect to the next step
      router.push('/register/confirmation');
    } catch (error) {
      console.error('Error in onSubmit:', error.message);
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <h1>Team Selection</h1>
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isCreatingTeam ? (
            <>
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select your Team</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        options={teamOptions}
                        isClearable
                        placeholder="Search or select a team"
                        value={teamOptions.find((team) => team.value === field.value)} // Ensure value is an object { value, label }
                        onChange={(selectedOption: SingleValue<{ value: string; label: string }>) =>
                          field.onChange(selectedOption?.value || '') // Update the field with team name
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-center">
                <span className="text-sm">
                  Can't find your team?{' '}
                  <Button
                    variant="link"
                    onClick={() => setIsCreatingTeam(true)}
                    className="ml-2 text-blue-500 underline"
                  >
                    Create one
                  </Button>
                </span>
              </div>
            </>
          ) : (
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Create a New Team</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your new team name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" size="lg" className="w-full">
            {isCreatingTeam ? 'Create Team' : 'Next'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
