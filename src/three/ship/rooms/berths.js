/**
 * ship/rooms/berths.js — Crew berths A and B.
 *
 * A BERTH IS A CABIN ON A WORKING SHIP, NOT A BEDROOM. Everything in it is
 * built into the structure, because anything loose on a ship is a missile:
 * stacked bunks in an alcove frame against the aft bulkhead with drawers
 * under and a stowage bin over, a fold-down desk bolted under the porthole
 * with its terminal on a wall arm, a locker bank, a washbasin module and a
 * row of gear hooks against the forward bulkhead.
 *
 * The two berths are the SAME construction, laid out the same way against
 * their own bulkheads (their doors and portholes sit alike), and differ only
 * in who lives there. Berth A is lived in — a curtain half drawn, a rumpled
 * blanket, a mug, a jacket on its hook, a locker door left ajar. Berth B is
 * cadet issue — blankets squared, curtains tied back, every door shut.
 *
 * The small shape helpers here (`bev`, the `prism*` extruders, `rod`) are
 * shared with comms.js and stairwell.js: the port rooms and the ladderwell
 * are built from the same parts.
 */

import * as THREE from "three";
import { boltLine, placard } from "../../materials/pbr-kit.js";
import { ROOMS } from "../../ship-rooms.js";
import { aimBoxFromBounds } from "../../aim-target.js";
import { dressRoomShell, box, cyl } from "../kit.js";

/* =========================================================================
   SHARED SHAPE HELPERS
   ========================================================================= */

const shapeCache = new Map();
const k3 = v => Math.round(v * 1000);

/**
 * A box with its edges broken: `r` is the bevel, `seg` 1 is a chamfer (a
 * machined housing), 2–3 a soft radius (a mattress, a cushion). Built centred.
 */
export function bevGeo(w, h, d, r = 0.012, seg = 1) {
  const key = `bev${k3(w)}_${k3(h)}_${k3(d)}_${k3(r)}_${seg}`;
  let g = shapeCache.get(key);
  if (g) return g;
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const s = new THREE.Shape();
  const iw = w / 2 - rr, ih = h / 2 - rr;
  s.moveTo(-iw, -ih); s.lineTo(iw, -ih); s.lineTo(iw, ih); s.lineTo(-iw, ih); s.lineTo(-iw, -ih);
  g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, d - rr * 2), bevelEnabled: true,
    bevelThickness: rr, bevelSize: rr, bevelSegments: seg, curveSegments: 4
  });
  g.translate(0, 0, -(d - rr * 2) / 2);
  shapeCache.set(key, g);
  return g;
}

/** A bevelled box, placed. */
export function bev(parent, mat, w, h, d, x = 0, y = 0, z = 0, r = 0.012, seg = 1, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(bevGeo(w, h, d, r, seg), mat);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

function shapeOf(pts) {
  const s = new THREE.Shape();
  pts.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
  s.lineTo(pts[0][0], pts[0][1]);
  return s;
}

/** A profile drawn in (z, y), extruded along x from x0 to x1. */
export function prismX(parent, mat, pts, x0, x1) {
  const g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: x1 - x0, bevelEnabled: false });
  const m = new THREE.Mesh(g, mat);
  m.rotation.y = -Math.PI / 2;
  m.position.x = x1;
  parent.add(m);
  return m;
}

/** A profile drawn in (x, y), extruded along z from z0 to z1. */
export function prismZ(parent, mat, pts, z0, z1) {
  const g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: z1 - z0, bevelEnabled: false });
  const m = new THREE.Mesh(g, mat);
  m.position.z = z0;
  parent.add(m);
  return m;
}

