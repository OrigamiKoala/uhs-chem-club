#!/usr/bin/env node
/**
 * teaching-report — a reading aid for the teaching pass (docs/teaching-pass/BRIEF.md). Not a check and not in `npm run verify`.
 *
 *   node tools/teaching-report.mjs unit04              fault flags per stage, then totals
 *   node tools/teaching-report.mjs unit04 q3-ideal     the same for one bench
 *   node tools/teaching-report.mjs unit04 q3-ideal --read   that bench as plain text, in play order (omit the quest for the whole world)
 *   node tools/teaching-report.mjs all --totals        one line per world
 *
 * A flag says where to look first. A stage with no flags can still fail the standard, and a flagged stage can be fine:
 * the standard is the seven criteria in the brief, judged by reading the stage. Do not edit text to clear a flag.
 * Word lists: tools/teaching-words.json.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';

const memory = new Map(); const noop = () => {};
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k), clear: () => memory.clear() };
globalThis.window = { addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), location: { hash: '' }, devicePixelRatio: 1 };
globalThis.document = { addEventListener: noop, removeEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getContext: () => null, setAttribute: noop }) };

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const [unitArg, questArg] = args.filter(a => !a.startsWith('--'));
const WORDS = JSON.parse(readFileSync(join(root, 'tools/teaching-words.json'), 'utf8'));

const get = (o, k) => { try { return o[k]; } catch { return null; } };
const arr = v => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
const text = v => (typeof v === 'string' ? v : v == null ? '' : Array.isArray(v) ? v.map(text).join(' ') : typeof v === 'object' ? text(v.text ?? v.body ?? '') : String(v));
const words = s => (s.trim() ? s.trim().split(/\s+/).length : 0);
const sentences = s => s.split(/[.?!](?:\s|$)/).filter(x => x.trim()).length;
const found = (s, list) => [...new Set(list.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(s)))];

async function load(unit) {
  const dir = join(root, 'src/learn/quests', unit);
  const out = [];
  for (const f of readdirSync(dir).filter(x => x.endsWith('.js')).sort()) {
    const quest = f.replace('.js', '');
    if (questArg && quest !== questArg) continue;
    const m = await import(pathToFileURL(join(dir, f)));
    (m.STAGES || []).forEach((st, i) => {
      const reward = get(st, 'reward');
      const table = get(st, 'table') || {};
      out.push({
        quest, no: i + 1, title: text(get(st, 'title')), predict: !!get(st, 'predict'), boss: !!get(st, 'encounter'),
        briefing: text(get(st, 'briefing')), worked: (get(get(st, 'briefing') || {}, 'worked') || []).map(String), prompt: text(get(st, 'prompt')),
        hints: (get(st, 'hints') || []).map(text),
        reward: reward ? text(get(reward, 'body')) : '',
        typed: !!get(st, 'entry'),
        fixtures: arr(table.fixtures).map(x => x.kind + (x.label ? ` "${x.label}"` : '')),
        pieces: [...new Set(arr(table.pieces).map(x => x.kind))],
        labels: [...arr(table.fixtures), ...arr(table.pieces), ...arr(table.zones)].map(x => x && x.label).filter(Boolean).map(text)
      });
    });
  }
  return out;
}

function faults(s) {
  const f = [];
  const play = [s.briefing, s.prompt, ...s.hints, s.reward, ...s.labels].join(' ');
  if (words(s.prompt) > 25) f.push(`prompt ${words(s.prompt)}w`);
  if (/!/.test(s.prompt)) f.push('prompt "!"');
  if (!s.predict && new RegExp(`^(${WORDS.operationOpeners.join('|')})\\b`, 'i').test(s.prompt)) f.push('prompt opens with an operation');
  if (/\bthen\b|;/.test(s.prompt)) f.push('prompt has two steps');
  if (s.hints.length !== 3) f.push(`${s.hints.length} hints`);
  s.hints.forEach((h, i) => { if (sentences(h) > 1) f.push(`hint ${i + 1} is ${sentences(h)} sentences`); });
  const h3 = s.hints[2] || '';
  if (!s.predict && /^(place|set|select|put|add|form|type|choose|pick|lay|drag|order|sort)\b/i.test(h3)) f.push('hint 3 is the move');
  if (/\d\s*[+×*/÷−-]\s*\d|\bdivided by\b.*\d|\d.*\b(gives|equals|is)\b\s*-?\d/.test(h3)) f.push('hint 3 has arithmetic');
  if (!s.predict) {
    if (words(s.reward) > 40) f.push(`reward ${words(s.reward)}w`);
    else if (sentences(s.reward) > 2) f.push(`reward ${sentences(s.reward)} sentences`);
  }
  if (s.typed) f.push(s.fixtures.length ? 'typed number' : 'typed number, no instrument');
  else if (!s.predict && !s.boss && !s.fixtures.length) f.push('no instrument (cards only)');
  const e = found(play, WORDS.euphemism); if (e.length) f.push(`vague: ${e.join(', ')}`);
  const j = found(play, WORDS.register); if (j.length) f.push(`register: ${j.join(', ')}`);
  const m = found(play, WORDS.motive); if (m.length) f.push(`motive: ${m.join(', ')}`);
  if ([s.briefing, s.prompt, ...s.hints, s.reward].some(t => /\b([a-z]{3,}) \1\b/i.test(t))) f.push('doubled word');
  return f;
}

