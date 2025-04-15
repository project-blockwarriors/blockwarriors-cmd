-- Change this file to contain teams table since users are now defined in 20_profiles.sql

CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" integer NOT NULL,
    "team_name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "leader_id" "uuid",
    "team_elo" integer DEFAULT 0 NOT NULL,
    "team_wins" integer DEFAULT 0 NOT NULL,
    "team_losses" integer DEFAULT 0 NOT NULL,
    "time_zone" "text"
);

ALTER TABLE "public"."teams" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."teams_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."teams_id_seq" OWNED BY "public"."teams"."id";

ALTER TABLE ONLY "public"."teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teams_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."teams" ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."teams" ADD CONSTRAINT "teams_team_name_key" UNIQUE ("team_name");

ALTER TABLE ONLY "public"."teams" ADD CONSTRAINT "teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "auth"."users"("id");

-- This constraint is added after the teams table exists
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");

ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team leaders can update their team" ON "public"."teams" FOR UPDATE TO "authenticated" USING (("leader_id" = "auth"."uid"()));

CREATE POLICY "Users can create teams" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (("leader_id" = "auth"."uid"()));

CREATE POLICY "Users can view all teams" ON "public"."teams" FOR SELECT TO "authenticated" USING (true);

-- Now that teams table exists, we can add the policy for users that references teams
CREATE POLICY "Users can view team members" ON "public"."users" FOR SELECT TO "authenticated" USING ((("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."leader_id" = "auth"."uid"()))) OR ("user_id" = "auth"."uid"())));
