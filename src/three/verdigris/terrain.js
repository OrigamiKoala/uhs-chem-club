/**
 * verdigris/terrain.js — The drowned fort as drawn: the swamp's bed, the water, the boardwalks and the masonry.
 *
 * Everything here stands on `fort-plan.js`. The ground mesh is the LAND (the swamp's bed, the moat, the mud banks, the
 * wooded rises far off) on a grid running to the horizon; it is cut away inside every roofed volume of the walk (a room,
 * a door, a stair, the gate passage), whose floor is built, and the boardwalks' decks are built over it. The water is one
 * sheet at `WATER` with a hole over every hollow structure (a cistern head, the gatehouse), where the water inside is drawn
 * on its own.
 *
 *   makeVerdigrisField   the height the game walks on (the plan's, with the pad's plate on the landing stage)
 *   buildGroundGeometry  the land's mesh, holed under every roofed volume
 *   buildWaterGeometry   the swamp's water, the moat's, the ward's: one sheet
 *   buildDecks           every boardwalk: planks, fascia, joists, piles, rails (`phys: 'ground'`)
 *   buildMasonry         the curtain, the towers, the keep and its plinth, the gatehouse, the cistern heads and every
 *                        room's floor, walls and roof (`phys: 'ground'`)
 *
 * Built in the world frame, as lists of geometries by material key; the world merges each list over squares.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOMS, DECK, WATER, WW, EDGE, DOOR, FORT, CURTAIN_T, CURTAIN_TOP, VAULT_T, fbm, reediness, fortDistance } from './fort-plan.js';

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

/* ================================================================== the field */

/** The height the game walks on: the plan's, with the pad's plate standing on the landing stage. */
export function makeVerdigrisField(plan, pad) {
  const PAD_TOP = 0.12, PAD_R = 9.4;
  function height(x, z) {
    const y = plan.height(x, z);
    if (pad) {
      const d = Math.hypot(x - pad[0], z - pad[1]);
      if (d < PAD_R + 0.6) return y + PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  }
  return { height, PAD_TOP, PAD_R };
}

/* ================================================================== geometry helpers */

/** A box geometry at (cx, cy, cz) of size (sx, sy, sz), its texture laid in metres. */
export function block(sx, sy, sz, cx, cy, cz, tile = 2.4) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [a, b] = ax > 0.5 ? [sz, sy] : ay > 0.5 ? [sx, sz] : [sx, sy];
    uv.setXY(i, uv.getX(i) * a / tile, uv.getY(i) * b / tile);
  }
  g.translate(cx, cy, cz);
  return g;
}
/** A box from (x0, y0, z0) to (x1, y1, z1). */
export const span = (x0, x1, y0, y1, z0, z1, tile) => block(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, tile);

/** Split [a, b] into pieces no longer than `len`, skipping the gaps. */
function pieces(a, b, gaps = [], len = 24) {
  const spans = [];
  let cur = a;
  for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) {
    if (g1 <= a || g0 >= b) continue;
    if (g0 > cur + 0.01) spans.push([cur, g0]);
    cur = Math.max(cur, g1);
  }
  if (b > cur + 0.01) spans.push([cur, b]);
  const out = [];
  for (const [s0, s1] of spans) {
    const n = Math.max(1, Math.ceil((s1 - s0) / len));
    for (let i = 0; i < n; i++) out.push([s0 + (s1 - s0) * i / n, s0 + (s1 - s0) * (i + 1) / n]);
  }
  return out;
}

/**
 * A wall standing on one side of a rectangle: along x (at z from `p0` to `p1`, thickness running from `p0`) or along z.
 * `gaps` are `[lo, hi, y0, y1]`: a hole from y0 to y1 over lo..hi, with a stone lintel over it.
 */
function wall(put, key, axis, a, b, p0, p1, y0, y1, gaps = [], lintel = 'coping') {
  const box = (u0, u1, v0, v1) => (axis === 'x' ? span(u0, u1, v0, v1, p0, p1) : span(p0, p1, v0, v1, u0, u1));
  for (const [u0, u1] of pieces(a, b, gaps.map(g => [g[0], g[1]]))) put(key, box(u0, u1, y0, y1));
  for (const [g0, g1, gy0, gy1] of gaps) {
    const lo = Math.max(a, g0), hi = Math.min(b, g1);
    if (hi <= lo) continue;
    if (gy0 > y0 + 0.01) put(key, box(lo, hi, y0, gy0));
    if (gy1 < y1 - 0.01) {
      const top = Math.min(y1, gy1 + 0.35);
      put(lintel, box(Math.max(a, lo - 0.3), Math.min(b, hi + 0.3), gy1, top));
      if (top < y1 - 0.01) put(key, box(lo, hi, top, y1));
    }
  }
}

/** Merge a list of geometries into one (or null for none). */
export function mergeList(list) {
  if (!list.length) return null;
  const nonIndexed = list.map(g => (g.index ? g.toNonIndexed() : g));
  for (const g of nonIndexed) for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  const m = mergeGeometries(nonIndexed);
  for (const g of list) g.dispose();
  for (const g of nonIndexed) if (!list.includes(g)) g.dispose();
  return m;
}

/* ================================================================== the ground */

/** A ladder of coordinates: `fine` m apart over the walk, `mid` m out to `outer`, then widening to `far`. */
function ladder(lo, hi, walkLo, walkHi, outerLo, outerHi, fine, mid, breaks) {
  const s = new Set(breaks.map(v => Math.round(v * 100) / 100));
  for (let v = walkLo; v <= walkHi; v += fine) s.add(Math.round(v * 100) / 100);
  for (let v = walkHi; v <= outerHi; v += mid) s.add(Math.round(v * 100) / 100);
  for (let v = walkLo; v >= outerLo; v -= mid) s.add(Math.round(v * 100) / 100);
  for (let v = outerHi, st = mid; v <= hi; st *= 1.12, v += st) s.add(Math.round(v));
  for (let v = outerLo, st = mid; v >= lo; st *= 1.12, v -= st) s.add(Math.round(v));
  s.add(lo); s.add(hi);
  return [...s].filter(v => v >= lo && v <= hi).sort((a, b) => a - b);
}

/** The rectangles cut out of the ground mesh: every roofed volume of the walk, and the twin cell beside room 3. */
function groundHoles(plan) {
  const holes = plan.roofed.map(v => v.rect);
  const twin = plan.structures().find(s => s.twin);
  if (twin) holes.push({ minX: twin.twin[0], maxX: twin.twin[1], minZ: twin.twin[2], maxZ: twin.twin[3] });
  return holes;
}

/**
 * The land's mesh. The bed shows dark peat and silt under the water; the reed beds' mud is greener; the moat's sides are
 * silt; the wooded rises far off are dark. A cell inside a roofed volume is a hole: its floor is built.
 */
