# T14 - Production Docker Image

## Metadata

- Release: 02:00
- Points: 20
- Automated Points: 17
- Judge Points: 3
- Level: Easy
- Expected branch: `task/T14-production-docker-image`
- Expected PR title: `[T14] Production Docker Image`

## Participant Instructions

Add a production Dockerfile and .dockerignore for the provided `team-site/` website. Build the image in Actions and prove it can serve the built app.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the image evidence requirement:

```text
IMAGE_TAG=<commit-sha>
DOCKER_CONTEXT=.
EXPECTED_RUNTIME_PORT=8080
```

Participants choose a production-safe runtime image and must include `.dockerignore`.

## Participant Setup Steps

1. Add a multi-stage Dockerfile.
2. Add `.dockerignore` excluding secrets, node_modules, dist, logs, and local artifacts.
3. Build the image in GitHub Actions.
4. Tag the image with the commit SHA.
5. Prove the image can serve the production build on the expected port.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Actions builds image successfully; image tag includes commit SHA; .dockerignore excludes node_modules, env files, logs, caches, and local artifacts.

## Independence / Fallback Evidence

T14 can be scored from Docker build evidence without a VPS deployment.

- Live Evidence: if a container deploy exists, the live site reports the image tag or digest.
- No-Live Fallback Evidence: full points can be confirmed from `Dockerfile`, `.dockerignore`, Actions Docker build logs, image tag `commit-sha`, and optional local/container run output.
- Minimum Evidence: image must serve the production `dist` build and must not include `.env`, local artifacts, or secrets.

## Judge Question

Explain the build stage, runtime stage, and why .dockerignore matters.

## Judge Scoring Guidance

Judge points for this task: 3. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 3: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Secrets copied, single huge unsafe image, build bypassed, missing .dockerignore, or untraceable latest-only tag.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T14-production-docker-image.
- Add a multi-stage Dockerfile: build with Node, serve built dist from a small runtime image such as nginx or node static server.
- Add .dockerignore excluding node_modules, dist, logs, .env*, and local report artifacts.
- Build in Actions and tag the image with the commit SHA.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Create a production Docker image that builds the Vite app and serves the static output predictably.

**Prerequisites:**
- Docker is available locally or in GitHub Actions.
- The app builds from `team-site/` with `npm ci && npm run build`.
- No real secrets are baked into the image.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T14-production-docker-image`.
2. Add a `Dockerfile` with a Node build stage that copies `team-site/`, runs `npm ci` and `npm run build` there, and serves `team-site/dist`.
3. Add a small production serve stage, such as nginx or a static server, that copies only `dist` into the runtime image.
4. Add `.dockerignore` to exclude `node_modules`, `dist`, `.git`, `.env`, and local logs.
5. Build locally if possible: `docker build -t deploy-sprint-site:test .`.
6. Run locally if possible: `docker run --rm -p 8080:80 deploy-sprint-site:test`, then open `http://localhost:8080`.
7. Add CI evidence that the Docker image builds, even if the event does not publish it to a registry yet.

**Files likely touched:**
- Dockerfile or team-site/Dockerfile
- .dockerignore
- .github/workflows/*.yml
- SUBMISSION.md

**What success looks like:**
- Docker image builds successfully.
- Container serves the built site.
- Image does not include `.env` or source secrets.
- PR explains the build stage and runtime stage.

**Common beginner mistakes:**
- Copying the entire repo including secrets into the runtime image.
- Serving `build` instead of `dist`.
- Using development server (`vite --host`) as production server without explanation.
- Forgetting `.dockerignore`.
- Putting secrets in Docker `ARG` or `ENV` unnecessarily.

Organizer verification focus:
- Confirm image does not copy secrets or local junk and does not bypass the normal production build.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
