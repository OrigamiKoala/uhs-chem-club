/**
 * quicklight/plant.js — What works on the refinery besides its rooms: the pipe racks over the alleys and the lamps on them, the
 * process units packed between the alleys, the tanks in the bund and the manifold on the cellar's deck, the feed heater, the flare
 * stack, the rod pylons, and the far country.
 *
 * Each builder in `PLANT_BUILDERS` takes the world and returns a Group in the WORLD frame (or null), with `userData.colliders`
 * in the world frame where a player could touch it (discs `{ x, z, r }`, boxes `{ minX, maxX, minZ, maxZ }`). The far country is
 * `phys: 'ambient'`: it is the horizon, not a place. The lamp post and the landing pad are Ember Reach's generic builders.
 *
 * NOTHING IS SCATTER. Every vessel, frame and pipe belongs to a unit: the packer (`buildUnits`) fills each block between the
 * alleys with whole units (a column with its reflux drum and exchangers, a fin-fan bank on its frame, a structure with a
 * vessel in it, a pump row), each on its own plot, a metre and more back from the kerb, none on another.
 *
 * ONLY LAMPS ARE LIT: a lamp is a `lampMark` (kettle/kit.js) the world pools; nothing here owns a light.
 * NO SIGN STANDS IN THE REFINERY: nothing here carries lettering.
 */

import * as THREE from 'three';
import { part, between, rng } from '../ember/kit.js';
import { kitFor } from '../kettle/kit.js';
import {
  GRADE, PLOT, WALL_T, BUND, SKIRT, STACK, ARENA, ROOMS, PLANT, PLANT_YARD, land, inPlant
} from './refinery-plan.js';
import { BLOCK_FOOT, drum as drumGeo } from './terrain.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

/* ================================================================== where things may stand */

/**
 * The rod pylons: three on the plant (the plot's corners and the lower grid's east tank field), six on the lava field round
 * it. Their tips are what the lightning strikes.
 */
const ROD_SITES = [
  [76, 26, 'plant'], [-47.5, 66, 'plant'], [76, -82, 'plant'],
  [-190, -140, 'far'], [-40, -300, 'far'], [170, -220, 'far'], [300, 60, 'far'], [110, 290, 'far'], [-260, 150, 'far']
];
const ROD_H = { plant: 36, far: 44 };
export const ROD_TIPS = ROD_SITES.map(([x, z, k]) => [x, land(x, z) + ROD_H[k] + 3.5, z]);

/** The feed heater, on the plot west of the cracking reactor, and its stack. */
export const HEATER = { x: -48.5, z: 22, w: 14, d: 9, h: 11, stack: 42 };

/** Rectangles nothing of the plant may stand in: the walk and its walls, the rooms and their walls, the built structures. */
function keepOuts(plan) {
  const out = [];
  const grow = (r, m) => ({ minX: r.minX - m, maxX: r.maxX + m, minZ: r.minZ - m, maxZ: r.maxZ + m });
  for (const v of plan.volumes) out.push(grow(v.rect, v.kind === 'room' ? (v.room.doorT + 0.8) : 1.3));
  out.push(grow(BLOCK_FOOT, 1.0));
  out.push({ ...grow({ minX: SKIRT.x - SKIRT.r - 2, maxX: SKIRT.x + SKIRT.r + 2, minZ: SKIRT.z - SKIRT.r - 2, maxZ: SKIRT.z + SKIRT.r + 2 }, 0), skirt: true });
  out.push({ minX: SKIRT.x - SKIRT.r - 4, maxX: SKIRT.x - SKIRT.r - 0.5, minZ: SKIRT.z - 2.5, maxZ: SKIRT.z + 2.5 });  // the riser
  out.push({ ...grow(BUND, BUND.wall + 0.8), bund: true });
  out.push(grow({ minX: HEATER.x - HEATER.w / 2, maxX: HEATER.x + HEATER.w / 2, minZ: HEATER.z - HEATER.d / 2, maxZ: HEATER.z + HEATER.d / 2 }, 1.5));
  for (const [x, z, k] of ROD_SITES) if (k === 'plant') out.push({ minX: x - 4, maxX: x + 4, minZ: z - 4, maxZ: z + 4 });
  // The earth over the bunkers.
  for (const r of ROOMS) if (r.mound) out.push({ ...grow(r.rect, 7.5), mound: true });
  // The reactor train's table and its edge platform.
  const t = ROOMS.find(r => r.shell === 'table').rect;
  out.push(grow(t, 3.2));
  // The flare's knock-out drum outside the yard's fence.
  out.push({ minX: 86, maxX: 96, minZ: 66, maxZ: 92 });
  // The flare header along the yard's south fence.
  out.push({ minX: 36, maxX: 96, minZ: 90.4, maxZ: 94 });
  return out;
}
const hit = (list, r, gap = 0) => list.some(k => r.minX < k.maxX + gap && r.maxX > k.minX - gap && r.minZ < k.maxZ + gap && r.maxZ > k.minZ - gap);

/* ================================================================== the pipe racks */

/**
 * A rack over every alley: steel bents every 6 m, their two stanchions standing just outside the kerbs, two tiers of pipes
 * running the alley's length. The east-west racks carry their tiers at 5.6 and 7.4 m and run on over the junctions; the
 * north-south racks at 6.5 and 8.3 m, so where two cross their pipes pass one over the other. A lamp on a bracket off every
 * other bent, leaning out over the alley, alternate sides.
 */
