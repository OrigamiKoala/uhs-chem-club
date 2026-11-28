/**
 * mirrowen/terrain.js — Mirrowen's ground, its water and everything built of stone, steel and timber
 * that the walk stands on or inside: quay walls, the dry dock, the gates, the piers, the hulls, the
 * rooms and the passages down into the ships.
 *
 * ONE HEIGHT FUNCTION (`harbour-plan.js` `plan.height(x, z)`), ONE TERRAIN MESH to the horizon (±900 m).
 * Grid lines are snapped onto every volume edge and onto the band where a floor gives way to the land,
 * so each step falls inside the wall drawn on its plane. Decks, rooms, passages and hulls are cut out of
 * the terrain mesh and built here (`phys: 'ground'`, merged per material). The water is its own mesh,
 * drawn only over the sea bed and never inside a hull or the dock.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  fbm2, smooth, WATER, ICE, DOCK, SEABED, QUAY, TERRACE, EDGE, WALL_HALF, DOCK_PIT, TUG, PUMP_HOUSE, CANAL,
  GROUND_KINDS, DECK_KINDS
} from './harbour-plan.js';
import { floorOf } from '../lib/workings.js';
import { buildRibbon, buildDisc } from '../ember/terrain.js';
import { chunkGeometry } from '../lanternfall/kit.js';
import { rng, crystalGeometry, boxUv } from './kit.js';

export { buildRibbon, buildDisc, fbm2 };

const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ======================================================================
   GRID AXES
   ====================================================================== */

function mergeLines(all, eps = 0.04) {
  const v = [...all].sort((a, b) => a - b);
  const out = [];
  for (const x of v) if (!out.length || x - out[out.length - 1] > eps) out.push(x);
  return out;
}

function axisLines(core, step, reach, snaps) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.22; v = Math.min(reach, v + s); pos.push(v); }
  return mergeLines([...pos.slice(1).reverse().map(p => -p), ...pos, ...snaps]);
}

/** Every plane a step can lie on, with the band either side where a floor gives way to the land. */
function snapLines(plan) {
  const xs = [], zs = [];
  const add = (arr, p) => arr.push(p, p - EDGE, p + EDGE, p - EDGE - 0.06, p + EDGE + 0.06);
  for (const v of plan.volumes) { add(xs, v.rect.minX); add(xs, v.rect.maxX); add(zs, v.rect.minZ); add(zs, v.rect.maxZ); }
  for (const h of plan.hulls) { add(xs, h.rect.minX); add(xs, h.rect.maxX); add(zs, h.rect.minZ); add(zs, h.rect.maxZ); }
  for (const r of [DOCK_PIT, PUMP_HOUSE]) { add(xs, r.minX); add(xs, r.maxX); add(zs, r.minZ); add(zs, r.maxZ); }
  add(xs, CANAL.maxX); add(zs, CANAL.minZ); add(zs, CANAL.maxZ);
  return { xs, zs };
}

/* ======================================================================
   GROUND COLOUR
   ====================================================================== */

const C = {
  granite: [0.50, 0.51, 0.50],
  setts: [0.42, 0.42, 0.41],
  worn: [0.58, 0.57, 0.54],
  cobble: [0.46, 0.44, 0.41],
  dockFloor: [0.26, 0.27, 0.26],
  dockWet: [0.18, 0.20, 0.20],
  iceWhite: [0.88, 0.92, 0.94],
  iceBlue: [0.66, 0.78, 0.84],
  iceGrey: [0.74, 0.78, 0.80],
  seabed: [0.20, 0.22, 0.20],
  snow: [0.86, 0.88, 0.89],
  heath: [0.40, 0.40, 0.36],
  rock: [0.34, 0.35, 0.36]
};

/** Distance from (x, z) to segment a-b. */
function segDist(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
}

function groundTint(x, z, y, slope, plan, paths) {
  const v = plan.volumeAt(x, z);
  let c;
  if (v && v.kind === 'dock') {
    // The dock floor: wet concrete, darkest along the drain channels by the walls.
    const n = fbm2(x * 0.2, z * 0.2, 31, 2);
    const wall = Math.min(x - DOCK_PIT.minX, DOCK_PIT.maxX - x);
    c = mix3(C.dockFloor, C.dockWet, Math.min(1, n * 0.6 + (1 - smooth(0.5, 2.5, wall)) * 0.6));
  } else if (v) {
    // Quays and the terrace: granite setts, the joints picked out by the grain, worn pale where people walk.
    const n = fbm2(x * 0.11, z * 0.11, 37, 2);
    const setts = 0.5 + 0.5 * Math.sin(x * 3.1) * Math.sin(z * 3.1);
    c = mix3(y > TERRACE - 0.5 ? C.cobble : C.setts, C.granite, n * 0.5 + setts * 0.12);
    let worn = 0;
    for (const p of paths) worn = Math.max(worn, 1 - smooth(p.w * 0.25, p.w, segDist(x, z, p.a, p.b)));
    c = mix3(c, C.worn, worn * 0.55);
  } else if (Math.abs(y - ICE) < 0.6 || plan.seaIce(x, z)) {
    // The ice: white where snow lies on it, blue-grey where it is bare, ridged further out.
    const n = fbm2(x * 0.05, z * 0.05, 43, 3);
    c = mix3(C.iceBlue, C.iceWhite, smooth(0.35, 0.7, n));
    c = mix3(c, C.iceGrey, smooth(0.4, 0.9, slope) * 0.6);
  } else if (y < WATER - 1) {
    c = C.seabed;
  } else {
    // The hills round the harbour: snow lying on heath, rock where it is steep.
    const n = fbm2(x * 0.02, z * 0.02, 47, 3);
    c = mix3(C.heath, C.snow, smooth(0.3, 0.65, n) * (1 - smooth(0.25, 0.6, slope)));
    c = mix3(c, C.rock, smooth(0.35, 0.8, slope));
  }
  const grain = 0.93 + fbm2(x * 0.3, z * 0.3, 53, 2) * 0.14;
  return [c[0] * grain, c[1] * grain, c[2] * grain];
}

/* ======================================================================
   THE TERRAIN MESH
   ====================================================================== */

