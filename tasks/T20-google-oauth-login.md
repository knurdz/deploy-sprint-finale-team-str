# T20 - Google OAuth Login

## Metadata

- Release: 02:30
- Points: 40
- Automated Points: 28
- Judge Points: 12
- Level: Hard
- Expected branch: `task/T20-google-oauth-login`
- Expected PR title: `[T20] Google OAuth Login`

## Participant Instructions

Add Google OAuth login using a server-side callback so the Google client secret stays in GitHub Secrets or server runtime environment. Create/configure a Google Cloud OAuth web application, add the authorized origin and redirect URI, store the credentials safely, deploy login/callback/logout functionality, and expose safe auth status evidence.

Universal task rules:
- Work from a task branch named task/Txx-short-name unless the task specifies an organizer asset branch.
- Open a PR into main with title [Txx] Task title.
- Get at least one approving review from another repository collaborator after the final commit.
- The PR must be merged by a non-bot repository collaborator.
- If you are using live evidence, keep `/status`, `/health`, and release evidence aligned with the scored commit. If the site is not live yet, provide the no-live fallback evidence listed in this task.
- Remove any temporary AI-REVIEW-MARKER strings before merge.

## What Organizers Provide

Organizers provide the expected OAuth configuration values:

```text
GOOGLE_REDIRECT_URI=https://<assigned-domain>/auth/google/callback
GOOGLE_AUTHORIZED_ORIGIN=https://<assigned-domain>
GOOGLE_SCOPES=openid email profile
ALLOWED_TEST_EMAIL=<judge-or-team-email-optional>
REQUIRED_GITHUB_SECRETS=GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,SESSION_SECRET
STATUS_FIELD=auth.provider=google
```

Teams create their own Google Cloud project/OAuth client unless organizers pre-create credentials. `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` must stay server-side and must never be exposed as `VITE_*` values.

## Participant Setup Steps

1. Open Google Cloud Console and create or select a team project.
2. Configure the OAuth consent screen with a clear app name and test users if Google asks for them.
3. Create an OAuth client with application type `Web application`.
4. Add the authorized JavaScript origin from `GOOGLE_AUTHORIZED_ORIGIN`.
5. Add the authorized redirect URI from `GOOGLE_REDIRECT_URI` exactly.
6. Copy the client ID and client secret.
7. Add GitHub Secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET`.
8. Add server-side routes for login, callback, logout, and current user evidence, such as `/auth/google`, `/auth/google/callback`, `/auth/logout`, and `/auth/me`.
9. In the callback, verify OAuth `state`, exchange the authorization code server-side, create a session, and show only safe user evidence such as name/email/avatar.
10. Update `/status`, `/auth/me`, or a fallback manifest with `auth.provider=google`, redirect URI configured, and auth runtime ready.
11. Verify no `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, raw access token, ID token, refresh token, or `VITE_GOOGLE_CLIENT_SECRET` appears in source, client bundles, logs, or screenshots.

