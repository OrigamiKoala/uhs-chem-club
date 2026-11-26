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
 * A phase card: a 3D glass box of twelve moving particles (`phaseDots`) on a cast base with the card's name engraved at its foot.
 * No trajectory sticks — particles visibly vibrate (solid), slide/bump near the bottom (liquid), or zip throughout the box (gas).
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
  const mat = std(own, '#c9c08a', 0.45, 0.12);
  const dots = phaseDots(p.props.phase, p.props.T ?? 20);
  const phase = p.props.phase;
  const T = p.props.T ?? 20;
  const innerW = (boxW - 0.036) / 2;
  const innerD = (boxD - 0.036) / 2;
  const yMin = CARD_H + 0.012 + r;
  const yMax = CARD_H + 0.01 + boxH - 0.014 - r;
  const zOff = -hh * 0.18;
  const tri = u => { const v = ((u % 2) + 2) % 2; return v < 1 ? v : 2 - v; };
  const beads = dots.map((d, i) => {
    const x0 = (d.u - 0.5) * (innerW * 2);
    const y0 = yMin + (1 - d.v) * (yMax - yMin);
    const z0 = zOff + (d.w - 0.5) * (innerD * 2);
    const b = mesh(bead, mat, { receive: false });
    b.position.set(x0, y0, z0);
    g.add(b);
    return { b, x0, y0, z0, d, ph1: i * 1.73, ph2: i * 2.41, ph3: i * 3.17 };
  });
  let clock = 0;
  g.userData.tick = (dt, still) => {
    if (still || !(dt > 0)) return;
    clock += Math.min(dt, 0.05);
    const heat = Math.max(0.15, Math.min(1.6, (T + 40) / 100));
    for (const item of beads) {
      if (phase === 'solid') {
        const amp = 0.0022 * (0.6 + heat * 0.5);
        item.b.position.set(
          item.x0 + Math.sin(clock * 14 + item.ph1) * amp,
          item.y0 + Math.cos(clock * 16 + item.ph2) * amp,
          item.z0 + Math.sin(clock * 13 + item.ph3) * amp
        );
      } else if (phase === 'liquid') {
        const spd = 0.18 + heat * 0.24;
        const u = tri(item.d.u * 2 + clock * spd * (0.7 + (item.ph1 % 0.6)));
        const w = tri(item.d.w * 2 + clock * spd * (0.65 + (item.ph2 % 0.5)));
        const v = tri(item.d.v * 2 + clock * spd * 0.5);
        const liqMax = yMin + (yMax - yMin) * 0.48;
        item.b.position.set(
          (u - 0.5) * (innerW * 1.9),
          yMin + v * (liqMax - yMin),
          zOff + (w - 0.5) * (innerD * 1.9)
        );
      } else {
        const spd = 0.65 + heat * 0.45;
        const u = tri(item.d.u * 2 + clock * spd * (0.75 + (item.ph1 % 0.5)));
        const v = tri(item.d.v * 2 + clock * spd * (0.7 + (item.ph2 % 0.5)));
        const w = tri(item.d.w * 2 + clock * spd * (0.8 + (item.ph3 % 0.4)));
        item.b.position.set(
          (u - 0.5) * (innerW * 1.95),
          yMin + v * (yMax - yMin),
          zOff + (w - 0.5) * (innerD * 1.95)
        );
      }
    }
  };
  const title = p.props.T != null ? `${p.label} · ${p.props.T} °C` : p.label;
  const name = c.label(title, hw * 2 * 0.94, hh * 2 * 0.24);
  name.position.set(0, CARD_H + 0.0006, hh * 0.76);
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
 * A chamber of `cells` trays/cells in a row with `particles` beads standing in the cells the last shake chose.
 * When `cells === 2` (Left Box and Right Box), multiple beads arrange neatly inside each tray.
 */
