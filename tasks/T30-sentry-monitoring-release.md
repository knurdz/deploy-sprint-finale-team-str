# T30 - Sentry Monitoring Release

## Metadata

- Release: 04:15
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Medium
- Expected branch: `task/T30-sentry-monitoring-release`
- Expected PR title: `[T30] Sentry Monitoring Release`

## Participant Instructions

Add Sentry monitoring and release tracking to the React site. Configure the client DSN safely, keep the Sentry auth token secret, and create a Sentry release from GitHub Actions.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the target Sentry setup or require your team to create one:

```text
SERVICE=Sentry
REACT_DOCS=https://docs.sentry.io/platforms/javascript/guides/react/
RELEASE_ACTION_DOCS=https://docs.sentry.io/product/releases/setup/release-automation/github-actions/
REQUIRED_VALUES=SENTRY_DSN,SENTRY_AUTH_TOKEN,SENTRY_ORG,SENTRY_PROJECT
STATUS_FIELD=monitoring.provider=sentry
SAFE_CLIENT_VALUE=SENTRY_DSN
SECRET_VALUE=SENTRY_AUTH_TOKEN
```

`SENTRY_DSN` may be client-visible. `SENTRY_AUTH_TOKEN` must stay secret and should only be used by GitHub Actions or build/release automation.

## Participant Setup Steps

1. Create or log in to Sentry.
2. Create a React/browser JavaScript project and copy the DSN.
3. Create a Sentry auth token for CI/release automation using the minimum scopes needed for releases/source maps.
4. Add GitHub Secrets: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`.
5. Install and initialize `@sentry/react` in the app.
6. Add a safe test-error button or route that judges can trigger intentionally.
7. Add a GitHub Actions release step that uses the Sentry token without printing it.
8. Update `/status` with `monitoring.provider=sentry` and release identifier.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- `@sentry/react` installed and initialized.
- GitHub Actions release step referencing Sentry secrets.
- A safe test-error trigger documented for judges.
- `/status` or fallback generated status/release evidence showing Sentry monitoring and release metadata.

## Acceptance Evidence

Package includes Sentry SDK; source initializes Sentry; workflow references Sentry secrets; live `/status` or fallback generated status/release evidence includes Sentry release metadata.

## Independence / Fallback Evidence

T30 can be scored before live deployment using SDK, workflow, and generated release metadata evidence.

- Live Evidence: if live deploy exists, `/status` includes Sentry release metadata and judges can trigger the safe test-error path.
- No-Live Fallback Evidence: full points can be confirmed from `@sentry/react` installation, Sentry initialization source, workflow references to Sentry secrets, generated release metadata, and a documented safe test-error route/button.
- Minimum Evidence: `SENTRY_AUTH_TOKEN` must never appear in browser code, logs, or artifacts.

## Judge Question

Which Sentry value is safe to expose to the browser, and which one must stay secret?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

`SENTRY_AUTH_TOKEN` committed or printed, no Sentry initialization, no release automation, no test-error path, or `/status`/fallback evidence lacks monitoring metadata.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create a Sentry test project first so organizers know the expected DSN/org/project fields.
- Prefer per-team Sentry projects or per-team auth tokens for the real finale.
- Trigger the safe test-error path once and confirm Sentry receives it before awarding full points.
- Run `node organizer/validate-service-integrations.mjs --url <PUBLIC_URL>` after deployment to check public evidence, or use local/source checks and generated release metadata before live deployment.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Add Sentry frontend monitoring and release metadata while keeping the auth token secret.

**Prerequisites:**
- Sentry project or organizer-provided DSN/org/project/token placeholders.
- GitHub Secrets: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- Network access from Actions to Sentry if release upload is tested.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T30-sentry-monitoring-release`.
2. Install the SDK: `npm install @sentry/react` and commit the updated lockfile.
3. Initialize Sentry in `src/main.tsx` or a small `src/sentry.ts` helper. `SENTRY_DSN` may become client-visible, but do not expose `SENTRY_AUTH_TOKEN` to the app.
4. Add a safe test-error button or route that intentionally throws only when clicked by judges, such as `/sentry-test` or a clearly labeled button.
5. Add workflow steps for Sentry release creation/source-map upload using `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` from GitHub Secrets. Do not echo token values.
6. Update `/status` or fallback generated release evidence with `monitoring.provider=sentry`, release name, commit SHA, and whether release automation ran.
7. Run build and, if using real credentials, trigger the test error and confirm the event appears in Sentry.

**Files likely touched:**
- package.json
- package-lock.json
- src/main.tsx or src/sentry.ts
- .github/workflows/deploy.yml
- status/release manifest files

**What success looks like:**
- `@sentry/react` is installed and initialized.
- Actions references Sentry secrets for release automation.
- Live `/status` or fallback generated release evidence includes Sentry release metadata.
- A safe test-error path exists and is understood by the team.

**Common beginner mistakes:**
- Putting `SENTRY_AUTH_TOKEN` in browser code.
- Assuming DSN and auth token have the same secrecy level.
- Adding a test error that crashes normal page load.
- Forgetting to commit lockfile changes after installing SDK.
- Printing Sentry token in workflow logs.

Organizer verification focus:
- Confirm `SENTRY_AUTH_TOKEN` is only used as a secret in Actions/build automation.
- Confirm `SENTRY_DSN` exposure is intentional and understood by the team.
- Confirm Sentry release metadata maps to the deployed or fallback artifact commit.
