/**
 * bellows/decks.js — Everything built of steel and concrete that the walk stands on or inside: the decks,
 * catwalks and ramps with their rails and the lattice legs under them, the six rooms, the passages, and
 * the structures the rooms are part of (the tower's plinth, the sphere on its skirt, the piston holder,
 * the cold box, the gondola and the two bladders).
 *
 * All of it stands on `works-plan.js`: a deck is drawn where a volume is declared, a rail where the plan
 * found a drop, a wall where a room's side is closed. Everything here is `phys: 'ground'` (the walk's own
 * fabric) and merged per material, so it costs a draw per material, not per piece.
 *
 * The deck plate is its own mesh (`buildDeckPlate`): tread plate laid in metres, coloured per vertex so the
 * lines people walk between doorways show scuffed bright and the rest is dulled with grime.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { floorOf } from '../lib/workings.js';
import {
  SEA, LEVEL, PLINTH, SPHERE, HOLDER, COLDBOX, BAGS, bagBelly, WALL_HALF, OPEN_KINDS
} from './works-plan.js';

const LAMP = 0xd99423;

/* ======================================================================
   NOISE (deterministic)
   ====================================================================== */

function hash2(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function fbm2(x, z, seed, oct = 3) {
  let s = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += vnoise(x * f, z * f, seed + i * 31) * amp; n += amp; f *= 2.03; amp *= 0.5; }
  return s / n;
}

/* ======================================================================
   BUCKETS: everything built here is merged per material
   ====================================================================== */

export function bucketer() {
  const buckets = new Map();
  const push = (key, g) => { let a = buckets.get(key); if (!a) { a = []; buckets.set(key, a); } a.push(g); };
  const box = (key, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) => {
    if (sx <= 0.001 || sy <= 0.001 || sz <= 0.001) return;
    const g = new THREE.BoxGeometry(sx, sy, sz);
    if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
    g.translate(x, y, z);
    push(key, g);
  };
  /** A box spanning [x0, x1] x [y0, y1] x [z0, z1]. */
  const span = (key, x0, x1, y0, y1, z0, z1) => box(key, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const cyl = (key, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
    g.translate(x, y, z);
    push(key, g);
  };
  /** A bar of section w x h from point a to point b. */
  const beam = (key, a, b, w, h) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    if (len < 0.01) return;
    const g = new THREE.BoxGeometry(w, h, len);
    const up = Math.abs(dir.y) / len > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4().lookAt(vb, va, up);
    g.applyMatrix4(m);
    const mid = va.add(vb).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    push(key, g);
  };
  /** A round bar from a to b. */
  const rod = (key, a, b, r, seg = 6) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    if (len < 0.01) return;
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
    const mid = va.add(vb).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    push(key, g);
  };
  const geo = (key, g) => push(key, g);
  return { buckets, box, span, cyl, beam, rod, geo };
}

/** Lay a merged geometry's uvs in metres from its faces' facing, so a plate texture is the same size everywhere. */
function worldUV(geo, tile = 3) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / tile; uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uv.slice(), 2));
}

/** Material keys whose own uvs carry meaning (a curved skin, glass): their uvs are left as built. */
const KEEP_UV = new Set(['glass', 'skin', 'canvas', 'cloud', 'lantern']);

export function flush(ctx, buckets, group, prefix, { phys = 'ground', shadow = true } = {}) {
  for (const [key, geos] of buckets) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos.map(g => (g.index ? g.toNonIndexed() : g)), false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    merged.computeVertexNormals();
    if (!KEEP_UV.has(key)) worldUV(merged);
    else if (!merged.attributes.uv1 && merged.attributes.uv) merged.setAttribute('uv1', merged.attributes.uv.clone());
    ctx.own(merged);
    const mesh = new THREE.Mesh(merged, ctx.M[key] || ctx.M.steel);
    mesh.name = `${prefix}:${key}`;
    mesh.castShadow = ctx.t4 && shadow && !['glass', 'lantern'].includes(key);
    mesh.receiveShadow = ctx.t4;
    mesh.userData.phys = phys;
    mesh.userData.noWeather = true;
    group.add(mesh);
  }
}

/** A side's segment `{ ax, az, bx, bz, side }` as a box spanning ±`half` about its plane between heights y0 and y1. */
function wallBox(B, key, seg, y0, y1, half = WALL_HALF, ext = half) {
  if (y1 - y0 < 0.01) return;
  if (seg.side === 'minX' || seg.side === 'maxX') {
    const lo = Math.min(seg.az, seg.bz) - ext, hi = Math.max(seg.az, seg.bz) + ext;
    B.span(key, seg.ax - half, seg.ax + half, y0, y1, lo, hi);
  } else {
    const lo = Math.min(seg.ax, seg.bx) - ext, hi = Math.max(seg.ax, seg.bx) + ext;
    B.span(key, lo, hi, y0, y1, seg.az - half, seg.az + half);
  }
}

/** An opening's segment on its volume's side. */
function openingSeg(v, op) {
  const r = v.rect;
  const plane = r[op.side];
  return op.side === 'minX' || op.side === 'maxX'
    ? { side: op.side, ax: plane, az: op.lo, bx: plane, bz: op.hi }
    : { side: op.side, ax: op.lo, az: plane, bx: op.hi, bz: plane };
}

/* ======================================================================
   THE LATTICE LEG: what every deck stands on, down into the cloud
   ====================================================================== */

/** A four-chord lattice tower from `top` down past the cloud's top, `w` across, K-braced every 3.5 m. */
function latticeLeg(B, x, z, top, w = 1.6) {
  const h = w / 2;
  const bottom = SEA - 6;
  const corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
  for (const [dx, dz] of corners) B.span('darkSteel', x + dx - 0.11, x + dx + 0.11, bottom, top, z + dz - 0.11, z + dz + 0.11);
  for (let y = top - 0.6; y > bottom + 1; y -= 3.5) {
    for (let k = 0; k < 4; k++) {
      const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4];
      B.beam('darkSteel', [x + ax, y, z + az], [x + bx, y, z + bz], 0.09, 0.09);
      B.beam('darkSteel', [x + ax, y, z + az], [x + bx, y - 3.5, z + bz], 0.07, 0.07);
    }
  }
  // A cap plate under the deck framing.
  B.span('darkSteel', x - h - 0.25, x + h + 0.25, top - 0.08, top, z - h - 0.25, z + h + 0.25);
}

