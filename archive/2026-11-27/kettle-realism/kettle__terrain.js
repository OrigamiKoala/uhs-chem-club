/**
 * kettle/terrain.js — The ground of the works, as one height field.
 *
 * The walk, the landing solver and every Node check stand on EXACTLY the ground that is drawn, because everything is
 * sampled from the same `height(x, z)` the game calls.
 *
 * ONE FUNCTION, TWO KINDS OF GROUND.
 *   inside a room   the room's own floor (`works-plan.js`): flat, or graded up or down a ramp. The charge bank is
 *                   3.2 m over the works floor and the sump cellar 2.4 m under it, and both are simply the height here.
 *   outside         the soda flat: a hand's depth of low swell, dead flat round the works, the pad and the spawn;
 *                   the slag tip and the ore stock rising out of it; and, past the walk, a ring of low mesas.
 * There is never a second floor: a room's roof is a body, not ground.
 *
 * THE MESH is the outside only. It is one grid to the horizon (two-metre cells across the walk, growing to a 900 m
 * disc) with the cells under every room left out, exactly, because every room stands on the 2 m grid; the rooms'
 * floors are drawn by `works.js` from the same function. Its colour (white crust, buff dust, the grey of slag, the
 * red-brown of ore, the worn way from the pad to the charge door) is painted into its vertices once.
 */

import * as THREE from 'three';
import { fbm2, buildRibbon, buildDisc } from '../ember/terrain.js';
import { hillDepth, hillHeight } from './works-plan.js';

export { buildRibbon, buildDisc };

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const rectDist = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));

export function makeKettleField(data, plan) {
  const pad = data.landmarks.find(l => l.asset === 'landing-pad');
  const PAD_TOP = 0.12;
  const PAD_R = 9.4;
  // Dead flat: round the works (and the furnace behind it), the pad, the spawn and the way between them.
  const b = plan.bounds;
  const worksFlat = { minX: b.minX - 4, maxX: b.maxX + 4, minZ: b.minZ - 30, maxZ: b.maxZ + 6 };
  const discs = [{ x: data.spawn.pos[0], z: data.spawn.pos[2], r: 8, blend: 10 }];
  if (pad) discs.push({ x: pad.pos[0], z: pad.pos[2], r: 13, blend: 8 });

  /** The flat's own swell, the heaps on it, and the mesas far off. */
  const outside = (x, z) => {
    let k = smooth(0, 12, rectDist(x, z, worksFlat));
    for (const f of discs) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r + f.blend) k = Math.min(k, smooth(f.r, f.r + f.blend, d));
    }
    let y = ((fbm2(x * 0.02, z * 0.02, 11, 3) - 0.5) * 0.5 + (fbm2(x * 0.09, z * 0.09, 23, 2) - 0.5) * 0.16) * k;
    for (const hill of plan.hills) {
      const h = hillHeight(hill, x, z);
      if (h > 0) {
        // Tipped stuff lies in rills down the slope and in humps along the crest.
        const rill = (fbm2(x * 0.16, z * 0.16, hill.kind === 'ore' ? 57 : 53, 3) - 0.5) * 1.6;
        const hump = hill.kind === 'ore' ? Math.max(0, fbm2(x * 0.045, z * 0.045, 61, 2) - 0.35) * 5 : (fbm2(x * 0.05, z * 0.05, 59, 2) - 0.5) * 1.4;
        y += h + (rill + hump) * (h / hill.H);
      }
    }
    const d = Math.hypot(x, z);
    const p = smooth(190, 330, d);
    if (p > 0) {
      const az = Math.atan2(x, z);
      const H = 10 + 34 * fbm2(az * 1.8 + 5, 2.3, 41, 3);
      const wall = H * Math.pow(p, 1.2);
      const step = 6;
      y += wall * 0.6 + (Math.floor(wall / step) * step + smooth(0.5, 1, (wall / step) % 1) * step) * 0.4;
    }
    if (pad) {
      const dp = Math.hypot(x - pad.pos[0], z - pad.pos[2]);
      if (dp < PAD_R + 0.6) y = PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, dp));
    }
    return y;
  };

  const height = (x, z) => {
    const f = plan.floorAt(x, z);
    return f === null ? outside(x, z) : f;
  };

  return { height, outside, PAD_TOP, PAD_R };
}

function axisLines(core = 126, step = 2, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.2; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

const C = {
  crust: [0.9, 0.88, 0.82], buff: [0.8, 0.7, 0.52], damp: [0.66, 0.63, 0.57], grey: [0.46, 0.44, 0.42], far: [0.74, 0.62, 0.46],
  slag: [0.2, 0.19, 0.185], slagPale: [0.36, 0.34, 0.32], ore: [0.42, 0.22, 0.15], oreDark: [0.27, 0.17, 0.14], soot: [0.5, 0.47, 0.43]
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The ground's colour at a point. */
function groundTint(x, z, data, plan) {
  let c = C.crust;
  c = mix3(c, C.damp, Math.max(0, fbm2(x * 0.05, z * 0.05, 71, 3) - 0.55) * 2.2);
  // Dust and soot settle round the works, thickest against its walls.
  const b = plan.bounds;
  const near = rectDist(x, z, b);
  c = mix3(c, C.buff, Math.max(0, 1 - near / 60) * 0.5 + Math.max(0, fbm2(x * 0.03, z * 0.03, 73, 2) - 0.5) * 0.5);
  c = mix3(c, C.soot, Math.max(0, 1 - near / 14) * 0.55);
  c = mix3(c, C.far, smooth(150, 380, Math.hypot(x, z)) * 0.8);
  // The way people and wheels take: the pad to the spawn's ground, and that to the charge door.
  for (const road of data.roads || []) {
    for (let i = 0; i < road.pts.length - 1; i++) {
      const [ax, az] = road.pts[i], [bx, bz] = road.pts[i + 1];
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
      const d = Math.hypot(x - (ax + (bx - ax) * t), z - (az + (bz - az) * t));
      c = mix3(c, C.grey, Math.max(0, 1 - d / (road.width * 0.9)) * 0.6);
    }
  }
  for (const hill of plan.hills) {
    const d = hillDepth(hill, x, z);
    if (d < -6) continue;
    // The heap's own stuff, and what has rolled and washed off its foot onto the crust.
    const k = smooth(-6, 1.5, d);
    const n = fbm2(x * 0.12, z * 0.12, 81, 3);
    const body = hill.kind === 'ore' ? mix3(C.ore, C.oreDark, n) : mix3(C.slag, C.slagPale, Math.max(0, n - 0.45) * 2.2);
    c = mix3(c, body, k);
  }
  return c;
}

export function buildKettleTerrainGeometry(field, data, plan) {
  const axis = axisLines();
  const n = axis.length;
  const positions = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const colors = new Float32Array(n * n * 3);
  const TILE = 9;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = axis[i], z = axis[j], k = j * n + i;
      // A vertex on a room's own plane is the YARD's corner of that cell, so it takes the yard's height, never the floor's.
      positions.set([x, field.outside(x, z), z], k * 3);
      uvs.set([x / TILE, z / TILE], k * 2);
      colors.set(groundTint(x, z, data, plan), k * 3);
    }
  }
  const rooms = plan.volumes.map(v => v.rect);
  const index = [];
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const cx = (axis[i] + axis[i + 1]) / 2, cz = (axis[j] + axis[j + 1]) / 2;
      if (rooms.some(r => cx > r.minX && cx < r.maxX && cz > r.minZ && cz < r.maxZ)) continue;   // a room's floor is the works' own
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uvs.slice(), 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(index), 1));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}
