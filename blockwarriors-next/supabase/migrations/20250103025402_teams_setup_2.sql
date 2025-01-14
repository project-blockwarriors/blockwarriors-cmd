-- First drop any existing policies that might use team_role
DROP POLICY IF EXISTS "Team leaders can update their team" ON "public"."teams";
DROP POLICY IF EXISTS "Users can create teams" ON "public"."teams";
DROP POLICY IF EXISTS "Users can view team members" ON "public"."users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can view all teams" ON "public"."teams";
-- Drop the team_role check constraint
ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS users_team_role_check;
-- Now we can safely drop team_role
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS team_role;
-- Add leader_id to teams table
ALTER TABLE "public"."teams"
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES auth.users(id);
-- Add team_id to users table (if not exists)
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS team_id INT REFERENCES "public"."teams"("id");
-- Create index for team lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS users_team_id_idx ON "public"."users"(team_id);
-- Enable RLS
ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
-- Team policies
CREATE POLICY "Users can view all teams"
ON "public"."teams"
FOR SELECT
TO authenticated
USING (true);
CREATE POLICY "Team leaders can update their team"
ON "public"."teams"
FOR UPDATE
TO authenticated
USING (leader_id = auth.uid());
CREATE POLICY "Users can create teams"
ON "public"."teams"
FOR INSERT
TO authenticated
WITH CHECK (leader_id = auth.uid());
-- User policies
CREATE POLICY "Users can view team members"
ON "public"."users"
FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT id 
        FROM "public"."teams" 
        WHERE leader_id = auth.uid()
    )
    OR user_id = auth.uid()
);
CREATE POLICY "Users can update their own profile"
ON "public"."users"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
