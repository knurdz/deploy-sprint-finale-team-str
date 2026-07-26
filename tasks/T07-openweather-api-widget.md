# T07 - OpenWeather API Widget

## Metadata

- Release: 00:30
- Points: 40
- Automated Points: 32
- Judge Points: 8
- Level: Medium
- Expected branch: `task/T07-openweather-api-widget`
- Expected PR title: `[T07] OpenWeather API Widget`

## Participant Instructions

Add a weather/status widget backed by OpenWeather. Get or use a provided OpenWeather API key, store it as a GitHub Secret, and call OpenWeather through a server/runtime endpoint or deploy-time proxy. Do not expose the key to browser JavaScript.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the service target and may either provide a pre-created test key or require your team to create one:

```text
SERVICE=OpenWeather
SIGNUP_URL=https://openweathermap.org/
API_KEY_HELP=https://docs.openweather.co.uk/faq
OPENWEATHER_LOCATION=Colombo,LK
OPENWEATHER_UNITS=metric
REQUIRED_SECRET=OPENWEATHER_API_KEY
FORBIDDEN_CLIENT_SECRET_NAME=VITE_OPENWEATHER_API_KEY
STATUS_FIELD=weather.provider=openweather
```

If organizers do not provide a pre-created key, create an OpenWeather account, verify your email, open your API keys page, and copy your API key/APPID.

## Participant Setup Steps

1. Create or log in to an OpenWeather account.
2. Verify your email address if OpenWeather asks for verification.
3. Open the OpenWeather API keys page and copy the API key/APPID.
4. Add it to GitHub Secrets as `OPENWEATHER_API_KEY`.
5. Add a server/runtime endpoint such as `/api/weather` that calls OpenWeather using the secret on the server/VPS side.
6. Add a visible weather widget or status card to the website.
7. Update `/status` to include `weather.provider=openweather` and whether the weather integration is configured.
8. Verify the source code does not contain `VITE_OPENWEATHER_API_KEY` or the raw API key.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- A live weather widget, `/api/weather` endpoint, or fallback generated weather/status artifact backed by OpenWeather evidence.
- `/status` or fallback generated status evidence showing `weather.provider=openweather`.
- A PR note explaining where the key is stored and why it is not exposed to browser code.

## Acceptance Evidence

Workflow or deploy code references `secrets.OPENWEATHER_API_KEY`; source does not expose `VITE_OPENWEATHER_API_KEY`; live `/api/weather`, live `/status`, or fallback generated status/weather artifact shows `weather.provider=openweather`.

## Independence / Fallback Evidence

T07 can be scored before live deployment using safe generated service evidence.

- Live Evidence: if live deploy exists, `/api/weather` or `/status` shows `weather.provider=openweather`.
- No-Live Fallback Evidence: full points can be confirmed from workflow references to `secrets.OPENWEATHER_API_KEY`, source scan proving no `VITE_OPENWEATHER_API_KEY`, and a generated safe `team-site/dist/api/weather.json` or `team-site/dist/status.json` provider marker.
- Minimum Evidence: raw OpenWeather key must never appear in client code, logs, artifacts, or status output.

## Judge Question

Why is the OpenWeather API key stored as a GitHub Secret instead of a `VITE_*` variable?

## Judge Scoring Guidance

Judge points for this task: 8. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 8: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Raw API key committed, `VITE_OPENWEATHER_API_KEY` used, browser directly calls OpenWeather with the secret, no live or fallback provider evidence, or workflow does not reference the secret.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create a free OpenWeather key for testing, or give the team a pre-created test key through the credential pack.
- Confirm the team adds `OPENWEATHER_API_KEY` in GitHub Secrets and does not ask judges to reveal the value.
- For a static-only test, accept a deploy-time generated JSON file only if the secret is used in Actions/VPS runtime and never bundled into client source.
- Run `node organizer/validate-service-integrations.mjs --url <PUBLIC_URL>` after deployment to check public evidence, or use the local/source checks and generated artifacts before live deployment.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Integrate OpenWeather with a safe secret path and public evidence that does not expose the API key.

**Prerequisites:**
- OpenWeather account/API key or organizer-provided placeholder credential.
- GitHub Secret named `OPENWEATHER_API_KEY`.
- A server/runtime/proxy approach or deploy-time generated safe weather JSON.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T07-openweather-api-widget`.
2. Create or receive the OpenWeather key, then add it as GitHub Secret `OPENWEATHER_API_KEY`. Do not create `VITE_OPENWEATHER_API_KEY`.
3. For a beginner static-site test, add an Actions step that calls OpenWeather during deploy with the secret and writes safe output to `team-site/dist/api/weather.json` or `team-site/dist/status.json`. The generated file may include city, temperature, timestamp, and `weather.provider=openweather`, but not the key.
4. For a stronger runtime test, add a small server/proxy endpoint `/api/weather` on the VPS that reads `OPENWEATHER_API_KEY` from the environment.
5. Add a weather widget/card in the app that reads the safe endpoint/file.
6. Update `/status` or fallback generated status evidence with `weather.provider=openweather` and `weather.configured=true`.
7. Run `rg "VITE_OPENWEATHER_API_KEY|OPENWEATHER_API_KEY=.*"` before committing to catch unsafe exposure.

**Files likely touched:**
- .github/workflows/deploy.yml
- team-site/src/App.tsx or weather component
- team-site/public/status, generated team-site/dist/status.json, or generated team-site/dist/api/weather.json
- SUBMISSION.md

**What success looks like:**
- Workflow references `secrets.OPENWEATHER_API_KEY`.
- Live site shows weather widget or safe weather JSON.
- `/status` or fallback generated status evidence includes `weather.provider=openweather`.
- No raw key or `VITE_OPENWEATHER_API_KEY` appears in source.

**Common beginner mistakes:**
- Putting the OpenWeather key in Vite client code.
- Committing generated files that contain secret-bearing URLs.
- Calling OpenWeather from browser code with the secret.
- Forgetting email verification/key activation delay.
- Showing the full API request URL with `appid` in logs.

Organizer verification focus:
- Confirm `OPENWEATHER_API_KEY` is referenced only through GitHub Secrets or runtime server env.
- Confirm no raw API key appears in source, workflow logs, `dist`, `/status`, or fallback generated artifacts.
- Confirm public evidence says the provider is OpenWeather.
