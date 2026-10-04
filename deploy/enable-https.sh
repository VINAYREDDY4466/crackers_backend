#!/usr/bin/env bash
# Points Nginx at the API and gets a free Let's Encrypt certificate.
# Run on EC2 after the first deploy, and again whenever the API domain changes:
#   sudo bash ~/crackers_backend/deploy/enable-https.sh <api-domain> <email-for-ssl>
set -euo pipefail

API_DOMAIN="${1:-}"
SSL_EMAIL="${2:-}"
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

fail() { echo "Error: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "run with sudo."
[[ -n "$API_DOMAIN" && -n "$SSL_EMAIL" ]] || fail "usage: sudo bash enable-https.sh <api-domain> <email-for-ssl>"
[[ "$API_DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]] || fail "'$API_DOMAIN' is not a valid domain name."

echo "==> Checking that $API_DOMAIN points to this server"
PUBLIC_IP="$(curl -fsS https://checkip.amazonaws.com | tr -d '[:space:]')"
DNS_IP="$(getent ahostsv4 "$API_DOMAIN" | awk 'NR==1 {print $1}')"
[[ "$DNS_IP" == "$PUBLIC_IP" ]] || fail "$API_DOMAIN points to '${DNS_IP:-nothing}', but this server is $PUBLIC_IP. Fix DNS, then re-run."

echo "==> Configuring Nginx"
sed "s/API_DOMAIN/$API_DOMAIN/" "$DEPLOY_DIR/nginx-api.conf" > /etc/nginx/sites-available/deepam-api
ln -sf /etc/nginx/sites-available/deepam-api /etc/nginx/sites-enabled/deepam-api
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Requesting the SSL certificate"
certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect

echo "==> Done. Test: curl https://$API_DOMAIN/api/health"
