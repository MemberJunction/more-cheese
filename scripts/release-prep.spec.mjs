import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assessRelease, checkPostconditions, maxBumpLevel, parseChangesetFile } from './release-prep.mjs';

const clean = {
  treeClean: true,
  changesets: [{ file: 'a.md', level: 'minor' }],
  gateResults: { 'check:release-seed': 0, 'check:seed-cadence': 0, 'lint:migrations': 0, 'lint:distribution': 0 },
  currentVersion: '1.1.0',
  predictedVersion: '1.2.0',
  tags: [],
  publishedVersions: {},
  mainReachedNext: true,
};

test('a clean state is ready', () => {
  const r = assessRelease(clean);
  assert.equal(r.ready, true);
  assert.deepEqual(r.blockers, []);
  assert.equal(r.version, '1.2.0');
  assert.equal(r.branch, 'release/v1.2.0');
});

test('a dirty tree blocks', () => {
  const r = assessRelease({ ...clean, treeClean: false });
  assert.equal(r.ready, false);
  assert.equal(r.blockers.length, 1);
  assert.match(r.blockers[0], /clean/i);
});

test('no changesets blocks', () => {
  const r = assessRelease({ ...clean, changesets: [] });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /changeset/i);
});

test('a changeset with no bump level blocks', () => {
  const r = assessRelease({ ...clean, changesets: [{ file: 'a.md', level: null }] });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /bump level/i);
});

test('a red gate blocks and names the gate', () => {
  const r = assessRelease({ ...clean, gateResults: { ...clean.gateResults, 'lint:distribution': 1 } });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /lint:distribution/);
});

test('a gate with no exit code throws', () => {
  assert.throws(
    () => assessRelease({ ...clean, gateResults: { ...clean.gateResults, 'lint:migrations': null } }),
    /did not run/i,
  );
});

test('an existing tag blocks', () => {
  const r = assessRelease({ ...clean, tags: ['v1.2.0'] });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /tag/i);
});

test('a version already on npm blocks', () => {
  const r = assessRelease({
    ...clean,
    publishedVersions: { '@mj-biz-apps/more-cheese-entities': ['1.2.0'] },
  });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /npm/i);
});

test('an unreachable npm registry blocks rather than being assumed free', () => {
  const r = assessRelease({ ...clean, publishedVersions: null });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /npm|registry|unreachable/i);
});

test('main not reaching next blocks and names the back-merge', () => {
  const r = assessRelease({ ...clean, mainReachedNext: false });
  assert.equal(r.ready, false);
  assert.match(r.blockers.join(' '), /back-merge|main/i);
});

test('an unknown main/next relationship blocks, it does not pass', () => {
  const r = assessRelease({ ...clean, mainReachedNext: null });
  assert.equal(r.ready, false);
});

test('every blocker is collected, not just the first', () => {
  const r = assessRelease({ ...clean, treeClean: false, changesets: [], tags: ['v1.2.0'] });
  assert.ok(r.blockers.length >= 3, `expected 3+ blockers, got ${r.blockers.length}`);
});

test('maxBumpLevel ranks major over minor over patch', () => {
  assert.equal(maxBumpLevel([{ level: 'patch' }, { level: 'minor' }]), 'minor');
  assert.equal(maxBumpLevel([{ level: 'minor' }, { level: 'major' }]), 'major');
  assert.equal(maxBumpLevel([{ level: 'patch' }]), 'patch');
});

test('postconditions pass on a correct bump', () => {
  const issues = checkPostconditions(
    { packages: ['a', 'b', 'c'], changesetCount: 7 },
    { packages: ['a', 'b', 'c'], versions: ['1.2.0', '1.2.0', '1.2.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.deepEqual(issues, []);
});

test('a surviving changeset file fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a'], changesetCount: 7 },
    { packages: ['a'], versions: ['1.2.0'], changesetCount: 1, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /changeset/i);
});

test('packages left at different versions fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a', 'b'], changesetCount: 1 },
    { packages: ['a', 'b'], versions: ['1.2.0', '1.1.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /version/i);
});

test('a produced version differing from the prediction fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a'], changesetCount: 1 },
    { packages: ['a'], versions: ['1.3.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /predict|expect/i);
});

test('a drifted mj-app.json fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a'], changesetCount: 1 },
    { packages: ['a'], versions: ['1.2.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: false },
  );
  assert.match(issues.join(' '), /mj-app/i);
});

test('the package set changing across the bump fails postconditions', () => {
  const issues = checkPostconditions(
    { packages: ['a', 'b', 'c'], changesetCount: 1 },
    { packages: ['a', 'b'], versions: ['1.2.0', '1.2.0'], changesetCount: 0, predicted: '1.2.0', appVersionInSync: true },
  );
  assert.match(issues.join(' '), /package/i);
});

// ── parseChangesetFile ──────────────────────────────────────────────────────────────────────────
//
// The parser carries a non-negotiable no other gate can back up: a bump level it cannot read must
// STOP the release rather than be skipped, because a typo'd `major` silently becoming a patch
// under-bumps the version that actually publishes and nothing downstream ever sees it happen.
//
// Fixtures are written to a fresh temp directory and read back the way `readChangesets` reads a real
// one. They never touch `.changeset/`: a spec that planted files in the repo would make its own
// dirty-tree blocker fire, and a crashed run would leave a changeset behind that a release consumes.

const fixtureDir = mkdtempSync(join(tmpdir(), 'release-prep-spec-'));
after(() => rmSync(fixtureDir, { recursive: true, force: true }));

/** Write a changeset fixture outside the repo and hand back what `readChangesets` would pass in. */
function changesetFixture(name, contents) {
  const path = join(fixtureDir, name);
  writeFileSync(path, contents);
  return { text: readFileSync(path, 'utf8'), label: `.changeset/${name}` };
}

