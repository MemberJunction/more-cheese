#!/bin/bash
# Fixture tests for validate-package-lock-case.sh (which reads package-lock.json).
#
# WHY THIS EXISTS. The version of this guard inherited from the template — bizapps-caliber,
# bizapps-tasks and BlueCypress/SaaS all still carry it — could not detect a mis-cased lockfile
# path AT ALL. It looked for the case variant with
#     git ls-files "$path*/package.json" | grep -i "^$path/package.json$"
# and that can never match: a git PATHSPEC GLOB is byte-exact regardless of core.ignorecase, so
# `packages/server*` does not match `packages/Server`, the glob returns EMPTY, and the `grep -i`
# behind it is handed nothing to be insensitive about. The mismatch list therefore stayed empty
# for a genuinely mis-cased lockfile, on Linux CI as well as macOS, and the script printed "No
# case-sensitivity issues found" and exited 0.
#
# That is a gate which was green for its entire life without ever being able to fail. The only
# defence against writing the same thing again is a test that watches it fail on purpose — and
# that pins BOTH core.ignorecase settings, since the local (macOS, true) and CI (Linux, false)
# behaviours differ and a developer only ever observes one of them. GIT_CONFIG_COUNT/KEY/VALUE
# set it per-invocation without touching the fixture's or the developer's own config.
#
# Ported from bizapps-forms, whose copy of this harness tests the same gate against a pnpm
# lockfile. What is new here: the fixtures emit npm's `package-lock.json` `.packages` map, since
# that is what this repo's gate parses with jq, and the malformed-input case covers the gate's
# explicit jq-failure branch rather than forms' missing-file guard.
#
# Usage: ./.github/scripts/__tests__/validate-package-lock-case.test.sh
# Exit 0 = all cases pass.

set -uo pipefail

SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/validate-package-lock-case.sh"
PASS=0
FAIL=0

# Builds a repo whose git index tracks packages/<each of $2> (default: Entities + Server), with a
# package-lock.json whose `.packages` keys are $1 (space-separated, may be empty). Echoes the
# directory. $2 may contain a nested path such as `vendor/packages/Thing`.
#
# The `node_modules/typescript` entry is not filler: every real lockfile is mostly node_modules
# keys, and they must never be mistaken for workspace paths.
make_repo() {
  local lock_paths="$1"
  local tracked="${2:-Entities Server}"
  local dir; dir=$(mktemp -d)
  git -C "$dir" init -q
  git -C "$dir" config user.email t@t.local
  git -C "$dir" config user.name test
  # No ${p,,} here: macOS ships bash 3.2, where that expansion is a FATAL "bad substitution" that
  # aborts this function before it echoes $dir — leaving the caller with an empty path and, before
  # the guard in `check`, silently running the gate against the real repository instead.
  for p in $tracked; do
    mkdir -p "$dir/packages/$p"
    echo "{\"name\":\"@mj-biz-apps/more-cheese-$(basename "$p")\"}" > "$dir/packages/$p/package.json"
  done
  {
    echo '{'
    echo '  "name": "more-cheese",'
    echo '  "lockfileVersion": 3,'
    echo '  "requires": true,'
    echo '  "packages": {'
    echo '    "": { "name": "more-cheese" },'
    for lp in $lock_paths; do
      echo "    \"$lp\": { \"name\": \"@mj-biz-apps/more-cheese-pkg\" },"
    done
    echo '    "node_modules/typescript": { "version": "5.5.4" }'
    echo '  }'
    echo '}'
  } > "$dir/package-lock.json"
  git -C "$dir" add -A >/dev/null
  git -C "$dir" commit -qm base
  echo "$dir"
}

# check <name> <expected-exit> <lock-paths> <ignorecase> [grep-for-in-output] [tracked-dirs]
check() {
  local name="$1" want="$2" lock_paths="$3" ignorecase="$4" expect_text="${5:-}" tracked="${6:-Entities Server}"
  local dir out rc
  dir=$(make_repo "$lock_paths" "$tracked")
  # If the fixture failed to build, `cd ""` is a no-op and the gate would run against the REAL
  # repository — reporting a result about the wrong tree. Refuse rather than measure the wrong
  # thing. (Not hypothetical: a bash-4-ism in make_repo did exactly this in the sibling repo.)
  if [ -z "$dir" ] || [ ! -d "$dir" ]; then
    FAIL=$((FAIL + 1)); echo "  FAIL — $name (fixture repo could not be built)"
    return
  fi
  out=$(cd "$dir" && GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.ignorecase \
    GIT_CONFIG_VALUE_0="$ignorecase" bash "$SCRIPT" 2>&1); rc=$?
  local ok=1
  [ "$rc" -eq "$want" ] || ok=0
  if [ -n "$expect_text" ] && ! grep -qF "$expect_text" <<<"$out"; then ok=0; fi
  if [ "$ok" -eq 1 ]; then
    PASS=$((PASS + 1)); echo "  ok   — $name"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL — $name (exit $rc, wanted $want)"; sed 's/^/         | /' <<<"$out"
  fi
  rm -rf "$dir"
}

echo "validate-package-lock-case.sh"

