/**
 * ship/rooms/bridge.js — The command bridge: the whole bow aft of the flight
 * deck, and the small standard parts every station in it is assembled from.
 *
 * A BRIDGE IS A ROOM OF STATIONS, NOT A ROOM WITH FURNITURE IN IT. Each
 * working position is one piece of manufactured equipment — a plinth, a body,
 * a raked instrument face, a meter bridge of bezelled screens — with an
 * operator's seat on rails in front of it, and each is built from the same
 * handful of parts (bezels, switch banks, gauges, keypads) so the whole bow
 * reads as fitted out by one yard and serviced by one crew for forty years.
 *
 *   port wall      TACTICAL — two-seat raked bank, meter bridge of scopes
 *   starboard wall NAV / SENSOR — three rack bays behind the star map
 *   aft bulkhead   crew lockers to port, damage control and a rack to stbd
 *   overhead       cable trays under the beams, an air duct, all fed aft
 *   centre         the club board, thrown from a deck emitter in the aisle
 *
 * The aisle from the spine door to the flight deck is left clear on purpose:
 * the stand, the board, and the pilots' stations are one straight walk.
 *
 * THE BOW IS BAKED AS ONE OBJECT. The bridge, the flight pods and the star
 * map share `bowFittings(ship)` — one group, one mesh per material — so three
 * builders cost the draw calls of one. What is bolted into the structure
 * (under the canopy, along the raked shoulders) goes into `bowStructure`,
 * which is part of the hull and is baked with it.
 */

import * as THREE from "three";
import { boltLine, boltRing, placard } from "../../materials/pbr-kit.js";
import { createClubHoloTexture } from "../../materials/textures.js";
import { ROOMS } from "../../ship-rooms.js";
import {
  dressRoomShell, box, cyl, tube, extrude, chamferedRect, chamferedHole, lamp, cabinet
} from "../kit.js";

/** Where the club board hangs, and where a player stands to read it. */
export const CLUB_BOARD_POS = [0, 1.55, 2.7];
export const BRIDGE_STAND = [0, 1.55, 1.3];

/* =========================================================================
   SHARED BOW PARTS (used by cockpit.js and starmap.js as well)
   ========================================================================= */

const BOW = new WeakMap();
const STRUCT = new WeakMap();

/** The one baked group every free-standing fitting in the bow goes into. */
export function bowFittings(ship) {
  let g = BOW.get(ship);
  if (!g) {
    g = new THREE.Group();
    g.name = 'bow-fittings';
    ship.group.add(g);
    ship.bake(g);
    BOW.set(ship, g);
  }
  return g;
}

/** Equipment bolted into the structure itself: part of the hull object. */
export function bowStructure(ship) {
  let g = STRUCT.get(ship);
  if (!g) {
    g = new THREE.Group();
    g.name = 'bow-structure';
    ship.hull.add(g);
    STRUCT.set(ship, g);
  }
  return g;
}

/**
 * A group whose local frame lies on a plane: x along `u`, y along `v` (made
 * square to `u`), z out of the face (u × v). Everything mounted on a raked
 * face is written once, flat, in these coordinates.
 */
export function facePlate(parent, origin, u, v) {
  const U = new THREE.Vector3(...u).normalize();
  const V0 = new THREE.Vector3(...v);
  const V = V0.sub(U.clone().multiplyScalar(V0.dot(U))).normalize();
  const N = new THREE.Vector3().crossVectors(U, V);
  const g = new THREE.Group();
  g.position.set(...origin);
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(U, V, N));
  parent.add(g);
  return g;
}

/**
 * A section extruded along a wall: `pts` are (across, up) pairs, `U` is the
 * horizontal direction "across" points in the world. The section runs `len`
 * along U × up from `origin`. Consoles are sections, not boxes.
 */
export function profileAlong(parent, mat, pts, len, origin, U) {
  const g = facePlate(parent, origin, U, [0, 1, 0]);
  const shape = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
  extrude(g, mat, shape, len);
  return g;
}

const planeCache = new Map();
function planeGeo(w, h) {
  const k = `${Math.round(w * 1000)}_${Math.round(h * 1000)}`;
  let g = planeCache.get(k);
  if (!g) { g = new THREE.PlaneGeometry(w, h); planeCache.set(k, g); }
  return g;
}

/** A CRT recessed in a chamfered bezel with corner screws and a hood lip, facing +z. */
export function screenBezel(g, M, mat, w, h, x = 0, y = 0, z = 0, { lip = true } = {}) {
  const b = 0.034;
  const s = chamferedRect(w + 2 * b, h + 2 * b, 0.024, ['tl', 'tr', 'bl', 'br'], x, y);
  s.holes.push(chamferedHole(w, h, 0.012, ['tl', 'tr', 'bl', 'br'], x, y));
  const f = extrude(g, M.gunmetalMat, s, 0.022);
  f.position.z = z;
  box(g, M.ventMat, w + 0.01, h + 0.01, 0.008, x, y, z + 0.004);
  const scr = new THREE.Mesh(planeGeo(w, h), mat);
  scr.position.set(x, y, z + 0.011);
  g.add(scr);
  if (lip) box(g, M.trimMat, w + 2 * b + 0.02, 0.012, 0.06, x, y + h / 2 + b + 0.004, z + 0.03);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    cyl(g, M.steelMat, 0.006, 0.006, x + sx * (w / 2 + b * 0.55), y + sy * (h / 2 + b * 0.55), z + 0.024, 'z', 6);
  }
}

