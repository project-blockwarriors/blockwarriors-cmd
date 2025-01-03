import { Team } from './team';

export interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  institution: string | null;
  geographic_location: string | null;
  team: Team | null;
}
