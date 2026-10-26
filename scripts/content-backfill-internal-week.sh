#!/bin/zsh
# content-backfill-internal-week.sh <Monday> — one headless Claude Code run for one internal bundle week. Driven by
# content-backfill-internal.sh (xargs -P pool); needs REPO, LOGDIR, MODEL in the environment. Appends one line to
# $LOGDIR/results.tsv. Never runs git.
set -u
wk=$1; yr=${wk:0:4}
cd "$REPO" || exit 1
if node scripts/validate-content.mjs --internal-week "$wk" 2>/dev/null | grep -q "^PASS\|^FAIL  vault"; then
  echo -e "$wk\tskipped\texisting\t0" >> "$LOGDIR/results.tsv"; exit 0
fi
PROMPT="Use the morecheese-internal-comms skill. Generate the ICF internal bundle for the week of Monday $wk. Write in US English spelling (organization, program, labeling, color, aging, center); never British spellings.
Compute every figure with node scripts/vault-facts.mjs (week $wk first, then year or event as the bundle needs); never hand-roll a query and never quote a number the script did not print. Read the public blog posts dated in this week first (content/blog/$yr/) and cross-reference at least one of them. Read the titles of internal artifacts already filed within four weeks before this one (vault/internal/) and do not repeat a theme.
Senders and recipients are roles and role mailboxes only (VAULT-DESIGN §5.1); the named staff roster in §5.2 is not approved, so never use those names.
When the files are written, run from the repo root: node scripts/validate-content.mjs --internal-week $wk
Fix every FAIL and every ⚠ warning it prints and re-run until it shows 0 failing and no ⚠. If you must discard a draft, remove it with rm using the repo-relative path (for example: rm vault/internal/memos/$yr/<file>.md), never an absolute path. Never write outside vault/internal/. Never create test, scratch or placeholder files anywhere. Do not edit artifacts from other weeks. Do not run git. Finish with the skill's §10 completion checklist."
start=$(date +%s)
claude -p "$PROMPT" --model "$MODEL" --output-format json \
  --allowedTools "Skill" "Read" "Glob" "Grep" "Write" "Edit" "Bash(node scripts/vault-facts.mjs*)" "Bash(node scripts/validate-content.mjs*)" "Bash(ls*)" "Bash(date*)" "Bash(grep*)" "Bash(rm vault/internal/*)" \
  > "$LOGDIR/$wk.json" 2> "$LOGDIR/$wk.err"
rc=$?
cost=$(python3 -c "
import json
try:
    d=json.load(open('$LOGDIR/$wk.json')); print(f\"{d.get('total_cost_usd',0):.2f}\"); open('$LOGDIR/$wk.log','w').write(str(d.get('result','')))
except Exception as e: print('NA')" 2>/dev/null)
[ -s "$LOGDIR/$wk.err" ] && cat "$LOGDIR/$wk.err" >> "$LOGDIR/$wk.log"
node scripts/validate-content.mjs --internal-week "$wk" > "$LOGDIR/$wk.validate.txt" 2>&1
vrc=$?
secs=$(( $(date +%s) - start ))
echo -e "$wk\tclaude_exit=$rc\tvalidator=$([ $vrc -eq 0 ] && echo PASS || echo FAIL)\t${secs}s\tcost=\$$cost" >> "$LOGDIR/results.tsv"