export function buildMirrowenTerrainGeometry(plan, data) {
  const holes = plan.holes();
  const snap = snapLines(plan);
  const xs = axisLines(100, 2, 900, snap.xs);
  const zs = axisLines(100, 2, 900, snap.zs);
  const nx = xs.length, nz = zs.length;
  const paths = data.paths || [];

  const inHole = (x, z) => holes.some(h => x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ);
  const pos = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], k = j * nx + i;
      pos[k * 3] = x; pos[k * 3 + 1] = plan.surfaceHeight(x, z); pos[k * 3 + 2] = z;
      uv[k * 2] = x * 0.12; uv[k * 2 + 1] = z * 0.12;
    }
  }
  // Three surfaces, one mesh, one index group each (the materials `mirrowen.js` hands the mesh, in this order):
  // 0 snow (the hills and the sea ice), 1 granite setts (the quays and the terrace), 2 the dry dock's concrete floor.
  const idx = [[], [], []];
  for (let j = 0; j < nz - 1; j++) {
    const zc = (zs[j] + zs[j + 1]) / 2;
    for (let i = 0; i < nx - 1; i++) {
      const xc = (xs[i] + xs[i + 1]) / 2;
      if (inHole(xc, zc)) continue;
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx[groundSurface(xc, zc, plan)].push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx.flat());
  let start = 0;
  idx.forEach((list, m) => { geo.addGroup(start, list.length, m); start += list.length; });
  geo.computeVertexNormals();
  const norm = geo.attributes.normal;
  const col = new Float32Array(nx * nz * 3);
  const shade = contactShader(plan);
  for (let k = 0; k < nx * nz; k++) {
    const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2];
    const [r, g, b] = groundTint(x, z, y, 1 - Math.max(0, norm.getY(k)), plan, paths);
    const sh = shade(x, z, y);
    col[k * 3] = r * sh; col[k * 3 + 1] = g * sh; col[k * 3 + 2] = b * sh;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** Which surface a cell of ground is (the same test `groundTint` paints by): 0 snow, 1 setts, 2 dock concrete. */
function groundSurface(x, z, plan) {
  const v = plan.volumeAt(x, z);
  if (v && v.kind === 'dock') return 2;
  // Only what is built is paved (the quays, the terrace, the stair); the open land round them lies under snow.
  return v ? 1 : 0;
}

/**
 * CONTACT SHADE, baked into the ground's vertex colour: the sky cannot reach the foot of a wall, so the ground is a
 * little darker there. On the ice and the sea bed: along the foot of every quay and dock wall, round every hull and
 * round the boathouses' piles. On the quays: along every hull lying alongside and round the pump house.
 * Returns the factor (0.6..1) for a ground point.
 */
function contactShader(plan) {
  const dRect = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
  const quays = plan.groundVols.filter(v => v.kind !== 'dock').map(v => v.rect);
  const hulls = plan.hulls.map(h => h.rect);
  const piles = plan.roofedVols.filter(v => v.room && (v.room.shell === 'thawShed' || v.room.shell === 'saltStore')).map(v => v.room.rect);
  const fall = (d, R) => 1 - smooth(0, R, d);
  return (x, z, y) => {
    let s = 0;
    if (y < QUAY - 0.5) {
      // Low ground: the ice, the sea bed, the dock floor.
      let dq = Infinity;
      for (const r of quays) dq = Math.min(dq, dRect(x, z, r));
      s = Math.max(s, fall(dq, 3.5) * 0.35);
      for (const r of hulls) s = Math.max(s, fall(dRect(x, z, r), 4) * 0.4);
      for (const r of piles) s = Math.max(s, fall(dRect(x, z, r), 3) * 0.3);
      if (y < DOCK + 0.5) {
        const wall = Math.min(x - DOCK_PIT.minX, DOCK_PIT.maxX - x, z - DOCK_PIT.minZ, DOCK_PIT.maxZ - z);
        if (wall > -0.01) s = Math.max(s, fall(wall, 2.5) * 0.35);
      }
    } else if (y < TERRACE - 0.5) {
      // The quays: a hull alongside shades the edge; the pump house its foot.
      for (const r of hulls) s = Math.max(s, fall(dRect(x, z, r), 2.5) * 0.25);
      s = Math.max(s, fall(dRect(x, z, PUMP_HOUSE), 2.0) * 0.3);
    }
    return 1 - s;
  };
}

/** The open water: one level sheet over the sea bed, never inside a hull or the dock. Vertex colour by depth of view. */
export function buildWaterGeometry(plan) {
  const snap = snapLines(plan);
  const xs = axisLines(100, 2, 900, snap.xs);
  const zs = axisLines(100, 2, 900, snap.zs);
  const pos = [], uv = [], col = [], idx = [];
  const vmap = new Map();
  const vert = (i, j) => {
    const key = i * 100000 + j;
    if (vmap.has(key)) return vmap.get(key);
    const x = xs[i], z = zs[j];
    pos.push(x, 0, z);
    uv.push(x * 0.05, z * 0.05);
    // Green-grey by the quays, darker out in the harbour.
    const t = smooth(10, 60, Math.hypot(x, z + 20));
    col.push(0.42 - t * 0.12, 0.50 - t * 0.12, 0.49 - t * 0.1);
    vmap.set(key, pos.length / 3 - 1);
    return pos.length / 3 - 1;
  };
  for (let j = 0; j < zs.length - 1; j++) {
    const zc = (zs[j] + zs[j + 1]) / 2;
    for (let i = 0; i < xs.length - 1; i++) {
      const xc = (xs[i] + xs[i + 1]) / 2;
      if (!plan.isOpenWater(xc, zc)) continue;
      const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ======================================================================
   BUCKETS: everything built here is merged per material
   ====================================================================== */

function bucketer() {
  const buckets = new Map();
  let seed = 1;
  // Every piece enters a bucket with the same attributes (position, normal, uv), so any two can be merged.
  const push = (key, g) => {
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) boxUv(g);
    let a = buckets.get(key); if (!a) { a = []; buckets.set(key, a); } a.push(g);
  };
  /**
   * A worn, rounded block in place of a box (`chunkGeometry`: it only ever loses material inside the box), centred
   * at (x, y, z), turned by `ry` about y. Seeded in build order, so every build draws the same stones.
   */
  const chunk = (key, sx, sy, sz, x, y, z, ry = 0, o = {}) => {
    if (sx <= 0.001 || sy <= 0.001 || sz <= 0.001) return;
    const { uvMetres = 2, ...shape } = o;
    const g = chunkGeometry(sx, sy, sz, { seed: 4099 + (seed++) * 37, ...shape });
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    push(key, boxUv(g, uvMetres));
  };
  /** A round bar of radius `r` from point a to point b (a tube rail, a stanchion, a rubbing strake). */
  const tube = (key, a, b, r, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    if (len < 0.01) return;
    const g = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
    const m = va.add(vb).multiplyScalar(0.5);
    g.translate(m.x, m.y, m.z);
    push(key, g);
  };
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
  /** A beam of section w x h from point a to point b. */
  const beam = (key, a, b, w, h) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    if (len < 0.01) return;
    const g = new THREE.BoxGeometry(w, h, len);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize()));
    const m = va.add(vb).multiplyScalar(0.5);
    g.translate(m.x, m.y, m.z);
    push(key, g);
  };
  const geo = (key, g) => push(key, g);
  return { buckets, box, span, cyl, beam, geo, chunk, tube };
}

function flush(ctx, buckets, group, prefix, { phys = 'ground', shadow = true } = {}) {
  for (const [key, geos] of buckets) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g), false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    merged.computeVertexNormals();
    if (!merged.attributes.uv1 && merged.attributes.uv) merged.setAttribute('uv1', merged.attributes.uv.clone());
    ctx.own(merged);
    const mesh = new THREE.Mesh(merged, ctx.M[key] || ctx.M.concrete);
    mesh.name = `${prefix}:${key}`;
    mesh.castShadow = ctx.t4 && shadow && !['glass', 'paintYellow'].includes(key);
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

/**
 * A course of dressed stones along a side's segment, between heights y0 and y1, ±`half` about its plane: the coping
 * on a quay wall, a kerb, the cap of a parapet. Cut into stones about `stone` m long, each a chunk (its arrises
 * rounded, its corners chipped), so the joints between them read as joints. Every stone lies inside the box the
 * course would have filled.
 */
function stoneCourse(B, key, seg, y0, y1, half, ext, { stone = 1.1, wear = 0.008, chip = 0.03 } = {}) {
  if (y1 - y0 < 0.01) return;
  const alongZ = seg.side === 'minX' || seg.side === 'maxX';
  const lo = (alongZ ? Math.min(seg.az, seg.bz) : Math.min(seg.ax, seg.bx)) - ext;
  const hi = (alongZ ? Math.max(seg.az, seg.bz) : Math.max(seg.ax, seg.bx)) + ext;
  const n = Math.max(1, Math.round((hi - lo) / stone));
  const L = (hi - lo) / n;
  const plane = alongZ ? seg.ax : seg.az;
  for (let i = 0; i < n; i++) {
    const c = lo + L * (i + 0.5);
    const [sx, sz, x, z] = alongZ ? [half * 2, L, plane, c] : [L, half * 2, c, plane];
    B.chunk(key, sx, y1 - y0, sz, x, (y0 + y1) / 2, z, 0, { round: 0.18, wear, chip, cell: 0.4 });
  }
}

/** A point `d` metres outside a segment's middle (the side's outward normal). */
function outside(seg, d) {
  const mx = (seg.ax + seg.bx) / 2, mz = (seg.az + seg.bz) / 2;
  return [mx - seg.dirX * d, mz - seg.dirZ * d];
}

/* ======================================================================
   THE SHELLS
   ====================================================================== */

export function buildHarbourShells(ctx, plan) {
  const group = new THREE.Group();
  group.name = 'mirrowen-shells';
  group.userData.phys = 'ground';
  group.userData.noWeather = true;
  const B = bucketer();

  edges(B, plan);
  decks(B, plan);
  for (const v of plan.roofedVols) {
    if (v.kind === 'room') room(B, plan, v);
    else passage(B, plan, v);
  }
  for (const h of plan.hulls) hull(B, plan, h);
  dock(B, plan);
  pumpHouse(B);

  flush(ctx, B.buckets, group, 'shell');
  return group;
}

/* ---------------------------------------------- the edges of the walk */

/** The ground under the far side of a wall: another volume's floor, or the land. */
function beyond(plan, seg, d = 0.65) {
  const [x, z] = outside(seg, d);
  const v = plan.volumeAt(x, z);
  return { v, y: v ? floorOf(v, x, z) : plan.landHeight(x, z) };
}

