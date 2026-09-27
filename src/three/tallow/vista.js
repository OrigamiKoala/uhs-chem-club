/**
 * vista.js — what stands beyond the walk on Tallow.
 *
 * Nothing here is a place a player can reach: it is all `phys: 'ambient'`,
 * outside the ±100 m walk, and exists to give the flat SCALE and DEPTH — the
 * thing a salt pan has least of, because it is empty and level. Three depth
 * planes do that work: the ranges in the sky (atmosphere.js), the shore rising
 * off the pan (terrain.js), and between them, here, bodies at 150–650 m whose
 * parallax the player sees as they walk.
 *
 *   - Rock islands: eroded outcrops standing straight out of the salt, the
 *     way they do on real pans, with salt settled on every ledge.
 *   - The refinery: the works this yard once fed, on the northern skyline
 *     behind the near plant. Two clusters, 380–650 m out — cooling towers,
 *     stacks, columns, sphere tanks, tank farms, sheds, a rack, a crane — and
 *     four vents that still breathe, which are what the plumes rise from.
 *   - The colossus: a bucket-wheel excavator the size of a street, walked out
 *     onto the pan to cut salt and left there with its boom up. It stands
 *     east-north-east, 270 m off, in the clear sector between two islands, and
 *     it is the one thing on the flat whose size a player cannot misjudge.
 *   - A pipeline on trestles leaving the yard west-north-west and marching to
 *     the horizon, one span down, and a power line east from the refinery.
 *
 * SILHOUETTE, NOT MODEL. Past a few hundred metres the air (atmosphere.js)
 * has taken most of the contrast, so what carries is outline, mass and a few
 * tones: a dark band at a cooling tower's inlet, the gap under its shell, run-
 * off streaks down a stack, salt crusting the foot of everything. All of that
 * is painted into VERTEX COLOURS rather than textures — one material, a few
 * merged meshes, no texture memory — and the repeated bodies (trestles,
 * pylons) are instanced. The salt shader is kept off every vista material,
 * because the ground texture it reads covers only the walk.
 *
 * `buildTallowVista(ctx)` returns { group, plumes, update }: `plumes` is a list
 * of vent mouths { x, y, z, size, rate } the effects layer blows vapour from.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildMaterial, sedimentaryRock, texSize } from '../materials/pbr-kit.js';
import { columnGeometry, boulderGeometry, createRockMaterial } from '../erebus/rocks.js';
import { rng, lerp, fbm2, noise2, smoothstep } from '../erebus/noise.js';

/** The islands: bearing (radians from +x toward +z), distance, size. */
const ISLANDS = [
  { bearing: 2.62, dist: 250, radius: 34, height: 22, seed: 11 },
  { bearing: 2.95, dist: 330, radius: 22, height: 14, seed: 12 },
  { bearing: -0.95, dist: 290, radius: 42, height: 27, seed: 13 },
  { bearing: 0.72, dist: 410, radius: 30, height: 18, seed: 14 },
  { bearing: -2.2, dist: 460, radius: 55, height: 34, seed: 15 },
  { bearing: 1.55, dist: 230, radius: 16, height: 9, seed: 16 }
];

/** Where the colossus stands: clear of every island's bearing. */
const COLOSSUS = { bearing: -0.3, dist: 270, yaw: -0.9 };

function island(spec, { heightAt, rockMat, t4 }) {
  const g = new THREE.Group();
  const x = Math.cos(spec.bearing) * spec.dist;
  const z = Math.sin(spec.bearing) * spec.dist;
  let low = Infinity;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    low = Math.min(low, heightAt(x + Math.cos(a) * spec.radius, z + Math.sin(a) * spec.radius));
  }
  const bury = 6;
  const geo = columnGeometry(spec.seed, {
    height: spec.height, radius: spec.radius, baseY: low, taper: 0.34, cap: 0.03,
    squash: [1, 0.62], bury, segs: t4 ? 64 : 36,
    rings: Math.round((spec.height + bury) / (t4 ? 1.4 : 2.6)),
    gully: 0.34, ledge: 0.06, notch: 0.05, plan: 0.3, talus: 0.5, talusSpread: 0.9
  });
  const body = new THREE.Mesh(geo, rockMat);
  body.position.set(x, low, z);
  body.rotation.y = spec.seed * 1.3;
  g.add(body);

  // Fallen blocks round its foot, half drowned in the crust — baked into one
  // mesh, because nine draw calls for nine rocks bought nothing.
  const r = rng(spec.seed * 977);
  const n = t4 ? 9 : 4;
  const blocks = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = spec.radius * (1.05 + r() * 0.6);
    const s = lerp(1.2, 4.5, Math.pow(r(), 1.6)) * (spec.radius / 30);
    const bg = boulderGeometry(spec.seed * 31 + i, { detail: t4 ? 3 : 2 });
    const bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d * 0.7;
    m.compose(
      new THREE.Vector3(bx, heightAt(bx, bz) - s * 0.25, bz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 0.5, r() * 6.28, r() * 0.5)),
      new THREE.Vector3(s, s, s)
    );
    bg.applyMatrix4(m);
    blocks.push(bg);
  }
  const merged = BufferGeometryUtils.mergeGeometries(blocks, false);
  if (merged) {
    for (const b of blocks) b.dispose();
    g.add(new THREE.Mesh(merged, rockMat));
  } else {
    for (const b of blocks) g.add(new THREE.Mesh(b, rockMat));
  }
  return g;
}

/* =================================================================== paint */

