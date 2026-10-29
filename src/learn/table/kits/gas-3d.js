/**
 * kits/gas-3d.js — The gas kit's glass, and the crowd of particles inside it, at `3D On`.
 *
 * The flat picture (`gas-draw.js`) is the table's own and what `3D Off` shows; this stands the same fact up in space. A cylinder, a
 * sealed box, a pair of pinhole chambers and the common tank are glass with a moving crowd in them: one body per dot the picture
 * draws (`dotsFor`), each going at a speed taken from the gas's own distribution at its temperature, in the room the planner
 * gives. So the player can WATCH the idea: the piston squeezes the crowd, the heater speeds it up, the lighter gas is the faster
 * crowd, a hole lets some out, two kinds of particle share a tank. Nothing is graded from the 3D: the fields are told what the
 * planners read (`rigRead`, `boxRead`, `pinholeRead`, `commonRead`), and the flat picture beneath says the same in numbers.
 *
 * `dress3d(f, state, c)` returns a Group whose `userData.sync(f, state)` re-sets the crowd whenever the table changes (a dial, a
 * piece moved into a place) and whose `userData.tick(dt, still)` moves it each frame (`still` holds it for reduced motion).
 */

import { ParticleField, speedQuantiles } from '../../engine/gas-particles.js';
import { buildBarrel, buildLid } from '../../engine/gas-props.js';
import { rigGeometry, boxGeometry, SHAPES } from './gas-draw.js';
import { rigRead, boxRead, pinholeRead, commonRead } from './gas-read.js';

const BONE = 0xd6cfb8;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** The radius a particle is drawn at, so the share of the room the particles fill is the planner's `crowd` (a real gas, squeezed). */
function trueRadius(crowd, count, volume, floor) {
  if (!(count > 0) || !(crowd > 0)) return floor;
  return Math.max(floor, Math.cbrt((3 * crowd * volume) / (4 * Math.PI * count)));
}

/** A mesh with the shadows a table prop has. */
function mesh(c, geo, mat, { cast = true } = {}) {
  const m = new c.THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------
   THE CYLINDER: glass, a piston, and the crowd between the wall and the piston
   ------------------------------------------------------------------ */

function dressRig(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  group.name = 'gas-rig';
  const g = rigGeometry(f, { box, dials: Object.keys(f.dials).filter(n => !f.props.hidden?.includes(n)).map((n, i) => ({ y: box.y0 + 8 + i * 5 })) });
  const vmax = f.props.vmax || 40;
  const items = g.cyls.map((cj, j) => {
    const b = cj.barrel;
    const len = (b.x1 - b.x0) * s;
    const dia = (b.y1 - b.y0) * s * 1.05;
    const r = dia / 2;
    const at = toPlate({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 });
    const cyl = new THREE.Group();
    cyl.position.set(at.x, c.ground + 0.002, at.z);
    cyl.add(buildBarrel(len, dia, { mats: c.mats }));
    const field = new ParticleField({ own: c.own, kinds: [{ shape: 'circle', color: BONE }], cap: 72 });
    cyl.add(field.group);
    // The piston: a steel plate across the bore, on a rod that leaves by the right-hand end.
    const plate = mesh(c, new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.012, 28), c.mats.labSteel);
    plate.rotation.z = Math.PI / 2;
    plate.position.y = r;
    cyl.add(plate);
    const rod = mesh(c, new THREE.CylinderGeometry(0.004, 0.004, 1, 8), c.mats.labSteel);
    rod.rotation.z = Math.PI / 2;
    rod.position.y = r;
    cyl.add(rod);
    let weight = null;
    if (cj.c.hold === 'P') {
      weight = mesh(c, new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.028, 18), c.mats.labCast);
      weight.rotation.z = Math.PI / 2;
      weight.position.y = r;
      cyl.add(weight);
    }
    if (cj.c.hold === 'V') { plate.visible = true; rod.visible = false; }
    group.add(cyl);
    return { j, cj, len, dia, r, field, plate, rod, weight };
  });
  group.userData.sync = (live, st) => {
    const reads = rigRead(st, live.id);
    items.forEach(it => {
      const q = reads[it.j];
      if (!q) return;
      const frac = clamp(q.V / (live.props.vmax || vmax), 0.02, 1);
      const px = -it.len / 2 + frac * it.len;
      const inner = it.dia * 0.31;
      const box3 = { x0: -it.len / 2 + 0.012, x1: Math.max(-it.len / 2 + 0.03, px - 0.007), y0: it.r - inner, y1: it.r + inner, z0: -inner, z1: inner };
      const vol = (box3.x1 - box3.x0) * (box3.y1 - box3.y0) * (box3.z1 - box3.z0);
      const base = it.dia * 0.045;
      const radius = live.props.trueSize ? trueRadius(q.crowd, q.dots, vol, base * 0.8) : base;
      it.field.set({ box: box3, radius, groups: [{ count: q.dots, speeds: speedQuantiles(q.gasKey, q.T, q.dots) }] });
      it.plate.position.x = px;
      const rodLen = Math.max(0.01, it.len / 2 + 0.03 - px);
      it.rod.scale.set(1, rodLen, 1);
      it.rod.position.x = px + rodLen / 2;
      if (it.weight) it.weight.position.x = Math.min(it.len / 2 - 0.02, px + 0.06);
    });
  };
  group.userData.tick = (dt, still) => items.forEach(it => it.field.tick(dt, still));
  group.userData.sync(f, state);
  return group;
}

