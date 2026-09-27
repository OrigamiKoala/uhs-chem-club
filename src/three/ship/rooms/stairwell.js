/**
 * ship/rooms/stairwell.js — The ladderwell.
 *
 * A HOLE IN THE DECK IS THE MOST DANGEROUS THING ABOARD, AND IT IS DRESSED
 * LIKE ONE. The hatch drops through a lined shaft to a lit landing on the
 * lower deck; a rung ladder climbs it, its rails carried a metre above the
 * deck as grab handles. A guard rail rings the opening with a chain across
 * the gap on the side the player walks in from, a raised coaming and toe
 * boards in hazard paint round the edge, and the hatch cover stands hinged
 * open against the far rail on a hydraulic ram, a beacon pulsing over it.
 *
 * The rest of the compartment is what a crew keeps by a ladder: a pressure
 * suit racked in its locker beside the tools, a fire-suppression cabinet with
 * its hose reel, and a status panel for the deck below, mounted on the
 * plating across the shaft where a player at the gate reads it.
 *
 * The rail's collider runs out to the plating, and the gaps either side of
 * it are too narrow for a body, so no deck is walled off behind it.
 */

import * as THREE from "three";
import { boltLine, cableRun, dialGauge, placard } from "../../materials/pbr-kit.js";
import { FLOOR_HATCH } from "../../ship-rooms.js";
import { dressRoomShell, box, cyl, tube } from "../kit.js";
import { bev, rod, face, blob } from "./berths.js";

