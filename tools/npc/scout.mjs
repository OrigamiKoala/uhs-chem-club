#!/usr/bin/env node
/**
 * scout.mjs — survey a Learn world's walkable ground for crew posts (an aid, not a check).
 *
 *   node tools/npc/scout.mjs <world> [--floor lo,hi] [--step 0.3] [--json out.json]
 *
 * Builds the world headlessly, closes the same walk grid the crew use (`src/npc/crew-sim.js`), floods it
 * from the spawn and prints: the reachable area and its ground heights, the arena, and for each landmark
 * the nearest reachable spot that is clear by 0.6 m (a candidate post, facing the landmark).
 */
import { writeFileSync } from 'node:fs';
const { installDomShim } = await import('../lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const { CREW_WORLDS } = await import('../../src/npc/crews.js');

const name = process.argv[2];
const arg = k => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : null; };
const cfg = CREW_WORLDS.find(w => w.key === name);
if (!cfg) { console.error(`worlds: ${CREW_WORLDS.map(w => w.key).join(', ')}`); process.exit(2); }
const mod = await import(`../../src/three/${cfg.module}.js`);
const world = new mod[cfg.className](null);
// After the world module: bench-bay.js sits in an import cycle with some worlds' station files.
const { bayBoxes } = await import('../../src/three/bench-bay.js');
const { WalkGrid, bayRects } = await import('../../src/npc/crew-sim.js');
const sp = world.data.spawn.pos || world.data.spawn;
const spawn = [sp[0], sp[2]];
const ground = world.getTerrainHeight(spawn[0], spawn[1]);
const floor = arg('floor') ? arg('floor').split(',').map(Number) : [ground - 40, ground + 40];
const step = arg('step') ? Number(arg('step')) : 0.3;
const B = Number(arg('bounds') || 130);
const t0 = Date.now();
const grid = new WalkGrid(world, bayRects(world, bayBoxes), { bounds: B, floor, maxStep: step });
console.log(`${name}: grid ${grid.NI}x${grid.NJ} in ${Date.now() - t0} ms; ${world.colliders.length} colliders; spawn [${spawn}] ground ${ground.toFixed(2)}`);

// Flood from the spawn.
const [si, sj] = grid.cellOf(...spawn);
const seen = new Uint8Array(grid.NI * grid.NJ);
const q = [];
outer: for (let r = 0; r < 10; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
  if (grid.open(si + di, sj + dj)) { q.push([si + di, sj + dj]); seen[(si + di) * grid.NJ + sj + dj] = 1; break outer; }
}
let n = 0, lo = Infinity, hi = -Infinity, bx = [Infinity, -Infinity], bz = [Infinity, -Infinity];
const hist = new Map();
const reach = [];
while (q.length) {
  const [i, j] = q.pop();
  n++;
  const [x, z] = grid.center(i, j);
  const y = world.getTerrainHeight(x, z);
  lo = Math.min(lo, y); hi = Math.max(hi, y);
  bx = [Math.min(bx[0], x), Math.max(bx[1], x)]; bz = [Math.min(bz[0], z), Math.max(bz[1], z)];
  hist.set(Math.round(y), (hist.get(Math.round(y)) || 0) + 1);
  reach.push([x, z, y]);
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + a, nj = j + b;
    if (grid.open(ni, nj) && !seen[ni * grid.NJ + nj]) { seen[ni * grid.NJ + nj] = 1; q.push([ni, nj]); }
  }
}
console.log(`reachable ${(n * 0.25).toFixed(0)} m², x ${bx.map(v => v.toFixed(0))}, z ${bz.map(v => v.toFixed(0))}, ground ${lo.toFixed(1)}..${hi.toFixed(1)}`);
console.log('ground heights (m: m²):', [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([h, c]) => `${h}:${c / 4}`).join(' '));
console.log('arena', JSON.stringify(world.data.arena || null));
console.log('sites', world.data.sites.map(s => `${s.questId}@[${(s.approachPos || s.pos)[0]},${(s.approachPos || s.pos)[2]}]`).join(' '));

const reachSet = seen;
const near = (x, z) => {
  let best = null, bd = Infinity;
  for (const [rx, rz] of reach) {
    const d = Math.hypot(rx - x, rz - z);
    if (d < bd && !grid.blockedAt(rx, rz, 0.6)) { bd = d; best = [rx, rz]; }
  }
  return best ? { pos: best, d: bd } : null;
};
const marks = [];
const seenAsset = new Map();
for (const l of world.data.landmarks || []) {
  const k = l.asset || l.id || l.kind || 'mark';
  const c = seenAsset.get(k) || 0;
  if (c >= 3) continue;
  seenAsset.set(k, c + 1);
  const p = l.pos || l.position;
  if (!p) continue;
  const x = p[0], z = p.length > 2 ? p[2] : p[1];
  const s = near(x, z);
  if (s) marks.push({ mark: k, at: [x, z], post: s.pos, d: +s.d.toFixed(1) });
}
for (const m of marks) console.log(`  ${m.mark.padEnd(26)} [${m.at.map(v => v.toFixed(1))}] -> post [${m.post}] (${m.d} m)`);
if (arg('json')) writeFileSync(arg('json'), JSON.stringify({ spawn, ground, lo, hi, bx, bz, marks, reach: reach.filter((_, i) => i % 9 === 0).map(r => r.map(v => +v.toFixed(2))) }));
void reachSet;
