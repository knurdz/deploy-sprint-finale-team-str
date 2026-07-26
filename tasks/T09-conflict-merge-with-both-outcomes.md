# T09 - Conflict Merge With Both Outcomes

## Metadata

- Release: 01:00
- Points: 20
- Automated Points: 17
- Judge Points: 3
- Level: Easy
- Expected branch: `task/T09-conflict-merge-with-both-outcomes`
- Expected PR title: `[T09] Conflict Merge With Both Outcomes`
- Related organizer asset branch: `task-assets/conflict-merge`

## Participant Instructions

Merge the released conflict branch and preserve both intended website changes while keeping build working and live or fallback evidence valid.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.
- Fetch and inspect `task-assets/conflict-merge` before starting this task.

## What Organizers Provide

Organizers provide the asset branch:

```text
task-assets/conflict-merge
```

The branch intentionally creates a content conflict. Participants must preserve both useful outcomes.

## Participant Setup Steps

1. Run `git fetch origin task-assets/conflict-merge`.
2. Create a task branch from current `main`.
3. Merge the asset branch into the task branch.
4. Resolve conflicts by preserving both intended content changes.
5. Run build and search for conflict markers before opening the PR.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Both T09 content markers appear in live evidence or source/build fallback evidence; no conflict markers remain; CI passes on the merge commit.

## Independence / Fallback Evidence

T09 is independent Git conflict-resolution work.

- Live Evidence: if a live deploy exists, both resolved content markers appear on the live site or status evidence.
- No-Live Fallback Evidence: full points can be confirmed from the resolved files, PR diff, passing build, and a source search showing no conflict markers remain.
- Minimum Evidence: both intended changes must be preserved; choosing only one side is not enough.

## Judge Question

Which file conflicted, and what rule did you use to keep both useful changes?

## Judge Scoring Guidance

Judge points for this task: 3. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 3: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

One side discarded, conflict markers remain, broken deploy metadata, or merge conflict solved by unrelated rewrite.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Fetch task-assets/conflict-merge or use challenge/conflict-deadlines if testing the legacy conflict branch.
- Merge it into a task branch from current main and resolve the intentional conflict by keeping both useful UI/data changes.
- Run npm run build and verify no <<<<<<<, =======, or >>>>>>> markers remain.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Resolve a real merge conflict while preserving both the current main behavior and the organizer-provided change.

**Prerequisites:**
- Organizer conflict branch exists, usually `task-assets/conflict-merge` or `challenge/conflict-deadlines`.
- Tester understands that conflict markers must not remain.
- Build command works before starting.

**Step-by-step test path:**
1. Fetch branches: `git fetch origin`.
2. Create the task branch: `git checkout main && git pull && git checkout -b task/T09-conflict-merge-with-both-outcomes`.
3. Merge the organizer branch: `git merge origin/task-assets/conflict-merge`.
4. When Git reports conflicts, open each conflicted file and search for `<<<<<<<`, `=======`, and `>>>>>>>`.
5. Edit the file so both intended outcomes remain. Do not simply choose “ours” or “theirs” unless that is genuinely correct.
6. Run `git diff` to review the final resolved content, then `git add <resolved-files>` and `git commit` if the merge did not auto-complete.
7. Run `npm run build`, push, and open PR `[T09] Conflict Merge With Both Outcomes` with a short explanation of the resolution.

**Files likely touched:**
- Conflicted source/data files
- SUBMISSION.md

**What success looks like:**
- No conflict markers remain.
- Both expected pieces of functionality/data are present.
- Build passes.
- PR explains what was kept from each side.

**Common beginner mistakes:**
- Leaving conflict markers in code.
- Deleting one side of the intended change.
- Resolving by replacing the whole file blindly.
- Not running the app/build after conflict resolution.
- Merging the wrong organizer branch.

Organizer verification focus:
- Confirm they did not delete one side of the conflict or revert organizer content to avoid the merge.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
