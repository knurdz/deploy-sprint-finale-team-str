# Secure Deployment Model

## Recommended Production Model

Participants should never receive the VPS SSH private key.

Use this flow for the finale:

1. Team repo builds the site and uploads an artifact or writes a deploy request.
2. Organizer-controlled deployer validates the team, commit, task evidence, and artifact.
3. Organizer-controlled deployer connects to the team VPS using the private key.
4. VPS accepts SSH only from the organizer deploy source.
5. Public traffic reaches only HTTP/HTTPS for the live site.

This keeps the deploy key outside participant-controlled workflow code.

## Why Not A Normal Team Repo Secret?

GitHub repository secrets are hidden in the UI, but workflow code can use any secret that is made available to the workflow. If participants can freely edit workflows, they may be able to misuse a normal repo secret even if they cannot view it in Settings.

If you must keep a deploy secret inside a team repo for a dry run, use all of these controls:

- Store it as an environment secret, not a broad repository secret.
- Require organizer approval on the environment before the job can access secrets.
- Prevent self-approval.
- Protect `.github/workflows/**` with CODEOWNERS or repository rulesets requiring organizer review.
- Only approve runs from merged, reviewed commits.
- Inspect the exact workflow code before approving the deployment job.
- Reject workflows that print, transform, upload, curl, or otherwise transmit secret material.

This protected-environment model is still weaker than a separate organizer deployer, because the team repo remains closer to the secret boundary.

## VPS Firewall Shape

On every team VPS:

- Allow `80/tcp` and `443/tcp` publicly.
- Allow `22/tcp` only from the organizer deploy runner, deployer server, VPN, or static runner IP.
- Deny all other inbound traffic.
- Disable SSH passwords and root login.

Example:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from <organizer-deploy-runner-ip>/32 to any port 22 proto tcp
sudo ufw enable
```

Do not use `sudo ufw allow 22/tcp` for finale VPSs.

## GitHub-Hosted Runner Note

Regular GitHub-hosted runner IP ranges are not a small static allowlist. If you use them for direct SSH, you must maintain allowlist updates from GitHub's meta IP ranges, and this still exposes SSH to a broad cloud range. Prefer a central deployer with a fixed IP, a GitHub larger runner/static IP setup if available, a self-hosted deploy runner controlled by organizers, or a private network tunnel.

## Participant-Facing Rule

Tell teams:

> You will not receive the VPS SSH private key. You must make the deployable artifact and deployment evidence through GitHub Actions. The organizer deployer publishes approved artifacts to your VPS.

