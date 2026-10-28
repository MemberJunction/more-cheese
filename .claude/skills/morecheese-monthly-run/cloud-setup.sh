#!/bin/bash
# More Cheese monthly run: build Loom at the commit More Cheese CI pins, into /opt/loom.
# Runs before Claude starts; a failure is logged to /opt/loom-build.log and never blocks the session.
(
  set -euo pipefail
  tmp=$(mktemp -d)
  git clone --quiet --depth 1 --branch next --filter=blob:none --no-checkout https://github.com/MemberJunction/more-cheese "$tmp/mc"
  REF=$(git -C "$tmp/mc" show HEAD:.github/workflows/changes.yml | grep -A1 'repository: MemberJunction/loom' | sed -n 's/.*ref: *//p')
  rm -rf /opt/loom "$tmp"
  git clone --quiet https://github.com/MemberJunction/loom /opt/loom
  cd /opt/loom
  git checkout --quiet --detach "$REF"
  corepack enable
  pnpm install --frozen-lockfile
  for p in contracts engine cli; do pnpm --filter "@memberjunction/loom-$p" build; done
  chmod -R a+rwX /opt/loom
  echo "built $REF"
) > /opt/loom-build.log 2>&1 || echo "loom build failed" >> /opt/loom-build.log
exit 0
