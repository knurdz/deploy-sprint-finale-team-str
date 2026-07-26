# T12 - Fast Dependency Pipeline

## Metadata

- Release: 01:30
- Points: 30
- Automated Points: 25
- Judge Points: 5
- Level: Medium
- Expected branch: `task/T12-fast-dependency-pipeline`
- Expected PR title: `[T12] Fast Dependency Pipeline`

## Participant Instructions

Add lockfile-based dependency caching plus dependency integrity checks so the pipeline is faster without hiding install failures.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the expected dependency policy:

```text
CACHE_KEY_SOURCE=team-site/package-lock.json
INSTALL_COMMAND=npm ci
AUDIT_POLICY=document-result
```

Participants should make cache behavior visible in workflow logs or summaries.

## Participant Setup Steps

1. Add dependency caching keyed from `team-site/package-lock.json`.
2. Keep `npm ci` even when the cache hits.
3. Add a workflow summary with cache key/hit and audit result.
4. Change the lockfile in a test branch or explain how cache invalidation works.
5. Verify the workflow still fails on install/build errors.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Cache key uses the `team-site/package-lock.json` hash; npm ci still runs; workflow summary reports cache hit/miss and dependency audit status.

## Independence / Fallback Evidence

T12 is independent CI optimization work.

- Live Evidence: if deploy workflows share the install path, they also use the safe cache behavior.
- No-Live Fallback Evidence: full points can be confirmed from CI logs showing lockfile-keyed npm cache restore/save, `npm ci`, build result, and cache/audit summary.
- Minimum Evidence: cache must not replace the clean install or hide dependency failures.

## Judge Question

What invalidates the cache, and what still protects you from a bad install?

## Judge Scoring Guidance

Judge points for this task: 5. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 5: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Cache ignores lockfile, install disabled, audit always ignored, secrets cached, or stale dependencies used.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T12-fast-dependency-pipeline.
- Use actions/setup-node cache: npm with cache-dependency-path: team-site/package-lock.json, or actions/cache keyed by hashFiles("team-site/package-lock.json").
- Keep npm ci running even on cache hits.
- Add a visible workflow summary line showing cache key/hit and dependency audit result.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Speed up CI with safe dependency caching tied to the lockfile, without hiding install problems.

**Prerequisites:**
- Existing CI workflow uses `actions/setup-node@v4`.
- `team-site/package-lock.json` is committed.
- The workflow currently runs `npm ci`.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T12-fast-dependency-pipeline`.
2. In the Node setup step, add `cache: npm` and `cache-dependency-path: team-site/package-lock.json`.
3. Keep `npm ci`; do not replace it with `npm install` or skip install just because cache exists.
4. Run the workflow once and note the first run may be slower because it creates the cache.
5. Run it again or push a tiny doc-only commit to see cache restore evidence in logs.
6. Document the before/after run links or cache restore log line in the PR.

**Files likely touched:**
- .github/workflows/ci.yml
- .github/workflows/deploy.yml if build is there
- SUBMISSION.md

**What success looks like:**
- Workflow logs show npm cache restore/save behavior.
- Build still runs from a clean `npm ci` install.
- Cache key changes when `team-site/package-lock.json` changes.
- No stale dependencies are reused incorrectly.

**Common beginner mistakes:**
- Caching `node_modules` directly without understanding invalidation.
- Removing `npm ci`.
- Using a cache key that ignores the lockfile.
- Expecting the first run to be faster.
- Treating cache warnings as task failure when build still works.

Organizer verification focus:
- Confirm changing the lockfile invalidates cache and audit failure behavior is intentional.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