/** A row of toggle switches on a plate, bats thrown up, optional guards and pilot lamps. */
export function toggleBank(g, M, n, x, y, z = 0, { pitch = 0.035, guard = false, lamps = true } = {}) {
  box(g, M.gunmetalMat, n * pitch + 0.03, 0.078, 0.01, x, y, z + 0.005);
  for (let i = 0; i < n; i++) {
    const tx = x - ((n - 1) * pitch) / 2 + i * pitch;
    cyl(g, M.steelMat, 0.007, 0.012, tx, y - 0.012, z + 0.016, 'z', 6);
    box(g, M.steelMat, 0.006, 0.03, 0.006, tx, y - 0.002, z + 0.026, 0.65);
    if (guard) {
      for (const s of [-1, 1]) box(g, M.trimMat, 0.003, 0.036, 0.03, tx + s * 0.013, y - 0.006, z + 0.024);
    }
    if (lamps && i % 2 === 0) {
      lamp(g, M, tx, y + 0.026, z + 0.008, (i / 2) % 3 === 1 ? M.greenLampMat : M.amberLampMat, 0.006);
    }
  }
}

/** A rotary knob with a skirt and an index line, facing +z. */
export function knob(g, M, x, y, z = 0, r = 0.022) {
  cyl(g, M.trimMat, r * 1.4, 0.006, x, y, z + 0.003, 'z', 12);
  cyl(g, M.gunmetalMat, r, 0.026, x, y, z + 0.019, 'z', 10);
  box(g, M.steelMat, 0.004, r * 0.9, 0.004, x, y + r * 0.45, z + 0.033);
}

/** A keypad block, facing +z. */
export function keypad(g, M, x, y, z = 0, cols = 3, rows = 4) {
  const p = 0.028;
  box(g, M.gunmetalMat, cols * p + 0.02, rows * p + 0.02, 0.012, x, y, z + 0.006);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    box(g, M.steelMat, 0.021, 0.019, 0.008, x + (c - (cols - 1) / 2) * p, y + ((rows - 1) / 2 - r) * p, z + 0.016);
  }
}

/** A round dial gauge in a bezel, facing +z. */
export function gauge(g, M, mat, x, y, z = 0, r = 0.05) {
  cyl(g, M.trimMat, r + 0.014, 0.02, x, y, z + 0.01, 'z', 16);
  cyl(g, mat, r, 0.022, x, y, z + 0.012, 'z', 16);
}

/** A U grab handle standing off a face, facing +z, running along x. */
export function grabHandle(g, M, x, y, z = 0, len = 0.24, { vertical = false } = {}) {
  if (vertical) {
    cyl(g, M.steelMat, 0.013, len, x, y, z + 0.06, 'y', 8);
    for (const s of [-1, 1]) box(g, M.gunmetalMat, 0.026, 0.026, 0.07, x, y + s * (len / 2 - 0.02), z + 0.035);
  } else {
    cyl(g, M.steelMat, 0.013, len, x, y, z + 0.06, 'x', 8);
    for (const s of [-1, 1]) box(g, M.gunmetalMat, 0.026, 0.026, 0.07, x + s * (len / 2 - 0.02), y, z + 0.035);
  }
}

/**
 * Colliders for a convex footprint `pts` ([x, z] …), stepped in slabs of
 * `step` along z the way the hull fills the nose.
 */
export function fillPolygon(ship, pts, step = 0.1) {
  const zs = pts.map(p => p[1]);
  const zMin = Math.min(...zs), zMax = Math.max(...zs);
  const spanAt = z => {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length];
      if (z < Math.min(z1, z2) - 1e-9 || z > Math.max(z1, z2) + 1e-9) continue;
      if (Math.abs(z2 - z1) < 1e-9) xs.push(x1, x2);
      else xs.push(x1 + (x2 - x1) * ((z - z1) / (z2 - z1)));
    }
    return xs;
  };
  for (let z = zMin; z < zMax - 1e-6; z += step) {
    const z1 = Math.min(z + step, zMax);
    const xs = [...spanAt(z), ...spanAt(z1)];
    for (const p of pts) if (p[1] >= z && p[1] <= z1) xs.push(p[0]);
    if (xs.length >= 2) ship.addCollider(Math.min(...xs), Math.max(...xs), z, z1);
  }
}

/**
 * A crew seat, facing +z, on the deck at the origin: floor rails and a
 * swivel column, a quilted pan with side bolsters, a raked back with winged
 * headrest, armrests, and a harness in faded livery webbing.
 */
