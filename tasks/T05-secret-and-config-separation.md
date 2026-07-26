# T05 - Secret And Config Separation

## Metadata

- Release: 00:30
- Points: 20
- Automated Points: 17
- Judge Points: 3
- Level: Easy
- Expected branch: `task/T05-secret-and-config-separation`
- Expected PR title: `[T05] Secret And Config Separation`

## Participant Instructions

Configure one public deploy label and one private deploy token correctly: public label may reach the client, private token must be used only by deploy logic and never appear in source, logs, or browser output.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide one public label and one fake private token:

```text
PUBLIC_DEPLOY_LABEL=<team-visible-label>
PRIVATE_DEPLOY_TOKEN=<fake-private-token-for-actions-only>
```

The public label may be visible in the deployed website. The private token must never appear in source, browser output, or unmasked logs.

## Participant Setup Steps

1. Add the public label as a GitHub variable or safe build-time value.
2. Add the private token as a GitHub Secret, not as a `VITE_*` value.
3. Use the private token only inside Actions/deploy logic.
4. Confirm the public label is visible and the private token is not visible in source, browser output, or logs.

Secret setup reminder:
1. Open the GitHub repository.
2. Go to Settings > Secrets and variables > Actions.
3. Add each provided value as a repository secret unless the task explicitly asks for an environment secret or repository variable.
4. Never commit private keys, tokens, `.env` files, or screenshots containing secret values.
5. In the PR body, list the secret names you configured, not their values.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Live site or fallback generated status displays only the public label; repository and Actions logs do not contain the private token; workflow shows masked secret use.

## Independence / Fallback Evidence

T05 can be scored from repository and workflow evidence without a live site.

- Live Evidence: if a live deploy exists, public output shows only safe labels while private values remain hidden.
- No-Live Fallback Evidence: full points can be confirmed from GitHub Secret references, masked workflow logs, `.env.example` placeholders, source scans, and a generated safe status/config artifact.
- Minimum Evidence: secret names may appear; raw secret values must not appear in source, logs, PR text, screenshots, or generated output.

## Judge Question

Which value is safe to expose to the browser, which is not, and why?

## Judge Scoring Guidance

Judge points for this task: 3. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 3: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Secret committed, secret printed, private token bundled into frontend, or config hardcoded instead of injected.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch task/T05-secret-and-config-separation.
- Use a non-sensitive repository variable or Vite build variable for the public label.
- Use a GitHub Actions secret only inside the deploy job for the private token. Do not pass it to VITE_* variables.
- Search source and logs for the private value before marking the task complete.


Additional organizer setup detail:

Use fake/test-only values for the private token. Never use a real production credential in the competition repo.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Move deploy/runtime configuration out of source code and into GitHub Secrets or safe environment injection.

**Prerequisites:**
- A known config value to move, such as `PUBLIC_URL`, `APP_PORT`, feature flags, or a placeholder API base URL.
- Access to GitHub repository secrets.
- No real secret values should be written into files.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T05-secret-and-config-separation`.
2. Search for hardcoded config candidates: `rg "http|APP_PORT|PUBLIC_URL|SECRET|TOKEN|KEY" src .github public`.
3. Move private or environment-specific values into GitHub Secrets. For safe public values, use repository variables only if organizers allow it.
4. Update workflows to pass config as environment variables during build/deploy, for example `env: PUBLIC_URL: ${{ secrets.PUBLIC_URL }}`.
5. Add a placeholder-only `.env.example` if useful, but do not add `.env` with real values.
6. Update live `/status` or a fallback generated status/config artifact to show whether config is present, not the actual secret value. Example: `config.publicUrlConfigured=true`.
7. Open a PR explaining which values moved and how to rotate them.

**Files likely touched:**
- .github/workflows/*.yml
- .env.example
- team-site/src/App.tsx or config helper
- SUBMISSION.md

**What success looks like:**
- No real config secrets appear in Git.
- Workflow references GitHub Secrets by name.
- `/status` or fallback generated status/config artifact shows safe configured/not-configured evidence.
- The site still deploys after config is injected.

**Common beginner mistakes:**
- Committing `.env`.
- Printing secret values in logs.
- Replacing all config with hardcoded placeholders that break the site.
- Using `VITE_` for values that should stay server-only.
- Forgetting to document secret names in the PR.

Organizer verification focus:
- Confirm the team understands which Vite/client variables are public and which Actions secrets must stay server-side.
- Confirm the task did not break earlier completed evidence unless the task explicitly replaced it.
- Confirm no organizer-only scoring files, raw secrets, or private notes were accidentally copied into participant-facing locations.
