/**
 * industry.js — the works beyond the walk on Ligar.
 *
 * Everything here is `phys: 'ambient'`: scenery past the ±100 m walk that no
 * player can reach (every vertex stands at max(|x|, |z|) > 115), with no
 * colliders and no shadow casting. It is the industrial horizon a flood-basalt
 * quarry would have round it, and it exists to give the benches a SCALE:
 *
 *   - THE SMELTER, the works this quarry fed, on the first trap bench to the
 *     east-south-east (bearing 0.35 rad, 200–290 m out): a blast furnace in
 *     its structural tower with uptakes, downcomer and dust catcher; a row of
 *     four hot-blast stoves; a casthouse with a sawtooth roof; a gasholder in
 *     its guide frame; tanks; a tower crane; four stacks, three still drawing;
 *     and the conveyor gallery that climbs the bench's cliff from a transfer
 *     tower on the plain to the furnace top.
 *   - A POWER LINE, nine lattice towers marching from the edge of the yard
 *     east over the benches to the horizon, north of the rising moon, with
 *     the conductors sagging between them and two of them down at the yard end.
 *   - THE DRAGLINE, a walking dragline the size of a city block walked out
 *     onto the plain (bearing -2.0 rad, 212 m, x- z-) and left: house on its
 *     tub, walking shoes, A-frame, mast, a ninety-six-metre boom raised at
 *     thirty degrees on its pendants and turned ACROSS the line of sight from
 *     the walk (so its whole length reads), and the bucket hanging off the
 *     boom point, swinging a hand's breadth in the wind.
 *
 * SILHOUETTE, NOT MODEL. Past 150 m the air takes most of the contrast, so
 * what carries is outline — lacing, cross-arms, gallery trusses, platforms,
 * cages — and a few tones. The tones are painted into VERTEX COLOURS in world
 * space (base, grime, run-off streaks, rust bloom, bands, basalt dust at the
 * foot) on ONE MeshStandardMaterial, merged into a handful of meshes; the
 * pylons are instanced. The only emissive things are literal lamps: the red
 * obstruction lamps on the tallest stack and the crane, and a few sodium
 * windows in the casthouse.
 *
 * `buildLigarIndustry({ heightAt, t4, own })` returns
 * { group, vents, update, dispose }: `vents` are the mouths of the stacks that
 * still smoke, { x, y, z, size, rate }, for the effects layer.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng, lerp, fbm2, noise2, smoothstep } from '../erebus/noise.js';

/* ================================================================= layout */

/** The smelter's frame: a = radial (outward), b = tangential (bearing increasing). */
const SMELTER = { bearing: 0.35, dist: 235 };
/** The dragline: where it stands, and the bearing its boom points. */
const DRAGLINE = { bearing: -2.0, dist: 212, boomBearing: -0.5 };
/** The power line's route, from the yard's edge east over the benches. */
const LINE = [[126, 10], [215, -8], [340, -2], [540, 18], [745, 40]];

/* =================================================================== paint */

const C = hex => new THREE.Color(hex);
const PAL = {
  soot: C('#211f1d'),       // steel black with forty years of smoke on it
  steel: C('#34302c'),
  paint: C('#574d44'),      // grey-brown plant paint
  paintLt: C('#6c6157'),
  oxide: C('#5e2f24'),      // dull oxide-red primer and livery
  oxideLt: C('#76412f'),
  rust: C('#6b3a22'),
  concrete: C('#645d55'),
  brick: C('#55362b'),
  glass: C('#0e0d0c'),
  dust: C('#46403a')        // basalt dust, dark and grey
};

/**
 * Paint a world-space geometry into vertex colours: a base tone, broad grime,
 * run-off streaks (long down, narrow across), rust blooming out of it,
 * optional horizontal bands, and basalt dust settled within a few metres of
 * the ground.
 */
function paint(geo, base, o = {}) {
  const { ground = 0, dust = 3, grime = 0.3, streak = 0.3, rust = 0.25, bands = null, seed = 0 } = o;
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const R = PAL.rust, D = PAL.dust;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let c = base;
    if (bands) for (const b of bands) if (y >= b.y0 && y < b.y1) { c = b.c; break; }
    let k = 1 + fbm2(x * 0.05 + seed, z * 0.05 + y * 0.035, 3) * grime * 2;
    k *= 1 - Math.max(0, noise2((x - z) * 0.6 + seed * 3.1, y * 0.018 + seed)) * streak;
    let r = c.r * k, g = c.g * k, bl = c.b * k;
    if (rust > 0) {
      const n = noise2((x + z) * 0.4 + seed * 1.7, y * 0.06 - seed * 0.3);
      const t = smoothstep(0.08, 0.5, n) * rust;
      r += (R.r - r) * t; g += (R.g - g) * t; bl += (R.b - bl) * t;
    }
    if (dust > 0) {
      const above = y - ground + noise2(x * 0.3, z * 0.3) * dust * 0.4;
      const s = (1 - smoothstep(dust * 0.15, dust, above)) * 0.75;
      r += (D.r - r) * s; g += (D.g - g) * s; bl += (D.b - bl) * s;
    }
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = bl;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** Make a geometry mergeable with every other one: flat, and the same four attributes. */
function normalise(geo) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  for (const name of Object.keys(g.attributes)) {
    if (!['position', 'normal', 'uv', 'color'].includes(name)) g.deleteAttribute(name);
  }
  return g;
}

/**
 * A batch of painted parts that bakes to one mesh. Parts are authored in an
 * object's own frame and carried into the world by `frame` before they are
 * painted, so grime, rust and dust are laid in world space and agree.
 */
class Batch {
  constructor() { this.geos = []; this.frame = new THREE.Matrix4(); this.ground = 0; this.tris = 0; }
  at(matrix, ground) { this.frame = matrix; this.ground = ground; return this; }
  base() { return new THREE.Vector3().setFromMatrixPosition(this.frame).y; }
  add(geo, color, o = {}) {
    if (!geo) return;
    if (Array.isArray(geo)) { for (const g of geo) this.add(g, color, o); return; }
    geo.applyMatrix4(this.frame);
    const g = normalise(geo);
    const b0 = this.base();
    paint(g, color, { ground: this.ground, ...o, bands: o.bands?.map(b => ({ ...b, y0: b.y0 + b0, y1: b.y1 + b0 })) });
    this.geos.push(g);
  }
  merged() {
    if (!this.geos.length) return null;
    const m = BufferGeometryUtils.mergeGeometries(this.geos, false);
    for (const g of this.geos) g.dispose();
    this.geos = [];
    return m;
  }
  bake(material, name) {
    const geo = this.merged();
    if (!geo) return null;
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    return mesh;
  }
}

/* =========================================================== shape helpers */

const Y = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const T = (x, y, z, ry = 0) => new THREE.Matrix4().compose(
  V(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, ry), V(1, 1, 1)
);

/** A cylinder standing on y = 0. */
function cyl(r0, r1, h, segs = 20, open = false) {
  const g = new THREE.CylinderGeometry(r1, r0, h, segs, 1, open);
  g.translate(0, h / 2, 0);
  return g;
}

/** A box standing on y = 0. */
function slab(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return g;
}

/** A box centred at `p`, turned by `ry`. */
function blockAt(p, w, h, d, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(p.x, p.y, p.z);
  return g;
}

/** A prism of `sides` sides and radius r from a to b: a truss member, a rope, a pipe. */
function rod(a, b, r, sides = 4) {
  const len = a.distanceTo(b);
  if (len < 1e-3) return null;
  const g = new THREE.CylinderGeometry(r, r, len, sides, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(Y, b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1)));
  return g;
}

/** The frame of a member from a to b: its axis, the side and the up across it. */
function memberFrame(a, b, up = Y) {
  const axis = b.clone().sub(a);
  const L = axis.length();
  axis.normalize();
  const upv = Math.abs(axis.dot(up)) > 0.95 ? V(1, 0, 0) : up;
  const side = new THREE.Vector3().crossVectors(axis, upv).normalize();
  const vUp = new THREE.Vector3().crossVectors(side, axis).normalize();
  return { axis, L, side, vUp };
}

/** A box from a to b, `w` across (side) and `h` deep (up): a beam, a roof, a panel. */
function beam(a, b, w, h, up = Y) {
  const { axis, L, side, vUp } = memberFrame(a, b, up);
  const g = new THREE.BoxGeometry(L, h, w);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(axis, vUp, side).setPosition(a.clone().add(b).multiplyScalar(0.5)));
  return g;
}

/**
 * A box lattice from a to b: four chords, a frame and a diagonal on every
 * face at every bay, tapering from w0 x h0 to w1 x h1. A boom, a mast, a
 * gallery, a crane — at two hundred metres it is the lacing that makes them
 * read as steel rather than as a stick.
 */
