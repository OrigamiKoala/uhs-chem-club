#!/usr/bin/env node
/**
 * pick-spots.mjs — place every world's problem props (an authoring aid; `verify:intros` is the real check).
 *
 *   node tools/npc/pick-spots.mjs [world ...]      writes src/npc/intros/spots.js (all worlds when none named)
 *
 * For each quest with an opening scene (`src/npc/intros/<world>.js`): the prop's spot 9 to 24 m of walking from
 * its bench, clear of every collider and bench bay by the prop's radius plus half a metre, off the crew's posts
 * and the boss arena; the point the player ends up looking from (`view`), two places to stand beside it
 * (`stand`, `stand2`), where someone walking up starts (`meet`, 7 m out along the way), where a figure runs to
 * (`exit`, beyond the spot), and the trail between bench and spot. For the world's own trouble (`SYMPTOM.props`):
 * spots 10 to 40 m from the landing, by a landmark of the kind named in `near` where one is.
 * Spots from an earlier run are kept for any world not named.
 */
import { writeFileSync } from 'node:fs';
const { installDomShim } = await import('../lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const { CREW_WORLDS, walkFor } = await import('../../src/npc/crews.js');
const { INTRO_WORLDS } = await import('../../src/npc/intros.js');
const { SPOTS: OLD } = await import('../../src/npc/intros/spots.js');
const { makeKit, buildProp } = await import('../../src/three/mystery/props.js');
// The worlds are imported before the bench bay, as pick-posts does: the other order trips an import cycle.
const firstWorld = CREW_WORLDS[0];
await import(`../../src/three/${firstWorld.module}.js`);
const { bayBoxes } = await import('../../src/three/bench-bay.js');
const { WalkGrid, bayRects } = await import('../../src/npc/crew-sim.js');
const X = await import('../../src/three/ship-exterior.js');

const only = process.argv.slice(2);
const kit = makeKit();
const radiusOf = def => buildProp(kit, def.kind, def.opts || {}).radius;
const r2 = v => Math.round(v * 100) / 100;
const P = ([x, z]) => [r2(x), r2(z)];
const out = { ...OLD };

for (const iw of INTRO_WORLDS) {
  if (only.length && !only.includes(iw.key)) continue;
  const cfg = CREW_WORLDS.find(w => w.key === iw.key);
  const mod = await import(`../../src/three/${cfg.module}.js`);
  const world = new mod[cfg.className](null);
  const baseColliders = [...world.colliders];
  let grid = new WalkGrid(world, bayRects(world, bayBoxes), walkFor(cfg.key, world));
  const posts = Object.values(cfg.posts).map(p => p.pos);
  const items = Object.values(cfg.tasks || {}).map(t => t.item?.pos).filter(Boolean);
  const sites = world.data.sites.map(s => { const p = s.approachPos || s.pos; return { q: s.questId, a: [p[0], p[2]] }; });
  const sp = world.data.spawn.pos || world.data.spawn;
  const spawn = [sp[0], sp[2]];
  const marks = (world.data.landmarks || []).map(l => ({ kind: l.asset || l.id, p: l.pos || l.position })).filter(m => m.p).map(m => ({ kind: m.kind, x: m.p[0], z: m.p.length > 2 ? m.p[2] : m.p[1] }));
  // Keep every prop clear of where the Avalon lands (hull, ramp and ramp foot), so a prop never pushes the ship off its pad.
  const landing = X.solveLanding(world, X.landingPrefsFor(world));
  const standClear = { minX: X.RAMP_FOOT.x - 1.4, maxX: X.RAMP_FOOT.x + 4.5, minZ: X.RAMP_FOOT.z - 2.2, maxZ: X.RAMP_FOOT.z + 2.2 };
  const shipRects = [X.SHIP_FOOTPRINT.body, X.SHIP_FOOTPRINT.ramp, standClear].map(r => X.localRectToWorld(landing, r));
  const offShip = (x, z, r) => shipRects.every(b => Math.hypot(Math.max(b.minX, Math.min(x, b.maxX)) - x, Math.max(b.minZ, Math.min(z, b.maxZ)) - z) > r + 0.8);
  const taken = [];   // { x, z, r }

  /** Cells reachable from `from`, with walking distance, by a flood on the grid. */
  const flood = from => {
    const [si, sj] = grid.cellOf(...from);
    const dist = new Float32Array(grid.NI * grid.NJ).fill(Infinity);
    const q = [];
    outer: for (let r = 0; r < 10; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
      if (grid.open(si + di, sj + dj)) { dist[(si + di) * grid.NJ + sj + dj] = 0; q.push([si + di, sj + dj]); break outer; }
    }
    for (let h = 0; h < q.length; h++) {
      const [i, j] = q[h];
      const d = dist[i * grid.NJ + j];
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + a, nj = j + b;
        if (grid.open(ni, nj) && dist[ni * grid.NJ + nj] === Infinity) { dist[ni * grid.NJ + nj] = d + 0.5; q.push([ni, nj]); }
      }
    }
    return q.map(([i, j]) => ({ c: grid.center(i, j), d: dist[i * grid.NJ + j] }));
  };
  const freeOf = (x, z, r) => offShip(x, z, r) && posts.every(p => Math.hypot(p[0] - x, p[1] - z) > 3) && items.every(p => Math.hypot(p[0] - x, p[1] - z) > 3) &&
    taken.every(t => Math.hypot(t.x - x, t.z - z) > t.r + r + 3);
  const farFromBenches = (x, z, keep = null) => sites.every(s => s.q === keep || Math.hypot(s.a[0] - x, s.a[1] - z) > 6);
  const clear = (x, z, r) => !grid.blockedAt(x, z, r);
  const nearMark = (x, z, kind) => kind && marks.some(m => m.kind === kind && Math.hypot(m.x - x, m.z - z) < 8);

  const result = { quests: {}, world: [] };
  const placeQuest = (questId, intro) => {
    const site = sites.find(s => s.q === questId);
    if (!site || !intro.prop) { console.warn(`${iw.key}/${questId}: no bench or no prop`); return; }
    const R = radiusOf(intro.prop);
    const A = site.a;
    const reach = flood(A);
    let cands = reach.filter(({ c: [x, z], d }) => d >= 9 && d <= 24 && clear(x, z, R + 0.5) && freeOf(x, z, R) && farFromBenches(x, z, questId));
    // A crowded site: further out, tighter to the walls, nearer the crew's posts.
    if (!cands.length) cands = reach.filter(({ c: [x, z], d }) => d >= 6 && d <= 34 && clear(x, z, R + 0.25) && taken.every(t => Math.hypot(t.x - x, t.z - z) > t.r + R + 1.5) && sites.every(s => s.q === questId || Math.hypot(s.a[0] - x, s.a[1] - z) > 4));
    let best = null, bs = Infinity;
    for (const { c, d } of cands) {
      const s = Math.abs(d - 13) + (nearMark(c[0], c[1], intro.near) ? -4 : 0) + Math.abs(Math.sin(c[0] * 7.1 + c[1] * 3.3)) * 0.5;
      if (s < bs) { bs = s; best = { c, d }; }
    }
    if (!best) { console.warn(`${iw.key}/${questId}: no spot`); return; }
    const [x, z] = best.c;
    taken.push({ x, z, r: R });
    const face = Math.atan2(A[0] - x, A[1] - z);
    // The way in, every half metre (the planner returns only its corners).
    const corners = grid.path(A, [x, z]) || [A, [x, z]];
    const path = [corners[0]];
    for (let i = 1; i < corners.length; i++) {
      const [ax, az] = corners[i - 1], [bx, bz] = corners[i];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
      for (let k = 1; k <= n; k++) path.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]);
    }
    // The view: walking back from the prop along the way in, the first clear point far enough off to see it whole.
    let view = null;
    for (let i = path.length - 1; i >= 0; i--) {
      const [px, pz] = path[i];
      if (Math.hypot(px - x, pz - z) >= R + 1.6 && clear(px, pz, 0.3)) { view = [px, pz]; break; }
    }
    if (!view) view = A;
    const ux = (view[0] - x) / (Math.hypot(view[0] - x, view[1] - z) || 1), uz = (view[1] - z) / (Math.hypot(view[0] - x, view[1] - z) || 1);
    const side = sgn => {
      for (const k of [0.8, 1.1, 1.5]) for (const t of [0.35, 0.6, 0.1]) {
        const px = x + (-uz * sgn) * (R + k) + ux * (R + k) * t, pz = z + (ux * sgn) * (R + k) + uz * (R + k) * t;
        if (clear(px, pz, 0.35) && grid.path([px, pz], view)) return [px, pz];
      }
      return null;
    };
    const stand = side(1) || side(-1) || view;
    let stand2 = side(-1);
    if (!stand2 || Math.hypot(stand2[0] - stand[0], stand2[1] - stand[1]) < 1.2) {
      // Only one side is open: the second stands a step back from the first, towards the view.
      const k = Math.min(1, 1.3 / (Math.hypot(view[0] - stand[0], view[1] - stand[1]) || 1));
      const p2 = [stand[0] + (view[0] - stand[0]) * k, stand[1] + (view[1] - stand[1]) * k];
      stand2 = clear(p2[0], p2[1], 0.3) && Math.hypot(p2[0] - view[0], p2[1] - view[1]) > 0.8 ? p2 : null;
    }
    if (!stand2) console.warn(`${iw.key}/${questId}: only one place to stand`);
    // Someone walking up comes from 7 m out along the way to the problem, and never from inside it.
    let meet = null;
    for (let i = Math.min(path.length - 1, 14); i >= 4; i--) {
      const [px, pz] = path[i];
      if (clear(px, pz, 0.35) && Math.hypot(px - x, pz - z) > R + 0.8) { meet = [px, pz]; break; }
    }
    meet = meet || view;
    // A figure runs on past the problem, away from the bench.
    let exit = null, eb = Infinity;
    for (const { c: [ex, ez] } of flood([x, z])) {
      const d = Math.hypot(ex - x, ez - z);
      if (d < 12 || d > 22) continue;
      const away = ((ex - x) * -ux + (ez - z) * -uz) / d;
      if (away < 0.3 || !clear(ex, ez, 0.4)) continue;
      const s = Math.abs(d - 16) - away * 3;
      if (s < eb) { eb = s; exit = [ex, ez]; }
    }
    // The trail: every 0.7 m of the way from the bench to the view, after the first metre and a half.
    const trail = [];
    let acc = 0;
    for (let i = 1; i < path.length; i++) {
      const [ax, az] = path[i - 1], [bx, bz] = path[i];
      const seg = Math.hypot(bx - ax, bz - az);
      for (let s = 0; s < seg; s += 0.1) {
        acc += 0.1;
        if (acc >= 1.5 && Math.round(acc * 10) % 7 === 0) trail.push([ax + (bx - ax) * s / seg, az + (bz - az) * s / seg]);
      }
      if (Math.hypot(bx - view[0], bz - view[1]) < 0.3) break;
    }
    result.quests[questId] = {
      pos: P([x, z]), face: r2(face), view: P(view), stand: P(stand), stand2: P(stand2 || stand), meet: P(meet),
      exit: exit ? P(exit) : P(view), ...(intro.trail ? { trail: trail.map(P) } : {})
    };
  };
  for (const [questId, intro] of Object.entries(iw.intros)) placeQuest(questId, intro);
  const near = flood(spawn);
  (iw.symptom?.props || []).forEach((def, i) => {
    const R = radiusOf(def);
    let best = null, bs = Infinity;
    for (const { c: [x, z], d } of near) {
      if (d < 10 || d > 40 || !clear(x, z, R + 0.6) || !freeOf(x, z, R) || !farFromBenches(x, z) || Math.hypot(x - spawn[0], z - spawn[1]) < 8) continue;
      const s = Math.abs(d - (16 + i * 9)) + (nearMark(x, z, def.near) ? -6 : 0) + Math.abs(Math.sin(x * 5.3 + z * 2.1));
      if (s < bs) { bs = s; best = [x, z]; }
    }
    if (!best) { console.warn(`${iw.key} symptom ${i}: no spot`); result.world.push(null); return; }
    taken.push({ x: best[0], z: best[1], r: R });
    // Turned to face the landing, so it is seen from the way in.
    result.world.push({ pos: P(best), face: r2(Math.atan2(spawn[0] - best[0], spawn[1] - best[1])) });
  });
  // Round two: every prop is now a wall. A scene whose walk from the bench got long (another prop in its way,
  // or its own) is placed again with the others standing.
  const discs = () => [
    ...Object.entries(result.quests).map(([q, sp]) => ({ q, x: sp.pos[0], z: sp.pos[1], radius: radiusOf(iw.intros[q].prop) })),
    ...result.world.filter(Boolean).map((sp, i) => ({ q: `world-${i}`, x: sp.pos[0], z: sp.pos[1], radius: radiusOf(iw.symptom.props[i]) }))
  ];
  const walkLen = (from, to) => {
    const p = grid.path(from, to);
    if (!p) return Infinity;
    let L = 0;
    for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    return L;
  };
  for (let round = 0; round < 3; round++) {
    world.colliders = [...baseColliders, ...discs()];
    grid = new WalkGrid(world, bayRects(world, bayBoxes), walkFor(cfg.key, world));
    const bad = Object.entries(result.quests).filter(([q, sp]) => {
      const site = sites.find(s => s.q === q);
      const direct = Math.hypot(sp.view[0] - site.a[0], sp.view[1] - site.a[1]);
      return walkLen(site.a, sp.view) > Math.max(30, direct * 1.8) || grid.blockedAt(sp.view[0], sp.view[1], 0.25);
    }).map(([q]) => q);
    if (!bad.length) break;
    for (const q of bad) {
      console.log(`  ${iw.key}/${q}: walk blocked by a prop, placing again`);
      const old = result.quests[q];
      delete result.quests[q];
      const i = taken.findIndex(t => t.x === old.pos[0] && t.z === old.pos[1]);
      if (i >= 0) taken.splice(i, 1);
      world.colliders = [...baseColliders, ...discs()];
      grid = new WalkGrid(world, bayRects(world, bayBoxes), walkFor(cfg.key, world));
      placeQuest(q, iw.intros[q]);
    }
  }
  world.colliders = baseColliders;
  out[iw.key] = result;
  console.log(`${iw.key}: ${Object.keys(result.quests).length} scene spots, ${result.world.filter(Boolean).length} world props`);
}

const body = `/** Written by \`tools/npc/pick-spots.mjs\`; held by \`verify:intros\`. Where each world's problem props stand. */\nexport const SPOTS = ${JSON.stringify(out)};\n`;
writeFileSync(new URL('../../src/npc/intros/spots.js', import.meta.url), body);
