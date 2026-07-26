#!/usr/bin/env node

import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import express from 'express';
import { selectTaskPull } from './pr-selection.mjs';

dotenv.config({ path: '.env.local', override: true });
dotenv.config();

const PORT = Number(process.env.PORT || 4174);
const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = path.resolve(ROOT, process.env.PORTAL_DATA_DIR || '.portal-data');
const CHECK_RUNS_FILE = path.join(DATA_DIR, 'check-runs.json');
const runs = new Map();
const dnsSessions = new Map();
let persistRunsQueue = Promise.resolve();

const TASKS = [
  ['T01', 75, 65, 10],
  ['T02', 35, 29, 6],
  ['T03', 30, 25, 5],
  ['T04', 30, 25, 5],
  ['T05', 20, 17, 3],
  ['T06', 20, 17, 3],
  ['T07', 40, 32, 8],
  ['T08', 20, 17, 3],
  ['T09', 20, 17, 3],
  ['T10', 40, 32, 8],
  ['T11', 30, 25, 5],
  ['T12', 30, 25, 5],
  ['T13', 30, 25, 5],
  ['T14', 20, 17, 3],
  ['T15', 30, 25, 5],
  ['T16', 40, 30, 10],
  ['T17', 40, 30, 10],
  ['T18', 20, 17, 3],
  ['T19', 30, 25, 5],
  ['T20', 40, 28, 12],
  ['T21', 20, 17, 3],
  ['T22', 40, 30, 10],
  ['T23', 30, 25, 5],
  ['T24', 40, 30, 10],
  ['T25', 30, 25, 5],
  ['T26', 40, 30, 10],
  ['T27', 40, 30, 10],
  ['T28', 40, 30, 10],
  ['T29', 40, 30, 10],
  ['T30', 40, 30, 10],
];

const TASK_IDS = new Set(TASKS.map(([id]) => id));
const SNIPPET_TASK_IDS = new Set([
  'T01',
  'T06',
  'T03',
  'T04',
  'T05',
  'T11',
  'T12',
  'T13',
  'T14',
  'T17',
  'T18',
  'T15',
  'T16',
  'T19',
  'T21',
  'T22',
  'T23',
  'T24',
  'T20',
  'T26',
  'T27',
  'T28',
  'T29',
  'T07',
  'T10',
  'T30',
]);

const DEFAULT_DISALLOWED_ACTOR_PATTERNS = [
  'bot',
  'github-actions[bot]',
  'dependabot[bot]',
  'renovate[bot]',
  'copilot',
  'cursor',
  'codex',
  'claude',
  'anthropic',
  'openai',
  'gemini',
  'devin',
  'windsurf',
  'aider',
  'tabnine',
  'cody',
  'sourcegraph',
  'continue',
  'replit',
  'amazon-q',
  'qodo',
  'jules',
  'agent',
];

const SNIPPET_REQUIRED_PATTERNS = {
  T01: [/T01|\/health|\/status/i],
  T06: [/site-dist|upload-artifact|npm run build/i],
  T03: [/download-artifact|artifact/i],
  T04: [/release_ref|rollback|known-good/i],
  T05: [/process\.env|import\.meta\.env|secrets\./i],
  T11: [/preview|pr-preview|pull_request/i],
  T12: [/cache-dependency-path|hashFiles|package-lock\.json/i],
  T13: [/ReleaseReadiness|feature-bundle|check-release-readiness|T13/i],
  T14: [/Dockerfile|FROM .*node|FROM .*nginx/i],
  T17: [/releases\/|ln -sfn|blue.?green|candidate/i],
  T18: [/docker|container|image/i],
  T15: [/FEATURE_SHOW_INSIGHTS|featureFlag|FEATURE_.*FLAG/i],
  T16: [/RESEND_API_KEY|resend|email/i],
  T19: [/\/health|\/status|smoke/i],
  T21: [/permissions:|concurrency:/i],
  T22: [/compose|docker-compose|env_file/i],
  T23: [/release-manifest|workflowRun|deployedAt/i],
  T24: [/TURNSTILE_SITE_KEY|TURNSTILE_SECRET_KEY|turnstile/i],
  T20: [/auth\/google|GOOGLE_CLIENT_ID|SESSION_SECRET/i],
  T26: [/broken-deploy|incident|recovery/i],
  T27: [/secret.?scan|gitleaks|trufflehog|detect-secrets/i],
  T28: [/concurrency:|flock|lock|idempotent/i],
  T29: [/recovery|restore|known-good|workflow_dispatch/i],
  T07: [/OPENWEATHER_API_KEY|openweather|\/api\/weather/i],
  T10: [/WEB3FORMS_ACCESS_KEY|web3forms|contact/i],
  T30: [/@sentry\/react|Sentry\.init|SENTRY_AUTH_TOKEN/i],
};

const SNIPPET_FORBIDDEN_PATTERNS = {
  T04: [/inputs\.releaseRef|github\.event\.inputs\.releaseRef/],
  T16: [/VITE_RESEND_API_KEY/],
  T19: [/PUBLIC_URI/],
  T24: [/VITE_TURNSTILE_SECRET_KEY/],
  T26: [/\bRECOVERY_REF\b/],
};

const AI_MARKER_PATTERN =
  /\b(?:SNIPPET_PLACEHOLDER_DO_NOT_LEAVE|AI-REVIEW-MARKER|AI-AGENT-MARKER|AI-DATA-MARKER|PR-AGENT-MARKER|AI-PR-EVIDENCE-MARKER|CODEX-AI-MARKER|COPILOT-AI-MARKER)\b/;

const TASK_SECRET_REQUIREMENTS = {
  T05: ['PUBLIC_URL'],
  T02: ['DNS_PORTAL_USERNAME', 'DNS_PORTAL_PASSWORD', 'DNS_TXT_VALUE'],
  T15: ['FEATURE_FLAG_NAME'],
  T16: ['RESEND_API_KEY'],
  T19: ['PUBLIC_URL'],
  T20: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'],
  T24: ['TURNSTILE_SECRET_KEY'],
  T07: ['OPENWEATHER_API_KEY'],
  T10: ['WEB3FORMS_ACCESS_KEY'],
  T30: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'],
};

const CREDENTIAL_FIELDS = {
  VPS_HOST: { placeholder: '<vps-ip>', secret: false },
  VPS_PORT: { placeholder: '22', secret: false },
  VPS_USER: { placeholder: 'deploy', secret: false },
  DEPLOY_PATH: { placeholder: '/opt/deploy-sprint/team-01', secret: false },
  APP_PORT: { placeholder: '8080', secret: false },
  PUBLIC_URL: { placeholder: 'http://<team-vps-ip>', secret: false },
  IP_PUBLIC_URL: { placeholder: 'http://<team-vps-ip>', secret: false },
  DOMAIN_PUBLIC_URL: { placeholder: 'https://team01.verischolar.knurdz.org', secret: false },
  PUBLIC_URL_MODE: { placeholder: 'auto', secret: false },
  AUTO_SWITCH_PUBLIC_URL_AFTER_DNS: { placeholder: 'true', secret: false },
  DEPLOYER_OWNER: { placeholder: 'knurdz', secret: false },
  DEPLOYER_REPO: { placeholder: 'deploy-sprint-deployer', secret: false },
  DEPLOYER_PUBLIC_URL_VARIABLE: { placeholder: 'TEAM01_PUBLIC_URL', secret: false },
  DEPLOYER_DOMAIN_VARIABLE: { placeholder: 'TEAM01_DOMAIN', secret: false },
  DEPLOYER_ENABLE_DOMAIN_TLS_VARIABLE: { placeholder: 'TEAM01_ENABLE_DOMAIN_TLS', secret: false },
  TEAM_REPO_PUBLIC_URL_VARIABLE: { placeholder: 'PUBLIC_URL', secret: false },
  TEAM_REPO_DOMAIN_PUBLIC_URL_VARIABLE: { placeholder: 'DOMAIN_PUBLIC_URL', secret: false },
  TEAM_REPO_PUBLIC_URL_MODE_VARIABLE: { placeholder: 'PUBLIC_URL_MODE', secret: false },
  NODE_VERSION: { placeholder: '20', secret: false },
  EXPECTED_ARTIFACT_NAME: { placeholder: 'site-dist-${{ github.sha }}', secret: false },
  ROLLBACK_RELEASE_REF: { placeholder: '<known-good-tag-or-artifact>', secret: false },
  DNS_PORTAL_URL: { placeholder: 'http://localhost:4174/dns-portal', secret: false },
  DNS_PORTAL_USERNAME: { placeholder: 'team01', secret: false },
  DNS_PORTAL_PASSWORD: { placeholder: '<team-dns-password>', secret: true },
  HOSTINGER_API_TOKEN: { placeholder: '<hostinger-api-token>', secret: true },
  HOSTINGER_DNS_ZONE: { placeholder: 'knurdz.org', secret: false },
  TEAM_DOMAIN_SUFFIX: { placeholder: 'verischolar.knurdz.org', secret: false },
  DNS_TEAM_LABEL: { placeholder: 'team01', secret: false },
  ASSIGNED_DOMAIN: { placeholder: 'team01.verischolar.knurdz.org', secret: false },
  DNS_RECORD_TYPE: { placeholder: 'A', secret: false },
  DNS_RECORD_NAME: { placeholder: 'team01.verischolar', secret: false },
  DNS_RECORD_VALUE: { placeholder: '<vps-ip-or-origin-host>', secret: false },
  DNS_TXT_NAME: { placeholder: '_deploy-sprint-challenge.team01.verischolar', secret: false },
  DNS_TXT_VALUE: { placeholder: '<team-challenge-token>', secret: true },
  REBASE_ASSET_BRANCH: { placeholder: 'task-assets/rebase-feature', secret: false },
  CONFLICT_ASSET_BRANCH: { placeholder: 'task-assets/conflict-merge', secret: false },
  PREVIEW_ARTIFACT_NAME: { placeholder: 'preview-${{ github.event.pull_request.head.sha }}', secret: false },
  CACHE_KEY_PATTERN: { placeholder: '${{ runner.os }}-npm-${{ hashFiles(' + "'team-site/package-lock.json'" + ') }}', secret: false },
  FEATURE_BUNDLE_BRANCH: { placeholder: 'task-assets/feature-bundle', secret: false },
  DOCKER_IMAGE_NAME: { placeholder: 'deploy-sprint/team-01:${{ github.sha }}', secret: false },
  HEALTH_URL: { placeholder: '<PUBLIC_URL>/health', secret: false },
  FEATURE_FLAG_NAME: { placeholder: 'FEATURE_SHOW_INSIGHTS', secret: false },
  DEPLOY_CONCURRENCY_GROUP: { placeholder: 'deploy-team-01-production', secret: false },
  COMPOSE_PROJECT_NAME: { placeholder: 'deploy-sprint-team-01', secret: false },
  RELEASE_MANIFEST_PATH: { placeholder: 'release-manifest.json', secret: false },
  GOOGLE_AUTHORIZED_ORIGIN: { placeholder: 'https://team01.verischolar.knurdz.org', secret: false },
  GOOGLE_REDIRECT_URI: { placeholder: 'https://team01.verischolar.knurdz.org/auth/google/callback', secret: false },
  GOOGLE_SCOPES: { placeholder: 'openid email profile', secret: false },
  RESEND_API_KEY: { placeholder: '<resend-api-key>', secret: true },
  RESEND_FROM_EMAIL: { placeholder: 'Deploy Sprint <alerts@example.test>', secret: false },
  ALERT_RECIPIENT_EMAIL: { placeholder: 'judges@example.test', secret: false },
  EMAIL_PROVIDER: { placeholder: 'resend', secret: false },
  TURNSTILE_SITE_KEY: { placeholder: '<turnstile-site-key>', secret: false },
  TURNSTILE_SECRET_KEY: { placeholder: '<turnstile-secret-key>', secret: true },
  TURNSTILE_ALLOWED_HOSTNAME: { placeholder: 'team01.verischolar.knurdz.org', secret: false },
  TURNSTILE_PROVIDER: { placeholder: 'cloudflare-turnstile', secret: false },
  HOTFIX_BRANCH: { placeholder: 'task-assets/hotfix', secret: false },
  BROKEN_DEPLOY_BRANCH: { placeholder: 'task-assets/broken-deploy', secret: false },
  SECRET_LEAK_BRANCH: { placeholder: 'task-assets/secret-leak', secret: false },
  DEPLOY_LOCK_NAME: { placeholder: 'deploy-sprint-team-01.lock', secret: false },
  RECOVERY_TARGET_REF: { placeholder: '<known-good-artifact-or-tag>', secret: false },
  OPENWEATHER_CITY: { placeholder: 'Colombo', secret: false },
  WEB3FORMS_TARGET_EMAIL: { placeholder: 'judges@example.test', secret: false },
  SENTRY_ORG_SLUG: { placeholder: '<sentry-org-slug>', secret: false },
  SENTRY_PROJECT_SLUG: { placeholder: '<sentry-project-slug>', secret: false },
};

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.yml',
  '.yaml',
  '.json',
  '.html',
  '.css',
  '.sh',
  '.md',
  '.env',
]);

const SECRET_PATTERNS = [
  /-----BEGIN (?:OPENSSH|RSA|EC|DSA) PRIVATE KEY-----/i,
  /GOCSPX-[A-Za-z0-9_-]{10,}/,
  /sk_live_[A-Za-z0-9]+/,
  /xox[baprs]-[A-Za-z0-9-]+/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
];

