/**
 * teeter/terrain.js — The hillside of salt terraces as drawn: the ground, the masonry, the pans and the rooms' shells.
 *
 * Everything here stands on `terrace-plan.js`. The ground mesh is sampled from the plan's ONE height field on a grid with
 * a row of vertices on every line where the ground steps (the face of a wall, a kerb, the side of the stair), so a step
 * is a sharp edge hidden inside the wall or kerb that stands on it; the grid runs to the horizon. A roofed room is a hole
 * in that mesh: its floor, its walls and its roof are built here, and the pans' floor over it is the top of its roof.
 *
 *   makeTeeterField     the height the game walks on (the plan's, with the pad's plate on the shelf)
 *   buildGroundGeometry the ground mesh: terraces, dikes, the stair's ramps, the hill, the spurs, the valley
 *   buildMasonry        terrace walls and parapets, kerbs, the stair's side walls, the shelf's bank, the fences
 *                       across the dikes' ends, the pans' bunds; every room's floor, walls and roof (`phys: 'ground'`)
 *   buildBrineGeometry  every pan's brine, one sheet (ambient: nothing stands on it)
 *
 * Masonry is built in the world frame, as merged geometries per material: a terrace wall 250 m long is a dozen boxes.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  LEVEL, FACE, WALLS, WALL_T, DIKE_W, KERB_T, PAN, EDGE, STAIR, RAMP_L, TERRACE_Z, SHELF, FLOOR4, DOOR, ROOF_T,
  bandAt, dikeStart, shaftOf, shaftPier
} from './terrace-plan.js';

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

/* ================================================================== the field */

/** The height the game walks on: the plan's, with the pad's plate standing on the shelf. */
export function makeTeeterField(plan, pad) {
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

/** A ladder of coordinates: `fine` m apart in the walk, `mid` m out to `outer`, then widening to `far`. */
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

/** What the ground is at (x, z), for its colour: 0 dike clay, 1 pan crust, 2 stair stone, 3 hill rock, 4 valley, 5 spur. */
function surfaceAt(plan, x, z) {
  const v = plan.volumeAt(x, z);
  if (v) return v.kind === 'ramp' ? 2 : 0;
  if (Math.abs(z) > TERRACE_Z + 4) return 5;
  if (x > SHELF.maxX + EDGE + 0.5) return 3;
  const k = bandAt(x);
  if (k >= LEVEL.length - 1) return 4;
  return x >= dikeStart(k) ? 0 : 1;
}

/** How worn the ground is at (x, z): 1 on the line people walk (a dike's middle, the stair's, the floor's way to its rooms). */
function trodden(plan, x, z) {
  const v = plan.volumeAt(x, z);
  if (!v) return 0;
  const bell = d => Math.exp(-(d * d) / 1.4);
  if (v.kind === 'ramp') return bell(z - (STAIR.z0 + STAIR.z1) / 2);
  if (v.id === 'shelf') {
    // From the pad to the stair's head.
    const t = Math.max(0, Math.min(1, ((x - 80) * (64 - 80) + (z - 10) * (36.2 - 10)) / ((64 - 80) ** 2 + (36.2 - 10) ** 2)));
    return bell(Math.hypot(x - (80 + (64 - 80) * t), z - (10 + (36.2 - 10) * t)) / 1.4) * 0.8;
  }
  if (v.kind === 'dike') return bell(x - plan.lineOf(plan.terraceOf(x, z))) * (v.id === 'floor' && z < -16 ? 0.4 : 1);
  return 0;
}

/** The salt scar in the gully above the spring: 0 to 1. */
function scar(x, z) {
  const d = x - SHELF.maxX;
  if (d < 4) return 0;
  return Math.exp(-((z - 10) * (z - 10)) / (60 + d * 0.8)) * smooth(4, 20, d) * (1 - smooth(160, 300, d)) * 0.75;
}

const COLOURS = [
  [0.80, 0.77, 0.70],   // dike: packed clay, dusted with dried salt
  [0.97, 0.96, 0.92],   // pan floor: white crust (under the brine)
  [0.66, 0.64, 0.60],   // the stair: worn stone setts
  [0.62, 0.58, 0.52],   // the hill: bare rock with salt bloom
  [0.70, 0.66, 0.56],   // the valley floor
  [0.60, 0.57, 0.50]    // the spurs
];

/**
 * The ground mesh. Every cell inside a roofed volume (a room, a passage) is left out: the room builds its own floor, and
 * its roof is the pans' floor above it.
 */
export function buildGroundGeometry(field, plan) {
  const br = plan.breaks();
  const xs = ladder(-900, 900, -70, 100, -160, 150, 2, 3.5, br.xs);
  const zs = ladder(-900, 900, -40, 48, -150, 150, 2, 3.5, br.zs);
  const nx = xs.length, nz = zs.length;
  // A vertex on or in a roofed volume takes the land's height (its cells are holes; its edges meet the land round it).
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
    // A step: the vertex belongs to the flat it stands on.
    if (Math.hypot(gx, gz) > 2.5) n = [0, 1, 0];
    const l = Math.hypot(...n);
    nor[k * 3] = n[0] / l; nor[k * 3 + 1] = n[1] / l; nor[k * 3 + 2] = n[2] / l;
    const s = surfaceAt(plan, x, z);
    let c = COLOURS[s];
    // A slow mottle, so a dike is not one flat colour.
    let m = 0.94 + 0.06 * Math.sin(x * 0.37 + Math.sin(z * 0.21) * 2) * Math.sin(z * 0.29 + x * 0.05);
    // THE TRODDEN WAY: down the middle of the stair and along each dike's line, the clay is worn darker and the salt dust gone.
    m *= 1 - 0.13 * trodden(plan, x, z);
    // The hill pales into a white salt scar down the gully above the spring, where the brine seeps out of the rock.
    if (s === 3) c = c.map((v, q) => v + (0.95 - v) * scar(x, z));
    for (let q = 0; q < 3; q++) col[k * 3 + q] = c[q] * m;
    uv[k * 2] = x / 7; uv[k * 2 + 1] = z / 7;
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    if (plan.inRoofed(cx, cz)) continue;
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

/* ================================================================== masonry */

/** A box geometry at (cx, cy, cz) of size (sx, sy, sz), its texture laid in metres. */
function block(sx, sy, sz, cx, cy, cz, tile = 2.4, rotX = 0) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [sz, sy] : ay > 0.5 ? [sx, sz] : [sx, sy];
    uv.setXY(i, uv.getX(i) * a / tile, uv.getY(i) * b / tile);
  }
  if (rotX) g.rotateX(rotX);
  g.translate(cx, cy, cz);
  return g;
}
/** A box from (x0, y0, z0) to (x1, y1, z1). */
const span = (x0, x1, y0, y1, z0, z1, tile) => block(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, tile);

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