function lattice(a, b, { w0, h0, w1 = w0, h1 = h0, bays = 8, chord = 0.3, lace = 0.15, up = Y }) {
  const { axis, L, side, vUp } = memberFrame(a, b, up);
  const corner = (k, t) => {
    const sx = k === 0 || k === 3 ? -1 : 1, sy = k < 2 ? -1 : 1;
    return a.clone().addScaledVector(axis, L * t)
      .addScaledVector(side, sx * lerp(w0, w1, t) / 2)
      .addScaledVector(vUp, sy * lerp(h0, h1, t) / 2);
  };
  const out = [];
  for (let k = 0; k < 4; k++) out.push(rod(corner(k, 0), corner(k, 1), chord));
  for (let i = 0; i <= bays; i++) {
    const t = i / bays;
    for (let k = 0; k < 4; k++) out.push(rod(corner(k, t), corner((k + 1) % 4, t), lace));
    if (i === bays) break;
    const t1 = (i + 1) / bays;
    for (let k = 0; k < 4; k++) {
      const flip = (i + k) % 2 === 0;
      out.push(rod(corner(k, flip ? t : t1), corner((k + 1) % 4, flip ? t1 : t), lace));
    }
  }
  return out;
}

/** A planar Warren truss from a to b, `h` deep along `up`: two chords and a zigzag. */
function truss2(a, b, { h0, h1 = h0, n = 6, chord = 0.25, lace = 0.12, up = Y }) {
  const { axis, L, vUp } = memberFrame(a, b, up);
  const p = (s, t) => a.clone().addScaledVector(axis, L * t).addScaledVector(vUp, s * lerp(h0, h1, t) / 2);
  const out = [rod(p(-1, 0), p(-1, 1), chord), rod(p(1, 0), p(1, 1), chord)];
  for (let i = 0; i < n; i++) {
    const s = i % 2 ? 1 : -1;
    out.push(rod(p(s, i / n), p(-s, (i + 1) / n), lace));
  }
  return out;
}

/** A straight run of pipe through `pts`, with a knuckle at every bend. */
function pipe(pts, r, sides = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) out.push(rod(pts[i], pts[i + 1], r, sides));
  for (let i = 1; i < pts.length - 1; i++) {
    const s = new THREE.SphereGeometry(r * 1.05, sides, 4);
    s.translate(pts[i].x, pts[i].y, pts[i].z);
    out.push(s);
  }
  return out;
}

/** A handrail round a closed polygon at height y: top rail, knee rail, posts. */
function rail(pts, y, { post = 3.5, r = 0.07 } = {}) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    out.push(rod(V(a.x, y + 1.1, a.z), V(b.x, y + 1.1, b.z), r, 3));
    out.push(rod(V(a.x, y + 0.55, a.z), V(b.x, y + 0.55, b.z), r * 0.8, 3));
    const L = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.round(L / post));
    for (let j = 0; j < n; j++) {
      const t = j / n;
      out.push(rod(V(lerp(a.x, b.x, t), y, lerp(a.z, b.z, t)), V(lerp(a.x, b.x, t), y + 1.1, lerp(a.z, b.z, t)), r * 0.8, 3));
    }
  }
  return out;
}

/** A square as four corners, for rails. */
const square = (hx, hz, cx = 0, cz = 0) => [V(cx - hx, 0, cz - hz), V(cx + hx, 0, cz - hz), V(cx + hx, 0, cz + hz), V(cx - hx, 0, cz + hz)];

/** The ground under a footprint: the lowest of a ring of samples, so nothing floats. */
function footing(heightAt, x, z, r) {
  let low = heightAt(x, z);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    low = Math.min(low, heightAt(x + Math.cos(a) * r, z + Math.sin(a) * r));
  }
  return low;
}

/** A small lamp body (the lit part of a literal lamp), in world space. */
function lampBody(p, r) {
  const g = new THREE.IcosahedronGeometry(r, 0);
  g.translate(p.x, p.y, p.z);
  return g;
}

/* ============================================================== the works */

/**
 * A chimney: tapered, banded, collared, with two platforms, a caged ladder,
 * a breeching duct at its foot and a black mouth. Returns the mouth.
 */
function stack(K, x, z, { h, r0, r1, yaw = 0, seed, broken = false, brick = false, marked = false, lamps = false }) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, r0 * 2.2) - 1.5;
  B.at(T(x, g0, z, yaw), g0 + 1.5);
  const rAt = y => lerp(r0, r1, y / h);
  const bands = [{ y0: h - 3.5, y1: h + 2, c: PAL.soot }];
  if (marked) {
    const band = h * 0.045;
    for (let i = 0; i < 4; i++) bands.push({ y0: h - 3.5 - band * (i + 1), y1: h - 3.5 - band * i, c: i % 2 ? PAL.paintLt : PAL.oxideLt });
  }
  const segs = Math.round(22 * q) + 2;
  B.add(cyl(r0, r1, h, segs), brick ? PAL.brick : PAL.steel, { streak: 0.45, rust: brick ? 0.12 : 0.4, seed, bands });
  B.add(cyl(r0 * 1.8, r0 * 1.55, 6.5, 12), PAL.concrete, { seed });
  B.add(blockAt(V(r0 * 1.8 + 3.2, 3.6, 0), 7, 4.4, 3.8), PAL.steel, { seed, rust: 0.5 });
  if (!brick) {
    for (let y = 11; y < h - 4; y += 9) {
      const r = rAt(y) + 0.16;
      B.add(cyl(r, r, 0.55, segs, true).translate(0, y, 0), PAL.soot, { seed });
    }
  }
  for (const py of [h * 0.6, h - 4.5]) {
    const pr = rAt(py);
    B.add(cyl(pr + 1.5, pr + 1.5, 0.4, segs).translate(0, py, 0), PAL.soot, { seed });
    if (q > 0.7) {
      const ring = new THREE.TorusGeometry(pr + 1.45, 0.07, 3, segs);
      ring.rotateX(Math.PI / 2);
      ring.translate(0, py + 1.1, 0);
      B.add(ring, PAL.soot, { dust: 0 });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      B.add(rod(V(Math.cos(a) * (pr + 1.3), py, Math.sin(a) * (pr + 1.3)), V(Math.cos(a) * pr, py - 3.2, Math.sin(a) * pr), 0.12), PAL.soot);
    }
  }
  // The caged ladder up the flank away from the duct: a strip with depth.
  B.add(beam(V(-(rAt(6) + 0.55), 6, 0), V(-(rAt(h - 4.5) + 0.55), h - 3.5, 0), 0.9, 0.75), PAL.soot, { dust: 0 });
  if (!broken) {
    const mouth = new THREE.CircleGeometry(r1 * 0.92, 14);
    mouth.rotateX(-Math.PI / 2);
    mouth.translate(0, h - 0.4, 0);
    B.add(mouth, PAL.glass, { dust: 0, rust: 0 });
  } else {
    // The crown has come off: a ragged lip of what is left.
    const r = rng(seed * 101);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = slab(1.5, 0.6 + r() * 3.2, 0.45);
      s.rotateY(-a + Math.PI / 2);
      s.translate(Math.cos(a) * r1, h - 0.3, Math.sin(a) * r1);
      B.add(s, PAL.soot);
    }
  }
  if (lamps) {
    for (const [ly, n] of [[h + 0.6, 3], [h * 0.6 + 1.2, 3]]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.5;
        const pr = rAt(Math.min(ly, h)) + (ly > h ? -0.2 : 1.4);
        const p = V(Math.cos(a) * pr, ly, Math.sin(a) * pr).applyMatrix4(B.frame);
        K.red.push(lampBody(p, 0.7));
      }
    }
  }
  return { x, y: g0 + h + 0.8, z };
}

/** A hot-blast stove: a tall domed shell with a ring platform, a cage and its two stubs. */
function stove(K, x, z, { r, h, yaw, seed }) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, r + 1) - 1.5;
  B.at(T(x, g0, z, yaw), g0 + 1.5);
  const segs = Math.round(20 * q) + 4;
  B.add(cyl(r + 1.2, r + 1.2, 3.5, segs), PAL.concrete, { seed });
  B.add(cyl(r, r, h, segs).translate(0, 3, 0), PAL.steel, {
    seed, rust: 0.45, streak: 0.4, bands: [{ y0: 0, y1: 7, c: PAL.soot }]
  });
  const dome = new THREE.SphereGeometry(r, segs, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.translate(0, h + 3, 0);
  B.add(dome, PAL.steel, { seed, rust: 0.5 });
  B.add(cyl(0.9, 0.9, 2.2, 8).translate(0, h + 3 + r - 0.4, 0), PAL.soot);
  for (let y = 9; y < h; y += 6.5) B.add(cyl(r + 0.14, r + 0.14, 0.45, segs, true).translate(0, y, 0), PAL.soot, { seed });
  const py = h + 1.5;
  B.add(cyl(r + 1.5, r + 1.5, 0.35, segs).translate(0, py, 0), PAL.soot);
  if (q > 0.7) {
    const ring = new THREE.TorusGeometry(r + 1.45, 0.07, 3, segs);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, py + 1.1, 0);
    B.add(ring, PAL.soot, { dust: 0 });
  }
  B.add(beam(V(0, 4, r + 0.55), V(0, py, r + 0.55), 0.85, 0.7, V(1, 0, 0)), PAL.soot, { dust: 0 });
  // Hot blast out toward the main (local -x), fuel gas in from behind (+x).
  B.add(rod(V(-r + 0.3, 14, 0), V(-r - 4.2, 14, 0), 1.05, 10), PAL.steel, { rust: 0.5 });
  B.add(blockAt(V(-r - 1.8, 14, 0), 1.4, 3.2, 3.2), PAL.soot);
  B.add(rod(V(r - 0.3, 8, 0), V(r + 3.2, 8, 0), 0.8, 8), PAL.steel, { rust: 0.5 });
}

