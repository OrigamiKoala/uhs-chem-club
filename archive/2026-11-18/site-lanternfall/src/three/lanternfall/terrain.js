/**
 * lanternfall/terrain.js — The ice, as one analytic height field and one grid.
 *
 * The walk, the landing solver and every Node check stand on EXACTLY the ground
 * that is drawn, because the mesh is sampled from the same `height(x, z)` the
 * game calls. The field is gentle where the player lives (a few decimetres of
 * rolling packed ice, dead flat under each host, the pad and the frozen lake)
 * and rises into long ice hills past the walk, so the horizon is a country and
 * not a plate.
 *
 * ONE GRID TO THE HORIZON. Two-metre cells across the walked square, growing
 * geometrically to an 880 m disc, in one mesh: there is no backdrop seam
 * because there is no second mesh. The lake is the one thing laid over it.
 */

import * as THREE from 'three';

function hash2(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in 2D, 0..1. */
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z, seed, oct = 3) {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += vnoise(x * f, z * f, seed + i * 31) * amp; f *= 2.03; amp *= 0.5; }
  return s;
}

const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/**
 * @param {{sites: object[], landmarks: object[], lake: {x:number,z:number,radius:number}}} data
 */
export function makeLanternfallField(data) {
  // Places that must be level: every host (the layout generator writes each site's `flat`: a disc
  // that holds the host's machinery and the ground in front of its plate), the pad and the lake.
  const flat = data.sites.map(s => (s.flat
    ? { x: s.flat.x, z: s.flat.z, r: s.flat.r, blend: 7 }
    : { x: s.pos[0], z: s.pos[2], r: 7.5, blend: 7 }));
  const pad = data.landmarks.find(l => l.asset === 'landing-pad');
  if (pad) flat.push({ x: pad.pos[0], z: pad.pos[2], r: 11.5, blend: 9 });
  flat.push({ x: data.lake.x, z: data.lake.z, r: data.lake.radius + 4, blend: 14 });
  // The way in from the spawn is left level too, so nobody walks the first hundred metres uphill.
  flat.push({ x: data.spawn.pos[0], z: data.spawn.pos[2], r: 6, blend: 12 });

  const PAD_TOP = 0.2;
  const PAD_R = 7.9;

  /** The ground with no flat places cut into it. */
  const raw = (x, z) => {
    // Rolling packed ice across the walk: low, slow, and never more than a few decimetres.
    const roll = (fbm(x * 0.028, z * 0.028, 11, 3) - 0.5) * 1.1;
    // Sastrugi ridges, long and low, combed along the wind.
    const comb = (vnoise(x * 0.07 + z * 0.012, z * 0.34, 23) - 0.5) * 0.16;
    // Past the walk, long hills of ice that climb toward the horizon.
    const d = Math.hypot(x, z);
    const far = smooth(105, 300, d);
    const hills = far * (5 + 20 * fbm(x * 0.006, z * 0.006, 41, 3)) * (0.6 + 0.6 * far);
    return roll + comb + hills;
  };

  const height = (x, z) => {
    let k = 1;
    for (const f of flat) {
      const d = Math.hypot(x - f.x, z - f.z);
      k = Math.min(k, smooth(f.r, f.r + f.blend, d));
    }
    let y = raw(x, z) * k;
    // The deck of the landing pad stands a hand above the ice, bevelled down to it.
    if (pad) {
      const d = Math.hypot(x - pad.pos[0], z - pad.pos[2]);
      if (d < PAD_R + 0.6) y = PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  };

  return { height, raw, PAD_TOP, PAD_R };
}

/** The grid lines: two-metre cells across the walk, then growing to the horizon. */
function axisLines(core = 124, step = 2, reach = 880) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.22; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

export function buildLanternfallTerrainGeometry(field) {
  const axis = axisLines();
  const n = axis.length;
  const positions = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const colors = new Float32Array(n * n * 3);
  const TILE = 14;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = axis[i], z = axis[j];
      const k = j * n + i;
      positions[k * 3] = x;
      positions[k * 3 + 1] = field.height(x, z);
      positions[k * 3 + 2] = z;
      uvs[k * 2] = x / TILE;
      uvs[k * 2 + 1] = z / TILE;
      // A very slow tint across the ice, so no stretch of it reads as one tile.
      const t = fbm(x * 0.01, z * 0.01, 77, 3);
      colors[k * 3] = 0.9 + 0.1 * t;
      colors[k * 3 + 1] = 0.94 + 0.06 * t;
      colors[k * 3 + 2] = 0.98;
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

/** The frozen lake: a disc laid a finger above the ice, with its own glossy material. */
export function buildLakeGeometry(lake, segments = 72) {
  const geo = new THREE.CircleGeometry(lake.radius, segments);
  geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 9, pos.getZ(i) / 9);
  geo.setAttribute('uv1', uv.clone());
  return geo;
}
