-- Tokens table
CREATE TABLE IF NOT EXISTS "public"."tokens" (
    "token_id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "token" uuid DEFAULT extensions.uuid_generate_v4(),
    "user_id" uuid,
    "match_id" bigint,
    "game_team_id" bigint,
    "bot_id" integer,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "expires_at" timestamp with time zone DEFAULT (now() + '00:15:00'::interval),
    "is_active" boolean DEFAULT true
);

ALTER TABLE "public"."tokens" OWNER TO "postgres";

-- Comments
COMMENT ON TABLE "public"."tokens" IS 'Unified tokens table that replaces active_tokens, active_tokens2, and blockwarriors_tokens';
COMMENT ON COLUMN "public"."tokens"."token" IS 'Actual token value';
COMMENT ON COLUMN "public"."tokens"."user_id" IS 'User associated with this token';
COMMENT ON COLUMN "public"."tokens"."match_id" IS 'Match associated with this token';
COMMENT ON COLUMN "public"."tokens"."is_active" IS 'Whether the token is currently active';

-- Primary key
ALTER TABLE ONLY "public"."tokens" ADD CONSTRAINT "tokens_pkey" PRIMARY KEY ("token_id");

-- Foreign key constraints
ALTER TABLE ONLY "public"."tokens" ADD CONSTRAINT "tokens_game_team_id_fkey" FOREIGN KEY ("game_team_id") REFERENCES "public"."game_teams"("game_team_id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."tokens" ADD CONSTRAINT "tokens_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;

-- Function to automatically handle expired tokens
CREATE OR REPLACE FUNCTION "public"."delete_expired_tokens"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  UPDATE public.tokens SET is_active = false WHERE expires_at < now();
  return new;
end;
$$;

-- Create a trigger to run this function periodically
DROP TRIGGER IF EXISTS delete_expired_tokens_trigger ON public.tokens;
CREATE TRIGGER delete_expired_tokens_trigger
AFTER INSERT ON public.tokens
EXECUTE FUNCTION public.delete_expired_tokens();

-- Enable RLS
ALTER TABLE "public"."tokens" ENABLE ROW LEVEL SECURITY;

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

-- Grant access to anon and authenticated roles
GRANT ALL ON TABLE "public"."tokens" TO "anon";
GRANT ALL ON TABLE "public"."tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."tokens" TO "service_role";
