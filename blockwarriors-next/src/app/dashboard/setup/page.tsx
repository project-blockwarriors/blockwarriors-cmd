import { getUser } from '@/auth/server';
import { redirect } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ClientButton from './ClientButton';
import { UserProfile } from '@/types/user';
import { getUserProfile } from '@/server/db/users';

export default async function SetupPage() {
  const authUser = await getUser();

  if (!authUser) {
    redirect('/login');
  }

  const user: UserProfile = await getUserProfile(authUser.id);

  // Check if profile is complete (all required fields are filled)
  const profileComplete = Boolean(
    user?.first_name &&
      user?.last_name &&
      user?.institution &&
      user?.geographic_location
  );

  // Check if user has a team (either as a member or leader)
  const teamComplete = Boolean(user?.team?.id);
  const isTeamLeader = user?.team?.leader_id === authUser.id;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-block">
          <h1 className="text-4xl font-bold bg-gradient-to-r bg-clip-text text-white">
            Let's Get You Started
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Welcome to BlockWarriors! Follow these simple steps to customize your
          gaming experience
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            {profileComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Profile Setup</h2>
              <p className="text-gray-500">
                {profileComplete
                  ? `Profile created as ${user?.first_name} ${user?.last_name}`
                  : 'Create your profile to get started'}
              </p>
            </div>

            <ClientButton
              href="/dashboard/setup/profile"
              variant={profileComplete ? 'outline' : 'default'}
            >
              {profileComplete ? 'Edit Profile' : 'Create Profile'}
            </ClientButton>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            {teamComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Team Setup</h2>
              <p className="text-gray-500">
                {teamComplete
                  ? `${isTeamLeader ? 'Leader' : 'Member'} of ${user?.team?.team_name}`
                  : 'Create or join a team'}
              </p>
            </div>
            <ClientButton
              href="/dashboard/setup/team"
              variant={teamComplete ? 'outline' : 'default'}
              disabled={!profileComplete}
            >
              {teamComplete ? 'Manage Team' : 'Setup Team'}
            </ClientButton>
          </div>
        </Card>
      </div>

      {profileComplete && teamComplete && (
        <div className="flex justify-end">
          <ClientButton href="/dashboard">Go to Dashboard</ClientButton>
        </div>
      )}
    </div>
  );
}