function read(stages) {
  let q = '';
  for (const s of stages) {
    if (s.quest !== q) { q = s.quest; console.log(`\n# ${q}`); }
    console.log(`\n## ${s.no}. ${s.title}${s.predict ? ' [predict]' : ''}${s.typed ? ' [typed]' : ''}`);
    console.log(`table: ${[...s.fixtures, ...s.pieces.map(p => `${p} pieces`)].join('; ') || 'none'}`);
    if (s.labels.length) console.log(`labels: ${[...new Set(s.labels)].join(' | ')}`);
    if (s.briefing) console.log(`briefing: ${s.briefing}`);
    if (s.worked?.length) console.log(`worked case under the briefing: ${s.worked.join(' / ')}`);
    console.log(`prompt: ${s.prompt}`);
    s.hints.forEach((h, i) => console.log(`hint ${i + 1}: ${h}`));
    console.log(`reward (${words(s.reward)}w): ${s.reward}`);
  }
}

function totals(unit, stages) {
  const n = k => stages.filter(s => faults(s).some(x => x.startsWith(k))).length;
  const benches = new Set(stages.map(s => s.quest)).size;
  return `${unit}: ${stages.length} stages in ${benches} modules | briefing ${stages.filter(s => s.briefing).length} | typed ${stages.filter(s => s.typed).length} (no instrument ${n('typed number, no')}) | cards only ${n('no instrument')} | reward long ${n('reward')} | operation prompt ${n('prompt opens')} | hint 3 move/arithmetic ${n('hint 3')} | vague ${n('vague')} | register ${n('register')} | motive ${n('motive')}`;
}

const units = unitArg === 'all' || !unitArg
  ? readdirSync(join(root, 'src/learn/quests')).filter(x => /^unit\d+$/.test(x)).sort()
  : [unitArg];
for (const unit of units) {
  const stages = await load(unit);
  if (flag('--read')) { read(stages); continue; }
  if (!flag('--totals')) {
    let q = '';
    for (const s of stages) {
      if (s.quest !== q) { q = s.quest; console.log(`\n${q}`); }
      const f = faults(s);
      console.log(`  ${String(s.no).padStart(2)} ${s.title}${s.predict ? ' [predict]' : ''}: ${f.join('; ') || '-'}`);
    }
    console.log('');
  }
  console.log(totals(unit, stages));
}