export function buildChamberDress(cells, particles, pitch, cellD, { mats: m, own }) {
  const g = new THREE.Group();
  const wallH = 0.05;
  const t = 0.006;
  const span = (cells - 1) * pitch;
  for (let i = 0; i <= cells; i++) g.add(at(mesh(new THREE.BoxGeometry(t, wallH, cellD + t), m.labCast), -span / 2 - pitch / 2 + i * pitch, wallH / 2, 0));
  for (const z of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(cells * pitch + t, wallH, t), m.labCast), 0, wallH / 2, z * (cellD / 2 + t / 2)));
  const r = cells <= 2 ? Math.min(pitch * 0.14, cellD * 0.24) : Math.min(pitch, cellD) * 0.3;
  const geo = new THREE.SphereGeometry(r, 16, 12);
  const mat = std(own, '#c9c08a', 0.5, 0.15);
  const beads = Array.from({ length: particles }, () => { const b = mesh(geo, mat, { receive: false }); b.visible = false; g.add(b); return b; });
  g.userData.set = ({ cells: held = [] } = {}) => {
    if (cells <= 2) {
      const buckets = { 1: [], 2: [] };
      held.forEach((c, idx) => { (buckets[c] ||= []).push(idx); });
      for (const boxIdx of [1, 2]) {
        const list = buckets[boxIdx] || [];
        const bx = -span / 2 + (boxIdx - 1) * pitch;
        list.forEach((beadIdx, k) => {
          const b = beads[beadIdx];
          if (!b) return;
          b.visible = true;
          const off = (k - (list.length - 1) / 2) * (r * 2.4);
          b.position.set(bx + off, 0.006 + r, (k % 2 ? 1 : -1) * r * 0.35);
        });
      }
      if (!held.length) beads.forEach(b => { b.visible = false; });
      return;
    }
    beads.forEach((b, i) => {
      const c = held[i];
      b.visible = c != null;
      if (c != null) b.position.set(-span / 2 + (c - 1) * pitch, 0.006 + r, 0);
    });
  };
  g.userData.set({});
  return g;
}

/* ------------------------------------------------------------------ 3D glass chambers for Ember Reach */

const triWave = u => { const v = ((u % 2) + 2) % 2; return v < 1 ? v : 2 - v; };
const clamp01 = v => Math.max(0, Math.min(1, v));
const lerpN = (a, b, k) => a + (b - a) * k;
const smoothstep = k => { const c = clamp01(k); return c * c * (3 - 2 * c); };

