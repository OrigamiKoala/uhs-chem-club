/**
 * verify-media.mjs — Integrity check for video loops and cinematics manifest.
 *
 * Verifies that:
 * 1. Every entry in MEDIA_MANIFEST has required fields (id, kind, poster).
 * 2. Every cinematic has a non-empty caption track.
 * 3. Fallback poster files exist in public/art/ or public/video/.
 * 4. If baked video files exist in public/video/, they obey size budgets:
 *    - Loop <= 1.5 MB
 *    - Cinematic <= 3.0 MB
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MEDIA_MANIFEST } from '../src/media/manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

console.log('Media Manifest & Asset Integrity Check\n');

const entries = Object.values(MEDIA_MANIFEST);
if (entries.length === 0) {
  fail('MEDIA_MANIFEST is empty');
}

const LOOP_BUDGET = 1.5 * 1024 * 1024;       // 1.5 MB
const CINEMATIC_BUDGET = 3.0 * 1024 * 1024;  // 3.0 MB

for (const item of entries) {
  const label = item.id || 'unnamed';

  if (!item.id) fail('item missing id');
  if (item.kind !== 'loop' && item.kind !== 'cinematic') {
    fail(`${label}: kind must be "loop" or "cinematic", found "${item.kind}"`);
  }

  // Check fallback poster exists
  if (!item.poster) {
    fail(`${label}: missing poster`);
  } else {
    const posterPath = path.join(ROOT, 'public', item.poster.replace(/^\//, ''));
    if (!fs.existsSync(posterPath)) {
      fail(`${label}: poster "${item.poster}" not found on disk`);
    }
  }

  // Cinematics require captions
  if (item.kind === 'cinematic') {
    if (!Array.isArray(item.captions) || item.captions.length === 0) {
      fail(`${label}: cinematic missing caption track`);
    } else {
      for (const cap of item.captions) {
        if (typeof cap.start !== 'number' || typeof cap.end !== 'number' || !cap.text) {
          fail(`${label}: malformed caption entry in track`);
        }
      }
    }
  }

  // If video files exist, verify size limits
  if (Array.isArray(item.sources)) {
    const budget = item.kind === 'loop' ? LOOP_BUDGET : CINEMATIC_BUDGET;
    for (const src of item.sources) {
      const vidPath = path.join(ROOT, 'public', src.src.replace(/^\//, ''));
      if (fs.existsSync(vidPath)) {
        const stats = fs.statSync(vidPath);
        if (stats.size > budget) {
          fail(`${label}: ${src.src} (${(stats.size / 1024 / 1024).toFixed(2)} MB) exceeds budget of ${(budget / 1024 / 1024).toFixed(1)} MB`);
        }
      }
    }
  }
}

if (failures === 0) {
  ok(`all ${entries.length} media manifest items valid and captioned`);
}

console.log(`\n${failures === 0 ? 'MEDIA OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
