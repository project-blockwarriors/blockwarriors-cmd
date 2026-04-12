# Convex Function Layout

Key files in this directory:

- `auth.ts`: Better Auth setup and auth helpers
- `auth.config.ts`: provider config consumed by Better Auth
- `schema.ts`: Convex tables and indexes
- `http.ts`: HTTP routes shared by the web app and Beacon
- `matches.ts`, `teams.ts`, `userProfiles.ts`, `tournaments.ts`, `tournamentMatches.ts`: feature modules
- `seed.ts`: manual internal seed helpers

Keep HTTP response shapes and shared game config aligned with the consumers in:

- `apps/blockwarriors-next`
- `apps/blockwarriors-beacon`
- `packages/shared`
