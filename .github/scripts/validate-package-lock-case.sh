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

# Every workspace package.json git actually tracks, enumerated ONCE with no per-path pathspec
# filtering, so the case-insensitive comparison below happens in grep rather than in git.
#
# ⚠️ THIS LIST IS THE FIX. The version of this script inherited from the template (bizapps-caliber,
# bizapps-tasks and BlueCypress/SaaS all still carry it) looked for the case variant with
#     git ls-files "$path*/package.json" | grep -i "^$path/package.json$"
# and that can never match: a git PATHSPEC GLOB is byte-exact regardless of core.ignorecase, so
# `packages/server*` does not match `packages/Server` and the glob returns EMPTY — the `grep -i`
# behind it is handed nothing to be insensitive about. MISMATCHES therefore stayed empty for a
# genuinely mis-cased lockfile, on Linux CI as well as macOS, and this script printed "No
# case-sensitivity issues found" and exited 0. The gate had never once detected the failure it
# exists for. `__tests__/validate-package-lock-case.test.sh` pins it under BOTH core.ignorecase
# settings, because the macOS (true) and CI (false) behaviours differ and a developer only ever
# observes one of them locally — which is how this survived.
#
# `apps/` stays in the pathspec even though this repo has no apps/ directory: the key filter above
# accepts `apps/` paths, so dropping it here would extract such a path and then be unable to match
# it in ANY casing — a narrower copy of the same silent miss. A pathspec matching nothing is inert.
GIT_PATHS=$(git ls-files -- 'packages/*/package.json' 'apps/*/package.json')

# Line-based read, not `for path in $PATHS`: a path containing a space (e.g. a package
# directory named "My Package") would otherwise word-split into two garbage arguments below.
while IFS= read -r path; do
  [ -z "$path" ] && continue

  # Exact casing present in the index — nothing to report.
  if git ls-files --error-unmatch "$path/package.json" > /dev/null 2>&1; then
    continue
  fi

  # No exact match. Is there one that differs ONLY by case? -F so a lockfile path containing a
  # regex metacharacter is compared literally and cannot match a different package, -x so it is a
  # whole-line match and not a substring of some longer tracked path, -m1 so two index entries
  # differing only by case still yield one line rather than a two-line $actual that `dirname`
  # would mangle. A here-string, not a pipe, so no pipefail or SIGPIPE interaction is left to
  # reason about. All three flags are pinned by cases in __tests__/.
  #
  # grep's exit status is READ, not discarded. 1 means "no case variant is tracked" — the ordinary
  # outcome for a workspace git does not have, which must not abort the gate. Anything ABOVE 1 is
  # grep itself failing; a here-string is a bash temp file, so an unwritable or full TMPDIR lands
  # here. A bare `|| actual=""` collapses the two and turns a broken grep into "no mismatch found"
  # and a green check — the exact fail-open shape this gate was rewritten to remove, so it does
  # not get to reappear in the rewrite.
  grep_rc=0
  actual=$(grep -ixF -m1 -e "$path/package.json" <<< "$GIT_PATHS") || grep_rc=$?
  if [ "$grep_rc" -gt 1 ]; then
    echo "::error file=package-lock.json::grep failed (exit $grep_rc) while checking '$path' — this gate validated nothing and has not passed"
    exit 1
  fi

  if [ -n "$actual" ]; then
    MISMATCHES+=("lockfile: $path -> git: $(dirname "$actual")")
  fi

  # A lockfile path git does not track in ANY casing is deliberately NOT reported here: that is a
  # missing or renamed workspace, which breaks the install identically on both platforms and so is
  # not a case-sensitivity finding. Naming it here would fail this gate for an unrelated reason.
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
