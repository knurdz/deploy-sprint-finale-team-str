# Deploy Sprint Finale Test Team Repository

This private repository is a ready-to-test Deploy Sprint finale team repo. It contains two local test projects:

- `team-site/`: the provided team website participants work on and deploy to their VPS.
- `portal/`: the organizer-hosted instruction/task portal and server-side evaluator.

Only `team-site/` should be deployed for T01. The repo root is now just the shared container for task docs, organizer tools, and convenience scripts.

> Organizer test note: task files intentionally include both participant-facing instructions and organizer/tester notes. Split or remove organizer sections before using this as the real participant release.

## Competition Shape

- 15 finalist teams in the real finale.
- One private repository and one dedicated VPS per team.
- Teams deploy only through GitHub Actions. Direct VPS access is not allowed.
- Every scored task requires a merged PR into `main`, an approving review from another repository collaborator after the final commit, and merge by a non-bot repository collaborator.
- Total score: 1000 points: 800 automated/organizer-confirmed points and 200 judge-awarded points.
- Judge points are awarded per task and tracked separately from automated evidence before final total calculation.
- Tasks are intentionally uneven by difficulty. Waves may contain two core tasks, medium-heavy groups, or hard incident tasks.

## Scoring Model

The finale has 1000 total points: 800 automated/organizer-confirmed points and 200 judge-awarded points. Each task keeps one total point value, but judge marks are weighted toward harder and higher-risk workflows such as deployment safety, DNS, OAuth, incident recovery, and secret handling. Automated points come from verifiable evidence such as PRs, Actions runs, artifacts, status output, manifests, scans, and live/fallback checks. Judge points come from interviews, explanation quality, ownership, review quality, and safe handling of secrets/risk.

## Organizer Credential Safety

This test repo references VPS targets, but real private keys must never be committed or given to participants. Organizers generate one SSH key pair per team, install only the public key on that team's VPS, and store the private key only in an organizer-controlled deployer or protected deployment environment. A hidden repository secret is not treated as a full security boundary if participants can freely edit workflows.

See [organizer/SECURE_DEPLOYMENT_MODEL.md](organizer/SECURE_DEPLOYMENT_MODEL.md), [organizer/NO_SSH_KEY_DEPLOYER_RUNBOOK.md](organizer/NO_SSH_KEY_DEPLOYER_RUNBOOK.md), [organizer/VPS_SETUP_GUIDE.md](organizer/VPS_SETUP_GUIDE.md), [organizer/TEAM_CREDENTIAL_PACK_TEMPLATE.md](organizer/TEAM_CREDENTIAL_PACK_TEMPLATE.md), and [organizer/GITHUB_SECRETS_CHECKLIST.md](organizer/GITHUB_SECRETS_CHECKLIST.md).

## Start Here

1. Read [tasks/README.md](tasks/README.md).
2. Attempt released tasks in any order that makes sense for the team; T01 is not a gate for other task scoring.
3. Use one PR per task where practical.
4. Use live evidence when available. If the site is not live yet, use the task-specific no-live fallback evidence such as PRs, Actions runs, artifacts, workflow summaries, dry-run logs, generated manifests, or source scans.

## Local Development

Run these commands from `team-site/` to work on the website that gets deployed to the VPS:

```bash
cd team-site
npm ci
npm run dev
npm run build
```

The `team-site/dist/` directory is the deploy artifact for the team website.

For convenience, the repo root still has wrapper scripts:

```bash
npm run dev
npm run build
npm run lint
```

Those delegate to `team-site/` and `portal/` as appropriate.

## Participant Portal Test Mode

The participant task portal is kept in `portal/` for local organizer testing. It should be hosted separately from the team website in the real finale.

1. Go to `portal/`.
2. Copy `.env.local.example` to `.env.local`.
3. Fill the test values locally, including `GITHUB_TOKEN`, VPS details, DNS values, and any service placeholders you want to show.
4. Keep `portal/.env.local` private; it is ignored by git.
5. Run the portal:

```bash
cd portal
npm ci
npm run portal
```

Open `http://localhost:4174`. The browser only talks to the local portal server; the GitHub PAT and evaluator credentials stay server-side.

The DNS portal for T02 is `http://localhost:4174/dns-portal`. For the current Hostinger setup, team domains use the pattern `team01.verischolar.knurdz.org`; change `TEAM_DOMAIN_SUFFIX` in `portal/.env.local` if that suffix changes later. T01 uses `IP_PUBLIC_URL` such as `http://40.81.235.54`. T02 switches `PUBLIC_URL` and the deployer `TEAM01_PUBLIC_URL` to `DOMAIN_PUBLIC_URL` such as `https://team01.verischolar.knurdz.org` after DNS records are created. T02 enables HTTPS for the assigned domain automatically while keeping plain HTTP and raw IP HTTP available for compatibility.

## Existing Branches

- `main` - base provided website and task docs.
- `challenge/rebase-insights` - legacy rebase challenge branch kept for compatibility.
- `challenge/conflict-deadlines` - legacy conflict challenge branch kept for compatibility.

## AI Marker Traps

AI assistants may be used for learning, suggestions, and drafting, but scored
work must be validated, committed, pushed, reviewed, and merged by human
team-member accounts. AI/tool actors and AI/tool `Co-authored-by` trailers are
treated as agent-owned work and do not score automated points.

This repo intentionally includes nested assistant instruction files, including
`AGENTS.md` and PR-agent notes. The evaluator ignores those instruction files
themselves, but every task checks source, workflows, scripts, generated evidence,
and submission files for leftover AI/agent markers. Participants must manually
remove any `AI-REVIEW-MARKER`, `AI-AGENT-MARKER`, `AI-DATA-MARKER`,
`PR-AGENT-MARKER`, or `AI-PR-EVIDENCE-MARKER` before scoring.
Task PRs must not edit `AGENTS.md`, `agent.md`, or PR-agent instruction files;
those files are protected challenge material and may intentionally contain traps.
- `task-assets/*` - organizer asset branches for selected finale tasks.