function edges(B, plan) {
  for (const v of [...plan.groundVols, ...plan.deckVols]) {
    const segs = [...plan.wallSegments(v).map(s => ({ ...s, kind: 'wall' })), ...plan.barriers.filter(b => b.volume === v.id).map(b => ({ ...b, kind: b.opening.kind }))];
    const isDeck = DECK_KINDS.includes(v.kind);
    for (const s of segs) {
      const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
      const n = Math.max(1, Math.ceil(len / 2));
      const inHull = Boolean(plan.hullAt(...outside(s, 0.1)) || plan.hullAt(...outside(s, -0.1)));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const p = { ...s, ax: s.ax + (s.bx - s.ax) * t0, az: s.az + (s.bz - s.az) * t0, bx: s.ax + (s.bx - s.ax) * t1, bz: s.az + (s.bz - s.az) * t1 };
        const ya = floorOf(v, p.ax, p.az), yb = floorOf(v, p.bx, p.bz);
        const lo = Math.min(ya, yb), hi = Math.max(ya, yb);
        const far = beyond(plan, p);
        if (far.v && (far.v.kind === 'room' || far.v.kind === 'passage')) continue;   // the room draws its own wall
        const ext = i === 0 || i === n - 1 ? WALL_HALF : 0.02;
        if (isDeck || inHull) {
          // A closed edge on a deck: a steel screen where the deck meets the closed part of the hull.
          if (s.kind === 'wall') wallBox(B, 'hullPlate', p, lo, lo + 0.9, 0.08, 0.02);
          continue;
        }
        const key = v.kind === 'dock' || v.kind === 'ramp' && v.id === 'dock-stair' ? 'concrete' : 'granite';
        // Granite walls end in a dressed coping course; concrete ones in a cast capping, worn less.
        const cope = key === 'granite' ? { stone: 1.1 } : { stone: 2.0, wear: 0.004, chip: 0.012 };
        if (far.y < lo - 0.5) {
          // A drop: the quay wall, the dock wall or the stair's side, from the bed of the water or the floor below.
          const bottom = far.v ? far.y - 0.3 : far.y < WATER - 1 ? SEABED - 0.3 : far.y - 1.0;
          if (s.kind === 'kerb') {
            wallBox(B, key, p, bottom, hi, WALL_HALF, ext);
            stoneCourse(B, 'granite', p, hi, hi + 0.32, 0.36, ext + 0.06);
          } else if (s.kind === 'wall') {
            wallBox(B, key, p, bottom, hi + 0.95, WALL_HALF, ext);
            stoneCourse(B, key, p, hi + 0.95, hi + 1.1, WALL_HALF + 0.05, ext + 0.04, cope);
          } else {
            // An open edge (a railing on it): the wall to just under the walk, and its coping flush with the walk.
            wallBox(B, key, p, bottom, hi - 0.28, WALL_HALF, ext);
            stoneCourse(B, key, p, hi - 0.28, hi + 0.02, WALL_HALF + 0.06, ext + 0.02, cope);
          }
        } else if (far.y > hi + 0.5) {
          // Retaining: up to the walk beyond (it has its own rail), or up to the land and a parapet on it.
          const top = far.v ? far.y : far.y + 1.05;
          if (far.v) wallBox(B, key, p, lo - 0.3, top, WALL_HALF, ext);
          else {
            wallBox(B, key, p, lo - 0.3, top - 0.15, WALL_HALF, ext);
            stoneCourse(B, key, p, top - 0.15, top, WALL_HALF + 0.05, ext + 0.04, cope);
          }
        } else if (s.kind === 'wall') {
          // A closed side on level ground: a yard wall 2.4 m high, the backs of the warehouses beyond it.
          const top = Math.max(hi, far.y) + 2.4;
          wallBox(B, key, p, lo - 0.2, top - 0.16, WALL_HALF, ext);
          stoneCourse(B, key, p, top - 0.16, top, WALL_HALF + 0.05, ext + 0.04, cope);
        }
      }
      if (s.kind === 'bulwark') bulwark(B, s, floorOf(v, s.ax, s.az), floorOf(v, s.bx, s.bz));
      else if (s.kind === 'rail' || s.kind === 'bay' || (isDeck && s.kind === 'kerb')) rail(B, s, floorOf(v, s.ax, s.az), floorOf(v, s.bx, s.bz));
    }
  }
}

/** An open steel railing: a toe board, two rails and posts at 2.4 m. Below the eye, so a drop is seen over it. */
function rail(B, s, ya, yb) {
  const H = 1.05;
  const dx = s.bx - s.ax, dz = s.bz - s.az;
  const len = Math.hypot(dx, dz);
  B.beam('darkSteel', [s.ax, ya + 0.08, s.az], [s.bx, yb + 0.08, s.bz], 0.06, 0.16);
  // Tube rails on round stanchions, each stanchion on a small base plate.
  B.tube('paintYellow', [s.ax, ya + H, s.az], [s.bx, yb + H, s.bz], 0.03);
  B.tube('paintYellow', [s.ax, ya + H * 0.52, s.az], [s.bx, yb + H * 0.52, s.bz], 0.022);
  const n = Math.max(1, Math.round(len / 2.4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = s.ax + dx * t, y = ya + (yb - ya) * t, z = s.az + dz * t;
    B.cyl('darkSteel', 0.032, 0.032, H, 8, x, y + H / 2, z);
    B.cyl('darkSteel', 0.07, 0.07, 0.02, 8, x, y + 0.01, z);
  }
}

/** A ship's bulwark: a steel plate 1.1 m high, stiffened by stays, a rail along its top. */
function bulwark(B, s, ya, yb) {
  const H = 1.1;
  const dx = s.bx - s.ax, dz = s.bz - s.az;
  const len = Math.hypot(dx, dz);
  const [px, pz] = [s.dirX * 0.18, s.dirZ * 0.18];
  B.beam('hullPlate', [s.ax - px, ya + H / 2, s.az - pz], [s.bx - px, yb + H / 2, s.bz - pz], 0.1, H);
  B.beam('darkSteel', [s.ax - px, ya + H + 0.02, s.az - pz], [s.bx - px, yb + H + 0.02, s.bz - pz], 0.2, 0.04);
  B.tube('darkSteel', [s.ax - px, ya + H + 0.07, s.az - pz], [s.bx - px, yb + H + 0.07, s.bz - pz], 0.05);
  const n = Math.max(1, Math.round(len / 1.8));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    B.box('darkSteel', 0.08, H * 0.9, 0.08, s.ax + dx * t - px * 0.2 + s.dirX * 0.06, ya + (yb - ya) * t + H * 0.45, s.az + dz * t - pz * 0.2 + s.dirZ * 0.06);
  }
}

/* ---------------------------------------------- built floors: gangways, piers, gates, decks */

function decks(B, plan) {
  for (const v of plan.deckVols) {
    const r = v.rect;
    const f = v.floor;
    const graded = f.y1 !== undefined && f.y1 !== f.y0;
    const key = v.kind === 'pier' ? 'timber' : v.kind === 'gate' ? 'timber' : 'deckPlate';
    if (graded) {
      const along = f.axis;
      const [a, b] = along === 'x' ? [[r.minX, (r.minZ + r.maxZ) / 2], [r.maxX, (r.minZ + r.maxZ) / 2]] : [[(r.minX + r.maxX) / 2, r.minZ], [(r.minX + r.maxX) / 2, r.maxZ]];
      const ya = floorOf(v, a[0], a[1]), yb = floorOf(v, b[0], b[1]);
      const w = along === 'x' ? r.maxZ - r.minZ : r.maxX - r.minX;
      B.beam(key, [a[0], ya - 0.12, a[1]], [b[0], yb - 0.12, b[1]], w, 0.24);
      // Treads across a gangway, so it reads as one.
      if (v.kind === 'gangway') {
        const n = Math.round((along === 'x' ? r.maxX - r.minX : r.maxZ - r.minZ) / 0.45);
        for (let i = 1; i < n; i++) {
          const t = i / n;
          const x = along === 'x' ? r.minX + (r.maxX - r.minX) * t : (r.minX + r.maxX) / 2;
          const z = along === 'x' ? (r.minZ + r.maxZ) / 2 : r.minZ + (r.maxZ - r.minZ) * t;
          const y = floorOf(v, x, z);
          if (along === 'x') B.box('darkSteel', 0.05, 0.05, w - 0.3, x, y + 0.02, z);
          else B.box('darkSteel', w - 0.3, 0.05, 0.05, x, y + 0.02, z);
        }
      }
    } else {
      B.span(key, r.minX, r.maxX, f.y0 - 0.3, f.y0, r.minZ, r.maxZ);
    }

    // What holds it up.
    if (v.kind === 'pier') {
      for (let x = r.minX + 0.4; x <= r.maxX; x += 2) {
        for (const z of [r.minZ + 0.4, r.maxZ - 0.4]) {
          const top = floorOf(v, x, z) - 0.3;
          B.cyl('timberDark', 0.17, 0.2, top - SEABED, 8, x, (top + SEABED) / 2, z);
        }
        B.box('timberDark', 0.22, 0.26, r.maxZ - r.minZ, x, floorOf(v, x, r.minZ) - 0.43, (r.minZ + r.maxZ) / 2);
      }
    } else if (v.kind === 'gate') {
      // The gate leaves under the walk: two mitred leaves of greenheart and steel, meeting at the middle.
      const alongX = r.maxX - r.minX > r.maxZ - r.minZ;
      const base = v.id === 'gate' ? DOCK - 0.2 : SEABED;
      const top = f.y0 - 0.3;
      if (alongX) {
        const mid = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
        B.box('timberDark', mid - r.minX, top - base, 1.1, (r.minX + mid) / 2, (top + base) / 2, cz - 0.35, 0, 0.06, 0);
        B.box('timberDark', r.maxX - mid, top - base, 1.1, (mid + r.maxX) / 2, (top + base) / 2, cz - 0.35, 0, -0.06, 0);
        for (let y = base + 1.4; y < top; y += 1.6) B.span('darkSteel', r.minX, r.maxX, y, y + 0.22, cz - 0.95, cz - 0.85);
      } else {
        const mid = (r.minZ + r.maxZ) / 2, cx = (r.minX + r.maxX) / 2;
        B.box('timberDark', 1.1, top - base, mid - r.minZ, cx, (top + base) / 2, (r.minZ + mid) / 2, 0, 0.06, 0);
        B.box('timberDark', 1.1, top - base, r.maxZ - mid, cx, (top + base) / 2, (mid + r.maxZ) / 2, 0, -0.06, 0);
        for (let y = base + 1.4; y < top; y += 1.6) B.span('darkSteel', cx + 0.6, cx + 0.7, y, y + 0.22, r.minZ, r.maxZ);
        // The balance beams and the capstans on the lock's walls.
        for (const z of [r.minZ - 1.6, r.maxZ + 1.6]) B.cyl('darkSteel', 0.4, 0.5, 0.8, 12, cx, f.y0 + 0.4, z);
      }
    } else if (v.kind === 'gangway') {
      // Two stringers under the treads and a roller at the foot.
      const along = f.axis;
      for (const off of [-1, 1]) {
        if (along === 'z') {
          const x = (r.minX + r.maxX) / 2 + off * ((r.maxX - r.minX) / 2 - 0.15);
          B.beam('darkSteel', [x, floorOf(v, x, r.minZ) - 0.35, r.minZ], [x, floorOf(v, x, r.maxZ) - 0.35, r.maxZ], 0.12, 0.3);
        } else {
          const z = (r.minZ + r.maxZ) / 2 + off * ((r.maxZ - r.minZ) / 2 - 0.15);
          B.beam('darkSteel', [r.minX, floorOf(v, r.minX, z) - 0.35, z], [r.maxX, floorOf(v, r.maxX, z) - 0.35, z], 0.12, 0.3);
        }
      }
    }
  }
}

