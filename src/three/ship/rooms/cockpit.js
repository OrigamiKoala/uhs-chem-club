/**
 * ship/rooms/cockpit.js — The flight deck, in the nose under the canopy.
 *
 * TWO PILOTS SIT IN THE GLASS, NOT BEHIND A WALL OF IT. The instrument dash
 * is one continuous piece that follows all five facets of the canopy just
 * inboard of the sill ledge — glareshield, raked face, padded knee bolster —
 * mitred at every mullion the way a moulded dash is, and it stays below the
 * glass: from the stand behind the seats the canopy is a window, not a
 * panel. Everything above that is hung from the lowered nose deckhead.
 *
 *   dash       five mitred sections: flight screens in front of each pilot,
 *              the centre stack, switch banks on the outboard wings
 *   pilots     crew seats on rails, a yoke through the knee bolster, pedals
 *   pedestal   throttle quadrant between the seats, trim wheel, radio heads
 *   overhead   two switch panels sloping down off the nose deckhead
 *   deck       a raised flight-deck plate with a striped nosing at z 4.3,
 *              where the deckhead steps down
 *
 * The dash and the overhead panels are bolted into the structure, so they go
 * into the hull object (`bowStructure`); the seats, the pedestal and every
 * small fitting go into the bow's baked group.
 */

import * as THREE from "three";
import { BRIDGE_OUTLINE, outlineSpan } from "../../ship-rooms.js";
import { aimBoxFromBounds } from "../../aim-target.js";
import { box, cyl, tube, lamp, cabinet } from "../kit.js";
import { canopyGeometry } from "../hull.js";
import {
  bowFittings, bowStructure, facePlate, profileAlong, screenBezel, toggleBank,
  knob, keypad, gauge, grabHandle, crewSeat, fillPolygon
} from "./bridge.js";

/** Where the pilots sit, and where the seats' footprint begins. */
const PILOT_X = 0.9;
const SEAT_Z = 5.42;
const NOSE_FILL_Z = 5.02;

/**
 * The dash section, as (inboard of the sill, height) pairs, closed. Edge k
 * runs from point k to k+1; `DASH_MATS` names what each edge is made of.
 */
const DASH = [
  [0.3, 0.52], [0.54, 0.52], [0.62, 0.59], [0.62, 0.72], [0.57, 0.75],
  [0.44, 1.06], [0.47, 1.09], [0.45, 1.14], [0.37, 1.12], [0.3, 1.04]
];
const DASH_MATS = [
  'panelDarkMat', 'panelDarkMat', 'leatherMat', 'leatherMat', 'ventMat',
  'gunmetalMat', 'gunmetalMat', 'gunmetalMat', 'gunmetalMat', 'panelDarkMat'
];
const DASH_DEPTH = 0.62;

/** The sill chain offset `d` inboard, mitred at every joint. */
function offsetChain(chain, normals, d) {
  const off = (p, n) => [p[0] + n[0] * d, p[1] + n[1] * d];
  const out = [off(chain[0], normals[0])];
  for (let i = 1; i < chain.length - 1; i++) {
    const n0 = normals[i - 1], n1 = normals[i];
    const p0 = off(chain[i], n0), p1 = off(chain[i], n1);
    const d0 = [chain[i][0] - chain[i - 1][0], chain[i][1] - chain[i - 1][1]];
    const d1 = [chain[i + 1][0] - chain[i][0], chain[i + 1][1] - chain[i][1]];
    const den = d0[0] * d1[1] - d0[1] * d1[0];
    const t = ((p1[0] - p0[0]) * d1[1] - (p1[1] - p0[1]) * d1[0]) / den;
    out.push([p0[0] + d0[0] * t, p0[1] + d0[1] * t]);
  }
  out.push(off(chain[chain.length - 1], normals[normals.length - 1]));
  return out;
}

/** z of the chain offset `d` inboard at a given x (the facets are single-valued in x). */
function chainZAt(chain, normals, d, x) {
  const o = offsetChain(chain, normals, d);
  for (let i = 0; i < o.length - 1; i++) {
    const [x0, z0] = o[i], [x1, z1] = o[i + 1];
    if ((x - x0) * (x - x1) <= 0 && Math.abs(x1 - x0) > 1e-6) return z0 + (z1 - z0) * ((x - x0) / (x1 - x0));
  }
  return o[Math.floor(o.length / 2)][1];
}

/**
 * The dash as real geometry: each profile edge swept along the mitred chain,
 * one mesh per material, capped where it meets the cheeks at each end.
 */
