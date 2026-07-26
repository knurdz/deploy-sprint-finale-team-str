# T18 - Containerized VPS Deploy

## Metadata

- Release: 02:30
- Points: 20
- Automated Points: 17
- Judge Points: 3
- Level: Easy
- Expected branch: `task/T18-containerized-vps-deploy`
- Expected PR title: `[T18] Containerized VPS Deploy`

## Participant Instructions

Deploy the Dockerized website to the assigned VPS through Actions plus the approved organizer deployer, and prove the running container matches the reviewed commit.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the same VPS target values from T01 plus the container runtime target. The deploy key remains organizer-controlled and is not given to participants:

```text
CONTAINER_NAME=deploy-sprint-team-01
APP_PORT=8080
PUBLIC_URL=<team-public-url>
```

Participants should reuse the approved deploy request/deployer path rather than creating new server credentials.

## Participant Setup Steps

1. If T01/live deploy exists, reuse the approved deployer path. If not, use Docker build/run evidence or organizer-provided dry-run deploy request placeholders.
2. Build or pull the SHA-tagged image.
3. Replace the running container through GitHub Actions plus the approved deployer, not participant-visible SSH credentials.
4. Run `/health` after rollout.
5. Show the image tag or commit in `/status`.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Live `/status` or fallback manifest reports the image tag or commit; Actions logs show container build plus approved deploy request/container replacement or dry-run equivalent; `/health` passes after rollout when live evidence exists.

## Independence / Fallback Evidence

T18 can be scored with container build/run evidence before T01 is live.

- Live Evidence: if VPS deployment exists, Actions replaces the running container and `/health` passes.
- No-Live Fallback Evidence: full points can be confirmed from Docker build logs, SHA-tagged image evidence, approved deploy request or dry-run remote commands, and a generated status/manifest showing the image tag.
- Minimum Evidence: deployment commands must be suitable for Actions-only execution through the approved deployer and must not require manual server edits.

## Judge Question

How do you know the running container is the version you reviewed?

## Judge Scoring Guidance

Judge points for this task: 3. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 3: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Manual container start, stale image, port conflict, no health check after deploy, or tag does not map to commit.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T18-containerized-vps-deploy.
- Extend deploy to pull or transfer the SHA-tagged image and replace the running container through Actions.
- Run a post-rollout `/health` check when live deploy exists, or generate fallback manifest evidence with the image tag when it does not.
- Confirm no one starts the container manually during the test.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Deploy the app as a Docker container on the VPS using GitHub Actions plus the organizer-approved deployer as the only access path.

**Prerequisites:**
- T14 Docker image task is complete or a Dockerfile exists.
- VPS has Docker installed and `deploy` can run Docker.
- Organizer-held deployment access is already configured in the deployer/protected environment.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T18-containerized-vps-deploy`.
2. Build the Docker image in Actions and tag it with the commit SHA, for example `deploy-sprint-site:${{ github.sha }}`.
3. Either publish the image by SHA tag or generate a deploy request that the organizer-approved deployer can execute.
4. The deployer should stop the old container safely: `docker rm -f deploy-sprint-site || true`.
5. The deployer should start the new container with a stable name and port mapping, for example `docker run -d --name deploy-sprint-site -p $APP_PORT:80 ...`.
6. Run a smoke check from Actions against `PUBLIC_URL/health` when live deploy exists, or against the container port/dry-run output when it does not.
7. Update `/status` or a fallback manifest with container image tag or digest.

**Files likely touched:**
- Dockerfile
- .github/workflows/deploy.yml
- status/release manifest files
- SUBMISSION.md

**What success looks like:**
- VPS has a running container for the site.
- GitHub Actions/deployer logs show image build and remote container start.
- `/status` or fallback manifest shows the image tag/digest.
- No direct Termius/manual VPS edits or participant-visible SSH credentials are needed.

**Common beginner mistakes:**
- Starting multiple containers on the same port.
- Using `latest` only with no commit SHA.
- Forgetting the deploy user Docker permission.
- Building on the VPS instead of in Actions when the task expects CI-built image.
- Not removing or replacing failed old containers safely.

Organizer verification focus:
- Confirm old container cleanup is safe and the team did not start the container manually.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
