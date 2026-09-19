#!/bin/bash
# Validates that all @mj-biz-apps packages exist on npm before publishing

set -euo pipefail

echo "Checking for new packages that need npm placeholders..."

MISSING=()
PARSE_ERRORS=0
CHECKED=0
MAX_RETRIES=3
RETRY_DELAY=2

# Null-delimited find/read via process substitution, not `for pkg_json in $(find ...)`:
# unquoted command substitution word-splits a path containing a space, and process substitution
# (not a `find | while` pipe) keeps the loop in this shell so CHECKED/MISSING survive it.
while IFS= read -r -d '' pkg_json; do
  # A package.json that fails to parse is a named, counted error, never a silent skip past the
  # name-filter below (an empty $name would otherwise read as "not one of ours" and `continue`).
  if ! name=$(jq -r '.name // ""' "$pkg_json"); then
    echo "::error file=$pkg_json::could not be read as JSON — jq failed to parse it"
    PARSE_ERRORS=$((PARSE_ERRORS + 1))
    continue
  fi

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
    #
    # `npm view` not existing on npm is the EXPECTED, routine outcome for a package that has
    # never been published (exit 1 / E404) — under `set -e` a bare `cmd; exit_code=$?` aborts
    # the whole script on that first non-zero exit, before `exit_code=$?` ever runs (verified
    # empirically). The if/else below reads the exit status from the command itself, which
    # `set -e` does not touch, and still distinguishes 0 / 1 / other exactly as before.
    if command -v timeout > /dev/null 2>&1; then
      if timeout 10 npm view "$name" version > /dev/null 2>&1; then
        exit_code=0
      else
        exit_code=$?
      fi
    else
      if npm view "$name" version > /dev/null 2>&1; then
        exit_code=0
      else
        exit_code=$?
      fi
    fi
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
done < <(find packages -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" -print0)

if [ $PARSE_ERRORS -gt 0 ] || [ ${#MISSING[@]} -gt 0 ]; then
  if [ ${#MISSING[@]} -gt 0 ]; then
    echo ""
    echo "::error::Found ${#MISSING[@]} package(s) without npm placeholders:"
    for pkg in "${MISSING[@]}"; do
      echo "  - $pkg"
    done
    echo ""
    echo "For each missing package, publish a 0.0.0 placeholder manually before"
    echo "the automated workflow can take over."
  fi
  if [ $PARSE_ERRORS -gt 0 ]; then
    echo ""
    echo "::error::$PARSE_ERRORS package.json file(s) could not be read as JSON — see the errors above."
  fi
  exit 1
fi

echo "All $CHECKED @mj-biz-apps packages exist on npm"
