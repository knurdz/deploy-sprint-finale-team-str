# T23 - Release Evidence Manifest

## Metadata

- Release: 03:00
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T23-release-evidence-manifest`
- Expected PR title: `[T23] Release Evidence Manifest`

## Participant Instructions

Generate a release manifest during deployment containing commit, artifact/digest, workflow run, reviewer PR, release time, and active config values.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide required manifest fields:

```text
commit
artifact
workflowRun
pullRequest
releaseTime
publicUrl
activeConfig
```

Participants may add extra public-safe fields, but secrets must not appear in the manifest.

## Participant Setup Steps

1. Generate `release-manifest.json` during deploy.
2. Include commit, artifact/digest, workflow run, PR, release time, public URL, and active public config.
3. Upload the manifest as an Actions artifact.
4. Expose a public-safe subset in `/status`.
5. Check the manifest has no secrets.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Manifest is stored as an Actions artifact and exposed safely through /status or a public-safe link.

## Independence / Fallback Evidence

T23 can be scored from generated manifests before a live status route exists.

- Live Evidence: if a live deploy exists, `/status` or a public-safe link exposes the release manifest subset.
- No-Live Fallback Evidence: full points can be confirmed from an Actions artifact or generated `team-site/dist/release-manifest.json` containing safe commit, artifact, workflow, PR, release time, public URL placeholder, and config-state fields.
- Minimum Evidence: manifest must be valid JSON and contain no secrets.

## Judge Question

Which field in the manifest proves what is actually running?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Manifest missing key evidence, contains secrets, not tied to deploy run, or manually edited.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T23-release-evidence-manifest.
- During deploy, generate release-manifest.json containing commit, artifact/digest, workflow run URL, PR number, release time, and public config state.
- Upload the manifest as an Actions artifact and expose a public-safe subset through /status.
- Verify it contains no secrets and cannot be manually edited after deploy.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Generate a machine-readable release manifest that proves what was built, deployed, and verified.

**Prerequisites:**
- CI/deploy workflow exists, or this task creates a dry-run workflow that generates the manifest.
- The app can serve static files from `public` or generated `dist` output.
- Need safe metadata only; no secret values.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T23-release-evidence-manifest`.
2. Decide where the manifest will live, such as `team-site/public/release.json` before build or generated directly into `team-site/dist/release.json` during workflow.
3. Include safe fields: `commit`, `workflowRun`, `artifact`, `deployedAt`, `tasksCompleted`, `publicUrl`, and `healthUrl`.
4. Generate the file in CI/deploy using environment values like `GITHUB_SHA`, `GITHUB_RUN_ID`, and the artifact name.
5. Make `/status` link to or include the release manifest data.
6. Deploy and open `PUBLIC_URL/release.json` when live evidence exists, or inspect the generated artifact/manifest from Actions when it does not.

**Files likely touched:**
- .github/workflows/deploy.yml
- team-site/public/release.json or generated team-site/dist/release.json
- team-site/src/App.tsx if /status reads it, or workflow-generated release manifest files
- SUBMISSION.md

**What success looks like:**
- Release manifest is visible publicly without secrets.
- Manifest commit matches deployed commit.
- Manifest artifact/run IDs match GitHub Actions.
- Judges can use the manifest to verify completed tasks.

**Common beginner mistakes:**
- Putting secrets in the manifest.
- Hardcoding stale commit values.
- Generating the manifest before artifact identity is known.
- Not deploying the manifest file.
- Using invalid JSON.

Organizer verification focus:
- Confirm manifest contains enough evidence for scoring but excludes secrets and private tokens.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