export function buildGroundGeometry(plan) {
  const br = plan.breaks();
  const xs = ladder(-900, 900, -66, 92, -160, 170, 2.5, 4, br.xs);
  const zs = ladder(-900, 900, -74, 76, -170, 170, 2.5, 4, br.zs);
  const nx = xs.length, nz = zs.length;
  const holes = groundHoles(plan);
  const inHole = (x, z) => holes.some(r => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ);
  const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
  const e = 0.05;
  const L = (x, z) => plan.land(x, z);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], k = j * nx + i;
    const y = L(x, z);
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
    const gx = (L(x + e, z) - L(x - e, z)) / (2 * e), gz = (L(x, z + e) - L(x, z - e)) / (2 * e);
    const n = [-gx, 1, -gz], l = Math.hypot(...n);
    nor[k * 3] = n[0] / l; nor[k * 3 + 1] = n[1] / l; nor[k * 3 + 2] = n[2] / l;
    // Silt under open water; peat where the reeds root; the drowned flags of the ward; dark rises far off.
    const reed = reediness(x, z), d = fortDistance(x, z), far = smooth(320, 520, Math.hypot(x, z));
    let c = [0.36, 0.38, 0.31];
    c = c.map((v, q) => v + ([0.42, 0.44, 0.30][q] - v) * reed);
    if (d <= 0) c = c.map((v, q) => v + ([0.46, 0.48, 0.44][q] - v) * 0.55);
    c = c.map((v, q) => v + ([0.27, 0.31, 0.24][q] - v) * far);
    const m = 0.9 + 0.2 * fbm(x * 0.21 + 11, z * 0.21 - 5, 3);
    for (let q = 0; q < 3; q++) col[k * 3 + q] = c[q] * m;
    uv[k * 2] = x / 6; uv[k * 2 + 1] = z / 6;
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    if (inHole(cx, cz)) continue;
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/* ================================================================== the water */

/** The structures the water is cut away over: those hollow below the water (the cistern heads, the gatehouse). */
export function dryRects(plan) {
  return plan.structures().filter(s => s.kind === 'cistern' || s.kind === 'gatehouse').flatMap(s => (s.parts || [s.rect]));
}

/** The twin cell beside room 3: sunk 2 m deeper than the room, still full to a hand over the room's floor. */
export const TWIN = { floor: -2.0, water: 0.25, parapet: 1.1 };

/** Water drawn inside a dry structure: `[x0, x1, z0, z1, y]`. */
export function innerWater(plan) {
  const out = [];
  const gh = plan.structures().find(s => s.kind === 'gatehouse');
  if (gh) out.push([9, 15, gh.rect[2], gh.rect[3], WATER]);
  const twin = plan.structures().find(s => s.twin);
  if (twin) { const lv = ROOMS.find(r => r.id === twin.room).level; out.push([twin.twin[0], twin.twin[1], twin.twin[2], twin.twin[3], lv + TWIN.water]); }
  return out;
}

/**
 * The swamp's water: one sheet at `WATER`, on a grid of the dry rectangles' edges, with every cell inside one left out.
 * Its uv is laid in metres / 9, so the ripple's scale is the same everywhere.
 */
