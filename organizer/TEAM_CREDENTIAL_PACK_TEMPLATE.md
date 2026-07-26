# Team Credential Pack Template

Send one copy privately to each team. Replace every placeholder.

```text
TEAM_NAME=<team-name>
TEAM_REPO=https://github.com/knurdz/<team-repo>
VPS_HOST=<team-vps-ip-or-domain>
VPS_PORT=22
VPS_USER=deploy
DEPLOY_PATH=/opt/deploy-sprint/team-01
APP_PORT=8080
PUBLIC_URL=http://<team-vps-ip>
IP_PUBLIC_URL=http://<team-vps-ip>
DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org
```

## Participant Instructions

Do not ask for or store a VPS SSH private key. Organizers hold deploy access in the organizer-controlled deployer or protected deployment environment.

Do not commit this pack or paste secret values into PRs, issues, screenshots, or logs.

Custom domain and HTTPS setup belong to T02. Do not make T01 depend on Hostinger DNS unless organizers pre-create a separate bootstrap hostname.

## Custom Domain / DNS Portal Pack

Use this section for T02. Send the portal password privately and remind teams not to commit screenshots that reveal it.

```text
DNS_PORTAL_URL=<organizer-dns-portal-url>
DNS_PORTAL_USERNAME=<team-dns-username>
DNS_PORTAL_PASSWORD=<provided-separately>
ASSIGNED_DOMAIN=team01.verischolar.knurdz.org
DNS_RECORD_TYPE=A
DNS_RECORD_NAME=team01
DNS_RECORD_VALUE=<team-vps-ip-or-origin-host>
DNS_TXT_NAME=_deploy-sprint-challenge.team01
DNS_TXT_VALUE=<team-challenge-token>
DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org
PUBLIC_URL=https://team01.verischolar.knurdz.org
DOMAIN_HTTP_URL=http://team01.verischolar.knurdz.org
IP_PUBLIC_URL=http://<team-vps-ip>
```

## Google OAuth Pack

Use this section for T20. Teams usually create their own Google OAuth client, but organizers may provide expected redirect/origin values or pre-created dry-run credentials.

```text
GOOGLE_REDIRECT_URI=https://team01.verischolar.knurdz.org/auth/google/callback
GOOGLE_AUTHORIZED_ORIGIN=https://team01.verischolar.knurdz.org
GOOGLE_SCOPES=openid email profile
ALLOWED_TEST_EMAIL=<judge-or-team-email>
GOOGLE_CLIENT_ID=<team-created-or-organizer-provided-client-id>
GOOGLE_CLIENT_SECRET=<provided-separately-if-organizer-created>
SESSION_SECRET=<team-generated-random-session-secret>
```

Only `GOOGLE_CLIENT_ID` may be treated as public when needed. `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` stay secret.

## Optional Third-Party Service Pack

Use this section only if organizers pre-create service credentials. Otherwise teams can create their own keys using the task instructions.

```text
OPENWEATHER_API_KEY=<team-openweather-key>
WEB3FORMS_ACCESS_KEY=<team-web3forms-access-key>
RESEND_API_KEY=<team-resend-api-key>
RESEND_FROM_EMAIL=<approved-sender-email>
ALERT_RECIPIENT_EMAIL=<approved-test-recipient>
TURNSTILE_SITE_KEY=<team-turnstile-site-key>
TURNSTILE_SECRET_KEY=<team-turnstile-secret-key>
TURNSTILE_ALLOWED_HOSTNAME=team01.verischolar.knurdz.org
SENTRY_DSN=<team-sentry-dsn>
SENTRY_AUTH_TOKEN=<team-sentry-auth-token>
SENTRY_ORG=<sentry-org-slug>
SENTRY_PROJECT=<sentry-project-slug>
```

Distribute these values privately. Do not commit them to Git.
