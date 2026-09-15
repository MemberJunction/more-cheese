#!/bin/zsh
# content-backfill-blog.sh — run the morecheese-weekly-blog skill headlessly, one Claude Code run per week,
# fresh context each time, validator-gated. See .claude/skills/morecheese-weekly-blog/README.md.
#
#   scripts/content-backfill-blog.sh <first Monday> <last Monday> [parallel=3] [model=sonnet] [logdir]
#   e.g. scripts/content-backfill-blog.sh 2019-01-07 2019-03-25 3 sonnet
#
# Skips any week that already has a post dated inside it. Writes one log per week plus a results.tsv
# (week, exit code, validator PASS/FAIL, warnings count) in the log directory. Never runs git.
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

run_week() {
  wk=$1
  yr=${wk:0:4}
  # skip if any post is already dated inside this Mon–Sun window
  if ls "$REPO/content/blog/$yr"/ 2>/dev/null | python3 -c "
import sys,datetime as d
wk=d.date.fromisoformat('$wk'); end=wk+d.timedelta(days=6)
hit=[l for l in sys.stdin.read().split() if len(l)>=10 and l[:10]>=wk.isoformat() and l[:10]<=end.isoformat()]
sys.exit(0 if hit else 1)"; then
    echo -e "$wk\tskipped\texisting\t0" >> "$LOGDIR/results.tsv"; return
  fi
  PROMPT="Use the morecheese-weekly-blog skill. Generate the ICF weekly blog for the week of Monday $wk.
When the three files are written, run from the repo root: node scripts/validate-content.mjs --week $wk
Fix every FAIL and every ⚠ warning it prints (thin or undated research, homepage sources, copied source lists, real organisations named, missing member voice) and re-run until the output shows no FAIL and no ⚠. If you must discard a draft, remove it with rm (only under content/blog/). Before choosing topics, read the titles of every post already in content/blog/ within four weeks of this one and do not repeat a theme or re-spotlight the same hero; a hero may only appear after their JoinDate in generated/member-profiles. Do not edit posts from other weeks. Do not run git. Finish with the skill's §8 completion checklist."
  start=$(date +%s)
  claude -p "$PROMPT" --model "$MODEL" \
    --allowedTools "Skill" "Read" "Glob" "Grep" "Write" "Edit" "WebSearch" "WebFetch" "Bash(node scripts/validate-content.mjs*)" "Bash(ls*)" "Bash(date*)" "Bash(rm content/blog/*)" \
    > "$LOGDIR/$wk.log" 2>&1
  rc=$?
  node scripts/validate-content.mjs --week "$wk" > "$LOGDIR/$wk.validate.txt" 2>&1
  vrc=$?
  warns=$(grep -c "⚠" "$LOGDIR/$wk.validate.txt")
  secs=$(( $(date +%s) - start ))
  echo -e "$wk\tclaude_exit=$rc\tvalidator=$([ $vrc -eq 0 ] && echo PASS || echo FAIL)\twarnings=$warns\t${secs}s" >> "$LOGDIR/results.tsv"
}

export -f run_week 2>/dev/null || true
export REPO LOGDIR MODEL
echo -e "week\tclaude\tvalidator\twarnings\tseconds" > "$LOGDIR/results.tsv"
# zsh has no export -f; run weeks through a subshell loop with a simple job pool
running=0
while read -r wk; do
  ( run_week "$wk" ) &
  running=$((running+1))
  if [ "$running" -ge "$PAR" ]; then wait -n 2>/dev/null || wait; running=$((running-1)); fi
done < "$LOGDIR/weeks.txt"
wait
echo "===== backfill done $(date +%T) ====="; cat "$LOGDIR/results.tsv"
