/**
 * ember/kit.js — The small shared pieces every Ember Reach builder uses.
 *
 * A mesh with its geometry owned, a cylinder laid between two points, a stone
 * that is not a sphere, and a lathe roughened so a vent cone is not a toy.
 * Nothing here knows where anything stands.
 */

import * as THREE from 'three';

const AX = new THREE.Vector3(0, 1, 0);

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440670441) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in 3D, 0..1. */
export function noise3(x, y, z, seed = 1) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz, seed);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w
  );
}

/** A mesh with its geometry owned, positioned, shadowed at T4. */
export function part(ctx, geo, mat, x = 0, y = 0, z = 0, { cast = false } = {}) {
  const m = new THREE.Mesh(ctx.own(geo), mat);
  m.position.set(x, y, z);
  if (cast) m.castShadow = m.receiveShadow = ctx.t4;
  return m;
}

/** Add a mesh to a group, turned, and hand the MESH back (Object3D.add returns the parent). */
export function put(group, mesh, rx = 0, ry = 0, rz = 0) {
  mesh.rotation.set(rx, ry, rz);
  group.add(mesh);
  return mesh;
}

/** A cylinder laid between two points. */
export function between(ctx, a, b, radius, mat, seg = 8) {
  const from = new THREE.Vector3(...a); const to = new THREE.Vector3(...b);
  const len = from.distanceTo(to);
  const m = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(radius, radius, len, seg)), mat);
  m.position.copy(from).lerp(to, 0.5);
  m.quaternion.setFromUnitVectors(AX, to.clone().sub(from).normalize());
  return m;
}

/** A box laid between two points (a strut, a rail), `w` across and `d` deep. */
export function strut(ctx, a, b, w, d, mat) {
  const from = new THREE.Vector3(...a); const to = new THREE.Vector3(...b);
  const len = from.distanceTo(to);
  const m = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(w, len, d)), mat);
  m.position.copy(from).lerp(to, 0.5);
  m.quaternion.setFromUnitVectors(AX, to.clone().sub(from).normalize());
  return m;
}

/**
 * A stone that is not a sphere: an icosahedron pushed about by noise, squashed,
 * and with its underside flattened so it sits rather than balances.
 */
export function rockGeometry(r, seed, { squash = 0.7, detail = 2, rough = 0.28, sink = 0.18 } = {}) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise3(v.x * 1.7 + seed, v.y * 1.7, v.z * 1.7, seed) - 0.5;
    const n2 = noise3(v.x * 4.1, v.y * 4.1 + seed, v.z * 4.1, seed + 7) - 0.5;
    const k = 1 + n * rough * 2 + n2 * rough * 0.6;
    v.multiplyScalar(k);
    v.y *= squash;
    if (v.y < -sink) v.y = -sink - (v.y + sink) * 0.15;
    p.setXYZ(i, v.x * r, (v.y + sink) * r, v.z * r);
  }
  geo.computeVertexNormals();
  return geo;
}

/** A lathed profile [[r, y], ...], roughened radially by noise so it reads as built by nature. */
export function roughLathe(profile, segments, seed, amp = 0.08) {
  const geo = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), segments);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const rr = Math.hypot(x, z);
    if (rr < 0.01) continue;
    const a = Math.atan2(x, z);
    const n = noise3(Math.cos(a) * 2.2 + seed, y * 1.3, Math.sin(a) * 2.2, seed) - 0.5;
    const k = 1 + n * amp * 2;
    p.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Turn a local point by a yaw, the way three turns a group (local +x -> (cos, -sin)). */
export function yawPoint(lx, lz, rotY) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  return [lx * c + lz * s, -lx * s + lz * c];
}
