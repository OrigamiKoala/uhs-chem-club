/**
 * kettle/kit.js — The few verbs everything in the works is built with: a box, a cylinder, a strut between two points, a
 * run of pipe, an I-section, a lamp. One kit for the building (`works.js`), the hosts (`stations.js`) and the plant
 * (`plant.js`), so a stanchion in the cast house and a post in the stores are the same steel.
 *
 * Every verb adds a mesh to the group it is given and hands the mesh back. Geometry is owned by the world (`w.own`).
 * A box whose texture should lie in metres (a wall, a floor, a roof) is a `slab`; a part too small to show a texture is
 * a `box`.
 *
 * BUILT SHAPES (opt-in, Kettle's realism pass). A world that sets `builtKit = true` gets every box, bar and slab with
 * its edges chamfered and every cylinder with its rims bevelled, all with uvs laid in METRES (1 uv = 1 m) and a
 * seeded offset per part, so a material shows one texel density on every object and no two parts show the same
 * patch of texture. The shapes stay inside the boxes they replace (overlap and bay checks read the same envelope).
 * Other worlds that use this kit get exactly the old geometry.
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

/* ------------------------------------------------------------------ built shapes (opt-in) */

/** A small deterministic hash of a position, for a part's uv offset. */
function uvSeed(p) {
  const x = Math.sin((p?.[0] || 0) * 12.9898 + (p?.[1] || 0) * 78.233 + (p?.[2] || 0) * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

/** Planar uv in metres for a point on a face with normal `n`: the face's two in-plane axes. */
function faceUV(px, py, pz, nx, ny, nz) {
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  if (ay >= ax && ay >= az) return [px, pz];
  if (ax >= az) return [pz, py];
  return [px, py];
}

/**
 * A box with its twelve edges chamfered by `c` (a flat 45° face along each edge and a small triangle at each corner),
 * flat-shaded, uvs in metres offset by `off`. 44 triangles. With `c` 0 it is a plain box laid the same way.
 */
export function chamferBoxGeometry(sx, sy, sz, c = 0.02, off = [0, 0]) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  c = Math.max(0, Math.min(c, hx * 0.45, hy * 0.45, hz * 0.45));
  const pos = [], nor = [], uv = [], idx = [];
  const poly = (pts) => {
    // Outward: the box is convex about its centre, so a face whose normal points at the centre is turned round.
    const [a, b, d] = pts;
    let n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
    if (n.lengthSq() < 1e-14) return;
    n.normalize();
    const cen = pts.reduce((m, p) => m.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    if (n.dot(cen) < 0) { pts = pts.slice().reverse(); n.negate(); }
    const base = pos.length / 3;
    for (const p of pts) {
      pos.push(p.x, p.y, p.z);
      nor.push(n.x, n.y, n.z);
      const [u, v] = faceUV(p.x, p.y, p.z, n.x, n.y, n.z);
      uv.push(u + off[0], v + off[1]);
    }
    for (let i = 1; i < pts.length - 1; i++) idx.push(base, base + i, base + i + 1);
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // The point a corner (signs a, b, d) leaves on each of its three faces.
  const onX = (a, b, d) => V(a * hx, b * (hy - c), d * (hz - c));
  const onY = (a, b, d) => V(a * (hx - c), b * hy, d * (hz - c));
  const onZ = (a, b, d) => V(a * (hx - c), b * (hy - c), d * hz);
  const S = [-1, 1];
  for (const a of S) poly([onX(a, -1, -1), onX(a, 1, -1), onX(a, 1, 1), onX(a, -1, 1)]);
  for (const b of S) poly([onY(-1, b, -1), onY(1, b, -1), onY(1, b, 1), onY(-1, b, 1)]);
  for (const d of S) poly([onZ(-1, -1, d), onZ(1, -1, d), onZ(1, 1, d), onZ(-1, 1, d)]);
  if (c > 1e-5) {
    for (const a of S) for (const b of S) poly([onX(a, b, -1), onX(a, b, 1), onY(a, b, 1), onY(a, b, -1)]);
    for (const a of S) for (const d of S) poly([onX(a, -1, d), onX(a, 1, d), onZ(a, 1, d), onZ(a, -1, d)]);
    for (const b of S) for (const d of S) poly([onY(-1, b, d), onY(1, b, d), onZ(1, b, d), onZ(-1, b, d)]);
    for (const a of S) for (const b of S) for (const d of S) poly([onX(a, b, d), onY(a, b, d), onZ(a, b, d)]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/**
 * A turned part (a cylinder, a cone, a tube) from a profile of bands, each band shaded flat along the profile and
 * smooth round the axis, so a rim is a crisp bevel rather than a smeared corner. `bevel` > 0 chamfers both rims of a
 * closed cylinder. Uvs in metres: round the side by arc length, over a cap by position.
 */
export function turnedGeometry(rt, rb, h, seg = 16, { open = false, bevel = 0, off = [0, 0] } = {}) {
  const y0 = -h / 2, y1 = h / 2;
  const b = open ? 0 : Math.max(0, Math.min(bevel, h * 0.3, Math.max(rt, rb) * 0.3));
  const pts = [];                                     // the profile, bottom centre to top centre
  if (!open && rb > 0) pts.push([0, y0]);
  if (b > 0 && rb > b) { pts.push([rb - b, y0]); pts.push([rb, y0 + b]); } else pts.push([rb, y0]);
  if (b > 0 && rt > b) { pts.push([rt, y1 - b]); pts.push([rt - b, y1]); } else pts.push([rt, y1]);
  if (!open && rt > 0) pts.push([0, y1]);
  const pos = [], nor = [], uv = [], idx = [];
  let along = 0;
  for (let k = 0; k < pts.length - 1; k++) {
    const [r0, ya] = pts[k], [r1, yb] = pts[k + 1];
    const dr = r1 - r0, dy = yb - ya, len = Math.hypot(dr, dy);
    if (len < 1e-6) continue;
    const nr = dy / len, ny = -dr / len;              // outward: the profile runs bottom to top
    const flat = Math.abs(ny) > 0.7;
    const rm = Math.max(0.01, (r0 + r1) / 2);
    const base = pos.length / 3;
    for (const [r, y, t] of [[r0, ya, along], [r1, yb, along + len]]) {
      for (let i = 0; i <= seg; i++) {
        const th = (i / seg) * Math.PI * 2, sn = Math.sin(th), cs = Math.cos(th);
        pos.push(r * sn, y, r * cs);
        nor.push(nr * sn, ny, nr * cs);
        if (flat) uv.push(r * sn + off[0], r * cs + off[1]);
        else uv.push(th * rm + off[0], t + off[1]);
      }
    }
    for (let i = 0; i < seg; i++) {
      const a = base + i, c2 = base + seg + 1 + i;
      // Counter-clockwise seen from outside, whichever way this band runs.
      idx.push(a, a + 1, c2 + 1, a, c2 + 1, c2);
    }
    along += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // Wind every triangle to agree with its stored normal (a band can run inward, as a cap does).
  const p = g.attributes.position, n = g.attributes.normal, ix = g.index.array;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), N2 = new THREE.Vector3();
  for (let t = 0; t < ix.length; t += 3) {
    A.fromBufferAttribute(p, ix[t]); B.fromBufferAttribute(p, ix[t + 1]); C.fromBufferAttribute(p, ix[t + 2]);
    const f = B.sub(A).cross(C.sub(A));
    N.fromBufferAttribute(n, ix[t]).add(N2.fromBufferAttribute(n, ix[t + 1])).add(N2.fromBufferAttribute(n, ix[t + 2]));
    if (f.dot(N) < 0) { const s2 = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = s2; }
  }
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** How hard a built part's edge is broken: a few centimetres on a crate, a millimetre or two on a thin bar. */
const chamferFor = (sx, sy, sz) => {
  const m = Math.min(sx, sy, sz);
  return m < 0.035 ? 0 : Math.min(0.03, m * 0.16);
};

export function kitFor(w) {
  const own = (...o) => w.own(...o);
  const { M, t4 } = w;
  const built = w.builtKit === true;
  /** The geometry of a box: the old stock box, or (built) a chamfered one laid in metres. */
  const boxGeo = (sx, sy, sz, p, tile = null) => {
    if (!built) return tile === null ? new THREE.BoxGeometry(sx, sy, sz) : slabGeometry(sx, sy, sz, tile);
    const s = uvSeed(p);
    return chamferBoxGeometry(sx, sy, sz, tile === null ? chamferFor(sx, sy, sz) : 0, [s * 7.3, s * 3.1]);
  };
  /** The geometry of a cylinder or a cone: stock, or (built) turned with bevelled rims and metric uvs. */
  const cylGeo = (rt, rb, h, seg, p, open = false) => {
    if (!built) return new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
    const s = uvSeed(p);
    const bevel = Math.max(rt, rb) < 0.06 || h < 0.03 ? 0 : Math.min(0.035, Math.max(rt, rb) * 0.08, h * 0.2);
    return turnedGeometry(rt, rb, h, seg, { open, bevel, off: [s * 5.7, s * 2.3] });
  };
  const place = (m, [x, y, z], rot, shadow) => {
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    if (shadow) m.castShadow = m.receiveShadow = t4;
    return m;
  };
  const add = (g, m) => { g.add(m); return m; };
  const box = (g, [sx, sy, sz], mat, p, rot = null, shadow = true) => add(g, place(new THREE.Mesh(own(boxGeo(sx, sy, sz, p)), mat), p, rot, shadow));
  const slab = (g, [sx, sy, sz], mat, p, { tile = 2, shadow = true, rot = null } = {}) => add(g, place(new THREE.Mesh(own(boxGeo(sx, sy, sz, p, tile)), mat), p, rot, shadow));
  const cyl = (g, [rt, rb, h, seg = 16], mat, p, rot = null, shadow = true) => add(g, place(new THREE.Mesh(own(cylGeo(rt, rb, h, seg, p)), mat), p, rot, shadow));
  const tube = (g, [r, h, seg = 18], mat, p) => add(g, place(new THREE.Mesh(own(cylGeo(r, r, h, seg, p, true)), mat), p, null, false));
  const cone = (g, [r, h, seg = 14], mat, p) => add(g, place(new THREE.Mesh(own(built ? cylGeo(0, r, h, seg, p) : new THREE.ConeGeometry(r, h, seg)), mat), p, null, true));
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(own(cylGeo(r, r, va.distanceTo(vb), seg, a)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
    m.castShadow = t4;
    return add(g, m);
  };
  /** A square bar between two points (a rail, a brace, a chord). */
  const bar = (g, a, b, s, mat) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(own(boxGeo(s, va.distanceTo(vb), s, a)), mat);
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
