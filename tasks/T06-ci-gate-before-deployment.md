# T06 - CI Gate Before Deployment

## Metadata

- Release: 00:30
- Points: 20
- Automated Points: 17
- Judge Points: 3
- Level: Easy
- Expected branch: `task/T06-ci-gate-before-deployment`
- Expected PR title: `[T06] CI Gate Before Deployment`

## Participant Instructions

Create a CI gate that runs on PRs and on main. It must install from the lockfile, build the website, and upload a build artifact. If a deploy workflow exists, it should use this CI result.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the expected runtime baseline:

```text
NODE_VERSION=20
BUILD_COMMAND=npm run build
INSTALL_COMMAND=npm ci
WORKING_DIRECTORY=team-site
EXPECTED_ARTIFACT_NAME=site-dist-${{ github.sha }}
```

No private VPS credential changes are needed for this task.

## Participant Setup Steps

1. Add or update a CI workflow for `pull_request` and `push` to `main`.
2. Use Node 20, `npm ci`, and `npm run build` inside `team-site/`.
3. Upload `team-site/dist` as an artifact named with the commit SHA.
4. If a deploy workflow exists, make deployment depend on this CI/build output. If no deploy exists yet, document the artifact as the scoring evidence.
5. Open a PR and show the CI gate passing before merge.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

PR workflow passes `npm ci` and `npm run build` from `team-site/`; artifact is attached to the run; if a deploy job exists, it depends on the CI/build result.

## Independence / Fallback Evidence

T06 does not depend on T01 or a working deploy.

- Live Evidence: if a deploy workflow exists, it is gated behind the passing CI/build result.
- No-Live Fallback Evidence: full points can be confirmed from a PR workflow that runs `npm ci`, runs `npm run build` in `team-site/`, fails on a broken branch, and uploads `team-site/dist` as `site-dist-<sha>`.
- Minimum Evidence: link the passing workflow run, the failed broken-branch run if tested, and the uploaded artifact.

## Judge Question

What exactly prevents a broken PR from being merged or used for deployment later?

## Judge Scoring Guidance

Judge points for this task: 3. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 3: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

pull_request_target misuse, disabled build, npm install replacing npm ci, deploy not gated when deploy exists, or artifact missing.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T06-ci-gate-before-deployment.
- Add .github/workflows/ci.yml for pull_request and push to main with npm ci and npm run build in `team-site/`.
- If a deploy workflow exists, make it depend on a successful build job or consume the build artifact from the same run. If not, use the uploaded artifact as the complete fallback evidence.
- Test by pushing a deliberately broken branch first, confirming CI fails, then fixing it and confirming the artifact is produced. If deploy exists, also confirm deploy can proceed only after CI passes.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Add a CI gate that proves the app installs and builds before any deploy is allowed.

**Prerequisites:**
- Existing app builds locally from `team-site/` with `npm ci` and `npm run build`.
- GitHub Actions is enabled on the repo.
- No new VPS secrets are needed.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T06-ci-gate-before-deployment`.
2. Create `.github/workflows/ci.yml` with triggers for `pull_request` and `push` to `main`.
3. Use `actions/checkout@v4`, `actions/setup-node@v4` with `node-version: 20`, then run `npm ci` and `npm run build` with `working-directory: team-site`.
4. Add an artifact upload step using `actions/upload-artifact@v4` with `name: site-dist-${{ github.sha }}` and `path: team-site/dist`.
5. If a deploy workflow already exists, make the deploy job run after the build job in the same workflow or require the CI check before merge using branch protection during testing.
6. Push the branch, open PR `[T06] CI Gate Before Deployment`, and confirm a broken build fails while a fixed build passes and uploads the artifact.

**Files likely touched:**
- .github/workflows/ci.yml
- .github/workflows/deploy.yml if deploy gating is combined
- SUBMISSION.md

**What success looks like:**
- PR checks show `npm ci` and `npm run build` passed.
- Actions run contains a `site-dist-<sha>` artifact.
- If deploy exists, it cannot be run as a successful scored deploy when CI is failing.

**Common beginner mistakes:**
- Using `npm install` instead of `npm ci`.
- Uploading `build` instead of `team-site/dist`.
- Adding a workflow that always exits successfully without running the real build.
- Running deploy independently after a failed CI result when a deploy workflow exists.
- Using unsafe `pull_request_target` for normal PR CI.

Organizer verification focus:
- Confirm checks are not no-op scripts, the lockfile is used, and deploy cannot succeed after a failed build.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
