#!/usr/bin/env node
/**
 * Seal the credentials More Cheese ships with the More Cheese shared key.
 *
 * Every credential in config/credentials is stored already encrypted with the More Cheese Shared
 * Key (config/encryption-keys), never with a developer's or release machine's own key. An MJ value
 * carries the ID of the key that encrypted it, so every install that has the shared key in
 * MORECHEESE_SHARED_KEY decrypts these, and the release works the same everywhere (issue #110).
 * The key material itself is never in the repo: it is shared with everyone installing More Cheese,
 * through the More Cheese portal. So only read-only, demo-scoped secrets belong here.
 *
 *   node scripts/seal-credential.mjs new-key
 *       Print a new random key (base64, 32 bytes). Do this once; the key then goes to the portal.
 *   MORECHEESE_SHARED_KEY=… node scripts/seal-credential.mjs seal --name "<credential name>" --values-file <file.json>
 *       Encrypt the JSON in <file.json> (the credential type's fields, e.g. {"apiKey":"…"}) into that
 *       credential's Values and mark it active. Read from a file so the secret stays out of shell
 *       history; keep that file outside the repo.
 *   MORECHEESE_SHARED_KEY=… node scripts/seal-credential.mjs verify
 *       Decrypt every shipped credential with the key and list its field names (never the values).
 *   node scripts/seal-credential.mjs check
 *       The CI gate: fail unless every shipped credential is sealed with the shared key.
 *
 * The format is MemberJunction's (@memberjunction/encryption):
 * `$ENC$` `$` keyId `$` `AES-256-GCM` `$` iv `$` ciphertext `$` authTag, all base64, 12-byte IV,
 * 16-byte tag. MJ's engine decrypts these exactly as it decrypts the values it encrypts itself.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Where an install, and this script, find the key material. */
export const SHARED_KEY_ENV = 'MORECHEESE_SHARED_KEY';
export const KEY_SEED = 'config/encryption-keys/.encryption-keys.json';
export const CREDENTIAL_SEED = 'config/credentials/.credentials.json';

const ALGORITHM = 'AES-256-GCM';
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** The shared key's record ID, read from its seed. */
export function readSharedKeyId(repoRoot = REPO_ROOT) {
    const records = JSON.parse(readFileSync(path.join(repoRoot, KEY_SEED), 'utf8'));
    const id = records[0]?.primaryKey?.ID;
    if (!id) throw new Error(`${KEY_SEED}: no shared key record with a primaryKey.ID.`);
    return id.toUpperCase();
}

/** The 32-byte key from its base64 form, as MJ's environment-variable key source reads it. */
export function parseKeyMaterial(base64) {
    const key = Buffer.from((base64 ?? '').trim(), 'base64');
    if (key.length !== 32) {
        throw new Error(`${SHARED_KEY_ENV} must be 32 bytes, base64-encoded (got ${key.length} bytes). Make one with: node scripts/seal-credential.mjs new-key`);
    }
    return key;
}

/** Encrypt `plaintext` for the key `keyId`, in MJ's format. */
export function sealValue(plaintext, keyId, key) {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_BYTES });
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return ['$ENC$', keyId, ALGORITHM, iv.toString('base64'), ciphertext.toString('base64'), cipher.getAuthTag().toString('base64')].join('$');
}

/** Whether `value` is sealed for `keyId`. */
export function isSealedFor(value, keyId) {
    return typeof value === 'string' && value.toUpperCase().startsWith(`$ENC$$${keyId.toUpperCase()}$${ALGORITHM}$`);
}

