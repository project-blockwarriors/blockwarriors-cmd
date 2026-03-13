# BlockWarriors DX Next Steps

## Purpose

This document captures the next execution phases after the initial developer
experience cleanup and the first Beacon deploy automation pass. The goal is to
reduce manual operator work, make `staging` the reliable integration branch, and
remove repo drift that still slows down contributors.

## Delivery Model

- Create feature branches from `staging` using `feat/<name>`.
- Open PRs back into `staging`.
- Let `staging` soak for validation before promoting `staging -> main`.
- Keep secrets in `.env.local` or CI secrets, never in tracked files.

## Current Baseline

The repo now has a healthier default shape:

- root scripts for lint, typecheck, test, build, validate, and Beacon deploy
- root and package env examples
- a CI baseline
- updated onboarding and root docs
- shared Beacon config generation from the shared JSON source
- removal of deprecated Warrior Telemetry

The major remaining gaps are:

- Beacon deploy still starts from a locally built JAR in the common case
- there is no CI-managed deploy path for `staging`
- dependency and security backlog still needs a pass
- backend and Beacon tests are still thin
- `bot-orchestrator` still needs runtime/tooling alignment with the main app
- env validation is documented but not enforced consistently at startup
- formatting is improved but not yet strong enough for a hard repo-wide gate
- build output still has a small amount of non-blocking tooling noise

## Beacon Deploy Flow

### Current Pain

The old workflow required a developer to:

1. build the Beacon shaded JAR locally
2. open `mcpanel.blockwarriors.ai`
3. upload the plugin by hand
4. restart the server manually

That flow is slow, not easily repeatable, and hard to audit.

### Immediate Improvement

The new baseline is:

1. run `npm run deploy:beacon`
2. the script builds or reuses the JAR
3. it uploads or remotely pulls the artifact through the Pterodactyl client API
4. it backs up the previous plugin file
5. it restarts the server and waits for the expected state

This already removes the panel upload UI from the normal path.

### Target End State

The best end state is:

1. GitHub Actions builds the Beacon artifact
2. the artifact is versioned and stored by CI
3. an operator triggers a deploy to `staging`
4. the server pulls the artifact directly
5. the deploy step restarts the server and records the result

That turns "compile locally and upload through the browser" into a tracked,
repeatable deployment operation.

## Recommended Execution Order

### 1. `feat/beacon-deploy-hardening`

Finish the first Beacon deploy slice and validate it against the real staging
server.

Scope:

- confirm the correct server UUID, plugin directory, filename, and restart signal
- validate the backup and replacement behavior on a real server
- improve error messages for permission, path, and power action failures
- add a clearer success summary with the final target path and restart result
- document rollback steps if the new plugin fails after restart

Exit criteria:

- a dry run is accurate
- a real deploy to `staging` works without opening the panel UI
- the operator flow is fully documented

### 2. `feat/beacon-ci-deploy`

Move Beacon deployment off local laptops and into CI.

Scope:

- add a GitHub Actions workflow that builds the Beacon JAR
- store the JAR as a versioned artifact
- add a manual `workflow_dispatch` deploy path for `staging`
- teach the deploy step to use a remote artifact URL by default
- move the panel key and server identifiers into CI secrets

Exit criteria:

- a maintainer can deploy Beacon to `staging` without building locally
- the deploy path is auditable in Actions history

### 3. `feat/security-upgrades`

Clear the dependency backlog next, before more drift accumulates.

Scope:

- run `npm audit` and review GitHub security findings
- prioritize production dependencies first
- upgrade in small batches with validate/build after each batch
- note any upgrade that needs code changes instead of forcing it blindly

Exit criteria:

- the default branch security backlog is materially reduced
- the repo still passes `npm run validate` and `npm run build`

### 4. `feat/backend-beacon-tests`

Add real tests where the repo is still weakest.

Scope:

- replace the placeholder Beacon test with meaningful plugin tests
- add backend route and integration tests that do not depend on a hand-prepared
  live deployment
- make the test commands easy to run from the repo root

Exit criteria:

- Beacon has behavior-level test coverage
- backend tests can run in a predictable local or CI path

### 5. `feat/runtime-alignment`

Reduce drift between the web-facing apps.

Scope:

- align `bot-orchestrator` with the current Next.js and ESLint direction used by
  `blockwarriors-next`
- remove deprecated lint flows and platform-specific scripts
- normalize shared tooling where there is no reason to diverge

Exit criteria:

- root lint and typecheck are less noisy
- contributors do not need app-specific special cases for common tasks

### 6. `feat/env-validation`

Move env correctness from docs into code.

Scope:

- add startup validation for the web app, backend, bot orchestrator, and Beacon
- use one schema-driven pattern per runtime
- fail fast with actionable errors when required values are missing or malformed

Exit criteria:

- missing config is caught at startup instead of surfacing later at runtime

### 7. `feat/formatting-rollout`

Tighten formatting without blocking progress on older untouched files.

Scope:

- keep `format:check` available from the root
- start with touched-file enforcement if full repo formatting is still too noisy
- gradually shrink the formatting backlog before turning it into a hard gate

Exit criteria:

- formatting becomes predictable without creating a giant unrelated diff

### 8. `feat/build-noise-cleanup`

Clean up the remaining non-blocking warnings after the functional work is done.

Scope:

- investigate the `baseline-browser-mapping` warning path
- reduce Maven packaging noise where possible
- suppress only the warnings that are proven to be harmless and unavoidable

Exit criteria:

- validate/build output is quieter and easier to trust

## Operational Notes

- The Pterodactyl API key should stay scoped to the minimum required client
  permissions.
- The panel key and server identifiers should live in `.env.local` for local
  validation and in GitHub Actions secrets for CI deploys.
- The default Beacon deploy target should remain `staging` until the flow is
  proven stable.
- `main` should only receive Beacon deploy changes after the `staging` path is
  routine and low risk.

## Success Definition

This work is successful when a contributor can clone the repo, follow one set of
docs, run one set of root commands, deploy Beacon without opening the panel
browser flow, and trust that `staging` is the place where integrated changes are
validated before promotion to `main`.