const SALT = new THREE.Color('#dcd6ca');
const C = hex => new THREE.Color(hex);
const PAL = {
  pale: C('#b5ac9a'),       // galvanising and white paint gone to grey-beige
  mid: C('#8e8577'),
  concrete: C('#aaa292'),
  dark: C('#4d4842'),
  rust: C('#7a5942'),
  red: C('#8b5646'),        // chimney bands, faded almost to brick
  white: C('#cbc3b4'),
  ochre: C('#a98d60'),      // the colossus: mining yellow, forty years bleached
  glass: C('#1d1b19')
};

/**
 * Paint a world-space geometry into vertex colours: a base tone, broad grime,
 * run-off streaks (long down, narrow across), optional horizontal bands, and
 * salt crusting everything within a couple of metres of the ground.
 */
function paint(geo, base, { ground = 0, salt = 2.2, grime = 0.3, streak = 0.28, bands = null, seed = 0 } = {}) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let c = base;
    if (bands) for (const b of bands) if (y >= b.y0 && y < b.y1) { c = b.c; break; }
    let k = 1 + fbm2(x * 0.045 + seed, z * 0.045 + y * 0.03, 3) * grime * 2;
    k *= 1 - Math.max(0, noise2((x - z) * 0.55 + seed * 3.1, y * 0.02 + seed)) * streak;
    let r = c.r * k, g = c.g * k, bl = c.b * k;
    const above = y - ground;
    const s = (1 - smoothstep(salt * 0.25, salt, above + noise2(x * 0.3, z * 0.3) * salt * 0.6)) * 0.92;
    r += (SALT.r - r) * s; g += (SALT.g - g) * s; bl += (SALT.b - bl) * s;
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
 * painted, so grime and salt are laid in world space and agree across parts.
 */
class Batch {
  constructor() { this.geos = []; this.frame = new THREE.Matrix4(); this.ground = 0; }
  at(matrix, ground) { this.frame = matrix; this.ground = ground; return this; }
  add(geo, color, o = {}) {
    if (Array.isArray(geo)) { for (const g of geo) this.add(g, color, o); return; }
    geo.applyMatrix4(this.frame);
    const g = normalise(geo);
    paint(g, color, { ground: this.ground, ...o, bands: o.bands?.map(b => ({ ...b, y0: b.y0 + this.base(), y1: b.y1 + this.base() })) });
    this.geos.push(g);
  }
  /** World y of the current frame's origin, so bands can be written from an object's foot. */
  base() { return new THREE.Vector3().setFromMatrixPosition(this.frame).y; }
  bake(material, name) {
    if (!this.geos.length) return null;
    const merged = BufferGeometryUtils.mergeGeometries(this.geos, false);
    for (const g of this.geos) g.dispose();
    this.geos = [];
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = name;
    return mesh;
  }
}

/* =========================================================== shape helpers */

const Y = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

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

/** A prism of `sides` sides and radius r from a to b: the member of a truss. */
function rod(a, b, r, sides = 4) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r, r, len, sides, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(Y, b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1)));
  return g;
}

/** A box `w` x `h` at `p`, turned by `ry`. */
function blockAt(p, w, h, d, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.rotateY(ry);
  g.translate(p.x, p.y, p.z);
  return g;
}

/**
 * A lattice from a to b: four chords, a frame and a diagonal on every face
 * at every bay, tapering from w0 x h0 to w1 x h1. This is what a boom, a mast
 * and a crane jib are, and at a few hundred metres it is the lacing that
 * makes them read as steel rather than as a stick.
 */
function lattice(a, b, { w0, h0, w1 = w0, h1 = h0, bays = 8, chord = 0.3, lace = 0.15, up = Y }) {
  const axis = b.clone().sub(a);
  const L = axis.length();
  axis.normalize();
  const upv = Math.abs(axis.dot(up)) > 0.95 ? V(1, 0, 0) : up;
  const side = new THREE.Vector3().crossVectors(axis, upv).normalize();
  const vUp = new THREE.Vector3().crossVectors(side, axis).normalize();
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

/** The ground under a footprint: the lowest of a ring of samples, so nothing floats. */
function footing(heightAt, x, z, r) {
  let low = heightAt(x, z);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    low = Math.min(low, heightAt(x + Math.cos(a) * r, z + Math.sin(a) * r));
  }
  return low;
}

const T = (x, y, z, ry = 0, s = 1) => new THREE.Matrix4().compose(
  V(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, ry), V(s, s, s)
);

/* ================================================================ refinery */

/**
 * A natural-draught cooling tower: a hyperboloid shell standing on a ring of
 * raking legs over a dark inlet gap, stained down from the rim.
 */
function coolingTower(B, heightAt, x, z, { h, rb, seed }) {
  const g0 = footing(heightAt, x, z, rb) - 1.5;
  B.at(T(x, g0, z, seed), g0 + 1.5);
  const leg = 6.5;
  const throat = rb * 0.57, yt = h * 0.8;
  const bq = (yt - leg) / Math.sqrt((rb / throat) ** 2 - 1);
  const rAt = y => throat * Math.sqrt(1 + ((y - yt) / bq) ** 2);
  const prof = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const y = leg + (h - leg) * (i / N);
    prof.push(new THREE.Vector2(rAt(y), y));
  }
  const top = rAt(h);
  prof.push(new THREE.Vector2(top - 0.6, h + 0.3), new THREE.Vector2(top - 0.7, h - 5));
  B.add(new THREE.LatheGeometry(prof, 40), PAL.concrete, {
    streak: 0.45, grime: 0.28, seed,
    bands: [{ y0: 0, y1: leg + 2.2, c: PAL.mid }]
  });
  // The raking legs, in crossed pairs round the inlet.
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.9) / n) * Math.PI * 2;
    const r0 = rb * 1.02;
    B.add(rod(V(Math.cos(a0) * r0, 0, Math.sin(a0) * r0), V(Math.cos(a1) * rAt(leg), leg + 0.4, Math.sin(a1) * rAt(leg)), 0.45), PAL.concrete, { seed });
    B.add(rod(V(Math.cos(a1) * r0, 0, Math.sin(a1) * r0), V(Math.cos(a0) * rAt(leg), leg + 0.4, Math.sin(a0) * rAt(leg)), 0.45), PAL.concrete, { seed });
  }
  // The dark of the basin seen through the gap.
  B.add(cyl(rb * 0.97, rb * 0.97, leg - 0.5, 32, true), PAL.dark, { salt: 0.8, grime: 0.1 });
  return { x, y: g0 + h, z };
}

