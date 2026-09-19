#!/bin/bash
# Validates repository.url in all @mj-biz-apps packages
# Required for npm provenance verification (OIDC trusted publishing)

set -euo pipefail

# Derive the expected URL from the ROOT package.json so this script survives
# the template rename — keep repository.url correct there and everywhere else.
# Guarded explicitly: a malformed root package.json must be a loud, named failure, not a bare
# `set -e` abort with no message.
if ! EXPECTED_URL=$(jq -r '.repository.url // ""' package.json); then
  echo "::error file=package.json::could not be read as JSON — jq failed to parse it"
  exit 1
fi
if [ -z "$EXPECTED_URL" ]; then
  echo "::error::Root package.json has no repository.url — set it first"
  exit 1
fi
ERRORS=0

echo "Checking repository.url in all @mj-biz-apps packages..."

# Null-delimited find/read via process substitution, not `for pkg_json in $(find ...)`:
# unquoted command substitution word-splits a path containing a space, and process substitution
# (not a `find | while` pipe) keeps the loop in this shell so ERRORS survives it.
while IFS= read -r -d '' pkg_json; do
  # One `jq` call for both fields, its exit status checked explicitly — a package.json that
  # fails to parse is a named, counted error here, never a silent skip past the name-filter
  # below (an empty $name would otherwise read as "not one of ours" and `continue` past it).
  if ! record=$(jq -r '(.name // "") + "\t" + (.repository.url // "")' "$pkg_json"); then
    echo "::error file=$pkg_json::could not be read as JSON — jq failed to parse it"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  IFS=$'\t' read -r name repo_url <<< "$record"

  # Only check @mj-biz-apps scoped packages
  if [[ "$name" != @mj-biz-apps/* ]]; then
    continue
  fi

  if [ -z "$repo_url" ]; then
    echo "::error file=$pkg_json::Missing repository.url in $pkg_json"
    ERRORS=$((ERRORS + 1))
  elif [ "$repo_url" != "$EXPECTED_URL" ]; then
    echo "::error file=$pkg_json::Invalid repository.url in $pkg_json: expected '$EXPECTED_URL', got '$repo_url'"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find packages -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -print0)

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "::error::Found $ERRORS package(s) with missing or invalid repository.url"
  echo ""
  echo "All @mj-biz-apps packages must have:"
  echo '  "repository": {'
  echo '    "type": "git",'
  echo "    \"url\": \"$EXPECTED_URL\""
  echo '  }'
  exit 1
fi

echo "All @mj-biz-apps packages have valid repository.url"
