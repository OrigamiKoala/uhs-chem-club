/**
 * basalt.js — columnar basalt, built the way a lava sheet builds it.
 *
 * WHY THIS REPLACED THE HEXAGON. Ligar used to be made of one unit hexagonal
 * cylinder, instanced and scaled: every column in the world a perfect regular
 * hexagon, a single smooth shaft, a flat lid. That is the loudest possible
 * "procedural" tell, because real columnar jointing is nothing like it:
 *
 *  - A cooling sheet cracks into an IRREGULAR tessellation. Most columns have
 *    five or six sides, some four, some seven, and no two are the same shape —
 *    but they PACK, edge to edge, with a joint a centimetre or two wide
 *    between them. `voronoi()` builds exactly that: a jittered hexagonal
 *    lattice, relaxed once, cut into cells by perpendicular bisectors.
 *  - A column is not one shaft. Cross-fractures break it into DRUMS every half
 *    metre to a metre and a half, each a little offset from the next, each
 *    edge rounded by weather into a chamfer. The ball-and-socket tops of the
 *    Causeway are that chamfer taken further.
 *  - A column's top is either a weathered lid, faintly domed or cupped, or a
 *    fresh break at a slant where the one above it fell away.
 *
 * ONE PRISM FUNCTION DOES ALL OF IT. `prism()` takes a convex cell in its own
 * (a, b) plane, a length along its own axis c, and a `map(a, b, c)` into the
 * world. A standing column maps c to height; a fallen one maps it along the
 * ground; an arch maps it RADIALLY off a curved centre line, so its columns
 * fan the way a flow cooling round a void really does. Winding is decided per
 * triangle against an outward hint rather than trusted to the caller, so a
 * mapping that mirrors the cell cannot turn a column inside out.
 *
 * EVERYTHING IS MERGED. A raft of two hundred columns is ONE mesh with two
 * material groups (the column faces and the weathered lids), vertex-toned so
 * no two columns are the same stone, and it records one box per column in
 * `userData.partBoxes` — the channel `mergeStatic` and the overlap checker
 * already share — so the physics check still sees every column where it is.
 */

import * as THREE from 'three';
import { noise2, fbm2, rng, smoothstep, clamp, lerp } from '../erebus/noise.js';

/* ======================================================================
   THE TESSELLATION
   ====================================================================== */

/** Keep the part of a convex polygon where p·n <= d. */
function clipHalf(poly, nx, nz, d) {
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const da = a[0] * nx + a[1] * nz - d;
    const db = b[0] * nx + b[1] * nz - d;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/** Area-weighted centroid and area of a polygon. */
export function polyCentroid(poly) {
  let A = 0, cx = 0, cz = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i];
    const [x1, z1] = poly[(i + 1) % poly.length];
    const cr = x0 * z1 - x1 * z0;
    A += cr;
    cx += (x0 + x1) * cr;
    cz += (z0 + z1) * cr;
  }
  A *= 0.5;
  if (Math.abs(A) < 1e-9) {
    let sx = 0, sz = 0;
    for (const p of poly) { sx += p[0]; sz += p[1]; }
    return { x: sx / poly.length, z: sz / poly.length, area: 0 };
  }
  return { x: cx / (6 * A), z: cz / (6 * A), area: Math.abs(A) };
}

/**
 * Jittered hexagonal lattice over a rectangle, padded by two pitches so the
 * cells that are kept all have their full set of neighbours.
 */
export function latticeSites({ minX, maxX, minZ, maxZ, pitch, jitter = 0.3, rand }) {
  const sites = [];
  const rowH = pitch * 0.8660254;
  const pad = pitch * 2;
  let row = 0;
  for (let z = minZ - pad; z <= maxZ + pad; z += rowH, row++) {
    const off = (row & 1) ? pitch / 2 : 0;
    for (let x = minX - pad + off; x <= maxX + pad; x += pitch) {
      sites.push([
        x + (rand() - 0.5) * 2 * jitter * pitch,
        z + (rand() - 0.5) * 2 * jitter * pitch
      ]);
    }
  }
  return sites;
}

/**
 * The Voronoi cells of `sites`, each clipped from a box by the bisectors of its
 * near neighbours. O(n) with a bucket grid, because a lattice's neighbours are
 * always within a couple of pitches.
 */
