'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select, { SingleValue, GroupBase, ActionMeta } from 'react-select';
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from '@/components/ui/form';
import { z } from 'zod';
import { useRegistration } from '../../context/RegistrationContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const fetchTeams = async () => {
      // Mock team list, you would replace this with an API call
      const teams = [
        { value: 'team_alpha', label: 'Team Alpha' },
        { value: 'team_beta', label: 'Team Beta' },
      ];
      setTeamOptions(teams);
    };

    fetchTeams();
  }, []);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isCreatingTeam) {
      // Create a new team if the user is creating a new one
      setRegistrationData((prev) => ({
        ...prev,
        teamName: values.teamName,
      }));
    } else {
      // Otherwise, use the selected team from the dropdown
      setRegistrationData((prev) => ({
        ...prev,
        teamName: values.teamName,
      }));
    }

    router.push('/register/confirmation');
  };

  return (
    <div className="space-y-8">
      <h1>Team Selection</h1>
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
                        onChange={(selectedOption: SingleValue<{ value: string; label: string }>, actionMeta: ActionMeta<{ value: string; label: string }>) =>
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
