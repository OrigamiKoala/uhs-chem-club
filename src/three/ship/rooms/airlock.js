/**
 * ship/rooms/airlock.js — The airlock.
 *
 * The one door aboard that holds vacuum back, so it is built like it: an
 * octagonal pressure hatch in a heavy surround bolted to the starboard
 * plating, swinging INWARD so the pressure seats it, dogged by a handwheel
 * and a locking bar, lifted on two rams, with a sight port in the leaf and a
 * beacon under the header that turns while the lock is live. The player
 * stands square in front of it; that is the station.
 *
 * Everything else in the compartment serves the hatch: the cycle panel with
 * its lamps and the big gauge that says whether it is safe to open, the
 * equalisation valves that make it so, two pressure suits hung on their
 * racks with the helmets on the shelf above, and a bench to seal up on.
 *
 * The chamfer stops short of the hatch on all three walls: the surround and
 * its header run to the deckhead, which is what makes the door read as
 * structure rather than furniture stood against a wall.
 */

import * as THREE from "three";
import { boltLine, boltRing, placard, pipeFlange, dialGauge } from "../../materials/pbr-kit.js";
import { ROOMS } from "../../ship-rooms.js";
import { aimBoxFromBounds } from "../../aim-target.js";
import {
  dressRoomShell, box, cyl, cylGeo, tube, extrude, chamferedRect, chamferedHole, lamp
} from "../kit.js";

/* ---------------------------------------------------------------- parts */

const ALL = ['tl', 'tr', 'bl', 'br'];
const _geo = new Map();
const kf = v => Math.round(v * 1000);

/**
 * A box with the edges that run along `axis` cut off by `c`: 'y' chamfers the
 * uprights of a crate, 'z' the rim of a face plate, 'x' the length of a rail.
 */
function chamferGeo(w, h, d, c, axis) {
  const key = `${axis}${kf(w)}_${kf(h)}_${kf(d)}_${kf(c)}`;
  let g = _geo.get(key);
  if (g) return g;
  const o = { bevelEnabled: false, curveSegments: 1 };
  if (axis === 'y') {
    g = new THREE.ExtrudeGeometry(chamferedRect(w, d, c, ALL), { ...o, depth: h });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -h / 2, 0);
  } else if (axis === 'z') {
    g = new THREE.ExtrudeGeometry(chamferedRect(w, h, c, ALL), { ...o, depth: d });
    g.translate(0, 0, -d / 2);
  } else {
    g = new THREE.ExtrudeGeometry(chamferedRect(d, h, c, ALL), { ...o, depth: w });
    g.rotateY(Math.PI / 2);
    g.translate(-w / 2, 0, 0);
  }
  _geo.set(key, g);
  return g;
}

