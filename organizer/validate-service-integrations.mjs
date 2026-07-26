#!/usr/bin/env node

import { Buffer } from 'node:buffer';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const TASKS = [
  ['T01-launch-provided-website.md', 75, 65, 10],
  ['T02-connect-custom-domain.md', 35, 29, 6],
  ['T03-build-once-deploy-same-artifact.md', 30, 25, 5],
  ['T04-rollback-to-known-good-release.md', 30, 25, 5],
  ['T05-secret-and-config-separation.md', 20, 17, 3],
  ['T06-ci-gate-before-deployment.md', 20, 17, 3],
  ['T07-openweather-api-widget.md', 40, 32, 8],
  ['T08-rebase-organizer-feature.md', 20, 17, 3],
  ['T09-conflict-merge-with-both-outcomes.md', 20, 17, 3],
  ['T10-web3forms-contact-service.md', 40, 32, 8],
  ['T11-pull-request-preview-deployment.md', 30, 25, 5],
  ['T12-fast-dependency-pipeline.md', 30, 25, 5],
  ['T13-feature-bundle-with-tests.md', 30, 25, 5],
  ['T14-production-docker-image.md', 20, 17, 3],
  ['T15-runtime-feature-flag.md', 30, 25, 5],
  ['T16-resend-email-alerts.md', 40, 30, 10],
  ['T17-low-downtime-release-strategy.md', 40, 30, 10],
  ['T18-containerized-vps-deploy.md', 20, 17, 3],
  ['T19-post-deploy-smoke-tests.md', 30, 25, 5],
  ['T20-google-oauth-login.md', 40, 28, 12],
  ['T21-least-privilege-and-concurrency.md', 20, 17, 3],
  ['T22-compose-runtime-service.md', 40, 30, 10],
  ['T23-release-evidence-manifest.md', 30, 25, 5],
  ['T24-cloudflare-turnstile-protection.md', 40, 30, 10],
  ['T25-hotfix-cherry-pick-under-pressure.md', 30, 25, 5],
  ['T26-incident-broken-deploy-recovery.md', 40, 30, 10],
  ['T27-secret-leak-drill.md', 40, 30, 10],
  ['T28-race-safe-idempotent-deploy.md', 40, 30, 10],
  ['T29-disaster-recovery-from-actions-only.md', 40, 30, 10],
  ['T30-sentry-monitoring-release.md', 40, 30, 10],
];

const REQUIRED_SERVICE_TASKS = [
  'tasks/T02-connect-custom-domain.md',
  'tasks/T07-openweather-api-widget.md',
  'tasks/T10-web3forms-contact-service.md',
  'tasks/T16-resend-email-alerts.md',
  'tasks/T20-google-oauth-login.md',
  'tasks/T24-cloudflare-turnstile-protection.md',
  'tasks/T30-sentry-monitoring-release.md',
];

const REQUIRED_SECRETS = [
  'DNS_PORTAL_USERNAME',
  'DNS_PORTAL_PASSWORD',
  'DNS_TXT_VALUE',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
  'OPENWEATHER_API_KEY',
  'WEB3FORMS_ACCESS_KEY',
  'RESEND_API_KEY',
  'TURNSTILE_SECRET_KEY',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
];

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
  '.env',
  '.sh',
  '.Dockerfile',
]);

