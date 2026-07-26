# Organizer VPS Setup Guide

Use this guide once per team VPS before giving teams repository access.

## 1. Create The Deploy User

```bash
sudo id -u deploy >/dev/null 2>&1 || sudo adduser --disabled-password --gecos "" deploy
```

## 2. Install Runtime Basics

```bash
sudo apt update
sudo apt install -y nginx docker.io docker-compose-plugin ufw
sudo usermod -aG docker deploy
```

## 3. Prepare The Deploy Directory

```bash
sudo mkdir -p /opt/deploy-sprint/team-01
sudo chown -R deploy:deploy /opt/deploy-sprint/team-01
```

Use a different path per team, for example `/opt/deploy-sprint/team-02`.

## 4. Generate One SSH Key Pair Per Team

Run this on your local machine, not on the VPS:

```bash
ssh-keygen -t ed25519 -C "deploy-sprint-team-01" -f deploy_sprint_team_01
```

This creates:

```text
deploy_sprint_team_01      # private key, store only in organizer-controlled deployer/protected environment
deploy_sprint_team_01.pub  # public key, install on VPS
```

## 5. Install The Public Key On The VPS

While logged into the VPS as an admin user:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Paste only the `.pub` key line into `authorized_keys`.

## 6. Test The Deploy Key

From your local machine:

```bash
ssh -i ~/deploy_sprint_team_01 deploy@<VPS_HOST>
```

## 7. Harden SSH Access

Keep SSH key-only and limit who can log in:

```bash
sudo tee /etc/ssh/sshd_config.d/deploy-sprint.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitRootLogin no
AllowUsers deploy
X11Forwarding no
AllowTcpForwarding no
PermitTunnel no
EOF
sudo sshd -t
sudo systemctl reload ssh
```

Use a firewall so the public internet can reach only the live site and the organizer-controlled deploy source can reach SSH:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from <organizer-deploy-runner-ip>/32 to any port 22 proto tcp
sudo ufw enable
sudo ufw status verbose
```

If you use normal GitHub-hosted runners, their source IP ranges are broad and can change. For the finale, prefer a central organizer deployer, a self-hosted deploy runner with a static IP, or a private tunnel/VPN. Do not open SSH to `0.0.0.0/0`.

## 8. Give Participants Their Pack

Send only public target values such as `VPS_HOST`, `DEPLOY_PATH`, `APP_PORT`, and `PUBLIC_URL`. Do not give participants the private key. Do not commit it to Git.