export function buildWaterGeometry(plan) {
  const dry = dryRects(plan);
  const xs = new Set([-700, 700]), zs = new Set([-700, 700]);
  for (const r of dry) { xs.add(r[0]); xs.add(r[1]); zs.add(r[2]); zs.add(r[3]); }
  for (let v = -200; v <= 200; v += 40) { xs.add(v); zs.add(v); }
  const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
  const pos = [], uv = [], idx = [];
  for (let j = 0; j < Z.length - 1; j++) for (let i = 0; i < X.length - 1; i++) {
    const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
    if (dry.some(r => cx > r[0] && cx < r[1] && cz > r[2] && cz < r[3])) continue;
    const base = pos.length / 3;
    for (const [x, z] of [[X[i], Z[j]], [X[i + 1], Z[j]], [X[i], Z[j + 1]], [X[i + 1], Z[j + 1]]]) { pos.push(x, WATER, z); uv.push(x / 9, z / 9); }
    idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  // The water held inside: the gate channel under the passage's deck, and the twin cell beside room 3 to its old line.
  for (const [x0, x1, z0, z1, y] of innerWater(plan)) {
    const base = pos.length / 3;
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) { pos.push(x, y, z); uv.push(x / 9, z / 9); }
    idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/* ================================================================== the boardwalks */

/** The plank deck's thickness, the fascia's depth under it, how far apart the piles stand. */
export const PLANK = 0.12;
const FASCIA = 0.42;
const PILE_STEP = 2.4;
const RAIL = { h: 1.02, mid: 0.55, post: 0.12 };

/**
 * Every boardwalk: the plank top (sloped on a ramp), its fascia along the closed sides, a pair of piles every few metres
 * down each closed side into the bed, and a handrail on posts. Material keys: plank, timber, pile, rail.
 * The deck's planks run across the line of travel.
 */
export function buildDecks(plan) {
  const G = { plank: [], timber: [], pile: [], rail: [] };
  const put = (k, g) => G[k].push(g);
  const decks = [...plan.openVols, plan.byId.get('gate')];
  for (const v of decks) {
    const r = v.rect, f = v.floor;
    const graded = f.y1 !== undefined && f.y1 !== f.y0;
    const sx = r.maxX - r.minX, sz = r.maxZ - r.minZ;
    const alongX = f.axis ? f.axis === 'x' : sx >= sz;
    // The plank top: a box laid flat, or tilted along a ramp's axis. Planks across travel: uv u across, v along.
    const top = (len, wid, cx, cz, y, tilt) => {
      const geo = new THREE.BoxGeometry(alongX ? len : wid, PLANK, alongX ? wid : len);
      const uv = geo.attributes.uv, n = geo.attributes.normal, p = geo.attributes.position;
      for (let i = 0; i < uv.count; i++) {
        if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, (alongX ? p.getZ(i) + cz : p.getX(i) + cx) / 4, (alongX ? p.getX(i) + cx : p.getZ(i) + cz) / 4);
        else uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 0.1);
      }
      if (tilt) { if (alongX) geo.rotateZ(tilt); else geo.rotateX(-tilt); }
      geo.translate(cx, y - PLANK / 2, cz);
      return geo;
    };
    if (graded) {
      const len = alongX ? sx : sz, rise = f.y1 - f.y0;
      const ang = Math.atan2(rise, len), slope = Math.hypot(len, rise);
      put('plank', top(slope, alongX ? sz : sx, (r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2, (f.y0 + f.y1) / 2, ang));
    } else {
      // A big deck is laid in pieces so frustum culling has something to cull.
      for (const [a, b] of pieces(alongX ? r.minX : r.minZ, alongX ? r.maxX : r.maxZ, [], 12)) {
        const len = b - a, c = (a + b) / 2;
        put('plank', alongX ? top(len, sz, c, (r.minZ + r.maxZ) / 2, f.y0, 0) : top(len, sx, (r.minX + r.maxX) / 2, c, f.y0, 0));
      }
    }
  }
  // The closed sides: fascia, piles, rail. Each wall segment of a deck volume is a closed side.
  const yAt = (v, x, z) => plan.work.floorOf(v, x, z);
  for (const w of plan.work.walls) {
    const v = plan.byId.get(w.volume);
    if (v.kind !== 'deck' && v.kind !== 'gate') continue;
    const alongX = w.side === 'minZ' || w.side === 'maxZ';
    const out = -(w.dirX + w.dirZ);       // which way is outward along the side's normal axis
    const L = w.to - w.from;
    const n = Math.max(1, Math.round(L / 2));
    const at = s => (alongX ? [s, w.plane] : [w.plane, s]);
    for (let i = 0; i < n; i++) {
      const s0 = w.from + L * i / n, s1 = w.from + L * (i + 1) / n;
      const [x0, z0] = at(s0), [x1, z1] = at(s1);
      const y0 = yAt(v, Math.min(Math.max(x0, v.rect.minX), v.rect.maxX - 1e-6), Math.min(Math.max(z0, v.rect.minZ), v.rect.maxZ - 1e-6));
      const y1 = yAt(v, Math.min(Math.max(x1, v.rect.minX), v.rect.maxX - 1e-6), Math.min(Math.max(z1, v.rect.minZ), v.rect.maxZ - 1e-6));
      const y = Math.max(y0, y1);
      // The fascia: a deep edge board hiding the step from the deck to the water.
      const p0 = w.plane + (out > 0 ? 0 : -0.08), p1 = w.plane + (out > 0 ? 0.08 : 0);
      if (alongX) put('timber', span(s0, s1, Math.min(y0, y1) - PLANK - FASCIA, y + 0.02, p0, p1, 1.2));
      else put('timber', span(p0, p1, Math.min(y0, y1) - PLANK - FASCIA, y + 0.02, s0, s1, 1.2));
    }
    // Posts and rails: a post every ~2 m, two rails along.
    const np = Math.max(1, Math.round(L / 2.2));
    const pp = w.plane + out * 0.06;
    for (let i = 0; i <= np; i++) {
      const s = w.from + L * i / np;
      const [x, z] = at(s);
      const y = yAt(v, Math.min(Math.max(x, v.rect.minX), v.rect.maxX - 1e-6), Math.min(Math.max(z, v.rect.minZ), v.rect.maxZ - 1e-6));
      if (alongX) put('rail', span(s - RAIL.post / 2, s + RAIL.post / 2, y, y + RAIL.h + 0.06, pp - RAIL.post / 2, pp + RAIL.post / 2, 1));
      else put('rail', span(pp - RAIL.post / 2, pp + RAIL.post / 2, y, y + RAIL.h + 0.06, s - RAIL.post / 2, s + RAIL.post / 2, 1));
    }
    for (const h of [RAIL.mid, RAIL.h]) {
      const [xa, za] = at(w.from), [xb, zb] = at(w.to);
      const ya = yAt(v, Math.min(Math.max(xa, v.rect.minX), v.rect.maxX - 1e-6), Math.min(Math.max(za, v.rect.minZ), v.rect.maxZ - 1e-6));
      const yb = yAt(v, Math.min(Math.max(xb, v.rect.minX), v.rect.maxX - 1e-6), Math.min(Math.max(zb, v.rect.minZ), v.rect.maxZ - 1e-6));
      const len = Math.hypot(L, yb - ya), ang = Math.atan2(yb - ya, L);
      const geo = alongX ? new THREE.BoxGeometry(len, 0.07, 0.07) : new THREE.BoxGeometry(0.07, 0.07, len);
      if (alongX) geo.rotateZ(ang); else geo.rotateX(-ang);
      geo.translate(alongX ? (w.from + w.to) / 2 : pp, (ya + yb) / 2 + h, alongX ? pp : (w.from + w.to) / 2);
      put('rail', geo);
    }
    // Piles: down from under the fascia into the bed, every PILE_STEP.
    const nk = Math.max(1, Math.round(L / PILE_STEP));
    for (let i = 0; i <= nk; i++) {
      const s = w.from + L * i / nk;
      const [x, z] = at(s);
      const px = alongX ? x : w.plane - out * 0.18, pz = alongX ? w.plane - out * 0.18 : z;
      const y = yAt(v, Math.min(Math.max(px, v.rect.minX), v.rect.maxX - 1e-6), Math.min(Math.max(pz, v.rect.minZ), v.rect.maxZ - 1e-6));
      const bed = plan.land(px, pz) - 0.4;
      const h = y - PLANK - 0.05 - bed;
      if (h < 0.3) continue;
      const geo = new THREE.CylinderGeometry(0.13, 0.15, h, 7);
      geo.translate(px, bed + h / 2, pz);
      put('pile', geo);
    }
  }
  // The piles under the middle of a broad deck (the stage, the pump stage, the junctions), in a grid.
  for (const v of decks) {
    const r = v.rect;
    if (v.floor.y1 !== undefined) {
      // A ramp stands on trestles: a cross beam and two legs every 2.4 m along it.
      const alongX = v.floor.axis === 'x';
      const L = alongX ? r.maxX - r.minX : r.maxZ - r.minZ;
      const n = Math.max(1, Math.round(L / 2.4));
      for (let i = 1; i < n; i++) {
        const s = (alongX ? r.minX : r.minZ) + L * i / n;
        const x = alongX ? s : (r.minX + r.maxX) / 2, z = alongX ? (r.minZ + r.maxZ) / 2 : s;
        const y = plan.work.floorOf(v, x, z) - PLANK;
        if (y - plan.land(x, z) < 0.8) continue;
        if (alongX) put('timber', span(s - 0.11, s + 0.11, y - 0.24, y, r.minZ + 0.2, r.maxZ - 0.2, 1));
        else put('timber', span(r.minX + 0.2, r.maxX - 0.2, y - 0.24, y, s - 0.11, s + 0.11, 1));
      }
      continue;
    }
    const sx = r.maxX - r.minX, sz = r.maxZ - r.minZ;
    if (sx < 5 && sz < 5) continue;
    for (let x = r.minX + 2.4; x < r.maxX - 1.2; x += 3.2) for (let z = r.minZ + 2.4; z < r.maxZ - 1.2; z += 3.2) {
      const bed = plan.land(x, z) - 0.4, h = v.floor.y0 - PLANK - 0.05 - bed;
      if (h < 0.3) continue;
      const geo = new THREE.CylinderGeometry(0.15, 0.17, h, 7);
      geo.translate(x, bed + h / 2, z);
      put('pile', geo);
    }
  }
  return G;
}

/* ================================================================== the masonry */

const MERLON = { w: 1.2, gap: 0.9, h: 0.9 };

/** Crenellations along the top of a wall: merlons on a parapet `t` thick, from `a` to `b` along `axis` at `p0..p1`. */
function battlements(put, axis, a, b, p0, p1, y) {
  const step = MERLON.w + MERLON.gap;
  const n = Math.floor((b - a) / step);
  const off = a + (b - a - n * step + MERLON.gap) / 2;
  for (let i = 0; i < n; i++) {
    const u0 = off + i * step, u1 = u0 + MERLON.w;
    put('coping', axis === 'x' ? span(u0, u1, y, y + MERLON.h, p0, p1, 1.2) : span(p0, p1, y, y + MERLON.h, u0, u1, 1.2));
  }
}

/** A pyramid roof over a rectangle, in its own sheets (patinated copper), with an eaves board and a finial. */
function pyramidRoof(put, x0, x1, z0, z1, eave, ridge) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2;
  const tri = (a, b, c) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, (Math.hypot(b[0] - a[0], b[2] - a[2])) / 2, 0, 0.5, 2], 2));
    g.computeVertexNormals();
    return g;
  };
  const apex = [cx, ridge, cz];
  const c = [[cx - hx, eave, cz - hz], [cx + hx, eave, cz - hz], [cx + hx, eave, cz + hz], [cx - hx, eave, cz + hz]];
  for (let i = 0; i < 4; i++) put('roof', tri(c[(i + 1) % 4], c[i], apex));
  put('roof', span(cx - hx, cx + hx, eave - 0.25, eave, cz - hz, cz + hz, 2));
  put('coping', span(cx - 0.12, cx + 0.12, ridge - 0.2, ridge + 1.1, cz - 0.12, cz + 0.12, 1));
}

