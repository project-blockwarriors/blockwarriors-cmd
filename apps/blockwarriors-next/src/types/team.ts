import { Id } from '@packages/backend/convex/_generated/dataModel';

export interface Team {
  id: Id<'teams'>;
  team_name: string;
  leader_id: string;
  team_elo: number;
  team_wins: number;
  team_losses: number;
}

export interface TeamMember {
  first_name: string;
  last_name: string;
  user_id: string;
}

export interface TeamWithUsers extends Team {
  members: TeamMember[];
}
