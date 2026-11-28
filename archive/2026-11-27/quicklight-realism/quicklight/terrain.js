/**
 * quicklight/terrain.js — The refinery as drawn: the lava under it, its alleys' paving, the kerbs, rails, fences and retaining
 * walls that close them, the tank bund, and the shells of the six rooms with the structures that stand over them.
 *
 * Everything here stands on `refinery-plan.js`. The GROUND MESH is the land that is not walked: both flows' hardstanding inside
 * the plant, the flow front between them in section, the bund's floor, the earth banked over the two bunkers, the lava field to
 * the horizon. It is sampled from the plan's ONE height field on a grid with a row of vertices on every line where the ground
 * steps, so a step is a sharp edge hidden inside the wall or kerb that stands on it. Every open walk volume is a hole in it (the
 * paving draws it), and so is every roofed volume not under earth (its own floor slab draws it).
 *
 *   makeQuicklightField  the height the game walks on (the plan's, with the pad's plate standing on the laydown yard)
 *   buildGroundGeometry  the ground mesh (vertex colours say what it is: flow top, front in section, hardstanding, bund, earth)
 *   buildPaving          the walks' surfaces: alleys, yards, ramps, courts (vertex colours: joints, gullies, wear, oil)
 *   buildRefinery        every built body as lists of geometries by material key: the walks' kerbs, rails, fences and walls;
 *                        the bund wall; each room's floor, walls and roof; the control block; the cracking reactor on its
 *                        skirt; the reactor train on its table; the catalyst bunker's hopper head
 *
 * Built in the world frame, as lists of geometries by material key; the world merges each list into meshes by square.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { floorOf } from '../lib/workings.js';
import {
  GRADE, PLOT, PIT, CELLAR, WALL_T, KERB, RAIL, DOOR, BUND, SKIRT, ROOF_T, land, fbm, frontZ, inPlant
} from './refinery-plan.js';

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const r2 = n => Math.round(n * 100) / 100;

/* ================================================================== the field */

