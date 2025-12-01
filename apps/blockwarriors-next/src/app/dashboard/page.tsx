import { Trophy, Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './(components)/StatsCard';
import { MatchCard } from './(components)/MatchCard';
import { TournamentProgress } from './(components)/TournamentProgress';
import { featuredMatches } from '../data/tournament';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Dashboard',
  description:
    'Track your BlockWarriors tournament progress, monitor live matches, view your team stats, and compete for the top spot on the leaderboard.',
  path: '/dashboard',
  ogImage: 'dashboard',
  keywords: [
    'BlockWarriors dashboard',
    'AI tournament progress',
    'Minecraft bot stats',
    'team standings',
    'match history',
    'ELO rating',
    'tournament tracker',
  ],
});

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Live Tournament
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-primary bg-clip-text text-transparent">
            Tournament Overview
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Track your progress, monitor matches, and compete for the top spot
            on the leaderboard.
          </p>
        </div>
      </div>

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

      <Card className="border-primary/10">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <CardTitle className="text-xl">Featured Matches</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
