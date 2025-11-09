import { Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Id } from '@packages/backend/_generated/dataModel';

interface TeamCardProps {
  id: Id<'teams'>;
  team_name: string;
  leader_id: string;
  members: { first_name: string; last_name: string; }[];
  team_elo: number;
  team_wins: number;
  team_losses: number;
}

export function TeamCard({ 
  team_name,
  members,
  team_elo,
  team_wins,
  team_losses 
}: TeamCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">{team_name}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-green-500">{team_wins}W</span>
            {" - "}
            <span className="text-red-500">{team_losses}L</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Trophy className="h-4 w-4" />
            <span className="font-medium">{team_elo}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              {member.first_name} {member.last_name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}