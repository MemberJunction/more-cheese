#!/usr/bin/env node
/**
 * scripts/generate-logos.mjs
 *
 * Deterministic vector emblem logo generation for Organizations in More Cheese.
 *
 * Requirements:
 *  1. Deterministic generation seeded by organization name/ID.
 *  2. Clean monogram seal design with geometric badges (squircle, circular seal, hexagonal shield).
 *  3. Curated palette of artisanal & executive color pairings (deep navy, emerald, rust, indigo, teal, wine, slate, bronze).
 *  4. Storage constraint: Inline base64 SVG data URIs strictly < 1000 characters
 *     (fits safely inside [__mj_BizAppsCommon].[Organization].[LogoURL] NVARCHAR(1000)).
 *  5. Offline / self-contained vector graphic (renders identically across web, mobile, desktop).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const orgsPath = path.join(rootDir, 'generated/organizations/.organizations.json');

export function buildOrgLogoSvg(name, seed) {
  let hash = 2166136261;
  const s = String(seed || name || 'default');
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const h = Math.abs(hash);

  // Derive 1-2 letter initials from significant words (strip punctuation & generic corporate suffix words)
  const words = String(name || '')
    .replace(/[,.]/g, '')
    .split(/\s+/)
    .filter((w) => !/^(inc|llc|co|corp|ltd|and|&|the|of|for)$/i.test(w));
  let initials = '';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1 && words[0].length === 1) {
    initials = words[0].toUpperCase();
  } else {
    initials = 'MC';
  }

  // Curated corporate & artisanal brand color pairings [background, accent ring, text]
  const palettes = [
    { bg: '#1e3a8a', ring: '#93c5fd', text: '#ffffff' }, // Navy / Sky Blue
    { bg: '#065f46', ring: '#a7f3d0', text: '#ffffff' }, // Emerald / Mint
    { bg: '#7c2d12', ring: '#fed7aa', text: '#ffffff' }, // Rust / Warm Amber
    { bg: '#4c1d95', ring: '#ddd6fe', text: '#ffffff' }, // Deep Indigo / Lavender
    { bg: '#134e4a', ring: '#99f6e4', text: '#ffffff' }, // Dark Teal / Cyan
    { bg: '#831843', ring: '#fbcfe8', text: '#ffffff' }, // Wine / Rose
    { bg: '#1e293b', ring: '#38bdf8', text: '#ffffff' }, // Slate / Light Blue
    { bg: '#78350f', ring: '#fde68a', text: '#ffffff' }, // Bronze / Gold
  ];
  const p = palettes[h % palettes.length];

  // Emblem shapes: 0 = squircle, 1 = circular seal, 2 = hexagonal shield badge
  const shapeKind = (h >> 3) % 3;
  let shapeSvg = '';
  if (shapeKind === 0) {
    // Rounded squircle with subtle inner frame
    shapeSvg =
      '<rect width="100" height="100" rx="22" fill="' +
      p.bg +
      '"/><rect x="6" y="6" width="88" height="88" rx="17" stroke="' +
      p.ring +
      '" stroke-width="2" fill="none" opacity="0.4"/>';
  } else if (shapeKind === 1) {
    // Circular seal with concentric accent rings
    shapeSvg =
      '<circle cx="50" cy="50" r="48" fill="' +
      p.bg +
      '"/><circle cx="50" cy="50" r="41" stroke="' +
      p.ring +
      '" stroke-width="2" stroke-dasharray="6 3" fill="none" opacity="0.6"/><circle cx="50" cy="50" r="37" stroke="' +
      p.ring +
      '" stroke-width="1" fill="none" opacity="0.3"/>';
  } else {
    // Hexagonal shield badge
    shapeSvg =
      '<polygon points="50,4 92,25 92,75 50,96 8,75 8,25" fill="' +
      p.bg +
      '"/><polygon points="50,9 86,28 86,72 50,91 14,72 14,28" stroke="' +
      p.ring +
      '" stroke-width="2" fill="none" opacity="0.5"/>';
  }

  const fontSize = initials.length > 2 ? 28 : 34;
  const textSvg =
    '<text x="50" y="58" font-family="system-ui,-apple-system,sans-serif" font-size="' +
    fontSize +
    '" font-weight="700" fill="' +
    p.text +
    '" text-anchor="middle" dominant-baseline="central" letter-spacing="1">' +
    initials +
    '</text>';

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + shapeSvg + textSvg + '</svg>';
}

export function generateOrgLogoDataUri(name, seed) {
  const svg = buildOrgLogoSvg(name, seed);
  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  return 'data:image/svg+xml;base64,' + base64;
}

export function runLogoGeneration() {
  if (!fs.existsSync(orgsPath)) {
    console.error('Error: organizations metadata file not found at ' + orgsPath);
    process.exit(1);
  }

  const orgs = JSON.parse(fs.readFileSync(orgsPath, 'utf8'));
  let minLen = Infinity;
  let maxLen = 0;

  for (const o of orgs) {
    const seed = o.primaryKey?.ID || o.fields?.ID || o.fields?.Name || 'default';
    const name = o.fields?.Name || 'Organization';
    const uri = generateOrgLogoDataUri(name, seed);
    o.fields.LogoURL = uri;

    if (uri.length < minLen) minLen = uri.length;
    if (uri.length > maxLen) maxLen = uri.length;
  }

  fs.writeFileSync(orgsPath, JSON.stringify(orgs, null, 2) + '\n', 'utf8');

  console.log('✓ Generated deterministic vector logos for ' + orgs.length.toLocaleString() + ' organizations:');
  console.log('  - Length bounds: min ' + minLen + ' chars, max ' + maxLen + ' chars (strictly < 1000 char SQL limit)');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runLogoGeneration();
}
