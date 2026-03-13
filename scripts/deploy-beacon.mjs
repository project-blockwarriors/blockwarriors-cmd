#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const defaultPluginDirectory = '/plugins';
const defaultPluginFilename = 'beacon.jar';
const defaultRestartSignal = 'restart';
const resourcePollIntervalMs = 10000;
const resourcePollTimeoutMs = 180000;
const allowedRestartSignals = new Set(['start', 'stop', 'restart', 'kill']);

try {
  await main();
} catch (error) {
  console.error(`Beacon deploy failed: ${error.message}`);
  process.exitCode = 1;
}

async function main() {
  loadEnvFiles();

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.listServers) {
    await listServers();
    return;
  }

  const config = await resolveConfig(args);

  if (config.serverName && !config.serverUuid) {
    config.serverUuid = await resolveServerByName(config);
  }

  validateConfig(config);

  if (config.mode === 'upload' && !config.skipBuild) {
    logStep('Building Beacon JAR');
    await runCommand(getNpmCommand(), ['run', 'build:beacon']);
  }

  if (config.mode === 'upload') {
    config.jarPath = await resolveJarPath(config.jarPath);
  }

  const backupName = `${config.pluginFilename}.bak-${timestampSuffix()}`;

  printSummary(config, backupName);
  if (config.dryRun) {
    return;
  }

  const client = createPterodactylClient(config);

  const existingPlugin = await findPluginFile(client, config);
  if (existingPlugin && config.backupExistingPlugin) {
    logStep(`Backing up existing plugin to ${backupName}`);
    await client.renameFile(
      config.pluginDirectory,
      config.pluginFilename,
      backupName
    );
  }

  if (config.mode === 'upload') {
    logStep(
      `Uploading ${path.basename(config.jarPath)} as ${config.pluginFilename}`
    );
    await client.uploadFile(config, config.jarPath);
  } else {
    logStep(`Pulling artifact ${config.artifactUrl}`);
    await client.pullFile(config);
  }

  if (config.convexSiteUrl || config.convexHttpSecret) {
    logStep('Syncing Beacon config.yml with Convex settings');
    const configYml = buildBeaconConfigYml(config);
    await client.writeFile('/plugins/beacon/config.yml', configYml);
  }

  if (!config.skipRestart) {
    logStep(`Sending power signal: ${config.restartSignal}`);
    await client.sendPowerSignal(config.restartSignal);

    const expectedState = expectedStateForSignal(config.restartSignal);
    if (expectedState) {
      logStep(`Waiting for server state: ${expectedState}`);
      await client.waitForState(expectedState);
    }
  }

  console.log('Beacon deploy completed.');
}

