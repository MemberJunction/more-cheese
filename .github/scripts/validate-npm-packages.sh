#!/bin/bash
# Validates that all @mj-biz-apps packages exist on npm before publishing

echo "Checking for new packages that need npm placeholders..."

MISSING=()
CHECKED=0
MAX_RETRIES=3
RETRY_DELAY=2

for pkg_json in $(find packages -name "package.json" -maxdepth 2 -not -path "*/node_modules/*"); do
  name=$(jq -r '.name // ""' "$pkg_json")

  # Only check @mj-biz-apps scoped packages
  if [[ "$name" != @mj-biz-apps/* ]]; then
    continue
  fi

  CHECKED=$((CHECKED + 1))

  # Check if package exists on npm with retry logic
  EXISTS=false
  for attempt in $(seq 1 $MAX_RETRIES); do
    # `timeout` is coreutils: present on Linux (GitHub Actions), absent on macOS.
    # Called unguarded it exits 127, which this loop reads as "not found" — so a
    # local run reported every package missing no matter what was on npm, and the
    # retry made it look intermittent rather than broken. CI was always fine,
    # which is why it survived: the check is only wrong where you run it by hand.
    if command -v timeout > /dev/null 2>&1; then
      timeout 10 npm view "$name" version > /dev/null 2>&1
    else
      npm view "$name" version > /dev/null 2>&1
    fi
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
      EXISTS=true
      break
    fi
    if [ $exit_code -eq 1 ]; then
      # Package not found (E404) — no point retrying
      break
    fi
    # Network error or timeout — retry
    sleep $RETRY_DELAY
  done

  if [ "$EXISTS" = false ]; then
    MISSING+=("$name")
  fi

  # Progress indicator
  if [ $((CHECKED % 10)) -eq 0 ]; then
    echo "  Checked $CHECKED @mj-biz-apps packages..."
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "::error::Found ${#MISSING[@]} package(s) without npm placeholders:"
  for pkg in "${MISSING[@]}"; do
    echo "  - $pkg"
  done
  echo ""
  echo "For each missing package, publish a 0.0.0 placeholder manually before"
  echo "the automated workflow can take over."
  exit 1
fi

echo "All $CHECKED @mj-biz-apps packages exist on npm"