/* ---------------------------------------------- the rooms */

const ROOM_MAT = {
  deckhouse: { wall: 'shipWhite', roof: 'deckPlate', floor: 'deckPlate' },
  pumpRoom: { wall: 'tankSteel', roof: 'darkSteel', floor: 'grating' },
  pumpWell: { wall: 'concrete', roof: 'concrete', floor: 'concrete' },
  hold: { wall: 'holdSteel', roof: 'hatch', floor: 'timberDark' },
  thawShed: { wall: 'timber', roof: 'roofSheet', floor: 'timber' },
  saltStore: { wall: 'boards', roof: 'roofSheet', floor: 'timber' },
  evaporator: { wall: 'shipWhite', roof: 'darkSteel', floor: 'grating' }
};

/** How high a room's walls stand: to its roof, or up to the ground round it when it is sunk below that. */
function wallTop(plan, v) {
  const rm = v.room;
  let top = rm.floor + rm.top + 0.45;
  if (rm.shell === 'pumpWell') top = Math.max(top, QUAY);
  return top;
}

/**
 * A hipped roof as one closed solid: four sloping faces from the eaves rectangle (at `y`) up to a ridge `rise`
 * above, inset `inset` from the short ends, and a flat soffit under the eaves.
 */
function hipRoof(x0, x1, z0, z1, y, rise, inset) {
  const cz = (z0 + z1) / 2;
  const ra = [x0 + inset, y + rise, cz], rb = [x1 - inset, y + rise, cz];
  const A = [x0, y, z0], Bq = [x1, y, z0], C = [x1, y, z1], D = [x0, y, z1];
  const tris = [
    A, rb, Bq, A, ra, rb,      // the north slope
    C, ra, D, C, rb, ra,       // the south slope
    Bq, rb, C,                 // the east hip
    D, ra, A,                  // the west hip
    A, Bq, C, A, C, D          // the soffit
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

/** Corner boards up the four outside corners of a boarded room, from `y0` to `y1`. */
function cornerBoards(B, r, y0, y1) {
  const o = WALL_HALF + 0.05;
  for (const x of [r.minX - o, r.maxX + o]) for (const z of [r.minZ - o, r.maxZ + o]) B.span('timberDark', x - 0.1, x + 0.1, y0, y1, z - 0.1, z + 0.1);
}

function room(B, plan, v) {
  const rm = v.room;
  const r = rm.rect;
  const y0 = rm.floor;
  const M = ROOM_MAT[rm.shell];
  const top = wallTop(plan, v);
  const roofY = y0 + rm.top;
  const W = r.maxX - r.minX, D = r.maxZ - r.minZ;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;

  // Floor.
  B.span(M.floor, r.minX - 0.3, r.maxX + 0.3, y0 - 0.4, y0, r.minZ - 0.3, r.maxZ + 0.3);
  if (rm.shell === 'thawShed' || rm.shell === 'saltStore') {
    // On piles over the basin.
    for (let x = r.minX + 0.5; x < r.maxX; x += 3.25) {
      for (let z = r.minZ + 0.5; z < r.maxZ; z += 3.25) B.cyl('timberDark', 0.2, 0.24, y0 - 0.4 - SEABED, 8, x, (y0 - 0.4 + SEABED) / 2, z);
    }
    B.span('timberDark', r.minX - 0.3, r.maxX + 0.3, y0 - 0.75, y0 - 0.4, r.minZ - 0.3, r.minZ + 0.1);
    B.span('timberDark', r.minX - 0.3, r.maxX + 0.3, y0 - 0.75, y0 - 0.4, r.maxZ - 0.1, r.maxZ + 0.3);
  }

  // Walls, the door and window gaps left out.
  for (const s of plan.wallSegments(v)) wallBox(B, M.wall, s, y0 - 0.4, top);
  // Over every gap: a header from the door head up to the wall's top; under a window, its sill.
  for (const op of v.openings) {
    const plane = op.side === 'minX' ? r.minX : op.side === 'maxX' ? r.maxX : op.side === 'minZ' ? r.minZ : r.maxZ;
    const seg = op.side === 'minX' || op.side === 'maxX'
      ? { side: op.side, ax: plane, az: op.lo, bx: plane, bz: op.hi }
      : { side: op.side, ax: op.lo, az: plane, bx: op.hi, bz: plane };
    if (op.kind === 'window') {
      wallBox(B, M.wall, seg, y0 - 0.4, y0 + 1.15, WALL_HALF, 0);
      wallBox(B, M.wall, seg, y0 + 3.1, top, WALL_HALF, 0);
      wallBox(B, 'glass', seg, y0 + 1.15, y0 + 3.1, 0.03, 0);
      const along = op.side === 'minZ' || op.side === 'maxZ';
      for (let t = op.lo; t <= op.hi + 0.01; t += (op.hi - op.lo) / 6) {
        if (along) B.span('darkSteel', t - 0.07, t + 0.07, y0 + 1.15, y0 + 3.1, plane - 0.12, plane + 0.12);
        else B.span('darkSteel', plane - 0.12, plane + 0.12, y0 + 1.15, y0 + 3.1, t - 0.07, t + 0.07);
      }
      continue;
    }
    if (op.kind === 'bay') {
      // The open end over the slip: a rail across it, a beam overhead.
      rail(B, { ...seg, dirX: 0, dirZ: 0 }, y0, y0);
      wallBox(B, M.wall, seg, y0 + 4.8, top, WALL_HALF, 0);
      continue;
    }
    wallBox(B, M.wall, seg, y0 + 4.7, top, WALL_HALF, 0);
  }

  // The roof and what makes each room its own.
  const roofSlab = key => B.span(key, r.minX - 0.4, r.maxX + 0.4, roofY, roofY + 0.45, r.minZ - 0.4, r.maxZ + 0.4);
  switch (rm.shell) {
    case 'deckhouse': {
      roofSlab(M.roof);
      // Deck beams under the roof, the wheelhouse front's eyebrow over the windows, and the radar mast's foot.
      for (let x = r.minX + 1.4; x < r.maxX; x += 2.2) B.span('darkSteel', x - 0.1, x + 0.1, roofY - 0.32, roofY, r.minZ, r.maxZ);
      B.span(M.roof, r.minX - 0.4, r.maxX + 0.4, roofY - 0.1, roofY + 0.05, r.minZ - 1.4, r.minZ - 0.3);
      B.span('shipWhite', cx - 0.6, cx + 0.6, roofY + 0.45, roofY + 1.6, cz + 1.4, cz + 2.6);
      break;
    }
    case 'pumpRoom': {
      roofSlab(M.roof);
      // Web frames down the bulkheads and the deck longitudinals overhead.
      for (let x = r.minX + 1.75; x < r.maxX; x += 3.5) {
        B.span('darkSteel', x - 0.06, x + 0.06, y0, roofY, r.maxZ - 0.6, r.maxZ - 0.3);
        B.span('darkSteel', x - 0.06, x + 0.06, roofY - 0.5, roofY, r.minZ, r.maxZ);
      }
      for (let z = r.minZ + 1.75; z < r.maxZ; z += 3.5) {
        B.span('darkSteel', r.minX + 0.3, r.minX + 0.6, y0, roofY, z - 0.06, z + 0.06);
        B.span('darkSteel', r.maxX - 0.6, r.maxX - 0.3, y0, roofY, z - 0.06, z + 0.06);
      }
      break;
    }
    case 'pumpWell': {
      roofSlab(M.roof);
      // Two concrete downstand beams carry the pump house floor; the sump grating along the back wall.
      for (const z of [r.minZ + 4.6, r.maxZ - 4.6]) B.span('concrete', r.minX, r.maxX, roofY - 0.7, roofY, z - 0.3, z + 0.3);
      break;
    }
    case 'hold': {
      // The hatch covers on the coaming, frames down the hull's sides and the stringer at half depth.
      B.span(M.roof, r.minX - 0.4, r.maxX + 0.4, roofY, roofY + 0.45, r.minZ - 0.4, r.maxZ + 0.4);
      for (let x = r.minX + 2; x < r.maxX - 1; x += 2.8) B.span('hatch', x - 0.08, x + 0.08, roofY + 0.45, roofY + 0.62, r.minZ - 0.4, r.maxZ + 0.4);
      for (let x = r.minX + 0.8; x < r.maxX; x += 1.4) {
        for (const z of [r.minZ + 0.42, r.maxZ - 0.42]) B.span('holdSteel', x - 0.05, x + 0.05, y0, roofY, z - 0.12, z + 0.12);
      }
      for (const z of [r.minZ + 0.55, r.maxZ - 0.55]) B.span('darkSteel', r.minX + 0.3, r.maxX - 0.3, y0 + 2.6, y0 + 2.75, z - 0.25, z + 0.25);
      break;
    }
    case 'thawShed': {
      // A pitched roof on timber trusses, the ridge running east to the slip.
      const ridge = roofY + 2.6;
      const halfD = D / 2 + 0.6;
      const pitch = Math.atan2(ridge - roofY, halfD);
      const slope = Math.hypot(halfD, ridge - roofY);
      B.box(M.roof, W + 1.2, 0.16, slope, cx + 0.3, (roofY + ridge) / 2, cz - halfD / 2, -pitch, 0, 0);
      B.box(M.roof, W + 1.2, 0.16, slope, cx + 0.3, (roofY + ridge) / 2, cz + halfD / 2, pitch, 0, 0);
      // Fascia boards along both eaves, a capping along the ridge, boards up the corners.
      for (const sz of [-1, 1]) B.span('timberDark', r.minX - 0.3, r.maxX + 0.9, roofY - 0.22, roofY + 0.02, cz + sz * halfD - 0.06, cz + sz * halfD + 0.06);
      B.tube('darkSteel', [r.minX - 0.3, ridge + 0.04, cz], [r.maxX + 0.9, ridge + 0.04, cz], 0.09, 8);
      cornerBoards(B, r, y0 - 0.75, roofY);
      for (let x = r.minX + 0.3; x <= r.maxX + 0.1; x += 2.8) {
        B.span('timberDark', x - 0.1, x + 0.1, roofY - 0.25, roofY, r.minZ, r.maxZ);
        B.beam('timberDark', [x, roofY, r.minZ], [x, ridge - 0.1, cz], 0.16, 0.2);
        B.beam('timberDark', [x, roofY, r.maxZ], [x, ridge - 0.1, cz], 0.16, 0.2);
        B.span('timberDark', x - 0.07, x + 0.07, roofY, ridge - 0.1, cz - 0.07, cz + 0.07);
      }
      // Gable infill over the west wall; the east gable open over the slip.
      {
        // A triangle of boarding under the two slopes, not a stack of steps.
        const tri = new THREE.Shape([new THREE.Vector2(-halfD, 0), new THREE.Vector2(halfD, 0), new THREE.Vector2(0, ridge - roofY - 0.2)]);
        const gab = new THREE.ExtrudeGeometry(tri, { depth: 0.6, bevelEnabled: false });
        gab.rotateY(Math.PI / 2);
        gab.translate(r.minX - 0.3, roofY, cz);
        B.geo(M.wall, gab);
      }
      // The slip: rails running down from the open end into the water.
      for (const z of [cz - 2.2, cz + 2.2]) B.beam('darkSteel', [r.maxX, y0 - 0.2, z], [r.maxX + 16, WATER - 1.8, z], 0.2, 0.3);
      // The launch frozen on its cradle half way down the slip, ice crusted along its waterline.
      {
        const lx = r.maxX + 6.5, ly = y0 - 0.2 + (WATER - 1.8 - y0 + 0.2) * (6.5 / 16);
        const tilt = Math.atan2(WATER - 1.8 - y0, 16);
        B.box('timberDark', 4.8, 0.5, 3.6, lx, ly + 0.2, cz, 0, 0, tilt);
        const shape = new THREE.Shape([[-3.6, -1.3], [2.6, -1.3], [3.8, 0], [2.6, 1.3], [-3.6, 1.3]].map(([a, b]) => new THREE.Vector2(a, b)));
        const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false });
        hullGeo.rotateX(-Math.PI / 2);
        hullGeo.rotateZ(tilt);
        hullGeo.translate(lx, ly + 0.45, cz);
        B.geo('shipRed', hullGeo);
        B.box('shipWhite', 2.2, 1.2, 1.8, lx - 1.2, ly + 2.5, cz, 0, 0, tilt);
        B.box('iceDeep', 7.2, 0.35, 2.9, lx + 0.1, ly + 1.95, cz, 0, 0, tilt);
      }
      for (let x = r.maxX + 1; x < r.maxX + 16; x += 3) {
        const y = y0 - 0.2 + (WATER - 1.8 - y0 + 0.2) * ((x - r.maxX) / 16);
        B.cyl('timberDark', 0.18, 0.2, y - SEABED, 8, x, (y + SEABED) / 2, cz - 2.2);
        B.cyl('timberDark', 0.18, 0.2, y - SEABED, 8, x, (y + SEABED) / 2, cz + 2.2);
      }
      break;
    }
    case 'saltStore': {
      // A hipped roof over a boarded store; a loading hatch in the north gable.
      const rise = 2.2;
      // A true hip: four sheeted slopes to a short ridge, a fascia round the eaves, boards up the corners.
      B.span('timberDark', r.minX - 0.5, r.maxX + 0.5, roofY + 0.45, roofY + 0.6, r.minZ - 0.5, r.maxZ + 0.5);
      B.geo(M.roof, hipRoof(r.minX - 0.5, r.maxX + 0.5, r.minZ - 0.5, r.maxZ + 0.5, roofY + 0.6, rise, (D + 1) / 2 * 0.85));
      cornerBoards(B, r, y0 - 0.75, roofY + 0.45);
      roofSlab('timber');
      for (let z = r.minZ + 1.5; z < r.maxZ; z += 2.75) B.span('timberDark', r.minX, r.maxX, roofY - 0.3, roofY, z - 0.1, z + 0.1);
      // Posts of the frame showing on the inside of the boards.
      for (let x = r.minX + 0.6; x < r.maxX; x += 2.6) {
        for (const z of [r.minZ + 0.36, r.maxZ - 0.36]) B.span('timberDark', x - 0.09, x + 0.09, y0, roofY, z - 0.06, z + 0.06);
      }
      break;
    }
    case 'evaporator': {
      roofSlab(M.roof);
      for (let z = r.minZ + 1.4; z < r.maxZ; z += 2.2) B.span('darkSteel', r.minX, r.maxX, roofY - 0.3, roofY, z - 0.08, z + 0.08);
      // The forecastle over it: a raised deck with a breakwater across the bow.
      B.span('deckPlate', r.minX - 2.0, r.maxX + 0.4, roofY + 0.45, roofY + 0.6, r.minZ - 2.0, r.maxZ + 0.4);
      B.span('hullPlate', r.minX - 1.4, r.minX - 1.2, roofY + 0.6, roofY + 1.6, r.minZ + 1, r.maxZ - 1);
      break;
    }
    default: roofSlab(M.roof);
  }
}

