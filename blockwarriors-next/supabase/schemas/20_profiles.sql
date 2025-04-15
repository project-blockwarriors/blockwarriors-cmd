-- Note: In the prod.sql file, there's no separate "profiles" table but rather a "users" table

CREATE TABLE IF NOT EXISTS "public"."users" (
    "user_id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "institution" "text",
    "geographic_location" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "team_id" bigint
);

ALTER TABLE "public"."users" OWNER TO "postgres";

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "users_team_id_idx" ON "public"."users" USING "btree" ("team_id");

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));

-- Moving this policy to 30_users.sql after teams table is created
-- CREATE POLICY "Users can view team members" ON "public"."users" FOR SELECT TO "authenticated" USING ((("team_id" IN ( SELECT "teams"."id"
--    FROM "public"."teams"
--   WHERE ("teams"."leader_id" = "auth"."uid"()))) OR ("user_id" = "auth"."uid"())));