export function voronoi(sites, pitch) {
  const B = pitch * 1.25;
  const grid = new Map();
  const key = (i, j) => `${i},${j}`;
  sites.forEach((s, idx) => {
    const k = key(Math.floor(s[0] / B), Math.floor(s[1] / B));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(idx);
  });
  const cells = [];
  const reach = pitch * 2.4;
  for (let idx = 0; idx < sites.length; idx++) {
    const [sx, sz] = sites[idx];
    const gi = Math.floor(sx / B);
    const gj = Math.floor(sz / B);
    const near = [];
    for (let di = -2; di <= 2; di++) {
      for (let dj = -2; dj <= 2; dj++) {
        const list = grid.get(key(gi + di, gj + dj));
        if (!list) continue;
        for (const o of list) {
          if (o === idx) continue;
          const d = Math.hypot(sites[o][0] - sx, sites[o][1] - sz);
          if (d < reach) near.push([d, o]);
        }
      }
    }
    near.sort((a, b) => a[0] - b[0]);
    const h = pitch * 1.6;
    let poly = [[sx - h, sz - h], [sx + h, sz - h], [sx + h, sz + h], [sx - h, sz + h]];
    for (const [, o] of near) {
      const [ox, oz] = sites[o];
      const nx = ox - sx;
      const nz = oz - sz;
      const d = nx * (sx + ox) / 2 + nz * (sz + oz) / 2;
      poly = clipHalf(poly, nx, nz, d);
      if (poly.length < 3) break;
    }
    if (poly.length < 3) continue;
    const c = polyCentroid(poly);
    cells.push({ x: sx, z: sz, cx: c.x, cz: c.z, area: c.area, poly, site: idx });
  }
  return cells;
}

/**
 * A packed field of cells inside `keep(cx, cz)`, relaxed once (Lloyd) so the
 * columns come out as even as a real flow's — varied, never degenerate.
 */
export function columnCells({ minX, maxX, minZ, maxZ, pitch, jitter = 0.55, seed = 1, keep = null }) {
  const rand = rng(seed);
  let sites = latticeSites({ minX, maxX, minZ, maxZ, pitch, jitter, rand });
  let cells = voronoi(sites, pitch);
  // One Lloyd step: every site to its cell's centroid. Cells at the padded
  // edge are distorted by missing neighbours, which is why the field is padded.
  sites = cells.map(c => [c.cx, c.cz]);
  cells = voronoi(sites, pitch);
  return cells.filter(c =>
    c.cx >= minX && c.cx <= maxX && c.cz >= minZ && c.cz <= maxZ &&
    c.area > pitch * pitch * 0.18 &&
    (!keep || keep(c.cx, c.cz, c))
  );
}

/* ======================================================================
   THE BUILDER
   Two groups of triangles, flat-shaded: column faces and lids.
   ====================================================================== */

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _n = new THREE.Vector3();

export class RockBuilder {
  constructor() {
    // Group 0: faces (the column texture). Group 1: lids (the pavement).
    this.pos = [[], []];
    this.uv = [[], []];
    this.col = [[], []];
    this.boxes = [];
    this._box = null;
  }

  beginPart() { this._box = new THREE.Box3(); }
  endPart() {
    if (this._box && !this._box.isEmpty()) this.boxes.push(this._box);
    this._box = null;
  }

  /** One triangle, wound so its face normal agrees with `hint`. */
  tri(g, p0, p1, p2, t0, t1, t2, k0, k1, k2, hint) {
    _a.fromArray(p1).sub(_c.fromArray(p0));
    _b.fromArray(p2).sub(_c);
    _n.crossVectors(_a, _b);
    if (_n.lengthSq() < 1e-14) return;
    if (hint && _n.x * hint[0] + _n.y * hint[1] + _n.z * hint[2] < 0) {
      [p1, p2] = [p2, p1];
      [t1, t2] = [t2, t1];
      [k1, k2] = [k2, k1];
    }
    const P = this.pos[g], U = this.uv[g], C = this.col[g];
    P.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    U.push(t0[0], t0[1], t1[0], t1[1], t2[0], t2[1]);
    C.push(k0, k0, k0, k1, k1, k1, k2, k2, k2);
    if (this._box) {
      this._box.expandByPoint(_a.fromArray(p0));
      this._box.expandByPoint(_a.fromArray(p1));
      this._box.expandByPoint(_a.fromArray(p2));
    }
  }

  quad(g, p0, p1, p2, p3, t0, t1, t2, t3, k0, k1, k2, k3, hint) {
    this.tri(g, p0, p1, p2, t0, t1, t2, k0, k1, k2, hint);
    this.tri(g, p0, p2, p3, t0, t2, t3, k0, k2, k3, hint);
  }

  get triangles() { return (this.pos[0].length + this.pos[1].length) / 9; }