/** A segmental barrel vault over a span, built of voussoir courses: `alongX` runs its axis along x. */
function barrel(put, key, alongX, a0, a1, c0, c1, spring, crown, th = 0.34, n = 14) {
  const half = (c1 - c0) / 2, mid = (c0 + c1) / 2, rise = crown - spring;
  const R = (half * half + rise * rise) / (2 * rise), cy = crown - R;
  const t0 = Math.asin(Math.min(1, half / R));
  for (let i = 0; i < n; i++) {
    const t = -t0 + (2 * t0) * (i + 0.5) / n;
    const chord = 2 * R * Math.sin(t0 / n) + 0.02;
    const off = Math.sin(t) * (R + th / 2), y = cy + Math.cos(t) * (R + th / 2);
    const len = a1 - a0;
    const geo = alongX ? block(len, th, chord, 0, 0, 0, 1.2) : block(chord, th, len, 0, 0, 0, 1.2);
    if (alongX) geo.rotateX(t); else geo.rotateZ(-t);
    geo.translate(alongX ? (a0 + a1) / 2 : mid + off, y, alongX ? mid + off : (a0 + a1) / 2);
    put(key, geo);
  }
}

/** How far the KERB of a pointed vault stands over its springing at `q` m from the axis (`h` the half span). */
export function pointedArc(q, h, rise, k = 1.5) {
  const yc = (rise * rise - h * h - 2 * h * k) / (2 * rise);
  const R = Math.hypot(h + k, yc);
  return yc + Math.sqrt(Math.max(0, R * R - (Math.abs(q) + k) ** 2));
}

/** The floor of the walk at a room's door side: what level the wall's opening starts at, and how high it reaches. */
function openingOf(plan, r) {
  const o = r.opening;
  const door = plan.byId.get(o.to);
  const lo = r.level;
  const hi = r.level + (door.kind === 'stair' ? 3.0 : DOOR.top);
  return { side: o.side, lo: o.lo, hi: o.hi, y0: lo, y1: hi };
}

/**
 * Every built body of the fort, as lists of geometries by material key. Keys: stone (fort masonry), coping (dressed
 * courses, lintels, merlons), brick (vaults), flags (floors), earth (the grass over a cistern), timber, roof (copper
 * sheet, gone green), slit (the dark of an arrow slit or a window).
 */
export function buildMasonry(plan) {
  const G = { stone: [], coping: [], brick: [], flags: [], earth: [], timber: [], roof: [], slit: [] };
  const put = (k, g) => G[k].push(g);
  const S = plan.structures();
  const room = id => plan.roomById.get(id);
  const BASE = -2.8;

  /* ---- the curtain: four walls with battlements, each broken down to the water in one length. */
  for (const s of S.filter(x => x.kind === 'curtain')) {
    const [x0, x1, z0, z1] = s.rect;
    const alongX = x1 - x0 > z1 - z0;
    const [a, b] = alongX ? [x0, x1] : [z0, z1];
    // Where the gatehouse and the towers stand in this wall, the wall is theirs.
    const own = S.filter(o => o.kind !== 'curtain' && o.kind !== 'cistern' && o.kind !== 'plinth' && o.kind !== 'keep')
      .filter(o => (alongX ? o.rect[2] <= z0 && o.rect[3] >= z1 && o.rect[0] < x1 && o.rect[1] > x0 : o.rect[0] <= x0 && o.rect[1] >= x1 && o.rect[2] < z1 && o.rect[3] > z0))
      .map(o => (alongX ? [o.rect[0], o.rect[1]] : [o.rect[2], o.rect[3]]));
    const gaps = [...own, ...s.breach];
    const box = (u0, u1, y0, y1) => (alongX ? span(u0, u1, y0, y1, z0, z1) : span(x0, x1, y0, y1, u0, u1));
    for (const [u0, u1] of pieces(a, b, gaps)) {
      put('stone', box(u0, u1, BASE, CURTAIN_TOP - 0.15));
      put('coping', box(u0, u1, CURTAIN_TOP - 0.15, CURTAIN_TOP));
      // The battlements stand on the outer half of the wall's top.
      const outerP = alongX ? (z0 < FORT.minZ + 1 ? [z0, z0 + 0.7] : [z1 - 0.7, z1]) : (x0 < FORT.minX + 1 ? [x0, x0 + 0.7] : [x1 - 0.7, x1]);
      battlements(put, alongX ? 'x' : 'z', u0, u1, outerP[0], outerP[1], CURTAIN_TOP);
    }
    // A breach: the wall's stump a little out of the water, its broken ends stepped down in courses.
    for (const [b0, b1] of s.breach) {
      put('stone', box(b0, b1, BASE, WATER + 0.35));
      for (let k = 0; k < 4; k++) {
        const y = WATER + 0.35 + (CURTAIN_TOP - WATER - 0.35) * (k + 1) / 5;
        const w = 0.9 * (4 - k);
        put('stone', box(b0, b0 + w, WATER + 0.35 + (CURTAIN_TOP - WATER - 0.35) * k / 5, y));
        put('stone', box(b1 - w, b1, WATER + 0.35 + (CURTAIN_TOP - WATER - 0.35) * k / 5, y));
      }
    }
  }

  /* ---- the rooms, each in its own structure. */
  for (const s of S) {
    if (s.kind === 'tower') buildTower(plan, put, s, room(s.room), BASE);
    else if (s.kind === 'keep') buildKeep(plan, put, s, room(s.room));
    else if (s.kind === 'plinth') buildPlinth(plan, put, s, BASE);
    else if (s.kind === 'cistern') buildCistern(plan, put, s, room(s.room));
    else if (s.kind === 'gatehouse') buildGatehouse(plan, put, s, room('room-1'), BASE);
  }
  return G;
}

