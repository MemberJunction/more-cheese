#!/bin/zsh
# content-backfill-week.sh <Monday> — one headless Claude Code run for one blog week. Driven by content-backfill-blog.sh
# (xargs -P pool); needs REPO, LOGDIR, MODEL in the environment. Appends one line to $LOGDIR/results.tsv. Never runs git.
set -u
wk=$1; yr=${wk:0:4}
cd "$REPO" || exit 1
if ls "$REPO/content/blog/$yr"/ 2>/dev/null | python3 -c "
import sys,datetime as d
wk=d.date.fromisoformat('$wk'); end=wk+d.timedelta(days=6)
hit=[l for l in sys.stdin.read().split() if len(l)>=10 and l[:10]>=wk.isoformat() and l[:10]<=end.isoformat()]
sys.exit(0 if hit else 1)"; then
  echo -e "$wk\tskipped\texisting\t0" >> "$LOGDIR/results.tsv"; exit 0
fi
PROMPT="Use the morecheese-weekly-blog skill. Generate the ICF weekly blog for the week of Monday $wk. Write in US English spelling (organization, program, labeling, color, aging, center); never British spellings.
When the three files are written, run from the repo root: node scripts/validate-content.mjs --week $wk
Fix every FAIL and every ⚠ warning it prints (thin or undated research, homepage sources, copied source lists, real organisations named, missing member voice, British spellings, slug length) and re-run until the output shows no FAIL and no ⚠. If you must discard a draft, remove it with rm using the repo-relative path (for example: rm content/blog/$yr/<file>.md), never an absolute path. Never create test, scratch or placeholder files anywhere. Before choosing topics, read the titles of every post already in content/blog/ within four weeks of this one and do not repeat a theme or re-spotlight the same hero; a hero may only appear after their JoinDate in generated/member-profiles, and each hero gets at most one Member Spotlight across the whole corpus (grep content/blog for existing spotlights first). Do not edit posts from other weeks. Do not run git. Finish with the skill's §8 completion checklist."
start=$(date +%s)
# --output-format json gives us total_cost_usd per week (the text result is extracted into the .log for reading).
claude -p "$PROMPT" --model "$MODEL" --output-format json \
  --allowedTools "Skill" "Read" "Glob" "Grep" "Write" "Edit" "WebSearch" "WebFetch" "Bash(node scripts/validate-content.mjs*)" "Bash(ls*)" "Bash(date*)" "Bash(grep*)" "Bash(rm content/blog/*)" "Bash(rm $REPO/content/blog/*)" \
  > "$LOGDIR/$wk.json" 2> "$LOGDIR/$wk.err"
rc=$?
cost=$(python3 -c "
import json,sys
try:
    d=json.load(open('$LOGDIR/$wk.json')); print(f\"{d.get('total_cost_usd',0):.2f}\"); open('$LOGDIR/$wk.log','w').write(str(d.get('result','')))
except Exception as e: print('NA')" 2>/dev/null)
[ -s "$LOGDIR/$wk.err" ] && cat "$LOGDIR/$wk.err" >> "$LOGDIR/$wk.log"
node scripts/validate-content.mjs --week "$wk" > "$LOGDIR/$wk.validate.txt" 2>&1
vrc=$?
warns=$(grep -c "⚠" "$LOGDIR/$wk.validate.txt")
secs=$(( $(date +%s) - start ))
echo -e "$wk\tclaude_exit=$rc\tvalidator=$([ $vrc -eq 0 ] && echo PASS || echo FAIL)\twarnings=$warns\t${secs}s\tcost=\$$cost" >> "$LOGDIR/results.tsv"
