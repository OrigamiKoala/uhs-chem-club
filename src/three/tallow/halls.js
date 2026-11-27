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

/* ------------------------------------------------------------------ trim: flashings, gutters, downpipes */

/**
 * A box on a wall line: centred `a` along it, `d` out from the wall's centre line, `y` up; sized `[along, up, out]`.
 * No rotation, so the box's faces stay square to the wall either way the wall runs.
 */
function onLine(w, g, line, [sa, sy, so], mat, a, d, y, shadow = true) {
  const size = line.axis === 'x' ? [sa, sy, so] : [so, sy, sa];
  const p = line.axis === 'x' ? [a, y, line.at + line.out * d] : [line.at + line.out * d, y, a];
  return box(w, g, size, mat, p, shadow);
}

/** A vertical pipe on a wall line from `y0` to `y1`, `d` out from the wall's centre line. */
function pipeOnLine(w, g, line, a, d, y0, y1, r, mat) {
  const p = line.axis === 'x' ? [a, (y0 + y1) / 2, line.at + line.out * d] : [line.at + line.out * d, (y0 + y1) / 2, a];
  const m = new THREE.Mesh(w.own(new THREE.CylinderGeometry(r, r, y1 - y0, 8, 1, true)), mat);
  m.position.set(...p);
  m.castShadow = m.receiveShadow = w.t4;
  g.add(m);
  return m;
}

/** The wall the roof drains onto (an eaves wall: level top, the roof falling toward it), with the roof's fall. */
function eavesWalls(h) {
  const { type, low, high } = h.roof, r = h.room;
  switch (type) {
    case 'gable-z': return [['left', (high - low) / ((r.x1 - r.x0) / 2)], ['right', (high - low) / ((r.x1 - r.x0) / 2)]];
    case 'gable-x': return [['back', (high - low) / ((r.z1 - r.z0) / 2)], ['front', (high - low) / ((r.z1 - r.z0) / 2)]];
    case 'mono-z': return [['front', (high - low) / (r.z1 - r.z0)]];
    case 'mono-x': return [['left', (high - low) / (r.x1 - r.x0)]];
    default: return [];
  }
}

/**
 * What a real sheet building has at its edges and a box does not: an angle flashing down every corner (so the
 * corner is two lapped legs, not one knife edge), a drip flashing where the sheet stops on the masonry, and along
 * each eaves a gutter with a downpipe at either end running into a shoe at the foot.
 */
function buildTrim(w, g, h, M) {
  if (h.kind === 'block') return;
  const t = h.wall;
  const foot = h.kind === 'plinth' ? PLINTH : KERB;
  const ribOut = t / 2 + 0.03;                 // the outside of the sheet's ribs, from the wall's centre line
  for (const wall of ['left', 'right', 'back', 'front']) {
    if (!h.walls[wall]) continue;
    const line = wallLine(h, wall);
    const perp = line.axis === 'x' ? ['left', 'right'] : ['back', 'front'];
    // Corner flashings: one leg of each corner's L on this wall.
    for (const [a, s, other] of [[line.a0, 1, perp[0]], [line.a1, -1, perp[1]]]) {
      if (!h.walls[other]) continue;
      const top = wallTop(h, wall, a) - 0.02;
      if (top - foot < 0.2) continue;
      onLine(w, g, line, [0.17, top - foot, 0.012], M.sheet, a + s * 0.035, ribOut + 0.01, (foot + top) / 2);
    }
    // The drip flashing along the foot of the sheet, under every stretch of sheet that stands on the masonry.
    for (const pc of wallPieces(h).filter(q => q.wall === wall)) {
      if (pc.y0 > foot + 1e-3 || Math.min(pc.ya, pc.yb) < foot + 0.2) continue;
      onLine(w, g, line, [pc.a1 - pc.a0, 0.05, 0.05], M.sheet, (pc.a0 + pc.a1) / 2, t / 2 + 0.025, foot + 0.025, false);
    }
  }
  // Gutters and downpipes along each eaves.
  for (const [wall, fall] of eavesWalls(h)) {
    if (!h.walls[wall]) continue;
    const line = wallLine(h, wall);
    const mid = (line.a0 + line.a1) / 2;
    const top = wallTop(h, wall, mid);
    // The roof sheet passes over the gutter: keep the gutter's lip under it where the gutter's outer edge is.
    const out = ribOut + 0.17;
    const sheetY = top - fall * (t + (out - t / 2)) + 0.03;
    const gTop = sheetY - 0.05, gH = 0.12;
    const len = line.a1 - line.a0 + 0.2;
    onLine(w, g, line, [len, gH, 0.14], M.dark, mid, ribOut + 0.09, gTop - gH / 2);
    const ops = openingsOf(h, wall).filter(o => o.kind !== 'window');
    for (const a of [line.a0 + 0.4, line.a1 - 0.4]) {
      if (ops.some(o => a > o.a - 0.3 && a < o.b + 0.3)) continue;
      pipeOnLine(w, g, line, a, ribOut + 0.07, 0.22, gTop - gH, 0.05, M.dark);
      // Brackets at about two-metre centres, and the shoe throwing the water clear of the foot.
      for (let y = 1.4; y < gTop - gH - 0.3; y += 2.1) onLine(w, g, line, [0.03, 0.05, 0.1], M.dark, a, ribOut + 0.045, y, false);
      onLine(w, g, line, [0.11, 0.1, 0.22], M.dark, a, ribOut + 0.12, 0.17);
    }
  }
}