function parseArgs(argv) {
  const args = {
    docsOnly: false,
    ref: 'main',
    local: '.',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo') {
      args.repo = argv[++index];
    } else if (arg === '--ref') {
      args.ref = argv[++index];
    } else if (arg === '--url') {
      args.url = argv[++index]?.replace(/\/$/, '');
    } else if (arg === '--local') {
      args.local = argv[++index];
    } else if (arg === '--docs-only') {
      args.docsOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage() {
  return `Usage:
  node organizer/validate-service-integrations.mjs --docs-only
  node organizer/validate-service-integrations.mjs --url <PUBLIC_URL>
  GITHUB_TOKEN=... node organizer/validate-service-integrations.mjs --repo OWNER/REPO --url <PUBLIC_URL>

Options:
  --docs-only      Validate task docs and point totals only.
  --local PATH     Validate local repository path. Defaults to current directory.
  --repo OWNER/REPO
                   Validate source from GitHub API instead of local files.
  --ref REF        GitHub ref. Defaults to main.
  --url URL        Public site URL for live evidence checks.
`;
}

function pass(id, detail) {
  return { id, status: 'pass', detail };
}

function fail(id, detail) {
  return { id, status: 'fail', detail };
}

function warn(id, detail) {
  return { id, status: 'manual_review', detail };
}

async function readLocalFiles(root) {
  const files = new Map();

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).replaceAll(path.sep, '/');
      if (
        entry.isDirectory() &&
        !['.git', 'node_modules', 'dist', '.cache'].includes(entry.name)
      ) {
        await walk(full);
      } else if (entry.isFile()) {
        const info = await stat(full);
        if (info.size <= 1_000_000) {
          files.set(rel, await readFile(full, 'utf8'));
        }
      }
    }
  }

  await walk(root);
  return files;
}