/**
 * The blast furnace in its structural tower: hearth, bosh and stack lathed as
 * one profile, the bustle pipe and tuyere stocks round the hearth, platforms,
 * the top house, four uptakes gathered into the downcomer, and the bleeders.
 */
function blastFurnace(K, x, z, yaw) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, 13) - 1.5;
  B.at(T(x, g0, z, yaw), g0 + 1.5);
  const segs = Math.round(26 * q) + 6;
  B.add(slab(25, 3, 25).translate(0, -1, 0), PAL.concrete, { seed: 1 });
  const prof = [[0, 0], [7.6, 0], [7.6, 9.5], [8.7, 14], [8.3, 16.5], [6.1, 33.5], [5.6, 34.5], [3.4, 39], [3.0, 40], [0.01, 40]]
    .map(([r, y]) => new THREE.Vector2(r, y + 1.5));
  B.add(new THREE.LatheGeometry(prof, segs), PAL.steel, {
    seed: 2, rust: 0.45, streak: 0.45,
    bands: [{ y0: 0, y1: 11, c: PAL.soot }, { y0: 35, y1: 42, c: PAL.soot }]
  });
  for (let y = 18.5; y < 34.5; y += 3.3) {
    const r = lerp(8.3, 6.1, (y - 18) / 17) + 0.14;
    B.add(cyl(r, r, 0.5, segs, true).translate(0, y, 0), PAL.soot, { dust: 0 });
  }
  const bustle = new THREE.TorusGeometry(10.5, 1.15, 6, Math.round(28 * q) + 4);
  bustle.rotateX(Math.PI / 2);
  bustle.translate(0, 13.5, 0);
  B.add(bustle, PAL.steel, { rust: 0.5 });
  const nt = q > 0.7 ? 16 : 10;
  for (let i = 0; i < nt; i++) {
    const a = (i / nt) * Math.PI * 2;
    B.add(pipe([V(Math.cos(a) * 10.5, 12.6, Math.sin(a) * 10.5), V(Math.cos(a) * 9.4, 9.5, Math.sin(a) * 9.4), V(Math.cos(a) * 7.8, 9.0, Math.sin(a) * 7.8)], 0.28, 4), PAL.soot);
  }

  // The structural tower: four lattice columns, braced, carrying the decks.
  const cx = 10.8, H = 49;
  const lv = [0, 15, 27, 40.5, H];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    B.add(lattice(V(sx * cx, -1.5, sz * cx), V(sx * cx, H, sz * cx), { w0: 1.6, h0: 1.6, bays: Math.round(18 * q) + 2, chord: 0.3, lace: 0.12 }), PAL.paint, { rust: 0.35 });
  }
  for (let li = 0; li < lv.length - 1; li++) {
    const y0 = lv[li], y1 = lv[li + 1];
    for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      const p0 = V(a[0] * cx, y0, a[1] * cx), p1 = V(b[0] * cx, y1, b[1] * cx);
      const p2 = V(b[0] * cx, y0, b[1] * cx), p3 = V(a[0] * cx, y1, a[1] * cx);
      B.add(rod(p0, p1, 0.2), PAL.paint);
      B.add(rod(p2, p3, 0.2), PAL.paint);
      B.add(rod(p3, p1, 0.26), PAL.paint);
    }
  }
  // Walkway decks round the shell at 15 and 27, a deck at 40.5, the top deck.
  for (const y of [15, 27, 40.5]) {
    for (const s of [-1, 1]) {
      B.add(slab(22.8, 0.35, 4.2).translate(0, y, s * (cx - 2.1)), PAL.soot, { dust: 0 });
      B.add(slab(4.2, 0.35, 14.4).translate(s * (cx - 2.1), y, 0), PAL.soot, { dust: 0 });
    }
    if (q > 0.7) B.add(rail(square(cx + 0.4, cx + 0.4), y + 0.35), PAL.soot, { dust: 0 });
  }
  B.add(slab(23.6, 0.45, 23.6).translate(0, H, 0), PAL.soot, { dust: 0 });
  if (q > 0.7) B.add(rail(square(11.6, 11.6), H + 0.45), PAL.soot, { dust: 0 });
  // Top house: the receiving hopper and the charging gear over the bells.
  B.add(blockAt(V(0, 44.5, 0), 5.2, 7, 5.2), PAL.paint, { rust: 0.4 });
  B.add(slab(8, 5.5, 7).translate(-1.5, H + 0.45, 1), PAL.paint, { rust: 0.4, bands: [{ y0: H + 3.8, y1: H + 4.6, c: PAL.glass }] });
  B.add(cyl(0.4, 0.4, 6, 6).translate(3.5, H + 5.9, -3), PAL.soot);
  // Uptakes, offtakes, the crossover and the bleeders.
  const up = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [sx, sz] of up) {
    const foot = V(sx * 2.2, 39.5, sz * 2.2), head = V(sx * 3.0, 57, sz * 3.0);
    B.add(rod(foot, head, 1.0, 10), PAL.steel, { rust: 0.4 });
    B.add(rod(head, V(0, 60, sz * 3.3), 0.95, 10), PAL.steel, { rust: 0.4 });
    B.add(rod(head, head.clone().setY(64), 0.6, 8), PAL.soot);
    B.add(cyl(1.0, 0.9, 0.9, 8).translate(head.x, 64, head.z), PAL.soot);
  }
  B.add(rod(V(0, 60, -3.4), V(0, 60, 3.4), 1.0, 10), PAL.steel);
  // Down the downcomer to the dust catcher off the +b flank.
  const dc = V(2, 0, 18);
  B.add(pipe([V(0, 60, 3.4), V(0.8, 57, 7), V(dc.x, 29, dc.z)], 1.45, 10), PAL.steel, { rust: 0.45, streak: 0.4 });
  B.add(cyl(4.6, 4.6, 12, segs).translate(dc.x, 13, dc.z), PAL.steel, { rust: 0.5, streak: 0.45 });
  const cone = new THREE.CylinderGeometry(4.6, 1.0, 6, segs, 1, true);
  cone.translate(dc.x, 10, dc.z);
  B.add(cone, PAL.steel, { rust: 0.5 });
  const dd = new THREE.SphereGeometry(4.6, segs, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  dd.scale(1, 0.55, 1);
  dd.translate(dc.x, 25, dc.z);
  B.add(dd, PAL.steel, { rust: 0.5 });
  for (const [sx, sz] of up) {
    B.add(rod(V(dc.x + sx * 3.9, -1, dc.z + sz * 3.9), V(dc.x + sx * 3.9, 15, dc.z + sz * 3.9), 0.4, 6), PAL.paint);
    B.add(rod(V(dc.x + sx * 3.9, 1, dc.z + sz * 3.9), V(dc.x - sx * 3.9, 11, dc.z + sz * 3.9), 0.16), PAL.paint);
  }
  return { dc };
}

