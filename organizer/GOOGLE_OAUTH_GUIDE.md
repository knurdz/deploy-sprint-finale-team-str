# Google OAuth Guide

Use this guide to prepare and validate T20 - Google OAuth Login.

## Organizer Setup

Teams normally create their own Google Cloud OAuth client. Organizers provide the required redirect/origin values:

```text
GOOGLE_REDIRECT_URI=https://team01.verischolar.knurdz.org/auth/google/callback
GOOGLE_AUTHORIZED_ORIGIN=https://team01.verischolar.knurdz.org
GOOGLE_SCOPES=openid email profile
ALLOWED_TEST_EMAIL=<judge-or-team-email>
```

If organizers pre-create dry-run credentials, distribute the client secret privately and require teams to store it in GitHub Secrets.

## Expected Team Steps

1. Create or select a Google Cloud project.
2. Configure the OAuth consent screen and test users if required.
3. Create an OAuth client with application type `Web application`.
4. Add the authorized JavaScript origin and redirect URI exactly as assigned.
5. Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` in GitHub Secrets.
6. Implement server-side login, callback, session, current-user, and logout routes.
7. Expose only safe evidence in `/status`, `/auth/me`, or fallback manifests.

## Verification Focus

- Redirect URI in Google Cloud matches the team callback URL exactly.
- Client secret and session secret are not in client code, Vite variables, logs, screenshots, or generated artifacts.
- Callback validates `state` before accepting the authorization response.
- Code exchange happens server-side.
- Logout clears the session.
- Safe user evidence never includes raw access tokens, ID tokens, refresh tokens, or client secrets.

## Common Errors

- `redirect_uri_mismatch`: the callback path, scheme, or domain does not exactly match Google Cloud configuration.
- `access_denied`: test user is not added to the OAuth consent screen.
- Login works locally but not on the assigned domain: authorized origin/redirect URI still points to localhost or IP address.
- Secret leak: team used `VITE_GOOGLE_CLIENT_SECRET` or pasted credential screen into PR evidence.
