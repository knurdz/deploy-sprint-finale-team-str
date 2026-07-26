# Third-Party Service Integration Guide

Use this guide to prepare and validate the external-service tasks spread across
the finale. Real API keys and auth tokens must never be committed to this
repository.

## Service Tasks

| Task | Service | Required GitHub Secrets | Public Evidence |
| --- | --- | --- | --- |
| T02 | DNS / Hostinger portal | `DNS_PORTAL_PASSWORD`, `DNS_TXT_VALUE` | DNS resolves, TXT challenge exists, `/status` or fallback manifest shows `domain.connected=true` |
| T07 | OpenWeather | `OPENWEATHER_API_KEY` | `/api/weather` or `/status` shows `weather.provider=openweather` |
| T10 | Web3Forms | `WEB3FORMS_ACCESS_KEY` | Contact form exists and `/status` shows `contact.provider=web3forms` |
| T16 | Resend | `RESEND_API_KEY` | Email alert/status evidence shows `email.provider=resend` and redacted secret handling |
| T20 | Google OAuth | `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` | `/auth/me` or `/status` shows `auth.provider=google` and server-side callback readiness |
| T24 | Cloudflare Turnstile | `TURNSTILE_SECRET_KEY` | Protected form or status evidence shows `security.provider=cloudflare-turnstile` |
| T30 | Sentry | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | `/status` shows `monitoring.provider=sentry` and release metadata |

## OpenWeather Setup

Participants should create or log in to an OpenWeather account, verify email if
required, and copy the API key/APPID from the OpenWeather API keys page. The key
must be stored as `OPENWEATHER_API_KEY`.

Competition rule: do not use `VITE_OPENWEATHER_API_KEY`. OpenWeather calls must
happen through a server/runtime endpoint, VPS-side script, deploy-time generated
JSON, or another non-browser-secret pattern.

## Web3Forms Setup

Participants should create a Web3Forms access key using the team email or a
credential provided by organizers. Web3Forms sends the access key by email.

Competition rule: store the key as `WEB3FORMS_ACCESS_KEY` even if examples show
public form usage. This keeps the secret-handling task consistent.

## Resend Setup

Participants should create a Resend account or use an organizer-provided test
credential. Store the API key as `RESEND_API_KEY`. Use only the approved sender
and recipient values from the credential pack during testing.

Competition rule: do not expose the API key through `VITE_RESEND_API_KEY` or
browser-side code. Teams may send a real test message only to the approved
recipient, or they may produce a dry-run workflow/status artifact when the
sender domain is not verified yet.

## Google OAuth Setup

Participants should create a Google Cloud OAuth web application, configure the
authorized origin and redirect URI exactly from the task page, and store
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` in GitHub
Secrets.

Competition rule: the callback/code exchange must happen server-side. Do not
use `VITE_GOOGLE_CLIENT_SECRET`, do not commit screenshots with full client
secret values, and provide safe `/auth/me` or `/status` evidence only.

## Cloudflare Turnstile Setup

Participants should create a Turnstile widget for the assigned hostname or use
organizer-provided test keys. The site key is public, but the secret key must be
stored as `TURNSTILE_SECRET_KEY`.

Competition rule: do not expose `TURNSTILE_SECRET_KEY` through Vite/browser
code. The evaluator checks for a protected interaction, server/runtime token
verification evidence, safe status metadata, and absence of
`VITE_TURNSTILE_SECRET_KEY`.

## Sentry Setup

Participants should create a Sentry React/browser JavaScript project and copy
the DSN. They should create an auth token for CI/release automation with only
the scopes needed by their Sentry workflow.

Competition rule: `SENTRY_DSN` may be client-visible, but
`SENTRY_AUTH_TOKEN` must stay secret and only be used in GitHub Actions or
server-side build/release automation.

## Validation Helper

Run the deterministic helper from the repository root:

```bash
node organizer/validate-service-integrations.mjs --docs-only
node organizer/validate-service-integrations.mjs --url <PUBLIC_URL>
```

For a private GitHub repo check, set `GITHUB_TOKEN` and run:

```bash
GITHUB_TOKEN=... node organizer/validate-service-integrations.mjs \
  --repo knurdz/deploy-sprint-finale-test-team-01-zero \
  --url <PUBLIC_URL>
```

The helper cannot read GitHub Secret values. It checks task docs, point totals,
workflow references, source hygiene, package/source markers, and public live
evidence.

## Organizer Recommendation

For the real finale, pre-create per-team credentials where possible. Account
signup and email verification can cost valuable competition time. If teams must
create their own accounts, release these tasks early enough for account setup
delays.
