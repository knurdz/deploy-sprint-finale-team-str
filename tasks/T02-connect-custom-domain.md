# T02 - Connect Custom Domain

## Metadata

- Release: 00:00
- Points: 35
- Automated Points: 29
- Judge Points: 6
- Level: Medium
- Expected branch: `task/T02-connect-custom-domain`
- Expected PR title: `[T02] Connect Custom Domain`

## Participant Instructions

Connect the assigned custom subdomain to your team site using the organizer DNS portal. Configure the required A or CNAME record, add the TXT verification record, update your deployment/public URL config, and prove the domain points to your site.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide a DNS-like portal and one assigned domain record pack:

```text
DNS_PORTAL_URL=<organizer-dns-portal-url>
DNS_PORTAL_USERNAME=<team-dns-username>
DNS_PORTAL_PASSWORD=<provided-separately>
ASSIGNED_DOMAIN=team01.verischolar.knurdz.org
DNS_RECORD_TYPE=A or CNAME
DNS_RECORD_NAME=team01.verischolar
DNS_RECORD_VALUE=<team-vps-ip-or-origin-host>
DNS_TXT_NAME=_deploy-sprint-challenge.team01.verischolar
DNS_TXT_VALUE=<team-challenge-token>
DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org
PUBLIC_URL=https://team01.verischolar.knurdz.org
DOMAIN_HTTP_URL=http://team01.verischolar.knurdz.org
IP_PUBLIC_URL=http://<team-vps-ip>
```

The portal credentials are for DNS setup only. Do not commit them. If your workflow stores any DNS portal credential or challenge token, use GitHub Secrets.

## Participant Setup Steps

1. Log in to the organizer DNS portal using the provided URL, username, and password.
2. Open your assigned zone or team domain page.
3. Create the required `A` or `CNAME` record exactly as provided by organizers.
4. Create the TXT verification record using `DNS_TXT_NAME` and `DNS_TXT_VALUE`.
5. Click **Create Records** in the DNS portal. The portal creates Hostinger records and asks GitHub to switch the team repo/deployer URL variables to the assigned HTTPS domain, set the deployer domain name, and enable domain TLS automatically.
6. Add or update `/status` or a fallback manifest with `domain.connected=true`, assigned host, record type, DNS target, and verification timestamp.
7. Verify DNS with `dig` or `nslookup` and save the output in the PR or submission note.
8. If the site is already live, open the assigned domain over HTTPS and verify `/health` and `/status`.
9. Also verify the compatibility paths still work: `http://team01.verischolar.knurdz.org/health` and the raw `IP_PUBLIC_URL/health` must remain accessible without forcing HTTPS-only behavior.

Secret setup reminder:
1. Open the GitHub repository.
2. Go to Settings > Secrets and variables > Actions.
3. Store portal passwords, TXT challenge tokens, and any DNS API tokens as secrets if they are used by Actions.
4. Safe public values such as `ASSIGNED_DOMAIN` and record type may be repository variables if organizers allow it.
5. Never paste portal passwords or challenge token values into PRs, screenshots, issues, or logs.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

DNS portal shows the correct A/CNAME record and TXT verification record; `dig` or `nslookup` resolves the assigned domain to the expected target; HTTPS works on the assigned domain; plain HTTP still works on the assigned domain; the raw IP URL still works over HTTP; fallback evidence includes portal export, DNS lookup logs, and host-header dry-run evidence; `/status` or fallback manifest shows `domain.connected=true`.

## Independence / Fallback Evidence

T02 can be scored before the site is fully live if DNS and configuration evidence are complete.

- Live Evidence: assigned HTTPS domain opens the site, assigned HTTP domain still opens the site, raw IP HTTP still opens the site, `/health` passes, and `/status` shows domain connection metadata.
- No-Live Fallback Evidence: full points can be confirmed from DNS portal export/screenshots without secrets, `dig`/`nslookup` logs, host-header dry-run evidence, GitHub config updates, and a generated domain status manifest.
- Minimum Evidence: correct A/CNAME record, correct TXT challenge record, no committed portal credentials, and a status/manifest marker for `domain.connected=true`.