function cbox(parent, mat, w, h, d, x, y, z, c = 0.02, axis = 'y', rx = 0, ry = 0, rz = 0) {
  const lim = axis === 'y' ? Math.min(w, d) : axis === 'z' ? Math.min(w, h) : Math.min(d, h);
  const m = new THREE.Mesh(chamferGeo(w, h, d, Math.min(c, lim * 0.45), axis), mat);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

const _up = new THREE.Vector3(0, 1, 0);
/** A cylinder from point a to point b. */
function rod(parent, mat, r, a, b, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const m = new THREE.Mesh(cylGeo(r, r, dir.length(), seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  parent.add(m);
  return m;
}

/** A torus in the plane square to `axis`. */
function ring(parent, mat, R, t, x, y, z, axis = 'z', seg = 16) {
  const key = `t${kf(R)}_${kf(t)}_${seg}`;
  let g = _geo.get(key);
  if (!g) { g = new THREE.TorusGeometry(R, t, 6, seg); _geo.set(key, g); }
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (axis === 'y') m.rotation.x = Math.PI / 2;
  else if (axis === 'x') m.rotation.y = Math.PI / 2;
  parent.add(m);
  return m;
}

function ball(parent, mat, r, x, y, z) {
  const key = `s${kf(r)}`;
  let g = _geo.get(key);
  if (!g) { g = new THREE.SphereGeometry(r, 12, 8); _geo.set(key, g); }
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** A group standing at (x, 0, z) turned by ry: local +z is "out of the thing it is mounted on". */
function mount(parent, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

/** A handwheel facing +z: rim, spokes, hub. */
function handwheel(parent, M, r, x, y, z, mat = M.steelMat) {
  ring(parent, mat, r, r * 0.12, x, y, z, 'z', 18);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    rod(parent, mat, r * 0.06, [x, y, z], [x + Math.cos(a) * r, y + Math.sin(a) * r, z], 6);
  }
  cyl(parent, M.brassMat, r * 0.22, r * 0.3, x, y, z, 'z', 10);
}

/** Hazard paint laid at a fixed size in the world, so a long stripe is not one stretched chevron. */
function stripeMat(ship) {
  if (!ship._worldStripeMat) {
    const t = ship.hazardTex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.78, metalness: 0.18 });
    m.userData.worldUV = 0.34;
    ship._worldStripeMat = m;
  }
  return ship._worldStripeMat;
}

/* ------------------------------------------------------------ the pieces */

/**
 * A pressure suit on its rack, built facing +z from the wall at z = 0: the
 * rack, the suit hung from its yoke with its pack against the back plate,
 * boots in the tray, the helmet on the shelf above.
 */
function suitRack(g, M) {
  // Rack.
  for (const sx of [-0.38, 0.38]) box(g, M.ribMat, 0.06, 2.35, 0.07, sx, 1.175, 0.045);
  box(g, M.panelDarkMat, 0.72, 2.2, 0.02, 0, 1.12, 0.022);
  g.add(boltLine([-0.3, 2.12, 0.034], [0.3, 2.12, 0.034], 5, M.steelMat, { size: 0.01 }));
  box(g, M.trimMat, 0.76, 0.03, 0.34, 0, 2.0, 0.18);
  box(g, M.gunmetalMat, 0.76, 0.06, 0.02, 0, 2.03, 0.35);
  for (const sx of [-0.33, 0.33]) box(g, M.gunmetalMat, 0.03, 0.22, 0.03, sx, 1.87, 0.16, 0.8);
  box(g, M.gunmetalMat, 0.7, 0.04, 0.42, 0, 0.02, 0.26);
  box(g, M.gunmetalMat, 0.7, 0.06, 0.02, 0, 0.05, 0.47);
  // Yoke and hook.
  cyl(g, M.steelMat, 0.014, 0.3, 0, 1.8, 0.18, 'z', 6);
  box(g, M.steelMat, 0.3, 0.025, 0.04, 0, 1.8, 0.3);
  cyl(g, M.steelMat, 0.01, 0.14, 0, 1.73, 0.3, 'y', 6);

  // The suit.
  const z = 0.3;
  cbox(g, M.paintWhiteMat, 0.42, 0.55, 0.26, 0, 1.38, z, 0.07);
  cbox(g, M.gunmetalMat, 0.3, 0.22, 0.03, 0, 1.47, z + 0.14, 0.04, 'z');
  cbox(g, M.panelDarkMat, 0.14, 0.08, 0.05, 0.04, 1.33, z + 0.155, 0.012, 'z');
  lamp(g, M, 0.08, 1.34, z + 0.18, M.greenLampMat, 0.008);
  lamp(g, M, 0.01, 1.34, z + 0.18, M.amberLampMat, 0.008);
  box(g, M.liveryMat, 0.05, 0.4, 0.01, -0.15, 1.36, z + 0.133);
  ring(g, M.steelMat, 0.12, 0.025, 0, 1.68, z, 'y', 16);
  cbox(g, M.gunmetalMat, 0.36, 0.52, 0.13, 0, 1.4, 0.105, 0.03);
  for (const sx of [-0.1, 0.1]) cyl(g, M.panelDarkMat, 0.045, 0.46, sx, 1.4, 0.1, 'y', 10);
  tube(g, M.cableMat, [[0.19, 1.28, 0.15], [0.27, 1.2, 0.3], [0.14, 1.28, 0.45]], 0.018, 6);
  tube(g, M.cableMat, [[-0.19, 1.5, 0.15], [-0.25, 1.62, 0.3], [-0.1, 1.55, 0.44]], 0.014, 6);
  for (const s of [-1, 1]) {
    ball(g, M.paintWhiteMat, 0.085, s * 0.25, 1.58, z);
    rod(g, M.paintWhiteMat, 0.062, [s * 0.27, 1.55, z], [s * 0.3, 1.25, z + 0.01], 10);
    cyl(g, M.liveryMat, 0.066, 0.05, s * 0.28, 1.44, z, 'y', 10);
    cyl(g, M.cableMat, 0.066, 0.06, s * 0.3, 1.22, z + 0.01, 'y', 10);
    rod(g, M.paintWhiteMat, 0.056, [s * 0.3, 1.2, z + 0.01], [s * 0.29, 0.94, z + 0.04], 10);
    cyl(g, M.steelMat, 0.06, 0.03, s * 0.29, 0.93, z + 0.04, 'y', 10);
    cbox(g, M.cableMat, 0.08, 0.13, 0.07, s * 0.29, 0.84, z + 0.05, 0.02);
    rod(g, M.paintWhiteMat, 0.08, [s * 0.1, 0.9, z], [s * 0.1, 0.52, z + 0.01], 10);
    cyl(g, M.cableMat, 0.083, 0.06, s * 0.1, 0.49, z + 0.01, 'y', 10);
    rod(g, M.paintWhiteMat, 0.072, [s * 0.1, 0.46, z + 0.01], [s * 0.1, 0.17, z], 10);
    cbox(g, M.cableMat, 0.13, 0.13, 0.25, s * 0.1, 0.105, z + 0.03, 0.03);
  }
  cyl(g, M.cableMat, 0.17, 0.07, 0, 1.075, z, 'y', 14);
  cbox(g, M.paintWhiteMat, 0.38, 0.2, 0.25, 0, 0.95, z, 0.05);

  // The helmet on the shelf: collar, dome, a visor across its face, a lamp.
  const hz = 0.19;
  ring(g, M.steelMat, 0.13, 0.022, 0, 2.04, hz, 'y', 16);
  ball(g, M.paintWhiteMat, 0.16, 0, 2.17, hz);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.164, 14, 6, Math.PI / 2 - 0.95, 1.9, 0.95, 0.9),
    M.screenGlassMat
  );
  visor.position.set(0, 2.17, hz);
  g.add(visor);
  cyl(g, M.gunmetalMat, 0.025, 0.05, 0.165, 2.22, hz, 'x', 8);
  cyl(g, M.amberLampMat, 0.016, 0.01, 0.193, 2.22, hz, 'x', 8);
}

