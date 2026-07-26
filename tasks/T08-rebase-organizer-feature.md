# T08 - Rebase Organizer Feature

## Metadata

- Release: 01:00
- Points: 20
- Automated Points: 17
- Judge Points: 3
- Level: Easy
- Expected branch: `task/T08-rebase-organizer-feature`
- Expected PR title: `[T08] Rebase Organizer Feature`
- Related organizer asset branch: `task-assets/rebase-feature`

## Participant Instructions

Rebase the organizer-provided feature branch onto current main, resolve any small drift, and fast-forward the result through a reviewed PR.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.
- Fetch and inspect `task-assets/rebase-feature` before starting this task.

## What Organizers Provide

Organizers provide the asset branch:

```text
task-assets/rebase-feature
```

Participants must fetch this branch, rebase its work onto current `main`, and integrate it through a reviewed PR.

## Participant Setup Steps

1. Run `git fetch origin task-assets/rebase-feature`.
2. Create a task branch from that asset branch or fetch it locally.
3. Rebase the feature work onto current `main`.
4. Resolve any drift, build, and open a PR.
5. Merge only after review and verify the feature through live evidence if available, or through PR/build/fallback evidence if the site is not live yet.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Expected feature appears in live evidence or PR/build fallback evidence; history shows a rebase/fast-forward integration pattern; PR contains teammate review and no AI marker.

## Independence / Fallback Evidence

T08 is independent Git/PR work.

- Live Evidence: if a live deploy exists, the integrated feature appears on the live site or live status evidence.
- No-Live Fallback Evidence: full points can be confirmed from the task branch, PR diff, rebase/cherry-pick history, passing build, and absence of AI markers.
- Minimum Evidence: the organizer feature commit/change must be present without unrelated branch damage or force-pushed `main`.

## Judge Question

Why did rebase make sense for this branch, and when would it be unsafe?

## Judge Scoring Guidance

Judge points for this task: 3. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 3: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Lost previous work, merged unrelated branch, force-pushed main, cannot explain rebase, or marker left behind.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Fetch task-assets/rebase-feature from origin and inspect the commits.
- Create a working branch from that asset branch, rebase it onto current main, resolve drift, then open a PR.
- After merge, verify the feature marker is visible in live evidence if available or in source/build fallback evidence if not.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Practice bringing in organizer-provided Git history safely through a normal branch and PR.

**Prerequisites:**
- Organizer branch exists, usually `task-assets/rebase-feature` or `challenge/rebase-insights`.
- Local repo has the latest remote branches.
- No direct edits to `main`.

**Step-by-step test path:**
1. Fetch branches: `git fetch origin`.
2. Create the task branch from main: `git checkout main && git pull && git checkout -b task/T08-rebase-organizer-feature`.
3. Inspect the organizer branch: `git log --oneline --decorate origin/task-assets/rebase-feature -5` and `git diff main..origin/task-assets/rebase-feature`.
4. Bring in the work with either `git rebase origin/main origin/task-assets/rebase-feature` followed by a branch push, or simpler for testing: `git cherry-pick <organizer-commit-sha>`.
5. If conflicts appear, open the files, keep the organizer feature plus current main behavior, then run `git add <file>` and `git rebase --continue` or complete the cherry-pick.
6. Run `npm run build`, push the branch, and open PR `[T08] Rebase Organizer Feature` explaining what commit was brought in.

**Files likely touched:**
- Files changed by the organizer branch
- SUBMISSION.md

**What success looks like:**
- PR contains organizer feature changes without unrelated rewrites.
- Build passes.
- PR description names the source branch/commit.
- Git history shows a normal reviewed path into main.

**Common beginner mistakes:**
- Working directly on `main`.
- Copy-pasting files without preserving review evidence.
- Dropping current main changes during conflict resolution.
- Force-pushing over someone else’s branch.
- Not fetching the latest remote branch first.

Organizer verification focus:
- Confirm completed task evidence still works after the rebase and no force-push damaged shared main history.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