/** A shed with a sawtooth roof across its length, pilasters, doors, a clerestory. */
function shed(K, x, z, { len, dep, h, yaw, teeth, seed, lit = [] }) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, Math.max(len, dep) / 2) - 2;
  B.at(T(x, g0, z, yaw), g0 + 2);
  const hh = h + 2;
  B.add(slab(dep, hh, len), PAL.paint, {
    seed, streak: 0.45, rust: 0.35,
    bands: [{ y0: -3, y1: 6.5, c: PAL.concrete }, { y0: hh * 0.66, y1: hh * 0.76, c: PAL.glass }]
  });
  // Pilasters down the face the quarry sees (local -x), and down the back.
  for (let zc = -len / 2; zc <= len / 2 + 0.01; zc += len / Math.round(len / 5.5)) {
    for (const s of [-1, 1]) B.add(blockAt(V(s * (dep / 2 + 0.25), hh / 2, zc), 0.5, hh, 0.7), PAL.soot, { rust: 0.4 });
  }
  // Doors, black, big enough for a ladle car.
  for (const zc of [-len * 0.22, len * 0.28]) {
    const d = new THREE.PlaneGeometry(Math.min(7, len * 0.14), hh * 0.5);
    d.rotateY(-Math.PI / 2);
    d.translate(-dep / 2 - 0.3, hh * 0.25 + 0.01, zc);
    B.add(d, PAL.glass, { rust: 0 });
  }
  // A few clerestory lights still burning: literal sodium lamps behind glass.
  const tw = len / teeth, th = 4.2;
  for (const zc of lit) {
    const w = new THREE.PlaneGeometry(2.6, hh * 0.08);
    w.rotateY(-Math.PI / 2);
    w.translate(-dep / 2 - 0.1, hh * 0.71, zc);
    w.applyMatrix4(B.frame);
    K.sodium.push(w);
  }
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(tw, 0), new THREE.Vector2(0, th)]);
  const r = rng(seed * 313);
  for (let i = 0; i < teeth; i++) {
    const p = new THREE.ExtrudeGeometry(tri, { depth: dep, bevelEnabled: false });
    p.rotateY(-Math.PI / 2);
    p.translate(dep / 2, hh, -len / 2 + i * tw);
    B.add(p, PAL.steel, { seed, rust: 0.5, dust: 0 });
    const gl = new THREE.PlaneGeometry(dep * 0.94, th * 0.72);
    gl.rotateY(Math.PI);
    gl.translate(0, hh + th * 0.42, -len / 2 + i * tw - 0.06);
    B.add(gl, PAL.glass, { dust: 0, rust: 0 });
    // Ventilators along the ridge, one in three gone.
    if (r() > 0.33 && q > 0.7) B.add(blockAt(V(0, hh + th + 0.6, -len / 2 + i * tw + 0.8), 2.4, 1.2, 1.4), PAL.soot, { dust: 0 });
  }
}

/** A gasholder: water tank, bell, and the lattice guide frame round it. */
function gasholder(K, x, z, { r, h, yaw, seed }) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, r + 2) - 1.5;
  B.at(T(x, g0, z, yaw), g0 + 1.5);
  const segs = Math.round(30 * q) + 6;
  B.add(cyl(r + 0.6, r + 0.6, 11.5, segs), PAL.paint, { seed, streak: 0.4, rust: 0.4 });
  B.add(cyl(r, r, h - 11, segs).translate(0, 11.5, 0), PAL.oxide, { seed, streak: 0.5, rust: 0.35 });
  const crown = new THREE.SphereGeometry(r, segs, 4, 0, Math.PI * 2, 0, 0.45);
  crown.translate(0, h + 0.5 - r * Math.cos(0.45), 0);
  B.add(crown, PAL.oxide, { seed, rust: 0.4 });
  const n = q > 0.7 ? 12 : 8, H = h + 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const rm = r + 2.1;
    B.add(truss2(V(c * rm, -1, s * rm), V(c * rm, H, s * rm), { h0: 2.2, h1: 1.2, n: Math.round(12 * q) + 2, chord: 0.24, lace: 0.1, up: V(c, 0, s) }), PAL.paint, { rust: 0.3 });
  }
  for (const y of [h * 0.55, h + 1.5, H]) {
    const girder = new THREE.TorusGeometry(r + 2.1, 0.4, 4, segs);
    girder.rotateX(Math.PI / 2);
    girder.translate(0, y, 0);
    B.add(girder, PAL.paint, { dust: 0 });
  }
}

/** A flat-roofed storage tank with a wind girder and a stair round the shell. */
function storageTank(K, x, z, { r, h, seed }) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, r) - 1;
  B.at(T(x, g0, z, seed), g0 + 1);
  const segs = Math.round(30 * q) + 6;
  B.add(cyl(r, r, h, segs), PAL.paint, { seed, streak: 0.5, rust: 0.45 });
  const roof = new THREE.ConeGeometry(r, 1.8, segs, 1, true);
  roof.translate(0, h + 0.9, 0);
  B.add(roof, PAL.steel, { seed });
  B.add(cyl(r + 0.8, r + 0.8, 0.4, segs).translate(0, h - 1.4, 0), PAL.soot);
  for (let i = 0; i < 6; i++) {
    const a0 = i * 0.24 + seed, a1 = a0 + 0.24;
    B.add(rod(V(Math.cos(a0) * (r + 0.6), (i / 6) * h, Math.sin(a0) * (r + 0.6)), V(Math.cos(a1) * (r + 0.6), ((i + 1) / 6) * h, Math.sin(a1) * (r + 0.6)), 0.35), PAL.soot);
  }
}

/** A tower crane left slewed, its counterweight still up, the hook block hanging. */
function crane(K, x, z, { h, jib, ry }) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, 4) - 1;
  B.at(T(x, g0, z, ry), g0 + 1);
  B.add(slab(7, 2.5, 7), PAL.concrete);
  B.add(lattice(V(0, 1.5, 0), V(0, h, 0), { w0: 2.4, h0: 2.4, bays: Math.round(h / (q > 0.7 ? 2.6 : 4.5)), chord: 0.26, lace: 0.1 }), PAL.oxide, { rust: 0.35 });
  B.add(blockAt(V(0, h + 1, 0), 3.2, 2, 3.2), PAL.oxide);
  B.add(lattice(V(1.6, h + 1, 0), V(1.6 + jib, h + 1.3, 0), { w0: 1.9, h0: 2.1, w1: 1.1, h1: 1.1, bays: Math.round(jib / (q > 0.7 ? 2.8 : 5)), chord: 0.2, lace: 0.08 }), PAL.oxide, { rust: 0.3 });
  B.add(lattice(V(-1.6, h + 1, 0), V(-15, h + 1, 0), { w0: 2.1, h0: 1.4, bays: 5, chord: 0.24, lace: 0.1 }), PAL.oxide);
  B.add(blockAt(V(-12.5, h - 0.8, 0), 3.6, 3.8, 2.8), PAL.concrete);
  B.add(lattice(V(0, h + 2, 0), V(0, h + 10, 0), { w0: 1.8, h0: 1.8, w1: 0.6, h1: 0.6, bays: 3, chord: 0.2, lace: 0.08 }), PAL.oxide);
  B.add(rod(V(0, h + 10, 0), V(1.6 + jib * 0.65, h + 2.3, 0), 0.11, 3), PAL.soot);
  B.add(rod(V(0, h + 10, 0), V(-14, h + 1.8, 0), 0.11, 3), PAL.soot);
  B.add(blockAt(V(2.9, h - 1, 1.7), 2.2, 2.4, 1.8), PAL.paintLt, { bands: [{ y0: h - 0.6, y1: h, c: PAL.glass }] });
  const hx = 1.6 + jib * 0.78;
  B.add(rod(V(hx, h + 0.4, 0), V(hx, h * 0.42, 0), 0.07, 3), PAL.soot, { dust: 0 });
  B.add(blockAt(V(hx, h * 0.42 - 0.9, 0), 1.1, 1.8, 0.8), PAL.soot);
  K.red.push(lampBody(V(0, h + 10.4, 0).applyMatrix4(B.frame), 0.55));
  K.red.push(lampBody(V(1.6 + jib, h + 2.2, 0).applyMatrix4(B.frame), 0.5));
}

/** A lattice transfer tower with a clad head house on top. */
function transferTower(K, x, z, { h, w, yaw, seed }) {
  const { B, q } = K;
  const g0 = footing(K.heightAt, x, z, w) - 1.5;
  B.at(T(x, g0, z, yaw), g0 + 1.5);
  const c = w / 2;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    B.add(lattice(V(sx * c, -1.5, sz * c), V(sx * c, h, sz * c), { w0: 1.1, h0: 1.1, bays: Math.round(h / (q > 0.7 ? 2.2 : 4)), chord: 0.22, lace: 0.09 }), PAL.paint, { rust: 0.35 });
  }
  const nl = Math.max(2, Math.round(h / 7));
  for (let i = 0; i < nl; i++) {
    const y0 = (i / nl) * h, y1 = ((i + 1) / nl) * h;
    for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      B.add(rod(V(a[0] * c, y0, a[1] * c), V(b[0] * c, y1, b[1] * c), 0.16), PAL.paint);
      B.add(rod(V(a[0] * c, y1, a[1] * c), V(b[0] * c, y1, b[1] * c), 0.2), PAL.paint);
    }
  }
  B.add(slab(w + 2.4, 7, w + 2.4).translate(0, h, 0), PAL.paint, {
    seed, rust: 0.45, streak: 0.4, bands: [{ y0: h + 4.2, y1: h + 5.1, c: PAL.glass }]
  });
  const roof = new THREE.ConeGeometry((w + 3) * 0.72, 2.2, 4, 1);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, h + 8.1, 0);
  B.add(roof, PAL.steel, { dust: 0 });
  return g0;
}

/**
 * The conveyor gallery from p0 to p1 (world): a box truss with a roof and
 * cladding (some sheets gone), carried on braced trestles where it rides
 * high. Everything is authored in world space, the trestle feet on the
 * ground under each leg.
 */