export function buildStairwellRoom(ship) {
  const M = ship;
  const H = FLOOR_HATCH;
  const hx = (H.minX + H.maxX) / 2, hz = (H.minZ + H.maxZ) / 2;
  const zS = -5.29, zN = -3.01, xE = 5.6;
  const depth = -2.8;

  dressRoomShell(ship, 'stairwell', {
    keepClear: [
      { side: 'N', from: 2.33, to: 3.47 },
      { side: 'S', from: 2.38, to: 3.42 },
      { side: 'E', from: -4.55, to: -3.75 }
    ],
    fill: { panels: 4, vent: 1.0, conduit: 2.0, machinery: 1.2, light: 0.6 },
    seed: 31
  });

  const g = new THREE.Group();
  g.name = 'ladderwell';
  ship.group.add(g);

  /* ------------------------------------------------------------ THE SHAFT */
  const sh = 0.03;
  const sx0 = H.minX + sh / 2, sx1 = H.maxX - sh / 2, sz0 = H.minZ + sh / 2, sz1 = H.maxZ - sh / 2;
  const sw = H.maxX - H.minX, sd = H.maxZ - H.minZ;
  const top = -0.03, landH = 2.0;
  // Walls: plate down to the landing. The east wall is open over the landing.
  box(g, M.panelDarkMat, sh, top - depth, sd, sx0, (top + depth) / 2, hz);
  box(g, M.panelDarkMat, sw, top - depth, sh, hx, (top + depth) / 2, sz0);
  box(g, M.panelDarkMat, sw, top - depth, sh, hx, (top + depth) / 2, sz1);
  box(g, M.panelDarkMat, sh, top - (depth + landH), sd, sx1, (top + depth + landH) / 2, hz);
  // Stiffening rings every 0.7 m, and a lintel over the landing opening.
  for (let y = -0.5; y > depth + 0.2; y -= 0.7) {
    box(g, M.trimMat, 0.04, 0.05, sd - 0.06, sx0 + 0.03, y, hz);
    for (const z of [sz0 + 0.03, sz1 - 0.03]) box(g, M.trimMat, sw - 0.06, 0.05, 0.04, hx, y, z);
  }
  box(g, M.trimMat, 0.06, 0.12, sd - 0.06, sx1 - 0.03, depth + landH - 0.06, hz);
  // Landing floor, and the passage it opens into, lit along its deckhead.
  const floorY = depth;
  box(g, M.panelDarkMat, sw + 0.6, 0.06, sd - 0.06, hx + 0.3, floorY - 0.03, hz);
  box(g, M.hazardMat, 0.1, 0.004, sd - 0.1, sx0 + 0.3, floorY + 0.003, hz);
  const pz0 = hz - 0.4, pz1 = hz + 0.4;
  box(g, M.panelMat, 0.55, landH, 0.03, H.maxX + 0.3, depth + landH / 2, pz0);
  box(g, M.panelMat, 0.55, landH, 0.03, H.maxX + 0.3, depth + landH / 2, pz1);
  box(g, M.panelDarkMat, 0.55, 0.03, 0.8, H.maxX + 0.3, depth + landH, hz);
  box(g, M.panelDarkMat, 0.03, landH, 0.8, H.maxX + 0.56, depth + landH / 2, hz);
  box(g, M.gunmetalMat, 0.4, 0.05, 0.14, H.maxX + 0.3, depth + landH - 0.04, hz);
  box(g, M.troughMat, 0.34, 0.006, 0.08, H.maxX + 0.3, depth + landH - 0.066, hz);
  box(g, M.troughMat, 0.012, 0.02, 0.6, H.maxX + 0.54, depth + 0.9, hz);
  // A caged bulkhead lamp halfway down.
  const lampZ = sz0 + 0.02;
  bev(g, M.gunmetalMat, 0.18, 0.14, 0.06, hx + 0.2, -1.4, lampZ + 0.03, 0.01);
  blob(g, M.luminaireWarmMat, 0.05, 0.05, 0.03, hx + 0.2, -1.4, lampZ + 0.065);
  for (const dx of [-0.04, 0, 0.04]) box(g, M.gunmetalMat, 0.008, 0.12, 0.008, hx + 0.2 + dx, -1.4, lampZ + 0.1);
  // A cable tray down the south wall to the landing.
  box(g, M.gunmetalMat, 0.12, top - depth, 0.03, hx + 0.42, (top + depth) / 2, sz0 + 0.03);
  for (const dx of [-0.03, 0.02]) box(g, M.cableMat, 0.024, top - depth - 0.1, 0.024, hx + 0.42 + dx, (top + depth) / 2, sz0 + 0.055);

  /* ----------------------------------------------------------- THE LADDER */
  // Against the west wall under the gate, rails carried up past the deck.
  const lx = H.minX + 0.14;
  const rails = [hz - 0.2, hz + 0.2];
  for (const rz of rails) {
    tube(g, M.steelMat, [
      [lx, depth, rz], [lx, 0.6, rz], [lx - 0.01, 0.92, rz], [lx - 0.1, 1.02, rz], [lx - 0.2, 0.94, rz], [lx - 0.22, 0.75, rz]
    ], 0.022, 8, 0.4);
    for (let y = depth + 0.4; y < -0.1; y += 0.7) {
      rod(g, M.gunmetalMat, [lx, y, rz], [H.minX + 0.03, y, rz], 0.012, 6);
    }
  }
  for (let y = depth + 0.3; y < -0.05; y += 0.3) {
    cyl(g, M.steelMat, 0.016, 0.4, lx, y, hz, 'z', 8);
  }

  /* --------------------------------------------- COAMING, RAIL, CHAIN, COVER */
  const c = 0.08;
  // A raised lip round the opening, hazard-painted on top.
  for (const [w, d, x, z] of [
    [sw + c * 2, c, hx, H.minZ - c / 2], [sw + c * 2, c, hx, H.maxZ + c / 2],
    [c, sd, H.minX - c / 2, hz], [c, sd, H.maxX + c / 2, hz]
  ]) {
    box(g, M.gunmetalMat, w, 0.06, d, x, 0.03, z);
    box(g, M.hazardMat, w, 0.004, d - 0.01, x, 0.062, z);
  }
  // Rail posts, rails and hazard toe boards on three sides; the gate on the west.
  const rx0 = H.minX - 0.1, rx1 = H.maxX + 0.1, rz0 = H.minZ - 0.1, rz1 = H.maxZ + 0.1;
  const gate = [hz - 0.3, hz + 0.3];
  const posts = [
    [rx0, rz0], [rx1, rz0], [rx0, rz1], [rx1, rz1],
    [hx, rz0], [hx, rz1], [rx1, hz], [rx0, gate[0]], [rx0, gate[1]]
  ];
  for (const [x, z] of posts) {
    cyl(g, M.steelMat, 0.025, 1.05, x, 0.525, z, 'y', 8);
    cyl(g, M.gunmetalMat, 0.05, 0.03, x, 0.015, z, 'y', 8);
    cyl(g, M.trimMat, 0.03, 0.03, x, 1.055, z, 'y', 8);
  }
  const railRun = (a, b) => {
    for (const y of [1.03, 0.55]) rod(g, M.steelMat, [a[0], y, a[1]], [b[0], y, b[1]], 0.02, 8);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const along = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
    box(g, M.hazardMat, along ? len : 0.012, 0.1, along ? 0.012 : len, (a[0] + b[0]) / 2, 0.12, (a[1] + b[1]) / 2);
  };
  railRun([rx0, rz0], [rx1, rz0]);
  railRun([rx0, rz1], [rx1, rz1]);
  railRun([rx1, rz0], [rx1, rz1]);
  railRun([rx0, rz0], [rx0, gate[0]]);
  railRun([rx0, gate[1]], [rx0, rz1]);
  // The chain across the gate, hooked to an eye, with a tag on it.
  g.add(cableRun([rx0, 0.96, gate[0]], [rx0, 0.96, gate[1]], M.steelMat, { sag: 0.1, radius: 0.009, segments: 14 }));
  for (const z of gate) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 5, 10), M.steelMat);
    eye.position.set(rx0, 0.96, z);
    g.add(eye);
  }
  box(g, M.hazardMat, 0.004, 0.08, 0.12, rx0 - 0.01, 0.8, hz);

  // The cover: hinged on the forward edge, stood open against the forward rail.
  const cover = new THREE.Group();
  cover.position.set(hx, 0.07, H.maxZ - 0.02);
  cover.rotation.x = Math.PI / 2 + 0.12;
  g.add(cover);
  // Built lying flat, its top face +y, running aft (−z) from the hinge.
  bev(cover, M.panelMat, sw + 0.04, 0.06, sd + 0.04, 0, 0, -(sd + 0.04) / 2, 0.015);
  for (const f of [-1, 1]) box(cover, M.trimMat, 0.07, 0.07, sd - 0.1, f * 0.3, 0.02, -(sd + 0.04) / 2);
  box(cover, M.trimMat, sw - 0.1, 0.07, 0.07, 0, 0.02, -(sd + 0.04) / 2);
  box(cover, M.rubberMat, sw, 0.02, 0.03, 0, -0.035, -sd - 0.02);
  for (const f of [-1, 1]) cyl(cover, M.steelMat, 0.03, 0.18, f * 0.45, 0, 0, 'x', 10);
  cover.add(boltLine([-0.5, 0.032, -0.08], [0.5, 0.032, -0.08], 8, M.steelMat, { size: 0.012, normalAxis: 'y' }));
  box(cover, M.hazardMat, sw - 0.2, 0.004, 0.12, 0, -0.032, -sd * 0.5);
  // Its ram: a cylinder on the deck beside the hinge to a lug on the cover.
  const ramFoot = [H.minX - 0.05, 0.1, H.maxZ - 0.25];
  const ramHead = [H.minX + 0.02, 0.72, H.maxZ + 0.05];
  box(g, M.gunmetalMat, 0.1, 0.06, 0.12, ramFoot[0], 0.03, ramFoot[2]);
  const mid = ramFoot.map((v, i) => v + (ramHead[i] - v) * 0.55);
  rod(g, M.gunmetalMat, ramFoot, mid, 0.035, 10);
  rod(g, M.steelMat, mid, ramHead, 0.018, 8);
  g.add(cableRun([ramFoot[0], 0.14, ramFoot[2]], [ramFoot[0] + 0.02, 0.05, ramFoot[2] + 0.3], M.cableMat, { sag: 0.05, radius: 0.01, segments: 8 }));
  // A hand pump for the ram, on the coaming at the forward-west corner.
  bev(g, M.gunmetalMat, 0.14, 0.2, 0.12, H.minX - 0.04, 0.16, H.maxZ + 0.05, 0.012);
  rod(g, M.steelMat, [H.minX - 0.04, 0.26, H.maxZ + 0.05], [H.minX - 0.04, 0.46, H.maxZ - 0.05], 0.01, 6);

  // The beacon on the gate post, pulsing while the hatch stands open.
  const beaconMat = M.amberLampMat.clone();
  const beacon = new THREE.Group();
  beacon.userData.noMerge = true;
  g.add(beacon);
  cyl(beacon, M.gunmetalMat, 0.045, 0.03, rx0, 1.085, gate[1], 'y', 10);
  cyl(beacon, beaconMat, 0.035, 0.07, rx0, 1.135, gate[1], 'y', 10);
  const lo = new THREE.Color(0x3a2610), hi = new THREE.Color(0xd99423);
  ship.animatedElements.push({
    update(delta, time) {
      const k = 0.5 + 0.5 * Math.sin(time * 3.2);
      beaconMat.color.copy(lo).lerp(hi, k * k);
    }
  });

  /* ---------------------------------------- SUIT AND TOOL LOCKER, FORWARD */
  const lx0 = 2.4, lx1 = 3.4, lzb = zN - 0.02, ld = 0.44, lzf = lzb - ld, lTop = 2.25;
  const lc = (lx0 + lx1) / 2;
  box(g, M.ventMat, lx1 - lx0 - 0.04, 0.08, ld - 0.05, lc, 0.04, lzb - ld / 2);
  box(g, M.panelDarkMat, lx1 - lx0, lTop - 0.08, 0.02, lc, (lTop + 0.08) / 2, lzb - 0.01);
  for (const x of [lx0 + 0.013, lx0 + 0.63, lx1 - 0.013]) box(g, M.gunmetalMat, 0.026, lTop - 0.08, ld, x, (lTop + 0.08) / 2, lzb - ld / 2);
  bev(g, M.trimMat, lx1 - lx0 + 0.03, 0.06, ld + 0.02, lc, lTop, lzb - ld / 2, 0.012);
  box(g, M.gunmetalMat, lx1 - lx0, 0.03, ld, lc, 0.095, lzb - ld / 2);
  // The suit bay: open, a bar across it, the suit on its yoke.
  const bx = lx0 + 0.32, bz = lzb - 0.22;
  cyl(g, M.steelMat, 0.014, 0.6, bx, 1.1, lzf + 0.02, 'x', 8);
  box(g, M.gunmetalMat, 0.4, 0.04, 0.06, bx, 1.86, bz);
  bev(g, M.paintWhiteMat, 0.4, 0.5, 0.24, bx, 1.5, bz, 0.05, 2);
  bev(g, M.gunmetalMat, 0.3, 0.36, 0.08, bx, 1.52, bz + 0.15, 0.02);
  cyl(g, M.trimMat, 0.1, 0.05, bx, 1.78, bz, 'y', 12);
  blob(g, M.paintWhiteMat, 0.13, 0.14, 0.13, bx, 1.96, bz);
  bev(g, M.screenGlassMat, 0.17, 0.1, 0.05, bx, 1.97, bz - 0.11, 0.025, 2);
  for (const s of [-1, 1]) {
    cyl(g, M.paintWhiteMat, 0.055, 0.5, bx + s * 0.25, 1.46, bz, 'y', 10, 0.05);
    cyl(g, M.rubberMat, 0.05, 0.1, bx + s * 0.25, 1.17, bz, 'y', 10);
    cyl(g, M.paintWhiteMat, 0.07, 0.62, bx + s * 0.1, 0.9, bz, 'y', 10, 0.065);
    bev(g, M.rubberMat, 0.13, 0.12, 0.26, bx + s * 0.1, 0.18, bz - 0.03, 0.03, 2);
  }
  box(g, M.liveryMat, 0.41, 0.05, 0.245, bx, 1.34, bz);
  rod(g, M.cableMat, [bx + 0.12, 1.4, bz - 0.12], [bx - 0.1, 1.7, bz - 0.1], 0.014, 6);
  // The tool locker beside it: a door, louvres, a latch.
  const tc = lx0 + 0.815;
  bev(g, M.panelMat, 0.33, lTop - 0.2, 0.025, tc, (lTop + 0.1) / 2, lzf - 0.012, 0.008);
  for (const vy of [0.3, 0.36, 0.42, 1.92, 1.98]) box(g, M.ventMat, 0.22, 0.014, 0.006, tc, vy, lzf - 0.027);
  box(g, M.steelMat, 0.018, 0.2, 0.02, tc - 0.12, 1.15, lzf - 0.04);
  box(g, M.hazardMat, 0.28, 0.06, 0.004, tc, 1.62, lzf - 0.027);
  box(g, M.paintWhiteMat, 0.22, 0.06, 0.004, bx, lTop - 0.06, lzf - 0.012);

  /* --------------------------------------- FIRE SUPPRESSION, AFT BULKHEAD */
  const fx = 2.9, fzb = zS + 0.02;
  bev(g, M.liveryMat, 0.7, 0.9, 0.2, fx, 1.45, fzb + 0.1, 0.02);
  bev(g, M.panelDarkMat, 0.52, 0.5, 0.01, fx, 1.5, fzb + 0.203, 0.004);
  face(g, M.glassMat, 0.5, 0.48, fx, 1.5, fzb + 0.21);
  cyl(g, M.redLampMat, 0.1, 0.34, fx, 1.5, fzb + 0.12, 'y', 12);
  cyl(g, M.gunmetalMat, 0.04, 0.08, fx, 1.71, fzb + 0.12, 'y', 8);
  box(g, M.steelMat, 0.2, 0.03, 0.03, fx, 1.13, fzb + 0.22);
  box(g, M.hazardMat, 0.66, 0.05, 0.004, fx, 1.93, fzb + 0.201);
  // The hose reel under it on a wall bracket.
  box(g, M.gunmetalMat, 0.5, 0.06, 0.26, fx, 0.88, fzb + 0.13);
  const reel = new THREE.Group();
  reel.position.set(fx, 0.55, fzb + 0.16);
  g.add(reel);
  cyl(reel, M.liveryMat, 0.26, 0.02, 0, 0, -0.1, 'z', 16);
  cyl(reel, M.liveryMat, 0.26, 0.02, 0, 0, 0.1, 'z', 16);
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 6, 18), M.rubberMat);
  hose.scale.set(1, 1, 3.2);
  reel.add(hose);
  cyl(reel, M.steelMat, 0.05, 0.24, 0, 0, 0, 'z', 10);
  box(g, M.gunmetalMat, 0.05, 0.36, 0.04, fx - 0.22, 0.7, fzb + 0.04);
  rod(g, M.steelMat, [fx + 0.18, 0.4, fzb + 0.25], [fx + 0.3, 0.2, fzb + 0.3], 0.02, 8);
  cyl(g, M.steelMat, 0.028, 0.12, fx + 0.3, 0.15, fzb + 0.3, 'y', 8);

  /* ------------------------------------ LOWER DECK STATUS, ON THE PLATING */
  const px = xE - 0.02, pc = hz;
  bev(g, M.gunmetalMat, 0.05, 0.72, 0.7, px - 0.025, 1.42, pc, 0.012);
  const panel = new THREE.Group();
  panel.position.set(px - 0.05, 1.42, pc);
  panel.rotation.y = -Math.PI / 2;
  g.add(panel);
  box(panel, M.panelDarkMat, 0.6, 0.6, 0.01, 0, 0, 0.005);
  box(panel, M.trimMat, 0.3, 0.2, 0.02, -0.12, 0.13, 0.015);
  face(panel, M.crtAmberMat, 0.26, 0.16, -0.12, 0.13, 0.026);
  const dg = dialGauge(0.07, M.dialGaugePsiMat, M.trimMat);
  dg.position.set(0.17, 0.13, 0.03);
  panel.add(dg);
  for (let i = 0; i < 5; i++) {
    cyl(panel, M.gunmetalMat, 0.016, 0.01, -0.2 + i * 0.1, -0.08, 0.01, 'z', 8);
    cyl(panel, i < 3 ? M.greenLampMat : M.amberLampMat, 0.01, 0.01, -0.2 + i * 0.1, -0.08, 0.018, 'z', 8);
  }
  for (let i = 0; i < 4; i++) {
    box(panel, M.steelMat, 0.022, 0.03, 0.01, -0.15 + i * 0.1, -0.2, 0.013);
    rod(panel, M.steelMat, [-0.15 + i * 0.1, -0.2, 0.018], [-0.15 + i * 0.1, -0.18, 0.045], 0.004, 5);
  }
  const deckTag = placard('DECK 02  BELOW', { w: 0.4, h: 0.07 });
  deckTag.position.set(0, 0.34, 0.012);
  panel.add(deckTag);
  panel.add(cableRun([0.25, -0.3, 0.02], [0.28, -1.3, 0.04], M.cableMat, { sag: 0.05, radius: 0.012, segments: 8 }));

  ship.bake(g);

  // The hatch and its rail, run out to the plating; the forward locker; the
  // fire cabinet and reel on the aft bulkhead.
  ship.addCollider(rx0 - 0.05, xE, rz0 - 0.05, rz1 + 0.05);
  ship.addCollider(lx0 - 0.05, lx1 + 0.05, lzf - 0.06, -2.9);
  ship.addCollider(fx - 0.45, fx + 0.45, -5.4, fzb + 0.33);

  // Overhead, the shaft, and the landing below.
  ship.addLight('stairwell-overhead', [2.9, 2.7, -4.15], 0xffd9a0, 2.0, 6);
  ship.addLight('stairwell-shaft', [hx, -1.2, hz], 0xffa040, 1.1, 3.2);
  ship.addLight('stairwell-landing', [H.maxX + 0.3, depth + 1.2, hz], 0xffc070, 0.8, 2.4);
}
