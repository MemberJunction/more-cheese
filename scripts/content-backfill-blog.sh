#!/bin/zsh
# content-backfill-blog.sh — run the morecheese-weekly-blog skill headlessly, one Claude Code run per week,
# fresh context each time, validator-gated. See .claude/skills/morecheese-weekly-blog/README.md.
#
#   scripts/content-backfill-blog.sh <first Monday> <last Monday> [parallel=3] [model=sonnet] [logdir]
#   e.g. scripts/content-backfill-blog.sh 2019-01-07 2019-03-25 3 sonnet
#
# Skips any week that already has a post dated inside it. Writes one log per week and appends to results.tsv
# (week, exit code, validator PASS/FAIL, warnings count) in the log directory. Per-week logic: content-backfill-week.sh. Never runs git.
set -u
REPO=${REPO:-$(cd "$(dirname "$0")/.." && pwd)}
FIRST=$1; LAST=$2; PAR=${3:-3}; MODEL=${4:-sonnet}; LOGDIR=${5:-$HOME/Projects/more-cheese-work/content-runs}
mkdir -p "$LOGDIR"
cd "$REPO" || exit 1

python3 - "$FIRST" "$LAST" > "$LOGDIR/weeks.txt" <<'PY'
import sys, datetime as d
w = d.date.fromisoformat(sys.argv[1]); last = d.date.fromisoformat(sys.argv[2])
assert w.weekday() == 0, "first date must be a Monday"
while w <= last:
    print(w.isoformat()); w += d.timedelta(days=7)
PY

# One week per process, PAR at a time. xargs -P is a real job pool (zsh has no `wait -n`; the old
# shell loop degraded to one week at a time after the first batch). results.tsv is appended, never reset.
export REPO LOGDIR MODEL
[ -f "$LOGDIR/results.tsv" ] || echo -e "week\tclaude\tvalidator\twarnings\tseconds" > "$LOGDIR/results.tsv"
tr '\n' '\0' < "$LOGDIR/weeks.txt" | xargs -0 -P "$PAR" -n 1 zsh "$REPO/scripts/content-backfill-week.sh"
echo "===== backfill done $(date +%T) ====="; cat "$LOGDIR/results.tsv"