const forbiddenGoogleClientSecretPattern = new RegExp(['VITE', 'GOOGLE_CLIENT_SECRET'].join('_'));
const forbiddenOpenWeatherVitePattern = new RegExp(['VITE', 'OPENWEATHER_API_KEY'].join('_'));
const forbiddenResendVitePattern = new RegExp(['VITE', 'RESEND_API_KEY'].join('_'));
const forbiddenTurnstileSecretPattern = new RegExp(['VITE', 'TURNSTILE_SECRET_KEY'].join('_'));

function getEnv(key, fallback = '') {
  return process.env[key] || fallback;
}

function disallowedActorPatterns() {
  const configured = getEnv('DISALLOWED_ACTOR_PATTERNS');
  return (configured ? configured.split(',') : DEFAULT_DISALLOWED_ACTOR_PATTERNS)
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
}

function isDisallowedActor(actor) {
  const login = String(actor?.login || actor || '').toLowerCase();
  const type = String(actor?.type || '').toLowerCase();
  if (!login) {
    return false;
  }
  return type === 'bot' || type === 'app' || disallowedActorPatterns().some((pattern) => login.includes(pattern));
}

function actorLogin(actor) {
  return String(actor?.login || '').trim();
}

function actorLabel(actor) {
  const login = actorLogin(actor);
  const type = actor?.type ? ` (${actor.type})` : '';
  return login ? `${login}${type}` : '<unknown actor>';
}

function isCollaborator(ctx, login) {
  return ctx.collaborators.has(String(login || '').toLowerCase());
}

