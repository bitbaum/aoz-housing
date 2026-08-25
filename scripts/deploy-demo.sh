#!/usr/bin/env bash
#
# Deploy the AOZ demo instance (https://aoz.orangecat.ch).
#
# WHY THIS EXISTS, AND WHAT IT IS NOT
# -----------------------------------
# The real deployment (aoz-wohnen.orangecat.ch) is push-to-master CD via
# fleetcrown's reusable `selfhost-deploy.yml`. This demo instance is NOT on
# that pipeline yet: it is a second app on the same box, and registering a new
# app is a change in the fleetcrown repo, not this one.
#
# So this script is the honest interim — a named, committed, repeatable
# procedure rather than a sequence someone has to remember. Until the instance
# is registered for CD, **a push to master does not update aoz.orangecat.ch**;
# this script does.
#
# WHY A SEPARATE BUILD AT ALL
# ---------------------------
# `NEXT_PUBLIC_BRAND` is inlined at BUILD time, so an AOZ-branded instance
# cannot be served from the WG-branded build the CD pipeline produces. Two
# brands means two builds means two deployments.
#
# WHAT IT DELIBERATELY DOES NOT TOUCH
# -----------------------------------
# /opt/aoz-wohnen, the aoz_wohnen database, and the real Witikonerstrasse data.
# The demo has its own app dir, its own database, its own role, its own systemd
# unit and its own session secret — a cookie minted here is not valid there.
set -euo pipefail

BOX=${BOX:-root@167.233.22.31}
APP_DIR=/opt/aoz-demo/app
URL=https://aoz.orangecat.ch

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "==> verify"
npm run verify

echo "==> build (brand: aoz)"
rm -rf .next/standalone .next/static
NEXT_PUBLIC_BRAND=aoz npm run build

echo "==> assemble standalone bundle"
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> ship"
# launch.sh is excluded: the box's copy pins PORT and the env file path.
rsync -az --delete --exclude launch.sh .next/standalone/ "$BOX:$APP_DIR/"

echo "==> restart"
ssh "$BOX" "chown -R ubuntu:ubuntu $APP_DIR && systemctl restart aoz-demo-app"

echo "==> verify live (not just 'CI is green')"
sleep 5
code=$(curl -s -o /dev/null -w '%{http_code}' "$URL/api/health")
[ "$code" = "200" ] || { echo "health check failed: $code"; exit 1; }

# Assert on CONTENT, never on liveness: a restart that silently failed on a
# busy port still answers 200 — from the OLD process.
curl -s "$URL/login" | grep -q 'AOZ Begleitung' || {
  echo "live page does not carry the AOZ brand — stale build?"; exit 1;
}
doors=$(curl -s "$URL/api/auth/demo" | grep -o '"id"' | wc -l)
echo "    health 200, AOZ brand present, $doors demo doors offered"
echo "==> done: $URL"
