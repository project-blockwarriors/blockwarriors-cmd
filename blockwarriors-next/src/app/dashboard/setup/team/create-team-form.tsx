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
import Select from 'react-select';

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
    timeZone: z.string().min(1, "Please select a time zone"),
});

let timeZone = [
  { value: 'UTC-10:00', label: 'UTC-10:00 (Hawaii-Aleutian Time)' },
  { value: 'UTC-08:00', label: 'UTC-08:00 (Pacific Standard Time)' },
  { value: 'UTC-07:00', label: 'UTC-07:00 (Mountain Standard Time)' },
  { value: 'UTC-06:00', label: 'UTC-06:00 (Central Standard Time)' },
  { value: 'UTC-05:00', label: 'UTC-05:00 (Eastern Standard Time)' },
  { value: 'UTC-04:00', label: 'UTC-04:00 (Atlantic Standard Time, Caribbean Time)' },
  { value: 'UTC-03:00', label: 'UTC-03:00 (Brazil Time)' },
  { value: 'UTC+00:00', label: 'UTC+00:00 (Greenwich Mean Time)' },
  { value: 'UTC+01:00', label: 'UTC+01:00 (Central European Time)' },
  { value: 'UTC+02:00', label: 'UTC+02:00 (Eastern European Time, South Africa Time)' },
  { value: 'UTC+03:00', label: 'UTC+03:00 (Moscow Time, Arabian Time)' },
  { value: 'UTC+04:00', label: 'UTC+04:00 (Gulf Standard Time, UAE Time)' },
  { value: 'UTC+05:30', label: 'UTC+05:30 (India Standard Time)' },
  { value: 'UTC+06:00', label: 'UTC+06:00 (Bangladesh Time)' },
  { value: 'UTC+07:00', label: 'UTC+07:00 (Indochina Time)' },
  { value: 'UTC+08:00', label: 'UTC+08:00 (China Standard Time)' },
  { value: 'UTC+09:00', label: 'UTC+09:00 (Japan Standard Time, Korea Standard Time)' },
  { value: 'UTC+10:00', label: 'UTC+10:00 (Australian Eastern Time)' },
  { value: 'UTC+11:00', label: 'UTC+11:00 (Solomon Islands Time, Magadan Time)' },
  { value: 'UTC+12:00', label: 'UTC+12:00 (New Zealand Time)' }
];

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: state.isFocused
      ? '1px solid #ff7f32'
      : '1px solid #3d2a1f',
    borderRadius: '4px',
    backgroundColor: '#1a0e08',
    color: 'white',
    outline: 'none',
    boxShadow: 'none',
    '&:hover': {},
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9e7c6b',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'white',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#4d2f23' : '#1a0e08',
    padding: '10px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#5a382b',
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#1a0e08',
    border: '1px solid #5a3a2b',
    borderRadius: '4px',
    marginTop: '4px',
    zIndex: 10,
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#ff7f32' : '#5a3a2b',
    backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="%235a3a2b" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px"><path d="M7 10l5 5 5-5z"/></svg>')`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '12px',
    '&:hover': {
      color: '#ff7f32',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    paddingRight: '30px',
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    paddingRight: '10px',
  }),
};

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
      timeZone: '',
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
          <FormField
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time Zone</FormLabel>
                  <FormControl>
                    <Select
                      options={timeZone}
                      value={timeZone.find(option => option.value === field.value)}
                      onChange={(selectedOption) => field.onChange(selectedOption?.value)}
                      styles={customStyles}
                    />
                  </FormControl>
                  <FormDescription>
                      Choose the time zone you live in/would like your team to play in. This will be used to schedule your matches appropriately.
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
