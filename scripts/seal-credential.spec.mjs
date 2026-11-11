/**
 * scripts/seal-credential.mjs: shipped credentials are sealed with the More Cheese shared key, in
 * MemberJunction's encrypted-value format, and the gate refuses anything else.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CREDENTIAL_SEED,
    KEY_SEED,
    SHARED_KEY_ENV,
    findUnsealedCredentials,
    isSealedFor,
    openValue,
    parseKeyMaterial,
    readSharedKeyId,
    sealCredential,
    sealValue,
} from './seal-credential.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY_ID = '11111111-2222-3333-4444-555555555555';

/** A throwaway repo with the shared key seed and the given credential records. */
function fakeRepo(credentials) {
    const root = mkdtempSync(path.join(tmpdir(), 'seal-credential-'));
    mkdirSync(path.join(root, path.dirname(KEY_SEED)), { recursive: true });
    mkdirSync(path.join(root, path.dirname(CREDENTIAL_SEED)), { recursive: true });
    writeFileSync(path.join(root, KEY_SEED), JSON.stringify([{ fields: { Name: 'More Cheese Shared Key' }, primaryKey: { ID: KEY_ID } }]));
    writeFileSync(path.join(root, CREDENTIAL_SEED), JSON.stringify(credentials));
    return root;
}
const credential = (Name, Values) => ({ fields: { Name, Values, IsActive: false }, primaryKey: { ID: randomBytes(4).toString('hex') } });

test('a sealed value is in MJ\'s format and opens with the same key', () => {
    const key = randomBytes(32);
    const sealed = sealValue('{"apiKey":"demo"}', KEY_ID, key);
    // MJ's EncryptionEngine joins [marker, keyId, algorithm, iv, ciphertext, authTag] with '$'.
    assert.match(sealed, /^\$ENC\$\$11111111-2222-3333-4444-555555555555\$AES-256-GCM\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    const [, , , iv, , tag] = sealed.split('$').filter((p) => p !== '');
    assert.equal(Buffer.from(iv, 'base64').length, 12);
    assert.equal(Buffer.from(tag, 'base64').length, 16);
    assert.equal(openValue(sealed, key), '{"apiKey":"demo"}');
    assert.ok(isSealedFor(sealed, KEY_ID.toLowerCase()));
});

test('a sealed value does not open with another key', () => {
    const sealed = sealValue('secret', KEY_ID, randomBytes(32));
    assert.throws(() => openValue(sealed, randomBytes(32)));
});

test('the key must be 32 bytes of base64', () => {
    assert.equal(parseKeyMaterial(randomBytes(32).toString('base64')).length, 32);
    assert.throws(() => parseKeyMaterial(randomBytes(16).toString('base64')), /32 bytes/);
    assert.throws(() => parseKeyMaterial(undefined), /32 bytes/);
});

test('the gate flags credentials that are plaintext or sealed with another key', () => {
    const key = randomBytes(32);
    const root = fakeRepo([
        credential('Plain', '{}'),
        credential('Other key', sealValue('{}', '99999999-2222-3333-4444-555555555555', key)),
        credential('Sealed', sealValue('{}', KEY_ID, key)),
    ]);
    const unsealed = findUnsealedCredentials(root);
    assert.deepEqual(unsealed.map((u) => u.name), ['Plain', 'Other key']);
    assert.match(unsealed[0].reason, /^not sealed/);
    assert.equal(unsealed[1].reason, 'sealed with a different key');
});

test('sealing a credential writes its Values and activates it, leaving the others alone', () => {
    const key = randomBytes(32);
    const root = fakeRepo([credential('Component Registry: Skip', '{}'), credential('Dropbox OAuth', '{}')]);
    sealCredential(root, 'Component Registry: Skip', { apiKey: 'demo' }, key);
    const [skip, dropbox] = JSON.parse(readFileSync(path.join(root, CREDENTIAL_SEED), 'utf8'));
    assert.equal(JSON.parse(openValue(skip.fields.Values, key)).apiKey, 'demo');
    assert.equal(skip.fields.IsActive, true);
    assert.deepEqual(dropbox.fields, { Name: 'Dropbox OAuth', Values: '{}', IsActive: false });
    assert.throws(() => sealCredential(root, 'Nope', { apiKey: 'x' }, key), /no credential named/);
    assert.throws(() => sealCredential(root, 'Dropbox OAuth', 'not an object', key), /JSON object/);
});

test('the shipped key record reads its material from MORECHEESE_SHARED_KEY', () => {
    const [record] = JSON.parse(readFileSync(path.join(REPO_ROOT, KEY_SEED), 'utf8'));
    assert.equal(record.fields.KeyLookupValue, SHARED_KEY_ENV);
    assert.equal(record.fields.EncryptionKeySourceID, '@lookup:MJ: Encryption Key Sources.Name=Environment Variable');
    assert.equal(record.fields.EncryptionAlgorithmID, '@lookup:MJ: Encryption Algorithms.Name=AES-256-GCM');
    assert.equal(readSharedKeyId(REPO_ROOT), record.primaryKey.ID.toUpperCase());
});