export function crewSeat(parent, M, { harness = true, arms = true, rails = true } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  if (rails) {
    for (const s of [-1, 1]) {
      box(g, M.trimMat, 0.04, 0.03, 0.62, s * 0.15, 0.015, 0);
      for (const e of [-1, 1]) box(g, M.gunmetalMat, 0.06, 0.04, 0.04, s * 0.15, 0.02, e * 0.31);
    }
  }
  box(g, M.gunmetalMat, 0.4, 0.03, 0.34, 0, 0.045, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, M.steelMat, 0.012, 0.012, sx * 0.17, 0.066, sz * 0.14, 'y', 6);
  cyl(g, M.gunmetalMat, 0.075, 0.08, 0, 0.1, 0, 'y', 10, 0.1);
  cyl(g, M.rubberMat, 0.058, 0.12, 0, 0.2, 0, 'y', 10);
  cyl(g, M.steelMat, 0.045, 0.14, 0, 0.32, 0, 'y', 10);
  box(g, M.gunmetalMat, 0.3, 0.05, 0.3, 0, 0.39, 0);
  // Height lever under the pan.
  box(g, M.steelMat, 0.014, 0.014, 0.16, 0.2, 0.37, 0.1);
  cyl(g, M.rubberMat, 0.016, 0.05, 0.2, 0.37, 0.19, 'z', 8);

  // Pan: shell, four quilted rolls, bolsters and a front roll.
  box(g, M.trimMat, 0.56, 0.05, 0.52, 0, 0.43, 0.01);
  for (let i = 0; i < 4; i++) box(g, M.leatherMat, 0.085, 0.05, 0.44, -0.135 + i * 0.09, 0.475, 0.0);
  for (const s of [-1, 1]) box(g, M.leatherMat, 0.08, 0.085, 0.46, s * 0.235, 0.49, 0.01);
  cyl(g, M.leatherMat, 0.035, 0.46, 0, 0.47, 0.245, 'x', 8);

  // Back, leaning aft.
  const back = new THREE.Group();
  back.position.set(0, 0.45, -0.23);
  back.rotation.x = -0.18;
  g.add(back);
  box(back, M.trimMat, 0.56, 0.8, 0.05, 0, 0.42, -0.035);
  for (let j = 0; j < 6; j++) box(back, M.leatherMat, 0.4, 0.1, 0.05, 0, 0.1 + j * 0.11, 0.01);
  for (const s of [-1, 1]) box(back, M.leatherMat, 0.075, 0.64, 0.08, s * 0.24, 0.38, 0.03, 0, -s * 0.3, 0);
  for (const s of [-1, 1]) cyl(back, M.steelMat, 0.012, 0.12, s * 0.08, 0.86, -0.01, 'y', 6);
  box(back, M.leatherMat, 0.3, 0.2, 0.08, 0, 1.0, 0.01);
  for (const s of [-1, 1]) box(back, M.leatherMat, 0.06, 0.2, 0.1, s * 0.17, 1.0, 0.04, 0, -s * 0.4, 0);
  box(back, M.trimMat, 0.32, 0.03, 0.09, 0, 1.115, -0.005);
  if (harness) {
    for (const s of [-1, 1]) box(back, M.liveryMat, 0.045, 0.62, 0.008, s * 0.1, 0.55, 0.041);
    for (const s of [-1, 1]) box(back, M.steelMat, 0.05, 0.03, 0.012, s * 0.1, 0.62, 0.046);
  }
  if (harness) {
    // Lap belts to a centre buckle, and the crotch strap under it.
    for (const s of [-1, 1]) box(g, M.liveryMat, 0.2, 0.008, 0.045, s * 0.13, 0.505, 0.07, 0, s * 0.35, 0);
    box(g, M.liveryMat, 0.045, 0.008, 0.16, 0, 0.503, 0.16);
    cyl(g, M.steelMat, 0.034, 0.012, 0, 0.512, 0.1, 'y', 12);
    cyl(g, M.brassMat, 0.016, 0.014, 0, 0.516, 0.1, 'y', 8);
  }
  if (arms) {
    for (const s of [-1, 1]) {
      box(g, M.gunmetalMat, 0.035, 0.22, 0.035, s * 0.31, 0.56, -0.04);
      box(g, M.leatherMat, 0.08, 0.05, 0.36, s * 0.31, 0.695, 0.0);
      box(g, M.trimMat, 0.085, 0.06, 0.04, s * 0.31, 0.695, 0.19);
    }
  }
  return g;
}

/* =========================================================================
   THE BRIDGE
   ========================================================================= */

/**
 * The tactical bank on the port wall: a two-seat raked console with a meter
 * bridge of three scopes over it, working outboard. The seats face the wall;
 * the room behind them stays the aisle.
 */