function buildRacks(w) {
  const k = kitFor(w), M = w.M, plan = w.plan;
  const g = new THREE.Group();
  g.name = 'pipe-racks';
  // What a stanchion may not stand in: the structures (not the walk, which is tested on its own), the bund only to its wall.
  const solid = keepOuts(plan).slice(plan.volumes.length).filter(r => !r.bund && !r.skirt && !r.mound);
  solid.push({ minX: BUND.minX - BUND.wall, maxX: BUND.maxX + BUND.wall, minZ: BUND.minZ - BUND.wall, maxZ: BUND.maxZ + BUND.wall });
  /** A building face a bent's end may be bolted to instead: the control block, or a room's outer wall. */
  const faceAt = (x, z) => {
    const B = BLOCK_FOOT;
    if (x > B.minX - 0.05 && x < B.maxX && z > B.minZ && z < B.maxZ) return true;
    for (const r of plan.roofed) { const q = r.rect, m = (r.room?.doorT ?? 0.6); if (x > q.minX - m - 0.05 && x < q.maxX + m + 0.05 && z > q.minZ - m && z < q.maxZ + m) return true; }
    return false;
  };
  /**
   * Where a bent's leg goes at (x, z): `{ base }` a stanchion from the land there (level with the alley or higher, as on the
   * earth by a bunker); `{ wall: true }` the beam's end in a shoe on a building's face at the alley's edge; or null.
   */
  const leg = (x0, z0, y, edge, out) => {
    // Try the leg just outside the kerb; where the land behind is higher (a retaining wall stands there), further out.
    for (const extra of [0, 0.45]) {
      const x = x0 + out[0] * extra, z = z0 + out[1] * extra;
      let bad = false;
      for (const [dx, dz] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]]) if (plan.volumeAt(x + dx, z + dz)) bad = true;
      if (bad) return null;
      if (faceAt(edge[0], edge[1]) || faceAt(x, z)) return { wall: true };
      for (const r of plan.roofed) { const q = r.rect, m = (r.room?.doorT ?? 0.6) + 0.5; if (x > q.minX - m && x < q.maxX + m && z > q.minZ - m && z < q.maxZ + m) return null; }
      if (hit(solid, { minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3 })) return null;
      if (Math.hypot(x - SKIRT.x, z - SKIRT.z) < SKIRT.r + SKIRT.t + 0.9) return null;
      const lb = Math.max(land(x - 0.3, z - 0.3), land(x + 0.3, z + 0.3), land(x - 0.3, z + 0.3), land(x + 0.3, z - 0.3));
      if (lb < y - 0.3 || lb > y + 4) return null;
      if (lb > y + 0.3 && extra === 0) continue;
      return { base: Math.max(y, lb), at: [x, z] };
    }
    return null;
  };
  let lampSide = 0;
  for (const v of plan.openVols) {
    if (v.kind !== 'alley') continue;
    const r = v.rect, y = v.floor.y0;
    const alongX = r.maxX - r.minX > r.maxZ - r.minZ;
    const [a0, a1] = alongX ? [r.minX, r.maxX] : [r.minZ, r.maxZ];
    const [s0, s1] = alongX ? [r.minZ, r.maxZ] : [r.minX, r.maxX];
    const tiers = alongX ? [5.6, 7.4] : [6.5, 8.3];
    const off = 0.55;
    const P = (a, s) => alongX ? [a, s] : [s, a];
    const bents = [];
    let lastLamp = -Infinity;
    for (let a = a0 + 3; a <= a1 - 3 + 1e-6; a += 6) {
      let p0 = P(a, s0 - off), p1 = P(a, s1 + off);
      const out0 = alongX ? [0, -1] : [-1, 0], out1 = alongX ? [0, 1] : [1, 0];
      const L0 = leg(p0[0], p0[1], y, P(a, s0 - 0.1), out0), L1 = leg(p1[0], p1[1], y, P(a, s1 + 0.1), out1);
      if (!L0 || !L1 || (L0.wall && L1.wall)) continue;
      if (L0.at) p0 = L0.at;
      if (L1.at) p1 = L1.at;
      bents.push(a);
      // A leg on a face is no leg: the beam runs to the wall and sits in a shoe there.
      if (L0.wall) p0 = P(a, s0);
      if (L1.wall) p1 = P(a, s1);
      for (const [p, L] of [[p0, L0], [p1, L1]]) {
        if (L.wall) { for (const t of tiers) k.box(g, [0.36, 0.5, 0.36], M.darkSteel, [p[0], y + t - 0.3, p[1]], null, false); continue; }
        k.box(g, [0.5, 0.06, 0.5], M.darkSteel, [p[0], L.base + 0.03, p[1]], null, false);
        k.stanchion(g, p[0], p[1], L.base + 0.06, y + tiers[1] + 0.2, { d: 0.3, b: 0.26, ry: alongX ? 0 : Math.PI / 2 });
      }
      for (const t of tiers) k.beam(g, [p0[0], y + t - 0.2, p0[1]], [p1[0], y + t - 0.2, p1[1]], { d: 0.3, f: 0.2 });
      // Knee braces at the top tier.
      for (const [p, sgn, L] of [[p0, 1, L0], [p1, -1, L1]]) {
        if (L.wall) continue;
        const q = alongX ? [p[0], y + tiers[1] - 1.4, p[1]] : [p[0], y + tiers[1] - 1.4, p[1]];
        const e = alongX ? [p[0], y + tiers[1] - 0.35, p[1] + sgn * 1.0] : [p[0] + sgn * 1.0, y + tiers[1] - 0.35, p[1]];
        k.strut(g, q, e, 0.04, M.darkSteel, 6);
      }
      // A lamp on a bent every 9 m or so, alternately on each side, reaching 0.9 m out over the alley at 4.6 m; and on the
      // last bent before the alley's end.
      if (a - lastLamp >= 8.5 || (a + 6 > a1 - 3 && a - lastLamp >= 5)) {
        lastLamp = a;
        let side = (lampSide++) % 2;
        if ((side ? L1 : L0).wall) side = 1 - side;
        const p = side ? p1 : p0, sgn = side ? -1 : 1;
        const arm = alongX ? [0, sgn * 0.9] : [sgn * 0.9, 0];
        k.bracketLamp(g, p[0], y + 4.6, p[1], arm, { intensity: 8, distance: 14 });
      }
    }
    if (bents.length < 2) continue;
    // The pipes: on each tier, a row across the rack's width, running from the first bent to the last.
    const from = Math.max(a0, bents[0] - 3), to = Math.min(a1, bents[bents.length - 1] + 3);
    const len = to - from, mid = (from + to) / 2;
    const width = s1 - s0 + 2 * off;
    tiers.forEach((t, ti) => {
      // A full rack: pipes side by side across its whole width, the big lines insulated, a gap between each for the shoes.
      const rs = ti === 0 ? [0.3, 0.18, 0.4, 0.14, 0.22, 0.12, 0.26, 0.16, 0.34, 0.12] : [0.16, 0.25, 0.12, 0.35, 0.2, 0.14, 0.28, 0.1];
      let s = s0 - off + 0.3;
      for (let i = 0; s + 2 * rs[i % rs.length] < s1 + off - 0.25; i++) {
        const rr = rs[i % rs.length];
        const c = s + rr;
        const mat = rr >= 0.3 ? M.cladding : i % 3 === 1 ? M.rusted : M.steel;
        const pos = alongX ? [mid, y + t - 0.05 + rr, c] : [c, y + t - 0.05 + rr, mid];
        const rot = alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];
        k.cyl(g, [rr, rr, len, rr > 0.2 ? 16 : 10], mat, pos, rot, rr > 0.2);
        s = c + rr + 0.16;
      }
    });
  }
  g.userData.colliders = [];
  return g;
}

