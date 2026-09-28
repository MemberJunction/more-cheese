/**
 * Structural check for the generated teardown.
 *
 * There is no database here, and there will not be one in CI, so this cannot prove the teardown
 * WORKS. What it can do — and what the caliber history says is worth doing — is refuse the specific
 * shapes that make a teardown fail on a host while looking perfect in a diff. Each case below names
 * the failure it exists for.
 *
 * Two halves:
 *   • the GENERATOR, against fixtures, so the derivation rules are pinned;
 *   • the CHECKED-IN ARTIFACT, so a hand-edit or a stale regeneration is caught. The generated file
 *     is compared byte-for-byte against a fresh run, which is what makes "DO NOT HAND-EDIT" true
 *     rather than a request.
 *
 * ⚠️ What this does NOT establish: that the SQL runs, that the FK engine converges on real data, or
 * that the drop order is right on a database with inbound references nobody here has seen. That
 * needs a USED database — not a pristine canary, which is the blind spot the caliber rewrite exists
 * to remove. See migrations-teardown/README.md.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { generateTeardown, readConfigSeed, readBaselineCoreRows, UNDROPPED_SCHEMAS } from './generate-teardown.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..');
const TEARDOWN = path.join(REPO_ROOT, 'migrations-teardown', 'V001__Retire_MoreCheese_Core_Rows.sql');

const sql = () => readFileSync(TEARDOWN, 'utf8');

/** Comment bodies blanked, so a rule about CODE cannot fire on prose about it. */
function codeOnly(text) {
    return text
        .split('\n')
        .map((line) => {
            const i = line.indexOf('--');
            return i === -1 ? line : line.slice(0, i);
        })
        .join('\n');
}

// ── The artifact exists and is current ──────────────────────────────────────────────────────────

test('the teardown is checked in', () => {
    assert.ok(existsSync(TEARDOWN), `${TEARDOWN} is missing — run \`npm run generate:teardown\`.`);
});

/**
 * The "GENERATED — DO NOT HAND-EDIT" banner is a claim, and this is what makes it one.
 *
 * It also catches the likelier case: `config/` gains a record, or the baseline gains an entity, and
 * nobody re-runs the generator. The teardown then silently strands whatever was added — a permanent
 * orphan on every host's uninstall, which is the failure caliber's generator was built to make
 * impossible.
 */
test('the checked-in teardown matches a fresh generation exactly', () => {
    const configRows = readConfigSeed(REPO_ROOT);
    const { baseline, entities, applicationId } = readBaselineCoreRows(REPO_ROOT);
    const fresh = generateTeardown({ configRows, baseline, entities, applicationId });
    assert.equal(
        sql(),
        fresh,
        'the checked-in teardown is stale or hand-edited — run `npm run generate:teardown` and commit the result.',
    );
});

// ── The runtime contract MJ imposes ─────────────────────────────────────────────────────────────

/**
 * MJ executes a teardown file as ONE statement inside ONE transaction. There is no batch splitter,
 * so a `GO` is not a separator here — it is a syntax error that rolls the whole teardown back, after
 * MJ has already dropped the app schema.
 */
test('no GO batch separator', () => {
    assert.equal(/^[ \t]*GO[ \t]*$/im.test(codeOnly(sql())), false);
});

/**
 * Exactly one placeholder is substituted in a teardown: `${mjSchema}`. `${flyway:defaultSchema}` is
 * NOT — Skyway is not involved — so it would ship as the literal seven-character string
 * `${flyway` … into a schema name, and Skyway's own habit of leaving unknown placeholders untouched
 * is what makes that silent rather than loud.
 */
test('the only placeholder used is ${mjSchema}', () => {
    const used = new Set([...codeOnly(sql()).matchAll(/\$\{([^}]+)\}/g)].map((m) => m[1]));
    assert.deepEqual([...used], ['mjSchema']);
});

