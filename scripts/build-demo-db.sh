#!/bin/zsh
# build-demo-db.sh — build the More Cheese demo database from nothing: MJ, the BizApps it composes, collaboration and
# voting, More Cheese's own schema and data, then its spaces and elections.
#
# Install and upgrade normally run migrations only, but this demo also needs what no migration can carry: spaces have
# to be created by their owners and elections run through voting's engines (see load-spaces.mjs and
# load-elections.mjs). Until bizapps-collaboration and bizapps-voting are released and listed in mj-app.json, this
# script is how anyone other than the person who built the demo gets one.
#
# It needs an `mj dev workspace`: one parent folder holding MJ and the sibling repos below, built, with
# @mj-biz-apps/collaboration-server and @mj-biz-apps/voting-server loaded through dynamicPackages.server in MJ's
# mj.config.cjs (a local wiring edit, never committed to MJ). DB_* come from the environment or MJ's .env.
#
#   scripts/build-demo-db.sh --ws ~/Projects/mj-spaces-ws --db MJ_MoreCheese_Demo [--presenter you@example.com]
#                            [--logs ../demo-db-logs] [--from <step>]
#
# --presenter makes your own user as a copy of the template user (mj user clone), seats it where the template sits,
# puts it on the open elections' rolls and gives it voting's Election Inspector role (so standards comments show
# their writers). Sign in with that email afterwards. --from resumes at a step after a failure: create, mj, apps,
# more-cheese, codegen, data, presenter, spaces, elections. The create step DROPS the database if it exists.
# Restart MJAPI when it finishes: it caches what it read before the loaders' backdating.
#
# Run from the repo root.

set -u
zmodload zsh/zutil
zparseopts -D -E -A opt -ws: -db: -presenter: -logs: -from:
WS=${opt[--ws]:-}; DB=${opt[--db]:-}; PRESENTER=${opt[--presenter]:-}
REPO=$PWD; LOGS=${opt[--logs]:-$REPO/../demo-db-logs}; FROM=${opt[--from]:-create}
[[ -n $WS && -n $DB ]] || { echo "usage: scripts/build-demo-db.sh --ws <workspace> --db <database> [--presenter <email>]"; exit 2; }
[[ -f $REPO/mj-app.json && -d $WS/MJ ]] || { echo "run from the More Cheese repo root, with --ws holding MJ"; exit 2; }
[[ -n ${DB_HOST:-} ]] || { set -a; source $WS/MJ/.env 2>/dev/null || source ~/Projects/MJ/.env; set +a; }
export DB_DATABASE=$DB
export MJ_MIGRATION_REQUEST_TIMEOUT=${MJ_MIGRATION_REQUEST_TIMEOUT:-1800000}
unset NODE_OPTIONS
mkdir -p $LOGS
CLI=$WS/MJ/packages/MJCLI/bin/run.js

# The apps in install order, each repo:schema. Collaboration builds on Common and Tasks; voting on Common.
APPS=(common:__mj_BizAppsCommon tasks:__mj_BizAppsTasks accounting:__mj_BizAppsAccounting orders:__mj_BizAppsOrders
      committees:__mj_BizAppsCommittees forms:__mj_BizAppsForms issues:__mj_BizAppsIssues sonar:__mj_BizAppsSonar
      secure-messaging:__mj_BizAppsSecureMessaging collaboration:__mj_BizAppsCollaboration voting:__mj_BizAppsVoting)
# bizapps-issues' .mj-sync.json leaves its predictive-scoring folders out of directoryOrder, so a push takes them
# alphabetically and saves the scoring binding before the ML model it names (an FK failure that rolls back the whole
# push). The demo doesn't use Issues' predictive scoring, so those folders stay out until Issues orders them.
typeset -A SKIP=(issues ml-model-scoring-bindings,ml-models,ml-training-pipelines,record-processes)
STEPS=(create mj apps more-cheese codegen data presenter spaces elections)

step() { echo; echo "===== $(date +%T) $1 ====="; }
ok() { [[ $1 == 0 ]] || { echo "===== STOP: $2 failed (exit $1); log in $LOGS. Resume with --from $3 ====="; exit 1; }; }
due() { (( ${STEPS[(i)$1]} >= ${STEPS[(i)$FROM]} )); }
SQL() { sqlcmd -S ${DB_HOST:-localhost},${DB_PORT:-1433} -U "$DB_USERNAME" -P "$DB_PASSWORD" -d "$DB" -C -h -1 -W -b -Q "SET NOCOUNT ON; $1"; }
push() { node $CLI sync push --dir "$1" --ci --no-interactive ${@:3} > "$LOGS/$2.log" 2>&1; local s=$?
         grep -oE '"created":[0-9]+,"updated":[0-9]+,"unchanged":[0-9]+' "$LOGS/$2.log" | tail -1; return $s; }
