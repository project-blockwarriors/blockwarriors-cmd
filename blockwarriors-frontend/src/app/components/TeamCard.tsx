import { Users } from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TeamCardProps {
  name: string;
  members: string[];
  wins: number;
  losses: number;
}

export function TeamCard({ name, members, wins, losses }: TeamCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">{name}</h3>
        </div>
        <div className="text-sm">
          <span className="text-green-500">{wins}W</span>
          {" - "}
          <span className="text-red-500">{losses}L</span>
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