  /** The merged geometry, faces then lids, with `uv1` for the occlusion map. */
  toGeometry() {
    const n0 = this.pos[0].length / 3;
    const n1 = this.pos[1].length / 3;
    const pos = new Float32Array((n0 + n1) * 3);
    const uv = new Float32Array((n0 + n1) * 2);
    const col = new Float32Array((n0 + n1) * 3);
    pos.set(this.pos[0], 0); pos.set(this.pos[1], n0 * 3);
    uv.set(this.uv[0], 0); uv.set(this.uv[1], n0 * 2);
    col.set(this.col[0], 0); col.set(this.col[1], n0 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('uv1', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.addGroup(0, n0, 0);
    geo.addGroup(n0, n1, 1);
    geo.computeVertexNormals();   // non-indexed: one normal per face
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  }

  /** A mesh of it, carrying its per-column boxes for the physics check. */
  toMesh(materials, { shadows = true, name = 'basalt' } = {}) {
    const mesh = new THREE.Mesh(this.toGeometry(), materials);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = shadows;
    mesh.userData.partBoxes = this.boxes;
    mesh.userData.noMerge = true;
    mesh.userData.ownGeometry = mesh.geometry;
    return mesh;
  }
}

/** Move every vertex of a convex polygon `d` toward its centroid. */
function inset(poly, cx, cz, d) {
  return poly.map(([a, b]) => {
    const dx = cx - a, dz = cz - b;
    const L = Math.hypot(dx, dz);
    const k = L > 1e-6 ? Math.min(d, L * 0.45) / L : 0;
    return [a + dx * k, b + dz * k];
  });
}

/**
 * One column: a convex cell in (a, b), from c0 to c1 along its axis, broken
 * into drums at `joints`, chamfered at every break, capped with a lid.
 *
 * @param {RockBuilder} rb
 * @param {Array<[number, number]>} poly the cell
 * @param {number} c0 foot
 * @param {number} c1 head
 * @param {(a:number, b:number, c:number) => number[]} map into the builder's frame
 * @param {object} o
 *   gap       half the joint width, taken off the cell (m)
 *   chamfer   how much a drum's top edge is rounded off (m)
 *   joints    c values of the cross-fractures between c0 and c1
 *   jointGap  the open width of a cross-fracture (m)
 *   shift     (k) => [da, db], how far drum k is offset from the axis
 *   crown     lid rises (+) or cups (-) at the centre (m)
 *   tilt      [ga, gb]: a broken head, dc per metre across the cell
 *   foot      also close the foot (for anything whose foot can be seen)
 *   tone      the stone's own shade, 0.7…1.2
 *   shade     (c) => multiplier, e.g. darker toward the ground
 *   uvScale   texture metres per repeat
 */
export function prism(rb, poly, c0, c1, map, o = {}) {
  const {
    gap = 0.012, chamfer = 0.04, joints = [], jointGap = 0.018,
    shift = null, crown = 0, tilt = null, foot = false,
    tone = 1, shade = null, uvScale = 1
  } = o;
  const cen = polyCentroid(poly);
  const ca = cen.x, cb = cen.z;
  const P = gap > 0 ? inset(poly, ca, cb, gap) : poly;
  const n = P.length;
  // Perimeter distance at each vertex: the u coordinate of the faces.
  const per = [0];
  for (let i = 1; i <= n; i++) {
    const p = P[i - 1], q = P[i % n];
    per.push(per[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1]));
  }
  const K = c => tone * (shade ? shade(c) : 1);
  const cuts = [c0, ...joints.filter(j => j > c0 + 0.15 && j < c1 - 0.15).sort((x, y) => x - y), c1];
  const drums = cuts.length - 1;

  rb.beginPart();
  for (let k = 0; k < drums; k++) {
    const last = k === drums - 1;
    const lo = cuts[k] + (k > 0 ? jointGap / 2 : 0);
    const hi = cuts[k + 1] - (last ? 0 : jointGap / 2);
    const [sa, sb] = shift ? shift(k) : [0, 0];
    const ring = P.map(([a, b]) => [a + sa, b + sb]);
    const len = hi - lo;
    const ch = Math.min(chamfer, len * 0.3);
    const inner = inset(ring, ca + sa, cb + sb, ch);
    const off = (a, b) => (last && tilt ? (a - ca - sa) * tilt[0] + (b - cb - sb) * tilt[1] : 0);
    // Only the drum's top edge is rounded: the one below a break reads as a
    // groove without its foot rounded too, at half the triangles.
    const bch = 0;
    const innerB = k > 0 ? inset(ring, ca + sa, cb + sb, bch) : ring;

    const axisAt = c => map(ca + sa, cb + sb, c);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [a0, b0] = ring[i], [a1, b1] = ring[j];
      const u0 = per[i] * uvScale, u1 = per[i + 1] * uvScale;
      const cBot = lo + bch;
      const cTop0 = hi + off(a0, b0) - ch;
      const cTop1 = hi + off(a1, b1) - ch;
      const mid = map((a0 + a1) / 2, (b0 + b1) / 2, (cBot + cTop0) / 2);
      const ax = axisAt((cBot + cTop0) / 2);
      const hint = [mid[0] - ax[0], mid[1] - ax[1], mid[2] - ax[2]];
      // The face.
      rb.quad(0,
        map(a0, b0, cBot), map(a1, b1, cBot), map(a1, b1, cTop1), map(a0, b0, cTop0),
        [u0, cBot * uvScale], [u1, cBot * uvScale], [u1, cTop1 * uvScale], [u0, cTop0 * uvScale],
        K(cBot), K(cBot), K(cTop1), K(cTop0), hint);
      // The rounded top edge, leaning in to the lid.
      const [ia0, ib0] = inner[i], [ia1, ib1] = inner[j];
      const t0 = hi + off(ia0, ib0), t1 = hi + off(ia1, ib1);
      rb.quad(0,
        map(a0, b0, cTop0), map(a1, b1, cTop1), map(ia1, ib1, t1), map(ia0, ib0, t0),
        [u0, cTop0 * uvScale], [u1, cTop1 * uvScale], [u1, (t1 + ch) * uvScale], [u0, (t0 + ch) * uvScale],
        K(cTop0), K(cTop1), K(t1) * 1.04, K(t0) * 1.04, hint);
      // The rounded foot of a drum above a break.
      if (bch > 0) {
        const [ja0, jb0] = innerB[i], [ja1, jb1] = innerB[j];
        rb.quad(0,
          map(ja0, jb0, lo), map(ja1, jb1, lo), map(a1, b1, cBot), map(a0, b0, cBot),
          [u0, (lo - bch) * uvScale], [u1, (lo - bch) * uvScale], [u1, cBot * uvScale], [u0, cBot * uvScale],
          K(lo) * 0.92, K(lo) * 0.92, K(cBot), K(cBot), hint);
      }
    }
    // The lid: a fan from a centre that stands proud or sits in a cup. Every
    // drum gets one, so a cross-fracture seen edge-on shows stone, not sky.
    const cc = hi + (last ? crown : 0);
    const up = map(ca, cb, hi + 1);
    const at = map(ca, cb, hi);
    const lidHint = [up[0] - at[0], up[1] - at[1], up[2] - at[2]];
    const cP = map(ca + sa, cb + sb, cc);
    const cT = [(ca + sa) * uvScale, (cb + sb) * uvScale];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [a0, b0] = inner[i], [a1, b1] = inner[j];
      rb.tri(1, cP, map(a0, b0, hi + off(a0, b0)), map(a1, b1, hi + off(a1, b1)),
        cT, [a0 * uvScale, b0 * uvScale], [a1 * uvScale, b1 * uvScale],
        K(hi) * 1.06, K(hi), K(hi), lidHint);
    }
    // The underside of a drum above a break, or the foot where it shows.
    if (k > 0 || foot) {
      const down = [-lidHint[0], -lidHint[1], -lidHint[2]];
      const fP = map(ca + sa, cb + sb, lo);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const [a0, b0] = innerB[i], [a1, b1] = innerB[j];
        rb.tri(1, fP, map(a0, b0, lo), map(a1, b1, lo),
          cT, [a0 * uvScale, b0 * uvScale], [a1 * uvScale, b1 * uvScale],
          K(lo) * 0.8, K(lo) * 0.8, K(lo) * 0.8, down);
      }
    }
  }
  rb.endPart();
}

