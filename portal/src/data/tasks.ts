export type CredentialField = {
  key: string;
  label: string;
  secret?: boolean;
};

export type Snippet = {
  label: string;
  language: string;
  content: string;
};

export type SnippetPack = {
  title: string;
  description: string;
  snippets: Snippet[];
  requiredMarkers: string[];
  forbiddenMarkers: string[];
};

export type Task = {
  id: string;
  title: string;
  release: string;
  level: 'Easy' | 'Medium' | 'Hard';
  points: number;
  automatedPoints: number;
  judgePoints: number;
  expectedBranch: string;
  expectedPrTitle: string;
  summary: string;
  organizerProvides: CredentialField[];
  requiredSecrets: string[];
  setupSteps: string[];
  deliverables: string[];
  acceptanceEvidence: string[];
  fallbackEvidence: string[];
  checkCriteria: string[];
  debugChallenge?: string[];
  requiresHumanWorkflow: true;
  snippetPack?: SnippetPack;
  interactionProof: string[];
};

type TaskDefinition = Omit<Task, 'requiresHumanWorkflow' | 'snippetPack' | 'interactionProof'> & {
  snippetPack?: SnippetPack;
  interactionProof?: string[];
};

export const hackathonRules = [
  'Work only in your assigned private repository and submit changes through pull requests into main.',
  'Deployments to the assigned VPS must happen through GitHub Actions. Direct VPS login or manual production edits are not allowed for scoring.',
  'Use one task branch and one PR per task. Every scored task requires a merged PR into main.',
  'Every task PR must have at least one approving review from another repository collaborator after the final commit.',
  'The PR author, reviewer, and merger must be real non-bot repository collaborators. Bot, app, or known agent actors receive zero automated points.',
  'AI assistants may be used for learning, suggestions, and drafting, but they must not be commit authors, co-authors, pushers, reviewers, or mergers for scored work.',
  'Your team must validate the code, run the checks, write the final commits, push the branch, review the PR, and merge it using human team-member accounts.',
  'The VPS SSH private key is never shown to participants. Deployment credentials are organizer-controlled and may only be used by an approved deployment job or deployer service.',
  'GitHub Secrets, SSH keys, OAuth secrets, DNS portal passwords, API keys, and tokens must never be committed, printed in logs, or pasted into public screenshots.',
  'Tasks are independent. T01 is the live launch task, but teams may work on other tasks before T01 is complete using that task’s fallback evidence.',
  'Automated checks score repository, workflow, artifact, live-site, DNS, and source-hygiene evidence. Judges award separate task marks for explanation, ownership, review quality, and safety.',
  'Provided snippets may be adapted, but teams must place, review, explain, and verify the code themselves.',
  'Leftover AI/agent markers, fabricated evidence, unsafe workflows, exposed secrets, direct VPS access attempts, or agent-owned GitHub activity can lose all task points.',
];

const commonDeliverables = [
  'Merged PR into main with the expected title.',
  'Approving review from another repository collaborator after the final commit.',
  'Merge performed by a non-bot repository collaborator.',
  'Passing build or workflow evidence for the scored commit.',
  'Short verification note in the PR body or SUBMISSION.md.',
];

const commonFallback = [
  'If live deployment is unavailable, provide PR, workflow, artifact, manifest, dry-run log, or source-scan evidence listed for the task.',
  'Fallback evidence must still map to the scored commit and must not expose secret values.',
];

const forbiddenOpenWeatherViteKey = ['VITE', 'OPENWEATHER_API_KEY'].join('_');
const forbiddenGoogleClientSecretKey = ['VITE', 'GOOGLE_CLIENT_SECRET'].join('_');
const forbiddenTurnstileSecretKey = ['VITE', 'TURNSTILE_SECRET_KEY'].join('_');

const defaultInteractionProof = [
  'PR author is a repository collaborator.',
  'A different collaborator approved after the latest commit.',
  'A non-bot collaborator merged the PR into main.',
  'PR body explains where provided snippets were placed and how they were verified.',
];

function snippetPack(id: string, title: string, content: string, language = 'yaml'): SnippetPack {
  return {
    title: `${id} - ${title}`,
    description:
      'Use this as a starting point only. You must decide the correct file/location, adapt it to your repo, test it, open a PR, get review, and merge through a real team member.',
    snippets: [
      {
        label: `${id} starter snippet`,
        language,
        content,
      },
    ],
    requiredMarkers: [id],
    forbiddenMarkers: [
      'SNIPPET_PLACEHOLDER_DO_NOT_LEAVE',
      'AI-REVIEW-MARKER',
      'AI-AGENT-MARKER',
      'AI-DATA-MARKER',
      'PR-AGENT-MARKER',
      'AI-PR-EVIDENCE-MARKER',
    ],
  };
}

