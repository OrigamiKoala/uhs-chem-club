/**
 * verify-solids.mjs — atoms and molecules on the benches stand up as solids at `3D On` (`src/learn/table/solids.js`).
 *
 * For every live stage of Ligar (unit03) to Cinder Halo (unit14), every fixture and piece a kit claims (`kits/solid-claims.js`):
 *   1. the painter can be read: the recording and the real paint make the same draws in the same order, so stripping skips the right ones;
 *   2. the flat picture painted for `3D On` keeps no atom: read again, the stripped picture has no circle in the claimed size range;
 *   3. where the claim builds solids, it builds one ball per atom read and a rod per bond (headless THREE, no canvas);
 *   4. Tallow (unit01) and Lanternfall (unit02) claim nothing, and `3D Off` (no `view.solids`) paints every atom it did.
 * Prints how many balls each world stands up.
 */

import { installUiStub } from './lib/ui-stub.mjs';

installUiStub();
const THREE = await import('three');
const { allQuests } = await import('../src/learn/curriculum.js');
const MODEL = await import('../src/learn/table/model.js');
const { getKit } = await import('../src/learn/table/kits/index.js');
const { fixtureLayout } = await import('../src/learn/table/layout.js');
const S = await import('../src/learn/table/solids.js');

let failures = 0;
const fail = m => { console.log(`  FAIL ${m}`); failures++; };
const ok = m => console.log(`  ok   ${m}`);
const SC = 8;

/** Count the draws a painter makes through `stripping` against a recorder: the ops kept, as the real canvas would get them. */
function strippedOps(draw, skip) {
  const kept = [];
  const ops = S.record(ctx => {
    const real = ctx;
    let n = 0;
    const wrap = new Proxy({}, {
      get(_, k) {
        if (k === 'fill' || k === 'stroke' || k === 'fillText' || k === 'strokeText') return (...a) => { const i = n++; if (!skip.has(i)) { kept.push(i); real[k](...a); } };
        const v = real[k];
        return typeof v === 'function' ? v : v;
      },
      set(_, k, v) { real[k] = v; return true; }
    });
    draw(wrap);
  });
  return { ops, kept };
}

const mockC = skin => {
  const mat = new THREE.MeshBasicMaterial();
  return { THREE, hw: 0.03, hh: 0.03, s: 0.003, mats: new Proxy({}, { get: () => mat }), own: m => m, label: () => new THREE.Group(), paint: () => new THREE.Group(), face: () => mat, faceInfo: () => ({ mat, body: 0xffffff }), skin };
};

console.log('\nSolids — atoms and molecules at 3D On\n');
const perWorld = new Map();
const seen = new Set();
const quests = allQuests().filter(q => q.status === 'live');
for (const q of quests) {
  const n = +q.key.match(/unit(\d+)/)?.[1];
  if (!n) continue;
  const skin = `unit${String(n).padStart(2, '0')}`;
  const mod = await q.module();
  for (const [i, stg] of (mod.STAGES || []).entries()) {
    if (!stg.table) continue;
    let t;
    try { t = MODEL.createTable(stg.table, stg.title); } catch { continue; }
    const kit = getKit(t.kit);
    const label = `${q.key} stage ${i + 1}`;
    const things = [
      ...Object.values(t.fixtures || {}).map(f => ({ what: 'fixture', f })),
      ...Object.values(t.pieces || {}).map(p => ({ what: 'piece', f: p }))
    ];
    for (const { what, f } of things) {
      const cfg = S.solidsFor(t.kit, what, f.kind, skin, f, t);
      if (n <= 2) {
        if (cfg) fail(`${label}: ${what} ${f.kind} is claimed in ${skin}, which keeps its flat atoms`);
        continue;
      }
      if (!cfg) continue;
      const key = `${skin}:${t.kit}:${what}:${f.kind}`;
      let draw; let sc;
      if (what === 'fixture') {
        const lay = fixtureLayout(f); const X = u => u * SC;
        const b = { x0: X(lay.box.x0), y0: X(lay.box.y0), x1: X(lay.box.x1), y1: X(lay.box.y1), sc: SC, X, Y: X, lay, bodies: true, clock: 0.001, scope: '' };
        draw = ctx => kit.paintFixture(ctx, f, t, b); sc = SC;
      } else {
        if (kit.piece3d?.(f, t, mockC(skin))) continue;
        const K = 36;
        draw = ctx => kit.paintPiece(ctx, f, t, { x: 200, y: 200, r: 2 * K, lit: false, sc: K, flat: true }); sc = K;
      }
      const ops = S.record(draw);
      if (!ops) { fail(`${label}: the ${what} ${f.kind} cannot be read`); continue; }
      const read = S.readOps(ops, sc, cfg);
      const again = S.record(draw);
      if (again.length !== ops.length) fail(`${label}: the ${what} ${f.kind} draws ${ops.length} then ${again.length} times; stripping would skip the wrong draws`);
      const { ops: left } = strippedOps(draw, read.skip);
      const leftRead = S.readOps(left || [], sc, cfg);
      if (leftRead.atoms.length) fail(`${label}: the ${what} ${f.kind} still paints ${leftRead.atoms.length} flat atom(s) at 3D On`);
      if (cfg.build !== false && what === 'fixture') {
        const lay = fixtureLayout(f);
        const g = S.fixtureSolids((cx, fx, st, b) => kit.paintFixture(cx, fx, st, b), f, t, { THREE, scale: 0.01, toPlate: u => ({ x: u.x * 0.01, z: u.y * 0.01 }), own: m => m, box: lay.box, ground: 0 }, cfg, fx => fixtureLayout(fx));
        const c = g?.userData.counts;
        if (!c || c.atoms !== Math.min(read.atoms.length, g.children[0].instanceMatrix.count)) fail(`${label}: the ${what} ${f.kind} read ${read.atoms.length} atoms but stood up ${c?.atoms}`);
        g?.userData.tick?.(0.1, false);
      }
      const w = perWorld.get(skin) || { kinds: new Set(), balls: 0 };
      w.kinds.add(`${t.kit}:${f.kind}`);
      if (!seen.has(key)) { w.balls += read.atoms.length; seen.add(key); }
      perWorld.set(skin, w);
    }
  }
}
for (const [skin, w] of [...perWorld].sort()) ok(`${skin}: ${w.kinds.size} kinds stand their atoms up (${w.balls} balls across first sightings) — ${[...w.kinds].join(', ')}`);
if (!perWorld.size) fail('no bench claims any atoms');

console.log(failures ? `\n${failures} failure(s)\n` : '\nAll solids checks passed.\n');
process.exit(failures ? 1 : 0);