/** Cross-fractures down a column: every 0.5–1.5 m, closer near the top. */
function jointsFor(c0, c1, rand, scale = 1) {
  const out = [];
  let c = c0 + (1.1 + rand() * 1.4) * scale;
  while (c < c1 - 0.3) {
    out.push(c);
    c += (1.0 + rand() * 1.6) * scale;
  }
  return out;
}

/* ======================================================================
   STANDING COLUMNS: an outcrop, a colonnade, the piers of a portal
   ====================================================================== */

/**
 * A raft of standing columns, tallest in the middle, broken and gappy at its
 * edge. `ground(x, z)` is the height of the ground under a point, in the
 * raft's own frame, relative to its origin.
 *
 * @returns {{ rb: RockBuilder, count: number }}
 */
export function columnRaft(rb, {
  radius = 7, scale = 1, height = 7.6, pitch = 0.95, seed = 1, ground = null,
  profile = 'dome', t4 = true, x0 = 0, z0 = 0, gappy = 0.85, minH = 0.6, exactH = null
} = {}) {
  const rand = rng(seed);
  const R = radius;
  const wob = a => 1 + 0.18 * noise2(Math.cos(a) * 1.3 + seed * 0.01, Math.sin(a) * 1.3);
  const cells = columnCells({
    minX: x0 - R * 1.25, maxX: x0 + R * 1.25, minZ: z0 - R * 1.25, maxZ: z0 + R * 1.25,
    pitch, seed: seed ^ 0x5bd1,
    keep: (x, z) => Math.hypot(x - x0, z - z0) < R * wob(Math.atan2(z - z0, x - x0))
  });
  let count = 0;
  const map = (a, b, c) => [a, c, b];
  for (const cell of cells) {
    const dx = cell.cx - x0, dz = cell.cz - z0;
    const d = Math.hypot(dx, dz) / (R * wob(Math.atan2(dz, dx)));
    // The edge of a raft is broken and gappy; the middle is solid.
    if (rand() < d * d * d * gappy) continue;
    // Neighbours share a height (the flow cooled as a sheet) and step at
    // breaks, so the profile is low-frequency noise plus a little per column.
    const field = 0.5 + fbm2(cell.cx * 0.18 + seed * 0.37, cell.cz * 0.18, 3);
    let hf;
    if (profile === 'dome') hf = (0.18 + 0.82 * (1 - d * d)) * (0.55 + 0.7 * field);
    else if (profile === 'wall') hf = 0.75 + 0.35 * field;
    else hf = 0.3 + 0.7 * field;
    const h = exactH != null ? exactH : Math.max(minH, height * scale * hf * (0.9 + rand() * 0.2));
    const g = ground ? ground(cell.cx, cell.cz) : 0;
    // Founded on the lowest ground under the cell, so a raft on a slope has
    // no column standing on one corner.
    let gMin = g;
    if (ground) for (const [a, b] of cell.poly) gMin = Math.min(gMin, ground(a, b));
    const c0 = gMin - 0.35;
    const c1 = g + h;
    const broken = exactH == null && rand() < 0.3;
    const ang = rand() * Math.PI * 2;
    const slope = broken ? 0.18 + rand() * 0.45 : 0;
    prism(rb, cell.poly, c0, c1, map, {
      gap: 0.012 + rand() * 0.008,
      chamfer: broken ? 0.012 : 0.03 + rand() * 0.05,
      joints: t4 ? jointsFor(g, c1, rand, scale) : [],
      shift: t4 ? (k => [(rand() - 0.5) * 0.03, (rand() - 0.5) * 0.03]) : null,
      crown: broken ? 0 : (rand() - 0.4) * 0.07,
      tilt: broken ? [Math.cos(ang) * slope, Math.sin(ang) * slope] : null,
      tone: 0.8 + rand() * 0.34,
      shade: c => 0.72 + 0.28 * smoothstep(g - 0.2, g + 1.4, c),
      uvScale: 0.5
    });
    count++;
  }
  return count;
}

