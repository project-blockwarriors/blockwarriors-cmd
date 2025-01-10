import { getTeams } from '@/server/actions/teams';
import { TeamCard } from '../../components/TeamCard';

export default async function TeamsPage() {
  const teams = await getTeams();

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
            name={team.team_name}
            wins={team.team_wins}
            losses={team.team_losses}
            elo={team.team_elo}
            members={team.members.map(m => `${m.first_name} ${m.last_name}`)}
          />
        ))}
      </div>
    </div>
  );
}
