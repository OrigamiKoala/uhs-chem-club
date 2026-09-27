/**
 * ship/hull.js — The structure: deck, deckheads, plating, bulkheads, the nose
 * and its canopy, and every collider that is architecture rather than
 * furniture.
 *
 * THE STRUCTURE IS ONE OBJECT. Deck, deckheads, side plating, blast wall,
 * every interior bulkhead, every door portal and every panel of lining are
 * welded into a single group, and their joints are supposed to
 * interpenetrate — a portal that merely touched the plate it is set into
 * would be holding nothing. Building them into one group says so, which lets
 * the physics check stay strict about everything that is genuinely a
 * separate object standing in the ship.
 *
 * The COLLIDERS are drawn segment by segment: a wall with a doorway in it
 * contributes two boxes and a gap, so the gap is walkable for the same reason
 * it is see-through. The bridge's raked shoulders and nose are stepped boxes
 * that fill everything outside `BRIDGE_OUTLINE` out to the plating, so there
 * is no deck behind the glass for a body to stand on.
 */

import * as THREE from "three";
import { boltLine } from "../materials/pbr-kit.js";
import {
  HULL, ROOMS, WALLS, CEIL, WALL_T, DOOR_H, BRIDGE_OUTLINE, CANOPY,
  HULL_WINDOWS, SHOULDER_PORTS, FLOOR_HATCH, AIRLOCK_HATCH, wallSegments, outlineSpan
} from "../ship-rooms.js";
import { DRESS, box, cyl, extrude, slotPath, chamferedRect, chamferedHole } from "./kit.js";

/** The corridor's lit service channel, recessed into the deck. */
export const DECK_CHANNEL = { minX: -0.28, maxX: 0.28, minZ: -7.8 + WALL_T / 2, maxZ: 0.5 - WALL_T / 2 };

/** A box spanning world bounds. */
function span(parent, mat, x0, x1, y0, y1, z0, z1) {
  return box(parent, mat, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}

/** Rectangle `rect` minus non-overlapping `holes`, as grid cells. */
function cellsWithout(rect, holes) {
  const xs = [rect.minX, rect.maxX], zs = [rect.minZ, rect.maxZ];
  for (const h of holes) { xs.push(h.minX, h.maxX); zs.push(h.minZ, h.maxZ); }
  const X = [...new Set(xs)].filter(v => v >= rect.minX && v <= rect.maxX).sort((a, b) => a - b);
  const Z = [...new Set(zs)].filter(v => v >= rect.minZ && v <= rect.maxZ).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < X.length - 1; i++) {
    for (let j = 0; j < Z.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
      if (holes.some(h => cx > h.minX && cx < h.maxX && cz > h.minZ && cz < h.maxZ)) continue;
      out.push({ minX: X[i], maxX: X[i + 1], minZ: Z[j], maxZ: Z[j + 1] });
    }
  }
  return out;
}

/**
 * A straight run of plating from world point `a` to `b` (x, z), `height`
 * tall, `thick` thick, extruded OUTWARD (away from `inward`), with `holes`
 * given as { u, y, w, h, round } in the run's own coordinates.
 */
function plating(parent, mat, a, b, inward, height, thick, holes = []) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(L, 0); shape.lineTo(L, height); shape.lineTo(0, height); shape.lineTo(0, 0);
  for (const h of holes) {
    if (h.chamfer) {
      shape.holes.push(chamferedHole(h.w, h.h, h.chamfer, ['tl', 'tr', 'bl', 'br'], h.u, h.y));
    } else if (h.round) {
      const p = new THREE.Path();
      p.absarc(h.u, h.y, h.w / 2, 0, Math.PI * 2, true);
      shape.holes.push(p);
    } else {
      shape.holes.push(slotPath(h.w, h.h, h.u, h.y));
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 20 });
  const m = new THREE.Mesh(g, mat);
  // Local x along a→b, y up, local +z = extrusion direction = outward.
  const theta = Math.atan2(-dz, dx);
  m.rotation.y = theta;
  const ez = [Math.sin(theta), Math.cos(theta)];
  // Make sure the extrusion goes AWAY from the room.
  if (ez[0] * inward[0] + ez[1] * inward[1] > 0) {
    // Flip: build from b to a instead so +z points outward.
    parent.remove(m);
    return plating(parent, mat, b, a, inward, height, thick,
      holes.map(h => ({ ...h, u: L - h.u })));
  }
  m.position.set(a[0], 0, a[1]);
  parent.add(m);
  return m;
}