/* ================================================================== the lamps on the ramps and courts */

/**
 * The ramps and the courts are lit from their walls: a standard on the coping (or, where the wall is only a kerb, beside it) every
 * 8 m, its bracket leaning over the walk.
 */
function buildWalkLamps(w) {
  const k = kitFor(w), M = w.M, plan = w.plan;
  const g = new THREE.Group();
  g.name = 'walk-lamps';
  for (const id of ['rise', 'down-1', 'court-1', 'down-3', 'court-3', 'down-6', 'court-6']) {
    const v = plan.byId.get(id);
    const r = v.rect;
    const alongX = r.maxX - r.minX > r.maxZ - r.minZ;
    // The wall on the side away from the room it serves (the court's far side) or the east/south side of a ramp.
    const sideIsMax = id.startsWith('court') ? !(v.openings.some(o => o.to?.startsWith('door-') && o.side.startsWith('max'))) : true;
    const [a0, a1] = alongX ? [r.minX, r.maxX] : [r.minZ, r.maxZ];
    const plane = alongX ? (sideIsMax ? r.maxZ : r.minZ) : (sideIsMax ? r.maxX : r.minX);
    const sgn = sideIsMax ? 1 : -1;
    const step = id.startsWith('court') ? (a1 - a0) / 2 : 8;
    for (let a = a0 + step / 2; a < a1 - 0.5; a += step) {
      const [px, pz] = alongX ? [a, plane + sgn * 0.3] : [plane + sgn * 0.3, a];
      const floor = plan.height(alongX ? a : plane - sgn * 0.5, alongX ? plane - sgn * 0.5 : a);
      const beyond = land(alongX ? a : plane + sgn * 1.0, alongX ? plane + sgn * 1.0 : a);
      const retaining = beyond > floor + 0.5, drop = beyond < floor - 0.5;
      // On a retaining wall the standard stands on its coping; on a parapet, on its coping; on a kerb, just outside it.
      const out = retaining ? 0.3 : drop ? 0.4 : 0.55;
      const [sx, sz] = alongX ? [a, plane + sgn * out] : [plane + sgn * out, a];
      const base = retaining ? beyond + 0.3 : drop ? floor + 1.1 : land(sx, sz);
      const top = Math.max(base + 0.6, floor + 3.9);
      k.box(g, [0.24, 0.08, 0.24], M.darkSteel, [sx, base + 0.04, sz], null, false);
      k.box(g, [0.08, top - base, 0.08], M.darkSteel, [sx, base + (top - base) / 2, sz]);
      const arm = alongX ? [0, -sgn * 1.0] : [-sgn * 1.0, 0];
      k.bracketLamp(g, sx, top - 0.2, sz, arm, { intensity: 7, distance: 12 });
    }
  }
  g.userData.colliders = [];
  return g;
}

/* ================================================================== the units */

/**
 * The process units packed between the alleys. Each block is filled from its alley sides inward, plot by plot, with whole
 * units; a plot that would touch the walk, a room, a heap, a structure or another unit is skipped.
 */