/** An outline drawn in (x, z) seen from above, extruded up from y0 to y1. */
export function prismY(parent, mat, pts, y0, y1) {
  const g = new THREE.ExtrudeGeometry(shapeOf(pts.map(([x, z]) => [x, -z])), { depth: y1 - y0, bevelEnabled: false });
  const m = new THREE.Mesh(g, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y0;
  parent.add(m);
  return m;
}

const _up = new THREE.Vector3(0, 1, 0);
/** A round bar from point a to point b (arms, struts, rams, rails). */
export function rod(parent, mat, a, b, r = 0.012, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const len = dir.length();
  const m = cyl(parent, mat, r, len, 0, 0, 0, 'y', seg);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  return m;
}

const planeCache = new Map();
/** A flat face, facing +z (screens, printed labels, drawer fronts). */
export function face(parent, mat, w, h, x = 0, y = 0, z = 0, rx = 0, ry = 0) {
  const key = `${k3(w)}_${k3(h)}`;
  let g = planeCache.get(key);
  if (!g) { g = new THREE.PlaneGeometry(w, h); planeCache.set(key, g); }
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (rx || ry) m.rotation.set(rx, ry, 0);
  parent.add(m);
  return m;
}

let sphereGeo = null;
/** A unit sphere, scaled (helmets, knob caps). */
export function blob(parent, mat, rx, ry, rz, x, y, z) {
  sphereGeo = sphereGeo || new THREE.SphereGeometry(1, 12, 8);
  const m = new THREE.Mesh(sphereGeo, mat);
  m.scale.set(rx, ry, rz);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/* =========================================================================
   BERTH MATERIALS — cloth, which the ship's kit does not carry
   ========================================================================= */

const clothCache = new WeakMap();
function cloth(ship) {
  let c = clothCache.get(ship);
  if (!c) {
    c = {
      blanket: new THREE.MeshStandardMaterial({ color: 0x3e3a31, roughness: 0.97, metalness: 0 }),
      curtain: new THREE.MeshStandardMaterial({ color: 0x544836, roughness: 0.96, metalness: 0 }),
      sheet: ship.paintWhiteMat
    };
    clothCache.set(ship, c);
  }
  return c;
}

/* =========================================================================
   PARTS
   ========================================================================= */

/** A pleated curtain hanging from `yTop` to `yBot` across x0..x1. */
function curtain(g, mat, x0, x1, yTop, yBot, z, pitch = 0.1) {
  const n = Math.max(2, Math.round((x1 - x0) / pitch));
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + step * (i + 0.5);
    const s = i % 2 ? 1 : -1;
    box(g, mat, step * 1.12, yTop - yBot, 0.014, x, (yTop + yBot) / 2, z + s * 0.012, 0, s * 0.3, 0);
  }
}

/** A curtain gathered and tied back at one end of its rail. */
function tiedCurtain(g, M, mat, x, yTop, yBot, z) {
  for (let i = 0; i < 5; i++) {
    box(g, mat, 0.035, yTop - yBot, 0.03, x + (i - 2) * 0.022, (yTop + yBot) / 2, z + (i % 2 ? 0.01 : -0.01), 0, 0, (i - 2) * 0.012);
  }
  box(g, M.rubberMat, 0.14, 0.035, 0.055, x, yBot + (yTop - yBot) * 0.42, z);
}

/** A reading lamp on the inside of a bunk's end panel, facing +x. */
function readingLamp(g, M, x, y, z) {
  bev(g, M.gunmetalMat, 0.05, 0.08, 0.16, x + 0.025, y, z, 0.01);
  box(g, M.luminaireWarmMat, 0.004, 0.05, 0.12, x + 0.052, y - 0.005, z);
  box(g, M.trimMat, 0.012, 0.012, 0.13, x + 0.056, y + 0.03, z);
  box(g, M.steelMat, 0.012, 0.022, 0.012, x + 0.056, y - 0.052, z + 0.05);
}

/**
 * THE ALCOVE: two stacked bunks framed into the aft bulkhead, x0..x1 along it,
 * back at zB and front at zF. `lived` dresses it for Berth A.
 */
function buildBunks(g, M, C, { x0, x1, zB, zF, lived, drawerMats, designator }) {
  const t = 0.06;
  const mid = (x0 + x1) / 2;
  const L = x1 - x0 - t * 2;

  // End bulkheads: a toe recess at the deck and the upper front corner cut.
  const prof = [[zB, 0], [zF - 0.05, 0], [zF - 0.05, 0.1], [zF, 0.14], [zF, 2.22], [zF - 0.14, 2.36], [zB, 2.36]];
  for (const [a, b] of [[x0, x0 + t], [x1 - t, x1]]) {
    prismX(g, M.panelMat, prof, a, b);
    // A trim band down the front edge, bolted.
    const xo = a === x0 ? a + t / 2 : b - t / 2;
    box(g, M.trimMat, t + 0.012, 2.04, 0.03, xo, 1.2, zF - 0.012);
  }
  g.add(boltLine([x1 + 0.002, 0.3, zF - 0.1], [x1 + 0.002, 2.1, zF - 0.1], 9, M.steelMat, { size: 0.01, normalAxis: 'x' }));
  g.add(boltLine([x1 + 0.002, 0.3, zB + 0.08], [x1 + 0.002, 2.1, zB + 0.08], 9, M.steelMat, { size: 0.01, normalAxis: 'x' }));

  // Plinth, recessed, and the carcass the drawers slide into.
  box(g, M.ventMat, L, 0.08, zF - zB - 0.1, mid, 0.04, (zB + zF) / 2 - 0.05);
  box(g, M.gunmetalMat, L, 0.36, zF - zB - 0.06, mid, 0.26, (zB + zF) / 2 - 0.03);

  // Two drawers under the lower bunk, the footlockers of the two who sleep here.
  const dw = L / 2 - 0.02;
  [0, 1].forEach(i => {
    const cx = x0 + t + 0.01 + dw / 2 + i * (dw + 0.02);
    bev(g, M.trimMat, dw, 0.32, 0.03, cx, 0.26, zF - 0.02, 0.008);
    face(g, drawerMats[i], dw - 0.06, 0.24, cx, 0.25, zF - 0.004);
    box(g, M.gunmetalMat, dw * 0.5, 0.028, 0.03, cx, 0.395, zF + 0.004);
    box(g, M.steelMat, dw * 0.46, 0.012, 0.02, cx, 0.388, zF + 0.012);
  });

  // Each berth: pan, lip, mattress, pillow, quilted back pad, lamp, straps.
  const berths = [{ pan: 0.44, head: 1.26 }, { pan: 1.26, head: 2.22 }];
  berths.forEach(({ pan, head }, level) => {
    box(g, M.gunmetalMat, L, 0.06, zF - zB - 0.03, mid, pan + 0.03, (zB + zF) / 2 - 0.015);
    bev(g, M.trimMat, L, 0.14, 0.05, mid, pan + 0.06, zF - 0.025, 0.01);
    const mTop = pan + 0.2;
    bev(g, M.fabricMat, L - 0.04, 0.14, 0.72, mid, pan + 0.13, zB + 0.39, 0.04, 2);
    bev(g, M.paintWhiteMat, 0.34, 0.1, 0.54, x0 + t + 0.22, mTop + 0.03, zB + 0.37, 0.04, 2, 0, lived ? 0.12 : 0, lived ? 0.08 : 0);
    // Quilted pads on the bulkhead behind the berth.
    const padTop = head - 0.08, padBot = mTop + 0.02;
    for (let i = 0; i < 3; i++) {
      bev(g, M.paddingMat, L / 3 - 0.02, padTop - padBot, 0.045, x0 + t + (i + 0.5) * (L / 3), (padTop + padBot) / 2, zB + 0.025, 0.02, 2);
    }
    readingLamp(g, M, x0 + t, head - 0.2, zB + 0.24);
    // A cable from the lamp up the end panel to the stowage bin.
    box(g, M.cableMat, 0.012, head - 0.2 - (pan + 0.1), 0.012, x0 + t + 0.01, (head - 0.2 + pan + 0.1) / 2, zB + 0.07);
    // Grab straps from the frame over the berth.
    for (const sx of [x0 + t + 0.5, x1 - t - 0.45]) {
      box(g, M.rubberMat, 0.035, 0.24, 0.007, sx, head - 0.14, zF - 0.09, lived && level === 0 ? 0.25 : 0);
      box(g, M.steelMat, 0.05, 0.02, 0.012, sx, head - 0.27, zF - 0.09);
    }
    // Bedding.
    if (lived) {
      bev(g, C.blanket, L * 0.62, 0.05, 0.74, x1 - t - L * 0.31 - 0.02, mTop + 0.02, zB + 0.4, 0.02, 1, 0, 0.05, 0);
      cyl(g, C.blanket, 0.055, 0.66, x1 - t - L * 0.64, mTop + 0.05, zB + 0.4, 'z', 8);
      if (level === 1) box(g, C.blanket, 0.46, 0.26, 0.02, x1 - t - 0.35, pan + 0.02, zF + 0.01, 0.12, 0, 0);
    } else {
      bev(g, C.sheet, L * 0.7, 0.03, 0.7, x1 - t - L * 0.35 - 0.02, mTop + 0.012, zB + 0.39, 0.01);
      bev(g, C.blanket, 0.46, 0.12, 0.34, x1 - t - 0.28, mTop + 0.07, zB + 0.39, 0.02);
    }
  });

  // Safety bar on the upper berth.
  cyl(g, M.steelMat, 0.016, 1.06, mid + 0.05, 1.62, zF - 0.035, 'x', 8);
  for (const px of [mid - 0.45, mid + 0.55]) cyl(g, M.steelMat, 0.014, 0.28, px, 1.47, zF - 0.035, 'y', 6);

  // Curtain rails, under the upper pan and under the header.
  for (const ry of [1.21, 2.08]) {
    cyl(g, M.steelMat, 0.011, L, mid, ry, zF - 0.07, 'x', 6);
  }
  if (lived) {
    curtain(g, C.curtain, mid + 0.1, x1 - t - 0.02, 2.06, 1.5, zF - 0.07);
    tiedCurtain(g, M, C.curtain, x0 + t + 0.1, 2.06, 1.44, zF - 0.07);
    curtain(g, C.curtain, x0 + t + 0.02, x0 + t + 0.34, 1.19, 0.62, zF - 0.07, 0.06);
  } else {
    for (const [cx, top, bot] of [[x0 + t + 0.08, 2.06, 1.44], [x1 - t - 0.08, 2.06, 1.44], [x0 + t + 0.08, 1.19, 0.6], [x1 - t - 0.08, 1.19, 0.6]]) {
      tiedCurtain(g, M, C.curtain, cx, top, bot, zF - 0.07);
    }
  }

  // Header valance and canopy.
  box(g, M.gunmetalMat, x1 - x0, 0.08, zF - zB, mid, 2.32, (zB + zF) / 2);
  bev(g, M.trimMat, x1 - x0, 0.24, 0.05, mid, 2.2, zF - 0.025, 0.012);
  box(g, M.troughMat, L - 0.2, 0.01, 0.01, mid, 2.09, zF - 0.02);
  const tag = placard(designator, { w: 0.38, h: 0.1 });
  tag.position.set(mid + 0.35, 2.21, zF + 0.002);
  g.add(tag);

  // Stowage bin over the canopy: two hinged doors, latched.
  box(g, M.gunmetalMat, x1 - x0, 0.5, zF - zB - 0.06, mid, 2.61, (zB + zF) / 2 - 0.03);
  for (const i of [0, 1]) {
    const cx = x0 + (x1 - x0) * (0.25 + 0.5 * i);
    bev(g, M.panelMat, (x1 - x0) / 2 - 0.04, 0.44, 0.03, cx, 2.61, zF - 0.045, 0.01);
    bev(g, M.panelDarkMat, (x1 - x0) / 2 - 0.2, 0.28, 0.01, cx, 2.61, zF - 0.026, 0.004);
    box(g, M.steelMat, 0.08, 0.03, 0.025, cx, 2.8, zF - 0.02);
    box(g, M.paintWhiteMat, 0.16, 0.035, 0.004, cx - 0.2, 2.78, zF - 0.029);
  }
  cyl(g, M.steelMat, 0.012, x1 - x0 - 0.1, mid, 2.38, zF - 0.035, 'x', 6);

  // Climbing grips on the outboard end panel, for the upper berth.
  for (const y of [0.72, 1.02, 1.74]) {
    cyl(g, M.steelMat, 0.014, 0.3, x1 + 0.03, y, zF - 0.3, 'z', 8);
    for (const dz of [-0.13, 0.13]) box(g, M.gunmetalMat, 0.04, 0.03, 0.03, x1 + 0.015, y, zF - 0.3 + dz);
  }
}

/** The fold-down desk under the porthole, its terminal on a wall arm, and a stool. */
function buildDesk(g, M, C, { xW, z0, z1, lived }) {
  const xF = xW + 0.6;
  const top = 0.76;
  // Desk top: a steel plate with the front corners cut, and an edge band.
  prismY(g, M.panelMat, [[xW, z0], [xF - 0.05, z0], [xF, z0 + 0.05], [xF, z1 - 0.05], [xF - 0.05, z1], [xW, z1]], top - 0.04, top);
  box(g, M.trimMat, 0.025, 0.05, z1 - z0 - 0.1, xF - 0.005, top - 0.02, (z0 + z1) / 2);
  box(g, M.rubberMat, 0.4, 0.004, 0.55, xW + 0.3, top + 0.002, z0 + 0.4);
  // Wall cleat and hinge.
  box(g, M.gunmetalMat, 0.05, 0.12, z1 - z0, xW + 0.025, top - 0.08, (z0 + z1) / 2);
  cyl(g, M.steelMat, 0.013, z1 - z0 - 0.1, xW + 0.05, top - 0.04, (z0 + z1) / 2, 'z', 8);
  // Folding brackets.
  for (const bz of [z0 + 0.12, z1 - 0.12]) {
    rod(g, M.gunmetalMat, [xW + 0.03, 0.3, bz], [xF - 0.08, top - 0.05, bz], 0.018, 6);
    box(g, M.gunmetalMat, 0.05, 0.12, 0.05, xW + 0.025, 0.3, bz);
  }
  // A drawer slung under the far end.
  bev(g, M.gunmetalMat, 0.48, 0.18, 0.3, xW + 0.28, top - 0.13, z1 - 0.2, 0.01);
  box(g, M.steelMat, 0.02, 0.025, 0.16, xW + 0.525, top - 0.13, z1 - 0.2);

  // --- The terminal, on its arm, turned toward the middle of the berth ---
  const term = new THREE.Group();
  term.position.set(xW + 0.2, top, z0 + 0.28);
  term.rotation.y = 1.71;
  g.add(term);
  bev(term, M.gunmetalMat, 0.2, 0.02, 0.16, 0, 0.01, -0.04, 0.006);
  box(term, M.gunmetalMat, 0.06, 0.12, 0.05, 0, 0.08, -0.06);
  const head = new THREE.Group();
  head.position.set(0, 0.3, -0.04);
  head.rotation.x = -0.12;
  term.add(head);
  bev(head, M.gunmetalMat, 0.48, 0.34, 0.2, 0, 0, -0.06, 0.02);
  // Bezel: a heavy lip round a recessed tube.
  box(head, M.trimMat, 0.46, 0.04, 0.03, 0, 0.145, 0.05);
  box(head, M.trimMat, 0.46, 0.05, 0.03, 0, -0.14, 0.05);
  for (const s of [-1, 1]) box(head, M.trimMat, 0.05, 0.3, 0.03, s * 0.205, 0, 0.05);
  box(head, M.ventMat, 0.36, 0.25, 0.01, -0.02, 0.005, 0.04);
  face(head, M.crtAmberMat, 0.33, 0.23, -0.02, 0.005, 0.047);
  // A hood over the glass, knobs down the right, a lamp row under it.
  box(head, M.gunmetalMat, 0.46, 0.012, 0.08, 0, 0.17, 0.08, 0.2, 0, 0);
  for (const y of [0.07, -0.02]) cyl(head, M.rubberMat, 0.016, 0.03, 0.2, y, 0.07, 'z', 8);
  for (let i = 0; i < 4; i++) box(head, i === 1 ? M.greenLampMat : M.trimMat, 0.02, 0.008, 0.005, -0.15 + i * 0.04, -0.14, 0.067);
  for (let i = 0; i < 5; i++) box(head, M.ventMat, 0.3, 0.012, 0.004, 0, -0.1 + i * 0.04, -0.162);
  // Keyboard on the desk in front of it.
  bev(term, M.gunmetalMat, 0.4, 0.03, 0.17, 0, 0.015, 0.2, 0.006);
  box(term, M.keyboardMat, 0.36, 0.006, 0.13, 0, 0.033, 0.2, 0.08);
  // Its feed, down the wall into a gland in the deck.
  box(g, M.cableMat, 0.02, top - 0.05, 0.02, xW + 0.02, (top - 0.05) / 2, z0 + 0.34);
  box(g, M.cableMat, 0.016, top - 0.05, 0.016, xW + 0.045, (top - 0.05) / 2, z0 + 0.38);
  cyl(g, M.gunmetalMat, 0.045, 0.03, xW + 0.035, 0.015, z0 + 0.36, 'y', 8);

  // --- Anglepoise lamp at the far end ---
  const lx = xW + 0.18, lz = z1 - 0.3;
  cyl(g, M.gunmetalMat, 0.07, 0.025, lx, top + 0.012, lz, 'y', 12);
  rod(g, M.brassMat, [lx, top + 0.02, lz], [lx + 0.1, top + 0.3, lz - 0.03], 0.009, 6);
  rod(g, M.brassMat, [lx + 0.1, top + 0.3, lz - 0.03], [lx + 0.26, top + 0.36, lz - 0.08], 0.009, 6);
  cyl(g, M.steelMat, 0.016, 0.03, lx + 0.1, top + 0.3, lz - 0.03, 'z', 8);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.12, 10, 1, true), M.gunmetalMat);
  shade.position.set(lx + 0.3, top + 0.32, lz - 0.09);
  shade.rotation.z = 2.5;
  g.add(shade);
  cyl(g, M.luminaireWarmMat, 0.035, 0.01, lx + 0.31, top + 0.3, lz - 0.09, 'y', 10);

  // --- What lies on it ---
  if (lived) {
    cyl(g, M.paintWhiteMat, 0.036, 0.09, xW + 0.42, top + 0.045, z0 + 0.62, 'y', 10);
    cyl(g, M.ventMat, 0.03, 0.004, xW + 0.42, top + 0.09, z0 + 0.62, 'y', 10);
    box(g, M.paintWhiteMat, 0.012, 0.05, 0.012, xW + 0.42, top + 0.05, z0 + 0.665);
    box(g, C.sheet, 0.21, 0.003, 0.28, xW + 0.3, top + 0.003, z0 + 0.86, 0, 0.25, 0);
    box(g, C.sheet, 0.21, 0.003, 0.28, xW + 0.34, top + 0.006, z0 + 0.9, 0, -0.18, 0);
    bev(g, M.gunmetalMat, 0.14, 0.012, 0.2, xW + 0.44, top + 0.008, z0 + 1.1, 0.004, 1, 0, 0.4, 0);
    // A photograph taped to the plate beside the porthole.
    box(g, C.sheet, 0.004, 0.11, 0.085, xW + 0.012, 1.38, z0 + 0.12, 0, 0, 0.06);
    box(g, C.sheet, 0.004, 0.08, 0.1, xW + 0.013, 1.24, z0 + 0.2, 0, 0, -0.1);
  } else {
    bev(g, M.liveryMat, 0.22, 0.05, 0.3, xW + 0.3, top + 0.025, z0 + 0.95, 0.006);
    bev(g, M.gunmetalMat, 0.22, 0.03, 0.3, xW + 0.3, top + 0.065, z0 + 0.95, 0.006);
    bev(g, M.gunmetalMat, 0.14, 0.012, 0.2, xW + 0.3, top + 0.006, z0 + 0.66, 0.004);
  }

  // --- Swivel stool, half tucked under ---
  const sx = xF - 0.1, sz = z0 + 0.72;
  cyl(g, M.gunmetalMat, 0.17, 0.02, sx, 0.01, sz, 'y', 12);
  cyl(g, M.steelMat, 0.028, 0.46, sx, 0.25, sz, 'y', 8);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.01, 6, 16), M.steelMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(sx, 0.22, sz);
  g.add(ring);
  cyl(g, M.gunmetalMat, 0.17, 0.03, sx, 0.48, sz, 'y', 14);
  cyl(g, M.leatherMat, 0.16, 0.05, sx, 0.52, sz, 'y', 14);
}

