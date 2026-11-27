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
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const ZED = new THREE.Vector3(0, 0, 1);

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
