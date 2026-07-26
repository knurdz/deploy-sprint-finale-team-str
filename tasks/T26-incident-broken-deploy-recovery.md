# T26 - Incident: Broken Deploy Recovery

## Metadata

- Release: 03:45
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Hard
- Expected branch: `task/T26-incident-broken-deploy-recovery`
- Expected PR title: `[T26] Incident: Broken Deploy Recovery`
- Related organizer asset branch: `task-assets/broken-deploy`

## Participant Instructions

Respond to an organizer-released broken deploy task: identify root cause from Actions/runtime logs, roll back, then submit a forward fix.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.
- Fetch and inspect `task-assets/broken-deploy` before starting this task.

## What Organizers Provide

Organizers provide the incident branch and expected symptom:

```text
task-assets/broken-deploy
EXPECTED_SYMPTOM=workflow uploads/deploys build instead of dist
EXPECTED_FIX=use dist and restore healthy release first if production is affected
```

Participants must preserve failing evidence for review.

## Participant Setup Steps

1. Fetch `task-assets/broken-deploy`.
2. Reproduce or inspect the failing workflow symptom.
3. Record the exact log line showing the root cause.
4. Apply the portal recovery starter and run it through Actions.
5. Inspect the recovery log output and refine the workflow until the recovery target is handled correctly.
6. Roll back first if production is unhealthy.
7. Submit a forward fix that passes deploy and smoke checks.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Failing run exists, recovery run history and successful fixed recovery run are linked, rollback/recovery restores a known-good healthy release or fallback state, PR explains root cause, and forward-fix deploy or dry-run deploy succeeds.

## Independence / Fallback Evidence

T26 can be scored from the seeded broken workflow branch without causing a real production outage.

- Live Evidence: if production exists and is affected, rollback/recovery restores health and a forward fix deploy succeeds.
- No-Live Fallback Evidence: full points can be confirmed from a failed seeded workflow run, log-based root cause note, reviewed fix PR, and successful dry-run recovery/deploy workflow.
- Minimum Evidence: the team must preserve failed-run evidence and explain the root cause.
- Operational Validation Evidence: the PR must link the recovery validation run, name the log line that proved the recovery target handling, and show the successful rerun after refinement.

## Judge Question

Which log line proved the root cause, and why was rollback or forward fix chosen first?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

No root cause, no rollback evidence, hidden failure, checks bypassed, unrelated rewrite, recovery validation history not preserved, or starter recovery issue left unresolved.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Fetch task-assets/broken-deploy and reproduce the failing run or failure condition in a task branch.
- Use Actions/runtime logs to identify the root cause and record the decisive log line in the PR.
- For the debug-skill version, the portal starter includes a realistic Actions-only recovery issue. Testers should run it once, use the log output to resolve the issue, and preserve both run links.
- Run rollback first if production is unhealthy, then merge a forward fix that passes deploy and smoke checks.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Recover from a seeded broken deployment using Actions logs and a reviewed fix, without touching the VPS manually.

**Prerequisites:**
- Organizer broken branch exists, usually `task-assets/broken-deploy`.
- A real deploy workflow exists, or organizers provide the seeded broken workflow branch for dry-run recovery.
- Tester has permission to run Actions and open PRs.

**Step-by-step test path:**
1. Fetch the broken branch: `git fetch origin task-assets/broken-deploy`.
2. Create a test PR or branch that applies the broken change so the failure can be observed in Actions.
3. Open the failed Actions run and identify the failing step. Write down the exact symptom, such as wrong directory, missing secret reference, bad health check, or syntax error.
4. Create fix branch `task/T26-incident-broken-deploy-recovery` from main or the failed branch as organizers specify.
5. Fix the smallest cause of the failure. Do not bypass the failing check unless the check itself is wrong.
6. Run CI/deploy or dry-run recovery again through Actions and confirm the live site or fallback evidence recovers.
7. Add an incident note to the PR or `SUBMISSION.md`: symptom, root cause, fix, and verification link.

**Files likely touched:**
- .github/workflows/*.yml
- affected source/config file
- SUBMISSION.md

**What success looks like:**
- There is a failed run showing the incident.
- There is a later successful run showing recovery.
- The fix is reviewed in a PR.
- No manual VPS changes were needed.

**Common beginner mistakes:**
- Fixing by SSHing into the VPS manually.
- Deleting the failing check instead of solving the cause.
- Changing many unrelated files during incident pressure.
- Not linking failed and recovered runs.
- Assuming a green build means recovery succeeded without checking `/health` or fallback recovery evidence.

Organizer verification focus:
- Confirm team did not delete failing evidence or bypass checks to make the run green.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
