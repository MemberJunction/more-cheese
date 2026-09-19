/**
 * Spec for the corpus-stability base decision.
 *
 * The decision it covers is only ever taken on a release pull request, which is exactly the shape
 * of logic docs/release.md refuses to leave in workflow YAML: something provable only by cutting a
 * real release is not provable at all. Hence a pure function and this file.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveCorpusBaseRef, resolveGateBaseRef } from './release-base-ref.mjs';

test('a release pull request into main compares the corpus against next', () => {
    const override = resolveCorpusBaseRef({ GITHUB_BASE_REF: 'main' });
    assert.equal(override?.ref, 'next');
});

test('the override explains itself, because it lands in the CI log as a notice', () => {
    const override = resolveCorpusBaseRef({ GITHUB_BASE_REF: 'main' });
    assert.match(override.reason, /next/);
    assert.ok(override.reason.length > 40, `too terse to be useful: ${override.reason}`);
});

test('an ordinary pull request into next is left alone', () => {
    // The base is already right here, and overriding it would hide a real corpus regression.
    assert.equal(resolveCorpusBaseRef({ GITHUB_BASE_REF: 'next' }), null);
});

test('a local run with no base ref is left alone', () => {
    // Loom falls through its own candidate chain to origin/next; this must not pre-empt that.
    assert.equal(resolveCorpusBaseRef({}), null);
});

test('an unrelated base branch is left alone', () => {
    assert.equal(resolveCorpusBaseRef({ GITHUB_BASE_REF: 'some-feature' }), null);
});

// ── resolveGateBaseRef — the base the migration gates in changes.yml measure against ─────────

test('a release pull request into main measures the base-relative gates against next', () => {
    const override = resolveGateBaseRef({ GITHUB_BASE_REF: 'main' });
    assert.equal(override?.ref, 'next');
});

test('that override explains itself, because it lands in the CI log as a notice', () => {
    const override = resolveGateBaseRef({ GITHUB_BASE_REF: 'main' });
    assert.match(override.reason, /next/);
    assert.ok(override.reason.length > 40, `too terse to be useful: ${override.reason}`);
});

test('an ordinary pull request into next is left alone', () => {
    // The base is already right, and overriding it would stop the gates seeing what the PR adds.
    assert.equal(resolveGateBaseRef({ GITHUB_BASE_REF: 'next' }), null);
});

test('an unrelated base branch is left alone', () => {
    assert.equal(resolveGateBaseRef({ GITHUB_BASE_REF: 'some-feature' }), null);
});

// ── the CLI, which is the form changes.yml actually consumes ─────────────────────────────────

const CLI = fileURLToPath(new URL('./release-base-ref.mjs', import.meta.url));
const runCli = (env) => spawnSync(process.execPath, [CLI], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });

test('the CLI prints the overridden ref on stdout so `git fetch` can consume it', () => {
    const { status, stdout, stderr } = runCli({ GITHUB_BASE_REF: 'main' });
    assert.equal(status, 0, stderr);
    assert.equal(stdout.trim(), 'next');
});

test('the CLI announces the override on stderr, keeping stdout a clean value', () => {
    const { stderr } = runCli({ GITHUB_BASE_REF: 'main' });
    assert.match(stderr, /::notice::/);
    assert.match(stderr, /next/);
});

test('the CLI echoes the pull request base back when there is nothing to override', () => {
    const { status, stdout, stderr } = runCli({ GITHUB_BASE_REF: 'next' });
    assert.equal(status, 0, stderr);
    assert.equal(stdout.trim(), 'next');
    assert.doesNotMatch(stderr, /::notice::/);
});

test('the CLI fails loudly with no base ref rather than printing an empty ref', () => {
    // `git fetch origin ""` fails a dozen lines later with nothing pointing back to here.
    const { status, stderr } = runCli({});
    assert.notEqual(status, 0);
    assert.match(stderr, /GITHUB_BASE_REF/);
});
