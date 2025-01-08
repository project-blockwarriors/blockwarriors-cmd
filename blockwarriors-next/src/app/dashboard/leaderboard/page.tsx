import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardRow } from "../../components/LeaderboardRow";
import { leaderboardData } from "../../data/tournament";

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tournament Leaderboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData.map((team) => (
              <LeaderboardRow key={team.rank} {...team} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}