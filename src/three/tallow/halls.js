/**
 * halls.js — The plant's buildings round Tallow's benches, built into each host (`stations.js`).
 *
 * The layout of every building is `hall-plan.js`; this file only gives it form, in the host's own frame, as part
 * of the host's group, so the overlap rule treats the building and the machinery inside it as one object (as
 * Ligar's chambers are). Three constructions, as the plant would have built them:
 *
 *   clad    a portal frame of H columns and rafters, the walls profiled sheet on the outside of the columns,
 *           a concrete kerb at the foot, the roof sheet on purlins (the evaporator hall, the head house, the
 *           bagging shed)
 *   block   blockwork walls under a concrete slab with a parapet, glazed bands in steel frames (the control house)
 *   plinth  blockwork to 1.2 m, profiled sheet above on steel posts, a lean-to sheet roof (the tower base house)
 *
 * The walls are strips from `wallPieces()`, each a box whose top follows the roof, so a gable end is one wall and
 * never a stack of steps. The sheet's ribs are boxes on its outside face at a 0.3 m pitch: the profile is real
 * relief that the low sun rakes across, at a few thousand triangles a building. Every lamp is a pooled mark under
 * a caged luminaire (`tallow.js` `buildLuminaire`), hung on a rod from the steel over it.
 *
 * NOTHING HERE STANDS IN THE BAY. The rooms are at least 11.2 by 11 m with 5 m or more over the plate, and every
 * piece is on a wall or under the roof (`verify:bench` measures it).
 */

import * as THREE from 'three';
import { iBeamGeometry, corrugatedGeometry } from './kit.js';
import { wallPieces, wallLine, wallTop, openingsOf, roofAt, outerLocal } from './hall-plan.js';

const UP = new THREE.Vector3(0, 1, 0);
const RIB_PITCH = 0.3;
const KERB = 0.45;          // the concrete kerb a clad wall stands on
const PLINTH = 1.2;         // the blockwork under a plinth wall's sheet

/** A box from (a0..a1 along the wall, y0 up to ya / yb at its ends, thickness `th` about `off` from the wall line). */
function strip(w, line, { a0, a1, y0, ya, yb }, th, off, mat, uvScale = 0.5) {
  const len = a1 - a0;
  const geo = new THREE.BoxGeometry(len, 1, th);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), top = p.getY(i) > 0;
    const t = (x + len / 2) / len;
    p.setY(i, top ? ya + (yb - ya) * t : y0);
  }
  geo.computeVertexNormals();
  if (w.boxUVs) w.boxUVs(geo, uvScale);
  const mid = (a0 + a1) / 2;
  const m = new THREE.Mesh(w.own(geo), mat);
  if (line.axis === 'x') m.position.set(mid, 0, line.at + off);
  else { m.rotation.y = -Math.PI / 2; m.position.set(line.at + off, 0, mid); }
  m.castShadow = m.receiveShadow = w.t4;
  return m;
}

/** Split a strip at height `y`: the part below and the part above (either may be null). */
function splitAt(piece, y) {
  const lo = piece.y0 < y ? { ...piece, ya: Math.min(piece.ya, y), yb: Math.min(piece.yb, y) } : null;
  const hi = Math.min(piece.ya, piece.yb) > y ? { ...piece, y0: Math.max(piece.y0, y) } : null;
  return [lo, hi];
}

/** A member between two points, an I-section with its web vertical where it can be. */
function member(w, g, a, b, mat, dims) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = new THREE.Mesh(w.own(iBeamGeometry(len, dims)), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
  m.castShadow = w.t4;
  g.add(m);
  return m;
}

function rod(w, g, a, b, r, mat) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const m = new THREE.Mesh(w.own(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 6)), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
  g.add(m);
  return m;
}

