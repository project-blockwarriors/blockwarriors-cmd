# Beacon Deploy Guide

Beacon deploy automation removes the manual "build a JAR, open the panel, upload,
restart" loop for development servers.

## What It Does

`npm run deploy:beacon` can:

- build the shaded Beacon JAR locally
- back up the currently deployed plugin JAR in the target plugin directory
- upload the new JAR to a Pterodactyl-managed server
- sync the Beacon `config.yml` with your Convex deployment URL and secret
- optionally pull a remote artifact URL instead of uploading a local file
- restart the server and wait for the expected power state

## Setup

### 1. Get a Pterodactyl Client API Key

1. Log in to the panel at `https://mcpanel.blockwarriors.ai`
2. Click your avatar in the top-right corner and go to **Account Settings**
3. Under **API Credentials**, create a new API key
4. The key will start with `ptlc_` — this is a **client** key (not `ptla_`, which
   is an application/admin key and will not work with this script)

### 2. Get the Convex settings

The Beacon plugin connects to the Convex backend. You need:

- **`CONVEX_SITE_URL`** — the Convex site URL for the deployment (e.g.,
  `https://abundant-ferret-667.convex.site`). Check with your team or look in
  `packages/backend/.env.local` if you already have it set up.
- **`CONVEX_HTTP_SECRET`** — the shared secret for server-to-server auth. This
  must match the `CONVEX_HTTP_SECRET` env var set in your Convex deployment. Ask
  your team lead if you don't have it.

### 3. Create your `.env.local`

```bash
cp .env.example .env.local
```

Fill in your values:

```
PTERODACTYL_PANEL_URL=https://mcpanel.blockwarriors.ai
PTERODACTYL_API_KEY=ptlc_your_client_api_key
PTERODACTYL_SERVER_NAME=Fast Dev - YourName
CONVEX_SITE_URL=https://abundant-ferret-667.convex.site
CONVEX_HTTP_SECRET=your-convex-http-secret
```

### 4. Find your server

Each developer has their own "Fast Dev" server on the panel. To see which
servers are available to your API key:

```bash
npm run deploy:beacon -- --list-servers
```

Set `PTERODACTYL_SERVER_NAME` in your `.env.local` to match your server name
exactly. If the name is ambiguous (matches multiple servers), the script will
list the matches and ask you to be more specific.

## Required Panel Permissions

The Pterodactyl client API key needs enough scope for the operations you choose:

- `file.read`
- `file.create`
- `file.update`
- `control.restart`

If you use a different power signal, the matching control permission is required.

## Commands

Build, upload, sync config, and restart:

```bash
npm run deploy:beacon
```

Preview the flow without changing the server:

```bash
npm run deploy:beacon:dry-run
```

Deploy an already-built local JAR:

```bash
npm run deploy:beacon -- --skip-build --jar-path apps/blockwarriors-beacon/target/beacon-0.0.1.jar
```

Tell the server to pull a remote artifact instead of uploading from your machine:

```bash
npm run deploy:beacon -- --artifact-url https://example.com/beacon.jar
```

## Config Sync

If `CONVEX_SITE_URL` or `CONVEX_HTTP_SECRET` are set in your environment, the
deploy script will write the Beacon plugin's `config.yml` on the server after
uploading the JAR and before restarting. This ensures the plugin connects to the
correct Convex deployment without needing to edit the file on the panel manually.

If neither variable is set, the config sync step is skipped and the existing
`config.yml` on the server is left unchanged.

## Additional Options

| Flag | Purpose |
|------|---------|
| `--dry-run` | Print the plan without touching the server |
| `--skip-build` | Reuse an already-built local JAR |
| `--skip-restart` | Upload only, don't restart |
| `--no-backup` | Skip the backup rename step |
| `--jar-path PATH` | Override which local JAR to upload |
| `--artifact-url URL` | Tell the server to pull a remote URL instead of uploading |
| `--server UUID` | Target a server by UUID directly |
| `--server-name NAME` | Resolve a server by name instead of UUID |
| `--list-servers` | List all servers available to your API key |

## Notes

- The script targets the Pterodactyl client API, not a browser session.
- Existing plugin files are backed up with a timestamp suffix before replacement
  unless you pass `--no-backup`.
- The default target filename is `beacon.jar` so the deployed file stays stable
  even if the built artifact name changes.