/** The height the game walks on: the plan's, with the pad's plate standing on the laydown yard. */
export function makeQuicklightField(plan, pad) {
  const PAD_TOP = 0.12, PAD_R = 9.4;
  function height(x, z) {
    const y = plan.height(x, z);
    if (pad) {
      const d = Math.hypot(x - pad[0], z - pad[1]);
      if (d < PAD_R + 0.6) return y + PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  }
  return { height, PAD_TOP, PAD_R };
}

/* ================================================================== the ground */

/** A ladder of coordinates: `fine` m apart in the walk, `mid` m out to `outer`, then widening to the horizon. */
function ladder(lo, hi, walkLo, walkHi, outerLo, outerHi, fine, mid, breaks) {
  const s = new Set(breaks.map(v => Math.round(v * 100) / 100));
  for (let v = walkLo; v <= walkHi; v += fine) s.add(Math.round(v * 100) / 100);
  for (let v = walkHi; v <= outerHi; v += mid) s.add(Math.round(v * 100) / 100);
  for (let v = walkLo; v >= outerLo; v -= mid) s.add(Math.round(v * 100) / 100);
  for (let v = outerHi, st = mid; v <= hi; st *= 1.12, v += st) s.add(Math.round(v));
  for (let v = outerLo, st = mid; v >= lo; st *= 1.12, v -= st) s.add(Math.round(v));
  s.add(lo); s.add(hi);
  return [...s].filter(v => v >= lo && v <= hi).sort((a, b) => a - b);
}

/** The control block's whole footprint (the control room is its north-west corner); its walls close a2 on that stretch. */
export const BLOCK_FOOT = { minX: -3, maxX: 30, minZ: -61, maxZ: -32, h: 7.2 };

/** Is the cell centred at (x, z) drawn by something other than the ground mesh? */
function builtAt(plan, x, z) {
  const v = plan.volumeAt(x, z);
  if (v) return !plan.underEarth(v);
  if (x > BLOCK_FOOT.minX && x < BLOCK_FOOT.maxX && z > BLOCK_FOOT.minZ && z < BLOCK_FOOT.maxZ) return true;
  return false;
}

const inPlantRect = (x, z) => inPlant(x, z);

/** What the land is at (x, z): 0 lava (flow top), 1 the front in section, 2 hardstanding, 3 the bund's floor, 4 earth, 5 far flanks. */
function surfaceAt(plan, x, z, y, steep) {
  for (const r of plan.rooms) {
    if (!r.mound) continue;
    const base = r.level === CELLAR ? GRADE : PLOT;
    if (y > base + 0.15) {
      const R = r.rect;
      if (x > R.minX - 7 && x < R.maxX + r.doorT + 0.01 && z > R.minZ - 7 && z < R.maxZ + 7) return 4;
    }
  }
  if (inPlantRect(x, z)) {
    if (x > BUND.minX - 0.01 && x < BUND.maxX + 0.01 && z > BUND.minZ - 0.01 && z < BUND.maxZ + 0.01 && y < GRADE - 1) return 3;
    if (steep > 0.8) return 1;
    return 2;
  }
  if (Math.hypot(x, z) > 300) return 5;
  if (steep > 0.9) return 1;
  return 0;
}

const COLOURS = [
  [0.16, 0.16, 0.17],   // the flow's top: black glassy pahoehoe
  [0.24, 0.22, 0.21],   // the front in section (banded below)
  [0.42, 0.41, 0.39],   // hardstanding: crushed basalt, rolled
  [0.33, 0.32, 0.30],   // the bund's floor: concrete under oily silt
  [0.30, 0.27, 0.23],   // earth banked over a bunker: cinder and ash, packed
  [0.26, 0.25, 0.25]    // the far flanks
];

/**
 * The ground mesh. A vertex in a roofed volume under earth takes the land's height (the heap over it); every other walk volume's
 * cells are left out.
 */
export function buildGroundGeometry(field, plan) {
  const br = plan.breaks();
  const xs = ladder(-900, 900, -98, 96, -170, 170, 2, 3.5, br.xs);
  const zs = ladder(-900, 900, -98, 96, -170, 170, 2, 3.5, br.zs);
  const nx = xs.length, nz = zs.length;
  const roofedAt = (x, z) => plan.roofed.find(v => x >= v.rect.minX - 1e-6 && x <= v.rect.maxX + 1e-6 && z >= v.rect.minZ - 1e-6 && z <= v.rect.maxZ + 1e-6);
  const V = (x, z) => (roofedAt(x, z) ? plan.land(x, z) : field.height(x, z));
  const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
  const e = 0.01;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], k = j * nx + i;
    const y = V(x, z);
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
    const gx = (V(x + e, z) - V(x - e, z)) / (2 * e), gz = (V(x, z + e) - V(x, z - e)) / (2 * e);
    let n = [-gx, 1, -gz];
    const steep = Math.min(4, Math.hypot(gx, gz));
    if (steep > 3.5) n = [0, 1, 0];
    const l = Math.hypot(...n);
    nor[k * 3] = n[0] / l; nor[k * 3 + 1] = n[1] / l; nor[k * 3 + 2] = n[2] / l;
    const s = surfaceAt(plan, x, z, y, steep);
    let c = COLOURS[s];
    const m = 0.92 + 0.08 * Math.sin(x * 0.37 + Math.sin(z * 0.21) * 2) * Math.sin(z * 0.29 + x * 0.05);
    if (s === 1) {
      // THE FRONT IN SECTION: a flow is a rubbly base of clinker, a dense grey core jointed in slabs, a vesicular crust on top.
      const top = inPlantRect(x, z) ? PLOT : PLOT + (fbm(x * 0.045, z * 0.045) - 0.45) * 2.9;
      const d = top - y;
      if (d < 0.7) c = [0.27, 0.20, 0.17];                         // the crust: oxidised, red-brown, full of bubbles
      else if (d < 3.4) c = [0.31, 0.31, 0.32].map(v => v * (0.9 + 0.1 * Math.sin(y * 9.0 + x * 0.4)));   // the core
      else c = [0.19, 0.17, 0.16];                                  // the clinker at the base
    } else if (s === 0) {
      // Ropy pahoehoe: black with a sheen on the swells, rusty where steam has altered it, grey ash drifted in the hollows.
      const swell = fbm(x * 0.045, z * 0.045);
      const ash = smooth(0.38, 0.28, swell) * 0.5;
      const rust = smooth(0.62, 0.75, fbm(x * 0.012 + 4, z * 0.012)) * 0.35;
      c = c.map((v, q) => v + ([0.40, 0.39, 0.37][q] - v) * ash + ([0.30, 0.18, 0.12][q] - v) * rust);
    } else if (s === 2) {
      // Hardstanding: darker where vehicles turned and where drips from the racks have soaked in.
      const stain = smooth(0.55, 0.75, fbm(x * 0.12, z * 0.12)) * 0.35;
      c = c.map(v => v * (1 - stain));
    } else if (s === 3) {
      // The bund floor: dark where the last spill was let to stand, a tide line round the walls.
      const wet = smooth(0.4, 0.7, fbm(x * 0.09, z * 0.09));
      c = c.map((v, q) => v * (1 - 0.35 * wet) + ([0.20, 0.19, 0.16][q]) * 0.1 * wet);
    } else if (s === 4) {
      // Earth over a bunker: cinder packed hard, sparse wiry growth on the shoulders.
      const grow = smooth(0.5, 0.7, fbm(x * 0.4, z * 0.4)) * 0.4;
      c = c.map((v, q) => v + ([0.27, 0.29, 0.22][q] - v) * grow);
    }
    for (let q = 0; q < 3; q++) col[k * 3 + q] = c[q] * m;
    uv[k * 2] = x / 7; uv[k * 2 + 1] = z / 7;
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    if (builtAt(plan, cx, cz)) continue;
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/* ================================================================== the walks' surfaces */

const bell = (d, w = 2.2) => Math.exp(-(d * d) / w);

/** How worn the paving is at (x, z): along the middle of an alley or ramp, and in toward each door that opens off it. */
function trodden(plan, v, x, z) {
  const r = v.rect;
  const alongX = r.maxX - r.minX > r.maxZ - r.minZ;
  let w = alongX ? bell(z - (r.minZ + r.maxZ) / 2) : bell(x - (r.minX + r.maxX) / 2);
  for (const o of v.openings) {
    if (!o.to || !o.to.startsWith('door-')) continue;
    const mid = (o.lo + o.hi) / 2;
    if (o.side === 'minX' || o.side === 'maxX') w = Math.max(w, bell(z - mid) * smooth(o.side === 'minX' ? r.minX + 6 : r.maxX - 6, o.side === 'minX' ? r.minX : r.maxX, x));
    else w = Math.max(w, bell(x - mid) * smooth(o.side === 'minZ' ? r.minZ + 6 : r.maxZ - 6, o.side === 'minZ' ? r.minZ : r.maxZ, z));
  }
  return w * 0.9;
}

/**
 * The surface of every open walk: a grid of quads at the floor's height (a ramp's slope included), coloured: concrete with its
 * joints every 6 m, a drain gully down one side of an alley, a darker line where feet and trolleys wear it, oil under the racks;
 * the flare yard is crushed basalt, not concrete.
 */
export function buildPaving(plan) {
  const parts = [];
  for (const v of plan.openVols) {
    const r = v.rect;
    const xs = [], zs = [];
    for (let x = r.minX; x < r.maxX - 1e-6; x += 1.0) xs.push(x);
    xs.push(r.maxX);
    for (let z = r.minZ; z < r.maxZ - 1e-6; z += 1.0) zs.push(z);
    zs.push(r.maxZ);
    const nx = xs.length, nz = zs.length;
    const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), nor = new Float32Array(nx * nz * 3);
    const gravel = v.id === 'flare';
    const tone = gravel ? [0.30, 0.29, 0.28] : v.kind === 'ramp' ? [0.52, 0.51, 0.49] : v.kind === 'court' ? [0.47, 0.46, 0.44] : [0.55, 0.54, 0.52];
    const alongX = r.maxX - r.minX > r.maxZ - r.minZ;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], k = j * nx + i;
      const y = floorOf(v, Math.min(x, r.maxX - 1e-6), Math.min(z, r.maxZ - 1e-6));
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      nor[k * 3 + 1] = 1;
      let f = 1;
      if (!gravel) {
        // The joints: across the line of travel every 6 m.
        const s = alongX ? x : z;
        f *= Math.abs(((s % 6) + 6) % 6 - 3) > 2.8 ? 0.8 : 1;
        // The gully: a dark line half a metre in from one side of an alley.
        if (v.kind === 'alley') {
          const g = alongX ? z - r.minZ : x - r.minX;
          if (g > 0.4 && g < 0.75) f *= 0.62;
        }
        // A ramp's grooves across it every half metre.
        if (v.kind === 'ramp') {
          const t = v.floor.axis === 'x' ? x : z;
          f *= Math.abs(((t * 2) % 1 + 1) % 1 - 0.5) > 0.42 ? 0.82 : 1;
        }
        // Oil and condensate dripped from the racks, soaked in under the pipes.
        const drip = v.kind === 'alley' ? smooth(0.56, 0.72, fbm(x * 0.35, z * 0.35)) * 0.3 : 0;
        f *= 1 - drip;
      } else f *= 0.8 + 0.4 * fbm(x * 1.7, z * 1.7);
      const wear = 1 - 0.16 * trodden(plan, v, x, z);
      const mott = 0.95 + 0.05 * Math.sin(x * 0.53 + Math.sin(z * 0.31) * 2) * Math.sin(z * 0.47 - x * 0.11);
      for (let q = 0; q < 3; q++) col[k * 3 + q] = tone[q] * f * wear * mott;
      uv[k * 2] = x / 3; uv[k * 2 + 1] = z / 3;
    }
    const idx = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    if (v.floor.y1 !== undefined) g.computeVertexNormals();
    parts.push(g.toNonIndexed());
    g.dispose();
  }
  const g = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return g;
}

