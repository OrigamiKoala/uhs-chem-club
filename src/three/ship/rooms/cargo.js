/**
 * ship/rooms/cargo.js — The cargo hold.
 *
 * A freighter's hold is the one room aboard built to be abused, so nothing in
 * it is delicate: an ISO box with real corner castings and door rods against
 * the aft bulkhead, a strapped crate on its roof under the hoist that put it
 * there, a drum rack bolted to the plating, a skid of crates lashed to deck
 * rings, and the lifter that moves all of it parked in its painted bay.
 *
 * The manifest terminal is the station, and it stands where the player is
 * already looking from the standing spot: square ahead on the starboard
 * plating, a raked screen in a hooded bezel over a writing desk. Its screen
 * is its own un-baked mesh because the stage swaps its texture.
 *
 * The floor is a floor. Every collider runs to the next one or to a wall, so
 * the only deck left between them is aisle a body can walk down.
 */

import * as THREE from "three";
import { boltLine, placard } from "../../materials/pbr-kit.js";
import { createCargoManifestTexture } from "../../materials/textures.js";
import { ROOMS } from "../../ship-rooms.js";
import { aimBoxFromBounds } from "../../aim-target.js";
import { dressRoomShell, box, cyl, cylGeo, chamferedRect, lamp } from "../kit.js";

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

/** A group standing at (x, 0, z) turned by ry: local +z is "out of the thing it is mounted on". */
function mount(parent, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
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

function holdMats(ship) {
  if (!ship._holdMats) {
    ship._holdMats = {
      // Olive drab, the colour every surplus crate in the sector was issued in.
      crate: new THREE.MeshStandardMaterial({ color: 0x4b4a38, roughness: 0.84, metalness: 0.28 }),
      // Plant yellow, faded to ochre under forty years of hands.
      plant: new THREE.MeshStandardMaterial({ color: 0x8a6a28, roughness: 0.66, metalness: 0.35 })
    };
  }
  return ship._holdMats;
}

/* ------------------------------------------------------------ the pieces */

/**
 * A freight box, long along x: corner posts and castings, rails, a
 * corrugated long side facing +z, and the door end at −x with its rods.
 */
function freightBox(g, M, K, cx, cz, w, d, h) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  box(g, M.panelDarkMat, w - 0.1, h - 0.12, d - 0.1, cx, h / 2, cz);
  for (const x of [x0 + 0.045, x1 - 0.045]) {
    for (const z of [z0 + 0.045, z1 - 0.045]) {
      box(g, M.ribMat, 0.09, h - 0.2, 0.09, x, h / 2, z);
      for (const y of [0.05, h - 0.05]) {
        cbox(g, M.gunmetalMat, 0.13, 0.1, 0.13, x, y, z, 0.015);
        if (z > cz) box(g, M.ventMat, 0.05, 0.03, 0.006, x, y, z + 0.066);
      }
    }
  }
  for (const y of [0.05, h - 0.05]) {
    for (const z of [z0 + 0.045, z1 - 0.045]) box(g, M.gunmetalMat, w - 0.24, 0.08, 0.07, cx, y, z);
    for (const x of [x0 + 0.045, x1 - 0.045]) box(g, M.gunmetalMat, 0.07, 0.08, d - 0.24, x, y, cz);
  }
  // The long side: stencilled plate, pressed into trapezoid corrugations.
  box(g, M.containerMat, w - 0.18, h - 0.18, 0.02, cx, h / 2, z1 - 0.03);
  const n = Math.floor((w - 0.26) / 0.13);
  for (let i = 0; i <= n; i++) {
    const x = x0 + 0.13 + i * ((w - 0.26) / n);
    box(g, K.crate, 0.05, h - 0.22, 0.022, x, h / 2, z1 - 0.012);
  }
  // Roof, with a walked-on inset.
  box(g, M.panelMat, w - 0.16, 0.02, d - 0.16, cx, h - 0.03, cz);
  // Door end: two leaves, four locking rods with cam keepers and handles.
  box(g, M.panelMat, 0.02, h - 0.18, d - 0.18, x0 + 0.03, h / 2, cz);
  box(g, M.ventMat, 0.022, h - 0.2, 0.012, x0 + 0.03, h / 2, cz);
  for (const z of [z0 + 0.2, cz - 0.12, cz + 0.12, z1 - 0.2]) {
    cyl(g, M.steelMat, 0.014, h - 0.26, x0 + 0.005, h / 2, z, 'y', 6);
    for (const y of [0.16, h - 0.16]) box(g, M.gunmetalMat, 0.04, 0.05, 0.05, x0 + 0.005, y, z);
    box(g, M.steelMat, 0.03, 0.022, 0.16, x0 - 0.01, h * 0.45, z + 0.07, 0, 0.35, 0);
  }
  for (const z of [z0 + 0.07, z1 - 0.07]) {
    for (const y of [0.3, h / 2, h - 0.3]) cyl(g, M.gunmetalMat, 0.022, 0.1, x0 + 0.01, y, z, 'y', 8);
  }
}