function buildTactical(ship, g) {
  const M = ship;
  const X = -5.6, z0 = 0.8, z1 = 3.05, len = z1 - z0, zc = (z0 + z1) / 2;
  // Lower body: toe recess, desk ledge, raked face, flat top to the wall.
  profileAlong(g, M.panelDarkMat, [
    [0.06, 0], [0.56, 0], [0.56, 0.09], [0.62, 0.11], [0.62, 0.7], [0.74, 0.73],
    [0.74, 0.78], [0.64, 0.81], [0.36, 1.22], [0.3, 1.26], [0.06, 1.26]
  ], len, [X, 0, z0], [1, 0, 0]);
  // Meter bridge: the screen housing on top, leaning back a touch.
  profileAlong(g, M.panelMat, [
    [0.06, 1.26], [0.38, 1.26], [0.3, 1.9], [0.22, 1.98], [0.06, 1.98]
  ], len, [X, 0, z0], [1, 0, 0]);
  // Kick strip, desk edge and end cheeks.
  box(g, M.gunmetalMat, 0.04, 0.06, len, X + 0.58, 0.07, zc);
  box(g, M.trimMat, 0.05, 0.05, len - 0.02, X + 0.72, 0.76, zc);
  for (const z of [z0 - 0.02, z1 + 0.02]) {
    box(g, M.ribMat, 0.72, 1.3, 0.04, X + 0.4, 0.65, z);
    box(g, M.ribMat, 0.36, 0.72, 0.04, X + 0.22, 1.62, z);
  }
  // Meter bridge top: a visor over the screens and a loom along the back.
  box(g, M.trimMat, 0.2, 0.025, len, X + 0.3, 1.99, zc);
  cyl(g, M.cableMat, 0.03, len, X + 0.12, 2.02, zc, 'z', 8);
  cyl(g, M.liveryMat, 0.018, len, X + 0.19, 2.01, zc, 'z', 8);

  // The raked face (lower body): local x runs aft along the bank.
  const face = facePlate(g, [X + 0.5, 1.015, zc], [0, 0, -1], [-0.28, 0.41, 0]);
  keypad(face, M, -0.93, 0.02, 0, 3, 4);
  knob(face, M, -0.78, 0.09); knob(face, M, -0.78, -0.03); knob(face, M, -0.7, 0.03, 0, 0.018);
  screenBezel(face, M, M.crtGreenMat, 0.22, 0.14, -0.38, 0.04);
  toggleBank(face, M, 7, -0.38, -0.15);
  toggleBank(face, M, 8, 0.12, 0.1, 0, { guard: true });
  toggleBank(face, M, 8, 0.12, -0.04, 0);
  for (let i = 0; i < 6; i++) lamp(face, M, -0.0 + i * 0.05, -0.15, 0, i % 2 ? M.amberLampMat : M.greenLampMat, 0.008);
  gauge(face, M, M.dialGaugePsiMat, 0.62, 0.02, 0, 0.055);
  gauge(face, M, M.dialGaugeBarMat, 0.82, 0.02, 0, 0.055);
  knob(face, M, 0.97, 0.08); knob(face, M, 0.97, -0.05);
  // Keyboards on the desk ledge, one per seat.
  for (const z of [1.45, 2.55]) {
    box(g, M.keyboardMat, 0.1, 0.018, 0.44, X + 0.69, 0.805, z, 0, 0, -0.29);
  }

  // The meter bridge face: three scopes.
  const mb = facePlate(g, [X + 0.34, 1.58, zc], [0, 0, -1], [-0.08, 0.64, 0]);
  const scopes = [M.crtRadarMat, M.crtAmberMat, M.crtReactorMat];
  [-0.74, 0, 0.74].forEach((u, i) => screenBezel(mb, M, scopes[i], 0.4, 0.28, u, -0.02));
  for (const u of [-0.37, 0.37]) {
    for (let k = 0; k < 4; k++) lamp(mb, M, u, 0.12 - k * 0.065, 0, k === 1 ? M.greenLampMat : M.amberLampMat, 0.009);
  }
  for (const u of [-1.06, 1.06]) knob(mb, M, u, -0.05, 0, 0.02);
  const tag = placard('TAC-1  WEAPONS / DEFENCE', { w: 0.5, h: 0.05 });
  tag.position.set(0, 0.25, 0.003);
  mb.add(tag);

  // Grab handles on the end cheeks, and a loom dropping into the deck.
  grabHandle(facePlate(g, [X + 0.5, 1.0, z1 + 0.04], [1, 0, 0], [0, 1, 0]), M, 0, 0, 0, 0.24);
  tube(g, M.cableMat, [[X + 0.62, 0.62, 1.98], [X + 0.72, 0.3, 2.0], [X + 0.7, 0.04, 2.02]], 0.02, 6);

  // Two operator seats facing the bank.
  for (const z of [1.45, 2.55]) {
    const s = crewSeat(g, M);
    s.position.set(-4.28, 0, z);
    s.rotation.y = -Math.PI / 2;
  }

  ship.addCollider(-5.6, -4.84, 0.76, 3.09);
  ship.addCollider(-4.62, -3.96, 1.13, 1.77);
  ship.addCollider(-4.62, -3.96, 2.23, 2.87);
  ship.addLight('bridge-tactical', [-4.7, 1.7, 1.95], 0xffa040, 1.3, 4.5);
}

/**
 * The nav and sensor bank: three rack bays bolted to the starboard wall
 * behind the star map, so a navigator at the table has the raw returns at
 * their back. The middle bay carries a hooded scope at eye height.
 */
