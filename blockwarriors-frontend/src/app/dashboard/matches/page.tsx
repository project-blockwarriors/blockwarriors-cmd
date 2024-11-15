import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "../../components/MatchCard";
import { upcomingMatches } from "../../data/tournament";

export default function MatchesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tournament Matches</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingMatches.map((match, i) => (
              <MatchCard key={i} {...match} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}