# No-SSH-Key Deployer Runbook

Use this runbook for the finale model where participants never receive the VPS SSH private key.

## Goal

Teams should work only through GitHub: branches, PRs, reviews, Actions builds, artifacts, deploy requests, and public evidence. Organizers keep all VPS SSH private keys in an organizer-controlled deployer.

## What Teams Receive

Give each team only safe target values:

```text
TEAM_REPO=https://github.com/knurdz/<team-repo>
VPS_HOST=<team-vps-ip-or-domain>
DEPLOY_PATH=/opt/deploy-sprint/team-01
APP_PORT=8080
PUBLIC_URL=http://40.81.235.54
IP_PUBLIC_URL=http://40.81.235.54
DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org
```

Do not give teams:

```text
DEPLOY_SSH_PRIVATE_KEY
VPS_SSH_KEY
```

## Step 1: Create The Organizer Deployer Repo

Create one private repo controlled only by organizers:

```bash
gh repo create knurdz/deploy-sprint-deployer --private
```

Teams should not have write access to this repo.

## Step 2: Store VPS Secrets Only In The Deployer Repo

For team 01:

```bash
gh secret set TEAM01_VPS_HOST --repo knurdz/deploy-sprint-deployer --body "40.81.235.54"
gh secret set TEAM01_VPS_PORT --repo knurdz/deploy-sprint-deployer --body "22"
gh secret set TEAM01_VPS_USER --repo knurdz/deploy-sprint-deployer --body "deploy"
gh secret set TEAM01_DEPLOY_PATH --repo knurdz/deploy-sprint-deployer --body "/opt/deploy-sprint/team-01"
gh secret set TEAM01_APP_PORT --repo knurdz/deploy-sprint-deployer --body "8080"
gh secret set TEAM01_VPS_SSH_KEY --repo knurdz/deploy-sprint-deployer < ~/deploy_sprint_team_01
```

Do not add `TEAM01_VPS_SSH_KEY` or `VPS_SSH_KEY` to the team repo.

If the deployer must checkout private team repos, create a fine-grained token with read-only access to team repos and store it in the deployer repo:

```bash
gh secret set ORG_REPO_READ_TOKEN --repo knurdz/deploy-sprint-deployer --body "<read-only-token>"
```

## Step 3: Remove Any Existing VPS Key From Team Repos

If you already added a VPS key to a team repo, delete it:

```bash
gh secret delete VPS_SSH_KEY --repo knurdz/deploy-sprint-finale-test-team-01-zero
```

Safe public values may be stored as variables if needed:

```bash
gh variable set PUBLIC_URL --repo knurdz/deploy-sprint-finale-test-team-01-zero --body "http://40.81.235.54"
gh variable set IP_PUBLIC_URL --repo knurdz/deploy-sprint-finale-test-team-01-zero --body "http://40.81.235.54"
gh variable set DOMAIN_PUBLIC_URL --repo knurdz/deploy-sprint-finale-test-team-01-zero --body "https://team01.verischolar.knurdz.org"
gh variable set APP_PORT --repo knurdz/deploy-sprint-finale-test-team-01-zero --body "8080"
```

## Step 4: Harden Each VPS

Run on each team VPS.

Disable password login and root login:

```bash
sudo tee /etc/ssh/sshd_config.d/deploy-sprint.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitRootLogin no
AllowUsers deploy
X11Forwarding no
AllowTcpForwarding no
PermitTunnel no
EOF

sudo sshd -t
sudo systemctl reload ssh
```

Firewall shape:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from <ORGANIZER_DEPLOYER_IP>/32 to any port 22 proto tcp
sudo ufw enable
sudo ufw status verbose
```

Do not run:

```bash
sudo ufw allow 22/tcp
```

That would reopen SSH publicly.

## Step 5: Add The Deployer Workflow

In `knurdz/deploy-sprint-deployer`, create:

```text
.github/workflows/deploy-team.yml
```

Starter workflow:

```yaml
name: Deploy Team Site

on:
  workflow_dispatch:
    inputs:
      team:
        required: true
        default: team01
      repo:
        required: true
        default: knurdz/deploy-sprint-finale-test-team-01-zero
      ref:
        required: true
        default: main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout team repo
        uses: actions/checkout@v4
        with:
          repository: ${{ inputs.repo }}
          ref: ${{ inputs.ref }}
          token: ${{ secrets.ORG_REPO_READ_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: team-site/package-lock.json

      - run: npm ci
        working-directory: team-site

      - run: npm run build
        working-directory: team-site

      - name: Install SSH key
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "${{ secrets.TEAM01_VPS_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -p "${{ secrets.TEAM01_VPS_PORT }}" "${{ secrets.TEAM01_VPS_HOST }}" >> ~/.ssh/known_hosts

      - name: Deploy dist
        run: |
          rsync -az --delete \
            -e "ssh -i ~/.ssh/deploy_key -p ${{ secrets.TEAM01_VPS_PORT }}" \
            team-site/dist/ \
            "${{ secrets.TEAM01_VPS_USER }}@${{ secrets.TEAM01_VPS_HOST }}:${{ secrets.TEAM01_DEPLOY_PATH }}/"
```

For production, add team routing so `team01`, `team02`, etc. map to the correct VPS secrets. Keep that routing in the deployer repo, not in team repos.

## Step 6: Add Auto Deploy Request In The Team Repo

The team repo should not deploy directly. It should request deployment from the organizer deployer after CI passes on `main`.

Create or update:

```text
.github/workflows/deploy.yml
```

The workflow should:

- trigger on `workflow_run` after `CI` completes on `main`
- require CI success
- skip commits containing `[skip deploy]`
- call the deployer repo with `repository_dispatch`
- pass team, repo, branch, SHA, and source run ID

Required team repo secret:

```text
DEPLOYER_DISPATCH_TOKEN
```

For the test setup, this is already configured on `knurdz/deploy-sprint-finale-test-team-01-zero`. For production, replace it with a narrow GitHub App token or fine-grained token that can only trigger the deployer repo.

The team repo must not contain:

```text
VPS_SSH_KEY
```

## Step 7: Event Flow For T01

1. Team creates a branch.
2. Team updates the site/deploy evidence.
3. Team opens PR.
4. Another team collaborator approves after the final commit.
5. Team merges to `main`.
6. Team repo CI runs on `main`.
7. If CI succeeds, the team repo sends a deploy request to the organizer deployer.
8. Deployer validates the repo, team, branch, and current `main` SHA.
9. Deployer builds the approved ref and deploys to the VPS.
10. Team clicks Check in the portal.
11. Evaluator verifies PR/review/build/deploy evidence and checks `IP_PUBLIC_URL`, `PUBLIC_URL`, `/health`, and `/status` according to the task. T01 checks the raw IP URL; T02 checks the assigned domain.

## Participant-Facing Rule

Tell teams:

```text
You will not receive VPS SSH access. Your job is to make the repository, PR, workflow, and deployable build correct. The organizer deployer publishes approved builds to your VPS.
```

## Why This Is Safer

If `VPS_SSH_KEY` is a normal team repo secret, participants cannot see it in the GitHub UI, but they can edit workflow code that uses it. That is not a strong security boundary.

Keeping the key in an organizer-controlled deployer means:

- Teams cannot SSH from Termius or their laptop.
- Teams cannot write workflow code that directly uses the VPS key.
- VPS firewall can allow SSH only from the organizer deployer IP.
- Public users can access only the live website on HTTP/HTTPS.