/* ================================================================== the built bodies */

/** A box geometry at (cx, cy, cz) of size (sx, sy, sz), its texture laid in metres. */
export function block(sx, sy, sz, cx, cy, cz, tile = 2.4) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [sz, sy] : ay > 0.5 ? [sx, sz] : [sx, sy];
    uv.setXY(i, uv.getX(i) * a / tile, uv.getY(i) * b / tile);
  }
  g.translate(cx, cy, cz);
  return g;
}
/** A box from (x0, y0, z0) to (x1, y1, z1). */
export const span = (x0, x1, y0, y1, z0, z1, tile) => block(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, tile);

/** A square bar of side `t` from point p to point q (a rail, a brace). */
export function bar(p, q, t) {
  const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  const g = new THREE.BoxGeometry(t, d.length(), t);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  g.translate((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2);
  return g;
}

/** A vertical cylinder (closed) with its texture laid in metres round it. */
export function drum(r, h, x, y0, z, seg = 24, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, h, seg);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * Math.PI * r / 2.4, uv.getY(i) * h / 2.4);
  g.translate(x, y0 + h / 2, z);
  return g;
}

/** Split [a, b] into pieces no longer than `len`, skipping the gaps. */
function pieces(a, b, gaps, len = 24) {
  const spans = [];
  let cur = a;
  for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) {
    if (g1 <= a || g0 >= b) continue;
    if (g0 > cur + 0.01) spans.push([cur, g0]);
    cur = Math.max(cur, g1);
  }
  if (b > cur + 0.01) spans.push([cur, b]);
  const out = [];
  for (const [s0, s1] of spans) {
    const n = Math.max(1, Math.ceil((s1 - s0) / len));
    for (let i = 0; i < n; i++) out.push([s0 + (s1 - s0) * i / n, s0 + (s1 - s0) * (i + 1) / n]);
  }
  return out;
}

/** The material keys the refinery is built in. */
export const BUILT_KEYS = ['concrete', 'face', 'coping', 'floor', 'block', 'steel', 'rail', 'fence', 'corrugated', 'cladding', 'skirt', 'roof', 'grating'];

/** Is a wall's far side, a metre out, the lava outside the plant or a yard's edge (a fence), or a unit inside it (a rail)? */
const fenced = (v, px, pz) => v.kind === 'yard' || !inPlant(px, pz);

/**
 * Every built body of the refinery, as lists of geometries by material key. The world merges each list into meshes
 * (`phys: 'ground'`). Keys: concrete (walls, slabs, columns), face (retaining walls, cast against the rock), coping (kerbs,
 * copings, lintels), floor (rooms' floor slabs), block (blockwork infill), steel (beams, frames), rail (handrails), fence (the
 * yards' chain-link), corrugated (the analyser bunker's arch), cladding (insulated vessels' aluminium jacket), skirt (fireproofed
 * concrete round a vessel's skirt), roof (sheeting), grating (open steel floor over a room, never walked).
 */