/** A chimney: tapered, banded, collared, with a platform high up and a black mouth. */
function stack(B, heightAt, x, z, { h, r0, r1, seed, broken = false, painted = false }) {
  const g0 = footing(heightAt, x, z, r0 * 2) - 1;
  B.at(T(x, g0, z, seed), g0 + 1);
  const bands = [];
  if (painted) {
    const band = h * 0.055;
    for (let i = 0; i < 4; i++) bands.push({ y0: h - band * (i + 1), y1: h - band * i + (i === 0 ? 1 : 0), c: i % 2 ? PAL.white : PAL.red });
  }
  // Soot where the gas has come out of it for decades.
  bands.unshift({ y0: h - 2.2, y1: h + 1, c: PAL.dark });
  B.add(cyl(r0, r1, h, 24), PAL.pale, { streak: 0.4, seed, bands });
  B.add(cyl(r0 * 1.9, r0 * 1.6, 5, 16), PAL.concrete, { seed });
  for (let y = 12; y < h - 4; y += 11) {
    const r = lerp(r0, r1, y / h) + 0.18;
    const ring = cyl(r, r, 0.6, 24);
    ring.translate(0, y, 0);
    B.add(ring, PAL.mid, { seed });
  }
  const py = h * 0.72, pr = lerp(r0, r1, 0.72);
  const plat = cyl(pr + 1.4, pr + 1.4, 0.5, 24);
  plat.translate(0, py, 0);
  B.add(plat, PAL.dark, { seed });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    B.add(rod(V(Math.cos(a) * (pr + 1.2), py, Math.sin(a) * (pr + 1.2)), V(Math.cos(a) * pr, py - 3.5, Math.sin(a) * pr), 0.12), PAL.dark);
  }
  if (!broken) {
    const mouth = new THREE.CircleGeometry(r1 * 0.9, 16);
    mouth.rotateX(-Math.PI / 2);
    mouth.translate(0, h - 0.4, 0);
    B.add(mouth, PAL.glass, { salt: 0 });
  } else {
    // The crown has come off: a ragged lip of what is left.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + seed;
      const s = slab(1.6, 1 + ((i * 37) % 5) * 0.8, 0.5);
      s.rotateY(-a + Math.PI / 2);
      s.translate(Math.cos(a) * r1, h, Math.sin(a) * r1);
      B.add(s, PAL.dark);
    }
  }
  return { x, y: g0 + h + 1, z };
}

/** A process column: tall, domed, on a skirt, with platforms and a pipe down its flank. */
function column(B, heightAt, x, z, { h, r, seed }) {
  const g0 = footing(heightAt, x, z, r) - 0.5;
  B.at(T(x, g0, z, seed), g0 + 0.5);
  B.add(cyl(r * 1.1, r, 4, 16), PAL.mid, { seed });
  const body = cyl(r, r, h - 4, 18);
  body.translate(0, 4, 0);
  B.add(body, PAL.pale, { seed, streak: 0.35 });
  const dome = new THREE.SphereGeometry(r, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.translate(0, h, 0);
  B.add(dome, PAL.pale, { seed });
  for (let y = 9; y < h - 2; y += 8) {
    const p = cyl(r + 1.1, r + 1.1, 0.35, 16);
    p.translate(0, y, 0);
    B.add(p, PAL.dark);
  }
  B.add(rod(V(r + 0.5, 1, 0), V(r + 0.5, h + 1.5, 0), 0.35, 6), PAL.mid);
  B.add(rod(V(r + 0.5, h + 1.5, 0), V(0, h + r + 1.2, 0), 0.35, 6), PAL.mid);
}

/** A sphere tank on its ring of legs, braced, with a stair tower's worth of mass beside it. */
function sphereTank(B, heightAt, x, z, { r, seed }) {
  const g0 = footing(heightAt, x, z, r) - 0.5;
  B.at(T(x, g0, z, seed), g0 + 0.5);
  const cy = r * 1.25;
  const s = new THREE.SphereGeometry(r, 24, 14);
  s.translate(0, cy, 0);
  B.add(s, PAL.white, { seed, streak: 0.3 });
  const eq = new THREE.TorusGeometry(r * 1.01, 0.3, 4, 32);
  eq.rotateX(Math.PI / 2);
  eq.translate(0, cy, 0);
  B.add(eq, PAL.mid);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const p = V(Math.cos(a) * r * 0.96, 0, Math.sin(a) * r * 0.96);
    const q = V(Math.cos(a1) * r * 0.96, 0, Math.sin(a1) * r * 0.96);
    B.add(rod(p, p.clone().setY(cy), 0.55, 6), PAL.mid);
    B.add(rod(p.clone().setY(1), q.clone().setY(cy * 0.7), 0.15), PAL.dark);
    B.add(rod(q.clone().setY(1), p.clone().setY(cy * 0.7), 0.15), PAL.dark);
  }
}