/** Decrypt a value sealed by {@link sealValue}. Throws on a wrong key or a tampered value. */
export function openValue(sealed, key) {
    // ['ENC', keyId, algorithm, iv, ciphertext, tag], split as MJ's ParseEncryptedValue does.
    const [, , , iv, ciphertext, tag] = sealed.split('$').filter((p) => p !== '');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'), { authTagLength: TAG_BYTES });
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

/** Shipped credentials not sealed with the shared key: `{ name, reason }` for each. */
export function findUnsealedCredentials(repoRoot = REPO_ROOT) {
    const keyId = readSharedKeyId(repoRoot);
    const records = JSON.parse(readFileSync(path.join(repoRoot, CREDENTIAL_SEED), 'utf8'));
    return records
        .filter((r) => !isSealedFor(r.fields?.Values, keyId))
        .map((r) => ({
            name: r.fields?.Name ?? r.primaryKey?.ID,
            reason: typeof r.fields?.Values === 'string' && r.fields.Values.startsWith('$ENC$')
                ? 'sealed with a different key'
                : 'not sealed (plaintext would be encrypted with the release machine\'s own key, which no install has)',
        }));
}

/** Seal `values` (an object) into the credential named `name`, and mark it active. */
export function sealCredential(repoRoot, name, values, key) {
    if (values === null || typeof values !== 'object' || Array.isArray(values)) {
        throw new Error('The values must be a JSON object of the credential type\'s fields, e.g. {"apiKey":"…"}.');
    }
    const file = path.join(repoRoot, CREDENTIAL_SEED);
    const records = JSON.parse(readFileSync(file, 'utf8'));
    const record = records.find((r) => r.fields?.Name === name);
    if (!record) throw new Error(`${CREDENTIAL_SEED} has no credential named "${name}".`);
    record.fields.Values = sealValue(JSON.stringify(values), readSharedKeyId(repoRoot), key);
    record.fields.IsActive = true;
    writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
}

function main(argv) {
    const [command, ...rest] = argv;
    const arg = (flag) => {
        const i = rest.indexOf(flag);
        return i === -1 || i === rest.length - 1 ? null : rest[i + 1];
    };

    if (command === 'new-key') {
        console.log(randomBytes(32).toString('base64'));
        return 0;
    }
    if (command === 'check') {
        const unsealed = findUnsealedCredentials();
        if (unsealed.length === 0) {
            console.log('✅ Every shipped credential is sealed with the More Cheese shared key.');
            return 0;
        }
        for (const u of unsealed) console.error(`❌ ${CREDENTIAL_SEED}: "${u.name}" is ${u.reason}.`);
        console.error(`Seal it: ${SHARED_KEY_ENV}=… node scripts/seal-credential.mjs seal --name "<name>" --values-file <file.json>`);
        return 1;
    }

    const key = parseKeyMaterial(process.env[SHARED_KEY_ENV]);
    if (command === 'seal') {
        const name = arg('--name');
        const valuesFile = arg('--values-file');
        if (!name || !valuesFile) throw new Error('Usage: seal --name "<credential name>" --values-file <file.json>');
        sealCredential(REPO_ROOT, name, JSON.parse(readFileSync(valuesFile, 'utf8')), key);
        console.log(`Sealed "${name}" with the More Cheese shared key and marked it active.`);
        return 0;
    }
    if (command === 'verify') {
        const keyId = readSharedKeyId();
        const records = JSON.parse(readFileSync(path.join(REPO_ROOT, CREDENTIAL_SEED), 'utf8'));
        let failed = 0;
        for (const r of records) {
            if (!isSealedFor(r.fields.Values, keyId)) {
                console.error(`❌ "${r.fields.Name}": not sealed with the shared key.`);
                failed++;
                continue;
            }
            try {
                const fields = Object.keys(JSON.parse(openValue(r.fields.Values, key)));
                console.log(`✅ "${r.fields.Name}": decrypts with this key; fields ${fields.join(', ')}.`);
            } catch {
                console.error(`❌ "${r.fields.Name}": does not decrypt with this key.`);
                failed++;
            }
        }
        return failed === 0 ? 0 : 1;
    }
    throw new Error('Usage: seal-credential.mjs new-key | seal --name "<name>" --values-file <file> | verify | check');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    try {
        process.exit(main(process.argv.slice(2)));
    } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}