export function buildRefinery(plan) {
  const G = Object.fromEntries(BUILT_KEYS.map(k => [k, []]));
  const put = (key, geo) => G[key].push(geo);
  const T = WALL_T;

  /* ---- the walls round every open walk: a kerb and a handrail along a unit, a fence along a yard or the plant's edge, a
   * parapet over a drop, a retaining wall where the land stands higher. */
  const roofedNear = (w) => plan.roofed.filter(v => {
    const r = v.rect, t = 1.05 + (v.room?.doorT ?? 0);
    if (w.side === 'minX') return Math.abs(r.maxX - w.plane) < t && r.maxZ > w.from - 1 && r.minZ < w.to + 1;
    if (w.side === 'maxX') return Math.abs(r.minX - w.plane) < t && r.maxZ > w.from - 1 && r.minZ < w.to + 1;
    if (w.side === 'minZ') return Math.abs(r.maxZ - w.plane) < t && r.maxX > w.from - 1 && r.minX < w.to + 1;
    return Math.abs(r.minZ - w.plane) < t && r.maxX > w.from - 1 && r.minX < w.to + 1;
  });
  for (const w of plan.work.walls) {
    const v = plan.byId.get(w.volume);
    if (!plan.openVols.includes(v)) continue;
    const along = w.side === 'minX' || w.side === 'maxX' ? 'z' : 'x';
    const dir = w.side === 'minX' || w.side === 'minZ' ? -1 : 1;
    // A room's or a building's own wall stands where its side meets this one: leave that stretch to it.
    const gaps = [];
    for (const rv of roofedNear(w)) {
      const r = rv.rect, t = rv.room?.doorT ?? T;
      gaps.push(along === 'z' ? [r.minZ - t, r.maxZ + t] : [r.minX - t, r.maxX + t]);
    }
    if (along === 'z' && w.side === 'maxX' && Math.abs(w.plane - BLOCK_FOOT.minX) < 0.01) gaps.push([BLOCK_FOOT.minZ, BLOCK_FOOT.maxZ]);
    const r = v.rect;
    const full = along === 'z' ? [r.minZ, r.maxZ] : [r.minX, r.maxX];
    const fl = (s) => (along === 'z'
      ? floorOf(v, Math.min(Math.max(w.plane - dir * 0.01, r.minX), r.maxX - 1e-6), Math.min(Math.max(s, r.minZ), r.maxZ - 1e-6))
      : floorOf(v, Math.min(Math.max(s, r.minX), r.maxX - 1e-6), Math.min(Math.max(w.plane - dir * 0.01, r.minZ), r.maxZ - 1e-6)));
    for (const [a0, a1] of pieces(w.from, w.to, gaps, 4)) {
      // Turn the corner: a piece that ends at the volume's corner runs on over the wall it meets.
      const a = Math.abs(a0 - full[0]) < 1e-6 ? a0 - T : a0, b = Math.abs(a1 - full[1]) < 1e-6 ? a1 + T : a1;
      let lo = Infinity, hi = -Infinity;
      for (const t of [0.05, 0.3, 0.5, 0.7, 0.95]) {
        const s = a + (b - a) * t;
        const [px, pz] = along === 'z' ? [w.plane + dir * 1.0, s] : [s, w.plane + dir * 1.0];
        const y = land(px, pz);
        lo = Math.min(lo, y); hi = Math.max(hi, y);
      }
      const floorHi = Math.max(fl(a), fl(b)), floorLo = Math.min(fl(a), fl(b));
      const drop = lo < floorLo - 0.5;
      const rise = hi > floorHi + 0.5;
      const mid = (a + b) / 2;
      const [px, pz] = along === 'z' ? [w.plane + dir * 1.0, mid] : [mid, w.plane + dir * 1.0];
      const box = (t0, t1, y0, y1, key, tile = 2.4) => {
        const [x0, x1, z0, z1] = along === 'z'
          ? (dir < 0 ? [w.plane - t1, w.plane - t0, a, b] : [w.plane + t0, w.plane + t1, a, b])
          : (dir < 0 ? [a, b, w.plane - t1, w.plane - t0] : [a, b, w.plane + t0, w.plane + t1]);
        put(key, span(x0, x1, y0, y1, z0, z1, tile));
      };
      const at = (s, off, y) => along === 'z' ? [w.plane + dir * off, y, s] : [s, y, w.plane + dir * off];
      if (rise) {
        // A retaining wall: cast against the rock or the earth, a hand over the land it holds back.
        box(0, T, floorLo - 0.4, hi + 0.3 - 0.12, 'face', 3);
        box(-0.04, T + 0.04, hi + 0.3 - 0.12, hi + 0.3, 'coping', 1.2);
        continue;
      }
      if (drop) {
        // A parapet over a drop, its foot on the land below.
        box(0, T + 0.2, lo - 0.3, floorHi + RAIL - 0.12, 'concrete', 2.4);
        box(-0.04, T + 0.24, floorHi + RAIL - 0.12, floorHi + RAIL, 'coping', 1.2);
        continue;
      }
      // Level with the land: a kerb, and a rail or a fence on it.
      const ground = Math.min(floorLo, lo) - 0.3;
      box(0, 0.35, ground, floorHi + KERB, 'coping', 1.2);
      if (fenced(v, px, pz)) {
        // Chain-link on steel posts every 3 m, 2.4 m high, a top rail.
        put('fence', along === 'z' ? span(w.plane + dir * 0.17 - 0.01, w.plane + dir * 0.17 + 0.01, floorHi + KERB, floorHi + 2.4, a, b, 1) : span(a, b, floorHi + KERB, floorHi + 2.4, w.plane + dir * 0.17 - 0.01, w.plane + dir * 0.17 + 0.01, 1));
        const n = Math.max(1, Math.round((b - a) / 3));
        for (let i = 0; i <= n; i++) {
          const s = a + (b - a) * i / n, p = at(s, 0.17, 0);
          put('steel', span(p[0] - 0.04, p[0] + 0.04, floorHi + KERB, floorHi + 2.5, p[2] - 0.04, p[2] + 0.04, 1));
        }
        put('steel', bar(at(a, 0.17, floorHi + 2.45), at(b, 0.17, floorHi + 2.45), 0.05));
      } else {
        // A handrail: posts every 2 m, a top rail and a knee rail, following the floor.
        const n = Math.max(1, Math.round((b - a) / 2));
        for (let i = 0; i <= n; i++) {
          const s = a + (b - a) * i / n, p = at(s, 0.17, 0);
          const y = fl(Math.min(Math.max(s, full[0]), full[1]));
          put('rail', span(p[0] - 0.03, p[0] + 0.03, floorHi + KERB, y + RAIL, p[2] - 0.03, p[2] + 0.03, 1));
        }
        for (const h of [0.55, RAIL]) put('rail', bar(at(a, 0.17, fl(Math.max(a, full[0])) + h), at(b, 0.17, fl(Math.min(b, full[1])) + h), 0.045));
      }
    }
  }

  /* ---- the tank bund: a wall round it from its floor to 0.6 m over grade, broken where the ramp and the cellar come through. */
  {
    const t = BUND.wall, y0 = PIT - 0.3, y1 = GRADE + 0.6;
    const ramp = plan.byId.get('down-3').rect, cellar = plan.byId.get('room-3').rect, cT = plan.roomById.get('room-3').doorT;
    const sides = [
      ['z', BUND.minZ - t, BUND.minZ, BUND.minX - t, BUND.maxX + t, []],
      ['z', BUND.maxZ, BUND.maxZ + t, BUND.minX - t, BUND.maxX + t, []],
      ['x', BUND.minX - t, BUND.minX, BUND.minZ, BUND.maxZ, [[cellar.minZ - cT, cellar.maxZ + cT]]],
      ['x', BUND.maxX, BUND.maxX + t, BUND.minZ, BUND.maxZ, [[ramp.minZ - T - 0.2, ramp.maxZ + T + 0.2]]]
    ];
    for (const [ax, p0, p1, s0, s1, gaps] of sides) {
      for (const [a, b] of pieces(s0, s1, gaps, 12)) {
        if (ax === 'z') put('concrete', span(a, b, y0, y1, p0, p1, 2.4));
        else put('concrete', span(p0, p1, y0, y1, a, b, 2.4));
      }
    }
  }

  /* ---- the rooms, the passages, the control block, the structures over the rooms. */
  for (const v of plan.roofed) buildShell(plan, v, put);
  buildControlBlock(plan, put);
  buildReactor(put);
  buildReactorTrain(plan, put);
  return G;
}

