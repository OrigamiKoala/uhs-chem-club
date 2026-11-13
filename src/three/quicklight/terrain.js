/**
 * quicklight/terrain.js — The storm-belt basalt plain, as one height field.
 *
 * The walk, the landing solver, and every Node check stand on EXACTLY the ground that is drawn,
 * because the mesh is sampled from the same `height(x, z)` the game calls.
 *
 * Level pads under every site, spawn, the landing pad, the boss plaza, and heavy cracking towers/tanks,
 * with low basalt swells across the yard and a dark ridge ring at the horizon.
 */

import * as THREE from 'three';
import { fbm2, buildRibbon, buildDisc } from '../ember/terrain.js';

export { buildRibbon, buildDisc };

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

const LEVEL_UNDER = new Set(['cracking-tower', 'storage-tank', 'manifold-rack', 'storm-pylon']);

export function makeQuicklightField(data) {
  const flat = data.sites.map(s => ({ x: s.flat.x, z: s.flat.z, r: s.flat.r, blend: 6 }));
  const pad = data.landmarks.find(l => l.asset === 'landing-pad') || (data.pad ? { pos: data.pad.pos } : null);
  if (pad) flat.push({ x: pad.pos[0], z: pad.pos[2], r: 12, blend: 8 });
  const sp = Array.isArray(data.spawn) ? data.spawn : data.spawn.pos;
  flat.push({ x: sp[0], z: sp[2], r: 6, blend: 10 });
  flat.push({ x: data.arena.boss[0], z: data.arena.boss[2], r: 15, blend: 8 });
  flat.push({ x: data.arena.player[0], z: data.arena.player[2], r: 7, blend: 8 });
  for (const l of data.landmarks) {
    if (LEVEL_UNDER.has(l.asset)) flat.push({ x: l.pos[0], z: l.pos[2], r: (l.radius || 3) + 1.5, blend: 4 });
  }

  const PAD_TOP = 0.12;
  const PAD_R = 9.4;

  const raw = (x, z) => {
    const d = Math.hypot(x, z);
    let y = (fbm2(x * 0.022, z * 0.022, 19, 3) - 0.5) * 0.22 + (fbm2(x * 0.1, z * 0.1, 37, 2) - 0.5) * 0.07;
    const p = smooth(235, 430, d);
    if (p > 0) y += (7 + 18 * fbm2(Math.atan2(x, z) * 1.8 + 3, 2.7, 53, 3)) * Math.pow(p, 1.35);
    return y;
  };

  const height = (x, z) => {
    let k = 1;
    for (const f of flat) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r + f.blend) k = Math.min(k, smooth(f.r, f.r + f.blend, d));
    }
    let y = raw(x, z) * k;
    if (pad) {
      const d = Math.hypot(x - pad.pos[0], z - pad.pos[2]);
      if (d < PAD_R + 0.6) y = PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  };

  return { height, raw, PAD_TOP, PAD_R };
}

function axisLines(core = 112, step = 1, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = 2;
  while (v < reach) { s *= 1.2; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

const C = {
  basalt: [0.42, 0.44, 0.48],
  ash: [0.33, 0.35, 0.39],
  crust: [0.54, 0.56, 0.6],
  far: [0.38, 0.4, 0.45],
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function groundTint(x, z) {
  let c = C.basalt;
  c = mix3(c, C.ash, Math.max(0, fbm2(x * 0.045, z * 0.045, 67, 3) - 0.45) * 1.9);
  c = mix3(c, C.crust, Math.max(0, fbm2(x * 0.16, z * 0.16, 89, 2) - 0.58) * 1.4);
  const d = Math.hypot(x, z);
  c = mix3(c, C.far, smooth(170, 400, d) * 0.72);
  return c;
}

export function buildQuicklightTerrainGeometry(field, data) {
  void data;
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
      colors.set(groundTint(x, z), k * 3);
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
