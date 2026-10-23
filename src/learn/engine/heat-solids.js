/**
 * heat-solids.js — the solids Ember Reach's spatial benches stand up at `3D On`: a bath that follows its thermometer, two atoms pulled
 * apart on a crank, a bond chip with its two atoms, a glass box of particles, a row of cells with a gate, and a bead.
 *
 * WHY. The idea of these benches is where things are: how far two atoms are from each other, how much room a dozen particles have, which
 * half of a chamber the particles stand in, how high a thermometer's column stands. A flat picture of each is still drawn (the
 * `3D Off` twin and the plate's own print); at `3D On` the same numbers also stand up as solid parts. The numbers are never made up here:
 * every builder is handed what the kit read (`heat-read.js`, which asks `thermodata.js`), the way `lab-props.js` is, and the picture
 * stays honest.
 *
 * The rules of `heat-props.js` and `lab-props.js` apply unchanged: nothing factory-new, no sharp 90 degree edge but glass, nothing lit,
 * a figure a piece prints is painted by the kit. A builder returns a Group standing on y = 0. A dress returns a Group whose
 * `userData.set(...)` is what `heat.js` calls with the kit's reading each time the table changes.
 *
 * Pure over THREE: no DOM, so `verify:bench` and a scratch script build these in Node.
 */

import * as THREE from 'three';
import { roundedSlab, CARD_H, buildCard } from './table-props.js';
import { bondAtoms, inkOfElement, phaseDots } from '../table/kits/heat-parts.js';

const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};
const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };
const std = (own, color, roughness = 0.6, metalness = 0.1, extra = {}) => own(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));

/** The inks the bath and the column take: the plate's warm and cold, and its amber between. */
export const BATH_INK = Object.freeze({ warm: '#c0652b', cool: '#6f8fb0', still: '#78a142', metal: '#77797a' });
const COLUMN_INK = Object.freeze({ warm: '#c0652b', cool: '#6f8fb0', mid: '#d99423' });

/* ------------------------------------------------------------------ the cup's bath and its thermometer */

/**
 * The water in a lagged cup, `w` x `d` metres in plan inside a wall `wallH` high, and a column of fluid in the thermometer beside it.
 * `set({ level, tint, frac, ink })`: the bath's depth as a fraction of the wall, the bath's tint ('warm' | 'cool' | 'still'), the
 * column's height as a fraction of its stem, and its ink ('warm' | 'cool' | 'mid').
 */
export function buildBathDress(w, d, { own, wallH = 0.07, stemH = 0.2, thermoAt = { x: 0, z: 0 } }) {
  const g = new THREE.Group();
  const bathMat = std(own, BATH_INK.still, 0.12, 0, { transparent: true, opacity: 0.5, depthWrite: false });
  const bath = mesh(new THREE.BoxGeometry(1, 1, 1), bathMat, { cast: false });
  g.add(bath);
  const colMat = std(own, COLUMN_INK.mid, 0.3, 0.1);
  const column = mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 1, 8), colMat, { cast: false, receive: false });
  column.position.x = thermoAt.x;
  column.position.z = thermoAt.z;
  g.add(column);
  const usable = wallH - 0.012;
  const stem = stemH - 0.03;
  g.userData.set = ({ level = 0.5, tint = 'still', frac = 0.2, ink = 'mid' } = {}) => {
    const hgt = Math.max(0.004, usable * Math.max(0, Math.min(1, level)));
    bath.scale.set(w * 0.9, hgt, d * 0.9);
    bath.position.y = 0.006 + hgt / 2;
    bathMat.color.set(BATH_INK[tint] || BATH_INK.still);
    const col = Math.max(0.004, stem * Math.max(0, Math.min(1, frac)));
    column.scale.set(1, col, 1);
    column.position.y = 0.012 + col / 2;
    colMat.color.set(COLUMN_INK[ink] || COLUMN_INK.mid);
  };
  g.userData.set({});
  return g;
}

/* ------------------------------------------------------------------ two atoms on a crank */

/**
 * Two atoms and the rod between them. `r` is an atom's radius (metres). `set({ gap, strength })`: the distance between the centres
 * (metres) and how much of the bond is left (1 bonded, 0 free): the rod thins as the bond is pulled and goes when the atoms are free.
 */