/** A flat-roofed storage tank with a wind girder, low and wide. */
function storageTank(B, heightAt, x, z, { r, h, seed }) {
  const g0 = footing(heightAt, x, z, r) - 0.5;
  B.at(T(x, g0, z, seed), g0 + 0.5);
  B.add(cyl(r, r, h, 36), PAL.pale, { seed, streak: 0.4 });
  const roof = new THREE.ConeGeometry(r, 1.8, 36, 1, true);
  roof.translate(0, h + 0.9, 0);
  B.add(roof, PAL.mid, { seed });
  const girder = cyl(r + 0.8, r + 0.8, 0.4, 36);
  girder.translate(0, h - 1.2, 0);
  B.add(girder, PAL.dark);
  // A stair spiralling up the shell, as a band of flights.
  for (let i = 0; i < 6; i++) {
    const a0 = i * 0.22 + seed, a1 = a0 + 0.22;
    const y0 = (i / 6) * h, y1 = ((i + 1) / 6) * h;
    B.add(rod(V(Math.cos(a0) * (r + 0.6), y0, Math.sin(a0) * (r + 0.6)), V(Math.cos(a1) * (r + 0.6), y1, Math.sin(a1) * (r + 0.6)), 0.35), PAL.dark);
  }
}

/** A shed with a sawtooth roof, the north-light kind every works of this age has. */
function shed(B, heightAt, x, z, { w, h, d, ry = 0, seed, teeth = 5 }) {
  const g0 = footing(heightAt, x, z, Math.max(w, d) / 2) - 0.5;
  B.at(T(x, g0, z, ry), g0 + 0.5);
  B.add(slab(w, h, d), PAL.concrete, {
    seed, streak: 0.35, bands: [{ y0: h * 0.62, y1: h * 0.74, c: PAL.dark }]
  });
  const tw = w / teeth, th = Math.min(4, h * 0.3);
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(tw, 0), new THREE.Vector2(0, th)]);
  for (let i = 0; i < teeth; i++) {
    const p = new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false });
    p.translate(-w / 2 + i * tw, h, -d / 2);
    B.add(p, PAL.mid, { seed });
  }
  // Doors, black, big enough to drive a crawler through.
  const door = new THREE.PlaneGeometry(w * 0.18, h * 0.55);
  door.translate(w * 0.2, h * 0.275, d / 2 + 0.05);
  B.add(door, PAL.glass, { salt: 1.2 });
}

/** A pipe rack: bents every ten metres, three runs of pipe and a walkway along the top. */
function pipeRack(B, heightAt, a, b, { h = 9, w = 6 }) {
  const dir = b.clone().sub(a);
  const L = dir.length();
  dir.normalize();
  const side = V(-dir.z, 0, dir.x);
  B.at(new THREE.Matrix4(), footing(heightAt, (a.x + b.x) / 2, (a.z + b.z) / 2, 4));
  const n = Math.round(L / 10);
  const tops = [];
  for (let i = 0; i <= n; i++) {
    const p = a.clone().addScaledVector(dir, (i / n) * L);
    const g = heightAt(p.x, p.z) - 0.5;
    const l = p.clone().addScaledVector(side, -w / 2).setY(g), r = p.clone().addScaledVector(side, w / 2).setY(g);
    B.add(rod(l, l.clone().setY(g + h + 0.5), 0.35), PAL.mid);
    B.add(rod(r, r.clone().setY(g + h + 0.5), 0.35), PAL.mid);
    B.add(rod(l.clone().setY(g + h), r.clone().setY(g + h), 0.3), PAL.mid);
    B.add(rod(l.clone().setY(g + h * 0.55), r.clone().setY(g + h * 0.55), 0.25), PAL.mid);
    tops.push(p.clone().setY(g + h));
  }
  for (const [off, rad, dy] of [[-1.8, 0.7, 0.9], [0, 1.0, 1.2], [1.9, 0.5, 0.7]]) {
    const pts = tops.map(t => t.clone().addScaledVector(side, off).setY(t.y + dy));
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, rad, 8, false), off === 0 ? PAL.pale : PAL.mid);
  }
}

/** A tower crane left with its jib slewed round, and its counterweight still up. */
function crane(B, heightAt, x, z, { h, jib, ry, seed }) {
  const g0 = footing(heightAt, x, z, 3) - 0.5;
  B.at(T(x, g0, z, ry), g0 + 0.5);
  B.add(slab(6, 1.5, 6), PAL.concrete);
  B.add(lattice(V(0, 1, 0), V(0, h, 0), { w0: 2.4, h0: 2.4, bays: Math.round(h / 3), chord: 0.28, lace: 0.1 }), PAL.ochre, { seed });
  B.add(blockAt(V(0, h + 1, 0), 3, 2, 3), PAL.ochre);
  B.add(lattice(V(1.5, h + 1, 0), V(1.5 + jib, h + 1.4, 0), { w0: 1.8, h0: 2, w1: 1.2, h1: 1.2, bays: Math.round(jib / 3), chord: 0.22, lace: 0.08 }), PAL.ochre, { seed });
  B.add(lattice(V(-1.5, h + 1, 0), V(-14, h + 1, 0), { w0: 2, h0: 1.4, bays: 4, chord: 0.25, lace: 0.1 }), PAL.ochre);
  B.add(blockAt(V(-12, h - 0.6, 0), 3.5, 3.5, 2.6), PAL.concrete);
  B.add(rod(V(0, h + 2, 0), V(0, h + 9, 0), 0.35), PAL.ochre);
  B.add(rod(V(0, h + 9, 0), V(1.5 + jib * 0.65, h + 2.4, 0), 0.12), PAL.dark);
  B.add(rod(V(0, h + 9, 0), V(-13, h + 1.8, 0), 0.12), PAL.dark);
  B.add(blockAt(V(2.8, h - 0.8, 1.6), 2, 2.2, 1.6), PAL.pale);
  // The hook block, hanging where it was left.
  B.add(rod(V(1.5 + jib * 0.8, h + 0.4, 0), V(1.5 + jib * 0.8, h * 0.45, 0), 0.08), PAL.dark);
  B.add(blockAt(V(1.5 + jib * 0.8, h * 0.45 - 0.8, 0), 1.1, 1.6, 0.8), PAL.dark);
}