/** The four walls round a room rectangle, `t` thick, from `y0` to `y1`, with its door (or stair) opening. */
function roomWalls(plan, put, r, t, y0, y1, key = 'stone', { arcade = null } = {}) {
  const v = r.vol.rect, op = openingOf(plan, r);
  const gap = side => (op.side === side ? [[op.lo, op.hi, op.y0, op.y1]] : []);
  wall(put, key, 'x', v.minX - t, v.maxX + t, v.minZ - t, v.minZ, y0, y1, gap('minZ'));
  wall(put, key, 'x', v.minX - t, v.maxX + t, v.maxZ, v.maxZ + t, y0, y1, gap('maxZ'));
  if (arcade !== 'minX') wall(put, key, 'z', v.minZ, v.maxZ, v.minX - t, v.minX, y0, y1, gap('minX'));
  wall(put, key, 'z', v.minZ, v.maxZ, v.maxX, v.maxX + t, y0, y1, gap('maxX'));
}

/** Slits up a tower's faces: a dark recess in the wall, one per face per storey. */
function slits(put, x0, x1, z0, z1, ys) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (const y of ys) {
    put('slit', span(cx - 0.18, cx + 0.18, y, y + 1.3, z0 - 0.02, z0 + 0.1, 1));
    put('slit', span(cx - 0.18, cx + 0.18, y, y + 1.3, z1 - 0.1, z1 + 0.02, 1));
    put('slit', span(x0 - 0.02, x0 + 0.1, y, y + 1.3, cz - 0.18, cz + 0.18, 1));
    put('slit', span(x1 - 0.1, x1 + 0.02, y, y + 1.3, cz - 0.18, cz + 0.18, 1));
  }
}

/** A tower: walls from the bed to its parapet, solid under the room's floor, the room's roof, storeys over it, a copper roof. */
function buildTower(plan, put, s, r, BASE) {
  const v = r.vol.rect, t = r.wall, L = r.level;
  const [x0, x1, z0, z1] = s.rect;
  roomWalls(plan, put, r, t, BASE, s.top);
  // Solid under the floor; the floor's flags.
  put('stone', span(v.minX, v.maxX, BASE, L - 0.2, v.minZ, v.maxZ));
  put('flags', span(v.minX, v.maxX, L - 0.2, L, v.minZ, v.maxZ, 1.8));
  // A batter at the foot where the tower meets the water, and a string course at the room's ceiling.
  put('coping', span(x0 - 0.35, x1 + 0.35, BASE, WATER + 0.6, z0 - 0.35, z1 + 0.35, 2));
  put('coping', span(x0 - 0.12, x1 + 0.12, L + r.top + 0.9, L + r.top + 1.2, z0 - 0.12, z1 + 0.12, 1.2));
  roomRoof(put, r);
  // The storeys above: a floor slab over the room's roof, another halfway up, the parapet and the roof.
  const ceil = L + r.top + 0.9;
  put('stone', span(v.minX, v.maxX, ceil, ceil + 0.4, v.minZ, v.maxZ));
  put('coping', span(x0 - 0.3, x1 + 0.3, s.top - 0.3, s.top, z0 - 0.3, z1 + 0.3, 1.2));
  battlements(put, 'x', x0 - 0.3, x1 + 0.3, z0 - 0.3, z0 + 0.4, s.top);
  battlements(put, 'x', x0 - 0.3, x1 + 0.3, z1 - 0.4, z1 + 0.3, s.top);
  battlements(put, 'z', z0 + 0.4, z1 - 0.4, x0 - 0.3, x0 + 0.4, s.top);
  battlements(put, 'z', z0 + 0.4, z1 - 0.4, x1 - 0.4, x1 + 0.3, s.top);
  pyramidRoof(put, x0 + 0.8, x1 - 0.8, z0 + 0.8, z1 - 0.8, s.top + 0.2, s.top + 0.2 + (x1 - x0) * 0.42);
  slits(put, x0, x1, z0, z1, [ceil + 1.0, ceil + 4.2].filter(y => y + 1.4 < s.top - 0.4));
}

/** The keep's plinth: a battered masonry platform out of the water, its top at the hall's floor, a parapet round it. */
function buildPlinth(plan, put, s, BASE) {
  const [x0, x1, z0, z1] = s.rect, top = s.top;
  // In three courses, each stepped in, so the faces batter.
  const steps = [[BASE, WATER + 0.8, 0.9], [WATER + 0.8, top - 1.8, 0.45], [top - 1.8, top, 0]];
  for (const [y0, y1, d] of steps) put('stone', span(x0 - d, x1 + d, y0, y1, z0 - d, z1 + d));
  put('flags', span(x0, x1, top - 0.02, top + 0.0, z0, z1, 1.8));
}

/** The keep: the hall's walls on the plinth, its timber roof on trusses (the hall's own roof), copper over it. */
function buildKeep(plan, put, s, r) {
  const v = r.vol.rect, t = r.wall, L = r.level;
  const eave = L + r.top + 0.5;
  roomWalls(plan, put, r, t, L - 0.3, eave);
  put('flags', span(v.minX, v.maxX, L - 0.2, L, v.minZ, v.maxZ, 1.8));
  const [x0, x1, z0, z1] = s.rect;
  put('coping', span(x0 - 0.15, x1 + 0.15, eave - 0.3, eave, z0 - 0.15, z1 + 0.15, 1.2));
  put('coping', span(x0 - 0.1, x1 + 0.1, L - 0.3, L + 0.5, z0 - 0.1, z1 + 0.1, 1.2));
  roomRoof(put, r);
  // The roof: two copper pitches along x, gables in the walls' plane.
  const ridge = eave + 4.2, mz = (z0 + z1) / 2, halfW = (z1 - z0) / 2 + 0.5, rise = ridge - eave;
  const ang = Math.atan2(rise, halfW), len = Math.hypot(halfW, rise);
  for (const sgn of [-1, 1]) {
    const geo = block(x1 - x0 + 1.0, 0.12, len, 0, 0, 0, 1.8);
    geo.rotateX(sgn * ang);
    geo.translate((x0 + x1) / 2, (eave + ridge) / 2 + 0.06, mz + sgn * halfW / 2);
    put('roof', geo);
  }
  for (const gx of [x0, x1 - t]) {
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const y0 = eave + rise * i / steps, y1 = eave + rise * (i + 1) / steps, hw = (halfW - 0.5) * (1 - (i + 1) / steps) + 0.1;
      put('stone', span(gx, gx + t, y0, y1, mz - hw, mz + hw));
    }
  }
  put('coping', span(x0 - 0.5, x1 + 0.5, ridge - 0.15, ridge + 0.1, mz - 0.15, mz + 0.15, 1));
  slits(put, x0, x1, z0, z1, [L + 2.6]);
}