/* ======================================================================
   A QUARRY FACE: columns in section, from the floor to the lip
   ====================================================================== */

/**
 * One wall of the cut. The face runs from A to B; `dir` points INTO the pit.
 * The face follows the column joints, because stone quarried out of a
 * colonnade breaks along them, so it is ragged by whole columns rather than
 * ruled; and the front rank has spalled at the top, so the lip steps.
 *
 * @param {object} o
 *   lipAt(x, z)  the pavement height at a point (world)
 *   floorY       the quarry floor
 */
export function columnWall(rb, { ax, az, bx, bz, dirX, dirZ, floorY, floorAt = null, lipAt, seed = 1, pitch = 0.9, t4 = true, depth = 1.6 }) {
  const rand = rng(seed);
  const run = Math.hypot(bx - ax, bz - az);
  const ux = (bx - ax) / run, uz = (bz - az) / run;
  // Local frame: u along the wall, v back INTO the rock (away from the pit).
  const toWorld = (u, v) => [ax + ux * u - dirX * v, az + uz * u - dirZ * v];
  const faceAt = u => -0.25 - 0.45 * (0.5 + noise2(u * 0.35 + seed * 0.1, 3.3));
  const cells = columnCells({
    minX: -0.6, maxX: run + 0.6, minZ: -1.2, maxZ: depth, pitch, seed: seed ^ 0x3c3c,
    keep: (u, v) => v > faceAt(u)
  });
  const map = (a, b, c) => {
    const [x, z] = toWorld(a, b);
    return [x, c, z];
  };
  let count = 0;
  for (const cell of cells) {
    const [wx, wz] = toWorld(cell.cx, cell.cz);
    const lip = lipAt(wx, wz);
    const fy = floorAt ? floorAt(wx, wz) : floorY;
    // Does any of the cell stand out in the open pit? Then its top shows.
    const vMin = Math.min(...cell.poly.map(p => p[1]));
    const exposed = vMin < 0.02;
    let top;
    if (exposed) {
      // Spalled: the front rank has lost its heads, in runs, not one by one.
      const run1 = 0.5 + noise2(cell.cx * 0.28 + seed, 7.1);
      top = lip - Math.max(0, run1 * 1.6 + (rand() - 0.5) * 0.5) - 0.02;
      if (rand() < 0.05) top = lip + 0.12 + rand() * 0.3;    // a stump proud of the lip
    } else {
      // Under the pavement: invisible from above, a face from below.
      top = lip - 0.04;
    }
    const broken = exposed && rand() < 0.45;
    const ang = rand() * Math.PI * 2;
    const slope = broken ? 0.2 + rand() * 0.5 : 0;
    if (top < fy + 0.2) top = fy + 0.2;
    prism(rb, cell.poly, fy - 0.4, top, map, {
      gap: 0.014,
      chamfer: broken ? 0.01 : 0.035,
      joints: t4 && exposed ? jointsFor(fy, top, rand) : [],
      shift: t4 ? (() => [(rand() - 0.5) * 0.04, (rand() - 0.5) * 0.04]) : null,
      crown: broken ? 0 : (rand() - 0.5) * 0.05,
      tilt: broken ? [Math.cos(ang) * slope, Math.sin(ang) * slope] : null,
      tone: 0.78 + rand() * 0.34,
      // Wet and dark at the foot, where the floor's water stands against it.
      shade: c => 0.66 + 0.34 * smoothstep(fy, fy + 1.6, c),
      uvScale: 0.5
    });
    count++;
  }
  return count;
}

/**
 * A slab of column tops sawn level: a terrace or a plinth quarried out of the
 * flow, so its surface is the honeycomb and its edge is ragged by whole
 * columns. Centred on the origin, `hx` by `hz`, top at `top`.
 */
