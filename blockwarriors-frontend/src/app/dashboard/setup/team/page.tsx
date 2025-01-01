'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const createTeamSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters'),
});

const joinTeamSchema = z.object({
  teamCode: z.string().min(6, 'Invalid team code'),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;
type JoinTeamFormData = z.infer<typeof joinTeamSchema>;

export default function TeamSetupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('create');

  useEffect(() => {
    // Load existing team data from local storage
    const setupStatus = localStorage.getItem('setupStatus');
    if (setupStatus) {
      const { team } = JSON.parse(setupStatus);
      if (team) {
        setActiveTab('manage');
      }
    }
  }, []);

  const createTeamForm = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      teamName: '',
    },
  });

  const joinTeamForm = useForm<JoinTeamFormData>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: {
      teamCode: '',
    },
  });

  function onCreateTeam(data: CreateTeamFormData) {
    const setupStatus = localStorage.getItem('setupStatus');
    const status = setupStatus ? JSON.parse(setupStatus) : {};
    
    localStorage.setItem('setupStatus', JSON.stringify({
      ...status,
      teamComplete: true,
      team: {
        name: data.teamName,
        role: 'captain',
      },
    }));

    router.push('/dashboard/setup');
  }

  function onJoinTeam(data: JoinTeamFormData) {
    const setupStatus = localStorage.getItem('setupStatus');
    const status = setupStatus ? JSON.parse(setupStatus) : {};
    
    localStorage.setItem('setupStatus', JSON.stringify({
      ...status,
      teamComplete: true,
      team: {
        name: 'Team ' + data.teamCode, // This would come from the API
        role: 'member',
      },
    }));

    router.push('/dashboard/setup');
  }

  function onLeaveTeam() {
    const setupStatus = localStorage.getItem('setupStatus');
    const status = setupStatus ? JSON.parse(setupStatus) : {};
    
    localStorage.setItem('setupStatus', JSON.stringify({
      ...status,
      teamComplete: false,
      team: null,
    }));

    setActiveTab('create');
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Team Setup</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Team</TabsTrigger>
          <TabsTrigger value="join">Join Team</TabsTrigger>
          <TabsTrigger value="manage">Manage Team</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="p-6">
            <Form {...createTeamForm}>
              <form onSubmit={createTeamForm.handleSubmit(onCreateTeam)} className="space-y-6">
                <FormField
                  control={createTeamForm.control}
                  name="teamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter team name" {...field} />
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
                  <Button type="submit">Create Team</Button>
                </div>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card className="p-6">
            <Form {...joinTeamForm}>
              <form onSubmit={joinTeamForm.handleSubmit(onJoinTeam)} className="space-y-6">
                <FormField
                  control={joinTeamForm.control}
                  name="teamCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter team code" {...field} />
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
                  <Button type="submit">Join Team</Button>
                </div>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Current Team</h3>
                <p className="text-gray-400">
                  {(() => {
                    const setupStatus = localStorage.getItem('setupStatus');
                    if (setupStatus) {
                      const { team } = JSON.parse(setupStatus);
                      return team?.name || 'No team';
                    }
                    return 'No team';
                  })()}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Your Role</h3>
                <p className="text-gray-400 capitalize">
                  {(() => {
                    const setupStatus = localStorage.getItem('setupStatus');
                    if (setupStatus) {
                      const { team } = JSON.parse(setupStatus);
                      return team?.role || 'None';
                    }
                    return 'None';
                  })()}
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/setup')}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onLeaveTeam}
                >
                  Leave Team
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