/** Lockers, a washbasin module and gear hooks along the forward bulkhead (face at zN). */
function buildForwardWall(g, M, C, { zN, lived }) {
  // --- Locker bank: three tall lockers, one carcass ---
  const lx0 = -3.95, lx1 = -2.6, top = 2.12, d = 0.42;
  const zb = zN - 0.02, zf = zb - d;
  box(g, M.ventMat, lx1 - lx0 - 0.04, 0.08, d - 0.05, (lx0 + lx1) / 2, 0.04, zb - d / 2 + 0.02);
  box(g, M.panelDarkMat, lx1 - lx0, top - 0.08, 0.02, (lx0 + lx1) / 2, (top + 0.08) / 2, zb - 0.01);
  const lw = (lx1 - lx0) / 3;
  for (let i = 0; i <= 3; i++) box(g, M.gunmetalMat, 0.025, top - 0.08, d, lx0 + i * lw, (top + 0.08) / 2, zb - d / 2);
  bev(g, M.trimMat, lx1 - lx0 + 0.03, 0.05, d + 0.02, (lx0 + lx1) / 2, top, zb - d / 2, 0.01);
  box(g, M.gunmetalMat, lx1 - lx0, 0.03, d, (lx0 + lx1) / 2, 0.095, zb - d / 2);
  for (let i = 0; i < 3; i++) {
    const cx = lx0 + lw * (i + 0.5);
    const ajar = lived && i === 1;
    const door = new THREE.Group();
    // Hinged on its left edge (seen from the room).
    door.position.set(cx + lw / 2 - 0.02, 0, zf);
    if (ajar) door.rotation.y = -0.42;
    g.add(door);
    const dx = -(lw / 2 - 0.02);
    bev(door, M.panelMat, lw - 0.03, top - 0.2, 0.025, dx, (top + 0.1) / 2 + 0.005, -0.013, 0.008);
    for (const vy of [0.3, 0.36, 0.42, 1.78, 1.84, 1.9]) box(door, M.ventMat, lw - 0.16, 0.014, 0.006, dx, vy, -0.027);
    bev(door, M.panelDarkMat, lw - 0.14, 0.9, 0.006, dx, 1.08, -0.027, 0.003);
    box(door, M.steelMat, 0.018, 0.2, 0.02, dx - lw / 2 + 0.07, 1.15, -0.04);
    for (const hy of [1.06, 1.24]) box(door, M.gunmetalMat, 0.022, 0.02, 0.03, dx - lw / 2 + 0.07, hy, -0.03);
    cyl(door, M.brassMat, 0.012, 0.012, dx - lw / 2 + 0.07, 1.3, -0.032, 'z', 8);
    box(door, M.paintWhiteMat, 0.16, 0.045, 0.004, dx, 1.62, -0.028);
    for (const hy of [0.4, 1.8]) cyl(g, M.steelMat, 0.011, 0.07, cx + lw / 2 - 0.02, hy, zf - 0.01, 'y', 6);
    if (ajar) {
      // What the open door shows: a shelf, a hanging jacket, boots.
      box(g, M.gunmetalMat, lw - 0.03, 0.02, d - 0.04, cx, 1.72, zb - d / 2);
      cyl(g, M.steelMat, 0.01, lw - 0.04, cx, 1.62, zb - d / 2, 'x', 6);
      bev(g, M.fabricMat, lw - 0.12, 0.62, 0.16, cx, 1.28, zb - d / 2, 0.03, 2);
      bev(g, C.blanket, lw - 0.1, 0.12, 0.28, cx, 1.79, zb - d / 2, 0.02);
      for (const bx of [-0.07, 0.07]) bev(g, M.leatherMat, 0.1, 0.24, 0.26, cx + bx, 0.24, zb - d / 2 - 0.02, 0.03, 2);
    }
  }
  // A duffel stowed on top.
  const duff = cyl(g, lived ? M.fabricMat : C.blanket, 0.12, 0.62, lx0 + 0.5, top + 0.14, zb - 0.2, 'x', 10);
  duff.rotation.y = lived ? 0.2 : 0;

  // --- Washbasin module ---
  const bx0 = -2.5, bx1 = -1.9, bc = (bx0 + bx1) / 2;
  bev(g, M.panelMat, bx1 - bx0, 0.6, 0.36, bc, 0.52, zb - 0.18, 0.012);
  bev(g, M.panelDarkMat, bx1 - bx0 - 0.12, 0.44, 0.01, bc, 0.5, zb - 0.365, 0.004);
  box(g, M.steelMat, 0.1, 0.02, 0.02, bc, 0.68, zb - 0.375);
  bev(g, M.steelMat, bx1 - bx0 + 0.02, 0.035, 0.4, bc, 0.84, zb - 0.2, 0.01);
  cyl(g, M.steelMat, 0.15, 0.012, bc, 0.861, zb - 0.2, 'y', 16);
  cyl(g, M.ventMat, 0.125, 0.006, bc, 0.866, zb - 0.2, 'y', 16);
  rod(g, M.steelMat, [bc, 0.95, zb], [bc, 0.99, zb - 0.1], 0.012, 6);
  rod(g, M.steelMat, [bc, 0.99, zb - 0.1], [bc, 0.94, zb - 0.14], 0.01, 6);
  for (const s of [-1, 1]) cyl(g, M.rubberMat, 0.018, 0.03, bc + s * 0.1, 0.93, zb - 0.02, 'z', 8);
  for (const s of [-1, 1]) cyl(g, M.steelMat, 0.016, 0.22, bc + s * 0.12, 0.11, zb - 0.06, 'y', 6);
  // Mirror, lamp over it, shelf under it.
  bev(g, M.trimMat, 0.46, 0.56, 0.03, bc, 1.44, zb - 0.015, 0.01);
  box(g, M.steelMat, 0.4, 0.5, 0.006, bc, 1.44, zb - 0.032);
  bev(g, M.gunmetalMat, 0.46, 0.05, 0.08, bc, 1.76, zb - 0.04, 0.01);
  box(g, M.troughMat, 0.38, 0.006, 0.03, bc, 1.733, zb - 0.05);
  box(g, M.gunmetalMat, 0.44, 0.02, 0.1, bc, 1.12, zb - 0.05);
  cyl(g, lived ? M.liveryMat : M.paintWhiteMat, 0.025, 0.08, bc - 0.12, 1.17, zb - 0.05, 'y', 8);
  // A towel over a rail on the side of the module.
  cyl(g, M.steelMat, 0.008, 0.3, bx1 + 0.02, 0.72, zb - 0.18, 'z', 6);
  bev(g, C.sheet, 0.03, lived ? 0.34 : 0.26, lived ? 0.22 : 0.2, bx1 + 0.025, 0.6, zb - 0.18, 0.01, 1, 0, 0, lived ? 0.08 : 0);

  // --- Gear hooks ---
  const hx0 = -1.82, hx1 = -1.42;
  box(g, M.gunmetalMat, hx1 - hx0, 0.07, 0.025, (hx0 + hx1) / 2, 1.8, zb - 0.012);
  for (const hx of [hx0 + 0.1, hx1 - 0.1]) {
    rod(g, M.brassMat, [hx, 1.8, zb - 0.02], [hx, 1.77, zb - 0.1], 0.009, 6);
    blob(g, M.brassMat, 0.016, 0.016, 0.016, hx, 1.78, zb - 0.105);
  }
  const hookA = hx0 + 0.1, hookB = hx1 - 0.1;
  if (lived) {
    // A flight jacket, hung by its collar.
    bev(g, M.leatherMat, 0.34, 0.56, 0.12, hookA, 1.46, zb - 0.1, 0.04, 2, 0.05, 0, 0.03);
    bev(g, M.leatherMat, 0.24, 0.08, 0.1, hookA, 1.74, zb - 0.1, 0.03, 2);
    for (const s of [-1, 1]) cyl(g, M.leatherMat, 0.05, 0.52, hookA + s * 0.19, 1.44, zb - 0.1, 'y', 8, 0.045);
    box(g, M.liveryMat, 0.08, 0.05, 0.006, hookA - 0.08, 1.58, zb - 0.163);
  } else {
    // A kit bag.
    cyl(g, C.blanket, 0.11, 0.46, hookA, 1.46, zb - 0.13, 'y', 10);
    box(g, M.rubberMat, 0.03, 0.22, 0.01, hookA, 1.7, zb - 0.1);
  }
  // Helmet on the other hook.
  blob(g, M.paintWhiteMat, 0.125, 0.13, 0.13, hookB, 1.6, zb - 0.16);
  bev(g, M.screenGlassMat, 0.17, 0.08, 0.05, hookB, 1.6, zb - 0.28, 0.02, 2);
  box(g, lived ? M.liveryMat : M.gunmetalMat, 0.03, 0.02, 0.24, hookB, 1.73, zb - 0.16);
  box(g, M.gunmetalMat, 0.2, 0.05, 0.1, hookB, 1.48, zb - 0.2);
}