export function sawnSlab(rb, { hx, hz, top, bottom = -0.4, pitch = 0.75, seed = 1, x0 = 0, z0 = 0 }) {
  const rand = rng(seed);
  const cells = columnCells({
    minX: -hx, maxX: hx, minZ: -hz, maxZ: hz, pitch, seed: seed ^ 0x1234,
    keep: (x, z) => Math.abs(x) < hx - pitch * 0.35 && Math.abs(z) < hz - pitch * 0.35
  });
  const map = (a, b, c) => [a + x0, c, b + z0];
  for (const cell of cells) {
    prism(rb, cell.poly, bottom, top - rand() * 0.012, map, {
      gap: 0.01, chamfer: 0.012, crown: 0, tone: 0.82 + rand() * 0.3, uvScale: 0.5
    });
  }
  return cells.length;
}

/**
 * Columns fanned round a round opening in a face (the mouth of a lava tube):
 * each column radial to the opening, in a band from `rIn` to about `rOut`,
 * `depth` deep into the face. `skip(x, y)` keeps a doorway clear.
 */
export function radialRing(rb, { cx, cy, z0, rIn, rOut, depth = 1.2, a0 = 0, a1 = Math.PI, seed = 1, pitch = 0.55, skip = null }) {
  const rand = rng(seed);
  const rMid = (rIn + rOut) / 2;
  const len = (a1 - a0) * rMid;
  const cells = columnCells({ minX: 0, maxX: len, minZ: -depth / 2, maxZ: depth / 2, pitch, seed: seed ^ 0x99 });
  const map = (s, w, r) => {
    const a = a0 + s / rMid;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0 + w];
  };
  let n = 0;
  for (const cell of cells) {
    const a = a0 + cell.cx / rMid;
    const px = cx + Math.cos(a) * rMid, py = cy + Math.sin(a) * rMid;
    if (skip && skip(px, py)) continue;
    const r0 = rIn - rand() * 0.15;
    const r1 = rOut + (rand() - 0.3) * (rOut - rIn) * 0.8;
    prism(rb, cell.poly, r0, r1, map, {
      gap: 0.01, chamfer: 0.03, foot: true, crown: (rand() - 0.3) * 0.04,
      tone: 0.8 + rand() * 0.3, uvScale: 0.5
    });
    n++;
  }
  return n;
}

/**
 * A beam of columns lying horizontal across a gap (a lintel): the section is
 * tessellated in (y, z) and every column runs along x from -half to +half.
 */
export function lintelBeam(rb, { half, y0, y1, hz, seed = 1, pitch = 0.36 }) {
  const rand = rng(seed);
  const cells = columnCells({ minX: y0, maxX: y1, minZ: -hz, maxZ: hz, pitch, seed: seed ^ 0x4d,
    keep: (a, b) => a > y0 + pitch * 0.3 && a < y1 - pitch * 0.3 && Math.abs(b) < hz - pitch * 0.3 });
  const map = (a, b, c) => [c, a, b];
  for (const cell of cells) {
    const e0 = (rand() - 0.5) * 0.2, e1 = (rand() - 0.5) * 0.2;
    prism(rb, cell.poly, -half + e0, half + e1, map, {
      gap: 0.008, chamfer: 0.025, foot: true, tone: 0.8 + rand() * 0.3, uvScale: 0.5
    });
  }
  return cells.length;
}

/* ======================================================================
   THE ARCH: a radial fan of columns round a curved void
   ====================================================================== */

/**
 * A natural arch of columnar basalt, in its own frame: span along x, crown up
 * y, thickness across z. The legs stand at x = ±R and are founded `legDrop`
 * below the origin (deeper where the ground under a foot is lower).
 *
 * THE COLUMNS FAN. A flow that cooled round a void grew its columns
 * perpendicular to the cooling surface, so every column here lies along the
 * arch's own radial direction: horizontal in the legs, vertical over the
 * crown, and a wedge-shaped fan in between. The underside shows a honeycomb
 * of column ends; the flanks show the fan of their lengths.
 *
 * The section is thick in the legs and thin at the crown, lumpy everywhere,
 * and the legs flare into buttresses where they meet the ground.
 */
