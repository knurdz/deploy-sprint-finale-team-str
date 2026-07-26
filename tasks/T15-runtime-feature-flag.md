# T15 - Runtime Feature Flag

## Metadata

- Release: 02:00
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T15-runtime-feature-flag`
- Expected PR title: `[T15] Runtime Feature Flag`

## Participant Instructions

Add a feature flag controlled by deployment configuration so organizers can enable/disable a visible feature without changing source.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the flag name and two test values:

```text
FEATURE_FLAG_NAME=FINALE_FEATURE_ENABLED
OFF_VALUE=false
ON_VALUE=true
STATUS_FIELD=featureFlags
```

Participants must show both states through configuration-only changes.

## Participant Setup Steps

1. Add a runtime or deployment config flag.
2. Show the active flag state in `/status` or a fallback generated status/config artifact.
3. Deploy once with the flag off.
4. Deploy again with the flag on, without source changes.
5. Confirm the feature changes state based on config only.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Two live deploy runs or fallback workflow/config artifacts show feature off and on using configuration; source code does not hardcode final flag value.

## Independence / Fallback Evidence

T15 can be scored from config injection evidence without a live site.

- Live Evidence: if live deploy exists, two deploys show the flag off and on through configuration only.
- No-Live Fallback Evidence: full points can be confirmed from workflow env/secret references, generated safe config/status artifacts for off/on states, source scans, and build output.
- Minimum Evidence: final flag value must not be hardcoded in source.

## Judge Question

How would you disable the feature quickly if it caused an incident?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Flag hardcoded, requires source edit, private secret exposed to client, or /status does not show active flag state.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T15-runtime-feature-flag.
- Read a feature flag from deployment config or runtime env and display active flag state in /status.
- Run two deploys, one with the feature disabled and one enabled, without changing source between runs.
- Keep sensitive values out of client-visible bundles.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Add a feature flag controlled by GitHub Secret or runtime environment and show safe status evidence.

**Prerequisites:**
- A simple UI feature to toggle, such as a banner, beta card, or debug panel.
- GitHub Secrets access.
- Deploy workflow can pass environment variables.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T15-runtime-feature-flag`.
2. Choose a flag name such as `FEATURE_BETA_PANEL_ENABLED` and add it as a GitHub Secret or approved variable with value placeholder `true` or `false`.
3. Update the workflow to inject the flag during deploy/runtime. If the app is static, generate a safe `config.json` during deploy that contains only the flag value, not any private secret.
4. Update the app to read the flag and show/hide the selected feature.
5. Update `/status` with `featureFlags.betaPanel=true/false` or a similar safe value.
6. Deploy twice if possible: once with the flag off and once with it on, then record both workflow runs or screenshots.

**Files likely touched:**
- .github/workflows/deploy.yml
- team-site/src/App.tsx or config helper
- public/config.json generation if used
- SUBMISSION.md

**What success looks like:**
- Changing the secret/variable changes the feature after deploy.
- `/status` shows the flag state without exposing private data.
- PR explains where the flag is configured.
- Site still works when flag is missing or false.

**Common beginner mistakes:**
- Hardcoding the flag in source.
- Using a private secret as visible UI text.
- Forgetting a safe default.
- Expecting changed GitHub Secrets to update a static site without redeploy.
- Putting feature flag values in screenshots that include other secrets.

Organizer verification focus:
- Confirm sensitive and non-sensitive config are separated and the flag state appears in /status.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