function buildNavBank(ship, g) {
  const M = ship;
  const X = 5.6, x0 = 5.18, z0 = 0.72, z1 = 3.12;
  const bays = [1.12, 1.92, 2.72];
  box(g, M.gunmetalMat, X - x0 - 0.05, 0.1, z1 - z0, (X + x0 + 0.05) / 2, 0.05, (z0 + z1) / 2);
  for (const zc of bays) box(g, M.panelDarkMat, X - x0 - 0.02, 2.12, 0.76, (X + x0 + 0.02) / 2, 1.16, zc);
  for (let i = 0; i <= 3; i++) {
    const z = z0 + i * 0.8;
    box(g, M.ribMat, 0.05, 2.22, 0.04, x0 - 0.01, 1.12, Math.min(Math.max(z, z0 + 0.02), z1 - 0.02));
  }
  box(g, M.trimMat, X - x0 + 0.02, 0.04, z1 - z0 + 0.02, (X + x0 - 0.02) / 2, 2.245, (z0 + z1) / 2);
  cyl(g, M.cableMat, 0.035, z1 - z0, X - 0.12, 2.3, (z0 + z1) / 2, 'z', 8);
  cyl(g, M.cableMat, 0.025, z1 - z0, X - 0.22, 2.29, (z0 + z1) / 2, 'z', 8);

  // Each bay's face: local x = world +z, y = world y, z out of the rack (−x).
  const [b1, b2, b3] = bays.map(zc => facePlate(g, [x0, 0, zc], [0, 0, 1], [0, 1, 0]));

  box(b1, M.rackPanelMat, 0.7, 0.78, 0.012, 0, 0.62, 0.006);
  gauge(b1, M, M.dialGaugePsiMat, -0.17, 1.52, 0, 0.07);
  gauge(b1, M, M.dialGaugeBarMat, 0.17, 1.52, 0, 0.07);
  for (let i = 0; i < 7; i++) lamp(b1, M, -0.24 + i * 0.08, 1.3, 0, i === 3 ? M.greenLampMat : M.amberLampMat, 0.01);
  screenBezel(b1, M, M.crtAmberMat, 0.32, 0.2, 0, 1.86);
  toggleBank(b1, M, 8, 0, 1.14);
  grabHandle(b1, M, 0.3, 0.62, 0.012, 0.3, { vertical: true });

  // The sensor scope, deep-hooded against the room light.
  screenBezel(b2, M, M.crtRadarMat, 0.44, 0.34, 0, 1.52, 0, { lip: false });
  box(b2, M.gunmetalMat, 0.6, 0.02, 0.18, 0, 1.76, 0.09);
  for (const s of [-1, 1]) box(b2, M.gunmetalMat, 0.02, 0.46, 0.18, s * 0.29, 1.53, 0.09);
  for (let i = 0; i < 5; i++) knob(b2, M, -0.24 + i * 0.12, 1.2, 0, 0.02);
  box(b2, M.trimMat, 0.7, 0.025, 0.2, 0, 1.02, 0.1);
  for (const s of [-1, 1]) box(b2, M.gunmetalMat, 0.025, 0.1, 0.16, s * 0.33, 0.96, 0.08);
  box(b2, M.rackPanelMat, 0.7, 0.72, 0.012, 0, 0.5, 0.006);
  const navTag = placard('NAV / SENSOR  03', { w: 0.34, h: 0.06 });
  navTag.position.set(0, 1.98, 0.004);
  b2.add(navTag);

  box(b3, M.rackPanelMat, 0.7, 0.8, 0.012, 0, 1.5, 0.006);
  toggleBank(b3, M, 9, 0, 0.98, 0, { guard: true });
  toggleBank(b3, M, 9, 0, 0.84);
  keypad(b3, M, -0.2, 0.52, 0, 3, 4);
  screenBezel(b3, M, M.crtGreenMat, 0.24, 0.16, 0.14, 0.54);
  for (let i = 0; i < 6; i++) box(b3, M.ventMat, 0.56, 0.014, 0.006, 0, 0.18 + i * 0.03, 0.004);
  grabHandle(b3, M, -0.3, 0.62, 0.012, 0.3, { vertical: true });

  ship.addCollider(5.13, 5.6, 0.7, 3.14);
  ship.addLight('bridge-nav', [4.8, 1.8, 1.9], 0xffa040, 0.9, 3.5);
}

/**
 * The aft bulkhead: four crew lockers to port of the spine door, a damage
 * control panel and an equipment rack to starboard. The metre in front of
 * the door is kept clear.
 */
function buildAftBulkhead(ship, g) {
  const M = ship;
  const Z = 0.61;
  // Lockers.
  const x0 = -4.6, pitch = 0.64, depth = 0.42, h = 2.1;
  box(g, M.gunmetalMat, pitch * 4, 0.1, depth - 0.04, x0 + pitch * 2, 0.05, Z + 0.05 + (depth - 0.04) / 2);
  box(g, M.trimMat, pitch * 4 + 0.04, 0.04, depth + 0.02, x0 + pitch * 2, h + 0.02, Z + 0.05 + depth / 2);
  const labels = ['EVA', 'O2', 'MED', 'CREW'];
  for (let i = 0; i < 4; i++) {
    const cx = x0 + pitch * (i + 0.5);
    box(g, M.panelMat, pitch - 0.02, h - 0.1, depth, cx, 0.1 + (h - 0.1) / 2, Z + 0.05 + depth / 2);
    const f = facePlate(g, [cx, 0, Z + 0.05 + depth], [1, 0, 0], [0, 1, 0]);
    box(f, M.panelDarkMat, pitch - 0.12, 1.72, 0.012, 0, 1.08, 0.006);
    for (const y of [0.34, 0.4, 0.46, 1.78, 1.84, 1.9]) box(f, M.ventMat, 0.3, 0.014, 0.008, 0, y, 0.014);
    for (const y of [0.4, 1.84]) box(f, M.gunmetalMat, 0.34, 0.12, 0.004, 0, y, 0.009);
    grabHandle(f, M, pitch / 2 - 0.1, 1.1, 0.012, 0.16, { vertical: true });
    for (const y of [0.35, 1.85]) cyl(f, M.steelMat, 0.012, 0.1, -pitch / 2 + 0.05, y, 0.02, 'y', 6);
    const tag = placard(`${labels[i]}  ${String(11 + i).padStart(3, '0')}`, { w: 0.26, h: 0.07 });
    tag.position.set(0, 1.5, 0.014);
    f.add(tag);
  }
  ship.addCollider(-4.64, -1.94, 0.6, 1.13);

  // Damage control: a breaker box, an extinguisher on its bracket, a med kit.
  const dc = facePlate(g, [2.18, 0, Z + 0.02], [1, 0, 0], [0, 1, 0]);
  box(dc, M.panelDarkMat, 0.9, 0.82, 0.12, 0, 1.5, 0.06);
  box(dc, M.panelMat, 0.86, 0.78, 0.02, 0, 1.5, 0.13);
  for (let r = 0; r < 3; r++) toggleBank(dc, M, 10, 0, 1.7 - r * 0.14, 0.14, { pitch: 0.04, lamps: r === 0 });
  box(dc, M.hazardMat, 0.86, 0.05, 0.006, 0, 1.93, 0.141);
  for (const s of [-1, 1]) cyl(dc, M.steelMat, 0.012, 0.18, s * 0.44, 1.5, 0.13, 'y', 6);
  const dcTag = placard('DAMAGE CONTROL', { w: 0.34, h: 0.06 });
  dcTag.position.set(0, 1.2, 0.142);
  dc.add(dcTag);
  cyl(dc, M.liveryMat, 0.075, 0.5, -0.25, 0.55, 0.12, 'y', 12);
  cyl(dc, M.gunmetalMat, 0.04, 0.08, -0.25, 0.84, 0.12, 'y', 8);
  box(dc, M.steelMat, 0.02, 0.1, 0.02, -0.25, 0.92, 0.12);
  tube(dc, M.rubberMat, [[-0.25, 0.9, 0.12], [-0.16, 0.86, 0.17], [-0.15, 0.5, 0.2]], 0.012, 6);
  for (const y of [0.4, 0.7]) box(dc, M.gunmetalMat, 0.2, 0.03, 0.2, -0.25, y, 0.1);
  box(dc, M.paintWhiteMat, 0.32, 0.24, 0.12, 0.22, 0.7, 0.08);
  box(dc, M.liveryMat, 0.06, 0.16, 0.004, 0.22, 0.7, 0.142);
  box(dc, M.liveryMat, 0.16, 0.06, 0.004, 0.22, 0.7, 0.142);
  ship.addCollider(1.7, 2.66, 0.6, 0.93);

  // Equipment rack: two cabinets side by side.
  for (const [cx, scr] of [[3.43, M.crtGreenMat], [4.11, M.crtAmberMat]]) {
    const c = cabinet(g, M, 0.66, 2.05, 0.3, { screen: scr, seed: Math.round(cx * 10) });
    c.position.set(cx, 0, Z + 0.05);
  }
  box(g, M.ribMat, 0.04, 2.1, 0.34, 3.77, 1.05, Z + 0.22);
  ship.addCollider(3.05, 4.47, 0.6, 1.0);
}