test('the app schemas MJ does not drop appear as literals, never as placeholders', () => {
    for (const schema of UNDROPPED_SCHEMAS) {
        assert.match(codeOnly(sql()), new RegExp(`'${schema}'`), `${schema} must appear as a literal`);
    }
});

/**
 * THE BUG THIS FILE WAS WRITTEN AFTER FINDING. An annotated VALUES row was emitted as
 * `('…', '…', 0)  -- MoreCheese: Events in morecheese_events` and the tuple separator was then joined
 * on AFTER the comment — so the comma ended up inside it. `--` runs to end of line, so the comma
 * separating one row from the next was commented out, SQL Server saw `(…) (…)`, and the statement did
 * not parse. In a diff it looks entirely correct.
 *
 * Nothing else here would have caught it, so it is asserted on the property itself: no line inside a
 * `VALUES` list may carry code after a comment.
 */
test('no VALUES row hides its separator inside a comment', () => {
    const offenders = [];
    let inValues = false;
    for (const [i, line] of sql().split('\n').entries()) {
        if (/\bVALUES\b/i.test(line)) inValues = true;
        else if (inValues && /;\s*$/.test(codeOnly(line))) inValues = false;
        if (!inValues) continue;
        const comment = line.indexOf('--');
        // Only a line with CODE BEFORE the comment can hide a separator. A line that is entirely a
        // comment cannot — and the labels this generator emits sit on their own lines and legitimately
        // end in `)`, as in "in morecheese_members (declared)". Flagging those was this assertion's
        // own first bug, caught the moment it ran.
        const hasCodeBefore = comment !== -1 && line.slice(0, comment).trim() !== '';
        if (hasCodeBefore && /[,)]\s*$/.test(line.slice(comment))) {
            offenders.push(`${i + 1}: ${line.trim()}`);
        }
    }
    assert.deepEqual(offenders, [], `a separator is commented out on:\n${offenders.join('\n')}`);
});

/**
 * T-SQL caps a `VALUES` table constructor at 1000 rows. `config/` declares 410 today, so this is one
 * statement — the assertion exists so that growing past the cap is caught here rather than on the
 * first host that runs the teardown after the config tree grows.
 */