function buildUnits(w) {
  const k = kitFor(w), M = w.M, plan = w.plan;
  const g = new THREE.Group();
  g.name = 'units';
  const R = rng(0x9a11);
  const keep = keepOuts(plan);
  const placed = [];
  const fits = (r) => !hit(keep, r, 0) && !hit(placed, r, 0.6) && inPlant(r.minX, r.minZ) && inPlant(r.maxX, r.maxZ) && inPlant(r.minX, r.maxZ) && inPlant(r.maxX, r.minZ);
  const levelAt = (x, z) => land(x, z);
  const flatUnder = (r) => {
    const ys = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ], [(r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2]].map(([x, z]) => levelAt(x, z));
    return Math.max(...ys) - Math.min(...ys) < 0.05 ? ys[4] : null;
  };

  /* --- the units themselves: each draws round (cx, cz) on ground y and returns nothing */
  const plinth = (cx, cz, y, sx, sz) => k.box(g, [sx, 0.3, sz], M.concrete, [cx, y + 0.15, cz], null, false);
  const column = (cx, cz, y, s) => {
    const r = 0.9 + s * 0.9, h = 16 + s * 18;
    plinth(cx, cz, y, 2 * r + 1.2, 2 * r + 1.2);
    k.cyl(g, [r + 0.1, r + 0.1, 3.0, 20], M.skirt, [cx, y + 0.3 + 1.5, cz]);
    k.cyl(g, [r, r, h, 20], M.cladding, [cx, y + 3.3 + h / 2, cz]);
    const head = part(w.ctx, new THREE.SphereGeometry(r, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.cladding, cx, y + 3.3 + h, cz, { cast: true });
    head.scale.y = 0.5;
    g.add(head);
    // Platforms round it every 6 m, a caged ladder up its side, the overhead line down to its reflux drum.
    for (let py = y + 9; py < y + 3.3 + h - 1; py += 6) {
      k.cyl(g, [r + 1.0, r + 1.0, 0.05, 20], M.grating, [cx, py, cz], null, false);
      k.cyl(g, [r + 1.0, r + 1.0, 0.04, 20], M.rail, [cx, py + 1.05, cz], null, false);
    }
    k.box(g, [0.5, h, 0.06], M.darkSteel, [cx, y + 3.3 + h / 2, cz + r + 0.4]);
    k.pipe(g, [[cx, y + 3.3 + h + r * 0.5, cz], [cx, y + 3.3 + h + r * 0.5 + 1.2, cz], [cx + r + 1.2, y + 3.3 + h + r * 0.5 + 1.2, cz], [cx + r + 1.2, y + 6, cz]], 0.2, M.cladding);
  };
  const hdrum = (cx, cz, y, alongX, len = 7) => {
    plinth(cx, cz, y, alongX ? len : 3, alongX ? 3 : len);
    for (const s of [-1, 1]) {
      const [sx, sz] = alongX ? [cx + s * (len / 2 - 1.2), cz] : [cx, cz + s * (len / 2 - 1.2)];
      k.box(g, [alongX ? 0.4 : 2.0, 1.2, alongX ? 2.0 : 0.4], M.concrete, [sx, y + 0.3 + 0.6, sz]);
    }
    k.cyl(g, [1.1, 1.1, len - 1.0, 20], M.steel, [cx, y + 2.6, cz], alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) {
      const cap = part(w.ctx, new THREE.SphereGeometry(1.1, 18, 8, 0, Math.PI), M.steel, alongX ? cx + s * (len - 1.0) / 2 : cx, y + 2.6, alongX ? cz : cz + s * (len - 1.0) / 2, { cast: true });
      cap.scale.set(1, 1, 0.4);
      cap.rotation.y = alongX ? s * Math.PI / 2 : (s < 0 ? Math.PI : 0);
      g.add(cap);
    }
    k.cyl(g, [0.25, 0.25, 1.0, 12], M.steel, [cx, y + 4.0, cz], null, false);
  };
  const exchangers = (cx, cz, y, alongX) => {
    plinth(cx, cz, y, alongX ? 7 : 2.6, alongX ? 2.6 : 7);
    for (const lvl of [0, 1]) {
      const yy = y + 1.1 + lvl * 1.5;
      k.cyl(g, [0.6, 0.6, 5.4, 16], lvl ? M.rusted : M.steel, [cx, yy, cz], alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]);
      const [ex, ez] = alongX ? [cx + 2.9, cz] : [cx, cz + 2.9];
      k.cyl(g, [0.72, 0.72, 0.5, 16], M.darkSteel, [ex, yy, ez], alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]);
    }
    for (const s of [-1, 1]) {
      const [sx, sz] = alongX ? [cx + s * 2, cz] : [cx, cz + s * 2];
      k.box(g, [alongX ? 0.3 : 1.6, 2.2, alongX ? 1.6 : 0.3], M.darkSteel, [sx, y + 0.3 + 1.1, sz]);
    }
  };
  const finfan = (cx, cz, y) => {
    const H = 7.5;
    for (const sx of [-3.5, 3.5]) for (const sz of [-2.5, 2.5]) {
      k.box(g, [0.6, 0.06, 0.6], M.darkSteel, [cx + sx, y + 0.03, cz + sz], null, false);
      k.stanchion(g, cx + sx, cz + sz, y + 0.06, y + H);
    }
    for (const sz of [-2.5, 2.5]) k.beam(g, [cx - 3.6, y + H, cz + sz], [cx + 3.6, y + H, cz + sz]);
    k.box(g, [7.6, 0.9, 5.6], M.darkSteel, [cx, y + H + 0.65, cz]);
    for (const sx of [-1.9, 1.9]) {
      k.cyl(g, [1.6, 1.6, 0.9, 20], M.steel, [cx + sx, y + H + 1.55, cz]);
      k.cyl(g, [1.55, 1.55, 0.04, 20], M.grating, [cx + sx, y + H + 2.0, cz], null, false);
    }
    k.cyl(g, [0.25, 0.25, 7.6, 10], M.cladding, [cx, y + H + 0.15, cz - 2.2], [0, 0, Math.PI / 2], false);
  };
  const structure = (cx, cz, y) => {
    const H = [0, 4.5, 9, 13.5];
    for (const sx of [-2.8, 2.8]) for (const sz of [-2.8, 2.8]) {
      k.box(g, [0.6, 0.06, 0.6], M.darkSteel, [cx + sx, y + 0.03, cz + sz], null, false);
      k.stanchion(g, cx + sx, cz + sz, y + 0.06, y + H[3]);
    }
    for (const h of H.slice(1)) {
      for (const sz of [-2.8, 2.8]) k.beam(g, [cx - 2.9, y + h, cz + sz], [cx + 2.9, y + h, cz + sz], { d: 0.3, f: 0.2 });
      for (const sx of [-2.8, 2.8]) k.beam(g, [cx + sx, y + h, cz - 2.9], [cx + sx, y + h, cz + 2.9], { d: 0.3, f: 0.2 });
      k.box(g, [5.6, 0.04, 5.6], M.grating, [cx, y + h + 0.17, cz], null, false);
    }
    k.cyl(g, [1.3, 1.3, 9.5, 18], M.steel, [cx + 0.6, y + 5.5, cz - 0.4]);
    k.strut(g, [cx - 2.8, y + 0.3, cz - 2.8], [cx + 2.8, y + 4.4, cz - 2.8], 0.05, M.darkSteel, 6);
    k.strut(g, [cx - 2.8, y + 4.6, cz + 2.8], [cx + 2.8, y + 8.9, cz + 2.8], 0.05, M.darkSteel, 6);
  };
  const pumps = (cx, cz, y, alongX) => {
    plinth(cx, cz, y, alongX ? 6 : 2.2, alongX ? 2.2 : 6);
    for (const s of [-1.8, 0, 1.8]) {
      const [px, pz] = alongX ? [cx + s, cz] : [cx, cz + s];
      k.cyl(g, [0.3, 0.3, 0.3, 14], M.paintRed, [px, y + 0.75, pz], alongX ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2]);
      k.box(g, [alongX ? 0.5 : 1.0, 0.5, alongX ? 1.0 : 0.5], M.paintRed, [alongX ? px : px + 0.4, y + 0.75, alongX ? pz + 0.4 : pz]);
      k.cyl(g, [0.08, 0.08, 2.6, 8], M.steel, [px, y + 1.9, pz], null, false);
    }
  };
  const tank = (cx, cz, y, r, h) => {
    k.cyl(g, [r + 0.4, r + 0.4, 0.4, 28], M.concrete, [cx, y + 0.2, cz], null, false);
    k.cyl(g, [r, r, h, 28], M.cladding, [cx, y + 0.4 + h / 2, cz]);
    const roof = part(w.ctx, new THREE.ConeGeometry(r + 0.05, r * 0.2, 28), M.cladding, cx, y + 0.4 + h + r * 0.1, cz, { cast: true });
    g.add(roof);
    for (let yy = y + 2.4; yy < y + h; yy += 2.4) k.cyl(g, [r + 0.05, r + 0.05, 0.08, 28], M.steel, [cx, yy, cz], null, false);
    // The spiral stair: treads round the shell, a stringer up it.
    for (let i = 0; i < 18; i++) {
      const a = i * 0.16, yy = y + 0.6 + (h - 0.4) * i / 18;
      k.box(g, [0.9, 0.04, 0.3], M.grating, [cx + Math.cos(a) * (r + 0.5), yy, cz + Math.sin(a) * (r + 0.5)], [0, -a, 0], false);
    }
  };

  const skid = (cx, cz, y, alongX) => {
    // A packaged skid under its own roof: a steel base, a louvred enclosure, the line in and out.
    k.box(g, [alongX ? 3.6 : 2.4, 0.2, alongX ? 2.4 : 3.6], M.darkSteel, [cx, y + 0.1, cz]);
    k.box(g, [alongX ? 3.4 : 2.2, 2.6, alongX ? 2.2 : 3.4], M.steel, [cx, y + 1.5, cz]);
    k.box(g, [alongX ? 3.7 : 2.5, 0.1, alongX ? 2.5 : 3.7], M.roof, [cx, y + 2.85, cz], null, false);
    for (let i = 0; i < 5; i++) k.box(g, [alongX ? 1.2 : 0.04, 0.06, alongX ? 0.04 : 1.2], M.darkSteel, alongX ? [cx, y + 1.2 + i * 0.22, cz + 1.12] : [cx + 1.12, y + 1.2 + i * 0.22, cz], null, false);
    k.cyl(g, [0.08, 0.08, 1.6, 8], M.steel, [cx, y + 3.6, cz], null, false);
  };
  const pot = (cx, cz, y) => {
    // A knock-out pot on four legs: a vertical drum, its inlet and its level glass.
    for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) k.box(g, [0.14, 1.6, 0.14], M.darkSteel, [cx + dx, y + 0.8, cz + dz]);
    k.cyl(g, [1.0, 1.0, 4.6, 18], M.steel, [cx, y + 1.6 + 2.3, cz]);
    const top = part(w.ctx, new THREE.SphereGeometry(1.0, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.steel, cx, y + 6.2, cz, { cast: true });
    top.scale.y = 0.5;
    g.add(top);
    k.cyl(g, [0.15, 0.15, 1.8, 10], M.steel, [cx + 1.6, y + 5.0, cz], [0, 0, Math.PI / 2], false);
    k.box(g, [0.08, 1.6, 0.08], M.glassDark, [cx, y + 3.5, cz + 1.05], null, false);
  };

  const station = (cx, cz, y, alongX) => {
    // A valve station on sleepers: three lines up out of the ground, a valve on each at hand height, a drip tray.
    for (const d of [-1.1, 1.1]) k.box(g, alongX ? [0.3, 0.3, 1.2] : [1.2, 0.3, 0.3], M.concrete, [cx + (alongX ? d : 0), y + 0.15, cz + (alongX ? 0 : d)], null, false);
    for (const d of [-0.8, 0, 0.8]) {
      const [px, pz] = alongX ? [cx + d, cz] : [cx, cz + d];
      k.cyl(g, [0.11, 0.11, 2.4, 10], M.steel, [px, y + 1.5, pz]);
      k.box(g, [0.3, 0.36, 0.3], M.darkSteel, [px, y + 1.4, pz]);
      k.cyl(g, [0.16, 0.16, 0.03, 14], M.darkSteel, [px, y + 1.95, pz], null, false);
    }
    k.cyl(g, [0.11, 0.11, 2.0, 10], M.steel, [cx, y + 2.75, cz], alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], false);
  };

  const UNITS = [
    { name: 'column', fp: s => 2 * (0.9 + s * 0.9) + 2.4, sq: true, build: (x, z, y, s) => column(x, z, y, s) },
    { name: 'finfan', fp: () => [8.4, 6.4], build: (x, z, y) => finfan(x, z, y) },
    { name: 'structure', fp: () => [6.8, 6.8], build: (x, z, y) => structure(x, z, y) },
    { name: 'hdrum', fp: (s, ax) => ax ? [7.2, 3.2] : [3.2, 7.2], build: (x, z, y, s, ax) => hdrum(x, z, y, ax) },
    { name: 'exchangers', fp: (s, ax) => ax ? [7.2, 2.8] : [2.8, 7.2], build: (x, z, y, s, ax) => exchangers(x, z, y, ax) },
    { name: 'pumps', fp: (s, ax) => ax ? [6.2, 2.4] : [2.4, 6.2], build: (x, z, y, s, ax) => pumps(x, z, y, ax) },
    { name: 'skid', fp: (s, ax) => ax ? [3.8, 2.6] : [2.6, 3.8], build: (x, z, y, s, ax) => skid(x, z, y, ax) },
    { name: 'pot', fp: () => [3.4, 2.4], build: (x, z, y) => pot(x, z, y) },
    { name: 'station', fp: (s, ax) => ax ? [2.8, 1.4] : [1.4, 2.8], build: (x, z, y, s, ax) => station(x, z, y, ax) }
  ];

  /** Try to stand a unit with its middle at (x, z); true when it stood. */
  const tryUnit = (x, z, u, s, ax) => {
    const f = u.fp(s, ax);
    const [fx, fz] = Array.isArray(f) ? f : [f, f];
    const r = { minX: x - fx / 2, maxX: x + fx / 2, minZ: z - fz / 2, maxZ: z + fz / 2 };
    if (!fits(r)) return false;
    const y = flatUnder(r);
    if (y === null) return false;
    u.build(x, z, y, s, ax);
    placed.push(r);
    return true;
  };

  // The blocks between the alleys, and the land beyond them inside the fence: swept on a 7.5 m lattice, nearest the walk first.
  const B = { minX: Math.max(PLANT.minX, -66), maxX: PLANT.maxX - 2, minZ: PLANT.minZ + 2, maxZ: PLANT.maxZ - 2 };
  const cells = [];
  for (let x = B.minX + 4; x < B.maxX - 3; x += 7.5) for (let z = B.minZ + 4; z < B.maxZ - 3; z += 7.5) {
    // Nearest the walk first: what lines an alley is what a player sees.
    let d = Infinity;
    for (const v of plan.openVols) {
      const q = v.rect;
      d = Math.min(d, Math.hypot(Math.max(q.minX - x, 0, x - q.maxX), Math.max(q.minZ - z, 0, z - q.maxZ)));
    }
    cells.push([x, z, d]);
  }
  for (let x = PLANT_YARD.minX + 4; x < PLANT_YARD.maxX - 3; x += 7.5) for (let z = PLANT_YARD.minZ + 4; z < PLANT_YARD.maxZ - 3; z += 7.5) cells.push([x, z, 50]);
  cells.sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
  for (const [x, z] of cells) {
    const order = [0, 1, 2, 3, 4, 5].sort((a, b) => ((a * 7 + Math.floor(x * 13 + z * 7)) % 6) - ((b * 7 + Math.floor(x * 13 + z * 7)) % 6));
    for (const i of order) {
      const s = R(), ax = R() > 0.5;
      // Nudge a little off the lattice so the rows do not line up like a parade.
      const jx = (R() - 0.5) * 1.5, jz = (R() - 0.5) * 1.5;
      if (tryUnit(x + jx, z + jz, UNITS[i], s, ax) || tryUnit(x, z, UNITS[i], s, ax)) break;
    }
  }
  // The gaps the big units leave: a finer sweep along every alley's sides, 2.4 to 6 m back from its edge, with the small
  // units and the drums and exchangers turned along the alley.
  for (const v of plan.openVols) {
    if (v.kind !== 'alley' && v.kind !== 'yard') continue;
    const q = v.rect, alongX = q.maxX - q.minX > q.maxZ - q.minZ;
    for (const back of [2.9, 4.6, 7.0]) {
      for (const side of [-1, 1]) {
        const [a0, a1] = alongX ? [q.minX, q.maxX] : [q.minZ, q.maxZ];
        const s = alongX ? (side < 0 ? q.minZ - back : q.maxZ + back) : (side < 0 ? q.minX - back : q.maxX + back);
        for (let a = a0 + 1.5; a < a1 - 1.5; a += 1.5) {
          const [x, z] = alongX ? [a, s] : [s, a];
          for (const i of [6, 7, 3, 4, 5, 8]) if (tryUnit(x, z, UNITS[i], R(), i === 7 ? false : alongX)) break;
        }
      }
    }
  }
  // And whatever room is left between units anywhere in the plant: the small units on a 3 m lattice.
  for (let x = B.minX + 2; x < B.maxX - 2; x += 3) for (let z = B.minZ + 2; z < B.maxZ - 2; z += 3) {
    for (const i of [6, 7, 8]) if (tryUnit(x, z, UNITS[i], R(), R() > 0.5)) break;
  }
  g.userData.colliders = [];
  g.userData.units = placed.length;
  return g;
}