/**
 * The deckhead services: a cable tray under the beams on each side of the
 * aisle and a flanged air duct to port, all running forward into the fascia
 * where the nose deckhead steps down.
 */
function buildOverhead(ship, g) {
  const M = ship;
  const z0 = 0.98, z1 = 4.22, len = z1 - z0, zc = (z0 + z1) / 2;
  for (const x of [-2.63, 2.63]) {
    box(g, M.trimMat, 0.28, 0.012, len, x, 3.08, zc);
    for (const s of [-1, 1]) box(g, M.trimMat, 0.012, 0.06, len, x + s * 0.14, 3.11, zc);
    cyl(g, M.cableMat, 0.03, len, x - 0.07, 3.117, zc, 'z', 8);
    cyl(g, M.cableMat, 0.022, len, x + 0.0, 3.109, zc, 'z', 8);
    cyl(g, M.liveryMat, 0.018, len, x + 0.07, 3.105, zc, 'z', 6);
    for (let z = z0 + 0.3; z < z1; z += 0.8) {
      box(g, M.gunmetalMat, 0.32, 0.025, 0.03, x, 3.066, z);
      for (const s of [-1, 1]) cyl(g, M.steelMat, 0.008, 0.2, x + s * 0.15, 3.17, z, 'y', 6);
    }
  }
  // Air duct, port of the aisle.
  const dx = -1.7;
  cyl(g, M.trimMat, 0.11, len, dx, 3.12, zc, 'z', 14);
  for (let z = z0 + 0.05; z < z1; z += 1.05) cyl(g, M.gunmetalMat, 0.13, 0.035, dx, 3.12, z, 'z', 14);
  for (let z = z0 + 0.55; z < z1; z += 1.05) box(g, M.gunmetalMat, 0.26, 0.03, 0.04, dx, 3.245, z);
  cyl(g, M.trimMat, 0.11, 0.26, dx, 3.26, z0, 'y', 14);
  for (const z of [1.9, 3.3]) {
    box(g, M.gunmetalMat, 0.16, 0.02, 0.3, dx, 3.005, z);
    for (let i = 0; i < 5; i++) box(g, M.ventMat, 0.13, 0.006, 0.02, dx, 2.993, z - 0.1 + i * 0.05);
  }
}

/**
 * The club board, and the emitter in the deck that throws it: an armoured
 * housing flush enough to walk over, a brass lens collar, cooling fins, a
 * painted keep-off ring, and its feed run under a cover plate to the tactical
 * bank. The beam is faint and warm; the board is the thing that is lit.
 */