/**
 * Every built body of the terraces, as lists of geometries by material key. The world merges each list into meshes
 * (`phys: 'ground'`); `parts` keeps the boxes the checks measure.
 * Material keys: wall (dressed stone), coping, kerb (clay bank), bund (the pans' clay walls), flags (stone floors),
 * vault (the rooms' masonry inside), timber, steel, brick, roof (a house's roof sheets), rail (fences).
 */
export function buildMasonry(plan) {
  const G = { wall: [], coping: [], kerb: [], bund: [], flags: [], vault: [], timber: [], steel: [], brick: [], roof: [], rail: [] };
  const put = (key, geo) => G[key].push(geo);
  const rooms = plan.rooms;
  const doorsOn = w => rooms.filter(r => r.wall === w).map(r => ({ r, d: r.door.rect }));

  /* ---- the terrace walls: from the terrace below to the pans' bank above, or a parapet over the drying floor's edge. */
  for (const w of WALLS) {
    const F = FACE[w], base = LEVEL[w], above = LEVEL[w - 1];
    const top = w === 5 ? above + 0.9 : above + 0.1;
    const gaps = [];
    if (w <= 4) gaps.push([STAIR.z0, STAIR.z1]);
    for (const { d } of doorsOn(w)) gaps.push([d.minZ, d.maxZ]);
    for (const [z0, z1] of pieces(-TERRACE_Z, TERRACE_Z, gaps)) {
      put('wall', span(F, F + WALL_T, base - 0.4, top - 0.12, z0, z1));
      put('coping', span(F - 0.06, F + WALL_T + 0.06, top - 0.12, top, z0, z1, 1.2));
    }
    // Over each door: the wall from the lintel up; a stone lintel; the reveals are the wall's own ends.
    for (const { r, d } of doorsOn(w)) {
      const house = r.shell === 'gable' || r.shell === 'mono';
      put('coping', span(F - 0.04, F + WALL_T, base + DOOR.top, base + DOOR.top + 0.35, d.minZ - 0.3, d.maxZ + 0.3, 1.2));
      put('wall', span(F, F + WALL_T, base + DOOR.top + 0.35, house ? base + r.top : top - 0.12, d.minZ, d.maxZ));
      if (!house) put('coping', span(F - 0.06, F + WALL_T + 0.06, top - 0.12, top, d.minZ, d.maxZ, 1.2));
    }
  }

  /* ---- the kerbs between the dike strips and the pans, cut for the stair. */
  for (let k = 0; k < LEVEL.length - 1; k++) {
    if (k === 4) continue;
    const x0 = k === 0 ? SHELF.minX - KERB_T : FACE[k] - DIKE_W - KERB_T;
    const gaps = k <= 3 ? [[STAIR.z0, STAIR.z1]] : [];
    for (const [z0, z1] of pieces(-TERRACE_Z, TERRACE_Z, gaps)) put('kerb', span(x0, x0 + KERB_T, LEVEL[k] + PAN.floor - 0.1, LEVEL[k] + 0.25, z0, z1, 1.6));
  }

  /* ---- the stair: each ramp's two side walls, from the terrace below to a low wall over the terrace above. */
  for (const k of [1, 2, 3, 4]) {
    const F = FACE[k];
    for (const [z0, z1] of [[STAIR.z0 - 0.6, STAIR.z0], [STAIR.z1, STAIR.z1 + 0.6]]) {
      // Stepped down the ramp in four lengths, so the wall follows the floor at a parapet's height.
      const n = 4;
      for (let i = 0; i < n; i++) {
        const xa = F + WALL_T + (RAMP_L - WALL_T) * i / n, xb = F + WALL_T + (RAMP_L - WALL_T) * (i + 1) / n;
        const top = LEVEL[k - 1] + 0.7;
        put('wall', span(xa, xb, LEVEL[k] - 0.4, top - 0.12, z0, z1));
        put('coping', span(xa, xb, top - 0.12, top, z0 - 0.04, z1 + 0.04, 1.2));
      }
    }
  }

  /* ---- the shelf's bank against the hill, and fences across the closed ends of the walk where the ground runs on level. */
  put('wall', span(SHELF.maxX, SHELF.maxX + 0.6, LEVEL[0] - 0.4, LEVEL[0] + 1.1, SHELF.minZ - 0.6, SHELF.maxZ + 0.6));
  put('coping', span(SHELF.maxX - 0.04, SHELF.maxX + 0.64, LEVEL[0] + 1.1, LEVEL[0] + 1.22, SHELF.minZ - 0.6, SHELF.maxZ + 0.6, 1.2));
  const fence = (x0, x1, z, y) => {
    const n = Math.max(2, Math.round((x1 - x0) / 2.4) + 1);
    for (let i = 0; i < n; i++) put('rail', span(x0 + (x1 - x0) * i / (n - 1) - 0.06, x0 + (x1 - x0) * i / (n - 1) + 0.06, y, y + 1.05, z - 0.06, z + 0.06, 1));
    for (const h of [0.55, 0.98]) put('rail', span(x0, x1, y + h, y + h + 0.07, z - 0.04, z + 0.04, 1));
  };
  const fenceX = (z0, z1, x, y) => {
    const n = Math.max(2, Math.round((z1 - z0) / 2.4) + 1);
    for (let i = 0; i < n; i++) put('rail', span(x - 0.06, x + 0.06, y, y + 1.05, z0 + (z1 - z0) * i / (n - 1) - 0.06, z0 + (z1 - z0) * i / (n - 1) + 0.06, 1));
    for (const h of [0.55, 0.98]) put('rail', span(x - 0.04, x + 0.04, y + h, y + h + 0.07, z0, z1, 1));
  };
  fence(SHELF.minX + 0.1, SHELF.maxX - 0.1, SHELF.minZ - 0.15, LEVEL[0]);
  fence(SHELF.minX + 0.1, SHELF.maxX - 0.1, SHELF.maxZ + 0.15, LEVEL[0]);
  for (const k of [1, 2, 3]) {
    const d = plan.byId.get(`dike-${k}`).rect;
    fence(d.minX + 0.1, d.maxX - 0.1, d.minZ - 0.15, LEVEL[k]);
    fence(d.minX + 0.1, d.maxX - 0.1, d.maxZ + 0.15, LEVEL[k]);
  }
  fence(FLOOR4.minX + 0.1, FLOOR4.maxX - 0.1, FLOOR4.minZ - 0.15, LEVEL[4]);
  fence(FLOOR4.minX + 0.1, FLOOR4.maxX - 0.1, FLOOR4.maxZ + 0.15, LEVEL[4]);
  void fenceX;

  /* ---- the pans' bunds: a clay wall round every pan, a hand over its brine. */
  for (const p of plan.pans()) {
    const y0 = p.level + PAN.floor - 0.02, y1 = p.level - 0.12, t = 0.3;
    put('bund', span(p.minX - t, p.maxX + t, y0, y1, p.minZ - t, p.minZ, 1.6));
    put('bund', span(p.minX - t, p.maxX + t, y0, y1, p.maxZ, p.maxZ + t, 1.6));
    put('bund', span(p.minX - t, p.minX, y0, y1, p.minZ, p.maxZ, 1.6));
    put('bund', span(p.maxX, p.maxX + t, y0, y1, p.minZ, p.maxZ, 1.6));
  }

  /* ---- the rooms. */
  for (const r of rooms) buildRoomShell(r, put);

  return G;
}

