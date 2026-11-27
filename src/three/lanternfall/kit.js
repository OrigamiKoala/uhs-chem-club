/**
 * lanternfall/kit.js — Geometry by the bucket: Lanternfall's ground and room shells are built as many small pieces
 * and drawn as one mesh per material.
 *
 * A `Buckets` collects geometries under a material key, each already placed in the frame it is built in, and `build`
 * merges each bucket into one mesh. Pieces with vertex colours go in buckets of their own (a merge needs every piece to
 * carry the same attributes). Shells and ground are `phys: 'ground'`: they are the land and the rock, not props, so the
 * world's bake leaves them alone and they arrive merged.
 */

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const ZED = new THREE.Vector3(0, 0, 1);

/** Seeded 3D value noise in [0, 1]: smooth, the same at the same point every build. */
function hash3(x, y, z, s) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x1b873593) ^ Math.imul(s | 0, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}
function noise3(x, y, z, s) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz, s);
  return L(
    L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
    L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}

/**
 * A slab or block as it lies in nature, not as a box is cut: its edges rounded off, its faces worn uneven, chipped at
 * the corners, optionally tapering toward its top. Seeded, so every build draws the same piece.
 *
 * EVERY VERTEX ONLY EVER MOVES INWARD. The piece is the box `sx, sy, sz` with material taken away and never added, so
 * swapping a box for a chunk of the same size cannot open a new overlap or reach into a bay.
 *
 * @param {{ seed?: number, round?: number, wear?: number, chip?: number, taper?: number, cell?: number }} o
 *   round: edge radius as a fraction of the half-thickness; wear: how deep (m) the faces are worn at most;
 *   chip: how deep (m) a corner may be broken; taper: how much narrower the top is (fraction); cell: grid size (m)
 */
export function chunkGeometry(sx, sy, sz, { seed = 1, round = 0.45, wear = 0.04, chip = 0, taper = 0, cell = 0.45 } = {}) {
  const seg = v => Math.max(1, Math.min(24, Math.round(v / cell)));
  const g = new THREE.BoxGeometry(sx, sy, sz, seg(sx) + 1, seg(sy) + 1, seg(sz) + 1);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const rad = Math.max(0.005, Math.min(hx, hy, hz) * round);
  const pos = g.attributes.position;
  const f = 1 / Math.max(0.35, Math.min(sx, sy, sz) * 0.9);
  const cl = (v, h) => Math.max(-h + rad, Math.min(h - rad, v));
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Round: the point on a box shrunk by `rad`, pushed back out by `rad` toward where it was.
    const ix = cl(x, hx), iy = cl(y, hy), iz = cl(z, hz);
    let dx = x - ix, dy = y - iy, dz = z - iz;
    const len = Math.hypot(dx, dy, dz) || 1;
    dx /= len; dy /= len; dz /= len;
    x = ix + dx * rad; y = iy + dy * rad; z = iz + dz * rad;
    // Wear the faces in, two octaves; break the corners deeper.
    const n = 0.65 * noise3(x * f * 1.7, y * f * 1.7, z * f * 1.7, seed) + 0.35 * noise3(x * f * 4.1, y * f * 4.1, z * f * 4.1, seed + 7);
    const corner = Math.max(0, (Math.abs(x) / hx + Math.abs(y) / hy + Math.abs(z) / hz - 2.2) / 0.8);
    const chipD = chip * corner * noise3(x * f * 2.3 + 9, y * f * 2.3, z * f * 2.3, seed + 13);
    const d = wear * n + chipD;
    x -= dx * d; y -= dy * d; z -= dz * d;
    // Taper toward the top (inward only).
    if (taper > 0) {
      const t = 1 - taper * (y + hy) / sy;
      x *= t; z *= t;
    }
    pos.setXYZ(i, x, y, z);
  }
  const welded = mergeVertices(g, 1e-4);
  g.dispose();
  welded.computeVertexNormals();
  return welded;
}

