/**
 * lodestone/canyon-plan.js — Lodestone's slot canyon as plain data: the walk, its floor, its alcoves, its walls.
 *
 * NO THREE.JS HERE, ON PURPOSE (as `ligar/mine-plan.js` and `kettle/works-plan.js`). The layout generator
 * (`tools/gen-lodestone-layout.mjs`), the world (`lodestone.js`, `lodestone/terrain.js`), the walk, the guide arrow and
 * `verify:lodestone` all stand on this one declaration, so what is walked is what was drawn and what was checked.
 *
 * THE PLACE (`docs/plans/lodestone-world.md` section 7). A slot canyon cut down through a tableland of banded iron. It
 * leaves a scoured hollow at its head (the pad's ground), runs as straight joint-controlled runs between sharp bends, and
 * ends in a round pothole. At the outside of six bends the water undercut the wall under a hard band: those ALCOVES are
 * the benches' rooms, open on the canyon side, roofed by the overhanging band.
 *
 * THE WALK is a union of shapes, each with a floor:
 *   the hollow     a rectangle, level
 *   the runs       one rectangle per straight run, along its centre line and `hw` either side, squared off `hw` past
 *                  each end so two runs meet in a square corner; the floor follows the distance along the canyon `s`
 *                  (level for a landing round every bend, an even grade between)
 *   the alcoves    the shared layer's volumes (`lib/workings.js`): a rectangle with a level floor, a roof (the band),
 *                  and one opening, the mouth, onto the canyon (`to: null`)
 *   the pothole    a circle, level
 * `depth(x, z)` is how far a point is inside the walk (negative outside); everything else is read off it.
 *
 * ONE FLOOR. The height field is the walk's floor inside the walk, and the rock outside it: flat for 1.6 m past the edge
 * (behind the canyon's rock faces, which are bodies, `terrain.js`), then up to the tableland. A roof over an alcove is a
 * body, never ground. The walk is closed by a collider on every cell along its edge.
 */

import { makeWorkings, SIDE } from '../lib/workings.js';

/** The walk is this square about the origin (the stage's bound for every Learn world). */
export const WALK = 100;
export const SPAWN = [44, 1.6, 86];
export const SPAWN_LOOK = [30, 1.6, 74];
export const PAD = [66, 74];

/** The scoured hollow at the canyon's head, where the Avalon sets down. */
export const HOLLOW = Object.freeze({ rect: { minX: 34, maxX: 92, minZ: 52, maxZ: 94 }, floor: 0 });
/** The pothole at the canyon's foot, where the Coil stands. */
export const POTHOLE = Object.freeze({ x: 14, z: -67, r: 19, floor: -15.5 });
/** Where the Coil is fought: its ground in the pothole, the player's mark just inside it from the last run. */
export const ARENA = Object.freeze({ boss: [14, -15.5, -69], player: [14, 1.6, -53] });

/**
 * The canyon's centre line, head to foot. `y` is the floor at the bend; `a` and `b` are how far the landing round it runs
 * back and on along the canyon (m of `s`), long enough to take the whole mouth of the alcove there. `hw` is the half
 * width of the run that LEAVES this point.
 */
export const LINE = [
  { id: 'P0', x: 30, z: 74, y: 0.0, a: 40, b: 6, hw: 5 },
  { id: 'P1', x: -10, z: 74, y: -2.0, a: 6, b: 10, hw: 5 },
  { id: 'P2', x: -10, z: 40, y: -4.0, a: 6, b: 8, hw: 5 },
  { id: 'P3', x: 36, z: 40, y: -6.8, a: 6, b: 9, hw: 5 },
  { id: 'P4', x: 36, z: 12, y: -8.5, a: 6, b: 15, hw: 5 },
  { id: 'Q1', x: 6, z: 12, y: -9.5, a: 5.5, b: 5.5, hw: 4.5 },
  { id: 'Q2', x: -8, z: -2, y: -10.5, a: 5.5, b: 5.5, hw: 5 },
  { id: 'P5', x: -34, z: -2, y: -11.5, a: 6, b: 8.6, hw: 5 },
  { id: 'P6', x: -34, z: -28, y: -13.0, a: 6, b: 9, hw: 5 },
  { id: 'P7', x: 14, z: -28, y: -14.5, a: 6, b: 6, hw: 5 },
  { id: 'P8', x: 14, z: -50, y: -15.5, a: 4, b: 40, hw: 5 }
];