export function basaltArch(rb, { R = 14, scale = 1, seed = 1, ground = null, legDrop = 2.2, t4 = true }) {
  const rand = rng(seed);
  const H = R * 1.08;                  // crown rise above the springing line
  const yS = 1.6 * scale;              // springing line
  const T0 = 4.2 * scale, T1 = 2.3 * scale;   // radial thickness, feet / crown
  const W0 = 6.6 * scale, W1 = 3.2 * scale;   // breadth across, feet / crown

  /* The centre line, sampled finely and measured by arc length. */
  const pts = [];
  const leg = (sx, y) => pts.push([sx * R + noise2(y * 0.12, sx * 3.1 + seed) * 0.35 * scale, y]);
  const STEP = 0.25;
  for (let y = -legDrop; y < yS; y += STEP) leg(-1, y);
  const NA = Math.ceil((Math.PI * R * 1.1) / STEP);
  for (let i = 0; i <= NA; i++) {
    const th = (i / NA) * Math.PI;
    const s = Math.sin(th);
    const x = -R * Math.cos(th);
    // A little fuller than an ellipse at the haunches, and never symmetric.
    const y = yS + H * Math.pow(s, 0.82) + noise2(th * 1.7 + seed, 2.2) * 0.6 * scale * s;
    pts.push([x, y]);
  }
  for (let y = yS - STEP; y >= -legDrop - 1e-6; y -= STEP) leg(1, y);
  // Arc length, tangent, outward normal (toward the extrados).
  const S = [0];
  for (let i = 1; i < pts.length; i++) {
    S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const L = S[S.length - 1];
  const N = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)];
    const tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    return [-ty / tl, tx / tl];
  });
  const at = s => {
    const t = clamp(s, 0, L);
    let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (S[m] <= t) lo = m; else hi = m;
    }
    const f = (t - S[lo]) / Math.max(S[hi] - S[lo], 1e-6);
    const nx = lerp(N[lo][0], N[hi][0], f), ny = lerp(N[lo][1], N[hi][1], f);
    const nl = Math.hypot(nx, ny) || 1;
    return {
      x: lerp(pts[lo][0], pts[hi][0], f), y: lerp(pts[lo][1], pts[hi][1], f),
      nx: nx / nl, ny: ny / nl
    };
  };
  // How far along the arch from the nearer foot, 0 at the ground, 1 at the crown.
  const toCrown = s => clamp(1 - Math.abs(s - L / 2) / (L / 2), 0, 1);
  const flare = s => {
    const f = at(s);
    const g = ground ? ground(f.x, 0) : 0;
    return 1 + 0.35 * smoothstep(3.5 * scale, 0, f.y - g);
  };
  const T = s => {
    const k = Math.pow(toCrown(s), 0.9);
    return lerp(T0, T1, k) * flare(s) * (1 + 0.12 * noise2(s * 0.15 + seed, 1.7));
  };
  const Wd = s => {
    const k = Math.pow(toCrown(s), 0.7);
    return lerp(W0, W1, k) * flare(s) * (1 + 0.1 * noise2(s * 0.11 - seed, 4.4));
  };
  // The breadth is tessellated in real metres, so a column is as round in
  // the thin crown as in the thick foot; the flank is ragged by whole columns.
  const Wmax = W0 * 1.4;
  const map = (s, w, r) => {
    const f = at(s);
    return [f.x + f.nx * r, f.y + f.ny * r, w];
  };

  const pitch = 0.98 * scale;
  const cells = columnCells({
    minX: 0, maxX: L, minZ: -Wmax / 2, maxZ: Wmax / 2, pitch, seed: seed ^ 0x77a1,
    keep: (s, w) => Math.abs(w) < Wd(s) / 2 - rand() * pitch * 0.8
  });
  let count = 0;
  for (const cell of cells) {
    const f = at(cell.cx);
    const g = ground ? ground(f.x, cell.cz) : 0;
    // Wholly under the ground: nobody will ever see it.
    const half = T(cell.cx) / 2;
    const topY = f.y + Math.max(Math.abs(f.ny) * half, 0) + 0.5;
    if (topY < g - 0.3) continue;
    // Each column's ends stand proud or sit back from the mean surface, which
    // is what makes the soffit a honeycomb in relief rather than a skin.
    const eIn = (rand() - 0.35) * 0.32 * scale;
    const eOut = (rand() - 0.35) * 0.38 * scale;
    const polyS = cell.poly;
    // T varies across the cell, so its ends follow the arch's surfaces.
    const r0 = -half - eIn;
    const r1 = half + eOut;
    const long = r1 - r0;
    const joints = t4 && long > 2.4 ? [r0 + long * (0.4 + rand() * 0.2)] : [];
    prism(rb, polyS, r0, r1, map, {
      gap: 0.012,
      chamfer: 0.035 + rand() * 0.04,
      joints,
      jointGap: 0.02,
      crown: (rand() - 0.3) * 0.06,
      foot: true,
      tone: 0.8 + rand() * 0.32,
      // Darker in the soffit, which the sky never reaches.
      shade: r => 0.72 + 0.28 * smoothstep(-half, half, r),
      uvScale: 0.5
    });
    count++;
  }
  return { count, legHalfX: T0 * 1.35 / 2, legHalfZ: W0 * 1.35 / 2, springY: yS, crownY: yS + H };
}

/* ======================================================================
   BROKEN STONE: talus, spoil, chips, a fallen column
   ====================================================================== */

/** An irregular cross-section, `sides` corners round radius r. */
function chunkSection(sides, r, rand) {
  const poly = [];
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < sides; i++) {
    const a = a0 + (i / sides) * Math.PI * 2 + (rand() - 0.5) * (Math.PI / sides) * 0.8;
    const rr = r * (0.78 + rand() * 0.4);
    poly.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  // Convexity by construction: the corners are sorted by angle and near one
  // radius; the hull of them is the cell.
  return hull(poly);
}

function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

/**
 * A field of broken column lying on a surface — the replacement for the old
 * instanced hexagons, with the same placement rules: an even area fill, kept
 * clear of `avoid` rectangles by each piece's own reach, heaped by `mound`,
 * each piece laid on the ground actually under it.
 */