function addFrameEdges(g, w, d, h, m) {
  g.add(mesh(roundedSlab(w, d, 0.008, Math.min(w, d) * 0.05, 0.002), m.labCast));
  // Four glass walls (open top or translucent glass enclosure) + corner posts for crisp 3D container walls.
  const t = 0.004;
  for (const z of [-d / 2, d / 2]) g.add(at(mesh(new THREE.BoxGeometry(w, h, t), m.labPane, { cast: false, receive: false }), 0, 0.008 + h / 2, z));
  for (const x of [-w / 2, w / 2]) g.add(at(mesh(new THREE.BoxGeometry(t, h, d), m.labPane, { cast: false, receive: false }), x, 0.008 + h / 2, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    g.add(at(mesh(new THREE.BoxGeometry(0.006, h, 0.006), m.labSteel, { cast: false }), sx * w / 2, 0.008 + h / 2, sz * d / 2));
  }
}

/**
 * 3D glass chamber for lead-in scenes (`shut`, `salt`, `air`, `meet`, `heater`):
 * real 3D container walls, physical glass barrier for `shut`, tightly packed 3x3x3 crystalline salt + 32 tumbling water molecules for `salt`.
 */
export function buildLeadChamber3d(scene, w, d, { mats: m, own, asymmetric = false }) {
  const g = new THREE.Group();
  const h = Math.min(0.16, Math.max(0.11, Math.min(w, d) * 0.55));
  addFrameEdges(g, w, d, h, m);
  let clock = 0;

  if (scene === 'shut') {
    // Physical translucent glass divider wall across the middle!
    const dividerMat = own(new THREE.MeshStandardMaterial({
      color: 0xd9a74a, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.42, depthWrite: false
    }));
    g.add(at(mesh(new THREE.BoxGeometry(0.008, h * 0.96, d * 0.96), dividerMat, { cast: false, receive: false }), 0, 0.008 + h * 0.48, 0));
    g.add(at(mesh(new THREE.BoxGeometry(0.011, 0.008, d * 0.98), m.labBrass, { cast: false }), 0, 0.008 + h, 0));

    const r = Math.min(w, d) * 0.065;
    const mat = std(own, '#8ab852', 0.38, 0.12);
    const geo = new THREE.SphereGeometry(r, 14, 10);
    const parts = Array.from({ length: 4 }, (_, i) => {
      const s = mesh(geo, mat, { receive: false });
      g.add(s);
      return {
        s,
        px: -w * 0.25 + (i % 2 - 0.5) * w * 0.18,
        py: 0.015 + r + (Math.floor(i / 2) + 0.3) * (h * 0.35),
        pz: (i % 2 ? 0.2 : -0.2) * d,
        vx: (i % 2 ? 1 : -1) * (0.14 + i * 0.03),
        vy: (i < 2 ? 1 : -1) * (0.11 + i * 0.02),
        vz: (i % 3 === 0 ? 1 : -1) * (0.12 + i * 0.025)
      };
    });
    const xMin = -w / 2 + r + 0.008;
    const xMax = -r - 0.01; // stops cleanly at the physical glass divider!
    const yMin = 0.012 + r;
    const yMax = 0.008 + h - r - 0.008;
    const zMin = -d / 2 + r + 0.008;
    const zMax = d / 2 - r - 0.008;
    g.userData.tick = (dt, still) => {
      if (still || !(dt > 0)) return;
      const step = Math.min(dt, 0.03);
      for (const p of parts) {
        p.px += p.vx * step; p.py += p.vy * step; p.pz += p.vz * step;
        if (p.px < xMin) { p.px = xMin; p.vx = Math.abs(p.vx); }
        if (p.px > xMax) { p.px = xMax; p.vx = -Math.abs(p.vx); }
        if (p.py < yMin) { p.py = yMin; p.vy = Math.abs(p.vy); }
        if (p.py > yMax) { p.py = yMax; p.vy = -Math.abs(p.vy); }
        if (p.pz < zMin) { p.pz = zMin; p.vz = Math.abs(p.vz); }
        if (p.pz > zMax) { p.pz = zMax; p.vz = -Math.abs(p.vz); }
        p.s.position.set(p.px, p.py, p.pz);
      }
    };
    g.userData.tick(0.016, false);
    return g;
  }

  if (scene === 'salt') {
    // Tightly packed 3x3x3 crystalline salt cube sitting firmly on the floor + 32 tumbling water molecules around it (NO labels!).
    const rIon = Math.min(w, d) * 0.036;
    const geoIon = new THREE.SphereGeometry(rIon, 12, 8);
    const matNa = std(own, '#b8bdd6', 0.35, 0.2);
    const matCl = std(own, '#d4c06e', 0.35, 0.2);
    const pitch = rIon * 1.95;
    const ions = [];
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = 0; iy < 3; iy++) {
        for (let iz = -1; iz <= 1; iz++) {
          const s = mesh(geoIon, (ix + iy + iz) % 2 === 0 ? matNa : matCl, { receive: false });
          const x0 = ix * pitch;
          const y0 = 0.012 + rIon + iy * pitch;
          const z0 = iz * pitch;
          s.position.set(x0, y0, z0);
          g.add(s);
          ions.push({ s, x0, y0, z0, ph: (ix + 2) * 3.1 + iy * 5.3 + iz * 2.7 });
        }
      }
    }
    // 32 tumbling water molecules flowing around the crystal in 3D space.
    const rW = rIon * 0.68;
    const geoW = new THREE.SphereGeometry(rW, 10, 8);
    const matW = std(own, '#5e8eb5', 0.25, 0.08);
    const waters = Array.from({ length: 32 }, (_, i) => {
      const s = mesh(geoW, matW, { receive: false });
      g.add(s);
      return { s, i, u0: (i * 0.37) % 1, v0: (i * 0.61) % 1, w0: (i * 0.23) % 1, sp: 0.18 + (i % 5) * 0.04 };
    });
    const hw = w * 0.44, hd = d * 0.44;
    const cRad = pitch * 1.65;
    g.userData.tick = (dt, still) => {
      if (still || !(dt > 0)) return;
      clock += Math.min(dt, 0.04);
      for (const ion of ions) {
        ion.s.position.set(
          ion.x0 + Math.sin(clock * 15 + ion.ph) * rIon * 0.12,
          ion.y0 + Math.cos(clock * 17 + ion.ph * 1.3) * rIon * 0.12,
          ion.z0 + Math.sin(clock * 14 + ion.ph * 0.7) * rIon * 0.12
        );
      }
      for (const wt of waters) {
        let x = (triWave(wt.u0 * 2 + clock * wt.sp) - 0.5) * 2 * hw;
        let z = (triWave(wt.w0 * 2 + clock * wt.sp * 0.85) - 0.5) * 2 * hd;
        let y = 0.014 + rW + triWave(wt.v0 * 2 + clock * wt.sp * 0.6) * (h - 0.028 - 2 * rW);
        // Keep water molecules outside the solid salt crystal cube!
        if (Math.abs(x) < cRad && Math.abs(z) < cRad && y < 0.012 + pitch * 3.1) {
          if (Math.abs(x) >= Math.abs(z)) x = Math.sign(x || 1) * (cRad + rW);
          else z = Math.sign(z || 1) * (cRad + rW);
        }
        wt.s.position.set(x, y, z);
      }
    };
    g.userData.tick(0.016, false);
    return g;
  }

  // Default 3D chamber for 'air', 'meet', 'heater'
  const count = scene === 'air' ? 10 : 18;
  const r = Math.min(w, d) * 0.04;
  const geo = new THREE.SphereGeometry(r, 10, 8);
  const matA = std(own, scene === 'air' ? '#6f8fb0' : '#c0652b', 0.4, 0.1);
  const matB = std(own, scene === 'air' ? '#c0652b' : '#6f8fb0', 0.4, 0.1);
  const spheres = Array.from({ length: count }, (_, i) => {
    const s = mesh(geo, i < count / 2 ? matA : matB, { receive: false });
    g.add(s);
    return { s, i };
  });
  void asymmetric;
  g.userData.tick = (dt, still) => {
    if (still || !(dt > 0)) return;
    clock += Math.min(dt, 0.04);
    for (const item of spheres) {
      const i = item.i;
      const x = (triWave(i * 0.31 + clock * 0.22) - 0.5) * (w - 0.03);
      const y = 0.016 + r + triWave(i * 0.57 + clock * 0.19) * (h - 0.03 - 2 * r);
      const z = (triWave(i * 0.43 + clock * 0.25) - 0.5) * (d - 0.03);
      item.s.position.set(x, y, z);
    }
  };
  g.userData.tick(0.016, false);
  return g;
}