function normalizeTeamLabel(value) {
  return String(value || 'team01').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function withoutTrailingDot(value) {
  return String(value || '').trim().replace(/\.$/, '');
}

function relativeRecordName(fqdn, zone) {
  const cleanFqdn = withoutTrailingDot(fqdn);
  const cleanZone = withoutTrailingDot(zone);
  if (cleanFqdn === cleanZone) {
    return '@';
  }
  if (cleanFqdn.endsWith(`.${cleanZone}`)) {
    return cleanFqdn.slice(0, -(cleanZone.length + 1));
  }
  return cleanFqdn;
}

function fqdnFromRecordName(name, zone) {
  const cleanName = withoutTrailingDot(name);
  const cleanZone = withoutTrailingDot(zone);
  if (!cleanName || cleanName === '@') {
    return cleanZone;
  }
  if (cleanName.endsWith(`.${cleanZone}`)) {
    return cleanName;
  }
  return `${cleanName}.${cleanZone}`;
}

function assignedDomainName() {
  const teamLabel = normalizeTeamLabel(getEnv('DNS_TEAM_LABEL', getEnv('TEAM_ID', 'team-01')));
  const suffix = withoutTrailingDot(getEnv('TEAM_DOMAIN_SUFFIX', 'verischolar.knurdz.org'));
  return withoutTrailingDot(getEnv('ASSIGNED_DOMAIN', `${teamLabel}.${suffix}`));
}

function ipPublicUrl() {
  return normalizeUrl(getEnv('IP_PUBLIC_URL', getEnv('PUBLIC_URL', CREDENTIAL_FIELDS.PUBLIC_URL.placeholder)));
}

function domainPublicUrl() {
  return normalizeUrl(getEnv('DOMAIN_PUBLIC_URL', domainHttpsUrl()));
}

function domainHttpUrl() {
  return normalizeUrl(`http://${assignedDomainName()}`);
}

function domainHttpsUrl() {
  return normalizeUrl(`https://${assignedDomainName()}`);
}

function configuredPublicUrl() {
  return normalizeUrl(getEnv('PUBLIC_URL', ipPublicUrl()));
}

function publicUrlMode() {
  return String(getEnv('PUBLIC_URL_MODE', 'auto')).trim().toLowerCase();
}

function publicUrl() {
  const mode = publicUrlMode();
  if (mode === 'ip') {
    return ipPublicUrl();
  }
  if (mode === 'domain') {
    return domainPublicUrl();
  }
  return configuredPublicUrl();
}

function publicUrlForTask(taskId) {
  if (taskId === 'T01') {
    return ipPublicUrl();
  }
  if (taskId === 'T02') {
    return domainPublicUrl();
  }
  if (getEnv('AUTO_SWITCH_PUBLIC_URL_AFTER_DNS', 'true') !== 'false') {
    return domainPublicUrl();
  }
  return publicUrl();
}

function dnsPortalUrl() {
  return getEnv('DNS_PORTAL_URL', CREDENTIAL_FIELDS.DNS_PORTAL_URL.placeholder);
}

function dnsConfig() {
  const zone = withoutTrailingDot(getEnv('HOSTINGER_DNS_ZONE', 'knurdz.org'));
  const teamLabel = normalizeTeamLabel(getEnv('DNS_TEAM_LABEL', getEnv('TEAM_ID', 'team-01')));
  const suffix = withoutTrailingDot(getEnv('TEAM_DOMAIN_SUFFIX', 'verischolar.knurdz.org'));
  const assignedDomain = assignedDomainName();
  const recordType = getEnv('DNS_RECORD_TYPE', 'A').toUpperCase() === 'CNAME' ? 'CNAME' : 'A';
  const recordName = getEnv('DNS_RECORD_NAME', relativeRecordName(assignedDomain, zone));
  const txtName = getEnv('DNS_TXT_NAME', `_deploy-sprint-challenge.${relativeRecordName(assignedDomain, zone)}`);
  const recordValue = getEnv('DNS_RECORD_VALUE', getEnv('VPS_HOST', CREDENTIAL_FIELDS.DNS_RECORD_VALUE.placeholder));
  const txtValue = getEnv('DNS_TXT_VALUE', CREDENTIAL_FIELDS.DNS_TXT_VALUE.placeholder);
  const ttl = Number(getEnv('DNS_TTL', '300'));

  return {
    zone,
    teamLabel,
    suffix,
    assignedDomain,
    recordType,
    recordName,
    recordValue,
    txtName,
    txtValue,
    ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : 300,
    publicUrl: domainPublicUrl(),
    portalUrl: dnsPortalUrl(),
    tokenConfigured: Boolean(process.env.HOSTINGER_API_TOKEN),
  };
}

function isSecretField(key) {
  return CREDENTIAL_FIELDS[key]?.secret === true || /SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SSH_KEY|TXT_VALUE/.test(key);
}

function credentialValue(key) {
  const field = CREDENTIAL_FIELDS[key] || { placeholder: `<${key}>`, secret: isSecretField(key) };
  const envValue = process.env[key];
  const allowSecretDisplay = process.env.ALLOW_SECRET_DISPLAY === 'true';
  if (field.secret && !allowSecretDisplay) {
    return {
      value: envValue ? '<configured; hidden by portal>' : field.placeholder,
      configured: Boolean(envValue),
      secret: true,
    };
  }
  return {
    value: envValue || field.placeholder,
    configured: Boolean(envValue),
    secret: field.secret,
  };
}

function bootstrapPayload() {
  const credentials = Object.fromEntries(
    Object.keys(CREDENTIAL_FIELDS).map((key) => [key, credentialValue(key)]),
  );
  const dns = dnsConfig();
  const txtConfigured = Boolean(process.env.DNS_TXT_VALUE);

  return {
    team: {
      id: getEnv('TEAM_ID', 'team-01'),
      name: getEnv('TEAM_NAME', 'Test Team 01'),
      publicUrl: publicUrl() || CREDENTIAL_FIELDS.PUBLIC_URL.placeholder,
      ipPublicUrl: ipPublicUrl() || CREDENTIAL_FIELDS.IP_PUBLIC_URL.placeholder,
      domainPublicUrl: domainPublicUrl() || CREDENTIAL_FIELDS.DOMAIN_PUBLIC_URL.placeholder,
      publicUrlMode: publicUrlMode(),
    },
    repository: {
      owner: getEnv('GITHUB_OWNER', 'knurdz'),
      name: getEnv('GITHUB_REPO', 'deploy-sprint-finale-test-team-01-zero'),
      tokenConfigured: Boolean(process.env.GITHUB_TOKEN),
    },
    dnsPortal: {
      ...dns,
      txtValue: process.env.ALLOW_SECRET_DISPLAY === 'true' || !txtConfigured ? dns.txtValue : '<configured; hidden by portal>',
      teamPasswordConfigured: Boolean(process.env.DNS_PORTAL_PASSWORD),
    },
    credentials,
    secretDisplayEnabled: process.env.ALLOW_SECRET_DISPLAY === 'true',
    evaluationPolicy: {
      teamMemberSource: getEnv('TEAM_MEMBER_SOURCE', 'github-collaborators'),
      requireApprovalAfterLastCommit: getEnv('REQUIRE_APPROVAL_AFTER_LAST_COMMIT', 'true') !== 'false',
      requireHumanMerger: getEnv('REQUIRE_HUMAN_MERGER', 'true') !== 'false',
      disallowedActorPatterns: disallowedActorPatterns(),
    },
    scoring: {
      total: 1000,
      automated: 800,
      judge: 200,
      tasks: TASKS.map(([id, points, automatedPoints, judgePoints]) => ({
        id,
        points,
        automatedPoints,
        judgePoints,
      })),
    },
  };
}

function result(status, label, detail) {
  return { status, label, detail };
}

function pass(label, detail) {
  return result('pass', label, detail);
}

function fail(label, detail) {
  return result('fail', label, detail);
}

function review(label, detail) {
  return result('manual_review', label, detail);
}

function humanGatePassed(items) {
  const requiredLabels = new Set([
    'Task PR',
    'Human PR author',
    'Fresh collaborator approval',
    'Human merge actor',
    'Bot/agent actor scan',
  ]);
  const seen = new Set(items.map((item) => item.label));
  return [...requiredLabels].every((label) => seen.has(label)) && items.every((item) => item.status === 'pass');
}

function skippedTechnicalChecksItem() {
  return review(
    'Task checks skipped',
    'Task implementation checks are hidden until the PR targets main, is merged, has a fresh approval from another collaborator, and is merged by a non-bot collaborator.',
  );
}

function publicRun(run) {
  return {
    id: run.id,
    taskId: run.taskId,
    status: run.status,
    progress: run.progress,
    message: run.message,
    items: run.items || [],
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    finishedAt: run.finishedAt,
  };
}

function persistedRunsPayload() {
  return [...runs.values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(publicRun);
}

function persistRuns() {
  const payload = persistedRunsPayload();
  persistRunsQueue = persistRunsQueue
    .then(async () => {
      await mkdir(DATA_DIR, { recursive: true });
      const tempPath = `${CHECK_RUNS_FILE}.${process.pid}.tmp`;
      await writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`);
      await rename(tempPath, CHECK_RUNS_FILE);
    })
    .catch((error) => {
      console.error(`Failed to persist evaluator check runs: ${error.message}`);
    });
  return persistRunsQueue;
}

async function loadPersistedRuns() {
  if (!existsSync(CHECK_RUNS_FILE)) {
    return;
  }

  let changed = false;
  const loaded = JSON.parse(await readFile(CHECK_RUNS_FILE, 'utf8'));
  if (!Array.isArray(loaded)) {
    throw new Error(`${CHECK_RUNS_FILE} must contain an array of check runs.`);
  }

  for (const entry of loaded) {
    if (!entry?.id || !TASK_IDS.has(entry.taskId)) {
      continue;
    }

    const run = {
      ...entry,
      items: Array.isArray(entry.items) ? entry.items : [],
      progress: Number(entry.progress || 0),
    };

    if (run.status === 'running') {
      const now = new Date().toISOString();
      run.status = 'manual_review';
      run.progress = 100;
      run.message = 'Evaluator was interrupted by a portal restart. Run the check again for fresh evidence.';
      run.items = [
        ...(run.items || []),
        review('Interrupted check', 'This run was still in progress when the portal server restarted.'),
      ];
      run.finishedAt = now;
      run.updatedAt = now;
      changed = true;
    }

    runs.set(run.id, run);
  }

  if (changed) {
    await persistRuns();
  }
}

function summarize(items) {
  if (items.some((item) => item.status === 'fail')) {
    return 'failed';
  }
  if (items.some((item) => item.status === 'manual_review')) {
    return 'manual_review';
  }
  return 'passed';
}

function sanitize(value) {
  let output = String(value ?? '');
  for (const key of Object.keys(process.env)) {
    if (!isSecretField(key)) {
      continue;
    }
    const secret = process.env[key];
    if (secret && secret.length >= 6) {
      output = output.split(secret).join('<redacted>');
    }
  }
  return output;
}

function updateRun(run, progress, message) {
  run.progress = Math.max(run.progress, progress);
  run.message = message;
  run.updatedAt = new Date().toISOString();
  persistRuns();
}

async function githubRequest(pathname, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured on the evaluator server.');
  }

  const response = await fetch(`https://api.github.com${pathname}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'deploy-sprint-evaluator',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const accepted = response.headers.get('x-accepted-github-permissions');
    const body = await response.text();
    throw new Error(
      `GitHub API ${response.status} for ${pathname}.${accepted ? ` Accepted permissions: ${accepted}.` : ''} ${body.slice(0, 240)}`,
    );
  }

  if (response.status === 204) {
    return {};
  }
  return response.json();
}

async function setRepoVariable(owner, repo, name, value) {
  const cleanName = String(name || '').trim();
  if (!owner || !repo || !cleanName || !value) {
    return review('Repository variable update', `Skipped ${owner || '<owner>'}/${repo || '<repo>'} ${cleanName || '<variable>'}: missing configuration.`);
  }

  try {
    await githubRequest(`/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(cleanName)}`, {
      method: 'PATCH',
      body: { name: cleanName, value },
    });
    return pass('Repository variable update', `Updated ${owner}/${repo} variable ${cleanName}.`);
  } catch (patchError) {
    if (!/GitHub API 404/.test(patchError.message)) {
      return review('Repository variable update', sanitize(patchError.message));
    }
  }

  try {
    await githubRequest(`/repos/${owner}/${repo}/actions/variables`, {
      method: 'POST',
      body: { name: cleanName, value },
    });
    return pass('Repository variable update', `Created ${owner}/${repo} variable ${cleanName}.`);
  } catch (createError) {
    return review('Repository variable update', sanitize(createError.message));
  }
}

async function switchPublicUrlToDomain() {
  if (getEnv('AUTO_SWITCH_PUBLIC_URL_AFTER_DNS', 'true') === 'false') {
    return [review('Public URL automation', 'AUTO_SWITCH_PUBLIC_URL_AFTER_DNS=false, so repository variables were not changed.')];
  }

  const owner = getEnv('GITHUB_OWNER', 'knurdz');
  const repo = getEnv('GITHUB_REPO', 'deploy-sprint-finale-test-team-01-zero');
  const deployerOwner = getEnv('DEPLOYER_OWNER', owner);
  const deployerRepo = getEnv('DEPLOYER_REPO');
  const teamVariable = getEnv('TEAM_REPO_PUBLIC_URL_VARIABLE', 'PUBLIC_URL');
  const teamDomainVariable = getEnv('TEAM_REPO_DOMAIN_PUBLIC_URL_VARIABLE', 'DOMAIN_PUBLIC_URL');
  const teamModeVariable = getEnv('TEAM_REPO_PUBLIC_URL_MODE_VARIABLE', 'PUBLIC_URL_MODE');
  const deployerVariable = getEnv('DEPLOYER_PUBLIC_URL_VARIABLE', 'TEAM01_PUBLIC_URL');
  const deployerDomainVariable = getEnv('DEPLOYER_DOMAIN_VARIABLE', 'TEAM01_DOMAIN');
  const deployerTlsVariable = getEnv('DEPLOYER_ENABLE_DOMAIN_TLS_VARIABLE', 'TEAM01_ENABLE_DOMAIN_TLS');
  const nextPublicUrl = domainHttpsUrl();
  const domain = assignedDomainName();
  const items = [
    await setRepoVariable(owner, repo, teamVariable, nextPublicUrl),
    await setRepoVariable(owner, repo, teamDomainVariable, nextPublicUrl),
    await setRepoVariable(owner, repo, teamModeVariable, 'domain'),
  ];

  if (deployerRepo) {
    items.push(await setRepoVariable(deployerOwner, deployerRepo, deployerVariable, nextPublicUrl));
    items.push(await setRepoVariable(deployerOwner, deployerRepo, deployerDomainVariable, domain));
    items.push(await setRepoVariable(deployerOwner, deployerRepo, deployerTlsVariable, 'true'));
  } else {
    items.push(review('Deployer URL automation', 'DEPLOYER_REPO is not configured, so deployer variable update was skipped.'));
  }

  return items;
}

function dnsUpdatePayload(config) {
  return {
    overwrite: false,
    zone: [
      {
        name: config.recordName,
        type: config.recordType,
        ttl: config.ttl,
        records: [{ content: config.recordValue }],
      },
      {
        name: config.txtName,
        type: 'TXT',
        ttl: config.ttl,
        records: [{ content: config.txtValue }],
      },
    ],
  };
}

async function hostingerRequest(pathname, { method = 'GET', body } = {}) {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) {
    throw new Error('HOSTINGER_API_TOKEN is not configured on the portal server.');
  }

  const response = await fetch(`https://developers.hostinger.com${pathname}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'deploy-sprint-dns-portal',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  const json = text ? safeJson(text) : {};
  if (!response.ok) {
    throw new Error(`Hostinger API ${response.status}: ${text.slice(0, 300) || response.statusText}`);
  }
  return json;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function normalizeHostingerRecords(records) {
  if (!Array.isArray(records)) {
    return [];
  }
  return records.map((record) => ({
    name: record.name,
    type: record.type,
    ttl: record.ttl,
    records: Array.isArray(record.records)
      ? record.records.map((item) => ({
          content: item.content,
          isDisabled: Boolean(item.isDisabled),
        }))
      : [],
  }));
}

function expectedDnsRecords(config) {
  return [
    {
      label: 'Site record',
      name: config.recordName,
      fqdn: fqdnFromRecordName(config.recordName, config.zone),
      type: config.recordType,
      value: config.recordValue,
    },
    {
      label: 'TXT challenge',
      name: config.txtName,
      fqdn: fqdnFromRecordName(config.txtName, config.zone),
      type: 'TXT',
      value: config.txtValue,
    },
  ];
}

function findMatchingRecords(records, expected) {
  return expected.map((target) => {
    const record = records.find((item) => item.name === target.name && item.type === target.type);
    const values = record?.records?.map((item) => item.content) || [];
    return {
      ...target,
      found: Boolean(record),
      values,
      matches: values.includes(target.value),
    };
  });
}

function createDnsSession() {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 6 * 60 * 60 * 1000;
  dnsSessions.set(token, { expiresAt });
  return { token, expiresAt };
}

function getDnsSession(req) {
  const auth = req.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  const session = dnsSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) {
      dnsSessions.delete(token);
    }
    return null;
  }
  return { token, ...session };
}

function requireDnsSession(req, res) {
  const session = getDnsSession(req);
  if (!session) {
    res.status(401).json({ error: 'DNS portal login required.' });
    return null;
  }
  return session;
}

function isReadableSource(file) {
  if (isAgentInstructionFile(file)) {
    return false;
  }
  if (file.startsWith('tasks/') || file.startsWith('organizer/')) {
    return false;
  }
  if (['SUBMISSION.md', 'domain.config.json', 'release-manifest.json', '.github/PULL_REQUEST_TEMPLATE.md'].includes(file)) {
    return true;
  }
  if (file.startsWith('docs/')) {
    return ['.md', '.txt', '.json', '.log', '.yml', '.yaml'].includes(path.extname(file));
  }
  if (file.startsWith('.github/workflows/')) {
    return true;
  }
  if (['package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml', 'compose.yml', '.dockerignore'].includes(file)) {
    return true;
  }
  if (
    file.startsWith('team-site/') &&
    (
      ['package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml', 'compose.yml', '.dockerignore'].includes(file.slice('team-site/'.length)) ||
      file.startsWith('team-site/src/') ||
      file.startsWith('team-site/public/') ||
      file.startsWith('team-site/scripts/')
    )
  ) {
    return SOURCE_EXTENSIONS.has(path.extname(file)) || file.endsWith('Dockerfile');
  }
  if (file.startsWith('src/') || file.startsWith('server/') || file.startsWith('scripts/') || file.startsWith('public/')) {
    return SOURCE_EXTENSIONS.has(path.extname(file)) || file.endsWith('Dockerfile');
  }
  return false;
}

function isAgentInstructionFile(file) {
  const normalized = String(file || '').replace(/\\/g, '/');
  const basename = path.basename(normalized).toLowerCase();
  return (
    basename === 'agents.md' ||
    basename === 'agent.md' ||
    basename === 'pr-agent-notes.md' ||
    /^pr[-_]?agent.*\.md$/i.test(basename) ||
    /^agent[-_]?.*\.md$/i.test(basename) ||
    normalized.toLowerCase().includes('/pull_request_template/agents.md')
  );
}

async function readGitHubFiles(owner, repo, ref, update, run) {
  updateRun(run, 18, 'Reading repository tree');
  const branch = await githubRequest(`/repos/${owner}/${repo}/branches/${encodeURIComponent(ref)}`);
  const treeSha = branch.commit.commit.tree.sha;
  const tree = await githubRequest(`/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`);
  const files = new Map();

  updateRun(run, 28, 'Reading source and workflow files');
  for (const item of tree.tree || []) {
    if (item.type !== 'blob' || item.size > 800_000 || !isReadableSource(item.path)) {
      continue;
    }
    const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs/${item.sha}`);
    if (blob.encoding === 'base64') {
      files.set(item.path, Buffer.from(blob.content, 'base64').toString('utf8'));
    }
  }

  updateRun(run, update, 'Repository files loaded');
  return {
    branch,
    tree: tree.tree || [],
    files,
  };
}

async function loadContext(run) {
  const owner = getEnv('GITHUB_OWNER', 'knurdz');
  const repo = getEnv('GITHUB_REPO', 'deploy-sprint-finale-test-team-01-zero');
  const ctx = {
    owner,
    repo,
    defaultBranch: 'main',
    repoLoaded: false,
    files: new Map(),
    tree: [],
    branch: null,
    pulls: [],
    runs: [],
    artifacts: [],
    collaborators: new Set(),
    collaboratorsLoaded: false,
    secrets: new Set(),
    secretsLoaded: false,
    contextItems: [],
  };

  if (!process.env.GITHUB_TOKEN) {
    ctx.contextItems.push(review('GitHub token', 'GITHUB_TOKEN is not configured. Repository checks need server-side GitHub access.'));
    return ctx;
  }

  try {
    updateRun(run, 10, 'Loading GitHub repository metadata');
    const repoInfo = await githubRequest(`/repos/${owner}/${repo}`);
    ctx.defaultBranch = repoInfo.default_branch || 'main';
    ctx.repoLoaded = true;
    ctx.contextItems.push(pass('GitHub repository', `${owner}/${repo} is reachable.`));

    const fileData = await readGitHubFiles(owner, repo, ctx.defaultBranch, 42, run);
    ctx.files = fileData.files;
    ctx.tree = fileData.tree;
    ctx.branch = fileData.branch;

    updateRun(run, 50, 'Reading pull requests and Actions evidence');
    const [pulls, actionsRuns, artifacts] = await Promise.all([
      githubRequest(`/repos/${owner}/${repo}/pulls?state=all&per_page=100`),
      githubRequest(`/repos/${owner}/${repo}/actions/runs?per_page=100`),
      githubRequest(`/repos/${owner}/${repo}/actions/artifacts?per_page=100`),
    ]);
    ctx.pulls = pulls || [];
    ctx.runs = actionsRuns.workflow_runs || [];
    ctx.artifacts = artifacts.artifacts || [];

    try {
      updateRun(run, 56, 'Reading collaborator evidence');
      const collaborators = await githubRequest(`/repos/${owner}/${repo}/collaborators?affiliation=all&per_page=100`);
      ctx.collaborators = new Set((collaborators || []).map((collaborator) => collaborator.login?.toLowerCase()).filter(Boolean));
      ctx.collaboratorsLoaded = true;
      ctx.contextItems.push(pass('Collaborator metadata', `Loaded ${ctx.collaborators.size} repository collaborators as real team-member candidates.`));
    } catch (error) {
      ctx.contextItems.push(review('Collaborator metadata', sanitize(error.message)));
    }

    try {
      updateRun(run, 60, 'Reading GitHub secret metadata');
      const secrets = await githubRequest(`/repos/${owner}/${repo}/actions/secrets?per_page=100`);
      ctx.secrets = new Set((secrets.secrets || []).map((secret) => secret.name));
      ctx.secretsLoaded = true;
      ctx.contextItems.push(pass('Secret metadata', 'GitHub Actions secret names are readable; values are never exposed.'));
    } catch (error) {
      ctx.contextItems.push(review('Secret metadata', sanitize(error.message)));
    }
  } catch (error) {
    ctx.contextItems.push(review('GitHub repository', sanitize(error.message)));
  }

  return ctx;
}

function allText(ctx) {
  return [...ctx.files.values()].join('\n\n---FILE---\n\n');
}

function findTextMatch(ctx, pattern) {
  for (const [file, text] of ctx.files) {
    if (typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)) {
      return file;
    }
  }
  return null;
}

function workflowText(ctx) {
  return [...ctx.files]
    .filter(([file]) => file.startsWith('.github/workflows/'))
    .map(([, text]) => text)
    .join('\n\n---WORKFLOW---\n\n');
}

function hasText(ctx, pattern) {
  const haystack = allText(ctx);
  return typeof pattern === 'string' ? haystack.includes(pattern) : pattern.test(haystack);
}

function hasWorkflow(ctx, pattern) {
  const haystack = workflowText(ctx);
  return typeof pattern === 'string' ? haystack.includes(pattern) : pattern.test(haystack);
}

function hasFile(ctx, predicate) {
  const match = (file) => (typeof predicate === 'string' ? file === predicate : predicate.test(file));
  if ([...ctx.files.keys()].some(match)) {
    return true;
  }
  return (ctx.tree || []).some((item) => item.type === 'blob' && match(item.path));
}

