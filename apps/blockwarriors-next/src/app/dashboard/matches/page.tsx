import { Calendar, Sword } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard } from '../(components)/MatchCard';
import { upcomingMatches } from '../../data/tournament';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Matches',
  description:
    'View all BlockWarriors tournament matches - upcoming, live, and completed AI bot battles. Watch real-time PvP combat between intelligent Minecraft bots.',
  keywords: [
    'BlockWarriors matches',
    'AI bot battles',
    'tournament schedule',
    'live matches',
    'Minecraft PvP',
    'bot combat',
    'match results',
    'upcoming matches',
  ],
  openGraph: {
    title: 'Tournament Matches | BlockWarriors',
    description:
      'View upcoming, live, and completed AI Minecraft tournament matches.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tournament Matches | BlockWarriors',
    description:
      'View upcoming, live, and completed AI Minecraft tournament matches.',
  },
};

export default function MatchesPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Tournament Matches
            </h1>
          </div>
          <p className="text-muted-foreground">
            <span className="text-primary font-medium">
              {upcomingMatches.length}
            </span>{' '}
            matches scheduled
          </p>
        </div>
      </div>

      <Card className="border-primary/10">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Upcoming Matches</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming matches scheduled
              </div>
            ) : (
              upcomingMatches.map((match, i) => (
                <MatchCard key={i} {...match} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
