import { Trophy, Users, User } from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Id } from '@packages/backend/convex/_generated/dataModel';

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
    <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg text-white">{team_name}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm bg-secondary/50 px-3 py-1 rounded-full">
            <span className="text-primary font-medium">{team_wins}W</span>
            <span className="text-muted-foreground mx-1">-</span>
            <span className="text-red-400 font-medium">{team_losses}L</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary">{team_elo}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3 text-primary/50" />
              <span>{member.first_name} {member.last_name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}