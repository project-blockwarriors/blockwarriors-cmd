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
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-primary/10 hover:border-primary/30 hover:bg-secondary/70 transition-all">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sword className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-white">{team1}</p>
          <div className="text-sm text-muted-foreground">
            vs <span className="text-white/80">{team2}</span>
            {map && <span className="ml-2 text-primary/70">• {map}</span>}
          </div>
        </div>
      </div>
      <div className="text-right">
        {score ? (
          <>
            <p className="font-bold text-primary text-lg">{score}</p>
            <p className="text-sm text-muted-foreground">{time}</p>
          </>
        ) : (
          <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
            {time}
          </Badge>
        )}
      </div>
    </div>
  );
}