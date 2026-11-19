/**
 * mirrowen/terrain.js — The tidal shelf, its canals and the sea round it, as one height field.
 *
 * The walk, the landing solver and every Node check stand on EXACTLY the ground that is drawn,
 * because the mesh is sampled from the same `height(x, z)` the game calls. Four places live in the
 * one function:
 *
 *   THE SHELF. Where the player walks: a few decimetres of rolling shingle, dead flat under every
 *   bench, the pad, the plant buildings and the boss's ground.
 *
 *   THE WATER. A round basin at the middle of the shelf and, running north out of it, a canal
 *   sixteen metres across. Both are one signed distance (`waterSD`, negative over open water): the
 *   bed falls away from the quay in a metre and a half, so nobody walks into it, and a ring of
 *   colliders (the world builds it from the same function) keeps them out.
 *
 *   THE SEA. Past the shelf's edge the ground falls to a sea bed three metres down, and the sea
 *   lies over it as a ring that begins out of the walk's reach.
 *
 *   THE ICE. Far beyond the sea, the ground lifts into walls of ice, stepped where the sheets that
 *   built them lie on one another, so the horizon is never bare and there is no edge to fall off.
 *
 * ONE GRID TO THE HORIZON, as Ember Reach: two-metre cells across the walk, growing geometrically
 * to a 900 m disc, in one mesh. The colour of the ground is painted into its vertices once, from the
 * same layout the props were placed by.
 */

import * as THREE from 'three';
import { fbm2, buildRibbon, buildDisc } from '../ember/terrain.js';

export { buildRibbon, buildDisc };

const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const clamp01 = v => Math.max(0, Math.min(1, v));

