# T19 - Post-Deploy Smoke Tests

## Metadata

- Release: 02:30
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T19-post-deploy-smoke-tests`
- Expected PR title: `[T19] Post-Deploy Smoke Tests`

## Participant Instructions

Add a post-deploy verification job that checks production URL, /status commit, /health, and one task-specific page before marking deploy successful.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide required smoke targets:

```text
PUBLIC_URL=<team-public-url>
REQUIRED_PATHS=/ /health /status
EXPECTED_STATUS_COMMIT=<github-sha-or-artifact-sha>
```

Participants must fail the workflow if live evidence or fallback generated evidence does not match the expected release.

## Participant Setup Steps

1. Add a post-deploy job after production rollout.
2. Check `/`, `/health`, `/status`, and one task-specific marker.
3. Use the portal starter snippet as a realistic first draft and run it through GitHub Actions.
4. Inspect the Actions log to confirm the exact target being checked, then refine the script until it checks the intended live or fallback target.
5. Compare live or fallback commit/artifact identity with the expected value.
6. Fail the workflow if any smoke check fails.
7. Link the validation run sequence and successful smoke-test logs in the PR or submission note.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Deploy or dry-run workflow fails when smoke checks fail, shows validation run history, and succeeds only when live or fallback evidence matches expected commit and routes after refinement.

## Independence / Fallback Evidence

T19 can be tested against a local preview, artifact server, or generated files before production is live.

- Live Evidence: if production exists, smoke tests check `/`, `/health`, `/status`, and expected commit/artifact identity on `PUBLIC_URL`.
- No-Live Fallback Evidence: full points can be confirmed from a workflow that serves `dist` locally or inspects generated `team-site/dist/status.json`/`release-manifest.json`, fails on bad expected identity, and passes on the correct artifact.
- Minimum Evidence: the smoke test must be capable of failing the workflow.
- Operational Validation Evidence: the PR must link the starter validation run, name the log line that proved which URL or fallback target was checked, and show the successful rerun after refinement.

## Judge Question

Which smoke check would catch a stale or partially failed deploy?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Checks run before deploy only, ignore failures, do not verify commit, depend on hardcoded stale output, validation run history not preserved, or starter workflow issue left unresolved.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T19-post-deploy-smoke-tests.
- After deploy, curl the production URL, /health, /status, and one task-specific route or marker.
- Fail the workflow if the live `/status` or fallback status/manifest commit does not equal the expected `GITHUB_SHA` or artifact digest.
- For the debug-skill version, the portal starter includes a realistic Actions-only validation issue. Testers should run it once, use the log output to resolve the issue, and preserve both run links.
- Test the failure path by temporarily checking for a wrong marker in a draft branch.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Make the deploy or dry-run workflow verify the release evidence immediately after rollout and fail if core routes or fallback artifacts are broken.

**Prerequisites:**
- A live URL/deploy workflow exists, or the task uses a local preview server/generated fallback artifacts for smoke-test evidence.
- `PUBLIC_URL` secret or variable is configured for live mode, or the workflow serves `dist` locally / inspects generated fallback files for no-live mode.
- `/health` and `/status` routes exist for live mode, or generated `team-site/dist/status.json` / `release-manifest.json` exists for no-live mode.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T19-post-deploy-smoke-tests`.
2. Add a final job or final steps named `smoke-test` after deploy, preview build, or fallback artifact generation.
3. In live mode, use `curl --fail --show-error --location "$PUBLIC_URL/"` to check the homepage. In no-live mode, serve `dist` locally in the workflow or inspect the generated artifact files.
4. In live mode, use `curl --fail "$PUBLIC_URL/health"` to check health. In no-live mode, check the local preview route or generated health/status artifact.
5. Fetch live `/status` or read fallback `team-site/dist/status.json` / `release-manifest.json` and check for the current commit SHA or expected task marker. A simple `grep "$GITHUB_SHA"` is acceptable if the evidence includes it.
6. Add retry logic for startup delay, such as 5 attempts with `sleep 5`, but make the job fail after retries.
7. Push and verify live or no-live fallback smoke tests pass, then optionally test a bad path or wrong marker to see failure behavior.

**Files likely touched:**
- .github/workflows/deploy.yml or .github/workflows/smoke-test.yml
- status/health route files, generated status files, or release manifest files if missing
- SUBMISSION.md

**What success looks like:**
- Deploy or dry-run workflow fails when live routes or fallback evidence are unavailable.
- Successful run shows homepage, health, and status checks, or equivalent fallback artifact checks.
- Smoke tests run after deployment, not before.
- Evidence links to the Actions log.

**Common beginner mistakes:**
- Using `curl` without `--fail` so 404 pages pass.
- Testing the wrong target, such as localhost when public URL evidence is required, or public URL when the task is using fallback artifact evidence.
- Never failing after retries.
- Checking only the homepage.
- Forgetting to quote URLs/secrets.

Organizer verification focus:
- Confirm smoke tests run after deploy and do not only test local build output.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
