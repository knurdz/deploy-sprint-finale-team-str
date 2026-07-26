# T11 - Pull Request Preview Deployment

## Metadata

- Release: 01:30
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T11-pull-request-preview-deployment`
- Expected PR title: `[T11] Pull Request Preview Deployment`

## Participant Instructions

For task PRs, publish an isolated preview build under a predictable preview URL or path without touching production.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide preview naming requirements:

```text
PREVIEW_BASE_PATH=/previews/pr-<number>
PREVIEW_STATUS_FIELD=previewUrl
PRODUCTION_STATUS_MUST_NOT_CHANGE=true
```

The preview can be implemented using the VPS, GitHub Pages, artifacts, or another approved preview target.

## Participant Setup Steps

1. Add a PR workflow that builds preview output.
2. Publish it to a path or target separate from production.
3. Put the preview URL in the workflow summary or PR comment.
4. If production is live, confirm production `/status` does not change during preview deploy. If not, confirm the preview artifact is separate from production evidence.
5. Document cleanup or overwrite behavior for previews.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

PR comment or workflow summary links to preview; preview includes PR number and commit; production `/status` remains unchanged if production exists.

## Independence / Fallback Evidence

T11 can be completed with preview artifacts even if production is not live.

- Live Evidence: if production exists, the PR preview is separate and production `/status` remains unchanged.
- No-Live Fallback Evidence: full points can be confirmed from a PR workflow that builds `dist`, uploads a PR-numbered preview artifact, and links the artifact in a workflow summary or PR note.
- Minimum Evidence: preview identity must include PR number and commit SHA.

## Judge Question

How is a preview different from production in your workflow?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Preview overwrites production, production secrets exposed, no PR link, or preview commit not traceable.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T11-pull-request-preview-deployment.
- Add a PR workflow that builds a preview artifact and publishes it to a preview path, bucket, Pages environment, or server directory separate from production.
- Write the preview URL to the workflow summary or PR comment.
- If production is live, confirm production `/status` does not change when a preview PR runs. If not, confirm the preview artifact is separate from production evidence.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Give every PR a preview artifact or preview deployment so reviewers can inspect changes before merge.

**Prerequisites:**
- CI workflow exists or can be extended.
- A preview URL is optional; a downloadable preview artifact is acceptable if VPS preview hosting is not ready.
- GitHub Actions can run on pull requests.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T11-pull-request-preview-deployment`.
2. Create or update a workflow triggered by `pull_request`.
3. Build the app with Node 20, `npm ci`, and `npm run build`.
4. For the simplest test, upload `dist` as `pr-preview-${{ github.event.pull_request.number }}-${{ github.sha }}` using `actions/upload-artifact@v4`.
5. For a stronger test, deploy the artifact to a preview path such as `/previews/pr-<number>/` on the VPS using Actions secrets.
6. Add a PR comment or PR body note pointing reviewers to the artifact or preview URL.
7. Open a sample PR and verify the preview evidence appears before merge.

**Files likely touched:**
- .github/workflows/pr-preview.yml
- .github/PULL_REQUEST_TEMPLATE.md if evidence checkbox is improved
- SUBMISSION.md

**What success looks like:**
- PR run creates a preview artifact or preview URL.
- Reviewer can inspect the built site before merge.
- Preview does not overwrite production.
- PR evidence clearly links to the preview.

**Common beginner mistakes:**
- Deploying PR preview over production.
- Running secrets on untrusted PRs without controls.
- Forgetting to include the PR number in preview identity.
- Uploading the wrong directory.
- Making preview only after merge.

Organizer verification focus:
- Confirm preview cleanup or overwrite behavior is documented and previews cannot use production secrets.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