/* =========================================================================
   THE BERTH
   ========================================================================= */

export function buildBerth(ship, roomId, { locker, designator }) {
  const M = ship;
  const room = ROOMS[roomId];
  // Both berths are built in Berth A's coordinates and slid aft together:
  // their bulkheads, doors and portholes stand alike.
  const dz = room.maxZ - 0.5;
  const lived = locker === 'ortega';
  const C = cloth(ship);

  const W = -5.6;          // hull plating
  const zS = -2.19;        // aft bulkhead face
  const zN = 0.39;         // forward bulkhead face

  // The bunk alcove and the desk stand against plating kept plain for them;
  // over the bunk the chamfer comes off so its stowage bin reaches the deckhead.
  dressRoomShell(ship, roomId, {
    keepClear: [
      { side: 'S', from: -5.6, to: -3.45, top: 3.0 },
      { side: 'W', from: zS + dz, to: -1.25 + dz, top: 3.0 },
      { side: 'W', from: -1.25 + dz, to: -0.9 + dz },
      { side: 'N', from: -3.98, to: -1.36 }
    ],
    fill: { panels: 4, vent: 1.2, conduit: 1.4, machinery: 0.8, light: 0.6 },
    seed: roomId === 'quarters' ? 11 : 17
  });

  const g = new THREE.Group();
  g.name = `berth-${roomId}`;
  g.position.z = dz;

  const own = lived ? M.footlockerOrtegaMat : M.footlockerCadetMat;
  const other = M.footlockerCadetMat;
  buildBunks(g, M, C, { x0: W + 0.1, x1: -3.5, zB: zS + 0.04, zF: -1.3, lived, drawerMats: [own, other], designator });
  buildDesk(g, M, C, { xW: W + 0.11, z0: -1.2, z1: 0.3, lived });
  buildForwardWall(g, M, C, { zN, lived });

  ship.group.add(g);
  ship.bake(g);

  // Colliders: the alcove, the desk to the forward bulkhead, the forward row.
  ship.addCollider(W, -3.45, -2.3 + dz, -1.26 + dz);
  ship.addCollider(W, -4.74, -1.26 + dz, 0.5 + dz);
  ship.addCollider(-3.98, -1.32, -0.1 + dz, 0.5 + dz);

  // Overhead fixture, the desk lamp, and the reading lamp in the lower berth.
  ship.addLight(`${roomId}-overhead`, [-3.2, 2.7, -0.9 + dz], 0xffd9a0, 2.0, 6.5);
  ship.addLight(`${roomId}-desk`, [-5.1, 1.05, 0.0 + dz], 0xffc070, lived ? 1.2 : 0.8, 3);
  ship.addLight(`${roomId}-bunk`, [-5.2, 1.0, -1.9 + dz], 0xffc070, lived ? 0.8 : 0.5, 2.4);

  if (room.route) {
    ship.interactiveTerminals.push({
      id: roomId, name: room.name, pos: [-3.2, 1.55, -1.2], route: room.route,
      prompt: 'ACCESS CREW QUARTERS & LOGS',
      // The desk with its terminal, and the bunk alcove with its drawers.
      aim: [
        aimBoxFromBounds(-5.5, -4.72, 0.3, 1.4, -1.2 + dz, 0.34 + dz),
        aimBoxFromBounds(-5.5, -3.45, 0, 2.86, -2.15 + dz, -1.28 + dz)
      ]
    });
  }
}