/** A flare stack: a thin pipe held up by guys, with its tip scorched. */
function flare(B, heightAt, x, z, { h, seed }) {
  const g0 = footing(heightAt, x, z, 2) - 0.5;
  B.at(T(x, g0, z), g0 + 0.5);
  B.add(cyl(1.0, 0.8, h, 10), PAL.mid, { seed, bands: [{ y0: h - 4, y1: h + 1, c: PAL.dark }] });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const foot = V(Math.cos(a) * h * 0.5, 0, Math.sin(a) * h * 0.5);
    foot.y = heightAt(x + foot.x, z + foot.z) - g0;
    B.add(rod(V(0, h * 0.78, 0), foot, 0.12, 3), PAL.dark);
  }
}

/* ================================================================ colossus */

/**
 * A bucket-wheel excavator, built in its own frame with +x along the boom and
 * the crust at y = 0, then scaled to ~95 m and planted with its crawlers half
 * drowned. What makes it read at 270 m is outline: the lattice boom, the wheel
 * on its end, the A-frame and the stays drawn taut from it, the counterweight
 * hung off the back.
 */
function colossus(B) {
  const o = { seed: 7.7 };
  // Crawlers: a core, rounded ends, and the pads along the top run.
  for (const zc of [-9.5, 9.5]) {
    B.add(blockAt(V(0, 2.2, zc), 24, 5.6, 7.4), PAL.dark, o);
    for (const xe of [-12, 12]) {
      const end = new THREE.CylinderGeometry(3, 3, 7.6, 14);
      end.rotateX(Math.PI / 2);
      end.translate(xe, 2.2, zc);
      B.add(end, PAL.dark, o);
    }
    for (let i = 0; i < 26; i++) B.add(blockAt(V(-12 + i * 0.96, 5.2, zc), 0.5, 0.45, 7.8), PAL.dark, o);
  }
  B.add(blockAt(V(0, 7, 0), 20, 3.6, 13), PAL.ochre, o);
  const turn = cyl(11, 11, 2.6, 36);
  turn.translate(0, 8.4, 0);
  B.add(turn, PAL.dark, o);
  // The superstructure: a platform, the machinery house with its louvre band,
  // an electrical house, and the operator's cab out by the boom root.
  B.add(blockAt(V(-5, 12.2, 0), 34, 2.4, 16), PAL.ochre, o);
  // (Bands are measured in the world from the frame's origin, so in metres after scaling.)
  B.add(slab(16, 11, 13).translate(-9, 13.4, 0), PAL.ochre, { ...o, bands: [{ y0: 19.5 * 0.82, y1: 20.8 * 0.82, c: PAL.dark }] });
  B.add(blockAt(V(-9, 25, 0), 14, 1.2, 11), PAL.mid, o);
  B.add(blockAt(V(-2, 16.4, -9.8), 8, 6, 5), PAL.pale, o);
  B.add(blockAt(V(10, 15.8, 6.6), 4, 3.2, 3.6), PAL.ochre, o);
  B.add(blockAt(V(12.05, 16.2, 6.6), 0.1, 1.4, 3.2), PAL.glass, { salt: 0 });

  // The A-frame, both sides, and a cross-head at the apex.
  const apex = z => V(-2, 44, z);
  for (const s of [-1, 1]) {
    B.add(rod(V(5, 13.4, s * 5.6), apex(s * 1.2), 0.9), PAL.ochre, o);
    B.add(rod(V(-9, 13.4, s * 5.6), apex(s * 1.2), 0.9), PAL.ochre, o);
    B.add(rod(V(3.3, 22, s * 4.4), V(-7.2, 22, s * 4.4), 0.45), PAL.ochre, o);
  }
  B.add(rod(apex(-1.6), apex(1.6), 0.8), PAL.ochre, o);

  // The main boom, raised, and the wheel on its end, off to one side of it.
  const root = V(9, 13.6, 0);
  const pitch = 0.3, len = 52;
  const tip = V(root.x + Math.cos(pitch) * len, root.y + Math.sin(pitch) * len, 0);
  B.add(lattice(root, tip, { w0: 5.5, h0: 5.5, w1: 3.2, h1: 3.2, bays: 11, chord: 0.45, lace: 0.2 }), PAL.ochre, o);
  const wc = tip.clone().add(V(3.2, -1.6, -3.8));
  {
    const rim = new THREE.TorusGeometry(9, 0.7, 6, 32);
    rim.translate(wc.x, wc.y, wc.z);
    B.add(rim, PAL.ochre, o);
    const inner = new THREE.TorusGeometry(6.2, 0.35, 5, 28);
    inner.translate(wc.x, wc.y, wc.z);
    B.add(inner, PAL.ochre, o);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      B.add(rod(wc, wc.clone().add(V(Math.cos(a) * 8.6, Math.sin(a) * 8.6, 0)), 0.4), PAL.ochre, o);
    }
    const hub = new THREE.CylinderGeometry(1.7, 1.7, 4.4, 14);
    hub.rotateX(Math.PI / 2);
    hub.translate(wc.x, wc.y, wc.z + 1.2);
    B.add(hub, PAL.dark, o);
    // The buckets: open scoops round the rim, lips out. One has gone.
    for (let i = 0; i < 14; i++) {
      if (i === 5) continue;
      const a = (i / 14) * Math.PI * 2;
      const bkt = new THREE.BoxGeometry(3.2, 2.4, 3.3);
      bkt.rotateZ(a);
      bkt.translate(wc.x + Math.cos(a) * 9.8, wc.y + Math.sin(a) * 9.8, wc.z);
      B.add(bkt, PAL.rust, o);
    }
    B.add(blockAt(tip.clone().add(V(0.5, -1.2, 1.8)), 3.4, 3.4, 3), PAL.dark, o);
  }

  // The counterweight boom, and the counterweight hung off its end.
  const back = V(-40, 17.5, 0);
  B.add(lattice(V(-13, 13.8, 0), back, { w0: 4.6, h0: 4.6, w1: 3.8, h1: 3.8, bays: 6, chord: 0.4, lace: 0.18 }), PAL.ochre, o);
  B.add(blockAt(V(-42, 15.2, 0), 8, 8, 9), PAL.rust, { ...o, streak: 0.5 });

  // Stays, taut from the apex to the boom and to the counterweight.
  for (const s of [-1, 1]) {
    B.add(rod(apex(s * 1.2), tip.clone().add(V(-1, 1.6, s * 1.4)), 0.32, 4), PAL.dark);
    B.add(rod(apex(s * 1.2), V(root.x + Math.cos(pitch) * 30, root.y + Math.sin(pitch) * 30 + 2.6, s * 2.2), 0.28, 4), PAL.dark);
    B.add(rod(apex(s * 1.2), back.clone().add(V(0, 2, s * 1.8)), 0.32, 4), PAL.dark);
  }

  // The discharge boom: it fell, and lies from its pivot down onto the salt.
  B.add(lattice(V(-4, 10.5, 9), V(-26, 1.2, 34), { w0: 3, h0: 3, w1: 2.6, h1: 2.4, bays: 8, chord: 0.3, lace: 0.14 }), PAL.ochre, o);
  B.add(lattice(V(-26.5, 0.8, 35), V(-31, 0.6, 46), { w0: 2.6, h0: 2.2, bays: 3, chord: 0.3, lace: 0.14, up: V(0.3, 1, 0) }), PAL.ochre, o);
  B.add(blockAt(V(-24, 0.6, 38), 5, 1.6, 4, 0.5), PAL.rust, o);
}