function buildDashBody(ship, parent, cg) {
  const { sill: chain, normals } = cg;
  const offs = DASH.map(([d]) => offsetChain(chain, normals, d));
  const cy = DASH.reduce((s, p) => s + p[1], 0) / DASH.length;
  const cd = DASH.reduce((s, p) => s + p[0], 0) / DASH.length;
  // One mesh per material PER FACET: the bake records each mesh's box, and a
  // box round the whole wrap would be a box round the whole nose.
  const buckets = new Map();
  const push = (mat, tri, want, facet) => {
    const [a, b, c] = tri.map(p => new THREE.Vector3(...p));
    const n = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
    const t = n.dot(want) < 0 ? [a, c, b] : [a, b, c];
    const key = `${facet}|${mat.uuid}`;
    if (!buckets.has(key)) buckets.set(key, { mat, arr: [] });
    buckets.get(key).arr.push(...t.flatMap(v => [v.x, v.y, v.z]));
  };
  for (let k = 0; k < DASH.length; k++) {
    const k2 = (k + 1) % DASH.length;
    const [dA, yA] = DASH[k], [dB, yB] = DASH[k2];
    // Outward in the section plane: perpendicular to the edge, away from its middle.
    let nd = -(yB - yA), ny = dB - dA;
    const md = (dA + dB) / 2 - cd, my = (yA + yB) / 2 - cy;
    if (nd * md + ny * my < 0) { nd = -nd; ny = -ny; }
    const mat = ship[DASH_MATS[k]];
    for (let i = 0; i < chain.length - 1; i++) {
      const n = normals[i];
      const want = new THREE.Vector3(n[0] * nd, ny, n[1] * nd);
      const A0 = [offs[k][i][0], yA, offs[k][i][1]], A1 = [offs[k][i + 1][0], yA, offs[k][i + 1][1]];
      const B0 = [offs[k2][i][0], yB, offs[k2][i][1]], B1 = [offs[k2][i + 1][0], yB, offs[k2][i + 1][1]];
      push(mat, [A0, A1, B1], want, i);
      push(mat, [A0, B1, B0], want, i);
    }
  }
  // End caps, flush under the cheeks.
  const contour = DASH.map(([d, y]) => new THREE.Vector2(d, y));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  for (const [end, facet, dir] of [[0, 0, -1], [chain.length - 1, normals.length - 1, 1]]) {
    const p = chain[end], n = normals[facet];
    const q = chain[end - dir];
    const away = new THREE.Vector3(p[0] - q[0], 0, p[1] - q[1]).normalize();
    const at = ([d, y]) => [p[0] + n[0] * d, y, p[1] + n[1] * d];
    for (const [a, b, c] of tris) push(ship.panelDarkMat, [at(DASH[a]), at(DASH[b]), at(DASH[c])], away, facet);
  }
  const g = new THREE.Group();
  g.name = 'flight-dash';
  for (const { mat, arr } of buckets.values()) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((arr.length / 3) * 2), 2));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, mat));
  }
  parent.add(g);
  return offs;
}

/**
 * A frame on facet `i`'s instrument face: x along the facet (to port), y up
 * the rake, z toward the pilot. Returns the frame and its usable half-length.
 */
function dashFace(parent, cg, i) {
  const { sill: chain, normals } = cg;
  const [fa, fb] = [DASH[4], DASH[5]];
  const dm = (fa[0] + fb[0]) / 2, ym = (fa[1] + fb[1]) / 2;
  const o = offsetChain(chain, normals, dm);
  const a = o[i], b = o[i + 1], n = normals[i];
  const along = [a[0] - b[0], 0, a[1] - b[1]];
  const up = [n[0] * (fb[0] - fa[0]), fb[1] - fa[1], n[1] * (fb[0] - fa[0])];
  const f = facePlate(parent, [(a[0] + b[0]) / 2, ym, (a[1] + b[1]) / 2], along, up);
  return { f, half: Math.hypot(b[0] - a[0], b[1] - a[1]) / 2 };
}

