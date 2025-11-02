import { Id } from "../../../convex/_generated/dataModel";

export interface Team {
  id: Id<"teams">;
  team_name: string;
  leader_id: string;
}