/* ------------------------------------------------------------------ the foot: salt drifted against the walls */

/**
 * SALT DRIFTED AGAINST EVERY WALL, built once the host stands where it stands (it reads the real ground under it).
 * Wind-blown crystal banks where a wall stops it: a low wedge against the masonry, deeper and wider on the windward
 * faces, thinning to nothing at doorways and belt slots and at the wall's ends. It stays under 0.3 m, below
 * anything the walk measures, and it is how a building stops looking set down on the pan.
 *
 * @param {(x: number, z: number) => number} groundAt the pan's height in the world's frame
 * @param {(x: number, z: number) => boolean} avoid true where something else stands (a neighbouring room of the
 *   same shed, another host's machinery): the drift thins to nothing there rather than run under it
 */
export function buildHallFoot(w, h, g, mat, groundAt, avoid = () => false) {
  if (!mat) return null;
  g.updateMatrixWorld(true);
  const c = Math.cos(g.rotation.y), sn = Math.sin(g.rotation.y);
  const toWorld = (lx, lz) => [g.position.x + lx * c + lz * sn, g.position.z - lx * sn + lz * c];
  const groundLocal = (lx, lz) => { const [x, z] = toWorld(lx, lz); return groundAt(x, z) - g.position.y; };
  // The prevailing wind is from the west on Tallow (the dunes' lee is the east, `vista.js`).
  const WIND = new THREE.Vector2(-1, 0.25).normalize();
  const t = h.wall;
  const pos = [], uv = [], idx = [];
  const hash = (k) => { const x = Math.sin(k * 127.1 + h.id.length * 311.7) * 43758.5453; return x - Math.floor(x); };
  const smoothN = (a, seed) => {
    const i = Math.floor(a), f = a - i, u = f * f * (3 - 2 * f);
    return hash(i + seed) * (1 - u) + hash(i + 1 + seed) * u;
  };
  let seed = 0;
  for (const wall of ['left', 'right', 'back', 'front']) {
    if (!h.walls[wall]) continue;
    seed += 37;
    const line = wallLine(h, wall);
    // Which way this face looks, in the world: the windward faces hold the deepest drift.
    const nl = line.axis === 'x' ? [0, line.out] : [line.out, 0];
    const nw = new THREE.Vector2(nl[0] * c + nl[1] * sn, -nl[0] * sn + nl[1] * c);
    const lee = 0.45 + 0.75 * Math.max(0, nw.dot(WIND));
    // Every opening (a door, and a belt's slot whose machinery runs down to the floor) and every stretch where
    // something else stands against the wall.
    const gaps = openingsOf(h, wall).filter(o => o.kind !== 'window').map(o => [o.a - 0.35, o.b + 0.35]);
    const a0 = line.a0 - 0.1, a1 = line.a1 + 0.1;
    const n = Math.max(2, Math.ceil((a1 - a0) / 0.4));
    const at = (a, d) => toWorld(line.axis === 'x' ? a : line.at + line.out * d, line.axis === 'x' ? line.at + line.out * d : a);
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * i / n;
      if ([0.05, 0.3, 0.6].some(e => avoid(...at(a, t / 2 + e)))) gaps.push([a - 0.25, a + 0.25]);
    }
    const rowStart = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * i / n;
      // Fade to nothing at the ends and across every gap.
      let fade = Math.min(1, (a - a0) / 0.8, (a1 - a) / 0.8);
      for (const [q0, q1] of gaps) {
        if (a > q0 && a < q1) fade = 0;
        else fade = Math.min(fade, Math.max(0, Math.min(Math.abs(a - q0), Math.abs(a - q1)) / 0.6));
      }
      fade = Math.max(0, fade);
      const H = (0.05 + 0.2 * smoothN(a / 1.7, seed) * (0.6 + 0.4 * smoothN(a / 0.45, seed + 9))) * lee * fade;
      // Never more than half a metre out: a host stays within 0.6 m of its building (verify-tallow).
      const W = Math.min(0.5, (0.3 + 0.3 * smoothN(a / 2.3, seed + 3)) * (0.7 + 0.5 * lee));
      const prof = [[t / 2 - 0.03, 1.0], [t / 2 + 0.12 * W / 0.6, 0.8], [t / 2 + 0.35 * W / 0.6, 0.38], [t / 2 + W, 0.0]];
      for (let k = 0; k < prof.length; k++) {
        const [d, f] = prof[k];
        const lx = line.axis === 'x' ? a : line.at + line.out * d;
        const lz = line.axis === 'x' ? line.at + line.out * d : a;
        const base = groundLocal(lx, lz);
        // Where it has faded out it lies a hand under the crust, out of sight and out of anything's way.
        const y = base + H * f - (k === prof.length - 1 || fade === 0 ? 0.1 : 0.01);
        pos.push(lx, y, lz);
        uv.push(a / 2, d / 2);
      }
    }
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 3; k++) {
        const p = rowStart + i * 4 + k, q = p + 4;
        // Wind the quads so their faces look out of the wall and up, whichever way the wall runs.
        const flip = (line.axis === 'x') === (line.out > 0);
        if (flip) idx.push(p, p + 1, q, p + 1, q + 1, q);
        else idx.push(p, q, p + 1, p + 1, q, q + 1);
      }
    }
  }
  if (!idx.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(w.own(geo), mat);
  m.name = 'hall-drift';
  // The pan's own surface banked up: ground, like the slab and the crust (overlap.mjs exempts it as such).
  m.userData.phys = 'ground';
  m.receiveShadow = w.t4;
  g.add(m);
  return m;
}

/** Build hall `h` into host group `g`. */
export function buildHall(w, h, g) {
  const M = {
    sheet: w.sheetMat || w.plateMat,
    dark: w.darkSteelMat,
    concrete: w.concreteMaterial(),
    floor: w.hallFloorMaterial ? w.hallFloorMaterial() : (w.hallFloorMat || (w.hallFloorMat = w.own(new THREE.MeshStandardMaterial({ color: 0x8a8173, roughness: 0.95, metalness: 0.0 })))),
    glass: w.glassMat
  };
  const hall = new THREE.Group();
  hall.name = h.id;
  buildFloor(w, hall, h, M);
  buildWalls(w, hall, h, M);
  buildFrame(w, hall, h, M);
  buildRoof(w, hall, h, M);
  buildTrim(w, hall, h, M);
  buildLamps(w, hall, h, M);
  g.add(hall);
  return hall;
}
