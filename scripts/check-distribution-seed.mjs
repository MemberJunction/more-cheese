#!/usr/bin/env node
/**
 * Distribution gate — can a stranger install this app and get a working one?
 *
 * Ported from `bizapps-forms/scripts/check-distribution-seed.mjs`. The failures it catches were all
 * invisible from inside the repo that shipped them: everything built, every test passed, and the app
 * worked perfectly on the machine that had run `mj sync push` or `mj codegen` by hand. Nothing in a
 * repo reads shipped SQL for what it ASSUMES about the database it lands on — which is what this does.
 *
 * ── WHAT CAME ACROSS, AND WHAT DID NOT ────────────────────────────────────────────────────────
 * Forms numbers its checks 2..7 (its CHECK 1 was retired upstream — a hash-manifest proxy that
 * passed silently in one direction; `check-release-seed-coverage.mjs` replaced it). The numbers are
 * kept here so the two files can be read side by side.
 *
 *   CHECK 2  placeholders ...................... ported, with a smaller allowed set (see below)
 *   CHECK 3  Form Respondent grant hardening ... DROPPED — forms-specific, see the note below
 *   CHECK 4  core-metadata insert guards ....... ported, watershed re-derived for this repo
 *   CHECK 5  schema-sync scope ................. ported, floor and owned-schema set rewritten
 *   CHECK 6  extended-property value types ..... ported unchanged (a T-SQL fact, not a repo fact)
 *   CHECK 7  entity ids referenced vs seeded ... ported unchanged
 *
 * ⚠️ CHECK 3 IS DROPPED ON PURPOSE, and this is the note that says so. It governs the anonymous
 * `Form Respondent` role: `bizapps-forms` hardens four of that role's grants with row-level-security
 * filters, and a later-stamped `Metadata_Sync` regeneration would land AFTER the hardening and
 * silently re-open an instance-wide read (forms #41). more-cheese has no anonymous principal and
 * mints no roles — `config/` carries users, user-roles and application-roles, all of which bind to
 * roles the HOST already has. There is nothing here for the rule to be about, and a check that can
 * never fire is one a reader mistakes for coverage. If this app ever seeds a role, port it back:
 * the shape is the whole of forms' `checkRespondentGrants` and it is not reconstructible from memory.
 *
 * ── THE MULTI-SCHEMA ADAPTATION, WHICH IS WHERE THE PORT IS NOT MECHANICAL ────────────────────
 * Every sibling with this gate is single-schema. more-cheese creates THREE: `morecheese_members`
 * (declared in `mj-app.json`, written `${flyway:defaultSchema}`) plus `morecheese_events` and
 * `morecheese_learning`, created by the baseline as LITERAL names — `mj.config.cjs`'s
 * `schemaPlaceholders` maps only `morecheese_members` and `__mj`, so the other two have no
 * placeholder and never will. CHECK 5's notion of "a schema this app owns" is therefore a SET of
 * three spellings rather than forms' single `${flyway:defaultSchema}`; see {@link OWNED_SCHEMAS}.
 *
 * Read-only. No --fix. Exits non-zero on any violation. Node stdlib only, so it runs in CI without
 * an install step.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

/**
 * The only placeholders `mj app install` resolves. `flyway:defaultSchema` is the app schema and
 * `mjSchema` the core schema; everything else is the host's to define, and the host has never heard
 * of us.
 *
 * `mj migrate` builds Skyway's placeholder map from THIS repo's `mj.config.cjs`, but `mj app install`
 * builds it from the HOST's. Skyway deliberately leaves an unknown `${…}` UNTOUCHED rather than
 * failing, so a third placeholder does not error — it survives as a literal string into whatever SQL
 * contained it.
 */
const INSTALL_SUPPLIED_PLACEHOLDERS = new Set(['flyway:defaultSchema', 'mjSchema']);

/**
 * The directories whose SQL reaches a stranger's database.
 *
 * `migrations-pg/` is listed although this repo has none checked in: `package.json` ships an
 * `mj:migrate:convert` script that writes one, so the first PostgreSQL file is checked from birth
 * rather than from whenever somebody remembers to widen a gate. Every reader guards on `existsSync`.
 */
const SHIPPED_MIGRATION_DIRS = ['migrations', 'migrations-pg'];

// ---------------------------------------------------------------------------
// Masking — shared by every check below
// ---------------------------------------------------------------------------

/** A UUID, as regex SOURCE, so the several shapes that need one all spell it the same way. */
const UUID_PATTERN = '[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}';
const UUID_LITERAL = new RegExp(`^N?'(${UUID_PATTERN})'$`);

/**
 * Two offset-preserving copies of `sql`, both with comment bodies blanked to spaces:
 *
 *   `structure` — string-literal contents blanked too. Statement shape is matched on this, so a `--`
 *                 or a `;` inside a string cannot truncate a statement.
 *   `values`    — string literals intact. Argument text is sliced from this, so a resolved value
 *                 carries its real content and never a comment's.
 *
 * Blanking comments at all is what keeps prose from masquerading as SQL, and this repo needs it on
 * its first run: `B202607141200` carries a block comment reading "(minus ${flyway:timestamp})", which
 * an unmasked CHECK 2 reads as a third placeholder and fails the only migration this app has.
 */
function maskSql(sql) {
    // `split('')`, never `[...sql]`: the spread iterates CODE POINTS while every index below is a
    // UTF-16 CODE UNIT, so one astral character — and this repo's baseline and generated data are
    // full of them — slides the mask out of alignment with the source. A silent pass.
    const structure = sql.split('');
    const values = sql.split('');
    const blankBoth = (from, to) => {
        for (let k = from; k < to; k++) {
            if (structure[k] === '\n') continue;
            structure[k] = ' ';
            values[k] = ' ';
        }
    };
    const blankStructureOnly = (from, to) => {
        for (let k = from; k < to; k++) if (structure[k] !== '\n') structure[k] = ' ';
    };
    let i = 0;
    while (i < sql.length) {
        const pair = sql.slice(i, i + 2);
        if (pair === '--') {
            const newline = sql.indexOf('\n', i);
            const end = newline === -1 ? sql.length : newline;
            blankBoth(i, end);
            i = end;
        } else if (pair === '/*') {
            // Ends at the FIRST `*/`, deliberately, even though T-SQL block comments nest. Tracking
            // depth is more faithful to the dialect and strictly worse here: a header reading
            // "per migrations/*.sql convention" opens a phantom nesting level the real `*/` cannot
            // close, so the scan runs to EOF and blanks every record below it — the gate then reads an
            // empty file and reports health. Stopping early can only leak comment text into the
            // structure pass, which fails loudly instead of silently.
            const close = sql.indexOf('*/', i + 2);
            const end = close === -1 ? sql.length : close + 2;
            blankBoth(i, end);
            i = end;
        } else if (sql[i] === "'") {
            let j = i + 1;
            while (j < sql.length && !(sql[j] === "'" && sql[j + 1] !== "'")) j += sql[j] === "'" ? 2 : 1;
            blankStructureOnly(i + 1, j); // quotes stay, so offsets and token shape are preserved
            i = Math.min(j + 1, sql.length);
        } else {
            i++;
        }
    }
    return { structure: structure.join(''), values: values.join('') };
}

/** Index of the `)` closing the `(` at `open`, or -1. */
function matchingParen(text, open) {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        if (text[i] === '(') depth++;
        else if (text[i] === ')' && --depth === 0) return i;
    }
    return -1;
}

