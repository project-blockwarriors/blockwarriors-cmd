-- Users table
CREATE TABLE IF NOT EXISTS "public"."users" (
    "user_id" uuid NOT NULL,
    "first_name" text,
    "last_name" text,
    "email" text,
    "institution" text,
    "geographic_location" text,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "team_id" bigint
);

ALTER TABLE "public"."users" OWNER TO "postgres";

-- Comments
COMMENT ON TABLE "public"."users" IS 'User profiles for the application';
COMMENT ON COLUMN "public"."users"."user_id" IS 'References auth.users.id';
COMMENT ON COLUMN "public"."users"."team_id" IS 'Team that the user belongs to';

-- Primary key and constraints
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX "users_team_id_idx" ON "public"."users" USING "btree" ("team_id");

-- Enable RLS
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON "public"."users" 
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON "public"."users" 
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());

-- Grant access 
GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
