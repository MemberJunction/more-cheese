#!/bin/zsh
# content-backfill-internal.sh — run the morecheese-internal-comms skill headlessly, one Claude Code run per week,
# fresh context each time, gated by validate-content.mjs --internal-week. See .claude/skills/morecheese-internal-comms/README.md.
#
#   scripts/content-backfill-internal.sh <Monday> [<Monday> ...]          # PAR, MODEL, LOGDIR from the environment
#   PAR=3 MODEL=sonnet LOGDIR=... scripts/content-backfill-internal.sh 2020-03-16 2023-07-24
#
# Takes an explicit list of Mondays (a pilot spreads weeks across eras; a tranche passes a contiguous run).
# Skips any week that already has internal artifacts dated inside it. Writes one log per week and appends to
# results.tsv (week, exit code, validator PASS/FAIL, seconds, cost). Per-week logic: content-backfill-internal-week.sh.
# Never runs git. Generate the public blog week first — the skill cross-references it.
set -u
REPO=${REPO:-$(cd "$(dirname "$0")/.." && pwd)}
PAR=${PAR:-3}; MODEL=${MODEL:-sonnet}; LOGDIR=${LOGDIR:-$HOME/Projects/more-cheese-work/internal-runs}
mkdir -p "$LOGDIR"
cd "$REPO" || exit 1
for wk in "$@"; do
  python3 -c "import datetime,sys; sys.exit(0 if datetime.date.fromisoformat('$wk').weekday()==0 else 1)" || { echo "$wk is not a Monday" >&2; exit 2; }
done
export REPO LOGDIR MODEL
[ -f "$LOGDIR/results.tsv" ] || echo -e "week\tclaude\tvalidator\tseconds\tcost" > "$LOGDIR/results.tsv"
printf '%s\0' "$@" | xargs -0 -P "$PAR" -n 1 zsh "$REPO/scripts/content-backfill-internal-week.sh"
echo "===== internal backfill done $(date +%T) ====="; cat "$LOGDIR/results.tsv"
