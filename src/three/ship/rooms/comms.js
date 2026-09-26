/**
 * ship/rooms/comms.js — The sub-space comms and sensor room.
 *
 * A RADIO ROOM IS A WALL OF RACKS WITH A CHAIR IN FRONT OF IT. The aft
 * bulkhead is the room: a 19-inch rack floor to deckhead on the outboard end,
 * the operator's console in the middle — a raked instrument face between two
 * oscilloscopes, and over it the big standings screen in a heavy bolted
 * bezel — and the transmitter cabinet on the inboard end, fenced with
 * warning paint. Cable looms sag between the rack tops. On the forward
 * bulkhead a caged bank of valves glows over a receiver rack.
 *
 * The standings projection stands by the plating on its own emitter, facing
 * the doorway, so a player coming in off the spine reads it head-on; its beam
 * is filament amber. The standings screen's material is the one `ShipInterior`
 * swaps a new texture into, so it is never baked.
 */

import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { boltLine, cableRun, dialGauge, placard } from "../../materials/pbr-kit.js";
import { createCommsStandingsTexture, createCommsHoloTexture } from "../../materials/textures.js";
import { ROOMS } from "../../ship-rooms.js";
import { aimBoxFromBounds } from "../../aim-target.js";
import { dressRoomShell, box, cyl, slab } from "../kit.js";
import { bev, prismX, rod, face } from "./berths.js";

/* =========================================================================
   RACK EQUIPMENT — built facing +z with its back at z = 0
   ========================================================================= */

