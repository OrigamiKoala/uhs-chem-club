/**
 * gas-props.js — The physical things on a Bellows bench: gas tanks, the glass barrel of a cylinder, a pellet in its dish, the glass
 * over a pinhole's chambers and over a common tank.
 *
 * WHY THIS FILE EXISTS (the 2026-10-09 audit, `bench-tabletop.md` design invariant 6). A tank was going to be a card with a picture of
 * a tank on it, and a cylinder a flat bezel round a flat picture: "a bunch of squares with weird textures fitted on top". A gas
 * tank is a squat steel bottle with a domed shoulder, a valve and a hand wheel, and a gauge on its top. A cylinder is a glass barrel
 * with steel end rings that you can see the gas through. This file builds each as what it is, in the same vocabulary as
 * `lab-props.js` (the rules at the head of that file apply here unchanged): no sharp 90 degree edges but glass, nothing factory-new,
 * a figure a piece prints is painted by the kit (`c.paint`), never drawn here, only lamps are lit.
 *
 * Every builder takes the context `c` that `Table3D` fills in (`{ hw, hh, mats, own, label, paint }`) and returns a Group standing
 * on y = 0, centred on the piece, with its footprint inside `hw` x `hh`, `userData.height` set. Pure over THREE.
 */

import * as THREE from 'three';
import { roundedSlab, lathe } from './table-props.js';

const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};
const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };
const done = (g, height) => { g.userData.height = height; return g; };

/** The height of a tank, in metres: low enough that a leaned-in camera sees over it. */
export const TANK_H = 0.2;

/**
 * A gas tank: a squat steel bottle on a foot ring, a domed shoulder, a valve block with a hand wheel and a gauge head on top. `legend`
 * is a flat mesh painted by the kit (its name, its gas and its gauge), laid on the shoulder facing up. A sealed tank is painted
 * the same: only its legend says less.
 */
export function buildTank(c, { legend = null, open = false } = {}) {
  const { hw, mats: m } = c;
  const R = hw * 0.92;
  const g = new THREE.Group();
  // The body, one turned piece: foot ring, wall, rounded shoulder, neck.
  const body = lathe([
    [0.001, 0], [R * 0.86, 0], [R * 0.9, 0.004], [R * 0.9, 0.014], [R * 0.82, 0.016], [R * 0.82, 0.03],
    [R * 0.97, 0.034], [R * 0.99, 0.12], [R * 0.93, 0.158], [R * 0.74, 0.18], [R * 0.34, 0.19], [R * 0.2, 0.194], [0.001, 0.194]
  ], 36);
  g.add(mesh(body, m.labCast));
  // A band of the host's other metal round the shoulder, and a stencilled legend on the lid.
  const band = mesh(new THREE.TorusGeometry(R * 0.985, 0.006, 6, 36), m.labAnodised);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.105;
  g.add(band);
  // The valve: a brass block, a stem and a hand wheel lying flat, off to one side so the gauge reads clear.
  const vx = R * 0.52;
  g.add(at(mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.034, 14), m.labBrass), vx, 0.2, -R * 0.2));
  g.add(at(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8), m.labBrass), vx, 0.235, -R * 0.2));
  const wheel = mesh(new THREE.TorusGeometry(0.036, 0.005, 6, 18), m.labAnodised);
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(vx, 0.258, -R * 0.2);
  g.add(wheel);
  if (open) {
    // An open valve lifts its spindle a little higher.
    g.add(at(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.026, 6), m.labSteel), vx, 0.27, -R * 0.2));
  }
  // The gauge head: a short brass boss on the neck with a dark glass face.
  g.add(at(mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.03, 18), m.labBrass), -R * 0.28, 0.206, R * 0.12));
  g.add(at(mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.004, 18), m.labSmoke, { cast: false }), -R * 0.28, 0.222, R * 0.12));
  if (legend) {
    legend.position.set(0, 0.1945, 0);
    g.add(legend);
  }
  return done(g, TANK_H);
}

/**
 * A pellet in its dish: a shallow tin dish, a grey tablet of calcium carbonate lying in it, the legend painted on the dish's rim.
 */
export function buildPelletDish(c, { legend = null } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const R = Math.min(hw, hh) * 0.92;
  g.add(at(mesh(lathe([[0.001, 0], [R * 0.7, 0], [R * 0.95, 0.01], [R, 0.024], [R * 0.96, 0.026], [R * 0.84, 0.012], [0.001, 0.01]], 30), m.labCast), 0, 0, 0));
  const pellet = mesh(lathe([[0.001, 0], [R * 0.42, 0], [R * 0.46, 0.004], [R * 0.46, 0.016], [R * 0.4, 0.02], [0.001, 0.02]], 22), m.labCeramic);
  pellet.position.y = 0.012;
  g.add(pellet);
  if (legend) {
    legend.position.set(0, 0.0275, 0);
    g.add(legend);
  }
  return done(g, 0.036);
}

/**
 * A glass barrel lying on the deck, `len` x `dia` metres: a tube of glass with a steel ring at each end and a flange block at the wall end.
 * It stands over a flat picture of the gas inside it (the picture is the table's own).
 */
export function buildBarrel(len, dia, { mats: m, flange = true }) {
  const g = new THREE.Group();
  const r = dia / 2;
  const tube = mesh(new THREE.CylinderGeometry(r, r, len, 28, 1, true), m.labGlass, { cast: false, receive: false });
  tube.rotation.z = Math.PI / 2;
  tube.position.y = r;
  g.add(tube);
  for (const sx of [-1, 1]) {
    const ring = mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.012, 28), m.labSteel);
    ring.rotation.z = Math.PI / 2;
    ring.position.set(sx * (len / 2 - 0.006), r, 0);
    g.add(ring);
  }
  if (flange) {
    g.add(at(mesh(roundedSlab(0.03, dia * 1.2, dia * 1.2, 0.008, 0.002), m.labCast), -len / 2 - 0.013, r, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.05, 14), m.labBrass), -len / 2 - 0.05, r, 0));
  }
  // A foot under each ring so the barrel rests on something.
  for (const sx of [-0.4, 0.4]) {
    g.add(at(mesh(roundedSlab(0.02, dia * 0.9, r * 0.5, 0.004, 0.001), m.labCast), sx * len, r * 0.25, 0));
  }
  return done(g, dia);
}

/** A low glass lid over a flat picture: the lid of a chamber, a common tank or a tube, a capsule `len` x `wid` and `h` tall. */
export function buildLid(len, wid, h, { mats: m }) {
  const g = new THREE.Group();
  const r = wid / 2;
  const geo = new THREE.CapsuleGeometry(Math.min(r, len / 2 - 0.001), Math.max(0.01, len - 2 * Math.min(r, len / 2)), 5, 20);
  geo.rotateZ(Math.PI / 2);
  geo.scale(1, h / Math.min(r, len / 2), wid / (2 * Math.min(r, len / 2)));
  g.add(mesh(geo, m.labPane, { cast: false, receive: false }));
  for (const sx of [-1, 1]) {
    const cap = mesh(new THREE.CylinderGeometry(Math.min(r, h) * 0.96, Math.min(r, h) * 0.96, 0.014, 20), m.labSteel);
    cap.rotation.z = Math.PI / 2;
    cap.position.set(sx * (len / 2 - 0.004), 0, 0);
    g.add(cap);
  }
  return done(g, h);
}
