# Deploy Sprint Finale Tasks

This directory contains one task file per finale task. Each file includes participant instructions and organizer/tester notes for this private test repository.

Organizer-only beginner walkthroughs are included in these task files so the event team can test the full flow. Remove or split those sections before creating production participant repositories.

## Repository Layout

- `team-site/` is the participant working project and the only website teams deploy to the VPS.
- `portal/` is the organizer-hosted task portal and evaluator; teams must not deploy it for T01.
- The repo root contains task docs, organizer tools, shared submission files, and wrapper scripts.

## Independence Rule

T01 is the live-launch task, but it is not a gate for the rest of the finale. Teams may attempt and receive full points for other tasks before the website is live when they provide the task's no-live fallback evidence.

Each task supports two evidence modes:

- Live Evidence: use this when the team's VPS deployment, `/health`, `/status`, or public URL is available.
- No-Live Fallback Evidence: use this when the site is not live yet; judges verify PRs, GitHub Actions runs, artifacts, workflow summaries, dry-run deploy logs, generated manifests, source scans, or local/container evidence listed in that task.

Live evidence is preferred when available, but no-live fallback evidence is valid for full task points unless the task explicitly says otherwise. T01 is the only task that requires the assigned VPS site to be live for final confirmation.

## Scoring Split

The finale has 1000 total points: 800 automated/organizer-confirmed points and 200 judge-awarded points. Judge marks are weighted by task risk and complexity: simpler workflow tasks carry fewer judge marks, while hard deployment, DNS, OAuth, incident, and secret-safety tasks carry more.

Automated points are based on task evidence. Judge points are awarded per task using the `Judge Question` and `Judge Scoring Guidance` sections in each task file.

## Release Schedule

Service-integration tasks are intentionally spread across the event instead of appearing as one block.

### 00:00

- [T01 - Launch Provided Website](T01-launch-provided-website.md) - Easy, 75 pts (65 auto + 10 judge)
- [T02 - Connect Custom Domain](T02-connect-custom-domain.md) - Medium, 35 pts (29 auto + 6 judge)
- [T03 - Build Once Deploy Same Artifact](T03-build-once-deploy-same-artifact.md) - Medium, 30 pts (25 auto + 5 judge)

### 00:30

- [T04 - Rollback To Known-Good Release](T04-rollback-to-known-good-release.md) - Medium, 30 pts (25 auto + 5 judge)
- [T05 - Secret And Config Separation](T05-secret-and-config-separation.md) - Easy, 20 pts (17 auto + 3 judge)
- [T06 - CI Gate Before Deployment](T06-ci-gate-before-deployment.md) - Easy, 20 pts (17 auto + 3 judge)
- [T07 - OpenWeather API Widget](T07-openweather-api-widget.md) - Medium, 40 pts (32 auto + 8 judge)

### 01:00

- [T08 - Rebase Organizer Feature](T08-rebase-organizer-feature.md) - Easy, 20 pts (17 auto + 3 judge)
- [T09 - Conflict Merge With Both Outcomes](T09-conflict-merge-with-both-outcomes.md) - Easy, 20 pts (17 auto + 3 judge)
- [T10 - Web3Forms Contact Service](T10-web3forms-contact-service.md) - Medium, 40 pts (32 auto + 8 judge)

### 01:30

- [T11 - Pull Request Preview Deployment](T11-pull-request-preview-deployment.md) - Medium, 30 pts (25 auto + 5 judge)
- [T12 - Fast Dependency Pipeline](T12-fast-dependency-pipeline.md) - Medium, 30 pts (25 auto + 5 judge)
- [T13 - Feature Bundle With Tests](T13-feature-bundle-with-tests.md) - Medium, 30 pts (25 auto + 5 judge)

### 02:00

- [T14 - Production Docker Image](T14-production-docker-image.md) - Easy, 20 pts (17 auto + 3 judge)
- [T15 - Runtime Feature Flag](T15-runtime-feature-flag.md) - Medium, 30 pts (25 auto + 5 judge)
- [T16 - Resend Email Alerts](T16-resend-email-alerts.md) - Medium, 40 pts (30 auto + 10 judge)
- [T17 - Low-Downtime Release Strategy](T17-low-downtime-release-strategy.md) - Hard, 40 pts (30 auto + 10 judge)

### 02:30

- [T18 - Containerized VPS Deploy](T18-containerized-vps-deploy.md) - Easy, 20 pts (17 auto + 3 judge)
- [T19 - Post-Deploy Smoke Tests](T19-post-deploy-smoke-tests.md) - Medium, 30 pts (25 auto + 5 judge)
- [T20 - Google OAuth Login](T20-google-oauth-login.md) - Hard, 40 pts (28 auto + 12 judge)

### 03:00

- [T21 - Least-Privilege And Concurrency](T21-least-privilege-and-concurrency.md) - Easy, 20 pts (17 auto + 3 judge)
- [T22 - Compose Runtime Service](T22-compose-runtime-service.md) - Hard, 40 pts (30 auto + 10 judge)
- [T23 - Release Evidence Manifest](T23-release-evidence-manifest.md) - Medium, 30 pts (25 auto + 5 judge)
- [T24 - Cloudflare Turnstile Protection](T24-cloudflare-turnstile-protection.md) - Medium, 40 pts (30 auto + 10 judge)