function gallery(K, p0, p1, { w = 4.2, h = 4, bay = 4, span = 15 }) {
  const { B, q, heightAt } = K;
  B.at(new THREE.Matrix4(), heightAt((p0.x + p1.x) / 2, (p0.z + p1.z) / 2));
  const { axis, L, side, vUp } = memberFrame(p0, p1);
  const bays = Math.round(L / (q > 0.7 ? bay : bay * 1.8));
  B.add(lattice(p0, p1, { w0: w, h0: h, bays, chord: 0.22, lace: 0.09 }), PAL.paint, { rust: 0.4, dust: 0 });
  const lift = vUp.clone().multiplyScalar(h / 2 + 0.18);
  B.add(beam(p0.clone().add(lift), p1.clone().add(lift), w + 0.8, 0.25), PAL.steel, { rust: 0.5, dust: 0 });
  const r = rng(771);
  for (let i = 0; i < bays; i++) {
    const a = p0.clone().addScaledVector(axis, L * i / bays), b = p0.clone().addScaledVector(axis, L * (i + 1) / bays);
    for (const s of [-1, 1]) {
      if (r() < 0.22) continue;
      const off = side.clone().multiplyScalar(s * (w / 2 + 0.06)).addScaledVector(vUp, h * 0.1);
      B.add(beam(a.clone().add(off), b.clone().add(off).addScaledVector(axis, -0.15), 0.1, h * 0.75), r() < 0.5 ? PAL.paint : PAL.paintLt, { rust: 0.5, dust: 0 });
    }
  }
  // Trestles: where the underside rides more than five metres over the ground.
  const flat = V(axis.x, 0, axis.z).normalize();
  const across = V(-flat.z, 0, flat.x);
  const n = Math.floor(L / span);
  for (let i = 1; i < n; i++) {
    const c = p0.clone().addScaledVector(axis, (L * i) / n);
    const under = c.y - h / 2 - 0.2;
    const gc = heightAt(c.x, c.z);
    if (under - gc < 5) continue;
    const legs = [];
    for (const sa of [-1, 1]) {
      for (const sb of [-1, 1]) {
        const top = c.clone().addScaledVector(across, sb * (w / 2)).addScaledVector(flat, sa * 1.3).setY(under);
        const foot = c.clone().addScaledVector(across, sb * (w / 2 + (under - gc) * 0.09)).addScaledVector(flat, sa * 1.6);
        foot.y = heightAt(foot.x, foot.z) - 1.5;
        legs.push({ top, foot, sa, sb });
        B.add(rod(foot, top, 0.28), PAL.paint, { rust: 0.35 });
        B.add(slab(1.4, 1.8, 1.4).translate(foot.x, foot.y - 0.2, foot.z), PAL.concrete);
      }
    }
    // Horizontal ties and X braces across and along, every seven metres or so.
    const lv = Math.max(1, Math.round((under - gc) / 7));
    const at = (leg, t) => leg.foot.clone().lerp(leg.top, t);
    for (let k = 0; k < lv; k++) {
      const t0 = k / lv, t1 = (k + 1) / lv;
      for (const [i0, i1] of [[0, 1], [2, 3], [0, 2], [1, 3]]) {
        B.add(rod(at(legs[i0], t1), at(legs[i1], t1), 0.14), PAL.paint);
        B.add(rod(at(legs[i0], t0), at(legs[i1], t1), 0.12), PAL.paint);
        if (q > 0.7) B.add(rod(at(legs[i1], t0), at(legs[i0], t1), 0.12), PAL.paint);
      }
    }
  }
}

/** A spoil heap of slag, tipped from the casthouse side. */
function heap(K, x, z, { r, h, seed }) {
  const { B } = K;
  const g0 = footing(K.heightAt, x, z, r) - 1;
  B.at(T(x, g0, z, seed), g0 + 1);
  const g = new THREE.ConeGeometry(r, h, 18, 4);
  g.translate(0, h / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
    const k = 1 + noise2(vx * 0.25 + seed, vz * 0.25) * 0.35;
    p.setXYZ(i, vx * k, Math.max(0, vy * (0.85 + 0.3 * noise2(vx * 0.2, vz * 0.2 + seed)) - 0.8), vz * k);
  }
  B.add(g, PAL.soot, { rust: 0.3, dust: 1.5, seed });
}

/* ============================================================ the dragline */

/**
 * The walking dragline in its own frame: +x along the boom, the plain at
 * y = 0. Returns the boom point and where the bucket hangs (local).
 */