/** A drum, standing: body, rolling hoops, chimes and bungs. */
function drum(g, M, mat, x, y0, z, r = 0.215, h = 0.76) {
  cyl(g, mat, r, h, x, y0 + h / 2, z, 'y', 16);
  for (const dy of [0.2, 0.56]) cyl(g, mat, r + 0.009, 0.025, x, y0 + h * dy + 0.05, z, 'y', 16);
  for (const dy of [0.012, h - 0.012]) cyl(g, M.gunmetalMat, r + 0.005, 0.024, x, y0 + dy, z, 'y', 16);
  cyl(g, M.steelMat, 0.032, 0.018, x + r * 0.5, y0 + h + 0.006, z - r * 0.25, 'y', 8);
  cyl(g, M.steelMat, 0.022, 0.018, x - r * 0.5, y0 + h + 0.006, z + r * 0.3, 'y', 8);
}

/** A flush deck ring: a recessed plate with a lashing ring lying in it. */
function deckRing(g, M, x, z) {
  box(g, M.gunmetalMat, 0.1, 0.008, 0.1, x, 0.004, z);
  ring(g, M.steelMat, 0.034, 0.008, x, 0.012, z, 'y', 12);
}

/* ================================================================ BUILD */

export function buildCargoRoom(ship) {
  const M = ship;
  const K = holdMats(ship);
  const S = stripeMat(ship);

  dressRoomShell(ship, 'cargo', {
    // The whole starboard plating carries the rack, the terminal and the skid.
    keepClear: [{ side: 'E', from: -2.79, to: 0.39 }],
    fill: { panels: 4, vent: 1.2, conduit: 2.0, machinery: 1.2, light: 0.9 },
    ribSpacing: 1.1,
    chamferStrip: true,
    seed: 17
  });

  const g = new THREE.Group();
  g.name = 'cargo';

  /* ---------------- FREIGHT, against the aft bulkhead ---------------- */
  freightBox(g, M, K, 3.25, -2.13, 1.7, 1.1, 1.3);

  // A strapped crate on its roof, where the hoist set it down.
  const cb = { x: 3.2, z: -2.15, y: 1.3 };
  cbox(g, K.crate, 1.1, 0.62, 0.8, cb.x, cb.y + 0.31, cb.z, 0.045);
  box(g, M.gunmetalMat, 1.06, 0.03, 0.76, cb.x, cb.y + 0.625, cb.z);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) cbox(g, M.gunmetalMat, 0.07, 0.6, 0.07, cb.x + sx * 0.53, cb.y + 0.31, cb.z + sz * 0.38, 0.01);
    cyl(g, M.steelMat, 0.014, 0.2, cb.x + sx * 0.57, cb.y + 0.42, cb.z, 'z', 6);
    for (const dz of [-0.1, 0.1]) box(g, M.gunmetalMat, 0.03, 0.03, 0.03, cb.x + sx * 0.56, cb.y + 0.42, cb.z + dz);
  }
  for (const sx of [-0.3, 0.3]) {
    const x = cb.x + sx;
    box(g, M.liveryMat, 0.05, 0.008, 0.83, x, cb.y + 0.645, cb.z);
    for (const sz of [-1, 1]) {
      box(g, M.liveryMat, 0.05, 0.64, 0.008, x, cb.y + 0.32, cb.z + sz * 0.415);
      ring(g, M.steelMat, 0.03, 0.007, x, cb.y + 0.02, cb.z + sz * 0.44, 'z', 10);
    }
    cbox(g, M.steelMat, 0.07, 0.06, 0.035, x, cb.y + 0.28, cb.z + 0.428, 0.008);
  }
  const lot = placard('LOT 0417 // 2T', { w: 0.34, h: 0.08 });
  lot.position.set(cb.x, cb.y + 0.46, cb.z + 0.402);
  g.add(lot);
  // A sealed case beside it.
  const ks = mount(g, 3.98, -2.3, 0.2);
  cbox(ks, M.panelDarkMat, 0.42, 0.26, 0.3, 0, 1.43, 0, 0.03);
  box(ks, M.gunmetalMat, 0.43, 0.03, 0.31, 0, 1.49, 0);
  for (const sx of [-0.12, 0.12]) box(ks, M.steelMat, 0.05, 0.05, 0.02, sx, 1.49, 0.16);
  cyl(ks, M.cableMat, 0.014, 0.16, 0, 1.58, 0, 'x', 6);

  ship.addCollider(2.33, 4.2, -2.79, -1.52);

  /* ---------------- DRUM RACK, bolted to the plating ---------------- */
  const rx0 = 4.8, rx1 = 5.47, rz0 = -2.66, rz1 = -1.72;
  for (const x of [rx0, rx1]) {
    for (const z of [rz0, rz1]) {
      box(g, M.ribMat, 0.07, 1.84, 0.07, x, 0.92, z);
      box(g, M.gunmetalMat, 0.12, 0.02, 0.12, x, 0.01, z);
    }
  }
  for (const z of [rz0, rz1]) box(g, S, 0.075, 0.34, 0.075, rx0, 0.19, z);
  for (const y of [0.07, 0.9, 1.78]) {
    box(g, M.gunmetalMat, rx1 - rx0 + 0.06, 0.04, rz1 - rz0 - 0.06, (rx0 + rx1) / 2, y, (rz0 + rz1) / 2);
    for (const x of [rx0, rx1]) box(g, M.ribMat, 0.06, 0.07, rz1 - rz0, x, y, (rz0 + rz1) / 2);
  }
  // Front restraint bars on each tier, and a braced back.
  for (const y of [0.55, 1.37]) cyl(g, M.steelMat, 0.018, rz1 - rz0, rx0 - 0.02, y, (rz0 + rz1) / 2, 'z', 8);
  rod(g, M.gunmetalMat, 0.014, [rx1, 0.1, rz0], [rx1, 0.88, rz1]);
  rod(g, M.gunmetalMat, 0.014, [rx1, 0.92, rz0], [rx1, 1.76, rz1]);
  rod(g, M.gunmetalMat, 0.014, [rx0 + 0.04, 0.1, rz1], [rx1 - 0.04, 0.88, rz1]);
  const drumMats = [M.liveryMat, K.crate, M.panelDarkMat, M.liveryMat];
  let di = 0;
  for (const y0 of [0.09, 0.92]) {
    for (const z of [-2.43, -1.95]) drum(g, M, drumMats[di++], 5.135, y0, z);
  }
  const rackTag = placard('BAY 3 // FUEL DRUM', { w: 0.34, h: 0.07 });
  rackTag.position.set(rx0 - 0.04, 1.62, -2.19);
  rackTag.rotation.y = -Math.PI / 2;
  g.add(rackTag);
  // The hoist's pendant hangs in the gap between the box and the rack.
  cyl(g, M.cableMat, 0.009, 1.15, 4.42, 2.05, -1.98, 'y', 6);
  cbox(g, M.panelDarkMat, 0.08, 0.22, 0.07, 4.42, 1.37, -1.98, 0.012);
  const pend = mount(g, 4.42, -1.945, 0);
  lamp(pend, M, 0, 1.43, 0, M.greenLampMat, 0.011);
  lamp(pend, M, 0, 1.39, 0, M.amberLampMat, 0.011);
  cyl(pend, M.redLampMat, 0.02, 0.02, 0, 1.32, 0.012, 'z', 10);

  ship.addCollider(4.2, 5.44, -2.79, -1.65);

  /* ---------------- MANIFEST TERMINAL, on the starboard plating ---------------- */
  // Local +z is into the room (world −x); local x runs forward (world +z).
  const T = mount(g, 5.6, -1.14, -Math.PI / 2);
  for (const sx of [-0.45, 0.45]) {
    box(T, M.ribMat, 0.07, 2.3, 0.08, sx, 1.15, 0.08);
    T.add(boltLine([sx, 0.2, 0.122], [sx, 2.1, 0.122], 8, M.steelMat, { size: 0.011 }));
  }
  box(T, M.panelDarkMat, 0.84, 1.9, 0.02, 0, 1.2, 0.03);
  // Base cabinet with a hinged access door.
  cbox(T, M.gunmetalMat, 0.7, 0.86, 0.42, 0, 0.49, 0.33, 0.03);
  box(T, M.cableMat, 0.62, 0.06, 0.36, 0, 0.03, 0.31);
  box(T, M.panelMat, 0.58, 0.66, 0.015, 0, 0.5, 0.545);
  box(T, M.panelDarkMat, 0.44, 0.48, 0.01, 0, 0.5, 0.556);
  for (let i = 0; i < 5; i++) box(T, M.ventMat, 0.3, 0.012, 0.004, 0, 0.24 + i * 0.03, 0.562);
  for (const y of [0.3, 0.7]) cyl(T, M.gunmetalMat, 0.016, 0.1, -0.3, y, 0.55, 'y', 8);
  for (const y of [0.44, 0.58]) box(T, M.steelMat, 0.02, 0.02, 0.03, 0.24, y, 0.56);
  cyl(T, M.steelMat, 0.011, 0.16, 0.24, 0.51, 0.578, 'y', 6);
  // The desk: raked, a keypad let into it, a palm rail along its lip.
  const desk = new THREE.Group();
  desk.position.set(0, 0.95, 0.47);
  desk.rotation.x = 0.24;
  T.add(desk);
  cbox(desk, M.trimMat, 0.8, 0.045, 0.38, 0, 0, 0, 0.02, 'x');
  box(desk, M.keyboardMat, 0.52, 0.012, 0.18, -0.06, 0.026, 0.02);
  cyl(desk, M.steelMat, 0.014, 0.7, 0, 0.04, 0.2, 'x', 8);
  for (const sx of [-0.3, 0.3]) box(desk, M.gunmetalMat, 0.03, 0.04, 0.04, sx, 0.02, 0.19);
  cbox(desk, M.panelDarkMat, 0.08, 0.04, 0.16, 0.3, 0.04, -0.04, 0.012);
  cbox(desk, M.cableMat, 0.05, 0.03, 0.08, 0.3, 0.07, 0.0, 0.01);
  // The screen, hooded, in a bezel with a lip it is recessed behind.
  const hood = new THREE.Group();
  hood.position.set(0, 1.4, 0.3);
  hood.rotation.x = -0.22;
  T.add(hood);
  cbox(hood, M.gunmetalMat, 0.84, 0.6, 0.3, 0, 0, -0.02, 0.05, 'z');
  box(hood, M.trimMat, 0.76, 0.05, 0.04, 0, 0.24, 0.15);
  box(hood, M.trimMat, 0.76, 0.05, 0.04, 0, -0.16, 0.15);
  for (const sx of [-1, 1]) box(hood, M.trimMat, 0.05, 0.45, 0.04, sx * 0.355, 0.04, 0.15);
  cbox(hood, M.gunmetalMat, 0.88, 0.02, 0.18, 0, 0.3, 0.2, 0.01, 'y', 0.35);
  for (let i = 0; i < 3; i++) {
    cyl(hood, M.cableMat, 0.022, 0.03, -0.26 + i * 0.09, -0.225, 0.14, 'z', 10);
    cyl(hood, M.steelMat, 0.008, 0.012, -0.26 + i * 0.09, -0.225, 0.16, 'z', 6);
  }
  lamp(hood, M, 0.12, -0.225, 0.13, M.greenLampMat);
  lamp(hood, M, 0.18, -0.225, 0.13, M.amberLampMat);
  lamp(hood, M, 0.24, -0.225, 0.13, M.amberLampMat);
  box(hood, M.ventMat, 0.3, 0.01, 0.005, 0.2, -0.27, 0.131);
  ship.cargoScreenMat = new THREE.MeshBasicMaterial({
    map: createCargoManifestTexture(0, 8, ''),
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.35), ship.cargoScreenMat);
  screen.position.set(0, 0.04, 0.141);
  screen.userData.noMerge = true;
  hood.add(screen);
  // A switch module over it, toggles behind a guard bar, and its loom.
  cbox(T, M.panelDarkMat, 0.6, 0.16, 0.1, 0, 1.9, 0.1, 0.02, 'z');
  for (let i = 0; i < 6; i++) {
    const x = -0.2 + i * 0.07;
    box(T, M.gunmetalMat, 0.03, 0.03, 0.012, x, 1.89, 0.155);
    box(T, i === 2 ? M.redLampMat : M.steelMat, 0.012, 0.038, 0.012, x, 1.9, 0.172, -0.45);
  }
  box(T, M.trimMat, 0.5, 0.012, 0.03, 0, 1.845, 0.18);
  lamp(T, M, 0.25, 1.9, 0.15, M.amberLampMat);
  for (const sx of [-0.3, -0.24]) cyl(T, M.cableMat, 0.018, 0.44, sx, 2.2, 0.075, 'y', 6);
  box(T, M.gunmetalMat, 0.14, 0.04, 0.05, -0.27, 2.36, 0.075);
  const mTag = placard('HOLD 2 MANIFEST', { w: 0.34, h: 0.07 });
  mTag.position.set(0, 2.06, 0.1);
  T.add(mTag);

  ship.addCollider(4.93, 5.44, -1.65, -0.62);

  /* ---------------- SKID OF CRATES, lashed to the deck ---------------- */
  for (const x of [4.55, 4.93, 5.3]) cbox(g, M.gunmetalMat, 0.08, 0.1, 0.7, x, 0.05, -0.17, 0.015);
  for (let i = 0; i < 4; i++) box(g, M.trimMat, 0.95, 0.025, 0.12, 4.925, 0.112, -0.44 + i * 0.18);
  cbox(g, K.crate, 0.92, 0.66, 0.68, 4.925, 0.455, -0.17, 0.04);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cbox(g, M.gunmetalMat, 0.06, 0.64, 0.06, 4.925 + sx * 0.44, 0.455, -0.17 + sz * 0.32, 0.01);
  }
  box(g, M.gunmetalMat, 0.9, 0.03, 0.66, 4.925, 0.78, -0.17);
  cbox(g, K.crate, 0.7, 0.5, 0.55, 4.95, 1.035, -0.2, 0.035);
  box(g, M.gunmetalMat, 0.68, 0.025, 0.53, 4.95, 1.27, -0.2);
  const c3 = mount(g, 4.92, -0.14, -0.15);
  cbox(c3, M.panelDarkMat, 0.42, 0.24, 0.34, 0, 1.41, 0, 0.03);
  box(c3, M.gunmetalMat, 0.43, 0.025, 0.35, 0, 1.46, 0);
  for (const sx of [-0.12, 0.12]) box(c3, M.steelMat, 0.05, 0.045, 0.02, sx, 1.45, 0.175);
  // Two ratchet straps over the stack, down its face to rings in the deck.
  for (const z of [-0.36, -0.02]) {
    box(g, M.liveryMat, 0.72, 0.008, 0.045, 4.95, 1.29, z);
    box(g, M.liveryMat, 0.008, 0.5, 0.045, 4.597, 1.04, z);
    box(g, M.liveryMat, 0.13, 0.008, 0.045, 4.53, 0.8, z);
    box(g, M.liveryMat, 0.008, 0.66, 0.045, 4.462, 0.46, z);
    rod(g, M.liveryMat, 0.006, [4.462, 0.13, z], [4.38, 0.015, z], 4);
    cbox(g, M.steelMat, 0.035, 0.07, 0.06, 4.452, 0.5, z, 0.008);
    deckRing(g, M, 4.38, z);
  }

  ship.addCollider(4.33, 5.44, -0.62, 0.39);

  /* ---------------- THE LIFTER, parked in its bay ---------------- */
  // Local −z is its forks (world −x, toward the door); local +x is world −z.
  const L = mount(g, 3.08, -0.18, Math.PI / 2);
  cbox(L, K.plant, 0.72, 0.34, 0.58, 0, 0.29, 0.03, 0.05, 'z');
  box(L, M.gunmetalMat, 0.62, 0.06, 0.56, 0, 0.1, 0.03);
  cbox(L, M.ironMat, 0.72, 0.38, 0.1, 0, 0.3, 0.37, 0.03, 'z');
  box(L, S, 0.6, 0.1, 0.006, 0, 0.36, 0.423);
  box(L, S, 0.6, 0.08, 0.006, 0, 0.18, -0.264);
  for (const sx of [-1, 1]) {
    for (const z of [-0.16, 0.26]) {
      cyl(L, M.cableMat, 0.11, 0.09, sx * 0.33, 0.11, z, 'x', 12);
      cyl(L, M.steelMat, 0.05, 0.1, sx * 0.33, 0.11, z, 'x', 8);
      box(L, M.gunmetalMat, 0.11, 0.03, 0.28, sx * 0.335, 0.25, z);
    }
  }
  box(L, M.trimMat, 0.6, 0.02, 0.3, 0, 0.47, 0.16);
  // Control column and its head: two sticks, a lamp, a readout.
  cyl(L, M.steelMat, 0.028, 0.56, 0, 0.74, -0.08, 'y', 8);
  const head = new THREE.Group();
  head.position.set(0, 1.06, -0.07);
  head.rotation.x = -0.45;
  L.add(head);
  cbox(head, M.gunmetalMat, 0.36, 0.12, 0.18, 0, 0, 0, 0.025, 'x');
  for (const sx of [-0.1, 0.1]) {
    cyl(head, M.steelMat, 0.011, 0.11, sx, 0.11, 0, 'y', 6);
    const k = new THREE.Mesh(cylGeo(0.024, 0.02, 0.05, 8), M.cableMat);
    k.position.set(sx, 0.18, 0);
    head.add(k);
  }
  box(head, M.ventMat, 0.08, 0.005, 0.06, 0, 0.062, 0.02);
  cyl(head, M.amberLampMat, 0.012, 0.01, 0, 0.064, -0.05, 'y', 8);
  // Roll cage over the operator.
  for (const sx of [-0.3, 0.3]) {
    for (const z of [-0.02, 0.36]) cyl(L, M.gunmetalMat, 0.024, 1.44, sx, 1.18, z, 'y', 8);
    box(L, M.gunmetalMat, 0.05, 0.05, 0.44, sx, 1.9, 0.17);
  }
  for (let i = 0; i < 4; i++) box(L, M.gunmetalMat, 0.62, 0.03, 0.04, 0, 1.9, -0.02 + i * 0.127);
  cyl(L, M.gunmetalMat, 0.04, 0.05, 0.24, 1.94, 0.33, 'y', 10);
  cyl(L, M.amberLampMat, 0.03, 0.06, 0.24, 1.99, 0.33, 'y', 10);
  // The mast, its carriage and backrest, the lift ram and the forks.
  for (const sx of [-0.24, 0.24]) cbox(L, M.gunmetalMat, 0.06, 1.8, 0.08, sx, 1.0, -0.32, 0.012);
  for (const y of [0.14, 1.86]) box(L, M.gunmetalMat, 0.54, 0.06, 0.08, 0, y, -0.32);
  cyl(L, M.gunmetalMat, 0.045, 0.8, 0, 0.55, -0.28, 'y', 10);
  cyl(L, M.steelMat, 0.024, 0.5, 0, 1.2, -0.28, 'y', 8);
  for (const sx of [-0.12, 0.12]) box(L, M.cableMat, 0.02, 1.4, 0.012, sx, 1.1, -0.29);
  box(L, K.plant, 0.56, 0.32, 0.04, 0, 0.34, -0.38);
  for (const sx of [-0.22, 0, 0.22]) box(L, M.gunmetalMat, 0.03, 0.5, 0.03, sx, 0.74, -0.38);
  box(L, M.gunmetalMat, 0.5, 0.03, 0.03, 0, 0.99, -0.38);
  for (const sx of [-0.17, 0.17]) {
    cbox(L, M.steelMat, 0.09, 0.035, 0.42, sx, 0.08, -0.6, 0.01, 'z');
    box(L, M.steelMat, 0.09, 0.3, 0.035, sx, 0.24, -0.41);
  }
  const lift = placard('LIFTER 07', { w: 0.26, h: 0.07 });
  lift.position.set(0.363, 0.32, 0.04);
  lift.rotation.y = Math.PI / 2;
  L.add(lift);

  ship.addCollider(2.27, 3.52, -0.62, 0.39);

  /* ---------------- OVERHEAD HOIST RAIL ---------------- */
  const rz = -2.05, ra = 1.72, rb = 5.08, rl = rb - ra, rm = (ra + rb) / 2;
  box(g, M.gunmetalMat, rl, 0.025, 0.16, rm, 2.635, rz);
  box(g, S, rl, 0.12, 0.022, rm, 2.71, rz);
  box(g, M.gunmetalMat, rl, 0.025, 0.16, rm, 2.785, rz);
  for (const x of [ra + 0.04, rb - 0.04]) cbox(g, M.ironMat, 0.08, 0.14, 0.18, x, 2.58, rz, 0.015);
  for (const x of [2.15, 3.45, 4.75]) {
    box(g, M.gunmetalMat, 0.12, 0.02, 0.2, x, 2.805, rz);
    cyl(g, M.steelMat, 0.012, 0.17, x, 2.89, rz, 'y', 6);
    box(g, M.gunmetalMat, 0.16, 0.015, 0.16, x, 2.968, rz);
  }
  // Trolley and chain hoist, parked over the crate it last set down.
  const hx = 3.25;
  for (const s of [-1, 1]) {
    box(g, M.gunmetalMat, 0.26, 0.16, 0.02, hx, 2.64, rz + s * 0.1);
    for (const dx of [-0.08, 0.08]) cyl(g, M.steelMat, 0.03, 0.03, hx + dx, 2.67, rz + s * 0.085, 'z', 8);
  }
  cbox(g, K.plant, 0.28, 0.22, 0.2, hx, 2.44, rz, 0.03, 'x');
  cyl(g, M.gunmetalMat, 0.09, 0.07, hx - 0.16, 2.44, rz, 'x', 12);
  cyl(g, M.steelMat, 0.012, 0.3, hx + 0.06, 2.18, rz, 'y', 6);
  cbox(g, M.gunmetalMat, 0.1, 0.12, 0.08, hx + 0.06, 1.99, rz, 0.015);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 12, Math.PI * 1.4), M.steelMat);
  hook.position.set(hx + 0.06, 1.91, rz);
  hook.rotation.z = Math.PI * 0.8;
  g.add(hook);
  const swl = placard('HOIST 1 // SWL 2T', { w: 0.3, h: 0.07 });
  swl.position.set(2.3, 2.71, rz + 0.013);
  g.add(swl);

  /* ---------------- DECK MARKINGS ---------------- */
  box(g, S, 1.8, 0.006, 0.08, 3.28, 0.003, -1.45);
  box(g, S, 1.36, 0.006, 0.08, 2.9, 0.003, -0.68);
  box(g, S, 0.08, 0.006, 0.94, 2.2, 0.003, -0.2);
  for (const [x, z] of [[2.55, -1.3], [3.95, -1.3], [4.05, -0.3], [1.8, -2.4]]) deckRing(g, M, x, z);

  ship.group.add(g);
  ship.bake(g);

  ship.addLight('cargo-hold', [3.3, 2.75, -1.1], 0xffd9a0, 3.0, 10);
  ship.addLight('cargo-manifest', [4.85, 1.45, -1.14], 0xffa040, 1.3, 4.5);

  ship.interactiveTerminals.push({
    id: 'cargo', name: ROOMS.cargo.name, pos: [3.3, 1.55, -1.0], route: '#/inventory',
    prompt: 'ACCESS CARGO & INVENTORY',
    // The manifest terminal on the plating, and the freight stack beside it.
    aim: [
      aimBoxFromBounds(4.8, 5.6, 0, 2.1, -1.65, -0.62),
      aimBoxFromBounds(2.33, 4.2, 0, 2.0, -2.79, -1.52)
    ]
  });
}