/* ======================================================================
   THE DECK PLATE (vertex-coloured tread plate, one mesh)
   ====================================================================== */

/** Distance from (x, z) to segment a-b. */
function segDist(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L));
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
}

/** The lines walked over one open volume: between every pair of its doorways, through its middle. */
function wornLines(plan, v) {
  const doors = v.openings.filter(o => o.pass !== false).map(o => plan.doorPoint(v, o));
  const r = v.rect;
  const mid = [(r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2];
  const lines = [];
  for (let i = 0; i < doors.length; i++) for (let j = i + 1; j < doors.length; j++) {
    const a = doors[i], b = doors[j];
    // A walker cuts across a deck on a dog-leg through its middle, not along its edge.
    if (Math.abs(a[0] - b[0]) > 1 && Math.abs(a[1] - b[1]) > 1) { lines.push([a, mid], [mid, b]); } else lines.push([a, b]);
  }
  return lines;
}

/** The walking surface of every open volume: tread plate in metres, worn bright on the lines walked. */
export function buildDeckPlate(plan, extra = []) {
  const pos = [], uv = [], col = [], idx = [];
  const add = (v, lines) => {
    const r = v.rect;
    const nx = Math.max(2, Math.round((r.maxX - r.minX) / 1)), nz = Math.max(2, Math.round((r.maxZ - r.minZ) / 1));
    const base = pos.length / 3;
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const x = r.minX + (r.maxX - r.minX) * (i / nx), z = r.minZ + (r.maxZ - r.minZ) * (j / nz);
        const xi = Math.min(r.maxX - 1e-4, x), zi = Math.min(r.maxZ - 1e-4, z);
        pos.push(x, floorOf(v, xi, zi) + 0.005, z);
        uv.push(x / 3, z / 3);
        let d = Infinity;
        for (const [a, b] of lines) d = Math.min(d, segDist(x, z, a, b));
        const wear = Math.exp(-(d * d) / 2.2);
        const grime = fbm2(x * 0.18, z * 0.18, 11, 3);
        const blot = fbm2(x * 0.9, z * 0.9, 17, 2);
        // Bright where boots polish the bars, dulled grey-brown where nobody walks, darkest at the edges by the rail.
        const edge = Math.min(x - r.minX, r.maxX - x, z - r.minZ, r.maxZ - z);
        const kerb = Math.max(0, 1 - edge / 0.9) * (v.kind === 'deck' ? 0.2 : 0.12);
        let g = 0.78 + wear * 0.26 - (grime - 0.45) * 0.3 - (blot > 0.68 ? (blot - 0.68) * 0.9 : 0) - kerb;
        g = Math.max(0.42, Math.min(1.08, g));
        col.push(g * 0.99, g * 0.98, g * 0.95);
      }
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = base + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  };
  for (const v of plan.openVols) add(v, wornLines(plan, v));
  for (const v of extra) add(v, wornLines(plan, v));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ======================================================================
   THE SHELLS
   ====================================================================== */

/**
 * @returns {{ group: THREE.Group, lamps: object[] }} the whole built fabric of the works, merged, and the lamps it
 *   carries (rail lamps and passage lamps) as `{ x, y, z }` for the world to make pooled lamp marks of.
 */
export function buildWorks(ctx, plan) {
  const group = new THREE.Group();
  group.name = 'bellows-works';
  group.userData.phys = 'ground';
  group.userData.noWeather = true;
  const B = bucketer();
  const lamps = [];

  for (const v of plan.openVols) openFrame(B, plan, v);
  rails(B, plan, lamps);
  plinth(B, plan);
  for (const v of plan.roofedVols) {
    if (v.kind === 'room') room(B, plan, v, lamps);
    else if (v.id === 'holder-door') holderPassage(B, v, lamps);
    else lamps.push({ x: (v.rect.minX + v.rect.maxX) / 2, y: v.floor.y0 + 3.6, z: (v.rect.minZ + v.rect.maxZ) / 2, fixture: 'ceiling' });
  }
  sphere(B);
  holder(B);
  coldBox(B, plan);
  bags(B, plan);

  flush(ctx, B.buckets, group, 'works');
  return { group, lamps };
}

/* ---------------------------------------------- the open floors and their legs */

function openFrame(B, plan, v) {
  const r = v.rect;
  const f = v.floor;
  const graded = f.y1 !== undefined && f.y1 !== f.y0;
  const alongX = graded ? f.axis === 'x' : (r.maxX - r.minX) >= (r.maxZ - r.minZ);
  const len = alongX ? r.maxX - r.minX : r.maxZ - r.minZ;
  const wid = alongX ? r.maxZ - r.minZ : r.maxX - r.minX;
  const at = (s, t) => (alongX ? [s, t] : [t, s]);
  const s0 = alongX ? r.minX : r.minZ, s1 = alongX ? r.maxX : r.maxZ;
  const t0 = alongX ? r.minZ : r.minX, t1 = alongX ? r.maxZ : r.maxX;
  const y = s => { const [x, z] = at(Math.min(s1 - 1e-4, s), (t0 + t1) / 2); return floorOf(v, x, z); };

  // The plate's own thickness: short level pieces following the grade.
  for (let s = s0; s < s1 - 1e-6; s += 1) {
    const e = Math.min(s1, s + 1);
    const top = Math.min(y(s), y(e)) - 0.02;
    const [xa, za] = at(s, t0), [xb, zb] = at(e, t1);
    B.span('steel', Math.min(xa, xb), Math.max(xa, xb), top - 0.28, top, Math.min(za, zb), Math.max(za, zb));
  }

  if (v.kind === 'deck') {
    // Fascia channels round the edge and a grid of beams under the plate.
    for (const [a, b] of [[[r.minX, r.minZ], [r.maxX, r.minZ]], [[r.maxX, r.minZ], [r.maxX, r.maxZ]], [[r.maxX, r.maxZ], [r.minX, r.maxZ]], [[r.minX, r.maxZ], [r.minX, r.minZ]]]) {
      B.beam('darkSteel', [a[0], f.y0 - 0.5, a[1]], [b[0], f.y0 - 0.5, b[1]], 0.18, 0.62);
    }
    for (let s = s0 + 3; s < s1 - 1; s += 3) {
      const [xa, za] = at(s, t0), [xb, zb] = at(s, t1);
      B.beam('darkSteel', [xa, f.y0 - 0.62, za], [xb, f.y0 - 0.62, zb], 0.22, 0.6);
    }
    for (const t of [t0 + wid * 0.25, t0 + wid * 0.75]) {
      const [xa, za] = at(s0, t), [xb, zb] = at(s1, t);
      B.beam('darkSteel', [xa, f.y0 - 1.0, za], [xb, f.y0 - 1.0, zb], 0.3, 0.42);
    }
    // Legs: at the corners, and along the long sides at most 14 m apart.
    const n = Math.max(1, Math.ceil((len - 3) / 14));
    for (let i = 0; i <= n; i++) {
      const s = s0 + 1.5 + (len - 3) * (i / n);
      for (const t of [t0 + 1.5, t1 - 1.5]) { const [x, z] = at(s, t); latticeLeg(B, x, z, f.y0 - 1.21, 1.6); }
    }
    return;
  }

  // A catwalk or a ramp: two stringers along its sides, a Warren truss under each, a leg at mid-span when it is long.
  const stringer = t => {
    const pts = [];
    for (let s = s0; s <= s1 + 1e-6; s += Math.max(1, len / Math.ceil(len / 2))) pts.push(s);
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, za] = at(pts[i], t), [xb, zb] = at(pts[i + 1], t);
      B.beam('darkSteel', [xa, y(pts[i]) - 0.45, za], [xb, y(pts[i + 1]) - 0.45, zb], 0.16, 0.5);
      B.beam('darkSteel', [xa, y(pts[i]) - 1.75, za], [xb, y(pts[i + 1]) - 1.75, zb], 0.12, 0.14);
      const top = i % 2 === 0 ? [xa, y(pts[i]) - 0.6, za] : [xa, y(pts[i]) - 1.7, za];
      const bot = i % 2 === 0 ? [xb, y(pts[i + 1]) - 1.7, zb] : [xb, y(pts[i + 1]) - 0.6, zb];
      B.beam('darkSteel', top, bot, 0.08, 0.08);
    }
  };
  stringer(t0 + 0.15);
  stringer(t1 - 0.15);
  for (let s = s0 + 1; s < s1; s += 2) {
    const [xa, za] = at(s, t0 + 0.15), [xb, zb] = at(s, t1 - 0.15);
    B.beam('darkSteel', [xa, y(s) - 1.75, za], [xb, y(s) - 1.75, zb], 0.08, 0.08);
  }
  if (len > 18) {
    const s = (s0 + s1) / 2;
    const [x, z] = at(s, (t0 + t1) / 2);
    latticeLeg(B, x, z, y(s) - 1.82, Math.min(2.4, wid - 0.4));
  }
}