/* ================================================================ BUILD */

export function buildAirlockRoom(ship) {
  const M = ship;
  const S = stripeMat(ship);
  const room = ROOMS.airlock;
  const midZ = -6.6;

  dressRoomShell(ship, 'airlock', {
    keepClear: [
      // The hatch surround and its header, floor to deckhead.
      { side: 'E', from: -7.69, to: -5.51, top: 3.0 },
      { side: 'N', from: 4.85, to: 5.6, top: 3.0 },
      { side: 'S', from: 4.85, to: 5.6, top: 3.0 },
      // Suit racks and the cycle panel; the bench and the valves.
      { side: 'N', from: 2.3, to: 4.85 },
      { side: 'S', from: 2.3, to: 4.85 }
    ],
    fill: { panels: 4, vent: 1.4, conduit: 2.2, machinery: 1.0, light: 0.8 },
    handrail: true,
    seed: 29
  });

  const g = new THREE.Group();
  g.name = 'airlock';

  /* ---------------- THE OUTER HATCH ---------------- */
  // Local +z is into the room (world −x); local x runs forward (world +z).
  const H = mount(g, 5.6, midZ, -Math.PI / 2);
  const openY = 1.23;

  // Surround, flush on the plating, and the thick frame ring proud of it.
  const outer = chamferedRect(2.08, 2.8, 0.26, ALL, 0, 1.4);
  outer.holes.push(chamferedHole(1.3, 1.86, 0.3, ALL, 0, openY));
  extrude(H, M.ribMat, outer, 0.14).position.z = 0.012;
  const frameRing = chamferedRect(1.62, 2.26, 0.4, ALL, 0, openY);
  frameRing.holes.push(chamferedHole(1.3, 1.86, 0.3, ALL, 0, openY));
  extrude(H, M.gunmetalMat, frameRing, 0.16).position.z = 0.15;
  // The dark of the opening, behind the leaf.
  box(H, M.ventMat, 1.3, 1.6, 0.01, 0, openY, 0.02);
  for (const sx of [-1, 1]) {
    box(H, S, 0.1, 1.3, 0.01, sx * 0.88, openY, 0.155);
    H.add(boltLine([sx * 0.99, 0.35, 0.155], [sx * 0.99, 2.3, 0.155], 9, M.steelMat, { size: 0.013 }));
    H.add(boltLine([sx * 0.76, 0.6, 0.312], [sx * 0.76, 1.86, 0.312], 6, M.steelMat, { size: 0.015 }));
  }
  box(H, S, 1.3, 0.1, 0.01, 0, 2.45, 0.155);
  H.add(boltLine([-0.5, 2.62, 0.155], [0.5, 2.62, 0.155], 7, M.steelMat, { size: 0.013 }));

  // The leaf: a heavy plug on a rubber seal, the blast plate on its face.
  const seal = chamferedRect(1.5, 2.06, 0.37, ALL, 0, openY);
  seal.holes.push(chamferedHole(1.36, 1.92, 0.33, ALL, 0, openY));
  extrude(H, M.cableMat, seal, 0.02).position.z = 0.31;
  extrude(H, M.gunmetalMat, chamferedRect(1.46, 2.02, 0.36, ALL, 0, openY), 0.16).position.z = 0.33;
  box(H, M.blastDoorMat, 1.0, 1.2, 0.02, 0, 1.05, 0.5);
  for (const y of [0.3, 2.16]) H.add(boltLine([-0.34, y, 0.49], [0.34, y, 0.49], 6, M.steelMat, { size: 0.013 }));
  // Sight port.
  ring(H, M.trimMat, 0.13, 0.03, 0, 1.87, 0.5, 'z', 20);
  cyl(H, M.screenGlassMat, 0.125, 0.01, 0, 1.87, 0.495, 'z', 20);
  const pb = boltRing(0.17, 8, M.steelMat, { size: 0.012 });
  pb.rotation.x = Math.PI / 2;
  pb.position.set(0, 1.87, 0.5);
  H.add(pb);
  // Dogging: the wheel, the bar it throws, the dogs at the corners.
  handwheel(H, M, 0.26, 0, 1.1, 0.57);
  cyl(H, M.gunmetalMat, 0.06, 0.06, 0, 1.1, 0.53, 'z', 10);
  cyl(H, M.steelMat, 0.024, 1.44, 0, 1.1, 0.525, 'x', 8);
  for (const sx of [-1, 1]) {
    cbox(H, M.gunmetalMat, 0.14, 0.2, 0.12, sx * 0.76, 1.1, 0.4, 0.02);
    for (const sy of [-1, 1]) {
      box(H, M.steelMat, 0.16, 0.05, 0.05, sx * 0.6, openY + sy * 0.86, 0.5, 0, 0, sx * sy * Math.PI / 4);
    }
  }
  // Hinges on the aft jamb.
  for (const y of [0.55, 1.9]) {
    cyl(H, M.gunmetalMat, 0.055, 0.28, -0.8, y, 0.42, 'y', 10);
    box(H, M.gunmetalMat, 0.4, 0.1, 0.02, -0.6, y, 0.5);
    H.add(boltLine([-0.74, y, 0.512], [-0.46, y, 0.512], 3, M.steelMat, { size: 0.011 }));
  }
  // Two rams lift the leaf off its seat.
  for (const sx of [-1, 1]) {
    const a = [sx * 0.7, 2.62, 0.3], b = [sx * 0.4, 2.1, 0.5];
    cbox(H, M.gunmetalMat, 0.14, 0.14, 0.16, a[0], a[1], 0.22, 0.02);
    cbox(H, M.gunmetalMat, 0.08, 0.08, 0.06, b[0], b[1], b[2], 0.01);
    const m = [a[0] + (b[0] - a[0]) * 0.6, a[1] + (b[1] - a[1]) * 0.6, a[2] + (b[2] - a[2]) * 0.6];
    rod(H, M.paintWhiteMat, 0.042, a, m, 12);
    rod(H, M.gunmetalMat, 0.048, [m[0] - (b[0] - a[0]) * 0.04, m[1] - (b[1] - a[1]) * 0.04, m[2] - (b[2] - a[2]) * 0.04], m, 12);
    rod(H, M.steelMat, 0.02, m, b, 8);
    lamp(H, M, sx * 0.45, 2.3, 0.31, M.redLampMat, 0.018);
  }
  // Header to the deckhead, the warning placard and the beacon under it.
  box(H, M.ribMat, 2.18, 0.16, 0.5, 0, 2.88, 0.25);
  box(H, M.gunmetalMat, 2.18, 0.02, 0.52, 0, 2.795, 0.26);
  const warn = placard('OUTER HATCH 02 // CYCLE BEFORE OPENING', { w: 1.3, h: 0.1 });
  warn.position.set(0, 2.88, 0.506);
  H.add(warn);
  cbox(H, M.gunmetalMat, 0.1, 0.04, 0.12, 0, 2.765, 0.42, 0.01);
  cyl(H, M.gunmetalMat, 0.075, 0.05, 0, 2.72, 0.42, 'y', 12);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xd99423 });
  const beacon = new THREE.Mesh(cylGeo(0.06, 0.06, 0.09, 12), beaconMat);
  beacon.position.set(0, 2.65, 0.42);
  beacon.userData.noMerge = true;
  H.add(beacon);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    rod(H, M.gunmetalMat, 0.006, [Math.cos(a) * 0.066, 2.6, 0.42 + Math.sin(a) * 0.066], [Math.cos(a) * 0.066, 2.7, 0.42 + Math.sin(a) * 0.066], 4);
  }

  ship.addCollider(4.9, 5.44, -7.69, -5.51);

  /* ---------------- CYCLE PANEL, on the forward bulkhead ---------------- */
  const P = mount(g, 4.5, -5.51, Math.PI);
  box(P, M.panelDarkMat, 0.6, 0.95, 0.02, 0, 1.5, 0.022);
  cbox(P, M.gunmetalMat, 0.52, 0.82, 0.1, 0, 1.5, 0.08, 0.04, 'z');
  box(P, M.panelMat, 0.44, 0.74, 0.01, 0, 1.5, 0.135);
  const gauge = dialGauge(0.13, M.dialGaugeBarMat, M.gunmetalMat);
  gauge.position.set(0, 1.7, 0.16);
  P.add(gauge);
  const lens = [M.redLampMat, beaconMat, M.greenLampMat];
  for (let i = 0; i < 3; i++) {
    const x = -0.12 + i * 0.12;
    cyl(P, M.gunmetalMat, 0.045, 0.02, x, 1.42, 0.145, 'z', 12);
    const l = new THREE.Mesh(cylGeo(0.03, 0.03, 0.02, 12), lens[i]);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, 1.42, 0.16);
    if (i === 1) l.userData.noMerge = true;
    P.add(l);
  }
  // The cycle lever, in its slot between two guards.
  box(P, M.ventMat, 0.05, 0.22, 0.012, 0, 1.2, 0.143);
  for (const sx of [-0.06, 0.06]) box(P, M.trimMat, 0.02, 0.26, 0.05, sx, 1.2, 0.16);
  rod(P, M.steelMat, 0.014, [0, 1.26, 0.145], [0, 1.3, 0.25], 6);
  cyl(P, M.cableMat, 0.022, 0.12, 0, 1.3, 0.25, 'x', 8);
  cyl(P, M.cableMat, 0.02, 0.54, 0.18, 2.18, 0.05, 'y', 6);
  const pTag = placard('LOCK CYCLE', { w: 0.28, h: 0.06 });
  pTag.position.set(0, 1.98, 0.14);
  P.add(pTag);

  /* ---------------- SUIT RACKS, on the forward bulkhead ---------------- */
  suitRack(mount(g, 3.6, -5.51, Math.PI), M);
  suitRack(mount(g, 2.76, -5.51, Math.PI), M);

  ship.addCollider(2.3, 4.9, -6.05, -5.51);

  /* ---------------- EQUALISATION VALVES, on the aft bulkhead ---------------- */
  const V = mount(g, 4.5, -7.69, 0);
  for (const [sx, mat, vy] of [[-0.16, M.steelMat, 1.15], [0.16, M.liveryMat, 1.35]]) {
    cyl(V, mat, 0.045, 2.4, sx, 1.2, 0.1, 'y', 12);
    cyl(V, mat, 0.045, 0.1, sx, 2.4, 0.05, 'z', 12);
    const f = pipeFlange(0.045, M.gunmetalMat, M.steelMat);
    f.position.set(sx, 0.02, 0.1);
    V.add(f);
    for (const y of [0.8, 1.95]) box(V, M.gunmetalMat, 0.1, 0.05, 0.1, sx, y, 0.05);
    cbox(V, M.gunmetalMat, 0.14, 0.2, 0.14, sx, vy, 0.1, 0.03);
    cyl(V, M.steelMat, 0.014, 0.16, sx, vy, 0.24, 'z', 6);
    handwheel(V, M, 0.1, sx, vy, 0.32, M.gunmetalMat);
  }
  cyl(V, M.steelMat, 0.035, 0.32, 0, 1.75, 0.1, 'x', 10);
  cyl(V, M.brassMat, 0.03, 0.14, 0, 1.84, 0.1, 'y', 8);
  cyl(V, M.brassMat, 0.045, 0.03, 0, 1.92, 0.1, 'y', 8);
  const vg = dialGauge(0.06, M.dialGaugePsiMat, M.gunmetalMat);
  vg.position.set(0, 1.62, 0.13);
  V.add(vg);
  // The feed to the hatch, along the bulkhead to the surround.
  cyl(V, M.liveryMat, 0.035, 0.95, 0.16 + 0.475, 2.2, 0.1, 'x', 10);
  const vTag = placard('EQ VALVE A / B', { w: 0.26, h: 0.06 });
  vTag.position.set(0, 0.7, 0.025);
  V.add(vTag);

  /* ---------------- BENCH, on the aft bulkhead ---------------- */
  const B = mount(g, 3.15, -7.69, 0);
  box(B, M.gunmetalMat, 1.5, 0.05, 0.04, 0, 0.62, 0.03);
  for (let i = 0; i < 3; i++) cbox(B, M.paddingMat, 0.48, 0.34, 0.07, -0.5 + i * 0.5, 0.82, 0.06, 0.025, 'z');
  for (const x of [-0.7, 0, 0.7]) box(B, M.gunmetalMat, 0.05, 0.42, 0.36, x, 0.21, 0.25);
  box(B, M.trimMat, 1.56, 0.04, 0.42, 0, 0.43, 0.24);
  for (let i = 0; i < 3; i++) cbox(B, M.paddingMat, 0.49, 0.07, 0.38, -0.5 + i * 0.5, 0.485, 0.25, 0.025, 'x');
  for (const x of [-0.35, 0.35]) {
    cbox(B, M.gunmetalMat, 0.6, 0.28, 0.34, x, 0.18, 0.23, 0.02);
    cyl(B, M.steelMat, 0.011, 0.16, x, 0.24, 0.415, 'x', 6);
  }
  // Two breathing bottles strapped to the plate above it.
  for (const x of [0.45, 0.65]) {
    cyl(B, M.paintWhiteMat, 0.08, 0.6, x, 1.62, 0.1, 'y', 14);
    ball(B, M.paintWhiteMat, 0.08, x, 1.92, 0.1);
    cyl(B, M.brassMat, 0.025, 0.1, x, 2.02, 0.1, 'y', 8);
  }
  for (const y of [1.45, 1.8]) box(B, M.gunmetalMat, 0.42, 0.04, 0.2, 0.55, y, 0.1);
  // A tether coiled on its hook.
  box(B, M.gunmetalMat, 0.6, 0.04, 0.03, -0.45, 1.72, 0.02);
  for (const x of [-0.65, -0.45, -0.25]) box(B, M.steelMat, 0.02, 0.02, 0.08, x, 1.7, 0.06);
  ring(B, M.liveryMat, 0.12, 0.018, -0.45, 1.56, 0.07, 'z', 18);
  ring(B, M.liveryMat, 0.1, 0.018, -0.45, 1.58, 0.09, 'z', 18);

  ship.addCollider(2.3, 4.9, -7.69, -7.12);

  /* ---------------- DECK ---------------- */
  box(g, S, 0.08, 0.006, 0.95, 4.8, 0.003, midZ);
  box(g, M.gunmetalMat, 0.46, 0.008, 0.46, 4.25, 0.004, midZ);
  box(g, M.ventMat, 0.4, 0.004, 0.4, 4.25, 0.009, midZ);
  for (let i = 0; i < 7; i++) box(g, M.trimMat, 0.4, 0.012, 0.02, 4.25, 0.014, midZ - 0.18 + i * 0.06);

  ship.group.add(g);
  ship.bake(g);

  ship.addLight('airlock-bay', [3.2, 2.7, midZ], 0xffd9a0, 2.8, 9);
  ship.addLight('airlock-beacon', [5.0, 2.55, midZ], 0xffa040, 1.4, 5);
  const beaconLight = ship.lightSources[ship.lightSources.length - 1];

  // The beacon breathes while the lock is live: a slow pulse, never a strobe.
  const base = new THREE.Color(0xd99423);
  ship.animatedElements.push({
    update(delta, time) {
      const k = Math.pow(Math.max(0, Math.sin(time * 2.4)), 2);
      beaconMat.color.copy(base).multiplyScalar(0.3 + 0.7 * k);
      beaconLight.intensity = 0.4 + 1.4 * k;
    }
  });

  ship.interactiveTerminals.push({
    id: 'airlock', name: room.name, pos: [3.4, 1.6, -6.6], route: '#/quest',
    prompt: 'AIRLOCK: DISEMBARK TO EREBUS (CHARGE GARDENS)',
    // The hatch in its surround, header to deck.
    aim: [aimBoxFromBounds(4.9, 5.6, 0, 2.96, -7.65, -5.55)]
  });
}
