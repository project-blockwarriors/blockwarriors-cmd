import { fetchQuery } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardRow } from "./(components)/LeaderboardRow";

export default async function LeaderboardPage() {
  const token = await getToken();
  if (!token) {
    return <div>Not authenticated</div>;
  }

  // Fetch all teams from Convex
  const teams = await fetchQuery(api.teams.getAllTeams, {}, { token });

  // Transform to leaderboard format
  const rankedTeams = teams.map((team, index) => ({
    id: team._id,
    team_name: team.teamName,
    rank: index + 1,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tournament Leaderboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankedTeams.map((team) => (
              <LeaderboardRow 
                key={team.id} 
                rank={team.rank}
                name={team.team_name}
                elo={0}
                wins={0}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}