/* ---------------------------------------------- rails, and the lamps on them */

/** An open railing: a toe board, a knee rail and a hand rail on posts 2 m apart. Below the eye. */
function rails(B, plan, lamps) {
  for (const s of plan.railSegments()) {
    if (s.kind !== 'rail') continue;
    const H = 1.1;
    const dx = s.bx - s.ax, dz = s.bz - s.az;
    const len = Math.hypot(dx, dz);
    B.beam('darkSteel', [s.ax, s.ya + 0.08, s.az], [s.bx, s.yb + 0.08, s.bz], 0.05, 0.16);
    B.rod('steel', [s.ax, s.ya + H * 0.5, s.az], [s.bx, s.yb + H * 0.5, s.bz], 0.022);
    B.rod('steel', [s.ax, s.ya + H, s.az], [s.bx, s.yb + H, s.bz], 0.032);
    const n = Math.max(1, Math.round(len / 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      B.box('darkSteel', 0.06, H, 0.06, s.ax + dx * t, s.ya + (s.yb - s.ya) * t + H / 2, s.az + dz * t);
    }
    // A lamp standard on the rail every 12 m or so, its arm reaching in over the walk.
    if (len >= 5) {
      const k = Math.max(1, Math.round(len / 12));
      for (let i = 0; i < k; i++) {
        const t = (i + 0.5) / k;
        const x = s.ax + dx * t, z = s.az + dz * t, y0 = s.ya + (s.yb - s.ya) * t;
        B.box('darkSteel', 0.09, 3.2, 0.09, x, y0 + 1.6, z);
        const ix = x + s.dirX * 0.55, iz = z + s.dirZ * 0.55;
        B.beam('darkSteel', [x, y0 + 3.1, z], [ix, y0 + 3.1, iz], 0.05, 0.05);
        B.cyl('darkSteel', 0.12, 0.2, 0.12, 8, ix, y0 + 3.02, iz);
        lamps.push({ x: ix, y: y0 + 2.86, z: iz, fixture: 'rail' });
      }
    }
  }
}

/* ---------------------------------------------- the Compressor's plinth, with the base hall and its passage in it */

function plinth(B, plan) {
  const hall = plan.byId.get('room-2').rect, door = plan.byId.get('tower-door').rect;
  const xs = [PLINTH.minX, hall.minX, hall.maxX, PLINTH.maxX];
  const zs = [PLINTH.minZ, hall.minZ, door.minZ, door.maxZ, hall.maxZ, PLINTH.maxZ];
  const BOT = -6.5, TOP = PLINTH.top, HALL_ROOF = LEVEL.tower + 5.2, DOOR_ROOF = LEVEL.tower + 4.2;
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    const inHall = cx > hall.minX && cx < hall.maxX && cz > hall.minZ && cz < hall.maxZ;
    const inDoor = cx > door.minX && cx < door.maxX && cz > door.minZ && cz < door.maxZ;
    if (inHall || inDoor) {
      B.span('concrete', xs[i], xs[i + 1], BOT, LEVEL.tower, zs[j], zs[j + 1]);
      B.span('concrete', xs[i], xs[i + 1], inHall ? HALL_ROOF : DOOR_ROOF, TOP, zs[j], zs[j + 1]);
    } else {
      B.span('concrete', xs[i], xs[i + 1], BOT, TOP, zs[j], zs[j + 1]);
    }
  }
  // The plinth's top: a steel cap with a kerb, and four great legs under it.
  B.span('darkSteel', PLINTH.minX - 0.15, PLINTH.maxX + 0.15, TOP, TOP + 0.12, PLINTH.minZ - 0.15, PLINTH.maxZ + 0.15);
  for (const [x, z] of [[-10, -24], [10, -24], [-10, 4], [10, 4]]) latticeLeg(B, x, z, BOT, 3.2);
  // Pilasters down the plinth's open faces (west, north), so the concrete reads as a cast block.
  for (let z = PLINTH.minZ + 2; z < PLINTH.maxZ - 1; z += 4) B.span('concrete', PLINTH.minX - 0.45, PLINTH.minX, BOT, TOP, z - 0.4, z + 0.4);
  for (let x = PLINTH.minX + 2; x < PLINTH.maxX - 1; x += 4) B.span('concrete', x - 0.4, x + 0.4, BOT, TOP, PLINTH.minZ - 0.45, PLINTH.minZ);
  // Inside the hall: two crane girders under the roof, running across the hall clear of the plate's line.
  for (const z of [hall.minZ + 2.2, hall.maxZ - 2.2]) B.span('darkSteel', hall.minX, hall.maxX, HALL_ROOF - 0.55, HALL_ROOF, z - 0.2, z + 0.2);
  B.span('darkSteel', hall.minX + 0.4, hall.minX + 1.0, HALL_ROOF - 0.9, HALL_ROOF - 0.55, hall.minZ + 2, hall.maxZ - 2);
  // Pilasters inside the hall's side walls.
  for (let x = hall.minX + 1.75; x < hall.maxX; x += 3.5) {
    for (const z of [hall.minZ + 0.2, hall.maxZ - 0.2]) B.span('concrete', x - 0.3, x + 0.3, LEVEL.tower, HALL_ROOF, z - 0.2, z + 0.2);
  }
}