const snippetPacks: Record<string, SnippetPack> = {
  T01: snippetPack('T01', 'Deploy workflow and status files', `name: Deploy Team Site
on:
  workflow_dispatch:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: team-site/package-lock.json
      - run: npm ci
        working-directory: team-site
      - run: npm run build
        working-directory: team-site
      - name: Write safe status evidence
        run: |
          mkdir -p team-site/dist/status team-site/dist/health
          printf 'ok' > team-site/dist/health/index.html
          printf '{"task":"T01","commit":"%s"}' "$GITHUB_SHA" > team-site/dist/status/index.html`),
  T06: snippetPack('T06', 'CI gate workflow', `name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: team-site/package-lock.json
      - run: npm ci
        working-directory: team-site
      - run: npm run build
        working-directory: team-site
      - uses: actions/upload-artifact@v4
        with:
          name: site-dist-\${{ github.sha }}
          path: team-site/dist`),
  T03: snippetPack('T03', 'Artifact reuse deploy step', `- uses: actions/download-artifact@v4
  with:
    name: site-dist-\${{ github.sha }}
    path: ./release-candidate
- name: Record artifact identity
  run: |
    printf '{"task":"T03","artifact":"site-dist-%s"}' "$GITHUB_SHA" > release-candidate/artifact.json`),
  T04: snippetPack('T04', 'Rollback dispatch input', `on:
  workflow_dispatch:
    inputs:
      release_ref:
        description: Known-good tag, SHA, or artifact id
        required: true
jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Resolve rollback target
        run: |
          echo "T04 rollback requested"
          test -n "\${{ inputs.releaseRef }}"
          echo "release_ref=\${{ inputs.releaseRef }}" >> "$GITHUB_STEP_SUMMARY"`),
  T05: snippetPack('T05', 'Runtime config evidence', `const runtimeConfig = {
  task: 'T05',
  publicUrlConfigured: Boolean(process.env.PUBLIC_URL || import.meta.env.VITE_PUBLIC_URL),
  secretsRedacted: true,
};
console.log(JSON.stringify(runtimeConfig));`, 'ts'),
  T11: snippetPack('T11', 'PR preview artifact', `name: PR Preview
on:
  pull_request:
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "T11 preview for PR #\${{ github.event.pull_request.number }}" >> "$GITHUB_STEP_SUMMARY"`),
  T12: snippetPack('T12', 'Lockfile npm cache', `- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
    cache-dependency-path: team-site/package-lock.json
- run: npm ci
  working-directory: team-site`),
  T13: snippetPack('T13', 'Feature validation marker', `export const releaseReadinessTask = {
  task: 'T13',
  source: 'provided-feature-bundle',
  markerRemoved: true,
};`, 'ts'),
  T14: snippetPack('T14', 'Production Dockerfile shape', `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html`),
  T17: snippetPack('T17', 'Release directory switch', `set -euo pipefail
release_dir="releases/$GITHUB_SHA"
mkdir -p "$release_dir"
echo "T17 candidate release $release_dir"
# Health-check candidate before switching current symlink.
ln -sfn "$release_dir" current`),
  T18: snippetPack('T18', 'Container deploy request marker', `- name: Build container image
  run: |
    docker build -t deploy-sprint/team-site:$GITHUB_SHA team-site`),
  T15: snippetPack('T15', 'Runtime feature flag', `export function featureFlags() {
  return {
    task: 'T15',
    showInsights: process.env.FEATURE_SHOW_INSIGHTS === 'true',
    valueRedacted: true,
  };
}`, 'ts'),
  T16: snippetPack('T16', 'Resend email alert status', `const emailStatus = {
  task: 'T16',
  provider: 'resend',
  configured: Boolean(process.env.RESEND_API_KEY),
  secretRedacted: true,
};`, 'ts'),
  T19: snippetPack('T19', 'Smoke test script', `set -euo pipefail
base_url="\${PUBLIC_URI:?PUBLIC_URI required}"
curl --fail "$base_url/"
curl --fail "$base_url/health"
curl --fail "$base_url/status"
echo "T19 smoke tests passed"`),
  T21: snippetPack('T21', 'Workflow safety controls', `permissions:
  contents: read
  actions: read
concurrency:
  group: deploy-\${{ github.ref }}
  cancel-in-progress: false`),
  T22: snippetPack('T22', 'Compose service template', `services:
  team-site:
    image: deploy-sprint/team-site:\${APP_VERSION}
    restart: unless-stopped
    ports:
      - "\${APP_PORT}:80"
    env_file:
      - .env`),
  T23: snippetPack('T23', 'Release manifest generator', `node -e "console.log(JSON.stringify({
  task: 'T23',
  commit: process.env.GITHUB_SHA,
  workflowRun: process.env.GITHUB_RUN_ID,
  deployedAt: new Date().toISOString()
}))" > release-manifest.json`),
  T24: snippetPack('T24', 'Turnstile protection status', `export const turnstileStatus = {
  task: 'T24',
  provider: 'cloudflare-turnstile',
  siteKeyPublic: true,
  secretKeyServerOnly: Boolean(process.env.TURNSTILE_SECRET_KEY),
  secretRedacted: true,
};`, 'ts'),
  T20: snippetPack('T20', 'Google OAuth route shape', `app.get('/auth/google', startGoogleLogin);
app.get('/auth/google/callback', async (req, res) => {
  // T20: verify state, exchange code server-side, create session.
  res.json({ provider: 'google', ready: true, secretExposed: false });
});`, 'js'),
  T26: snippetPack('T26', 'Broken deploy recovery starter', `- name: Prepare recovery request
  run: |
    test -n "\${RECOVERY_REF:?RECOVERY_REF required}"
    printf '{"task":"T26","recovery_ref":"%s"}\\n' "$RECOVERY_REF" > recovery-request.json
- name: Record recovery attempt
  run: echo "T26 incident recovery through Actions"`),
  T27: snippetPack('T27', 'Secret scan command', `if rg '-----BEGIN .*PRIVATE KEY-----|github_pat_|ghp_|GOCSPX-' .; then
  echo "T27 secret pattern found"
  exit 1
fi
echo "T27 secret scan passed"`),
  T28: snippetPack('T28', 'Deploy lock pattern', `lock_dir="/tmp/deploy-sprint-team.lock"
if ! mkdir "$lock_dir"; then
  echo "T28 another deploy is running"
  exit 1
fi
trap 'rmdir "$lock_dir"' EXIT`),
  T29: snippetPack('T29', 'Actions-only recovery dispatch', `on:
  workflow_dispatch:
    inputs:
      recovery_ref:
        required: true
jobs:
  recover:
    runs-on: ubuntu-latest
    steps:
      - run: echo "T29 restore \${{ inputs.recovery_ref }} through Actions only"`),
  T07: snippetPack('T07', 'OpenWeather status writer', `const weatherStatus = {
  task: 'T07',
  provider: 'openweather',
  city: process.env.OPENWEATHER_CITY,
  keyExposed: false,
};`, 'ts'),
  T10: snippetPack('T10', 'Web3Forms contact marker', `export const contactProvider = {
  task: 'T10',
  provider: 'web3forms',
  accessKeyStoredInSecret: true,
};`, 'ts'),
  T30: snippetPack('T30', 'Sentry release marker', `import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_RELEASE_ID,
});
console.info('T30 Sentry initialized without exposing auth token');`, 'ts'),
};

