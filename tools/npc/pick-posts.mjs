#!/usr/bin/env node
/**
 * pick-posts.mjs — propose a world's crew posts (an authoring aid; the result is pasted into
 * `src/npc/crews/<world>.js` and held there by `verify:npc`, which is the real check).
 *
 *   node tools/npc/pick-posts.mjs <world> [--n 18] [--out file.json]
 *
 * Uses the world's walk settings from `src/npc/crews.js`. A post is reachable from the spawn, clear by
 * 0.8 m, at least 7 m from every bench's approach and every other post, off the boss arena. Posts by a
 * landmark come first (one per kind of landmark, then more), facing it; the rest are spread out by
 * farthest-point sampling and face the nearest landmark. They are then dealt into six rounds of three
 * neighbouring posts, one round per crew member, plus a spot for a side task's item.
 */
import { writeFileSync } from 'node:fs';
const { installDomShim } = await import('../lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const { CREW_WORLDS, walkFor, keepOffFor } = await import('../../src/npc/crews.js');

const key = process.argv[2];
const arg = k => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : null; };
const cfg = CREW_WORLDS.find(w => w.key === key);
if (!cfg) { console.error(`worlds: ${CREW_WORLDS.map(w => w.key).join(', ')}`); process.exit(2); }
const mod = await import(`../../src/three/${cfg.module}.js`);
const world = new mod[cfg.className](null);
const { bayBoxes } = await import('../../src/three/bench-bay.js');
const { WalkGrid, bayRects } = await import('../../src/npc/crew-sim.js');

const N = Number(arg('n') || 18);
const walk = walkFor(cfg.key, world);
const grid = new WalkGrid(world, bayRects(world, bayBoxes), walk);
const keepOff = keepOffFor(world);
const sp = world.data.spawn.pos || world.data.spawn;
const spawn = [sp[0], sp[2]];
const sites = world.data.sites.map(s => { const p = s.approachPos || s.pos; return [p[0], p[2]]; });
const inKeepOff = (x, z, pad = 0) => keepOff.some(k => Math.hypot(x - k.x, z - k.z) < k.radius + pad);

// Reachable cells, flooded from the spawn.
const seen = new Uint8Array(grid.NI * grid.NJ);
const q = [];
const [si, sj] = grid.cellOf(...spawn);
outer: for (let r = 0; r < 10; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
  if (grid.open(si + di, sj + dj)) { q.push([si + di, sj + dj]); seen[(si + di) * grid.NJ + sj + dj] = 1; break outer; }
}
const reach = [];
while (q.length) {
  const [i, j] = q.pop();
  const [x, z] = grid.center(i, j);
  reach.push([x, z]);
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + a, nj = j + b;
    if (grid.open(ni, nj) && !seen[ni * grid.NJ + nj]) { seen[ni * grid.NJ + nj] = 1; q.push([ni, nj]); }
  }
}
const good = reach.filter(([x, z]) => !grid.blockedAt(x, z, 0.8) && !inKeepOff(x, z, 2) && sites.every(s => Math.hypot(s[0] - x, s[1] - z) > 7));
const marks = (world.data.landmarks || []).map(l => {
  const p = l.pos || l.position;
  return p ? { kind: l.asset || l.id || 'mark', x: p[0], z: p.length > 2 ? p[2] : p[1], r: l.radius || 1 } : null;
}).filter(Boolean).filter(m => m.kind !== 'landing-pad' && m.kind !== 'lamp-post' && m.kind !== 'lantern-post');