test('a well-formed changeset parses to its declared level', () => {
  const { text, label } = changesetFixture(
    'well-formed.md',
    '---\n"@mj-biz-apps/more-cheese-entities": minor\n"@mj-biz-apps/more-cheese-server": minor\n---\n\nA real change.\n',
  );
  assert.deepEqual(parseChangesetFile(text, label), [
    { file: label, level: 'minor' },
    { file: label, level: 'minor' },
  ]);
  assert.equal(maxBumpLevel(parseChangesetFile(text, label)), 'minor');
});

test("a typo'd bump level throws rather than being silently skipped", () => {
  const { text, label } = changesetFixture(
    'typo-level.md',
    '---\n"@mj-biz-apps/more-cheese-entities": minr\n---\n\nTypo in the level.\n',
  );
  // The parser reads the token; maxBumpLevel is what refuses it, and it must never reach the
  // decision as "this changeset asks for nothing".
  assert.deepEqual(parseChangesetFile(text, label), [{ file: label, level: 'minr' }]);
  assert.throws(() => maxBumpLevel(parseChangesetFile(text, label)), /not a changeset bump level/i);
});

test('a malformed frontmatter line throws rather than being skipped', () => {
  const { text, label } = changesetFixture(
    'malformed-line.md',
    '---\n"@mj-biz-apps/more-cheese-entities" minor\n---\n\nThe colon is missing.\n',
  );
  assert.throws(() => parseChangesetFile(text, label), /is not a `"package": level` entry/);
});

test('a file with no frontmatter block at all throws', () => {
  const { text, label } = changesetFixture('no-frontmatter.md', 'Just prose, no frontmatter.\n');
  assert.throws(() => parseChangesetFile(text, label), /not a changeset/i);
});

test('a changeset with empty frontmatter reports level null, so blocker 2 can see it', () => {
  const { text, label } = changesetFixture('empty-frontmatter.md', '---\n---\n\nThis releases nothing.\n');
  assert.deepEqual(parseChangesetFile(text, label), [{ file: label, level: null }]);

  const blocked = assessRelease({ ...clean, changesets: parseChangesetFile(text, label) });
  assert.equal(blocked.ready, false);
  assert.match(blocked.blockers.join(' '), /bump level/i);
});

// ── The changeset level and the predicted version have to agree ─────────────────────────────────
//
// `.github/scripts/determine-next-version.mjs` raises the bump to minor only when `migrations/`
// carries a file the last release did not; it never reads a changeset level. `changeset version`
// reads nothing else. So the two answers can differ, and when they do `--apply` is guaranteed to
// fail its postcondition check — AFTER release-prep.yml has already cut the branch. These cases pin
// that the disagreement is caught up front, as a collected blocker, and that agreement in either
// direction stays silent.
//
// `predictedVersion` in each fixture is what planNextVersion would have returned for that state:
// 1.1.0 -> 1.1.1 with no new migrations, -> 1.2.0 with them, -> 2.0.0 for a major changeset.

test('a minor changeset with no new migrations blocks: the prediction is a patch', () => {
  const r = assessRelease({
    ...clean,
    changesets: [{ file: '.changeset/a-feature.md', level: 'minor' }],
    predictedVersion: '1.1.1',
  });
  assert.equal(r.ready, false);
  assert.equal(r.blockers.length, 1);
  // Both numbers, both levels, and the changeset that drives it — the blocker is read by someone
  // deciding which of the two answers is the wrong one.
  assert.match(r.blockers[0], /minor/);
  assert.match(r.blockers[0], /1\.2\.0/);
  assert.match(r.blockers[0], /1\.1\.1/);
  assert.match(r.blockers[0], /a-feature\.md/);
});

test('a minor changeset with new migrations does not block', () => {
  const r = assessRelease({
    ...clean,
    changesets: [{ file: '.changeset/a-migration.md', level: 'minor' }],
    predictedVersion: '1.2.0',
  });
  assert.equal(r.ready, true);
  assert.deepEqual(r.blockers, []);
});

test('a patch changeset with no new migrations does not block', () => {
  const r = assessRelease({
    ...clean,
    changesets: [{ file: '.changeset/a-fix.md', level: 'patch' }],
    predictedVersion: '1.1.1',
  });
  assert.equal(r.ready, true);
  assert.deepEqual(r.blockers, []);
});

test('a major changeset does not block: the rule returns a major for it too', () => {
  const r = assessRelease({
    ...clean,
    changesets: [{ file: '.changeset/a-break.md', level: 'major' }],
    predictedVersion: '2.0.0',
  });
  assert.equal(r.ready, true);
  assert.deepEqual(r.blockers, []);
});

test('the comparison is symmetric: a patch changeset with new migrations blocks too', () => {
  // changes.yml already refuses this shape on the pull request ("migration => changeset with >=
  // minor"), so reaching here means that gate was bypassed — and `changeset version` would write
  // 1.1.1 onto a branch named release/v1.2.0.
  const r = assessRelease({
    ...clean,
    changesets: [{ file: '.changeset/a-fix.md', level: 'patch' }],
    predictedVersion: '1.2.0',
  });
  assert.equal(r.ready, false);
  assert.equal(r.blockers.length, 1);
  assert.match(r.blockers[0], /patch/);
});

test('the strongest changeset level is the one compared, not the first', () => {
  const r = assessRelease({
    ...clean,
    changesets: [
      { file: '.changeset/a-fix.md', level: 'patch' },
      { file: '.changeset/a-feature.md', level: 'minor' },
    ],
    predictedVersion: '1.2.0',
  });
  assert.equal(r.ready, true);
  assert.deepEqual(r.blockers, []);
});