migrate() { local log=$LOGS/migrate-$1.log; shift; node $CLI migrate "$@" > $log 2>&1; local s=$?
            grep -E "Migrations complete|failed|Error" $log | tail -2; return $s; }
# Fields CodeGen recorded that no view has, and view columns no field records: both must end empty.
MISMATCH="SELECT e.Name+' / '+ef.Name FROM __mj.EntityField ef JOIN __mj.Entity e ON e.ID=ef.EntityID WHERE e.SchemaName<>'__mj' AND NOT EXISTS (SELECT 1 FROM sys.columns c WHERE c.object_id=OBJECT_ID(QUOTENAME(e.SchemaName)+'.'+QUOTENAME(e.BaseView)) AND c.name=ef.Name)"
UNRECORDED="SELECT e.Name+' / '+c.name FROM __mj.Entity e JOIN sys.columns c ON c.object_id=OBJECT_ID(QUOTENAME(e.SchemaName)+'.'+QUOTENAME(e.BaseView)) WHERE e.SchemaName<>'__mj' AND NOT EXISTS (SELECT 1 FROM __mj.EntityField ef WHERE ef.EntityID=e.ID AND ef.Name=c.name)"

if due create; then
  step "create $DB (dropped first if it exists)"
  sqlcmd -S ${DB_HOST:-localhost},${DB_PORT:-1433} -U "$DB_USERNAME" -P "$DB_PASSWORD" -C -b -Q "IF DB_ID('$DB') IS NOT NULL BEGIN ALTER DATABASE [$DB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$DB]; END; CREATE DATABASE [$DB]; ALTER DATABASE [$DB] SET READ_COMMITTED_SNAPSHOT ON;"
  ok $? "create" create
  SQL "IF SUSER_ID('MJ_CodeGen') IS NOT NULL AND DATABASE_PRINCIPAL_ID('MJ_CodeGen') IS NULL CREATE USER [MJ_CodeGen] FOR LOGIN [MJ_CodeGen]; IF DATABASE_PRINCIPAL_ID('MJ_CodeGen') IS NOT NULL ALTER ROLE db_owner ADD MEMBER [MJ_CodeGen];"
fi

cd $WS/MJ
if due mj; then
  step "MJ: migrate, then its metadata"
  MJ_DYNAMIC_PACKAGES=none migrate mj; ok $? "MJ migrate" mj
  MJ_DYNAMIC_PACKAGES=none push metadata mj-metadata; ok $? "MJ metadata push" mj
fi

