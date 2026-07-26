# T13 - Feature Bundle With Tests

## Metadata

- Release: 01:30
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T13-feature-bundle-with-tests`
- Expected PR title: `[T13] Feature Bundle With Tests`
- Related organizer asset branch: `task-assets/feature-bundle`

## Participant Instructions

Integrate a provided multi-file feature bundle into the correct app locations and add a focused validation test or script for it.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.
- Fetch and inspect `task-assets/feature-bundle` before starting this task.

## What Organizers Provide

Organizers provide the asset branch and bundle path:

```text
task-assets/feature-bundle
task-assets/feature-bundle/src/components/ReleaseReadiness.tsx
task-assets/feature-bundle/src/data/releaseReadiness.ts
task-assets/feature-bundle/scripts/check-release-readiness.mjs
AI marker to remove: AI-REVIEW-MARKER:T13
```

Participants must copy only the needed files into the correct project locations and add a focused validation script.

## Participant Setup Steps

1. Fetch `task-assets/feature-bundle`.
2. Copy the provided component, data, and script into correct project locations.
3. Integrate the component into the app.
4. Add the validation script to `package.json`.
5. Remove `AI-REVIEW-MARKER:T13`, run build and validation, then open the PR.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Feature renders in live evidence or app/build fallback evidence; new test/script fails before feature and passes after; no AI-REVIEW-MARKER:T13 remains.

## Independence / Fallback Evidence

T13 is independent feature-integration work.

- Live Evidence: if a live deploy exists, the bundled feature is visible on the site.
- No-Live Fallback Evidence: full points can be confirmed from PR diff, copied bundle files, marker cleanup scan, build output, and validation script/test results.
- Minimum Evidence: `AI-REVIEW-MARKER:T13` must be removed and the team must explain where the provided files were placed.

## Judge Question

What did the new test prove, and where did each bundle file belong?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

No test, wrong placement, marker remains, import hacks, or feature only works by disabling existing behavior.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Fetch task-assets/feature-bundle and copy only the needed files into the correct app locations.
- Add a focused validation script or test, for example checking expected text in built output or a small unit-style data check.
- Remove AI-REVIEW-MARKER:T13 from copied files before merging.
- Run npm run build and the new validation script before opening the PR.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Apply organizer-provided feature files, remove AI marker text, and prove the feature works with checks.

**Prerequisites:**
- Organizer feature bundle branch or copied bundle path, usually `task-assets/feature-bundle`.
- Expected marker string such as `AI-REVIEW-MARKER`.
- Current app builds before applying the bundle.

**Step-by-step test path:**
1. Fetch the organizer branch: `git fetch origin task-assets/feature-bundle`.
2. Create the task branch: `git checkout main && git pull && git checkout -b task/T13-feature-bundle-with-tests`.
3. Inspect the bundle with `git diff main..origin/task-assets/feature-bundle` before copying or cherry-picking.
4. Apply the bundle using `git cherry-pick <commit-sha>` or manually copy the listed files if organizers gave a folder instead of a branch.
5. Search for markers: `rg "AI-REVIEW-MARKER|TODO generated|remove me"` and remove any marker text intentionally left in the bundle.
6. Run `npm run build`. If there are tests in the repo, run them too; otherwise document a manual browser check.
7. Open PR `[T13] Feature Bundle With Tests` explaining the files added, marker cleanup, and verification result.

**Files likely touched:**
- Feature files from the organizer bundle
- team-site/src/App.tsx or component/data files
- SUBMISSION.md

**What success looks like:**
- Feature appears in the app.
- No AI marker strings remain.
- Build/test evidence passes.
- PR explains how the bundle was reviewed instead of blindly pasted.

**Common beginner mistakes:**
- Leaving marker text in source or UI.
- Applying unrelated branch changes.
- Skipping build after copying files.
- Claiming tests exist when only a manual check was done.
- Not reviewing generated-looking code.

Organizer verification focus:
- Confirm files were placed according to project structure, not pasted into one monolithic component.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