function buildDash(ship, cg) {
  const M = ship;
  const S = bowStructure(ship);
  const F = bowFittings(ship);
  buildDashBody(ship, S, cg);

  // Instrument faces. Facets run port to starboard: 0 wing, 1 pilot, 2 centre, 3 pilot, 4 wing.
  for (let i = 0; i < 5; i++) {
    const { f, half } = dashFace(S, cg, i);
    // A lamp strip under the hood lip, flooding the face.
    box(f, M.amberLampMat, 2 * half - 0.12, 0.008, 0.008, 0, 0.158, 0.012);
    if (i === 2) {
      screenBezel(f, M, M.crtRadarMat, 0.26, 0.15, 0, 0.03);
      gauge(f, M, M.dialGaugePsiMat, -0.27, 0.04, 0, 0.045);
      gauge(f, M, M.dialGaugeBarMat, 0.27, 0.04, 0, 0.045);
      toggleBank(f, M, 8, 0, -0.125, 0, { lamps: false });
    } else if (i === 1 || i === 3) {
      screenBezel(f, M, M.crtAmberMat, 0.22, 0.15, -0.14, 0.035);
      screenBezel(f, M, M.crtGreenMat, 0.22, 0.15, 0.14, 0.035);
      toggleBank(f, M, 8, 0, -0.125, 0, { guard: i === 1 });
      for (const s of [-1, 1]) gauge(f, M, M.dialGaugeBarMat, s * (half - 0.09), 0.03, 0, 0.038);
    } else {
      const w = half - 0.1;
      keypad(f, M, -w * 0.15, 0.0, 0, 3, 4);
      screenBezel(f, M, M.crtReactorMat, 0.15, 0.1, w * 0.45, 0.05);
      toggleBank(f, M, 6, w * 0.45, -0.1, 0, { guard: true });
      toggleBank(f, M, 5, -w * 0.72, 0.07, 0);
      for (let k = 0; k < 3; k++) knob(f, M, -w * 0.9 + k * 0.08, -0.09, 0, 0.018);
    }
  }

  // Yokes through the knee bolster, and pedals in the well under the dash.
  for (const s of [-1, 1]) {
    const px = s * PILOT_X;
    const zK = chainZAt(cg.sill, cg.normals, DASH_DEPTH, px);
    const zY = zK - 0.2;
    cyl(F, M.rubberMat, 0.045, 0.08, px, 0.66, zK - 0.03, 'z', 10);
    cyl(F, M.steelMat, 0.026, zK - zY, px, 0.66, (zK + zY) / 2, 'z', 10);
    cyl(F, M.gunmetalMat, 0.05, 0.05, px, 0.66, zY, 'z', 12);
    cyl(F, M.brassMat, 0.028, 0.012, px, 0.66, zY - 0.028, 'z', 12);
    box(F, M.gunmetalMat, 0.34, 0.035, 0.035, px, 0.68, zY - 0.01);
    for (const h of [-1, 1]) {
      box(F, M.rubberMat, 0.036, 0.16, 0.04, px + h * 0.17, 0.75, zY - 0.01, 0, 0, -h * 0.12);
      box(F, M.trimMat, 0.042, 0.024, 0.044, px + h * 0.18, 0.835, zY - 0.01);
      cyl(F, M.redLampMat, 0.007, 0.012, px + h * 0.18, 0.85, zY - 0.01, 'y', 6);
    }
    lamp(F, M, px, 0.7, zY - 0.035, M.amberLampMat, 0.007);

    const zP = chainZAt(cg.sill, cg.normals, 0.38, px);
    box(F, M.deckTileMat, 0.44, 0.015, 0.34, px, 0.1, zP + 0.02, -0.5);
    for (const t of [-1, 1]) {
      box(F, M.gunmetalMat, 0.02, 0.02, 0.2, px + t * 0.12, 0.26, zP - 0.02, 0.6);
      box(F, M.steelMat, 0.09, 0.2, 0.02, px + t * 0.12, 0.17, zP - 0.1, 0.45);
      for (let r = 0; r < 4; r++) box(F, M.rubberMat, 0.08, 0.008, 0.012, px + t * 0.12, 0.1 + r * 0.04, zP - 0.12 + r * 0.018, 0.45);
    }
  }
}

