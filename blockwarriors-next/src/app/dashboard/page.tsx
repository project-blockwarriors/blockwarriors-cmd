import { Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './(components)/StatsCard';
import { MatchCard } from './(components)/MatchCard';
import { TournamentProgress } from './(components)/TournamentProgress';
import { featuredMatches } from '../data/tournament';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tournament Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Players"
          value={128}
          subtitle="32 teams of 4 players"
          icon={Users}
        />
        <StatsCard
          title="Prize Pool"
          value="$10,000"
          subtitle="Split among top 3 teams"
          icon={Trophy}
        />
        <TournamentProgress />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Featured Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featuredMatches.map((match, i) => (
              <MatchCard key={i} {...match} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