function buildClubBoard(ship, g) {
  const M = ship;
  const [bx, , bz] = CLUB_BOARD_POS;
  const holoScreenGroup = new THREE.Group();
  holoScreenGroup.position.set(...CLUB_BOARD_POS);
  holoScreenGroup.userData.noMerge = true;

  const clubTex = createClubHoloTexture();
  ship.clubHoloMat = new THREE.MeshBasicMaterial({
    map: clubTex,
    transparent: true,
    opacity: 0.95,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    depthWrite: false
  });
  const screenGeom = new THREE.PlaneGeometry(1.8, 1.0125);
  // The readable face looks aft, at the stand; a second face for the far side.
  const holoFront = new THREE.Mesh(screenGeom, ship.clubHoloMat);
  holoFront.rotation.y = Math.PI;
  holoFront.position.set(0, 0, -0.005);
  const holoBack = new THREE.Mesh(screenGeom, ship.clubHoloMat);
  holoBack.position.set(0, 0, 0.005);
  holoScreenGroup.add(holoFront, holoBack);
  ship.clubHoloGroup = holoScreenGroup;

  // The emitter.
  const e = new THREE.Group();
  e.position.set(bx, 0, bz);
  g.add(e);
  const oct = cyl(e, M.gunmetalMat, 0.42, 0.02, 0, 0.01, 0, 'y', 8);
  oct.rotation.y = Math.PI / 8;
  const bolts = boltRing(0.37, 12, M.steelMat, { size: 0.012 });
  bolts.position.y = 0.024;
  e.add(bolts);
  cyl(e, M.trimMat, 0.3, 0.05, 0, 0.045, 0, 'y', 16, 0.33);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    box(e, M.ventMat, 0.012, 0.018, 0.07, Math.sin(a) * 0.25, 0.078, Math.cos(a) * 0.25, 0, a, 0);
  }
  cyl(e, M.brassMat, 0.17, 0.035, 0, 0.078, 0, 'y', 16);
  cyl(e, M.gunmetalMat, 0.135, 0.01, 0, 0.098, 0, 'y', 16);
  cyl(e, M.amberLampMat, 0.1, 0.008, 0, 0.1, 0, 'y', 16);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    lamp(facePlate(e, [Math.sin(a) * 0.36, 0.021, Math.cos(a) * 0.36], [1, 0, 0], [0, 0, -1]), M, 0, 0, 0, M.amberLampMat, 0.008);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.53, 8, 1, Math.PI / 8), M.hazardMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.003;
  e.add(ring);

  // Feed: under a bolted cover plate, aft to z 2.0 and across to the bank.
  const cover = (x0, x1, z0, z1) => {
    const w = x1 - x0, d = z1 - z0;
    box(g, M.trimMat, w, 0.014, d, (x0 + x1) / 2, 0.007, (z0 + z1) / 2);
    const along = w > d;
    const n = Math.max(2, Math.round((along ? w : d) / 0.4));
    for (const s of [-1, 1]) {
      const p0 = along ? [x0 + 0.05, 0.016, (z0 + z1) / 2 + s * (d / 2 - 0.025)] : [(x0 + x1) / 2 + s * (w / 2 - 0.025), 0.016, z0 + 0.05];
      const p1 = along ? [x1 - 0.05, 0.016, (z0 + z1) / 2 + s * (d / 2 - 0.025)] : [(x0 + x1) / 2 + s * (w / 2 - 0.025), 0.016, z1 - 0.05];
      g.add(boltLine(p0, p1, n, M.steelMat, { size: 0.01, normalAxis: 'y' }));
    }
  };
  cover(bx - 0.07, bx + 0.07, 1.93, bz - 0.44);
  cover(-4.84, bx - 0.07, 1.93, 2.07);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.14, 1.44, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xe0a048, transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
    })
  );
  beam.position.set(bx, 0.1 + 0.72, bz);
  beam.userData.noMerge = true;
  ship.clubHoloBeam = beam;
  g.add(beam, holoScreenGroup);
}

/**
 * The shoulder stations: engineering to port, comms to starboard, each a low
 * raked console under the two slot viewports so the operator looks out past
 * the screens. They are bolted to the shoulder plating (hull), stand clear of
 * its lining, and stay below the viewports' sills.
 */