export function buildPairDress(elements, r, { own, rodR = 0.007 }) {
  const g = new THREE.Group();
  const a = mesh(new THREE.SphereGeometry(r, 20, 14), std(own, inkOfElement(elements[0]), 0.55, 0.1));
  const b = mesh(new THREE.SphereGeometry(r, 20, 14), std(own, inkOfElement(elements[1]), 0.55, 0.1));
  const rod = mesh(new THREE.CylinderGeometry(1, 1, 1, 10), std(own, '#8c8376', 0.5, 0.6));
  rod.rotation.z = Math.PI / 2;
  g.add(a, b, rod);
  g.userData.set = ({ gap = r * 2.4, strength = 1 } = {}) => {
    a.position.set(-gap / 2, r, 0);
    b.position.set(gap / 2, r, 0);
    const len = Math.max(0.001, gap - r * 1.2);
    const thick = rodR * Math.max(0, strength);
    rod.visible = strength > 0.02;
    rod.scale.set(Math.max(0.0005, thick), len, Math.max(0.0005, thick));
    rod.position.set(0, r, 0);
  };
  g.userData.set({});
  return g;
}

/** A bond chip's two atoms standing on the card, with the rod (or two, or three) between them. */
export function buildBondSculpture(which, r, gap, { own }) {
  const { a, b, order } = bondAtoms(which);
  const g = new THREE.Group();
  const rod = std(own, '#8c8376', 0.5, 0.6);
  for (let k = 0; k < order; k++) {
    const off = (k - (order - 1) / 2) * r * 0.55;
    const m = mesh(new THREE.CylinderGeometry(r * 0.17, r * 0.17, gap, 8), rod);
    m.rotation.z = Math.PI / 2;
    m.position.set(0, r * 0.9, off);
    g.add(m);
  }
  g.add(at(mesh(new THREE.SphereGeometry(r, 18, 12), std(own, inkOfElement(a), 0.55, 0.1)), -gap / 2, r * 0.9, 0));
  g.add(at(mesh(new THREE.SphereGeometry(r, 18, 12), std(own, inkOfElement(b), 0.55, 0.1)), gap / 2, r * 0.9, 0));
  return g;
}

/**
 * A bond chip: a card with its words on the right and the two atoms it is about standing on its left third. `face` is the kit's painted
 * face (`c.face()`), which leaves the left third bare at `3D On`.
 */
export function buildBondChip(c, which) {
  const { hw, hh, mats: m, own } = c;
  const g = new THREE.Group();
  g.add(buildCard(hw, hh, c.face(), m.paper));
  const size = hh * 2 * 0.9;
  const sculpt = buildBondSculpture(which, size * 0.2, size * 0.62, { own });
  sculpt.position.set(-hw + hw * 2 * 0.19, CARD_H, 0);
  g.add(sculpt);
  g.userData.height = CARD_H + size * 0.4;
  return g;
}

/* ------------------------------------------------------------------ a glass box of particles */

/** A glass-walled box `w` x `d` metres in plan and `h` high, standing on y = 0, rim and base in cast metal. */
function glassBox(w, d, h, m) {
  const g = new THREE.Group();
  g.add(mesh(roundedSlab(w, d, 0.01, Math.min(w, d) * 0.1, 0.002), m.labCast));
  g.add(at(mesh(new THREE.BoxGeometry(w * 0.96, h, d * 0.96), m.labPane, { cast: false, receive: false }), 0, 0.01 + h / 2, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    g.add(at(mesh(new THREE.BoxGeometry(0.006, h, 0.006), m.labSteel, { cast: false }), x * w * 0.48, 0.01 + h / 2, z * d * 0.48));
  }
  return g;
}

/**
 * A phase card: a box of twelve particles (`phaseDots`) on a cast base with the card's name engraved at its foot. The same dozen for
 * every phase, so the three boxes differ only in the room each particle has; each wears a short streak as long as it is moving.
 */
export function buildPhaseCard(c, p) {
  const { hw, hh, mats: m, own } = c;
  const g = new THREE.Group();
  const boxW = hw * 2 * 0.62;
  const boxD = hh * 2 * 0.62;
  const boxH = 0.15;
  g.add(mesh(roundedSlab(hw * 2, hh * 2, CARD_H, Math.min(hw, hh) * 0.16, 0.0025), m.paper));
  const box = glassBox(boxW, boxD, boxH, m);
  box.position.set(0, CARD_H, -hh * 0.18);
  g.add(box);
  const r = 0.011;
  const bead = new THREE.SphereGeometry(r, 12, 9);
  const mat = std(own, '#c9c08a', 0.5, 0.15);
  const tailMat = std(own, '#8c8376', 0.6, 0.2);
  const dots = phaseDots(p.props.phase, p.props.T ?? 20);
  dots.forEach((d, i) => {
    const x = (d.u - 0.5) * (boxW - 0.04);
    const y = CARD_H + 0.01 + r + (1 - d.v) * (boxH - 0.03 - 2 * r);
    const z = -hh * 0.18 + (d.w - 0.5) * (boxD - 0.04);
    const b = mesh(bead, mat, { receive: false });
    b.position.set(x, y, z);
    g.add(b);
    // The streak points back along the way the particle is going (a fixed heading for each, so the picture never changes).
    const len = d.tail * 0.05;
    const ang = (i * 2.399) % (Math.PI * 2);
    const t = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, len, 6), tailMat, { cast: false, receive: false });
    t.rotation.z = Math.PI / 2;
    t.rotation.y = ang;
    t.position.set(x - Math.cos(ang) * len / 2, y, z + Math.sin(ang) * len / 2);
    g.add(t);
  });
  const name = c.label(p.label, hw * 2 * 0.9, hh * 2 * 0.2);
  name.position.set(0, CARD_H + 0.0006, hh * 0.78);
  g.add(name);
  g.userData.height = CARD_H + boxH;
  return g;
}

