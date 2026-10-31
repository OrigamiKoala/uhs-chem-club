/**
 * kettle/terrain.js — The soda flat, as one height field.
 *
 * The walk, the landing solver and every Node check stand on EXACTLY the ground that is drawn, because the
 * mesh is sampled from the same `height(x, z)` the game calls. The flat is a hand's depth of low swell, dead
 * flat under every host and its lane, the pad, the spawn, the boss's ground and every heavy machine; past
 * the walk it lifts, at last, into a ring of low mesas so the horizon is not a ruled line.
 *
 * ONE GRID TO THE HORIZON: two-metre cells across the walk, growing to a 900 m disc, in one mesh. The
 * colour of the ground (white crust, buff where dust has settled, grey where the works' wheels run) is
 * painted into its vertices once from the same layout. Roads and the boss's plaza are Ember Reach's own
 * generic ribbon and disc builders: they only ask a field for `height`.
 */

import * as THREE from 'three';
import { fbm2, buildRibbon, buildDisc } from '../ember/terrain.js';

export { buildRibbon, buildDisc };

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

/** Landmarks that are heavy plant and want level ground under them. */
const LEVEL_UNDER = new Set(['furnace', 'chimney', 'silo', 'tank', 'conveyor', 'ingot-stack', 'crate-stack']);

export function makeKettleField(data) {
  // Every host's footprint and lane (the generator writes each site's `flat`), the pad, the spawn, the boss's ground and the plant.
  const flat = data.sites.map(s => ({ x: s.flat.x, z: s.flat.z, r: s.flat.r, blend: 6 }));
  const pad = data.landmarks.find(l => l.asset === 'landing-pad');
  if (pad) flat.push({ x: pad.pos[0], z: pad.pos[2], r: 12, blend: 8 });
  flat.push({ x: data.spawn.pos[0], z: data.spawn.pos[2], r: 6, blend: 10 });
  flat.push({ x: data.arena.boss[0], z: data.arena.boss[2], r: 13, blend: 8 });
  flat.push({ x: data.arena.player[0], z: data.arena.player[2], r: 6, blend: 8 });
  for (const l of data.landmarks) if (LEVEL_UNDER.has(l.asset)) flat.push({ x: l.pos[0], z: l.pos[2], r: l.radius + 1.2, blend: 5 });

  const PAD_TOP = 0.12;
  const PAD_R = 9.4;

  const raw = (x, z) => {
    const d = Math.hypot(x, z);
    // A low swell, and the blisters the damp pushed up.
    let y = (fbm2(x * 0.02, z * 0.02, 11, 3) - 0.5) * 0.5 + (fbm2(x * 0.09, z * 0.09, 23, 2) - 0.5) * 0.16;
    // The mesas stand well off, in a broken ring, with a stepped face.
    const az = Math.atan2(x, z);
    const H = 10 + 34 * fbm2(az * 1.8 + 5, 2.3, 41, 3);
    const p = smooth(190, 330, d);
    if (p > 0) {
      const wall = H * Math.pow(p, 1.2);
      const step = 6;
      y += wall * 0.6 + (Math.floor(wall / step) * step + smooth(0.5, 1, (wall / step) % 1) * step) * 0.4;
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
    if (pad) {
      const d = Math.hypot(x - pad.pos[0], z - pad.pos[2]);
      if (d < PAD_R + 0.6) y = PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  };

  return { height, raw, PAD_TOP, PAD_R };
}

function axisLines(core = 126, step = 2, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.2; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

const C = { crust: [0.9, 0.88, 0.82], buff: [0.8, 0.7, 0.52], damp: [0.66, 0.63, 0.57], grey: [0.5, 0.48, 0.45], far: [0.74, 0.62, 0.46] };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The ground's colour at a point: white crust, buff dust that thickens toward the works, damp patches, warm rock far off. */
function groundTint(x, z, data) {
  let c = C.crust;
  c = mix3(c, C.damp, Math.max(0, fbm2(x * 0.05, z * 0.05, 71, 3) - 0.55) * 2.2);
  let near = Infinity;
  for (const s of data.sites) near = Math.min(near, Math.hypot(x - s.pos[0], z - s.pos[2]));
  c = mix3(c, C.buff, Math.max(0, 1 - near / 34) * 0.55 + Math.max(0, fbm2(x * 0.03, z * 0.03, 73, 2) - 0.5) * 0.5);
  const d = Math.hypot(x, z);
  c = mix3(c, C.far, smooth(150, 380, d) * 0.8);
  c = mix3(c, C.grey, Math.max(0, 1 - Math.abs(x) / 5) * (z > -50 ? 0.12 : 0));
  return c;
}

export function buildKettleTerrainGeometry(field, data) {
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
      colors.set(groundTint(x, z, data), k * 3);
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