/** A cistern head: walls round the room (and the twin cell, and the stair), the room's roof, the earth bank over all. */
function buildCistern(plan, put, s, r) {
  const v = r.vol.rect, t = r.wall, L = r.level, top = s.top;
  roomWalls(plan, put, r, t, L - 0.5, top, 'stone', { arcade: s.twin ? 'minX' : null });
  put('flags', span(v.minX, v.maxX, L - 0.2, L, v.minZ, v.maxZ, 1.8));
  put('stone', span(v.minX - (s.twin ? 0 : t), v.maxX + t, L - 0.6, L - 0.2, v.minZ - t, v.maxZ + t));
  roomRoof(put, r);
  // The vault's back filled to the bank: a slab over the room under the earth.
  const crown = L + r.top + (r.shell === 'pillars' ? 0.35 : r.shell === 'arches' ? 0.5 : 0.1);
  put('stone', span(v.minX - 0.01, v.maxX + 0.01, crown + VAULT_T * 0.5, top - 0.5, v.minZ - 0.01, v.maxZ + 0.01));
  // The stair: its two side walls and the far wall, the vaulted roof stepping down with it, its floor in steps.
  const st = plan.byId.get(s.stair), q = st.rect, f = st.floor;
  const alongX = f.axis === 'x';
  const head = st.openings.find(o => o.to !== r.id).side;
  const yAt = u => plan.work.floorOf(st, alongX ? u : (q.minX + q.maxX) / 2, alongX ? (q.minZ + q.maxZ) / 2 : u);
  const [a, b] = alongX ? [q.minX, q.maxX] : [q.minZ, q.maxZ];
  const n = Math.max(4, Math.round((b - a) / 0.5));
  for (let i = 0; i < n; i++) {
    const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n;
    const y = Math.max(yAt(u0 + 0.01), yAt(u1 - 0.01));
    // A step: its tread at the higher of its two ends, so the walk's graded floor never stands above it.
    if (alongX) put('flags', span(u0, u1, L - 0.6, y, q.minZ, q.maxZ, 1.2));
    else put('flags', span(q.minX, q.maxX, L - 0.6, y, u0, u1, 1.2));
    const roofY = Math.min(y, Math.max(yAt(u0), yAt(u1))) + 3.0;
    if (alongX) { put('brick', span(u0, u1, roofY, roofY + 0.35, q.minZ - 0.8, q.maxZ + 0.8)); put('stone', span(u0, u1, roofY + 0.35, top, q.minZ - 0.8, q.maxZ + 0.8)); }
    else { put('brick', span(q.minX - 0.8, q.maxX + 0.8, roofY, roofY + 0.35, u0, u1)); put('stone', span(q.minX - 0.8, q.maxX + 0.8, roofY + 0.35, top, u0, u1)); }
  }
  const sideA = alongX ? ['z', a, b, q.minZ - 0.8, q.minZ] : ['x', a, b, q.minX - 0.8, q.minX];
  const sideB = alongX ? ['z', a, b, q.maxZ, q.maxZ + 0.8] : ['x', a, b, q.maxX, q.maxX + 0.8];
  for (const [ax, u0, u1, p0, p1] of [sideA, sideB]) {
    if (ax === 'z') put('stone', span(u0, u1, L - 0.6, top, p0, p1));
    else put('stone', span(p0, p1, L - 0.6, top, u0, u1));
  }
  // The stair's head: a stone frame round the opening onto the deck.
  const hy = DECK + 3.0;
  if (head === 'minZ' || head === 'maxZ') {
    const z = head === 'minZ' ? q.minZ : q.maxZ, d = head === 'minZ' ? -0.3 : 0.3;
    put('coping', span(q.minX - 0.8, q.maxX + 0.8, hy, top + 0.2, Math.min(z, z + d), Math.max(z, z + d), 1.2));
    for (const x of [q.minX - 0.8, q.maxX]) put('coping', span(x, x + 0.8, DECK - 0.6, hy, Math.min(z, z + d), Math.max(z, z + d), 1.2));
  } else {
    const x = head === 'minX' ? q.minX : q.maxX, d = head === 'minX' ? -0.3 : 0.3;
    put('coping', span(Math.min(x, x + d), Math.max(x, x + d), hy, top + 0.2, q.minZ - 0.8, q.maxZ + 0.8, 1.2));
    for (const z of [q.minZ - 0.8, q.maxZ]) put('coping', span(Math.min(x, x + d), Math.max(x, x + d), DECK - 0.6, hy, z, z + 0.8, 1.2));
  }
  // The twin cell beside room 3: its walls, its own vault, its floor 2 m under the room's; its water is the world's. The wall
  // it shares with the room is an ARCADE: a parapet holding the water, piers, arches over the openings, wall up to the vaults.
  if (s.twin) {
    const [tx0, tx1, tz0, tz1] = s.twin;
    const fl = L + TWIN.floor;
    wall(put, 'stone', 'x', tx0 - t, tx1, tz0 - t, tz0, fl - 0.4, top);
    wall(put, 'stone', 'x', tx0 - t, tx1, tz1, tz1 + t, fl - 0.4, top);
    wall(put, 'stone', 'z', tz0, tz1, tx0 - t, tx0, fl - 0.4, top);
    put('flags', span(tx0, tx1, fl - 0.4, fl, tz0, tz1, 1.8));
    barrel(put, 'brick', false, tz0, tz1, tx0, tx1, L + 3.0, L + r.top);
    put('stone', span(tx0 - 0.01, tx1 + 0.01, L + r.top + 0.1 + VAULT_T * 0.5, top - 0.5, tz0, tz1));
    // The arcade in the plane between them (x from tx1 to the room's minX).
    const ax0 = tx1, ax1 = v.minX;
    put('stone', span(ax0, ax1, fl - 0.4, L + TWIN.parapet, v.minZ, v.maxZ));
    put('coping', span(ax0 - 0.05, ax1 + 0.05, L + TWIN.parapet, L + TWIN.parapet + 0.12, v.minZ, v.maxZ, 1.2));
    const bays = 4, bw = (v.maxZ - v.minZ) / bays, pw = 0.9;
    for (let i = 0; i <= bays; i++) {
      const z = v.minZ + bw * i;
      const z0 = Math.max(v.minZ, z - pw / 2), z1 = Math.min(v.maxZ, z + pw / 2);
      put('coping', span(ax0, ax1, L + TWIN.parapet + 0.12, L + 3.0, z0, z1, 1.2));
    }
    for (let i = 0; i < bays; i++) {
      // A segmental arch over the bay, in five voussoirs, and the wall over it up to the vaults.
      const za = v.minZ + bw * i + pw / 2, zb = v.minZ + bw * (i + 1) - pw / 2, half = (zb - za) / 2, mid = (za + zb) / 2;
      const spring = L + 3.0, rise = 0.6, R = (half * half + rise * rise) / (2 * rise), cy = spring + rise - R, t0 = Math.asin(half / R);
      for (let q = 0; q < 5; q++) {
        const th = -t0 + 2 * t0 * (q + 0.5) / 5, chord = 2 * R * Math.sin(t0 / 5) + 0.03;
        const geo = block(ax1 - ax0, 0.35, chord, 0, 0, 0, 1.2);
        geo.rotateX(th);
        geo.translate((ax0 + ax1) / 2, cy + Math.cos(th) * (R + 0.17), mid + Math.sin(th) * (R + 0.17));
        put('coping', geo);
      }
      put('stone', span(ax0, ax1, spring + rise + 0.35, L + r.top, za, zb));
    }
  }
  // The earth bank over the whole head: a turf cap with sloping sides, and the coping round its foot.
  for (const p of s.parts) {
    const [px0, px1, pz0, pz1] = p;
    put('earth', span(px0 + 0.2, px1 - 0.2, top - 0.5, top - 0.05, pz0 + 0.2, pz1 - 0.2, 2));
    put('earth', span(px0 + 0.8, px1 - 0.8, top - 0.05, top + 0.35, pz0 + 0.8, pz1 - 0.8, 2));
  }
  for (const p of s.parts) {
    const [px0, px1, pz0, pz1] = p;
    for (const [a0, a1, b0, b1] of [[px0, px1, pz0, pz0 + 0.25], [px0, px1, pz1 - 0.25, pz1], [px0, px0 + 0.25, pz0, pz1], [px1 - 0.25, px1, pz0, pz1]]) put('coping', span(a0, a1, top - 0.55, top - 0.2, b0, b1, 1.2));
  }
}

