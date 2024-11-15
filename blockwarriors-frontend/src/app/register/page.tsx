"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Header } from "../components/Header";

const formSchema = z.object({
  teamName: z.string().min(3).max(50),
  institution: z.string().min(3).max(100),
  captainName: z.string().min(3).max(100),
  captainEmail: z.string().email(),
  members: z.string().min(10).max(500),
  experience: z.string().min(10).max(1000),
});

export default function RegisterPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      institution: "",
      captainName: "",
      captainEmail: "",
      members: "",
      experience: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would typically send the data to your backend
    alert("Registration submitted successfully!");
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1607988795691-3d0147b43231?auto=format&fit=crop&q=80')] bg-cover bg-center">
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your team name" {...field} />
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
                        <FormDescription>
                          University, College, or Organization
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
                          <Input placeholder="Enter team captain's name" {...field} />
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
                          <Input placeholder="Enter team captain's email" {...field} />
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
                          Include experience with AI, Minecraft, and competitive programming
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