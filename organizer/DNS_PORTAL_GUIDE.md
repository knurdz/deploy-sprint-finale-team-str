# DNS Portal Guide

Use this guide to prepare and validate T02 - Connect Custom Domain.

## Organizer Setup

For each team, prepare a DNS credential pack with:

```text
DNS_PORTAL_URL=<organizer-dns-portal-url>
DNS_PORTAL_USERNAME=<team-dns-username>
DNS_PORTAL_PASSWORD=<provided-separately>
ASSIGNED_DOMAIN=team01.verischolar.knurdz.org
DNS_RECORD_TYPE=A or CNAME
DNS_RECORD_NAME=team01.verischolar
DNS_RECORD_VALUE=<team-vps-ip-or-origin-host>
DNS_TXT_NAME=_deploy-sprint-challenge.team01.verischolar
DNS_TXT_VALUE=<team-challenge-token>
DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org
PUBLIC_URL=https://team01.verischolar.knurdz.org
```

Use one portal account or scoped token per team. Do not reuse one shared password across all teams unless the portal can audit per-team changes another way.

## Hostinger Portal Setup

For the current Hostinger DNS setup, run the participant portal from `portal/` and set these values in `portal/.env.local`:

```text
HOSTINGER_API_TOKEN=<hostinger-api-token>
HOSTINGER_DNS_ZONE=knurdz.org
TEAM_DOMAIN_SUFFIX=verischolar.knurdz.org
DNS_PORTAL_URL=http://localhost:4174/dns-portal
DNS_PORTAL_USERNAME=team01
DNS_PORTAL_PASSWORD=<temporary-team-password>
DNS_TEAM_LABEL=team01
ASSIGNED_DOMAIN=team01.verischolar.knurdz.org
DNS_RECORD_TYPE=A
DNS_RECORD_NAME=team01.verischolar
DNS_RECORD_VALUE=<team-vps-ip>
DNS_TXT_NAME=_deploy-sprint-challenge.team01.verischolar
DNS_TXT_VALUE=<random-challenge-token>
IP_PUBLIC_URL=http://40.81.235.54
DOMAIN_PUBLIC_URL=https://team01.verischolar.knurdz.org
PUBLIC_URL=http://40.81.235.54
PUBLIC_URL_MODE=auto
AUTO_SWITCH_PUBLIC_URL_AFTER_DNS=true
DEPLOYER_OWNER=knurdz
DEPLOYER_REPO=deploy-sprint-deployer
DEPLOYER_PUBLIC_URL_VARIABLE=TEAM01_PUBLIC_URL
DEPLOYER_DOMAIN_VARIABLE=TEAM01_DOMAIN
DEPLOYER_ENABLE_DOMAIN_TLS_VARIABLE=TEAM01_ENABLE_DOMAIN_TLS
TEAM_REPO_PUBLIC_URL_VARIABLE=PUBLIC_URL
TEAM_REPO_DOMAIN_PUBLIC_URL_VARIABLE=DOMAIN_PUBLIC_URL
TEAM_REPO_PUBLIC_URL_MODE_VARIABLE=PUBLIC_URL_MODE
```

If the event subdomain changes later, update `TEAM_DOMAIN_SUFFIX` and regenerate each team's `ASSIGNED_DOMAIN`, `DNS_RECORD_NAME`, and `DNS_TXT_NAME`.

## Recommended Workflow

1. Create the team subdomain entry in the organizer DNS portal but leave records empty or incorrect before release.
2. Give the team the portal URL, username, password, assigned domain, expected record type, target value, and TXT challenge token through the private credential pack.
3. Ask teams to create the A/CNAME and TXT records themselves.
4. Teams click **Create Records** in the DNS portal. The portal applies the DNS records and, when the PAT has Actions variable write access, updates the team repo `PUBLIC_URL`, `DOMAIN_PUBLIC_URL`, and `PUBLIC_URL_MODE`, then updates the deployer `TEAM01_PUBLIC_URL`, `TEAM01_DOMAIN`, and `TEAM01_ENABLE_DOMAIN_TLS=true`. This makes HTTPS automatic for the assigned domain on the next deploy.
5. Teams provide lookup output and safe portal screenshots or export evidence.
6. Judges verify DNS records, domain response, and status/manifest evidence.

## Verification Commands

```bash
dig team01.verischolar.knurdz.org
nslookup team01.verischolar.knurdz.org
dig TXT _deploy-sprint-challenge.team01.verischolar.knurdz.org
curl -I http://team01.verischolar.knurdz.org/health
curl -I https://team01.verischolar.knurdz.org/health
curl -I http://40.81.235.54/health
curl https://team01.verischolar.knurdz.org/status
```

If the live site is not ready, accept no-live fallback evidence: portal export, DNS lookup output, host-header dry-run evidence, and generated manifest/status showing the assigned domain.

## Judging Checklist

- A/CNAME record type matches organizer instruction.
- Record target matches the assigned VPS IP or origin host.
- TXT challenge exists and matches the team token.
- `PUBLIC_URL` points to the HTTPS assigned domain after T02 automation.
- The assigned domain still works over plain HTTP, with no forced HTTPS-only breakage.
- The raw IP URL still works over plain HTTP after HTTPS is enabled.
- `/status` or fallback manifest includes `domain.connected=true` and the assigned host.
- Portal password, DNS API token, and TXT challenge value are not committed or exposed in screenshots/logs.

T02 enables HTTPS automatically through the organizer deployer when DNS is applied. The deployer must continue serving `http://<assigned-domain>` and `http://<team-ip>` as compatibility paths; HTTPS is an addition, not a redirect-only replacement.
