# T10 - Web3Forms Contact Service

## Metadata

- Release: 01:00
- Points: 40
- Automated Points: 32
- Judge Points: 8
- Level: Medium
- Expected branch: `task/T10-web3forms-contact-service`
- Expected PR title: `[T10] Web3Forms Contact Service`

## Participant Instructions

Add a contact/support form using Web3Forms. Get or use a provided Web3Forms access key, store it as a GitHub Secret for this competition, and add safe public evidence that the contact integration is configured.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the service target and may either provide a pre-created access key or require your team to create one:

```text
SERVICE=Web3Forms
SIGNUP_URL=https://web3forms.com/
SETUP_DOCS=https://docs.web3forms.com/getting-started/installation
SUBMIT_ENDPOINT=https://api.web3forms.com/submit
REQUIRED_SECRET=WEB3FORMS_ACCESS_KEY
CONTACT_ROUTE=/contact
STATUS_FIELD=contact.provider=web3forms
```

Web3Forms sends the access key to an email address. Use the provided team email or organizer-provided access key if the event does not allow teams to use personal email.

## Participant Setup Steps

1. Open Web3Forms and create an access key using the team/allowed email address.
2. Copy the access key from the email Web3Forms sends.
3. Add it to GitHub Secrets as `WEB3FORMS_ACCESS_KEY`.
4. Add a `/contact` page, modal, or section with a support/contact form.
5. Wire the form to Web3Forms using a server/runtime-safe pattern or deploy-time injected config required by organizers.
6. Update `/status` with `contact.provider=web3forms` and contact integration state.
7. Submit one test message if organizers allow it, then document the test evidence without exposing the key.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- A visible contact/support form.
- Workflow/source reference to `WEB3FORMS_ACCESS_KEY` without committing the raw key.
- `/status` or fallback generated status evidence showing `contact.provider=web3forms`.
- A PR note explaining whether a test submission was sent.

## Acceptance Evidence

Workflow/source references `WEB3FORMS_ACCESS_KEY`; contact page or form exists; live `/status` or fallback generated status evidence shows contact provider configured; no raw access key is committed.

## Independence / Fallback Evidence

T10 can be scored before live deployment using form/source evidence and safe status artifacts.

- Live Evidence: if live deploy exists, the contact form is available and `/status` shows `contact.provider=web3forms`.
- No-Live Fallback Evidence: full points can be confirmed from contact UI source, workflow/source references to `WEB3FORMS_ACCESS_KEY`, source scans, and generated safe status evidence.
- Minimum Evidence: raw Web3Forms access key must not be committed or pasted into PR evidence.

## Judge Question

If Web3Forms examples can use an access key in a form, why does this competition still require GitHub Secrets?

## Judge Scoring Guidance

Judge points for this task: 8. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 8: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Raw access key committed, no contact UI, no safe integration marker, test submission exposes secrets, or contact provider status is missing.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Decide whether teams create their own Web3Forms keys or organizers pre-create per-team access keys.
- If using organizer keys, add `WEB3FORMS_ACCESS_KEY=<team-key>` to the credential pack.
- Accept public-key-style usage only if the team explicitly explains the risk and the raw key is not committed to the repository.
- Run `node organizer/validate-service-integrations.mjs --url <PUBLIC_URL>` after deployment to check public evidence, or use local/source checks and generated artifacts before live deployment.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Add a contact form backed by Web3Forms while practicing GitHub Secret handling and safe status evidence.

**Prerequisites:**
- Web3Forms access key or organizer-provided placeholder credential.
- GitHub Secret named `WEB3FORMS_ACCESS_KEY`.
- A decision whether test submissions are allowed during the event.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T10-web3forms-contact-service`.
2. Create/receive the Web3Forms access key and add it as GitHub Secret `WEB3FORMS_ACCESS_KEY`.
3. Add a `/contact` page, section, or modal with fields such as name, email, subject, and message.
4. For a static-site beginner test, inject the access key at deploy/runtime in a way organizers approve, and do not commit the raw value. If using a server/proxy, have the form submit to your endpoint and let the endpoint call Web3Forms.
5. Show a safe integration marker in `/status` or fallback generated status evidence, such as `contact.provider=web3forms` and `contact.configured=true`.
6. Submit one test message only if organizers approve. Use harmless text like `Deploy Sprint test message`.
7. Search source and PR text for the raw key before merge; only secret names should appear.

**Files likely touched:**
- team-site/src/App.tsx or contact component
- .github/workflows/deploy.yml
- status/release manifest files
- SUBMISSION.md

**What success looks like:**
- Contact form is visible.
- Workflow/source references `WEB3FORMS_ACCESS_KEY` safely.
- `/status` or fallback generated status evidence shows Web3Forms provider configured.
- No raw access key is committed or pasted in PR evidence.

**Common beginner mistakes:**
- Confusing secret name with secret value in PR text.
- Submitting spammy or personal test data.
- Committing the Web3Forms key because examples show it in HTML.
- No visible contact UI.
- No public status marker for automated scoring.

Organizer verification focus:
- Confirm the form exists and has provider evidence.
- Confirm secret values are not pasted into source, logs, PR text, or screenshots.
- Confirm `/status`, release manifest, or fallback generated status evidence includes contact provider state.
