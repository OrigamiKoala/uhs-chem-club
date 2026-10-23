/**
 * verify-docs.mjs — the docs may not drift from the code.
 *
 * Holds PRODUCT.md's counts to the curriculum registry, keeps retired wording out of the
 * four live docs, and checks that every file path the docs name still exists.
 *
 * Run with `npm run verify:docs`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = m => { console.error(`  FAIL ${m}`); failures++; };
const ok = m => console.log(`  ok   ${m}`);

const memory = new Map();
globalThis.localStorage = {
  getItem: k => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: k => memory.delete(k),
  clear: () => memory.clear()
};
const noop = () => {};
globalThis.window = globalThis.window || { addEventListener: noop, removeEventListener: noop, location: { hash: '' }, matchMedia: () => ({ matches: false }) };

const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const LIVE_DOCS = ['PRODUCT.md', 'CLAUDE.md', 'DESIGN.md', 'README.md', 'docs/engineering/engine-and-worlds.md'];

/* ---- the counts in PRODUCT.md are the registry's ---- */
{
  const C = await import('../src/learn/curriculum.js');
  let quests = 0, bosses = 0, stages = 0;
  for (const w of C.WORLDS) {
    for (const q of w.quests) {
      const mod = await C.loadQuestModule(q);
      if (!mod) continue;
      quests++;
      if (String(q.id || q.key).includes('boss-')) bosses++;
      stages += mod.meta?.stageCount || 0;
    }
  }
  const actual = { worlds: C.TOTAL_WORLDS, built_worlds: C.LIVE_WORLDS.length, quests, benches: quests - bosses, bosses, stages };
  const m = read('PRODUCT.md').match(/<!--\s*facts:\s*([^>]*?)\s*-->/);
  if (!m) fail('PRODUCT.md has no <!-- facts: ... --> line');
  else {
    const stated = Object.fromEntries(m[1].trim().split(/\s+/).map(kv => kv.split('=')).map(([k, v]) => [k, Number(v)]));
    const bad = Object.keys(actual).filter(k => stated[k] !== actual[k]);
    bad.length
      ? fail(`PRODUCT.md facts disagree with the registry: ${bad.map(k => `${k} says ${stated[k]}, registry has ${actual[k]}`).join('; ')}`)
      : ok(`PRODUCT.md facts match the registry (${JSON.stringify(actual)})`);
    // The prose repeats the numbers; they must agree with the facts line too.
    const prose = read('PRODUCT.md');
    const need = [`${actual.quests} quest modules: ${actual.benches} benches and ${actual.bosses} bosses, ${actual.stages} stages`];
    for (const n of need) prose.includes(n) ? ok(`PRODUCT.md prose says "${n}"`) : fail(`PRODUCT.md prose does not say "${n}"`);
  }
}

/* ---- retired wording stays out of the live docs ---- */
{
  const banned = [
    [/elementary/i, 'the audience is 12 to 17 (PRODUCT.md, Users)'],
    [/\[Objective\]|\[Fold Panel\]/, 'the stage buttons are Tour, Findings, Hint, Submit, Undo, Start Over, Hide Panel, Leave Bench'],
    [/STAGE MISSION|Objective & Guide(?!.*archived)/, 'the guide modal is archived'],
    [/\bday streak\b|daily streak/i, 'the Drill Deck streak is weekly'],
    [/Avalon DB/, 'the sheet has seven tabs and no such name'],
    [/stabilized, never killed|monster combat \("takes/i, 'foes are dispersed, never killed; only bosses fight'],
    [/\bT3\b.*Chromebook|\bT2\b.*Chromebook/i, 'graphics are 3D On (T4) and 3D Off (T1)']
  ];
  let bad = 0;
  for (const f of LIVE_DOCS) {
    read(f).split('\n').forEach((line, i) => {
      for (const [re, why] of banned) {
        if (re.test(line)) { fail(`${f}:${i + 1} ${why}: "${line.trim().slice(0, 80)}"`); bad++; }
      }
    });
  }
  if (!bad) ok('no retired wording in the live docs');
}

/* ---- every path a doc names still exists ---- */
{
  const roots = /^(docs|src|tools|archive|apps-script|api|public|assets-src)\//;
  let bad = 0, seen = 0;
  for (const f of LIVE_DOCS) {
    const text = read(f);
    for (const m of text.matchAll(/`([^`\s]+)`/g)) {
      const p = m[1].replace(/[.,;:)]+$/, '').replace(/:\d+$/, '');
      if (!roots.test(p) || /[*<>{}…\[]|\.\.\.|\$/.test(p)) continue;
      seen++;
      const hit = fs.existsSync(path.join(root, p)) || fs.existsSync(path.join(root, p.replace(/\/$/, '')));
      if (!hit) { fail(`${f} names ${p}, which does not exist`); bad++; }
    }
  }
  if (!bad) ok(`${seen} file paths named in the live docs all exist`);
}

/* ---- the chain runs this check ---- */
{
  const pkg = JSON.parse(read('package.json'));
  /verify:docs/.test(pkg.scripts.verify) ? ok('npm run verify runs verify:docs') : fail('npm run verify does not run verify:docs');
}

if (failures) { console.log(`\nDOCS FAILED (${failures})`); process.exit(1); }
console.log('\nDOCS OK');
process.exit(0);