for ic in true false; do
  label="core.ignorecase=$ic"

  check "[$label] correct casing passes" \
    0 "packages/Entities packages/Server" "$ic" "No case-sensitivity issues found"

  # THE REGRESSION. Green for the entire life of the inherited script.
  check "[$label] a mis-cased path is CAUGHT" \
    1 "packages/server" "$ic" "lockfile: packages/server -> git: packages/Server"

  check "[$label] a mis-cased path is caught alongside correct ones" \
    1 "packages/Entities packages/server" "$ic" "lockfile: packages/server -> git: packages/Server"

  # Not a casing finding: breaks the install identically on both platforms, so it is not this
  # gate's job, and reporting it would fail this gate for an unrelated reason.
  check "[$label] a workspace git does not track at all is not reported" \
    0 "packages/Ghost" "$ic" "No case-sensitivity issues found"

  # The routine "nothing to check yet" state, and the only case that exercises the scoped `|| true`
  # on the workspace-key grep. It must stay a pass, not become an abort under pipefail.
  check "[$label] a lockfile with no workspace entries passes" \
    0 "" "$ic" "No case-sensitivity issues found"
done

# The two cases below pin the grep flags the gate's own comment claims are load-bearing. Both
# assert a PASS, which on its own would also pass against a gate that detects nothing — so each
# was confirmed by mutation instead: deleting the flag it names turns that case red (a bogus
# `lockfile: ... -> git: ...` finding and exit 1) while every other case stays green.
#
# They run once, at core.ignorecase=false (the CI value), rather than under both: what they pin is
# grep's behaviour, which git's index-casing setting does not reach.

# Without -F the lockfile key is a REGEX, so `Foo.Bar` matches the unrelated package `fooxbar` and
# the gate invents a case mismatch between two genuinely different packages.
check "[-F] a lockfile path with a regex metacharacter does not match an unrelated package" \
  0 "packages/Foo.Bar" false "No case-sensitivity issues found" "fooxbar Server"

# Without -x the match is a SUBSTRING, so `packages/Thing/package.json` matches inside the longer
# tracked path `packages/vendor/packages/Thing/package.json` — and the gate reports a mismatch
# naming a directory that is not the workspace at all. (A git pathspec `*` crosses `/`, so the
# nested manifest really is in GIT_PATHS; this case is live, not vacuous.)
check "[-x] a lockfile path that is a suffix of a longer tracked path is not matched" \
  0 "packages/Thing" false "No case-sensitivity issues found" "vendor/packages/Thing Server"

# grep exiting >1 is grep FAILING, not "no case variant tracked", and the two must not collapse:
# a broken grep that reports "no mismatch found" is a green check over a gate that checked
# nothing. The stub fails only the detection call — the one passing -m1 — so the lockfile-parsing
# grep ahead of it still works and the loop is actually reached.
GREP_DIR=$(make_repo "packages/Ghost")
REAL_GREP=$(command -v grep)
mkdir -p "$GREP_DIR/fakebin"
{
  echo '#!/bin/bash'
  echo 'for a in "$@"; do [ "$a" = "-m1" ] && exit 2; done'
  echo "exec $REAL_GREP \"\$@\""
} > "$GREP_DIR/fakebin/grep"
chmod +x "$GREP_DIR/fakebin/grep"
out=$(cd "$GREP_DIR" && PATH="$GREP_DIR/fakebin:$PATH" bash "$SCRIPT" 2>&1); rc=$?
if [ "$rc" -eq 1 ] && grep -qF "grep failed (exit 2)" <<<"$out"; then
  PASS=$((PASS + 1)); echo "  ok   — a failing grep fails the gate instead of reading as 'no mismatch'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL — a failing grep fails the gate instead of reading as 'no mismatch' (exit $rc)"
  sed 's/^/         | /' <<<"$out"
fi
rm -rf "$GREP_DIR"

# A gate that cannot parse its input has not passed — it abstained. Without the explicit jq check
# this is the fail-open shape the whole file is written against: empty key list, zero loop
# iterations, "No case-sensitivity issues found", exit 0.
MALFORMED_DIR=$(make_repo "packages/Entities")
echo '{ "packages": { "" : ' > "$MALFORMED_DIR/package-lock.json"
out=$(cd "$MALFORMED_DIR" && bash "$SCRIPT" 2>&1); rc=$?
if [ "$rc" -eq 1 ] && grep -qF "could not be read as JSON" <<<"$out"; then
  PASS=$((PASS + 1)); echo "  ok   — a malformed lockfile fails loudly instead of reporting all-clear"
else
  FAIL=$((FAIL + 1)); echo "  FAIL — a malformed lockfile fails loudly instead of reporting all-clear (exit $rc)"
  sed 's/^/         | /' <<<"$out"
fi
rm -rf "$MALFORMED_DIR"

# Same argument for a lockfile that is not there at all: jq cannot open it, and the gate must say
# so rather than close with an all-clear over a file it never read.
MISSING_DIR=$(mktemp -d)
git -C "$MISSING_DIR" init -q
out=$(cd "$MISSING_DIR" && bash "$SCRIPT" 2>&1); rc=$?
if [ "$rc" -eq 1 ] && grep -qF "could not be read as JSON" <<<"$out"; then
  PASS=$((PASS + 1)); echo "  ok   — a missing lockfile fails instead of reporting all-clear"
else
  FAIL=$((FAIL + 1)); echo "  FAIL — a missing lockfile fails instead of reporting all-clear (exit $rc)"
  sed 's/^/         | /' <<<"$out"
fi
rm -rf "$MISSING_DIR"

echo "  $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
