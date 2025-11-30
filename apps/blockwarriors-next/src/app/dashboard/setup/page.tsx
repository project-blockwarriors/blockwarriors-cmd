import { getUser } from '@/auth/server';
import { redirect } from 'next/navigation';
import { CheckCircle2, Circle, Rocket, User, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ClientButton from './(components)/ClientButton';
import { UserProfile } from '@/types/user';
import { getUserProfile } from '@/server/db/users';

export default async function SetupPage() {
  const authUser = await getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Fetch user profile (should already be initialized on account creation)
  const user: UserProfile | null = await getUserProfile(authUser.id);

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
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-8 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-primary mb-4 bg-primary/10 px-4 py-2 rounded-full">
            <Rocket className="h-4 w-4" />
            <span className="text-sm font-medium">Quick Setup</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-primary bg-clip-text text-transparent">
            Let's Get You Started
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mt-3">
            Welcome to BlockWarriors! Follow these simple steps to join the competition
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card className={`p-6 border-primary/10 transition-all ${profileComplete ? 'bg-primary/5' : 'hover:border-primary/30'}`}>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              profileComplete ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              {profileComplete ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">Profile Setup</h2>
                {profileComplete && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    Complete
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
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

        <Card className={`p-6 border-primary/10 transition-all ${teamComplete ? 'bg-primary/5' : profileComplete ? 'hover:border-primary/30' : 'opacity-60'}`}>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              teamComplete ? 'bg-primary/20' : 'bg-secondary'
            }`}>
              {teamComplete ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Users className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">Team Setup</h2>
                {teamComplete && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    Complete
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
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
        <div className="flex justify-center">
          <ClientButton href="/dashboard" className="px-8">
            <Rocket className="h-4 w-4 mr-2" />
            Go to Dashboard
          </ClientButton>
        </div>
      )}
    </div>
  );
}
