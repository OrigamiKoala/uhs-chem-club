/**
 * lodestone/terrain.js — Lodestone's iron canyon, as one height field.
 *
 * The walk, the landing solver and every Node check stand on exactly the ground that is drawn, because the mesh is sampled from the same
 * `height(x, z)` the game calls. The floor is a gently undulating gravel bed between two wall feet at |x| = CANYON.wallX; past them the
 * walls climb steeply to a broken rim, and beyond the canyon's two ends the ground rises the same way, so the horizon is rock on every side.
 * Level pads lie under every site, the spawn, the landing pad and the Coil's bowl.
 */

import * as THREE from 'three';
import { fbm2, buildRibbon, buildDisc } from '../ember/terrain.js';
import { CANYON } from './host-plan.js';

export { buildRibbon, buildDisc };

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const LEVEL_UNDER = new Set(['drum-stack', 'ore-heap', 'lode-boulder', 'coil-mast']);

export function makeLodestoneField(data) {
  const flat = data.sites.map(s => ({ x: s.flat.x, z: s.flat.z, r: s.flat.r, blend: 6 }));
  const pad = data.pad ? { pos: data.pad.pos } : null;
  if (pad) flat.push({ x: pad.pos[0], z: pad.pos[2], r: 12, blend: 6 });
  const sp = Array.isArray(data.spawn) ? data.spawn : data.spawn.pos;
  flat.push({ x: sp[0], z: sp[2], r: 6, blend: 8 });
  flat.push({ x: data.arena.boss[0], z: data.arena.boss[2], r: 15, blend: 8 });
  flat.push({ x: data.arena.player[0], z: data.arena.player[2], r: 7, blend: 8 });
  for (const l of data.landmarks) if (LEVEL_UNDER.has(l.asset)) flat.push({ x: l.pos[0], z: l.pos[2], r: (l.radius || 2) + 1.2, blend: 3 });

  const PAD_TOP = 0.12;
  const PAD_R = 9.4;

  /** How far past the canyon's walls a point is (0 on the floor). */
  const outside = (x, z) => Math.max(0, Math.abs(x) - CANYON.wallX, z - CANYON.north, CANYON.south - z);

  const raw = (x, z) => {
    let y = (fbm2(x * 0.03, z * 0.03, 23, 3) - 0.5) * 0.35 + (fbm2(x * 0.12, z * 0.12, 41, 2) - 0.5) * 0.08;
    const o = outside(x, z);
    if (o > 0) {
      // The wall: a steep climb in the first 14 m, broken ledges, and a rim that wanders between 28 and 46 m up.
      const rim = 28 + 18 * fbm2(z * 0.02 + x * 0.004, 4.1, 59, 3);
      y += rim * smooth(0, 14, o) + 6 * (fbm2(x * 0.08, z * 0.08, 71, 3) - 0.3) * smooth(2, 10, o) + o * 0.08;
    }
    return y;
  };

  const height = (x, z) => {
    let k = 1;
    for (const f of flat) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r + f.blend) k = Math.min(k, smooth(f.r, f.r + f.blend, d));
    }
    const o = outside(x, z);
    let y = o > 0 ? raw(x, z) : raw(x, z) * k;
    if (pad) {
      const d = Math.hypot(x - pad.pos[0], z - pad.pos[2]);
      if (d < PAD_R + 0.6) y = PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  };

  return { height, raw, PAD_TOP, PAD_R, outside };
}

function axisLines(core = 112, step = 1, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = 2;
  while (v < reach) { s *= 1.2; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

const TINT = {
  gravel: [0.46, 0.36, 0.3],
  rust: [0.55, 0.33, 0.22],
  iron: [0.25, 0.23, 0.24],
  wall: [0.42, 0.28, 0.22],
  far: [0.36, 0.26, 0.22]
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function groundTint(field, x, z) {
  let c = TINT.gravel;
  c = mix3(c, TINT.rust, Math.max(0, fbm2(x * 0.05, z * 0.05, 67, 3) - 0.45) * 1.8);
  c = mix3(c, TINT.iron, Math.max(0, fbm2(x * 0.18, z * 0.18, 89, 2) - 0.6) * 1.6);
  const o = field.outside(x, z);
  if (o > 0) c = mix3(c, mix3(TINT.wall, TINT.iron, Math.max(0, fbm2(x * 0.05, z * 0.2 + 3, 97, 3) - 0.5) * 1.4), smooth(0, 6, o));
  c = mix3(c, TINT.far, smooth(150, 400, Math.hypot(x, z)) * 0.6);
  return c;
}

export function buildLodestoneTerrainGeometry(field) {
  const axis = axisLines();
  const n = axis.length;
  const positions = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const colors = new Float32Array(n * n * 3);
  const TILE = 9;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = axis[i], z = axis[j], k = j * n + i;
      positions.set([x, field.height(x, z), z], k * 3);
      uvs.set([x / TILE, z / TILE], k * 2);
      colors.set(groundTint(field, x, z), k * 3);
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

/** The colliders that stand along the wall feet and across the canyon's ends, so nobody walks up the rock. */
export function wallColliders(step = 1.2) {
  const out = [];
  const x = CANYON.wallX - 1; const n0 = CANYON.south + 1; const n1 = CANYON.north - 1;
  for (let z = n0; z <= n1; z += step) { out.push({ x: -x, z, radius: 0.8 }); out.push({ x, z, radius: 0.8 }); }
  for (let xx = -x; xx <= x; xx += step) { out.push({ x: xx, z: n0, radius: 0.8 }); out.push({ x: xx, z: n1, radius: 0.8 }); }
  return out;
}