/* ------------------------------------------------------------------
   THE SEALED BOX: a glass cube of gas with a gauge head on its roof, its side wall and its floor
   ------------------------------------------------------------------ */

/** A gauge head facing +y: a brass bezel, a dark face, and a needle that turns about the face's axis. */
function gaugeHead(c, r) {
  const { THREE } = c;
  const head = new THREE.Group();
  head.add(mesh(c, new THREE.CylinderGeometry(r, r * 1.08, 0.016, 24), c.mats.labBrass));
  const face = mesh(c, new THREE.CylinderGeometry(r * 0.86, r * 0.86, 0.004, 24), c.own(new THREE.MeshStandardMaterial({ color: 0x14130f, roughness: 0.7, metalness: 0.1 })), { cast: false });
  face.position.y = 0.009;
  head.add(face);
  const needle = new THREE.Group();
  const bar = mesh(c, new THREE.BoxGeometry(0.003, 0.003, r * 0.8), c.own(new THREE.MeshStandardMaterial({ color: 0xd99423, roughness: 0.5, metalness: 0.2 })), { cast: false });
  bar.position.set(0, 0.012, -r * 0.4);
  needle.add(bar);
  head.add(needle);
  head.userData.needle = needle;
  return head;
}

function dressBox(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  group.name = 'gas-box';
  const g = boxGeometry(f, { box, dials: Object.keys(f.dials).filter(n => !f.props.hidden?.includes(n)).map((n, i) => ({ y: box.y0 + 8 + i * 5 })) });
  const v = g.vessel;
  const w = (v.x1 - v.x0) * s;
  const d = (v.y1 - v.y0) * s;
  const h = w * 0.72;
  const at = toPlate({ x: (v.x0 + v.x1) / 2, y: (v.y0 + v.y1) / 2 });
  const body = new THREE.Group();
  body.position.set(at.x, c.ground + 0.002, at.z);
  group.add(body);
  // The stand and the glass.
  body.add(mesh(c, new THREE.BoxGeometry(w * 1.06, 0.014, d * 1.06), c.mats.labCast));
  const glass = mesh(c, new THREE.BoxGeometry(w, h, d), c.mats.labGlass, { cast: false });
  glass.position.y = 0.014 + h / 2;
  glass.receiveShadow = false;
  body.add(glass);
  // The twelve edges of the cube: thin steel bars, so it reads as a vessel and not as a block.
  const bar = 0.006;
  for (const sy of [0, 1]) for (const sz of [-1, 1]) {
    const e = mesh(c, new THREE.BoxGeometry(w + bar, bar, bar), c.mats.labSteel);
    e.position.set(0, 0.014 + sy * h, sz * d / 2);
    body.add(e);
  }
  for (const sy of [0, 1]) for (const sx of [-1, 1]) {
    const e = mesh(c, new THREE.BoxGeometry(bar, bar, d + bar), c.mats.labSteel);
    e.position.set(sx * w / 2, 0.014 + sy * h, 0);
    body.add(e);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const e = mesh(c, new THREE.BoxGeometry(bar, h, bar), c.mats.labSteel);
    e.position.set(sx * w / 2, 0.014 + h / 2, sz * d / 2);
    body.add(e);
  }
  const gr = Math.min(w, d) * 0.15;
  const roof = gaugeHead(c, gr);
  roof.position.set(0, 0.014 + h + 0.008, 0);
  body.add(roof);
  const sideHead = gaugeHead(c, gr);
  const sideMount = new THREE.Group();
  sideMount.position.set(w / 2 + 0.008, 0.014 + h / 2, 0);
  sideMount.rotation.z = -Math.PI / 2;
  sideMount.add(sideHead);
  body.add(sideMount);
  // The floor's gauge hangs from a stub pipe that leaves the base toward the player, because a gauge under the box could not be seen.
  const floorHead = gaugeHead(c, gr);
  const floorMount = new THREE.Group();
  floorMount.position.set(0, 0.03, d / 2 + gr * 1.6);
  floorMount.add(floorHead);
  body.add(floorMount);
  const stub = mesh(c, new THREE.CylinderGeometry(0.006, 0.006, gr * 1.7, 8), c.mats.labBrass);
  stub.rotation.x = Math.PI / 2;
  stub.position.set(0, 0.02, d / 2 + gr * 0.8);
  body.add(stub);
  const field = new ParticleField({ own: c.own, kinds: [{ shape: 'circle', color: BONE }], cap: 72 });
  body.add(field.group);
  const needleAngle = (P, max) => -2.2 + 4.4 * clamp(P / max, 0, 1);
  group.userData.sync = (live, st) => {
    const q = boxRead(st, live.id);
    const box3 = { x0: -w / 2 + 0.012, x1: w / 2 - 0.012, y0: 0.014 + 0.012, y1: 0.014 + h - 0.012, z0: -d / 2 + 0.012, z1: d / 2 - 0.012 };
    field.set({ box: box3, radius: Math.min(w, d) * 0.04, groups: [{ count: q.dots, speeds: speedQuantiles(q.gasKey, q.T, q.dots) }] });
    const a = needleAngle(q.P, live.props.gaugeMax || 600);
    roof.userData.needle.rotation.y = a;
    sideHead.userData.needle.rotation.y = a;
    floorHead.userData.needle.rotation.y = a;
  };
  group.userData.tick = (dt, still) => field.tick(dt, still);
  group.userData.sync(f, state);
  return group;
}

