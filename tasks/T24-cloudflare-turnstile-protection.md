# T24 - Cloudflare Turnstile Protection

## Metadata

- Release: 03:00
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Medium
- Expected branch: `task/T24-cloudflare-turnstile-protection`
- Expected PR title: `[T24] Cloudflare Turnstile Protection`

## Participant Instructions

Protect a public form or login-like interaction with Cloudflare Turnstile. Create a Turnstile widget, store the secret key safely, render the public site key where appropriate, verify the token server-side or through a runtime/deploy-time verification path, and expose safe status evidence.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the assigned hostname and either test keys or instructions for creating a widget:

```text
TURNSTILE_SITE_KEY=<public-site-key>
TURNSTILE_SECRET_KEY=<server-only-secret-key>
TURNSTILE_ALLOWED_HOSTNAME=team01.verischolar.knurdz.org
TURNSTILE_PROVIDER=cloudflare-turnstile
```

`TURNSTILE_SITE_KEY` is public and may be client-visible. `TURNSTILE_SECRET_KEY` must be stored in GitHub Secrets and used only server-side, in a runtime endpoint, or in safe deploy-time verification evidence.

## Participant Setup Steps

1. Open Cloudflare Turnstile and create a widget for the assigned hostname.
2. Copy the site key and secret key.
3. Add `TURNSTILE_SECRET_KEY` as a GitHub Actions secret.
4. Add `TURNSTILE_SITE_KEY` and `TURNSTILE_ALLOWED_HOSTNAME` as safe variables or secrets according to organizer instructions.
5. Add the widget to the chosen form or interaction.
6. Add server-side or deploy-time verification logic that references the Turnstile secret key without exposing it to the browser.
7. Add safe status evidence showing `security.turnstile.provider=cloudflare`, configured `true`, hostname, and redaction.
8. Verify no `VITE_TURNSTILE_SECRET_KEY`, raw secret key, or siteverify response token appears in source, logs, PR text, screenshots, or artifacts.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing build or workflow evidence for the scored commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

The UI or form references a public Turnstile site key; the verification path references `TURNSTILE_SECRET_KEY` only through GitHub Secrets/env; status or artifact evidence shows the provider, allowed hostname, and redacted secret handling; and no secret key is committed.

## Independence / Fallback Evidence

T24 can be scored before live deployment using source, workflow, and generated security-status artifacts.

- Live Evidence: a protected form renders the Turnstile widget and `/status`, `/security/status`, or equivalent evidence shows Turnstile is configured.
- No-Live Fallback Evidence: source diff, workflow summary, generated manifest, and safe verification logs show the widget and server-side secret path.
- Minimum Evidence: public site key handling, server-side secret-name reference, safe redacted status marker, and no raw secret exposure.

## Judge Question

Which Turnstile key is public, which one must stay secret, and where is the token verified?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Using the secret key in client code, adding `VITE_TURNSTILE_SECRET_KEY`, missing server-side verification, wrong allowed hostname, committed test response tokens, or claiming protection from only a UI widget without a verification path.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch `task/T24-cloudflare-turnstile-protection`.
- Use Cloudflare test keys or placeholders; do not commit real secrets.
- Add source evidence for a public site key and secret-name-only verification path.
- Generate safe status evidence such as `dist/security/turnstile.json` or a `/status.security.turnstile` object.
- Verify no raw Turnstile secret appears in source, workflows, logs, artifacts, PR body, reviews, or `SUBMISSION.md`.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Add bot-protection evidence that separates public widget configuration from server-only verification secrets.

**Prerequisites:**
- Cloudflare account or organizer-provided test widget keys.
- GitHub secret `TURNSTILE_SECRET_KEY`.
- Safe variable `TURNSTILE_SITE_KEY`.
- Assigned domain or fallback hostname.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T24-cloudflare-turnstile-protection`.
2. Create a Turnstile widget for `team01.verischolar.knurdz.org` or use organizer test keys.
3. Add `TURNSTILE_SECRET_KEY` in GitHub repository secrets.
4. Add `TURNSTILE_SITE_KEY` and `TURNSTILE_ALLOWED_HOSTNAME` as repository variables.
5. Add the widget to a form or login-like component.
6. Add verification logic that reads `TURNSTILE_SECRET_KEY` from env and records only redacted evidence.
7. Add status evidence with `task: "T24"`, `provider: "cloudflare-turnstile"`, `configured: true`, and `secretRedacted: true`.
8. Open a PR titled `[T24] Cloudflare Turnstile Protection`, get fresh approval, and merge.
9. Run the evaluator and confirm Turnstile source, secret metadata, and status evidence pass.

**Files likely touched:**
- team-site/src form or auth-related components
- server or workflow verification helper
- .github/workflows/ci.yml or status generation workflow
- SUBMISSION.md

**What success looks like:**
- Public site key is used only as public config.
- Secret key is referenced only as `TURNSTILE_SECRET_KEY`.
- Status evidence confirms provider and redaction.
- No raw secret or `VITE_TURNSTILE_SECRET_KEY` appears anywhere.

**Common beginner mistakes:**
- Treating the public site key and secret key as the same thing.
- Verifying only in the browser.
- Forgetting to allow the assigned hostname in Cloudflare.
- Leaving temporary test tokens in logs.
- Adding a widget but no backend or runtime verification evidence.

Organizer verification focus:
- Confirm the secret key is not exposed to the client bundle.
- Confirm the chosen hostname matches the assigned team domain.
- Confirm status evidence maps to the scored commit.