function secretItems(ctx, taskId) {
  const required = TASK_SECRET_REQUIREMENTS[taskId] || [];
  if (!required.length) {
    return [pass('Required secrets', 'This task has no required GitHub Secrets.')];
  }
  if (!ctx.secretsLoaded) {
    return [review('Required secrets', `Could not verify secret names. Expected: ${required.join(', ')}.`)];
  }
  const missing = required.filter((secret) => !ctx.secrets.has(secret));
  return missing.length
    ? [fail('Required secrets', `Missing GitHub Secret names: ${missing.join(', ')}.`)]
    : [pass('Required secrets', `All required secret names exist: ${required.join(', ')}.`)];
}

function successfulRun(ctx, pattern) {
  return ctx.runs.find((run) => {
    const text = `${run.name || ''} ${run.display_title || ''} ${run.path || ''}`.toLowerCase();
    return run.conclusion === 'success' && (!pattern || pattern.test(text));
  });
}

function failedRun(ctx, pattern) {
  return ctx.runs.find((run) => {
    const text = `${run.name || ''} ${run.display_title || ''} ${run.path || ''}`.toLowerCase();
    return run.conclusion === 'failure' && (!pattern || pattern.test(text));
  });
}

function prForTaskSelection(ctx, taskId) {
  return selectTaskPull(ctx.pulls, taskId, ctx.defaultBranch);
}

function prForTask(ctx, taskId) {
  return prForTaskSelection(ctx, taskId).pull;
}

function lastCommitTime(commits) {
  return commits.reduce((latest, commit) => {
    const timestamp = Date.parse(commit.commit?.committer?.date || commit.commit?.author?.date || '');
    return Number.isFinite(timestamp) && timestamp > latest ? timestamp : latest;
  }, 0);
}

async function loadPullEvidence(ctx, pullNumber) {
  const [details, reviews, commits, files] = await Promise.all([
    githubRequest(`/repos/${ctx.owner}/${ctx.repo}/pulls/${pullNumber}`),
    githubRequest(`/repos/${ctx.owner}/${ctx.repo}/pulls/${pullNumber}/reviews?per_page=100`),
    githubRequest(`/repos/${ctx.owner}/${ctx.repo}/pulls/${pullNumber}/commits?per_page=100`),
    githubRequest(`/repos/${ctx.owner}/${ctx.repo}/pulls/${pullNumber}/files?per_page=100`),
  ]);
  return {
    details,
    reviews: reviews || [],
    commits: commits || [],
    files: files || [],
  };
}

function actorHumanItem(ctx, label, actor) {
  const login = actorLogin(actor);
  if (!login) {
    return fail(label, 'No GitHub actor was found for this evidence.');
  }
  if (isDisallowedActor(actor)) {
    return fail(label, `${actorLabel(actor)} is a bot/app/known agent actor.`);
  }
  if (!ctx.collaboratorsLoaded) {
    return review(label, `Could not verify ${login} as a repository collaborator.`);
  }
  if (!isCollaborator(ctx, login)) {
    return fail(label, `${login} is not listed as a repository collaborator.`);
  }
  return pass(label, `${login} is a non-bot repository collaborator.`);
}

function freshApprovalItem(ctx, pull, reviews, commits) {
  if (!ctx.collaboratorsLoaded) {
    return review('Fresh collaborator approval', 'Could not verify reviewer collaborator membership.');
  }
  const author = actorLogin(pull.user).toLowerCase();
  const latestCommit = lastCommitTime(commits);
  const requireFresh = getEnv('REQUIRE_APPROVAL_AFTER_LAST_COMMIT', 'true') !== 'false';
  const approvals = reviews
    .filter((reviewItem) => reviewItem.state === 'APPROVED')
    .filter((reviewItem) => actorLogin(reviewItem.user).toLowerCase() !== author)
    .filter((reviewItem) => !isDisallowedActor(reviewItem.user))
    .filter((reviewItem) => isCollaborator(ctx, actorLogin(reviewItem.user)))
    .filter((reviewItem) => {
      if (!requireFresh || !latestCommit) {
        return true;
      }
      return Date.parse(reviewItem.submitted_at || '') >= latestCommit;
    });

  if (!approvals.length) {
    const freshness = requireFresh ? ' after the latest PR commit' : '';
    return fail('Fresh collaborator approval', `No approval from a different non-bot collaborator${freshness}.`);
  }
  const latestApproval = approvals.sort((a, b) => Date.parse(b.submitted_at || '') - Date.parse(a.submitted_at || ''))[0];
  return pass('Fresh collaborator approval', `${actorLogin(latestApproval.user)} approved after the latest scored commit.`);
}

function botActorScanItem(pull, reviews, commits) {
  const actors = [
    { role: 'PR author', actor: pull.user },
    { role: 'Merger', actor: pull.merged_by },
    ...reviews.map((reviewItem) => ({ role: `Review ${reviewItem.state}`, actor: reviewItem.user })),
    ...commits.flatMap((commit) => [
      { role: 'Commit author', actor: commit.author },
      { role: 'Commit committer', actor: commit.committer },
    ]),
  ];
  const disallowedPatterns = disallowedActorPatterns();
  const trailerOffenders = commits.flatMap((commit, index) => {
    const message = commit.commit?.message || '';
    return message
      .split(/\r?\n/)
      .filter((line) => /^co-authored-by:/i.test(line))
      .filter((line) => disallowedPatterns.some((pattern) => line.toLowerCase().includes(pattern)))
      .map((line) => `Commit ${commit.sha?.slice(0, 7) || index + 1} trailer: ${line.replace(/<[^>]+>/g, '<redacted-email>')}`);
  });
  const offenders = actors
    .filter(({ actor }) => actor && isDisallowedActor(actor))
    .map(({ role, actor }) => `${role}: ${actorLabel(actor)}`);

  const allOffenders = [...new Set([...offenders, ...trailerOffenders])];
  return allOffenders.length
    ? fail('Bot/agent actor scan', `Disallowed actors found: ${allOffenders.join(', ')}.`)
    : pass('Bot/agent actor scan', 'No bot/app/known agent actors found in PR author, reviews, merger, or commits.');
}

function snippetIntegrationItem(ctx, taskId) {
  if (!SNIPPET_TASK_IDS.has(taskId)) {
    return null;
  }
  const patterns = SNIPPET_REQUIRED_PATTERNS[taskId] || [new RegExp(taskId, 'i')];
  const matched = patterns.some((pattern) => hasText(ctx, pattern));
  if (!matched) {
    return fail('Snippet integration evidence', `No required snippet behavior/marker evidence found for ${taskId}.`);
  }
  const markerFile = findTextMatch(ctx, AI_MARKER_PATTERN);
  if (markerFile) {
    return fail('Snippet integration evidence', `A forbidden snippet or AI marker remains in ${markerFile}.`);
  }
  const debugIssue = (SNIPPET_FORBIDDEN_PATTERNS[taskId] || []).find((pattern) => hasText(ctx, pattern));
  if (debugIssue) {
    return fail(
      'Snippet integration evidence',
      `Starter debug issue remains unresolved for ${taskId}: ${debugIssue}. Read the failed Actions log and fix the workflow/source wiring.`,
    );
  }
  return pass('Snippet integration evidence', 'Required snippet behavior/marker evidence is present and forbidden markers are absent.');
}

function aiMarkerCleanItem(ctx) {
  const markerFile = findTextMatch(ctx, AI_MARKER_PATTERN);
  if (markerFile) {
    return fail(
      'AI marker cleanup',
      `Forbidden AI/agent marker remains in ${markerFile}. Agent instruction files are ignored; task work files must be manually cleaned before scoring.`,
    );
  }

  const prEvidence = [
    { label: 'task PR title/body', text: `${ctx.taskPull?.title || ''}\n${ctx.taskPull?.body || ''}` },
    ...(ctx.taskReviews || []).map((reviewItem) => ({
      label: `review by ${actorLogin(reviewItem.user) || '<unknown>'}`,
      text: reviewItem.body || '',
    })),
  ];
  const prMarker = prEvidence.find((item) => AI_MARKER_PATTERN.test(item.text));
  if (prMarker) {
    return fail(
      'AI marker cleanup',
      `Forbidden AI/agent marker remains in ${prMarker.label}. Participants must manually clean PR evidence before scoring.`,
    );
  }

  return pass('AI marker cleanup', 'No AI/agent marker remains in scored source, workflow, script, PR evidence, or submission files.');
}

async function humanWorkflowItems(ctx, taskId) {
  if (!ctx.repoLoaded) {
    return [];
  }

  const selection = prForTaskSelection(ctx, taskId);
  const pull = selection.pull;
  if (!pull) {
    return [
      fail('Task PR selection', selection.reason),
      fail('Task PR', `No pull request matched ${taskId}. Use a PR title starting with [${taskId}] or a branch starting with task/${taskId}-. Direct pushes do not score.`),
      fail('Human PR author', 'No valid task PR author to verify.'),
      fail('Fresh collaborator approval', 'No valid task PR approval to verify.'),
      fail('Human merge actor', 'No valid task PR merger to verify.'),
      fail('Bot/agent actor scan', 'No valid task PR actors to scan.'),
    ];
  }

  try {
    const evidence = await loadPullEvidence(ctx, pull.number);
    const details = evidence.details;
    const targetIsMain = details.base?.ref === ctx.defaultBranch;
    const merged = Boolean(details.merged_at);
    const items = [
      pass('Task PR selection', selection.reason),
      targetIsMain && merged
        ? pass('Task PR', `PR #${details.number} targets ${ctx.defaultBranch} and is merged.`)
        : fail(
            'Task PR',
            `PR #${details.number} must target ${ctx.defaultBranch} and be merged; found target ${details.base?.ref || '<unknown>'}, merged=${merged}.`,
          ),
      actorHumanItem(ctx, 'Human PR author', details.user),
      freshApprovalItem(ctx, details, evidence.reviews, evidence.commits),
    ];

    if (getEnv('REQUIRE_HUMAN_MERGER', 'true') !== 'false') {
      items.push(actorHumanItem(ctx, 'Human merge actor', details.merged_by));
    } else {
      items.push(pass('Human merge actor', 'Human merger requirement is disabled by evaluator configuration.'));
    }

    items.push(botActorScanItem(details, evidence.reviews, evidence.commits));
    ctx.taskPull = details;
    ctx.taskReviews = evidence.reviews;
    ctx.taskCommits = evidence.commits;
    ctx.taskFiles = evidence.files;
    return items;
  } catch (error) {
    return [
      review('Task PR', `Could not load full PR evidence for PR #${pull.number}: ${sanitize(error.message)}.`),
      review('Human PR author', 'PR author verification is blocked until PR evidence is readable.'),
      review('Fresh collaborator approval', 'Review verification is blocked until PR evidence is readable.'),
      review('Human merge actor', 'Merge actor verification is blocked until PR evidence is readable.'),
      review('Bot/agent actor scan', 'Actor scan is blocked until PR evidence is readable.'),
    ];
  }
}

function branchOrPrItem(ctx, taskId) {
  const pr = prForTask(ctx, taskId);
  if (pr) {
    return pass('Pull request evidence', `Found PR #${pr.number}: ${pr.title}.`);
  }
  return fail('Pull request evidence', `No PR found for ${taskId}.`);
}

function taskPrFileNames(ctx) {
  return (ctx.taskFiles || []).map((file) => file.filename || '').filter(Boolean);
}

function protectedAgentInstructionFilesItem(ctx) {
  const touched = taskPrFileNames(ctx).filter(isAgentInstructionFile);
  return touched.length
    ? fail(
        'Protected agent instruction files',
        `Task PR changed protected assistant instruction file(s): ${touched.join(', ')}. Revert those files; marker traps inside them are intentionally ignored by marker scans but must not be edited for scoring.`,
      )
    : pass('Protected agent instruction files', 'Task PR did not modify protected assistant instruction files.');
}

function taskTouchedFilesItem(ctx, label, patterns) {
  const files = taskPrFileNames(ctx);
  if (!files.length) {
    return review(label, 'Could not inspect changed files for the task PR.');
  }
  const matched = files.filter((file) => patterns.some((pattern) => (typeof pattern === 'string' ? file === pattern : pattern.test(file))));
  return matched.length
    ? pass(label, `Task PR changed expected file(s): ${matched.slice(0, 5).join(', ')}.`)
    : fail(label, `Task PR did not change expected file paths. Looked for: ${patterns.map(String).join(', ')}.`);
}

function taskPrBranchItem(ctx, taskId) {
  const ref = ctx.taskPull?.head?.ref || '';
  const normalized = taskId.toLowerCase();
  return ref.toLowerCase().includes(normalized) || ref.toLowerCase().includes(`task/${normalized}`)
    ? pass('Task branch naming', `Task PR branch is ${ref}.`)
    : fail('Task branch naming', `Expected task branch to include ${taskId}; found ${ref || '<unknown>'}.`);
}

function taskPrBodyItem(ctx, label, patterns) {
  const body = `${ctx.taskPull?.title || ''}\n${ctx.taskPull?.body || ''}`;
  const missing = patterns.filter((pattern) => !(typeof pattern === 'string' ? body.includes(pattern) : pattern.test(body)));
  return missing.length
    ? fail(label, `PR description is missing expected evidence terms: ${missing.map(String).join(', ')}.`)
    : pass(label, 'PR description includes expected verification/evidence terms.');
}