/* ================================================================== the bund and the cellar's deck */

/** The tank bund's four tanks on their ring walls, and the manifold on the pump cellar's roof, its lines to the tanks. */
function buildBund(w) {
  const k = kitFor(w), M = w.M, plan = w.plan;
  const g = new THREE.Group();
  g.name = 'tank-bund';
  const y = BUND.minZ !== undefined ? -4 : 0;
  const tanks = [[-29.5, -13.4, 3.0, 7.5], [-20, -13.4, 3.0, 6.5], [-29.5, 1.8, 3.2, 7.0], [-20, 1.8, 3.2, 8.0]];
  for (const [x, z, r, h] of tanks) {
    k.cyl(g, [r + 0.35, r + 0.35, 0.35, 28], M.concrete, [x, y + 0.175, z], null, false);
    k.cyl(g, [r, r, h, 28], M.cladding, [x, y + 0.35 + h / 2, z]);
    const roof = part(w.ctx, new THREE.ConeGeometry(r + 0.05, r * 0.22, 28), M.cladding, x, y + 0.35 + h + r * 0.11, z, { cast: true });
    g.add(roof);
    for (let yy = y + 2.0; yy < y + h; yy += 2.0) k.cyl(g, [r + 0.05, r + 0.05, 0.07, 28], M.steel, [x, yy, z], null, false);
    // The outlet at the foot and its line along the bund floor toward the cellar.
    k.cyl(g, [0.15, 0.15, 1.2, 10], M.steel, [x + r + 0.5, y + 0.6, z], [0, 0, Math.PI / 2], false);
  }
  // The manifold on the cellar's deck: four lines along it with a valve each.
  const room = plan.roomById.get('room-3'), rr = room.vol.rect;
  const deck = room.level + room.top + 0.66;
  for (let i = 0; i < 4; i++) {
    const z = rr.minZ + 1.6 + i * 2.8;
    k.cyl(g, [0.15, 0.15, rr.maxX - rr.minX - 1, 12], M.steel, [(rr.minX + rr.maxX) / 2, deck + 0.6, z], [0, 0, Math.PI / 2]);
    for (const x of [rr.minX + 1.5, rr.maxX - 2]) k.box(g, [0.3, 0.6, 0.3], M.darkSteel, [x, deck + 0.3, z], null, false);
    k.box(g, [0.4, 0.4, 0.4], M.darkSteel, [rr.minX + 4 + i, deck + 0.6, z]);
    const wheel = new THREE.Mesh(w.own(new THREE.TorusGeometry(0.22, 0.02, 6, 18)), M.darkSteel);
    wheel.position.set(rr.minX + 4 + i, deck + 1.1, z);
    wheel.rotation.x = Math.PI / 2;
    g.add(wheel);
  }
  g.userData.colliders = [];
  return g;
}