/** The walls of a roofed volume on its four sides, outside its rectangle, from `base` to `top`, cut for its openings. */
function sideWalls(v, put, { key = 'concrete', top, base, thick = WALL_T, lintel = DOOR.top, skip = [] }) {
  const r = v.rect;
  for (const side of ['minX', 'maxX', 'minZ', 'maxZ']) {
    if (skip.includes(side)) continue;
    const alongZ = side === 'minX' || side === 'maxX';
    const [lo, hi] = alongZ ? [r.minZ - thick, r.maxZ + thick] : [r.minX, r.maxX];
    const gaps = v.openings.filter(o => o.side === side).map(o => [o.lo, o.hi]);
    const plane = r[side];
    const out = side === 'minX' || side === 'minZ' ? -1 : 1;
    const slab = (a, b, y0, y1) => alongZ
      ? put(key, span(out < 0 ? plane - thick : plane, out < 0 ? plane : plane + thick, y0, y1, a, b, 2.4))
      : put(key, span(a, b, y0, y1, out < 0 ? plane - thick : plane, out < 0 ? plane : plane + thick, 2.4));
    for (const [a, b] of pieces(lo, hi, gaps, 30)) slab(a, b, base, top);
    if (top > v.floor.y0 + lintel + 0.05) for (const [a, b] of gaps) slab(a, b, v.floor.y0 + lintel, top);
  }
}

/** A floor slab over a rectangle, its top at `y`. */
const floorSlab = (put, r, y, d = 0.3) => put('floor', span(r.minX, r.maxX, y - d, y, r.minZ, r.maxZ, 1.8));