/** A seeded random in [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Give every vertex of `geo` the colour `[r, g, b]` (0..1), or the colour `fn(x, y, z)` returns. */
export function paint(geo, col) {
  const p = geo.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const v = typeof col === 'function' ? col(p.getX(i), p.getY(i), p.getZ(i)) : col;
    c[i * 3] = v[0]; c[i * 3 + 1] = v[1]; c[i * 3 + 2] = v[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}

export class Buckets {
  constructor() { this.map = new Map(); }

  add(key, geo) {
    const g = geo.index ? geo : geo;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    let arr = this.map.get(key);
    if (!arr) { arr = []; this.map.set(key, arr); }
    arr.push(g.index ? g.toNonIndexed() : g);
    return g;
  }

  /** A box of size `s` at `p`, turned by Euler `r`. */
  box(key, s, p, r = null) {
    const g = new THREE.BoxGeometry(s[0], s[1], s[2]);
    if (r) g.rotateX(r[0]).rotateY(r[1]).rotateZ(r[2]);
    g.translate(p[0], p[1], p[2]);
    return this.add(key, g);
  }

  /**
   * A worn, rounded block in place of a box of size `s` at `p`, turned by Euler `r` (`chunkGeometry`). It lies inside
   * the box it replaces. Seeded from `o.seed`, or from this bucket's own running count.
   */
  chunk(key, s, p, r = null, o = {}) {
    this.chunks = (this.chunks || 0) + 1;
    const g = chunkGeometry(s[0], s[1], s[2], { seed: 977 + this.chunks * 31, ...o });
    if (r) g.rotateX(r[0]).rotateY(r[1]).rotateZ(r[2]);
    g.translate(p[0], p[1], p[2]);
    return this.add(key, g);
  }

  /** A cylinder (radii `rt`, `rb`, height `h`, `seg` sides) at `p`, turned by Euler `r`. */
  cyl(key, rt, rb, h, seg, p, r = null) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    if (r) g.rotateX(r[0]).rotateY(r[1]).rotateZ(r[2]);
    g.translate(p[0], p[1], p[2]);
    return this.add(key, g);
  }

  /** A rod of radius `r` from `a` to `b`. */
  rod(key, a, b, r, seg = 6) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    if (len < 0.01) return null;
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, vb.clone().sub(va).normalize()));
    const m = va.add(vb).multiplyScalar(0.5);
    g.translate(m.x, m.y, m.z);
    return this.add(key, g);
  }

  /** A beam `w` wide and `h` deep from `a` to `b`, its depth kept vertical. */
  beam(key, a, b, w, h) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const len = d.length();
    if (len < 0.01) return null;
    const g = new THREE.BoxGeometry(w, h, len);
    const yaw = Math.atan2(d.x, d.z), pitch = -Math.asin(d.y / len);
    g.rotateX(pitch).rotateY(yaw);
    const m = va.add(vb).multiplyScalar(0.5);
    g.translate(m.x, m.y, m.z);
    return this.add(key, g);
  }

  /**
   * A sheet: a grid of `nu` x `nv` quads from `fn(u, v) -> [x, y, z]` (u, v in 0..1), its front the side the
   * winding faces. `col(x, y, z)` paints it; a quad `skip(u, v, [x, y, z])` is true for (at its middle) is left out.
   */
  sheet(key, nu, nv, fn, col = null, skip = null) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const p = fn(i / nu, j / nv);
        pos.push(p[0], p[1], p[2]);
        uv.push(i / nu, j / nv);
      }
    }
    const W = nu + 1;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        if (skip && skip((i + 0.5) / nu, (j + 0.5) / nv, fn((i + 0.5) / nu, (j + 0.5) / nv))) continue;
        const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    if (col) paint(g, col);
    return this.add(key, g);
  }

  /** Merge every bucket into one mesh per material (`M[key]`) under one group. */
  build(M, name, { phys = 'ground', shadows = false } = {}) {
    const group = new THREE.Group();
    group.name = name;
    if (phys) group.userData.phys = phys;
    group.userData.noWeather = true;
    for (const [key, geos] of this.map) {
      const mat = M[key];
      if (!mat) throw new Error(`no material "${key}" for ${name}`);
      const withColour = geos.filter(g => g.attributes.color), without = geos.filter(g => !g.attributes.color);
      for (const set of [withColour, without]) {
        if (!set.length) continue;
        const merged = mergeGeometries(set, false);
        for (const g of set) g.dispose();
        merged.computeBoundingBox();
        merged.computeBoundingSphere();
        const m = new THREE.Mesh(merged, set === withColour ? colourVariant(M, key) : mat);
        m.name = `${name}-${key}`;
        m.castShadow = shadows;
        m.receiveShadow = true;
        m.userData.ownGeometry = merged;
        group.add(m);
      }
    }
    return group;
  }
}

/** The vertex-coloured twin of a material, made once and kept on `M`. */
function colourVariant(M, key) {
  const k = `${key}__vc`;
  if (!M[k]) {
    M[k] = M[key].clone();
    M[k].vertexColors = true;
    M.__made = M.__made || [];
    M.__made.push(M[k]);
  }
  return M[k];
}

export { UP, ZED };
