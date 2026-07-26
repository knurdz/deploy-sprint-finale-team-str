# Deploy Sprint Participant Portal

This project is the organizer-hosted task portal and server-side evaluator for local testing. It is separate from the `team-site/` website that participants deploy to their VPS.

Use this folder only for the instruction/evaluator site. Participant app changes should happen in `../team-site/`.

## Run Locally

```bash
npm ci
cp .env.local.example .env.local
npm run portal
```

Open `http://localhost:4174`.

The DNS portal route is `http://localhost:4174/dns-portal`.

## Secrets

Put test values only in `portal/.env.local`. Do not commit PATs, VPS keys, DNS portal passwords, OAuth secrets, API keys, or service tokens.

The browser never receives `GITHUB_TOKEN` or evaluator credentials. Secret values are only displayed in the unauthenticated local portal when `ALLOW_SECRET_DISPLAY=true`.

## Human Workflow Gate

Every task check requires a merged PR into `main`, a PR author who is a repository collaborator, at least one approval from a different collaborator after the latest commit, and a non-bot collaborator as merger. The evaluator also scans PR actors for configured bot/app/agent patterns.

The evaluator does not blindly score the latest repository PR. For each task it selects PRs whose title starts with `[Txx]` or whose branch starts with `task/Txx-`, then prefers merged PRs into `main` and chooses the newest matching task PR.

Set these optional policy values in `.env.local` when needed:

```text
TEAM_MEMBER_SOURCE=github-collaborators
REQUIRE_APPROVAL_AFTER_LAST_COMMIT=true
REQUIRE_HUMAN_MERGER=true
DISALLOWED_ACTOR_PATTERNS=bot,github-actions[bot],dependabot[bot],renovate[bot],copilot,cursor,codex,claude,anthropic,openai,gemini,devin,windsurf,aider,tabnine,cody,sourcegraph,continue,replit,amazon-q,qodo,jules,agent
```

AI assistants may be used for learning, suggestions, and drafts, but scored PRs must be committed, pushed, reviewed, and merged by human team-member accounts. The evaluator treats known AI/tool actors and AI/tool `Co-authored-by` trailers as agent-owned work.

The GitHub token must be able to read repository collaborators, pull requests, PR reviews, PR commits/files, workflow runs, artifacts, contents, and Actions secret metadata.

For Hostinger DNS, set:

```text
HOSTINGER_API_TOKEN=<hostinger-api-token>
HOSTINGER_DNS_ZONE=knurdz.org
TEAM_DOMAIN_SUFFIX=verischolar.knurdz.org
DNS_TEAM_LABEL=team01
ASSIGNED_DOMAIN=team01.verischolar.knurdz.org
DNS_RECORD_NAME=team01.verischolar
DNS_TXT_NAME=_deploy-sprint-challenge.team01.verischolar
```

## API

- `GET /api/bootstrap`
- `POST /api/checks`
- `GET /api/checks`
- `GET /api/checks/:runId`
- `POST /api/dns-portal/session`
- `GET /api/dns-portal/config`
- `GET /api/dns-portal/records`
- `POST /api/dns-portal/validate`
- `POST /api/dns-portal/apply`