/** Every roofed volume's shell: floor, walls, roof, by its kind and (for a room) its `shell`. */
function buildShell(plan, v, put) {
  const r = v.rect, L = v.floor.y0;
  if (v.kind === 'passage') {
    const room = plan.rooms.find(m => m.doorVol === v);
    floorSlab(put, r, L);
    if (room.shell === 'skirt') {
      // The access way through the skirt: block cheeks either side, a slab over, open to c1.
      for (const x of [r.minX - WALL_T, r.maxX]) put('block', span(x, x + WALL_T, L - 0.3, L + DOOR.top + 0.3, r.minZ, r.maxZ, 2.4));
      put('concrete', span(r.minX - WALL_T, r.maxX + WALL_T, L + DOOR.top, L + DOOR.top + 0.35, r.minZ, r.maxZ, 2.4));
      return;
    }
    // Through a wall: the wall's own lintel over the door, and (under earth) the headwall up to the heap.
    const alongZ = room.door === 'minX' || room.door === 'maxX';
    const up = room.mound ? room.mound + 0.3 : L + DOOR.top + 0.5;
    const [x0, x1, z0, z1] = alongZ ? [r.minX, r.maxX, r.minZ - 0.3, r.maxZ + 0.3] : [r.minX - 0.3, r.maxX + 0.3, r.minZ, r.maxZ];
    put('coping', span(x0, x1, L + DOOR.top, L + DOOR.top + 0.3, z0, z1, 1.2));
    if (up > L + DOOR.top + 0.31) put(room.mound ? 'face' : 'concrete', span(alongZ ? r.minX : r.minX - 0.3, alongZ ? r.maxX : r.maxX + 0.3, L + DOOR.top + 0.3, up, alongZ ? r.minZ - 0.3 : r.minZ, alongZ ? r.maxZ + 0.3 : r.maxZ, 2.4));
    return;
  }
  const room = plan.roomById.get(v.id);
  floorSlab(put, r, L);
  const T = room.doorT;
  if (room.shell === 'arch') {
    // A corrugated steel arch spanning north and south over concrete stem walls 2 m high, ribs every 1.5 m; the ends are
    // concrete: the back wall, and the headwall with the door in it, carried up to the heap's top.
    const half = (r.maxZ - r.minZ) / 2, spring = L + 2.0, rise = room.top + 0.4 - 2.0;
    const R = (half * half + rise * rise) / (2 * rise), cy = spring + rise - R, midZ = (r.minZ + r.maxZ) / 2;
    for (const z of [r.minZ - 0.5, r.maxZ]) put('concrete', span(r.minX - 0.5, r.maxX + T, L - 0.4, spring, z, z + 0.5, 2.4));
    const n = 22, th = 0.08, a0 = Math.asin(half / R);
    for (let i = 0; i < n; i++) {
      const a = -a0 + (2 * a0) * (i + 0.5) / n;
      const chord = 2 * R * Math.sin(a0 / n) + 0.02;
      const off = Math.sin(a) * (R + th / 2), y = cy + Math.cos(a) * (R + th / 2);
      const geo = block(r.maxX - r.minX + 0.02, th, chord, 0, 0, 0, 0.6);
      geo.rotateX(a);
      geo.translate((r.minX + r.maxX) / 2, y, midZ + off);
      put('corrugated', geo);
    }
    for (let x = r.minX + 0.75; x < r.maxX; x += 1.5) {
      for (let i = 0; i < n; i++) {
        const a = -a0 + (2 * a0) * (i + 0.5) / n;
        const chord = 2 * R * Math.sin(a0 / n) + 0.02;
        const off = Math.sin(a) * (R - 0.05), y = cy + Math.cos(a) * (R - 0.05);
        const geo = block(0.12, 0.1, chord, 0, 0, 0, 1);
        geo.rotateX(a);
        geo.translate(x, y, midZ + off);
        put('steel', geo);
      }
    }
    const crown = cy + R + th;
    put('concrete', span(r.minX - 0.6, r.minX, L - 0.4, crown + 0.2, r.minZ - 0.5, r.maxZ + 0.5, 2.4));
    // The headwall: from the door's lintel line out to the corners, up to the heap.
    const top = room.mound + 0.3, [d0, d1] = [v.openings[0].lo, v.openings[0].hi];
    for (const [a, b] of [[r.minZ - 0.5, d0], [d1, r.maxZ + 0.5]]) put('face', span(r.maxX, r.maxX + T, L - 0.4, top, a, b, 2.4));
    return;
  }
  if (room.shell === 'block') {
    // The control room: blast-resistant walls a metre thick, a slab roof on downstand beams, the plant's cable trays under it.
    const roof = L + room.top + 1.0;
    sideWalls(v, put, { key: 'concrete', top: BLOCK_FOOT.h, base: L - 0.4, thick: T });
    put('concrete', span(r.minX, r.maxX, roof, roof + 0.45, r.minZ, r.maxZ, 2.4));
    for (let i = 1; i < 4; i++) {
      const x = r.minX + (r.maxX - r.minX) * i / 4;
      put('concrete', span(x - 0.25, x + 0.25, roof - 0.55, roof, r.minZ, r.maxZ, 2.4));
    }
    // Cable trays along the room at 4.7 m, on drop rods from the beams.
    for (const z of [r.minZ + 2.2, (r.minZ + r.maxZ) / 2 + 2.6, r.maxZ - 2.2]) {
      put('steel', span(r.minX + 0.4, r.maxX - 0.4, L + room.top + 0.1, L + room.top + 0.16, z - 0.3, z + 0.3, 1));
      for (const s of [-1, 1]) put('steel', span(r.minX + 0.4, r.maxX - 0.4, L + room.top + 0.16, L + room.top + 0.26, z + s * 0.3 - 0.015, z + s * 0.3 + 0.015, 1));
      for (let x = r.minX + 1; x < r.maxX - 0.5; x += 3) put('steel', span(x - 0.015, x + 0.015, L + room.top + 0.16, roof - 0.55, z - 0.015, z + 0.015, 1));
    }
    return;
  }
  if (room.shell === 'cellar') {
    // The pump cellar: concrete walls from the bund floor, a slab on rolled steel beams every 2 m carrying the manifold deck.
    const top = L + room.top;
    sideWalls(v, put, { key: 'concrete', top: top + 0.66, base: L - 0.4, thick: T });
    put('concrete', span(r.minX - T, r.maxX + T, top + 0.36, top + 0.66, r.minZ - T, r.maxZ + T, 2.4));
    const n = Math.round((r.maxZ - r.minZ) / 2);
    for (let i = 1; i < n; i++) {
      const z = r.minZ + (r.maxZ - r.minZ) * i / n;
      put('steel', span(r.minX, r.maxX, top, top + 0.03, z - 0.14, z + 0.14, 1));
      put('steel', span(r.minX, r.maxX, top + 0.33, top + 0.36, z - 0.14, z + 0.14, 1));
      put('steel', span(r.minX, r.maxX, top + 0.03, top + 0.33, z - 0.012, z + 0.012, 1));
    }
    return;
  }
  if (room.shell === 'skirt') {
    // Inside the cracking reactor's skirt: blockwork walls 3 m high round the square of the room (the access way in the north),
    // and over them the round fireproofed skirt rising to the vessel, whose bottom head closes the room overhead.
    const wallTop = L + 3.0;
    sideWalls(v, put, { key: 'block', top: wallTop, base: L - 0.3, thick: 0.3, lintel: DOOR.top, skip: [] });
    const S = SKIRT, y0 = L - 0.3, y1 = L + 8.0, n = 40;
    const door = v.openings[0];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      const cx = S.x + Math.sin(am) * (S.r + S.t / 2), cz = S.z + Math.cos(am) * (S.r + S.t / 2);
      const chord = 2 * (S.r + S.t) * Math.sin(Math.PI / n) + 0.02;
      // The access opening: where the ring crosses the passage, it stands only over the lintel.
      const inDoor = Math.abs(cx - (door.lo + door.hi) / 2) < (door.hi - door.lo) / 2 + 0.7 && cz > S.z;
      const lo = inDoor ? L + DOOR.top + 0.35 : y0;
      const g = block(chord, y1 - lo, S.t, 0, 0, 0, 2.4);
      g.rotateY(am);
      g.translate(cx, (lo + y1) / 2, cz);
      put('skirt', g);
    }
    // The bottom head: a shallow dish from the ring's top down to its middle, 1.2 m lower; under it, the reactor.
    const dish = new THREE.SphereGeometry(1, 40, 10, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38);
    const rr = S.r + S.t, depth = 1.2;
    const sy = depth / (1 - Math.cos(Math.PI * 0.38));
    dish.scale(rr / Math.sin(Math.PI * 0.62), sy, rr / Math.sin(Math.PI * 0.62));
    const bb = new THREE.Box3().setFromBufferAttribute(dish.attributes.position);
    dish.translate(S.x, y1 - bb.max.y + 0.01, S.z);
    dish.scale(1, 1, 1);
    put('cladding', dish);
    return;
  }
  if (room.shell === 'table') {
    // Under the reactor train's table: columns 0.9 m square at the corners and every 6 m, a deep beam round the top, the table's
    // slab over it all; the bays between the columns filled with blockwork, the door in the north wall.
    const top = L + room.top + 0.5;
    sideWalls(v, put, { key: 'block', top, base: L - 0.3, thick: T });
    const cols = [];
    for (let x = r.minX - T; x <= r.maxX + T + 1e-6; x += (r.maxX - r.minX + 2 * T) / 3) for (const z of [r.minZ - T, r.maxZ + T]) cols.push([x, z]);
    for (const z of [r.minZ - T + (r.maxZ - r.minZ + 2 * T) / 2]) for (const x of [r.minX - T, r.maxX + T]) cols.push([x, z]);
    const door = v.openings[0];
    for (const [x, z] of cols) {
      if (Math.abs(x - (door.lo + door.hi) / 2) < (door.hi - door.lo) / 2 + 0.5 && z > r.maxZ) continue;
      put('concrete', span(x - 0.45, x + 0.45, L - 0.3, top + 1.2, z - 0.45, z + 0.45, 2.4));
    }
    put('concrete', span(r.minX - T - 0.45, r.maxX + T + 0.45, top, top + 1.2, r.minZ - T - 0.45, r.maxZ + T + 0.45, 2.4));
    for (let i = 1; i < 3; i++) {
      const x = r.minX + (r.maxX - r.minX) * i / 3;
      put('concrete', span(x - 0.3, x + 0.3, top - 0.7, top, r.minZ, r.maxZ, 2.4));
    }
    return;
  }
  // The catalyst bunker: concrete walls a metre thick, a half-metre roof slab under the heap, the headwall up to its top.
  const top = L + room.top + 0.2;
  sideWalls(v, put, { key: 'concrete', top: top + 0.5, base: L - 0.4, thick: T, skip: ['maxX'] });
  put('concrete', span(r.minX - T, r.maxX, top, top + 0.5, r.minZ - T, r.maxZ + T, 2.4));
  const [d0, d1] = [v.openings[0].lo, v.openings[0].hi];
  for (const [a, b] of [[r.minZ - T, d0], [d1, r.maxZ + T]]) put('face', span(r.maxX, r.maxX + T, L - 0.4, room.mound + 0.3, a, b, 2.4));
  // The hopper's head over the heap: a steel hatch frame on a concrete collar, where the catalyst is loaded from above.
  const hx = r.minX + 2.6, hz = r.minZ + 2.6;
  put('concrete', span(hx - 1.3, hx + 1.3, top + 0.5, room.mound + 0.6, hz - 1.3, hz + 1.3, 2.4));
  put('steel', span(hx - 1.0, hx + 1.0, room.mound + 0.6, room.mound + 0.75, hz - 1.0, hz + 1.0, 1));
  put('steel', span(hx - 0.9, hx + 0.9, room.mound + 0.75, room.mound + 0.95, hz - 0.9, hz + 0.9, 1));
}