/* ================================================================== the heater, the flare, the pylons */

/** The feed heater: a firebox lined with refractory, its convection section over it and the stack. The burners are under it. */
function buildHeater(w) {
  const k = kitFor(w), M = w.M;
  const g = new THREE.Group();
  g.name = 'feed-heater';
  const { x, z, w: W, d: D, h: H } = HEATER, y = PLOT;
  // Legs: the firebox stands on columns 3 m over the plot, so the burners can be reached under it.
  for (const sx of [-W / 2 + 0.5, 0, W / 2 - 0.5]) for (const sz of [-D / 2 + 0.5, D / 2 - 0.5]) k.stanchion(g, x + sx, z + sz, y, y + 3.0);
  k.slab(g, [W, H, D], M.paintRed, [x, y + 3 + H / 2, z], { tile: 2.4 });
  for (let i = 0; i <= 7; i++) k.box(g, [0.25, H, D + 0.1], M.darkSteel, [x - W / 2 + i * W / 7, y + 3 + H / 2, z]);
  // The convection section: narrower, on top; the breeching and the stack.
  k.slab(g, [W - 3, 4, D - 3], M.steel, [x, y + 3 + H + 2, z], { tile: 2.4 });
  k.box(g, [3, 3, 3], M.steel, [x, y + 3 + H + 5.5, z]);
  k.cyl(g, [1.2, 1.4, HEATER.stack - (3 + H + 7), 18], M.rusted, [x, y + 3 + H + 7 + (HEATER.stack - (3 + H + 7)) / 2, z]);
  for (let yy = y + 3 + H + 10; yy < y + HEATER.stack; yy += 6) k.cyl(g, [1.35, 1.35, 0.2, 18], M.darkSteel, [x, yy, z], null, false);
  // The burners under the floor, their fuel gas ring.
  for (const sx of [-4.5, -1.5, 1.5, 4.5]) k.cyl(g, [0.35, 0.45, 1.2, 12], M.darkSteel, [x + sx, y + 2.4, z]);
  k.cyl(g, [0.06, 0.06, W - 2, 8], M.steel, [x, y + 1.3, z + 1.2], [0, 0, Math.PI / 2], false);
  // The transfer line from the heater's outlet to the riser's foot.
  const rx = SKIRT.x - SKIRT.r - SKIRT.t - 0.15 - 1.6;
  k.pipe(g, [[x + W / 2, y + 6, z], [rx - 2.5, y + 6, z], [rx - 2.5, y + 6, SKIRT.z], [rx - 1.0, y + 6, SKIRT.z]], 0.35, M.cladding);
  g.userData.colliders = [];
  return g;
}

