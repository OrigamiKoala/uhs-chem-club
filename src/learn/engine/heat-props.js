/**
 * heat-props.js — The physical things on an Ember Reach bench: a metal block, a tin of chemicals, the wall of a lagged cup and the
 * thermometer standing in it.
 *
 * WHY THIS FILE EXISTS (the 2026-10-09 audit, `bench-tabletop.md` design invariant 6). A block was going to be a card with a picture
 * of a block on it, and a cup a flat rectangle on the plate: "a bunch of squares with weird textures fitted on top". A block of
 * metal is a thick, worn ingot with its legend stamped on the face; a charge of chemicals is a tin with a lid; a calorimeter cup is
 * a lagged wall round a bath, with a glass thermometer standing in it. This file builds each as what it is, in the same vocabulary as
 * `lab-props.js` and `gas-props.js` (the rules at the head of those files apply here unchanged): no sharp 90 degree edges but glass,
 * nothing factory-new, a figure a piece prints is painted by the kit (`c.face`), never drawn here, only lamps are lit.
 *
 * Piece builders take the context `c` that `Table3D` fills in (`{ hw, hh, mats, own, face, paint }`) and return a Group standing on
 * y = 0, centred on the piece, with `userData.height` set. Pure over THREE.
 */

import * as THREE from 'three';
import { roundedSlab, wallGeometry, lathe } from './table-props.js';

const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};
const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };

/** The height of an ingot, in metres: low enough that a leaned-in camera sees over it. */
export const INGOT_H = 0.05;

/** A block of metal: a thick, rounded ingot of the host's cast metal, its legend on the top face. */
export function buildIngot(c, { hot = false, cold = false } = {}) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  g.add(at(mesh(roundedSlab(hw * 2, hh * 2, INGOT_H, Math.min(hw, hh) * 0.14, 0.004), m.labCast), 0, 0, 0));
  // A shoulder round the top edge, so the face sits in a frame of worn metal.
  g.add(at(mesh(roundedSlab(hw * 2 * 0.97, hh * 2 * 0.95, 0.006, Math.min(hw, hh) * 0.12, 0.002), m.labSteel), 0, INGOT_H, 0));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.9, hh * 2 * 0.86), c.face());
  face.rotation.x = -Math.PI / 2;
  face.position.y = INGOT_H + 0.0068;
  face.receiveShadow = true;
  g.add(face);
  void hot; void cold;
  g.userData.height = INGOT_H + 0.007;
  return g;
}

/** A tin of chemicals: a squat rounded tin with a pressed lid, the legend painted on the lid. */
export function buildTin(c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const H = 0.07;
  g.add(at(mesh(roundedSlab(hw * 2, hh * 2, H, Math.min(hw, hh) * 0.3, 0.005), m.labSteel), 0, 0, 0));
  g.add(at(mesh(roundedSlab(hw * 2 * 1.02, hh * 2 * 1.04, 0.008, Math.min(hw, hh) * 0.3, 0.003), m.labCast), 0, H * 0.62, 0));
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.86, hh * 2 * 0.8), c.face());
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = H + 0.0008;
  lid.receiveShadow = true;
  g.add(lid);
  g.userData.height = H;
  return g;
}

/**
 * The lagged wall of a calorimeter cup, `w` x `d` metres in plan: a low rounded wall of cast metal round a bath, a rubber lagging band,
 * and a glass thermometer standing in the bath with a brass cap. The bath itself is the table's own picture.
 */
export function buildCupWall(w, d, { mats: m }) {
  const g = new THREE.Group();
  const H = 0.07;
  g.add(mesh(wallGeometry(w, d, 0.012, H, Math.min(w, d) * 0.22, 0.003), m.labCast));
  const band = mesh(wallGeometry(w * 1.04, d * 1.04, 0.01, 0.022, Math.min(w, d) * 0.24, 0.002), m.labRubber);
  band.position.y = H * 0.35;
  g.add(band);
  return g;
}

/** A glass thermometer standing upright: a stem, a bulb and a brass cap, `h` metres tall. */
export function buildThermometer(h, { mats: m }) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(0.006, 0.006, h, 10), m.labGlass, { cast: false, receive: false }), 0, h / 2, 0));
  g.add(at(mesh(lathe([[0.001, 0], [0.011, 0.005], [0.012, 0.014], [0.008, 0.024], [0.001, 0.026]], 14), m.labSmoke, { cast: false }), 0, 0, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.014, 12), m.labBrass), 0, h, 0));
  return g;
}
