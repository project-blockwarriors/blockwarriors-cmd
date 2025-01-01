'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

type SetupStatus = {
  profileComplete?: boolean;
  teamComplete?: boolean;
  profile?: {
    name: string;
    university: string;
  };
  team?: {
    name: string;
    role: 'captain' | 'member';
  };
};

export default function SetupPage() {
  const router = useRouter();
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({});

  useEffect(() => {
    // Load setup status from local storage
    const storedStatus = localStorage.getItem('setupStatus');
    if (storedStatus) {
      try {
        setSetupStatus(JSON.parse(storedStatus));
      } catch (error) {
        console.error('Failed to parse setup status:', error);
        setSetupStatus({});
      }
    }
  }, []);

  return (
    <div className="space-y-8">

      <div className="text-center space-y-4">
        <div className="inline-block">
          <h1 className="text-4xl font-bold bg-gradient-to-r bg-clip-text text-white">
            Let's Get You Started
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Welcome to BlockWarriors! Follow these simple steps to customize your gaming experience
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            {setupStatus.profileComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Profile Setup</h2>
              <p className="text-gray-500">
                {setupStatus.profileComplete
                  ? `Profile created as ${setupStatus.profile?.name}`
                  : 'Create your profile to get started'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/setup/profile')}
              variant={setupStatus.profileComplete ? 'outline' : 'default'}
            >
              {setupStatus.profileComplete ? 'Edit Profile' : 'Create Profile'}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            {setupStatus.teamComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Team Setup</h2>
              <p className="text-gray-500">
                {setupStatus.teamComplete
                  ? `Member of ${setupStatus.team?.name}`
                  : 'Create or join a team'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/setup/team')}
              variant={setupStatus.teamComplete ? 'outline' : 'default'}
            >
              {setupStatus.teamComplete ? 'Manage Team' : 'Setup Team'}
            </Button>
          </div>
        </Card>
      </div>

      {setupStatus.profileComplete && setupStatus.teamComplete && (
        <div className="flex justify-end">
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