## Judge Question

What DNS record did you create, why was it A or CNAME, and how did you verify the domain points to your team site?

## Judge Scoring Guidance

Judge points for this task: 6. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 6: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Wrong record type, missing TXT challenge, stale `PUBLIC_URL`, HTTPS not enabled after DNS connection, HTTP domain blocked or forced into a broken HTTPS path, raw IP URL broken after TLS setup, raw portal credentials committed or pasted into PR evidence, DNS lookup not shown, or status evidence missing domain metadata.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch `task/T02-connect-custom-domain`.
- Use the organizer DNS portal to create the assigned A/CNAME and TXT records for a team domain.
- If no real DNS portal is available in dry run, provide a portal export JSON/screenshot and run lookup checks against a controlled test zone or mocked record output.
- Use the DNS portal automation so `PUBLIC_URL` and domain status refer to the assigned HTTPS domain, while HTTP domain and raw IP access still work.
- Verify no portal password, DNS API token, or TXT challenge value is committed.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Connect a friendly team subdomain to the site and prove DNS ownership/configuration without leaking portal credentials.

**Prerequisites:**
- Organizer DNS portal URL and team login.
- Assigned A/CNAME record values and TXT challenge values.
- VPS IP/origin hostname or a dry-run DNS target.
- T01 live deploy is helpful but not required because fallback DNS evidence is valid.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T02-connect-custom-domain`.
2. Log in to the DNS portal using the provided team credentials. Do not save the password in the repo.
3. Add the A/CNAME record exactly as assigned. Example: `team01.verischolar` A `<team-vps-ip>` or `team01.verischolar` CNAME `<origin-host>`.
4. Add the TXT verification record. Example: `_deploy-sprint-challenge.team01.verischolar` TXT `<team-challenge-token>`.
5. Click **Create Records** in the DNS portal. In the test portal this also attempts to update `PUBLIC_URL=https://team01.verischolar.knurdz.org`, `DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org`, and `PUBLIC_URL_MODE=domain` in the team repo, then `TEAM01_PUBLIC_URL=https://team01.verischolar.knurdz.org`, `TEAM01_DOMAIN=team01.verischolar.knurdz.org`, and `TEAM01_ENABLE_DOMAIN_TLS=true` in the organizer deployer.
6. Run `dig team01.verischolar.knurdz.org` and `dig TXT _deploy-sprint-challenge.team01.verischolar.knurdz.org` or equivalent `nslookup` commands.
7. Add safe evidence to the PR: record names, record type, redacted portal screenshot/export, lookup output, and status/manifest output.
8. If the site is live, browse to the HTTPS domain and verify `/health` and `/status`.
9. Confirm plain HTTP compatibility: `curl -I http://team01.verischolar.knurdz.org/health` should return a successful response, and `curl -I http://<team-vps-ip>/health` should also work.
10. If not live, include host-header dry-run or generated manifest evidence.

**Files likely touched:**
- .github/workflows/deploy.yml or config generation workflow
- status/release manifest files
- SUBMISSION.md

**What success looks like:**
- DNS portal contains the expected A/CNAME record.
- TXT challenge record exists and resolves.
- `PUBLIC_URL` now uses the assigned HTTPS domain.
- The assigned domain also works over HTTP.
- The raw IP URL still works over HTTP.
- Live `/status` or fallback manifest includes `domain.connected=true` and the assigned host.

**Common beginner mistakes:**
- Creating an A record with a hostname instead of an IP address.
- Forgetting the TXT verification record.
- Updating DNS but leaving `PUBLIC_URL` as the IP address.
- Sharing portal password or challenge token in screenshots.
- Expecting DNS to update instantly without checking TTL/propagation.

Organizer verification focus:
- Confirm DNS records match the assigned values and the TXT challenge proves team ownership.
- Confirm portal credentials and challenge tokens are not committed or exposed in logs/screenshots.
- Confirm live or fallback evidence connects the assigned domain to the scored repository/workflow.