function buildShoulderStations(ship, F) {
  const M = ship;
  const S = bowStructure(ship);
  const um = 1.78, half = 0.4, D = 0.66;
  // Three modules, not one long extrusion: a station is built from cabinets,
  // and a single diagonal body would be measured as the whole shoulder.
  const modules = [-0.82, 0, 0.82];
  for (const sx of [-1, 1]) {
    const A = [sx * 5.6, 3.2], B = [sx * 2.6, 5.2];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dir = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
    const nIn = [-sx * 2 / L, -3 / L];
    const at = (u, d) => [A[0] + dir[0] * u + nIn[0] * d, A[1] + dir[1] * u + nIn[1] * d];
    const U = [nIn[0], 0, nIn[1]];
    const N = [-U[2], 0, U[0]];
    const fwd = N[0] * dir[0] + N[2] * dir[1] > 0;
    for (const m of modules) {
      const a = um + m - half, b = um + m + half;
      const start = fwd ? at(a, 0) : at(b, 0);
      profileAlong(S, M.panelDarkMat, [
        [0.12, 0], [0.5, 0], [0.5, 0.08], [0.55, 0.1], [0.55, 0.7], [0.64, 0.73],
        [0.64, 0.78], [0.56, 0.81], [0.38, 1.2], [0.32, 1.26], [0.12, 1.26]
      ], b - a, [start[0], 0, start[1]], U);
      fillPolygon(ship, [at(a, 0), at(b, 0), at(b, D), at(a, D)]);
    }

    // The raked faces: x along the shoulder, y up the rake, z to the operator.
    const fo = at(um, 0.47);
    let fu = [dir[0], 0, dir[1]];
    const fv = [nIn[0] * -0.18, 0.39, nIn[1] * -0.18];
    const cross = [fu[1] * fv[2] - fu[2] * fv[1], fu[2] * fv[0] - fu[0] * fv[2], fu[0] * fv[1] - fu[1] * fv[0]];
    if (cross[0] * nIn[0] + cross[2] * nIn[1] < 0) fu = [-fu[0], 0, -fu[2]];
    // Mounted on the modules, so it is part of them (and of the hull).
    const f = facePlate(S, [fo[0], 1.005, fo[1]], fu, fv);
    for (const m of modules) box(f, M.amberLampMat, 2 * half - 0.1, 0.006, 0.006, m, 0.2, 0.006);
    if (sx < 0) {
      screenBezel(f, M, M.crtReactorMat, 0.3, 0.2, -0.95, 0.02);
      for (let k = 0; k < 3; k++) knob(f, M, -0.63, 0.1 - k * 0.09, 0, 0.02);
      toggleBank(f, M, 8, 0, 0.09, 0, { guard: true });
      toggleBank(f, M, 8, 0, -0.07, 0);
      gauge(f, M, M.dialGaugePsiMat, -0.3, 0.02, 0, 0.055);
      gauge(f, M, M.dialGaugeBarMat, 0.3, 0.02, 0, 0.055);
      screenBezel(f, M, M.crtAmberMat, 0.3, 0.2, 0.8, 0.02);
      keypad(f, M, 1.12, 0.0, 0, 3, 4);
    } else {
      screenBezel(f, M, M.crtGreenMat, 0.3, 0.2, -0.95, 0.02);
      for (let k = 0; k < 3; k++) knob(f, M, -0.63, 0.1 - k * 0.09, 0, 0.022);
      keypad(f, M, -0.25, 0.0, 0, 3, 4);
      box(f, M.gunmetalMat, 0.28, 0.24, 0.004, 0.12, 0.01, 0.001);
      for (let k = 0; k < 7; k++) box(f, M.ventMat, 0.24, 0.012, 0.006, 0.12, 0.1 - k * 0.03, 0.004);
      screenBezel(f, M, M.crtRadarMat, 0.3, 0.2, 0.8, 0.02);
      toggleBank(f, M, 5, 1.1, 0.08, 0, { guard: true });
      toggleBank(f, M, 5, 1.1, -0.07, 0);
    }
    for (const m of [-0.82, 0.82]) {
      const kb = at(um + m, 0.6);
      box(F, M.keyboardMat, 0.5, 0.02, 0.13, kb[0], 0.805, kb[1], 0, Math.atan2(-dir[1], dir[0]), 0);
    }

    // Operator's stool, bolted to the deck facing the console.
    const st = at(um, 1.0);
    const stool = new THREE.Group();
    stool.position.set(st[0], 0, st[1]);
    stool.rotation.y = Math.atan2(-nIn[0], -nIn[1]);
    S.add(stool);
    cyl(stool, M.gunmetalMat, 0.2, 0.02, 0, 0.01, 0, 'y', 10);
    const sb = boltRing(0.16, 6, M.steelMat, { size: 0.012 });
    sb.position.y = 0.024;
    stool.add(sb);
    cyl(stool, M.steelMat, 0.035, 0.44, 0, 0.24, 0, 'y', 10);
    cyl(stool, M.rubberMat, 0.05, 0.1, 0, 0.14, 0, 'y', 10);
    cyl(stool, M.trimMat, 0.21, 0.03, 0, 0.465, 0, 'y', 14);
    cyl(stool, M.leatherMat, 0.195, 0.06, 0, 0.51, 0, 'y', 14);
    for (const s of [-1, 1]) box(stool, M.gunmetalMat, 0.025, 0.28, 0.025, s * 0.1, 0.62, -0.17);
    box(stool, M.leatherMat, 0.3, 0.14, 0.05, 0, 0.74, -0.18);
    cyl(stool, M.steelMat, 0.012, 0.3, 0, 0.2, 0.0, 'x', 6);
    ship.addCollider(st[0] - 0.24, st[0] + 0.24, st[1] - 0.24, st[1] + 0.24);
  }
}

export function buildBridgeRoom(ship) {
  dressRoomShell(ship, 'bridge', {
    keepClear: [
      { side: 'W', from: 0.74, to: 3.2 },
      { side: 'E', from: 0.68, to: 3.2 },
      { side: 'S', from: -4.64, to: -1.94, top: 2.2 },
      { side: 'S', from: 1.66, to: 2.7, top: 2.2 },
      { side: 'S', from: 3.02, to: 4.5, top: 2.2 },
      { side: 'SHOULDER_E', from: 2.62, to: 3.14, top: 2.2 },
      { side: 'SHOULDER_W', from: -3.14, to: -2.62, top: 2.2 }
    ],
    handrail: true,
    chamferStrip: true,
    ribSpacing: 1.2,
    fill: { panels: 4, vent: 1.2, conduit: 1.8, machinery: 1.2, light: 0.9 },
    troughs: 2,
    ceilingTo: 4.3,
    seed: 11
  });

  const g = bowFittings(ship);
  buildTactical(ship, g);
  buildNavBank(ship, g);
  buildAftBulkhead(ship, g);
  buildOverhead(ship, g);
  buildClubBoard(ship, g);
  buildShoulderStations(ship, g);

  ship.addLight('bridge-overhead', [0, 3.05, 2.2], 0xffd9a0, 2.6, 9);
  ship.interactiveTerminals.push(
    { id: 'bridge', name: ROOMS.bridge.name, pos: BRIDGE_STAND, route: '#/bridge' }
  );
}
