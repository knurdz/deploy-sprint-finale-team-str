# T01 - Launch Provided Website

## Metadata

- Release: 00:00
- Points: 75
- Automated Points: 65
- Judge Points: 10
- Level: Easy
- Expected branch: `task/T01-launch-provided-website`
- Expected PR title: `[T01] Launch Provided Website`

## Participant Instructions

Take the provided website from `team-site/` and make it live on the assigned VPS using GitHub Actions only. The `portal/` app is organizer-side and must not be deployed for T01. Include team identity, /status, /health, and current commit metadata in the deployed site.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- T01 final scoring requires live evidence: keep `/status`, `/health`, and release evidence aligned with the scored commit. Dry-run evidence is organizer rehearsal only.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide this credential pack outside the repository:

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

Participants do not receive the SSH private key. Organizers hold the deploy key in an organizer-controlled deployer or protected deployment environment. Teams only create the workflow/artifact/deploy request required by the task and verify the public site evidence.

Organizers also provide the assigned private repository, the provided `team-site/` website source, and the dedicated VPS that already trusts the organizer-held deploy public key.
Custom domain and HTTPS setup are handled in T02. T01 does not require teams to configure DNS.

## Participant Setup Steps

1. Do not request, paste, print, or commit any VPS SSH private key.
2. Create a deploy workflow or deploy request that checks out the repo, installs dependencies in `team-site/`, builds the website with `npm run build`, and hands the build artifact to the organizer-approved deploy job or deployer service.
3. The workflow must deploy to `DEPLOY_PATH`, serve the app on `APP_PORT`, and expose it through the raw IP URL (`IP_PUBLIC_URL`). `PUBLIC_URL` may switch to the domain after T02.
4. Add or generate `/status` with team name, commit SHA, release ID, deploy time, and `T01` marker.
5. Add or generate `/health` returning HTTP 200.
6. Run the workflow from GitHub Actions and verify `IP_PUBLIC_URL`, `/status`, and `/health` in a browser.

Secret setup reminder:
1. Participants do not configure the VPS SSH key.
2. If a task asks for a GitHub Secret, list the secret name in the PR body, never the value.
3. Never commit private keys, tokens, `.env` files, or screenshots containing secret values.
4. If a value is public configuration, the task will say so explicitly.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Public URL returns 200; /status shows team, commit SHA, release ID, deploy time, and T01 marker; /health returns 200; Actions deploy run maps to the same commit.

## Independence / Fallback Evidence

T01 is the only task whose final scoring requires a real live VPS deployment.

- Live Evidence: `IP_PUBLIC_URL`, `/health`, and `/status` work from the assigned VPS and match the merged commit.
- No-Live Fallback Evidence: organizers may use workflow files, local build output, and dry-run deployer logs only as rehearsal evidence while preparing the test repo; this does not replace final T01 live evidence.
- Minimum Evidence: final T01 confirmation requires a public URL, health route, status route, and matching GitHub Actions deploy run.
- Independence Note: teams may attempt all other tasks before T01 is complete; those tasks use their own fallback evidence rules.

## Judge Question

Start from a push to main and explain every step that made the provided site live.

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Manual VPS access, deploy from unmerged code, missing live metadata, broad secret exposure, or live site not matching the scored commit.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T01-launch-provided-website and open a PR into main.
- For a real VPS test, configure organizer-held deployment access first: VPS_HOST, VPS_USER, VPS_PORT, and the deploy key or deployer token. Do not give the private key to participants.
- Add a deploy workflow that builds the Vite app, publishes it to the assigned server only from main, and records GITHUB_SHA plus deployment time.
- Add /status and /health in the app or static build. For a quick dry run, serve the built dist directory locally and confirm both routes return the expected content.
- Merge the PR, run the deploy workflow, then compare the live `/status` commit with `git rev-parse --short HEAD`.


Additional organizer setup detail:

Organizer setup commands for each team VPS:

```bash
sudo id -u deploy >/dev/null 2>&1 || sudo adduser --disabled-password --gecos "" deploy
sudo apt update
sudo apt install -y nginx docker.io docker-compose-plugin ufw
sudo usermod -aG docker deploy
sudo mkdir -p /opt/deploy-sprint/team-01
sudo chown -R deploy:deploy /opt/deploy-sprint/team-01
sudo mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Generate one key pair per team on your machine:

```bash
ssh-keygen -t ed25519 -C "deploy-sprint-team-01" -f deploy_sprint_team_01
ssh -i ~/deploy_sprint_team_01 deploy@<VPS_HOST>
```

Store the private key only in the organizer-controlled deployer or protected deployment environment. Do not give it to the team and do not commit it.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Deploy the provided Vite website to the team VPS using GitHub Actions only, then expose clear health and status evidence.

**Prerequisites:**
- Team credential pack with `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `DEPLOY_PATH`, `APP_PORT`, `IP_PUBLIC_URL`, `DOMAIN_PUBLIC_URL`, and `PUBLIC_URL` placeholders.
- The VPS already has the `deploy` user, the deploy directory, and the matching public SSH key in `authorized_keys`.
- A private GitHub repo and an organizer-controlled deployment path that can deploy reviewed artifacts.

**Step-by-step test path:**
1. Create the task branch: `git checkout -b task/T01-launch-provided-website`.
2. Confirm organizers have installed the deploy public key on the VPS and stored the private key only in the deployer/protected environment.
3. Fix the starting workflow if needed: use `npm ci` in `team-site/`, run `npm run build` in `team-site/`, and deploy the Vite `team-site/dist` directory, not `build`.
4. Create or update `.github/workflows/deploy.yml` so it runs on push to `main` and `workflow_dispatch`, uploads the build artifact or writes a deploy request, and lets the approved deployer publish `dist` to `DEPLOY_PATH`.
5. Add simple app routes or static generated files for `/health` and `/status`. `/health` can return `ok`; `/status` should show team name, commit SHA, release ID, deploy time, public URL, and task marker `T01`.
6. Commit, push, open PR `[T01] Launch Provided Website`, merge after checks, then run the deploy workflow from Actions.
7. Open `IP_PUBLIC_URL`, `IP_PUBLIC_URL/health`, and `IP_PUBLIC_URL/status` in a browser and compare the status commit with the merged commit.

**Files likely touched:**
- .github/workflows/deploy.yml
- team-site/src/App.tsx or static files under team-site/public/
- SUBMISSION.md

**What success looks like:**
- `IP_PUBLIC_URL` returns the provided website.
- `/health` returns HTTP 200.
- `/status` shows the merged commit and `T01` marker.
- The only deploy evidence is a GitHub Actions run; there is no manual VPS upload.

**Common beginner mistakes:**
- Asking for or exposing the VPS private key.
- Uploading `build` when Vite creates `dist`.
- Deploying from `production` or an unmerged branch instead of `main`.
- Making `/status` hardcoded so it does not change per deploy.
- Logging secret values in workflow output.

Organizer verification focus:
- Confirm no direct VPS access, no manual file upload, no hardcoded stale commit, and no organizer-only files copied into the repo.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
