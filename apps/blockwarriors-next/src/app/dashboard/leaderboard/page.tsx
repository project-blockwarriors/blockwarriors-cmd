import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardRow } from "./(components)/LeaderboardRow";
import { getAllTeamsScores } from "@/server/db/teams";

export default async function LeaderboardPage() {
  const { data: teams, error } = await getAllTeamsScores();
  
  if (error) {
    return <div>Error loading leaderboard: {error}</div>;
  }

  // Sort teams by ELO in descending order and add rank
  const rankedTeams = teams?.map((team, index) => ({
    ...team,
    rank: index + 1
  })).sort((a, b) => b.team_elo - a.team_elo) || [];

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
                elo={team.team_elo}
                wins={team.team_wins}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}