/* ---------------------------------------------- the passages down into the hulls */

function passage(B, plan, v) {
  const r = v.rect;
  const f = v.floor;
  const H = v.roof ?? 3.4;
  const hullDeck = plan.hulls.find(h => h.rect.minX <= r.minX && h.rect.maxX >= r.maxX && h.rect.minZ <= r.minZ && h.rect.maxZ >= r.maxZ)?.deck ?? QUAY;
  const along = f.axis;
  const lo = Math.min(f.y0, f.y1), hi = Math.max(f.y0, f.y1);
  const top = Math.max(hi + H, hullDeck) + 0.45;
  // The floor: one sloped slab with treads.
  const a = along === 'x' ? [f.from, (r.minZ + r.maxZ) / 2] : [(r.minX + r.maxX) / 2, f.from];
  const b = along === 'x' ? [f.to, (r.minZ + r.maxZ) / 2] : [(r.minX + r.maxX) / 2, f.to];
  const w = along === 'x' ? r.maxZ - r.minZ : r.maxX - r.minX;
  const span0 = along === 'x' ? [r.minX, r.maxX] : [r.minZ, r.maxZ];
  // Floor in short level pieces following the grade (a slab per 0.5 m, top at the floor).
  for (let s = span0[0]; s < span0[1] - 0.01; s += 0.5) {
    const s1 = Math.min(span0[1], s + 0.5);
    const yy = Math.max(floorOf(v, along === 'x' ? s : a[0], along === 'x' ? a[1] : s), floorOf(v, along === 'x' ? s1 : a[0], along === 'x' ? a[1] : s1));
    if (along === 'x') B.span('grating', s, s1, yy - 0.3, yy, r.minZ, r.maxZ);
    else B.span('grating', r.minX, r.maxX, yy - 0.3, yy, s, s1);
  }
  // Handrails along both sides.
  for (const off of [0.42, w - 0.42]) {
    const pa = along === 'x' ? [a[0], r.minZ + off] : [r.minX + off, a[1]];
    const pb = along === 'x' ? [b[0], r.minZ + off] : [r.minX + off, b[1]];
    B.beam('brass', [pa[0], floorOf(v, pa[0], pa[1]) + 0.95, pa[1]], [pb[0], floorOf(v, pb[0], pb[1]) + 0.95, pb[1]], 0.05, 0.05);
  }
  // Walls.
  for (const s of plan.wallSegments(v)) wallBox(B, 'shipWhite', s, lo - 0.4, top);
  // The roof: sloped above the floor until it meets the deck, then flat under the deck.
  const pts = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = span0[0] + (span0[1] - span0[0]) * (i / n);
    const fy = floorOf(v, along === 'x' ? t : a[0], along === 'x' ? a[1] : t);
    pts.push([t, Math.max(fy + H, hullDeck - 0.45)]);
  }
  for (let i = 0; i < n; i++) {
    const [t0, y0] = pts[i], [t1, y1] = pts[i + 1];
    if (along === 'x') B.beam('darkSteel', [t0, y0 + 0.2, (r.minZ + r.maxZ) / 2], [t1, y1 + 0.2, (r.minZ + r.maxZ) / 2], w + 0.6, 0.4);
    else B.beam('darkSteel', [(r.minX + r.maxX) / 2, y0 + 0.2, t0], [(r.minX + r.maxX) / 2, y1 + 0.2, t1], w + 0.6, 0.4);
  }
  // Headers over each end where the roof stands above the door head.
  for (const op of v.openings) {
    const plane = op.side === 'minX' ? r.minX : op.side === 'maxX' ? r.maxX : op.side === 'minZ' ? r.minZ : r.maxZ;
    const seg = op.side === 'minX' || op.side === 'maxX' ? { side: op.side, ax: plane, az: op.lo, bx: plane, bz: op.hi } : { side: op.side, ax: op.lo, az: plane, bx: op.hi, bz: plane };
    const fy = floorOf(v, seg.ax, seg.az);
    wallBox(B, 'shipWhite', seg, fy + H, top, WALL_HALF, 0);
  }
}

