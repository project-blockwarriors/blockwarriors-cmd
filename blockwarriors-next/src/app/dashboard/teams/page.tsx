import { getAllTeamsWithMembers } from '@/server/db/teams';
import { TeamCard } from '../(components)/TeamCard';

export default async function TeamsPage() {
  const teams = await getAllTeamsWithMembers();

  if (!teams.length) {
    return <div>No teams found</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tournament Teams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <TeamCard 
            key={team.id}
            id={team.id}
            team_name={team.team_name}
            leader_id={team.leader_id}
            members={team.members}
            team_elo={team.team_elo}
            team_wins={team.team_wins}
            team_losses={team.team_losses}
          />
        ))}
      </div>
    </div>
  );
}