Secret setup reminder:
1. Open the GitHub repository.
2. Go to Settings > Secrets and variables > Actions.
3. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` as repository secrets unless organizers require environment secrets.
4. `GOOGLE_CLIENT_ID` may be safe to reference in server config, but do not print the client secret or session secret.
5. In PR evidence, list secret names only, not values.

## Deliverables

- A merged PR into `main` with the expected title and task branch.
- Approval from another repository collaborator after the final commit and merge by a non-bot collaborator.
- Passing CI/build evidence for the merged commit.
- Updated live or no-live fallback evidence, preview, workflow, artifact, or repository evidence required by the task.
- A short note in `SUBMISSION.md` or the PR body explaining what changed and how to verify it.

## Acceptance Evidence

Login button or route redirects to Google; callback verifies state, exchanges the code server-side, creates a session, and exposes safe signed-in user evidence; logout clears the session; `/status`, `/auth/me`, or fallback manifest shows `auth.provider=google`; no Google client secret, session secret, raw token, or `VITE_GOOGLE_CLIENT_SECRET` appears in source/client bundles/logs.

## Independence / Fallback Evidence

T20 can be scored before the public domain is fully live if the OAuth configuration and safe implementation evidence are complete.

- Live Evidence: assigned domain can complete Google login/logout, `/auth/me` shows safe user evidence, and `/status` shows Google auth metadata.
- No-Live Fallback Evidence: full points can be confirmed from Google Console configuration screenshots with secrets redacted, GitHub Secret references, server-side route code, state/session handling evidence, local callback dry-run logs, and a generated auth status manifest.
- Minimum Evidence: Google OAuth web app has the correct authorized origin and redirect URI, secrets are stored server-side, callback exchanges the code server-side, state/session protection exists, and no secret/token is exposed.

## Judge Question

Why must `GOOGLE_CLIENT_SECRET` stay server-side, and what exact redirect URI did you register in Google Cloud Console?

## Judge Scoring Guidance

Judge points for this task: 12. Award these separately from automated evidence. These points are weighted by task risk and complexity, so higher-risk deployment, security, domain, OAuth, and recovery tasks receive more judge scrutiny.

- Full 12: the team clearly explains what they changed, why it works, how they verified it, and what safety or secret-handling risks they considered.
- Partial: the team completed the work but has gaps in explanation, ownership, review quality, or risk awareness.
- Zero: the team cannot explain the implementation, presents fabricated evidence, exposes secrets, or appears to have merged work they did not review.

## Common Deductions

Frontend-only secret exposure, missing or mismatched redirect URI, no OAuth state check, no logout, committed Google credentials, raw tokens shown in `/status`, using `VITE_GOOGLE_CLIENT_SECRET`, or login only works on localhost when live evidence is claimed.

## Organizer / Tester Notes

Use these notes to complete or simulate the task in this private test repo:
- Create branch `task/T20-google-oauth-login`.
- Use a Google test project or organizer-created OAuth client during dry runs.
- The redirect URI must exactly match the deployed callback URL, for example `https://team01.verischolar.knurdz.org/auth/google/callback`.
- Prefer a small server/proxy/runtime route on the VPS for the OAuth callback; static client-only code must not contain the client secret.
- If no live domain is available, verify the Google Console configuration, route code, secret references, and generated auth manifest as no-live fallback evidence.
- Trigger login with a judge/test email only; do not ask teams to reveal Google secrets.

### Beginner Test Walkthrough (Organizer Only)

**Goal:** Add a real Google login workflow where Google sends the user back to the team site and the secret exchange happens on the server side.

**Prerequisites:**
- Assigned domain from T02 or a temporary organizer callback domain.
- Google account allowed to create OAuth credentials.
- GitHub Secrets access for `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET`.
- A small server/runtime route on the VPS, or a dry-run auth server for fallback testing.

**Step-by-step test path:**
1. Create the branch: `git checkout -b task/T20-google-oauth-login`.
2. In Google Cloud Console, create/select a project and configure OAuth consent screen basics.
3. Create OAuth Client ID with application type `Web application`.
4. Add authorized origin: `https://<assigned-domain>`.
5. Add authorized redirect URI: `https://<assigned-domain>/auth/google/callback`.
6. Copy the client ID and client secret into GitHub Secrets. Add a random `SESSION_SECRET` as a GitHub Secret too.
7. Add `/auth/google` route that creates a random state value, stores it in session/cookie, and redirects to Google with scopes `openid email profile`.
8. Add `/auth/google/callback` route that checks returned `state`, exchanges `code` with Google from the server, creates a session, and redirects back to the app.
9. Add `/auth/me` route that returns safe signed-in user fields only, and `/auth/logout` route that clears the session.
10. Add a Login with Google button or link in the UI and safe `/status`/manifest metadata showing `auth.provider=google`.
11. Run build and scan: `rg "GOOGLE_CLIENT_SECRET|SESSION_SECRET|VITE_GOOGLE_CLIENT_SECRET|access_token|refresh_token" src public dist .github` and verify no secret values or tokens are exposed.
12. Test live login if the domain is ready, or capture no-live fallback evidence from route code, secret references, Google Console redacted config, and generated auth manifest.

**Files likely touched:**
- server/auth route files or deployment runtime server config
- team-site/src/App.tsx or login component
- .github/workflows/deploy.yml
- status/release manifest files
- SUBMISSION.md

**What success looks like:**
- Google login redirects to the exact registered callback URI.
- Callback rejects missing/wrong state and handles successful login server-side.
- `/auth/me` shows safe user information after login and logged-out state after logout.
- `/status` or fallback manifest shows Google auth is configured without exposing secrets.

**Common beginner mistakes:**
- Registering `http://` or the wrong path as redirect URI.
- Putting `GOOGLE_CLIENT_SECRET` into Vite/client code.
- Forgetting state validation and accepting any callback.
- Showing raw ID/access tokens in UI or status output.
- Not adding test users on the OAuth consent screen when Google requires them.

Organizer verification focus:
- Confirm Google Console redirect URI and authorized origin match the assigned domain exactly.
- Confirm `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` are only referenced through server-side secrets.
- Confirm login, callback, current-user, and logout behavior or the no-live fallback route evidence.
