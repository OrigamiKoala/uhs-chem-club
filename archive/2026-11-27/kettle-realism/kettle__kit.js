/**
 * kettle/kit.js — The few verbs everything in the works is built with: a box, a cylinder, a strut between two points, a
 * run of pipe, an I-section, a lamp. One kit for the building (`works.js`), the hosts (`stations.js`) and the plant
 * (`plant.js`), so a stanchion in the cast house and a post in the stores are the same steel.
 *
 * Every verb adds a mesh to the group it is given and hands the mesh back. Geometry is owned by the world (`w.own`).
 * A box whose texture should lie in metres (a wall, a floor, a roof) is a `slab`; a part too small to show a texture is
 * a `box`.
 *
 * ONLY LAMPS ARE LIT. `lamp` leaves a `lampMark` (an empty Object3D with `userData.lamp`) and a filament behind glass;
 * the world pools the marks into its three real lights. Nothing here owns a PointLight.
 */

import * as THREE from 'three';

/** The amber filament every work lamp in the works burns. */
export const FILAMENT = 0xd99423;
const UP = new THREE.Vector3(0, 1, 0);

/** A box geometry with its texture laid in metres (`tile` metres to one repeat), not stretched over each face. */
export function slabGeometry(sx, sy, sz, tile = 2) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [sz, sy] : ay > 0.5 ? [sx, sz] : [sx, sy];
    uv.setXY(i, uv.getX(i) * a / tile, uv.getY(i) * b / tile);
  }
  return g;
}

export function kitFor(w) {
  const own = (...o) => w.own(...o);
  const { M, t4 } = w;
  const place = (m, [x, y, z], rot, shadow) => {
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    if (shadow) m.castShadow = m.receiveShadow = t4;
    return m;
  };
  const add = (g, m) => { g.add(m); return m; };
  const box = (g, [sx, sy, sz], mat, p, rot = null, shadow = true) => add(g, place(new THREE.Mesh(own(new THREE.BoxGeometry(sx, sy, sz)), mat), p, rot, shadow));
  const slab = (g, [sx, sy, sz], mat, p, { tile = 2, shadow = true, rot = null } = {}) => add(g, place(new THREE.Mesh(own(slabGeometry(sx, sy, sz, tile)), mat), p, rot, shadow));
  const cyl = (g, [rt, rb, h, seg = 16], mat, p, rot = null, shadow = true) => add(g, place(new THREE.Mesh(own(new THREE.CylinderGeometry(rt, rb, h, seg)), mat), p, rot, shadow));
  const tube = (g, [r, h, seg = 18], mat, p) => add(g, place(new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, h, seg, 1, true)), mat), p, null, false));
  const cone = (g, [r, h, seg = 14], mat, p) => add(g, place(new THREE.Mesh(own(new THREE.ConeGeometry(r, h, seg)), mat), p, null, true));
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
    m.castShadow = t4;
    return add(g, m);
  };
  /** A square bar between two points (a rail, a brace, a chord). */
  const bar = (g, a, b, s, mat) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(own(new THREE.BoxGeometry(s, va.distanceTo(vb), s)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
    m.castShadow = t4;
    return add(g, m);
  };
  const pipe = (g, pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) strut(g, pts[i], pts[i + 1], r, mat, 10);
    for (let i = 1; i < pts.length - 1; i++) add(g, place(new THREE.Mesh(own(new THREE.SphereGeometry(r * 1.02, 12, 8)), mat), pts[i]));
  };
  /** A rolled I-section standing from `y0` to `y1`: two flanges and a web. `ry` turns its web. */
  const stanchion = (g, x, z, y0, y1, { d = 0.36, b = 0.3, mat = M.darkSteel, ry = 0 } = {}) => {
    const s = new THREE.Group();
    s.position.set(x, 0, z);
    s.rotation.y = ry;
    const h = y1 - y0, yc = (y0 + y1) / 2;
    box(s, [b, h, 0.03], mat, [0, yc, d / 2 - 0.015]);
    box(s, [b, h, 0.03], mat, [0, yc, -d / 2 + 0.015]);
    box(s, [0.02, h, d - 0.06], mat, [0, yc, 0]);
    g.add(s);
    return s;
  };
  /** An I-section laid level between two points on one axis: `axis` 'x' or 'z'. */
  const beam = (g, a, b, { d = 0.4, f = 0.26, mat = M.darkSteel } = {}) => {
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const alongX = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]);
    const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const dims = (w2, h2) => alongX ? [len, h2, w2] : [w2, h2, len];
    box(g, dims(f, 0.03), mat, [c[0], c[1] + d / 2 - 0.015, c[2]]);
    box(g, dims(f, 0.03), mat, [c[0], c[1] - d / 2 + 0.015, c[2]]);
    box(g, dims(0.02, d - 0.06), mat, c);
  };
  const footing = (g, x, z, s = 0.34, y = 0) => box(g, [s + 0.16, 0.05, s + 0.16], M.darkSteel, [x, y + 0.025, z], null, false);
  /** A square post on a footing, from the floor (`y0`) to `top`. */
  const post = (g, x, z, top, s = 0.16, mat = M.darkSteel, y0 = 0) => { footing(g, x, z, Math.max(0.28, s + 0.14), y0); return box(g, [s, top - y0 - 0.05, s], mat, [x, y0 + 0.05 + (top - y0 - 0.05) / 2, z]); };

  /** A lamp: the mark the pool reads, and the filament behind glass. */
  const lamp = (g, x, y, z, { intensity = 9, distance = 13, color = FILAMENT, bulb = true } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    if (bulb) box(g, [0.34, 0.1, 0.2], M.lantern, [x, y + 0.12, z], null, false);
    return mark;
  };
  /** A lamp hung on a rod from `from` (a roof, a beam), under a shade. */
  const pendant = (g, x, y, z, from, opts = {}) => {
    box(g, [0.04, from - y - 0.3, 0.04], M.darkSteel, [x, (from + y + 0.3) / 2, z], null, false);
    cyl(g, [0.12, 0.42, 0.22, 14], M.darkSteel, [x, y + 0.28, z], null, false);
    return lamp(g, x, y, z, opts);
  };
  /** A lamp on a bracket off a wall or a post: `arm` is the reach, as [dx, dz]. */
  const bracketLamp = (g, x, y, z, arm, opts = {}) => {
    strut(g, [x, y + 0.18, z], [x + arm[0], y + 0.18, z + arm[1]], 0.03, M.darkSteel, 6);
    cyl(g, [0.1, 0.32, 0.18, 12], M.darkSteel, [x + arm[0], y + 0.26, z + arm[1]], null, false);
    return lamp(g, x + arm[0], y, z + arm[1], opts);
  };
  return { box, slab, cyl, tube, cone, strut, bar, pipe, stanchion, beam, footing, post, lamp, pendant, bracketLamp, own };
}
