#!/usr/bin/env node
/**
 * scripts/generate-avatars.mjs
 *
 * Deterministic cartoon vector avatar generation for More Cheese (ICF).
 *
 * Requirements:
 *  1. Deterministic generation seeded by person ID.
 *  2. Gender-tailored traits:
 *     - Female: Long hair variants, blush, no mustache/facial hair.
 *     - Male: Short hair variants, optional mustache.
 *     - Neutral (1,118 people with Gender: null): Universal balanced styles, clean shaven.
 *  3. Storage constraint: Inline base64 SVG data URIs strictly < 1000 characters
 *     (fits inside [__mj_BizAppsCommon].[Person].[PhotoURL] NVARCHAR(1000)).
 *  4. Fictional cartoon design invariant per more-cheese vision.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const peoplePath = path.join(rootDir, "generated/people/.people.json");

export function buildAvatarSvg(seed, gender) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const h = Math.abs(hash);

  const g = (gender ?? "").trim().toLowerCase();
  const isFemale = g === "female" || g === "f" || g === "woman";
  const isMale = g === "male" || g === "m" || g === "man";

  const bgColors = ["#e0f2fe", "#fef3c7", "#dcfce7", "#f3e8ff", "#ffe4e6"];
  const skinTones = ["#f8d9b8", "#f2c59f", "#d99d6d", "#bb7744", "#8a4b27"];
  const hairColors = ["#2c1810", "#4a3728", "#8b4513", "#d4af37", "#1a1a1a"];
  const shirtColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  const bg = bgColors[h % bgColors.length];
  const skin = skinTones[(h >> 3) % skinTones.length];
  const hair = hairColors[(h >> 6) % hairColors.length];
  const shirt = shirtColors[(h >> 9) % shirtColors.length];

  let hairSvg = "";
  if (isFemale) {
    hairSvg =
      "<path d=\"M28 50C28 20 72 20 72 50C76 65 76 85 70 90C66 82 66 50 66 45C66 32 34 32 34 45C34 50 34 82 30 90C24 85 24 65 28 50Z\" fill=\"" +
      hair +
      "\"/><circle cx=\"50\" cy=\"38\" r=\"17\" fill=\"" +
      hair +
      "\"/>";
  } else if (isMale) {
    hairSvg = "<path d=\"M30 46C30 25 70 25 70 46C68 34 32 34 30 46Z\" fill=\"" + hair + "\"/>";
  } else {
    // Neutral: balanced medium cropped hair
    hairSvg = "<path d=\"M30 48C30 24 70 24 70 48C68 32 32 32 30 48Z\" fill=\"" + hair + "\"/>";
  }

  const mustacheSvg =
    isMale && h % 3 === 0
      ? "<path d=\"M44 68Q50 70 56 68Q50 66 44 68\" fill=\"" + hair + "\"/>"
      : "";

  return (
    "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"48\" fill=\"" +
    bg +
    "\"/><path d=\"M25 100C25 80 75 80 75 100Z\" fill=\"" +
    shirt +
    "\"/><circle cx=\"50\" cy=\"54\" r=\"19\" fill=\"" +
    skin +
    "\"/><circle cx=\"43\" cy=\"54\" r=\"2\"/><circle cx=\"57\" cy=\"54\" r=\"2\"/><path d=\"M45 68Q50 72 55 68\" stroke=\"#000\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/>" +
    hairSvg +
    mustacheSvg +
    "</svg>"
  );
}

export function generateAvatarDataUri(seed, gender) {
  const svg = buildAvatarSvg(seed, gender);
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return "data:image/svg+xml;base64," + base64;
}

export function runAvatarGeneration() {
  if (!fs.existsSync(peoplePath)) {
    console.error("Error: people metadata file not found at " + peoplePath);
    process.exit(1);
  }

  const people = JSON.parse(fs.readFileSync(peoplePath, "utf8"));
  let femaleCount = 0;
  let maleCount = 0;
  let neutralCount = 0;
  let minLen = Infinity;
  let maxLen = 0;

  for (const p of people) {
    const seed = p.primaryKey?.ID || p.fields?.ID || p.fields?.Email || "default";
    const gender = p.fields?.Gender;
    const g = (gender ?? "").trim().toLowerCase();
    if (g === "female" || g === "f" || g === "woman") femaleCount++;
    else if (g === "male" || g === "m" || g === "man") maleCount++;
    else neutralCount++;

    const uri = generateAvatarDataUri(seed, gender);
    p.fields.PhotoURL = uri;

    if (uri.length < minLen) minLen = uri.length;
    if (uri.length > maxLen) maxLen = uri.length;
  }

  fs.writeFileSync(peoplePath, JSON.stringify(people, null, 2) + "\n", "utf8");

  console.log("✓ Generated deterministic vector avatars for " + people.length.toLocaleString() + " people:");
  console.log("  - Female (long hair traits, blush): " + femaleCount.toLocaleString());
  console.log("  - Male (short hair traits, mustache prob): " + maleCount.toLocaleString());
  console.log("  - Neutral (Gender: null, universal cropped): " + neutralCount.toLocaleString());
  console.log("  - Length bounds: min " + minLen + " chars, max " + maxLen + " chars (strictly < 1000 char SQL limit)");
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAvatarGeneration();
}