/* ================================================================ pipeline */

/** One trestle in its own frame (x across the line, y up from the crust), painted. */
function trestleGeometry(H) {
  const B = new Batch().at(new THREE.Matrix4(), 0);
  for (const s of [-1, 1]) {
    B.add(rod(V(s * 1.9, -0.6, 0), V(s * 1.05, H, 0), 0.2), PAL.mid, { salt: 1.6 });
    B.add(slab(0.9, 0.7, 0.9).translate(s * 1.9, -0.2, 0), PAL.concrete, { salt: 1.6 });
  }
  B.add(blockAt(V(0, H + 0.2, 0), 3.0, 0.4, 0.5), PAL.mid, { salt: 1.6 });
  B.add(rod(V(-1.55, 1.4, 0), V(1.55, 1.4, 0), 0.12), PAL.mid, { salt: 1.6 });
  B.add(rod(V(-1.5, 1.5, 0), V(1.1, H - 0.2, 0), 0.1), PAL.mid, { salt: 1.6 });
  B.add(blockAt(V(-0.5, H + 0.55, 0), 1.4, 0.3, 0.6), PAL.dark, { salt: 1.6 });
  const merged = BufferGeometryUtils.mergeGeometries(B.geos, false);
  for (const g of B.geos) g.dispose();
  return merged;
}

/** A lattice tower for the power line, in its own frame, painted. */
function pylonGeometry(H) {
  const B = new Batch().at(new THREE.Matrix4(), 0);
  B.add(lattice(V(0, -1, 0), V(0, H, 0), { w0: 7, h0: 7, w1: 1.6, h1: 1.6, bays: 9, chord: 0.22, lace: 0.08 }), PAL.mid, { salt: 2.4 });
  for (const y of [H * 0.78, H * 0.93]) {
    B.add(lattice(V(-7.5, y, 0), V(7.5, y, 0), { w0: 1.2, h0: 1.2, bays: 6, chord: 0.14, lace: 0.06, up: V(0, 0, 1) }), PAL.mid);
  }
  B.add(rod(V(0, H, 0), V(0, H + 3, 0), 0.25), PAL.mid);
  const merged = BufferGeometryUtils.mergeGeometries(B.geos, false);
  for (const g of B.geos) g.dispose();
  return merged;
}

/** A polyline resampled every `step` metres, with the heading at each station. */
function stations(path, step) {
  const out = [];
  let carry = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    for (let d = carry; d < L; d += step) {
      out.push({ x: a[0] + (b[0] - a[0]) * d / L, z: a[1] + (b[1] - a[1]) * d / L, yaw });
      carry = d + step - L;
    }
  }
  return out;
}

/* =================================================================== build */

/**
 * @param {object} ctx { heightAt, t4, own, M, strata, macro, saltMap }
 */
