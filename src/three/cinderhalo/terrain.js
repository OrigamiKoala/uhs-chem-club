/**
 * cinderhalo/terrain.js — Cinder Halo's ground as one mesh, sampled from the one height field in `site-plan.js`, so the walk, the landing
 * solver and every Node check stand on exactly the ground that is drawn.
 *
 * WHAT THE GROUND IS. Black cinder on the plain, grey with ash where it has blown into hollows; crater walls cut through the layers the
 * impacts threw out, so a wall is banded by height (ejecta in section), darker below each rim; crater floors are pale packed ash, worn
 * paler along the way the walk takes; the great crater's floor is fused to a dark glass where the runaway chain melted it. Colour is
 * painted per vertex from the height and from which part of the plan a point belongs to, with two scales of noise so no patch repeats.
 */

import * as THREE from 'three';
import { fbm2 } from '../ember/terrain.js';
import { height, PARTS, CUT_SEGS, walkDistance, PAD_R, PAD_RISE, ARENA } from './site-plan.js';

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function makeCinderField() {
  return { height, PAD_TOP: PARTS.L.floor + PAD_RISE, PAD_R };
}

function axisLines(core = 104, step = 1, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = 2;
  while (v < reach) { s *= 1.25; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

const TINT = {
  cinder: [0.085, 0.078, 0.072],
  ash: [0.27, 0.25, 0.23],
  bandA: [0.16, 0.13, 0.11],
  bandB: [0.24, 0.2, 0.16],
  floor: [0.33, 0.31, 0.28],
  worn: [0.44, 0.41, 0.37],
  glass: [0.07, 0.085, 0.065],
  glassSheen: [0.13, 0.15, 0.11]
};

/** How near a point is to the line of a cutting or to the arc the walk takes round a floor: 1 on the way, 0 off it. */
function onWay(x, z) {
  let k = 0;
  for (const s of CUT_SEGS) {
    const dx = s.bx - s.ax; const dz = s.bz - s.az; const L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / L2));
    const d = Math.hypot(x - (s.ax + dx * t), z - (s.az + dz * t));
    k = Math.max(k, 1 - smooth(0.8, 2.2, d));
  }
  for (const [name, P] of Object.entries(PARTS)) {
    if (name === 'L' || name === 'G') continue;
    const d = Math.abs(Math.hypot(x - P.x, z - P.z) - (P.r - 3));
    k = Math.max(k, (1 - smooth(0.6, 1.8, d)) * 0.7);
  }
  return k;
}

function groundTint(x, z, y) {
  const w = walkDistance(x, z);
  const out = w.d;
  // The plain and the rims: cinder, ash drifted into hollows.
  let c = mix3(TINT.cinder, TINT.ash, Math.max(0, fbm2(x * 0.05, z * 0.05, 11, 3) - 0.48) * 1.8);
  // Crater walls: the ejecta layers in section, banded by height.
  const wall = smooth(0.2, 1.5, out) * (1 - smooth(9, 18, out));
  const band = 0.5 + 0.5 * Math.sin(y * 3.1 + fbm2(x * 0.06, z * 0.06, 29, 2) * 5);
  c = mix3(c, mix3(TINT.bandA, TINT.bandB, band), wall * 0.85);
  // Floors and cuttings: packed ash, paler along the walked way.
  const floor = 1 - smooth(0, 0.8, out);
  let f = mix3(TINT.floor, TINT.ash, Math.max(0, fbm2(x * 0.12, z * 0.12, 41, 3) - 0.5) * 1.4);
  f = mix3(f, TINT.worn, onWay(x, z) * 0.6);
  c = mix3(c, f, floor);
  // The great crater's floor: fused glass, darkest round the dome.
  const G = PARTS.G;
  const g = 1 - smooth(G.r - 2, G.r + 6, Math.hypot(x - G.x, z - G.z));
  if (g > 0) {
    const sheen = Math.max(0, fbm2(x * 0.3, z * 0.3, 7, 2) - 0.45) * 2;
    let gl = mix3(TINT.glass, TINT.glassSheen, sheen);
    gl = mix3(gl, TINT.worn, (1 - smooth(1.5, 3.5, Math.abs(x - ARENA.player[0]))) * smooth(-12, -2, z) * 0.35);
    c = mix3(c, gl, g * 0.92);
  }
  return c;
}

export function buildCinderTerrainGeometry() {
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
