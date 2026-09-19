#!/bin/bash
# Validates that every publishable @mj-biz-apps package restricts what it ships.
#
# WHY THIS GATE EXISTS. npm includes EVERYTHING not excluded when a package declares neither a
# `files` field nor an `.npmignore`. All three packages here correctly declare both `files` and
# `publishConfig.access: "public"` today — nothing has kept them there. A dropped `files` field
# fails silently: the publish still succeeds, it just ships the whole working tree (source,
# tests, tsconfigs, anything unbuilt or private) to every consumer, and no one notices until they
# look inside the tarball.
#
# Ported from bizapps-common's .github/scripts/validate-package-files.sh, with `node -e` in place
# of `jq` — this repo's gates carry no dependency beyond Node itself (.claude/rules/repo-gates.md:
# "no database, no network, no npm install").
#
# Private packages are exempt and need neither field: `changeset publish` skips them
# (`packages.filter(pkg => !pkg.packageJson.private)`), so a private package's `files` has no
# bearing on what ships. Same predicate as validate-npm-packages.sh / validate-package-repository.sh,
# so all three gates agree on what "a package we publish" means.

set -uo pipefail

ERRORS=0
CHECKED=0
PRIVATE_SKIPPED=0

echo "Checking files + publishConfig in all publishable @mj-biz-apps packages..."

for pkg_json in $(find packages -name "package.json" -maxdepth 2 -not -path "*/node_modules/*" -not -path "*/dist/*"); do
  # One `node -e` per package.json, emitting a tab-separated record, rather than one invocation
  # per field — four process spawns to read one file would be pure overhead.
  IFS=$'\t' read -r name is_private has_files access < <(node -e "
    const pkg = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
    const hasFiles = Array.isArray(pkg.files) && pkg.files.length > 0;
    process.stdout.write([
      pkg.name || '',
      pkg.private === true,
      hasFiles,
      (pkg.publishConfig && pkg.publishConfig.access) || ''
    ].join('\t'));
  " "$pkg_json")

  if [[ "$name" != @mj-biz-apps/* ]]; then
    continue
  fi

  if [[ "$is_private" == "true" ]]; then
    echo "   skipped: $name - private, never published"
    PRIVATE_SKIPPED=$((PRIVATE_SKIPPED + 1))
    continue
  fi

  CHECKED=$((CHECKED + 1))

  # `files` must exist and be non-empty. Its CONTENT is deliberately not prescribed — a package
  # may legitimately ship more than dist — the gate only insists the package has decided, rather
  # than defaulting to "everything".
  if [[ "$has_files" != "true" ]]; then
    echo "::error file=$pkg_json::$name has no \"files\" field — npm would ship src/, tests and tsconfigs"
    ERRORS=$((ERRORS + 1))
  fi

  # Scoped packages default to RESTRICTED on npm, so a missing publishConfig.access turns the
  # first publish into a 402 that reads like a billing problem rather than a config one.
  if [[ "$access" != "public" ]]; then
    echo "::error file=$pkg_json::$name has no \"publishConfig\": { \"access\": \"public\" } — a scoped package defaults to restricted"
    ERRORS=$((ERRORS + 1))
  fi
done

if [[ $PRIVATE_SKIPPED -gt 0 ]]; then
  echo "   ($PRIVATE_SKIPPED private package(s) skipped - never published)"
fi

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "::error::Found $ERRORS packaging problem(s) across the publishable packages"
  echo ""
  echo "Every publishable package needs:"
  echo '  "files": ["/dist"],'
  echo '  "publishConfig": { "access": "public" }'
  exit 1
fi

echo "All $CHECKED publishable @mj-biz-apps packages restrict what they ship"