/* ---------------------------------------------- the hulls */

function hull(B, plan, h) {
  const r = h.rect;
  const deck = h.deck;
  const paint = h.paint;
  // The parallel body's sides (not the bow end), from the keel to the deck, with the boot-top band at the water.
  const sides = h.bow === 'west'
    ? [['minZ', r.minX, r.maxX, r.minZ], ['maxZ', r.minX, r.maxX, r.maxZ], ['maxX', r.minZ, r.maxZ, r.maxX]]
    : [['minX', r.minZ, r.maxZ, r.minX], ['maxX', r.minZ, r.maxZ, r.maxX], ['maxZ', r.minX, r.maxX, r.maxZ]];
  for (const [side, a, b, p] of sides) {
    const out = side === 'minX' || side === 'minZ' ? -1 : 1;
    if (side === 'minX' || side === 'maxX') {
      B.span(paint, p + out * 0.02 - 0.15, p + out * 0.02 + 0.15, h.keel, deck, a, b);
      B.span('bootTop', p + out * 0.06 - 0.15, p + out * 0.06 + 0.15, WATER - 0.6, WATER + 0.7, a, b);
      B.span('darkSteel', p + out * 0.22 - 0.1, p + out * 0.22 + 0.1, deck - 0.35, deck - 0.15, a, b);
      B.tube('darkSteel', [p + out * 0.26, deck - 1.4, a + 0.4], [p + out * 0.26, deck - 1.4, b - 0.4], 0.13, 10);
    } else {
      B.span(paint, a, b, h.keel, deck, p + out * 0.02 - 0.15, p + out * 0.02 + 0.15);
      B.span('bootTop', a, b, WATER - 0.6, WATER + 0.7, p + out * 0.06 - 0.15, p + out * 0.06 + 0.15);
      B.span('darkSteel', a, b, deck - 0.35, deck - 0.15, p + out * 0.22 - 0.1, p + out * 0.22 + 0.1);
      B.tube('darkSteel', [a + 0.4, deck - 1.4, p + out * 0.26], [b - 0.4, deck - 1.4, p + out * 0.26], 0.13, 10);
    }
  }
  // The bow: an extruded prism from the keel to a raised forecastle, its sheer rising forward.
  const poly = plan.outlines.find(e => e.hull === h).poly;
  const bowPts = h.bow === 'west' ? poly.slice(2).concat([poly[0]]).filter(p => p[0] <= r.minX + 1e-6) : poly.slice(2).filter(p => p[1] <= r.minZ + 1e-6);
  const shape = new THREE.Shape(bowPts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const fore = deck + 2.0;
  const bowGeo = new THREE.ExtrudeGeometry(shape, { depth: fore - h.keel, bevelEnabled: false });
  bowGeo.rotateX(-Math.PI / 2);
  bowGeo.translate(0, h.keel, 0);
  B.geo(paint, bowGeo);
  const capGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
  capGeo.rotateX(-Math.PI / 2);
  capGeo.translate(0, fore, 0);
  B.geo('deckPlate', capGeo);

  // The deck over the closed parts of the hull: split the body by every volume edge inside it, plate what no volume holds.
  const inside = plan.volumes.filter(v => v.rect.minX >= r.minX - 1e-6 && v.rect.maxX <= r.maxX + 1e-6 && v.rect.minZ >= r.minZ - 1e-6 && v.rect.maxZ <= r.maxZ + 1e-6);
  const xs = [...new Set([r.minX, r.maxX, ...inside.flatMap(v => [v.rect.minX, v.rect.maxX])])].sort((a, b) => a - b);
  const zs = [...new Set([r.minZ, r.maxZ, ...inside.flatMap(v => [v.rect.minZ, v.rect.maxZ])])].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      const mx = (xs[i] + xs[i + 1]) / 2, mz = (zs[j] + zs[j + 1]) / 2;
      if (inside.some(v => mx > v.rect.minX && mx < v.rect.maxX && mz > v.rect.minZ && mz < v.rect.maxZ)) continue;
      B.span('deckPlate', xs[i], xs[i + 1], deck - 0.3, deck, zs[j], zs[j + 1]);
    }
  }
  superstructure(B, plan, h);
}

/**
 * A row of portholes on a face of a deckhouse: dark glass in a brass rim, every `step` m between `lo` and `hi`
 * along the face, at height `y`. `axis` is the face's normal axis ('x' or 'z'), `plane` where the face is, `out`
 * its outward sign.
 */
function portholes(B, axis, plane, out, y, lo, hi, step = 1.4, r = 0.2) {
  const n = Math.max(1, Math.floor((hi - lo) / step));
  const pad = (hi - lo - (n - 1) * step) / 2;
  for (let i = 0; i < n; i++) {
    const t = lo + pad + i * step;
    if (axis === 'z') {
      B.cyl('brass', r + 0.05, r + 0.05, 0.06, 14, t, y, plane + out * 0.03, Math.PI / 2, 0, 0);
      B.cyl('glassDark', r, r, 0.07, 14, t, y, plane + out * 0.04, Math.PI / 2, 0, 0);
    } else {
      B.cyl('brass', r + 0.05, r + 0.05, 0.06, 14, plane + out * 0.03, y, t, 0, 0, Math.PI / 2);
      B.cyl('glassDark', r, r, 0.07, 14, plane + out * 0.04, y, t, 0, 0, Math.PI / 2);
    }
  }
}