const rect = (minX, maxX, minZ, maxZ) => ({ minX, maxX, minZ, maxZ });

/**
 * THE ALCOVES, one per bench, in bench order. `rect` is the room (mouth to back wall, side wall to side wall); `face` is
 * the way out of it, toward the canyon (the mouth is the side of the rect that way). `roof` is floor to roof at the lip;
 * `roofBack` (optional) the roof over the back `backDepth` m, where a slab has fallen out; `chimney` (optional) a cleft
 * open to the sky across the room, `[from, to]` m out from the back wall. `sky` is how much of the sky's fill the cover
 * mask leaves in it. `skin` is how `stations.js` and `terrain.js` dress it.
 */
export const ALCOVES = [
  { id: 'core-store', site: 'site-1', rect: rect(-27, -15, 65, 79), face: [1, 0], roof: 4.8, sky: 0.14, skin: 'chert' },
  { id: 'manganese-face', site: 'site-2', rect: rect(-15, -3, 22.5, 35), face: [0, 1], roof: 5.2, roofBack: 7.5, backDepth: 6, sky: 0.16, skin: 'manganese' },
  { id: 'seep', site: 'site-3', rect: rect(41, 54, 32.6, 45), face: [-1, 0], roof: 5.5, sky: 0.12, skin: 'seep' },
  { id: 'drum-gallery', site: 'site-4', rect: rect(23, 41, -4.6, 7), face: [0, 1], roof: 4.6, sky: 0.1, skin: 'gallery' },
  { id: 'chimney', site: 'site-5', rect: rect(-51, -39, -9, 3), face: [1, 0], roof: 8.5, chimney: [1.2, 3.0], sky: 0.24, skin: 'stain' },
  { id: 'magnetite-pocket', site: 'site-6', rect: rect(-39, -26, -45, -33), face: [0, 1], roof: 5.2, sky: 0.12, skin: 'magnetite' }
];

/** How far in from an alcove's back wall its plate stands. */
export const PLATE_FROM_BACK = 4.5;

/* ------------------------------------------------------------------ geometry helpers */

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const OUT_OF = { '1,0': 'maxX', '-1,0': 'minX', '0,1': 'maxZ', '0,-1': 'minZ' };

/** The side of an alcove's rect its mouth is on. */
export const mouthSide = al => OUT_OF[al.face.join(',')];

