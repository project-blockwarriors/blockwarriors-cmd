# `@packages/backend`

Convex backend for BlockWarriors.

## What Lives Here

- `convex/schema.ts`: data model
- `convex/http.ts`: HTTP routes used by Beacon and server actions
- `convex/auth.ts`: Better Auth integration
- `convex/*.ts`: queries, mutations, internal helpers, seeds

## Useful Commands

```bash
npm run dev --workspace @packages/backend
npm run codegen --workspace @packages/backend
npm run typecheck --workspace @packages/backend
npm run test:http --workspace @packages/backend
```

## Environment Notes

- Local HTTP route tests read `packages/backend/.env.local`
- Convex runtime secrets must be configured with `convex env set`