/** A lattice mast: four legs tapering to a head, braced; a rod on top. */
function lattice(w, g, x, y, z, h, base) {
  const M = w.M, ctx = w.ctx;
  const lv = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6; lv.push([y + h * t, base * (1 - t) + 0.35 * t]); }
  const at = (yy, s) => [[x - s, yy, z - s], [x + s, yy, z - s], [x + s, yy, z + s], [x - s, yy, z + s]];
  for (let i = 0; i < lv.length - 1; i++) {
    const a = at(...lv[i]), b = at(...lv[i + 1]);
    for (let j = 0; j < 4; j++) {
      g.add(between(ctx, a[j], b[j], 0.09, M.darkSteel, 6));
      g.add(between(ctx, a[j], b[(j + 1) % 4], 0.04, M.darkSteel, 5));
      g.add(between(ctx, b[j], b[(j + 1) % 4], 0.05, M.darkSteel, 5));
    }
  }
  g.add(between(ctx, [x, y + h, z], [x, y + h + 3.5, z], 0.06, M.copper, 6));
  g.add(part(ctx, new THREE.BoxGeometry(base * 2 + 0.6, 0.6, base * 2 + 0.6), M.concrete, x, y + 0.3, z));
}

/** The rod pylons on the plant. (Those on the lava field are the far country's.) */
function buildPylons(w) {
  const g = new THREE.Group();
  g.name = 'rod-pylons';
  for (const [x, z, kind] of ROD_SITES) if (kind === 'plant') lattice(w, g, x, land(x, z), z, ROD_H.plant, 1.8);
  g.userData.colliders = [];
  return g;
}

/**
 * The flare: the stack in the flare yard's south-east corner, held up in a three-legged derrick; the flare header coming in along
 * the yard's south fence from the plant to the knock-out drum outside the east fence, and up to the stack's foot.
 */