## Task Independence

T01 is the live-launch task, but it is not a scoring gate for the other tasks. Every non-T01 task can receive full points with its documented no-live fallback evidence when the team has not made the site live yet.

## Third-Party Service Credentials

Service tasks are spread across the finale: DNS/domain setup, OpenWeather, Web3Forms, Resend, Google OAuth, Cloudflare Turnstile, and Sentry. Real keys must never be committed. Use GitHub Secrets and the organizer credential-pack process described in `organizer/THIRD_PARTY_SERVICES_GUIDE.md`.

## Task Index

Service-integration tasks are intentionally spread across the event instead of appearing as one block.

### 00:00

- [T01 - Launch Provided Website](tasks/T01-launch-provided-website.md) - Easy, 75 pts (65 auto + 10 judge)
- [T02 - Connect Custom Domain](tasks/T02-connect-custom-domain.md) - Medium, 35 pts (29 auto + 6 judge)
- [T03 - Build Once Deploy Same Artifact](tasks/T03-build-once-deploy-same-artifact.md) - Medium, 30 pts (25 auto + 5 judge)

### 00:30

- [T04 - Rollback To Known-Good Release](tasks/T04-rollback-to-known-good-release.md) - Medium, 30 pts (25 auto + 5 judge)
- [T05 - Secret And Config Separation](tasks/T05-secret-and-config-separation.md) - Easy, 20 pts (17 auto + 3 judge)
- [T06 - CI Gate Before Deployment](tasks/T06-ci-gate-before-deployment.md) - Easy, 20 pts (17 auto + 3 judge)
- [T07 - OpenWeather API Widget](tasks/T07-openweather-api-widget.md) - Medium, 40 pts (32 auto + 8 judge)

### 01:00

- [T08 - Rebase Organizer Feature](tasks/T08-rebase-organizer-feature.md) - Easy, 20 pts (17 auto + 3 judge)
- [T09 - Conflict Merge With Both Outcomes](tasks/T09-conflict-merge-with-both-outcomes.md) - Easy, 20 pts (17 auto + 3 judge)
- [T10 - Web3Forms Contact Service](tasks/T10-web3forms-contact-service.md) - Medium, 40 pts (32 auto + 8 judge)

### 01:30

- [T11 - Pull Request Preview Deployment](tasks/T11-pull-request-preview-deployment.md) - Medium, 30 pts (25 auto + 5 judge)
- [T12 - Fast Dependency Pipeline](tasks/T12-fast-dependency-pipeline.md) - Medium, 30 pts (25 auto + 5 judge)
- [T13 - Feature Bundle With Tests](tasks/T13-feature-bundle-with-tests.md) - Medium, 30 pts (25 auto + 5 judge)

### 02:00

- [T14 - Production Docker Image](tasks/T14-production-docker-image.md) - Easy, 20 pts (17 auto + 3 judge)
- [T15 - Runtime Feature Flag](tasks/T15-runtime-feature-flag.md) - Medium, 30 pts (25 auto + 5 judge)
- [T16 - Resend Email Alerts](tasks/T16-resend-email-alerts.md) - Medium, 40 pts (30 auto + 10 judge)
- [T17 - Low-Downtime Release Strategy](tasks/T17-low-downtime-release-strategy.md) - Hard, 40 pts (30 auto + 10 judge)

### 02:30

- [T18 - Containerized VPS Deploy](tasks/T18-containerized-vps-deploy.md) - Easy, 20 pts (17 auto + 3 judge)
- [T19 - Post-Deploy Smoke Tests](tasks/T19-post-deploy-smoke-tests.md) - Medium, 30 pts (25 auto + 5 judge)
- [T20 - Google OAuth Login](tasks/T20-google-oauth-login.md) - Hard, 40 pts (28 auto + 12 judge)

### 03:00

- [T21 - Least-Privilege And Concurrency](tasks/T21-least-privilege-and-concurrency.md) - Easy, 20 pts (17 auto + 3 judge)
- [T22 - Compose Runtime Service](tasks/T22-compose-runtime-service.md) - Hard, 40 pts (30 auto + 10 judge)
- [T23 - Release Evidence Manifest](tasks/T23-release-evidence-manifest.md) - Medium, 30 pts (25 auto + 5 judge)
- [T24 - Cloudflare Turnstile Protection](tasks/T24-cloudflare-turnstile-protection.md) - Medium, 40 pts (30 auto + 10 judge)

### 03:45

- [T25 - Hotfix Cherry-Pick Under Pressure](tasks/T25-hotfix-cherry-pick-under-pressure.md) - Medium, 30 pts (25 auto + 5 judge)
- [T26 - Incident: Broken Deploy Recovery](tasks/T26-incident-broken-deploy-recovery.md) - Hard, 40 pts (30 auto + 10 judge)
- [T27 - Secret Leak Drill](tasks/T27-secret-leak-drill.md) - Hard, 40 pts (30 auto + 10 judge)

### 04:15

- [T28 - Race-Safe Idempotent Deploy](tasks/T28-race-safe-idempotent-deploy.md) - Hard, 40 pts (30 auto + 10 judge)
- [T29 - Disaster Recovery From Actions Only](tasks/T29-disaster-recovery-from-actions-only.md) - Hard, 40 pts (30 auto + 10 judge)
- [T30 - Sentry Monitoring Release](tasks/T30-sentry-monitoring-release.md) - Medium, 40 pts (30 auto + 10 judge)