/** Index of the `END` closing the `BEGIN` at `begin`, or the end of the text. */
function matchingEnd(text, begin) {
    const keyword = /\b(BEGIN|END)\b/gi;
    keyword.lastIndex = begin;
    let depth = 0;
    for (let match = keyword.exec(text); match !== null; match = keyword.exec(text)) {
        if (match[1].toUpperCase() === 'BEGIN') depth++;
        else if (--depth === 0) return match.index;
    }
    return text.length;
}

/** The UUID a value states literally, uppercased — or null if it states something else. */
function literalUuid(value) {
    const match = value === null ? null : value.match(UUID_LITERAL);
    return match ? match[1].toUpperCase() : null;
}

/** `[start, end)` of each comma-separated item at paren depth zero inside `masked[from, to)`. */
function topLevelItemRanges(masked, from, to) {
    const ranges = [];
    let depth = 0;
    let start = from;
    for (let i = from; i < to; i++) {
        const char = masked[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
            ranges.push([start, i]);
            start = i + 1;
        }
    }
    ranges.push([start, to]);
    return ranges;
}

/** A column name with whatever quoting its dialect uses stripped off. */
function bareColumnName(text) {
    return text.trim().replace(/^\[|\]$|^"|"$/g, '').toLowerCase();
}

/**
 * The `.sql` files of `dirNames`, read once each.
 *
 * `readdirSync` is not recursive, and that is load-bearing rather than incidental:
 * `migrations/codegen/` is gitignored CodeGen staging (this repo's `.mj-sync.json` files write their
 * `sqlLogging` output there), full of raw un-normalised output that ships nowhere.
 */
function shippedSqlFiles(repoRoot, dirNames) {
    const files = [];
    for (const dirName of dirNames) {
        const dir = join(repoRoot, dirName);
        if (!existsSync(dir)) continue;
        for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
            files.push({ path: join(dir, file), sql: readFileSync(join(dir, file), 'utf-8') });
        }
    }
    return files;
}

// ---------------------------------------------------------------------------
// CHECK 2 — shipped SQL uses only placeholders the install engine supplies
// ---------------------------------------------------------------------------