/**
 * THE CONTROL BLOCK, round the control room: one storey of blast-resistant concrete over the room's height, its other rooms
 * (switch room, battery room, the analyser rack room) closed to the walk; louvres for the air, the air-handling plant on the
 * roof behind a parapet.
 */
function buildControlBlock(plan, put) {
  const B = BLOCK_FOOT, room = plan.roomById.get('room-2').vol.rect, T = 1.0;
  const y0 = GRADE - 0.4, H = B.h;
  // The block round the room: north and south of it, and all of it east of the room's east wall.
  put('concrete', span(B.minX, room.maxX + T, y0, H, B.minZ, room.minZ - T, 2.4));
  put('concrete', span(B.minX, room.maxX + T, y0, H, room.maxZ + T, B.maxZ, 2.4));
  put('concrete', span(room.maxX + T, B.maxX, y0, H, B.minZ, B.maxZ, 2.4));
  // The parapet round the roof and the plant on it.
  for (const [x0, x1, z0, z1] of [[B.minX, B.maxX, B.minZ, B.minZ + 0.3], [B.minX, B.maxX, B.maxZ - 0.3, B.maxZ], [B.minX, B.minX + 0.3, B.minZ, B.maxZ], [B.maxX - 0.3, B.maxX, B.minZ, B.maxZ]]) {
    put('concrete', span(x0, x1, H, H + 0.9, z0, z1, 2.4));
  }
  put('coping', span(B.minX - 0.05, B.maxX + 0.05, H + 0.9, H + 1.0, B.minZ - 0.05, B.minZ + 0.35, 1.2));
  put('coping', span(B.minX - 0.05, B.maxX + 0.05, H + 0.9, H + 1.0, B.maxZ - 0.35, B.maxZ + 0.05, 1.2));
  // The room's roof stands lower than the block's (the cable floor is over the equipment rooms only): roof it at the block's top.
  put('concrete', span(room.minX - T, room.maxX + T, H - 0.4, H, room.minZ - T, room.maxZ + T, 2.4));
  // Two air-handling units on the roof, and their ducts down through it.
  for (const [cx, cz] of [[18, -52], [18, -40]]) {
    put('cladding', span(cx - 4, cx + 4, H, H + 2.2, cz - 1.6, cz + 1.6, 2));
    put('steel', span(cx - 4.1, cx + 4.1, H + 2.2, H + 2.3, cz - 1.7, cz + 1.7, 1));
    put('cladding', span(cx + 4, cx + 6.5, H + 0.6, H + 1.6, cz - 0.6, cz + 0.6, 2));
  }
  // Louvres in the east wall for the switch room: steel blades in a frame.
  for (const cz of [-55, -38]) {
    for (let k = 0; k < 8; k++) put('steel', span(B.maxX, B.maxX + 0.12, 1.8 + k * 0.25, 1.86 + k * 0.25, cz - 1.5, cz + 1.5, 1));
  }
}