const posts = [];
const far = (x, z, d) => posts.every(p => Math.hypot(p.pos[0] - x, p.pos[1] - z) >= d);
// Landmarks: one of each kind first, then seconds.
const byKind = new Map();
for (const m of marks) { if (!byKind.has(m.kind)) byKind.set(m.kind, []); byKind.get(m.kind).push(m); }
for (let round = 0; round < 3 && posts.length < N; round++) {
  for (const [kind, list] of byKind) {
    const m = list[round];
    if (!m || posts.length >= N) continue;
    let best = null, bd = Infinity;
    for (const [x, z] of good) {
      const d = Math.hypot(x - m.x, z - m.z);
      if (d < bd && d > m.r + 0.8 && far(x, z, 7)) { bd = d; best = [x, z]; }
    }
    if (best && bd < m.r + 6) posts.push({ name: `${kind}-${round + 1}`, pos: best, look: [m.x, m.z] });
  }
}
// Fill by farthest point, among ground where people work: within 24 m of a bench or a landmark (lamps
// included), so nobody stands out at the edge of the map.
const nearestMark = (x, z) => marks.reduce((b, m) => (Math.hypot(m.x - x, m.z - z) < Math.hypot(b.x - x, b.z - z) ? m : b), marks[0] || { x: 0, z: 0 });
const anchors = [...sites, spawn, ...(world.data.landmarks || []).map(l => l.pos || l.position).filter(Boolean).map(p => [p[0], p.length > 2 ? p[2] : p[1]])];
const worked = good.filter(([x, z]) => anchors.some(a => Math.hypot(a[0] - x, a[1] - z) < 24));
const nearestSite = (x, z) => world.data.sites.reduce((b, s) => {
  const p = s.approachPos || s.pos, d = Math.hypot(p[0] - x, p[2] - z);
  return d < b.d ? { s, d } : b;
}, { s: null, d: Infinity }).s;
let fill = 1;
while (posts.length < N) {
  let best = null, bd = -1;
  for (let k = 0; k < worked.length; k += 2) {
    const [x, z] = worked[k];
    const d = posts.length ? Math.min(...posts.map(p => Math.hypot(p.pos[0] - x, p.pos[1] - z))) : Math.hypot(x - spawn[0], z - spawn[1]);
    if (d > bd) { bd = d; best = [x, z]; }
  }
  if (!best || bd < 7) break;
  const m = nearestMark(...best);
  const look = Math.hypot(m.x - best[0], m.z - best[1]) < 40 ? [m.x, m.z] : [spawn[0], spawn[1]];
  const site = nearestSite(...best);
  posts.push({ name: `${site ? site.questId.split('-').slice(1).join('-') : 'ground'}-${fill++}`, pos: best, look });
}

// Rounds: six seeds far apart, each takes its two nearest free posts.
const free = new Set(posts.map((_, i) => i));
const rounds = [];
const dist = (a, b) => Math.hypot(posts[a].pos[0] - posts[b].pos[0], posts[a].pos[1] - posts[b].pos[1]);
while (rounds.length < 6 && free.size >= 3) {
  let seed = null, sd = -Infinity;
  for (const i of free) {
    const d = rounds.length ? Math.min(...rounds.flat().map(j => dist(i, j))) : -Math.hypot(posts[i].pos[0] - spawn[0], posts[i].pos[1] - spawn[1]);
    if (d > sd) { sd = d; seed = i; }
  }
  free.delete(seed);
  const near = [...free].sort((a, b) => dist(seed, a) - dist(seed, b)).slice(0, 2);
  for (const n of near) free.delete(n);
  rounds.push([seed, ...near]);
}
// The task's item: clear, reachable, not on a post, ideally by a landmark.
let item = null;
for (const [x, z] of good) {
  if (posts.some(p => Math.hypot(p.pos[0] - x, p.pos[1] - z) < 5)) continue;
  const m = nearestMark(x, z);
  const d = Math.hypot(m.x - x, m.z - z) - (m.r || 1);
  if (d > 1 && d < 4 && Math.hypot(x - spawn[0], z - spawn[1]) > 25) { item = { pos: [x, z], by: m.kind }; break; }
}

if (!item) {
  // No landmark by open ground: the worked spot nearest 35 m from the spawn, clear of every post.
  let bd = Infinity;
  for (const [x, z] of worked) {
    if (posts.some(p => Math.hypot(p.pos[0] - x, p.pos[1] - z) < 5)) continue;
    const d = Math.abs(Math.hypot(x - spawn[0], z - spawn[1]) - 35);
    if (d < bd) { bd = d; item = { pos: [x, z], by: 'open ground' }; }
  }
}

const r2 = v => Math.round(v * 100) / 100;
const out = {
  world: key, walk, keepOff, spawn,
  posts: Object.fromEntries(posts.map(p => [p.name, { pos: p.pos.map(r2), look: p.look.map(r2) }])),
  rounds: rounds.map(r => r.map(i => posts[i].name)),
  item
};
console.log(`${key}: ${posts.length} posts, ${rounds.length} rounds, item ${item ? `[${item.pos}] by ${item.by}` : 'none'}`);
for (const r of out.rounds) console.log('  ', r.map(n => `${n}[${out.posts[n].pos}]`).join('  '));
if (arg('out')) writeFileSync(arg('out'), JSON.stringify(out, null, 1));