function hash2(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/** Distance from (x, z) to the segment a-b (each [x, z]). */
function distSeg(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
}

/** Landmarks that are buildings or plant, and want level ground under them. */
const LEVEL_UNDER = new Set(['shed', 'gantry-crane', 'harbour-light']);

/**
 * @param {object} data the world JSON
 */
export function makeMirrowenField(data) {
  const W = data.water;
  const B = W.basin;
  const C = W.channel;
  const LEVEL = W.level;
  const SHORE = data.shore ?? 148;
  const segA = [C.ax, C.az], segB = [C.bx, C.bz];

  // Places that must be level: every bench, the pad, the spawn, the boss's ground, and the plant.
  const flat = data.sites.map(s => (s.flat ? { x: s.flat.x, z: s.flat.z, r: s.flat.r, blend: 6 } : { x: s.pos[0], z: s.pos[2], r: 7.5, blend: 6 }));
  const pad = data.landmarks.find(l => l.asset === 'landing-pad');
  if (pad) flat.push({ x: pad.pos[0], z: pad.pos[2], r: 12, blend: 8 });
  flat.push({ x: data.spawn.pos[0], z: data.spawn.pos[2], r: 6, blend: 10 });
  if (data.arena) {
    flat.push({ x: data.arena.boss[0], z: data.arena.boss[2], r: 13, blend: 8 });
    flat.push({ x: data.arena.player[0], z: data.arena.player[2], r: 6, blend: 8 });
  }
  for (const l of data.landmarks) {
    if (LEVEL_UNDER.has(l.asset)) flat.push({ x: l.pos[0], z: l.pos[2], r: l.radius + 1.2, blend: 5 });
  }

  const PAD_TOP = 0.12;
  const PAD_R = 9.4;

  /** Signed distance to open water: negative over it, in metres. The union of the basin and the canal. */
  const waterSD = (x, z) => Math.min(Math.hypot(x - B.x, z - B.z) - B.radius, distSeg(x, z, segA, segB) - C.half);
  /** True over open water, frozen or not. */
  const inWater = (x, z) => waterSD(x, z) < 0;
  /** True over the stretch the Fifth froze. */
  const frozen = (x, z) => z < W.frozenZ && waterSD(x, z) < 0.35;

  /** The shelf and the ice, with no flat places cut into it. */
  const raw = (x, z) => {
    const roll = (fbm2(x * 0.02, z * 0.02, 11, 3) - 0.5) * 0.6;
    const hum = (vnoise(x * 0.09, z * 0.09, 23) - 0.5) * 0.16;
    const d = Math.hypot(x, z);
    let y = 0.12 + roll + hum;
    // The shelf ends in the sea.
    y -= 3.4 * smooth(SHORE, SHORE + 24, d);
    // Far beyond it, walls of ice rise out of the water on every side.
    const az = Math.atan2(x, z);
    const start = 330 + 60 * fbm2(az * 1.4 + 7, 1.3, 41, 2);
    const H = 34 + 74 * fbm2(az * 2.3 + 3, 4.7, 43, 3);
    const p = smooth(start, start + 260, d);
    if (p > 0) {
      let wall = H * Math.pow(p, 1.25);
      const step = 17;
      const stepped = Math.floor(wall / step) * step + smooth(0.55, 1, (wall / step) % 1) * step;
      wall = wall * 0.6 + stepped * 0.4;
      wall += (1 - Math.abs(fbm2(x * 0.016, z * 0.016, 47, 4) * 2 - 1) - 0.5) * 30 * p;
      y += wall;
    }
    return y;
  };

  const height = (x, z) => {
    let k = 1;
    for (const f of flat) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r + f.blend) k = Math.min(k, smooth(f.r, f.r + f.blend, d));
    }
    let y = raw(x, z) * k;

    // The water: the bed falls away from the quay, and the bank leaves no ledge (a metre and a half
    // from the waterline to the full depth), a hand above the water at its lip.
    const sd = waterSD(x, z);
    if (sd < 1.3) {
      const t = clamp01(-sd / 6);
      const bed = LEVEL - 0.07 - 1.25 * t * (2 - t);
      const land = Math.max(y, 0.06);
      y = bed + (land - bed) * smooth(-0.4, 1.2, sd);
    }

    // The pad stands a hand above the shelf, bevelled down to it.
    if (pad) {
      const d = Math.hypot(x - pad.pos[0], z - pad.pos[2]);
      if (d < PAD_R + 0.6) y = PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  };

  return { height, raw, waterSD, inWater, frozen, LEVEL, PAD_TOP, PAD_R };
}

/* ------------------------------------------------------------ the grid */

