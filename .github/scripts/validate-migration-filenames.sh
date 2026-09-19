#!/bin/bash
# Validates migration file naming conventions
# Expected format: [VB][YYYYMMDDHHMM]__v[VERSION].x_[DESCRIPTION].sql

set -euo pipefail

MIGRATION_DIR="${1:-migrations}"
ERRORS=()
WARNINGS=()
COUNT=0

echo "::notice::Validating migration file naming conventions..."

# Null-delimited find/read via process substitution, not `for file in $(find ...)`: unquoted
# command substitution word-splits a filename containing a space, and piping into `while read`
# instead of using process substitution would run the loop in a subshell, resetting
# COUNT/ERRORS/WARNINGS the moment it exited. `2>/dev/null` is unchanged from before — a missing
# MIGRATION_DIR still surfaces as the loud "Validated 0 migration files" error below, it just
# doesn't ALSO print find's own "No such file or directory" on top of that clearer message.
while IFS= read -r -d '' file; do
  COUNT=$((COUNT + 1))
  basename=$(basename "$file")

  # Check format: V or B followed by 12-digit timestamp
  if ! echo "$basename" | grep -qE '^[VB][0-9]{12}__'; then
    ERRORS+=("$basename: Does not match pattern [VB][YYYYMMDDHHMM]__")
    continue
  fi

  # Extract and validate timestamp components. This cannot fail today — the anchor check above
  # already proved the same prefix matches — but it is guarded explicitly rather than left to
  # run bare under `set -e`: an unguarded failure here would abort the ENTIRE script mid-run,
  # with no indication of which file caused it, which is worse than the check it replaces.
  if ! timestamp=$(echo "$basename" | grep -oE '^[VB][0-9]{12}' | sed -E 's/^[VB]//'); then
    ERRORS+=("$basename: Could not extract a timestamp despite matching the naming pattern")
    continue
  fi
  hours=${timestamp:8:2}
  minutes=${timestamp:10:2}

  if [ "$hours" -gt 23 ]; then
    ERRORS+=("$basename: Invalid hours ($hours > 23)")
  fi
  if [ "$minutes" -gt 59 ]; then
    ERRORS+=("$basename: Invalid minutes ($minutes > 59)")
  fi

  # Warn if date is in the future
  file_date=${timestamp:0:8}
  today=$(date +"%Y%m%d")
  if [ "$file_date" -gt "$today" ]; then
    WARNINGS+=("$basename: Date is in the future ($file_date)")
  fi
done < <(find "$MIGRATION_DIR" -maxdepth 1 -name "[VB]*.sql" -type f -print0 2>/dev/null)

# Fail if no migrations were found/inspected
if [ "$COUNT" -eq 0 ]; then
  echo "::error::Validated 0 migration files in $MIGRATION_DIR. Pattern [VB]*.sql matched nothing."
  exit 1
fi

# Report results
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "::warning::Found migration files with future dates:"
  for w in "${WARNINGS[@]}"; do echo "  - $w"; done
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "::error::Found migration files with invalid naming:"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
  exit 1
fi

echo "::notice::All $COUNT migration filenames are valid!"
