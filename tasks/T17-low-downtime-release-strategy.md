# T17 - Low-Downtime Release Strategy

## Metadata

- Release: 02:00
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Hard
- Expected branch: `task/T17-low-downtime-release-strategy`
- Expected PR title: `[T17] Low-Downtime Release Strategy`

## Participant Instructions

Implement a blue-green, symlinked-release, or equivalent strategy so a failed new release does not replace the last healthy version.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the expected health gate:

```text
HEALTH_URL=<PUBLIC_URL>/health
SWITCH_ONLY_AFTER_HEALTH=true
KEEP_PREVIOUS_RELEASE_ON_FAILURE=true
```

Organizers may provide a deliberately bad release to test the failure path.

## Participant Setup Steps

1. Choose blue-green containers, symlinked releases, or equivalent.
2. Deploy new release without killing the current healthy release first.
3. Health-check the new release.
4. Switch traffic only after health passes.
5. Prove the old release survives a failed new release.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Logs show candidate release health/fallback check before switch; known-good release remains available on failure; live health remains stable when live evidence exists.

## Independence / Fallback Evidence

T17 can be tested with simulated release directories before a live deploy exists.

- Live Evidence: if production exists, health remains stable while the new release is prepared and switched after checks pass.
- No-Live Fallback Evidence: full points can be confirmed from a dry-run workflow or script that creates `releases/<sha>`, checks a candidate release, updates a `current` pointer only after success, and preserves a known-good release on failure.
- Minimum Evidence: logs must show prepare, health/check, switch, and failure-preserves-current behavior.

## Judge Question

What exact step switches traffic, and what stops it from switching to a bad release?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Old version killed first, no failure path, long avoidable downtime, manual fix required, or health check not meaningful.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T17-low-downtime-release-strategy.
- Use blue-green containers, symlinked release directories, or an equivalent switch-after-health-check pattern.
- Keep the known-good release running or selected until the candidate release passes health/fallback checks.
- Simulate failure by deploying a build with a failing health check and confirm traffic does not switch.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Deploy new releases into separate directories and switch a pointer only after the new release is ready.

**Prerequisites:**
- VPS deploy path exists.
- Deploy workflow can SSH through Actions.
- At least one known-good release exists or can be seeded for live or dry-run testing.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T17-low-downtime-release-strategy`.
2. Update deploy so each release goes into a new directory like `$DEPLOY_PATH/releases/$GITHUB_SHA`.
3. Upload/extract the new artifact into that release directory first. Do not replace the current live or simulated active files yet.
4. Run a quick remote check against the new release files or container before switching.
5. Switch live traffic or simulated active state by updating a `current` symlink or restarting a service to point at the new release only after checks pass.
6. Keep at least one known-good release directory so rollback can point back quickly.
7. Record `currentRelease`, `previousRelease`, and deploy time in `/status` or the release manifest.

**Files likely touched:**
- .github/workflows/deploy.yml
- deploy script if present
- status/release manifest files
- SUBMISSION.md

**What success looks like:**
- Live site does not disappear while files are uploading.
- `current` or equivalent points to the newest checked release.
- Previous release remains available.
- Status, workflow summary, or manifest evidence shows current and known-good release identifiers.

**Common beginner mistakes:**
- Deleting the old release before the new one is healthy.
- Switching live path or simulated active pointer before upload completes.
- Using `rm -rf $DEPLOY_PATH` broadly.
- Not keeping rollback target.
- Not quoting shell variables in deploy commands.

Organizer verification focus:
- Confirm failure path by organizer-provided bad release or dry-run evidence and verify old version survives.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
