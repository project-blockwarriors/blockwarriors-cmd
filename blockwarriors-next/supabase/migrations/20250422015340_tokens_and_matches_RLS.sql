-- RLS Policies
-- Allow authenticated users to view all tokens
CREATE POLICY "Users can view all tokens" ON "public"."tokens"
FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow authenticated users to insert new tokens
CREATE POLICY "Users can create new tokens" ON "public"."tokens"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow authenticated users to update tokens they created
CREATE POLICY "Users can update tokens" ON "public"."tokens"
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow authenticated users to delete tokens they created
CREATE POLICY "Users can delete tokens" ON "public"."tokens"
FOR DELETE
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- RLS Policies
-- Allow authenticated users to view all matches
CREATE POLICY "Users can view all matches" ON "public"."matches"
FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow authenticated users to insert new matches
CREATE POLICY "Users can create new matches" ON "public"."matches"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow authenticated users to update matches they created
CREATE POLICY "Users can update matches" ON "public"."matches"
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow authenticated users to delete matches they created
CREATE POLICY "Users can delete matches" ON "public"."matches"
FOR DELETE
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');