function dragline(B, q, bucketGround) {
  const r = rng(0xd7a6);
  const o = { seed: 4.4, rust: 0.4 };
  const segs = Math.round(36 * q) + 6;

  // The tub, sunk into the plain, and the walking shoes either side.
  B.add(cyl(16.5, 16.5, 3.6, segs).translate(0, -0.8, 0), PAL.soot, { ...o, rust: 0.5 });
  for (const s of [-1, 1]) {
    const zc = s * 21;
    B.add(blockAt(V(2, 0.7, zc), 36, 3.4, 7.4), PAL.soot, { ...o, rust: 0.55 });
    for (let i = 0; i < 11; i++) B.add(blockAt(V(-15 + i * 3.4, 2.7, zc), 0.6, 0.8, 7.2), PAL.soot, o);
    const cam = new THREE.CylinderGeometry(4.2, 4.2, 2.6, Math.round(16 * q) + 4);
    cam.rotateX(Math.PI / 2);
    cam.translate(2, 9.2, s * 17.6);
    B.add(cam, PAL.oxide, o);
    B.add(rod(V(-7, 2.4, zc), V(2, 9.2, s * 18.2), 1.0, 6), PAL.oxide, o);
    B.add(rod(V(11, 2.4, zc), V(2, 9.2, s * 18.2), 1.0, 6), PAL.oxide, o);
  }

  // The revolving deck, the machinery house (dark inside, clad in panels with
  // some gone and one hanging), the roof house, the cab and the counterweight.
  B.add(blockAt(V(-7, 4.5, 0), 52, 3.2, 32), PAL.soot, { ...o, rust: 0.5 });
  const hx0 = -28, hx1 = 12, hy0 = 6.1, hy1 = 20.5, hz = 13;
  B.add(blockAt(V((hx0 + hx1) / 2, (hy0 + hy1) / 2, 0), hx1 - hx0 - 0.6, hy1 - hy0 - 0.3, 2 * hz - 0.6), PAL.glass, { rust: 0, dust: 0 });
  const rows = 4, pw = q > 0.7 ? 4 : 8;
  const ph = (hy1 - hy0) / rows;
  const walls = [
    { n: Math.round((hx1 - hx0) / pw), at: (t, y) => V(lerp(hx0, hx1, t), y, hz + 0.15), w: (hx1 - hx0), ry: 0 },
    { n: Math.round((hx1 - hx0) / pw), at: (t, y) => V(lerp(hx0, hx1, t), y, -hz - 0.15), w: (hx1 - hx0), ry: 0 },
    { n: Math.round((2 * hz) / pw), at: (t, y) => V(hx0 - 0.15, y, lerp(-hz, hz, t)), w: 2 * hz, ry: Math.PI / 2 },
    { n: Math.round((2 * hz) / pw), at: (t, y) => V(hx1 + 0.15, y, lerp(-hz, hz, t)), w: 2 * hz, ry: Math.PI / 2 }
  ];
  for (const wl of walls) {
    const cw = wl.w / wl.n;
    for (let i = 0; i < wl.n; i++) {
      for (let j = 0; j < rows; j++) {
        const roll = r();
        if (roll < 0.1) continue;
        const p = wl.at((i + 0.5) / wl.n, hy0 + (j + 0.5) * ph);
        const g = new THREE.BoxGeometry(cw - 0.25, ph - 0.25, 0.3);
        if (roll > 0.985 && j < rows - 1) {
          // A sheet hanging off its last fixing.
          g.translate(0, -ph / 2, 0);
          g.rotateZ(0.5);
          g.translate(0, ph / 2 - 0.4, 0.35);
        }
        g.rotateY(wl.ry);
        g.translate(p.x, p.y, p.z);
        B.add(g, j === rows - 1 ? PAL.paintLt : PAL.paint, { ...o, dust: 2 });
      }
    }
  }
  B.add(blockAt(V((hx0 + hx1) / 2, hy1 + 0.3, 0), hx1 - hx0 + 1, 0.6, 2 * hz + 1), PAL.steel, { ...o, dust: 0 });
  B.add(blockAt(V(-15, hy1 + 3.3, 0), 18, 5.4, 15), PAL.paint, { ...o, bands: [{ y0: hy1 + 4.2, y1: hy1 + 5, c: PAL.glass }] });
  for (let i = 0; i < 4; i++) B.add(cyl(1.1, 0.9, 2.6, 8).translate(-24 + i * 3.4, hy1 + 0.6, 8.8), PAL.soot, { dust: 0 });
  B.add(beam(V(-2, hy1 + 1.4, -8), V(10, hy1 + 1.4, -8), 2, 2), PAL.steel, { dust: 0 });
  if (q > 0.7) B.add(rail(square((hx1 - hx0) / 2 + 0.3, hz + 0.3, (hx0 + hx1) / 2, 0), hy1 + 0.6, { post: 4 }), PAL.soot, { dust: 0 });
  B.add(blockAt(V(14.6, 12.6, -11.5), 5.2, 6, 6), PAL.paintLt, { ...o, bands: [{ y0: 13.2, y1: 15, c: PAL.glass }] });
  B.add(blockAt(V(17.3, 14.1, -11.5), 0.12, 1.8, 5.2), PAL.glass, { rust: 0, dust: 0 });
  B.add(blockAt(V(-33, 9, 0), 8, 9.6, 27), PAL.oxide, { ...o, rust: 0.6, streak: 0.5 });
  // A stair up the house flank, and a ladder up the tub.
  B.add(beam(V(8, 6.2, hz + 1.2), V(-8, hy1 + 0.6, hz + 1.2), 1.2, 0.5), PAL.soot, { dust: 0 });
  if (q > 0.7) B.add(beam(V(8, 7.3, hz + 1.8), V(-8, hy1 + 1.7, hz + 1.8), 0.1, 0.12), PAL.soot, { dust: 0 });
  B.add(beam(V(-10, -0.5, 16.8), V(-10, 3.2, 16.8), 0.8, 0.2, V(1, 0, 0)), PAL.soot);

  // The A-frame at the back of the house.
  const apex = s => V(-12, 41, s * 4);
  for (const s of [-1, 1]) {
    B.add(rod(V(-2, hy1, s * 11), apex(s), 0.9, 6), PAL.paint, o);
    B.add(rod(V(-24, hy1, s * 11), apex(s), 0.9, 6), PAL.paint, o);
    B.add(rod(V(-6.5, 31, s * 7.2), V(-17.5, 31, s * 7.2), 0.45, 6), PAL.paint, o);
  }
  B.add(rod(apex(-1).setZ(-5), apex(1).setZ(5), 0.9, 6), PAL.paint, o);

  // The mast, leaning forward over the boom from the front of the house.
  const mastFoot = V(15, 7, 0);
  const mastHead = V(15 + Math.cos(1.08) * 50, 7 + Math.sin(1.08) * 50, 0);
  B.add(lattice(mastFoot, mastHead, { w0: 7.5, h0: 3.2, w1: 3, h1: 2.4, bays: Math.round(13 * q) + 2, chord: 0.4, lace: 0.16 }), PAL.oxide, o);

  // The boom: ninety-six metres at thirty degrees.
  const pitch = THREE.MathUtils.degToRad(30), len = 96;
  const foot = V(18.5, 5.5, 0);
  const tip = V(foot.x + Math.cos(pitch) * len, foot.y + Math.sin(pitch) * len, 0);
  const boom = { w0: 9, h0: 7, w1: 3.4, h1: 3.2 };
  B.add(lattice(foot, tip, { ...boom, bays: Math.round(26 * q) + 4, chord: 0.5, lace: 0.2 }), PAL.oxide, { ...o, dust: 0 });
  const bf = memberFrame(foot, tip);
  const topChord = (t, s) => foot.clone().addScaledVector(bf.axis, len * t)
    .addScaledVector(bf.side, s * lerp(boom.w0, boom.w1, t) / 2)
    .addScaledVector(bf.vUp, lerp(boom.h0, boom.h1, t) / 2);
  // The boom point: head casting and the sheaves.
  B.add(blockAt(tip.clone().add(V(0.5, 0, 0)), 4, 4, 4.4), PAL.oxide, { ...o, dust: 0 });
  const sheave = new THREE.CylinderGeometry(2.8, 2.8, 1.6, Math.round(16 * q) + 4);
  sheave.rotateX(Math.PI / 2);
  sheave.translate(tip.x + 2.2, tip.y - 0.4, 0);
  B.add(sheave, PAL.soot, { dust: 0 });

  // Ropes: backstays mast head to A-frame, pendants mast head to the boom.
  for (const s of [-1, 1]) {
    for (const dz of [0, 0.7]) {
      const mh = mastHead.clone().setZ(s * (1.1 + dz));
      B.add(rod(mh, apex(s).add(V(0, 0.2, -s * dz)), 0.2, 3), PAL.soot, { dust: 0, rust: 0.1 });
      B.add(rod(mh, topChord(0.52, s * 0.8).add(V(0, 0, s * dz * 0.3)), 0.2, 3), PAL.soot, { dust: 0, rust: 0.1 });
      B.add(rod(mh, topChord(0.985, s * 0.9).add(V(0, 0, s * dz * 0.3)), 0.2, 3), PAL.soot, { dust: 0, rust: 0.1 });
    }
  }

  // The fairlead at the boom foot, and the drag ropes slack across the
  // plain from it out to where the bucket hangs.
  B.add(blockAt(V(19.5, 5.2, 0), 3.2, 3.6, 6), PAL.soot, o);
  const bucketY = bucketGround + 6;
  const bx = tip.x - 1.8;
  for (const s of [-1, 1]) {
    const pts = [V(20.5, 4.5, s * 1.2), V(40, bucketGround + 0.5, s * 1.4), V(bx - 20, bucketGround + 0.4, s * 1.6), V(bx - 5.5, bucketY + 1.0, s * 1.6)];
    B.add(pipe(pts, 0.22, 3), PAL.soot, { dust: 0.8, rust: 0.4 });
  }
  return { tip: V(tip.x + 2.2, tip.y - 0.4, 0), bucket: V(bx, bucketY, 0) };
}

/** The bucket and its hoist ropes, in the dragline's frame, hung from `pivot`. */
function bucket(B, pivot, at) {
  const o = { seed: 9.1, rust: 0.6, dust: 0 };
  const w = 6.4, d = 9, hgt = 4.6;
  const cx = at.x, cy = at.y;
  B.add(blockAt(V(cx, cy - hgt / 2 + 0.3, 0), d, 0.6, w), PAL.soot, o);
  for (const s of [-1, 1]) {
    const side = new THREE.Shape([new THREE.Vector2(-d / 2, -hgt / 2), new THREE.Vector2(d / 2, -hgt / 2), new THREE.Vector2(d / 2 - 1, hgt / 2), new THREE.Vector2(-d / 2 + 1.8, hgt / 2 - 0.4)]);
    const g = new THREE.ExtrudeGeometry(side, { depth: 0.5, bevelEnabled: false });
    g.translate(cx, cy, s * w / 2 - 0.25);
    B.add(g, PAL.rust, o);
  }
  B.add(blockAt(V(cx - d / 2 + 0.3, cy, 0), 0.6, hgt, w), PAL.rust, o);
  // The arch across the mouth, the teeth at the lip.
  B.add(rod(V(cx + 2.5, cy + hgt / 2 + 0.2, -w / 2), V(cx + 2.5, cy + hgt / 2 + 1.8, 0), 0.4, 6), PAL.soot, o);
  B.add(rod(V(cx + 2.5, cy + hgt / 2 + 1.8, 0), V(cx + 2.5, cy + hgt / 2 + 0.2, w / 2), 0.4, 6), PAL.soot, o);
  for (let i = 0; i < 5; i++) B.add(blockAt(V(cx + d / 2 + 0.5, cy - hgt / 2 + 0.5, -w / 2 + 0.7 + i * (w - 1.4) / 4), 1.4, 0.5, 0.5), PAL.soot, o);
  // Hoist chains to a spreader bar, and the hoist ropes up to the boom point.
  const bar = V(cx + 0.5, cy + hgt / 2 + 5, 0);
  B.add(rod(bar.clone().setZ(-w / 2 - 0.4), bar.clone().setZ(w / 2 + 0.4), 0.35, 6), PAL.soot, o);
  for (const s of [-1, 1]) {
    B.add(rod(bar.clone().setZ(s * (w / 2 + 0.2)), V(cx + 2.8, cy + hgt / 2 - 0.2, s * w / 2), 0.16, 3), PAL.soot, o);
    B.add(rod(bar.clone().setZ(s * 0.9), pivot.clone().setZ(s * 0.6), 0.2, 3), PAL.soot, o);
  }
}

/* =============================================================== pylons */

/**
 * A double-circuit lattice tower in its own frame (x across, arms along x;
 * z along the line), painted. Returns the geometry and its attachment points.
 */