/* ------------------------------------------------------------------
   THE PINHOLE: low glass chambers, each full of the gas that is still in it
   ------------------------------------------------------------------ */

function dressPinhole(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  group.name = 'gas-pinhole';
  const n = (f.props.chambers || []).length;
  const lastDial = Object.keys(f.dials).length ? box.y0 + 8 + (Object.keys(f.dials).length - 1) * 5 : box.y0 + 8;
  const cw = (f.size.w - 4) / n;
  const hu = f.props.chamberH ?? 12;
  const lidH = 0.05;
  const items = [];
  for (let i = 0; i < n; i++) {
    const ux = box.x0 + 2 + i * cw + (cw - 2) / 2;
    const uy = lastDial + 4 + hu / 2;
    const p = toPlate({ x: ux, y: uy });
    const cyl = new THREE.Group();
    cyl.position.set(p.x, c.ground + 0.002, p.z);
    cyl.add(buildLid((cw - 2) * s, hu * s, lidH, { mats: c.mats }));
    const field = new ParticleField({ own: c.own, kinds: [{ shape: 'circle', color: BONE }], cap: 72 });
    cyl.add(field.group);
    group.add(cyl);
    items.push({ i, field, w: (cw - 2) * s, d: hu * s });
  }
  group.userData.sync = (live, st) => {
    const r = pinholeRead(st, live.id);
    items.forEach(it => {
      const ch = r.chambers[it.i];
      if (!ch) return;
      const count = Math.round(24 * ch.left);
      const box3 = { x0: -it.w / 2 + 0.014, x1: it.w / 2 - 0.014, y0: 0.006, y1: lidH - 0.006, z0: -it.d / 2 + 0.014, z1: it.d / 2 - 0.014 };
      it.field.set({ box: box3, radius: 0.0045, groups: [{ count, speeds: speedQuantiles(ch.gas, live.props.T ?? 300, Math.max(count, 1)) }] });
    });
  };
  group.userData.tick = (dt, still) => items.forEach(it => it.field.tick(dt, still));
  group.userData.sync(f, state);
  return group;
}

