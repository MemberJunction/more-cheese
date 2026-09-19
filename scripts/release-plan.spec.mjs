import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planRelease } from './release-plan.mjs';

const pkgs = (v) => [
  { name: '@mj-biz-apps/more-cheese-entities', version: v },
  { name: '@mj-biz-apps/more-cheese-server', version: v },
  { name: '@mj-biz-apps/more-cheese-ng', version: v },
];

test('nothing published and no tag: publish and tag are both work', () => {
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: {}, tags: [] });
  assert.deepEqual(
    { version: p.version, publish: p.publish, tag: p.tag, work: p.work },
    { version: '1.2.0', publish: true, tag: true, work: true },
  );
});

test('fully published and tagged: nothing to do', () => {
  const published = {
    '@mj-biz-apps/more-cheese-entities': ['1.2.0'],
    '@mj-biz-apps/more-cheese-server': ['1.2.0'],
    '@mj-biz-apps/more-cheese-ng': ['1.2.0'],
  };
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: published, tags: ['v1.2.0'] });
  assert.equal(p.publish, false);
  assert.equal(p.tag, false);
  assert.equal(p.work, false);
});

test('a partial publish still asks to publish', () => {
  const published = {
    '@mj-biz-apps/more-cheese-entities': ['1.2.0'],
    '@mj-biz-apps/more-cheese-server': [],
    '@mj-biz-apps/more-cheese-ng': ['1.2.0'],
  };
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: published, tags: ['v1.2.0'] });
  assert.equal(p.publish, true, 'the missing package must still be published');
  assert.equal(p.tag, false, 'the tag already exists');
  assert.equal(p.work, true);
});

test('published but untagged still asks to tag', () => {
  const published = {
    '@mj-biz-apps/more-cheese-entities': ['1.2.0'],
    '@mj-biz-apps/more-cheese-server': ['1.2.0'],
    '@mj-biz-apps/more-cheese-ng': ['1.2.0'],
  };
  const p = planRelease({ packages: pkgs('1.2.0'), publishedVersions: published, tags: [] });
  assert.equal(p.publish, false);
  assert.equal(p.tag, true);
  assert.equal(p.work, true);
});

test('packages disagreeing about the version throws', () => {
  const bad = [
    { name: '@mj-biz-apps/more-cheese-entities', version: '1.2.0' },
    { name: '@mj-biz-apps/more-cheese-server', version: '1.1.0' },
  ];
  assert.throws(
    () => planRelease({ packages: bad, publishedVersions: {}, tags: [] }),
    /version/i,
  );
});

test('an empty package set throws rather than reporting nothing to do', () => {
  assert.throws(() => planRelease({ packages: [], publishedVersions: {}, tags: [] }));
});