/* ---------------------------------------------- the rooms */

const ROOM_MAT = {
  skirt: { wall: 'steel', roof: 'darkSteel', floor: 'grating' },
  hall: { wall: 'concrete', roof: 'concrete', floor: 'concrete' },
  meter: { wall: 'steel', roof: 'darkSteel', floor: 'grating' },
  gondola: { wall: 'cladding', roof: 'cladding', floor: 'grating' },
  cradle: { wall: 'canvas', roof: 'skin', floor: 'grating' },
  casing: { wall: 'ribbed', roof: 'darkSteel', floor: 'grating' }
};

function room(B, plan, v, lamps) {
  const rm = v.room;
  const r = rm.rect;
  const y0 = rm.floor;
  const M = ROOM_MAT[rm.shell];
  const roofY = y0 + rm.top;
  const top = roofY + 0.45;

  switch (rm.shell) {
    case 'skirt': {
      B.span(M.floor, r.minX - 0.3, r.maxX + 0.3, y0 - 0.4, y0, r.minZ - 0.3, r.maxZ + 0.3);
      for (const s of plan.wallSegments(v)) wallBox(B, M.wall, s, y0 - 0.6, top);
      for (const op of v.openings) wallBox(B, M.wall, openingSeg(v, op), y0 + 4.4, top, WALL_HALF, 0);
      B.span(M.roof, r.minX - 0.3, r.maxX + 0.3, roofY, top, r.minZ - 0.3, r.maxZ + 0.3);
      skirtStiffeners(B, plan, v);
      // Radial beams under the catch deck, and the sphere's drain nozzle through it.
      const cx = SPHERE.x, cz = SPHERE.z;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        B.beam('darkSteel', [cx + Math.cos(a) * 0.8, roofY - 0.2, cz + Math.sin(a) * 0.8], [cx + Math.cos(a) * 6.6, roofY - 0.2, cz + Math.sin(a) * 6.6], 0.2, 0.38);
      }
      B.cyl('darkSteel', 0.9, 0.9, 0.35, 16, cx, roofY - 0.18, cz);
      B.cyl('brass', 0.35, 0.35, 0.2, 12, cx, roofY - 0.42, cz);
      // The skirt rises on above the deck to carry the sphere; columns at the corners up to its shell.
      skirtBand(B, r, top);
      return;
    }
    case 'hall':
      // The hall is cast into the plinth (`plinth`); only its floor's drain channel is added.
      B.span('darkSteel', r.minX + 0.6, r.maxX - 0.6, y0, y0 + 0.02, r.minZ + 0.5, r.minZ + 0.8);
      return;
    case 'meter': {
      // Low plated partitions of the meter house inside the drum; the piston overhead is the roof (`holder`).
      for (const s of plan.wallSegments(v)) wallBox(B, M.wall, s, y0, y0 + 2.6, 0.12, 0.12);
      for (const s of plan.wallSegments(v)) {
        const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
        const n = Math.max(1, Math.round(len / 1.6));
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          B.box('darkSteel', 0.1, 2.7, 0.1, s.ax + (s.bx - s.ax) * t, y0 + 1.35, s.az + (s.bz - s.az) * t);
        }
        wallBox(B, 'darkSteel', s, y0 + 2.6, y0 + 2.72, 0.16, 0.16);
      }
      return;
    }
    case 'gondola': {
      gondola(B, plan, v);
      return;
    }
    case 'cradle': {
      cradle(B, plan, v);
      return;
    }
    case 'casing': {
      B.span(M.floor, r.minX - 0.3, r.maxX + 0.3, y0 - 0.4, y0, r.minZ - 0.3, r.maxZ + 0.3);
      for (const s of plan.wallSegments(v)) wallBox(B, M.wall, s, y0 - 0.6, COLDBOX.top);
      for (const op of v.openings) wallBox(B, M.wall, openingSeg(v, op), y0 + 4.4, COLDBOX.top, WALL_HALF, 0);
      B.span(M.roof, r.minX, r.maxX, roofY, top, r.minZ, r.maxZ);
      // The box's floor beams overhead, running across the plate's line at the walls only.
      for (let x = r.minX + 1.75; x < r.maxX; x += 3.5) B.span('darkSteel', x - 0.12, x + 0.12, roofY - 0.4, roofY, r.minZ, r.maxZ);
      // Frost on the casing's inside at the floor, where the cold leaks through the perlite.
      for (const s of plan.wallSegments(v)) wallBox(B, 'rime', s, y0, y0 + 0.5, WALL_HALF + 0.03, 0);
      return;
    }
    default:
      break;
  }
}

