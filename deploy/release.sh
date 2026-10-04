#!/usr/bin/env bash
# Deploys the latest code on EC2. GitHub Actions runs it over SSH on every push to main.
# Manual run on the server: bash ~/crackers_backend/deploy/release.sh [commit-sha]
set -euo pipefail

HEALTH_URL="http://127.0.0.1:5050/api/health"

fail() { echo "Deploy failed: $*" >&2; exit 1; }

main() {
  local app_dir target
  app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  target="origin/main"
  if [[ -n "${1:-}" ]]; then
    [[ "$1" =~ ^[0-9a-f]{7,40}$ ]] || fail "'$1' is not a commit SHA."
    target="$1"
  fi

  cd "$app_dir"
  [[ -f .env ]] || fail "$app_dir/.env is missing. Create it on the server first."
  local tool
  for tool in git node npm pm2 curl; do
    command -v "$tool" >/dev/null ||
      fail "$tool is not installed. Run: sudo bash $app_dir/deploy/ec2-user-data.sh"
  done

  echo "==> Fetching code"
  git fetch --prune origin main
  git reset --hard "$target"
  echo "==> Now at $(git log -1 --format='%h %s')"

  echo "==> Installing production dependencies"
  npm ci --omit=dev --no-audit --no-fund

  echo "==> Restarting the API"
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save

  echo "==> Waiting for the health check"
  for _ in $(seq 1 20); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      echo "==> Deployed $(git rev-parse --short HEAD)"
      return 0
    fi
    sleep 2
  done

  pm2 logs deepam-api --lines 40 --nostream || true
  fail "the API did not become healthy. See the logs above."
}

# git reset replaces this file while it runs, so bash must read the whole script first.
main "$@"; exit
