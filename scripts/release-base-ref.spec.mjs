/**
 * Spec for the corpus-stability base decision.
 *
 * The decision it covers is only ever taken on a release pull request, which is exactly the shape
 * of logic docs/release.md refuses to leave in workflow YAML: something provable only by cutting a
 * real release is not provable at all. Hence a pure function and this file.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCorpusBaseRef } from './release-base-ref.mjs';

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