function checkPlaceholders(repoRoot, violations) {
    const dirs = [join(repoRoot, 'migrations'), join(repoRoot, 'migrations-teardown')];
    for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        // Teardown scripts get an even smaller map — MJ substitutes ONLY ${mjSchema} there, with a
        // literal string split, no Skyway involved. That is also why the generated teardown in this
        // repo writes `morecheese_events` and `morecheese_learning` as literals and must.
        const allowed = dir.endsWith('migrations-teardown') ? new Set(['mjSchema']) : INSTALL_SUPPLIED_PLACEHOLDERS;
        for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
            // The `values` mask: comments are blanked, so a header that DISCUSSES a placeholder is not
            // read as using one, while string bodies survive because a placeholder inside a literal
            // really would ship unresolved.
            const sql = maskSql(readFileSync(join(dir, file), 'utf-8')).values;
            const seen = new Set();
            for (const match of sql.matchAll(/\$\{([^}]+)\}/g)) {
                const name = match[1];
                if (!allowed.has(name) && !seen.has(name)) {
                    seen.add(name);
                    violations.push(
                        `${relative(repoRoot, join(dir, file))} uses \${${name}}, which \`mj app install\` does not ` +
                            `supply (it resolves only ${[...allowed].map((p) => '${' + p + '}').join(' and ')}). Skyway leaves ` +
                            'unknown placeholders untouched, so this would ship as a literal string. Use a literal schema name instead.',
                    );
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// CHECK 5 — CodeGen's schema-sync calls never reach a schema this app does not own
// ---------------------------------------------------------------------------

/**
 * The FLOOR of schemas `spUpdateExistingEntitiesFromSchema` must always be told to leave alone.
 *
 * A floor, not the answer. Rewritten for this repo, whose dependency surface is the widest of any
 * sibling: `mj-app.json` declares NINE app dependencies, every one of which `mj app install` installs
 * FIRST, so a sync that includes any of their schemas rewrites another app's entity metadata on every
 * host that installs more-cheese. `dbo` and `staging` belong to the HOST: sweeping them registers the
 * customer's own tables as MJ entities. Both case variants, because the collation a host uses is not
 * ours to assume.
 *
 * What a hand-written list CANNOT do is name an Open App nobody here has heard of, which is why
 * {@link previouslyExcluded} supplies the other half by reading what the repo has already shipped.
 */
const SCHEMAS_NEVER_SYNCED = [
    'sys',
    'staging',
    'dbo',
    '${mjSchema}',
    // The nine apps mj-app.json declares a dependency on, in both case variants. Each is installed
    // before this one, so each is present on every host that installs more-cheese.
    '${mjSchema}_BizAppsCommon',
    '${mjSchema}_bizappscommon',
    '${mjSchema}_BizAppsOrders',
    '${mjSchema}_bizappsorders',
    '${mjSchema}_BizAppsAccounting',
    '${mjSchema}_bizappsaccounting',
    '${mjSchema}_BizAppsForms',
    '${mjSchema}_bizappsforms',
    '${mjSchema}_BizAppsTasks',
    '${mjSchema}_bizappstasks',
    '${mjSchema}_BizAppsIssues',
    '${mjSchema}_bizappsissues',
    '${mjSchema}_BizAppsSonar',
    '${mjSchema}_bizappssonar',
];

/**
 * The first migration this check governs, as its version stamp.
 *
 * Deliberately forward-looking, and set immediately after `B202607141200` — the baseline, and the
 * only migration this repo has. The baseline is append-only in practice: Skyway checksums it, and
 * every development database has already applied it, so editing it now would break those databases
 * while changing nothing about what a future host runs. What this gate does is stop the NEXT file,
 * which is the one that matters — `migrations/` is about to receive several
 * `V<stamp>__v1.2.x__Metadata_Sync_PartNofM.sql` seeds, generated by CodeGen and `mj sync push` from
 * one developer's database inventory, which is exactly the population every check here is about.
 *
 * WHAT THE BASELINE IS EXEMPTED FOR, measured rather than assumed, because a watershed nobody
 * quantified is a watershed nobody can shrink later. Run CHECK 4 with this stamp removed and
 * `B202607141200` reports 138 violations:
 *
 *   122 unguarded core-metadata INSERTs   12 Entity, 12 ApplicationEntity, 36 EntityPermission,
 *                                         48 EntityFieldValue, 14 EntitySetting
 *    16 ID-only-guarded INSERTs           all 16 EntityRelationship
 *
 * That distribution is the lesson, and it is the same one forms records: the file is PASTED CODEGEN
 * OUTPUT, and the ID-only guard is the guard CodeGen itself emits for a relationship row. The defect
 * arrives by the routine act of running `mj codegen` and pasting the result, not by anybody choosing
 * a weak predicate. The baseline's 166 `EntityField` inserts, by contrast, already carry the correct
 * natural-key guard (`WHERE ID = '<guid>' OR (EntityID = … AND Name = …)`), which is the shape the
 * violation message points at.
 *
 * CHECK 6 and 7 are clean on the baseline at ANY watershed — it passes only string literals to its
 * 300-plus extended-property writes, and every one of the 362 entity-id references it carries
 * resolves to one of the 12 `Entity` rows it seeds itself. Neither is gated on this stamp at all.
 *
 * CHECK 5 IS EXEMPTED TOO, and the cost is 7 more violations — measured the same way, by removing
 * the stamp and re-running: 145 total, of which 138 are the CHECK 4 distribution above and 7 are
 * CHECK 5. An earlier revision of this paragraph said the baseline "makes no schema-sync call" and
 * that the exemption "buys CHECK 4 only". Both were wrong: it makes 17 calls carrying
 * `@ExcludedSchemaNames`, and seven of them are not positively scoped —
 *
 *   6 at B202607141200:16093-16113  the inlined `R__RefreshMetadata` block, `@ExcludedSchemaNames`
 *                                   = 'sys,staging' and no `@IncludedSchemaNames`
 *   1 at B202607141200:16030        a long exclusion list, but still no `@IncludedSchemaNames`
 *
 * `@ExcludedSchemaNames` alone is not a scope. MJ's own proc bodies gate every WHERE on
 * `(@HasInclude = 0 OR SchemaName IN @IncludedSchemas)` and set `@HasInclude` only when the caller
 * supplies a non-empty include list, so omitting it leaves the reach at everything-but-sys-staging
 * — `dbo`, `${mjSchema}`, and every sibling Open App schema, all of which are installed before this
 * app. One of the seven is `spDeleteUnneededEntityFields`, which DELETEs over that reach. The
 * repo's own pre-existing gate already forbids that proc in a V or B migration
 * (`.github/scripts/check-migration-no-prune.mjs`); run read-only with `--all` it reports four hits
 * here, and it does not fire in CI only because the CI form inspects PR-added lines.
 *
 * This is recorded rather than repaired because the repair is not available: the baseline is
 * Skyway-checksummed and already applied, so editing it breaks every database that has it and
 * changes nothing about what a future host runs. The exemption is still right — it is MORE
 * justified for CHECK 5 than for CHECK 4, since these calls could otherwise fail CI permanently
 * with no fix in reach. What is NOT available is pretending the door has nothing behind it. Track
 * the exposure as an issue against the next baseline, not by moving this constant.
 *
 * Moving this stamp forward to quiet a NEW violation would be the wrong repair in every case.
 */
const GATE_FROM = '202607141201';

/** The same watershed as a number, for {@link landsAfter}. */
const GATE_WATERSHED = Number(GATE_FROM) - 1;

/**
 * A schema name reduced to its IDENTITY, so two spellings of one schema compare equal.
 *
 * Only the PLACEHOLDER is normalized, deliberately, and case is NOT. Case is two separate
 * protections: CodeGen emits both `_BizAppsTasks` and `_bizappstasks` because the host's collation is
 * not knowable from here, and losing one is a real narrowing on a case-sensitive host. Folding case
 * here would make the check accept dropping either.
 */
function schemaIdentity(name) {
    return name.replace(/\$\{mjSchema\}/g, '__mj');
}

/**
 * The procs that this repo's shipped SQL is known to pass `@ExcludedSchemaNames` to.
 *
 * DISCOVERED, not enumerated — with a floor. A hand-written list of proc names goes stale exactly the
 * way a hand-written list of schema names does; in forms the first version missed
 * `spDeleteUnneededEntityFields`, which is the one CodeGen emits LAST, so deleting that call's
 * argument passed the accounting backstop clean.
 */
function schemaSyncProcNames(repoRoot) {
    const names = new Set([
        'spupdateexistingentitiesfromschema',
        'spupdateexistingentityfieldsfromschema',
        'spdeleteunneededentityfields',
        'spsetdefaultcolumnwidthwhereneeded',
        'spupdateschemainfofromdatabase',
    ]);
    for (const { sql } of shippedSqlFiles(repoRoot, SHIPPED_MIGRATION_DIRS)) {
        const masked = maskSql(sql).values;
        for (const call of masked.matchAll(/\[?(sp\w+)\]?\s*@ExcludedSchemaNames/gi)) {
            names.add(call[1].toLowerCase());
        }
    }
    return names;
}

/**
 * How many times `sql` invokes one of `procNames` — with or without an argument.
 *
 * Counting the CALLS rather than the arguments is the point: {@link checkSchemaSyncScope} can only
 * inspect lists it manages to parse, so every way of making one unparseable is a way of passing it
 * silently. Comparing this count against the number parsed turns "not seen" into a violation instead
 * of a pass.
 */
function countSchemaSyncCalls(sql, procNames) {
    let calls = 0;
    // Every real invocation is introduced by a keyword — `EXEC`/`EXECUTE` in T-SQL, a `SELECT` of a
    // quoted function in PostgreSQL — and that keyword is what separates a call from a MENTION. This
    // repo's baseline has `sp_addextendedproperty` descriptions in the hundreds; a pattern anchored on
    // punctuation alone reads a procedure named in one of them as a call.
    for (const call of sql.matchAll(/\bEXEC(?:UTE)?\s+(?:\[[^\]]*\]|[\w$.{}]+)?\s*\.?\s*\[?"?(sp\w+)/gi)) {
        if (procNames.has(call[1].toLowerCase())) {
            calls++;
        }
    }
    for (const call of sql.matchAll(/"(sp\w+)"\s*\(/gi)) {
        if (procNames.has(call[1].toLowerCase())) {
            calls++;
        }
    }
    return calls;
}

/**
 * The version a shipped SQL file sorts under, or `null` if it is not shipped SQL at all.
 *
 * Fails SAFE on anything it cannot order — an unorderable file is the one most likely to land last,
 * so it is gated rather than ignored.
 */
function gatedVersionOf(file) {
    if (!file.endsWith('.sql')) {
        return null;
    }
    const stamp = /^[A-Z](\d{12})__/.exec(file);
    return stamp === null ? '999999999999' : stamp[1];
}

/**
 * The schemas this app owns, as shipped SQL is required to spell them.
 *
 * THREE, and this is the multi-schema adaptation. Forms has one constant here because it has one
 * schema. `morecheese_events` and `morecheese_learning` appear as LITERAL names rather than
 * placeholders because `mj.config.cjs`'s `schemaPlaceholders` maps only `morecheese_members` and
 * `__mj` — there is no placeholder for them to be written as, which is a fact about this app's
 * shape rather than an oversight.
 *
 * Anything else in an `@IncludedSchemaNames` list is a schema this app does not own, which is the
 * thing CHECK 5 exists to refuse — so the positive filter only exempts a call when every name it
 * lists is one of these.
 */
const OWNED_SCHEMAS = new Set(['${flyway:defaultSchema}', 'morecheese_members', 'morecheese_events', 'morecheese_learning']);

/**
 * True when the sync call containing `from` limits itself to schemas this app owns.
 *
 * `@IncludedSchemaNames` is MJ's positive filter: when non-empty the heal is limited to those schemas
 * AND still minus the exclusions. A call that names only our own schemas therefore cannot reach
 * `__mj` or a sibling Open App whatever its exclusion list says — strictly SAFER than a long negative
 * list, and refusing it would push authors back toward the shape that causes the problem.
 *
 * Bounded to the statement, not the line: generated SQL writes the proc name on one line and its
 * arguments on the next. `GO` bounds it too, because an inlined `R__RefreshMetadata` block — which
 * this repo's baseline contains — runs its calls with no terminating semicolon at all.
 */
function scopedToOwnSchema(sql, from) {
    const rest = sql.slice(from);
    const end = Math.min(
        ...[/;/, /\bEXEC(?:UTE)?\b/i, /^[ \t]*GO[ \t]*$/im]
            .map((re) => {
                const m = re.exec(rest);
                return m === null ? Infinity : m.index;
            })
            .filter((i) => i > 0),
    );
    const statement = rest.slice(0, end === Infinity ? rest.length : end);
    const included = /@IncludedSchemaNames\s*=\s*N?'([^']*)'/i.exec(statement);
    if (included === null) return false;
    const names = included[1].split(',').map((n) => n.trim()).filter((n) => n.length > 0);
    return names.length > 0 && names.every((n) => OWNED_SCHEMAS.has(n));
}

function exclusionListsIn(sql, procNames) {
    const found = [];
    for (const named of sql.matchAll(/@ExcludedSchemaNames\s*=\s*'([^']*)'/g)) {
        found.push({ raw: named[1], positivelyScoped: scopedToOwnSchema(sql, named.index) });
    }
    // Positional form, and ONLY for a proc known to take an exclusion list. Unfiltered, this would
    // read the first string argument of any `"spSomething"('…')` as a schema list.
    for (const positional of sql.matchAll(/"(sp\w+)"\s*\(\s*'([^']*)'/gi)) {
        if (procNames.has(positional[1].toLowerCase())) {
            found.push({ raw: positional[2], positivelyScoped: false });
        }
    }
    return found;
}

/**
 * Every `@ExcludedSchemaNames` a migration ships, keyed by its version stamp.
 *
 * Read from the repo rather than maintained, because that is the only way the check can know about a
 * schema nobody thought to add to a constant.
 */
function shippedExclusionLists(repoRoot) {
    const procNames = schemaSyncProcNames(repoRoot);
    const lists = [];
    for (const dir of SHIPPED_MIGRATION_DIRS.map((d) => join(repoRoot, d))) {
        if (!existsSync(dir)) continue;
        for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
            const version = gatedVersionOf(file);
            if (version === null) continue;
            // The VALUES mask. Comments are blanked in BOTH masks, so a commented-out call still
            // excludes nothing here — but `structure` also blanks string-literal BODIES, which is
            // exactly where `@ExcludedSchemaNames='a,b,c'` lives. Reading `.structure` would leave
            // `raw` all spaces, `names` empty, and every gated call reporting the full
            // SCHEMAS_NEVER_SYNCED set as dropped. `.values` is the only correct mask at this site;
            // findIdOnlyGuardedInserts and findUnguardedCoreInserts want `structure` and say so.
            const sql = maskSql(readFileSync(join(dir, file), 'utf-8')).values;
            for (const { raw, positivelyScoped } of exclusionListsIn(sql, procNames)) {
                const names = raw.split(',').map((n) => n.trim()).filter((n) => n.length > 0);
                lists.push({ stamp: version, file: join(dir, file), names, raw, positivelyScoped });
            }
        }
    }
    return lists;
}

