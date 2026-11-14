/**
 * thornmere/terrain.js — Thornmere's ground as one mesh, sampled from the one height field in `site-plan.js`, so the walk, the landing
 * solver and every Node check stand on exactly the ground that is drawn.
 *
 * WHAT THE GROUND IS. Hardened pitch: black and glassy where the tar still wets it at the shore, weathered grey-brown and cracked on the
 * mound tops, and pale where the root ridges carry the walk from mound to mound. The colour is painted per vertex from the height and
 * from which piece of the plan the point belongs to, with two scales of noise so no patch repeats; the steep flanks, which show the
 * mound in section, are banded by height (flow layers of pitch).
 */

import * as THREE from 'three';
import { fbm2, buildRibbon, buildDisc } from '../ember/terrain.js';
import { height, MOUNDS, RIDGES, TAR_LEVEL, LAKE_BED, EDGE_IN, RIDGE_HALF, PAD_R, PAD_RISE } from './site-plan.js';

export { buildRibbon, buildDisc };

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function makeThornmereField() {
  return { height, PAD_TOP: MOUNDS.M0.top + PAD_RISE, PAD_R };
}

function axisLines(core = 104, step = 1, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = 2;
  while (v < reach) { s *= 1.25; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

const TINT = {
  bed: [0.05, 0.05, 0.05],
  wet: [0.07, 0.065, 0.06],
  flank: [0.2, 0.17, 0.14],
  band: [0.11, 0.1, 0.09],
  top: [0.3, 0.27, 0.22],
  moss: [0.24, 0.27, 0.17],
  root: [0.42, 0.36, 0.27],
  worn: [0.36, 0.33, 0.28]
};

/** How near a point is to the line of a ridge crest (1 on the line, 0 beyond its half-width). */
function onRidge(x, z) {
  let k = 0;
  for (const [a, b] of RIDGES) {
    const A = MOUNDS[a]; const B = MOUNDS[b];
    const dx = B.x - A.x; const dz = B.z - A.z; const L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - A.x) * dx + (z - A.z) * dz) / L2));
    const d = Math.hypot(x - (A.x + dx * t), z - (A.z + dz * t));
    k = Math.max(k, 1 - smooth(RIDGE_HALF * 0.5, RIDGE_HALF + 1.2, d));
  }
  return k;
}
function onTop(x, z) {
  let k = 0;
  for (const m of Object.values(MOUNDS)) k = Math.max(k, 1 - smooth(m.r - EDGE_IN - 1.5, m.r - EDGE_IN + 1, Math.hypot(x - m.x, z - m.z)));
  return k;
}

function groundTint(x, z, y) {
  if (y <= LAKE_BED + 0.05) return TINT.bed;
  const above = y - TAR_LEVEL;
  let c = mix3(TINT.wet, TINT.flank, smooth(0.05, 0.9, above));
  // Flow layers show on the flanks.
  const band = 0.5 + 0.5 * Math.sin(y * 9 + fbm2(x * 0.07, z * 0.07, 31, 2) * 6);
  c = mix3(c, TINT.band, band * 0.5 * (1 - onTop(x, z)) * smooth(0.2, 0.8, above));
  const top = onTop(x, z);
  let t = mix3(TINT.top, TINT.moss, Math.max(0, fbm2(x * 0.06, z * 0.06, 53, 3) - 0.5) * 1.6);
  t = mix3(t, TINT.worn, Math.max(0, fbm2(x * 0.22, z * 0.22, 71, 2) - 0.55) * 1.5);
  c = mix3(c, t, top);
  const ridge = onRidge(x, z) * smooth(0.2, 0.6, above);
  c = mix3(c, mix3(TINT.root, TINT.worn, fbm2(x * 0.3, z * 0.3, 17, 2)), ridge * 0.85);
  return c;
}

export function buildThornmereTerrainGeometry() {
  const axis = axisLines();
  const n = axis.length;
  const positions = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const colors = new Float32Array(n * n * 3);
  const TILE = 7;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = axis[i], z = axis[j], k = j * n + i;
      const y = height(x, z);
      positions.set([x, y, z], k * 3);
      uvs.set([x / TILE, z / TILE], k * 2);
      colors.set(groundTint(x, z, y), k * 3);
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
