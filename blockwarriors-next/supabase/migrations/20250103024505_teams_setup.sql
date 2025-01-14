-- Add team_id and team role to users table
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES "public"."teams"("id"),
ADD COLUMN IF NOT EXISTS team_role TEXT CHECK (team_role IN ('leader', 'member'));
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
USING (
    id IN (
        SELECT team_id 
        FROM "public"."users" 
        WHERE user_id = auth.uid() 
        AND team_role = 'leader'
    )
);
CREATE POLICY "Users can create teams"
ON "public"."teams"
FOR INSERT
TO authenticated
WITH CHECK (true);
-- User policies
CREATE POLICY "Users can view team members"
ON "public"."users"
FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id 
        FROM "public"."users" 
        WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
);
CREATE POLICY "Users can update their own profile"
ON "public"."users"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