/**
 * Everything the repo has ALREADY shipped an exclusion for, before `stamp`.
 *
 * This is what makes the check self-maintaining. Once any migration excludes a schema, no later
 * migration may drop it — so an Open App this repo has never heard of is still protected the moment
 * one CodeGen run happens to name it. That is the failure this gate exists for: the list is
 * regenerated from whatever schemas the DEV BOX held.
 */
function previouslyExcluded(lists, stamp) {
    const seen = new Set();
    for (const list of lists) {
        if (list.stamp < stamp) {
            for (const name of list.names) seen.add(schemaIdentity(name));
        }
    }
    return seen;
}

/**
 * Every schema-sync call in a gated migration must have yielded a parseable exclusion list.
 *
 * Without this the check is only as strong as its regex: an argument that is absent, renamed or bound
 * to a variable simply is not seen, and "not seen" reads identically to "correct".
 */
function checkEverySyncCallWasParsed(repoRoot, lists, violations) {
    const procNames = schemaSyncProcNames(repoRoot);
    for (const dir of SHIPPED_MIGRATION_DIRS.map((d) => join(repoRoot, d))) {
        if (!existsSync(dir)) continue;
        for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
            const version = gatedVersionOf(file);
            if (version === null || version < GATE_FROM) continue;
            const path = join(dir, file);
            const calls = countSchemaSyncCalls(maskSql(readFileSync(path, 'utf-8')).values, procNames);
            const parsed = lists.filter((l) => l.file === path).length;
            if (calls > parsed) {
                violations.push(
                    `${relative(repoRoot, path)} invokes a schema-sync procedure ${calls} time(s) but only ` +
                        `${parsed} carry an @ExcludedSchemaNames this gate can read. An unreadable list is not a safe ` +
                        'one: a sync with no exclusions sweeps dbo, staging and every one of the nine sibling Open ' +
                        'Apps this manifest depends on. Write the list as a literal on the call.',
                );
            }
        }
    }
}

function checkSchemaSyncScope(repoRoot, violations) {
    const lists = shippedExclusionLists(repoRoot);
    checkEverySyncCallWasParsed(repoRoot, lists, violations);
    for (const list of lists) {
        if (list.stamp < GATE_FROM) continue;
        // Still counted by checkEverySyncCallWasParsed — it IS a readable list — but its breadth is
        // moot: the positive filter already confines the call to schemas we own.
        if (list.positivelyScoped) continue;
        const required = new Set([
            ...SCHEMAS_NEVER_SYNCED.map(schemaIdentity),
            ...previouslyExcluded(lists, list.stamp),
        ]);
        const listed = new Set(list.names.map(schemaIdentity));
        const missing = [...required].filter((n) => !listed.has(n));
        if (missing.length > 0) {
            violations.push(
                `${relative(repoRoot, list.file)} ships an @ExcludedSchemaNames that drops ` +
                    `${missing.join(', ')}. CodeGen writes this list from whatever schemas the DEV database ` +
                    'happened to hold, so it must be normalized before the output is shipped — and it may never be ' +
                    "NARROWER than one the repo already shipped: a sync reaching a sibling Open App's schema " +
                    "rewrites its entity metadata on every host, and one reaching dbo/staging registers the host's " +
                    'own tables as entities. Copy the list from the previous migration and add anything new.',
            );
        }
    }
}

// ---------------------------------------------------------------------------
// CHECK 4 — a core-metadata INSERT is never guarded on its own ID alone
// ---------------------------------------------------------------------------

/**
 * The `__mj` tables a migration may write metadata rows into, and where the guard shape matters.
 *
 * The failure differs across them, and BOTH halves belong on this list. `EntityFieldValue`,
 * `EntityRelationship`, `EntitySetting` and `EntityPermission` carry no unique constraint on their
 * natural key, so an ID-only guard duplicates SILENTLY — and a duplicated `EntityRelationship` makes
 * CodeGen emit one `@FieldResolver` per row, so the server package stops compiling on whichever
 * branch happens to regenerate next, nowhere near the migration that caused it. `Entity`,
 * `EntityField` and `ApplicationEntity` DO carry one, so the same mistake there fails LOUDLY and
 * takes the install down instead.
 *
 * Do not "optimise" the constrained three off this list on the grounds that the database catches
 * them. A migration that cannot apply is not a lesser defect than one that applies wrongly — it is
 * the same authoring error, and the fix is identical: guard on the natural key.
 */
const CORE_METADATA_TABLES = new Set(
    ['entity', 'entityfield', 'entityfieldvalue', 'entityrelationship', 'entitypermission', 'applicationentity', 'entitysetting'],
);

