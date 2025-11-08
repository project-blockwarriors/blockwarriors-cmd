import { Card } from '@/components/ui/card';
import { getAllTeamsWithMembers } from '@/server/db/teams';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserProfile } from '@/server/db/users';
import { getUser } from '@/auth/server';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/types/user';
import { TeamCard } from './team-card';
import { CreateTeamForm } from './create-team-form';

export default async function TeamSetupPage() {
  const authUser = await getUser();
  if (!authUser) {
    redirect('/login');
  }

  // Fetch user profile and team information
  const userProfile = await getUserProfile(authUser.id);

  // Convert null values to empty strings for the form
  const profile: UserProfile = {
    user_id: authUser.id,
    first_name: userProfile.first_name ?? '',
    last_name: userProfile.last_name ?? '',
    institution: userProfile.institution ?? '',
    geographic_location: userProfile.geographic_location ?? '',
    team: userProfile.team ?? null,
  };

  const teams = await getAllTeamsWithMembers();
  const hasTeams = teams.length > 0;
  const isTeamLeader = profile.team?.leader_id === profile.user_id;

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {profile.team ? 'Manage Your Team 🤝' : 'Find Your Team 🤝'}
          </h1>
          <p className="text-muted-foreground">
            {profile.team
              ? isTeamLeader
                ? 'Manage your team or disband it if needed.'
                : 'View your team details or leave to join another one.'
              : 'Join an existing team or create your own to start competing in BlockWarriors!'}
          </p>
        </div>

        <Tabs
          defaultValue={profile.team ? 'view' : hasTeams ? 'join' : 'create'}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            {profile.team ? (
              <>
                <TabsTrigger value="view">View Team</TabsTrigger>
                {isTeamLeader ? (
                  <TabsTrigger value="disband" className="text-destructive">
                    Disband Team
                  </TabsTrigger>
                ) : (
                  <TabsTrigger value="leave">Leave Team</TabsTrigger>
                )}
              </>
            ) : (
              <>
                <TabsTrigger value="join" disabled={!hasTeams}>
                  Join a Team {!hasTeams && '(No Teams Available)'}
                </TabsTrigger>
                <TabsTrigger value="create">Create Team</TabsTrigger>
              </>
            )}
          </TabsList>

          {profile.team ? (
            <>
              <TabsContent value="view">
                <TeamCard
                  id={profile.team.id}
                  team_name={profile.team.team_name}
                  leader_id={profile.team.leader_id}
                  members={
                    teams.find((t) => t.id === profile.team.id)?.members ?? []
                  }
                  currentUserId={profile.user_id}
                  currentUserTeamId={profile.team.id}
                  hideLeaveButton
                />
              </TabsContent>
              {isTeamLeader ? (
                <TabsContent value="disband">
                  <div className="space-y-4">
                    <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                      <h3 className="font-semibold mb-2 text-destructive">
                        Warning: Disbanding Team
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All members will be
                        removed from the team and the team will be permanently
                        deleted.
                      </p>
                    </div>
                    <TeamCard
                      id={profile.team.id}
                      team_name={profile.team.team_name}
                      leader_id={profile.team.leader_id}
                      members={
                        teams.find((t) => t.id === profile.team.id)?.members ??
                        []
                      }
                      currentUserId={profile.user_id}
                      currentUserTeamId={profile.team.id}
                    />
                  </div>
                </TabsContent>
              ) : (
                <TabsContent value="leave">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted">
                      <h3 className="font-semibold mb-2">Leaving Your Team</h3>
                      <p className="text-sm text-muted-foreground">
                        You'll need to join another team or create a new one to
                        participate in tournaments.
                      </p>
                    </div>
                    <TeamCard
                      id={profile.team.id}
                      team_name={profile.team.team_name}
                      leader_id={profile.team.leader_id}
                      members={
                        teams.find((t) => t.id === profile.team.id)?.members ??
                        []
                      }
                      currentUserId={profile.user_id}
                      currentUserTeamId={profile.team.id}
                    />
                  </div>
                </TabsContent>
              )}
            </>
          ) : (
            <>
              <TabsContent value="join" className="space-y-6">
                {hasTeams ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search teams by name..."
                        className="pl-10"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {teams.map((team) => (
                        <TeamCard
                          key={team.id}
                          id={team.id}
                          team_name={team.team_name}
                          leader_id={team.leader_id}
                          members={team.members}
                          currentUserId={profile.user_id}
                          currentUserTeamId={profile.team?.id}
                          hideLeaveButton
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No teams available. Be the first to create one!
                  </div>
                )}
              </TabsContent>

              <TabsContent value="create">
                <CreateTeamForm userId={profile.user_id} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
