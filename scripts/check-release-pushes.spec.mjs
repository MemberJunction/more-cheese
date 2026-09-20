import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findReleasePushes } from './check-release-pushes.mjs';

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relpush-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return dir;
}

test('a clean tree reports nothing', () => {
  const dir = fixture({ 'scripts/ok.mjs': "await git.push('origin', 'refs/tags/v1.0.0');\n" });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('shell push to main is caught', () => {
  const dir = fixture({ '.github/workflows/p.yml': 'run: git push origin HEAD:main\n' });
  const hits = findReleasePushes(dir);
  assert.equal(hits.length, 1);
  assert.match(hits[0].text, /HEAD:main/);
});

test('shell push to next is caught', () => {
  const dir = fixture({ '.github/workflows/p.yml': 'run: git push origin HEAD:next\n' });
  assert.equal(findReleasePushes(dir).length, 1);
});

test('simple-git push to main is caught', () => {
  const dir = fixture({ 'ci/commit_push.mjs': "await git.push('origin', 'HEAD:main');\n" });
  assert.equal(findReleasePushes(dir).length, 1);
});

test('a tag push is allowed', () => {
  const dir = fixture({ 'ci/tag.mjs': "await git.push('origin', `refs/tags/${v}`);\n" });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('pushing a release branch is allowed', () => {
  const dir = fixture({ '.github/workflows/r.yml': 'run: git push app-push "HEAD:refs/heads/$BRANCH"\n' });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('a branch merely named in prose is not a push', () => {
  const dir = fixture({ 'scripts/doc.mjs': "// we never push to main or next\n" });
  assert.deepEqual(findReleasePushes(dir), []);
});

test('every offender is reported, not just the first', () => {
  const dir = fixture({
    'ci/a.mjs': "await git.push('origin', 'HEAD:main');\n",
    'ci/b.mjs': "await git.push('origin', 'HEAD:next');\n",
  });
  assert.equal(findReleasePushes(dir).length, 2);
});

test('a reported hit carries a usable file and line', () => {
  const dir = fixture({ 'ci/a.mjs': "// pad\n// pad\nawait git.push('origin', 'HEAD:main');\n" });
  const [hit] = findReleasePushes(dir);
  assert.equal(hit.line, 3);
  assert.match(hit.file, /a\.mjs$/);
});
