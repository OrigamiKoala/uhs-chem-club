/**
 * brinewire/terrain.js — The tidal barrage as drawn: the land round it, the wall itself, its walks, its rooms, and the water.
 *
 * Everything here stands on `barrage-plan.js`. The GROUND MESH is the land that is not the barrage: the lagoon's bed under the
 * impounded brine, the basin's bed and the tidal flats under the tailwater, the two headlands, the far shores. It is sampled
 * from the plan's ONE height field on a grid with a row of vertices on every line where the ground steps, so a step is a sharp
 * edge hidden inside the wall that stands on it; the grid runs to the horizon. Every walk volume and the wall's own footprint is a
 * hole in it: the barrage is BUILT, of concrete, and its walks are paved slabs whose tops are the floors the height field says.
 *
 *   makeBrinewireField   the height the game walks on (the plan's, with the pad's plate on the north yard)
 *   buildGroundGeometry  the ground mesh: beds, flats, headlands, far shores (vertex colours say which)
 *   buildPaving          the walks' surfaces: road, yards, ramp, landing, apron (vertex colours: joints, wear, salt)
 *   buildBarrage         the wall: its faces, its deck, the parapets and retaining walls round every walk; the gate houses on
 *                        their piers; every room's floor, walls and roof; the gallery and the adit (`phys: 'ground'`)
 *   buildWaterGeometry   the lagoon's brine and the tailwater, two sheets (ambient: nothing stands on them)
 *
 * Built in the world frame, as lists of geometries by material key; the world merges each list into meshes by square.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { floorOf } from '../lib/workings.js';
import { chamferBoxGeometry } from '../kettle/kit.js';
import {
  CREST, GALLERY, FOOT, DECK, DECK_SLAB, LAGOON, BASIN, WALL, PARAPET, WALL_T, EDGE, YARD_N, YARD_S, RAMP, APRON, ADIT,
  DOOR, land, fbm
} from './barrage-plan.js';

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const r2 = n => Math.round(n * 100) / 100;

/* ================================================================== the field */

