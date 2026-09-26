/**
 * ship/kit.js — The parts the Avalon is assembled from.
 *
 * A starship interior is convincing for one reason: it looks like it was
 * BUILT, out of a few standard parts repeated with discipline, and then lived
 * in. So the ship is not modelled room by room out of whatever boxes each room
 * happened to want. Every compartment is lined with the same section —
 *
 *        ceiling:  coffered plate, beams on the frame spacing, light troughs
 *       chamfer:   an angled plate from 2.45 m up to the deckhead
 *        cornice   ───────────────────────────────────────────────
 *        wall:     three courses of pressed panel between structural ribs,
 *                  broken by vents, conduit runs, equipment boxes, light slots
 *        kick:     an angled plate from the deck up to 0.3 m
 *        deck:     treadplate tiles, or grating over a lit channel
 *
 * — and `dressRoomShell` is the one function that lays it. What a room does
 * (bunks, racks, a reactor) is built on top of it by the room.
 *
 * EVERYTHING HERE IS PART OF THE STRUCTURE. The lining is added to the hull
 * group, so it is one object with the plating it is fastened to and the
 * overlap check treats it the way it treats a gusset on a frame. It is held
 * to a budget instead: nothing on a wall stands more than `DRESS.maxD` off
 * its face, nothing on the upper chamfer comes below `DRESS.chamferStart`, so
 * a room can stand furniture `DRESS.propClear` off a wall and know it is
 * clear of the lining.
 */

import * as THREE from "three";
import { makeRng, boltLine, boltRing } from "../materials/pbr-kit.js";
import {
  HULL, ROOMS, WALLS, WALL_T, DOOR_H,
  BRIDGE_OUTLINE, CANOPY, HULL_WINDOWS, FLOOR_HATCH, SHOULDER_PORTS, outlineSpan
} from "../ship-rooms.js";

export const DRESS = {
  kickH: 0.3,            // top of the kick plate
  kickIn: 0.09,          // how far the kick plate's foot stands off the wall
  chamferStart: 2.45,    // where the upper chamfer leaves the wall
  chamferIn: 0.34,       // how far into the room the chamfer reaches at the deckhead
  ribW: 0.16,
  ribD: 0.075,
  maxD: 0.1,             // nothing on a wall stands further off its face than this
  portalW: 0.2,          // width of a door portal's frame round the opening
  portalD: 0.1,          // how far a portal stands proud of each wall face
  portalChamfer: 0.24,   // the cut-off upper corners of every opening
  doorSkip: 0.38,        // wall left plain beside a portal, for its control box
  propClear: 0.05,       // free-standing furniture keeps this far off a wall face
  ceilDrop: 0.12         // the ceiling lining hangs this far below the deckhead
};

/* =========================================================================
   PRIMITIVES
   ========================================================================= */

const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
const k3 = v => Math.round(v * 1000);

