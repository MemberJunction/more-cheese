#!/bin/bash
# Detects case-sensitivity mismatches between package-lock.json and git
# macOS is case-insensitive; Linux CI (GitHub Actions) is case-sensitive

set -euo pipefail

echo "Validating package-lock.json for case-sensitivity issues..."

MISMATCHES=()

# `jq` failing to parse the lockfile is a real, loud problem and must abort visibly, so it is
# checked explicitly rather than left to a bare `set -e` (which would abort with no message).
if ! LOCKFILE_KEYS=$(jq -r '.packages | keys[]' package-lock.json); then
  echo "::error file=package-lock.json::could not be read as JSON — jq failed to parse it"
  exit 1
fi

# `grep` matching ZERO keys — a lockfile with no packages/apps workspace entries — is the
# routine "nothing to check yet" case, not a parse failure, and must not abort under pipefail.
# `|| true` is scoped to exactly this one grep, immediately after the jq failure above is
# already handled separately, so it can't mask that.
PATHS=$(echo "$LOCKFILE_KEYS" | grep -E '^(packages|apps)/' || true)
PATHS=$(echo "$PATHS" | sed 's|/$||')

# Line-based read, not `for path in $PATHS`: a path containing a space (e.g. a package
# directory named "My Package") would otherwise word-split into two garbage arguments below.
while IFS= read -r path; do
  [ -z "$path" ] && continue

  # Check if the path exists in git with exact casing
  if ! git ls-files --error-unmatch "$path/package.json" > /dev/null 2>&1; then
    # Try case-insensitive match. `pipefail` is switched off for exactly this one pipeline:
    # `head -1` closing the pipe after its first line can SIGPIPE the upstream `git ls-files`,
    # and pipefail then reports the WHOLE pipeline as exit 141 even when the match was captured
    # cleanly — verified empirically, and `if actual=$(...); then` would misread that 141 as
    # "no match" and silently DROP a real case mismatch, which is worse than not checking at
    # all. Without pipefail here, the pipeline's exit status is `head`'s own (always 0 on a
    # normal read), so the actual signal is read from `$actual` being non-empty, exactly as
    # this script worked before it ran under strict mode.
    set +o pipefail
    actual=$(git ls-files "$path*/package.json" 2>/dev/null | grep -i "^$path/package.json$" | head -1)
    set -o pipefail
    if [ -n "$actual" ]; then
      actual_dir=$(dirname "$actual")
      MISMATCHES+=("lockfile: $path -> git: $actual_dir")
    fi
  fi
done <<< "$PATHS"

if [ ${#MISMATCHES[@]} -gt 0 ]; then
  echo ""
  echo "::error::Found ${#MISMATCHES[@]} case mismatch(es) in package-lock.json"
  echo ""
  for m in "${MISMATCHES[@]}"; do echo "  $m"; done
  echo ""
  echo "This happens when macOS (case-insensitive) generates a lockfile with"
  echo "different casing than what git stores. This causes npm ci to fail"
  echo "on Linux (case-sensitive) in GitHub Actions."
  echo ""
  echo "To fix:"
  echo "  1. Check actual casing: git ls-files packages/ | grep -i <package>"
  echo "  2. Rename via temp: mv packages/Path packages/temp && mv packages/temp packages/path"
  echo "  3. Regenerate lockfile: rm package-lock.json && npm install"
  exit 1
fi

echo "No case-sensitivity issues found in package-lock.json"
