import { Users } from 'lucide-react';
import { getAllTeamsWithMembers } from '@/server/db/teams';
import { TeamCard } from '../(components)/TeamCard';

export default async function TeamsPage() {
  const teams = await getAllTeamsWithMembers();

  if (!teams.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No teams yet</h2>
        <p className="text-muted-foreground">Be the first to create a team!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">Tournament Teams</h1>
          </div>
          <p className="text-muted-foreground">
            <span className="text-primary font-medium">{teams.length}</span> teams competing for glory
          </p>
        </div>
      </div>

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