/** The grid lines: two-metre cells across the walk, then growing to the horizon. */
function axisLines(core = 126, step = 2, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.2; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

/* ---- the ground's colour ---- */

const C = {
  frost: [1.0, 1.0, 1.0],
  rime: [1.1, 1.13, 1.16],
  wet: [0.76, 0.8, 0.82],
  apron: [0.7, 0.73, 0.75],
  shoreWet: [0.5, 0.58, 0.6],
  seaBed: [0.36, 0.46, 0.48],
  iceA: [1.04, 1.1, 1.16],
  iceB: [0.76, 0.9, 1.02],
  iceC: [0.9, 0.97, 1.05],
  rock: [0.42, 0.47, 0.5]
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The colour a stretch of ground has, as a multiplier on the shingle's albedo. `slope` is 1 - normal.y. */
function groundTint(x, z, y, slope, field, data, marks) {
  let c = C.frost;
  const sd = field.waterSD(x, z);

  // The quay: wet and dark along the water's edge, paling over ten metres.
  c = mix3(c, C.wet, (1 - smooth(1.5, 11, sd)) * 0.7);

  // The aprons the hosts stand on and the ground the plant is levelled for.
  for (const mk of marks) {
    const d = Math.hypot(x - mk.x, z - mk.z);
    if (d > mk.r) continue;
    const t = 1 - smooth(mk.r * 0.7, mk.r, d + (vnoise(x * 0.5, z * 0.5, 73) - 0.5) * mk.r * 0.25);
    c = mix3(c, mk.c, t * mk.k);
  }

  // Frost lies in the lows and on the north side of everything.
  const frost = fbm2(x * 0.045, z * 0.045, 79, 3);
  c = mix3(c, C.rime, clamp01(frost - 0.5) * 1.6);

  // Round the frozen canal the ground is white: rime thrown off the ice.
  const fz = data.water.frozenZ;
  if (z < fz + 24) {
    const dd = Math.max(0, field.waterSD(x, Math.min(z, fz - 1)));
    c = mix3(c, C.iceA, (1 - smooth(2, 30, dd)) * smooth(fz + 24, fz - 6, z) * 0.85);
  }

  // The shore, the sea bed and the walls of ice.
  const d = Math.hypot(x, z);
  const shore = data.shore ?? 148;
  c = mix3(c, C.shoreWet, smooth(shore - 10, shore + 4, d) * 0.85);
  c = mix3(c, C.seaBed, smooth(shore + 4, shore + 26, d));
  if (d > 300) {
    const band = Math.sin(y * 0.24 + fbm2(x * 0.01, z * 0.01, 89, 2) * 5) * 0.5 + 0.5;
    let w = mix3(C.iceB, C.iceA, band);
    w = mix3(w, C.iceC, Math.max(0, fbm2(x * 0.02, z * 0.02, 97, 3) - 0.55) * 2);
    w = mix3(w, C.rock, smooth(0.38, 0.72, slope) * 0.8);
    c = mix3(c, w, smooth(300, 380, d) * smooth(-2, 3, y));
  }
  // Any steep face anywhere is bare rock.
  c = mix3(c, C.rock, smooth(0.45, 0.78, slope) * 0.7);
  return c;
}

/** Where the layout paints the ground: the host aprons, the pad, the boss's ground. */
function marksFor(data) {
  const out = [];
  for (const s of data.sites) if (s.flat) out.push({ x: s.flat.x, z: s.flat.z, r: s.flat.r + 4, c: C.apron, k: 0.8 });
  for (const l of data.landmarks) {
    const s = l.scale || 1;
    if (l.asset === 'shed') out.push({ x: l.pos[0], z: l.pos[2], r: 9 * s, c: C.apron, k: 0.7 });
    else if (l.asset === 'gantry-crane') out.push({ x: l.pos[0], z: l.pos[2], r: 9, c: C.apron, k: 0.7 });
    else if (l.asset === 'harbour-light') out.push({ x: l.pos[0], z: l.pos[2], r: 5, c: C.apron, k: 0.7 });
  }
  if (data.arena) out.push({ x: data.arena.boss[0], z: data.arena.boss[2], r: 14, c: C.apron, k: 0.75 });
  return out;
}

export function buildMirrowenTerrainGeometry(field, data) {
  const axis = axisLines();
  const n = axis.length;
  const positions = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const colors = new Float32Array(n * n * 3);
  const TILE = 9;
  const marks = marksFor(data);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = axis[i], z = axis[j];
      const k = j * n + i;
      const y = field.height(x, z);
      positions[k * 3] = x;
      positions[k * 3 + 1] = y;
      positions[k * 3 + 2] = z;
      uvs[k * 2] = x / TILE;
      uvs[k * 2 + 1] = z / TILE;
      // The slope from the field itself, over a metre, so the colour does not depend on the cell size.
      const e = Math.max(1, Math.min(8, Math.abs(axis[Math.min(n - 1, i + 1)] - x)));
      const gx = (field.height(x + e, z) - field.height(x - e, z)) / (2 * e);
      const gz = (field.height(x, z + e) - field.height(x, z - e)) / (2 * e);
      const slope = 1 - 1 / Math.sqrt(1 + gx * gx + gz * gz);
      const c = groundTint(x, z, y, slope, field, data, marks);
      colors[k * 3] = c[0];
      colors[k * 3 + 1] = c[1];
      colors[k * 3 + 2] = c[2];
    }
  }
  const index = new Uint32Array((n - 1) * (n - 1) * 6);
  let p = 0;
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      index[p++] = a; index[p++] = c; index[p++] = b;
      index[p++] = b; index[p++] = c; index[p++] = d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uvs.slice(), 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/* ------------------------------------------------------------ the water */

const SHALLOW = [0.43, 0.56, 0.55], MIDDLE = [0.2, 0.34, 0.37], DEEP = [0.1, 0.2, 0.25];
const waterTint = t => (t < 0.5 ? mix3(SHALLOW, MIDDLE, t / 0.5) : mix3(MIDDLE, DEEP, (t - 0.5) / 0.5));
const ICE_THIN = [0.84, 0.92, 0.96], ICE_THICK = [0.94, 0.97, 0.99], ICE_BLUE = [0.62, 0.78, 0.9];

/**
 * The open water: a grid of half-metre cells over the basin and the canal, kept where any corner
 * is within a hand of the waterline (the lip of the bank lies over the rest), coloured by depth:
 * grey-green over the shallows, slate toward the middle. `part` is 'open' (the water the player
 * sees move) or 'ice' (the stretch the Fifth froze, which has the same cells and its own colours).
 */
export function buildWaterGeometry(field, data, part = 'open') {
  const W = data.water;
  const B = W.basin, C2 = W.channel;
  const x0 = Math.floor(Math.min(B.x - B.radius, C2.ax - C2.half, C2.bx - C2.half)) - 1;
  const x1 = Math.ceil(Math.max(B.x + B.radius, C2.ax + C2.half, C2.bx + C2.half)) + 1;
  const z0 = Math.floor(Math.min(B.z - B.radius, C2.az, C2.bz) - C2.half) - 1;
  const z1 = Math.ceil(B.z + B.radius) + 1;
  const STEP = 0.5;
  const nx = Math.round((x1 - x0) / STEP) + 1, nz = Math.round((z1 - z0) / STEP) + 1;
  const sd = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) sd[j * nx + i] = field.waterSD(x0 + i * STEP, z0 + j * STEP);
  const used = new Int32Array(nx * nz).fill(-1);
  const pos = [], col = [], uv = [], idx = [];
  const vert = (i, j) => {
    const k = j * nx + i;
    if (used[k] >= 0) return used[k];
    const x = x0 + i * STEP, z = z0 + j * STEP;
    used[k] = pos.length / 3;
    pos.push(x, 0, z);
    uv.push(x / 7, z / 7);
    const depth = clamp01(-sd[k] / 6);
    if (part === 'ice') {
      const n1 = fbm2(x * 0.07, z * 0.07, 131, 3);
      let c = mix3(ICE_THIN, ICE_THICK, clamp01(n1 * 1.5 - 0.2));
      c = mix3(c, ICE_BLUE, clamp01(fbm2(x * 0.18, z * 0.18, 137, 2) - 0.55) * 1.8);
      col.push(...c);
    } else {
      col.push(...waterTint(depth));
    }
    return used[k];
  };
  const fz = W.frozenZ;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      if (Math.min(sd[a], sd[a + 1], sd[a + nx], sd[a + nx + 1]) > 0.35) continue;
      const cz = z0 + (j + 0.5) * STEP;
      if (part === 'ice' ? cz > fz + 0.6 : cz < fz) continue;
      const v00 = vert(i, j), v10 = vert(i + 1, j), v01 = vert(i, j + 1), v11 = vert(i + 1, j + 1);
      // Wound for a view from above (x to the right, z toward the viewer).
      idx.push(v00, v01, v10, v10, v01, v11);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** The sea: a ring laid over the sea bed, from beyond the walk's reach to the horizon. */
export function buildSeaGeometry(inner, outer = 900, segments = 128) {
  const geo = new THREE.RingGeometry(inner, outer, segments, 12);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 40, p.getZ(i) / 40);
  geo.setAttribute('uv1', uv.clone());
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}