function box(w, g, [sx, sy, sz], mat, [x, y, z], shadow = false) {
  const m = new THREE.Mesh(w.own(new THREE.BoxGeometry(sx, sy, sz)), mat);
  m.position.set(x, y, z);
  if (shadow) m.castShadow = m.receiveShadow = w.t4;
  g.add(m);
  return m;
}

/** A point on a wall line, `inset` into the room from the wall's inside face. */
function onWall(h, line, a, inset, y) {
  const d = line.at - line.out * (h.wall / 2 + inset);
  return line.axis === 'x' ? [a, y, d] : [d, y, a];
}

/** Where a wall's columns stand along it: the inside corners, each opening's jambs, and between at 5 m or less. */
function columnStations(h, wall, line) {
  const r = h.room;
  const lo = line.axis === 'x' ? r.x0 : r.z0, hi = line.axis === 'x' ? r.x1 : r.z1;
  const ops = openingsOf(h, wall).filter(o => o.kind !== 'window');
  const fixed = new Set([lo + 0.13, hi - 0.13]);
  for (const o of ops) { fixed.add(o.a - 0.14); fixed.add(o.b + 0.14); }
  const xs = [...fixed].filter(a => a >= lo && a <= hi && !ops.some(o => a > o.a && a < o.b)).sort((p, q) => p - q);
  const out = [];
  for (let i = 0; i < xs.length; i++) {
    out.push(xs[i]);
    if (i === xs.length - 1) break;
    const gap = xs[i + 1] - xs[i];
    if (ops.some(o => (xs[i] + xs[i + 1]) / 2 > o.a && (xs[i] + xs[i + 1]) / 2 < o.b)) continue;
    const n = Math.ceil(gap / 5.0);
    for (let k = 1; k < n; k++) out.push(xs[i] + gap * k / n);
  }
  return out;
}

/* ------------------------------------------------------------------ walls */

function buildWalls(w, g, h, M) {
  const pieces = wallPieces(h);
  const t = h.wall;
  for (const pc of pieces) {
    const line = wallLine(h, pc.wall);
    if (h.kind === 'block') {
      g.add(strip(w, line, pc, t, 0, M.concrete, 0.45));
      continue;
    }
    // Clad and plinth: masonry at the foot (a kerb or a plinth), the sheet over it on the outside face.
    const foot = h.kind === 'plinth' ? PLINTH : KERB;
    const [lo, hi] = splitAt(pc, foot);
    if (lo) g.add(strip(w, line, lo, t, 0, M.concrete, 0.45));
    if (hi) {
      const sheetOff = line.out * (t / 2 - 0.03);
      g.add(strip(w, line, hi, 0.05, sheetOff, M.sheet, 0.5));
      // The profile: a rib every 0.3 m on the outside, the height of the sheet at that point.
      const ribOff = line.out * (t / 2 + 0.012);
      for (let a = Math.ceil(hi.a0 / RIB_PITCH) * RIB_PITCH + 0.05; a < hi.a1 - 0.03; a += RIB_PITCH) {
        const tt = (a - hi.a0) / (hi.a1 - hi.a0);
        const top = hi.ya + (hi.yb - hi.ya) * tt - 0.01;
        if (top - hi.y0 < 0.1) continue;
        const rib = { a0: a - 0.03, a1: a + 0.03, y0: hi.y0, ya: top, yb: top };
        g.add(strip(w, line, rib, 0.035, ribOff, M.sheet, 0.5));
      }
    }
  }

  // Openings: a steel frame round each door and slot, dark glass in each window.
  for (const wall of ['left', 'right', 'back', 'front']) {
    if (!h.walls[wall]) continue;
    const line = wallLine(h, wall);
    for (const o of openingsOf(h, wall)) {
      const jamb = (a) => g.add(strip(w, line, { a0: a - 0.06, a1: a + 0.06, y0: o.y0, ya: o.y1, yb: o.y1 }, t + 0.06, 0, M.dark));
      if (o.kind === 'window') {
        g.add(strip(w, line, { a0: o.a, a1: o.b, y0: o.y0, ya: o.y1, yb: o.y1 }, 0.03, 0, M.glass));
        for (let a = o.a; a <= o.b + 1e-6; a += (o.b - o.a) / Math.max(1, Math.round((o.b - o.a) / 1.3))) {
          g.add(strip(w, line, { a0: a - 0.04, a1: a + 0.04, y0: o.y0, ya: o.y1, yb: o.y1 }, 0.1, 0, M.dark));
        }
        g.add(strip(w, line, { a0: o.a - 0.05, a1: o.b + 0.05, y0: o.y0 - 0.06, ya: o.y0, yb: o.y0 }, t + 0.08, 0, M.dark));
        continue;
      }
      jamb(o.a - 0.06);
      jamb(o.b + 0.06);
      const topAt = Math.min(wallTop(h, wall, o.a), wallTop(h, wall, o.b));
      if (o.y1 < topAt - 0.1) {
        g.add(strip(w, line, { a0: o.a - 0.12, a1: o.b + 0.12, y0: o.y1, ya: o.y1 + 0.14, yb: o.y1 + 0.14 }, t + 0.06, 0, M.dark));
      }
      if (o.kind === 'door' && h.kind !== 'block') {
        // The roller shutter, rolled up: its drum in a box over the opening, inside.
        const len = o.b - o.a + 0.3;
        const c = onWall(h, line, (o.a + o.b) / 2, 0.22, o.y1 + 0.32);
        const b = box(w, g, line.axis === 'x' ? [len, 0.5, 0.36] : [0.36, 0.5, len], M.sheet, c, true);
        b.name = 'shutter-box';
      }
    }
  }
}