export function buildTallowVista(ctx) {
  const { heightAt, t4, own, strata, macro } = ctx;
  const group = new THREE.Group();
  group.name = 'tallow-vista';
  group.userData.phys = 'ambient';

  const detail = buildMaterial(
    sedimentaryRock({ warm: '#a39a8c', cool: '#6d6a66', seed: 41, size: texSize(512) }),
    { repeat: 1 }
  );
  for (const t of detail.userData.surfaceMaps) own(t);
  own(detail);
  const rockMat = own(createRockMaterial(
    { detail, sand: ctx.saltMap || detail.map, macro, strata },
    { sandCover: 0.85, varnish: 0.7, tint: new THREE.Color('#f2eee8') }
  ));
  // Rock is not a prop standing on the pan; it does not take the salt creep.
  rockMat.userData.noSalt = true;

  for (const spec of ISLANDS) {
    const g = island(spec, { heightAt, rockMat, t4 });
    g.name = `island-${spec.seed}`;
    group.add(g);
  }

  // Everything built is painted steel and concrete: one material for all of
  // it, the colour in the vertices. Not salted (the salt shader's ground only
  // covers the walk) — the crust at every foot is painted in instead.
  const works = own(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.22 }));
  works.userData.noSalt = true;
  const plumes = [];

  /* ---- the refinery, near cluster: 360–500 m north ---- */
  {
    const B = new Batch();
    const ct1 = coolingTower(B, heightAt, -100, -440, { h: 58, rb: 22, seed: 1 });
    coolingTower(B, heightAt, -62, -488, { h: 50, rb: 18, seed: 2 });
    const s1 = stack(B, heightAt, 8, -398, { h: 92, r0: 3.8, r1: 2.6, seed: 3, painted: true });
    stack(B, heightAt, 22, -405, { h: 74, r0: 3.2, r1: 2.3, seed: 4, broken: true });
    const s3 = stack(B, heightAt, 70, -445, { h: 66, r0: 2.6, r1: 1.9, seed: 5 });
    for (const [x, z, h, r] of [[38, -388, 44, 2.6], [46, -397, 36, 2.0], [55, -386, 30, 3.0], [30, -401, 26, 1.8], [64, -399, 40, 2.2]]) {
      column(B, heightAt, x, z, { h, r, seed: x * 0.1 });
    }
    for (const [x, z, r] of [[-38, -358, 8], [-20, -358, 8], [-2, -358, 8], [-56, -360, 7]]) {
      sphereTank(B, heightAt, x, z, { r, seed: x });
    }
    for (const [x, z, r, h] of [[110, -420, 14, 12], [140, -446, 12, 11], [112, -458, 13, 12]]) {
      storageTank(B, heightAt, x, z, { r, h, seed: z });
    }
    pipeRack(B, heightAt, V(-80, 0, -372), V(130, 0, -372), { h: 9, w: 6 });
    shed(B, heightAt, -150, -410, { w: 50, h: 16, d: 22, seed: 6 });
    shed(B, heightAt, -10, -445, { w: 44, h: 18, d: 26, seed: 7, teeth: 6 });
    shed(B, heightAt, 95, -385, { w: 30, h: 12, d: 18, seed: 8, teeth: 4 });
    shed(B, heightAt, -152, -472, { w: 36, h: 14, d: 20, seed: 9, teeth: 4 });
    crane(B, heightAt, 80, -472, { h: 56, jib: 42, ry: 2.6, seed: 10 });
    flare(B, heightAt, 150, -392, { h: 58, seed: 11 });
    group.add(B.bake(works, 'refinery-near'));
    plumes.push({ ...ct1, size: 1.3, rate: 1.3 });
    plumes.push({ ...s1, size: 0.9, rate: 1.0 });
    plumes.push({ ...s3, size: 0.7, rate: 0.8 });
  }

  /* ---- the refinery, far cluster: 560–650 m, mostly haze ---- */
  {
    const B = new Batch();
    const s4 = stack(B, heightAt, -70, -600, { h: 110, r0: 4.6, r1: 3.2, seed: 12, painted: true });
    stack(B, heightAt, -52, -612, { h: 98, r0: 4.2, r1: 3.0, seed: 13 });
    stack(B, heightAt, 160, -585, { h: 84, r0: 3.4, r1: 2.4, seed: 14, broken: true });
    coolingTower(B, heightAt, 40, -625, { h: 72, rb: 27, seed: 15 });
    storageTank(B, heightAt, -130, -590, { r: 16, h: 14, seed: 16 });
    storageTank(B, heightAt, -165, -622, { r: 15, h: 13, seed: 17 });
    shed(B, heightAt, 100, -580, { w: 60, h: 20, d: 30, seed: 18, teeth: 7 });
    shed(B, heightAt, -10, -570, { w: 50, h: 16, d: 24, seed: 19, teeth: 6 });
    shed(B, heightAt, -110, -645, { w: 40, h: 18, d: 30, seed: 20 });
    sphereTank(B, heightAt, 150, -630, { r: 10, seed: 21 });
    sphereTank(B, heightAt, 176, -642, { r: 9, seed: 22 });
    for (const [x, z, h, r] of [[-20, -615, 52, 3.2], [-8, -620, 40, 2.6]]) column(B, heightAt, x, z, { h, r, seed: z });
    group.add(B.bake(works, 'refinery-far'));
    plumes.push({ ...s4, size: 1.1, rate: 1.2 });
  }

  /* ---- the colossus ---- */
  {
    const cx = Math.cos(COLOSSUS.bearing) * COLOSSUS.dist, cz = Math.sin(COLOSSUS.bearing) * COLOSSUS.dist;
    const g0 = footing(heightAt, cx, cz, 25);
    const S = 0.82;
    // Settled onto its forward crawler, listing a few degrees, tracks half drowned.
    const m = new THREE.Matrix4().compose(
      V(cx, g0 - 2.4, cz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.035, COLOSSUS.yaw, -0.02, 'YXZ')),
      V(S, S, S)
    );
    const B = new Batch().at(m, g0);
    colossus(B);
    group.add(B.bake(works, 'colossus'));
  }

  /* ---- the pipeline, west-north-west from the yard to the horizon ---- */
  {
    const route = [[-130, -79], [-250, -118], [-400, -152], [-560, -206], [-770, -282]];
    const H = 4.6, step = 16, fallen = 19;
    const st = stations(route, step);
    const tg = trestleGeometry(H);
    const inst = new THREE.InstancedMesh(tg, works, st.length - 1);
    const m = new THREE.Matrix4();
    const tops = [], small = [];
    let k = 0, anchor = null;
    st.forEach((s, i) => {
      const g = heightAt(s.x, s.z);
      // The trestle's own +x, across the line: the big pipe sits on its −x saddle.
      const side = V(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
      // One trestle has gone down, and the pipe has sagged into the gap.
      const y = i === fallen ? g + 1.1 : g + H + 0.4;
      tops.push(V(s.x, y + 0.75, s.z).addScaledVector(side, -0.5));
      small.push(V(s.x, y + 0.35, s.z).addScaledVector(side, 0.9));
      if (i === fallen) return;
      m.compose(V(s.x, g, s.z), new THREE.Quaternion().setFromAxisAngle(Y, s.yaw + Math.PI / 2), V(1, 1, 1));
      inst.setMatrixAt(k++, m);
    });
    inst.count = k;
    inst.name = 'pipeline-trestles';
    // Where it starts it comes up out of the crust through an anchor block,
    // from whatever it once fed in the yard.
    {
      const s0 = st[0];
      const dir = V(Math.cos(s0.yaw), 0, -Math.sin(s0.yaw));
      const at = d => V(s0.x, 0, s0.z).addScaledVector(dir, -d);
      for (const [list, dx] of [[tops, 0.75], [small, 0.35]]) {
        const p0 = list[0];
        const e1 = p0.clone().addScaledVector(dir, -5), e2 = p0.clone().addScaledVector(dir, -9);
        e1.y = heightAt(e1.x, e1.z) + dx + 0.5;
        e2.y = heightAt(e2.x, e2.z) - 1.5;
        list.unshift(e2, e1);
      }
      const a = at(5.5);
      anchor = { p: a.setY(heightAt(a.x, a.z)), yaw: s0.yaw };
    }
    own(tg);
    group.add(inst);
    const B = new Batch();
    {
      const { p, yaw } = anchor;
      B.at(T(p.x, p.y - 0.6, p.z, yaw), p.y);
      B.add(slab(3.6, 2.4, 4), PAL.concrete, { salt: 1.4 });
    }
    // The fallen trestle, lying beside its footings.
    {
      const s = st[fallen];
      const g = heightAt(s.x, s.z);
      B.at(T(s.x, g, s.z, s.yaw + Math.PI / 2), g);
      B.add(rod(V(-2.6, 0.3, 1.2), V(1.6, 0.35, 2.2), 0.22), PAL.mid, { salt: 1.2 });
      B.add(rod(V(-2.2, 0.3, 2.4), V(2.2, 0.3, 1.6), 0.22), PAL.mid, { salt: 1.2 });
    }
    B.at(new THREE.Matrix4(), heightAt(-400, -152));
    const pipeRun = (pts, r) => {
      // A pipe on supports sags between them: a midpoint dropped per span.
      const all = [];
      for (let i = 0; i < pts.length; i++) {
        all.push(pts[i]);
        if (i < pts.length - 1) all.push(pts[i].clone().lerp(pts[i + 1], 0.5).add(V(0, -0.22, 0)));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(all), all.length * 3, r, 10, false);
    };
    B.add(pipeRun(tops, 0.75), PAL.pale, { salt: 0.6, streak: 0.35 });
    B.add(pipeRun(small, 0.35), PAL.mid, { salt: 0.6 });
    group.add(B.bake(works, 'pipeline'));
  }

  /* ---- the power line, east from the refinery toward the far shore ---- */
  {
    const route = [[178, -402], [720, -140]];
    const H = 30;
    const st = stations(route, 62);
    const pg = pylonGeometry(H);
    const inst = new THREE.InstancedMesh(pg, works, st.length);
    const m = new THREE.Matrix4();
    const tips = [];
    st.forEach((s, i) => {
      const g = heightAt(s.x, s.z) - 0.5;
      const q = new THREE.Quaternion().setFromAxisAngle(Y, s.yaw + Math.PI / 2);
      m.compose(V(s.x, g, s.z), q, V(1, 1, 1));
      inst.setMatrixAt(i, m);
      const across = V(1, 0, 0).applyQuaternion(q);
      tips.push([-7, 0, 7].map(o => V(s.x, g + H * 0.78 - 1.2, s.z).addScaledVector(across, o))
        .concat([V(s.x, g + H * 0.93 - 1.2, s.z).addScaledVector(across, 6.8)]));
    });
    inst.name = 'power-line';
    own(pg);
    group.add(inst);
    const B = new Batch().at(new THREE.Matrix4(), 0);
    for (let i = 0; i < tips.length - 1; i++) {
      for (let c = 0; c < 4; c++) {
        const a = tips[i][c], b = tips[i + 1][c];
        const pts = [];
        for (let j = 0; j <= 10; j++) {
          const t = j / 10;
          pts.push(a.clone().lerp(b, t).add(V(0, -4 * t * (1 - t) * 3.2, 0)));
        }
        B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.16, 4, false), PAL.dark, { salt: 0, grime: 0.05, streak: 0 });
      }
    }
    group.add(B.bake(works, 'power-cables'));
  }

  group.traverse(o => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
      o.userData.noSalt = true;
      if (o.geometry) own(o.geometry);
    }
  });

  return { group, plumes, update: null };
}