/**
 * 3D glass chamber for the heating curve (`curve`): 24 particles that start tightly packed in a solid lattice (below 0 °C),
 * vibrate harder as they warm, melt into a dense sliding liquid heap at 0 °C, speed up as liquid warms, and visibly boil into
 * fast 3D gas particles filling the whole container at 100 °C.
 */
export function buildCurveChamber3d(w, d, { mats: m, own }) {
  const g = new THREE.Group();
  const h = Math.min(0.18, Math.max(0.13, w * 0.85));
  addFrameEdges(g, w, d, h, m);
  const N = 24;
  const r = Math.min(w, d) * 0.052;
  const geo = new THREE.SphereGeometry(r, 12, 8);
  const mat = own(new THREE.MeshStandardMaterial({ color: 0x7ba4c7, roughness: 0.35, metalness: 0.1 }));
  const parts = Array.from({ length: N }, (_, i) => {
    const s = mesh(geo, mat, { receive: false });
    g.add(s);
    const ix = i % 4;
    const iz = Math.floor(i / 4) % 3;
    const iy = Math.floor(i / 12);
    return {
      s, i,
      lx: (ix - 1.5) * (r * 2.15),
      ly: 0.012 + r + iy * (r * 2.05),
      lz: (iz - 1) * (r * 2.15),
      thresh: ((i * 7 + 3) % N) / N,
      ph1: i * 1.9, ph2: i * 2.7, ph3: i * 3.3
    };
  });
  let stateRef = { T: -20, phase: 'solid', kind: 'solid', mix: 0 };
  let clock = 0;
  const hw = w / 2 - r - 0.008;
  const hd = d / 2 - r - 0.008;
  const yMin = 0.012 + r;
  const yMax = 0.008 + h - r - 0.008;
  const coldC = new THREE.Color('#6f8fb0');
  const warmC = new THREE.Color('#d97834');

  g.userData.set = st => { stateRef = st; };
  g.userData.tick = (dt, still) => {
    if (!still && dt > 0) clock += Math.min(dt, 0.04);
    const { T, phase, kind, mix } = stateRef;
    const kCol = clamp01((T + 20) / 140);
    mat.color.copy(coldC).lerp(warmC, kCol);
    const heat = clamp01((T + 30) / 140);
    for (const p of parts) {
      let mode = phase;
      if (kind === 'melt') mode = mix > p.thresh ? 'liquid' : 'solid';
      else if (kind === 'boil') mode = mix > p.thresh ? 'gas' : 'liquid';

      if (mode === 'solid') {
        const vib = r * (0.08 + 0.36 * clamp01((T + 30) / 35));
        p.s.position.set(
          p.lx + Math.sin(clock * 15 + p.ph1) * vib,
          p.ly + Math.cos(clock * 17 + p.ph2) * vib,
          p.lz + Math.sin(clock * 14 + p.ph3) * vib
        );
      } else if (mode === 'liquid') {
        const spd = 0.22 + 0.55 * clamp01(T / 100);
        const x = (triWave(p.ph1 * 0.2 + clock * spd * (0.7 + (p.i % 3) * 0.15)) - 0.5) * 2 * hw;
        const z = (triWave(p.ph3 * 0.2 + clock * spd * (0.65 + (p.i % 4) * 0.12)) - 0.5) * 2 * hd;
        const y = yMin + triWave(p.ph2 * 0.2 + clock * spd * 0.5) * ((yMax - yMin) * 0.42);
        p.s.position.set(x, y, z);
      } else {
        // Boiling/gas: particles shoot up and zip rapidly throughout the full 3D container!
        const spd = 0.95 + 0.55 * heat;
        const x = (triWave(p.ph1 * 0.3 + clock * spd * (0.8 + (p.i % 3) * 0.18)) - 0.5) * 2 * hw;
        const y = yMin + triWave(p.ph2 * 0.3 + clock * spd * (0.9 + (p.i % 4) * 0.12)) * (yMax - yMin);
        const z = (triWave(p.ph3 * 0.3 + clock * spd * (0.75 + (p.i % 5) * 0.12)) - 0.5) * 2 * hd;
        p.s.position.set(x, y, z);
      }
    }
  };
  g.userData.tick(0.016, false);
  return g;
}

