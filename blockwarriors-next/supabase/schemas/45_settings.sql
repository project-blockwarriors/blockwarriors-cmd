-- Settings table schema
CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "start_tournament" boolean DEFAULT false NOT NULL,
    "show_banner" boolean DEFAULT false NOT NULL,
    "banner_text_content" "text",
    "banner_button_content" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."settings" OWNER TO "postgres";

-- Primary key
ALTER TABLE ONLY "public"."settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");

-- Comments
COMMENT ON TABLE "public"."settings" IS 'Global application settings';
COMMENT ON COLUMN "public"."settings"."start_tournament" IS 'Flag to control tournament start';
COMMENT ON COLUMN "public"."settings"."show_banner" IS 'Flag to show site-wide banner';
COMMENT ON COLUMN "public"."settings"."banner_text_content" IS 'Content for the site-wide banner';
COMMENT ON COLUMN "public"."settings"."banner_button_content" IS 'Button text for the site-wide banner';

-- Enable RLS
ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated roles
GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";
