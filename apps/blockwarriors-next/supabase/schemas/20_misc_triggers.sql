-- Update this file to contain the triggers and grants from prod.sql

-- Auth user trigger
CREATE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- Grant permissions
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

-- Function grants
GRANT ALL ON FUNCTION "public"."delete_expired_records"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_expired_records"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_expired_records"() TO "service_role";

GRANT ALL ON FUNCTION "public"."disband_team"("team_id_param" bigint, "leader_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."disband_team"("team_id_param" bigint, "leader_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."disband_team"("team_id_param" bigint, "leader_id_param" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_all_teams_with_members"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_teams_with_members"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_teams_with_members"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

-- Table grants
GRANT ALL ON TABLE "public"."active_tokens" TO "anon";
GRANT ALL ON TABLE "public"."active_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."active_tokens" TO "service_role";

GRANT ALL ON TABLE "public"."active_tokens2" TO "anon";
GRANT ALL ON TABLE "public"."active_tokens2" TO "authenticated";
GRANT ALL ON TABLE "public"."active_tokens2" TO "service_role";

GRANT ALL ON SEQUENCE "public"."active_tokens2_bot_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."active_tokens2_bot_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."active_tokens2_bot_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."game_teams2" TO "anon";
GRANT ALL ON TABLE "public"."game_teams2" TO "authenticated";
GRANT ALL ON TABLE "public"."game_teams2" TO "service_role";

GRANT ALL ON SEQUENCE "public"."game_teams2_game_team_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."game_teams2_game_team_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."game_teams2_game_team_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";

GRANT ALL ON TABLE "public"."matches2" TO "anon";
GRANT ALL ON TABLE "public"."matches2" TO "authenticated";
GRANT ALL ON TABLE "public"."matches2" TO "service_role";

GRANT ALL ON SEQUENCE "public"."matches2_match_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matches2_match_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matches2_match_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."matches_duplicate" TO "anon";
GRANT ALL ON TABLE "public"."matches_duplicate" TO "authenticated";
GRANT ALL ON TABLE "public"."matches_duplicate" TO "service_role";

GRANT ALL ON SEQUENCE "public"."matches_duplicate_match_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matches_duplicate_match_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matches_duplicate_match_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."matches_match_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matches_match_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matches_match_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";

GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";

GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
