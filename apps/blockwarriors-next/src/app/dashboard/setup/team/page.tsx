import { Card } from '@/components/ui/card';
import { getAllTeamsWithMembers } from '@/server/db/teams';
import { Input } from '@/components/ui/input';
import { Search, Users, UserPlus, Settings } from 'lucide-react';
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

  // Create profile object with user_id and team info
  const profile: UserProfile = {
    user_id: authUser.id,
    first_name: userProfile?.first_name ?? null,
    last_name: userProfile?.last_name ?? null,
    institution: userProfile?.institution ?? null,
    geographic_location: userProfile?.geographic_location ?? null,
    team: userProfile?.team ?? null,
  };

  const teams = await getAllTeamsWithMembers();
  const hasTeams = teams.length > 0;
  const isTeamLeader = profile.team?.leader_id === profile.user_id;

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl p-8 border-primary/10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {profile.team ? (
                <Settings className="h-6 w-6 text-primary" />
              ) : (
                <Users className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {profile.team ? 'Manage Your Team' : 'Find Your Team'}
              </h1>
              <p className="text-muted-foreground">
                {profile.team
                  ? isTeamLeader
                    ? 'Manage your team or disband it if needed'
                    : 'View your team details or leave to join another'
                  : 'Join an existing team or create your own'}
              </p>
            </div>
          </div>
        </div>

        <Tabs
          defaultValue={profile.team ? 'view' : hasTeams ? 'join' : 'create'}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1">
            {profile.team ? (
              <>
                <TabsTrigger value="view" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  <Users className="h-4 w-4 mr-2" />
                  View Team
                </TabsTrigger>
                {isTeamLeader ? (
                  <TabsTrigger value="disband" className="data-[state=active]:bg-destructive data-[state=active]:text-white">
                    Disband Team
                  </TabsTrigger>
                ) : (
                  <TabsTrigger value="leave" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                    Leave Team
                  </TabsTrigger>
                )}
              </>
            ) : (
              <>
                <TabsTrigger value="join" disabled={!hasTeams} className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join a Team {!hasTeams && '(None)'}
                </TabsTrigger>
                <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  <Users className="h-4 w-4 mr-2" />
                  Create Team
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {profile.team ? (
            <>
              <TabsContent value="view">
                {(() => {
                  const teamData = teams.find((t) => t.id === profile.team!.id);
                  return teamData ? (
                    <TeamCard
                      id={teamData.id}
                      team_name={teamData.team_name}
                      leader_id={teamData.leader_id}
                      team_elo={teamData.team_elo}
                      team_wins={teamData.team_wins}
                      team_losses={teamData.team_losses}
                      members={teamData.members}
                      currentUserId={profile.user_id}
                      currentUserTeamId={profile.team.id}
                      hideLeaveButton
                    />
                  ) : null;
                })()}
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
                    {(() => {
                      const teamData = teams.find((t) => t.id === profile.team!.id);
                      return teamData ? (
                        <TeamCard
                          id={teamData.id}
                          team_name={teamData.team_name}
                          leader_id={teamData.leader_id}
                          team_elo={teamData.team_elo}
                          team_wins={teamData.team_wins}
                          team_losses={teamData.team_losses}
                          members={teamData.members}
                          currentUserId={profile.user_id}
                          currentUserTeamId={profile.team.id}
                        />
                      ) : null;
                    })()}
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
                    {(() => {
                      const teamData = teams.find((t) => t.id === profile.team!.id);
                      return teamData ? (
                        <TeamCard
                          id={teamData.id}
                          team_name={teamData.team_name}
                          leader_id={teamData.leader_id}
                          team_elo={teamData.team_elo}
                          team_wins={teamData.team_wins}
                          team_losses={teamData.team_losses}
                          members={teamData.members}
                          currentUserId={profile.user_id}
                          currentUserTeamId={profile.team.id}
                        />
                      ) : null;
                    })()}
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
                      <Search className="absolute left-3 top-3 h-4 w-4 text-primary/50" />
                      <Input
                        placeholder="Search teams by name..."
                        className="pl-10 border-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {teams.map((team) => (
                        <TeamCard
                          key={team.id}
                          id={team.id}
                          team_name={team.team_name}
                          leader_id={team.leader_id}
                          team_elo={team.team_elo}
                          team_wins={team.team_wins}
                          team_losses={team.team_losses}
                          members={team.members}
                          currentUserId={profile.user_id}
                          currentUserTeamId={profile.team?.id ?? null}
                          hideLeaveButton
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-white font-medium mb-1">No teams yet</p>
                    <p className="text-muted-foreground text-sm">Be the first to create one!</p>
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