/** The throttle pedestal between the seats. */
function buildPedestal(ship) {
  const M = ship;
  const F = bowFittings(ship);
  const W = 0.36;
  profileAlong(F, M.panelDarkMat, [
    [5.2, 0], [6.12, 0], [6.12, 0.62], [6.0, 0.9], [5.66, 0.82], [5.3, 0.76], [5.2, 0.68]
  ], W, [W / 2, 0, 0], [0, 0, 1]);
  box(F, M.gunmetalMat, W + 0.06, 0.06, 0.98, 0, 0.03, 5.66);
  for (const s of [-1, 1]) {
    box(F, M.panelMat, 0.012, 0.42, 0.62, s * (W / 2 + 0.006), 0.36, 5.62);
    box(F, M.trimMat, 0.02, 0.03, 0.9, s * (W / 2 + 0.01), 0.72, 5.64);
  }
  // Quadrant top: slot plate and four levers at their settings.
  const top = facePlate(F, [0, 0.793, 5.48], [-1, 0, 0], [0, 0.06, 0.36]);
  box(top, M.ventMat, 0.3, 0.3, 0.008, 0, 0, 0.004);
  [-0.11, -0.037, 0.037, 0.11].forEach((x, i) => {
    const y = [-0.05, 0.03, 0.03, 0.08][i];
    box(top, M.gunmetalMat, 0.014, 0.26, 0.004, x, 0, 0.009);
    box(top, M.steelMat, 0.012, 0.012, 0.12, x, y, 0.066);
    box(top, i === 3 ? M.brassMat : M.rubberMat, 0.064, 0.032, 0.034, x, y, 0.13);
  });
  box(top, M.hazardMat, 0.3, 0.02, 0.004, 0, -0.14, 0.009);
  // Forward face: a small screen and a keypad.
  const fwd = facePlate(F, [0, 0.862, 5.83], [-1, 0, 0], [0, 0.08, 0.34]);
  screenBezel(fwd, M, M.crtGreenMat, 0.13, 0.09, 0.055, 0.02);
  keypad(fwd, M, -0.11, 0.0, 0, 2, 4);
  // Aft face: radio heads.
  const aft = facePlate(F, [0, 0.4, 5.198], [-1, 0, 0], [0, 1, 0]);
  toggleBank(aft, M, 6, 0, 0.18, 0);
  knob(aft, M, -0.08, 0.05); knob(aft, M, 0.08, 0.05);
  gauge(aft, M, M.dialGaugePsiMat, 0, -0.1, 0, 0.05);
  // Trim wheel on the starboard cheek, and the feed into the deck.
  cyl(F, M.gunmetalMat, 0.1, 0.035, W / 2 + 0.03, 0.56, 5.6, 'x', 18);
  cyl(F, M.steelMat, 0.02, 0.06, W / 2 + 0.06, 0.62, 5.64, 'x', 8);
  tube(F, M.cableMat, [[-W / 2 - 0.02, 0.4, 5.3], [-W / 2 - 0.08, 0.2, 5.28], [-W / 2 - 0.1, 0.02, 5.26]], 0.022, 6);
  box(F, M.gunmetalMat, 0.1, 0.03, 0.1, -W / 2 - 0.1, 0.015, 5.26);
}

/** Two switch panels sloping down off the nose deckhead, over the pilots. */
function buildOverheadPanels(ship) {
  const M = ship;
  const S = bowStructure(ship);
  const F = bowFittings(ship);
  for (const s of [-1, 1]) {
    const origin = [s * 0.625, 2.75, 5.085];
    const up = [0, 0.26, -0.67];
    const house = facePlate(S, origin, [-1, 0, 0], up);
    box(house, M.gunmetalMat, 0.65, 0.72, 0.1, 0, 0, -0.05);
    box(house, M.panelDarkMat, 0.61, 0.68, 0.012, 0, 0, 0.006);
    for (const x of [-0.26, 0.26]) cyl(S, M.steelMat, 0.012, 0.26, s * 0.625 + x, 2.83, 5.39, 'y', 6);
    const f = facePlate(F, origin, [-1, 0, 0], up);
    f.translateZ(0.012);
    toggleBank(f, M, 7, 0, 0.24, 0, { guard: true });
    toggleBank(f, M, 7, 0, 0.1, 0);
    screenBezel(f, M, M.crtAmberMat, 0.14, 0.09, -0.16, -0.08, 0, { lip: false });
    toggleBank(f, M, 4, 0.14, -0.06, 0);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) {
      cyl(f, M.gunmetalMat, 0.009, 0.02, -0.24 + c * 0.06, -0.22 - r * 0.06, 0.01, 'z', 6);
    }
    grabHandle(f, M, 0, -0.32, 0, 0.3);
  }
}

/** The raised flight-deck plate, with a striped nosing where it steps up. */
function buildFlightDeck(ship) {
  const M = ship;
  const F = bowFittings(ship);
  const z0 = 4.3;
  const inside = (x, z) => {
    const s = outlineSpan(BRIDGE_OUTLINE, z);
    if (!s || x < s[0] + 0.3 || x > s[1] - 0.3) return false;
    // Keep off the shoulder consoles.
    if (z < 5.2) {
      const lim = 2.6 + (5.2 - z) * 1.5 - 1.25;
      if (Math.abs(x) > lim) return false;
    }
    return true;
  };
  const t = 0.6;
  for (let x = -2.7; x < 2.7; x += t) {
    for (let z = z0; z < 6.6; z += t) {
      const cx = x + t / 2, cz = z + t / 2;
      if (!inside(cx - t / 2, cz) || !inside(cx + t / 2, cz) || !inside(cx, cz + t / 2 - 0.05)) continue;
      box(F, M.deckTileMat, t - 0.012, 0.03, t - 0.012, cx, 0.035, cz);
    }
  }
  const nx = 2.7 - 0.05;
  box(F, M.panelDarkMat, nx * 2, 0.05, 0.03, 0, 0.025, z0 + 0.015);
  box(F, M.hazardMat, nx * 2, 0.004, 0.06, 0, 0.052, z0 + 0.03);
  box(F, M.trimMat, nx * 2, 0.012, 0.02, 0, 0.05, z0 + 0.005);
}

