# T21 - Least-Privilege And Concurrency

## Metadata

- Release: 03:00
- Points: 20
- Automated Points: 17
- Judge Points: 3
- Level: Easy
- Expected branch: `task/T21-least-privilege-and-concurrency`
- Expected PR title: `[T21] Least-Privilege And Concurrency`

## Participant Instructions

Tighten workflow permissions and add deployment concurrency so two pushes cannot corrupt the VPS state.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the safety policy:

```text
DEFAULT_PERMISSIONS=contents: read
DEPLOY_CONCURRENCY_GROUP=production
PR_WORKFLOWS_GET_NO_DEPLOY_SECRETS=true
```

Participants must explain any workflow permission broader than this baseline.

## Participant Setup Steps

1. Add explicit `permissions` to every workflow.
2. Keep PR workflows read-only and without deploy secrets.
3. Add deploy `concurrency` so overlapping deploys are queued or canceled safely.
4. Trigger two quick runs and observe behavior.
5. Document why each write permission is needed.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Workflows define explicit minimal permissions; deploy workflow has concurrency control; two quick commits queue/cancel predictably.

## Independence / Fallback Evidence

T21 is independent workflow-safety work.

- Live Evidence: if deploy workflows exist, overlapping deploys are queued or cancelled safely.
- No-Live Fallback Evidence: full points can be confirmed from workflow YAML, explicit `permissions`, `concurrency` settings, and Actions logs showing queued/cancelled dry-run jobs.
- Minimum Evidence: PR workflows must not receive deploy secrets.

## Judge Question

Which permission is needed for each workflow, and what happens when two deploys overlap?

## Judge Scoring Guidance

Judge points for this task: 3. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 3: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Global write permissions, missing concurrency, unsafe trigger, broken deploy after tightening, or secrets available to PR checks.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T21-least-privilege-and-concurrency.
- Add explicit permissions blocks to every workflow, using read-only defaults except where write access is required.
- Add concurrency to deploy, for example group: production-${{ github.ref }} and cancel-in-progress according to your policy.
- Push two quick commits and confirm the VPS ends in one clean latest state.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Limit workflow permissions and prevent overlapping deploys from racing each other.

**Prerequisites:**
- Existing CI/deploy workflows.
- GitHub Actions supports `permissions` and `concurrency` keys.
- No app code changes required unless status evidence is updated.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T21-least-privilege-and-concurrency`.
2. Add explicit `permissions` to each workflow. CI usually needs `contents: read`; deploy should only get the permissions it actually uses.
3. Add `concurrency` to deploy, for example `group: production-deploy` and choose whether `cancel-in-progress` should be true or false according to event policy.
4. For production deploys, prefer preventing overlap so two deployments cannot write to the same directory at once.
5. Run two workflow dispatches close together and observe that GitHub queues or cancels one instead of running both deploy write steps together.
6. Document the chosen permission and concurrency behavior in the PR.

**Files likely touched:**
- .github/workflows/*.yml
- SUBMISSION.md

**What success looks like:**
- Workflows no longer rely on default broad permissions.
- Deploy workflow has a clear concurrency group.
- Overlapping deploy attempts are queued/cancelled safely.
- Build/deploy still works after restrictions.

**Common beginner mistakes:**
- Using `permissions: write-all`.
- Adding concurrency to CI only but not deploy.
- Cancelling a deploy halfway without making deploy steps idempotent.
- Breaking artifact upload by removing needed permissions without testing.
- Not explaining the chosen `cancel-in-progress` behavior.

Organizer verification focus:
- Confirm deploy still works after permission reduction and PR workflows do not receive deploy secrets.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
