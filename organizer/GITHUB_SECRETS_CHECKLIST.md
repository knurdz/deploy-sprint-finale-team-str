# GitHub Secrets Checklist

Use this checklist when validating T01 and later deploy tasks. For VPS deploy access, prefer an organizer-controlled deployer or protected deployment environment. A normal repository secret is hidden in the UI, but it is not a sufficient boundary if participants can freely edit workflows that reference it.

## Organizer-Held Deploy Values

```text
VPS_HOST
VPS_PORT
VPS_USER
VPS_SSH_KEY
DEPLOY_PATH
APP_PORT
PUBLIC_URL
IP_PUBLIC_URL
DOMAIN_PUBLIC_URL
```

`VPS_SSH_KEY` is organizer-held. Participants should not receive it, paste it, print it, or create workflows whose purpose is to reveal it.

## Manual UI Path

1. Open the team repository on GitHub.
2. Go to Settings > Secrets and variables > Actions.
3. Add or verify safe public values as repository variables where possible.
4. Store the deploy key only in the organizer-controlled deployer or a protected environment requiring organizer approval.
5. Do not ask teams to reveal secret values during judging.

## CLI Example For Organizers

```bash
gh secret set VPS_HOST --repo knurdz/<team-repo> --body "<host>"
gh secret set VPS_PORT --repo knurdz/<team-repo> --body "22"
gh secret set VPS_USER --repo knurdz/<team-repo> --body "deploy"
gh secret set DEPLOY_PATH --repo knurdz/<team-repo> --body "/opt/deploy-sprint/team-01"
gh secret set APP_PORT --repo knurdz/<team-repo> --body "8080"
gh variable set PUBLIC_URL --repo knurdz/<team-repo> --body "http://<team-vps-ip>"
gh variable set IP_PUBLIC_URL --repo knurdz/<team-repo> --body "http://<team-vps-ip>"
gh variable set DOMAIN_PUBLIC_URL --repo knurdz/<team-repo> --body "https://team01.verischolar.knurdz.org"
# Prefer setting this in the organizer deployer repo or a protected environment, not as an ordinary team repo secret:
gh secret set VPS_SSH_KEY --repo knurdz/<organizer-deployer-repo> < ~/deploy_sprint_team_01
```

For the real finale, teams should not manage VPS deploy keys. If an environment secret is used inside a team repo for testing, require organizer approval before release, protect workflow files with CODEOWNERS/rulesets, and inspect the exact workflow run before approving.

## DNS Portal And Domain Values

Required for T02 when teams configure or automate the custom domain workflow:

```text
DNS_PORTAL_URL
DNS_PORTAL_USERNAME
DNS_PORTAL_PASSWORD
ASSIGNED_DOMAIN
DNS_RECORD_TYPE
DNS_RECORD_NAME
DNS_RECORD_VALUE
DNS_TXT_NAME
DNS_TXT_VALUE
```

Treat `DNS_PORTAL_PASSWORD` and `DNS_TXT_VALUE` as secrets. Other DNS values may be repository variables if organizers allow them.

## Google OAuth Secrets

Required for T20 when teams attempt Google OAuth login:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SESSION_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_AUTHORIZED_ORIGIN
GOOGLE_SCOPES
ALLOWED_TEST_EMAIL
```

`GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` must never appear in source, browser bundles, screenshots, logs, or `/status` output. `GOOGLE_CLIENT_ID` can be visible when needed, but teams should still avoid pasting full credential pages into PR evidence.

## Third-Party Service Secrets

Required when teams attempt the spread service tasks:

```text
OPENWEATHER_API_KEY
WEB3FORMS_ACCESS_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
ALERT_RECIPIENT_EMAIL
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
TURNSTILE_ALLOWED_HOSTNAME
SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

`TURNSTILE_SITE_KEY`, `RESEND_FROM_EMAIL`, and `ALERT_RECIPIENT_EMAIL` may be variables if organizers allow them. `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and `SENTRY_AUTH_TOKEN` must stay secret.

Never ask teams to reveal secret values during judging. Validate usage through workflow references, source hygiene, and live `/status` or fallback artifact evidence.
