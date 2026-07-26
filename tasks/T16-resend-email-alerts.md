# T16 - Resend Email Alerts

## Metadata

- Release: 02:00
- Points: 40
- Automated Points: 30
- Judge Points: 10
- Level: Medium
- Expected branch: `task/T16-resend-email-alerts`
- Expected PR title: `[T16] Resend Email Alerts`

## Participant Instructions

Add a transactional email alert integration using Resend. Create or use a provided Resend API key, store it in GitHub Secrets, add a safe server/runtime or deploy-time email notification path, and expose redacted status evidence without leaking the API key.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide either expected test values or instructions for creating your own Resend credentials:

```text
RESEND_API_KEY=<team-created-or-organizer-provided>
RESEND_FROM_EMAIL=<verified-sender-or-test-domain-sender>
ALERT_RECIPIENT_EMAIL=<safe-test-recipient>
EMAIL_PROVIDER=resend
```

`RESEND_API_KEY` must be stored as a GitHub Secret. `RESEND_FROM_EMAIL` and `ALERT_RECIPIENT_EMAIL` may be repository variables if organizers mark them as safe, but do not paste personal inboxes into public evidence unless they are test-only.

## Participant Setup Steps

1. Create or open a Resend account.
2. Create an API key for this team or use the organizer-provided team key.
3. Add `RESEND_API_KEY` as a GitHub Actions secret.
4. Add `RESEND_FROM_EMAIL` and `ALERT_RECIPIENT_EMAIL` as repository variables or secrets according to organizer instructions.
5. Add the provided email snippet to the correct server/runtime, workflow, or deploy evidence location.
6. Send a safe test alert or generate a dry-run email evidence artifact.
7. Add status evidence showing `email.provider=resend`, `email.configured=true`, and `secretRedacted=true`.
8. Confirm no API key, email API response token, or private recipient data appears in source, logs, PR text, screenshots, or artifacts.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing build or workflow evidence for the scored commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

The repo references `RESEND_API_KEY` safely through GitHub Secrets or runtime env; email integration source exists; a workflow, status route, or artifact shows redacted Resend readiness; and no raw Resend key or private email content is committed.

## Independence / Fallback Evidence

T16 can be scored before live deployment using workflow/source evidence and a generated safe email status artifact.

- Live Evidence: `/status`, `/email/status`, or an equivalent runtime endpoint shows provider `resend`, configured `true`, and secret redaction.
- No-Live Fallback Evidence: workflow summary, generated manifest, dry-run artifact, or PR evidence shows the integration is configured without exposing secrets.
- Minimum Evidence: secret-name reference, provider marker, safe status evidence, and no raw key exposure.

## Judge Question

Where does the Resend API key live, which code path sends or simulates the alert, and how did you prove the secret never reaches the browser or logs?

## Judge Scoring Guidance

Judge points for this task: 10. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 10: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Committed Resend API key, using a browser-exposed API key, logging message payloads with private details, missing safe status evidence, no proof of GitHub Secret usage, or sending test emails to non-approved personal addresses.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch `task/T16-resend-email-alerts`.
- Use a Resend test key or placeholder secret name only; do not commit real keys.
- Add source/workflow evidence that references `RESEND_API_KEY`.
- Generate a safe status artifact such as `dist/email/status.json` or add email metadata into `/status`.
- Verify no raw API key or private email payload appears in source, logs, artifacts, PR body, reviews, or `SUBMISSION.md`.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Add a safe email alert integration that proves secret handling without exposing the real API key.

**Prerequisites:**
- Resend account or organizer-provided test credential.
- GitHub secret `RESEND_API_KEY`.
- Safe sender and recipient test addresses.
- Passing build workflow.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T16-resend-email-alerts`.
2. Add `RESEND_API_KEY` in GitHub repository secrets.
3. Add `RESEND_FROM_EMAIL` and `ALERT_RECIPIENT_EMAIL` as variables or secrets.
4. Add a small integration module or workflow step that reads `RESEND_API_KEY` only from env.
5. Add a status object with `task: "T16"`, `provider: "resend"`, `configured: true`, and `secretRedacted: true`.
6. Run the build or workflow and capture the safe status evidence.
7. Open a PR titled `[T16] Resend Email Alerts`, get fresh approval, and merge.
8. Run the evaluator and confirm secret hygiene plus service evidence pass.

**Files likely touched:**
- team-site/src/service-status or team-site/src/config files
- .github/workflows/ci.yml or a dedicated email evidence workflow
- SUBMISSION.md

**What success looks like:**
- GitHub secret metadata includes `RESEND_API_KEY`.
- Source or workflow references the secret name but never the value.
- Status evidence says Resend is configured and redacted.
- Build/workflow passes on the scored commit.

**Common beginner mistakes:**
- Putting the API key into `VITE_RESEND_API_KEY`.
- Printing full email payloads in Actions logs.
- Forgetting to verify the sender domain or test sender.
- Using a real personal recipient in screenshots.
- Adding status evidence but not wiring it to the scored commit.

Organizer verification focus:
- Confirm `RESEND_API_KEY` is a secret and not a variable containing a real key.
- Confirm browser/client bundles do not contain the API key.
- Confirm safe status evidence maps to the scored commit.
