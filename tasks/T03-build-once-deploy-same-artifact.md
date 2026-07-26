# T03 - Build Once Deploy Same Artifact

## Metadata

- Release: 00:00
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T03-build-once-deploy-same-artifact`
- Expected PR title: `[T03] Build Once Deploy Same Artifact`

## Participant Instructions

Change the pipeline so CI builds one immutable artifact or image digest, and deployment consumes that exact output instead of rebuilding from a moving branch.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the required traceability fields:

```text
BUILD_ARTIFACT_NAME=site-dist-${{ github.sha }}
STATUS_FIELD_ARTIFACT=artifact
STATUS_FIELD_WORKFLOW_RUN=workflowRun
```

If Docker is used, organizers accept an immutable image digest or a SHA-tagged image as equivalent evidence.

## Participant Setup Steps

1. Change CI so it produces an immutable artifact or image.
2. Change deploy so it downloads/pulls that exact artifact or digest.
3. Remove any deploy-time rebuild of source.
4. Add artifact or digest identity to `/status`.
5. Verify the deployed identity matches the CI run that built it.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Deploy or dry-run deploy job downloads artifact or uses immutable image digest from the build job; `/status`, workflow summary, or release manifest exposes artifact ID or digest; deploy path does not rebuild.

## Independence / Fallback Evidence

T03 can be completed before T01 by proving artifact identity in Actions.

- Live Evidence: if a live deploy exists, the deploy job consumes the exact CI artifact/image and `/status` shows that artifact or digest.
- No-Live Fallback Evidence: full points can be confirmed from one workflow that builds `dist`, uploads a SHA-named artifact, downloads the same artifact in a dry-run deploy job, and writes artifact identity to the workflow summary or generated `release-manifest.json`.
- Minimum Evidence: deploy or dry-run deploy must not run `npm run build` again.

## Judge Question

Why is build-once-deploy-many safer than rebuilding during deploy?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Deploy rebuilds source, digest/tag overwritten, artifact not traceable, or CI commit differs from deployed commit.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T03-build-once-deploy-same-artifact.
- In CI, upload dist as an artifact named with the commit SHA, or publish a Docker image tagged by immutable SHA/digest.
- In deploy, download or pull that exact artifact/image instead of running npm run build again.
- Expose artifact name, image digest, or build run ID in /status so judges can verify traceability.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Make deployment consume the exact artifact built by CI instead of rebuilding source during deploy.

**Prerequisites:**
- A build artifact exists, or this task adds one in the same workflow.
- A deploy workflow exists, or this task uses a dry-run deploy job that downloads the artifact and records evidence.
- Status page can be updated with artifact identity.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T03-build-once-deploy-same-artifact`.
2. In the build job, upload `dist` with a unique name such as `site-dist-${{ github.sha }}`.
3. In the deploy job, replace any `npm ci`/`npm run build` deploy-time rebuild with `actions/download-artifact@v4` using the same artifact name.
4. Copy the downloaded artifact contents to the VPS or package it for deployment. The deploy job should move already-built files, not compile again.
5. Expose the artifact name, workflow run ID, and commit SHA in `/status` or a release manifest.
6. Run the workflow and verify the artifact name in Actions matches the live `/status` value or the no-live fallback manifest/workflow summary.

**Files likely touched:**
- .github/workflows/deploy.yml or .github/workflows/ci.yml
- team-site/src/App.tsx, team-site/public/status generation, or release manifest generation
- SUBMISSION.md

**What success looks like:**
- Build job uploads a SHA-named artifact.
- Deploy job downloads that same artifact.
- Deploy job does not run `npm run build`.
- `/status`, workflow summary, or generated release manifest includes artifact/run identity.

**Common beginner mistakes:**
- Leaving a rebuild in the deploy job.
- Using a mutable artifact name like `latest` only.
- Showing one commit in `/status`, summary, or manifest while deploying or dry-running another.
- Forgetting to upload or download the `dist` contents.
- Assuming artifact upload means deploy automatically uses it.

Organizer verification focus:
- Confirm the reviewed commit, artifact, and live or dry-run deployed version are the same object.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