/* ------------------------------------------------------------------ cells, a gate and a shaken chamber */

/**
 * A row of cells: a low wall round each, and a gate across the row after the first `leftCells`, which drops out of the way when
 * the gate is open. `set({ open })`. `cellW` and `cellD` are one cell's footprint in metres, `pitch` the distance between centres.
 */
export function buildCellsDress(cells, leftCells, cellW, cellD, pitch, { mats: m }) {
  const g = new THREE.Group();
  const wallH = 0.03;
  const t = 0.006;
  const span = (cells - 1) * pitch;
  for (let i = 0; i <= cells; i++) {
    const x = -span / 2 - pitch / 2 + i * pitch;
    if (i === leftCells) continue;
    g.add(at(mesh(new THREE.BoxGeometry(t, wallH, cellD + t), m.labCast), x, wallH / 2, 0));
  }
  for (const z of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(cells * pitch + t, wallH, t), m.labCast), 0, wallH / 2, z * (cellD / 2 + t / 2)));
  const gateH = 0.12;
  const gate = mesh(new THREE.BoxGeometry(t * 1.4, gateH, cellD + t), m.labGlass, { cast: false });
  const gx = -span / 2 - pitch / 2 + leftCells * pitch;
  gate.position.set(gx, gateH / 2, 0);
  g.add(gate);
  g.userData.set = ({ open = false } = {}) => { gate.visible = !open; };
  g.userData.set({});
  return g;
}

/**
 * A chamber of `cells` cells in a row with `particles` beads standing in the cells the last shake chose. `set({ cells: [..] })` takes
 * the 1-based cells that hold a particle (none before the first shake).
 */
export function buildChamberDress(cells, particles, pitch, cellD, { mats: m, own }) {
  const g = new THREE.Group();
  const wallH = 0.05;
  const t = 0.006;
  const span = (cells - 1) * pitch;
  for (let i = 0; i <= cells; i++) g.add(at(mesh(new THREE.BoxGeometry(t, wallH, cellD + t), m.labCast), -span / 2 - pitch / 2 + i * pitch, wallH / 2, 0));
  for (const z of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(cells * pitch + t, wallH, t), m.labCast), 0, wallH / 2, z * (cellD / 2 + t / 2)));
  const r = Math.min(pitch, cellD) * 0.3;
  const geo = new THREE.SphereGeometry(r, 16, 12);
  const mat = std(own, '#c9c08a', 0.5, 0.15);
  const beads = Array.from({ length: particles }, () => { const b = mesh(geo, mat, { receive: false }); b.visible = false; g.add(b); return b; });
  g.userData.set = ({ cells: held = [] } = {}) => {
    beads.forEach((b, i) => {
      const c = held[i];
      b.visible = c != null;
      if (c != null) b.position.set(-span / 2 + (c - 1) * pitch, 0.006 + r, 0);
    });
  };
  g.userData.set({});
  return g;
}

/** A particle on the table: a small bead, the same bead the chamber's picture shows. */
export function buildParticle(c) {
  const r = Math.min(c.hw, c.hh) * 0.5;
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.SphereGeometry(r, 18, 12), std(c.own, '#c9c08a', 0.5, 0.15)), 0, r, 0));
  g.userData.height = r * 2;
  return g;
}