/** The height the game walks on: the plan's, with the pad's plate standing on the north yard. */
export function makeBrinewireField(plan, pad) {
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

/** The barrage's own footprint (beside the walk volumes): the wall from face to face, end to end. */
export const WALL_FOOT = { minX: WALL.west, maxX: WALL.east, minZ: WALL.north, maxZ: WALL.south };

/** Is the cell centred at (x, z) drawn by the barrage rather than the ground mesh? */
function builtAt(plan, x, z) {
  if (x >= WALL_FOOT.minX && x <= WALL_FOOT.maxX && z >= WALL_FOOT.minZ && z <= WALL_FOOT.maxZ) return true;
  return Boolean(plan.volumeAt(x, z));
}

/** What the land is at (x, z), for its colour: 0 lagoon bed, 1 basin bed, 2 flats, 3 rock, 4 far shore, 5 under a wall. */
function surfaceAt(plan, x, z, y) {
  if (plan.volumeAt(x, z)) return 5;
  if (y > CREST + 1.2) return 3;
  if (x < WALL.west) return x < -560 ? 4 : 0;
  if (x > 500) return 4;
  if (y < BASIN.water - 0.6) return 1;
  return 2;
}

const COLOURS = [
  [0.34, 0.33, 0.28],   // the lagoon's bed: dark silt under the brine
  [0.30, 0.29, 0.26],   // the basin's bed: scoured silt
  [0.56, 0.52, 0.45],   // the tidal flats: grey-brown mud
  [0.53, 0.49, 0.43],   // the headlands: bedded sandstone
  [0.55, 0.52, 0.42],   // the far shores: dun scrub
  [0.62, 0.61, 0.58]    // under a wall: concrete grey
];

/**
 * The ground mesh. Every cell under the barrage (a walk volume, a room, the wall from face to face) is left out: the barrage
 * draws its own surfaces. A vertex in a roofed volume takes the land's height, so the hole's edge meets the land round it.
 */
export function buildGroundGeometry(field, plan) {
  const br = plan.breaks();
  const xs = ladder(-900, 900, -60, 52, -150, 150, 2, 3.5, br.xs);
  const zs = ladder(-900, 900, -100, 84, -170, 170, 2, 3.5, br.zs);
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
    if (Math.hypot(gx, gz) > 2.5) n = [0, 1, 0];
    const l = Math.hypot(...n);
    nor[k * 3] = n[0] / l; nor[k * 3 + 1] = n[1] / l; nor[k * 3 + 2] = n[2] / l;
    const s = surfaceAt(plan, x, z, y);
    let c = COLOURS[s];
    let m = 0.94 + 0.06 * Math.sin(x * 0.37 + Math.sin(z * 0.21) * 2) * Math.sin(z * 0.29 + x * 0.05);
    if (s === 3) {
      // THE HEADLANDS IN SECTION: beds of sandstone 0.6 to 1.4 m thick, alternately paler and redder, dipping a little east.
      const bed = y + x * 0.02 + Math.sin(z * 0.013) * 1.5;
      const band = Math.floor(bed / 0.95);
      const pale = (Math.sin(band * 12.9898) * 43758.5453) % 1;
      c = Math.abs(pale) > 0.5 ? [0.60, 0.55, 0.47] : [0.50, 0.42, 0.35];
      // Grey-green scrub on the gentle tops, bare rock on the faces.
      const steep = Math.min(1, Math.hypot(gx, gz) / 1.2);
      c = c.map((v, q) => v + ([0.44, 0.45, 0.37][q] - v) * (1 - steep) * 0.7);
    } else if (s === 2) {
      // The flats: white salt where the mud stands proud of the water and dries, dark where it stays wet.
      const dry = smooth(BASIN.water + 0.05, BASIN.water + 0.6, y);
      c = c.map((v, q) => v * (0.72 + 0.28 * dry) + ([0.86, 0.85, 0.80][q] - v) * dry * 0.35 * fbm(x * 0.15, z * 0.15));
    } else if (s === 0 || s === 1) {
      // A copper stain on the bed near the wall, where the cells' brine is let back.
      const near = 1 - smooth(4, 40, Math.abs(x - (s === 0 ? WALL.west : WALL.east + 8)));
      c = c.map((v, q) => v + ([0.30, 0.42, 0.36][q] - v) * near * 0.35);
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

/** How worn the paving is at (x, z): 1 on the line people walk, along the middle of the road, the ramp and toward each door. */
function trodden(plan, v, x, z) {
  const bell = d => Math.exp(-(d * d) / 2.2);
  const r = v.rect;
  if (v.kind === 'road') return Math.max(bell(x - (r.minX + r.maxX) / 2) * 0.8, ...plan.rooms.filter(m => m.onto === 'road').map(m => bell(z - (m.door.rect.minZ + m.door.rect.maxZ) / 2) * smooth(r.maxX - 2, r.minX + 1, x) * 0.8));
  if (v.kind === 'ramp' || v.kind === 'landing') return bell(x - (r.minX + r.maxX) / 2) * 0.9 + (v.kind === 'landing' ? bell(z - (ADIT.minZ + ADIT.maxZ) / 2) * smooth(r.maxX, r.minX, x) : 0);
  if (v.id === 'yard-s') return Math.max(bell(z - 66) * smooth(WALL.roadW - 1, WALL.roadE, x) * smooth(RAMP.maxX + 1, RAMP.minX, x), bell(x - (WALL.roadW + WALL.roadE) / 2) * smooth(70, 63, z), bell(x - (RAMP.minX + RAMP.maxX) / 2) * smooth(68, 63, z));
  if (v.id === 'yard-n') return bell(x - (WALL.roadW + WALL.roadE) / 2) * smooth(-80, -68, z);
  if (v.kind === 'apron') return Math.max(bell(x - 7) * smooth(-66, -50, z), bell(x - 21.4) * smooth(-78, -70, z) * smooth(-50, -58, z) * 0.8);
  return 0;
}

/**
 * The surface of every open walk: a grid of quads at the floor's height (a ramp's slope included), coloured: the paving's
 * tone, its expansion joints every 6 m, a darker line where feet wear it, and salt bloom along the lagoon side.
 */
export function buildPaving(plan) {
  const parts = [];
  for (const v of plan.openVols) {
    const r = v.rect;
    const xs = [], zs = [];
    const step = 1.0;
    for (let x = r.minX; x < r.maxX - 1e-6; x += step) xs.push(x);
    xs.push(r.maxX);
    for (let z = r.minZ; z < r.maxZ - 1e-6; z += step) zs.push(z);
    zs.push(r.maxZ);
    // Extra rows a hand and a forearm in from each side, so the contact shade at a wall's foot has vertices to live on.
    const rows = (list, lo, hi) => {
      for (const d of [0.15, 0.45]) if (hi - lo > 2 * d + 0.2) list.push(lo + d, hi - d);
      const out = [...new Set(list.map(q => Math.round(q * 1000) / 1000))].sort((p, q) => p - q);
      list.length = 0;
      list.push(...out);
    };
    rows(xs, r.minX, r.maxX);
    rows(zs, r.minZ, r.maxZ);
    // CONTACT: where a wall stands on a side of this walk (a parapet, a retaining wall, a room's wall), the paving darkens
    // over its last half metre, the way a floor does in the corner a wall throws.
    const sides = plan.work.walls.filter(w => w.volume === v.id);
    const contact = (x, z) => {
      let k = 1;
      for (const w of sides) {
        const alongZ = w.side === 'minX' || w.side === 'maxX';
        const s2 = alongZ ? z : x;
        if (s2 < Math.min(w.from, w.to) - 0.3 || s2 > Math.max(w.from, w.to) + 0.3) continue;
        const d = Math.abs((alongZ ? x : z) - w.plane);
        k = Math.min(k, 1 - 0.3 * Math.exp(-d / 0.32));
      }
      return k;
    };
    const nx = xs.length, nz = zs.length;
    const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), nor = new Float32Array(nx * nz * 3);
    const tone = v.kind === 'ramp' || v.kind === 'landing' ? [0.66, 0.65, 0.61] : v.kind === 'apron' ? [0.60, 0.59, 0.56] : [0.70, 0.69, 0.65];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], k = j * nx + i;
      const y = floorOf(v, Math.min(x, r.maxX - 1e-6), Math.min(z, r.maxZ - 1e-6));
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      nor[k * 3 + 1] = 1;
      // The joints: a dark line every 6 m across the line of travel, and down the road's middle.
      const jz = Math.abs(((z % 6) + 6) % 6 - 3) > 2.8 ? 0.82 : 1;
      const jx = v.kind === 'road' && Math.abs(x - (r.minX + r.maxX) / 2) < 0.35 ? 0.86 : 1;
      // A ramp's grooves across it every half metre, so it reads as a ramp at a glance.
      const groove = v.kind === 'ramp' && Math.abs(((z * 2) % 1 + 1) % 1 - 0.5) > 0.42 ? 0.88 : 1;
      const wear = 1 - 0.14 * trodden(plan, v, x, z);
      const mott = 0.95 + 0.05 * Math.sin(x * 0.53 + Math.sin(z * 0.31) * 2) * Math.sin(z * 0.47 - x * 0.11);
      // Salt dried white along the parapet nearest the lagoon, where the spray lands.
      const salt = v.kind === 'road' || v.kind === 'yard' ? Math.exp(-Math.max(0, x - (v.id === 'yard-n' ? YARD_N.minX : WALL.roadW)) / 1.6) * 0.5 * (0.6 + 0.4 * fbm(x * 0.4, z * 0.4)) : 0;
      const shade = contact(x, z);
      for (let q = 0; q < 3; q++) col[k * 3 + q] = ((tone[q] * jz * jx * groove * wear * mott) * (1 - salt) + 0.88 * salt) * shade;
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

/* ================================================================== the barrage */

/**
 * A box geometry at (cx, cy, cz) of size (sx, sy, sz): CAST, not cut. Every edge is chamfered (`chamferBoxGeometry`,
 * Kettle's built kit) by a few centimetres on a wall and not at all on anything under 6 cm thick, so it only ever loses
 * material inside the box it stands for. Its uvs are laid in METRES from its final position on each face's own plane
 * (1 uv = 1 m; a material's repeat is 1 / its tile), so the concrete runs on from one piece to the next. `tile` is kept
 * for the callers and no longer read. `swap` turns the uvs a quarter (a lean-to's sheet, whose fall runs along x).
 */
function block(sx, sy, sz, cx, cy, cz, tile = 2.4, { swap = false } = {}) {
  void tile;
  const m = Math.min(sx, sy, sz);
  const c = m < 0.06 ? 0 : Math.min(0.035, m * 0.12);
  const g = chamferBoxGeometry(sx, sy, sz, c);
  g.translate(cx, cy, cz);
  metricUV(g, swap);
  return g;
}

/** Planar uvs in metres from each vertex's position on its face's own plane (top: x, z; an x face: z, y; a z face: x, y). */
function metricUV(g, swap = false) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let u, v;
    if (ay >= ax && ay >= az) [u, v] = [x, z];
    else if (ax >= az) [u, v] = [z, y];
    else [u, v] = [x, y];
    if (swap) [u, v] = [v, u];
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return g;
}

/** The height of one LIFT of the mass concrete: the faces were cast a metre and a half at a time. */
const LIFT = 1.5;

/**
 * A face of mass concrete from (x0, y0, z0) to (x1, y1, z1), cast in lifts: one chamfered box per lift, its joints on the
 * same levels the whole barrage over, so each lift line runs on from one monolith to the next as a shallow V groove.
 */
function liftSpan(x0, x1, y0, y1, z0, z1) {
  const out = [];
  const k0 = Math.ceil((y0 + 0.4) / LIFT), k1 = Math.floor((y1 - 0.4) / LIFT);
  let a = y0;
  for (let k = k0; k <= k1; k++) {
    out.push(span(x0, x1, a, k * LIFT, z0, z1));
    a = k * LIFT;
  }
  out.push(span(x0, x1, a, y1, z0, z1));
  return out;
}

/**
 * A precast COPING from (x0, y0, z0) to (x1, y1, z1), laid in units 1.2 to 1.8 m long along its length, each chamfered
 * so the joints read, each a few millimetres lower than the next at most (seeded by position): never above the old top.
 */
function copingUnits(x0, x1, y0, y1, z0, z1) {
  const alongX = (x1 - x0) >= (z1 - z0);
  const [a, b] = alongX ? [x0, x1] : [z0, z1];
  const len = b - a;
  if (len < 2.4) return [span(x0, x1, y0, y1, z0, z1)];
  const n = Math.max(2, Math.round(len / 1.5));
  const cuts = [a];
  for (let i = 1; i < n; i++) {
    const h = Math.sin((a + i * 7.31) * 12.9898 + y0 * 3.7) * 43758.5453;
    cuts.push(a + (len * i) / n + ((h - Math.floor(h)) - 0.5) * 0.4 * (len / n));
  }
  cuts.push(b);
  const out = [];
  for (let i = 0; i < n; i++) {
    const h = Math.sin((cuts[i] + 3.3) * 78.233 + y1 * 1.3) * 24634.6345;
    const dip = (h - Math.floor(h)) * 0.005;
    out.push(alongX ? span(cuts[i], cuts[i + 1], y0, y1 - dip, z0, z1) : span(x0, x1, y0, y1 - dip, cuts[i], cuts[i + 1]));
  }
  return out;
}
/** A box from (x0, y0, z0) to (x1, y1, z1). */
export const span = (x0, x1, y0, y1, z0, z1, tile) => block(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, tile);

/** A square bar of side `t` from point p to point q (a rail). */
function bar(p, q, t) {
  const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  const g = new THREE.BoxGeometry(t, d.length(), t);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  g.translate((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2);
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

/** The material keys the barrage is built in. */
export const BARRAGE_KEYS = ['concrete', 'face', 'coping', 'deck', 'block', 'vault', 'brick', 'floor', 'steel', 'roof', 'rail', 'timber', 'mesh', 'wet', 'salt'];

/**
 * Every built body of the barrage, as lists of geometries by material key. The world merges each list into meshes
 * (`phys: 'ground'`). Keys: concrete (walls, piers), face (the wall's two great faces, board-marked), coping (parapet tops,
 * lintels), deck (the deck's top), block (gate houses' block walls), vault (inside a chamber), brick (a vault's courses),
 * floor (rooms' floor slabs), steel (beams, stanchions, trusses), roof (sheeting), rail (railings), timber, mesh (the cage),
 * wet and salt (the water's line on every face standing in brine).
 */
export function buildBarrage(plan) {
  const G = Object.fromEntries(BARRAGE_KEYS.map(k => [k, []]));
  const put = (key, geo) => (Array.isArray(geo) ? G[key].push(...geo) : G[key].push(geo));
  const rooms = plan.rooms;
  const T = WALL_T;
  const cage = rooms.find(r => r.shell === 'cage');
  const cageBand = { minX: cage.rect.minX - T, maxX: cage.rect.maxX + T, minZ: cage.rect.minZ - T, maxZ: cage.rect.maxZ + T };

  /* ---- the deck: its slab, over the wall from the road's parapet to the east face, from the north yard to the south. */
  for (const [z0, z1] of pieces(YARD_N.maxZ, WALL.south - T, [], 32)) put('deck', span(WALL.deckW, WALL.east - T, DECK - DECK_SLAB, DECK, z0, z1, 3));

  /* ---- the east face: from the tailwater's bed (or the foot) to a kerb at the deck's edge, from the north yard (whose own
   * parapet is the face there) to the south, with the adit's mouth in it; a railing along the deck's edge on the kerb. */
  {
    const x0 = WALL.east - T, x1 = WALL.east, top = DECK + 0.15;
    for (const [z0, z1] of pieces(YARD_N.maxZ, WALL.south, [[ADIT.minZ, ADIT.maxZ]], 16)) {
      const low = z0 >= APRON.maxZ - 0.01 ? BASIN.bed - 0.3 : FOOT - 0.4;
      put('face', liftSpan(x0, x1, low, top - 0.12, z0, z1, 3));
      put('coping', copingUnits(x0 - 0.05, x1 + 0.05, top - 0.12, top, z0, z1, 1.2));
    }
    // Over the adit's mouth: the face from the lintel up; under it, the face down to the ramp's fill.
    put('face', liftSpan(x0, x1, GALLERY + 3.6, top - 0.12, ADIT.minZ, ADIT.maxZ, 3));
    put('coping', copingUnits(x0 - 0.05, x1 + 0.05, top - 0.12, top, ADIT.minZ, ADIT.maxZ, 1.2));
    put('face', liftSpan(x0, x1, BASIN.bed - 0.3, GALLERY - 0.4, ADIT.minZ, ADIT.maxZ, 3));
    put('coping', copingUnits(x1 - 0.02, x1 + 0.16, GALLERY + 3.6, GALLERY + 3.95, ADIT.minZ - 0.4, ADIT.maxZ + 0.4, 1.2));
    // The railing: a post every 2 m, a mid rail and a top rail.
    const xr = (x0 + x1) / 2, z0 = YARD_N.maxZ + 0.6, z1 = WALL.south - T - 0.1;
    const n = Math.round((z1 - z0) / 2);
    for (let i = 0; i <= n; i++) {
      const z = z0 + (z1 - z0) * i / n;
      put('rail', span(xr - 0.04, xr + 0.04, top, top + 1.05, z - 0.04, z + 0.04, 1));
    }
    for (const y of [0.5, 1.0]) put('rail', span(xr - 0.025, xr + 0.025, top + y, top + y + 0.05, z0, z1, 1));
  }

  /* ---- the walls round every open walk: a parapet over a drop, a retaining wall under higher land, the deck's parapet. */
  const roofedNear = (w) => plan.roofed.filter(v => {
    const r = v.rect;
    if (w.side === 'minX') return Math.abs(r.maxX - w.plane) < 1.0;
    if (w.side === 'maxX') return Math.abs(r.minX - w.plane) < 1.0;
    if (w.side === 'minZ') return Math.abs(r.maxZ - w.plane) < 1.0;
    return Math.abs(r.minZ - w.plane) < 1.0;
  });
  for (const w of plan.work.walls) {
    const v = plan.byId.get(w.volume);
    if (!plan.openVols.includes(v)) continue;
    // The east face is built whole above; the cage's sides are its own.
    if (w.side === 'minX' && Math.abs(w.plane - WALL.east) < 1e-6) continue;
    const along = w.side === 'minX' || w.side === 'maxX' ? 'z' : 'x';
    // A room's walls stand where its own side meets this one: leave that stretch to the room.
    const gaps = [];
    for (const rv of roofedNear(w)) {
      const r = rv.rect;
      gaps.push(along === 'z' ? [r.minZ - T, r.maxZ + T] : [r.minX - T, r.maxX + T]);
    }
    if (along === 'z' && w.side === 'minX' && w.plane > cageBand.maxX - 0.1 && w.plane < cageBand.maxX + 0.1) gaps.push([cageBand.minZ, cageBand.maxZ]);
    if (along === 'x' && (Math.abs(w.plane - cageBand.minZ) < 0.1 || Math.abs(w.plane - cageBand.maxZ) < 0.1)) gaps.push([cageBand.minX, cageBand.maxX]);
    const r = v.rect;
    const full = along === 'z' ? [r.minZ, r.maxZ] : [r.minX, r.maxX];
    for (const [a0, a1] of pieces(w.from, w.to, gaps, 4)) {
      // Turn the corner: a piece that ends at the volume's corner runs on over the wall it meets.
      const a = Math.abs(a0 - full[0]) < 1e-6 ? a0 - T : a0, b = Math.abs(a1 - full[1]) < 1e-6 ? a1 + T : a1;
      const mid = (a + b) / 2;
      const dir = w.side === 'minX' ? -1 : w.side === 'maxX' ? 1 : w.side === 'minZ' ? -1 : 1;
      // What lies beyond: sampled a metre out, along the piece.
      let lo = Infinity, hi = -Infinity;
      for (const t of [0.1, 0.5, 0.9]) {
        const s = a + (b - a) * t;
        const [px, pz] = along === 'z' ? [w.plane + dir * 1.0, s] : [s, w.plane + dir * 1.0];
        const y = land(px, pz);
        lo = Math.min(lo, y); hi = Math.max(hi, y);
      }
      const fl = (s) => (along === 'z' ? floorOf(v, Math.min(Math.max(w.plane - dir * 0.01, r.minX), r.maxX - 1e-6), Math.min(Math.max(s, r.minZ), r.maxZ - 1e-6)) : floorOf(v, Math.min(Math.max(s, r.minX), r.maxX - 1e-6), Math.min(Math.max(w.plane - dir * 0.01, r.minZ), r.maxZ - 1e-6)));
      const floorHi = Math.max(fl(a), fl(b)), floorLo = Math.min(fl(a), fl(b));
      const drop = lo < floorLo - 0.5;
      const deck = hi >= DECK - 0.01 && hi < DECK + 0.5;
      const rise = hi > floorHi + 0.5;
      // Over the deck the parapet stands a person's height over the walk, half a metre over the deck: the deck is seen across.
      // Over the tailwater side's drop the edge is a kerb and a railing, so the drop is seen from the walk; elsewhere a parapet.
      const px = along === 'z' ? w.plane + dir * 1.0 : mid;
      const railed = drop && px > WALL.east;
      const top = railed ? floorHi + 0.25 : deck ? floorHi + PARAPET : rise ? hi + 0.3 : floorHi + PARAPET;
      const bottom = drop ? lo - 0.3 : floorLo - 0.4;
      // Over a drop the wall is thicker (the land's own step lies inside it), unless it would stand proud of the east face.
      const thick = drop && Math.abs(w.plane + dir * T - WALL.east) > 0.05 ? T + 0.3 : T;
      const [x0, x1, z0, z1] = along === 'z'
        ? (dir < 0 ? [w.plane - thick, w.plane, a, b] : [w.plane, w.plane + thick, a, b])
        : (dir < 0 ? [a, b, w.plane - thick, w.plane] : [a, b, w.plane, w.plane + thick]);
      // Over a drop it is mass concrete like the great faces (board-marked, cast in lifts); elsewhere a cast wall.
      if (drop) put('face', liftSpan(x0, x1, bottom, top - 0.12, z0, z1));
      else put('concrete', span(x0, x1, bottom, top - 0.12, z0, z1, drop ? 3 : 2.4));
      // Where the wall stands in brine: the water's line on its outer face, a dark wet band and the salt dried white over it.
      if (drop) {
        const W = px < WALL.west ? LAGOON.water : BASIN.water;
        if (bottom < W - 0.3) waterline(put, along, dir, along === 'z' ? (dir < 0 ? x0 : x1) : (dir < 0 ? z0 : z1), a, b, W);
      }
      put('coping', copingUnits(x0 - (along === 'z' ? 0.05 : 0), x1 + (along === 'z' ? 0.05 : 0), top - 0.12, top, z0 - (along === 'x' ? 0.05 : 0), z1 + (along === 'x' ? 0.05 : 0), 1.2));
      if (railed) {
        // Posts at each end and the middle of the length, a top rail and a mid rail following the floor's slope.
        const c = along === 'z' ? (x0 + x1) / 2 : (z0 + z1) / 2;
        const at = (t, y) => along === 'z' ? [c, y, t] : [t, y, c];
        for (const t of [a + 0.05, (a + b) / 2, b - 0.05]) {
          const yt = fl(Math.min(Math.max(t, full[0]), full[1])) + PARAPET;
          const p = at(t, 0);
          put('rail', span(p[0] - 0.04, p[0] + 0.04, top, yt, p[2] - 0.04, p[2] + 0.04, 1));
        }
        for (const h of [0.6, PARAPET]) put('rail', bar(at(a, fl(Math.max(a, full[0])) + h), at(b, fl(Math.min(b, full[1])) + h), 0.05));
      }
    }
  }

  /* ---- the rooms, the passages, the gallery and the adit. */
  for (const v of plan.roofed) buildShell(plan, v, put);
  return G;
}

/**
 * The water's line on a face standing in brine: from a hand under the water to 0.55 m over it the concrete is dark and wet
 * (the tide works up and down it), and over that 0.3 m of salt dried white. `at` is the face's plane, `out` which way it looks.
 */
function waterline(put, along, out, at, a, b, W) {
  // The skin stands where the old box's outer face stood: 2.2 cm off the face, inside the same thin slab.
  const plane = at + out * 0.022;
  // The tide's reach wanders: the wet band's top a hand up or down along the face, the salt dried over it thicker where
  // the spray lands. Seeded by position, so the same face always has the same line.
  const wetTop = s => W + 0.55 + (fbm(s * 0.35, at * 0.1) - 0.5) * 0.36 + (fbm(s * 2.1, at * 0.3 + 5) - 0.5) * 0.08;
  const saltTop = s => wetTop(s) + 0.1 + Math.max(0, fbm(s * 0.5 + 9, at * 0.2) - 0.32) * 0.5 + (fbm(s * 3.3, at + 2) - 0.5) * 0.05;
  put('wet', tideStrip(along, out, plane, a, b, () => W - 0.1, wetTop));
  put('salt', tideStrip(along, out, plane, a, b, wetTop, saltTop));
}

/**
 * One band of the water's line as a single sheet on a face's plane (at `plane`, looking `out` along x or z), from `a` to
 * `b` along it in 0.35 m steps, between `lo(s)` and `hi(s)`. Its uvs are in metres, as the barrage's.
 */
function tideStrip(along, out, plane, a, b, lo, hi) {
  const n = Math.max(1, Math.ceil((b - a) / 0.35));
  const pos = [], nor = [], uv = [], idx = [];
  const nx = along === 'z' ? out : 0, nz = along === 'z' ? 0 : out;
  for (let i = 0; i <= n; i++) {
    const s = a + (b - a) * i / n;
    const y0 = lo(s), y1 = Math.max(y0 + 0.03, hi(s));
    for (const y of [y0, y1]) {
      if (along === 'z') pos.push(plane, y, s); else pos.push(s, y, plane);
      nor.push(nx, 0, nz);
      uv.push(s, y);
    }
  }
  for (let i = 0; i < n; i++) {
    const p = i * 2;
    // Counter-clockwise seen from outside: (along, up) is right-handed about the normal for one side and not the other.
    const ccw = along === 'z' ? out < 0 : out > 0;
    if (ccw) idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3);
    else idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** The walls of a roofed volume on its four sides, outside its rectangle, from under its floor to `top`, cut for its openings. */
function sideWalls(v, put, { key = 'vault', top, base, thick = WALL_T, lintel = DOOR.top, skip = [] }) {
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
    for (const [a, b] of gaps) slab(a, b, v.floor.y0 + lintel, top);
  }
}

/** A floor slab over a rectangle, its top at `y`. */
const floorSlab = (put, r, y, d = 0.3) => put('floor', span(r.minX, r.maxX, y - d, y, r.minZ, r.maxZ, 1.8));

/** Every roofed volume's shell: floor, walls, roof, by its kind and (for a room) its `shell`. */
function buildShell(plan, v, put) {
  const r = v.rect, L = v.floor.y0, T = WALL_T;
  const under = DECK - DECK_SLAB;
  if (v.kind === 'passage') {
    floorSlab(put, r, L);
    // A passage's two cheeks are the walls either side of the door it goes through; its lintel is built by those walls.
    const room = plan.rooms.find(m => m.door === v);
    if (room.level === CREST) {
      // Through the gate house's front wall, which stands on the road's parapet line: a concrete lintel over the door.
      put('coping', copingUnits(r.minX - 0.04, r.maxX + 0.08, L + DOOR.top, L + DOOR.top + 0.32, r.minZ - 0.3, r.maxZ + 0.3, 1.2));
    } else if (room.shell === 'cage') {
      // The cage's door: a steel frame; the mesh above it is the cage's own.
      for (const z of [r.minZ - 0.08, r.maxZ + 0.08]) put('steel', span(r.minX, r.maxX, L, L + DOOR.top, z - 0.08, z + 0.08, 1));
      put('steel', span(r.minX, r.maxX, L + DOOR.top, L + DOOR.top + 0.16, r.minZ - 0.16, r.maxZ + 0.16, 1));
    } else {
      put('coping', copingUnits(r.minX, r.maxX, L + DOOR.top, L + DOOR.top + 0.3, r.minZ - 0.2, r.maxZ + 0.2, 1.2));
      put('vault', span(r.minX, r.maxX, L + DOOR.top + 0.3, under, r.minZ - 0.3, r.maxZ + 0.3, 2.4));
      for (const [z0, z1] of [[r.minZ - T, r.minZ], [r.maxZ, r.maxZ + T]]) put('vault', span(r.minX, r.maxX, L - 0.4, L + DOOR.top, z0, z1, 2.4));
    }
    return;
  }
  if (v.kind === 'gallery' || v.kind === 'adit') {
    // In the wall: concrete walls up to the deck's slab, a slab roof at the gallery's height.
    const top = L + v.roof;
    floorSlab(put, r, L);
    sideWalls(v, put, { key: 'vault', top: under, base: L - 0.4, skip: v.kind === 'adit' ? ['maxX'] : [] });
    put('vault', span(r.minX - 0.01, r.maxX + 0.01, top, under, r.minZ - 0.01, r.maxZ + 0.01, 2.4));
    // The gallery's haunches: a fillet at each top corner, so the section reads as cast.
    if (v.kind === 'gallery') for (const x of [r.minX, r.maxX]) {
      const geo = block(0.42, 0.42, r.maxZ - r.minZ, 0, 0, 0, 1.2);
      geo.rotateZ(Math.PI / 4);
      geo.translate(x, top, (r.minZ + r.maxZ) / 2);
      put('vault', geo);
    }
    return;
  }
  const room = plan.roomById.get(v.id);
  if (room.level === CREST) { buildGateHouse(plan, room, put); return; }
  if (room.shell === 'cage') { buildCage(room, put); return; }
  // A cell chamber in the wall.
  floorSlab(put, r, L);
  sideWalls(v, put, { key: 'vault', top: under, base: L - 0.4, thick: room.doorT });
  const top = L + room.top;
  const midX = (r.minX + r.maxX) / 2, midZ = (r.minZ + r.maxZ) / 2;
  if (room.shell === 'vault') {
    // A segmental barrel vault running east and west: springing 3.8 m over the floor, the crown at `top`, in voussoir courses.
    const half = (r.maxZ - r.minZ) / 2, rise = room.top - 3.8;
    const R = (half * half + rise * rise) / (2 * rise), cy = top - R;
    const n = 16, th = 0.34, a0 = Math.asin(half / R);
    for (let i = 0; i < n; i++) {
      const a = -a0 + (2 * a0) * (i + 0.5) / n;
      const chord = 2 * R * Math.sin(a0 / n) + 0.02;
      const off = Math.sin(a) * (R + th / 2), y = cy + Math.cos(a) * (R + th / 2);
      const geo = block(r.maxX - r.minX, th, chord, 0, 0, 0, 1.2);
      geo.rotateX(a);
      geo.translate(midX, y, midZ + off);
      put('brick', geo);
    }
    // The spandrels over the vault, up to the deck's slab.
    put('vault', span(r.minX - 0.01, r.maxX + 0.01, top + 0.34, under, r.minZ - 0.01, r.maxZ + 0.01, 2.4));
    for (const s of [-1, 1]) put('vault', span(r.minX - 0.01, r.maxX + 0.01, L + 3.8, top + 0.34, s < 0 ? r.minZ - 0.01 : r.maxZ - 1.6, s < 0 ? r.minZ + 1.6 : r.maxZ + 0.01, 2.4));
    return;
  }
  if (room.shell === 'beams') {
    // Rolled steel beams across the room every 2 m (an I-section: two flanges and a web), the slab on them.
    put('vault', span(r.minX - 0.01, r.maxX + 0.01, top + 0.36, under, r.minZ - 0.01, r.maxZ + 0.01, 2.4));
    const n = Math.round((r.maxZ - r.minZ) / 2);
    for (let i = 1; i < n; i++) {
      const z = r.minZ + (r.maxZ - r.minZ) * i / n;
      put('steel', span(r.minX, r.maxX, top, top + 0.03, z - 0.14, z + 0.14, 1));
      put('steel', span(r.minX, r.maxX, top + 0.33, top + 0.36, z - 0.14, z + 0.14, 1));
      put('steel', span(r.minX, r.maxX, top + 0.03, top + 0.33, z - 0.012, z + 0.012, 1));
    }
    return;
  }
  // The battery hall: a tall slab, two crane-runway girders along the side walls on corbels, the slab's downstand beams.
  put('vault', span(r.minX - 0.01, r.maxX + 0.01, top, under, r.minZ - 0.01, r.maxZ + 0.01, 2.4));
  for (const z of [r.minZ + 0.35, r.maxZ - 0.35]) {
    put('steel', span(r.minX, r.maxX, top - 0.9, top - 0.87, z - 0.2, z + 0.2, 1));
    put('steel', span(r.minX, r.maxX, top - 0.53, top - 0.5, z - 0.2, z + 0.2, 1));
    put('steel', span(r.minX, r.maxX, top - 0.87, top - 0.53, z - 0.015, z + 0.015, 1));
    for (let i = 0; i <= 4; i++) {
      const x = r.minX + 0.4 + (r.maxX - r.minX - 0.8) * i / 4;
      put('vault', span(x - 0.3, x + 0.3, top - 1.35, top - 0.9, z - 0.35 * Math.sign(z - midZ) - 0.35, z - 0.35 * Math.sign(z - midZ) + 0.35, 1.2));
    }
  }
  for (const x of [r.minX + (r.maxX - r.minX) / 3, r.minX + 2 * (r.maxX - r.minX) / 3]) put('vault', span(x - 0.25, x + 0.25, top - 0.5, top, r.minZ, r.maxZ, 2.4));
}

/**
 * A GATE HOUSE on the crest: it stands off the road's west side on a pier in the lagoon. Concrete block walls; its front wall is
 * on the road's parapet line, its door through it. Room 1 is gabled (ridge east and west); room 2 is a lean-to rising to the
 * lagoon. Each has a window in its south wall, toward the back, that the low west-south-west sun comes in by.
 */
function buildGateHouse(plan, room, put) {
  const r = room.vol.rect, L = room.level, T = WALL_T;
  const midZ = (r.minZ + r.maxZ) / 2;
  // The pier: from the lagoon's bed to under the floor, a little wider than the house, with a cutwater facing the lagoon.
  put('concrete', span(r.minX - T - 0.6, r.maxX, LAGOON.bed - 2.2, L - 0.3, r.minZ - T - 0.6, r.maxZ + T + 0.6, 3));
  put('coping', copingUnits(r.minX - T - 0.7, r.maxX, L - 0.3, L - 0.18, r.minZ - T - 0.7, r.maxZ + T + 0.7, 1.2));
  waterline(put, 'z', -1, r.minX - T - 0.6, r.minZ - T - 0.6, r.maxZ + T + 0.6, LAGOON.water);
  waterline(put, 'x', -1, r.minZ - T - 0.6, r.minX - T - 0.6, r.maxX, LAGOON.water);
  waterline(put, 'x', 1, r.maxZ + T + 0.6, r.minX - T - 0.6, r.maxX, LAGOON.water);
  floorSlab(put, r, L, 0.12);
  const eave = L + room.top, ridge = L + room.ridge;
  const win = room.window;
  // The north wall and the front (east) wall to the eaves; the back (west) wall to the eaves or the lean-to's ridge.
  sideWalls(room.vol, put, { key: 'block', top: eave, base: L - 0.3, skip: ['minX', 'maxZ'] });
  const backTop = room.shell === 'mono' ? ridge : eave;
  put('block', span(r.minX - T, r.minX, L - 0.3, backTop, r.minZ - T, r.maxZ + T, 2.4));
  // The south wall, with the window the low sun comes in by: a concrete sill and head, steel mullions every 1.1 m.
  const z0 = r.maxZ, z1 = r.maxZ + T;
  const wl = L + win.y[0], wh = L + win.y[1];
  put('block', span(r.minX, r.maxX, L - 0.3, wl, z0, z1, 2.4));
  put('block', span(r.minX, r.maxX, wh, eave, z0, z1, 2.4));
  put('block', span(r.minX, win.x[0], wl, wh, z0, z1, 2.4));
  put('block', span(win.x[1], r.maxX, wl, wh, z0, z1, 2.4));
  put('coping', copingUnits(win.x[0] - 0.1, win.x[1] + 0.1, wl - 0.12, wl, z0, z1 + 0.12, 1.2));
  put('coping', copingUnits(win.x[0] - 0.1, win.x[1] + 0.1, wh, wh + 0.16, z0, z1 + 0.05, 1.2));
  const nm = Math.round((win.x[1] - win.x[0]) / 1.1);
  for (let i = 1; i < nm; i++) {
    const x = win.x[0] + (win.x[1] - win.x[0]) * i / nm;
    put('steel', span(x - 0.05, x + 0.05, wl, wh, z1 - 0.32, z1 - 0.2, 1));
  }
  put('steel', span(win.x[0], win.x[1], (wl + wh) / 2 - 0.04, (wl + wh) / 2 + 0.04, z1 - 0.32, z1 - 0.2, 1));
  const X0 = r.minX - T - 0.35, X1 = r.maxX + T + 0.35, Z0 = r.minZ - T - 0.4, Z1 = r.maxZ + T + 0.4;
  if (room.shell === 'gable') {
    // Ridge east and west; two pitches falling north and south on steel trusses; the gables above the end walls in courses.
    const halfW = (Z1 - Z0) / 2, rise = ridge - eave, ang = Math.atan2(rise, halfW), len = Math.hypot(halfW, rise);
    for (const s of [-1, 1]) {
      const geo = block(X1 - X0, 0.1, len + 0.1, 0, 0, 0, 1.8);
      geo.rotateX(s * ang);
      geo.translate((X0 + X1) / 2, (eave + ridge) / 2 + 0.12, midZ + s * halfW / 2);
      put('roof', geo);
    }
    for (const [gx0, gx1] of [[r.minX - T, r.minX], [r.maxX, r.maxX + T]]) {
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const y0 = eave + (ridge - eave) * i / steps, y1 = eave + (ridge - eave) * (i + 1) / steps;
        const hw = (r.maxZ - r.minZ) / 2 * (1 - (i + 1) / steps) + T * 0.5;
        put('block', span(gx0, gx1, y0, y1, midZ - hw, midZ + hw, 2.4));
      }
    }
    // Steel trusses across the room every 3.2 m: a bottom chord at the eaves, two rafters, a king post, two struts.
    const n = Math.round((r.maxX - r.minX) / 3.2);
    for (let i = 1; i < n; i++) {
      const x = r.minX + (r.maxX - r.minX) * i / n;
      put('steel', span(x - 0.08, x + 0.08, eave - 0.16, eave, r.minZ, r.maxZ, 1));
      for (const s of [-1, 1]) {
        const half = (r.maxZ - r.minZ) / 2, l = Math.hypot(half, rise);
        const geo = block(0.12, 0.16, l, 0, 0, 0, 1);
        geo.rotateX(s * Math.atan2(rise, half));
        geo.translate(x, (eave + ridge) / 2 - 0.1, midZ + s * half / 2);
        put('steel', geo);
      }
      put('steel', span(x - 0.05, x + 0.05, eave, ridge - 0.2, midZ - 0.05, midZ + 0.05, 1));
    }
    put('steel', span(r.minX, r.maxX, ridge - 0.34, ridge - 0.14, midZ - 0.08, midZ + 0.08, 1));
  } else {
    // A lean-to rising west to the lagoon: the sheet on purlins on two steel rafters; the side walls rise with it in courses.
    const run = X1 - X0, rise = ridge - eave, ang = Math.atan2(rise, run), len = Math.hypot(run, rise);
    const geo = block(len + 0.1, 0.1, Z1 - Z0, 0, 0, 0, 1.8, { swap: true });
    geo.rotateZ(-ang);
    geo.translate((X0 + X1) / 2, (eave + ridge) / 2 + 0.12, midZ);
    put('roof', geo);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const xa = r.minX + (r.maxX - r.minX) * i / steps, xb = r.minX + (r.maxX - r.minX) * (i + 1) / steps;
      const ya = eave + rise * ((X1 - xa) / run);
      for (const [za, zb] of [[r.minZ - T, r.minZ], [r.maxZ, r.maxZ + T]]) put('block', span(xa, xb, eave, ya, za, zb, 2.4));
    }
    for (const z of [r.minZ + (r.maxZ - r.minZ) / 3, r.minZ + 2 * (r.maxZ - r.minZ) / 3]) {
      const g2 = block(len - 0.6, 0.3, 0.14, 0, 0, 0, 1);
      g2.rotateZ(-ang);
      g2.translate((r.minX + r.maxX) / 2, (eave + ridge) / 2 - 0.12, z);
      put('steel', g2);
    }
  }
}

/**
 * THE SWITCHYARD'S CAGE at the foot, against the wall's east face: a concrete plinth wall on the west (the face's foot), steel
 * stanchions every 2.6 m on the other three sides with expanded-metal mesh between them over a steel kick plate, rolled beams
 * across, and a lean-to sheet roof rising west to the wall.
 */
function buildCage(room, put) {
  const r = room.vol.rect, L = room.level, T = WALL_T;
  floorSlab(put, { minX: r.minX - T, maxX: r.maxX + T, minZ: r.minZ - T, maxZ: r.maxZ + T }, L, 0.3);
  const eave = L + room.top, ridge = L + room.ridge;
  const rise = ridge - eave, run = r.maxX + T - (r.minX - T);
  const roofAt = x => eave + rise * ((r.maxX + T - x) / run);
  // The plinth wall against the face, up to the roof.
  put('concrete', span(r.minX - T, r.minX, L - 0.3, ridge, r.minZ - T, r.maxZ + T, 2.4));
  const door = room.door.rect;
  const sides = [
    { alongZ: false, at: r.minZ - T / 2, a: r.minX, b: r.maxX + T },
    { alongZ: false, at: r.maxZ + T / 2, a: r.minX, b: r.maxX + T },
    { alongZ: true, at: r.maxX + T / 2, a: r.minZ, b: r.maxZ, gap: [door.minZ - 0.16, door.maxZ + 0.16] }
  ];
  for (const s of sides) {
    const n = Math.max(2, Math.round((s.b - s.a) / 2.6));
    const posts = [];
    for (let i = 0; i <= n; i++) posts.push(s.a + (s.b - s.a) * i / n);
    if (s.gap) posts.push(s.gap[0], s.gap[1]);
    posts.sort((p, q) => p - q);
    for (const p of posts) {
      const [x, z] = s.alongZ ? [s.at, p] : [p, s.at];
      const top = roofAt(x);
      put('steel', s.alongZ ? span(x - 0.13, x + 0.13, L, top, z - 0.1, z + 0.1, 1) : span(x - 0.1, x + 0.1, L, top, z - 0.13, z + 0.13, 1));
    }
    // Mesh panels between the posts over a kick plate, a top rail at 3.0 m; above it, mesh to the roof.
    for (let i = 0; i < posts.length - 1; i++) {
      const p0 = posts[i] + 0.1, p1 = posts[i + 1] - 0.1;
      if (p1 - p0 < 0.2) continue;
      const pm = (p0 + p1) / 2;
      const inGap = s.gap && pm > s.gap[0] && pm < s.gap[1];
      const xm = s.alongZ ? s.at : pm;
      const top = roofAt(s.alongZ ? s.at : Math.max(p0, p1)) - 0.05;
      const y0 = inGap ? L + DOOR.top + 0.16 : L;
      if (!inGap) put('steel', s.alongZ ? span(s.at - 0.02, s.at + 0.02, L, L + 0.3, p0, p1, 1) : span(p0, p1, L, L + 0.3, s.at - 0.02, s.at + 0.02, 1));
      const m0 = inGap ? y0 : L + 0.3;
      put('mesh', s.alongZ ? span(s.at - 0.01, s.at + 0.01, m0, top, p0, p1, 1) : span(p0, p1, m0, top, s.at - 0.01, s.at + 0.01, 1));
      put('steel', s.alongZ ? span(s.at - 0.04, s.at + 0.04, L + 3.0, L + 3.08, p0, p1, 1) : span(p0, p1, L + 3.0, L + 3.08, s.at - 0.04, s.at + 0.04, 1));
      void xm;
    }
  }
  // Rolled beams east and west under the roof every 2.6 m, and the sheet roof on them.
  const n = Math.round((r.maxZ - r.minZ + 2 * T) / 2.6);
  for (let i = 0; i <= n; i++) {
    const z = r.minZ - T / 2 + (r.maxZ - r.minZ + T) * i / n;
    const len = Math.hypot(run, rise), ang = Math.atan2(rise, run);
    const geo = block(len, 0.3, 0.14, 0, 0, 0, 1);
    geo.rotateZ(-ang);
    geo.translate((r.minX - T + r.maxX + T) / 2, (eave + ridge) / 2 - 0.15, z);
    put('steel', geo);
  }
  const len = Math.hypot(run + 0.6, rise), ang = Math.atan2(rise, run);
  const geo = block(len, 0.08, r.maxZ - r.minZ + 2 * T + 0.5, 0, 0, 0, 1.8, { swap: true });
  geo.rotateZ(-ang);
  geo.translate((r.minX - T + r.maxX + T) / 2 + 0.3, (eave + ridge) / 2 + 0.04, (r.minZ + r.maxZ) / 2);
  put('roof', geo);
}

/* ================================================================== water */

/**
 * The lagoon's brine and the tailwater, as two sheets. The lagoon reaches from the wall's west face to the far shore; the
 * tailwater from the wall's east face over the basin and the flats. Each is cut into strips so a sheet never lies over a walk.
 */
export function buildWaterGeometry(plan) {
  const sheet = (x0, x1, z0, z1, y) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, 1, 1);
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * (x1 - x0)) / 14, (z0 + uv.getY(i) * (z1 - z0)) / 14);
    g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    return g;
  };
  const lagoon = [
    sheet(-900, YARD_N.minX - WALL_T - 0.3, -900, 900, LAGOON.water),
    sheet(YARD_N.minX - WALL_T - 0.3, WALL.west - 0.3, YARD_N.maxZ + 0.3, YARD_S.maxZ + 0.3, LAGOON.water)
  ];
  const tail = [
    sheet(APRON.maxX + WALL_T + 0.3, 900, -900, 900, BASIN.water),
    sheet(RAMP.maxX + 0.9, APRON.maxX + WALL_T + 0.3, APRON.maxZ + 0.9, 900, BASIN.water)
  ];
  const a = mergeGeometries(lagoon), b = mergeGeometries(tail);
  for (const g of [...lagoon, ...tail]) g.dispose();
  return { lagoon: a, tail: b };
}

/** Merge a list of geometries into one (or null for none). */
export function mergeList(list) {
  if (!list.length) return null;
  const nonIndexed = list.map(g => (g.index ? g.toNonIndexed() : g));
  const m = mergeGeometries(nonIndexed);
  for (const g of list) g.dispose();
  for (const g of nonIndexed) if (!list.includes(g)) g.dispose();
  return m;
}

export { r2 };
