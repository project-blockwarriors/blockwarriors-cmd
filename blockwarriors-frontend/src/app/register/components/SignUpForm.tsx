'use client'
import { zodResolver } from '@hookform/resolvers/zod';
import Select from "react-select";
import { useEffect, useState } from "react";
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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

export default function SignupForm() {

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

  //const [selectedTimeZone, setSelectedTimeZone] = useState('');
  const [countryValue, setCountryValue] = useState(null);

  // below used to be the country descriptions from the example code
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
  useEffect(() => {
    setTimeout(() => {
      setCountryValue({ label: "India", value: "India" });
    }, 2000);
  }, []);

  // pretty sure the below code is old and now unnecessary
  const timeZones = [
    { value: 'UTC-12:00', label: 'UTC-12:00 (Baker Island Time)' },
    { value: 'UTC-11:00', label: 'UTC-11:00 (Niue Time)' },
    { value: 'UTC-10:00', label: 'UTC-10:00 (Hawaii-Aleutian Time)' },
    { value: 'UTC-09:00', label: 'UTC-09:00 (Alaska Time)' },
    { value: 'UTC-08:00', label: 'UTC-08:00 (Pacific Standard Time)' },
    { value: 'UTC-07:00', label: 'UTC-07:00 (Mountain Standard Time)' },
    { value: 'UTC-06:00', label: 'UTC-06:00 (Central Standard Time)' },
    { value: 'UTC-05:00', label: 'UTC-05:00 (Eastern Standard Time)' },
    { value: 'UTC+00:00', label: 'UTC+00:00 (Greenwich Mean Time)' },
    { value: 'UTC+01:00', label: 'UTC+01:00 (Central European Time)' },
    { value: 'UTC+02:00', label: 'UTC+02:00 (Eastern European Time)' },
    { value: 'UTC+03:00', label: 'UTC+03:00 (Moscow Time)' },
    { value: 'UTC+05:30', label: 'UTC+05:30 (India Standard Time)' },
    { value: 'UTC+08:00', label: 'UTC+08:00 (China Standard Time)' },
    { value: 'UTC+09:00', label: 'UTC+09:00 (Japan Standard Time)' },
    { value: 'UTC+12:00', label: 'UTC+12:00 (New Zealand Time)' },
  ];

  const vegetableSelectId = useId();

  return (
    <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
      <div className="min-h-screen bg-black/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
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
                    
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Preferred Time Zone</FormLabel>
                        <FormControl>
                          <Select
                        /* <>
                        <label>
                              <select name="selected" defaultValue="oange">// was select before
                                <option value="cucumber">Cucumber</option>
                                <option value="corn">Corn</option>
                                <option value="tomato">Tomato</option> */

                             // just a styling/font issue 
                            
                            options={timeZone}
                            /* value={country.find((c) => c.value === value)}
                            onChange={(val) => onChange(val.value)} */
                            defaultValue={timeZone.find((c) => c.value === countryValue)}
                            
                            /* value={selectedTimeZone} // Controlled by state
                            onChange={(event) => {
                              const value = event.target.value;
                              setSelectedTimeZone(value); // Update state
                              field.onChange(value); // Update React Hook Form's value
                            }} */
                            
                            /* {...field}
                            className="block w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" */
                          

                            /* <option value="" disabled>Select your preferred time zone</option>
                            <option value="UTC-12:00">UTC-12:00 (Baker Island Time)</option>
                            <option value="UTC-11:00">UTC-11:00 (Niue Time)</option>
                            <option value="UTC-10:00">UTC-10:00 (Hawaii-Aleutian Time)</option>
                            <option value="UTC-09:00">UTC-09:00 (Alaska Time)</option>
                            <option value="UTC-08:00">UTC-08:00 (Pacific Standard Time)</option>
                            <option value="UTC-07:00">UTC-07:00 (Mountain Standard Time)</option>
                            <option value="UTC-06:00">UTC-06:00 (Central Standard Time)</option>
                            <option value="UTC-5:00">UTC-5:00 (Eastern Standard Time)</option>
                            <option value="UTC+00:00">UTC+00:00 (Greenwich Mean Time)</option>
                            <option value="UTC+01:00">UTC+01:00 (Central European Time)</option>
                            <option value="UTC+02:00">UTC+02:00 (Eastern European Time)</option>
                            <option value="UTC+03:00">UTC+03:00 (Moscow Time)</option>
                            <option value="UTC+05:30">UTC+05:30 (India Standard Time)</option>
                            <option value="UTC+08:00">UTC+08:00 (China Standard Time)</option>
                            <option value="UTC+09:00">UTC+09:00 (Japan Standard Time)</option>
                            <option value="UTC+12:00">UTC+12:00 (New Zealand Time)</option> */

                          /* </select> 
                          </>
                          </label> */
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
  );
}