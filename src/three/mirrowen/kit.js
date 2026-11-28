/**
 * mirrowen/kit.js — The small shared pieces every Mirrowen builder uses.
 *
 * The general helpers (a mesh with its geometry owned, a cylinder laid between two points, a
 * seeded random, value noise, a point turned by a yaw) are Ember Reach's, re-exported so the two
 * worlds draw from one tested set. What is added here is what only a frozen harbour needs: a
 * crystal of ice, and a cluster of them.
 */

import * as THREE from 'three';
import { rng, noise3, part, put, between, strut, rockGeometry, roughLathe, yawPoint } from '../ember/kit.js';
import { chunkGeometry } from '../lanternfall/kit.js';

export { rng, noise3, part, put, between, strut, rockGeometry, roughLathe, yawPoint };

/**
 * One crystal of ice: a six-sided column with a pointed, faceted top. Stands on y = 0, `h` tall
 * including the point. The column is a little narrower at the head than at the foot.
 */
export function crystalGeometry(r, h, { point = 0.22, seed = 1 } = {}) {
  const body = h * (1 - point);
  const col = new THREE.CylinderGeometry(r * 0.94, r, body, 6, 1);
  col.translate(0, body / 2, 0);
  const tip = new THREE.CylinderGeometry(r * 0.12, r * 0.94, h * point, 6, 1);
  tip.translate(0, body + (h * point) / 2, 0);
  // Merge by hand: two indexed geometries into one.
  const parts = [col, tip];
  const pos = [], nrm = [], uv = [], idx = [];
  let base = 0;
  for (const g of parts) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nrm.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(u.getX(i) * 2, u.getY(i) * (h / 4));
    }
    const ix = g.index;
    for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + base);
    base += p.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('uv1', new THREE.Float32BufferAttribute(uv.slice(), 2));
  out.setIndex(idx);
  out.rotateY(seed * 0.7);
  return out;
}

/**
 * Box-projected uvs from position, `metres` per uv unit, for a geometry that has none (a chunk); the materials that
 * take world uvs (`mirrowen.js` initSurfaces) ignore them, the rest read them.
 */
export function boxUv(g, metres = 2) {
  const p = g.attributes.position;
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ay > 0.7 ? [p.getX(i), p.getZ(i)] : ax > 0.7 ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
    uv[i * 2] = a / metres; uv[i * 2 + 1] = b / metres;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** A worn, chamfered block (`chunkGeometry`, inside the box `sx, sy, sz`) with box-projected uvs, centred on the origin. */
export function blockGeometry(sx, sy, sz, { seed = 1, round = 0.25, wear = 0.006, chip = 0.015, cell = 0.3, uvMetres = 1 } = {}) {
  return boxUv(chunkGeometry(sx, sy, sz, { seed, round, wear, chip, cell }), uvMetres);
}
