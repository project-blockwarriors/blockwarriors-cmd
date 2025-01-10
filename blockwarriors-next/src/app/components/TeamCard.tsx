import { Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TeamCardProps {
  name: string;
  wins: number;
  losses: number;
  elo: number;
  members: string[];
}

export function TeamCard({ name, wins, losses, elo, members }: TeamCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">{name}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-green-500">{wins}W</span>
            {" - "}
            <span className="text-red-500">{losses}L</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Trophy className="h-4 w-4" />
            <span className="font-medium">{elo}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              {member}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}