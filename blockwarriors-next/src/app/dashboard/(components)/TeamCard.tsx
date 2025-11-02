import { Users } from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Id } from '../../../../../convex/_generated/dataModel';

interface TeamCardProps {
  id: Id<"teams">;
  team_name: string;
  leader_id: string;
  members: { first_name: string; last_name: string; }[];
}

export function TeamCard({ 
  team_name,
  members,
}: TeamCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">{team_name}</h3>
        </div>
        {/* TODO: Add elo/wins/losses display when implemented */}
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