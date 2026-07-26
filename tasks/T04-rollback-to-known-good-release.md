# T04 - Rollback To Known-Good Release

## Metadata

- Release: 00:30
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T04-rollback-to-known-good-release`
- Expected PR title: `[T04] Rollback To Known-Good Release`

## Participant Instructions

Create a manual rollback workflow that redeploys a known-good release tag, artifact, or image digest without editing source code.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide or identify one known-good release seed. This can come from a live deploy, an earlier artifact, or an organizer-provided test artifact:

```text
KNOWN_GOOD_RELEASE=<tag-artifact-id-or-image-digest>
ROLLBACK_INPUT_NAME=release_ref
```

The known-good release must point to a version that passed live checks or organizer-provided fallback checks.

## Participant Setup Steps

1. Identify the known-good release provided by organizers.
2. Add a manual `workflow_dispatch` rollback workflow with a release input.
3. Use the portal starter snippet as a realistic first draft and run it through GitHub Actions.
4. Inspect the Actions log to confirm which release value the workflow used, then refine the workflow until that value is handled correctly.
5. Make rollback deploy the selected artifact/tag/digest without source edits.
6. Run rollback again and verify live `/status`, workflow summary, or rollback manifest changes to the selected release.
7. Link the validation run sequence and successful workflow run in the PR or submission note.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

`workflow_dispatch` accepts a release identifier; Actions history shows the validation run sequence and the final successful rollback run; rollback changes live `/status` or fallback rollback manifest back to the selected known-good release.

## Independence / Fallback Evidence

T04 does not need a team-created earlier release if organizers provide a seeded known-good artifact, tag, or digest.

- Live Evidence: if a live deploy exists, running rollback changes public `/status` back to the selected known-good release.
- No-Live Fallback Evidence: full points can be confirmed from a manual `workflow_dispatch` rollback that accepts `release_ref`, validates it, selects the seeded artifact/tag/digest, and records the selected release in a workflow summary or generated rollback manifest.
- Minimum Evidence: rollback must be audited in Actions and must not require source edits or manual VPS repair.
- Operational Validation Evidence: the PR must link the starter validation run, name the log line that proved which release value was used, and show the successful rerun after refinement.

## Judge Question

If the latest deploy or dry-run release is broken, exactly what input do you provide to roll back?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Rollback is manual server work, arbitrary unreviewed ref allowed, no audit trail, selected release evidence not changed, validation run history not preserved, or starter workflow issue left unresolved.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T04-rollback-to-known-good-release.
- Add workflow_dispatch input named release_ref, artifact_id, or image_digest.
- Make rollback redeploy or dry-run redeploy the selected known-good artifact without editing source files.
- For the debug-skill version, the portal starter includes a realistic Actions-only validation issue. Testers should run it once, use the log output to resolve the issue, and preserve both run links.
- Test with two live or seeded releases, then run rollback and check `/status`, workflow summary, or rollback manifest returns the known-good release identifier.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Create an audited manual rollback workflow that redeploys a known-good release reference without editing source code.

**Prerequisites:**
- At least one known-good artifact, tag, or image digest from a successful live deploy or organizer seed.
- A real deploy path exists, or organizers provide a dry-run rollback workflow/artifact set.
- Organizer provides a placeholder value for `KNOWN_GOOD_RELEASE`.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T04-rollback-to-known-good-release`.
2. Create `.github/workflows/rollback.yml` with `workflow_dispatch` and an input named `release_ref`.
3. Make the rollback job validate that `release_ref` is not empty and then download/pull/redeploy the selected artifact, tag, or digest.
4. Use the same VPS secrets as deploy, but do not allow arbitrary shell commands as input. The input should be a release identifier only.
5. Update `/status` or the release manifest during rollback so it clearly shows `rollback=true`, `release_ref`, current commit, and rollback time.
6. Test by creating a newer live or seeded release, then run rollback with the known-good reference and confirm live status or fallback manifest returns to that reference.

**Files likely touched:**
- .github/workflows/rollback.yml
- release manifest, workflow summary, or /status generation
- SUBMISSION.md

**What success looks like:**
- Actions shows a manual rollback run with `release_ref` input.
- Live `/status` or fallback rollback manifest changes to the selected known-good release.
- No source commit is edited just to roll back.
- Judges can see who ran rollback and when.

**Common beginner mistakes:**
- Using SSH manually instead of Actions.
- Letting users type arbitrary shell commands into workflow input.
- Rebuilding current `main` instead of redeploying the selected release.
- Not recording rollback evidence.
- Rolling back to an unverified, unseeded, or nonexistent artifact.

Organizer verification focus:
- Confirm rollback does not build unknown code and leaves an audit trail in Actions.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