### 03:45

- [T25 - Hotfix Cherry-Pick Under Pressure](T25-hotfix-cherry-pick-under-pressure.md) - Medium, 30 pts (25 auto + 5 judge)
- [T26 - Incident: Broken Deploy Recovery](T26-incident-broken-deploy-recovery.md) - Hard, 40 pts (30 auto + 10 judge)
- [T27 - Secret Leak Drill](T27-secret-leak-drill.md) - Hard, 40 pts (30 auto + 10 judge)

### 04:15

- [T28 - Race-Safe Idempotent Deploy](T28-race-safe-idempotent-deploy.md) - Hard, 40 pts (30 auto + 10 judge)
- [T29 - Disaster Recovery From Actions Only](T29-disaster-recovery-from-actions-only.md) - Hard, 40 pts (30 auto + 10 judge)
- [T30 - Sentry Monitoring Release](T30-sentry-monitoring-release.md) - Medium, 40 pts (30 auto + 10 judge)

## Credential Pack For T01

Each team receives a private credential pack outside the repository. Example participant-visible values:

```text
VPS_HOST=<team-vps-ip-or-domain>
VPS_PORT=22
VPS_USER=deploy
DEPLOY_PATH=/opt/deploy-sprint/team-01
APP_PORT=8080
PUBLIC_URL=http://<team-vps-ip>
IP_PUBLIC_URL=http://<team-vps-ip>
DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org
```

Participants do not receive the SSH private key. Organizers store deploy access only in the organizer-controlled deployer or protected deployment environment.

Rules:

- Do not ask for, copy, or commit the private key.
- Do not paste secret values into PRs, issues, screenshots, or logs.
- Teams may reference the approved deploy workflow or deploy request format, but they must not create a workflow whose purpose is to reveal or manually use the VPS key.
- If a value is safe to show publicly, the task will say so explicitly.

## Third-Party Service Credential Packs

Some tasks require DNS portal, OAuth, or external service credentials. Organizers will either pre-create per-team credentials or require teams to create their own accounts during the event. Required or commonly used credential names:

```text
DNS_PORTAL_URL
DNS_PORTAL_USERNAME
DNS_PORTAL_PASSWORD
DNS_TXT_VALUE
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SESSION_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_AUTHORIZED_ORIGIN
OPENWEATHER_API_KEY
WEB3FORMS_ACCESS_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
ALERT_RECIPIENT_EMAIL
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
TURNSTILE_ALLOWED_HOSTNAME
SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

Rules:

- Put service credentials in GitHub Secrets unless the task explicitly says a value may be public.
- `SENTRY_DSN`, `GOOGLE_CLIENT_ID`, and `TURNSTILE_SITE_KEY` may be client-visible when needed, but `SENTRY_AUTH_TOKEN`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, DNS portal passwords, and challenge tokens must stay secret.
- Do not use `VITE_OPENWEATHER_API_KEY`; OpenWeather must be called from a server/runtime/deploy-time context.
- Do not use `VITE_GOOGLE_CLIENT_SECRET`; Google OAuth code exchange must happen server-side.
- Do not use `VITE_RESEND_API_KEY` or `VITE_TURNSTILE_SECRET_KEY`; those values must stay server-side.
- Do not paste service keys into source, PR descriptions, screenshots, issues, or logs.

## Universal Scoring Notes

- Automated points are confirmed only after organizer verification.
- Every scored task requires a merged PR into `main`, authored by a repository collaborator, approved by a different repository collaborator after the final commit, and merged by a non-bot repository collaborator.
- The evaluator selects the scored PR per task by exact task prefix: the PR title must start with `[Txx]` or the branch must start with `task/Txx-` such as `task/T08-rebase-organizer-feature`. If multiple PRs match the same task, it scores the newest merged PR into `main`; if none are merged yet, it reports the newest unmerged matching PR.
- Direct pushes or bot/app/agent-owned PR activity receive zero automated task points even when technical evidence is correct.
- AI assistants are allowed for learning, suggestions, and drafting, but they must not be commit authors, co-authors, pushers, reviewers, or mergers. Teams must validate, commit, push, review, and merge scored work using human team-member accounts.
- The repo intentionally includes nested assistant instruction files such as `AGENTS.md` and PR-agent notes. The evaluator ignores those instruction files themselves, but every task fails automated scoring if `AI-REVIEW-MARKER`, `AI-AGENT-MARKER`, `AI-DATA-MARKER`, `PR-AGENT-MARKER`, or `AI-PR-EVIDENCE-MARKER` remains in source, workflows, scripts, PR evidence, or submission files.
- Task PRs that edit `AGENTS.md`, `agent.md`, or PR-agent instruction files fail automated scoring; those files are protected challenge material and may intentionally contain marker traps.
- Judge points are awarded per task and tracked separately from automated evidence.
- Direct VPS access, leaked secrets, fabricated evidence, or deleted audit history can invalidate task points.
- This test repo includes organizer notes in task files; production participant repos should not include those sections.