/** Every room's floor, walls and roof, by its `shell`. Walls stand outside the room's rectangle; the front is the terrace wall. */
function buildRoomShell(r, put) {
  const v = r.vol.rect, d = r.door.rect, L = r.level, T = 0.6;
  const pansFloor = LEVEL[r.wall - 1] + PAN.floor;
  const house = r.shell === 'gable' || r.shell === 'mono';
  const midZ = (v.minZ + v.maxZ) / 2, midX = (v.minX + v.maxX) / 2;
  // The floor: stone flags, in the room and through the passage.
  put('flags', span(v.minX, v.maxX, L - 0.2, L, v.minZ, v.maxZ, 1.8));
  put('flags', span(d.minX, d.maxX, L - 0.2, L, d.minZ, d.maxZ, 1.8));
  // Side walls and the back wall, up to the roof's top (under the pans) or to a house's eaves.
  const wallTop = house ? L + r.top : pansFloor - 0.02;
  put('vault', span(v.minX, v.maxX + T, L - 0.4, wallTop, v.minZ - T, v.minZ, 2.4));
  put('vault', span(v.minX, v.maxX + T, L - 0.4, wallTop, v.maxZ, v.maxZ + T, 2.4));
  put('vault', span(v.maxX, v.maxX + T, L - 0.4, wallTop, v.minZ, v.maxZ, 2.4));
  // The roof slab under the pans: its top is the pans' floor, its underside where the shell's roof begins.
  const slab = (y0) => {
    if (r.shaft) {
      const s = shaftOf(r), h = s.size / 2;
      put('vault', span(v.minX - 0.01, s.cx - h, y0, pansFloor - 0.02, v.minZ - 0.01, v.maxZ + 0.01, 2.4));
      put('vault', span(s.cx + h, v.maxX + 0.01, y0, pansFloor - 0.02, v.minZ - 0.01, v.maxZ + 0.01, 2.4));
      put('vault', span(s.cx - h, s.cx + h, y0, pansFloor - 0.02, v.minZ - 0.01, s.cz - h, 2.4));
      put('vault', span(s.cx - h, s.cx + h, y0, pansFloor - 0.02, s.cz + h, v.maxZ + 0.01, 2.4));
      return;
    }
    put('vault', span(v.minX - 0.01, v.maxX + 0.01, y0, pansFloor - 0.02, v.minZ - 0.01, v.maxZ + 0.01, 2.4));
  };
  const top = L + r.top;
  if (r.shell === 'vaultX' || r.shell === 'vaultZ') {
    // A segmental barrel vault: springing 3.6 m over the floor, the crown at `top`, built of voussoir courses.
    const alongX = r.shell === 'vaultX';
    const half = alongX ? (v.maxZ - v.minZ) / 2 : (v.maxX - v.minX) / 2;
    const rise = r.top - 3.6;
    const R = (half * half + rise * rise) / (2 * rise);
    const cy = top - R;
    const n = 14, th = 0.34;
    const a0 = Math.asin(half / R);
    for (let i = 0; i < n; i++) {
      const a = -a0 + (2 * a0) * (i + 0.5) / n;
      const chord = 2 * R * Math.sin(a0 / n) + 0.02;
      const off = Math.sin(a) * (R + th / 2), y = cy + Math.cos(a) * (R + th / 2);
      const geo = alongX ? block(v.maxX - v.minX, th, chord, 0, 0, 0, 1.2) : block(chord, th, v.maxZ - v.minZ, 0, 0, 0, 1.2);
      if (alongX) geo.rotateX(a); else geo.rotateZ(-a);
      geo.translate(alongX ? midX : midX + off, y, alongX ? midZ + off : midZ);
      put('brick', geo);
    }
    slab(top + 0.05);
    return;
  }
  if (r.shell === 'steel' || r.shell === 'shaft') {
    // Rolled steel beams across the room every 2 m (an I-section: two flanges and a web), the slab on them.
    slab(top + 0.36);
    const n = Math.round((v.maxX - v.minX) / 2);
    for (let i = 1; i < n; i++) {
      const x = v.minX + (v.maxX - v.minX) * i / n;
      if (r.shaft) { const s = shaftOf(r); if (Math.abs(x - s.cx) < s.size / 2 + 0.2) continue; }
      put('steel', span(x - 0.14, x + 0.14, top, top + 0.03, v.minZ, v.maxZ, 1));
      put('steel', span(x - 0.14, x + 0.14, top + 0.33, top + 0.36, v.minZ, v.maxZ, 1));
      put('steel', span(x - 0.012, x + 0.012, top + 0.03, top + 0.33, v.minZ, v.maxZ, 1));
    }
    if (r.shaft) {
      // The shaft's lining up through the slab and the pans' floor to the pier's top.
      const s = shaftOf(r), h = s.size / 2, pier = shaftPier(r), pierTop = LEVEL[r.wall - 1] + 0.3;
      for (const [x0, x1, z0, z1] of [[s.cx - h - 0.3, s.cx - h, s.cz - h - 0.3, s.cz + h + 0.3], [s.cx + h, s.cx + h + 0.3, s.cz - h - 0.3, s.cz + h + 0.3], [s.cx - h, s.cx + h, s.cz - h - 0.3, s.cz - h], [s.cx - h, s.cx + h, s.cz + h, s.cz + h + 0.3]]) {
        put('vault', span(x0, x1, top + 0.36, pierTop, z0, z1, 2.4));
      }
      // The pier: a stone platform round the shaft's mouth among the pans.
      for (const [x0, x1, z0, z1] of [[pier.minX, s.cx - h - 0.3, pier.minZ, pier.maxZ], [s.cx + h + 0.3, pier.maxX, pier.minZ, pier.maxZ], [s.cx - h - 0.3, s.cx + h + 0.3, pier.minZ, s.cz - h - 0.3], [s.cx - h - 0.3, s.cx + h + 0.3, s.cz + h + 0.3, pier.maxZ]]) {
        put('wall', span(x0, x1, pansFloor, pierTop, z0, z1, 2.4));
      }
    }
    return;
  }
  if (r.shell === 'joists') {
    // Two timber girders along the room, joists across them every 0.6 m, boards over the joists, the slab over all.
    slab(top + 0.28);
    for (const gz of [midZ - 3.5, midZ + 3.5]) put('timber', span(v.minX, v.maxX, top - 0.42, top, gz - 0.18, gz + 0.18, 1));
    const n = Math.round((v.maxX - v.minX) / 0.6);
    for (let i = 0; i <= n; i++) {
      const x = v.minX + 0.1 + (v.maxX - v.minX - 0.2) * i / n;
      put('timber', span(x - 0.06, x + 0.06, top, top + 0.24, v.minZ, v.maxZ, 1));
    }
    put('timber', span(v.minX, v.maxX, top + 0.24, top + 0.28, v.minZ, v.maxZ, 1.2));
    return;
  }
  if (r.shell === 'jack') {
    // Steel beams across the room every 1.8 m, a shallow brick arch sprung between each pair, the slab over all.
    slab(top + 0.42);
    const n = Math.round((v.maxX - v.minX) / 1.8);
    const xs = [];
    for (let i = 0; i <= n; i++) xs.push(v.minX + (v.maxX - v.minX) * i / n);
    for (const x of xs.slice(1, -1)) {
      put('steel', span(x - 0.1, x + 0.1, top, top + 0.025, v.minZ, v.maxZ, 1));
      put('steel', span(x - 0.01, x + 0.01, top + 0.025, top + 0.3, v.minZ, v.maxZ, 1));
    }
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], b = xs[i + 1], m = (a + b) / 2, w = (b - a) / 3;
      // Three courses: two haunches and a crown, 0.12 m of rise.
      put('brick', span(a, a + w, top + 0.06, top + 0.42, v.minZ, v.maxZ, 0.9));
      put('brick', span(m - w / 2, m + w / 2, top + 0.18, top + 0.42, v.minZ, v.maxZ, 0.9));
      put('brick', span(b - w, b, top + 0.06, top + 0.42, v.minZ, v.maxZ, 0.9));
    }
    return;
  }
  if (house) {
    // A weir house: its walls stand up through the pans to the eaves; a timber roof on purlins, sheeted.
    const eave = L + r.top, ridge = L + r.ridge;
    // The front wall above the terrace wall's coping, in the plane of the terrace wall.
    put('vault', span(v.minX - WALL_T, v.minX, LEVEL[r.wall - 1] + 0.1, eave, v.minZ - T, v.maxZ + T, 2.4));
    // Tie beams across the room at the eaves (high, clear of the bay), every 2.6 m.
    const n = Math.round((v.maxX - v.minX) / 2.6);
    for (let i = 1; i < n; i++) {
      const x = v.minX + (v.maxX - v.minX) * i / n;
      put('timber', span(x - 0.12, x + 0.12, eave - 0.3, eave, v.minZ, v.maxZ, 1));
    }
    const x0 = v.minX - WALL_T - 0.4, x1 = v.maxX + T + 0.4, z0 = v.minZ - T - 0.4, z1 = v.maxZ + T + 0.4;
    if (r.shell === 'gable') {
      // Ridge along x; two pitches falling north and south.
      const halfW = (z1 - z0) / 2, rise = ridge - eave, ang = Math.atan2(rise, halfW), len = Math.hypot(halfW, rise);
      for (const s of [-1, 1]) {
        const geo = block(x1 - x0, 0.12, len + 0.1, 0, 0, 0, 1.8);
        geo.rotateX(s * ang);
        geo.translate((x0 + x1) / 2, (eave + ridge) / 2 + 0.06, midZ + s * halfW / 2);
        put('roof', geo);
      }
      // The gable ends above the walls, stepped in courses.
      for (const gx of [v.minX - WALL_T, v.maxX]) {
        const steps = 5;
        for (let i = 0; i < steps; i++) {
          const y0 = eave + (ridge - eave) * i / steps, y1 = eave + (ridge - eave) * (i + 1) / steps;
          const hw = halfW * (1 - (i + 1) / steps) + 0.05;
          put('vault', span(gx, gx + (gx < v.minX ? WALL_T : T), y0, y1, midZ - hw, midZ + hw, 2.4));
        }
      }
      put('timber', span(x0, x1, ridge - 0.2, ridge, midZ - 0.12, midZ + 0.12, 1));
    } else {
      // A monopitch rising to the back (east).
      const run = x1 - x0, rise = ridge - eave, ang = Math.atan2(rise, run), len = Math.hypot(run, rise);
      const geo = block(len + 0.1, 0.12, z1 - z0, 0, 0, 0, 1.8);
      geo.rotateZ(ang);
      geo.translate((x0 + x1) / 2, (eave + ridge) / 2 + 0.06, midZ);
      put('roof', geo);
      // The side walls rise with the roof, in courses; the back wall stands to the ridge.
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const xa = v.minX + (v.maxX - v.minX) * i / steps, xb = v.minX + (v.maxX - v.minX) * (i + 1) / steps;
        const yb = eave + rise * ((xb - x0) / run);
        for (const [za, zb] of [[v.minZ - T, v.minZ], [v.maxZ, v.maxZ + T]]) put('vault', span(xa, xb, eave, yb, za, zb, 2.4));
      }
      put('vault', span(v.maxX, v.maxX + T, eave, ridge, v.minZ - T, v.maxZ + T, 2.4));
    }
  }
}

/* ================================================================== brine */

/** Every pan's brine, one sheet at its level (ambient: nothing stands on it). */
export function buildBrineGeometry(plan) {
  const parts = plan.pans().map(p => {
    const g = new THREE.PlaneGeometry(p.maxX - p.minX, p.maxZ - p.minZ);
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.minX + uv.getX(i) * (p.maxX - p.minX)) / 9, (p.minZ + uv.getY(i) * (p.maxZ - p.minZ)) / 9);
    g.translate((p.minX + p.maxX) / 2, p.level + PAN.water, (p.minZ + p.maxZ) / 2);
    return g;
  });
  const g = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return g;
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

export { ROOF_T };
