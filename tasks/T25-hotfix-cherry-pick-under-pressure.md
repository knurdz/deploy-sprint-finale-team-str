# T25 - Hotfix Cherry-Pick Under Pressure

## Metadata

- Release: 03:45
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T25-hotfix-cherry-pick-under-pressure`
- Expected PR title: `[T25] Hotfix Cherry-Pick Under Pressure`
- Related organizer asset branch: `task-assets/hotfix`

## Participant Instructions

Cherry-pick the organizer-provided hotfix commit from a release branch while excluding unrelated experimental commits.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.
- Fetch and inspect `task-assets/hotfix` before starting this task.

## What Organizers Provide

Organizers provide the asset branch:

```text
task-assets/hotfix
```

This branch contains a real hotfix commit and unrelated experimental work. Participants must cherry-pick only the hotfix.

## Participant Setup Steps

1. Fetch `task-assets/hotfix`.
2. Identify the hotfix commit and the unrelated experimental commit.
3. Create a task branch from `main`.
4. Cherry-pick only the hotfix commit.
5. Verify the experimental marker/file is absent from `main`.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Main includes the hotfix behavior and original commit reference; unrelated branch markers are absent; live app or build/source fallback evidence shows the T25 fix.

## Independence / Fallback Evidence

T25 is independent Git/PR work.

- Live Evidence: if a live deploy exists, the hotfix behavior appears in the app.
- No-Live Fallback Evidence: full points can be confirmed from cherry-pick history, PR diff, passing build, and absence of unrelated experimental markers.
- Minimum Evidence: only the hotfix commit/change should land, not the whole organizer branch.

## Judge Question

Why was cherry-pick the right tool here instead of merging the branch?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Merged whole branch, missed part of patch, copied without evidence, or introduced unrelated experimental code.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Fetch task-assets/hotfix and identify the organizer hotfix commit.
- Create a task branch from main and cherry-pick only that commit, not the whole asset branch.
- Open a PR referencing the original commit SHA and verify unrelated experimental markers are absent.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Bring in an organizer hotfix quickly while preserving review, CI, and deploy evidence.

**Prerequisites:**
- Organizer hotfix branch exists, usually `task-assets/hotfix`.
- Main branch may have moved after the hotfix was prepared.
- CI must still pass.

**Step-by-step test path:**
1. Fetch the hotfix branch: `git fetch origin task-assets/hotfix`.
2. Create the task branch from current main: `git checkout main && git pull && git checkout -b task/T25-hotfix-cherry-pick-under-pressure`.
3. Inspect the hotfix: `git diff main..origin/task-assets/hotfix`.
4. Cherry-pick the specific hotfix commit: `git cherry-pick <hotfix-commit-sha>`.
5. If conflicts appear, resolve only what is needed for the hotfix; avoid opportunistic refactors.
6. Run `npm run build`, push, and open PR `[T25] Hotfix Cherry-Pick Under Pressure`.
7. After merge/deploy, verify the hotfix behavior and include commit/evidence in `SUBMISSION.md`.

**Files likely touched:**
- Files changed by hotfix branch
- SUBMISSION.md

**What success looks like:**
- PR contains only the hotfix and necessary conflict resolution.
- Build passes.
- Live site shows the fixed behavior.
- PR links the source hotfix branch/commit.

**Common beginner mistakes:**
- Merging the entire branch with unrelated changes.
- Applying hotfix directly on main.
- Skipping CI because it is urgent.
- Losing the hotfix during conflict resolution.
- Not documenting which bug was fixed.

Organizer verification focus:
- Confirm the team did not merge the whole branch and can identify the exact original commit.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