function artifactEvidenceItem(ctx, label, patterns) {
  const artifacts = ctx.artifacts || [];
  const matched = artifacts.filter((artifact) => patterns.some((pattern) => pattern.test(`${artifact.name || ''} ${artifact.workflow_run?.head_branch || ''}`)));
  if (matched.length) {
    return pass(label, `Found artifact evidence: ${matched.slice(0, 3).map((artifact) => artifact.name).join(', ')}.`);
  }
  if (hasWorkflow(ctx, /upload-artifact/i)) {
    return review(label, 'Workflow uploads artifacts, but no matching artifact metadata is currently readable.');
  }
  return fail(label, `No matching artifact evidence found. Expected: ${patterns.map(String).join(', ')}.`);
}

function successfulRunItem(ctx, label, pattern) {
  const run = successfulRun(ctx, pattern);
  return run
    ? pass(label, `Found successful run: ${run.name || run.display_title || run.id}.`)
    : fail(label, `No successful Actions run matched ${pattern}.`);
}

function failedRunItem(ctx, label, pattern) {
  const run = failedRun(ctx, pattern);
  return run
    ? pass(label, `Found failed run: ${run.name || run.display_title || run.id}.`)
    : fail(label, `No failed Actions run matched ${pattern}.`);
}

function sourceIncludesAll(ctx, label, patterns) {
  const missing = patterns.filter((pattern) => !hasText(ctx, pattern));
  return missing.length
    ? fail(label, `Missing source markers: ${missing.map(String).join(', ')}.`)
    : pass(label, 'All expected source markers are present.');
}

function workflowExcludesItem(ctx, label, patterns) {
  const haystack = workflowText(ctx);
  const found = patterns.filter((pattern) => (typeof pattern === 'string' ? haystack.includes(pattern) : pattern.test(haystack)));
  return found.length
    ? fail(label, `Forbidden workflow marker(s) found: ${found.map(String).join(', ')}.`)
    : pass(label, 'Forbidden workflow markers are absent.');
}

function packageDependencyItem(ctx, label, patterns) {
  const packageTexts = [...ctx.files]
    .filter(([file]) => file.endsWith('package.json'))
    .map(([, text]) => text)
    .join('\n');
  const missing = patterns.filter((pattern) => !pattern.test(packageTexts));
  return missing.length
    ? fail(label, `Missing package dependency marker(s): ${missing.map(String).join(', ')}.`)
    : pass(label, 'Expected package dependency markers are present.');
}

function rawSecretScanItem(ctx) {
  const offenders = [];
  for (const [file, text] of ctx.files) {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        offenders.push(file);
        break;
      }
    }
  }
  return offenders.length
    ? fail('Secret pattern scan', `Potential secret material found in: ${[...new Set(offenders)].join(', ')}.`)
    : pass('Secret pattern scan', 'No private key, PAT, cloud key, or token-like patterns found in source/workflows.');
}

function forbiddenTextItem(ctx, pattern, label) {
  return hasText(ctx, pattern)
    ? fail(label, `Forbidden marker ${pattern} was found in source/workflows.`)
    : pass(label, `Forbidden marker ${pattern} was not found.`);
}

