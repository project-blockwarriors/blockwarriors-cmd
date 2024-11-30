'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormField } from '@/components/ui/form';
import { z } from 'zod';
import { useRegistration } from '../../context/RegistrationContext';
import { useRouter } from 'next/navigation';

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

  // Corrected onSubmit function
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setRegistrationData((prev) => ({
      ...prev,
      userName: values.userName,
      userEmail: values.userEmail,
      institution: values.institution,
      geographicLocation: values.geographicLocation,
    }));
    router.push('/register/team-selection');
  };

  return (
    <div className="space-y-8">
      <h1>User Details</h1>
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

          <Button type="submit" size="lg" className="w-full">
            Next
          </Button>
        </form>
      </Form>
    </div>
  );
}