/** A row of square windows (dark glass in a steel frame) on a face, as `portholes`. */
function windows(B, axis, plane, out, y, lo, hi, step = 2.2, w = 0.9, h = 0.75) {
  const n = Math.max(1, Math.floor((hi - lo) / step));
  const pad = (hi - lo - (n - 1) * step) / 2;
  for (let i = 0; i < n; i++) {
    const t = lo + pad + i * step;
    const o = plane + out * 0.04;
    if (axis === 'z') {
      B.span('darkSteel', t - w / 2 - 0.06, t + w / 2 + 0.06, y - h / 2 - 0.06, y + h / 2 + 0.06, o - 0.04, o + 0.02);
      B.span('glassDark', t - w / 2, t + w / 2, y - h / 2, y + h / 2, o - 0.02, o + 0.04);
    } else {
      B.span('darkSteel', o - 0.04, o + 0.02, y - h / 2 - 0.06, y + h / 2 + 0.06, t - w / 2 - 0.06, t + w / 2 + 0.06);
      B.span('glassDark', o - 0.02, o + 0.04, y - h / 2, y + h / 2, t - w / 2, t + w / 2);
    }
  }
}

/** The rail round an upper deck: round stanchions every 1.5 m, a top rail and a mid rail. */
function deckRail(B, x0, x1, z0, z1, y) {
  const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
    B.tube('darkSteel', [ax, y + 1.0, az], [bx, y + 1.0, bz], 0.028, 6);
    B.tube('darkSteel', [ax, y + 0.5, az], [bx, y + 0.5, bz], 0.02, 6);
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 1.5));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      B.cyl('darkSteel', 0.025, 0.025, 1.0, 6, ax + (bx - ax) * t, y + 0.5, az + (bz - az) * t);
    }
  }
}

/** What stands on each hull's deck: the parts that make an ice-breaker, a tanker or a freighter. */
function superstructure(B, plan, h) {
  const r = h.rect, d = h.deck;
  if (h.id === 'icebreaker') {
    // The engine casing aft of the deckhouse, the funnel on it, the boat deck over the casing.
    B.span('shipWhite', 20.6, 34.6, d, d + 3.2, 0.6, 13.4);
    B.span('deckPlate', 20.2, 35, d + 3.2, d + 3.4, 0.2, 13.8);
    deckRail(B, 20.4, 34.8, 0.4, 13.6, d + 3.4);
    portholes(B, 'z', 13.4, 1, d + 1.9, 21.2, 34, 1.4);
    portholes(B, 'z', 0.6, -1, d + 1.9, 21.2, 34, 1.4);
    portholes(B, 'x', 34.6, 1, d + 1.9, 1.4, 12.6, 1.6);
    B.cyl('shipRed', 1.7, 1.9, 6.5, 18, 27, d + 3.4 + 3.25, 7);
    B.cyl('darkSteel', 1.75, 1.75, 0.9, 18, 27, d + 3.4 + 6.1, 7);
    // The foremast with its crow's nest on the forecastle.
    B.cyl('darkSteel', 0.22, 0.3, 14, 10, -30, d + 2 + 7, 8);
    B.cyl('darkSteel', 0.9, 0.9, 1.2, 12, -30, d + 2 + 11.5, 8);
    // The ice knife under the bow: a heavy stem bar.
    B.beam('darkSteel', [r.minX - 12, d + 2.0, 8], [r.minX - 7, WATER - 2.5, 8], 0.5, 0.6);
    // Fenders against the quay.
    for (let x = -20; x <= 30; x += 7) B.cyl('rubber', 0.45, 0.45, 2.6, 12, x, WATER + 1.1, r.maxZ + 0.6, Math.PI / 2, 0, 0);
  } else if (h.id === 'tanker') {
    // The cargo trunk down the middle and the catwalk over it, forward and aft of the manifold deck.
    B.span('deckPlate', 62, 68, d, d + 0.9, -52, -36);
    B.span('deckPlate', 62, 68, d, d + 0.9, 0, 12);
    for (let z = -50; z <= 10; z += 4) if (z < -36 || z > 0) B.span('darkSteel', 64.6, 65.4, d + 0.9, d + 2.6, z - 0.08, z + 0.08);
    B.span('grating', 64, 66, d + 2.6, d + 2.72, -52, -36);
    B.span('grating', 64, 66, d + 2.6, d + 2.72, 0, 12);
    // The midship deckhouse forward of the manifold deck, the after accommodation and its funnel.
    B.span('shipWhite', 57, 73, d, d + 6.5, 2.4, 12.6);
    B.span('deckPlate', 56.6, 73.4, d + 6.5, d + 6.7, 2, 13);
    deckRail(B, 56.8, 73.2, 2.2, 12.8, d + 6.7);
    for (const y of [d + 1.7, d + 4.6]) {
      windows(B, 'x', 57, -1, y, 3.2, 11.8);
      windows(B, 'x', 73, 1, y, 3.2, 11.8);
      windows(B, 'z', 12.6, 1, y, 58, 72);
    }
    B.cyl('shipBlack', 1.3, 1.5, 4.6, 16, 65, d + 6.7 + 2.3, 9);
    // Vent masts over the cargo tanks.
    for (const [x, z] of [[58.5, -44], [71.5, -44], [58.5, -24], [71.5, -24]]) B.cyl('darkSteel', 0.14, 0.14, 4.6, 8, x, d + 2.3, z);
  } else if (h.id === 'freighter') {
    // Hatch 2's coaming forward of the slope, the after deckhouse and the mast between the holds.
    B.span('hatch', -80.6, -68, d, d + 1.5, -57, -56.6);
    B.span('hatch', -80.6, -68, d, d + 1.5, -49.4, -43);
    B.span('shipWhite', -68, -56, d, d + 4.6, -45.4, -40.6);
    B.span('deckPlate', -68.4, -55.6, d + 4.6, d + 4.8, -45.8, -40.2);
    deckRail(B, -68.2, -55.8, -45.6, -40.4, d + 4.8);
    portholes(B, 'z', -40.6, 1, d + 2.6, -67, -57, 1.5);
    portholes(B, 'z', -45.4, -1, d + 2.6, -67, -57, 1.5);
    B.cyl('shipRust', 0.9, 1.1, 3.2, 14, -60, d + 4.8 + 1.6, -43);
    B.cyl('darkSteel', 0.24, 0.3, 11, 10, -79.6, d + 1.5 + 5.5, -40.9);
    B.beam('darkSteel', [-79.6, d + 9, -40.9], [-86, d + 3.4, -46], 0.16, 0.16);
    // The ice the Fifth froze round it, heaved up against the plating on both sides.
    for (let x = -94; x <= -58; x += 3) {
      for (const [z, s] of [[r.minZ - 0.6, -1], [r.maxZ + 0.6, 1]]) {
        const hgt = 0.8 + Math.abs(Math.sin(x * 1.7)) * 1.6;
        B.box('iceDeep', 2.6, hgt, 1.4, x, ICE + hgt / 2 - 0.2, z, 0.3 * s, x * 0.4, 0.2);
      }
    }
  }
}

/* ---------------------------------------------- the dry dock and the pump house */

