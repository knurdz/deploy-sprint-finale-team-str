# T28 - Race-Safe Idempotent Deploy

## Metadata

- Release: 04:15
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Hard
- Expected branch: `task/T28-race-safe-idempotent-deploy`
- Expected PR title: `[T28] Race-Safe Idempotent Deploy`

## Participant Instructions

Make deployment idempotent and race-safe when two deploys are triggered close together, including cleanup of partial releases.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the race condition test:

```text
TRIGGER_TWO_DEPLOYS=true
EXPECTED_FINAL_STATE=one healthy latest release
NO_ORPHAN_ACTIVE_SERVICE=true
```

Participants must make rerunning or canceling deploys safe.

## Participant Setup Steps

1. Add locking/concurrency around deploy state changes.
2. Make cleanup avoid deleting the active healthy release.
3. Trigger two close deploys.
4. Cancel or interrupt a run if safe to test.
5. Re-run deploy and confirm the final state is one healthy latest release.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Two queued or overlapping workflow runs leave the VPS or simulated deploy state in exactly one healthy latest release state; logs show locking/concurrency behavior.

## Independence / Fallback Evidence

T28 can be tested with dry-run deployment state before a real VPS deployment exists.

- Live Evidence: if production deploy exists, two overlapping runs leave exactly one healthy latest release.
- No-Live Fallback Evidence: full points can be confirmed from workflow concurrency logs and a dry-run script that writes to simulated release directories, handles repeated runs safely, and preserves the active release on failure.
- Minimum Evidence: logs must show race/concurrency behavior and idempotent final state.

## Judge Question

What happens if a deploy is canceled halfway through?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Overlapping runs corrupt state, canceled run leaves broken app, cleanup deletes current release, or no proof under quick successive pushes.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T28-race-safe-idempotent-deploy.
- Add locking/concurrency plus cleanup that never deletes the currently healthy release.
- Trigger two deploys close together and verify the final state is one healthy latest release with no orphaned broken active service.
- Cancel a run mid-way if safe in the test environment and verify rerunning deploy repairs state.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Make repeated or overlapping deploy runs safe so they do not corrupt live or simulated deployment state.

**Prerequisites:**
- Deploy workflow exists.
- T17/T21 patterns may already provide release directories and concurrency.
- VPS deploy path can tolerate release directories or atomic replacement.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T28-race-safe-idempotent-deploy`.
2. Add deploy workflow `concurrency` for production, such as `group: production-deploy`.
3. Make remote commands safe to rerun: use `mkdir -p`, upload to a unique release directory, update symlink atomically, and avoid broad deletes.
4. Add cleanup that removes only old release directories after the new release is healthy.
5. Make service restart commands tolerate missing old containers/services, for example `docker rm -f app || true` only when followed by a checked new start.
6. Trigger two deploys close together and confirm one queues/cancels or both complete without corrupting `current`.
7. Record the test in the PR with workflow run links.

**Files likely touched:**
- .github/workflows/deploy.yml
- deploy script if present
- SUBMISSION.md

**What success looks like:**
- Running deploy twice leaves the site healthy.
- Overlapping deploys do not write into the same temporary directory.
- Workflow logs show concurrency or lock behavior.
- Cleanup does not remove the active release.

**Common beginner mistakes:**
- Using `rm -rf` on a variable that may be empty.
- Uploading directly into the live or simulated active directory.
- No unique release ID per deploy.
- Ignoring failed upload and still switching live or simulated active pointer.
- Assuming concurrency alone fixes non-idempotent shell commands.

Organizer verification focus:
- Confirm interrupted or canceled runs do not leave broken containers, stale symlinks, or orphaned release directories.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
