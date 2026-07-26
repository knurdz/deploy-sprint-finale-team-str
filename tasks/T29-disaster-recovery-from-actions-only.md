# T29 - Disaster Recovery From Actions Only

## Metadata

- Release: 04:15
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Hard
- Expected branch: `task/T29-disaster-recovery-from-actions-only`
- Expected PR title: `[T29] Disaster Recovery From Actions Only`

## Participant Instructions

After organizers reset the app directory or remove the running container, recover the site using GitHub Actions only and prove the restored service matches the latest confirmed release.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the simulated disaster and restore target:

```text
SIMULATED_FAILURE=remove app directory or running container
RESTORE_TARGET=latest confirmed artifact/digest
MANUAL_VPS_REPAIR_ALLOWED=false
```

Participants must recover using GitHub Actions only.

## Participant Setup Steps

1. Prepare recovery workflow using the latest confirmed artifact/digest.
2. Recreate directories, env file, service/container config, and running service from Actions.
3. Ask organizers to simulate removing the app directory or container.
4. Run recovery workflow.
5. Verify `/status` matches the latest confirmed release with no manual VPS repair.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Recovery workflow recreates runtime files/service/container or simulated runtime state; live `/status` or fallback manifest returns latest confirmed release; manifest links recovery run to restored artifact/digest.

## Independence / Fallback Evidence

T29 can be rehearsed with simulated deployment state before T01 is live.

- Live Evidence: if a VPS deployment exists, recovery recreates runtime state and live health/status returns to the latest confirmed release.
- No-Live Fallback Evidence: full points can be confirmed from an Actions-only recovery workflow that recreates simulated app directories, env placeholders, service/container config, and a generated recovery manifest from a seeded restore target.
- Minimum Evidence: recovery must be auditable in Actions and must not rely on manual VPS repair.

## Judge Question

If the VPS app directory is empty, what does your workflow recreate and in what order?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Manual server repair, missing runtime recreation, restored wrong release, credentials exposed, or recovery not repeatable.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T29-disaster-recovery-from-actions-only.
- Prepare a recovery workflow that recreates runtime directories, service/container config, env file, and the latest confirmed artifact from GitHub Actions only.
- For testing, have organizers remove the app directory or running container, then run the recovery workflow.
- Confirm live `/status` or fallback recovery manifest matches the latest confirmed release and no manual VPS repair was used.


Additional organizer setup detail:

Simulate recovery only after the team has at least one confirmed healthy release artifact or image digest.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Prove the team can recover a broken or missing deployment using only GitHub Actions and documented release evidence.

**Prerequisites:**
- At least one known-good release artifact/tag exists.
- Rollback/deploy workflow exists, or the team creates a recovery workflow and uses organizer-provided simulated artifacts.
- Organizer provides a simulated failure condition such as missing current symlink, stopped container, or bad release path.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T29-disaster-recovery-from-actions-only`.
2. Write a short recovery runbook in the PR or `docs/recovery.md`: identify failure, choose known-good release, run recovery workflow, verify `/health`, update incident note.
3. Create or update a `workflow_dispatch` recovery workflow that accepts a safe release identifier and redeploys it using existing artifacts/images.
4. Ask organizers to simulate the failure, or simulate only through an Actions-controlled workflow if this is a dry run.
5. Run the recovery workflow from GitHub Actions. Do not SSH manually into the VPS to repair files.
6. Verify `PUBLIC_URL/health` and `/status` after live recovery, or inspect fallback recovery manifest after dry-run recovery, and record the workflow run link.

**Files likely touched:**
- .github/workflows/recover.yml or rollback workflow
- docs/recovery.md
- release manifest/status files or fallback recovery manifest files
- SUBMISSION.md

**What success looks like:**
- Recovery workflow restores the site to healthy state.
- Runbook is clear enough for another organizer to follow.
- Live status shows recovered release and recovery time.
- All recovery actions are auditable in GitHub Actions.

**Common beginner mistakes:**
- Repairing manually through Termius.
- Recovering by rebuilding unknown current source.
- No documented known-good release or seeded restore target.
- Not verifying public health after recovery.
- Runbook contains secret values.

Organizer verification focus:
- Confirm no direct VPS login, no manual file copy, and recovery can be repeated from the repository plus organizer-held deploy access.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