/**
 * 3D glass reaction chamber (`rxn`): bonded 3D molecules approach and collide in the middle,
 * old bonds snap apart, atoms rearrange, and new bonds snap together with recoil energy!
 */
export function buildRxn3d(lhs, rhs, dH, w, d, { mats: m, own }) {
  const g = new THREE.Group();
  const h = Math.min(0.16, Math.max(0.11, d * 0.6));
  addFrameEdges(g, w, d, h, m);

  const SUB = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
  const parseAtoms = sp => {
    const s = String(sp).replace(/\((?:s|l|g|aq)\)/g, '').replace(/[⁺⁻²³]/g, '');
    const out = [];
    const re = /([A-Z][a-z]?)([₀-₉0-9]*)/g;
    let mt;
    while ((mt = re.exec(s))) {
      const n = mt[2] ? Number([...mt[2]].map(ch => (ch in SUB ? SUB[ch] : ch)).join('')) : 1;
      for (let i = 0; i < n; i++) out.push(mt[1]);
    }
    return out;
  };
  const molShape = atoms => {
    const n = atoms.length;
    if (n === 1) return [[0, 0, 0]];
    if (n === 2) return [[-1, 0, 0], [1, 0, 0]];
    if (n === 3) return [[0, 0.45, 0], [-1.05, -0.45, 0.3], [1.05, -0.45, -0.3]];
    if (n === 4) return [[0, 0.35, 0], [1.0, -0.35, 0], [-0.5, -0.35, 0.87], [-0.5, -0.35, -0.87]];
    return atoms.map((_, i) => (i === 0 ? [0, 0, 0] : [Math.cos(((i - 1) / (n - 1)) * 6.283) * 1.15, ((i % 2) - 0.5) * 0.7, Math.sin(((i - 1) / (n - 1)) * 6.283) * 1.15]));
  };
  const makeSide = (list, xSign) => {
    const mols = [];
    for (const [n, sp] of list) for (let i = 0; i < Math.max(1, Math.round(n)); i++) mols.push({ atoms: parseAtoms(sp) });
    const spread = Math.min(w * 0.28, d * 0.35);
    const scale = Math.min(w, d) * 0.065;
    mols.forEach((mol, i) => {
      const ang = (i / Math.max(1, mols.length)) * Math.PI * 2;
      const cx = xSign * w * 0.24 + (mols.length > 1 ? Math.cos(ang) * spread * 0.35 : 0);
      const cy = 0.012 + h * 0.52 + (mols.length > 2 ? ((i % 2) - 0.5) * h * 0.22 : 0);
      const cz = mols.length > 1 ? Math.sin(ang) * spread * 0.65 : 0;
      mol.pts = molShape(mol.atoms).map(([dx, dy, dz]) => new THREE.Vector3(cx + dx * scale, cy + dy * scale, cz + dz * scale));
    });
    return mols;
  };

  const leftMols = makeSide(lhs, -1);
  const rightMols = makeSide(rhs, 1);
  const flat = ms => ms.flatMap((mol, mi) => mol.atoms.map((el, ai) => ({ el, pt: mol.pts[ai], mol: mi })));
  const A = flat(leftMols);
  const B = flat(rightMols);
  const pool = {};
  for (const b of B) (pool[b.el] ||= []).push(b);
  for (const a of A) a.to = (pool[a.el] || []).shift() || a;

  const baseR = Math.min(w, d) * 0.042;
  const rOf = el => baseR * (el === 'H' ? 0.72 : el === 'Cl' ? 1.15 : 1.0);
  const atomMeshes = A.map(a => {
    const msh = mesh(new THREE.SphereGeometry(rOf(a.el), 14, 10), std(own, inkOfElement(a.el), 0.4, 0.12), { receive: false });
    g.add(msh);
    return msh;
  });

  // Physical 3D bond cylinders for reactant bonds and product bonds
  const rodMat = std(own, '#b5aca0', 0.45, 0.35);
  const makeBonds = (list, key) => {
    const groups = new Map();
    list.forEach((a, i) => {
      const k = key === 'before' ? a.mol : a.to.mol;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(i);
    });
    const pairs = [];
    for (const idxs of groups.values()) {
      for (let k = 1; k < idxs.length; k++) {
        const cyl = mesh(new THREE.CylinderGeometry(baseR * 0.26, baseR * 0.26, 1, 8), rodMat, { cast: false, receive: false });
        g.add(cyl);
        pairs.push({ i0: idxs[0], i1: idxs[k], cyl });
      }
    }
    return pairs;
  };
  const beforeBonds = makeBonds(A, 'before');
  const afterBonds = makeBonds(A, 'after');

  const upV = new THREE.Vector3(0, 1, 0);
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpDir = new THREE.Vector3();
  const placeBond = (cyl, p0, p1, vis) => {
    cyl.visible = vis;
    if (!vis) return;
    tmpDir.subVectors(p1, p0);
    const len = tmpDir.length();
    if (len < 1e-4) { cyl.visible = false; return; }
    cyl.position.copy(p0).add(p1).multiplyScalar(0.5);
    cyl.scale.set(1, len, 1);
    cyl.quaternion.setFromUnitVectors(upV, tmpDir.normalize());
  };

  let clock = 0;
  const midPt = new THREE.Vector3(0, 0.012 + h * 0.52, 0);
  g.userData.tick = (dt, still) => {
    if (!still && dt > 0) clock += Math.min(dt, 0.04);
    const period = 6.0;
    const t = clock % period;
    // Phase 0..1.5s: reactants approach center to collide
    // Phase 1.5..2.6s: collision! old bonds break, atoms separate briefly
    // Phase 2.6..4.0s: atoms snap into new product bonds and recoil (faster if exothermic dH < 0)
    // Phase 4.0..6.0s: products vibrate/settle
    const approach = smoothstep(t / 1.5);
    const breakK = smoothstep((t - 1.5) / 1.0);
    const formK = smoothstep((t - 2.5) / 1.1);
    const vibAmp = baseR * (t > 3.2 && dH < 0 ? 0.34 : 0.14);

    A.forEach((a, i) => {
      // Pull reactant toward center during approach, then scatter briefly, then snap to product
      tmpA.copy(a.pt).lerp(midPt, approach * 0.52);
      tmpB.copy(a.to.pt);
      const pos = tmpA.lerp(tmpB, formK);
      // Slight collision burst at t = 1.5..2.8
      const burst = Math.sin(clamp01((t - 1.4) / 1.4) * Math.PI) * baseR * 0.9;
      pos.x += Math.cos(i * 2.1) * burst + Math.sin(clock * 14 + i * 1.7) * vibAmp;
      pos.y += Math.sin(i * 3.3) * burst * 0.5 + Math.cos(clock * 16 + i * 2.3) * vibAmp;
      pos.z += Math.sin(i * 1.9) * burst + Math.sin(clock * 13 + i * 2.9) * vibAmp;
      atomMeshes[i].position.copy(pos);
    });
    const showBefore = breakK < 0.65;
    const showAfter = formK > 0.65;
    for (const b of beforeBonds) placeBond(b.cyl, atomMeshes[b.i0].position, atomMeshes[b.i1].position, showBefore);
    for (const b of afterBonds) placeBond(b.cyl, atomMeshes[b.i0].position, atomMeshes[b.i1].position, showAfter);
  };
  g.userData.tick(0.016, false);
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