export function buildCockpitRoom(ship) {
  const M = ship;
  const cg = canopyGeometry();
  const F = bowFittings(ship);

  buildDash(ship, cg);
  buildPedestal(ship);
  buildOverheadPanels(ship);
  buildFlightDeck(ship);

  for (const s of [-1, 1]) {
    const seat = crewSeat(F, M);
    seat.position.set(s * PILOT_X, 0.05, SEAT_Z);
  }

  // A breaker cabinet on each shoulder beside the cheek, where the lining is
  // kept plain for it (see bridge.js keepClear on SHOULDER_E / SHOULDER_W).
  const S = bowStructure(ship);
  for (const sx of [-1, 1]) {
    const a = [sx * 5.6, 3.2], b = [sx * 2.6, 5.2];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dir = [(b[0] - a[0]) / L, 0, (b[1] - a[1]) / L];
    const nIn = [-sx * 2 / L, 0, -3 / L];
    const u = 3.28;
    let U = dir;
    const N = [U[1] * 0 - U[2] * 1, U[2] * 0 - U[0] * 0, U[0] * 1 - U[1] * 0];
    if (N[0] * nIn[0] + N[2] * nIn[2] < 0) U = [-dir[0], 0, -dir[2]];
    const f = facePlate(S, [a[0] + dir[0] * u, 0, a[1] + dir[2] * u], U, [0, 1, 0]);
    const c = cabinet(f, M, 0.44, 1.0, 0.14, { screen: null, seed: sx > 0 ? 7 : 9 });
    c.position.set(0, 0.95, 0.015);
    for (let r = 0; r < 2; r++) toggleBank(f, M, 6, 0, 1.26 + r * 0.12, 0.17, { pitch: 0.045, lamps: r === 0 });
  }

  // Everything forward of the seats' backs is furniture; so is the dash
  // where it wraps aft along the end facets.
  const s0 = outlineSpan(BRIDGE_OUTLINE, NOSE_FILL_Z);
  fillPolygon(ship, [
    [s0[0], NOSE_FILL_Z], [s0[1], NOSE_FILL_Z], ...BRIDGE_OUTLINE.slice(3, 9)
  ]);
  const inner = offsetChain(cg.sill, cg.normals, DASH_DEPTH);
  for (const i of [0, cg.sill.length - 2]) {
    fillPolygon(ship, [cg.sill[i], cg.sill[i + 1], inner[i + 1], inner[i]]);
  }
  // The corner between the dash's end and the forward shoulder station is
  // too tight to stand in and too deep to leave as a pocket.
  for (const sx of [-1, 1]) {
    const A = [sx * 5.6, 3.2], B = [sx * 2.6, 5.2];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const at = (u, d) => [A[0] + ((B[0] - A[0]) / L) * u - (sx * 2 / L) * d, A[1] + ((B[1] - A[1]) / L) * u - (3 / L) * d];
    const end = sx < 0 ? inner[0] : inner[inner.length - 1];
    fillPolygon(ship, [at(3.0, 0), B, end, at(3.0, 0.66)]);
  }

  ship.addLight('cockpit-dash', [0, 1.25, 5.75], 0xffa040, 1.2, 3.5);
  ship.addLight('cockpit-overhead', [0, 2.65, 4.95], 0xffd9a0, 1.6, 5.5);

  ship.interactiveTerminals.push({
    id: 'cockpit', name: 'FLIGHT PODS', pos: [0, 1.45, 4.75], route: '#/settings',
    prompt: 'ACCESS FLIGHT COCKPIT & SETTINGS',
    // Each pilot's station (seat, yoke, dash), and the pedestal and centre
    // stack between them, which is what the stand looks straight at.
    aim: [
      aimBoxFromBounds(-2.4, -0.3, 0, 1.6, NOSE_FILL_Z, 6.6),
      aimBoxFromBounds(0.3, 2.4, 0, 1.6, NOSE_FILL_Z, 6.6),
      aimBoxFromBounds(-0.3, 0.3, 0, 1.6, 5.15, 6.8)
    ]
  });
}
