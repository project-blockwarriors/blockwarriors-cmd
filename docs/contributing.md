# Contributing to BlockWarriors

## Branching Model

- Create feature branches from `staging`
- Open feature PRs into `staging`
- Use a separate release PR to merge `staging` into `main`

Suggested branch format:

- `{first name initial}{lastname}-{feature}`
- `codex-dx-streamline`

## Local Checklist

Before opening a PR, run:

```bash
npm run validate
```

Run these separately if your change touches a specific runtime:

```bash
npm run build:web
npm run build:bot-orchestrator
npm run build:beacon
npm run test:http
```

## Pull Requests

- Keep PRs scoped to one change set when possible
- Target `staging` unless you are doing a release promotion
- Include operational context when changing env vars, auth, Convex routes, or Minecraft plugin behavior

## Commit Messages

Use clear conventional messages:

- `feat: add tournament bracket filters`
- `fix: handle missing convex auth token`
- `chore: remove deprecated package`
- `docs: rewrite onboarding guide`

## Cross-Runtime Changes

If you change shared game configuration:

1. Update `packages/shared/constants/game-config.json`
2. Run `npm run codegen:beacon`
3. Include the regenerated Beacon constants in the same PR