/** The gatehouse: two towers flanking the vaulted passage over the gate channel; the winch chamber in the east one. */
function buildGatehouse(plan, put, s, r, BASE) {
  const [x0, x1, z0, z1] = s.rect, top = s.top;
  const gate = plan.byId.get('gate').rect;
  const P = { minX: 9, maxX: 15 };         // the passage between the towers, channel and deck
  const v = r.vol.rect;
  // The west tower: solid masonry from the bed up.
  put('stone', span(x0, P.minX, BASE, top - 0.3, z0, z1));
  // The east tower round the winch chamber.
  const op = openingOf(plan, r);
  wall(put, 'stone', 'x', P.maxX, x1, z0, v.minZ, BASE, top - 0.3);
  wall(put, 'stone', 'x', P.maxX, x1, v.maxZ, z1, BASE, top - 0.3);
  wall(put, 'stone', 'z', v.minZ, v.maxZ, P.maxX, v.minX, BASE, top - 0.3, [[op.lo, op.hi, op.y0, op.y1]]);
  wall(put, 'stone', 'z', v.minZ, v.maxZ, v.maxX, x1, BASE, top - 0.3);
  put('stone', span(v.minX, v.maxX, BASE, r.level - 0.2, v.minZ, v.maxZ));
  put('flags', span(v.minX, v.maxX, r.level - 0.2, r.level, v.minZ, v.maxZ, 1.8));
  roomRoof(put, r);
  put('stone', span(v.minX, v.maxX, r.level + r.top + 0.5, top - 0.3, v.minZ, v.maxZ));
  // The door's sill across the east channel, from the deck to the chamber.
  const d1 = plan.byId.get('door-1').rect;
  put('flags', span(d1.minX, P.maxX, WATER - 0.4, DECK, d1.minZ, d1.maxZ, 1.2));
  // The passage: its barrel vault, the masonry over it, an arch ring at each mouth; the channel walls under the deck.
  barrel(put, 'brick', false, z0, z1, P.minX, P.maxX, 3.6, plan.byId.get('gate').roof);
  put('stone', span(P.minX, P.maxX, plan.byId.get('gate').roof + 0.35, top - 0.3, z0, z1));
  for (const z of [z0, z1 - 0.5]) {
    put('coping', span(P.minX - 0.4, P.minX, BASE, 3.6, z, z + 0.5, 1.2));
    put('coping', span(P.maxX, P.maxX + 0.4, BASE, 3.6, z, z + 0.5, 1.2));
  }
  // The portcullis slot over the outer mouth, and the parapet with battlements.
  put('slit', span(P.minX, P.maxX, 3.2, plan.byId.get('gate').roof - 0.2, z1 - 1.6, z1 - 1.4, 1));
  put('coping', span(x0 - 0.3, x1 + 0.3, top - 0.3, top, z0 - 0.3, z1 + 0.3, 1.2));
  battlements(put, 'x', x0 - 0.3, x1 + 0.3, z1 - 0.4, z1 + 0.3, top);
  battlements(put, 'x', x0 - 0.3, x1 + 0.3, z0 - 0.3, z0 + 0.4, top);
  battlements(put, 'z', z0 + 0.4, z1 - 0.4, x0 - 0.3, x0 + 0.4, top);
  battlements(put, 'z', z0 + 0.4, z1 - 0.4, x1 - 0.4, x1 + 0.3, top);
  put('coping', span(x0 - 0.4, x1 + 0.4, BASE, WATER + 0.6, z0 - 0.4, z1 + 0.4, 2));
  slits(put, x0, P.minX, z0, z1, [5.0, 8.0]);
  slits(put, v.minX, x1, z0, z1, [6.2, 8.6]);
  void gate;
}

/**
 * A room's roof, by its `shell` (see `fort-plan.js`): the voussoirs, beams, corbels or arches that make its ceiling.
 * Walls are drawn by the room's structure; this is what spans between them.
 */