/** A pane of glass, and the thin frame lip it sits in, across a hole. */
function glassIn(parent, M, center, normal, w, h, round) {
  const g = new THREE.Group();
  g.position.set(center[0], center[1], center[2]);
  g.rotation.y = Math.atan2(normal[0], normal[1]);
  const pane = new THREE.Mesh(round ? new THREE.CircleGeometry(w / 2, 32) : new THREE.PlaneGeometry(w - h, h), M.glassMat);
  g.add(pane);
  if (!round) {
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(h / 2, 16, s > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), M.glassMat);
      cap.position.x = s * (w - h) / 2;
      g.add(cap);
    }
  }
  parent.add(g);
  return g;
}

/**
 * The canopy's geometry, derived from the outline: the sill polyline (the
 * five facets, port to starboard), the head polyline (each facet pushed aft
 * by the rake, mitred at the joints), and each pane's inward normal.
 */
export function canopyGeometry() {
  const chain = [CANOPY.facets[0][0], ...CANOPY.facets.map(f => f[1])].map(i => BRIDGE_OUTLINE[i]);
  const normals = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const [ax, az] = chain[i], [bx, bz] = chain[i + 1];
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
    let n = [-dz / L, dx / L];
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    if ((0 - mx) * n[0] + (3.5 - mz) * n[1] < 0) n = [-n[0], -n[1]];
    normals.push(n);
  }
  const r = CANOPY.rake;
  const off = (p, n) => [p[0] + n[0] * r, p[1] + n[1] * r];
  const head = [];
  head.push(off(chain[0], normals[0]));
  for (let i = 1; i < chain.length - 1; i++) {
    // Intersect the two offset lines meeting at chain[i].
    const n0 = normals[i - 1], n1 = normals[i];
    const p0 = off(chain[i], n0), p1 = off(chain[i], n1);
    const d0 = [chain[i][0] - chain[i - 1][0], chain[i][1] - chain[i - 1][1]];
    const d1 = [chain[i + 1][0] - chain[i][0], chain[i + 1][1] - chain[i][1]];
    const den = d0[0] * d1[1] - d0[1] * d1[0];
    const t = ((p1[0] - p0[0]) * d1[1] - (p1[1] - p0[1]) * d1[0]) / den;
    head.push([p0[0] + d0[0] * t, p0[1] + d0[1] * t]);
  }
  head.push(off(chain[chain.length - 1], normals[normals.length - 1]));
  return { sill: chain, head, normals };
}

/**
 * A beam from point p to q (world 3D). `w` is its width across the beam,
 * held horizontal; `d` its depth, square to both.
 */
export function beam(parent, mat, p, q, w, d) {
  const a = new THREE.Vector3(...p), b = new THREE.Vector3(...q);
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, d), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  const yAx = b.clone().sub(a).normalize();
  let xAx = new THREE.Vector3(0, 1, 0).cross(yAx);
  if (xAx.lengthSq() < 1e-6) xAx.set(1, 0, 0);
  xAx.normalize();
  const zAx = new THREE.Vector3().crossVectors(xAx, yAx).normalize();
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, yAx, zAx));
  parent.add(m);
  return m;
}

