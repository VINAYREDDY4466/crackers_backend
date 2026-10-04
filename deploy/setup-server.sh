#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 EC2 instance.
# Run from the backend folder: sudo bash deploy/setup-server.sh <api-domain> <email-for-ssl>
set -euo pipefail

API_DOMAIN="${1:-}"
SSL_EMAIL="${2:-}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_USER="${SUDO_USER:-}"

fail() { echo "Error: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "run with sudo."
[[ -n "$APP_USER" && "$APP_USER" != "root" ]] || fail "run with sudo from your normal user, not as root."
[[ -n "$API_DOMAIN" && -n "$SSL_EMAIL" ]] || fail "usage: sudo bash deploy/setup-server.sh <api-domain> <email-for-ssl>"
[[ -f "$APP_DIR/.env" ]] || fail "create $APP_DIR/.env before running this script."
grep -q '^NODE_ENV=production' "$APP_DIR/.env" || fail "set NODE_ENV=production in .env."

echo "==> Installing Node.js 22, Nginx, Certbot"
apt-get update -y
apt-get install -y curl ca-certificates nginx certbot python3-certbot-nginx
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
command -v pm2 >/dev/null || npm install -g pm2

echo "==> Installing app dependencies"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci --omit=dev"

echo "==> Starting the API with PM2"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && pm2 startOrReload ecosystem.config.cjs && pm2 save"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null

echo "==> Configuring Nginx for $API_DOMAIN"
sed "s/API_DOMAIN/$API_DOMAIN/" "$APP_DIR/deploy/nginx-api.conf" > /etc/nginx/sites-available/deepam-api
ln -sf /etc/nginx/sites-available/deepam-api /etc/nginx/sites-enabled/deepam-api
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Checking DNS before requesting the SSL certificate"
PUBLIC_IP="$(curl -fsS https://checkip.amazonaws.com | tr -d '[:space:]')"
DNS_IP="$(getent ahostsv4 "$API_DOMAIN" | awk 'NR==1 {print $1}')"
[[ "$DNS_IP" == "$PUBLIC_IP" ]] || fail "$API_DOMAIN points to '${DNS_IP:-nothing}', but this server is $PUBLIC_IP. Fix DNS, then re-run."

certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect

echo "==> Done. Test: curl https://$API_DOMAIN/api/health"