/* ------------------------------------------------------------------ frame and roof */

function buildFrame(w, g, h, M) {
  if (h.kind === 'block') return;
  const dims = h.kind === 'plinth' ? { h: 0.2, w: 0.14 } : { h: 0.3, w: 0.18 };
  for (const wall of ['left', 'right', 'back', 'front']) {
    if (!h.walls[wall]) continue;
    const line = wallLine(h, wall);
    const lo = line.axis === 'x' ? h.room.x0 : h.room.z0, hi = line.axis === 'x' ? h.room.x1 : h.room.z1;
    for (const a of columnStations(h, wall, line)) {
      // The corner columns are the back and front walls'; the side walls start a bay in.
      if (line.axis === 'z' && (a < lo + 0.5 || a > hi - 0.5)) continue;
      const top = wallTop(h, wall, a) - 0.02;
      const base = onWall(h, line, a, dims.h / 2 + 0.02, 0);
      const foot = 0.02;
      member(w, g, [base[0], foot, base[2]], [base[0], top, base[2]], M.dark, dims);
      box(w, g, [0.36, 0.04, 0.36], M.dark, [base[0], foot + 0.02, base[2]]);
    }
  }
}

/** A roof plane from `p0` (one edge's middle) to `p1` (the other's), `width` across, the sheet's ribs down the slope. */
function roofSheet(w, g, p0, p1, width, M, overhang = 0.3) {
  const v0 = new THREE.Vector3(...p0), v1 = new THREE.Vector3(...p1);
  const down = v1.clone().sub(v0);
  const len = down.length() + overhang;
  down.normalize();
  const across = new THREE.Vector3().crossVectors(UP, down).normalize();
  const n = new THREE.Vector3().crossVectors(down, across).normalize();
  const geo = w.own(corrugatedGeometry(width + overhang * 2, len, { pitch: 0.2, amp: 0.018, thick: 0.006 }));
  const m = new THREE.Mesh(geo, M.sheet);
  const basis = new THREE.Matrix4().makeBasis(across, n, down);
  m.quaternion.setFromRotationMatrix(basis);
  m.position.copy(v0).addScaledVector(down, (len - overhang) / 2 + overhang / 2).addScaledVector(n, 0.03);
  m.castShadow = m.receiveShadow = w.t4;
  g.add(m);
  return m;
}