/** An alcove's floor height: the canyon's at its bend (filled in by `makeCanyonPlan`). */
function hash2(x, z, s) {
  const v = Math.sin(x * 127.1 + z * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
}
function vnoise(x, z, s) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, s), b = hash2(ix + 1, iz, s), c = hash2(ix, iz + 1, s), d = hash2(ix + 1, iz + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Plain fractal noise in 0..1, for the tableland's relief (deterministic, no THREE). */
export function fbm(x, z, s = 1, oct = 3) {
  let t = 0, amp = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { t += amp * vnoise(x, z, s + i * 13); n += amp; x *= 2.03; z *= 2.03; amp *= 0.5; }
  return t / n;
}

/** How far inside a rectangle a point is (negative outside: the distance to it). */
function rectDepth(r, x, z) {
  const dx = Math.max(r.minX - x, x - r.maxX), dz = Math.max(r.minZ - z, z - r.maxZ);
  if (dx <= 0 && dz <= 0) return -Math.max(dx, dz);
  return -Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
}

/**
 * THE TABLELAND: the rock's top, everywhere outside the walk. About 4 m over the hollow, rising to the south-west to
 * about 20 m over the pothole's rim, with a little relief; past the walk it climbs into the ranges on the horizon.
 */
export function tableland(x, z) {
  const d = Math.hypot(x - PAD[0], z - PAD[1]);
  let y = 3.8 + 17 * smooth(30, 170, d) + (fbm(x * 0.018, z * 0.018, 3) - 0.5) * 3.2;
  // East: an escarpment where the beds break off, standing over the plain beyond the walk.
  y += 34 * smooth(228, 262, x) * smooth(-320, -160, z) * (1 - smooth(200, 360, z));
  const r = Math.hypot(x, z);
  const far = smooth(170, 360, r);
  if (far > 0) {
    const az = Math.atan2(x, z);
    const H = 14 + 46 * fbm(az * 1.7 + 4, 1.9, 29, 3);
    y += H * Math.pow(far, 1.3);
  }
  return y;
}

/* ------------------------------------------------------------------ the plan */

export function makeCanyonPlan() {
  // The runs, with the distance along the canyon at the start of each.
  const runs = [];
  let s = 0;
  const knotS = [0];
  for (let i = 0; i < LINE.length - 1; i++) {
    const A = LINE[i], B = LINE[i + 1];
    const L = Math.hypot(B.x - A.x, B.z - A.z);
    const dx = (B.x - A.x) / L, dz = (B.z - A.z) / L;
    runs.push({ i, A, B, L, dx, dz, s0: s, hw: A.hw });
    s += L;
    knotS.push(s);
  }
  const length = s;

  // The floor along the canyon: level over each landing, an even grade between.
  const knots = [];
  LINE.forEach((p, i) => { knots.push([knotS[i] - p.a, p.y], [knotS[i] + p.b, p.y]); });
  for (let i = 1; i < knots.length; i++) if (knots[i][0] <= knots[i - 1][0]) throw new Error(`canyon landings overlap at ${LINE[Math.floor(i / 2)].id}`);
  function floorAtS(sv) {
    if (sv <= knots[0][0]) return knots[0][1];
    for (let i = 1; i < knots.length; i++) {
      if (sv <= knots[i][0]) {
        const [s0, y0] = knots[i - 1], [s1, y1] = knots[i];
        return y0 + (y1 - y0) * (sv - s0) / (s1 - s0);
      }
    }
    return knots[knots.length - 1][1];
  }
  /** True where the floor at `sv` is a landing (level). */
  const onLanding = sv => LINE.some((p, i) => sv >= knotS[i] - p.a - 1e-6 && sv <= knotS[i] + p.b + 1e-6);

  /** A run's frame at (x, z): distance along it (unclamped), across it, and how far inside its squared-off rect. */
  function inRun(r, x, z) {
    const px = x - r.A.x, pz = z - r.A.z;
    const t = px * r.dx + pz * r.dz;
    const c = -px * r.dz + pz * r.dx;
    const depth = Math.min(r.hw - Math.abs(c), r.L / 2 + r.hw - Math.abs(t - r.L / 2));
    return { t, c, depth };
  }

  // The alcoves: each takes the floor of the canyon at its mouth, which is a landing (checked in `problems`).
  const alcoves = ALCOVES.map(al => {
    const side = mouthSide(al);
    const r = al.rect;
    const mid = side === 'minX' || side === 'maxX'
      ? [r[side] + al.face[0] * 0.5, (r.minZ + r.maxZ) / 2]
      : [(r.minX + r.maxX) / 2, r[side] + al.face[1] * 0.5];
    const run = runs.map(rn => ({ rn, k: inRun(rn, mid[0], mid[1]) })).filter(o => o.k.depth > 0).sort((a, b) => b.k.depth - a.k.depth)[0];
    if (!run) throw new Error(`${al.id}: its mouth does not open onto the canyon`);
    const y = floorAtS(run.rn.s0 + Math.min(Math.max(run.k.t, -run.rn.hw), run.rn.L + run.rn.hw));
    return { ...al, side, floor: y };
  });

  // The alcoves as the shared layer's volumes: a roof, and one opening (the mouth) onto the canyon.
  const work = makeWorkings(alcoves.map(al => {
    const r = al.rect;
    const along = SIDE[al.side].along;
    const [lo, hi] = along === 'z' ? [r.minZ, r.maxZ] : [r.minX, r.maxX];
    return {
      id: al.id, kind: 'alcove', rect: { ...r }, floor: { y0: al.floor },
      roof: Math.max(al.roof, al.roofBack || 0), sky: al.sky,
      openings: [{ side: al.side, lo, hi, to: null }]
    };
  }), { roof: 5, holeMargin: 0, jamb: 0.4, wallInner: 0.3, wallDepth: 0.8, openKinds: [], outdoorDoors: true });
  const alcoveById = new Map(alcoves.map(a => [a.id, a]));

  /**
   * How far inside the walk (x, z) is, and the floor that holds there: the shape it is deepest in.
   * @returns {{ depth: number, floor: number, shape: string, s: number|null }}
   */
  function sample(x, z) {
    let best = { depth: -Infinity, floor: 0, shape: 'rock', s: null };
    const hd = rectDepth(HOLLOW.rect, x, z);
    if (hd > best.depth) best = { depth: hd, floor: HOLLOW.floor, shape: 'hollow', s: -1 };
    const pd = POTHOLE.r - Math.hypot(x - POTHOLE.x, z - POTHOLE.z);
    if (pd > best.depth) best = { depth: pd, floor: POTHOLE.floor, shape: 'pothole', s: length + 1 };
    for (const r of runs) {
      const k = inRun(r, x, z);
      if (k.depth > best.depth) {
        const sv = r.s0 + Math.min(Math.max(k.t, -r.hw), r.L + r.hw);
        best = { depth: k.depth, floor: floorAtS(sv), shape: `run-${r.i}`, s: sv, across: k.c, run: r };
      }
    }
    for (const al of alcoves) {
      // An alcove owns its rect, the mouth's plane included (the canyon's floor there is the same height).
      const d = rectDepth(al.rect, x, z);
      if (d >= 0) best = { depth: Math.max(d, best.depth), floor: al.floor, shape: al.id, s: null };
      else if (d > best.depth) best = { depth: d, floor: al.floor, shape: al.id, s: null };
    }
    return best;
  }

  /** The walk's floor at (x, z), or null when (x, z) is in the rock. */
  function floorAt(x, z) {
    const k = sample(x, z);
    return k.depth >= 0 ? k.floor : null;
  }

  /**
   * THE HEIGHT FIELD. Inside the walk: its floor (with the dry wash's shallow runnel down the middle of a run, never on a
   * landing). Outside: the floor carried 1.6 m into the rock (hidden behind the rock faces), then up to the tableland.
   */
  function height(x, z) {
    const k = sample(x, z);
    if (k.depth >= 0) {
      if (k.run && !onLanding(k.s)) {
        const w = smooth(0, 3, Math.min(k.s - prevLandingEnd(k.s), nextLandingStart(k.s) - k.s));
        return k.floor - 0.16 * w * Math.exp(-(k.across * k.across) / 2.2);
      }
      return k.floor;
    }
    const o = -k.depth;
    const T = tableland(x, z);
    return k.floor + Math.max(0, T - k.floor) * smooth(1.6, 3.6, o);
  }
  function prevLandingEnd(sv) {
    let e = -Infinity;
    LINE.forEach((p, i) => { const end = knotS[i] + p.b; if (end <= sv) e = Math.max(e, end); });
    return e;
  }
  function nextLandingStart(sv) {
    let b = Infinity;
    LINE.forEach((p, i) => { const st = knotS[i] - p.a; if (st >= sv) b = Math.min(b, st); });
    return b;
  }

  /** Floor to roof over a point in an alcove (the chimney is open: Infinity), or null outside every alcove. */
  function roofOver(x, z) {
    for (const al of alcoves) {
      const r = al.rect;
      if (x < r.minX - 1e-6 || x > r.maxX + 1e-6 || z < r.minZ - 1e-6 || z > r.maxZ + 1e-6) continue;
      const fromBack = distFromBack(al, x, z);
      if (al.chimney && fromBack >= al.chimney[0] && fromBack <= al.chimney[1]) return Infinity;
      if (al.roofBack && fromBack <= al.backDepth) return al.roofBack;
      return al.roof;
    }
    return null;
  }
  /** How far a point is out from an alcove's back wall, toward its mouth. */
  function distFromBack(al, x, z) {
    const r = al.rect;
    if (al.side === 'maxX') return x - r.minX;
    if (al.side === 'minX') return r.maxX - x;
    if (al.side === 'maxZ') return z - r.minZ;
    return r.maxZ - z;
  }

  /* ---------------------------------------------------------------- the walk's edge */

  /** Bounds of the whole walk. */
  const bounds = { minX: -60, maxX: 96, minZ: -92, maxZ: 98 };

  /**
   * The colliders that close the walk: every 0.5 m cell not wholly inside the walk but touching one that is, merged into
   * boxes (runs along x, then runs of identical spans along z). The player is held on cells wholly inside the walk.
   */
  function edgeColliders(cell = 0.5) {
    const nx = Math.round((bounds.maxX - bounds.minX) / cell), nz = Math.round((bounds.maxZ - bounds.minZ) / cell);
    const inside = new Uint8Array(nx * nz);
    const cornerIn = new Uint8Array((nx + 1) * (nz + 1));
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) cornerIn[j * (nx + 1) + i] = sample(bounds.minX + i * cell, bounds.minZ + j * cell).depth >= 0 ? 1 : 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const c = j * (nx + 1) + i;
      inside[j * nx + i] = cornerIn[c] && cornerIn[c + 1] && cornerIn[c + nx + 1] && cornerIn[c + nx + 2] ? 1 : 0;
    }
    const rim = new Uint8Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      if (inside[j * nx + i]) continue;
      let near = false;
      for (let dj = -1; dj <= 1 && !near; dj++) for (let di = -1; di <= 1; di++) {
        const a = i + di, b = j + dj;
        if (a >= 0 && b >= 0 && a < nx && b < nz && inside[b * nx + a]) { near = true; break; }
      }
      if (near) rim[j * nx + i] = 1;
    }
    // Runs along x in each row, then rows with the same run stacked into one box.
    const open = new Map();
    const boxes = [];
    for (let j = 0; j <= nz; j++) {
      const rowRuns = new Set();
      if (j < nz) {
        let i = 0;
        while (i < nx) {
          if (!rim[j * nx + i]) { i++; continue; }
          const i0 = i;
          while (i < nx && rim[j * nx + i]) i++;
          rowRuns.add(`${i0},${i}`);
        }
      }
      for (const [k, b] of open) if (!rowRuns.has(k)) { boxes.push(b); open.delete(k); }
      for (const k of rowRuns) {
        if (open.has(k)) open.get(k).maxZ = bounds.minZ + (j + 1) * cell;
        else {
          const [i0, i1] = k.split(',').map(Number);
          open.set(k, { minX: bounds.minX + i0 * cell, maxX: bounds.minX + i1 * cell, minZ: bounds.minZ + j * cell, maxZ: bounds.minZ + (j + 1) * cell });
        }
      }
    }
    return boxes.map(b => ({ ...b, edge: true }));
  }

  /**
   * The edge of the walk as closed loops of [x, z] (marching squares on `depth`, `cell` m), each wound so the walk is on
   * its LEFT. The rock faces (`terrain.js`) stand along them.
   */
  function edgeLoops(cell = 0.5) {
    const x0 = bounds.minX - 2, z0 = bounds.minZ - 2;
    const nx = Math.round((bounds.maxX - bounds.minX + 4) / cell), nz = Math.round((bounds.maxZ - bounds.minZ + 4) / cell);
    const D = new Float32Array((nx + 1) * (nz + 1));
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) D[j * (nx + 1) + i] = sample(x0 + i * cell, z0 + j * cell).depth;
    const P = (i, j) => [x0 + i * cell, z0 + j * cell];
    const val = (i, j) => D[j * (nx + 1) + i];
    // A cut is named by the grid edge it lies on, so two cells that share an edge name its cut alike.
    const edgeKey = (i, j, horiz) => `${horiz ? 'h' : 'v'}${i},${j}`;
    const cutPt = (ia, ja, ib, jb) => {
      const da = val(ia, ja), db = val(ib, jb), t = da / (da - db);
      const pa = P(ia, ja), pb = P(ib, jb);
      return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t];
    };
    const next = new Map();
    const pts = new Map();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      // The cell's corners anticlockwise from (i, j), seen with +x right and +z up, and its edges between them.
      const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const keys = [edgeKey(i, j, true), edgeKey(i + 1, j, false), edgeKey(i, j + 1, true), edgeKey(i, j, false)];
      const d = c.map(([a2, b2]) => val(a2, b2));
      const cuts = [];
      for (let e = 0; e < 4; e++) {
        const a2 = e, b2 = (e + 1) % 4;
        if ((d[a2] >= 0) !== (d[b2] >= 0)) {
          if (!pts.has(keys[e])) pts.set(keys[e], cutPt(...c[a2], ...c[b2]));
          cuts.push({ k: keys[e], inFirst: d[a2] >= 0 });
        }
      }
      // Going anticlockwise round the cell, the walk is on the left of the edge from the cut where we enter the rock... the
      // segment runs from the cut where the corner order goes rock -> walk to the one where it goes walk -> rock.
      const link = (u, v) => { const [from, to] = u.inFirst ? [u, v] : [v, u]; next.set(from.k, to.k); };
      if (cuts.length === 2) link(cuts[0], cuts[1]);
      else if (cuts.length === 4) {
        const centre = d.reduce((x2, y2) => x2 + y2, 0) / 4;
        if (centre >= 0) { link(cuts[0], cuts[1]); link(cuts[2], cuts[3]); } else { link(cuts[3], cuts[0]); link(cuts[1], cuts[2]); }
      }
    }
    const loops = [];
    const used = new Set();
    for (const [k0] of next) {
      if (used.has(k0)) continue;
      const loop = [];
      let k = k0;
      while (k !== undefined && !used.has(k)) {
        used.add(k);
        loop.push(pts.get(k));
        k = next.get(k);
      }
      if (loop.length > 8) loops.push(simplify(loop));
    }
    // Wound with the walk on the left of each step; reverse a loop that is not.
    return loops.map(loop => {
      let votes = 0;
      for (let i = 0; i < loop.length; i += Math.max(1, Math.floor(loop.length / 12))) {
        const a2 = loop[i], b2 = loop[(i + 1) % loop.length];
        const tx = b2[0] - a2[0], tz = b2[1] - a2[1], l = Math.hypot(tx, tz) || 1;
        const m = [(a2[0] + b2[0]) / 2 - (tz / l) * 0.3, (a2[1] + b2[1]) / 2 + (tx / l) * 0.3];
        votes += sample(m[0], m[1]).depth >= 0 ? 1 : -1;
      }
      return votes >= 0 ? loop : loop.reverse();
    });
  }

  /** Drop points that lie on the straight line from the last point kept to the next (closed loop); keep one every 6 m. */
  function simplify(loop) {
    const out = [loop[0]];
    for (let i = 1; i < loop.length; i++) {
      const a = out[out.length - 1], b = loop[i], c = loop[(i + 1) % loop.length];
      const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const off = Math.abs((b[0] - a[0]) * dz - (b[1] - a[1]) * dx) / l;
      if (off < 0.02 && Math.hypot(c[0] - a[0], c[1] - a[1]) < 6) continue;
      out.push(b);
    }
    return out;
  }

  /* ---------------------------------------------------------------- light */

  /**
   * THE COVER MASK (`lib/cover.js`). The sun stands 11 degrees up; it reaches only the top few metres of the canyon's
   * walls. One box per run (its squared rect, widened into the rock) from under the floor to 3 m below the lower rim along
   * it, one over the pothole, and the air of every alcove from the shared layer. A box keeps a fraction of the sky's fill:
   * half in a run, a little in an alcove.
   */
  function coverSpec() {
    const boxes = work.coverBoxes(-0.05).map(b => ({ ...b, sky: alcoveById.get(b.id).sky }));
    for (const r of runs) {
      const ext = r.hw + 1.2;
      let lowRim = Infinity, lo = Infinity;
      for (let t = -r.hw; t <= r.L + r.hw; t += 2) for (const side of [-1, 1]) {
        const x = r.A.x + r.dx * t + -r.dz * side * (r.hw + 3.8), z = r.A.z + r.dz * t + r.dx * side * (r.hw + 3.8);
        lowRim = Math.min(lowRim, tableland(x, z));
      }
      for (const p of [r.A, r.B]) lo = Math.min(lo, p.y);
      const top = lowRim - 3;
      if (top - lo < 2.5) continue;
      const cs = [];
      for (const t of [-ext, r.L + ext]) for (const c of [-ext, ext]) cs.push([r.A.x + r.dx * t - r.dz * c, r.A.z + r.dz * t + r.dx * c]);
      const minX = Math.min(...cs.map(q => q[0])), maxX = Math.max(...cs.map(q => q[0]));
      const minZ = Math.min(...cs.map(q => q[1])), maxZ = Math.max(...cs.map(q => q[1]));
      boxes.push({ id: `run-${r.i}`, min: [minX, lo - 0.6, minZ], max: [maxX, top, maxZ], sky: 0.48 });
    }
    {
      let lowRim = Infinity;
      for (let a = 0; a < 24; a++) lowRim = Math.min(lowRim, tableland(POTHOLE.x + Math.cos(a / 24 * Math.PI * 2) * (POTHOLE.r + 3.8), POTHOLE.z + Math.sin(a / 24 * Math.PI * 2) * (POTHOLE.r + 3.8)));
      boxes.push({ id: 'pothole', min: [POTHOLE.x - POTHOLE.r - 1.5, POTHOLE.floor - 0.6, POTHOLE.z - POTHOLE.r - 1.5], max: [POTHOLE.x + POTHOLE.r + 1.5, lowRim - 4, POTHOLE.z + POTHOLE.r + 1.5], sky: 0.62 });
    }
    return { boxes, openings: [] };
  }

  /* ---------------------------------------------------------------- the way */

  /** The distance along the canyon of the centre-line point nearest (x, z). */
  function sAt(x, z) {
    let best = { d: Infinity, s: 0 };
    for (const r of runs) {
      const t = Math.min(r.L, Math.max(0, (x - r.A.x) * r.dx + (z - r.A.z) * r.dz));
      const px = r.A.x + r.dx * t, pz = r.A.z + r.dz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < best.d) best = { d, s: r.s0 + t };
    }
    return best.s;
  }
  /** The centre-line point at distance `sv` along the canyon. */
  function pointAt(sv) {
    for (const r of runs) if (sv <= r.s0 + r.L + 1e-6) { const t = Math.max(0, sv - r.s0); return [r.A.x + r.dx * t, r.A.z + r.dz * t]; }
    const r = runs[runs.length - 1];
    return [r.B.x, r.B.z];
  }
  /** An alcove's mouth: the middle of its open side, and the point a stride out from it on the canyon floor. */
  function mouthOf(al) {
    const r = al.rect;
    const along = SIDE[al.side].along;
    const m = along === 'z' ? [r[al.side], (r.minZ + r.maxZ) / 2] : [(r.minX + r.maxX) / 2, r[al.side]];
    return { mid: m, out: [m[0] + al.face[0] * 1.6, m[1] + al.face[1] * 1.6], inn: [m[0] - al.face[0] * 1.6, m[1] - al.face[1] * 1.6] };
  }
  const alcoveAt = (x, z) => alcoves.find(al => x >= al.rect.minX && x <= al.rect.maxX && z >= al.rect.minZ && z <= al.rect.maxZ) || null;

  /**
   * The way on foot from (fx, fz) to (tx, tz): out of an alcove by its mouth, down (or up) the canyon bend by bend along
   * its centre line, and into the target's alcove by its mouth. Every leg stays on the walk.
   */
  function routeTo(fx, fz, tx, tz) {
    const pts = [[fx, fz]];
    const fromAl = alcoveAt(fx, fz), toAl = alcoveAt(tx, tz);
    if (fromAl && fromAl === toAl) return [[fx, fz], [tx, tz]];
    let sFrom, sTo;
    if (fromAl) { const m = mouthOf(fromAl); pts.push(m.inn, m.out); sFrom = sAt(...m.out); }
    else if (rectDepth(HOLLOW.rect, fx, fz) >= 0) { pts.push([HOLLOW.rect.minX + 3, LINE[0].z]); sFrom = sAt(HOLLOW.rect.minX + 3, LINE[0].z); }
    else sFrom = sAt(fx, fz);
    let tail;
    if (toAl) { const m = mouthOf(toAl); sTo = sAt(...m.out); tail = [m.out, m.inn, [tx, tz]]; }
    else if (rectDepth(HOLLOW.rect, tx, tz) >= 0) { sTo = 0; tail = [[HOLLOW.rect.minX + 3, LINE[0].z], [tx, tz]]; }
    else { sTo = sAt(tx, tz); tail = [[tx, tz]]; }
    const start = fromAl || rectDepth(HOLLOW.rect, fx, fz) >= 0 ? null : pointAt(sFrom);
    if (start && Math.hypot(start[0] - fx, start[1] - fz) > 1.5) pts.push(start);
    const bends = knotS.slice(1, -1).map((kv, i) => ({ s: kv, p: [LINE[i + 1].x, LINE[i + 1].z] }));
    const way = sTo >= sFrom ? bends.filter(b => b.s > sFrom && b.s < sTo) : bends.filter(b => b.s < sFrom && b.s > sTo).reverse();
    for (const b of way) pts.push(b.p);
    pts.push(pointAt(sTo));
    for (const t of tail) pts.push(t);
    // Drop repeated points.
    return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.05);
  }

  /* ---------------------------------------------------------------- self-check */

  /** What is wrong with the declaration (empty when it is sound). */
  function problems() {
    const bad = [];
    for (const al of alcoves) {
      const r = al.rect;
      const w = al.side === 'minX' || al.side === 'maxX' ? r.maxZ - r.minZ : r.maxX - r.minX;
      const d = al.side === 'minX' || al.side === 'maxX' ? r.maxX - r.minX : r.maxZ - r.minZ;
      if (w < 11.2 || d < 11 || al.roof < 4.4) bad.push(`${al.id}: ${w} x ${d} m with ${al.roof} m of roof is under 11.2 x 11 x 4.4`);
      // The whole mouth opens onto canyon floor at the alcove's own level.
      const along = SIDE[al.side].along;
      const [lo, hi] = along === 'z' ? [r.minZ, r.maxZ] : [r.minX, r.maxX];
      for (let u = lo + 0.3; u <= hi - 0.3; u += 0.5) {
        const [x, z] = along === 'z' ? [r[al.side] + al.face[0] * 0.3, u] : [u, r[al.side] + al.face[1] * 0.3];
        const k = sample(x, z);
        if (k.depth < 0.25 || k.shape === al.id) { bad.push(`${al.id}: its mouth meets rock at (${x.toFixed(1)}, ${z.toFixed(1)})`); break; }
        if (Math.abs(height(x, z) - al.floor) > 0.005) { bad.push(`${al.id}: the canyon floor at its mouth (${x.toFixed(1)}, ${z.toFixed(1)}) is ${height(x, z).toFixed(2)}, not ${al.floor}`); break; }
      }
      // No two alcoves, and no alcove and another part of the walk than its own bend, are closer than 6 m of rock.
      for (const other of alcoves) if (other !== al && rectDepth(other.rect, (r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2) > -12) bad.push(`${al.id} is within 12 m of ${other.id}`);
    }
    for (const p of [[SPAWN[0], SPAWN[2]], PAD, [ARENA.boss[0], ARENA.boss[2]], [ARENA.player[0], ARENA.player[2]]]) {
      if (Math.abs(p[0]) > WALK - 4 || Math.abs(p[1]) > WALK - 4) bad.push(`(${p}) is outside the walk's square`);
      if (sample(p[0], p[1]).depth < 2) bad.push(`(${p}) is not well inside the walk`);
    }
    if (Math.abs(height(ARENA.boss[0], ARENA.boss[2]) - ARENA.boss[1]) > 1e-6) bad.push('the Coil\'s declared ground is not the pothole floor');
    return bad;
  }

  return {
    runs, length, knotS, alcoves, alcoveById, work, bounds,
    sample, floorAt, height, roofOver, distFromBack, onLanding, floorAtS,
    edgeColliders, edgeLoops, coverSpec, routeTo, sAt, pointAt, mouthOf, alcoveAt, problems,
    tableland
  };
}
