import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAppVersionFields } from './sync-app-version.mjs';

test('version is copied verbatim from the anchor package', () => {
  const out = computeAppVersionFields({
    version: '1.2.0',
    peerDependencies: { '@memberjunction/core': '^6.1.2' },
  });
  assert.equal(out.version, '1.2.0');
});

test('mjVersionRange spans from the peer floor to the next major', () => {
  const out = computeAppVersionFields({
    version: '1.2.0',
    peerDependencies: { '@memberjunction/core': '^6.1.2' },
  });
  assert.equal(out.mjVersionRange, '>=6.1.2 <7.0.0');
});

test('a prerelease floor keeps its suffix', () => {
  const out = computeAppVersionFields({
    version: '1.2.0',
    peerDependencies: { '@memberjunction/core': '^6.1.0-edge.6' },
  });
  assert.equal(out.mjVersionRange, '>=6.1.0-edge.6 <7.0.0');
});

test('falls back to dependencies when core is not a peer', () => {
  const out = computeAppVersionFields({
    version: '2.0.0',
    dependencies: { '@memberjunction/core': '~7.3.1' },
  });
  assert.equal(out.mjVersionRange, '>=7.3.1 <8.0.0');
});

test('a package with no @memberjunction/core anywhere throws', () => {
  assert.throws(
    () => computeAppVersionFields({ version: '1.0.0', peerDependencies: {} }),
    /@memberjunction\/core/,
  );
});

test('an unparseable core range throws rather than guessing', () => {
  assert.throws(
    () => computeAppVersionFields({
      version: '1.0.0',
      peerDependencies: { '@memberjunction/core': 'workspace:*' },
    }),
    /workspace:\*/,
  );
});