function buildRoof(w, g, h, M) {
  const r = h.room, o = outerLocal(h);
  const { type, low, high } = h.roof;
  if (type === 'flat') {
    // The slab over the outside of the walls, and its parapet.
    const sx = o.x1 - o.x0 + 0.2, sz = o.z1 - o.z0 + 0.2, cx = (o.x0 + o.x1) / 2, cz = (o.z0 + o.z1) / 2;
    const slab = new THREE.Mesh(w.own(w.boxUVs(new THREE.BoxGeometry(sx, 0.3, sz), 0.45)), M.concrete);
    slab.position.set(cx, low + 0.15, cz);
    slab.castShadow = slab.receiveShadow = w.t4;
    g.add(slab);
    for (const [px, pz, lx, lz] of [[cx, o.z0 - 0.03, sx, 0.14], [cx, o.z1 + 0.03, sx, 0.14], [o.x0 - 0.03, cz, 0.14, sz], [o.x1 + 0.03, cz, 0.14, sz]]) {
      const p = new THREE.Mesh(w.own(w.boxUVs(new THREE.BoxGeometry(lx, 0.36, lz), 0.45)), M.concrete);
      p.position.set(px, low + 0.48, pz);
      g.add(p);
    }
    return;
  }
  const rafter = { h: 0.26, w: 0.14 };
  const purlin = { h: 0.16, w: 0.08 };
  const xm = (r.x0 + r.x1) / 2, zm = (r.z0 + r.z1) / 2;
  // The slope as a list of planes: [from edge middle, to edge middle, width across] at the roof's underside.
  const planes = [];
  if (type === 'gable-z') {
    const k = (high - low) / ((r.x1 - r.x0) / 2);
    for (const xe of [o.x0, o.x1]) planes.push([[xm, high, zm], [xe, high - k * Math.abs(xe - xm), zm], o.z1 - o.z0]);
  } else if (type === 'gable-x') {
    const k = (high - low) / ((r.z1 - r.z0) / 2);
    for (const ze of [o.z0, o.z1]) planes.push([[xm, high, zm], [xm, high - k * Math.abs(ze - zm), ze], o.x1 - o.x0]);
  } else if (type === 'mono-z') {
    const k = (low - high) / (r.z1 - r.z0);
    planes.push([[xm, high + k * (o.z0 - r.z0), o.z0], [xm, high + k * (o.z1 - r.z0), o.z1], o.x1 - o.x0]);
  } else if (type === 'mono-x') {
    const k = (high - low) / (r.x1 - r.x0);
    planes.push([[o.x1, low + k * (o.x1 - r.x0), zm], [o.x0, low + k * (o.x0 - r.x0), zm], o.z1 - o.z0]);
  }
  for (const [p0, p1, width] of planes) roofSheet(w, g, p0, p1, width, M);

  // Rafters over each pair of opposite columns, and purlins along the slope's length.
  if (type === 'gable-z' || type === 'mono-x') {
    const zs = [];
    for (let z = r.z0 + 0.13; z <= r.z1 - 0.12; z += (r.z1 - r.z0 - 0.26) / Math.max(1, Math.ceil((r.z1 - r.z0) / 5))) zs.push(z);
    for (const z of zs) {
      if (type === 'gable-z') {
        member(w, g, [r.x0 + 0.1, roofAt(h, r.x0, z) - rafter.h / 2, z], [xm, high - rafter.h / 2, z], M.dark, rafter);
        member(w, g, [xm, high - rafter.h / 2, z], [r.x1 - 0.1, roofAt(h, r.x1, z) - rafter.h / 2, z], M.dark, rafter);
      } else {
        member(w, g, [r.x0 + 0.1, roofAt(h, r.x0, z) - rafter.h / 2, z], [r.x1 - 0.1, roofAt(h, r.x1, z) - rafter.h / 2, z], M.dark, rafter);
      }
    }
    for (let x = r.x0 + 0.6; x < r.x1 - 0.3; x += 1.6) {
      const y = roofAt(h, x, zm) - 0.09;
      member(w, g, [x, y, r.z0 + 0.05], [x, y, r.z1 - 0.05], M.dark, purlin);
    }
  } else {
    const xs = [];
    for (let x = r.x0 + 0.13; x <= r.x1 - 0.12; x += (r.x1 - r.x0 - 0.26) / Math.max(1, Math.ceil((r.x1 - r.x0) / 5))) xs.push(x);
    for (const x of xs) {
      if (type === 'gable-x') {
        member(w, g, [x, roofAt(h, x, r.z0) - rafter.h / 2, r.z0 + 0.1], [x, high - rafter.h / 2, zm], M.dark, rafter);
        member(w, g, [x, high - rafter.h / 2, zm], [x, roofAt(h, x, r.z1) - rafter.h / 2, r.z1 - 0.1], M.dark, rafter);
      } else {
        member(w, g, [x, roofAt(h, x, r.z0) - rafter.h / 2, r.z0 + 0.1], [x, roofAt(h, x, r.z1) - rafter.h / 2, r.z1 - 0.1], M.dark, rafter);
      }
    }
    for (let z = r.z0 + 0.6; z < r.z1 - 0.3; z += 1.6) {
      const y = roofAt(h, xm, z) - 0.09;
      member(w, g, [r.x0 + 0.05, y, z], [r.x1 - 0.05, y, z], M.dark, purlin);
    }
  }
  // The ridge cap over a gable.
  if (type === 'gable-z') box(w, g, [0.3, 0.06, o.z1 - o.z0 + 0.6], M.dark, [xm, high + 0.08, zm]);
  if (type === 'gable-x') box(w, g, [o.x1 - o.x0 + 0.6, 0.06, 0.3], M.dark, [xm, high + 0.08, zm]);
}