function roomRoof(put, r) {
  const v = r.vol.rect, L = r.level, top = L + r.top;
  const mx = (v.minX + v.maxX) / 2, mz = (v.minZ + v.maxZ) / 2;
  // Along the room's depth (the line from the door to the back wall) or across it.
  const depthX = r.face.endsWith('x');
  if (r.shell === 'groin') {
    // A groin vault: two barrels crossing, sprung from engaged piers in the corners.
    barrel(put, 'brick', true, v.minX, v.maxX, v.minZ, v.maxZ, L + 3.6, top);
    barrel(put, 'brick', false, v.minZ, v.maxZ, v.minX, v.maxX, L + 3.6, top);
    for (const [px, pz] of [[v.minX, v.minZ], [v.maxX - 0.45, v.minZ], [v.minX, v.maxZ - 0.45], [v.maxX - 0.45, v.maxZ - 0.45]]) put('coping', span(px, px + 0.45, L, L + 3.6, pz, pz + 0.45, 1.2));
    put('stone', span(v.minX, v.maxX, top + 0.35, top + 0.5, v.minZ, v.maxZ));
    return;
  }
  if (r.shell === 'joists') {
    // Two oak girders along the depth, joists across them every 0.6 m, boards over.
    const [a0, a1, c0, c1] = depthX ? [v.minX, v.maxX, v.minZ, v.maxZ] : [v.minZ, v.maxZ, v.minX, v.maxX];
    const cm = (c0 + c1) / 2;
    for (const c of [cm - 3.4, cm + 3.4]) put('timber', depthX ? span(a0, a1, top - 0.45, top, c - 0.2, c + 0.2, 1) : span(c - 0.2, c + 0.2, top - 0.45, top, a0, a1, 1));
    const n = Math.round((a1 - a0) / 0.6);
    for (let i = 0; i <= n; i++) {
      const a = a0 + 0.1 + (a1 - a0 - 0.2) * i / n;
      put('timber', depthX ? span(a - 0.07, a + 0.07, top, top + 0.24, c0, c1, 1) : span(c0, c1, top, top + 0.24, a - 0.07, a + 0.07, 1));
    }
    put('timber', span(v.minX, v.maxX, top + 0.24, top + 0.3, v.minZ, v.maxZ, 1.2));
    return;
  }
  if (r.shell === 'vault') {
    // One barrel along the depth; the arcade on the twin's side is the host's.
    barrel(put, 'brick', depthX, depthX ? v.minX : v.minZ, depthX ? v.maxX : v.maxZ, depthX ? v.minZ : v.minX, depthX ? v.maxZ : v.maxX, L + 3.0, top);
    return;
  }
  if (r.shell === 'corbel') {
    // Six courses, each stepping 0.45 m in from all four walls, then the slab.
    const n = 6, step = 0.45, h = (r.top - 3.6) / n;
    for (let i = 0; i < n; i++) {
      const y0 = L + 3.6 + h * i, y1 = y0 + h + 0.02, d = step * (i + 1);
      put('coping', span(v.minX, v.maxX, y0, y1, v.minZ, v.minZ + d, 1.2));
      put('coping', span(v.minX, v.maxX, y0, y1, v.maxZ - d, v.maxZ, 1.2));
      put('coping', span(v.minX, v.minX + d, y0, y1, v.minZ + d, v.maxZ - d, 1.2));
      put('coping', span(v.maxX - d, v.maxX, y0, y1, v.minZ + d, v.maxZ - d, 1.2));
    }
    put('stone', span(v.minX, v.maxX, top, top + 0.4, v.minZ, v.maxZ));
    return;
  }
  if (r.shell === 'pillars') {
    // A flat roof of stone slabs on the pillars (the host's), with a beam over each row of them.
    put('stone', span(v.minX, v.maxX, top + 0.05, top + 0.35, v.minZ, v.maxZ));
    for (const c of [mx - 4.4, mx + 4.4]) put('coping', span(c - 0.3, c + 0.3, top - 0.3, top + 0.05, v.minZ, v.maxZ, 1.2));
    return;
  }
  if (r.shell === 'hall') {
    // King-post trusses across the hall every 2.6 m: a tie beam, two principal rafters, a king post; purlins along.
    const [a0, a1] = [v.minX, v.maxX];
    const n = Math.round((a1 - a0) / 2.6);
    const eave = top + 0.5, ridge = eave + 4.2, halfW = (v.maxZ - v.minZ) / 2;
    for (let i = 1; i < n; i++) {
      const x = a0 + (a1 - a0) * i / n;
      put('timber', span(x - 0.15, x + 0.15, top, top + 0.32, v.minZ, v.maxZ, 1));
      put('timber', span(x - 0.12, x + 0.12, top + 0.32, ridge - 0.3, mz - 0.12, mz + 0.12, 1));
      for (const sgn of [-1, 1]) {
        const len = Math.hypot(halfW, ridge - 0.3 - top - 0.2), ang = Math.atan2(ridge - 0.3 - top - 0.2, halfW);
        const geo = block(0.24, 0.26, len, 0, 0, 0, 1);
        geo.rotateX(sgn * ang);
        geo.translate(x, (top + 0.2 + ridge - 0.3) / 2, mz + sgn * halfW / 2);
        put('timber', geo);
      }
    }
    for (const f of [0.25, 0.6]) for (const sgn of [-1, 1]) {
      const z = mz + sgn * halfW * (1 - f), y = top + 0.2 + (ridge - 0.5 - top - 0.2) * f;
      put('timber', span(a0, a1, y, y + 0.2, z - 0.1, z + 0.1, 1));
    }
    void eave;
    return;
  }
  if (r.shell === 'pointed') {
    // A depressed pointed tunnel vault along the depth: each half an arc whose centre lies below the springing and
    // across the axis from it, so the two halves meet at a point (`pointedArc`).
    const [a0, a1, c0, c1] = depthX ? [v.minX, v.maxX, v.minZ, v.maxZ] : [v.minZ, v.maxZ, v.minX, v.maxX];
    const h = (c1 - c0) / 2, cm = (c0 + c1) / 2, spring = L + 3.0, rise = top - spring;
    const n = 9, th = 0.34;
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const q0 = h * (1 - i / n), q1 = h * (1 - (i + 1) / n);            // from the springing in to the apex
        const y0 = spring + pointedArc(q0, h, rise), y1 = spring + pointedArc(q1, h, rise);
        const p0 = cm + sgn * q0, p1 = cm + sgn * q1;
        const len = Math.hypot(p1 - p0, y1 - y0) + 0.03, ang = Math.atan2(y1 - y0, p1 - p0);
        const geo = depthX ? block(a1 - a0, th, len, 0, 0, 0, 1.2) : block(len, th, a1 - a0, 0, 0, 0, 1.2);
        if (depthX) geo.rotateX(-ang); else geo.rotateZ(ang);
        const pm = (p0 + p1) / 2, ym = (y0 + y1) / 2 + th / 2;
        geo.translate(depthX ? (a0 + a1) / 2 : pm, ym, depthX ? pm : (a0 + a1) / 2);
        put('brick', geo);
      }
    }
    put('stone', span(v.minX, v.maxX, top + 0.4, top + 0.8, v.minZ, v.maxZ));
    return;
  }
  if (r.shell === 'arches') {
    // Transverse arches across the room every 3 m, a flat slab roof on them.
    const [a0, a1, c0, c1] = depthX ? [v.minX, v.maxX, v.minZ, v.maxZ] : [v.minZ, v.maxZ, v.minX, v.maxX];
    const n = Math.round((a1 - a0) / 3);
    for (let i = 0; i <= n; i++) {
      const a = a0 + 0.35 + (a1 - a0 - 0.7) * i / n;
      const half = (c1 - c0) / 2, cm = (c0 + c1) / 2, spring = L + 3.0, rise = r.top - 3.0;
      const R = (half * half + rise * rise) / (2 * rise), cy = top - R;
      const m = 10, t0 = Math.asin(Math.min(1, half / R));
      for (let k = 0; k < m; k++) {
        const t = -t0 + 2 * t0 * (k + 0.5) / m;
        const chord = 2 * R * Math.sin(t0 / m) + 0.03;
        const off = Math.sin(t) * (R + 0.25), y = cy + Math.cos(t) * (R + 0.25);
        const geo = depthX ? block(0.6, 0.5, chord, 0, 0, 0, 1.2) : block(chord, 0.5, 0.6, 0, 0, 0, 1.2);
        if (depthX) geo.rotateX(t); else geo.rotateZ(-t);
        geo.translate(depthX ? a : cm + off, y, depthX ? cm + off : a);
        put('coping', geo);
      }
      void spring;
    }
    put('stone', span(v.minX, v.maxX, top + 0.4, top + 0.8, v.minZ, v.maxZ));
  }
}
