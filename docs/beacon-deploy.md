# Beacon Deploy Guide

Beacon deploy automation removes the manual "build a JAR, open the panel, upload,
restart" loop for staging servers.

## What It Does

`npm run deploy:beacon` can:

- build the shaded Beacon JAR locally
- back up the currently deployed plugin JAR in the target plugin directory
- upload the new JAR to a Pterodactyl-managed server
- optionally pull a remote artifact URL instead of uploading a local file
- restart the server and wait for the expected power state

## Required Configuration

Copy the root example env file if you have not already:

```bash
cp .env.example .env.local
```

Set these values in `.env.local` or your shell environment:

- `PTERODACTYL_PANEL_URL`
- `PTERODACTYL_API_KEY`
- `PTERODACTYL_SERVER_UUID` or `PTERODACTYL_SERVER_NAME` (resolved by name)
- `PTERODACTYL_PLUGIN_DIRECTORY` (default: `/plugins`)
- `PTERODACTYL_PLUGIN_FILENAME` (default: `beacon.jar`)
- `PTERODACTYL_RESTART_SIGNAL` (default: `restart`)

Optional values:

- `PTERODACTYL_BACKUP_EXISTING_PLUGIN=true`
- `BEACON_JAR_PATH=apps/blockwarriors-beacon/target/beacon-0.0.1.jar`
- `BEACON_DEPLOY_ARTIFACT_URL=https://example.com/beacon.jar`

## Required Panel Permissions

The Pterodactyl client API key needs enough scope for the operations you choose:

- `file.read`
- `file.create`
- `file.update`
- `control.restart`

If you use a different power signal, the matching control permission is required.

## Finding Your Server

Each developer has their own "Fast Dev" server on the panel. To see which
servers are available to your API key:

```bash
npm run deploy:beacon -- --list-servers
```

Then set `PTERODACTYL_SERVER_NAME` in your `.env.local` to target your server by
name instead of UUID:

```
PTERODACTYL_SERVER_NAME=Fast Dev - YourName
```

If the name is ambiguous (matches multiple servers), the script will list the
matches and ask you to be more specific.

## Commands

Build, upload, and restart:

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

## Notes

- The script targets the Pterodactyl client API, not a browser session.
- Existing plugin files are backed up with a timestamp suffix before replacement
  unless you pass `--no-backup`.
- The default target filename is `beacon.jar` so the deployed file stays stable
  even if the built artifact name changes.