function pylonGeometry(H, q) {
  const B = new Batch().at(new THREE.Matrix4(), 0);
  const yW = H * 0.58;
  const hw = y => (y < yW ? lerp(4.3, 1.35, y / yW) : lerp(1.35, 1.0, (y - yW) / (H - yW)));
  const lower = q > 0.7 ? [0, 6.2, 11.4, 15.2, 18.4] : [0, 8, 14];
  const levels = [-2, ...lower.slice(1).map(v => v * yW / 18.4), yW, H * 0.7, H * 0.83, H];
  const uniq = [...new Set(levels.map(v => +v.toFixed(3)))].sort((a, b) => a - b);
  const corner = (k, y) => {
    const sx = k === 0 || k === 3 ? -1 : 1, sz = k < 2 ? -1 : 1;
    const w = hw(Math.max(0, y));
    return V(sx * w, y, sz * w);
  };
  for (let i = 0; i < uniq.length - 1; i++) {
    const y0 = uniq[i], y1 = uniq[i + 1];
    for (let k = 0; k < 4; k++) {
      B.add(rod(corner(k, y0), corner(k, y1), 0.2), PAL.steel, { dust: 2.5 });
      const k1 = (k + 1) % 4;
      B.add(rod(corner(k, y1), corner(k1, y1), 0.1), PAL.steel, { dust: 2.5 });
      B.add(rod(corner(k, y0), corner(k1, y1), 0.08), PAL.steel, { dust: 2.5 });
      if (q > 0.7 && y1 <= yW + 0.01) B.add(rod(corner(k1, y0), corner(k, y1), 0.08), PAL.steel, { dust: 2.5 });
    }
  }
  for (let k = 0; k < 4; k++) {
    const c = corner(k, -1.2);
    B.add(slab(1.3, 1.4, 1.3).translate(c.x, -1.6, c.z), PAL.concrete, { dust: 2 });
  }
  // Three pairs of cross-arms, each a pyramid of three chords to its tip.
  const arms = [[H * 0.7, 6.4], [H * 0.83, 7.8], [H * 0.96, 6.4]];
  const attach = [];
  for (const [ya, span] of arms) {
    const w = hw(ya);
    for (const s of [-1, 1]) {
      const tip = V(s * span, ya, 0);
      B.add(rod(V(s * w, ya, -w), tip, 0.13), PAL.steel, { dust: 0 });
      B.add(rod(V(s * w, ya, w), tip, 0.13), PAL.steel, { dust: 0 });
      B.add(rod(V(s * w, ya + 2.2, 0), tip, 0.11), PAL.steel, { dust: 0 });
      const mid = V(s * lerp(w, span, 0.5), ya, 0);
      B.add(rod(mid, V(s * lerp(w, span, 0.5), ya + 1.1, 0), 0.07), PAL.steel, { dust: 0 });
      // The insulator string, and the conductor's clamp at its foot.
      B.add(rod(tip, tip.clone().add(V(0, -2.6, 0)), 0.16, 6), PAL.soot, { dust: 0, rust: 0 });
      attach.push(tip.clone().add(V(0, -2.7, 0)));
    }
  }
  // The earth peak.
  for (let k = 0; k < 4; k++) B.add(rod(corner(k, H), V(0, H + 3.6, 0), 0.1), PAL.steel, { dust: 0 });
  attach.push(V(0, H + 3.6, 0));
  return { geo: B.merged(), attach };
}

/** Resample a polyline into `n` stations, each with a heading. */
function lineStations(path, n) {
  const seg = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const L = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
    seg.push({ a: path[i], b: path[i + 1], L, s0: total });
    total += L;
  }
  const at = s => {
    s = Math.max(0, Math.min(total, s));
    const k = seg.find(g => s <= g.s0 + g.L + 1e-6) || seg[seg.length - 1];
    const t = (s - k.s0) / k.L;
    return { x: lerp(k.a[0], k.b[0], t), z: lerp(k.a[1], k.b[1], t) };
  };
  const out = [];
  for (let i = 0; i < n; i++) out.push({ s: (total * i) / (n - 1) });
  return { stations: out, at, total };
}

/* =================================================================== build */