export function buildHull(ship) {
  const M = ship;
  const hull = ship.hull;
  const add = (x0, x1, z0, z1) => ship.addCollider(x0, x1, z0, z1);
  const P = HULL.plate;
  const X0 = HULL.minX - P, X1 = HULL.maxX + P, Z0 = HULL.minZ - P, Z1 = HULL.maxZ + P;

  /* ---------------------------------------------------------------- DECK */
  // Top at y −0.02, under the lining's tiles. Recessed under the corridor's
  // lit channel, and open over the ladderwell's hatch.
  const deckRect = { minX: X0, maxX: X1, minZ: Z0, maxZ: Z1 };
  for (const c of cellsWithout(deckRect, [DECK_CHANNEL, FLOOR_HATCH])) {
    const m = span(hull, M.floorMat, c.minX, c.maxX, -0.42, -0.02, c.minZ, c.maxZ);
    m.receiveShadow = true;
  }
  span(hull, M.ventMat, DECK_CHANNEL.minX, DECK_CHANNEL.maxX, -0.6, -0.2, DECK_CHANNEL.minZ, DECK_CHANNEL.maxZ);

  /* ------------------------------------------------------------ DECKHEADS */
  span(hull, M.ceilingMat, X0, X1, CEIL.room, CEIL.room + 0.3, -7.8, 0.5);
  span(hull, M.ceilingMat, X0, X1, CEIL.bridge, CEIL.bridge + 0.3, 0.5, Z1);
  span(hull, M.ceilingMat, X0, X1, CEIL.furnace, CEIL.furnace + 0.3, Z0, -7.8);

  /* -------------------------------------------------------- SIDE PLATING */
  const plateH = CEIL.furnace + 0.3;
  for (const side of [-1, 1]) {
    const x = side * HULL.maxX;
    const holes = HULL_WINDOWS.filter(w => w.side === side).map(w => ({
      u: w.z - HULL.minZ + P, y: w.y, w: w.r ? w.r * 2 : w.w, h: w.r ? w.r * 2 : w.h, round: Boolean(w.r)
    }));
    // The airlock's outer hatch is a real hole: the leaf that closes it
    // swings open when the ship is down, and the player walks out through it.
    if (AIRLOCK_HATCH.side === side) {
      const a = AIRLOCK_HATCH;
      holes.push({ u: a.z - HULL.minZ + P, y: a.y, w: a.w, h: a.h, chamfer: a.c });
    }
    plating(hull, M.durasteelMat, [x, HULL.minZ - P], [x, 3.2], [-side, 0], plateH, P,
      holes.map(h => ({ ...h })));
    for (const w of HULL_WINDOWS.filter(v => v.side === side)) {
      glassIn(hull, M, [x + side * P * 0.5, w.y, w.z], [side, 0], w.r ? w.r * 2 : w.w, w.r ? w.r * 2 : w.h, Boolean(w.r));
    }
    add(side < 0 ? X0 : HULL.maxX - HULL.frame, side < 0 ? HULL.minX + HULL.frame : X1, Z0, Z1);
  }

  // Aft blast wall, closing the stern behind the engine room.
  span(hull, M.durasteelMat, X0, X1, 0, plateH, Z0, HULL.minZ);
  add(X0, X1, Z0, HULL.minZ + HULL.frame);

  /* ------------------------------------------------ SHOULDERS AND NOSE */
  const bridgeTop = CEIL.bridge + 0.3;
  for (const sx of [-1, 1]) {
    const a = [sx * 5.6, 3.2], b = [sx * 2.6, 5.2];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ports = SHOULDER_PORTS.map(p => ({ u: p.t * L, y: p.y, w: p.w, h: p.h, round: false }));
    // Inward normal of the shoulder.
    const inward = [-sx * 2 / L, -3 / L];
    plating(hull, M.durasteelMat, a, b, inward, bridgeTop, 0.4, ports);
    for (const p of SHOULDER_PORTS) {
      const cx = a[0] + (b[0] - a[0]) * p.t, cz = a[1] + (b[1] - a[1]) * p.t;
      glassIn(hull, M, [cx - inward[0] * 0.2, p.y, cz - inward[1] * 0.2], [-inward[0], -inward[1]], p.w, p.h, false);
    }
  }

  // The canopy: coaming under the glass, raked panes, mullions, the head
  // beam and the nose's lowered deckhead.
  const cg = canopyGeometry();
  const sill = CANOPY.sill, top = CANOPY.top;
  const canopy = new THREE.Group();
  canopy.name = 'canopy';
  hull.add(canopy);

  for (let i = 0; i < cg.sill.length - 1; i++) {
    const a = cg.sill[i], b = cg.sill[i + 1], n = cg.normals[i];
    // Coaming: solid plate from the deck to the sill, and a flat ledge on it.
    plating(canopy, M.durasteelMat, a, b, n, sill, 0.35);
    const ledgeA = [a[0] + n[0] * 0.14, sill + 0.02, a[1] + n[1] * 0.14];
    const ledgeB = [b[0] + n[0] * 0.14, sill + 0.02, b[1] + n[1] * 0.14];
    beam(canopy, M.ribMat, ledgeA, ledgeB, 0.3, 0.05, 0);

    // The pane.
    const ha = cg.head[i], hb = cg.head[i + 1];
    const geo = new THREE.BufferGeometry();
    const v = new Float32Array([
      a[0], sill, a[1], b[0], sill, b[1], hb[0], top, hb[1],
      a[0], sill, a[1], hb[0], top, hb[1], ha[0], top, ha[1]
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(12), 2));
    geo.computeVertexNormals();
    const pane = new THREE.Mesh(geo, M.glassMat);
    canopy.add(pane);

    // Transom across the pane at a little under half height.
    const t = 0.42;
    const pa = [a[0] + (ha[0] - a[0]) * t, sill + (top - sill) * t, a[1] + (ha[1] - a[1]) * t];
    const pb = [b[0] + (hb[0] - b[0]) * t, sill + (top - sill) * t, b[1] + (hb[1] - b[1]) * t];
    beam(canopy, M.trimMat, pa, pb, 0.07, 0.09);
    // Head beam along the top of the glass.
    beam(canopy, M.ribMat, [ha[0], top + 0.03, ha[1]], [hb[0], top + 0.03, hb[1]], 0.18, 0.14);
  }
  // Mullions at every joint: heavy, riveted, following the rake.
  for (let j = 0; j < cg.sill.length; j++) {
    const s = cg.sill[j], h = cg.head[j];
    beam(canopy, M.ribMat, [s[0], sill - 0.05, s[1]], [h[0], top + 0.05, h[1]], 0.16, 0.2);
  }
  // Cheeks closing the ends of the raked glass against the shoulders.
  for (const end of [0, cg.sill.length - 1]) {
    const s = cg.sill[end], h = cg.head[end];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      s[0], sill, s[1], s[0], top, s[1], h[0], top, h[1]
    ]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1]), 2));
    geo.computeVertexNormals();
    canopy.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2c2d30, roughness: 0.7, metalness: 0.5, side: THREE.DoubleSide })));
    beam(canopy, M.ribMat, [s[0], sill, s[1]], [s[0], top + 0.2, s[1]], 0.18, 0.18);
  }

  // The nose's deckhead: lower than the bridge's, following the head of the
  // glass, with a fascia where it steps up to the bridge deckhead.
  const aftZ = 4.3;
  const sL = outlineSpan(BRIDGE_OUTLINE, aftZ);
  const pts = [[sL[0], aftZ], cg.sill[0], ...cg.head, cg.sill[cg.sill.length - 1], [sL[1], aftZ]];
  const noseShape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const noseGeo = new THREE.ExtrudeGeometry(noseShape, { depth: 0.1, bevelEnabled: false });
  const noseCeil = new THREE.Mesh(noseGeo, M.ceilingMat);
  noseCeil.rotation.x = -Math.PI / 2;
  noseCeil.position.y = top + 0.1;
  canopy.add(noseCeil);
  span(canopy, M.panelDarkMat, sL[0], sL[1], top + 0.1, CEIL.bridge, aftZ - 0.06, aftZ);
  span(canopy, M.gunmetalMat, sL[0], sL[1], top + 0.06, top + 0.14, aftZ - 0.1, aftZ + 0.02);
  // Overhead: a lit strip over the pilots and a spine of cable along it.
  box(canopy, M.gunmetalMat, 0.34, 0.06, 1.2, 0, top + 0.07, 5.0);
  box(canopy, M.troughMat, 0.2, 0.005, 1.1, 0, top + 0.038, 5.0);

  /* ------------------------------------------------ BRIDGE OUTLINE COLLIDERS */
  const step = 0.1;
  for (let z = 3.2; z < HULL.maxZ; z += step) {
    const s0 = outlineSpan(BRIDGE_OUTLINE, Math.min(z, HULL.maxZ));
    const s1 = outlineSpan(BRIDGE_OUTLINE, Math.min(z + step, HULL.maxZ));
    if (!s0 || !s1) continue;
    const lo = Math.max(s0[0], s1[0]), hi = Math.min(s0[1], s1[1]);
    const z1 = Math.min(z + step, Z1);
    if (lo > HULL.minX + HULL.frame) add(X0, lo, z, z1);
    if (hi < HULL.maxX - HULL.frame) add(hi, X1, z, z1);
  }
  add(X0, X1, HULL.maxZ - 0.1, Z1);

  /* ------------------------------------------------ INTERIOR BULKHEADS */
  const pw = DRESS.portalW;
  for (const wall of WALLS) {
    const frameWall = { ...wall, openings: (wall.openings || []).map(([a, b]) => [a - pw, b + pw]) };
    for (const [a, b] of wallSegments(frameWall)) {
      const geom = wall.axis === 'x'
        ? [WALL_T, wall.top, b - a] : [b - a, wall.top, WALL_T];
      const cx = wall.axis === 'x' ? wall.at : (a + b) / 2;
      const cz = wall.axis === 'x' ? (a + b) / 2 : wall.at;
      const m = box(hull, M.bulkheadMat, geom[0], geom[1], geom[2], cx, wall.top / 2, cz);
      m.castShadow = m.receiveShadow = true;
    }
    for (const [a, b] of wallSegments(wall)) {
      if (wall.axis === 'x') add(wall.at - WALL_T / 2 - 0.06, wall.at + WALL_T / 2 + 0.06, a, b);
      else add(a, b, wall.at - WALL_T / 2 - 0.06, wall.at + WALL_T / 2 + 0.06);
    }
    // The transom over every portal, to the deckhead.
    for (const [a, b] of wall.openings || []) {
      const y0 = DOOR_H + pw;
      if (wall.top - y0 <= 0.02) continue;
      const fa = a - pw, fb = b + pw;
      if (wall.axis === 'x') span(hull, M.bulkheadMat, wall.at - WALL_T / 2, wall.at + WALL_T / 2, y0, wall.top, fa, fb);
      else span(hull, M.bulkheadMat, fa, fb, y0, wall.top, wall.at - WALL_T / 2, wall.at + WALL_T / 2);
    }
  }
}

/**
 * The hull's aim blockers: every solid bulkhead segment, so a terminal on
 * the far side of a wall is not in front of you however close it is.
 */
export { ROOMS };