/** Vertical stiffeners on the inside of the skirt's plating. */
function skirtStiffeners(B, plan, v) {
  const r = v.rect, y0 = v.room.floor, roofY = y0 + v.room.top;
  for (const s of plan.wallSegments(v)) {
    const along = s.side === 'minZ' || s.side === 'maxZ';
    const lo = s.from, hi = s.to;
    for (let t = lo + 0.6; t < hi - 0.3; t += 1.75) {
      const inward = 0.3 + 0.12;
      if (along) {
        const z = s.side === 'minZ' ? r.minZ + inward : r.maxZ - inward;
        B.span('darkSteel', t - 0.06, t + 0.06, y0, roofY, z - 0.12, z + 0.12);
      } else {
        const x = s.side === 'minX' ? r.minX + inward : r.maxX - inward;
        B.span('darkSteel', x - 0.12, x + 0.12, y0, roofY, t - 0.06, t + 0.06);
      }
    }
  }
}

/** The skirt above the catch deck, and the columns at its corners up to the sphere's shell. */
function skirtBand(B, r, from) {
  const S = SPHERE.skirt;
  const cy = from + SPHERE.r;            // the sphere's centre: it rests on the catch deck at its lowest point
  const mid = cy - Math.sqrt(SPHERE.r ** 2 - ((S.maxX - S.minX) / 2) ** 2);
  B.span('steel', S.minX, S.maxX, from, mid, S.minZ, S.minZ + 0.6);
  B.span('steel', S.minX, S.maxX, from, mid, S.maxZ - 0.6, S.maxZ);
  B.span('steel', S.minX, S.minX + 0.6, from, mid, S.minZ + 0.6, S.maxZ - 0.6);
  B.span('steel', S.maxX - 0.6, S.maxX, from, mid, S.minZ + 0.6, S.maxZ - 0.6);
  B.span('darkSteel', S.minX - 0.2, S.maxX + 0.2, mid, mid + 0.4, S.minZ - 0.2, S.maxZ + 0.2);
  const half = (S.maxX - S.minX) / 2;
  const corner = cy - Math.sqrt(Math.max(0, SPHERE.r ** 2 - 2 * half * half));
  for (const [x, z] of [[r.minX, r.minZ], [r.maxX, r.minZ], [r.maxX, r.maxZ], [r.minX, r.maxZ]]) {
    B.span('darkSteel', x - 0.3, x + 0.3, r.minX === x && r.minZ === z ? from - 6 : from - 6, corner + 0.5, z - 0.3, z + 0.3);
  }
}

/* ---------------------------------------------- the sphere */

function sphere(B) {
  const r = SPHERE.skirt;
  const roofTop = LEVEL.sphere + 5.2 + 0.45;
  const cy = roofTop + SPHERE.r;
  const g = new THREE.SphereGeometry(SPHERE.r, 48, 32);
  g.translate(SPHERE.x, cy, SPHERE.z);
  B.geo('cladding', g);
  // The equator girder, a ring of meridian seams, the top manway and relief valves.
  const eq = new THREE.TorusGeometry(SPHERE.r + 0.12, 0.22, 6, 64);
  eq.rotateX(Math.PI / 2);
  eq.translate(SPHERE.x, cy, SPHERE.z);
  B.geo('darkSteel', eq);
  for (const dy of [-5.5, 5.5]) {
    const rr = Math.sqrt(SPHERE.r ** 2 - dy * dy) + 0.06;
    const ring = new THREE.TorusGeometry(rr, 0.08, 4, 56);
    ring.rotateX(Math.PI / 2);
    ring.translate(SPHERE.x, cy + dy, SPHERE.z);
    B.geo('darkSteel', ring);
  }
  B.cyl('darkSteel', 1.1, 1.3, 0.8, 16, SPHERE.x, cy + SPHERE.r + 0.2, SPHERE.z);
  for (const [dx, dz] of [[-2.2, 0.4], [1.9, -1.2]]) {
    const yy = cy + Math.sqrt(SPHERE.r ** 2 - dx * dx - dz * dz);
    B.cyl('brass', 0.22, 0.28, 1.2, 10, SPHERE.x + dx, yy + 0.5, SPHERE.z + dz);
  }
  // Legs under the skirt, into the cloud.
  for (const [x, z] of [[r.minX + 2, r.minZ + 2], [r.maxX - 2, r.minZ + 2], [r.minX + 2, r.maxZ - 2], [r.maxX - 2, r.maxZ - 2]]) latticeLeg(B, x, z, LEVEL.sphere - 0.61, 2.2);
}

/* ---------------------------------------------- the piston holder */

/** An open arc of a cylinder: a band of wall, its normals outward or inward. */
function arc(r, y0, y1, t0, tl, seg, inward = false) {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg, 1, true, t0, tl);
  g.translate(0, (y0 + y1) / 2, 0);
  if (inward) {
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t; }
  }
  return g;
}