function buildFlare(w) {
  const k = kitFor(w), M = w.M, ctx = w.ctx;
  const g = new THREE.Group();
  g.name = 'flare-stack';
  const { x, z, h } = STACK, y = PLOT;
  // The derrick: three legs from a 9 m triangle to the stack near its top, braced every 6 m.
  const legs = [0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3 + 0.4; return [x + Math.cos(a) * 4.5, z + Math.sin(a) * 4.5]; });
  for (const [lx, lz] of legs) {
    g.add(part(ctx, new THREE.BoxGeometry(1.2, 0.6, 1.2), M.concrete, lx, y + 0.3, lz));
    g.add(between(ctx, [lx, y + 0.6, lz], [x + (lx - x) * 0.12, y + h - 4, z + (lz - z) * 0.12], 0.16, M.darkSteel, 8));
  }
  for (let yy = y + 6; yy < y + h - 6; yy += 6) {
    const t = (yy - y) / (h - 4);
    const pts = legs.map(([lx, lz]) => [x + (lx - x) * (1 - 0.88 * t), yy, z + (lz - z) * (1 - 0.88 * t)]);
    for (let i = 0; i < 3; i++) g.add(between(ctx, pts[i], pts[(i + 1) % 3], 0.06, M.darkSteel, 6));
  }
  // The stack: a riser 1.1 m across to the tip, the tip's wind shield, the pilot lines up its side.
  g.add(part(ctx, drumGeo(0.55, h, x, y, z, 16), M.rusted, 0, 0, 0, { cast: true }));
  g.add(part(ctx, new THREE.CylinderGeometry(0.85, 0.7, 2.2, 16, 1, true), M.darkSteel, x, y + h + 0.6, z, { cast: true }));
  g.add(between(ctx, [x + 0.7, y + 1, z], [x + 0.7, y + h, z], 0.04, M.steel, 6));
  g.add(part(ctx, new THREE.CylinderGeometry(1.0, 1.0, 1.2, 16), M.concrete, x, y + 0.6, z));
  // The header: in from the west along the yard's south side outside the fence, to the knock-out drum, and to the stack's foot.
  k.pipe(g, [[38, y + 3.4, 91.6], [89.5, y + 3.4, 91.6], [89.5, y + 3.4, 84]], 0.4, M.steel);
  for (let px = 40; px < 89; px += 6) k.box(g, [0.4, 3.0, 0.4], M.darkSteel, [px, y + 1.5, 91.6]);
  k.cyl(g, [1.8, 1.8, 10, 20], M.steel, [89.5, y + 2.6, 76], [Math.PI / 2, 0, 0]);
  for (const zz of [72.5, 79.5]) k.box(g, [3.2, 1.0, 0.5], M.concrete, [89.5, y + 0.5, zz]);
  k.pipe(g, [[89.5, y + 4.4, 76], [89.5, y + 5.8, 76], [87.5, y + 5.8, 76], [87.5, y + 5.8, z], [x + 0.8, y + 5.8, z]], 0.3, M.steel);
  // The stack and the derrick's feet are in the yard: the walk is held off them.
  g.userData.colliders = [{ x, z, r: 1.4 }, ...legs.map(([lx, lz]) => ({ x: lx, z: lz, r: 0.9 }))];
  return g;
}

/* ================================================================== the far country */

/**
 * Beyond the fence, to the horizon: the rod pylons out on the lava (north, east, south, west), the shield volcano the flows
 * came from in the east, the export tank farm in the south, three pressure spheres in the west, the storm's own line of pylons
 * marching north. `phys: 'ambient'`.
 */
function buildFarCountry(w) {
  const M = w.M, ctx = w.ctx;
  const g = new THREE.Group();
  g.name = 'far-country';
  g.userData.phys = 'ambient';
  for (const [x, z, kind] of ROD_SITES) if (kind === 'far') lattice(w, g, x, land(x, z), z, ROD_H.far, 2.6);
  // East: the shield the flows came from, low and broad, its summit crater's rim notched.
  {
    const geo = new THREE.ConeGeometry(520, 210, 48, 6, true);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const vy = p.getY(i);
      if (vy > 100) p.setY(i, 100 + (vy - 100) * 0.15 + Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 5) * 3);
    }
    geo.computeVertexNormals();
    const rock = w.own(new THREE.MeshStandardMaterial({ color: 0x2a2829, roughness: 0.95, metalness: 0 }));
    const m = part(ctx, geo, rock, 900, 60, -120);
    g.add(m);
  }
  // South: the export tank farm, six floating-roof tanks on the lower lava.
  for (let i = 0; i < 6; i++) {
    const x = -120 + (i % 3) * 58, z = 250 + Math.floor(i / 3) * 56;
    const y = land(x, z);
    g.add(part(ctx, drumGeo(22, 15, x, y, z, 40), M.cladding, 0, 0, 0));
    g.add(part(ctx, drumGeo(22.6, 1.0, x, y - 0.5, z, 40), M.concrete, 0, 0, 0));
    for (let yy = y + 3; yy < y + 15; yy += 3) g.add(part(ctx, drumGeo(22.08, 0.25, x, yy, z, 40), M.steel, 0, 0, 0));
  }
  // West: three pressure spheres on their legs, and the pipe to them on sleepers.
  for (let i = 0; i < 3; i++) {
    const x = -230, z = -70 + i * 34, y = land(x, z);
    g.add(part(ctx, new THREE.SphereGeometry(12, 28, 18), M.cladding, x, y + 16, z));
    for (let j = 0; j < 8; j++) {
      const a = j * Math.PI / 4;
      g.add(between(ctx, [x + Math.cos(a) * 11.5, y, z + Math.sin(a) * 11.5], [x + Math.cos(a) * 11.5, y + 16, z + Math.sin(a) * 11.5], 0.45, M.darkSteel, 8));
    }
  }
  g.add(between(ctx, [-218, land(-150, 0) + 1.2, -36], [-70, land(-70, -36) + 1.2, -36], 0.5, M.steel, 10));
  g.userData.colliders = [];
  return g;
}

export const PLANT_BUILDERS = [buildRacks, buildWalkLamps, buildUnits, buildBund, buildHeater, buildPylons, buildFlare, buildFarCountry];

void WALL_T; void GRADE; void ARENA; void drumGeo;