function loadEnvFiles() {
  for (const relativePath of ['.env', '.env.local']) {
    const filePath = path.join(repoRoot, relativePath);
    try {
      applyEnv(readFileSync(filePath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

function applyEnv(contents) {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    skipBuild: false,
    skipRestart: false,
    backupExistingPlugin: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--skip-build':
        args.skipBuild = true;
        break;
      case '--skip-restart':
        args.skipRestart = true;
        break;
      case '--no-backup':
        args.backupExistingPlugin = false;
        break;
      case '--artifact-url':
        args.artifactUrl = readArgValue(argv, ++index, arg);
        break;
      case '--jar-path':
        args.jarPath = readArgValue(argv, ++index, arg);
        break;
      case '--panel-url':
        args.panelUrl = readArgValue(argv, ++index, arg);
        break;
      case '--api-key':
        args.apiKey = readArgValue(argv, ++index, arg);
        break;
      case '--server':
        args.serverUuid = readArgValue(argv, ++index, arg);
        break;
      case '--server-name':
        args.serverName = readArgValue(argv, ++index, arg);
        break;
      case '--list-servers':
        args.listServers = true;
        break;
      case '--directory':
        args.pluginDirectory = readArgValue(argv, ++index, arg);
        break;
      case '--filename':
        args.pluginFilename = readArgValue(argv, ++index, arg);
        break;
      case '--restart-signal':
        args.restartSignal = readArgValue(argv, ++index, arg);
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function readArgValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

async function resolveConfig(args) {
  const artifactUrl =
    args.artifactUrl ?? process.env.BEACON_DEPLOY_ARTIFACT_URL;
  const jarPath =
    args.jarPath ?? process.env.BEACON_JAR_PATH ?? (await getDefaultJarPath());

  return {
    apiKey: args.apiKey ?? process.env.PTERODACTYL_API_KEY,
    artifactUrl,
    backupExistingPlugin:
      args.backupExistingPlugin ??
      parseBoolean(process.env.PTERODACTYL_BACKUP_EXISTING_PLUGIN, true),
    dryRun: args.dryRun,
    jarPath,
    mode: artifactUrl ? 'pull' : 'upload',
    panelUrl: stripTrailingSlash(
      args.panelUrl ?? process.env.PTERODACTYL_PANEL_URL ?? ''
    ),
    pluginDirectory: normalizeRemotePath(
      args.pluginDirectory ??
        process.env.PTERODACTYL_PLUGIN_DIRECTORY ??
        defaultPluginDirectory
    ),
    pluginFilename:
      args.pluginFilename ??
      process.env.PTERODACTYL_PLUGIN_FILENAME ??
      defaultPluginFilename,
    restartSignal:
      args.restartSignal ??
      process.env.PTERODACTYL_RESTART_SIGNAL ??
      defaultRestartSignal,
    convexSiteUrl: process.env.CONVEX_SITE_URL,
    convexHttpSecret: process.env.CONVEX_HTTP_SECRET,
    serverName:
      args.serverName ?? process.env.PTERODACTYL_SERVER_NAME,
    serverUuid: args.serverUuid ?? process.env.PTERODACTYL_SERVER_UUID,
    skipBuild: args.skipBuild || Boolean(artifactUrl),
    skipRestart: args.skipRestart,
  };
}

function validateConfig(config) {
  const missing = [];

  if (!config.panelUrl) {
    missing.push('PTERODACTYL_PANEL_URL');
  }
  if (!config.apiKey) {
    missing.push('PTERODACTYL_API_KEY');
  }
  if (!config.serverUuid) {
    missing.push('PTERODACTYL_SERVER_UUID');
  }
  if (!config.pluginFilename) {
    missing.push('PTERODACTYL_PLUGIN_FILENAME');
  }
  if (config.mode === 'pull' && !config.artifactUrl) {
    missing.push('BEACON_DEPLOY_ARTIFACT_URL');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required deploy config: ${missing.join(', ')}`);
  }

  if (config.pluginFilename.includes('/')) {
    throw new Error('Plugin filename must be a file name, not a path.');
  }

  if (!allowedRestartSignals.has(config.restartSignal)) {
    throw new Error(
      `Invalid restart signal "${config.restartSignal}". Expected one of: ${Array.from(
        allowedRestartSignals
      ).join(', ')}`
    );
  }
}

async function getDefaultJarPath() {
  const pomPath = path.join(
    repoRoot,
    'apps',
    'blockwarriors-beacon',
    'pom.xml'
  );
  const pomContents = await fs.readFile(pomPath, 'utf8');
  const projectHeader = pomContents.split('<dependencies>')[0];

  const artifactId = projectHeader.match(
    /<artifactId>([^<]+)<\/artifactId>/
  )?.[1];
  const version = projectHeader.match(/<version>([^<]+)<\/version>/)?.[1];

  if (!artifactId || !version) {
    return path.join(
      repoRoot,
      'apps',
      'blockwarriors-beacon',
      'target',
      'beacon-0.0.1.jar'
    );
  }

  return path.join(
    repoRoot,
    'apps',
    'blockwarriors-beacon',
    'target',
    `${artifactId}-${version}.jar`
  );
}

async function resolveJarPath(requestedJarPath) {
  if (requestedJarPath) {
    const absolutePath = path.resolve(repoRoot, requestedJarPath);
    await fs.access(absolutePath);
    return absolutePath;
  }

  const targetDir = path.join(
    repoRoot,
    'apps',
    'blockwarriors-beacon',
    'target'
  );
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.jar'))
    .filter((entry) => !entry.name.startsWith('original-'))
    .map((entry) => path.join(targetDir, entry.name));

  if (candidates.length === 0) {
    throw new Error(
      'No Beacon JAR was found in apps/blockwarriors-beacon/target. Run npm run build:beacon first.'
    );
  }

  const candidatesWithStats = await Promise.all(
    candidates.map(async (candidate) => ({
      candidate,
      stats: await fs.stat(candidate),
    }))
  );

  candidatesWithStats.sort(
    (left, right) => right.stats.mtimeMs - left.stats.mtimeMs
  );
  return candidatesWithStats[0].candidate;
}

function printSummary(config, backupName) {
  console.log('Beacon deploy plan');
  console.log(`- mode: ${config.mode}`);
  console.log(`- panel: ${config.panelUrl}`);
  console.log(`- server: ${config.serverUuid}${config.serverName ? ` (${config.serverName})` : ''}`);
  console.log(`- directory: ${config.pluginDirectory}`);
  console.log(`- filename: ${config.pluginFilename}`);
  console.log(`- backup existing plugin: ${config.backupExistingPlugin}`);
  console.log(`- backup filename: ${backupName}`);
  console.log(`- restart: ${!config.skipRestart}`);
  if (!config.skipRestart) {
    console.log(`- restart signal: ${config.restartSignal}`);
  }
  if (config.mode === 'upload') {
    console.log(`- local jar: ${config.jarPath}`);
    console.log(`- build before deploy: ${!config.skipBuild}`);
  } else {
    console.log(`- artifact url: ${config.artifactUrl}`);
  }
  if (config.convexSiteUrl) {
    console.log(`- convex site url: ${config.convexSiteUrl}`);
  }
  if (config.convexHttpSecret) {
    console.log(`- convex http secret: ${'*'.repeat(8)}...`);
  }
  if (config.dryRun) {
    console.log('- dry run: true');
  }
}

function createPterodactylClient(config) {
  return {
    async directoryEntries(directory) {
      const payload = await requestJson(
        config,
        'GET',
        `/api/client/servers/${config.serverUuid}/files/list?directory=${encodeURIComponent(directory)}`
      );
      return Array.isArray(payload.data)
        ? payload.data.map((entry) => entry.attributes ?? entry)
        : [];
    },

    async renameFile(directory, from, to) {
      await request(
        config,
        'PUT',
        `/api/client/servers/${config.serverUuid}/files/rename`,
        {
          root: directory,
          files: [{ from, to }],
        }
      );
    },

    async uploadFile(deployConfig, localJarPath) {
      const payload = await requestJson(
        deployConfig,
        'GET',
        `/api/client/servers/${deployConfig.serverUuid}/files/upload`
      );
      const uploadUrl = payload.attributes?.url;
      if (!uploadUrl) {
        throw new Error('Panel did not return a signed upload URL.');
      }

      const buffer = await fs.readFile(localJarPath);
      const form = new FormData();
      form.append(
        'files',
        new Blob([buffer], { type: 'application/java-archive' }),
        deployConfig.pluginFilename
      );

      const url = new URL(uploadUrl);
      url.searchParams.set('directory', deployConfig.pluginDirectory);

      const response = await fetch(url, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error(await formatResponseError(response));
      }
    },

    async writeFile(remotePath, contents) {
      const url = new URL(
        `/api/client/servers/${config.serverUuid}/files/write`,
        config.panelUrl
      );
      url.searchParams.set('file', remotePath);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.pterodactyl.v1+json',
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'text/plain',
        },
        body: contents,
      });

      if (!response.ok) {
        throw new Error(await formatResponseError(response));
      }
    },

    async pullFile(deployConfig) {
      await request(
        deployConfig,
        'POST',
        `/api/client/servers/${deployConfig.serverUuid}/files/pull`,
        {
          directory: deployConfig.pluginDirectory,
          filename: deployConfig.pluginFilename,
          foreground: true,
          url: deployConfig.artifactUrl,
        }
      );
    },

    async sendPowerSignal(signal) {
      await request(
        config,
        'POST',
        `/api/client/servers/${config.serverUuid}/power`,
        {
          signal,
        }
      );
    },

    async waitForState(expectedState) {
      const deadline = Date.now() + resourcePollTimeoutMs;

      while (Date.now() < deadline) {
        const payload = await requestJson(
          config,
          'GET',
          `/api/client/servers/${config.serverUuid}/resources`
        );
        const currentState = payload.attributes?.current_state;
        if (currentState === expectedState) {
          return;
        }

        await sleep(resourcePollIntervalMs);
      }

      throw new Error(`Timed out waiting for server state "${expectedState}".`);
    },
  };
}

function buildBeaconConfigYml(config) {
  const siteUrl = config.convexSiteUrl || 'https://your-deployment.convex.site';
  const secret = config.convexHttpSecret || 'your-secret-here';

  return `# Convex Backend Configuration
# These settings configure the connection between the beacon plugin and Convex backend

# The Convex site URL for HTTP API calls
convex-site-url: '${siteUrl}'

# The shared secret for server-to-server authentication
# Generate with: openssl rand -base64 32
# Must match the CONVEX_HTTP_SECRET environment variable set in Convex
convex-http-secret: '${secret}'
`;
}

async function fetchAllServers(config) {
  const servers = [];
  let page = 1;

  while (true) {
    const payload = await requestJson(
      config,
      'GET',
      `/api/client?page=${page}`
    );
    const entries = Array.isArray(payload.data) ? payload.data : [];
    if (entries.length === 0) {
      break;
    }

    for (const entry of entries) {
      const attrs = entry.attributes ?? entry;
      const alloc =
        attrs.relationships?.allocations?.data?.[0]?.attributes ?? {};
      servers.push({
        identifier: attrs.identifier,
        uuid: attrs.uuid,
        name: attrs.name,
        description: attrs.description ?? '',
        port: alloc.port ?? '',
        ip: alloc.ip_alias ?? alloc.ip ?? '',
      });
    }

    const meta = payload.meta?.pagination;
    if (!meta || page >= meta.total_pages) {
      break;
    }
    page += 1;
  }

  return servers;
}

async function listServers() {
  const panelUrl = stripTrailingSlash(
    process.env.PTERODACTYL_PANEL_URL ?? ''
  );
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!panelUrl || !apiKey) {
    throw new Error(
      'PTERODACTYL_PANEL_URL and PTERODACTYL_API_KEY are required to list servers.'
    );
  }

  const servers = await fetchAllServers({ panelUrl, apiKey });

  if (servers.length === 0) {
    console.log('No servers found for this API key.');
    return;
  }

  console.log('Available servers:\n');
  const idW = 10;
  const nameW = Math.max(4, ...servers.map((s) => s.name.length)) + 2;

  console.log(
    'ID'.padEnd(idW) +
      'Name'.padEnd(nameW) +
      'Address'.padEnd(30) +
      'Description'
  );
  console.log('-'.repeat(idW + nameW + 30 + 20));

  for (const s of servers) {
    const addr = s.port ? `${s.ip}:${s.port}` : s.ip;
    console.log(
      s.identifier.padEnd(idW) +
        s.name.padEnd(nameW) +
        addr.padEnd(30) +
        s.description
    );
  }

  console.log(
    '\nUse --server-name "Server Name" or set PTERODACTYL_SERVER_NAME in .env.local'
  );
}

async function resolveServerByName(config) {
  const servers = await fetchAllServers(config);
  const needle = config.serverName.toLowerCase();

  const exact = servers.find((s) => s.name.toLowerCase() === needle);
  if (exact) {
    logStep(`Resolved server "${exact.name}" → ${exact.identifier}`);
    return exact.identifier;
  }

  const partial = servers.filter((s) =>
    s.name.toLowerCase().includes(needle)
  );

  if (partial.length === 1) {
    logStep(`Resolved server "${partial[0].name}" → ${partial[0].identifier}`);
    return partial[0].identifier;
  }

  if (partial.length > 1) {
    const names = partial.map((s) => `  - ${s.name} (${s.identifier})`);
    throw new Error(
      `Multiple servers match "${config.serverName}":\n${names.join('\n')}\nUse a more specific name or pass --server UUID directly.`
    );
  }

  throw new Error(
    `No server found matching "${config.serverName}". Run with --list-servers to see available servers.`
  );
}

async function findPluginFile(client, config) {
  const entries = await client.directoryEntries(config.pluginDirectory);
  return entries.find((entry) => entry.name === config.pluginFilename) ?? null;
}

async function request(config, method, requestPath, body) {
  const url = new URL(requestPath, config.panelUrl);
  const headers = {
    Accept: 'application/vnd.pterodactyl.v1+json',
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  });

  if (!response.ok) {
    throw new Error(await formatResponseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function requestJson(config, method, requestPath, body) {
  const payload = await request(config, method, requestPath, body);
  if (payload?.attributes) {
    return payload;
  }
  if (payload?.data || payload?.object) {
    return payload;
  }

  return payload ?? {};
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const normalized = value.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function normalizeRemotePath(remotePath) {
  const normalized = remotePath.replace(/\\/g, '/').trim();
  if (!normalized) {
    return defaultPluginDirectory;
  }
  if (normalized === '/') {
    return normalized;
  }

  return `/${normalized.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function timestampSuffix() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function expectedStateForSignal(signal) {
  if (signal === 'start' || signal === 'restart') {
    return 'running';
  }
  if (signal === 'stop' || signal === 'kill') {
    return 'offline';
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} ${args.join(' ')} exited with code ${code}`)
      );
    });
  });
}

async function formatResponseError(response) {
  const body = await response.text();

  if (!body) {
    return `Request failed with status ${response.status}`;
  }

  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed.errors) && parsed.errors[0]?.detail) {
      return parsed.errors[0].detail;
    }
    if (typeof parsed.error === 'string') {
      return parsed.error;
    }
  } catch {
    return body;
  }

  return body;
}

function logStep(message) {
  console.log(`\n==> ${message}`);
}

function printHelp() {
  console.log(`Beacon deploy automation

Usage:
  npm run deploy:beacon -- [options]

Options:
  --dry-run           Print the resolved deploy plan without changing the server
  --skip-build        Reuse an existing local JAR instead of running build:beacon
  --skip-restart      Upload or pull the plugin without sending a power signal
  --no-backup         Replace the target plugin without renaming the previous file
  --artifact-url URL  Pull a remote JAR URL from the server instead of uploading
  --jar-path PATH     Override the local JAR path to upload
  --panel-url URL     Override PTERODACTYL_PANEL_URL
  --api-key KEY       Override PTERODACTYL_API_KEY
  --server UUID       Override PTERODACTYL_SERVER_UUID
  --server-name NAME  Resolve a server by name instead of UUID
  --list-servers      List all servers available to your API key
  --directory PATH    Override PTERODACTYL_PLUGIN_DIRECTORY
  --filename NAME     Override PTERODACTYL_PLUGIN_FILENAME
  --restart-signal X  One of: start, stop, restart, kill
  --help              Show this message
`);
}
