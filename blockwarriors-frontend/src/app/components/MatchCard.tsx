import { Sword } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  team1: string;
  team2: string;
  time: string;
  score?: string;
  map?: string;
}

export function MatchCard({ team1, team2, time, score, map }: MatchCardProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
      <div className="flex items-center gap-4">
        <Sword className="h-5 w-5" />
        <div>
          <p className="font-semibold">{team1}</p>
          <div className="text-sm text-muted-foreground">
            vs {team2}
            {map && <div>Map: {map}</div>}
          </div>
        </div>
      </div>
      <div className="text-right">
        {score ? (
          <>
            <p className="font-bold">{score}</p>
            <p className="text-sm text-muted-foreground">{time}</p>
          </>
        ) : (
          <div className="font-bold">
            <Badge>{time}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}