export function buildLigarIndustry({ heightAt, t4, own = () => {} }) {
  const group = new THREE.Group();
  group.name = 'ligar-industry';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;

  const q = t4 ? 1 : 0.5;
  const works = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.25 });
  works.userData.noSalt = true;
  const RED = new THREE.Color('#ff3a1c');
  const redMat = new THREE.MeshBasicMaterial({ color: RED.clone() });
  const sodiumMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#b0702c'), side: THREE.DoubleSide });
  own(works, redMat, sodiumMat);
  const vents = [];
  const K = { B: new Batch(), q, heightAt, red: [], sodium: [] };

  /* ---- the smelter, on the first bench to the east-south-east ---- */
  {
    const beta = SMELTER.bearing;
    const u = { x: Math.cos(beta), z: Math.sin(beta) };
    const v = { x: -Math.sin(beta), z: Math.cos(beta) };
    const O = { x: u.x * SMELTER.dist, z: u.z * SMELTER.dist };
    const L = (a, b) => ({ x: O.x + a * u.x + b * v.x, z: O.z + a * u.z + b * v.z });
    const yaw = -beta; // local +x radial (a), local +z tangential (b)
    const gF = heightAt(O.x, O.z);
    const W = (a, y, b) => { const p = L(a, b); return V(p.x, y, p.z); };

    const f = L(0, 0);
    blastFurnace(K, f.x, f.z, yaw);
    const fg = footing(heightAt, f.x, f.z, 13) - 1.5; // the furnace frame's origin height

    // The stove row, and the hot-blast main they feed the bustle pipe through.
    const stoveB = [-18, -29, -40, -51];
    for (const [i, b] of stoveB.entries()) {
      const p = L(8, b);
      stove(K, p.x, p.z, { r: 4.6, h: 33, yaw, seed: 20 + i });
    }
    K.B.at(new THREE.Matrix4(), gF);
    const yHB = fg + 13.5;
    K.B.add(pipe([W(0, yHB, -10.5), W(0, yHB, -54)], 1.3, 10), PAL.steel, { rust: 0.5, dust: 0 });
    K.B.add(pipe([W(0, fg + 14 + 1.5 + 0.6, -54), W(0, yHB, -54)], 0.2, 3), PAL.soot);
    for (let b = -16; b >= -52; b -= 9) {
      const g = heightAt(L(0, b).x, L(0, b).z) - 1;
      K.B.add(rod(W(-1.1, g, b), W(-1.1, yHB - 1.3, b), 0.3, 4), PAL.paint);
      K.B.add(rod(W(1.1, g, b), W(1.1, yHB - 1.3, b), 0.3, 4), PAL.paint);
      K.B.add(rod(W(-1.4, yHB - 1.4, b), W(1.4, yHB - 1.4, b), 0.25, 4), PAL.paint);
    }
    // The gas main from the dust catcher round behind the stoves, on bents.
    const yGM = fg + 21;
    K.B.add(pipe([W(6.6, fg + 21, 18), W(15.5, yGM, 18), W(15.5, yGM, -54)], 1.1, 8), PAL.steel, { rust: 0.5, dust: 0 });
    for (const b of stoveB) K.B.add(pipe([W(15.5, yGM, b), W(15.5, fg + 9.5, b), W(12.2, fg + 9.5, b)], 0.75, 6), PAL.steel, { rust: 0.5, dust: 0 });
    for (let b = 14; b >= -52; b -= 11) {
      const g = heightAt(L(15.5, b).x, L(15.5, b).z) - 1;
      for (const s of [-1.6, 1.6]) K.B.add(rod(W(15.5 + s, g, b), W(15.5 + s, yGM - 1.2, b), 0.3, 4), PAL.paint);
      K.B.add(rod(W(13.6, yGM - 1.2, b), W(17.4, yGM - 1.2, b), 0.26, 4), PAL.paint);
      K.B.add(rod(W(13.9, g + 2, b), W(17.1, yGM - 1.5, b), 0.14), PAL.paint);
    }
    // The waste-gas flue along the ground from the stoves to the chimney.
    K.B.add(beam(W(20.5, fg + 3.2, -14), W(20.5, fg + 3.2, -36), 3.4, 5), PAL.brick, { rust: 0.2, dust: 2.5 });

    // The stacks: the stove chimney, marked and lit; two more still drawing;
    // one with its crown gone that has not drawn in years.
    const s1p = L(26, -34);
    vents.push({ ...stack(K, s1p.x, s1p.z, { h: 70, r0: 3.9, r1: 2.7, yaw: yaw + Math.PI, seed: 31, brick: false, marked: true, lamps: true }), size: 1.5, rate: 1.1 });
    const s2p = L(24, 6);
    vents.push({ ...stack(K, s2p.x, s2p.z, { h: 58, r0: 3.3, r1: 2.3, yaw: yaw + 0.8, seed: 32 }), size: 1.2, rate: 1.0 });
    const s3p = L(-30, -50);
    vents.push({ ...stack(K, s3p.x, s3p.z, { h: 47, r0: 2.7, r1: 2.0, yaw: yaw - Math.PI / 2, seed: 33, brick: true }), size: 0.9, rate: 0.8 });
    const s4p = L(33, 22);
    stack(K, s4p.x, s4p.z, { h: 63, r0: 3.5, r1: 2.6, yaw: yaw + 1.9, seed: 34, broken: true });

    // The casthouse, long across the view with its sawtooth, three lights burning.
    const ch = L(-20, -30);
    shed(K, ch.x, ch.z, { len: 40, dep: 20, h: 15, yaw, teeth: 7, seed: 41, lit: [-12.5, -4.5, 9.5] });
    // A low shed behind the gasholder, and the slag heap behind the stoves.
    const sh2 = L(-22, 30);
    shed(K, sh2.x, sh2.z, { len: 14, dep: 11, h: 9, yaw, teeth: 3, seed: 42 });
    const hp = L(40, -48);
    heap(K, hp.x, hp.z, { r: 12, h: 9, seed: 43 });

    const gh = L(-6, 46);
    gasholder(K, gh.x, gh.z, { r: 12, h: 24, yaw, seed: 51 });
    for (const [a, b, r, h] of [[-38, 22, 7.5, 11], [-40, 42, 6.5, 10]]) {
      const p = L(a, b);
      storageTank(K, p.x, p.z, { r, h, seed: a * 0.1 + b });
    }
    const cr = L(-24, 68);
    crane(K, cr.x, cr.z, { h: 58, jib: 40, ry: yaw + 2.5 });

    // The feed: a transfer tower on the plain below the bench, the gallery
    // climbing the cliff to a second tower, and the skip bridge to the top.
    const t1 = L(-100, 6), t2 = L(-26, 6);
    const g1 = transferTower(K, t1.x, t1.z, { h: 15, w: 7, yaw, seed: 61 });
    const g2 = transferTower(K, t2.x, t2.z, { h: 30, w: 8, yaw, seed: 62 });
    K.B.at(T(t1.x, g1, t1.z, yaw), g1 + 1.5);
    // The truck dump beside it, on the side away from the walk.
    K.B.add(slab(9, 3.2, 12).translate(0, -1.5, -11), PAL.concrete, { rust: 0 });
    K.B.add(blockAt(V(0, 2.6, -11), 6.5, 2.4, 9), PAL.soot, { rust: 0.5 });
    const P0 = W(-96.5, g1 + 1.5 + 16.5, 6);
    const P1 = W(-30, g2 + 1.5 + 32, 6);
    gallery(K, P0, P1, { w: 4.2, h: 4, bay: 4, span: 15 });
    K.B.at(new THREE.Matrix4(), gF);
    const skip0 = W(-22, g2 + 1.5 + 34, 5), skip1 = W(-4, fg + 44, 1.5);
    K.B.add(lattice(skip0, skip1, { w0: 3.2, h0: 3, bays: Math.round(8 * q) + 2, chord: 0.22, lace: 0.1 }), PAL.paint, { rust: 0.4, dust: 0 });

    group.add(K.B.bake(works, 'smelter'));
  }

  /* ---- the power line ---- */
  {
    const n = t4 ? 9 : 7, H = 32;
    const { geo, attach } = pylonGeometry(H, q);
    const { stations, at } = lineStations(LINE, n);
    const inst = new THREE.InstancedMesh(geo, works, n);
    const m = new THREE.Matrix4();
    const tops = [];
    const rough = (x, z, yawv) => {
      let lo = Infinity, hi = -Infinity;
      for (const [dx, dz] of [[-5, -5], [5, -5], [5, 5], [-5, 5], [0, 0]]) {
        const h = heightAt(x + dx, z + dz);
        lo = Math.min(lo, h); hi = Math.max(hi, h);
      }
      return { lo, range: hi - lo };
    };
    stations.forEach((st, i) => {
      // Stand each tower on the flattest ground within twenty metres of its mark,
      // never on a cliff front.
      let best = null;
      for (const off of [0, 6, -6, 12, -12, 18, -18]) {
        if (i === 0 && off < 0) continue;
        const p = at(st.s + off);
        const rr = rough(p.x, p.z);
        if (!best || rr.range < best.range - 0.5) best = { ...p, ...rr };
      }
      const prev = at(st.s - 20), next = at(st.s + 20);
      const heading = Math.atan2(next.x - prev.x, next.z - prev.z);
      const g = best.lo - 0.3;
      m.compose(V(best.x, g, best.z), new THREE.Quaternion().setFromAxisAngle(Y, heading), V(1, 1, 1));
      inst.setMatrixAt(i, m);
      tops.push(attach.map(p => p.clone().applyMatrix4(m)));
    });
    inst.instanceMatrix.needsUpdate = true;
    // One box per tower, in the mesh's frame, so the world's overlap check
    // can see each instance rather than a box round the whole line.
    geo.computeBoundingBox();
    inst.userData.partBoxes = [];
    for (let i = 0; i < n; i++) {
      inst.getMatrixAt(i, m);
      inst.userData.partBoxes.push(geo.boundingBox.clone().applyMatrix4(m));
    }
    inst.name = 'power-line';
    inst.computeBoundingSphere?.();
    group.add(inst);

    const B = new Batch().at(new THREE.Matrix4(), 0);
    const segs = t4 ? 14 : 8;
    const wire = (a, b, sag, r) => {
      const pts = [];
      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        pts.push(a.clone().lerp(b, t).add(V(0, -4 * t * (1 - t) * sag, 0)));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, r, 3, false);
    };
    for (let i = 0; i < tops.length - 1; i++) {
      for (let c = 0; c < tops[i].length; c++) {
        const a = tops[i][c], b = tops[i + 1][c];
        const span = Math.hypot(b.x - a.x, b.z - a.z);
        B.add(wire(a, b, span * 0.034, c === tops[i].length - 1 ? 0.07 : 0.09), PAL.soot, { dust: 0, grime: 0.05, streak: 0, rust: 0 });
      }
    }
    // At the yard end two conductors have parted and lie in the dust, swung
    // back toward the plant they once fed (never inside the walk).
    {
      const t = tops[0];
      for (const c of [0, 2]) {
        const a = t[c];
        const end = V(a.x - 8, 0, a.z + (c === 0 ? 6 : -5));
        end.x = Math.max(end.x, 117);
        end.y = heightAt(end.x, end.z) + 0.1;
        const mid = a.clone().lerp(end, 0.55);
        mid.y = heightAt(mid.x, mid.z) + 0.15;
        const knee = a.clone().lerp(mid, 0.5);
        knee.y = lerp(a.y, mid.y, 0.72);
        B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, knee, mid, end]), 10, 0.09, 3, false), PAL.soot, { dust: 0, rust: 0 });
      }
    }
    group.add(B.bake(works, 'power-cables'));
  }

  /* ---- the dragline ---- */
  let bucketMesh = null;
  {
    const cx = Math.cos(DRAGLINE.bearing) * DRAGLINE.dist;
    const cz = Math.sin(DRAGLINE.bearing) * DRAGLINE.dist;
    const g0 = footing(heightAt, cx, cz, 18);
    const yaw = -DRAGLINE.boomBearing;
    // Settled onto one shoe, listing a degree or two, sunk into the plain.
    const m = new THREE.Matrix4().compose(
      V(cx, g0 - 0.5, cz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.022, yaw, -0.012, 'YXZ')),
      V(1, 1, 1)
    );
    // Where the bucket hangs, the plain's height in the machine's frame.
    const bLocal = V(98, 0, 0).applyMatrix4(m);
    const bucketGround = heightAt(bLocal.x, bLocal.z) - (g0 - 0.5);
    const B = new Batch().at(m, g0);
    const { tip, bucket: bAt } = dragline(B, q, bucketGround);
    group.add(B.bake(works, 'dragline'));

    const pivot = tip.clone().applyMatrix4(m);
    const BB = new Batch().at(m, g0);
    bucket(BB, tip, bAt);
    const geo = BB.merged();
    geo.translate(-pivot.x, -pivot.y, -pivot.z);
    bucketMesh = new THREE.Mesh(geo, works);
    bucketMesh.name = 'dragline-bucket';
    bucketMesh.position.copy(pivot);
    group.add(bucketMesh);
  }

  /* ---- the lamps ---- */
  let redMesh = null;
  if (K.red.length) {
    const geo = BufferGeometryUtils.mergeGeometries(K.red.map(g => normalise(g)), false);
    redMesh = new THREE.Mesh(geo, redMat);
    redMesh.name = 'industry-obstruction-lamps';
    group.add(redMesh);
  }
  if (K.sodium.length) {
    const geo = BufferGeometryUtils.mergeGeometries(K.sodium.map(g => normalise(g)), false);
    const mesh = new THREE.Mesh(geo, sodiumMat);
    mesh.name = 'industry-sodium-windows';
    group.add(mesh);
  }

  group.traverse(o => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
      o.userData.noSalt = true;
      if (o.geometry) own(o.geometry);
    }
  });

  const lit = RED.clone();
  function update(delta, time) {
    // Obstruction lamps: a slow flash, eased so it swells rather than snaps.
    const ph = (time % 2.6) / 2.6;
    const k = 0.07 + 0.93 * smoothstep(0.0, 0.08, ph) * (1 - smoothstep(0.34, 0.5, ph));
    redMat.color.copy(lit).multiplyScalar(k);
    if (bucketMesh) {
      bucketMesh.rotation.x = 0.006 * Math.sin(time * 0.61);
      bucketMesh.rotation.z = 0.004 * Math.sin(time * 0.47 + 1.3);
    }
  }

  return { group, vents, update, dispose: () => {} };
}