/** The `[` … `]`-optional core-table INSERT, on either spelling of the core schema. */
const CORE_INSERT = /\bINSERT\s+INTO\s+(?:\[\$\{mjSchema\}\]|\[?__mj\]?)\s*\.\s*\[?(\w+)\]?/gi;

/** A predicate that tests the row's own id and nothing else — the defect this check names. */
const ID_ONLY_PREDICATE = /^\s*\[?ID\]?\s*=\s*(?:N?'[^']*'|@\w+)\s*$/i;

/** Everything after the subquery's top-level `WHERE`, or null when it has none. */
function whereClauseOf(subquery) {
    const where = /\bWHERE\b/iy;
    let depth = 0;
    for (let i = 0; i < subquery.length; i++) {
        const char = subquery[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (depth === 0) {
            where.lastIndex = i;
            if (where.test(subquery)) return subquery.slice(where.lastIndex);
        }
    }
    return null;
}

/**
 * The statement an `IF` guard governs: `[from, to)` of its `BEGIN … END` block, or of the single
 * statement that follows.
 *
 * ⚠️ THE SCAN STOPS AT THE FIRST STATEMENT OF ANY KIND, not at the first statement we care about.
 * `STATEMENT_START` therefore lists `PRINT`, `SET`, `SELECT` and friends alongside the DML: a guard
 * whose body is `PRINT 'x'` governs that PRINT and nothing else, and returning an EMPTY region for it
 * is the correct answer. Matching only DML scans straight past the PRINT to whatever `INSERT` comes
 * next, attributing an unrelated, possibly well-guarded insert to this guard.
 */
const STATEMENT_START = /\b(BEGIN|INSERT|UPDATE|DELETE|EXEC|EXECUTE|SELECT|SET|PRINT|THROW|DECLARE|RAISERROR|WAITFOR|MERGE|TRUNCATE|IF|WHILE|RETURN|GOTO)\b/iy;
const GOVERNED_DML = new Set(['INSERT', 'UPDATE', 'DELETE', 'EXEC', 'EXECUTE']);

function governedStatement(text, from) {
    let depth = 0;
    for (let i = from; i < text.length; i++) {
        const char = text[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (depth === 0) {
            STATEMENT_START.lastIndex = i;
            const match = STATEMENT_START.exec(text);
            if (match === null || match.index !== i) continue;
            const keyword = match[1].toUpperCase();
            if (keyword === 'BEGIN') return [i, matchingEnd(text, i)];
            if (!GOVERNED_DML.has(keyword)) return [i, i];
            const semicolon = text.indexOf(';', i);
            return [i, semicolon === -1 ? text.length : semicolon];
        }
    }
    return [from, from];
}

/**
 * The `[start, end)` ranges an `IF NOT EXISTS (…)` governs, on an already-masked text.
 *
 * One definition of "guarded", used by CHECK 4 (which asks whether anything was asked at all) and by
 * {@link findSeededEntityIds} (which asks whether a seed is CONDITIONAL). Those two questions have to
 * share an answer: a range CHECK 4 calls guarded is exactly a range whose INSERT may not run, and an
 * INSERT that may not run cannot license a literal reference elsewhere.
 */
function guardedRanges(masked) {
    const ranges = [];
    for (const guard of masked.matchAll(/\bIF\s+NOT\s+EXISTS\s*\(/gi)) {
        const open = guard.index + guard[0].length - 1;
        const close = matchingParen(masked, open);
        if (close === -1) continue;
        ranges.push(governedStatement(masked, close + 1));
    }
    return ranges;
}

/**
 * Core-metadata tables inserted under an `IF NOT EXISTS` whose predicate tests only `[ID]`.
 *
 * An ID-only guard asks whether THIS ROW was inserted before. What makes an insert safe is whether
 * the THING IT DESCRIBES already exists, under whatever id the host minted for it — and on any
 * machine that ran `mj codegen` before the migration, that id is not ours.
 *
 * Read off the STRUCTURE mask: string bodies are blanked, so a guid inside a literal still reads as
 * `'        '` and matches the shape without the value mattering, while a `--` comment describing a
 * guard can never be mistaken for one.
 */
export function findIdOnlyGuardedInserts(sql) {
    const { structure } = maskSql(sql);
    const found = [];
    for (const guard of structure.matchAll(/\bIF\s+NOT\s+EXISTS\s*\(/gi)) {
        const open = guard.index + guard[0].length - 1;
        const close = matchingParen(structure, open);
        if (close === -1) continue;
        const predicate = whereClauseOf(structure.slice(open + 1, close));
        if (predicate === null || !ID_ONLY_PREDICATE.test(predicate)) continue;
        const [from, to] = governedStatement(structure, close + 1);
        for (const insert of structure.slice(from, to).matchAll(CORE_INSERT)) {
            if (CORE_METADATA_TABLES.has(insert[1].toLowerCase())) {
                found.push({ table: insert[1], line: structure.slice(0, guard.index).split('\n').length });
            }
        }
    }
    return found;
}

/**
 * Core-metadata INSERTs that carry no `IF NOT EXISTS` guard at all.
 *
 * {@link findIdOnlyGuardedInserts} walks outward from each guard, which means an insert with NO guard
 * is not merely allowed — it is invisible. That is the wrong way round: an unguarded insert is
 * strictly weaker than the ID-only guard CHECK 4 rejects, since it cannot even claim to have asked.
 *
 * "Guarded" is read structurally rather than semantically: an insert counts as guarded when an
 * `IF`/`IF NOT EXISTS` governs it, or when it is inside a `BEGIN…END` that one does. Judging the
 * predicate is the other half's job; this only asks whether anything was asked at all.
 */
export function findUnguardedCoreInserts(sql) {
    const masked = maskSql(sql).structure;
    const guarded = guardedRanges(masked);
    const found = [];
    for (const insert of masked.matchAll(CORE_INSERT)) {
        if (!CORE_METADATA_TABLES.has(insert[1].toLowerCase())) continue;
        if (guarded.some(([from, to]) => insert.index >= from && insert.index < to)) continue;
        found.push({ table: insert[1], line: masked.slice(0, insert.index).split('\n').length });
    }
    return found;
}

/** A migration's position relative to `watershed`, read from the `V<YYYYMMDDHHMM>` in its name. */
function landsAfter(file, watershed) {
    const stamp = file.match(/^[VB](\d{12})__/);
    return stamp === null || Number(stamp[1]) > watershed;
}

function checkIdOnlyGuards(repoRoot, violations) {
    for (const dirName of SHIPPED_MIGRATION_DIRS) {
        const dir = join(repoRoot, dirName);
        if (!existsSync(dir)) continue;
        const files = readdirSync(dir)
            .filter((f) => f.endsWith('.sql') && landsAfter(f, GATE_WATERSHED))
            .sort();
        for (const file of files) {
            const rel = relative(repoRoot, join(dir, file));
            const sql = readFileSync(join(dir, file), 'utf-8');
            for (const { table, line } of findUnguardedCoreInserts(sql)) {
                violations.push(
                    `${rel}:${line} INSERTs into \`${table}\` with no \`IF NOT EXISTS\` guard at all. That is ` +
                        'weaker than the ID-only guard this check rejects below — it cannot even claim to have asked ' +
                        'whether the thing already exists. CodeGen emits these bare, naming ids that exist only on the ' +
                        'database it ran against, so on a host that ran `mj codegen` first the foreign key fails and ' +
                        '`mj app install` stops mid-migration. Guard on the natural key: resolve the parent through its ' +
                        'own name and test what the row IS.',
                );
            }
            for (const { table, line } of findIdOnlyGuardedInserts(sql)) {
                violations.push(
                    `${rel}:${line} guards an INSERT into \`${table}\` on \`[ID] = '<guid>'\` alone. That asks whether ` +
                        'THIS ROW was inserted before; what makes an insert safe is whether the THING IT DESCRIBES ' +
                        'already exists, under whatever id the host minted for it. Any developer who ran `mj codegen` ' +
                        'before this migration has that row under a different id, so the guard misses and the insert ' +
                        'lands a second copy — silently, because four of these tables have no unique constraint on ' +
                        'their natural key. Guard on the natural key instead: ' +
                        "`WHERE ID = '<guid>' OR (EntityID = … AND Name = …)` is the shape this repo's baseline " +
                        'already uses for its 166 EntityField inserts. A companion `AND EXISTS (…)` outside the NOT ' +
                        'EXISTS does not count: it tests a different row.',
                );
            }
        }
    }
}

// ---------------------------------------------------------------------------
// CHECK 6 — an extended-property value is never a MAX-typed variable
// ---------------------------------------------------------------------------

/**
 * CHECK 6 — A MIGRATION THAT CANNOT EXECUTE NEVER SHIPS.
 *
 * `sp_addextendedproperty` and `sp_updateextendedproperty` declare `@value` as `sql_variant`, and
 * `sql_variant` cannot hold ANY of the MAX types. Hand one an `NVARCHAR(MAX)` variable and the batch
 * dies with `Operand type clash: nvarchar(max) is incompatible with sql_variant` — which fails the
 * migration, and with it the whole run, on someone else's database.
 *
 * This repo is the most exposed of any sibling to that reflex: `B202607141200` makes over three
 * hundred extended-property writes, every one of them a long English description, and they escape
 * today only by accident — they pass string LITERALS, which SQL Server types as `nvarchar(n)`. The
 * moment one routes the text through a variable, which is a good idea since a description written
 * once cannot drift between its three writes, the declared type starts mattering.
 *
 * `4000` is the ceiling `sql_variant` allows for `nvarchar` (an extended property is capped at 7500
 * bytes regardless), so a bounded declaration is both correct and sufficient.
 */
const EXTENDED_PROPERTY_PROCS = /\b(?:sp_addextendedproperty|sp_updateextendedproperty)\b/gi;

/**
 * Every type `sql_variant` cannot hold, as a variable declaration.
 *
 * The `\b` sits INSIDE the XML alternative on purpose. Trailing it after the whole group puts it
 * straight after a literal `)`, and `)` followed by a space is two non-word characters — never a word
 * boundary — so every parenthesised type silently fails to match while `XML` still does.
 */
const MAX_TYPED_DECLARATION = /(@[A-Za-z0-9_]+)\s+(?:AS\s+)?((?:N?VARCHAR|VARBINARY)\s*\(\s*MAX\s*\)|XML\b)/gi;

/**
 * A DECLARE statement's body — the only place a MAX-typed VARIABLE can be introduced. Scoping the
 * per-variable scan to these is what stops a stored-procedure PARAMETER (`CREATE PROCEDURE … @Value
 * NVARCHAR(MAX)`) being collected and then matched against a call's `@value` argument, which would
 * flag every extended-property write in the file. This repo's baseline declares sixty CRUD
 * procedures beside its extended-property writes, so that scoping is load-bearing here.
 */
const DECLARE_STATEMENT = /\bDECLARE\b([\s\S]*?)(?=;|\n\s*\n|^\s*GO\s*$|$(?![\s\S]))/gim;

/**
 * The MAX-typed variables handed to an extended-property procedure in `sql`.
 *
 * Two passes: collect every MAX-typed declaration, then read each extended-property CALL'S OWN
 * ARGUMENT LIST and report any of those variables appearing in it. Reading the call's arguments —
 * rather than finding `@value = @x` and walking back to the nearest preceding `EXEC` — is what makes
 * this sound: a named argument whose VALUE contains the letters `EXEC` captures the walk-back and
 * hides the call completely.
 */
export function findMaxTypedExtendedPropertyValues(sql) {
    const maxTyped = new Map();
    for (const decl of sql.matchAll(DECLARE_STATEMENT)) {
        for (const m of decl[1].matchAll(MAX_TYPED_DECLARATION)) {
            maxTyped.set(m[1].toLowerCase(), m[2].toUpperCase().replace(/\s+/g, ''));
        }
    }
    if (maxTyped.size === 0) {
        return [];
    }
    const hits = [];
    for (const call of sql.matchAll(EXTENDED_PROPERTY_PROCS)) {
        const from = call.index + call[0].length;
        const terminator = sql.slice(from).search(/;|\n\s*\n|^\s*GO\s*$/m);
        const args = sql.slice(from, terminator < 0 ? sql.length : from + terminator);
        for (const ref of args.matchAll(/@[A-Za-z0-9_]+/g)) {
            const declaredType = maxTyped.get(ref[0].toLowerCase());
            if (!declaredType) continue;
            hits.push({
                variable: ref[0],
                declaredType,
                line: sql.slice(0, from + ref.index).split('\n').length,
            });
        }
    }
    return hits;
}

function checkExtendedPropertyValueTypes(repoRoot, violations) {
    for (const dirName of [...SHIPPED_MIGRATION_DIRS, 'migrations-teardown']) {
        const dir = join(repoRoot, dirName);
        if (!existsSync(dir)) continue;
        for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
            const rel = relative(repoRoot, join(dir, file));
            const sql = readFileSync(join(dir, file), 'utf-8');
            for (const { variable, declaredType, line } of findMaxTypedExtendedPropertyValues(sql)) {
                violations.push(
                    `${rel}:${line} passes \`${variable}\`, declared \`${declaredType}\`, as \`@value\` to an ` +
                        'extended-property procedure. That parameter is `sql_variant`, which cannot hold a MAX type or ' +
                        'XML: SQL Server rejects the batch with `Operand type clash: nvarchar(max) is incompatible with ' +
                        'sql_variant`, so this migration does not merely misbehave — it does not run, and it fails the ' +
                        'whole migration run on whichever database applies it first. Declare it `NVARCHAR(4000)`.',
                );
            }
        }
    }
}

// ---------------------------------------------------------------------------
// CHECK 7 — an entity id shipped SQL REFERENCES is one shipped SQL SEEDS
// ---------------------------------------------------------------------------

/**
 * CHECK 7 — NO SHIPPED SQL POINTS AT AN `__mj.Entity` ROW NOTHING SHIPPED CREATES.
 *
 * CodeGen introspects the developer's database and writes the ids it finds there into the SQL it
 * emits. Hardcoding is correct MJ practice — a fixed id is what makes a fresh install deterministic —
 * but only for an entity whose id THIS REPO SEEDS. Where it does not, the literal is a fact about one
 * laptop, and the chain dies at that file with
 * `The INSERT statement conflicted with the FOREIGN KEY constraint "FK_EntityField_Entity"` — total
 * rather than silent: nothing after it can run.
 *
 * WHAT THE CORRECT SHAPE LOOKS LIKE: resolve the entity by natural key into a variable and THROW when
 * the lookup comes back NULL. Whichever id a host minted, the lookup finds it.
 *
 * THE ASYMMETRY THAT SETS THIS CHECK'S SHAPE. A seed this parser fails to read makes every reference
 * to that id fire — loud, and easy to trace. A reference it fails to read is invisible. So the seed
 * side is written narrowly and the reference side is written from the corpus.
 *
 * THREE HOLES, carried over from forms and restated because they are as true here:
 *   HOLE 1 — a positional `[EntityID]` in a column-list INSERT with no `-- Entity:` annotation is not
 *     read. This repo's baseline ships 36 `EntityPermission` and 166 `EntityField` inserts in exactly
 *     that shape, whose `RoleID` values are MJ CORE roles this repo legitimately does not seed;
 *     reading the shape would fire on correct SQL and the only way to quiet it would be a
 *     hand-maintained allow-list of foreign ids. CHECK 4 covers those same inserts from the other
 *     side (guard on the natural key).
 *   HOLE 2 — a conditionally guarded seed is NOT credited (see {@link findSeededEntityIds}); that is
 *     the correct direction, and it means a guarded seed's literal licenses nothing.
 *   HOLE 3 — only `(Related)?EntityID` columns are in scope. A host-local `EntityFieldID` literal is
 *     invisible, and `EntityFieldValue.EntityFieldID` is a real foreign key that fails the same way.
 */

/** The core schema, in every spelling shipped SQL uses for it — both dialects, both quotings. */
const CORE_SCHEMA_PATTERN = '(?:\\[\\$\\{mjSchema\\}\\]|"\\$\\{mjSchema\\}"|\\[__mj\\]|"__mj"|__mj)';

/**
 * `INSERT INTO <core>.[Entity] (` — the only statement that can make an entity id exist.
 *
 * The table name is spelled out in each dialect's quoting and nothing else, so `[EntityField]` and
 * `[EntityRelationship]` — which carry an `[ID]` column of their own, in the same first position —
 * cannot be read as seeds. That direction matters more than the other: a seed this check invents is
 * an id it then stops asking about, and stopping asking is how the defect ships.
 */
const ENTITY_SEED_INSERT = new RegExp(
    `\\bINSERT\\s+INTO\\s+${CORE_SCHEMA_PATTERN}\\s*\\.\\s*(?:\\[Entity\\]|"Entity"|Entity)\\s*\\(`,
    'gi',
);

/**
 * `[start, end)` of the first `VALUES ( … )` row, when it follows the column list IMMEDIATELY.
 *
 * "Immediately" is the whole guard. Searching forward for the next `VALUES` would, on an
 * `INSERT … SELECT`, walk past the end of its own statement and read the NEXT insert's row against
 * THIS insert's column list — pairing an id column with someone else's value. Returning null for a
 * shape this parser does not model costs a seed, and a missing seed fails loud; a mispaired one would
 * quietly add a bogus id to the allowed set.
 */
function valuesRowOf(structure, after) {
    const keyword = /\bVALUES\s*\(/gi;
    keyword.lastIndex = after;
    const match = keyword.exec(structure);
    if (match === null || structure.slice(after, match.index).trim() !== '') return null;
    const open = match.index + match[0].length - 1;
    const close = matchingParen(structure, open);
    return close === -1 ? null : [open + 1, close];
}

/**
 * Every entity id an `INSERT INTO <core>.[Entity]` in `sql` creates.
 *
 * Read across BOTH masks: the statement's SHAPE comes off `structure`, where string bodies are
 * blanked, so a description that happens to contain the text of an INSERT cannot invent a seed; the
 * id itself is sliced from `values` at the same offsets, because the whole point is to read what the
 * literal says.
 *
 * The column position of `[ID]` is looked up rather than assumed to be first. CodeGen puts it first
 * today; a check that reads position 0 blindly would silently start seeding whatever column moved
 * into that slot, and a wrong id in the seeded set is the direction that goes quiet.
 */
export function findSeededEntityIds(sql) {
    const { structure, values } = maskSql(sql);
    const seeded = new Set();
    // A seed inside an `IF NOT EXISTS` licenses NOTHING, because it does not run everywhere: its
    // literal exists only on hosts that had no such entity when they ran it, and a host that ran
    // CodeGen first kept its own id and skipped the block. Same `guardedRanges` CHECK 4 uses, so the
    // two checks cannot drift into disagreeing about what "guarded" means.
    const conditional = guardedRanges(structure);
    for (const insert of structure.matchAll(ENTITY_SEED_INSERT)) {
        if (conditional.some(([from, to]) => insert.index >= from && insert.index < to)) continue;
        const columnsOpen = insert.index + insert[0].length - 1;
        const columnsClose = matchingParen(structure, columnsOpen);
        if (columnsClose === -1) continue;
        const idColumn = topLevelItemRanges(structure, columnsOpen + 1, columnsClose)
            .findIndex(([from, to]) => bareColumnName(structure.slice(from, to)) === 'id');
        if (idColumn === -1) continue;
        const row = valuesRowOf(structure, columnsClose + 1);
        if (row === null) continue;
        const items = topLevelItemRanges(structure, row[0], row[1]);
        if (idColumn >= items.length) continue;
        const id = literalUuid(values.slice(items[idColumn][0], items[idColumn][1]).trim());
        if (id !== null) seeded.add(id);
    }
    return seeded;
}

/**
 * CodeGen's annotation on a positional entity id: `'<guid>', -- Entity: MoreCheese: Events`.
 *
 * Matched on the RAW source and anchored to the end of a literal the `values` mask already proved is
 * CODE: the guid lives in the statement and the label that identifies it as an entity reference lives
 * in a COMMENT, and no single mask holds both. Two constraints keep that from becoming the
 * comment-scanning gate this file warns against everywhere else — the literal must survive on
 * `values`, so a guid discussed in prose is invisible; and the annotation must be on the SAME LINE,
 * because CodeGen's file banners open with `-- Entity: …` on a line of their own.
 */
const ENTITY_VALUE_ANNOTATION = /^[ \t]*,?[ \t]*--[ \t]*(?:Related)?Entity:/i;

/** A bare UUID, for the tokens of a comma-separated `@EntityIDs` list. */
const BARE_UUID = new RegExp(`^${UUID_PATTERN}$`, 'i');

/** The two core-metadata columns CodeGen writes an `__mj.Entity` id into. Both point at that table. */
const ENTITY_ID_COLUMNS = '(?:Related)?EntityID';

/**
 * "Not the tail of a longer identifier, and not a variable."
 *
 * Without the first half, `TargetEntityID = '<guid>'` reads as one of the two columns above, widening
 * the check past the scope its comment claims. Without the second, `@EntityID = '<guid>'` is read
 * twice: once here as a column and once by {@link GENERATED_ENTITY_ID_VARIABLE}, which is what it is.
 */
const NOT_PART_OF_A_LONGER_NAME = '(?<![\\w@])';

/** `EntityID = '<guid>'`, bracketed, double-quoted or bare, as both dialects spell it. */
const ENTITY_ID_COLUMN_REFERENCE = new RegExp(
    `${NOT_PART_OF_A_LONGER_NAME}(?:\\[|")?${ENTITY_ID_COLUMNS}(?:\\]|")?\\s*=\\s*N?'(${UUID_PATTERN})'`,
    'gi',
);

/** Any quoted UUID. {@link ENTITY_VALUE_ANNOTATION} decides which of them is an entity reference. */
const QUOTED_UUID = new RegExp(`N?'(${UUID_PATTERN})'`, 'gi');

/**
 * `@EntityIDs='<guid>[,<guid>…]'` — how CodeGen scopes the two heal procedures.
 *
 * The argument where a wrong id does the MOST damage rather than the least:
 * `spDeleteUnneededEntityFields` reads a NULL or empty `@EntityIDs` as "unscoped" and sweeps every
 * entity its exclusion list does not name.
 */
const ENTITY_IDS_ARGUMENT = /@EntityIDs\s*=\s*N?'([^']*)'/gi;

/**
 * `SET @EntityID_<hash> = '<guid>'` — how a generated metadata seed carries one.
 *
 * `mj sync push` suffixes every variable with a per-record hash, so the suffix is optional rather
 * than absent. This is the seed-side arrival of the same defect: a seed REGENERATED on a developer's
 * box carries whatever ids that box minted — which is precisely what the several
 * `Metadata_Sync_PartNofM` files about to land here will be.
 */
const GENERATED_ENTITY_ID_VARIABLE = new RegExp(
    `(?<!\\w)@${ENTITY_ID_COLUMNS}(?:_\\w+)?\\s*=\\s*N?'(${UUID_PATTERN})'`,
    'gi',
);

/**
 * How shipped SQL names an `__mj.Entity` row by literal id.
 *
 * What is deliberately NOT here: `EntityID = @Variable` and
 * `EntityID = (SELECT TOP 1 [ID] FROM [${mjSchema}].[Entity] WHERE …)`. Those are the CORRECT shape —
 * they resolve on the host — so they must not match, and they cannot: neither is a quoted UUID.
 */
const ENTITY_REFERENCE_SHAPES = [
    {
        shape: 'an [EntityID] / [RelatedEntityID] column compared to a literal',
        pattern: ENTITY_ID_COLUMN_REFERENCE,
        read: (match) => [match[1]],
    },
    {
        shape: "CodeGen's `-- Entity:` annotation on a positional value",
        pattern: QUOTED_UUID,
        read: (match) => [match[1]],
        confirm: (raw, match) => ENTITY_VALUE_ANNOTATION.test(raw.slice(match.index + match[0].length)),
    },
    {
        shape: 'the @EntityIDs argument that scopes a schema-sync call',
        pattern: ENTITY_IDS_ARGUMENT,
        read: (match) => match[1].split(',').map((token) => token.trim()).filter((token) => BARE_UUID.test(token)),
    },
    {
        shape: 'a generated @EntityID variable in a metadata seed',
        pattern: GENERATED_ENTITY_ID_VARIABLE,
        read: (match) => [match[1]],
    },
];

/**
 * Every entity id `sql` references by literal, with the line and the shape it was written in.
 *
 * Read off the `values` mask: comments are blanked there, so prose about an id cannot be mistaken for
 * a reference. String BODIES survive, which is the deliberate cost: an id quoted inside a description
 * would read as a reference. That is a false positive in the loud direction, and this file prefers
 * loud.
 */
export function findEntityIdReferences(sql) {
    const { values } = maskSql(sql);
    const found = [];
    for (const { shape, pattern, read, confirm } of ENTITY_REFERENCE_SHAPES) {
        for (const match of values.matchAll(pattern)) {
            if (confirm !== undefined && !confirm(sql, match)) continue;
            const line = values.slice(0, match.index).split('\n').length;
            for (const id of read(match)) found.push({ id: id.toUpperCase(), line, shape });
        }
    }
    return found;
}

/**
 * Where the seeds come from, and where the references are read — deliberately not the same list.
 *
 * A teardown script only ever DELETEs an `[Entity]` row, so it can never be what makes an id exist and
 * must not contribute to the seeded set. It is read for references all the same: a hardcoded entity
 * id in a teardown deletes nothing on a host that minted its own, which is the same defect wearing
 * different clothes — and this repo's teardown is generated, so it is exactly the file most likely to
 * carry one.
 */
const ENTITY_SEED_DIRS = SHIPPED_MIGRATION_DIRS;
const ENTITY_REFERENCE_DIRS = [...SHIPPED_MIGRATION_DIRS, 'migrations-teardown'];

function checkEntityIdReferences(repoRoot, violations) {
    const seeded = new Set();
    for (const { sql } of shippedSqlFiles(repoRoot, ENTITY_SEED_DIRS)) {
        for (const id of findSeededEntityIds(sql)) seeded.add(id);
    }
    for (const { path, sql } of shippedSqlFiles(repoRoot, ENTITY_REFERENCE_DIRS)) {
        // One violation per id per file, listing every line: the same wrong literal is written many
        // times in one generated file, and identical messages train people to skim.
        const unseeded = new Map();
        for (const { id, line } of findEntityIdReferences(sql)) {
            if (seeded.has(id)) continue;
            if (!unseeded.has(id)) unseeded.set(id, new Set());
            unseeded.get(id).add(line);
        }
        for (const [id, lines] of unseeded) {
            violations.push(
                `${relative(repoRoot, path)}:${[...lines].sort((a, b) => a - b).join(',')} references \`__mj.Entity\` ` +
                    `id ${id}, which no shipped migration seeds. CodeGen bakes in the id the DEVELOPER'S database ` +
                    'happened to hold; on every other host there is no such row, the foreign key to [__mj].[Entity] ' +
                    'fails, and `mj app install` stops at this file — taking every migration after it down with it. ' +
                    'Resolve the entity by natural key instead: `DECLARE @X UNIQUEIDENTIFIER = (SELECT TOP 1 [ID] ' +
                    "FROM [${mjSchema}].[Entity] WHERE [BaseTable] = '<Table>' AND [SchemaName] = " +
                    "'${flyway:defaultSchema}');` with a THROW when it comes back NULL. If the id genuinely belongs " +
                    'to an entity this repo does not own — MJ core, or one of the nine sibling Open Apps — it still ' +
                    'may not be a literal, because that host minted its own too: look it up by name the same way.',
            );
        }
    }
}

// ---------------------------------------------------------------------------
// Entry point. Skipped when imported (by the spec).
// ---------------------------------------------------------------------------

/** Runs every check against a repo root and returns the violations found. */
export function runChecks(repoRoot = REPO_ROOT) {
    const violations = [];
    checkPlaceholders(repoRoot, violations);
    checkIdOnlyGuards(repoRoot, violations);
    checkSchemaSyncScope(repoRoot, violations);
    checkExtendedPropertyValueTypes(repoRoot, violations);
    checkEntityIdReferences(repoRoot, violations);
    return violations;
}

if (process.argv[1] && process.argv[1].endsWith('check-distribution-seed.mjs')) {
    const violations = runChecks();

    if (violations.length > 0) {
        console.error("\n❌ Distribution gate failed — this app would not install correctly on someone else's database:\n");
        for (const v of violations) console.error(`  • ${v}`);
        console.error('');
        process.exit(1);
    }
    const files = shippedSqlFiles(REPO_ROOT, ENTITY_REFERENCE_DIRS).length;
    console.log(
        `✅ Distribution gate passed over ${files} shipped SQL file(s) — only install-supplied placeholders; ` +
            'no new core-metadata insert unguarded or guarded on its own ID alone; no shipped schema sync reaches a ' +
            'schema this app does not own; no extended-property write hands `sql_variant` a MAX-typed value; and ' +
            'every `__mj.Entity` id shipped SQL references is one shipped SQL also seeds.',
    );
}