/** Collects vacuum tubes so a whole room's valves draw as one mesh. */
function tubeBank() {
  const spots = [];
  const base = new THREE.CylinderGeometry(0.03, 0.03, 0.13, 10, 1);
  const cap = new THREE.SphereGeometry(0.03, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.translate(0, 0.065, 0);
  const one = BufferGeometryUtils.mergeGeometries([base.toNonIndexed(), cap.toNonIndexed()], false);
  return {
    // Recorded now, placed at build time, once every rack has been stood in place.
    add(obj, x, y, z) { spots.push([obj, x, y, z]); },
    build(parent, mat, inverse) {
      if (!spots.length) return;
      const geos = spots.map(([obj, x, y, z]) => {
        obj.updateMatrixWorld(true);
        const m = new THREE.Matrix4().makeTranslation(x, y, z).premultiply(obj.matrixWorld);
        return one.clone().applyMatrix4(m);
      });
      const merged = BufferGeometryUtils.mergeGeometries(geos, false);
      merged.applyMatrix4(inverse);
      const mesh = new THREE.Mesh(merged, mat);
      mesh.name = 'valves';
      parent.add(mesh);
    }
  };
}

/** One rack unit's worth of equipment, `h` tall, across `w`, face at z = d. */
function rackModule(g, M, kind, w, h, y, d, tubes, rng) {
  const cy = y + h / 2;
  const fw = w - 0.02;
  // Every module is a faceplate on ears bolted to the rails.
  bev(g, kind === 'blank' ? M.panelDarkMat : M.gunmetalMat, fw, h - 0.008, 0.02, 0, cy, d - 0.01, 0.004);
  for (const s of [-1, 1]) {
    for (const oy of [-h / 2 + 0.03, h / 2 - 0.03]) {
      if (h < 0.1 && oy > 0) continue;
      cyl(g, M.steelMat, 0.007, 0.006, s * (fw / 2 - 0.018), cy + oy, d + 0.003, 'z', 6);
    }
  }
  const fz = d + 0.001;
  if (kind === 'patch') {
    face(g, M.rackPanelMat, fw - 0.08, h - 0.04, 0, cy, fz);
    // Two rows of jacks, and cords looping between them.
    for (const row of [-1, 1]) {
      box(g, M.ventMat, fw - 0.12, 0.03, 0.006, 0, cy + row * h * 0.2, fz + 0.003);
    }
    const n = 3;
    for (let i = 0; i < n; i++) {
      const a = -fw / 2 + 0.1 + rng() * (fw - 0.2), b = -fw / 2 + 0.1 + rng() * (fw - 0.2);
      g.add(cableRun([a, cy + h * 0.2, fz + 0.012], [b, cy - h * 0.2, fz + 0.012], i === 1 ? M.liveryMat : M.cableMat, { sag: 0.08 + rng() * 0.08, radius: 0.006, segments: 10 }));
    }
  } else if (kind === 'tubes') {
    // A recessed bay of valves behind a wire guard.
    box(g, M.ventMat, fw - 0.06, h - 0.05, 0.01, 0, cy, d - 0.12);
    for (const s of [-1, 1]) box(g, M.gunmetalMat, 0.02, h - 0.04, 0.12, s * (fw / 2 - 0.04), cy, d - 0.06);
    box(g, M.gunmetalMat, fw - 0.06, 0.02, 0.12, 0, y + 0.03, d - 0.06);
    const n = Math.max(3, Math.floor((fw - 0.12) / 0.09));
    for (let i = 0; i < n; i++) {
      const x = -((n - 1) * 0.09) / 2 + i * 0.09;
      cyl(g, M.trimMat, 0.033, 0.03, x, y + 0.055, d - 0.07, 'y', 8);
      tubes.add(g, x, y + 0.14, d - 0.07);
    }
    for (let i = 0; i <= 8; i++) box(g, M.ventMat, 0.006, h - 0.04, 0.006, -fw / 2 + 0.04 + i * ((fw - 0.08) / 8), cy, d - 0.004);
    box(g, M.ventMat, fw - 0.06, 0.01, 0.01, 0, cy, d - 0.004);
  } else if (kind === 'meters') {
    for (const s of [-1, 1]) {
      const gg = dialGauge(Math.min(0.07, h * 0.32), s < 0 ? M.dialGaugeBarMat : M.dialGaugePsiMat, M.trimMat);
      gg.position.set(s * fw * 0.24, cy + 0.01, fz + 0.012);
      g.add(gg);
    }
    for (let i = 0; i < 3; i++) cyl(g, M.rubberMat, 0.014, 0.025, -0.04 + i * 0.04, cy - h * 0.3, fz + 0.012, 'z', 8);
  } else if (kind === 'crt') {
    box(g, M.trimMat, fw * 0.62, h - 0.05, 0.03, -fw * 0.1, cy, fz + 0.012);
    face(g, M.crtGreenMat, fw * 0.54, h - 0.1, -fw * 0.1, cy, fz + 0.03);
    for (let i = 0; i < 3; i++) cyl(g, M.rubberMat, 0.016, 0.028, fw * 0.34, cy + 0.07 - i * 0.07, fz + 0.012, 'z', 8);
  } else if (kind === 'lamps') {
    for (let i = 0; i < 8; i++) {
      const m = i % 3 === 0 ? M.greenLampMat : (rng() < 0.4 ? M.amberLampMat : M.stripDimMat);
      cyl(g, M.gunmetalMat, 0.016, 0.01, -fw / 2 + 0.08 + i * ((fw - 0.16) / 7), cy, fz + 0.005, 'z', 8);
      cyl(g, m, 0.01, 0.008, -fw / 2 + 0.08 + i * ((fw - 0.16) / 7), cy, fz + 0.012, 'z', 8);
    }
  } else if (kind === 'drawer') {
    face(g, M.rackPanelMat, fw - 0.08, h - 0.04, 0, cy, fz, 0, 0);
    for (const s of [-1, 1]) {
      box(g, M.steelMat, 0.018, h * 0.5, 0.018, s * (fw / 2 - 0.06), cy, fz + 0.03);
      for (const oy of [-1, 1]) box(g, M.steelMat, 0.018, 0.018, 0.03, s * (fw / 2 - 0.06), cy + oy * h * 0.22, fz + 0.015);
    }
  } else {
    for (let i = 0; i < Math.floor((h - 0.06) / 0.035); i++) box(g, M.ventMat, fw * 0.7, 0.012, 0.004, 0, y + 0.04 + i * 0.035, fz + 0.002);
  }
}

/** A 19-inch rack cabinet, `w` wide, `h` tall, `d` deep, carrying `modules` bottom up. */
function rack(parent, M, w, h, d, modules, tubes, seed = 1) {
  const g = new THREE.Group();
  parent.add(g);
  let s = seed;
  const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  box(g, M.ventMat, w - 0.06, 0.08, d - 0.06, 0, 0.04, d / 2 - 0.02);
  for (const sx of [-1, 1]) {
    for (const sz of [0.03, d - 0.03]) bev(g, M.gunmetalMat, 0.05, h - 0.08, 0.05, sx * (w / 2 - 0.025), h / 2 + 0.02, sz, 0.008);
    box(g, M.panelMat, 0.02, h - 0.2, d - 0.1, sx * (w / 2 - 0.012), h / 2, d / 2);
    g.add(boltLine([sx * (w / 2 + 0.002), 0.2, d / 2], [sx * (w / 2 + 0.002), h - 0.2, d / 2], 10, M.steelMat, { size: 0.009, normalAxis: 'x' }));
  }
  box(g, M.panelDarkMat, w - 0.06, h - 0.1, 0.02, 0, h / 2, 0.02);
  bev(g, M.trimMat, w + 0.02, 0.06, d + 0.02, 0, h - 0.03, d / 2, 0.012);
  box(g, M.ventMat, w * 0.6, 0.012, d * 0.5, 0, h + 0.001, d / 2);
  let y = 0.1;
  for (const [kind, mh] of modules) {
    if (y + mh > h - 0.08) break;
    rackModule(g, M, kind, w - 0.1, mh, y, d - 0.02, tubes, rng);
    y += mh + 0.008;
  }
  if (y < h - 0.14) rackModule(g, M, 'blank', w - 0.1, h - 0.08 - y, y, d - 0.02, tubes, rng);
  return g;
}

/** A toggle switch with a lift guard, on a face whose normal is +z. */
function toggle(g, M, x, y, z, up = true) {
  box(g, M.steelMat, 0.022, 0.03, 0.01, x, y, z + 0.005);
  rod(g, M.steelMat, [x, y, z + 0.01], [x, y + (up ? 0.018 : -0.018), z + 0.04], 0.004, 5);
  for (const s of [-1, 1]) box(g, M.trimMat, 0.005, 0.04, 0.03, x + s * 0.017, y, z + 0.015);
}

/* =========================================================================
   THE ROOM
   ========================================================================= */

export function buildCommsRoom(ship) {
  const M = ship;
  const room = ROOMS.comms;
  const zS = -7.69, zN = -5.21;

  dressRoomShell(ship, 'comms', {
    keepClear: [
      { side: 'S', from: -5.28, to: -2.6, top: 3.0 },
      { side: 'S', from: -2.6, to: -1.32 },
      { side: 'N', from: -4.62, to: -2.9 }
    ],
    fill: { panels: 3, vent: 1.2, conduit: 2.2, machinery: 1.6, light: 0.5 },
    seed: 23
  });

  const cg = new THREE.Group();
  cg.name = 'comms';
  ship.group.add(cg);
  const tubes = tubeBank();

  /* --------------------------------------------------- AFT: THE RACK WALL */
  const zBack = zS + 0.05;

  // Rack A, outboard.
  const rackA = rack(cg, M, 0.7, 2.8, 0.58, [
    ['blank', 0.3], ['drawer', 0.22], ['patch', 0.2], ['meters', 0.26], ['tubes', 0.4],
    ['patch', 0.2], ['crt', 0.32], ['lamps', 0.1], ['patch', 0.18]
  ], tubes, 7);
  rackA.position.set(-4.85, 0, zBack);

  // A riser of conduit between the rack and the plating, deck to deckhead corner.
  for (const [dx, r, mat] of [[0, 0.045, M.gunmetalMat], [0.1, 0.03, M.liveryMat], [-0.02, 0.022, M.cableMat]]) {
    cyl(cg, mat, r, 2.3, -5.37 + dx, 1.2, -7.45, 'y', 8);
  }
  for (const y of [0.4, 1.2, 2.0]) box(cg, M.trimMat, 0.2, 0.05, 0.12, -5.34, y, -7.45);

  // --- The operator console ---
  const cx0 = -4.45, cx1 = -2.65, cmid = (cx0 + cx1) / 2;
  prismX(cg, M.gunmetalMat, [
    [zBack, 0], [-7.12, 0], [-7.12, 0.1], [-7.06, 0.12], [-7.0, 0.62], [-6.9, 0.7], [-6.9, 0.76],
    [-7.3, 0.76], [-7.6, 1.06], [zBack, 1.06]
  ], cx0, cx1);
  for (const x of [cx0 + 0.01, cx1 - 0.01]) box(cg, M.trimMat, 0.03, 0.66, 0.03, x, 0.38, -7.04);
  box(cg, M.rubberMat, cx1 - cx0 - 0.1, 0.006, 0.38, cmid, 0.763, -7.1);
  cyl(cg, M.rubberMat, 0.022, cx1 - cx0, cmid, 0.738, -6.9, 'x', 8);
  bev(cg, M.panelDarkMat, cx1 - cx0 - 0.3, 0.4, 0.01, cmid, 0.36, -7.03, 0.004, 1, -0.2, 0, 0);
  for (let i = 0; i < 6; i++) box(cg, M.ventMat, 0.8, 0.012, 0.004, cmid, 0.22 + i * 0.05, -7.02, -0.2);

  // The raked face: switchgear in the middle, a scope at each end.
  slab(cg, M.controlPanelMat, 0.96, cmid, 0.765, -7.3, 1.055, -7.6, 0.01);
  const rake = new THREE.Group();
  rake.position.set(cmid, 0.91, -7.455);
  rake.rotation.x = -0.82;
  cg.add(rake);
  for (let i = 0; i < 8; i++) toggle(rake, M, -0.35 + i * 0.1, 0.1, 0.006, i % 3 !== 1);
  box(rake, M.hazardMat, 0.82, 0.01, 0.004, 0, 0.145, 0.006);
  for (let i = 0; i < 4; i++) {
    cyl(rake, M.rubberMat, 0.024, 0.026, -0.3 + i * 0.12, -0.08, 0.018, 'z', 10);
    box(rake, M.steelMat, 0.004, 0.018, 0.004, -0.3 + i * 0.12, -0.07, 0.033);
  }
  bev(rake, M.gunmetalMat, 0.16, 0.13, 0.02, 0.3, -0.07, 0.01, 0.004);
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) box(rake, M.steelMat, 0.026, 0.022, 0.012, 0.25 + q * 0.034, -0.03 - r * 0.03, 0.024);
  for (let i = 0; i < 6; i++) cyl(rake, i === 2 ? M.greenLampMat : M.amberLampMat, 0.008, 0.01, -0.3 + i * 0.07, 0.19, 0.008, 'z', 8);
  for (const s of [-1, 1]) {
    const scope = new THREE.Group();
    scope.position.set(s * 0.71, 0, 0.0);
    rake.add(scope);
    bev(scope, M.gunmetalMat, 0.3, 0.3, 0.16, 0, 0, 0.06, 0.02);
    const bez = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 6, 20), M.trimMat);
    bez.position.set(0, 0.03, 0.145);
    scope.add(bez);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), M.crtGreenMat);
    disc.position.set(0, 0.03, 0.137);
    scope.add(disc);
    for (let i = 0; i < 3; i++) cyl(scope, M.rubberMat, 0.012, 0.02, -0.08 + i * 0.08, -0.11, 0.148, 'z', 8);
  }
  // Keyboard and a gooseneck microphone.
  bev(cg, M.gunmetalMat, 0.54, 0.03, 0.2, cmid, 0.78, -7.06, 0.008, 1, 0.06, 0, 0);
  box(cg, M.keyboardMat, 0.5, 0.006, 0.16, cmid, 0.797, -7.06, 0.06);
  rod(cg, M.gunmetalMat, [cmid + 0.55, 0.79, -7.25], [cmid + 0.52, 1.05, -7.12], 0.008, 6);
  rod(cg, M.gunmetalMat, [cmid + 0.52, 1.05, -7.12], [cmid + 0.45, 1.1, -7.0], 0.008, 6);
  cyl(cg, M.rubberMat, 0.022, 0.06, cmid + 0.45, 1.1, -6.98, 'z', 8);
  // A headset on a hook on the console's inboard cheek.
  const hx = cx1 + 0.012;
  box(cg, M.steelMat, 0.03, 0.02, 0.05, hx, 0.66, -7.1);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.01, 6, 12, Math.PI), M.gunmetalMat);
  band.rotation.y = Math.PI / 2;
  band.rotation.z = Math.PI;
  band.position.set(hx + 0.035, 0.66, -7.1);
  cg.add(band);
  for (const s of [-1, 1]) cyl(cg, M.rubberMat, 0.04, 0.035, hx + 0.035, 0.58, -7.1 + s * 0.09, 'z', 10);
  cg.add(cableRun([hx + 0.035, 0.56, -7.19], [hx + 0.01, 0.62, -7.4], M.cableMat, { sag: 0.25, radius: 0.006, segments: 10 }));

  // The hutch over the console: a back plate, cheeks, the screen, a header.
  bev(cg, M.panelDarkMat, cx1 - cx0, 1.74, 0.04, cmid, 1.93, zBack + 0.02, 0.01);
  for (const x of [cx0 + 0.04, cx1 - 0.04]) {
    prismX(cg, M.gunmetalMat, [[zBack, 1.06], [-7.42, 1.06], [-7.42, 2.62], [-7.5, 2.8], [zBack, 2.8]], x - 0.04, x + 0.04);
  }
  const scr = new THREE.Group();
  scr.position.set(cmid, 1.58, zBack + 0.04);
  scr.rotation.x = 0.06;
  cg.add(scr);
  bev(scr, M.gunmetalMat, 1.5, 0.86, 0.12, 0, 0, 0.06, 0.02);
  for (const [w, h, x, y] of [[1.52, 0.07, 0, 0.405], [1.52, 0.07, 0, -0.405], [0.08, 0.86, -0.72, 0], [0.08, 0.86, 0.72, 0]]) {
    bev(scr, M.trimMat, w, h, 0.05, x, y, 0.14, 0.012);
  }
  box(scr, M.ventMat, 1.36, 0.74, 0.01, 0, 0, 0.125);
  for (const y of [0.405, -0.405]) scr.add(boltLine([-0.66, y, 0.168], [0.66, y, 0.168], 9, M.steelMat, { size: 0.011 }));
  // The standings screen. `ShipInterior.refreshStandings` swaps this map.
  const sTex = createCommsStandingsTexture([], '');
  ship.commsScreenMat = new THREE.MeshBasicMaterial({ map: sTex });
  const standings = face(scr, ship.commsScreenMat, 1.3, 0.65, 0, 0, 0.132);
  standings.name = 'comms-standings';
  standings.userData.noMerge = true;
  // Header: speaker grille, lamp row, the relay's plate.
  bev(cg, M.gunmetalMat, cx1 - cx0 - 0.16, 0.26, 0.1, cmid, 2.22, zBack + 0.09, 0.012);
  for (let i = 0; i < 5; i++) box(cg, M.ventMat, 0.4, 0.014, 0.004, cmid - 0.5, 2.14 + i * 0.04, zBack + 0.142);
  for (let i = 0; i < 6; i++) cyl(cg, i === 0 ? M.greenLampMat : M.amberLampMat, 0.01, 0.01, cmid + 0.1 + i * 0.1, 2.3, zBack + 0.143, 'z', 8);
  box(cg, M.paintWhiteMat, 0.46, 0.07, 0.004, cmid + 0.35, 2.17, zBack + 0.142);
  // Looms sagging from the racks over the hutch and up into the deckhead.
  for (const [a, b, sag, r, mat] of [
    [[-4.6, 2.78, -7.3], [-2.4, 2.4, -7.3], 0.35, 0.03, M.cableMat],
    [[-4.7, 2.76, -7.4], [-2.2, 2.38, -7.4], 0.28, 0.022, M.liveryMat],
    [[-4.55, 2.79, -7.2], [-3.2, 2.84, -7.45], 0.22, 0.018, M.cableMat]
  ]) cg.add(cableRun(a, b, mat, { sag, radius: r, segments: 16 }));

  // --- The transmitter cabinet, inboard ---
  const tx0 = -2.55, tx1 = -1.42, tmid = (tx0 + tx1) / 2, tz = zBack + 0.58;
  box(cg, M.ventMat, tx1 - tx0 - 0.06, 0.08, 0.52, tmid, 0.04, zBack + 0.27);
  bev(cg, M.gunmetalMat, tx1 - tx0, 2.2, 0.56, tmid, 1.18, zBack + 0.28, 0.025);
  for (const i of [0, 1]) {
    const dx = tmid + (i ? 0.27 : -0.27);
    bev(cg, M.panelMat, 0.52, 1.9, 0.03, dx, 1.12, tz, 0.012);
    bev(cg, M.panelDarkMat, 0.4, 0.72, 0.01, dx, 0.6, tz + 0.018, 0.004);
    for (let v = 0; v < 8; v++) box(cg, M.ventMat, 0.34, 0.014, 0.006, dx, 0.34 + v * 0.07, tz + 0.024);
    // Lever latch.
    box(cg, M.gunmetalMat, 0.05, 0.12, 0.03, dx + (i ? -0.21 : 0.21), 1.2, tz + 0.03);
    box(cg, M.steelMat, 0.025, 0.2, 0.02, dx + (i ? -0.21 : 0.21), 1.1, tz + 0.05, 0, 0, i ? -0.2 : 0.2);
  }
  box(cg, M.hazardMat, tx1 - tx0 - 0.04, 0.08, 0.006, tmid, 1.02, tz + 0.02);
  for (const s of [-1, 1]) {
    const gg = dialGauge(0.075, s < 0 ? M.dialGaugeBarMat : M.dialGaugePsiMat, M.trimMat);
    gg.position.set(tmid + s * 0.2, 1.72, tz + 0.03);
    cg.add(gg);
  }
  cyl(cg, M.redLampMat, 0.02, 0.014, tmid, 1.72, tz + 0.03, 'z', 10);
  cyl(cg, M.gunmetalMat, 0.032, 0.012, tmid, 1.72, tz + 0.02, 'z', 10);
  const hv = placard('DANGER  HIGH VOLTAGE  RF', { w: 0.6, h: 0.1, bg: '#b08a2c' });
  hv.position.set(tmid, 1.94, tz + 0.02);
  cg.add(hv);
  // Heat-sink fins on the crown, and the coax that leaves it.
  for (let i = 0; i < 9; i++) box(cg, M.ventMat, 0.012, 0.1, 0.4, tx0 + 0.12 + i * 0.11, 2.33, zBack + 0.28);
  cg.add(cableRun([-2.2, 2.3, -7.4], [-2.72, 2.42, -7.4], M.cableMat, { sag: 0.2, radius: 0.035, segments: 12 }));

  /* ---------------------------------------- FORWARD: VALVES AND RECEIVER */
  const valveCab = new THREE.Group();
  valveCab.position.set(-4.1, 0, zN - 0.02);
  valveCab.rotation.y = Math.PI;
  cg.add(valveCab);
  const vw = 0.9, vd = 0.42;
  box(valveCab, M.ventMat, vw - 0.06, 0.08, vd - 0.06, 0, 0.04, vd / 2);
  bev(valveCab, M.gunmetalMat, vw, 2.2, vd - 0.04, 0, 1.18, vd / 2 - 0.02, 0.02);
  bev(valveCab, M.panelMat, vw - 0.06, 0.62, 0.03, 0, 0.45, vd - 0.02, 0.01);
  box(valveCab, M.steelMat, 0.2, 0.02, 0.02, 0, 0.7, vd + 0.01);
  // The caged gallery: three shelves of valves behind a mesh door.
  box(valveCab, M.ventMat, vw - 0.1, 1.04, 0.01, 0, 1.36, 0.06);
  for (let r = 0; r < 3; r++) {
    const y = 0.92 + r * 0.34;
    box(valveCab, M.gunmetalMat, vw - 0.1, 0.02, vd - 0.12, 0, y, vd / 2);
    for (let i = 0; i < 7; i++) {
      const x = -0.3 + i * 0.1;
      cyl(valveCab, M.trimMat, 0.033, 0.03, x, y + 0.025, vd / 2, 'y', 8);
      tubes.add(valveCab, x, y + 0.11, vd / 2);
    }
  }
  for (let i = 0; i <= 10; i++) box(valveCab, M.ventMat, 0.006, 1.06, 0.006, -0.42 + i * 0.084, 1.36, vd - 0.01);
  for (let i = 0; i <= 5; i++) box(valveCab, M.ventMat, vw - 0.06, 0.006, 0.006, 0, 0.84 + i * 0.21, vd - 0.01);
  for (const s of [-1, 1]) box(valveCab, M.trimMat, 0.04, 1.1, 0.04, s * (vw / 2 - 0.03), 1.36, vd - 0.01);
  for (const s of [-1, 1]) box(valveCab, M.trimMat, vw - 0.02, 0.04, 0.04, 0, 1.36 + s * 0.54, vd - 0.01);
  for (let i = 0; i < 5; i++) box(valveCab, M.ventMat, 0.6, 0.014, 0.006, 0, 2.02 + i * 0.05, vd - 0.018);
  const receiver = rack(cg, M, 0.66, 2.3, 0.42, [
    ['blank', 0.24], ['drawer', 0.2], ['meters', 0.24], ['crt', 0.34], ['patch', 0.2], ['lamps', 0.1], ['tubes', 0.36], ['patch', 0.18]
  ], tubes, 29);
  receiver.position.set(-3.25, 0, zN - 0.02);
  receiver.rotation.y = Math.PI;

  /* ---------------------------------------------------- THE PROJECTION */
  const px = -5.05, pz = -6.15;
  cyl(cg, M.ventMat, 0.3, 0.05, px, 0.025, pz, 'y', 14);
  cyl(cg, M.gunmetalMat, 0.24, 0.26, px, 0.18, pz, 'y', 14, 0.27);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    box(cg, M.trimMat, 0.012, 0.2, 0.07, px + Math.cos(a) * 0.27, 0.17, pz + Math.sin(a) * 0.27, 0, -a, 0);
  }
  cyl(cg, M.trimMat, 0.17, 0.05, px, 0.335, pz, 'y', 14);
  cyl(cg, M.trimMat, 0.14, 0.012, px, 0.366, pz, 'y', 14);
  cyl(cg, M.amberLampMat, 0.11, 0.006, px, 0.374, pz, 'y', 14);
  // The feed: a floor duct to the forward bulkhead and a riser up it.
  box(cg, M.gunmetalMat, 0.24, 0.08, 0.78, px, 0.04, pz + 0.55);
  for (let i = 0; i < 4; i++) box(cg, M.trimMat, 0.26, 0.012, 0.03, px, 0.082, pz + 0.25 + i * 0.2);
  cyl(cg, M.cableMat, 0.04, 2.25, px, 1.15, zN - 0.08, 'y', 8);
  box(cg, M.trimMat, 0.14, 0.06, 0.1, px, 0.9, zN - 0.07);
  box(cg, M.trimMat, 0.14, 0.06, 0.1, px, 1.8, zN - 0.07);

  const holoFx = new THREE.Group();
  holoFx.name = 'comms-holo';
  holoFx.userData.noMerge = true;
  cg.add(holoFx);

  const commsHoloGroup = new THREE.Group();
  commsHoloGroup.position.set(px, 1.4, pz);
  commsHoloGroup.rotation.y = Math.PI / 2; // faces +x, the doorway
  const holoTex = createCommsHoloTexture([], '');
  ship.commsHoloMat = new THREE.MeshBasicMaterial({
    map: holoTex,
    transparent: true,
    opacity: 0.88,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), ship.commsHoloMat);
  commsHoloGroup.add(holoScreen);
  ship.commsHoloGroup = commsHoloGroup;
  ship.animatedElements.push({ obj: holoScreen, speed: 0.05, isHover: true, baseY: 0 });

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.1, 0.56, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xd9a04a, transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
    })
  );
  beam.position.set(px, 0.66, pz);
  ship.commsHoloBeam = beam;
  holoFx.add(commsHoloGroup, beam);

  // The valves: one mesh for the room.
  cg.updateMatrixWorld(true);
  const valves = new THREE.Group();
  valves.userData.noMerge = true;
  cg.add(valves);
  tubes.build(valves, M.vacuumTubeMat, new THREE.Matrix4().copy(cg.matrixWorld).invert());

  ship.bake(cg);

  // Colliders: the aft wall (racks, console, transmitter), the forward bank,
  // and the emitter with its duct run to the forward bulkhead.
  ship.addCollider(-5.6, -1.32, -7.8, -7.0);
  ship.addCollider(cx0, cx1, -7.0, -6.86);
  ship.addCollider(-4.6, -2.88, -5.75, -5.1);
  ship.addCollider(-5.6, -4.72, -6.6, -5.1);

  // The console and its screen, the valve gallery, the overhead fixture.
  ship.addLight('comms-console', [cmid, 1.7, -7.1], 0xffa040, 1.3, 4);
  ship.addLight('comms-valves', [-4.1, 1.35, -5.55], 0xff9a40, 0.8, 3);
  ship.addLight('comms-overhead', [-3.3, 2.7, -6.4], 0xffd9a0, 1.8, 6);

  ship.interactiveTerminals.push({
    id: 'comms', name: room.name, pos: [-3.3, 1.55, -6.3], route: '#/leaderboard',
    prompt: 'ACCESS SUB-SPACE COMMS RELAY',
    // The aft rack wall with the console and its screen, the projection on
    // its emitter, and the forward valve bank.
    aim: [
      aimBoxFromBounds(-5.2, -1.42, 0, 2.8, -7.64, -6.88),
      aimBoxFromBounds(-5.35, -4.75, 0, 1.9, -6.95, -5.35),
      aimBoxFromBounds(-4.55, -2.92, 0, 2.3, -5.66, -5.23)
    ]
  });
}
