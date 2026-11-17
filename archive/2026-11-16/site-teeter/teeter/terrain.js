/**
 * teeter/terrain.js — The salt pans, as one height field.
 *
 * The walk, the landing solver and every Node check stand on EXACTLY the ground that is drawn, because the
 * mesh is sampled from the same `height(x, z)` the game calls. The ground is land (the dikes, the causeway, the
 * heads the hosts stand on) at a hand's depth of swell, with the PANS cut into it: each pan is a rectangle from
 * the world's JSON whose bank slopes two metres down to a floor of salt crust a third of a metre below the land.
 * The player's colliders hold the pan's rectangle (inset by the bank's foot), so the dike tops are the ground
 * that is walked and shallow water is never waded or climbed.
 *
 * ONE GRID TO THE HORIZON: one-metre cells across the walk, growing to a 900 m disc, in one mesh. The colour of
 * the ground (white crust on a pan floor, pale clay on a dike, spray-dried salt on the lip of every bank) is
 * painted into its vertices once from the same layout. Roads and the boss's plaza are Ember Reach's own generic
 * ribbon and disc builders: they only ask a field for `height`.
 */

import * as THREE from 'three';
import { fbm2, buildRibbon, buildDisc } from '../ember/terrain.js';

export { buildRibbon, buildDisc };

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

/** How far a pan's floor lies under the land, how wide its bank is, and where the brine stands. */
export const PAN = { floor: -0.32, bank: 2.0, water: -0.1, rim: 0.7 };

/** Landmarks that are heavy plant and want level ground under them. */
const LEVEL_UNDER = new Set(['salt-house', 'brine-tank', 'tank-farm', 'salt-heap']);

/** How far inside a pan's rectangle (m) a point is, negative outside; the smaller of the four distances to its edges. */
export function insidePan(p, x, z) {
  return Math.min(x - p.minX, p.maxX - x, z - p.minZ, p.maxZ - z);
}

export function makeTeeterField(data) {
  const flat = data.sites.map(s => ({ x: s.flat.x, z: s.flat.z, r: s.flat.r, blend: 5 }));
  const pad = data.landmarks.find(l => l.asset === 'landing-pad');
  if (pad) flat.push({ x: pad.pos[0], z: pad.pos[2], r: 12, blend: 8 });
  flat.push({ x: data.spawn.pos[0], z: data.spawn.pos[2], r: 6, blend: 10 });
  flat.push({ x: data.arena.boss[0], z: data.arena.boss[2], r: 14, blend: 8 });
  flat.push({ x: data.arena.player[0], z: data.arena.player[2], r: 6, blend: 8 });
  for (const l of data.landmarks) if (LEVEL_UNDER.has(l.asset)) flat.push({ x: l.pos[0], z: l.pos[2], r: l.radius + 1.0, blend: 4 });

  const PAD_TOP = 0.12;
  const PAD_R = 9.4;

  const raw = (x, z) => {
    const d = Math.hypot(x, z);
    // The land is almost level: a hand's depth of swell, and a low ring of dunes a long way off.
    let y = (fbm2(x * 0.02, z * 0.02, 11, 3) - 0.5) * 0.16 + (fbm2(x * 0.11, z * 0.11, 23, 2) - 0.5) * 0.06;
    const p = smooth(250, 430, d);
    if (p > 0) y += (5 + 15 * fbm2(Math.atan2(x, z) * 1.6 + 5, 2.3, 41, 3)) * Math.pow(p, 1.3);
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
    // The pans are cut last: a pan is never raised by a flat that happens to lie beside it.
    for (const p of data.pans) {
      const d = insidePan(p, x, z);
      if (d > -0.001) y = y + (PAN.floor - y) * smooth(0, PAN.bank, d);
    }
    return y;
  };

  /** The pan that holds a point (its brine, not its bank), or null. */
  const panAt = (x, z) => data.pans.find(p => insidePan(p, x, z) >= PAN.rim) || null;

  return { height, raw, panAt, PAD_TOP, PAD_R };
}

function axisLines(core = 112, step = 1, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = 2;
  while (v < reach) { s *= 1.2; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

const C = {
  clay: [0.74, 0.71, 0.64], damp: [0.6, 0.58, 0.52], salt: [0.97, 0.96, 0.92], floor: [0.9, 0.89, 0.84],
  floorEdge: [0.78, 0.8, 0.77], far: [0.78, 0.74, 0.64]
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The ground's colour at a point: clay on the dikes, spray salt along every bank, white crust on a floor, warm dust far off. */
function groundTint(x, z, data, field) {
  let c = C.clay;
  c = mix3(c, C.damp, Math.max(0, fbm2(x * 0.05, z * 0.05, 71, 3) - 0.55) * 2.0);
  let into = -Infinity;
  for (const p of data.pans) into = Math.max(into, insidePan(p, x, z));
  // The lip: spray salt dries white for a couple of metres back from the water, and the crust takes over on the bank.
  const lip = 1 - smooth(0, 2.4, -into);
  if (into <= 0) c = mix3(c, C.salt, lip * 0.55 * (0.7 + 0.5 * fbm2(x * 0.4, z * 0.4, 81, 2)));
  else c = mix3(mix3(c, C.salt, 0.5), mix3(C.floorEdge, C.floor, smooth(0.8, 2.4, into)), smooth(0, 1.6, into));
  const d = Math.hypot(x, z);
  c = mix3(c, C.far, smooth(170, 400, d) * 0.7);
  c = mix3(c, C.damp, Math.max(0, 1 - Math.abs(x) / 5) * (z > -34 ? 0.1 : 0));
  void field;
  return c;
}

export function buildTeeterTerrainGeometry(field, data) {
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
      colors.set(groundTint(x, z, data, field), k * 3);
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

/** One pan's brine: a sheet at the water level, trimmed to where the bank meets it, uv in 7 m tiles. */
export function buildBrineGeometry(p) {
  const x0 = p.minX + PAN.rim, x1 = p.maxX - PAN.rim, z0 = p.minZ + PAN.rim, z1 = p.maxZ - PAN.rim;
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, PAN.water, (z0 + z1) / 2);
  const uv = geo.attributes.uv;
  const T = 7;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / T, uv.getY(i) * (z1 - z0) / T);
  geo.setAttribute('uv1', new THREE.BufferAttribute(uv.array.slice(), 2));
  return geo;
}