function holder(B) {
  const { x: hx, z: hz, r: R } = HOLDER;
  const y0 = LEVEL.holder;
  const doorTop = y0 + 4.2 + 0.45;
  const gap = Math.asin(3.2 / R);
  const EAST = Math.PI / 2;               // CylinderGeometry: theta 0 is +z, pi/2 is +x
  const add = (key, g) => { g.translate(hx, 0, hz); B.geo(key, g); };
  // The shell, outside face and inside face, with the door left out at the foot.
  for (const [rr, inward] of [[R + 0.1, false], [R - 0.1, true]]) {
    add('steel', arc(rr, y0 - 0.45, HOLDER.top, EAST + gap, Math.PI * 2 - 2 * gap, 64, inward));
    add('steel', arc(rr, doorTop, HOLDER.top, EAST - gap, 2 * gap, 6, inward));
  }
  // The floor of the drum and the dome on top.
  B.cyl('grating', R, R, 0.4, 48, hx, y0 - 0.2, hz);
  const dome = new THREE.SphereGeometry(R * 1.45, 40, 10, 0, Math.PI * 2, 0, 0.75);
  dome.translate(hx, HOLDER.top - R * 1.45 * Math.cos(0.75), hz);
  B.geo('darkSteel', dome);
  // Stanchions round the outside and ring girders, the door's two jambs left clear.
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2 + Math.PI / 24;
    const c = Math.cos(a), s = Math.sin(a);
    if (Math.abs(Math.atan2(s, c)) < gap + 0.1) continue;
    const x = hx + c * (R + 0.35), z = hz + s * (R + 0.35);
    B.box('darkSteel', 0.4, HOLDER.top - y0 + 0.5, 0.4, x, (HOLDER.top + y0 - 0.5) / 2, z, 0, -a, 0);
  }
  for (let y = y0 + 8; y < HOLDER.top; y += 7) {
    const ring = new THREE.TorusGeometry(R + 0.4, 0.16, 4, 64);
    ring.rotateX(Math.PI / 2);
    ring.translate(hx, y, hz);
    B.geo('darkSteel', ring);
  }
  // The piston, parked on its stops: a ribbed disc with its seal, 5.2 m over the floor.
  const pY = y0 + 5.2;
  B.cyl('darkSteel', R - 0.25, R - 0.25, 0.6, 48, hx, pY + 0.3, hz);
  const seal = new THREE.TorusGeometry(R - 0.2, 0.14, 6, 64);
  seal.rotateX(Math.PI / 2);
  seal.translate(hx, pY + 0.15, hz);
  B.geo('rubber', seal);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    B.beam('steel', [hx + Math.cos(a) * 1.2, pY - 0.15, hz + Math.sin(a) * 1.2], [hx + Math.cos(a) * (R - 0.6), pY - 0.15, hz + Math.sin(a) * (R - 0.6)], 0.16, 0.3);
    // A landing stop on the shell under the piston's rim.
    B.box('darkSteel', 0.5, 0.6, 0.3, hx + Math.cos(a) * (R - 0.35), pY - 0.3, hz + Math.sin(a) * (R - 0.35), 0, -a, 0);
  }
  for (const rr of [4, 7.5]) {
    const ring = new THREE.TorusGeometry(rr, 0.12, 4, 48);
    ring.rotateX(Math.PI / 2);
    ring.translate(hx, pY - 0.18, hz);
    B.geo('steel', ring);
  }
  B.cyl('steel', 1.3, 1.3, 0.32, 20, hx, pY - 0.16, hz);
  // Legs under the drum.
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    latticeLeg(B, hx + Math.cos(a) * 7.5, hz + Math.sin(a) * 7.5, y0 - 0.41, 2.0);
  }
}

/** The passage through the drum's shell: plated walls, a roof, and its lamp. */
function holderPassage(B, v, lamps) {
  const r = v.rect, y0 = v.floor.y0, top = y0 + 4.2;
  B.span('grating', r.minX, r.maxX, y0 - 0.4, y0, r.minZ, r.maxZ);
  for (const z of [r.minZ, r.maxZ]) B.span('steel', r.minX, r.maxX + 0.2, y0 - 0.4, top + 0.45, z - WALL_HALF, z + WALL_HALF);
  B.span('darkSteel', r.minX, r.maxX + 0.3, top, top + 0.45, r.minZ - WALL_HALF, r.maxZ + WALL_HALF);
  lamps.push({ x: (r.minX + r.maxX) / 2, y: y0 + 3.6, z: (r.minZ + r.maxZ) / 2, fixture: 'ceiling' });
}

/* ---------------------------------------------- the cold box above its foot */

function coldBox(B, plan) {
  const C = COLDBOX;
  const base = LEVEL.cold - 0.6;
  // Stiffeners and girts outside the casing, the top platform, a ladder cage up the east face, the vent stack.
  for (const [x0, x1, z0, z1, alongX] of [[C.minX, C.maxX, C.minZ - 0.25, C.minZ, true], [C.minX, C.maxX, C.maxZ, C.maxZ + 0.25, true], [C.minX - 0.25, C.minX, C.minZ, C.maxZ, false], [C.maxX, C.maxX + 0.25, C.minZ, C.maxZ, false]]) {
    const L = alongX ? x1 - x0 : z1 - z0;
    const n = Math.round(L / 3.6);
    for (let i = 0; i <= n; i++) {
      const t = (alongX ? x0 : z0) + (L * i) / n;
      if (alongX) B.span('darkSteel', t - 0.15, t + 0.15, base, C.top, z0, z1);
      else B.span('darkSteel', x0, x1, base, C.top, t - 0.15, t + 0.15);
    }
    for (let y = LEVEL.cold + 7; y < C.top; y += 4.5) {
      if (alongX) B.span('darkSteel', x0, x1, y - 0.12, y + 0.12, z0 - 0.05, z1 + 0.05);
      else B.span('darkSteel', x0 - 0.05, x1 + 0.05, y - 0.12, y + 0.12, z0, z1);
    }
  }
  B.span('darkSteel', C.minX - 0.6, C.maxX + 0.6, C.top, C.top + 0.4, C.minZ - 0.6, C.maxZ + 0.6);
  for (const [a, b] of [[[C.minX - 0.5, C.minZ - 0.5], [C.maxX + 0.5, C.minZ - 0.5]], [[C.maxX + 0.5, C.minZ - 0.5], [C.maxX + 0.5, C.maxZ + 0.5]], [[C.maxX + 0.5, C.maxZ + 0.5], [C.minX - 0.5, C.maxZ + 0.5]], [[C.minX - 0.5, C.maxZ + 0.5], [C.minX - 0.5, C.minZ - 0.5]]]) {
    B.rod('steel', [a[0], C.top + 1.5, a[1]], [b[0], C.top + 1.5, b[1]], 0.03);
  }
  B.cyl('darkSteel', 0.7, 0.9, 9, 12, C.maxX - 3, C.top + 4.9, C.minZ + 3);
  B.cyl('steel', 1.1, 1.1, 1.6, 14, C.minX + 4, C.top + 1.2, C.maxZ - 4);
  const lx = C.maxX + 0.6;
  for (const dz of [-0.35, 0.35]) B.span('darkSteel', lx - 0.04, lx + 0.04, base, C.top + 1.2, -63 + dz - 0.04, -63 + dz + 0.04);
  for (let y = base + 0.3; y < C.top; y += 0.35) B.span('darkSteel', lx - 0.02, lx + 0.02, y, y + 0.03, -63.35, -62.65);
  for (let y = base + 3; y < C.top; y += 1.2) {
    const ring = new THREE.TorusGeometry(0.55, 0.03, 4, 12, Math.PI);
    ring.rotateX(Math.PI / 2);
    ring.rotateY(-Math.PI / 2);
    ring.translate(lx, y, -63);
    B.geo('darkSteel', ring);
  }
  // Lagged lines down the west face from the box to the deck's edge and away under it, rimed where they leave the casing.
  for (const z of [-60, -62.5, -65]) {
    B.cyl('insul', 0.32, 0.32, C.top - 18 - base, 12, C.minX - 0.6, (C.top - 18 + base) / 2, z);
    B.cyl('rime', 0.38, 0.38, 2.2, 12, C.minX - 0.6, C.top - 19.5, z);
  }
  // Legs under the box.
  for (const [x, z] of [[C.minX + 2, C.minZ + 2], [C.maxX - 2, C.minZ + 2], [C.minX + 2, C.maxZ - 2], [C.maxX - 2, C.maxZ - 2]]) latticeLeg(B, x, z, base - 0.01, 2.4);
  void plan;
}