test('no VALUES statement exceeds the 1000-row table-constructor cap', () => {
    for (const block of codeOnly(sql()).split(/;\s*\n/)) {
        if (!/\bVALUES\b/i.test(block)) continue;
        const rows = (block.match(/^\s*\(/gm) ?? []).length;
        assert.ok(rows <= 1000, `a VALUES statement carries ${rows} rows, over T-SQL's 1000-row cap`);
    }
});

// ── The engine's safety properties ──────────────────────────────────────────────────────────────

/**
 * With XACT_ABORT OFF an error inside `EXEC sp_executesql` does NOT abort the batch, so the delete
 * loops keep issuing destructive statements against an already-doomed transaction. Caliber measured
 * 60+ failures executing before the first THROW.
 */
test('XACT_ABORT is on', () => {
    assert.match(codeOnly(sql()), /SET\s+XACT_ABORT\s+ON\s*;/i);
});

/** Both loops are bounded, or a non-nullable FK cycle spins forever inside a transaction. */
test('both loops are bounded and throw rather than half-finishing', () => {
    const code = codeOnly(sql());
    assert.match(code, /@MAX_PASSES\s+INT\s*=\s*\d+/i);
    assert.match(code, /@MAX_RELAX\s+INT\s*=\s*\d+/i);
    assert.match(code, /THROW\s+51003/);
    assert.match(code, /THROW\s+51005/);
});

/** A teardown that reports success while leaving seeded rows behind is the failure this replaced. */
test('the row postcondition is asserted, not assumed', () => {
    assert.match(codeOnly(sql()), /THROW\s+51004/);
});

/**
 * The ownership rule that makes this safe on a used database: a nullable reference is RELEASED, not
 * deleted. Losing the `is_nullable` branch turns the teardown into one that deletes the customer's
 * execution logs because they used our query.
 */
test('nullable references are set to NULL rather than deleted', () => {
    const code = codeOnly(sql());
    assert.match(code, /pc\.is_nullable/);
    assert.match(code, /IF\s+@isNullable\s*=\s*1/i);
    assert.match(code, /SET\s+c\.\[/i);
});

/**
 * Keyed on SCHEMA + NAME, never on name alone. A live more-cheese database holds `__mj.Application`
 * beside `__mj_BizAppsSonar` tables and this app's own three schemas; a bare name join collides.
 */
test('the level table and the deletes are keyed on schema as well as table', () => {
    const code = codeOnly(sql());
    assert.match(code, /PRIMARY KEY \(SchemaName, TableName\)/);
    assert.match(code, /d\.TableName = @t AND d\.SchemaName = @s/);
});

/**
 * The generalisation over caliber: dependents are discovered for ANY doomed (schema, table), not only
 * for parents in the core schema. Re-introducing caliber's `SCHEMA_NAME(rt.schema_id) = '<core>'`
 * filter would make the Sonar configuration rows — which live in `__mj_BizAppsSonar` — undiscoverable.
 */
test('dependent discovery is filtered on the doomed set, not on the core schema', () => {
    const code = codeOnly(sql());
    assert.match(code, /EXISTS \(SELECT 1 FROM #MoreCheeseDoomed d\s+WHERE d\.SchemaName = SCHEMA_NAME\(rt\.schema_id\)/);
    assert.equal(/WHERE SCHEMA_NAME\(rt\.schema_id\) = '\$\{mjSchema\}'/.test(code), false);
});

/** Composite foreign keys are skipped, as MJ's own EnumerateMjEntityFkGraph does. */
test('composite foreign keys are skipped', () => {
    assert.match(codeOnly(sql()), /COUNT\(\*\) FROM sys\.foreign_key_columns c2/);
});

/** The plan is announced before anything is destroyed, the way MJ's own teardown does. */
test('the plan is printed before the deletes run', () => {
    const code = codeOnly(sql());
    assert.ok(code.indexOf('plan_cursor') < code.indexOf('del_cursor'), 'the plan must be announced before deleting');
});

// ── The multi-schema half — the whole point of this file ────────────────────────────────────────

test('both schemas mj app remove does not drop are dropped here', () => {
    const code = codeOnly(sql());
    for (const schema of UNDROPPED_SCHEMAS) assert.match(code, new RegExp(`'${schema}'`));
    assert.match(code, /DROP SCHEMA/);
});

/**
 * `morecheese_members` is `schema.name` in mj-app.json, so MJ drops it. A second `DROP SCHEMA` on a
 * schema that is already gone fails, and MJ rolls the whole teardown back on any error.
 */
test('the declared schema is NOT dropped here', () => {
    const code = codeOnly(sql());
    assert.equal(/'morecheese_members'/.test(code), false);
});

/** DROP SCHEMA fails if anything remains, so every object class must be removed first. */
test('objects are dropped before the schema that holds them', () => {
    const code = codeOnly(sql());
    const dropSchema = code.indexOf('DROP SCHEMA');
    for (const needed of ['DROP CONSTRAINT', 'DROP TABLE [', "'VIEW'"]) {
        const at = code.indexOf(needed);
        assert.notEqual(at, -1, `${needed} is missing`);
        assert.ok(at < dropSchema, `${needed} must come before DROP SCHEMA`);
    }
});

/**
 * Inbound foreign keys are dropped before the tables they point at. Every cross-schema FK this app
 * declares today points OUTWARD (to `__mj_BizAppsCommon.Person`/`.Organization`), so this finds
 * nothing on a stock install — it exists because one inbound FK, added by a host or a later
 * migration, is the difference between a clean DROP TABLE and a rolled-back teardown.
 */
test('inbound foreign keys are released before tables are dropped', () => {
    const code = codeOnly(sql());
    assert.match(code, /SCHEMA_NAME\(rt\.schema_id\) = @schemaName\s+AND SCHEMA_NAME\(pt\.schema_id\) <> @schemaName/);
    assert.ok(code.indexOf('inbound_fk') < code.indexOf('DROP TABLE ['));
});

test('MJ SchemaInfo rows for the undropped schemas are retired', () => {
    assert.match(codeOnly(sql()), /DELETE FROM \[\$\{mjSchema\}\]\.\[SchemaInfo\] WHERE \[SchemaName\] = @schemaName/);
});

// ── What the generator derives ──────────────────────────────────────────────────────────────────

test('every config directory contributes its entity name, not a table name', () => {
    const rows = readConfigSeed(REPO_ROOT);
    assert.ok(rows.length > 0);
    for (const row of rows.slice(0, 50)) {
        assert.match(row.entity, /^[A-Za-z_]+: .+/, `${row.entity} does not look like an mj-sync entity name`);
    }
    // The Sonar rows are the reason the resolution is by name: this generator does not know that
    // `MJ_BizApps_Sonar: Factors` lives in `__mj_BizAppsSonar.Factor`, and it must not need to.
    assert.ok(rows.some((r) => r.entity.startsWith('MJ_BizApps_Sonar: ')));
});

test('all twelve baseline entity rows are derived, across all three schemas', () => {
    const { entities } = readBaselineCoreRows(REPO_ROOT);
    assert.equal(entities.length, 12);
    const schemas = new Set(entities.map((e) => e.schema));
    assert.deepEqual(
        [...schemas].sort(),
        ['${flyway:defaultSchema}', 'morecheese_events', 'morecheese_learning'],
    );
});

test('the Application row the baseline creates is derived', () => {
    const { applicationId } = readBaselineCoreRows(REPO_ROOT);
    assert.match(applicationId ?? '', /^[0-9A-F-]{36}$/);
    assert.match(codeOnly(sql()), new RegExp(applicationId));
});

/**
 * The generator refuses a config directory it cannot resolve rather than skipping it. A skipped
 * directory is a set of rows stranded on every host's uninstall — and silently, which is the one
 * failure mode a generated teardown exists to make impossible.
 */
/**
 * A directory whose entity cannot be resolved is a set of rows stranded on every host's uninstall,
 * so it must be a hard error rather than a silent skip.
 *
 * This asserts the GUARD, against a real fixture. The previous version passed `no-such-repo-root`
 * and accepted any `Error`, which `readdirSync` supplies as ENOENT before either guard is reached —
 * so it went green whether the guard existed or not. Assert the guard's own message, not merely
 * that something threw.
 */
test('a config directory with no entity name is a hard error', () => {
    const root = path.join(tmpdir(), `teardown-guard-${Date.now()}`);
    try {
        mkdirSync(path.join(root, 'config', 'nameless'), { recursive: true });
        writeFileSync(path.join(root, 'config', 'nameless', '.mj-sync.json'), JSON.stringify({ entity: '   ' }));
        assert.throws(
            () => readConfigSeed(root),
            (err) =>
                err instanceof Error &&
                /cannot derive the teardown from config\/:/.test(err.message) &&
                /config\/nameless\/\.mj-sync\.json declares no "entity"/.test(err.message),
            'readConfigSeed must reject a directory whose .mj-sync.json names no entity',
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

/** The sibling guard: a directory with no `.mj-sync.json` at all. Also previously unexercised. */
test('a config directory with no .mj-sync.json is a hard error', () => {
    const root = path.join(tmpdir(), `teardown-guard2-${Date.now()}`);
    try {
        mkdirSync(path.join(root, 'config', 'orphan'), { recursive: true });
        writeFileSync(path.join(root, 'config', 'orphan', 'record.json'), '{}');
        assert.throws(
            () => readConfigSeed(root),
            (err) => err instanceof Error && /config\/orphan has no \.mj-sync\.json/.test(err.message),
            'readConfigSeed must reject a directory with no .mj-sync.json',
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

// ── Scope, stated so a reader cannot mistake it ────────────────────────────────────────────────

/**
 * `generated/` is NOT torn down. That is a decision, not an omission, and it is pinned here so it
 * cannot be quietly reversed or quietly forgotten: those 121,661 records are rows in nine SIBLING
 * apps' schemas. See migrations-teardown/README.md.
 */
test('the teardown says plainly that generated/ is left behind', () => {
    assert.match(sql(), /WHAT THIS DELIBERATELY LEAVES/);
    assert.match(sql(), /generated\//);
});

test('the teardown says plainly that it has not been run against a database', () => {
    assert.match(sql(), /NOT TESTED AGAINST A DATABASE/);
});

/**
 * The seed temp table is declared `PRIMARY KEY (EntityName, RowID)`, and `batchedInsert` puts all
 * 410 of today's rows in ONE `VALUES` constructor, so a repeated tuple is not a tidiness problem —
 * SQL Server rejects the whole statement with Msg 2627. `HandleTeardown` runs the file inside one
 * transaction and rolls back on error while `mj app remove` drops the declared schema regardless,
 * so the duplicate turns the entire teardown into a no-op at precisely the moment it is needed.
 *
 * This is the shape that actually shipped: ids dedupe WITHIN a config directory but two pairs of
 * directories declare the same mj-sync entity over the same records — `config/conversations` with
 * `config/conversations-owner` (25 shared) and `config/sonar-score-models` with
 * `config/sonar-score-models-activate` (1 shared). 26 duplicate tuples, in a suite that was 110/110
 * green, because nothing here asserted the key.
 */
test('no (EntityName, RowID) tuple is inserted into #MoreCheeseSeed twice', () => {
    const sql = readFileSync(TEARDOWN, 'utf8');
    const block = sql.slice(sql.indexOf('INSERT INTO #MoreCheeseSeed'));
    const tuples = block.slice(0, block.indexOf(';')).match(/\('[^)]*'\)/g) ?? [];
    assert.ok(tuples.length > 0, 'found no seed tuples to check — the parser, not the file, is wrong');
    const seen = new Set();
    const dupes = tuples.filter((t) => (seen.has(t) ? true : (seen.add(t), false)));
    assert.deepEqual(dupes, [], `${dupes.length} duplicate seed key(s) would fail the INSERT: ${dupes.slice(0, 3).join(', ')}`);
});

/** The same invariant one layer up, so a regeneration cannot reintroduce it without the spec failing. */
test('the generator emits each (entity, id) pair at most once', () => {
    const rows = readConfigSeed(REPO_ROOT);
    const keys = rows.map((r) => `${r.entity}|${r.id}`);
    const seen = new Set();
    const dupes = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
    // readConfigSeed deliberately keeps every declaration so the provenance header can name all 36
    // directories; the emitted INSERT is what must be distinct. Assert the relationship explicitly.
    const generated = generateTeardown({
        configRows: rows,
        baseline: readBaselineCoreRows(REPO_ROOT),
        entities: readBaselineCoreRows(REPO_ROOT).entities,
        applicationId: readBaselineCoreRows(REPO_ROOT).applicationId,
    });
    // batchedInsert splits the seed under T-SQL's 1000-row table-constructor cap (500 per statement),
    // so the emitted rows span several `INSERT INTO #MoreCheeseSeed … VALUES … ;` statements once
    // config/ passes 500 records — which it did when the Knowledge Hub content landed. Read them all.
    const emitted = [];
    for (const m of generated.matchAll(/INSERT INTO #MoreCheeseSeed \(EntityName, RowID\) VALUES\n([\s\S]*?);/g)) {
        emitted.push(...(m[1].match(/\('[^)]*'\)/g) ?? []));
    }
    assert.equal(new Set(emitted).size, emitted.length, 'the generator emitted a duplicate seed key');
    assert.equal(emitted.length, new Set(keys).size, `emitted ${emitted.length} rows for ${new Set(keys).size} distinct declarations (${dupes.length} shared across directories)`);
});
