'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from "react-select";
import { useEffect, useState } from "react";
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Header } from '../components/Header';

const formSchema = z.object({
  teamName: z.string().min(3).max(50),
  institution: z.string().min(3).max(100),
  captainName: z.string().min(3).max(100),
  captainEmail: z.string().email(),
  members: z.string().min(10).max(500),
  experience: z.string().min(10).max(1000),
  timeZone: z.string().min(1, "Please select a time zone"),
  additionalInformation: z.string().min(10).max(500),
});

export default function RegisterPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: '',
      institution: '',
      captainName: '',
      captainEmail: '',
      members: '',
      experience: '',
      timeZone: '',
      additionalInformation: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would typically send the data to your backend
    alert('Registration submitted successfully!');
  }

  const [countryValue, setCountryValue] = useState(null);

  // Time zones with their corresponding countries/locations
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

  return (
    <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
      <div className="min-h-screen bg-black/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <Header />

          <div className="max-w-2xl mx-auto mt-12">
            <Button variant="ghost" className="mb-6" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>

            <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
              <h1 className="text-3xl font-bold text-white mb-6">
                Tournament Registration
              </h1>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your team name"
                            {...field}
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
                        <FormLabel>Institution</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your institution"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          School, University, College, or Organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="captainName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Captain Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter team captain's name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="captainEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Captain Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter team captain's email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="members"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Members</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List all team members (max 4) with their roles"
                            className="h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include name, email, and role for each member
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Experience</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your team's relevant experience"
                            className="h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include experience with AI, Minecraft, and competitive
                          programming
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
                            defaultValue={timeZone.find((c) => c.value === countryValue)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInformation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any other information you would like us to know"
                            className="h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include any questions, comments, or concerns
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full">
                    Submit Registration
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