export function rubbleField(rb, {
  count, minX, maxX, minZ, maxZ, y = 0, seed = 1, scale = 1, mound = 0,
  avoid = [], ground = null, t4 = true, flat = 0.7
}) {
  const rand = rng(seed >>> 0);
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const rx = (maxX - minX) / 2, rz = (maxZ - minZ) / 2;
  const clearOf = (px, pz, reach) => avoid.every(a =>
    px < a.minX - reach || px > a.maxX + reach || pz < a.minZ - reach || pz > a.maxZ + reach);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  let placed = 0;
  for (let i = 0; i < count; i++) {
    const r = (0.16 + Math.pow(rand(), 1.6) * 0.34) * scale;
    const h = (0.35 + rand() * 1.5) * scale;
    let rr = 0, px = 0, pz = 0, ok = false;
    for (let tries = 0; tries < 12 && !ok; tries++) {
      const a = rand() * Math.PI * 2;
      rr = Math.sqrt(rand());
      px = cx + Math.cos(a) * rr * rx;
      pz = cz + Math.sin(a) * rr * rz;
      ok = clearOf(px, pz, h / 2 + r);
    }
    if (!ok) continue;
    const lift = mound * (1 - rr) * (1 - rr);
    // Most pieces lie on a side; some stand on end where they fell against
    // something, which is what keeps a heap from reading as spilled pencils.
    const lying = rand() < flat;
    e.set(
      lying ? Math.PI / 2 + (rand() - 0.5) * 0.7 : (rand() - 0.5) * 0.5,
      rand() * Math.PI * 2,
      (rand() - 0.5) * (lying ? 0.8 : 0.4)
    );
    q.setFromEuler(e);
    const base = y + (ground ? ground(px, pz) : 0);
    const rest = lying ? r * 0.8 : h * 0.42;
    v.set(px, base + lift + rest, pz);
    m4.compose(v, q, new THREE.Vector3(1, 1, 1));
    const sides = 4 + Math.floor(rand() * 4);
    const sec = chunkSection(sides, r, rand);
    const ga = (rand() - 0.5) * 1.1, gb = (rand() - 0.5) * 1.1;
    const ha = (rand() - 0.5) * 0.9;
    const tmp = new THREE.Vector3();
    const map = (a, b, c) => {
      // Both ends broken at a slant: c is shifted across the section.
      tmp.set(a, c, b).applyMatrix4(m4);
      return [tmp.x, tmp.y, tmp.z];
    };
    // The head is snapped at a slant (prism's tilt); the foot sits off-centre.
    const c0 = -h / 2 + (ha * r);
    const c1 = h / 2;
    prism(rb, sec, c0, c1, map, {
      gap: 0,
      chamfer: r * (0.05 + rand() * 0.12),
      joints: [],
      tilt: [ga * 0.8, gb * 0.8],
      crown: 0,
      foot: true,
      tone: 0.78 + rand() * 0.36,
      uvScale: 0.5
    });
    placed++;
  }
  return placed;
}

/**
 * One toppled column, lying where it fell and snapped into drums that rolled
 * a little apart and stayed in line. `len` metres long, centred on the origin
 * along local x.
 */
export function fallenColumn(rb, { len = 4.4, r = 0.5, seed = 1, ground = null, t4 = true, at = [0, 0], yaw = 0 }) {
  const rand = rng(seed);
  const sec = chunkSection(6, r, rand);
  const n = 5;
  const lens = [], gaps = [];
  for (let i = 0; i < n; i++) {
    lens.push(0.7 + rand() * 1.5);
    gaps.push(i < n - 1 ? 0.04 + rand() * 0.18 : 0);
  }
  const raw = lens.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  const fit = len / raw;
  let along = -len / 2;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const tmp = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const L = lens[i] * fit;
    const mid = along + L / 2;
    const sz = (rand() - 0.5) * 0.3;
    const roll = rand() * Math.PI * 2;
    // Axis along x: c runs along the ground, the section stands in (y, z).
    q.setFromEuler(new THREE.Euler(roll, yaw + (rand() - 0.5) * 0.14, -Math.PI / 2, 'YXZ'));
    const px = at[0] + mid * Math.cos(yaw) + sz * Math.sin(yaw);
    const pz = at[1] - mid * Math.sin(yaw) + sz * Math.cos(yaw);
    const gy = ground ? ground(px, pz) : 0;
    m4.compose(new THREE.Vector3(px, gy + r * 0.8 - 0.08, pz), q, new THREE.Vector3(1, 1, 1));
    const map = (a, b, c) => {
      tmp.set(a, c, b).applyMatrix4(m4);
      return [tmp.x, tmp.y, tmp.z];
    };
    prism(rb, sec, -L / 2, L / 2, map, {
      gap: 0,
      chamfer: 0.03 + rand() * 0.04,
      tilt: [(rand() - 0.5) * 0.3, (rand() - 0.5) * 0.3],
      foot: true,
      tone: 0.82 + rand() * 0.25,
      uvScale: 0.5
    });
    along += L + gaps[i] * fit;
  }
}