if due apps; then
  for pair in $APPS; do
    app=${pair%%:*}; schema=${pair##*:}
    step "bizapps-$app: migrate into $schema, then its metadata"
    SQL "IF SCHEMA_ID('$schema') IS NULL EXEC('CREATE SCHEMA [$schema]');"
    MJ_DYNAMIC_PACKAGES=none migrate $app --schema $schema --dir $WS/bizapps-$app/migrations; ok $? "bizapps-$app migrate" apps
    meta=$WS/bizapps-$app/metadata
    # bizapps-voting's remote operations set AllowScopedPrincipal, a Remote Operations column no MJ release has yet
    # (only guest edge voting reads it). Until one does, push a copy of voting's metadata without that field.
    if [[ $app == voting && -z $(SQL "SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('__mj.RemoteOperation') AND name='AllowScopedPrincipal'") ]]; then
      rm -rf $LOGS/voting-metadata && cp -R $meta $LOGS/voting-metadata && meta=$LOGS/voting-metadata
      node -e "const fs=require('fs'),f=process.argv[1],j=JSON.parse(fs.readFileSync(f));for(const r of j)delete r.fields.AllowScopedPrincipal;fs.writeFileSync(f,JSON.stringify(j,null,2))" $meta/remote-operations/.voting-remote-operations.json
      echo "(voting metadata pushed without AllowScopedPrincipal: this MJ has no such column)"
    fi
    MJ_DYNAMIC_PACKAGES=none push $meta $app-metadata ${SKIP[$app]:+--exclude=${SKIP[$app]}}; ok $? "bizapps-$app metadata push" apps
  done
fi

if due more-cheese; then
  step "More Cheese: migrate into morecheese_members (the baseline and the release seeds)"
  SQL "IF SCHEMA_ID('morecheese_members') IS NULL EXEC('CREATE SCHEMA [morecheese_members]');"
  MJ_DYNAMIC_PACKAGES=none migrate more-cheese --schema morecheese_members --dir $REPO/migrations; ok $? "More Cheese migrate" more-cheese
fi

if due codegen; then
  # A fresh chain can leave fields CodeGen recorded for columns no view has; MJ's own cleanup removes them, then
  # CodeGen runs per app (orders and committees twice: each needs the other's fields in place).
  step "CodeGen, with MJ's cleanup of unneeded fields before and after"
  SQL "EXEC __mj.spDeleteUnneededEntityFields @ExcludedSchemaNames='__mj,sys,staging'"
  for dir in ${APPS%%:*} more-cheese orders committees; do
    [[ $dir == more-cheese ]] && d=$REPO || d=$WS/bizapps-$dir
    (cd $d && MJ_DYNAMIC_PACKAGES=none node $CLI codegen --skipfiles > "$LOGS/codegen-$dir.log" 2>&1); echo "codegen $dir: exit $?"
  done
  SQL "EXEC __mj.spDeleteUnneededEntityFields @ExcludedSchemaNames='__mj,sys,staging'"
  left=$(SQL "$MISMATCH"; SQL "$UNRECORDED")
  [[ -z $left ]] || { echo "$left"; ok 1 "metadata does not match the views" codegen; }
fi

if due data; then
  # From MJ's folder, with the app packages loaded (.claude/rules/metadata-sync.md). config/ carries the users the
  # spaces seat.
  step "More Cheese data: generated/, then config/"
  # Orders and payments stay out: the release seed (above) already holds the orders through the last release, and
  # generated/ no longer fits how bizapps-orders books. Every confirmed order lacks ConfirmedAt, so Orders takes any
  # re-save for a first booking (price-concession checks, journal entries again), historical discounts carry no
  # approved concession, and Loom writes ReversedByOrderHeaderID, a field Orders has never had. Until the generator
  # catches up, the orders placed since the last release seed are missing from a database built this way.
  # A push stamps a sync block on every record it saves, in the folder it pushed from, so push copies and leave the
  # repo's trees untouched.
  rm -rf $LOGS/push && mkdir -p $LOGS/push && cp -R $REPO/generated $REPO/config $LOGS/push/
  NODE_OPTIONS=--max-old-space-size=16384 push $LOGS/push/generated generated --exclude=orders,payments; ok $? "generated/ push" data
  # Sonar stays as the release seed left it: the seed publishes the engagement model, Sonar locks a published model's
  # factors and bands, and config/ has re-tuned the bands since. A release seed made from a fresh database carries
  # the new bands; a top-up on top of the old seed cannot.
  NODE_OPTIONS=--max-old-space-size=16384 push $LOGS/push/config config '--exclude=sonar-*'; ok $? "config/ push" data
fi

if due presenter && [[ -n $PRESENTER ]]; then
  step "presenter: $PRESENTER as a copy of the template user, with voting's Election Inspector role"
  if [[ -z $(SQL "SELECT ID FROM __mj.[User] WHERE Email='$PRESENTER'") ]]; then
    local_part=${PRESENTER%%@*}
    # mj user clone makes the user and then does not exit (MJ 6.2.1), so wait for the user to exist and end it.
    node $CLI user clone --from demo.user@morecheese.org --email $PRESENTER --first ${(C)local_part%%.*} --last ${(C)${local_part#*.}} > "$LOGS/presenter.log" 2>&1 &
    clone=$!
    for i in {1..90}; do
      kill -0 $clone 2>/dev/null || break
      grep -q "^✓ Created" "$LOGS/presenter.log" && sleep 5 && break
      sleep 2
    done
    kill $clone 2>/dev/null
    [[ -n $(SQL "SELECT ID FROM __mj.[User] WHERE Email='$PRESENTER'") ]]; ok $? "mj user clone" presenter
  fi
  SQL "INSERT __mj.UserRole (UserID, RoleID) SELECT u.ID, r.ID FROM __mj.[User] u CROSS JOIN __mj.Role r WHERE u.Email='$PRESENTER' AND r.Name='Election Inspector' AND NOT EXISTS (SELECT 1 FROM __mj.UserRole x WHERE x.UserID=u.ID AND x.RoleID=r.ID);"
  ok $? "Election Inspector role" presenter
fi

cd $REPO
P=(); [[ -n $PRESENTER ]] && P=(--presenter $PRESENTER)
if due spaces; then
  step "spaces (load-spaces.mjs)"
  node scripts/load-spaces.mjs --mj $WS/MJ $P > "$LOGS/load-spaces.log" 2>&1; s=$?; tail -12 "$LOGS/load-spaces.log"; ok $s "load-spaces" spaces
fi
if due elections; then
  step "elections (load-elections.mjs)"
  node scripts/load-elections.mjs --mj $WS/MJ $P > "$LOGS/load-elections.log" 2>&1; s=$?; tail -12 "$LOGS/load-elections.log"; ok $s "load-elections" elections
fi

step "done: $DB is built. Restart MJAPI against it (DB_DATABASE=$DB) before signing in."