/* ------------------------------------------------------------------ the floor and the lamps */

function buildFloor(w, g, h, M) {
  const o = outerLocal(h);
  const geo = w.own(w.boxUVs(new THREE.BoxGeometry(o.x1 - o.x0, 0.3, o.z1 - o.z0), 0.45));
  const slab = new THREE.Mesh(geo, M.floor);
  slab.position.set((o.x0 + o.x1) / 2, -0.15, (o.z0 + o.z1) / 2);
  slab.receiveShadow = w.t4;
  slab.name = 'hall-floor';
  // The floor everything inside stands on and is bedded into, like the pan.
  slab.userData.phys = 'ground';
  slab.userData.noSalt = true;
  g.add(slab);
}

function buildLamps(w, g, h, M) {
  for (const [x, y, z] of h.lamps) {
    g.add(w.buildLuminaire(x, y, z));
    const top = h.roof.type === 'flat' ? h.roof.low : roofAt(h, x, z) - 0.1;
    rod(w, g, [x, y + 0.08, z], [x, top, z], 0.012, M.dark);
  }
}

/** Build hall `h` into host group `g`. */
export function buildHall(w, h, g) {
  const M = {
    sheet: w.plateMat,
    dark: w.darkSteelMat,
    concrete: w.concreteMaterial(),
    floor: w.hallFloorMat || (w.hallFloorMat = w.own(new THREE.MeshStandardMaterial({ color: 0x8a8173, roughness: 0.95, metalness: 0.0 }))),
    glass: w.glassMat
  };
  const hall = new THREE.Group();
  hall.name = h.id;
  buildFloor(w, hall, h, M);
  buildWalls(w, hall, h, M);
  buildFrame(w, hall, h, M);
  buildRoof(w, hall, h, M);
  buildLamps(w, hall, h, M);
  g.add(hall);
  return hall;
}
