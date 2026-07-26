# T27 - Secret Leak Drill

## Metadata

- Release: 03:45
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Hard
- Expected branch: `task/T27-secret-leak-drill`
- Expected PR title: `[T27] Secret Leak Drill`
- Related organizer asset branch: `task-assets/secret-leak`

## Participant Instructions

Find and remediate an organizer-seeded test-token leak across source, history, workflow output, and deploy artifacts.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.
- Fetch and inspect `task-assets/secret-leak` before starting this task.

## What Organizers Provide

Organizers provide the incident branch and fake token:

```text
task-assets/secret-leak
SEEDED_TEST_TOKEN=DEPLOY_SPRINT_TEST_TOKEN_T23_DO_NOT_USE
SCAN_TARGETS=source, workflows, generated output, logs, artifacts
```

The token is fake, but participants must handle it like a real leaked credential.

## Participant Setup Steps

1. Fetch `task-assets/secret-leak`.
2. Search for `DEPLOY_SPRINT_TEST_TOKEN_T23_DO_NOT_USE` in source, workflows, generated output, and logs.
3. Remove the leaked token and unsafe workflow output.
4. Add a cleanup note explaining history/log assessment and rotation/revocation decision.
5. Re-run scans and attach results to the PR or submission note.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Repository/log scan is clean for the seeded token; cleanup note documents removal, history/log assessment, and rotation/revocation decision.

## Independence / Fallback Evidence

T27 is independent secret-hygiene incident work.

- Live Evidence: if artifacts or deploy output exist, scans include those outputs as well as source and workflows.
- No-Live Fallback Evidence: full points can be confirmed from source/workflow scans, removal of the seeded fake token, a prevention scan step, and a rotation/revocation note.
- Minimum Evidence: no real secret may be introduced while fixing the fake leak.

## Judge Question

What are the steps after discovering a secret has been leaked?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Token still present, only hidden from UI, no history/log assessment, new secret exposed, or cleanup note missing.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Fetch task-assets/secret-leak and locate the seeded test token in source, generated output, or workflow logs.
- Remove the token, add a cleanup note, and document whether history/log rotation or revocation is required.
- Scan repository files, generated dist, and workflow output for the seeded value before scoring.


Additional organizer setup detail:

Use the seeded fake token only. Do not create a real credential leak for this task.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Find and remove a seeded fake secret leak, then show how the team would prevent and rotate it safely.

**Prerequisites:**
- Organizer seeded fake token branch exists, usually `task-assets/secret-leak`.
- The token is fake and should be treated as sensitive for process practice.
- No real credentials are needed.

**Step-by-step test path:**
1. Fetch and inspect the seeded branch: `git fetch origin task-assets/secret-leak` and `git diff main..origin/task-assets/secret-leak`.
2. Create branch `task/T27-secret-leak-drill` and apply or reproduce the seeded leak as organizers instruct.
3. Search for suspicious values with `rg "TOKEN|SECRET|KEY|BEGIN .*PRIVATE|password|api"`.
4. Remove the fake leaked value from source and replace it with a placeholder or GitHub Secret reference.
5. Add or update a scan step in CI. A simple beginner version can run `rg` for the specific fake marker and fail if it appears.
6. Document rotation steps in the PR: revoke/rotate the exposed credential, update GitHub Secret, redeploy, and audit logs. Make clear the event token was fake.
7. Run CI and confirm the scan passes after cleanup.

**Files likely touched:**
- Seeded file from task-assets/secret-leak
- .github/workflows/ci.yml
- .env.example if placeholder names are added
- SUBMISSION.md

**What success looks like:**
- Fake secret no longer appears in source.
- CI has a scan/check to prevent the same leak marker.
- PR explains rotation procedure without exposing a real secret.
- Build still passes.

**Common beginner mistakes:**
- Leaving the fake token in Git history without explaining mitigation.
- Replacing fake token with a real token.
- Printing secrets while testing scans.
- Only deleting the file but not adding prevention.
- Using screenshots that reveal values.

Organizer verification focus:
- Confirm the fix does not introduce a real secret and that scans cover source, Actions logs, generated files, and image/artifact metadata.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