/* ---------------------------------------------- the gondola under the moored bladder */

function gondola(B, plan, v) {
  const rm = v.room, r = rm.rect, y0 = rm.floor, roofY = y0 + rm.top, top = roofY + 0.45;
  B.span('grating', r.minX - 0.3, r.maxX + 0.3, y0 - 0.4, y0, r.minZ - 0.3, r.maxZ + 0.3);
  for (const s of plan.wallSegments(v)) wallBox(B, 'cladding', s, y0 - 0.6, top);
  for (const op of v.openings) {
    const seg = openingSeg(v, op);
    if (op.kind === 'window') {
      wallBox(B, 'cladding', seg, y0 - 0.6, y0 + 1.15, WALL_HALF, 0);
      wallBox(B, 'cladding', seg, y0 + 3.1, top, WALL_HALF, 0);
      wallBox(B, 'glass', seg, y0 + 1.15, y0 + 3.1, 0.03, 0);
      const plane = r[op.side];
      for (let t = op.lo; t <= op.hi + 0.01; t += (op.hi - op.lo) / 8) B.span('darkSteel', t - 0.06, t + 0.06, y0 + 1.15, y0 + 3.1, plane - 0.14, plane + 0.14);
      continue;
    }
    wallBox(B, 'cladding', seg, y0 + 4.4, top, WALL_HALF, 0);
  }
  B.span('cladding', r.minX - 0.3, r.maxX + 0.3, roofY, top, r.minZ - 0.3, r.maxZ + 0.3);
  // Frames inside the car's sides and across its roof, clear of the plate's line.
  for (let x = r.minX + 1.5; x < r.maxX; x += 3) {
    for (const z of [r.minZ + 0.38, r.maxZ - 0.38]) B.span('darkSteel', x - 0.07, x + 0.07, y0, roofY, z - 0.08, z + 0.08);
    B.span('darkSteel', x - 0.08, x + 0.08, roofY - 0.25, roofY, r.minZ, r.maxZ);
  }
  // The nose: the car's east end tapers to a blunt bow of windows.
  const cz = (r.minZ + r.maxZ) / 2, hw = (r.maxZ - r.minZ) / 2 + 0.3;
  const nose = new THREE.Shape([[0, -hw], [3.2, -hw * 0.55], [3.8, 0], [3.2, hw * 0.55], [0, hw]].map(([a, b]) => new THREE.Vector2(a, b)));
  for (const [ya, yb, key] of [[y0 - 0.6, y0 + 1.15, 'cladding'], [y0 + 3.1, top, 'cladding']]) {
    const g = new THREE.ExtrudeGeometry(nose, { depth: yb - ya, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.translate(r.maxX + 0.3, yb, cz);
    B.geo(key, g);
  }
  {
    const g = new THREE.ExtrudeGeometry(nose, { depth: 1.95, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.translate(r.maxX + 0.3, y0 + 3.1, cz);
    B.geo('glassDark', g);
  }
  // The keel girder under the car (it hangs from the bag; nothing stands under it).
  B.beam('darkSteel', [r.minX + 0.5, y0 - 0.9, cz], [r.maxX + 3.5, y0 - 0.9, cz], 0.5, 0.9);
  for (let x = r.minX + 1; x < r.maxX; x += 2) B.beam('darkSteel', [x, y0 - 1.3, cz], [x + 1, y0 - 0.45, r.minZ], 0.07, 0.07), B.beam('darkSteel', [x, y0 - 1.3, cz], [x + 1, y0 - 0.45, r.maxZ], 0.07, 0.07);
  // Suspension: four struts from the roof's corners up into the bag's belly, and the gas trunk between.
  const bag = BAGS.find(b => b.id === 'moored');
  for (const [x, z] of [[r.minX + 1.5, r.minZ + 1.5], [r.maxX - 1.5, r.minZ + 1.5], [r.minX + 1.5, r.maxZ - 1.5], [r.maxX - 1.5, r.maxZ - 1.5]]) {
    const yb = bagBelly(bag, x, z) + 0.6;
    B.rod('darkSteel', [x, top, z], [x + (bag.x - x) * 0.12, yb, z + (bag.z - z) * 0.12], 0.07);
  }
  B.cyl('canvas', 0.55, 0.55, bagBelly(bag, 67, 25) - top + 0.5, 16, 67, (bagBelly(bag, 67, 25) + top) / 2, 25);
}

/* ---------------------------------------------- the cradle under the hauled-down bladder */

function cradle(B, plan, v) {
  const rm = v.room, r = rm.rect, y0 = rm.floor;
  const bag = BAGS.find(b => b.id === 'cradled');
  const belly = (x, z) => bagBelly(bag, x, z) ?? y0 + 10;
  // The cradle's platform: wider than the room, carrying the trestles the bag's ends lie on.
  B.span('grating', bag.x - bag.a + 2, bag.x + bag.a - 2, y0 - 0.4, y0, r.minZ - 0.3, r.maxZ + 0.3);
  for (const x of [bag.x - bag.a + 3, bag.x + bag.a - 3]) {
    const zr = Math.sqrt(Math.max(0, 1 - ((x - bag.x) / bag.a) ** 2)) * bag.c;
    for (const z of [bag.z - zr * 0.55, bag.z + zr * 0.55]) {
      const yb = belly(x, z);
      if (z < r.minZ - 0.3 || z > r.maxZ + 0.3) continue;
      B.span('darkSteel', x - 0.15, x + 0.15, y0, yb + 0.1, z - 0.15, z + 0.15);
    }
    B.beam('darkSteel', [x, belly(x, bag.z) - 0.1, r.minZ], [x, belly(x, bag.z) - 0.1, r.maxZ], 0.3, 0.3);
  }
  // The curtain: heavy cloth hung in panels from the bag's belly down to the deck on every closed side.
  const curtain = (s, ya) => {
    const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
    const n = Math.max(1, Math.ceil(len));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const p = { ...s, ax: s.ax + (s.bx - s.ax) * t0, az: s.az + (s.bz - s.az) * t0, bx: s.ax + (s.bx - s.ax) * t1, bz: s.az + (s.bz - s.az) * t1 };
      const yb = Math.max(belly(p.ax, p.az), belly(p.bx, p.bz)) + 0.35;
      wallBox(B, 'canvas', p, ya, yb, 0.1, 0.02);
    }
  };
  for (const s of plan.wallSegments(v)) curtain(s, y0 - 0.1);
  for (const op of v.openings) curtain(openingSeg(v, op), y0 + 4.4);
  // The cradle's frames: two arches across the room under the belly, standing in the curtain line at the back and the front.
  for (const x of [-71.5, -62.5]) {
    const pts = [];
    for (let z = r.minZ; z <= r.maxZ + 1e-6; z += 1) pts.push([x, belly(x, z) - 0.18, z]);
    B.span('darkSteel', x - 0.1, x + 0.1, y0, pts[0][1], r.minZ - 0.1, r.minZ + 0.1);
    B.span('darkSteel', x - 0.1, x + 0.1, y0, pts[pts.length - 1][1], r.maxZ - 0.1, r.maxZ + 0.1);
    for (let i = 0; i < pts.length - 1; i++) B.beam('darkSteel', pts[i], pts[i + 1], 0.18, 0.18);
  }
  // Frames in the side curtains and the back curtain.
  for (let z = r.minZ + 3.5; z < r.maxZ - 1; z += 3.5) {
    for (const x of [r.minX, r.maxX]) B.span('darkSteel', x - 0.1, x + 0.1, y0, belly(x, z) - 0.05, z - 0.1, z + 0.1);
  }
  // Legs under the platform.
  for (const [x, z] of [[r.minX + 1.6, r.minZ + 1.6], [r.maxX - 1.6, r.minZ + 1.6], [r.minX + 1.6, r.maxZ - 1.6], [r.maxX - 1.6, r.maxZ - 1.6], [bag.x - bag.a + 4, bag.z], [bag.x + bag.a - 4, bag.z]]) latticeLeg(B, x, z, y0 - 0.41, 1.8);
}

/* ---------------------------------------------- the two bladders */

function bags(B, plan) {
  for (const bag of BAGS) {
    const g = new THREE.SphereGeometry(1, 56, 28);
    g.scale(bag.a, bag.b, bag.c);
    g.translate(bag.x, bag.y, bag.z);
    B.geo('skin', g);
    // Load straps round the bag's girth, a valve and its cage on top.
    for (const f of [-0.6, -0.3, 0, 0.3, 0.6]) {
      const x = bag.x + f * bag.a;
      const k = Math.sqrt(1 - f * f);
      const strap = new THREE.TorusGeometry(1, 0.012, 4, 48);
      strap.scale(bag.c * k + 0.05, bag.b * k + 0.05, 1);
      strap.rotateY(Math.PI / 2);
      strap.translate(x, bag.y, bag.z);
      B.geo('darkSteel', strap);
    }
    const ridge = new THREE.TorusGeometry(1, 0.012, 4, 64, Math.PI);
    ridge.scale(bag.a + 0.05, bag.b + 0.05, 1);
    ridge.translate(bag.x, bag.y, bag.z);
    B.geo('darkSteel', ridge);
    B.cyl('brass', 0.35, 0.45, 0.6, 12, bag.x, bag.y + bag.b + 0.2, bag.z);
    B.cyl('darkSteel', 0.6, 0.6, 0.12, 12, bag.x, bag.y + bag.b + 0.55, bag.z);
  }
  // The moored bag's lines: from its flank down to anchor brackets outside the mooring deck's east rail.
  const m = BAGS.find(b => b.id === 'moored');
  for (const [ax, az, fx] of [[59.4, 10, -0.35], [59.4, 42, -0.35], [80, 12, 0.45], [80, 38, 0.45]]) {
    const ex = m.x + fx * m.a;
    const ez = az < m.z ? m.z - m.c * 0.8 : m.z + m.c * 0.8;
    const ey = m.y - 2;
    const ay = LEVEL.moor - 0.2;
    B.rod('darkSteel', [ax, ay, az], [ex, ey, ez], 0.035);
    // The anchor: a bracket cantilevered off the deck's fascia, or a lattice mast in the air for the far lines.
    if (ax < 70) {
      B.span('darkSteel', 58, ax + 0.3, ay - 0.5, ay, az - 0.3, az + 0.3);
    } else {
      latticeLeg(B, ax, az, ay, 1.2);
    }
  }
  void plan;
}

/* ======================================================================
   THE LAMP MARKS
   ====================================================================== */

/**
 * The pooled lamp marks for the lamps `buildWorks` hung (rails and passages), and their amber fixtures.
 * @returns {THREE.Group}
 */
export function buildWorksLamps(ctx, lamps) {
  const g = new THREE.Group();
  g.name = 'bellows-works-lamps';
  g.userData.phys = 'ground';
  const geo = ctx.own(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 8));
  for (const l of lamps) {
    const mark = new THREE.Object3D();
    mark.position.set(l.x, l.y, l.z);
    mark.userData.lamp = { color: LAMP, intensity: l.fixture === 'ceiling' ? 6 : 5, distance: 13, decay: 1.6 };
    g.add(mark);
    ctx.lamps.push(mark);
    const glass = new THREE.Mesh(geo, ctx.M.lantern);
    glass.position.set(l.x, l.y + 0.03, l.z);
    g.add(glass);
  }
  return g;
}

export { OPEN_KINDS };
