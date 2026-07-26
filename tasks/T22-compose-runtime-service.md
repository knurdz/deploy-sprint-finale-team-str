# T22 - Compose Runtime Service

## Metadata

- Release: 03:00
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Hard
- Expected branch: `task/T22-compose-runtime-service`
- Expected PR title: `[T22] Compose Runtime Service`

## Participant Instructions

Run the site through Docker Compose or an equivalent service definition with generated runtime env, restart policy, health check, and clean update behavior.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide runtime service values:

```text
SERVICE_NAME=deploy-sprint-team-01
COMPOSE_PROJECT_NAME=deploy-sprint-team-01
RUNTIME_ENV_PATH=/opt/deploy-sprint/team-01/.env
APP_PORT=8080
```

Participants must generate the runtime env file during deploy, not commit it.

## Participant Setup Steps

1. Add Compose or equivalent service config.
2. Include health check, restart policy, and runtime env placeholder.
3. Generate the real env file on the VPS during deploy.
4. Ensure no `.env` file is committed.
5. Restart/update the service from Actions and verify health.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Deploy or dry-run deploy creates/updates runtime env placeholders, starts or validates service config, verifies container health when runnable, and live `/status` or fallback manifest shows service release.

## Independence / Fallback Evidence

T22 can be scored from Compose/runtime configuration and dry-run evidence before VPS deployment is ready.

- Live Evidence: if VPS deployment exists, Compose starts the service and live health/status evidence reports the service release.
- No-Live Fallback Evidence: full points can be confirmed from `compose.yml`, `.env.example`, generated remote `.env` placeholder commands, `docker compose config` output, and dry-run deploy logs.
- Minimum Evidence: real `.env` values must be generated from secrets during deploy and never committed.

## Judge Question

Where do runtime variables live, and how are they updated safely?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Committed .env, no restart policy, no health check, secrets in compose file, or service not reproducible from Actions.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T22-compose-runtime-service.
- Add docker-compose.yml or equivalent service definition with healthcheck, restart policy, and env_file placeholder.
- Make deploy generate the real env file on the VPS from organizer-approved deployment secrets/variables, not from committed source.
- Restart the service from Actions and verify it comes back after docker restart or server reboot simulation.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Run the app with Docker Compose/runtime configuration on the VPS while keeping secrets out of Git.

**Prerequisites:**
- Docker Compose plugin exists on the VPS.
- T14/T18 Docker deployment knowledge is available.
- Runtime values are placeholders or GitHub Secrets.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T22-compose-runtime-service`.
2. Add `compose.yml` with a service for the app image/container and port mapping using placeholder environment variables.
3. Add `.env.example` with variable names only, such as `APP_PORT=<app-port>` and `PUBLIC_URL=<public-url>`.
4. Update the workflow or deploy request so the approved deployer copies `compose.yml` to the VPS and creates a remote `.env` file from organizer-approved deployment secrets during deploy.
5. Run `docker compose pull` or build/load the image, then `docker compose up -d` through the approved deployer.
6. Run `docker compose ps` in the workflow logs and smoke-test the public URL.
7. Update `/status` with `runtime=compose` and image/release identity.

**Files likely touched:**
- compose.yml
- .env.example
- .github/workflows/deploy.yml
- status/release manifest files

**What success looks like:**
- VPS service is managed by Docker Compose.
- No real `.env` is committed.
- Actions logs show compose deployment and smoke tests.
- `/status` shows compose/runtime evidence.

**Common beginner mistakes:**
- Committing the real `.env` file.
- Running compose manually in Termius for scoring.
- Forgetting to pass secrets into the remote `.env`.
- Leaving old non-compose service running on the same port.
- Using Compose locally but not in the Actions deploy.

Organizer verification focus:
- Confirm no .env file or secret is committed and service can restart without manual commands.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