function dock(B, plan) {
  // The tug on its keel blocks: blocks down the middle, a hull on them, its deckhouse and funnel, shores to the walls.
  const t = TUG;
  const cx = (t.minX + t.maxX) / 2;
  for (let z = t.minZ + 1; z < t.maxZ; z += 2.2) B.span('timberDark', cx - 0.6, cx + 0.6, DOCK, t.keel, z - 0.4, z + 0.4);
  const half = (t.maxX - t.minX) / 2;
  const tugPlan = [[-half * 0.8, t.maxZ], [half * 0.8, t.maxZ], [half, t.maxZ - 4], [half, t.minZ + 6], [half * 0.5, t.minZ + 1.6], [0, t.minZ], [-half * 0.5, t.minZ + 1.6], [-half, t.minZ + 6], [-half, t.maxZ - 4]];
  const shape = new THREE.Shape(tugPlan.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: t.deck - t.keel, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(cx, t.keel, 0);
  B.geo('shipBlack', g);
  B.span('shipWhite', cx - 2.2, cx + 2.2, t.deck, t.deck + 2.6, t.minZ + 7, t.minZ + 13);
  B.span('deckPlate', cx - 2.5, cx + 2.5, t.deck + 2.6, t.deck + 2.8, t.minZ + 6.7, t.minZ + 13.3);
  B.cyl('shipRed', 0.8, 0.9, 3.4, 14, cx, t.deck + 2.8 + 1.7, t.minZ + 11.5);
  B.span('bootTop', cx - half, cx + half, t.keel + 1.2, t.keel + 1.8, t.minZ + 6, t.maxZ - 4);
  // Shores: timber struts from the bilge out to the dock walls' footings.
  for (let z = t.minZ + 4; z < t.maxZ - 2; z += 4) {
    B.beam('timber', [t.minX + 0.1, t.keel + 2.2, z], [DOCK_PIT.minX + 6.6, DOCK + 4.8, z], 0.24, 0.24);
    B.beam('timber', [t.maxX - 0.1, t.keel + 2.2, z], [DOCK_PIT.maxX - 0.4, DOCK + 4.8, z], 0.24, 0.24);
  }
  // The keel blocks' sill and the drain channel along the east wall.
  B.span('darkSteel', DOCK_PIT.maxX - 1.3, DOCK_PIT.maxX - 0.3, DOCK - 0.05, DOCK + 0.03, DOCK_PIT.minZ, DOCK_PIT.maxZ);
}

function pumpHouse(B) {
  const p = PUMP_HOUSE;
  B.span('brick', p.minX, p.maxX, QUAY - 0.3, QUAY + p.top, p.minZ, p.maxZ);
  B.span('roofSheet', p.minX - 0.5, p.maxX + 0.5, QUAY + p.top, QUAY + p.top + 0.35, p.minZ - 0.5, p.maxZ + 0.5);
  // A granite plinth at the foot and a stone string course under the eaves, both a little proud of the brick.
  B.chunk('granite', p.maxX - p.minX + 0.16, 0.7, p.maxZ - p.minZ + 0.16, (p.minX + p.maxX) / 2, QUAY + 0.05, (p.minZ + p.maxZ) / 2, 0, { round: 0.06, wear: 0.01, chip: 0.03, cell: 0.8 });
  B.chunk('granite', p.maxX - p.minX + 0.2, 0.3, p.maxZ - p.minZ + 0.2, (p.minX + p.maxX) / 2, QUAY + p.top - 0.25, (p.minZ + p.maxZ) / 2, 0, { round: 0.1, wear: 0.008, chip: 0.02, cell: 0.8 });
  // Stone sills under the windows.
  for (let x = p.minX + 2; x < p.maxX - 1; x += 3) B.chunk('granite', 1.5, 0.14, 0.22, x, 2.13, p.maxZ + 0.08, 0, { round: 0.2, wear: 0.005, cell: 0.4 });
  for (let z = p.minZ + 2; z < p.maxZ - 1; z += 3) B.chunk('granite', 0.22, 0.14, 1.5, p.maxX + 0.08, 2.13, z, 0, { round: 0.2, wear: 0.005, cell: 0.4 });
  // Tall arched windows on the yard and mole-head faces, as dark glass set in the brick.
  for (let x = p.minX + 2; x < p.maxX - 1; x += 3) B.span('glassDark', x - 0.6, x + 0.6, 2.2, 6.2, p.maxZ, p.maxZ + 0.05);
  for (let z = p.minZ + 2; z < p.maxZ - 1; z += 3) B.span('glassDark', p.maxX, p.maxX + 0.05, 2.2, 6.2, z - 0.6, z + 0.6);
  // Its chimney.
  B.span('brick', p.minX + 1, p.minX + 3, QUAY + p.top, QUAY + p.top + 9, p.minZ + 1, p.minZ + 3);
  B.chunk('granite', 2.3, 0.3, 2.3, p.minX + 2, QUAY + p.top + 9.1, p.minZ + 2, 0, { round: 0.15, wear: 0.01, cell: 0.6 });
}

/* ======================================================================
   THE FAR COUNTRY (`phys: 'ambient'`)
   ====================================================================== */

/** A far ship's hull: a long prism with a raked, pointed bow (+x), `L` × `Bm` × `H`, centred at the origin. */
function farHull(L, Bm, H) {
  const l = L / 2, b = Bm / 2;
  const shape = new THREE.Shape([[-l, -b], [l - Bm * 1.4, -b], [l, 0], [l - Bm * 1.4, b], [-l, b], [-l - 0.6, b * 0.6], [-l - 0.6, -b * 0.6]].map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 1 });
  g.rotateX(Math.PI / 2);
  g.translate(0, H / 2, 0);
  return g;
}

/** A gabled roof (a triangular prism) `len` long across a building `depth` deep, ridge `rise` above its eaves. */
function gable(len, depth, rise) {
  const d = depth / 2 + 0.5;
  const shape = new THREE.Shape([new THREE.Vector2(-d, 0), new THREE.Vector2(d, 0), new THREE.Vector2(0, rise)]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: len + 1, bevelEnabled: false });
  g.translate(0, 0, -(len + 1) / 2);
  g.rotateY(Math.PI / 2);
  return g;
}

export function buildHarbourVista(ctx, plan) {
  const group = new THREE.Group();
  group.name = 'mirrowen-vista';
  group.userData.phys = 'ambient';
  group.userData.noWeather = true;
  const B = bucketer();

  // NORTH: a tabular iceberg grounded in the sea ice, and a ship beset far out.
  {
    const y = plan.landHeight(-40, -330);
    // The berg: flat-topped, its walls broken and fluted by the sea, a calved block lying off its foot.
    B.chunk('ice', 110, 28, 46, -40, y + 10, -330, 0.12, { round: 0.18, wear: 6, chip: 12, taper: 0.12, cell: 4, uvMetres: 14 });
    B.chunk('iceDeep', 70, 18, 30, -10, y + 6, -310, 0.3, { round: 0.25, wear: 4.5, chip: 8, taper: 0.16, cell: 3, uvMetres: 14 });
    B.chunk('ice', 16, 7, 12, 14, y + 1.5, -296, 0.9, { round: 0.35, wear: 0.8, chip: 1.5, cell: 2, uvMetres: 10 });
    const sy = plan.landHeight(150, -260);
    const ship = farHull(60, 11, 7);
    ship.rotateX(0.06).rotateY(-0.6);
    ship.translate(150, sy + 1.5, -260);
    B.geo('shipBlack', ship);
    B.box('shipWhite', 12, 7, 9, 135, sy + 7, -250, 0, 0.6, 0.06);
  }
  // EAST: the outer breakwater out into the sea ice, the harbour light at its end.
  {
    // Armour stone heaped along the breakwater, each block its own broken shape.
    const br = rng(0xb4ea);
    for (let x = 100; x < 260; x += 8) B.chunk('granite', 8.2, 4.2 + br() * 0.8, 9, x + 4, ICE + 1.2, -40 + (x - 100) * 0.05, (br() - 0.5) * 0.3, { round: 0.3, wear: 0.4, chip: 1.2, cell: 1.6, uvMetres: 3 });
    B.cyl('shipWhite', 2.6, 3.2, 22, 12, 268, ICE + 12, -32);
    B.cyl('darkSteel', 2.2, 2.2, 3, 12, 268, ICE + 24.5, -32);
    B.cyl('paintRed', 2.8, 2.8, 4, 12, 268, ICE + 6, -32);
  }
  // SOUTH: the town climbing the hill behind the terrace, warehouse rows and the radio mast on the crest.
  {
    for (let i = 0; i < 9; i++) {
      const x = -120 + i * 34, z = 128 + (i % 3) * 22;
      const y = plan.landHeight(x, z);
      B.box(i % 2 ? 'brick' : 'hallWall', 26, 12 + (i % 3) * 3, 14, x, y + 6, z, 0, (i % 4) * 0.08, 0);
      const roof = gable(26, 14, 4 + (i % 2) * 1.5);
      roof.rotateY((i % 4) * 0.08);
      roof.translate(x, y + 12 + (i % 3) * 1.5, z);
      B.geo('roofSheet', roof);
    }
    const my = plan.landHeight(40, 330);
    B.cyl('darkSteel', 0.6, 1.8, 60, 8, 40, my + 30, 330);
  }
  // WEST: the frozen canal running away between the Fifth's walls of crystal ice, with two ships listing in it.
  {
    for (let x = -130; x > -560; x -= 26) {
      for (const z of [CANAL.minZ - 3, CANAL.maxZ + 3]) {
        // A cluster of crystal columns, as the Fifth's walls in the harbour, leaning on each other.
        const hgt = 10 + Math.abs(Math.sin(x * 0.13)) * 12;
        for (let k = 0; k < 3; k++) {
          const c = crystalGeometry(2.2 - k * 0.4, hgt * (1 - k * 0.22), { seed: k + Math.round(-x) });
          c.rotateZ((k - 1) * 0.12).rotateX(0.05 * (k - 1));
          c.translate(x + (k - 1) * 3, ICE - 0.5, z + (k % 2 ? 1.2 : -0.6));
          B.geo(k === 1 ? 'iceDeep' : 'ice', boxUv(c, 4));
        }
      }
    }
    for (const [x, roll] of [[-190, 0.12], [-330, -0.1]]) {
      const h = farHull(40, 10, 7);
      h.rotateX(roll).rotateY(0.04);
      h.translate(x, ICE + 1.2, (CANAL.minZ + CANAL.maxZ) / 2);
      B.geo('shipRust', h);
      B.box('shipWhite', 8, 5, 8, x + 14, ICE + 6.5, (CANAL.minZ + CANAL.maxZ) / 2, roll, 0.04, 0);
    }
  }
  flush(ctx, B.buckets, group, 'vista', { phys: 'ambient', shadow: false });
  return group;
}