async function githubRequest(pathname) {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${pathname}: ${body}`);
  }

  return response.json();
}

async function readGitHubFiles(repo, ref) {
  const branch = await githubRequest(`/repos/${repo}/branches/${encodeURIComponent(ref)}`);
  const treeSha = branch.commit.commit.tree.sha;
  const tree = await githubRequest(`/repos/${repo}/git/trees/${treeSha}?recursive=1`);
  const files = new Map();

  for (const item of tree.tree) {
    if (item.type !== 'blob' || item.size > 1_000_000) {
      continue;
    }
    const blob = await githubRequest(`/repos/${repo}/git/blobs/${item.sha}`);
    if (blob.encoding === 'base64') {
      files.set(item.path, Buffer.from(blob.content, 'base64').toString('utf8'));
    }
  }

  return files;
}

function isSourceLike(file) {
  if (file.startsWith('tasks/') || file.startsWith('organizer/')) {
    return false;
  }
  if (file.startsWith('.github/workflows/')) {
    return true;
  }
  if (file === 'package.json' || file === 'Dockerfile' || file === 'docker-compose.yml') {
    return true;
  }
  if (
    file.startsWith('team-site/') &&
    (
      ['package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml', 'compose.yml'].includes(file.slice('team-site/'.length)) ||
      file.startsWith('team-site/src/') ||
      file.startsWith('team-site/public/') ||
      file.startsWith('team-site/scripts/')
    )
  ) {
    return SOURCE_EXTENSIONS.has(path.extname(file)) || file.endsWith('Dockerfile');
  }
  if (file.startsWith('src/') || file.startsWith('server/') || file.startsWith('scripts/')) {
    return SOURCE_EXTENSIONS.has(path.extname(file));
  }
  return false;
}

function validateDocs(files) {
  const checks = [];
  let total = 0;
  let automatedTotal = 0;
  let judgeTotal = 0;

  for (const [name, expectedPoints, expectedAutomatedPoints, expectedJudgePoints] of TASKS) {
    const file = `tasks/${name}`;
    const text = files.get(file);
    if (!text) {
      checks.push(fail(`task-${name}`, `${file} is missing.`));
      continue;
    }

    const points = Number(text.match(/^- Points:\s*(\d+)$/m)?.[1]);
    const automatedPoints = Number(text.match(/^- Automated Points:\s*(\d+)$/m)?.[1]);
    const judgePoints = Number(text.match(/^- Judge Points:\s*(\d+)$/m)?.[1]);
    total += Number.isFinite(points) ? points : 0;
    automatedTotal += Number.isFinite(automatedPoints) ? automatedPoints : 0;
    judgeTotal += Number.isFinite(judgePoints) ? judgePoints : 0;

    if (points === expectedPoints) {
      checks.push(pass(`points-${name}`, `${file} has ${expectedPoints} total points.`));
    } else {
      checks.push(fail(`points-${name}`, `${file} expected ${expectedPoints} total points, found ${points || 'missing'}.`));
    }

    if (automatedPoints === expectedAutomatedPoints) {
      checks.push(pass(`automated-points-${name}`, `${file} has ${expectedAutomatedPoints} automated points.`));
    } else {
      checks.push(fail(`automated-points-${name}`, `${file} expected ${expectedAutomatedPoints} automated points, found ${automatedPoints || 'missing'}.`));
    }

    if (judgePoints === expectedJudgePoints) {
      checks.push(pass(`judge-points-${name}`, `${file} has ${expectedJudgePoints} judge points.`));
    } else {
      checks.push(fail(`judge-points-${name}`, `${file} expected ${expectedJudgePoints} judge points, found ${judgePoints || 'missing'}.`));
    }

    if (points === automatedPoints + judgePoints) {
      checks.push(pass(`point-split-${name}`, `${file} total equals automated plus judge points.`));
    } else {
      checks.push(fail(`point-split-${name}`, `${file} total does not equal automated plus judge points.`));
    }

    for (const section of ['## What Organizers Provide', '## Participant Setup Steps', '## Independence / Fallback Evidence', '## Judge Scoring Guidance', '## Organizer / Tester Notes', '### Beginner Test Walkthrough (Organizer Only)']) {
      if (text.includes(section)) {
        checks.push(pass(`section-${name}-${section}`, `${file} includes ${section}.`));
      } else {
        checks.push(fail(`section-${name}-${section}`, `${file} is missing ${section}.`));
      }
    }
  }

  if (total === 1000) {
    checks.push(pass('total-points', 'Task point total is 1000.'));
  } else {
    checks.push(fail('total-points', `Task point total is ${total}, expected 1000.`));
  }

  if (automatedTotal === 800) {
    checks.push(pass('total-automated-points', 'Automated point total is 800.'));
  } else {
    checks.push(fail('total-automated-points', `Automated point total is ${automatedTotal}, expected 800.`));
  }

  if (judgeTotal === 200) {
    checks.push(pass('total-judge-points', 'Judge point total is 200.'));
  } else {
    checks.push(fail('total-judge-points', `Judge point total is ${judgeTotal}, expected 200.`));
  }

  for (const file of REQUIRED_SERVICE_TASKS) {
    checks.push(files.has(file) ? pass(`service-task-${file}`, `${file} exists.`) : fail(`service-task-${file}`, `${file} is missing.`));
  }

  return checks;
}

function validateSource(files) {
  const checks = [];
  const sourceEntries = [...files.entries()].filter(([file]) => isSourceLike(file));
  const workflowText = sourceEntries
    .filter(([file]) => file.startsWith('.github/workflows/'))
    .map(([, text]) => text)
    .join('\n');
  const sourceText = sourceEntries.map(([file, text]) => `\n# ${file}\n${text}`).join('\n');

  for (const secret of REQUIRED_SECRETS) {
    if (sourceText.includes(`secrets.${secret}`) || sourceText.includes(secret)) {
      checks.push(pass(`secret-reference-${secret}`, `${secret} is referenced by source or workflows.`));
    } else {
      checks.push(warn(`secret-reference-${secret}`, `${secret} is not referenced yet. This is expected before the task is attempted.`));
    }
  }

  if (/VITE_OPENWEATHER_API_KEY/.test(sourceText)) {
    checks.push(fail('forbidden-vite-openweather', 'VITE_OPENWEATHER_API_KEY appears in source/workflows.'));
  } else {
    checks.push(pass('forbidden-vite-openweather', 'VITE_OPENWEATHER_API_KEY is not used in source/workflows.'));
  }

  if (/VITE_GOOGLE_CLIENT_SECRET/.test(sourceText)) {
    checks.push(fail('forbidden-vite-google-client-secret', 'VITE_GOOGLE_CLIENT_SECRET appears in source/workflows.'));
  } else {
    checks.push(pass('forbidden-vite-google-client-secret', 'VITE_GOOGLE_CLIENT_SECRET is not used in source/workflows.'));
  }

  if (/VITE_RESEND_API_KEY/.test(sourceText)) {
    checks.push(fail('forbidden-vite-resend', 'VITE_RESEND_API_KEY appears in source/workflows.'));
  } else {
    checks.push(pass('forbidden-vite-resend', 'VITE_RESEND_API_KEY is not used in source/workflows.'));
  }

  if (/VITE_TURNSTILE_SECRET_KEY/.test(sourceText)) {
    checks.push(fail('forbidden-vite-turnstile-secret', 'VITE_TURNSTILE_SECRET_KEY appears in source/workflows.'));
  } else {
    checks.push(pass('forbidden-vite-turnstile-secret', 'VITE_TURNSTILE_SECRET_KEY is not used in source/workflows.'));
  }

  const googleSecretPattern = /GOCSPX-[A-Za-z0-9_-]{10,}/;
  if (googleSecretPattern.test(sourceText)) {
    checks.push(fail('raw-google-client-secret', 'A Google OAuth client secret-like value appears in source/workflows.'));
  } else {
    checks.push(pass('raw-google-client-secret', 'No Google OAuth client secret-like value found in source/workflows.'));
  }

  const rawPortalPasswordPattern = /DNS_PORTAL_PASSWORD\s*[:=]\s*(?!\$\{\{\s*secrets\.DNS_PORTAL_PASSWORD\s*\}\})(?!<)[^\s'"]{8,}/;
  if (rawPortalPasswordPattern.test(sourceText)) {
    checks.push(fail('raw-dns-portal-password', 'A DNS portal password-like assignment appears in source/workflows.'));
  } else {
    checks.push(pass('raw-dns-portal-password', 'No raw DNS portal password assignment found in source/workflows.'));
  }

  const privateKeyPattern = /-----BEGIN (?:OPENSSH|RSA|EC|DSA) PRIVATE KEY-----/;
  if (privateKeyPattern.test(sourceText)) {
    checks.push(fail('private-key-block', 'A private key block appears in source/workflows.'));
  } else {
    checks.push(pass('private-key-block', 'No private key block found in source/workflows.'));
  }

  if (/DNS_PORTAL_|ASSIGNED_DOMAIN|domain\.connected|dns/i.test(sourceText)) {
    checks.push(pass('dns-domain-source', 'DNS/domain source/workflow markers found.'));
  } else {
    checks.push(warn('dns-domain-source', 'DNS/domain source/workflow markers not found yet.'));
  }

  if (/GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|SESSION_SECRET|auth\.provider=google|auth\/google|openid email profile/i.test(sourceText)) {
    checks.push(pass('google-oauth-source', 'Google OAuth source/workflow markers found.'));
  } else {
    checks.push(warn('google-oauth-source', 'Google OAuth source/workflow markers not found yet.'));
  }

  if (/OPENWEATHER_API_KEY/.test(sourceText) && /openweather/i.test(sourceText)) {
    checks.push(pass('openweather-source', 'OpenWeather source/workflow markers found.'));
  } else {
    checks.push(warn('openweather-source', 'OpenWeather source/workflow markers not found yet.'));
  }

  if (/WEB3FORMS_ACCESS_KEY|api\.web3forms\.com\/submit|web3forms/i.test(sourceText)) {
    checks.push(pass('web3forms-source', 'Web3Forms source/workflow markers found.'));
  } else {
    checks.push(warn('web3forms-source', 'Web3Forms source/workflow markers not found yet.'));
  }

  if (/RESEND_API_KEY|resend/i.test(sourceText) && /email|alert/i.test(sourceText)) {
    checks.push(pass('resend-source', 'Resend email source/workflow markers found.'));
  } else {
    checks.push(warn('resend-source', 'Resend email source/workflow markers not found yet.'));
  }

  if (/TURNSTILE_SITE_KEY|TURNSTILE_SECRET_KEY|turnstile/i.test(sourceText) && /siteverify|verify|token/i.test(sourceText)) {
    checks.push(pass('turnstile-source', 'Turnstile source/workflow markers found.'));
  } else {
    checks.push(warn('turnstile-source', 'Turnstile source/workflow markers not found yet.'));
  }

  const packageJson = files.get('package.json') || '';
  if (packageJson.includes('@sentry/react')) {
    checks.push(pass('sentry-package', 'package.json includes @sentry/react.'));
  } else {
    checks.push(warn('sentry-package', 'package.json does not include @sentry/react yet.'));
  }

  if (/@sentry\/react|Sentry\.init/.test(sourceText)) {
    checks.push(pass('sentry-init', 'Sentry initialization marker found.'));
  } else {
    checks.push(warn('sentry-init', 'Sentry initialization marker not found yet.'));
  }

  for (const secret of ['DNS_PORTAL_PASSWORD', 'DNS_TXT_VALUE', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET', 'OPENWEATHER_API_KEY', 'WEB3FORMS_ACCESS_KEY', 'RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT']) {
    if (workflowText.includes(secret)) {
      checks.push(pass(`workflow-${secret}`, `${secret} is referenced in a workflow.`));
    } else {
      checks.push(warn(`workflow-${secret}`, `${secret} is not referenced in workflows yet.`));
    }
  }

  return checks;
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

async function validateLive(url) {
  if (!url) {
    return [warn('live-url', 'No --url supplied; skipped live public evidence checks.')];
  }

  const checks = [];
  const status = await fetchText(`${url}/status`).catch((error) => ({ ok: false, status: 0, text: String(error) }));
  const health = await fetchText(`${url}/health`).catch((error) => ({ ok: false, status: 0, text: String(error) }));
  const weather = await fetchText(`${url}/api/weather`).catch((error) => ({ ok: false, status: 0, text: String(error) }));

  checks.push(health.ok ? pass('live-health', '/health returned success.') : fail('live-health', `/health failed with ${health.status}.`));
  checks.push(status.ok ? pass('live-status', '/status returned success.') : fail('live-status', `/status failed with ${status.status}.`));

  const statusText = status.text.toLowerCase();
  if (statusText.includes('domain.connected') || statusText.includes('assigneddomain') || statusText.includes('assigned_domain')) {
    checks.push(pass('live-domain-status', '/status includes domain connection evidence.'));
  } else {
    checks.push(warn('live-domain-status', '/status does not include domain connection evidence.'));
  }

  if (statusText.includes('auth.provider') || statusText.includes('google')) {
    checks.push(pass('live-google-auth-status', '/status includes Google auth evidence.'));
  } else {
    checks.push(warn('live-google-auth-status', '/status does not include Google auth evidence.'));
  }

  if (statusText.includes('openweather')) {
    checks.push(pass('live-openweather-status', '/status includes OpenWeather evidence.'));
  } else {
    checks.push(warn('live-openweather-status', '/status does not include OpenWeather evidence.'));
  }

  if (statusText.includes('web3forms') || statusText.includes('contact.provider')) {
    checks.push(pass('live-web3forms-status', '/status includes Web3Forms/contact evidence.'));
  } else {
    checks.push(warn('live-web3forms-status', '/status does not include Web3Forms/contact evidence.'));
  }

  if (statusText.includes('sentry') || statusText.includes('monitoring.provider')) {
    checks.push(pass('live-sentry-status', '/status includes Sentry evidence.'));
  } else {
    checks.push(warn('live-sentry-status', '/status does not include Sentry evidence.'));
  }

  if (weather.ok && weather.text.toLowerCase().includes('openweather')) {
    checks.push(pass('live-weather-endpoint', '/api/weather returned OpenWeather evidence.'));
  } else {
    checks.push(warn('live-weather-endpoint', '/api/weather did not return OpenWeather evidence.'));
  }

  return checks;
}

function printChecks(checks) {
  for (const check of checks) {
    const icon = check.status === 'pass' ? 'PASS' : check.status === 'fail' ? 'FAIL' : 'REVIEW';
    console.log(`${icon} ${check.id}: ${check.detail}`);
  }
  const failed = checks.filter((check) => check.status === 'fail').length;
  const review = checks.filter((check) => check.status === 'manual_review').length;
  console.log(`\nSummary: ${checks.length - failed - review} passed, ${review} manual review, ${failed} failed.`);
  return failed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const files = args.repo
    ? await readGitHubFiles(args.repo, args.ref)
    : await readLocalFiles(path.resolve(args.local));

  const checks = [
    ...validateDocs(files),
    ...(args.docsOnly ? [] : validateSource(files)),
    ...(args.docsOnly ? [] : await validateLive(args.url)),
  ];

  const failed = printChecks(checks);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
