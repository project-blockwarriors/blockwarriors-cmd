import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardRow } from "./(components)/LeaderboardRow";
import { getAllTeamsScores } from "@/server/db/teams";

export default async function LeaderboardPage() {
  const { data: teams, error } = await getAllTeamsScores();
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Error loading leaderboard</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Sort teams by ELO in descending order and add rank
  const rankedTeams = teams
    ?.sort((a, b) => b.team_elo - a.team_elo)
    .map((team, index) => ({
      ...team,
      rank: index + 1
    })) || [];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">Tournament Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            Top performers ranked by <span className="text-primary font-medium">ELO rating</span>
          </p>
        </div>
      </div>
      
      <Card className="border-primary/10">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Current Standings</CardTitle>
            <span className="text-sm text-muted-foreground">
              {rankedTeams.length} teams
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {rankedTeams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No teams on the leaderboard yet
              </div>
            ) : (
              rankedTeams.map((team) => (
                <LeaderboardRow 
                  key={team.id} 
                  rank={team.rank}
                  name={team.team_name}
                  elo={team.team_elo}
                  wins={team.team_wins}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}