/* ------------------------------------------------------------------
   THE COMMON TANK: every tank opened into it, each gas its own shape of particle
   ------------------------------------------------------------------ */

function dressCommon(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  group.name = 'gas-common';
  const top = f.props.top ?? 8.5;
  const tankH = f.props.tankH ?? 17;
  const wu = f.size.w * 0.44;
  const lidH = 0.06;
  const p = toPlate({ x: box.x0 + f.size.w * 0.52 + wu / 2, y: box.y0 + top + tankH / 2 });
  const cyl = new THREE.Group();
  cyl.position.set(p.x, c.ground + 0.002, p.z);
  cyl.add(buildLid(wu * s, tankH * s, lidH, { mats: c.mats }));
  const field = new ParticleField({ own: c.own, kinds: SHAPES.map(shape => ({ shape, color: BONE })), cap: 72 });
  cyl.add(field.group);
  group.add(cyl);
  const W = wu * s;
  const D = tankH * s;
  group.userData.sync = (live, st) => {
    const rd = commonRead(st, live.id);
    const box3 = { x0: -W / 2 + 0.016, x1: W / 2 - 0.016, y0: 0.008, y1: lidH - 0.008, z0: -D / 2 + 0.016, z1: D / 2 - 0.016 };
    field.set({
      box: box3, radius: 0.0042,
      groups: rd.parts.slice(0, SHAPES.length).map(part => {
        const count = Math.max(1, Math.round(part.n * 12));
        return { count, speeds: speedQuantiles(part.gas, rd.T, count) };
      })
    });
  };
  group.userData.tick = (dt, still) => field.tick(dt, still);
  group.userData.sync(f, state);
  return group;
}

/**
 * The glass and the crowd of one fixture, or null when the fixture has none of its own (a scale, a plaque, a marker). The tube keeps
 * its lid and its flat picture of the fronts, because a front is a profile along a line and not a crowd.
 */
export function gasDress(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  if (f.kind === 'rig') return dressRig(f, state, c);
  if (f.kind === 'box') return dressBox(f, state, c);
  if (f.kind === 'pinhole') return dressPinhole(f, state, c);
  if (f.kind === 'common') return dressCommon(f, state, c);
  if (f.kind === 'tube') {
    const group = new THREE.Group();
    const lastDial = Object.keys(f.dials).length ? box.y0 + 8 + (Object.keys(f.dials).length - 1) * 5 : box.y0 + 8;
    const lid = buildLid((f.size.w - 8) * s, 5.6 * s, 0.026, { mats: c.mats });
    const p = toPlate({ x: box.x0 + f.size.w / 2, y: lastDial + 5 + 2.7 });
    lid.position.set(p.x, c.ground + 0.002, p.z);
    group.add(lid);
    return group;
  }
  return null;
}

