import { fetchQuery } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';
import { TeamCard } from '../(components)/TeamCard';

export default async function TeamsPage() {
  const token = await getToken();
  if (!token) {
    return <div>Not authenticated</div>;
  }

  // Fetch all teams from Convex
  const teams = await fetchQuery(api.teams.getAllTeams, {}, { token });

  if (!teams || teams.length === 0) {
    return <div>No teams found</div>;
  }

  // Fetch members for each team
  const teamsWithMembers = await Promise.all(
    teams.map(async (team) => {
      const members = await fetchQuery(
        api.userProfiles.getTeamMembers,
        { teamId: team._id },
        { token }
      );
      return {
        id: team._id,
        team_name: team.teamName,
        leader_id: team.leaderId,
        members: members.map((m) => ({
          first_name: m.firstName,
          last_name: m.lastName,
        })),
      };
    })
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tournament Teams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamsWithMembers.map((team) => (
          <TeamCard 
            key={team.id}
            id={team.id}
            team_name={team.team_name}
            leader_id={team.leader_id}
            members={team.members}
          />
        ))}
      </div>
    </div>
  );
}