const taskDefinitions: TaskDefinition[] = [
  {
    id: 'T01',
    title: 'Launch Provided Website',
    release: '00:00',
    level: 'Easy',
    points: 75,
    automatedPoints: 65,
    judgePoints: 10,
    expectedBranch: 'task/T01-launch-provided-website',
    expectedPrTitle: '[T01] Launch Provided Website',
    summary:
      'Make the provided website live on the assigned VPS using GitHub Actions only, with health and status evidence.',
    organizerProvides: [
      { key: 'VPS_HOST', label: 'VPS host or IP' },
      { key: 'VPS_PORT', label: 'SSH port' },
      { key: 'VPS_USER', label: 'SSH user' },
      { key: 'DEPLOY_PATH', label: 'Deploy path' },
      { key: 'APP_PORT', label: 'App port' },
      { key: 'IP_PUBLIC_URL', label: 'Raw IP public URL' },
      { key: 'PUBLIC_URL', label: 'Current evaluator URL' },
    ],
    requiredSecrets: [],
    setupSteps: [
      'Do not ask for or create any VPS SSH private key. Organizers control the deployment credential.',
      'Create a deploy workflow/request that installs dependencies in team-site/, builds the app from team-site/, and hands the artifact to the approved deploy job or deployer service.',
      'Deploy team-site/dist to DEPLOY_PATH and serve it on APP_PORT through the raw IP URL.',
      'Expose /health with HTTP 200 and /status with team, commit SHA, release ID, deploy time, and T01 marker.',
      'Run the workflow from GitHub Actions and verify the live URL in a browser.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: [
      'IP_PUBLIC_URL returns HTTP 200.',
      '/health returns HTTP 200.',
      '/status includes team name, commit SHA, release ID, deploy time, and T01 marker.',
      'The successful deploy workflow run maps to the same commit shown on the live site.',
    ],
    fallbackEvidence: ['T01 final scoring requires the assigned VPS site to be live. Dry-run evidence is rehearsal only.'],
    checkCriteria: [
      'Required deployment secrets exist in GitHub secret metadata.',
      'A deploy workflow exists and has a successful main-branch run.',
      'Live /health and /status respond and include current commit evidence.',
    ],
  },
  {
    id: 'T02',
    title: 'Connect Custom Domain',
    release: '00:00',
    level: 'Medium',
    points: 35,
    automatedPoints: 29,
    judgePoints: 6,
    expectedBranch: 'task/T02-connect-custom-domain',
    expectedPrTitle: '[T02] Connect Custom Domain',
    summary: 'Use the DNS portal to connect the assigned subdomain, enable HTTPS automatically, and prove HTTP/IP compatibility still works.',
    organizerProvides: [
      { key: 'DNS_PORTAL_URL', label: 'DNS portal URL' },
      { key: 'DNS_PORTAL_USERNAME', label: 'DNS portal username' },
      { key: 'DNS_PORTAL_PASSWORD', label: 'DNS portal password', secret: true },
      { key: 'ASSIGNED_DOMAIN', label: 'Assigned domain' },
      { key: 'DNS_RECORD_TYPE', label: 'Record type' },
      { key: 'DNS_RECORD_NAME', label: 'Record name' },
      { key: 'DNS_RECORD_VALUE', label: 'Record value' },
      { key: 'DNS_TXT_NAME', label: 'TXT record name' },
      { key: 'DNS_TXT_VALUE', label: 'TXT record value', secret: true },
      { key: 'DOMAIN_PUBLIC_URL', label: 'Assigned domain URL' },
      { key: 'IP_PUBLIC_URL', label: 'Raw IP URL' },
    ],
    requiredSecrets: ['DNS_PORTAL_USERNAME', 'DNS_PORTAL_PASSWORD', 'DNS_TXT_VALUE'],
    setupSteps: [
      'Log in to the organizer DNS portal with the provided credentials.',
      'Create the assigned A or CNAME record.',
      'Create the TXT verification record exactly as provided.',
      'Use the DNS portal Create Records action. It updates Hostinger records, switches repo/deployer public URL variables to the HTTPS domain, and enables deployer TLS.',
      'Verify with DNS lookup, HTTPS domain evidence, HTTP domain evidence, and raw IP HTTP evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: [
      'Domain resolves to the expected target.',
      'TXT verification record exists.',
      'HTTPS domain responds successfully.',
      'Plain HTTP domain still responds successfully.',
      'Raw IP HTTP still responds successfully.',
      'Site or manifest shows domain.connected=true.',
    ],
    fallbackEvidence: ['Portal export, DNS lookup logs, and host-header dry-run evidence are valid if live DNS is still propagating.'],
    checkCriteria: ['DNS lookup resolves assigned records, HTTPS/HTTP/IP routes respond, and source has no portal credential leaks.'],
  },
  {
    id: 'T03',
    title: 'Build Once Deploy Same Artifact',
    release: '00:00',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T03-build-once-deploy-same-artifact',
    expectedPrTitle: '[T03] Build Once Deploy Same Artifact',
    summary: 'Ensure deploy reuses the exact CI artifact instead of rebuilding during deployment.',
    organizerProvides: [{ key: 'EXPECTED_ARTIFACT_NAME', label: 'Artifact naming pattern' }],
    requiredSecrets: [],
    setupSteps: [
      'Create a build job that uploads the team-site/dist artifact.',
      'Make the deploy or dry-run deploy job download that artifact.',
      'Record the artifact name or digest in /status or a release manifest.',
      'Avoid running npm run build again in the deploy job.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Workflow downloads the CI artifact during deploy.', 'Status or manifest records artifact identity.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow includes upload-artifact and download-artifact evidence and avoids rebuild in deploy.'],
  },
  {
    id: 'T04',
    title: 'Rollback To Known-Good Release',
    release: '00:30',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T04-rollback-to-known-good-release',
    expectedPrTitle: '[T04] Rollback To Known-Good Release',
    summary: 'Add a manual rollback workflow that redeploys a known-good release reference.',
    organizerProvides: [{ key: 'ROLLBACK_RELEASE_REF', label: 'Known-good release ref' }],
    requiredSecrets: [],
    setupSteps: [
      'Add workflow_dispatch to a rollback workflow.',
      'Accept release_ref as an input.',
      'Fetch or download the known-good release artifact/tag.',
      'Run the workflow through GitHub Actions, inspect the log output, and refine it until the selected release is used correctly.',
      'Run the rollback workflow and record evidence in the workflow summary or manifest.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: [
      'Rollback workflow has a release_ref input.',
      'Actions history shows the validation run sequence and the final successful rollback run.',
      'Rollback run or artifact proves known-good redeploy.',
    ],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow supports workflow_dispatch and release_ref, includes diagnostic run evidence, and has successful rollback evidence.'],
    debugChallenge: [
      'Run the starter workflow from Actions and preserve the run link.',
      'Use the Actions log to confirm which release value the workflow actually used.',
      'Rerun after your changes and mention the decisive log line in the PR.',
    ],
  },
  {
    id: 'T05',
    title: 'Secret And Config Separation',
    release: '00:30',
    level: 'Easy',
    points: 20,
    automatedPoints: 17,
    judgePoints: 3,
    expectedBranch: 'task/T05-secret-and-config-separation',
    expectedPrTitle: '[T05] Secret And Config Separation',
    summary: 'Move runtime config to env/secrets and remove committed sensitive values.',
    organizerProvides: [{ key: 'PUBLIC_URL', label: 'Current safe public URL' }],
    requiredSecrets: ['PUBLIC_URL'],
    setupSteps: [
      'Identify config that should come from GitHub Secrets or runtime env.',
      'Replace committed config values with placeholders or safe defaults.',
      'Reference secret names in workflows without printing values.',
      'Show redacted config evidence in /status or a generated manifest.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Config values come from env or GitHub Secrets.', 'No raw secret-like values are committed.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Source scan has no private keys or token-like values and workflow references secret names.'],
  },
  {
    id: 'T06',
    title: 'CI Gate Before Deployment',
    release: '00:30',
    level: 'Easy',
    points: 20,
    automatedPoints: 17,
    judgePoints: 3,
    expectedBranch: 'task/T06-ci-gate-before-deployment',
    expectedPrTitle: '[T06] CI Gate Before Deployment',
    summary: 'Create a CI gate for PRs and main that installs from the team-site lockfile, builds, and uploads team-site/dist.',
    organizerProvides: [{ key: 'NODE_VERSION', label: 'Node version' }],
    requiredSecrets: [],
    setupSteps: [
      'Add or update a workflow that runs on pull_request and push to main.',
      'Use Node 20, npm ci, and npm run build inside team-site/.',
      'Upload team-site/dist as an artifact named with the commit SHA.',
      'If a deploy workflow exists, make deployment depend on this build result.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Passing CI workflow on main or PR.', 'team-site/dist artifact uploaded from the build job.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow uses Node 20, npm ci, npm run build, upload-artifact, and has a successful run.'],
  },
  {
    id: 'T08',
    title: 'Rebase Organizer Feature',
    release: '01:00',
    level: 'Easy',
    points: 20,
    automatedPoints: 17,
    judgePoints: 3,
    expectedBranch: 'task/T08-rebase-organizer-feature',
    expectedPrTitle: '[T08] Rebase Organizer Feature',
    summary: 'Bring in the organizer feature branch with clean history and a reviewed PR.',
    organizerProvides: [{ key: 'REBASE_ASSET_BRANCH', label: 'Organizer branch' }],
    requiredSecrets: [],
    setupSteps: [
      'Fetch the organizer branch task-assets/rebase-feature or challenge/rebase-insights.',
      'Rebase or cherry-pick safely onto main.',
      'Resolve any history issues without force-pushing main.',
      'Open the expected PR and show the intended diff only.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['PR contains the intended feature changes only.', 'Build passes on the PR or merge commit.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Expected PR exists and references the organizer branch or clean cherry-pick evidence.'],
  },
  {
    id: 'T09',
    title: 'Conflict Merge With Both Outcomes',
    release: '01:00',
    level: 'Easy',
    points: 20,
    automatedPoints: 17,
    judgePoints: 3,
    expectedBranch: 'task/T09-conflict-merge-with-both-outcomes',
    expectedPrTitle: '[T09] Conflict Merge With Both Outcomes',
    summary: 'Resolve a merge conflict while preserving both intended changes.',
    organizerProvides: [{ key: 'CONFLICT_ASSET_BRANCH', label: 'Organizer conflict branch' }],
    requiredSecrets: [],
    setupSteps: [
      'Fetch task-assets/conflict-merge or challenge/conflict-deadlines.',
      'Merge it into the task branch and resolve conflicts manually.',
      'Keep both intended changes rather than choosing one side blindly.',
      'Explain the conflict resolution in the PR.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Conflict PR exists.', 'Both expected outcomes remain in the final diff.', 'Build passes.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['PR/diff shows conflict resolution and keeps both conflict branch outcomes.'],
  },
  {
    id: 'T11',
    title: 'Pull Request Preview Deployment',
    release: '01:30',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T11-pull-request-preview-deployment',
    expectedPrTitle: '[T11] Pull Request Preview Deployment',
    summary: 'Add PR preview evidence through a preview deployment, artifact, or workflow summary.',
    organizerProvides: [{ key: 'PREVIEW_ARTIFACT_NAME', label: 'Preview artifact naming pattern' }],
    requiredSecrets: [],
    setupSteps: [
      'Create a workflow that runs for pull_request.',
      'Build the PR version and publish a preview artifact, preview URL, or summary.',
      'Link the preview evidence from the PR.',
      'Keep production deployment separate from preview evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['PR has preview URL, artifact, or summary evidence.', 'Preview maps to the PR commit.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Pull request workflow publishes preview evidence with artifact or deployment markers.'],
  },
  {
    id: 'T12',
    title: 'Fast Dependency Pipeline',
    release: '01:30',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T12-fast-dependency-pipeline',
    expectedPrTitle: '[T12] Fast Dependency Pipeline',
    summary: 'Add dependency caching safely while keeping lockfile installs deterministic.',
    organizerProvides: [{ key: 'CACHE_KEY_PATTERN', label: 'Lockfile cache key pattern' }],
    requiredSecrets: [],
    setupSteps: [
      'Use actions/cache or setup-node npm caching.',
      'Base the cache key on team-site/package-lock.json.',
      'Keep npm ci instead of npm install.',
      'Show a successful run with cache evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Workflow uses lockfile-based cache.', 'npm ci remains in place.', 'Run succeeds.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow has cache key tied to team-site/package-lock.json and still uses npm ci.'],
  },
  {
    id: 'T13',
    title: 'Feature Bundle With Tests',
    release: '01:30',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T13-feature-bundle-with-tests',
    expectedPrTitle: '[T13] Feature Bundle With Tests',
    summary: 'Apply the organizer feature bundle, remove markers, and prove it works.',
    organizerProvides: [{ key: 'FEATURE_BUNDLE_BRANCH', label: 'Feature bundle branch' }],
    requiredSecrets: [],
    setupSteps: [
      'Fetch task-assets/feature-bundle.',
      'Apply the provided files into the correct locations.',
      'Remove any AI-REVIEW-MARKER strings.',
      'Add or adjust tests/evidence and build successfully.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Feature appears in code or UI evidence.', 'Markers are removed.', 'Build or tests pass.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Feature bundle files are present, marker scan is clean, and build evidence exists.'],
  },
  {
    id: 'T14',
    title: 'Production Docker Image',
    release: '02:00',
    level: 'Easy',
    points: 20,
    automatedPoints: 17,
    judgePoints: 3,
    expectedBranch: 'task/T14-production-docker-image',
    expectedPrTitle: '[T14] Production Docker Image',
    summary: 'Create a production Docker image for the Vite app.',
    organizerProvides: [{ key: 'DOCKER_IMAGE_NAME', label: 'Image naming pattern' }],
    requiredSecrets: [],
    setupSteps: [
      'Add a Dockerfile that builds the team-site app and serves the static output.',
      'Keep dependencies installed from team-site/package-lock.json.',
      'Build the image locally or in CI.',
      'Record the image tag or digest in evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Dockerfile exists.', 'Docker build succeeds.', 'Image can serve the app.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Dockerfile has build and runtime stages or equivalent static serving evidence.'],
  },
  {
    id: 'T17',
    title: 'Low-Downtime Release Strategy',
    release: '02:00',
    level: 'Hard',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T17-low-downtime-release-strategy',
    expectedPrTitle: '[T17] Low-Downtime Release Strategy',
    summary: 'Deploy new releases without replacing the last healthy version until health checks pass.',
    organizerProvides: [{ key: 'HEALTH_URL', label: 'Health gate URL' }],
    requiredSecrets: [],
    setupSteps: [
      'Choose symlinked releases, blue-green containers, or an equivalent pattern.',
      'Deploy the candidate release separately from the current release.',
      'Run a health check against the candidate.',
      'Switch traffic only after health succeeds and keep the previous release on failure.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Logs show candidate health check before traffic switch.', 'Known-good release remains available on failure.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Deploy script/workflow contains release directory or blue-green switch plus health gate.'],
  },
  {
    id: 'T18',
    title: 'Containerized VPS Deploy',
    release: '02:30',
    level: 'Easy',
    points: 20,
    automatedPoints: 17,
    judgePoints: 3,
    expectedBranch: 'task/T18-containerized-vps-deploy',
    expectedPrTitle: '[T18] Containerized VPS Deploy',
    summary: 'Deploy the containerized app to the VPS through GitHub Actions.',
    organizerProvides: [
      { key: 'VPS_HOST', label: 'VPS host or IP' },
      { key: 'APP_PORT', label: 'App port' },
    ],
    requiredSecrets: [],
    setupSteps: [
      'Build or pull the Docker image from Actions.',
      'Submit the image/deploy request to the approved deploy job or deployer service. Do not use participant-visible SSH credentials.',
      'Run or replace the container safely on APP_PORT.',
      'Provide live or container log evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Actions build/deploy request uses Docker evidence.', 'Container evidence or live site evidence exists.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow references Docker plus an approved deploy request/deployer path without participant-visible SSH credentials.'],
  },
  {
    id: 'T15',
    title: 'Runtime Feature Flag',
    release: '02:00',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T15-runtime-feature-flag',
    expectedPrTitle: '[T15] Runtime Feature Flag',
    summary: 'Add a runtime feature flag controlled by GitHub Secret or environment variable.',
    organizerProvides: [{ key: 'FEATURE_FLAG_NAME', label: 'Feature flag env name' }],
    requiredSecrets: ['FEATURE_FLAG_NAME'],
    setupSteps: [
      'Add a feature flag read from runtime env or GitHub Secret.',
      'Avoid hardcoding the flag value.',
      'Show only safe redacted evidence in /status or manifest.',
      'Verify both enabled and disabled behavior where practical.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Feature behavior is controlled by env/secret.', 'Status evidence is safe and redacted.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Source/workflow references feature flag env and does not commit secret values.'],
  },
  {
    id: 'T16',
    title: 'Resend Email Alerts',
    release: '02:00',
    level: 'Medium',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T16-resend-email-alerts',
    expectedPrTitle: '[T16] Resend Email Alerts',
    summary: 'Integrate Resend for a safe transactional email alert or deploy notification without exposing the API key.',
    organizerProvides: [
      { key: 'RESEND_FROM_EMAIL', label: 'Approved sender email' },
      { key: 'ALERT_RECIPIENT_EMAIL', label: 'Approved test recipient' },
      { key: 'EMAIL_PROVIDER', label: 'Email provider marker' },
    ],
    requiredSecrets: ['RESEND_API_KEY'],
    setupSteps: [
      'Create a Resend API key or use an organizer-provided test key.',
      'Add RESEND_API_KEY as a GitHub Secret.',
      'Add a server/runtime or deploy-time email alert path; do not call Resend directly from browser code with the secret.',
      'Expose safe status evidence showing provider=resend, configured=true, and secretRedacted=true.',
      'Send only to the approved test recipient or produce dry-run evidence if the account is not verified.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: [
      'Resend API key is referenced only through GitHub Secrets/runtime env.',
      'Email alert source or dry-run workflow evidence exists.',
      'Status or artifact evidence shows Resend is configured and redacted.',
      'No browser-exposed Resend API key or raw key value is committed.',
    ],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Source/workflow references RESEND_API_KEY safely, includes email/provider evidence, and avoids VITE_RESEND_API_KEY.'],
  },
  {
    id: 'T19',
    title: 'Post-Deploy Smoke Tests',
    release: '02:30',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T19-post-deploy-smoke-tests',
    expectedPrTitle: '[T19] Post-Deploy Smoke Tests',
    summary: 'Run post-deploy smoke tests for /, /health, and /status and fail on bad responses.',
    organizerProvides: [{ key: 'PUBLIC_URL', label: 'Active public URL' }],
    requiredSecrets: ['PUBLIC_URL'],
    setupSteps: [
      'Add a smoke-test job or script after deploy.',
      'Check /, /health, and /status for successful responses.',
      'Run the provided starter from GitHub Actions, inspect the log output, and refine it until it checks the correct target.',
      'Fail the workflow when any smoke check fails.',
      'Include smoke output in workflow logs or summary.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: [
      'Smoke test workflow checks all required routes.',
      'Actions history shows the validation run sequence and the final successful smoke-test run.',
      'Bad responses fail the workflow.',
    ],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow or script checks /, /health, and /status, exits nonzero on failure, includes diagnostic run evidence, and has successful smoke-test evidence.'],
    debugChallenge: [
      'Run the starter check from Actions and preserve the run link.',
      'Use the Actions log to confirm exactly which target URL was checked.',
      'Rerun after your changes and include the validation and successful run links in the PR.',
    ],
  },
  {
    id: 'T21',
    title: 'Least-Privilege And Concurrency',
    release: '03:00',
    level: 'Easy',
    points: 20,
    automatedPoints: 17,
    judgePoints: 3,
    expectedBranch: 'task/T21-least-privilege-and-concurrency',
    expectedPrTitle: '[T21] Least-Privilege And Concurrency',
    summary: 'Add workflow permissions and concurrency so deployments cancel or queue safely.',
    organizerProvides: [{ key: 'DEPLOY_CONCURRENCY_GROUP', label: 'Concurrency group name' }],
    requiredSecrets: [],
    setupSteps: [
      'Set explicit workflow permissions.',
      'Add a concurrency group for deploy workflows.',
      'Use safe cancellation behavior for duplicate deploys.',
      'Avoid pull_request_target for untrusted code.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Workflows define permissions and concurrency.', 'Unsafe triggers are avoided.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow YAML includes permissions and concurrency and does not use pull_request_target.'],
  },
  {
    id: 'T22',
    title: 'Compose Runtime Service',
    release: '03:00',
    level: 'Hard',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T22-compose-runtime-service',
    expectedPrTitle: '[T22] Compose Runtime Service',
    summary: 'Add a Docker Compose runtime service with placeholder env configuration.',
    organizerProvides: [{ key: 'COMPOSE_PROJECT_NAME', label: 'Compose project name' }],
    requiredSecrets: [],
    setupSteps: [
      'Create docker-compose.yml for the app runtime.',
      'Add an env template with placeholders only.',
      'Deploy or dry-run Compose through Actions.',
      'Provide config validation or container evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Compose file exists and validates.', 'Env template has placeholders only.', 'Deploy evidence uses Actions.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Compose config exists, references env placeholders, and avoids committed real secrets.'],
  },
  {
    id: 'T23',
    title: 'Release Evidence Manifest',
    release: '03:00',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T23-release-evidence-manifest',
    expectedPrTitle: '[T23] Release Evidence Manifest',
    summary: 'Generate a release manifest with commit, artifact, workflow run, deploy time, and task markers.',
    organizerProvides: [{ key: 'RELEASE_MANIFEST_PATH', label: 'Manifest path' }],
    requiredSecrets: [],
    setupSteps: [
      'Generate a release-manifest.json or equivalent artifact.',
      'Include commit SHA, artifact or image identity, workflow run ID, deploy time, and completed task markers.',
      'Upload the manifest as an artifact or expose it safely in /status.',
      'Make sure the manifest maps to the scored commit.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Manifest exists and includes required release fields.', 'Manifest is available as artifact or safe status evidence.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Manifest artifact or source path includes commit, artifact/image, workflow, deploy time, and task markers.'],
  },
  {
    id: 'T24',
    title: 'Cloudflare Turnstile Protection',
    release: '03:00',
    level: 'Medium',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T24-cloudflare-turnstile-protection',
    expectedPrTitle: '[T24] Cloudflare Turnstile Protection',
    summary: 'Protect a public form or login-like flow with Cloudflare Turnstile and server-side token verification evidence.',
    organizerProvides: [
      { key: 'TURNSTILE_SITE_KEY', label: 'Turnstile site key' },
      { key: 'TURNSTILE_ALLOWED_HOSTNAME', label: 'Allowed hostname' },
      { key: 'TURNSTILE_PROVIDER', label: 'Security provider marker' },
    ],
    requiredSecrets: ['TURNSTILE_SECRET_KEY'],
    setupSteps: [
      'Create a Cloudflare Turnstile widget for the assigned hostname or use organizer-provided test keys.',
      'Add TURNSTILE_SECRET_KEY as a GitHub Secret and use TURNSTILE_SITE_KEY only as a public widget key.',
      'Render the widget on a contact/support/auth-like interaction.',
      'Verify the token server-side or through an equivalent runtime/deploy-time verification path.',
      'Expose safe status evidence showing provider=cloudflare-turnstile and secretRedacted=true.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: [
      'Protected UI references the public Turnstile site key.',
      'Server/runtime verification references TURNSTILE_SECRET_KEY safely.',
      'Status or artifact evidence shows Turnstile provider and allowed hostname.',
      'No Turnstile secret key is committed or exposed through Vite/browser code.',
    ],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Source/workflow includes Turnstile widget plus server verification evidence and avoids VITE_TURNSTILE_SECRET_KEY.'],
  },
  {
    id: 'T20',
    title: 'Google OAuth Login',
    release: '02:30',
    level: 'Hard',
    points: 40,
    automatedPoints: 28,
    judgePoints: 12,
    expectedBranch: 'task/T20-google-oauth-login',
    expectedPrTitle: '[T20] Google OAuth Login',
    summary: 'Add Google OAuth login through a server-side callback so client secrets stay server-side.',
    organizerProvides: [
      { key: 'GOOGLE_AUTHORIZED_ORIGIN', label: 'Authorized origin' },
      { key: 'GOOGLE_REDIRECT_URI', label: 'Redirect URI' },
      { key: 'GOOGLE_SCOPES', label: 'OAuth scopes' },
    ],
    requiredSecrets: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'],
    setupSteps: [
      'Create or select a Google Cloud project.',
      'Configure OAuth consent and a Web application OAuth client.',
      'Add the provided authorized origin and redirect URI exactly.',
      'Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and SESSION_SECRET to GitHub Secrets.',
      'Implement login, callback, logout, state verification, server-side code exchange, and safe /auth/me or /status evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Login redirects to Google.', 'Callback exchanges code server-side.', 'Logout clears session.', 'No client secret is exposed.'],
    fallbackEvidence: commonFallback,
    checkCriteria: [`Source has server-side OAuth routes, required secret references, and no ${forbiddenGoogleClientSecretKey}.`],
  },
  {
    id: 'T25',
    title: 'Hotfix Cherry-Pick Under Pressure',
    release: '03:45',
    level: 'Medium',
    points: 30,
    automatedPoints: 25,
    judgePoints: 5,
    expectedBranch: 'task/T25-hotfix-cherry-pick-under-pressure',
    expectedPrTitle: '[T25] Hotfix Cherry-Pick Under Pressure',
    summary: 'Cherry-pick the organizer hotfix into main through a focused PR.',
    organizerProvides: [{ key: 'HOTFIX_BRANCH', label: 'Organizer hotfix branch' }],
    requiredSecrets: [],
    setupSteps: [
      'Fetch task-assets/hotfix.',
      'Cherry-pick the intended hotfix commit onto a task branch.',
      'Open a focused PR and verify only the intended fix lands.',
      'Build, get approval from another collaborator after the final commit, and merge through a non-bot collaborator.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Hotfix PR exists.', 'Only intended fix is included.', 'Build passes.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['PR references hotfix branch/commit and diff is focused.'],
  },
  {
    id: 'T26',
    title: 'Incident: Broken Deploy Recovery',
    release: '03:45',
    level: 'Hard',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T26-incident-broken-deploy-recovery',
    expectedPrTitle: '[T26] Incident: Broken Deploy Recovery',
    summary: 'Recover from the organizer broken deploy using logs, a fix, and a successful redeploy.',
    organizerProvides: [{ key: 'BROKEN_DEPLOY_BRANCH', label: 'Broken deploy branch' }],
    requiredSecrets: [],
    setupSteps: [
      'Fetch task-assets/broken-deploy.',
      'Inspect the failing workflow or app logs.',
      'Apply the recovery starter, run it through Actions, and use the logs to complete the recovery path.',
      'Fix the smallest responsible issue.',
      'Redeploy or provide dry-run recovery evidence through Actions.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: [
      'Broken run evidence exists.',
      'Recovery run history and the final successful fixed recovery run are linked.',
      'Fix PR explains root cause.',
      'Successful recovery run exists.',
    ],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Evidence includes both a failed broken-deploy run and later successful recovery run, with the recovery workflow/source issue resolved.'],
    debugChallenge: [
      'Run the recovery path through Actions and preserve the run links.',
      'Use Actions logs to identify the exact root cause.',
      'Rerun recovery successfully and document the decisive log line in the PR.',
    ],
  },
  {
    id: 'T27',
    title: 'Secret Leak Drill',
    release: '03:45',
    level: 'Hard',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T27-secret-leak-drill',
    expectedPrTitle: '[T27] Secret Leak Drill',
    summary: 'Remove a seeded fake secret leak, add scanning, and explain prevention.',
    organizerProvides: [{ key: 'SECRET_LEAK_BRANCH', label: 'Seeded fake leak branch' }],
    requiredSecrets: [],
    setupSteps: [
      'Fetch task-assets/secret-leak.',
      'Remove the seeded fake secret from source/history target as instructed.',
      'Add a scan or check that catches token/private-key patterns.',
      'Document rotation/prevention evidence without using real secrets.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Seeded fake secret is removed.', 'Secret scan/check exists.', 'No token/private-key patterns remain.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Secret scan is present and raw secret patterns are absent.'],
  },
  {
    id: 'T28',
    title: 'Race-Safe Idempotent Deploy',
    release: '04:15',
    level: 'Hard',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T28-race-safe-idempotent-deploy',
    expectedPrTitle: '[T28] Race-Safe Idempotent Deploy',
    summary: 'Make deploys safe to retry and safe against overlapping runs.',
    organizerProvides: [{ key: 'DEPLOY_LOCK_NAME', label: 'Deploy lock name' }],
    requiredSecrets: [],
    setupSteps: [
      'Add concurrency or locking to prevent overlapping deploys.',
      'Use retry-safe directory operations.',
      'Make deploy reruns replace or reuse the same target safely.',
      'Provide logs showing repeat deploy behavior.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Deploy is safe to rerun.', 'Concurrent deploy behavior is controlled.', 'Logs show idempotent operations.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Workflow/script includes concurrency, lock, or retry-safe deploy operations.'],
  },
  {
    id: 'T29',
    title: 'Disaster Recovery From Actions Only',
    release: '04:15',
    level: 'Hard',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T29-disaster-recovery-from-actions-only',
    expectedPrTitle: '[T29] Disaster Recovery From Actions Only',
    summary: 'Document and test recovery from a broken or deleted deployment using Actions only.',
    organizerProvides: [{ key: 'RECOVERY_TARGET_REF', label: 'Recovery target ref' }],
    requiredSecrets: [],
    setupSteps: [
      'Add or document an Actions-only recovery path.',
      'Restore from a known artifact, tag, image, or release reference.',
      'Avoid direct VPS edits.',
      'Produce recovery workflow evidence and final health/status evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Recovery workflow exists.', 'Recovery evidence is through Actions only.', 'Health/status returns after recovery.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Recovery workflow or docs reference Actions-only restore target and successful run evidence.'],
  },
  {
    id: 'T07',
    title: 'OpenWeather API Widget',
    release: '00:30',
    level: 'Medium',
    points: 40,
    automatedPoints: 32,
    judgePoints: 8,
    expectedBranch: 'task/T07-openweather-api-widget',
    expectedPrTitle: '[T07] OpenWeather API Widget',
    summary: 'Create an OpenWeather widget through a safe server/runtime endpoint.',
    organizerProvides: [{ key: 'OPENWEATHER_CITY', label: 'Weather city' }],
    requiredSecrets: ['OPENWEATHER_API_KEY'],
    setupSteps: [
      'Create an OpenWeather account and API key or use organizer-provided credentials.',
      'Add OPENWEATHER_API_KEY as a GitHub Secret.',
      'Use a server/runtime endpoint such as /api/weather instead of exposing the key to browser code.',
      'Show weather.provider=openweather in safe status evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Weather widget or endpoint works.', 'Secret is referenced server-side only.', `No ${forbiddenOpenWeatherViteKey} exists.`],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Source uses OPENWEATHER_API_KEY safely and exposes weather provider evidence.'],
  },
  {
    id: 'T10',
    title: 'Web3Forms Contact Service',
    release: '01:00',
    level: 'Medium',
    points: 40,
    automatedPoints: 32,
    judgePoints: 8,
    expectedBranch: 'task/T10-web3forms-contact-service',
    expectedPrTitle: '[T10] Web3Forms Contact Service',
    summary: 'Add a contact/support form using Web3Forms and safe integration status evidence.',
    organizerProvides: [{ key: 'WEB3FORMS_TARGET_EMAIL', label: 'Target email' }],
    requiredSecrets: ['WEB3FORMS_ACCESS_KEY'],
    setupSteps: [
      'Create a Web3Forms access key or use organizer-provided credentials.',
      'Add WEB3FORMS_ACCESS_KEY as a GitHub Secret.',
      'Add a contact form or support route.',
      'Expose safe provider-configured evidence without raw key values.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Contact form exists.', 'Web3Forms provider status is configured.', 'No raw access key is committed.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Source references WEB3FORMS_ACCESS_KEY and includes contact/provider evidence.'],
  },
  {
    id: 'T30',
    title: 'Sentry Monitoring Release',
    release: '04:15',
    level: 'Medium',
    points: 40,
    automatedPoints: 30,
    judgePoints: 10,
    expectedBranch: 'task/T30-sentry-monitoring-release',
    expectedPrTitle: '[T30] Sentry Monitoring Release',
    summary: 'Add Sentry frontend monitoring and release metadata from GitHub Actions.',
    organizerProvides: [
      { key: 'SENTRY_ORG_SLUG', label: 'Sentry org slug' },
      { key: 'SENTRY_PROJECT_SLUG', label: 'Sentry project slug' },
    ],
    requiredSecrets: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'],
    setupSteps: [
      'Create a Sentry React project or use organizer-provided project details.',
      'Add SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT as GitHub Secrets.',
      'Initialize @sentry/react in the app.',
      'Create release metadata from GitHub Actions and expose safe status evidence.',
    ],
    deliverables: commonDeliverables,
    acceptanceEvidence: ['Sentry SDK is installed and initialized.', 'Release workflow references Sentry secrets.', 'Auth token is not exposed.'],
    fallbackEvidence: commonFallback,
    checkCriteria: ['Package/source/workflows include Sentry SDK, release metadata, and safe secret handling.'],
  },
];

export const tasks: Task[] = taskDefinitions.map((task) => ({
  ...task,
  requiresHumanWorkflow: true as const,
  interactionProof: task.interactionProof ?? defaultInteractionProof,
  snippetPack: task.snippetPack ?? snippetPacks[task.id],
})).sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

export const taskById = new Map(tasks.map((task) => [task.id, task]));