export function boxGeo(w, h, d) {
  return cached(`b${k3(w)}_${k3(h)}_${k3(d)}`, () => new THREE.BoxGeometry(w, h, d));
}
export function cylGeo(rt, rb, h, seg = 12) {
  return cached(`c${k3(rt)}_${k3(rb)}_${k3(h)}_${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
}

/** A box, placed. Rotations are Euler XYZ in radians. */
export function box(parent, mat, w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

/** A cylinder along `axis` ('x' | 'y' | 'z'). */
export function cyl(parent, mat, r, len, x = 0, y = 0, z = 0, axis = 'y', seg = 12, r2 = r) {
  const m = new THREE.Mesh(cylGeo(r, r2, len, seg), mat);
  m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  else if (axis === 'z') m.rotation.x = Math.PI / 2;
  parent.add(m);
  return m;
}

/**
 * A plate spanning from (y0, z0) to (y1, z1) in its parent's y-z plane,
 * `len` wide along x and centred on `u`. The chamfers and kick plates are
 * this, which is why they meet the wall and the deckhead exactly.
 */
export function slab(parent, mat, len, u, y0, z0, y1, z1, thick = 0.02) {
  const dy = y1 - y0, dz = z1 - z0;
  const L = Math.hypot(dy, dz);
  const m = new THREE.Mesh(boxGeo(len, L, thick), mat);
  m.rotation.x = Math.atan2(dz, dy);
  m.position.set(u, (y0 + y1) / 2, (z0 + z1) / 2);
  parent.add(m);
  return m;
}

/** A tube through world-space points (pipes, looms, cables). */
export function tube(parent, mat, points, r = 0.03, seg = 8, tension = 0.2) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', tension);
  const g = new THREE.TubeGeometry(curve, Math.max(8, points.length * 8), r, seg, false);
  const m = new THREE.Mesh(g, mat);
  parent.add(m);
  return m;
}

/** A 2D outline with its listed corners cut off by `c` (tl, tr, bl, br). */
export function chamferedRect(w, h, c, corners = ['tl', 'tr'], cx = 0, cy = 0) {
  const has = k => corners.includes(k);
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const s = new THREE.Shape();
  s.moveTo(has('bl') ? x0 + c : x0, y0);
  s.lineTo(has('br') ? x1 - c : x1, y0);
  if (has('br')) s.lineTo(x1, y0 + c);
  s.lineTo(x1, has('tr') ? y1 - c : y1);
  if (has('tr')) s.lineTo(x1 - c, y1);
  s.lineTo(has('tl') ? x0 + c : x0, y1);
  if (has('tl')) s.lineTo(x0, y1 - c);
  s.lineTo(x0, has('bl') ? y0 + c : y0);
  if (has('bl')) s.lineTo(x0 + c, y0);
  return s;
}

/** A path version of `chamferedRect`, for cutting a hole. */
export function chamferedHole(w, h, c, corners = ['tl', 'tr'], cx = 0, cy = 0) {
  const s = chamferedRect(w, h, c, corners, cx, cy);
  const p = new THREE.Path();
  p.setFromPoints(s.getPoints().reverse());
  return p;
}

/** A rounded-end slot (a stadium), as a Path. */
export function slotPath(w, h, cx = 0, cy = 0) {
  const r = h / 2;
  const p = new THREE.Path();
  p.moveTo(cx - w / 2 + r, cy - r);
  p.lineTo(cx + w / 2 - r, cy - r);
  p.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false);
  p.lineTo(cx - w / 2 + r, cy + r);
  p.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false);
  return p;
}

/** Extrude a shape `depth` along +z (from z = 0). */
export function extrude(parent, mat, shape, depth, { bevel = 0 } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1,
    curveSegments: 16
  });
  const m = new THREE.Mesh(g, mat);
  parent.add(m);
  return m;
}

/** A small status lamp in a bezel, facing +z. */
export function lamp(parent, M, x, y, z, mat = M.amberLampMat, r = 0.012) {
  cyl(parent, M.gunmetalMat, r * 1.8, 0.012, x, y, z + 0.006, 'z', 10);
  cyl(parent, mat, r, 0.008, x, y, z + 0.016, 'z', 10);
}

/* =========================================================================
   WORLD-SPACE UVs
   ========================================================================= */

/**
 * Re-map every mesh whose material carries `userData.worldUV` so its texture
 * is laid at a fixed size in the world, box-projected on the dominant axis of
 * each vertex normal. Runs once, before the bake, on geometry it clones.
 */
export function applyWorldUVs(root) {
  root.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const s = o.material?.userData?.worldUV;
    if (!s || !o.geometry?.attributes?.position) return;
    const g = o.geometry.clone();
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    if (!nor) return;
    const uv = new Float32Array(pos.count * 2);
    nm.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      n.fromBufferAttribute(nor, i).applyMatrix3(nm);
      const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      let u, v;
      if (ax >= ay && ax >= az) { u = p.z * Math.sign(n.x || 1); v = p.y; }
      else if (ay >= az) { u = p.x; v = p.z * Math.sign(n.y || 1); }
      else { u = -p.x * Math.sign(n.z || 1); v = p.y; }
      uv[i * 2] = u / s;
      uv[i * 2 + 1] = v / s;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    o.geometry = g;
  });
}

/* =========================================================================
   FACES — a wall, seen from the room it lines
   ========================================================================= */

/**
 * A face is a straight run of wall seen from inside a room: world points
 * `a` → `b` on the plane of its surface, and `n`, the unit normal pointing
 * into the room. `faceFrame` returns a group whose local x runs along the
 * face (u, 0 → L), y is up and +z points into the room — so everything a
 * wall carries is written once, in wall coordinates, whichever way it faces.
 */
export function faceFrame(face) {
  const theta = Math.atan2(face.n[0], face.n[1]);
  const ex = [Math.cos(theta), -Math.sin(theta)];
  let a = face.a, b = face.b;
  const d = (b[0] - a[0]) * ex[0] + (b[1] - a[1]) * ex[1];
  if (d < 0) [a, b] = [b, a];
  const g = new THREE.Group();
  g.position.set(a[0], 0, a[1]);
  g.rotation.y = theta;
  const L = Math.abs(d);
  const toU = ([x, z]) => (x - a[0]) * ex[0] + (z - a[1]) * ex[1];
  return { group: g, L, toU, a, b, ex };
}

/** Which rooms have a bulkhead (rather than hull plating) on a given side. */
function sideIsHull(axis, at) {
  if (axis === 'x') return Math.abs(Math.abs(at) - HULL.maxX) < 1e-6;
  return Math.abs(at - HULL.minZ) < 1e-6 || Math.abs(at - HULL.maxZ) < 1e-6;
}

/**
 * The faces lining a room, each with the doorways and viewports in it. A
 * rectangular room has four; the bridge has one per edge of its outline that
 * is not glass.
 */
export function roomFaces(roomId) {
  const r = ROOMS[roomId];
  const half = WALL_T / 2;
  const faces = [];

  if (roomId === 'bridge') {
    const canopyEdges = new Set(CANOPY.facets.map(([i, j]) => `${Math.min(i, j)}-${Math.max(i, j)}`));
    const names = ['S', 'E', 'SHOULDER_E', 'NOSE_E', 'NOSE_EF', 'NOSE_F', 'NOSE_WF', 'NOSE_W', 'SHOULDER_W', 'W'];
    for (let i = 0; i < BRIDGE_OUTLINE.length; i++) {
      const j = (i + 1) % BRIDGE_OUTLINE.length;
      if (canopyEdges.has(`${Math.min(i, j)}-${Math.max(i, j)}`)) continue;
      let a = BRIDGE_OUTLINE[i], b = BRIDGE_OUTLINE[j];
      // Outline is counter-clockwise seen from +y... with +z forward and +x
      // starboard, "inward" is the left of a→b rotated into x/z.
      const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      let n = [-dz / len, dx / len];
      // Make sure it points at the middle of the room.
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if ((2.5 - mid[1]) * n[1] + (0 - mid[0]) * n[0] < 0) n = [-n[0], -n[1]];
      if (i === 0) {
        // The aft bulkhead: its face is half a wall forward of its centre line.
        a = [a[0], a[1] + half]; b = [b[0], b[1] + half];
      }
      faces.push({ id: names[i], a, b, n, ceil: r.ceil, hull: i !== 0, axis: i === 0 ? 'z' : (Math.abs(dx) < 1e-6 ? 'x' : null) });
    }
  } else {
    const inset = (axis, at, dir) => sideIsHull(axis, at) ? at : at + dir * half;
    const x0 = inset('x', r.minX, 1), x1 = inset('x', r.maxX, -1);
    const z0 = inset('z', r.minZ, 1), z1 = inset('z', r.maxZ, -1);
    faces.push({ id: 'W', a: [x0, z0], b: [x0, z1], n: [1, 0], ceil: r.ceil, hull: sideIsHull('x', r.minX), axis: 'x', at: r.minX });
    faces.push({ id: 'E', a: [x1, z0], b: [x1, z1], n: [-1, 0], ceil: r.ceil, hull: sideIsHull('x', r.maxX), axis: 'x', at: r.maxX });
    faces.push({ id: 'S', a: [x0, z0], b: [x1, z0], n: [0, 1], ceil: r.ceil, hull: sideIsHull('z', r.minZ), axis: 'z', at: r.minZ });
    faces.push({ id: 'N', a: [x0, z1], b: [x1, z1], n: [0, -1], ceil: r.ceil, hull: sideIsHull('z', r.maxZ), axis: 'z', at: r.maxZ });
  }

  // Doorways, from the bulkheads this face is the surface of.
  for (const f of faces) {
    f.doors = [];
    f.windows = [];
    const fr = faceFrame(f);
    const wallAt = f.axis === 'x' ? (f.at ?? f.a[0]) : f.axis === 'z' ? (f.at ?? (f.a[1] - half)) : null;
    for (const w of WALLS) {
      if (f.axis == null || w.axis !== f.axis) continue;
      if (Math.abs(w.at - wallAt) > 1e-6) continue;
      for (const [s0, s1] of w.openings || []) {
        const p0 = f.axis === 'x' ? [f.a[0], s0] : [s0, f.a[1]];
        const p1 = f.axis === 'x' ? [f.a[0], s1] : [s1, f.a[1]];
        const u0 = fr.toU(p0), u1 = fr.toU(p1);
        const lo = Math.min(u0, u1), hi = Math.max(u0, u1);
        if (hi <= 0 || lo >= fr.L) continue;
        f.doors.push([lo, hi]);
      }
    }
    if (f.id === 'SHOULDER_E' || f.id === 'SHOULDER_W') {
      // The shoulder runs from the straight side (x ±5.6) to the nose.
      const sx = Math.sign(f.a[0] + f.b[0]);
      const side = [sx * 5.6, 3.2], nose = [sx * 2.6, 5.2];
      for (const p of SHOULDER_PORTS) {
        const u = fr.toU([side[0] + (nose[0] - side[0]) * p.t, side[1] + (nose[1] - side[1]) * p.t]);
        f.windows.push({ u, y: p.y, w: p.w, h: p.h, round: false });
      }
    }
    for (const win of HULL_WINDOWS) {
      if (win.room !== roomId || !f.hull || f.axis !== 'x') continue;
      if (Math.sign(f.a[0]) !== win.side) continue;
      const u = fr.toU([f.a[0], win.z]);
      const w = win.r ? win.r * 2 : win.w, h = win.r ? win.r * 2 : win.h;
      f.windows.push({ u, y: win.y, w, h, round: Boolean(win.r) });
    }
  }
  return faces;
}

/* =========================================================================
   BAY FILLS — what goes on the wall between two ribs
   ========================================================================= */

const COURSES = [
  [DRESS.kickH + 0.03, 0.98],
  [1.02, 1.98],
  [2.02, DRESS.chamferStart - 0.04]
];

/** A pressed panel: a plate with a raised, darker centre and a bolted rim. */
function pressedPanel(g, M, u0, u1, y0, y1, dark = false) {
  const w = u1 - u0, h = y1 - y0;
  if (w < 0.08 || h < 0.08) return;
  box(g, dark ? M.panelDarkMat : M.panelMat, w, h, 0.022, (u0 + u1) / 2, (y0 + y1) / 2, 0.011);
  if (w > 0.34 && h > 0.3) {
    box(g, dark ? M.panelMat : M.panelDarkMat, w - 0.14, h - 0.14, 0.012, (u0 + u1) / 2, (y0 + y1) / 2, 0.028);
  }
}

function fillPanels(g, M, u0, u1, rng) {
  COURSES.forEach(([y0, y1], i) => pressedPanel(g, M, u0 + 0.012, u1 - 0.012, y0, y1, i === 0 || rng() < 0.18));
  if (u1 - u0 > 0.5) {
    g.add(boltLine([u0 + 0.06, 1.94, 0.026], [u1 - 0.06, 1.94, 0.026], Math.max(3, Math.round((u1 - u0) / 0.22)), M.steelMat, { size: 0.011 }));
  }
}

function fillVent(g, M, u0, u1, rng) {
  const [ly0, ly1] = COURSES[0];
  pressedPanel(g, M, u0 + 0.012, u1 - 0.012, ly0, ly1, true);
  pressedPanel(g, M, u0 + 0.012, u1 - 0.012, COURSES[2][0], COURSES[2][1]);
  // The grille: a recessed dark box behind angled louvres in a heavy frame.
  const cu = (u0 + u1) / 2, w = Math.min(0.9, u1 - u0 - 0.1), y0 = 1.06, y1 = 1.94, cy = (y0 + y1) / 2;
  box(g, M.ventMat, w, y1 - y0, 0.01, cu, cy, 0.005);
  for (const s of [-1, 1]) {
    box(g, M.trimMat, 0.05, y1 - y0 + 0.05, 0.05, cu + s * (w / 2), cy, 0.025);
  }
  box(g, M.trimMat, w + 0.05, 0.05, 0.05, cu, y1, 0.025);
  box(g, M.trimMat, w + 0.05, 0.05, 0.05, cu, y0, 0.025);
  const n = Math.round((y1 - y0) / 0.07);
  for (let i = 0; i < n; i++) {
    box(g, M.greebleMat, w - 0.03, 0.05, 0.006, cu, y0 + 0.05 + i * ((y1 - y0 - 0.1) / (n - 1)), 0.03, -0.7);
  }
  if (rng() < 0.5) lamp(g, M, u1 - 0.1, y1 + 0.06, 0.02, M.stripDimMat, 0.01);
}

function fillConduit(g, M, u0, u1, rng) {
  // Flush plating behind, and three runs across the bay.
  COURSES.forEach(([y0, y1], i) => pressedPanel(g, M, u0 + 0.012, u1 - 0.012, y0, y1, i !== 1));
  const len = u1 - u0;
  const runs = [
    { y: 1.72, r: 0.042, mat: M.gunmetalMat },
    { y: 1.83, r: 0.026, mat: M.liveryMat },
    { y: 0.6, r: 0.034, mat: M.greebleMat }
  ];
  for (const run of runs) {
    cyl(g, run.mat, run.r, len, (u0 + u1) / 2, run.y, 0.052, 'x', 10);
    const clamps = Math.max(1, Math.floor(len / 0.55));
    for (let i = 0; i < clamps; i++) {
      const cu = u0 + (i + 0.5) * (len / clamps);
      box(g, M.trimMat, 0.04, run.r * 2 + 0.02, 0.072, cu, run.y, 0.036);
    }
  }
  // A junction box the lower run passes through.
  if (len > 0.6) {
    const cu = u0 + len * (0.3 + rng() * 0.4);
    box(g, M.panelDarkMat, 0.22, 0.26, 0.08, cu, 0.6, 0.04);
    lamp(g, M, cu + 0.06, 0.66, 0.08, rng() < 0.5 ? M.amberLampMat : M.stripDimMat);
  }
}

function fillMachinery(g, M, u0, u1, rng) {
  COURSES.forEach(([y0, y1], i) => pressedPanel(g, M, u0 + 0.012, u1 - 0.012, y0, y1, i === 0));
  const len = u1 - u0;
  const w = Math.min(0.62, len - 0.14), cu = (u0 + u1) / 2, cy = 1.36, h = 0.72;
  // The housing, stood off the plate on a mounting frame.
  box(g, M.gunmetalMat, w + 0.04, h + 0.04, 0.02, cu, cy, 0.04);
  box(g, M.greebleMat, w, h, 0.05, cu, cy, 0.075);
  // Readout window, switch row, a dial.
  box(g, M.screenGlassMat, w * 0.55, 0.16, 0.006, cu - w * 0.12, cy + 0.18, 0.1);
  for (let i = 0; i < 5; i++) {
    box(g, i % 2 ? M.steelMat : M.rubberMat, 0.022, 0.05, 0.016, cu - w * 0.35 + i * 0.06, cy - 0.06, 0.09);
  }
  cyl(g, M.dialGaugePsiMat, 0.05, 0.012, cu + w * 0.28, cy + 0.16, 0.1, 'z', 16);
  lamp(g, M, cu + w * 0.28, cy - 0.06, 0.08, rng() < 0.6 ? M.greenLampMat : M.amberLampMat);
  lamp(g, M, cu + w * 0.36, cy - 0.06, 0.08, M.stripDimMat);
  box(g, M.ventMat, w * 0.8, 0.012, 0.004, cu, cy - 0.24, 0.1);
  box(g, M.ventMat, w * 0.8, 0.012, 0.004, cu, cy - 0.28, 0.1);
  // Its feed, climbing to the conduit behind the chamfer.
  cyl(g, M.cableMat, 0.022, DRESS.chamferStart - (cy + h / 2), cu + w * 0.32, (DRESS.chamferStart + cy + h / 2) / 2, 0.05, 'y', 8);
}

function fillLightSlot(g, M, u0, u1) {
  const cu = (u0 + u1) / 2;
  pressedPanel(g, M, u0 + 0.012, cu - 0.09, COURSES[0][0], COURSES[2][1]);
  pressedPanel(g, M, cu + 0.09, u1 - 0.012, COURSES[0][0], COURSES[2][1]);
  box(g, M.gunmetalMat, 0.16, 1.5, 0.04, cu, 1.3, 0.02);
  box(g, M.troughMat, 0.04, 1.36, 0.006, cu, 1.3, 0.043);
}

const FILLS = { panels: fillPanels, vent: fillVent, conduit: fillConduit, machinery: fillMachinery, light: fillLightSlot };

/* =========================================================================
   THE LINING
   ========================================================================= */

function mergeSpans(spans) {
  const s = spans.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
  const out = [];
  for (const sp of s) {
    if (out.length && sp[0] <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], sp[1]);
    else out.push([...sp]);
  }
  return out;
}

/** The parts of [0, L] not covered by `blocked`. */
function freeRuns(L, blocked) {
  const out = [];
  let c = 0;
  for (const [a, b] of mergeSpans(blocked)) {
    if (a > c) out.push([c, Math.min(a, L)]);
    c = Math.max(c, b);
  }
  if (c < L) out.push([c, L]);
  return out.filter(([a, b]) => b - a > 0.02);
}

/** A porthole or slot viewport's inner trim, on a hull face. */
function windowTrim(g, M, win) {
  if (win.round) {
    const r = win.w / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.05, 0.045, 10, 36), M.trimMat);
    ring.position.set(win.u, win.y, 0.045);
    g.add(ring);
    const bolts = boltRing(r + 0.05, 12, M.steelMat, { size: 0.014 });
    bolts.rotation.x = Math.PI / 2;
    bolts.position.set(win.u, win.y, 0.09);
    g.add(bolts);
    // Dogging lugs at four points, the way a pressure port is held shut.
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      box(g, M.gunmetalMat, 0.06, 0.035, 0.05, win.u + Math.cos(a) * (r + 0.12), win.y + Math.sin(a) * (r + 0.12), 0.03, 0, 0, a);
    }
  } else {
    const s = chamferedRect(win.w + 0.2, win.h + 0.2, 0.08, ['tl', 'tr', 'bl', 'br'], win.u, win.y);
    s.holes.push(slotPath(win.w, win.h, win.u, win.y));
    extrude(g, M.trimMat, s, 0.06);
    g.add(boltLine([win.u - win.w / 2, win.y + win.h / 2 + 0.06, 0.065], [win.u + win.w / 2, win.y + win.h / 2 + 0.06, 0.065], 7, M.steelMat, { size: 0.012 }));
    g.add(boltLine([win.u - win.w / 2, win.y - win.h / 2 - 0.06, 0.065], [win.u + win.w / 2, win.y - win.h / 2 - 0.06, 0.065], 7, M.steelMat, { size: 0.012 }));
  }
}

/**
 * Line one face of a room.
 *
 * `keep` is a list of [u0, u1, top] spans the room wants plain (equipment
 * stands there): no ribs, no kick, no fill below `top` — just a flat bay plate
 * the room can mount against. Above `top` the lining resumes; a `top` above
 * the chamfer line removes the chamfer over that span as well.
 */
function dressFace(parent, M, face, opts, rng) {
  const fr = faceFrame(face);
  const g = fr.group;
  parent.add(g);
  const L = fr.L;
  const ceil = face.ceil;
  const cs = DRESS.chamferStart;

  const doorBlock = face.doors.map(([a, b]) => [a - DRESS.portalW - DRESS.doorSkip, b + DRESS.portalW + DRESS.doorSkip]);
  const winBlock = face.windows.map(w => [w.u - w.w / 2 - 0.22, w.u + w.w / 2 + 0.22]);
  const keep = (opts.keep || []).map(([a, b, top]) => [Math.max(0, a), Math.min(L, b), top ?? cs]);
  const keepBlock = keep.map(([a, b]) => [a, b]);
  const lowBlocked = [...doorBlock, ...keepBlock];

  // --- Ribs, evenly on the face, dropped where an opening or a bay is ---
  const spacing = opts.ribSpacing || 1.3;
  const nr = Math.max(1, Math.round(L / spacing));
  const ribs = [];
  if (opts.ribs !== false) {
    for (let i = 1; i < nr; i++) {
      const u = (L * i) / nr;
      const hw = DRESS.ribW / 2 + 0.03;
      if ([...lowBlocked, ...winBlock].some(([a, b]) => u + hw > a && u - hw < b)) continue;
      ribs.push(u);
    }
  }
  for (const u of ribs) {
    box(g, M.ribMat, DRESS.ribW, cs, DRESS.ribD, u, cs / 2, DRESS.ribD / 2);
    box(g, M.gunmetalMat, DRESS.ribW + 0.05, 0.12, DRESS.ribD + 0.02, u, 0.06, (DRESS.ribD + 0.02) / 2);
    box(g, M.gunmetalMat, DRESS.ribW + 0.02, 0.05, DRESS.ribD + 0.01, u, cs - 0.025, (DRESS.ribD + 0.01) / 2);
    // The frame continues up the chamfer.
    slab(g, M.ribMat, DRESS.ribW, u, cs, DRESS.ribD / 2 + 0.01, ceil, DRESS.chamferIn + DRESS.ribD / 2 - 0.01, DRESS.ribD);
    if (rng() < 0.35) {
      g.add(boltLine([u, 0.4, DRESS.ribD + 0.002], [u, cs - 0.12, DRESS.ribD + 0.002], 9, M.steelMat, { size: 0.012 }));
    }
  }

  // --- Kick plate and its top trim, wherever the deck meets plain wall ---
  for (const [a, b] of freeRuns(L, lowBlocked)) {
    slab(g, M.panelDarkMat, b - a, (a + b) / 2, 0.0, DRESS.kickIn, DRESS.kickH, 0.0, 0.02);
    box(g, M.gunmetalMat, b - a, 0.025, 0.035, (a + b) / 2, DRESS.kickH, 0.017);
  }

  // --- Bays between ribs, filled ---
  const breaks = mergeSpans([...lowBlocked, ...winBlock, ...ribs.map(u => [u - DRESS.ribW / 2, u + DRESS.ribW / 2])]);
  const bays = freeRuns(L, breaks);
  const weights = opts.fill || { panels: 5, vent: 1.3, conduit: 1.6, machinery: 1.1, light: 0.8 };
  const pick = w => {
    const entries = Object.entries(weights).filter(([k]) => (k === 'machinery' ? w > 0.55 : k === 'vent' ? w > 0.5 : k === 'light' ? w > 0.5 : true));
    const total = entries.reduce((s, [, v]) => s + v, 0);
    let r = rng() * total;
    for (const [k, v] of entries) { r -= v; if (r <= 0) return k; }
    return 'panels';
  };
  for (const [a, b] of bays) {
    if (b - a < 0.12) continue;
    FILLS[pick(b - a)](g, M, a, b, rng);
  }

  // --- Round the viewports: plain plate, and the trim ring ---
  for (const w of face.windows) {
    const a = w.u - w.w / 2 - 0.22, b = w.u + w.w / 2 + 0.22;
    pressedPanel(g, M, a + 0.012, b - 0.012, COURSES[0][0], w.y - w.h / 2 - 0.2, true);
    pressedPanel(g, M, a + 0.012, b - 0.012, w.y + w.h / 2 + 0.2, COURSES[2][1]);
    windowTrim(g, M, w);
  }

  // --- The plain bays the room asked for ---
  for (const [a, b, top] of keep) {
    box(g, M.panelDarkMat, b - a, Math.min(top, cs), 0.012, (a + b) / 2, Math.min(top, cs) / 2, 0.006);
  }

  // --- Cornice and upper chamfer, the whole length (above every door) ---
  const chamferRuns = freeRuns(L, keep.filter(([, , top]) => top > cs).map(([a, b]) => [a, b]));
  for (const [a, b] of chamferRuns) {
    box(g, M.gunmetalMat, b - a, 0.05, 0.055, (a + b) / 2, cs, 0.027);
    if (opts.chamferStrip) box(g, M.troughMat, b - a, 0.012, 0.004, (a + b) / 2, cs - 0.032, 0.05);
    // The chamfer is laid in plates with a dark seam every 1.2 m.
    const n = Math.max(1, Math.round((b - a) / 1.2));
    for (let i = 0; i < n; i++) {
      const p0 = a + ((b - a) * i) / n + 0.006, p1 = a + ((b - a) * (i + 1)) / n - 0.006;
      slab(g, i % 3 === 1 ? M.panelDarkMat : M.panelMat, p1 - p0, (p0 + p1) / 2, cs + 0.025, 0.0, ceil, DRESS.chamferIn, 0.025);
    }
    slab(g, M.bulkheadMat, b - a, (a + b) / 2, cs + 0.02, -0.02, ceil, DRESS.chamferIn - 0.03, 0.01);
    // A conduit bundle rides in the corner behind the chamfer's foot.
    if (opts.chamferConduit !== false && b - a > 0.6) {
      const y = cs + 0.2, z = 0.075;
      cyl(g, M.cableMat, 0.018, b - a, (a + b) / 2, y, z + 0.035, 'x', 6);
    }
  }

  // --- Handrail ---
  if (opts.handrail) {
    for (const [a, b] of freeRuns(L, [...lowBlocked, ...winBlock])) {
      if (b - a < 0.5) continue;
      cyl(g, M.steelMat, 0.02, b - a - 0.1, (a + b) / 2, 1.0, 0.075, 'x', 10);
      const n = Math.max(2, Math.round((b - a) / 1.1) + 1);
      for (let i = 0; i < n; i++) {
        const u = a + 0.12 + (i * (b - a - 0.24)) / (n - 1);
        box(g, M.gunmetalMat, 0.03, 0.03, 0.07, u, 1.0, 0.035);
      }
    }
  }

  return { face, frame: fr, ribs };
}

/**
 * The deckhead lining over a rectangle: a grid of plates hung `ceilDrop`
 * below the structure, beams on the frame spacing and light troughs along
 * the long axis. `clip(x, z)` may veto a plate (the bridge uses its outline).
 */
function dressCeiling(parent, M, rect, ceil, opts, rng) {
  const g = new THREE.Group();
  parent.add(g);
  const { x0, x1, z0, z1 } = rect;
  const w = x1 - x0, d = z1 - z0;
  if (w <= 0.2 || d <= 0.2) return g;
  const alongZ = opts.axis ? opts.axis === 'z' : d >= w;
  const y = ceil - 0.015;
  const clip = opts.clip || (() => true);

  // Plates.
  const pw = alongZ ? w / Math.max(1, Math.round(w / 0.9)) : 1.1;
  const pd = alongZ ? 1.1 : d / Math.max(1, Math.round(d / 0.9));
  for (let x = x0; x < x1 - 0.05; x += pw) {
    for (let z = z0; z < z1 - 0.05; z += pd) {
      const cx = x + Math.min(pw, x1 - x) / 2, cz = z + Math.min(pd, z1 - z) / 2;
      if (!clip(cx, cz)) continue;
      const mat = rng() < 0.15 ? M.panelDarkMat : M.ceilingMat;
      box(g, mat, Math.min(pw, x1 - x) - 0.02, 0.03, Math.min(pd, z1 - z) - 0.02, cx, y, cz);
    }
  }

  // Beams across the short direction, on the rib spacing.
  const spacing = opts.ribSpacing || 1.3;
  const long0 = alongZ ? z0 : x0, long1 = alongZ ? z1 : x1;
  const nb = Math.max(1, Math.round((long1 - long0) / spacing));
  for (let i = 1; i < nb; i++) {
    const s = long0 + ((long1 - long0) * i) / nb;
    const cx = alongZ ? (x0 + x1) / 2 : s, cz = alongZ ? s : (z0 + z1) / 2;
    if (!clip(cx, cz)) continue;
    box(g, M.ribMat, alongZ ? w : 0.14, 0.1, alongZ ? 0.14 : d, cx, ceil - 0.08, cz);
  }

  // Troughs: one down the middle, two when the room is wide.
  const across = alongZ ? w : d;
  const troughs = opts.troughs ?? (across > 2.6 ? 2 : 1);
  for (let t = 0; t < troughs; t++) {
    const off = troughs === 1 ? 0 : (t === 0 ? -1 : 1) * across * 0.22;
    const len = (alongZ ? d : w) - 0.5;
    const cx = alongZ ? (x0 + x1) / 2 + off : (x0 + x1) / 2;
    const cz = alongZ ? (z0 + z1) / 2 : (z0 + z1) / 2 + off;
    if (!clip(cx, cz)) continue;
    // Housing, then a lens recessed into it, then a diffuser grid over it.
    box(g, M.gunmetalMat, alongZ ? 0.3 : len, 0.07, alongZ ? len : 0.3, cx, ceil - 0.065, cz);
    box(g, M.troughMat, alongZ ? 0.16 : len - 0.06, 0.006, alongZ ? len - 0.06 : 0.16, cx, ceil - 0.102, cz);
    const bars = Math.round(len / 0.22);
    for (let i = 0; i <= bars; i++) {
      const s = -len / 2 + 0.03 + (i * (len - 0.06)) / bars;
      box(g, M.trimMat, alongZ ? 0.2 : 0.012, 0.012, alongZ ? 0.012 : 0.2, cx + (alongZ ? 0 : s), ceil - 0.108, cz + (alongZ ? s : 0));
    }
  }
  return g;
}

/**
 * The deck: tiles in a running grid with a hairline gap, or (for `grate`) a
 * lit service channel down the long axis under grating with tiles either side.
 */
function dressFloor(parent, M, rect, opts) {
  const g = new THREE.Group();
  parent.add(g);
  const { x0, x1, z0, z1 } = rect;
  const alongZ = opts.axis ? opts.axis === 'z' : (z1 - z0) >= (x1 - x0);
  const clip = opts.clip || (() => true);
  const hole = opts.hole;
  const inHole = (xa, xb, za, zb) => hole && xb > hole.minX - 0.02 && xa < hole.maxX + 0.02 && zb > hole.minZ - 0.02 && za < hole.maxZ + 0.02;

  let channel = null;
  if (opts.floor === 'grate') {
    const cw = opts.channelWidth || 0.56;
    const c = alongZ ? (x0 + x1) / 2 : (z0 + z1) / 2;
    channel = [c - cw / 2, c + cw / 2];
    const len = alongZ ? z1 - z0 : x1 - x0;
    const mid = alongZ ? (z0 + z1) / 2 : (x0 + x1) / 2;
    const at = (a, s) => alongZ ? [a, s] : [s, a];
    // Underglow, the channel floor, its lips and the bars across it.
    const [ux, uz] = at(c, mid);
    box(g, M.ventMat, alongZ ? cw : len, 0.01, alongZ ? len : cw, ux, -0.19, uz);
    box(g, M.underglowMat, alongZ ? 0.08 : len - 0.1, 0.004, alongZ ? len - 0.1 : 0.08, ux, -0.18, uz);
    for (const s of [-1, 1]) {
      const [lx, lz] = at(c + s * (cw / 2 - 0.015), mid);
      box(g, M.trimMat, alongZ ? 0.03 : len, 0.19, alongZ ? len : 0.03, lx, -0.095, lz);
    }
    const bars = Math.round(len / 0.05);
    for (let i = 0; i < bars; i++) {
      const s = (alongZ ? z0 : x0) + 0.025 + i * (len - 0.05) / (bars - 1);
      const [bx, bz] = at(c, s);
      box(g, M.grateMat, alongZ ? cw - 0.06 : 0.012, 0.03, alongZ ? 0.012 : cw - 0.06, bx, -0.015, bz);
    }
    const [r1x, r1z] = at(c, mid);
    for (const s of [-1, 1]) {
      box(g, M.grateMat, alongZ ? 0.02 : len, 0.03, alongZ ? len : 0.02, r1x + (alongZ ? s * (cw / 4) : 0), -0.018, r1z + (alongZ ? 0 : s * (cw / 4)));
    }
  }

  const tw = alongZ ? 0.6 : 1.2, td = alongZ ? 1.2 : 0.6;
  let row = 0;
  for (let x = x0; x < x1 - 0.02; x += tw, row++) {
    // Running bond: every other column starts half a tile on.
    const off = (row % 2) * (td / 2);
    for (let z = z0 - (off ? td - off : 0); z < z1 - 0.02; z += td) {
      const xa = x, xb = Math.min(x + tw, x1), za = Math.max(z, z0), zb = Math.min(z + td, z1);
      if (xb - xa < 0.05 || zb - za < 0.05) continue;
      if (channel) {
        const a = alongZ ? xa : za, b = alongZ ? xb : zb;
        if (b > channel[0] && a < channel[1]) {
          // Split the tile round the channel.
          const parts = [[a, Math.min(b, channel[0])], [Math.max(a, channel[1]), b]].filter(([p, q]) => q - p > 0.04);
          for (const [p, q] of parts) {
            const [cxa, cxb, cza, czb] = alongZ ? [p, q, za, zb] : [xa, xb, p, q];
            if (!clip((cxa + cxb) / 2, (cza + czb) / 2) || inHole(cxa, cxb, cza, czb)) continue;
            box(g, M.deckTileMat, cxb - cxa - 0.012, 0.02, czb - cza - 0.012, (cxa + cxb) / 2, -0.01, (cza + czb) / 2);
          }
          continue;
        }
      }
      if (!clip((xa + xb) / 2, (za + zb) / 2) || inHole(xa, xb, za, zb)) continue;
      box(g, M.deckTileMat, xb - xa - 0.012, 0.02, zb - za - 0.012, (xa + xb) / 2, -0.01, (za + zb) / 2);
    }
  }
  return g;
}

/**
 * LINE A ROOM.
 *
 * @param ship    the ShipInterior (for `ship.hull`, the materials, the seed)
 * @param roomId  a key of ROOMS
 * @param opts
 *   keepClear  [{ side, from, to, top }] — `side` is a face id ('N', 'S', 'E',
 *              'W', or on the bridge 'SHOULDER_E' / 'SHOULDER_W'); `from`/`to`
 *              are WORLD coordinates along that face (x for N/S, z for E/W,
 *              x for the shoulders); `top` defaults to the chamfer line.
 *   ribs, ribSpacing, fill (weights), handrail, chamferStrip, chamferConduit
 *   ceiling    'coffer' (default) | 'none'
 *   floor      'tiles' (default) | 'grate' | 'none'
 *   troughs    number of ceiling light troughs (default by width)
 *   seed
 * @returns {{ faces }} each face with its `frame` (for mounting to it)
 */
export function dressRoomShell(ship, roomId, opts = {}) {
  const M = ship;
  const rng = makeRng(opts.seed ?? (roomId.length * 7919 + roomId.charCodeAt(0)));
  const group = new THREE.Group();
  group.name = `lining-${roomId}`;
  ship.hull.add(group);

  const faces = roomFaces(roomId);
  const out = [];
  for (const face of faces) {
    if ((opts.skipFaces || []).includes(face.id)) continue;
    const fr = faceFrame(face);
    const keep = (opts.keepClear || [])
      .filter(k => k.side === face.id)
      .map(k => {
        const along = p => (face.axis === 'x' ? [face.a[0], p] : face.axis === 'z' ? [p, face.a[1]] : [p, face.a[1] + (p - face.a[0]) * ((face.b[1] - face.a[1]) / (face.b[0] - face.a[0]))]);
        const u0 = fr.toU(along(k.from)), u1 = fr.toU(along(k.to));
        return [Math.min(u0, u1), Math.max(u0, u1), k.top];
      });
    out.push(dressFace(group, M, face, { ...opts, keep }, rng));
  }

  const r = ROOMS[roomId];
  const half = WALL_T / 2;
  const inner = {
    x0: sideIsHull('x', r.minX) ? r.minX : r.minX + half,
    x1: sideIsHull('x', r.maxX) ? r.maxX : r.maxX - half,
    z0: sideIsHull('z', r.minZ) ? r.minZ : r.minZ + half,
    z1: sideIsHull('z', r.maxZ) ? r.maxZ : r.maxZ - half
  };
  const bridgeClip = roomId === 'bridge'
    ? (x, z) => { const s = outlineSpan(BRIDGE_OUTLINE, z); return !!s && x > s[0] + 0.3 && x < s[1] - 0.3; }
    : null;

  if (opts.ceiling !== 'none') {
    const ci = DRESS.chamferIn;
    const rect = { x0: inner.x0 + ci, x1: inner.x1 - ci, z0: inner.z0 + ci, z1: inner.z1 - ci };
    if (roomId === 'bridge') rect.z1 = opts.ceilingTo ?? 4.3;
    dressCeiling(group, M, rect, r.ceil, { ...opts, clip: bridgeClip || undefined }, rng);
  }
  if (opts.floor !== 'none') {
    const hole = FLOOR_HATCH.room === roomId ? FLOOR_HATCH : null;
    const rect = { ...inner };
    dressFloor(group, M, rect, { ...opts, floor: opts.floor || 'tiles', clip: bridgeClip ? ((x, z) => { const s = outlineSpan(BRIDGE_OUTLINE, z); return !!s && x > s[0] + 0.62 && x < s[1] - 0.62; }) : undefined, hole });
  }
  return { faces: out, group };
}

/* =========================================================================
   SMALL STANDARD PARTS, for the rooms
   ========================================================================= */

/**
 * A wall-mounted equipment cabinet: a steel box with a hinged face, vents,
 * a readout and a status lamp. `w`×`h`×`d`, built facing +z from z = 0.
 */
export function cabinet(parent, M, w, h, d, { screen = null, seed = 1 } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  const rng = makeRng(seed);
  box(g, M.gunmetalMat, w, h, d - 0.02, 0, h / 2, (d - 0.02) / 2);
  box(g, M.panelMat, w - 0.04, h - 0.04, 0.02, 0, h / 2, d - 0.01);
  box(g, M.panelDarkMat, w - 0.16, h - 0.16, 0.01, 0, h / 2, d + 0.005);
  for (const s of [-1, 1]) box(g, M.steelMat, 0.02, 0.08, 0.02, s * (w / 2 - 0.05), h * 0.55, d + 0.01);
  if (screen) box(g, screen, w * 0.5, Math.min(0.24, h * 0.22), 0.008, 0, h * 0.72, d + 0.012);
  for (let i = 0; i < 4; i++) box(g, M.ventMat, w * 0.6, 0.012, 0.004, 0, h * 0.18 + i * 0.03, d + 0.011);
  lamp(g, M, w / 2 - 0.08, h - 0.08, d, rng() < 0.5 ? M.greenLampMat : M.amberLampMat);
  return g;
}

/** A padded crash seat with a headrest and harness, facing +z, seat at 0.48. */
export function crashSeat(parent, M, { w = 0.56 } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  cyl(g, M.gunmetalMat, 0.06, 0.4, 0, 0.2, -0.05, 'y', 10);
  box(g, M.gunmetalMat, 0.5, 0.04, 0.4, 0, 0.02, -0.05);
  box(g, M.trimMat, w, 0.06, 0.52, 0, 0.42, 0.0);
  box(g, M.leatherMat, w - 0.06, 0.08, 0.48, 0, 0.49, 0.01);
  box(g, M.trimMat, w, 0.72, 0.07, 0, 0.84, -0.27, -0.12);
  box(g, M.leatherMat, w - 0.08, 0.64, 0.05, 0, 0.84, -0.22, -0.12);
  box(g, M.leatherMat, w * 0.6, 0.2, 0.08, 0, 1.3, -0.33, -0.12);
  for (const s of [-1, 1]) {
    box(g, M.trimMat, 0.06, 0.05, 0.4, s * (w / 2 + 0.02), 0.68, -0.02);
    box(g, M.gunmetalMat, 0.03, 0.22, 0.03, s * (w / 2 + 0.02), 0.56, 0.1);
    box(g, M.rubberMat, 0.04, 0.5, 0.012, s * 0.12, 0.92, -0.18, -0.12);
  }
  box(g, M.steelMat, 0.07, 0.07, 0.02, 0, 0.7, -0.16, -0.12);
  return g;
}

export { makeRng };