async function fetchEvidence(urlPath, baseUrl = publicUrl()) {
  const base = normalizeUrl(baseUrl);
  if (!base) {
    return { ok: false, detail: 'PUBLIC_URL is not configured on the evaluator server.' };
  }

  const url = `${base}${urlPath}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { redirect: 'manual', signal: controller.signal });
    const text = await response.text();
    const location = response.headers.get('location');
    return {
      ok: response.ok,
      status: response.status,
      text,
      detail:
        response.status >= 300 && response.status < 400 && location
          ? `${urlPath} returned HTTP ${response.status} redirect to ${location}.`
          : `${urlPath} returned HTTP ${response.status}.`,
    };
  } catch (error) {
    const hint =
      base.startsWith('http://') && /fetch failed|certificate|TLS|SSL|alert|redirect/i.test(error.message)
        ? ' The configured HTTP URL may be redirecting to HTTPS with an invalid raw-IP certificate.'
        : '';
    return { ok: false, detail: `${urlPath} check failed for ${url}: ${sanitize(error.message)}.${hint}` };
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonEvidence(evidence, label) {
  if (!evidence.ok) {
    return { value: null, item: fail(label, evidence.detail) };
  }
  try {
    return { value: JSON.parse(evidence.text), item: pass(label, `${label} returned valid JSON.`) };
  } catch (error) {
    return { value: null, item: fail(label, `${label} did not return valid JSON: ${sanitize(error.message)}.`) };
  }
}

function expectedMainCommit(ctx) {
  return ctx.branch?.commit?.sha || '';
}

function t15StatusEvidenceItems(ctx, status, flags) {
  const items = [];
  const expectedCommit = expectedMainCommit(ctx);

  if (expectedCommit) {
    items.push(
      status.commit === expectedCommit
        ? pass('T15 live commit', `/status commit matches current main ${expectedCommit.slice(0, 7)}.`)
        : fail('T15 live commit', `/status commit ${status.commit || '<missing>'} does not match current main ${expectedCommit}.`),
    );
  }

  const statusFlags = status.featureFlags || {};
  const redacted = statusFlags.valueRedacted === true || statusFlags.secretsRedacted === true;
  const hasFlagState = typeof statusFlags.showInsightsEnabled === 'boolean' || typeof statusFlags.disabled === 'boolean' || typeof statusFlags.enabled === 'boolean';
  items.push(
    statusFlags.task === 'T15' && statusFlags.flagName && redacted && hasFlagState
      ? pass('T15 live feature flag status', '/status includes redacted T15 feature flag evidence.')
      : fail('T15 live feature flag status', '/status must include featureFlags.task=T15, flagName, redacted=true, and a boolean flag state.'),
  );

  items.push(
    status.deployer?.preservedArtifactStatus === true && status.deployer?.artifact === `site-dist-${status.commit}`
      ? pass('T15 deployer artifact preservation', 'Deployer preserved CI artifact status and recorded the deployed artifact.')
      : fail('T15 deployer artifact preservation', '/status must show deployer.preservedArtifactStatus=true and deployer.artifact=site-dist-<commit>.'),
  );

  items.push(
    Array.isArray(status.tasks) && status.tasks.includes('T15')
      ? pass('T15 task list evidence', '/status tasks includes T15.')
      : fail('T15 task list evidence', '/status tasks must include T15 after deployment.'),
  );

  items.push(
    flags?.task === 'T15' && flags?.flagName && (flags.valueRedacted === true || flags.secretsRedacted === true)
      ? pass('T15 feature flag config endpoint', '/config/feature-flags.json exposes safe redacted T15 evidence.')
      : fail('T15 feature flag config endpoint', '/config/feature-flags.json must expose task=T15, flagName, and redacted evidence.'),
  );

  return items;
}

async function dnsItems() {
  const config = dnsConfig();
  const domain = config.assignedDomain;
  const type = config.recordType;
  const value = config.recordValue;
  const txtName = fqdnFromRecordName(config.txtName, config.zone);
  const txtValue = config.txtValue;
  const items = [];

  if (!domain || !value || value.startsWith('<')) {
    items.push(review('DNS target', 'ASSIGNED_DOMAIN or DNS_RECORD_VALUE is not configured on the evaluator server.'));
  } else {
    try {
      const records = type === 'CNAME' ? await dns.resolveCname(domain) : await dns.resolve4(domain);
      const matched = records.map(withoutTrailingDot).includes(withoutTrailingDot(value));
      items.push(
        matched
          ? pass('DNS target', `${domain} resolves to the expected ${type} target.`)
          : fail('DNS target', `${domain} resolved to ${records.join(', ') || 'no records'}, expected ${value}.`),
      );
    } catch (error) {
      items.push(fail('DNS target', sanitize(error.message)));
    }
  }

  if (!txtName || !txtValue || txtValue.startsWith('<')) {
    items.push(review('DNS TXT challenge', 'DNS_TXT_NAME or DNS_TXT_VALUE is not configured on the evaluator server.'));
  } else {
    try {
      const records = (await dns.resolveTxt(txtName)).map((parts) => parts.join(''));
      items.push(
        records.includes(txtValue)
          ? pass('DNS TXT challenge', 'TXT verification record is present.')
          : fail('DNS TXT challenge', 'TXT verification record is missing or has the wrong value.'),
      );
    } catch (error) {
      items.push(fail('DNS TXT challenge', sanitize(error.message)));
    }
  }

  const [domainHttpsHome, domainHttpHome, ipHttpHome] = await Promise.all([
    fetchEvidence('/', domainHttpsUrl()),
    fetchEvidence('/', domainHttpUrl()),
    fetchEvidence('/', ipPublicUrl()),
  ]);
  items.push(
    domainHttpsHome.ok
      ? pass('Domain HTTPS evidence', `${domainHttpsUrl()} responded successfully.`)
      : fail('Domain HTTPS evidence', domainHttpsHome.detail),
  );
  items.push(
    domainHttpHome.ok
      ? pass('Domain HTTP evidence', `${domainHttpUrl()} responded successfully without requiring HTTPS.`)
      : fail('Domain HTTP evidence', domainHttpHome.detail),
  );
  items.push(
    ipHttpHome.ok
      ? pass('IP HTTP evidence', `${ipPublicUrl()} still responded successfully after domain/TLS setup.`)
      : fail('IP HTTP evidence', ipHttpHome.detail),
  );

  return items;
}

function workflowIncludesAll(ctx, label, patterns) {
  const missing = patterns.filter((pattern) => !hasWorkflow(ctx, pattern));
  return missing.length
    ? fail(label, `Missing workflow markers: ${missing.map(String).join(', ')}.`)
    : pass(label, 'All expected workflow markers are present.');
}

function sourceIncludesAny(ctx, label, patterns) {
  return patterns.some((pattern) => hasText(ctx, pattern))
    ? pass(label, 'Expected source marker is present.')
    : fail(label, `None of these source markers were found: ${patterns.map(String).join(', ')}.`);
}

function filesMatching(ctx, pattern) {
  return [...ctx.files.keys()].filter((file) => pattern.test(file));
}

function prChangedFileMatches(ctx, patterns) {
  const files = taskPrFileNames(ctx);
  return files.filter((file) => patterns.some((pattern) => (typeof pattern === 'string' ? file === pattern : pattern.test(file))));
}

function hiddenPass(label, detail) {
  return pass(`Hidden probe: ${label}`, detail);
}

function hiddenFail(label, detail) {
  return fail(`Hidden probe: ${label}`, detail);
}

function hiddenReview(label, detail) {
  return review(`Hidden probe: ${label}`, detail);
}

function hiddenWorkflowProbe(ctx, label, requiredPatterns, forbiddenPatterns = []) {
  const text = workflowText(ctx);
  const missing = requiredPatterns.filter((pattern) => !pattern.test(text));
  if (missing.length) {
    return hiddenFail(label, `Workflow structure is missing expected behavior: ${missing.map(String).join(', ')}.`);
  }
  const forbidden = forbiddenPatterns.filter((pattern) => pattern.test(text));
  if (forbidden.length) {
    return hiddenFail(label, `Workflow structure still contains forbidden behavior: ${forbidden.map(String).join(', ')}.`);
  }
  return hiddenPass(label, 'Workflow structure matches the hidden task probe.');
}

function hiddenSourceProbe(ctx, label, requiredPatterns, forbiddenPatterns = []) {
  const text = allText(ctx);
  const missing = requiredPatterns.filter((pattern) => !pattern.test(text));
  if (missing.length) {
    return hiddenFail(label, `Source/evidence is missing required behavior: ${missing.map(String).join(', ')}.`);
  }
  const forbidden = forbiddenPatterns.filter((pattern) => pattern.test(text));
  if (forbidden.length) {
    return hiddenFail(label, `Source/evidence contains forbidden behavior: ${forbidden.map(String).join(', ')}.`);
  }
  return hiddenPass(label, 'Source/evidence matches the hidden task probe.');
}

function hiddenPrDiffProbe(ctx, label, patterns, minimumMatches = 1) {
  const matched = prChangedFileMatches(ctx, patterns);
  return matched.length >= minimumMatches
    ? hiddenPass(label, `PR changed expected implementation evidence: ${matched.slice(0, 6).join(', ')}.`)
    : hiddenFail(label, `PR diff did not include expected implementation files for this task.`);
}

function hiddenArtifactProbe(ctx, label, patterns) {
  const matched = (ctx.artifacts || []).filter((artifact) => patterns.some((pattern) => pattern.test(`${artifact.name || ''} ${artifact.workflow_run?.head_sha || ''}`)));
  if (matched.length) {
    return hiddenPass(label, `Readable artifact metadata matched: ${matched.slice(0, 3).map((artifact) => artifact.name).join(', ')}.`);
  }
  return hiddenReview(label, 'No matching artifact metadata is readable yet; verify the matching Actions artifact if the workflow just ran.');
}

function hiddenSuccessfulRunProbe(ctx, label, pattern) {
  const run = successfulRun(ctx, pattern);
  return run
    ? hiddenPass(label, `Successful Actions run matched: ${run.name || run.display_title || run.id}.`)
    : hiddenFail(label, `No successful Actions run matched this task probe.`);
}

function hiddenNoRawEnvProbe(ctx) {
  const committedEnvFiles = filesMatching(ctx, /(^|\/)\.env($|\.)/).filter((file) => !/\.example$/i.test(file));
  return committedEnvFiles.length
    ? hiddenFail('committed env files', `Committed env-like files are not allowed: ${committedEnvFiles.join(', ')}.`)
    : hiddenPass('committed env files', 'No committed non-template env files were found in scored source.');
}

function hiddenProbeItems(ctx, taskId) {
  const common = [
    hiddenNoRawEnvProbe(ctx),
  ];

  switch (taskId) {
    case 'T01':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T01 deploy request shape', [/team-site/i, /npm ci/i, /npm run build/i, /repository_dispatch|deploy-request|deployer/i]),
        hiddenSourceProbe(ctx, 'T01 status schema', [/\/health|health/i, /\/status|status/i, /commit|GITHUB_SHA|releaseId|deployedAt/i, /T01/i]),
      ];
    case 'T02':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T02 domain metadata', [/ASSIGNED_DOMAIN|assignedDomain/i, /DNS_RECORD|domain\.connected|recordType/i, /DOMAIN_PUBLIC_URL|PUBLIC_URL/i], [/DNS_PORTAL_PASSWORD\s*=\s*["'][^"'<]+["']/i]),
        hiddenPrDiffProbe(ctx, 'T02 DNS evidence diff', [/domain\.config\.json$/, /^docs\/.*dns/i, /^SUBMISSION\.md$/, /^\.github\/workflows\//]),
      ];
    case 'T03':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T03 artifact reuse', [/upload-artifact/i, /download-artifact/i, /site-dist/i, /release-candidate|release-manifest|artifact/i]),
        hiddenArtifactProbe(ctx, 'T03 artifact metadata', [/site-dist|release-manifest/i]),
      ];
    case 'T04':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T04 rollback dispatch', [/workflow_dispatch/i, /release_ref/i, /rollback|known-good|restore/i], [/inputs\.releaseRef|github\.event\.inputs\.releaseRef/]),
        hiddenSuccessfulRunProbe(ctx, 'T04 successful rollback run', /rollback|restore/),
      ];
    case 'T05':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T05 runtime config separation', [/process\.env|import\.meta\.env|secrets\./i, /secretsRedacted|redacted|safe.*config/i], [/API_KEY\s*=\s*["'][^"'<]+["']/i]),
      ];
    case 'T06':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T06 CI gate structure', [/pull_request/i, /push:/i, /node-version:\s*['"]?20|NODE_VERSION/i, /npm ci/i, /npm run build/i, /upload-artifact/i], [/pull_request_target/i, /npm install(?!\s+-g)/i]),
        hiddenArtifactProbe(ctx, 'T06 CI dist artifact', [/site-dist|dist/i]),
      ];
    case 'T08':
      return [
        ...common,
        hiddenPrDiffProbe(ctx, 'T08 imported feature diff', [/^team-site\//, /^SUBMISSION\.md$/, /rebase|insight/i]),
        hiddenSourceProbe(ctx, 'T08 feature evidence', [/rebase-feature|rebase-insights|T08|insight/i]),
      ];
    case 'T09':
      return [
        ...common,
        hiddenPrDiffProbe(ctx, 'T09 conflict resolution diff', [/^team-site\//, /^SUBMISSION\.md$/, /deadline|conflict/i]),
        hiddenSourceProbe(ctx, 'T09 conflict cleanup', [/conflict-merge|conflict-deadlines|T09|deadline/i], [/<<<<<<<|=======|>>>>>>>/]),
      ];
    case 'T11':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T11 PR preview workflow', [/pull_request/i, /preview|artifact|deployment/i, /upload-artifact|environment|pages/i]),
        hiddenArtifactProbe(ctx, 'T11 preview artifact metadata', [/preview|pr/i]),
      ];
    case 'T12':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T12 lockfile cache', [/cache-dependency-path/i, /package-lock\.json|hashFiles/i, /npm ci/i], [/npm install(?!\s+-g)/i]),
      ];
    case 'T13':
      return [
        ...common,
        hiddenPrDiffProbe(ctx, 'T13 feature/test diff', [/^team-site\/src\//, /^team-site\/.*test/i, /feature|readiness/i]),
        hiddenSourceProbe(ctx, 'T13 feature bundle behavior', [/feature-bundle|releaseReadiness|check-release-readiness|T13/i], [AI_MARKER_PATTERN]),
      ];
    case 'T14':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T14 production Dockerfile', [/FROM .*node/i, /npm ci/i, /npm run build/i, /FROM .*nginx|serve|vite preview/i, /\.dockerignore|node_modules/i]),
      ];
    case 'T17':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T17 low-downtime release switch', [/releases\/|candidate|blue.?green|current/i, /ln -sfn|symlink|switch/i, /health/i]),
      ];
    case 'T18':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T18 container deploy request', [/docker|container/i, /repository_dispatch|deploy-request|deployer|ssh/i]),
        hiddenSuccessfulRunProbe(ctx, 'T18 container build/deploy run', /docker|container|deploy|build/),
      ];
    case 'T15':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T15 runtime feature flag', [/FEATURE_.*FLAG|featureFlag/i, /process\.env|import\.meta\.env|secrets\./i, /redacted|valueRedacted|enabled|disabled/i]),
      ];
    case 'T16':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T16 Resend email integration', [/RESEND_API_KEY/i, /resend/i, /email|alert/i, /redacted|secretRedacted|provider.*resend/i], [forbiddenResendVitePattern]),
      ];
    case 'T19':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T19 smoke-test failure behavior', [/curl|fetch|wget/i, /\/health/i, /\/status/i, /--fail|exit 1|process\.exit\(1\)|throw new Error/i]),
        hiddenSuccessfulRunProbe(ctx, 'T19 successful smoke run', /smoke|health|status|deploy/),
      ];
    case 'T21':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T21 workflow permissions and concurrency', [/permissions:/i, /concurrency:/i], [/pull_request_target/i]),
      ];
    case 'T22':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T22 compose runtime config', [/services:/i, /ports:/i, /env_file|environment:|\.env\.example/i], [/password\s*:\s*["']?[^"'<\s]+/i]),
      ];
    case 'T23':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T23 release manifest fields', [/release-manifest|manifest/i, /commit/i, /artifact|image/i, /workflow|run/i, /deploy|deployedAt/i]),
        hiddenArtifactProbe(ctx, 'T23 manifest artifact metadata', [/manifest|release/i]),
      ];
    case 'T24':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T24 Turnstile server verification', [/TURNSTILE_SITE_KEY/i, /TURNSTILE_SECRET_KEY/i, /turnstile/i, /siteverify|verify|token/i], [forbiddenTurnstileSecretPattern]),
      ];
    case 'T20':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T20 server-side OAuth flow', [/auth\/google|oauth2|openid/i, /GOOGLE_CLIENT_ID/i, /GOOGLE_CLIENT_SECRET/i, /SESSION_SECRET|cookie|session/i, /state/i, /logout|auth\/me/i], [forbiddenGoogleClientSecretPattern]),
      ];
    case 'T25':
      return [
        ...common,
        hiddenPrDiffProbe(ctx, 'T25 hotfix-only diff', [/^team-site\//, /^SUBMISSION\.md$/, /hotfix|fix/i]),
        hiddenSourceProbe(ctx, 'T25 cherry-pick evidence', [/hotfix|cherry-pick|T25|fix/i], [/experimental.*marker|unrelated.*experiment/i]),
      ];
    case 'T26':
      return [
        ...common,
        hiddenSuccessfulRunProbe(ctx, 'T26 recovery success run', /deploy|recovery|fix/),
        hiddenSourceProbe(ctx, 'T26 incident evidence', [/root cause|symptom|incident|broken-deploy|recovery/i, /fix|rollback|restore/i]),
      ];
    case 'T27':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T27 secret leak prevention', [/secret.?scan|gitleaks|trufflehog|detect-secrets|PRIVATE KEY/i], [/DEPLOY_SPRINT_TEST_TOKEN_T23_DO_NOT_USE/i]),
      ];
    case 'T28':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T28 race-safe deploy controls', [/concurrency:|flock|lock|idempotent/i, /retry|mkdir -p|ln -sfn|current/i]),
      ];
    case 'T29':
      return [
        ...common,
        hiddenWorkflowProbe(ctx, 'T29 actions-only recovery', [/workflow_dispatch/i, /recovery|restore|known-good/i, /deployer|GitHub Actions|Actions only/i]),
      ];
    case 'T07':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T07 OpenWeather runtime endpoint', [/OPENWEATHER_API_KEY/i, /openweather/i, /\/api\/weather|weather\.provider|provider.*openweather/i], [forbiddenOpenWeatherVitePattern]),
      ];
    case 'T10':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T10 Web3Forms contact integration', [/WEB3FORMS_ACCESS_KEY/i, /web3forms|api\.web3forms\.com/i, /contact|form/i, /provider.*web3forms|contact.*configured/i]),
      ];
    case 'T30':
      return [
        ...common,
        hiddenSourceProbe(ctx, 'T30 Sentry release monitoring', [/@sentry\/react|Sentry\.init/i, /SENTRY_DSN|VITE_SENTRY_DSN/i, /SENTRY_AUTH_TOKEN|SENTRY_ORG|SENTRY_PROJECT/i, /release|monitoring|Sentry\.setTag/i]),
      ];
    default:
      return [hiddenFail('task id', `Unknown task id ${taskId}.`)];
  }
}

function taskChecks(ctx, taskId) {
  const items = [...ctx.contextItems, ...secretItems(ctx, taskId)];

  if (!ctx.repoLoaded) {
    return items;
  }

  items.push(aiMarkerCleanItem(ctx));
  items.push(protectedAgentInstructionFilesItem(ctx));

  const snippetItem = snippetIntegrationItem(ctx, taskId);
  if (snippetItem) {
    items.push(snippetItem);
  }

  switch (taskId) {
    case 'T01':
      items.push(taskPrBranchItem(ctx, 'T01'));
      items.push(taskTouchedFilesItem(ctx, 'T01 implementation files', [/^\.github\/workflows\//, /^team-site\//, /^SUBMISSION\.md$/]));
      items.push(workflowIncludesAll(ctx, 'Deploy workflow/request', [/deploy|deployment/i, /upload-artifact|deploy-request|repository_dispatch|deployer/i]));
      items.push(sourceIncludesAll(ctx, 'Health/status generation', [/\/health|health/i, /\/status|status/i, /T01/i]));
      items.push(successfulRunItem(ctx, 'Successful deploy run', /deploy|release|main/));
      return items;
    case 'T02':
      items.push(taskPrBranchItem(ctx, 'T02'));
      items.push(taskTouchedFilesItem(ctx, 'T02 domain evidence files', [/domain\.config\.json$/, /^docs\/.*dns/i, /^SUBMISSION\.md$/, /^\.github\/workflows\//]));
      items.push(forbiddenTextItem(ctx, /DNS_PORTAL_PASSWORD\s*=\s*["'][^"'<]+["']/, 'DNS portal password hygiene'));
      items.push(sourceIncludesAll(ctx, 'Domain status evidence', [/ASSIGNED_DOMAIN|assignedDomain|team01|PUBLIC_URL/i, /DNS_RECORD|domain\.connected|assignedDomain/i]));
      items.push(taskPrBodyItem(ctx, 'DNS verification note', [/dns|domain/i, /txt|verification/i]));
      return items;
    case 'T03':
      items.push(taskPrBranchItem(ctx, 'T03'));
      items.push(taskTouchedFilesItem(ctx, 'T03 workflow/evidence files', [/^\.github\/workflows\//, /manifest|artifact|SUBMISSION\.md/i]));
      items.push(workflowIncludesAll(ctx, 'Artifact promotion', [/upload-artifact/, /download-artifact/]));
      items.push(artifactEvidenceItem(ctx, 'Build artifact metadata', [/site-dist|dist|artifact/i]));
      items.push(sourceIncludesAny(ctx, 'Artifact identity', [/artifact/i, /release-manifest/i, /artifactId|artifactName/i]));
      return items;
    case 'T04':
      items.push(taskPrBranchItem(ctx, 'T04'));
      items.push(taskTouchedFilesItem(ctx, 'T04 rollback files', [/^\.github\/workflows\/.*rollback/i, /^SUBMISSION\.md$/, /rollback|manifest/i]));
      items.push(workflowIncludesAll(ctx, 'Rollback workflow', [/workflow_dispatch/, /release_ref/, /rollback|known-good|restore/i]));
      items.push(failedRunItem(ctx, 'Rollback diagnostic run', /rollback|restore/));
      items.push(successfulRunItem(ctx, 'Rollback run', /rollback|restore/));
      items.push(taskPrBodyItem(ctx, 'Rollback evidence note', [/release_ref|known-good|rollback/i, /log|run|evidence/i]));
      return items;
    case 'T05':
      items.push(taskPrBranchItem(ctx, 'T05'));
      items.push(taskTouchedFilesItem(ctx, 'T05 config files', [/^\.github\/workflows\//, /^team-site\/src\//, /\.env\.example$/, /config|status/i]));
      items.push(sourceIncludesAny(ctx, 'Env-based config', [/process\.env|import\.meta\.env|secrets\.|PUBLIC_URL/i]));
      items.push(sourceIncludesAny(ctx, 'Redacted config evidence', [/redacted|secretsRedacted|safe.*config|publicUrlConfigured/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    case 'T06':
      items.push(taskPrBranchItem(ctx, 'T06'));
      items.push(taskTouchedFilesItem(ctx, 'T06 CI workflow files', [/^\.github\/workflows\//]));
      items.push(workflowIncludesAll(ctx, 'CI workflow', [/pull_request/, /push:/, /node-version:\s*['"]?20|NODE_VERSION/i, /npm ci/, /npm run build/, /upload-artifact/]));
      items.push(artifactEvidenceItem(ctx, 'CI artifact metadata', [/site-dist|dist/i]));
      items.push(successfulRunItem(ctx, 'Successful CI run', /ci|build/));
      return items;
    case 'T08':
      items.push(taskPrBranchItem(ctx, 'T08'));
      items.push(branchOrPrItem(ctx, 'T08'));
      items.push(taskTouchedFilesItem(ctx, 'T08 imported feature files', [/^team-site\//, /^SUBMISSION\.md$/, /rebase|insight/i]));
      items.push(sourceIncludesAny(ctx, 'Rebase branch evidence', [/rebase-feature|rebase-insights|T08|insight/i]));
      items.push(successfulRunItem(ctx, 'Build evidence', /ci|build/));
      return items;
    case 'T09':
      items.push(taskPrBranchItem(ctx, 'T09'));
      items.push(branchOrPrItem(ctx, 'T09'));
      items.push(taskTouchedFilesItem(ctx, 'T09 conflict resolution files', [/^team-site\//, /^SUBMISSION\.md$/, /deadline|conflict/i]));
      items.push(forbiddenTextItem(ctx, /<<<<<<<|=======|>>>>>>>/, 'Merge conflict markers'));
      items.push(sourceIncludesAny(ctx, 'Conflict resolution evidence', [/conflict-merge|conflict-deadlines|T09|deadline/i]));
      items.push(successfulRunItem(ctx, 'Build evidence', /ci|build/));
      return items;
    case 'T11':
      items.push(taskPrBranchItem(ctx, 'T11'));
      items.push(taskTouchedFilesItem(ctx, 'T11 preview files', [/^\.github\/workflows\//, /^SUBMISSION\.md$/, /preview/i]));
      items.push(workflowIncludesAll(ctx, 'Preview workflow', [/pull_request/, /preview|artifact|deployment/i]));
      items.push(sourceIncludesAny(ctx, 'Preview evidence marker', [/preview/i, /upload-artifact/i]));
      items.push(artifactEvidenceItem(ctx, 'Preview artifact metadata', [/preview|pr/i]));
      return items;
    case 'T12':
      items.push(taskPrBranchItem(ctx, 'T12'));
      items.push(taskTouchedFilesItem(ctx, 'T12 pipeline files', [/^\.github\/workflows\//]));
      items.push(workflowIncludesAll(ctx, 'Dependency cache', [/cache|setup-node/i, /package-lock\.json|hashFiles/i, /npm ci/]));
      items.push(workflowExcludesItem(ctx, 'No stale npm install mode', [/npm install(?!\s+-g)/]));
      items.push(successfulRunItem(ctx, 'Successful cached CI run', /ci|build|cache/));
      return items;
    case 'T13':
      items.push(taskPrBranchItem(ctx, 'T13'));
      items.push(taskTouchedFilesItem(ctx, 'T13 feature/test files', [/^team-site\/src\//, /^team-site\/.*test/i, /^SUBMISSION\.md$/, /feature|readiness/i]));
      items.push(forbiddenTextItem(ctx, /AI-REVIEW-MARKER/, 'AI marker cleanup'));
      items.push(sourceIncludesAny(ctx, 'Feature bundle evidence', [/feature-bundle|T13|releaseReadiness|check-release-readiness/i]));
      items.push(successfulRunItem(ctx, 'Build/test run', /build|test|ci/));
      return items;
    case 'T14':
      items.push(taskPrBranchItem(ctx, 'T14'));
      items.push(taskTouchedFilesItem(ctx, 'T14 Docker files', [/(^|\/)Dockerfile$/, /(^|\/)\.dockerignore$/]));
      items.push(hasFile(ctx, /(^|\/)Dockerfile$/) ? pass('Dockerfile', 'Dockerfile exists.') : fail('Dockerfile', 'Dockerfile is missing.'));
      items.push(hasFile(ctx, /(^|\/)\.dockerignore$/) ? pass('.dockerignore', '.dockerignore exists.') : fail('.dockerignore', '.dockerignore is missing.'));
      items.push(sourceIncludesAll(ctx, 'Docker static runtime', [/FROM .*node/i, /npm ci/i, /npm run build/i, /FROM .*nginx|serve|vite preview/i]));
      items.push(successfulRunItem(ctx, 'Docker/build run', /docker|build|ci/));
      return items;
    case 'T17':
      items.push(taskPrBranchItem(ctx, 'T17'));
      items.push(taskTouchedFilesItem(ctx, 'T17 deploy strategy files', [/^\.github\/workflows\//, /deploy|release|script/i, /^SUBMISSION\.md$/]));
      items.push(sourceIncludesAny(ctx, 'Low-downtime pattern', [/current\s*->|ln -sfn|symlink|blue.?green|candidate|releases\//i]));
      items.push(sourceIncludesAny(ctx, 'Health gate before switch', [/health/i, /switch/i, /rollback/i]));
      items.push(sourceIncludesAny(ctx, 'Previous release preserved', [/previous|known-good|rollback|preserve|restore/i]));
      return items;
    case 'T18':
      items.push(taskPrBranchItem(ctx, 'T18'));
      items.push(taskTouchedFilesItem(ctx, 'T18 container deploy files', [/^\.github\/workflows\//, /Dockerfile$/, /^SUBMISSION\.md$/]));
      items.push(workflowIncludesAll(ctx, 'Container deploy workflow/request', [/docker|container/i, /deploy-request|repository_dispatch|deployer|deployment/i]));
      items.push(successfulRunItem(ctx, 'Container deploy/build run', /docker|container|deploy|build/));
      return items;
    case 'T15':
      items.push(taskPrBranchItem(ctx, 'T15'));
      items.push(taskTouchedFilesItem(ctx, 'T15 feature flag files', [/^team-site\/src\//, /^\.github\/workflows\//, /status|manifest/i]));
      items.push(sourceIncludesAny(ctx, 'Runtime feature flag', [/FEATURE_.*FLAG|featureFlag|process\.env|import\.meta\.env|secrets\./i]));
      items.push(sourceIncludesAny(ctx, 'Redacted flag evidence', [/redacted|valueRedacted|safe.*status|enabled|disabled/i]));
      return items;
    case 'T16':
      items.push(taskPrBranchItem(ctx, 'T16'));
      items.push(taskTouchedFilesItem(ctx, 'T16 email integration files', [/^team-site\/src\//, /^server\//, /^team-site\/server\//, /^\.github\/workflows\//, /email|resend|alert|status/i]));
      items.push(forbiddenTextItem(ctx, forbiddenResendVitePattern, 'Resend browser secret exposure'));
      items.push(sourceIncludesAll(ctx, 'Resend email integration', [/RESEND_API_KEY/i, /resend/i, /email|alert/i]));
      items.push(sourceIncludesAny(ctx, 'Email status evidence', [/provider.*resend|email.*configured|secretRedacted|redacted/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    case 'T19':
      items.push(taskPrBranchItem(ctx, 'T19'));
      items.push(taskTouchedFilesItem(ctx, 'T19 smoke-test files', [/^\.github\/workflows\//, /smoke|status|health|SUBMISSION\.md/i]));
      items.push(sourceIncludesAny(ctx, 'Smoke test routes', [/\/health/i, /\/status/i, /curl|fetch|wget/i]));
      items.push(sourceIncludesAny(ctx, 'Smoke failure behavior', [/--fail|exit 1|throw new Error|process\.exit\(1\)/i]));
      items.push(failedRunItem(ctx, 'Smoke diagnostic run', /smoke|health|status|deploy/));
      items.push(successfulRunItem(ctx, 'Successful smoke run', /smoke|health|status|deploy/));
      return items;
    case 'T21':
      items.push(taskPrBranchItem(ctx, 'T21'));
      items.push(taskTouchedFilesItem(ctx, 'T21 workflow safety files', [/^\.github\/workflows\//]));
      items.push(workflowIncludesAll(ctx, 'Workflow safety controls', [/permissions:/, /concurrency:/]));
      items.push(forbiddenTextItem(ctx, /pull_request_target/, 'Unsafe pull_request_target trigger'));
      items.push(sourceIncludesAny(ctx, 'Safe cancellation behavior', [/cancel-in-progress:\s*(false|true)|concurrency:/i]));
      return items;
    case 'T22':
      items.push(taskPrBranchItem(ctx, 'T22'));
      items.push(taskTouchedFilesItem(ctx, 'T22 Compose files', [/(^|\/)(docker-compose|compose)\.ya?ml$/, /(^|\/)\.env\.example$/]));
      items.push(hasFile(ctx, /(^|\/)(docker-compose|compose)\.ya?ml$/) ? pass('Compose file', 'Compose file exists.') : fail('Compose file', 'Compose file is missing.'));
      items.push(hasFile(ctx, /(^|\/)\.env\.example$/) ? pass('Compose env template', '.env.example exists.') : fail('Compose env template', '.env.example is missing.'));
      items.push(sourceIncludesAny(ctx, 'Compose env placeholders', [/\.env\.example|env_file|environment:/i]));
      items.push(sourceIncludesAny(ctx, 'Compose runtime service', [/services:/i, /ports:/i, /restart:/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    case 'T23':
      items.push(taskPrBranchItem(ctx, 'T23'));
      items.push(taskTouchedFilesItem(ctx, 'T23 manifest files', [/manifest|release/i, /^\.github\/workflows\//, /^SUBMISSION\.md$/]));
      items.push(sourceIncludesAny(ctx, 'Release manifest', [/release-manifest|manifest/i]));
      items.push(sourceIncludesAll(ctx, 'Manifest fields', [/commit/i, /artifact|image/i, /workflow|run/i, /deploy|deployedAt/i]));
      items.push(artifactEvidenceItem(ctx, 'Manifest artifact metadata', [/manifest|release/i]));
      return items;
    case 'T24':
      items.push(taskPrBranchItem(ctx, 'T24'));
      items.push(taskTouchedFilesItem(ctx, 'T24 Turnstile files', [/^team-site\/src\//, /^server\//, /^team-site\/server\//, /^\.github\/workflows\//, /turnstile|security|contact|auth/i]));
      items.push(forbiddenTextItem(ctx, forbiddenTurnstileSecretPattern, 'Turnstile secret browser exposure'));
      items.push(sourceIncludesAll(ctx, 'Turnstile protection integration', [/TURNSTILE_SITE_KEY/i, /TURNSTILE_SECRET_KEY/i, /turnstile/i]));
      items.push(sourceIncludesAny(ctx, 'Turnstile verification evidence', [/siteverify|verify|secretRedacted|cloudflare-turnstile|protected/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    case 'T20':
      items.push(taskPrBranchItem(ctx, 'T20'));
      items.push(taskTouchedFilesItem(ctx, 'T20 auth files', [/^team-site\/src\//, /^server\//, /^team-site\/server\//, /^\.github\/workflows\//, /auth|oauth|session/i]));
      items.push(forbiddenTextItem(ctx, forbiddenGoogleClientSecretPattern, 'Google client secret exposure'));
      items.push(sourceIncludesAll(ctx, 'Google OAuth server flow', [/auth\/google|GOOGLE_CLIENT_ID|oauth2|openid/i, /GOOGLE_CLIENT_SECRET/i, /callback/i]));
      items.push(sourceIncludesAll(ctx, 'OAuth state/session handling', [/state/i, /SESSION_SECRET|cookie|session/i, /logout|auth\/me/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    case 'T25':
      items.push(taskPrBranchItem(ctx, 'T25'));
      items.push(branchOrPrItem(ctx, 'T25'));
      items.push(taskTouchedFilesItem(ctx, 'T25 hotfix files', [/^team-site\//, /^SUBMISSION\.md$/, /hotfix|fix/i]));
      items.push(sourceIncludesAny(ctx, 'Hotfix evidence', [/hotfix|cherry-pick|T25|fix/i]));
      items.push(taskPrBodyItem(ctx, 'Cherry-pick evidence note', [/hotfix|cherry-pick|commit/i]));
      items.push(successfulRunItem(ctx, 'Build evidence', /ci|build/));
      return items;
    case 'T26':
      items.push(taskPrBranchItem(ctx, 'T26'));
      items.push(taskTouchedFilesItem(ctx, 'T26 recovery files', [/^\.github\/workflows\//, /^SUBMISSION\.md$/, /recovery|incident|deploy/i]));
      items.push(failedRunItem(ctx, 'Broken deploy evidence', /broken|deploy|incident/));
      items.push(successfulRunItem(ctx, 'Recovery success evidence', /deploy|recovery|fix/));
      items.push(taskPrBodyItem(ctx, 'Incident root-cause note', [/root cause|symptom|log/i, /recovery|rollback|fix/i]));
      return items;
    case 'T27':
      items.push(taskPrBranchItem(ctx, 'T27'));
      items.push(taskTouchedFilesItem(ctx, 'T27 secret cleanup files', [/^\.github\/workflows\//, /^SUBMISSION\.md$/, /secret|scan|incident|cleanup/i]));
      items.push(rawSecretScanItem(ctx));
      items.push(forbiddenTextItem(ctx, /DEPLOY_SPRINT_TEST_TOKEN_T23_DO_NOT_USE/, 'Seeded fake token cleanup'));
      items.push(sourceIncludesAny(ctx, 'Secret scan check', [/secret.?scan|gitleaks|trufflehog|detect-secrets|SECRET_LEAK|rg .*PRIVATE KEY/i]));
      items.push(successfulRunItem(ctx, 'Secret scan/build run', /secret|scan|ci|build/));
      return items;
    case 'T28':
      items.push(taskPrBranchItem(ctx, 'T28'));
      items.push(taskTouchedFilesItem(ctx, 'T28 idempotent deploy files', [/^\.github\/workflows\//, /deploy|script|lock|SUBMISSION\.md/i]));
      items.push(sourceIncludesAny(ctx, 'Race-safe deploy', [/concurrency:|flock|lock|mkdir .*lock|retry|idempotent/i]));
      items.push(sourceIncludesAny(ctx, 'Retry-safe operations', [/ln -sfn|mkdir -p|rm -f|docker rm -f|trap|retry|current/i]));
      items.push(successfulRunItem(ctx, 'Race-safe deploy evidence', /deploy|race|idempotent|lock/));
      return items;
    case 'T29':
      items.push(taskPrBranchItem(ctx, 'T29'));
      items.push(taskTouchedFilesItem(ctx, 'T29 recovery files', [/^\.github\/workflows\//, /^docs\//, /^SUBMISSION\.md$/, /recovery|restore/i]));
      items.push(sourceIncludesAny(ctx, 'Actions-only recovery', [/recovery|restore|known-good|workflow_dispatch/i]));
      items.push(sourceIncludesAny(ctx, 'No direct VPS recovery note', [/Actions only|GitHub Actions|deployer|deploy workflow/i]));
      items.push(successfulRunItem(ctx, 'Recovery workflow run', /recovery|restore|deploy/));
      return items;
    case 'T07':
      items.push(taskPrBranchItem(ctx, 'T07'));
      items.push(taskTouchedFilesItem(ctx, 'T07 weather files', [/^team-site\/src\//, /^server\//, /^team-site\/server\//, /^\.github\/workflows\//, /weather|status/i]));
      items.push(forbiddenTextItem(ctx, forbiddenOpenWeatherVitePattern, 'OpenWeather browser secret exposure'));
      items.push(sourceIncludesAll(ctx, 'OpenWeather runtime endpoint', [/OPENWEATHER_API_KEY/i, /openweather/i, /\/api\/weather|weather/i]));
      items.push(sourceIncludesAny(ctx, 'Weather status evidence', [/weather\.provider|provider.*openweather|openweather/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    case 'T10':
      items.push(taskPrBranchItem(ctx, 'T10'));
      items.push(taskTouchedFilesItem(ctx, 'T10 contact files', [/^team-site\/src\//, /^server\//, /^team-site\/server\//, /^\.github\/workflows\//, /contact|form/i]));
      items.push(sourceIncludesAll(ctx, 'Web3Forms integration', [/WEB3FORMS_ACCESS_KEY/i, /web3forms|api\.web3forms\.com/i, /contact|form/i]));
      items.push(sourceIncludesAny(ctx, 'Contact provider status evidence', [/provider.*web3forms|contact.*configured|accessKeyStoredInSecret/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    case 'T30':
      items.push(taskPrBranchItem(ctx, 'T30'));
      items.push(taskTouchedFilesItem(ctx, 'T30 monitoring files', [/^team-site\/src\//, /^\.github\/workflows\//, /sentry|monitoring|release/i]));
      items.push(packageDependencyItem(ctx, 'Sentry package dependency', [/@sentry\/react/i]));
      items.push(sourceIncludesAll(ctx, 'Sentry package or init', [/@sentry\/react|Sentry\.init/i, /SENTRY_DSN|VITE_SENTRY_DSN/i]));
      items.push(workflowIncludesAll(ctx, 'Sentry release workflow', [/SENTRY_AUTH_TOKEN|SENTRY_ORG|SENTRY_PROJECT/i]));
      items.push(sourceIncludesAny(ctx, 'Sentry release/status evidence', [/release|VITE_RELEASE_ID|Sentry\.setTag|monitoring/i]));
      items.push(rawSecretScanItem(ctx));
      return items;
    default:
      return [fail('Task id', `Unknown task id ${taskId}.`)];
  }
}

async function liveItems(ctx, taskId) {
  if (!['T01', 'T02', 'T15'].includes(taskId)) {
    return [];
  }
  const baseUrl = publicUrlForTask(taskId);
  const [home, health, status, featureFlags] = await Promise.all([
    fetchEvidence('/', baseUrl),
    fetchEvidence('/health', baseUrl),
    fetchEvidence('/status', baseUrl),
    taskId === 'T15' ? fetchEvidence('/config/feature-flags.json', baseUrl) : Promise.resolve({ ok: true, text: '{}', detail: 'not required' }),
  ]);
  const items = [
    home.ok ? pass('Live home', home.detail) : fail('Live home', home.detail),
    health.ok ? pass('Live health', health.detail) : fail('Live health', health.detail),
    status.ok && (taskId === 'T01' ? /T01|commit|sha|deploy|release/i.test(status.text) : /domain|assignedDomain|PUBLIC_URL|commit|deploy|release/i.test(status.text))
      ? pass('Live status', `/status returned ${taskId === 'T01' ? 'launch' : 'domain'} evidence.`)
      : fail('Live status', `${status.detail} Missing ${taskId === 'T01' ? 'T01/release' : 'domain'} metadata.`),
  ];

  if (taskId === 'T15') {
    const parsedStatus = parseJsonEvidence(status, 'T15 live status JSON');
    const parsedFlags = parseJsonEvidence(featureFlags, 'T15 feature flag config JSON');
    items.push(parsedStatus.item, parsedFlags.item);
    if (parsedStatus.value) {
      items.push(...t15StatusEvidenceItems(ctx, parsedStatus.value, parsedFlags.value));
    }
  }

  return items;
}

async function evaluateTask(run) {
  updateRun(run, 5, 'Preparing evaluator');
  const ctx = await loadContext(run);
  updateRun(run, 66, 'Checking human PR workflow evidence');
  const humanItems = await humanWorkflowItems(ctx, run.taskId);

  if (!humanGatePassed(humanItems)) {
    updateRun(run, 92, 'Skipping task checks until human workflow gate passes');
    const items = humanItems.length ? [...humanItems, skippedTechnicalChecksItem()] : [...ctx.contextItems, skippedTechnicalChecksItem()];
    run.items = items.map((item) => ({
      ...item,
      detail: sanitize(item.detail),
    }));
    run.status = summarize(run.items);
    run.progress = 100;
    run.message =
      run.status === 'failed'
        ? 'Human workflow gate failed; task implementation checks were skipped.'
        : 'Human workflow gate needs manual review before task implementation checks run.';
    run.finishedAt = new Date().toISOString();
    run.updatedAt = run.finishedAt;
    persistRuns();
    return;
  }

  updateRun(run, 72, 'Running task-specific checks and hidden probes');
  const items = [...humanItems, ...taskChecks(ctx, run.taskId), ...hiddenProbeItems(ctx, run.taskId)];

  if (run.taskId === 'T01') {
    updateRun(run, 82, 'Checking live site evidence');
    items.push(...(await liveItems(ctx, run.taskId)));
  }

  if (run.taskId === 'T02') {
    updateRun(run, 82, 'Checking DNS and domain evidence');
    items.push(...(await dnsItems()));
    items.push(...(await liveItems(ctx, run.taskId)));
  }

  if (run.taskId === 'T15') {
    updateRun(run, 82, 'Checking live feature flag evidence');
    items.push(...(await liveItems(ctx, run.taskId)));
  }

  updateRun(run, 92, 'Summarizing evidence');
  run.items = items.map((item) => ({
    ...item,
    detail: sanitize(item.detail),
  }));
  run.status = summarize(run.items);
  run.progress = 100;
  run.message =
    run.status === 'passed'
      ? 'Task passed automated evaluation.'
      : run.status === 'failed'
        ? 'Task failed one or more automated checks.'
        : 'Task needs organizer manual review.';
  run.finishedAt = new Date().toISOString();
  run.updatedAt = run.finishedAt;
  persistRuns();
}

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get('/api/bootstrap', (_req, res) => {
  res.json(bootstrapPayload());
});

app.post('/api/dns-portal/session', (req, res) => {
  const username = String(req.body?.username || '');
  const password = String(req.body?.password || '');
  const expectedUsername = getEnv('DNS_PORTAL_USERNAME', 'team01');
  const expectedPassword = getEnv('DNS_PORTAL_PASSWORD');

  if (!expectedPassword) {
    res.status(503).json({ error: 'DNS_PORTAL_PASSWORD is not configured on the portal server.' });
    return;
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    res.status(401).json({ error: 'Invalid DNS portal credentials.' });
    return;
  }

  const session = createDnsSession();
  res.status(201).json({
    token: session.token,
    expiresAt: new Date(session.expiresAt).toISOString(),
  });
});

app.get('/api/dns-portal/config', (req, res) => {
  const session = requireDnsSession(req, res);
  if (!session) {
    return;
  }

  const config = dnsConfig();
  res.json({
    zone: config.zone,
    teamLabel: config.teamLabel,
    suffix: config.suffix,
    assignedDomain: config.assignedDomain,
    publicUrl: config.publicUrl,
    ttl: config.ttl,
    tokenConfigured: config.tokenConfigured,
    expectedRecords: expectedDnsRecords(config),
  });
});

app.get('/api/dns-portal/records', async (req, res) => {
  const session = requireDnsSession(req, res);
  if (!session) {
    return;
  }

  try {
    const config = dnsConfig();
    const records = normalizeHostingerRecords(
      await hostingerRequest(`/api/dns/v1/zones/${encodeURIComponent(config.zone)}`),
    );
    res.json({
      records,
      expectedRecords: findMatchingRecords(records, expectedDnsRecords(config)),
    });
  } catch (error) {
    res.status(502).json({ error: sanitize(error.message) });
  }
});

app.post('/api/dns-portal/validate', async (req, res) => {
  const session = requireDnsSession(req, res);
  if (!session) {
    return;
  }

  try {
    const config = dnsConfig();
    const payload = dnsUpdatePayload(config);
    await hostingerRequest(`/api/dns/v1/zones/${encodeURIComponent(config.zone)}/validate`, {
      method: 'POST',
      body: payload,
    });
    res.json({
      status: 'valid',
      expectedRecords: expectedDnsRecords(config),
    });
  } catch (error) {
    res.status(422).json({ error: sanitize(error.message) });
  }
});

app.post('/api/dns-portal/apply', async (req, res) => {
  const session = requireDnsSession(req, res);
  if (!session) {
    return;
  }

  try {
    const config = dnsConfig();
    const payload = dnsUpdatePayload(config);
    await hostingerRequest(`/api/dns/v1/zones/${encodeURIComponent(config.zone)}/validate`, {
      method: 'POST',
      body: payload,
    });
    await hostingerRequest(`/api/dns/v1/zones/${encodeURIComponent(config.zone)}`, {
      method: 'PUT',
      body: payload,
    });
    const records = normalizeHostingerRecords(
      await hostingerRequest(`/api/dns/v1/zones/${encodeURIComponent(config.zone)}`),
    );
    const automation = await switchPublicUrlToDomain();
    res.json({
      status: 'applied',
      expectedRecords: findMatchingRecords(records, expectedDnsRecords(config)),
      automation,
      effectivePublicUrl: domainHttpsUrl(),
    });
  } catch (error) {
    res.status(502).json({ error: sanitize(error.message) });
  }
});

app.get('/api/checks', (_req, res) => {
  res.json([...runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicRun));
});

app.get('/api/checks/:runId', (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run) {
    res.status(404).json({ error: 'Run not found.' });
    return;
  }
  res.json(publicRun(run));
});

app.post('/api/checks', (req, res) => {
  const taskId = String(req.body?.taskId || '').toUpperCase();
  if (!TASK_IDS.has(taskId)) {
    res.status(400).json({ error: 'Unknown taskId.' });
    return;
  }

  const now = new Date().toISOString();
  const run = {
    id: crypto.randomUUID(),
    taskId,
    status: 'running',
    progress: 1,
    message: 'Check queued.',
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  runs.set(run.id, run);
  persistRuns();
  res.status(202).json(publicRun(run));

  evaluateTask(run).catch((error) => {
    run.status = 'manual_review';
    run.progress = 100;
    run.message = 'Evaluator crashed safely; organizer review required.';
    run.items = [review('Evaluator error', sanitize(error.stack || error.message))];
    run.finishedAt = new Date().toISOString();
    run.updatedAt = run.finishedAt;
    persistRuns();
  });
});

if (existsSync(DIST)) {
  app.use(
    express.static(DIST, {
      etag: false,
      lastModified: false,
      setHeaders(res) {
        res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      },
    }),
  );
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    const indexPath = path.join(DIST, 'index.html');
    try {
      const info = await stat(indexPath);
      if (info.isFile()) {
        res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath);
        return;
      }
    } catch {
      // Fall through to 404.
    }
    next();
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

await loadPersistedRuns();

app.listen(PORT, () => {
  console.log(`Deploy Sprint participant portal running on http://localhost:${PORT}`);
});