/**
 * THE CRACKING REACTOR, standing on its skirt over room 4: a vessel 19 m across and 22 m tall, insulated and jacketed, its top
 * head, the riser coming up its side from the feed nozzles, and the cyclone outlets on top. It is the tallest thing on the plot.
 */
function buildReactor(put) {
  const S = SKIRT, base = PLOT + 8.0, R = S.r + S.t + 0.15, H = 22;
  put('cladding', drum(R, H, S.x, base, S.z, 48));
  // Stiffener rings every 4 m, and the platform rings at the top.
  for (let y = base + 3; y < base + H; y += 4) put('steel', drum(R + 0.12, 0.2, S.x, y, S.z, 48));
  // The top head: a flatter dome.
  const head = new THREE.SphereGeometry(R, 48, 10, 0, Math.PI * 2, 0, Math.PI * 0.3);
  head.scale(1, 0.45, 1);
  const hb = new THREE.Box3().setFromBufferAttribute(head.attributes.position);
  head.translate(S.x, base + H - hb.min.y - 0.02, S.z);
  put('cladding', head);
  // The riser: up the vessel's west side from the plot, through the side into the vessel near the top.
  const rx = S.x - R - 1.6;
  put('cladding', drum(1.0, base + H - 4 - PLOT, rx, PLOT + 0.2, S.z, 20));
  put('steel', drum(1.4, 0.5, rx, PLOT, S.z, 20));
  put('cladding', bar([rx, base + H - 3.2, S.z], [S.x - R + 0.5, base + H - 3.2, S.z], 1.6));
  // The cyclone outlets and the overhead line leaving east.
  for (const [dx, dz] of [[-4, -3], [4, -3], [0, 4]]) put('cladding', drum(0.7, 4.5, S.x + dx, base + H + 1.5, S.z + dz, 16));
  put('cladding', bar([S.x + 4, base + H + 5.6, S.z - 3], [S.x + 4, base + H + 5.6, S.z + 4], 0.9));
}

/**
 * THE REACTOR TRAIN on its table over room 5: three reactors in series, west to east, each on its own short skirt on the table,
 * the transfer lines from the top of one to the side of the next; between them the interstage coolers. A platform of steel
 * grating on the table's edge, never walked.
 */
function buildReactorTrain(plan, put) {
  const r = plan.roomById.get('room-5').vol.rect, T = plan.roomById.get('room-5').doorT;
  const deck = PLOT + plan.roomById.get('room-5').top + 0.5 + 1.2;
  const cz = (r.minZ + r.maxZ) / 2;
  const xs = [r.minX + 2.6, (r.minX + r.maxX) / 2, r.maxX - 2.6];
  const hs = [12, 15, 11];
  xs.forEach((x, i) => {
    put('skirt', drum(2.3, 1.8, x, deck, cz, 28));
    put('cladding', drum(2.2, hs[i], x, deck + 1.8, cz, 28));
    const head = new THREE.SphereGeometry(2.2, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    head.scale(1, 0.5, 1);
    head.translate(x, deck + 1.8 + hs[i], cz);
    put('cladding', head);
    for (let y = deck + 4; y < deck + 1.8 + hs[i]; y += 3.5) put('steel', drum(2.32, 0.16, x, y, cz, 28));
  });
  // Transfer lines: from the top of each reactor over and down into the side of the next.
  for (let i = 0; i < 2; i++) {
    const a = xs[i], b = xs[i + 1], ya = deck + 1.8 + hs[i] + 1.1, yb = deck + 4.5;
    put('cladding', bar([a, deck + 1.8 + hs[i], cz], [a, ya, cz], 0.55));
    put('cladding', bar([a, ya, cz], [(a + b) / 2, ya, cz], 0.55));
    put('cladding', bar([(a + b) / 2, ya, cz], [(a + b) / 2, yb, cz], 0.55));
    put('cladding', bar([(a + b) / 2, yb, cz], [b - 2.2, yb, cz], 0.55));
  }
  // The table's edge platform and its handrail.
  put('grating', span(r.minX - T - 0.45, r.maxX + T + 0.45, deck - 0.05, deck, r.minZ - T - 1.6, r.minZ - T - 0.45, 1));
  for (const z of [r.minZ - T - 1.55]) {
    put('rail', bar([r.minX - T, deck + 1.1, z], [r.maxX + T, deck + 1.1, z], 0.05));
    for (let x = r.minX - T; x <= r.maxX + T + 1e-6; x += 2) put('rail', span(x - 0.03, x + 0.03, deck, deck + 1.1, z - 0.03, z + 0.03, 1));
  }
}

/** Merge a list of geometries into one (or null for none). */
export function mergeList(list) {
  if (!list.length) return null;
  const nonIndexed = list.map(g => (g.index ? g.toNonIndexed() : g));
  for (const g of nonIndexed) for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  const m = mergeGeometries(nonIndexed);
  for (const g of list) g.dispose();
  for (const g of nonIndexed) if (!list.includes(g)) g.dispose();
  return m;
}

export { r2, frontZ, ROOF_T };
