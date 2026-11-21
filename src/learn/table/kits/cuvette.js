/**
 * kits/cuvette.js — The cuvette kit: cuvettes filled drop by drop, slid into a beam, and read.
 *
 * LANTERNFALL'S NINTH BENCH, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4c): `q9-absorb`. A cuvette is a piece with drops in it (a drop
 * is a fixed strength, so drops are concentration); the DROPPER laid on one adds a drop, the EMPTY tool rinses it. A cuvette put in the
 * spectrometer's holder is read live (A = epsilon x b x c, `lightdata.js` `planAbsorb`) at the wavelength and path the dials stand at, and
 * "Record" drops a point on the sheet: against wavelength, against strength or against path, as the stage says. The straightedge is the built-in
 * recorder tool, laid across the points for the calibration line. A light dial shows what each kind of light does to a molecule, and a strip shows
 * the light that gets through a solution, its missing colour dark.
 *
 * A THIN WRAPPER over `lightdata.js` (`planAbsorb`, `regionOf`, `planRegion`, `wavelengthRgb`) and it authors nothing: every reading is the
 * planners' answer, shown as the picture. A sealed cuvette is read but its strength is never printed.
 */

import { registerKit } from './registry.js';
import { BUILTIN_TOOLS } from '../tools.js';
import { paintPiece, paintFixture, faceKey, RECTS, cuvetteLook, paintLegend } from './cuvette-draw.js';
import { buildCuvette, buildDropper, buildRinseBottle, CUVETTE_TOP } from '../../engine/lab-props.js';
import { buildBeamThrough } from '../../engine/lab-props-lanternfall.js';
import { wavelengthRgb } from '../../engine/lightdata.js';
import {
  seatedIn, spectroRead, regionRead, concOf, MAX_DROPS, COPPER_SWEEP, PATHS, REGIONS
} from './cuvette-read.js';

export const CUVETTE_KIT_ID = 'cuvette';
export const CUVETTE_BOUNDS_H = 64;

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun || f.kind !== 'spectro') return null;
  const r = spectroRead(state, fixtureId);
  if (!r.piece) return { noop: 'Put a cuvette in the beam first.' };
  const piece = r.piece;
  // A sealed cuvette is read, never plotted: its face keeps the reading and the sheet is not told its strength.
  if (piece.props.sealed) return { stamp: { [piece.id]: { read: r.A } } };
  const axis = f.props.xAxis || 'conc';
  const x = axis === 'nm' ? r.nm : axis === 'path' ? r.path : Math.round(r.conc * 1e6) / 1e3;
  return { x, y: r.A, label: piece.label };
}

/** A tool laid on a cuvette: the dropper adds a drop, the empty tool pours it out; nothing else joins anything. */
function planJoin(a, b) {
  if ((a.kind === 'dropper' || a.kind === 'rinse') && b.kind === 'cuvette') {
    if (b.props.sealed || b.props.conc != null) return { holds: false, home: true, reason: 'That cuvette is sealed or filled from the lake: its strength is not yours to change.' };
    const drops = b.props.drops || 0;
    if (a.kind === 'rinse') {
      if (drops === 0) return { holds: false, home: true, reason: 'That cuvette is already empty.' };
      return { holds: true, once: true, set: { b: { drops: 0 } }, reason: 'Poured out.' };
    }
    if (drops >= MAX_DROPS) return { holds: false, home: true, reason: 'That cuvette is full.' };
    return { holds: true, once: true, set: { b: { drops: drops + 1 } }, reason: 'A drop added.' };
  }
  return { holds: false, home: true, reason: 'Nothing here joins.' };
}

const rect = (r, kind) => ({ r, rect: RECTS[kind], nojoin: true });

/** A cuvette, a dropper or a rinse bottle as the solid thing it is; a card for the rest. */
function piece3d(p, state, c) {
  if (p.kind === 'cuvette') {
    const look = cuvetteLook(p);
    const legend = c.paint(c.hw * 1.85, 0.064, (ctx, W, H) => paintLegend(ctx, p, W, H), { seed: `${p.id}|${p.label}|${p.props.drops || 0}|${p.props.read ?? ''}`, px: 512 });
    return buildCuvette(c, { level: look.level, tint: look.tint, legend });
  }
  if (p.kind === 'dropper') return buildDropper(c);
  if (p.kind === 'rinse') return buildRinseBottle(c);
  return null;
}

/**
 * 3D animated HCl molecule for the "Light and a molecule" bench (`f.props.region`):
 * Microwave spins the whole molecule end-over-end, Infrared stretches & bends the bond,
 * and UV/visible lifts an electron from the inner shell ring up to an outer excited ring.
 */
function buildMolecule3d(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  const center = toPlate({ x: box.x0 + f.size.w * 0.56, y: box.y0 + f.size.h * 0.58 });
  const pivot = new THREE.Group();
  pivot.position.set(center.x, c.ground + 0.068, center.z);
  group.add(pivot);

  const ownMat = m => { if (m.userData) m.userData.tableOwned = true; return m; };
  const clMat = ownMat(new THREE.MeshStandardMaterial({ color: 0x3ba87c, roughness: 0.35, metalness: 0.15 }));
  const hMat = ownMat(new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.35, metalness: 0.1 }));
  const bondMat = ownMat(new THREE.MeshStandardMaterial({ color: 0x9aa4aa, roughness: 0.45, metalness: 0.4 }));
  const ringInnerMat = ownMat(new THREE.MeshBasicMaterial({ color: 0x6f7b82, transparent: true, opacity: 0.55 }));
  const ringOuterMat = ownMat(new THREE.MeshBasicMaterial({ color: 0xe59b24, transparent: true, opacity: 0.85 }));
  const eMat = ownMat(new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xe59b24, emissiveIntensity: 1.6, roughness: 0.2 }));

  const R = 3.2 * s;
  const baseHalf = 5.4 * s;
  const clMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.35, 24, 18), clMat);
  const hMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 0.88, 20, 16), hMat);
  const bondGeo = new THREE.CylinderGeometry(R * 0.24, R * 0.24, 1, 12);
  bondGeo.rotateZ(Math.PI / 2);
  const bondMesh = new THREE.Mesh(bondGeo, bondMat);

  clMesh.position.set(baseHalf, 0, 0);
  hMesh.position.set(-baseHalf, 0, 0);
  bondMesh.scale.set(baseHalf * 2, 1, 1);

  const molGroup = new THREE.Group();
  molGroup.add(clMesh, hMesh, bondMesh);
  pivot.add(molGroup);

  // Orbital rings + electron (visible in UV/visible mode)
  const orbGroup = new THREE.Group();
  const rInner = R * 2.1;
  const rOuter = R * 3.45;
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(rInner, 0.0022, 8, 48), ringInnerMat);
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(rOuter, 0.0026, 8, 48), ringOuterMat);
  innerRing.rotation.x = Math.PI / 2;
  outerRing.rotation.x = Math.PI / 2;
  const electron = new THREE.Mesh(new THREE.SphereGeometry(R * 0.34, 14, 12), eMat);
  orbGroup.add(innerRing, outerRing, electron);
  orbGroup.position.set(baseHalf, 0, 0);
  molGroup.add(orbGroup);

  let mode = 'spins';
  let t = 0;

  const applyPose = () => {
    orbGroup.visible = mode === 'jumps';
    if (mode === 'spins') {
      clMesh.position.set(baseHalf, 0, 0);
      hMesh.position.set(-baseHalf, 0, 0);
      bondMesh.position.set(0, 0, 0);
      bondMesh.scale.set(baseHalf * 2, 1, 1);
      bondMesh.rotation.set(0, 0, 0);
      molGroup.rotation.set(0.32 * Math.sin(t * 1.4), t * 2.6, 0.22 * Math.cos(t * 1.1));
    } else if (mode === 'vibrates') {
      const stretch = Math.sin(t * 7.5);
      const bend = Math.sin(t * 3.75) * 0.24 * baseHalf;
      const half = baseHalf * (1 + 0.34 * stretch);
      clMesh.position.set(half, bend * 0.35, 0);
      hMesh.position.set(-half, -bend, 0);
      const dx = clMesh.position.x - hMesh.position.x;
      const dy = clMesh.position.y - hMesh.position.y;
      bondMesh.position.set((clMesh.position.x + hMesh.position.x) / 2, (clMesh.position.y + hMesh.position.y) / 2, 0);
      bondMesh.scale.set(Math.hypot(dx, dy), 1, 1);
      bondMesh.rotation.set(0, 0, Math.atan2(dy, dx));
      molGroup.rotation.set(0.28, 0.25 * Math.sin(t * 0.8), 0);
    } else {
      clMesh.position.set(baseHalf, 0, 0);
      hMesh.position.set(-baseHalf, 0, 0);
      bondMesh.position.set(0, 0, 0);
      bondMesh.scale.set(baseHalf * 2, 1, 1);
      bondMesh.rotation.set(0, 0, 0);
      molGroup.rotation.set(0.45, 0.15, 0);
      // Smoothly pulse between inner shell and outer excited shell
      const cycle = (t * 0.55) % 1;
      const jump = cycle < 0.2 ? cycle / 0.2 : cycle < 0.72 ? 1 : Math.max(0, 1 - (cycle - 0.72) / 0.2);
      const er = rInner + (rOuter - rInner) * jump;
      const ang = t * 4.2;
      electron.position.set(Math.cos(ang) * er, 0, Math.sin(ang) * er);
      ringOuterMat.opacity = 0.35 + 0.65 * jump;
    }
  };

  const sync = (fx, st) => {
    const r = regionRead(st, fx.id);
    mode = r.motion === 'spins' ? 'spins' : r.motion === 'vibrates' ? 'vibrates' : 'jumps';
    applyPose();
  };
  group.userData.sync = sync;
  group.userData.tick = (dt, still) => {
    if (still) return;
    t += dt;
    applyPose();
  };
  sync(f, state);
  return group;
}

/**
 * A beam of light through the cuvette in the spectrophotometer's optical chamber: it enters from the lamp housing and
 * exits into the photodetector sensor at the chamber edge, attenuated according to transmittance (10^-A). It never
 * crosses into the digital display or control panel.
 */
function dress3d(f, state, c) {
  if (f.kind !== 'spectro') return null;
  if (f.props.region) return buildMolecule3d(f, state, c);
  if (f.props.strip || !f.props.slot) return null;
  const slot = state.zones.slots[f.props.slot];
  if (!slot) return null;
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();

  // Beam spans strictly from light source at left of chamber to detector sensor on right of well
  const inLen = (slot.at.x - (box.x0 + 2.5)) * s;
  const outLen = 9.5 * s;
  if (inLen <= 0.01 || outLen <= 0.01) return null;
  const beam = buildBeamThrough(c, { inLen, outLen, gap: 0.030 });
  const p = toPlate({ x: slot.at.x, y: slot.at.y - (RECTS.cuvette?.hh || 10) * 0.22 });
  beam.position.set(p.x, c.ground + 0.048, p.z);
  group.add(beam);

  // 3D Spectrophotometer Casing Hardware
  const casingMat = c.mats?.dark || (c.mat ? c.mat(0x1b1916) : new THREE.MeshStandardMaterial({ color: 0x1b1916, roughness: 0.7, metalness: 0.3 }));
  if (casingMat.userData) casingMat.userData.tableOwned = true;
  const sensorMat = c.mats?.steel || (c.mat ? c.mat(0x242d30) : new THREE.MeshStandardMaterial({ color: 0x242d30, roughness: 0.4, metalness: 0.6 }));
  if (sensorMat.userData) sensorMat.userData.tableOwned = true;

  // 1. Lamp Housing block on left
  const lampP = toPlate({ x: box.x0 + 2.0, y: slot.at.y - (RECTS.cuvette?.hh || 10) * 0.22 });
  const lampBox = new THREE.Mesh(new THREE.BoxGeometry(2.5 * s, 0.040, 16 * s), casingMat);
  lampBox.position.set(lampP.x, c.ground + 0.020, lampP.z);
  group.add(lampBox);

  // 2. Photodetector Sensor Housing block on right of cuvette
  const detP = toPlate({ x: slot.at.x + 9.5, y: slot.at.y - (RECTS.cuvette?.hh || 10) * 0.22 });
  const detBox = new THREE.Mesh(new THREE.BoxGeometry(2.2 * s, 0.040, 16 * s), sensorMat);
  detBox.position.set(detP.x, c.ground + 0.020, detP.z);
  group.add(detBox);

  // 3. Digital LCD Screen Bezel Frame on right
  const scrTop = f.props.tune ? 11.5 : 4.5;
  const scrH = f.props.tune ? 17.5 : 21.5;
  const scrX = box.x0 + 26 + (f.size.w - 28.5) / 2;
  const scrY = box.y0 + scrTop + scrH / 2;
  const scrP = toPlate({ x: scrX, y: scrY });
  // A frame, not a slab: the readout is painted on the plate inside it and must stay in view.
  const bw = f.size.w - 28.5;
  const bh = scrH;
  const edge = 0.5;
  const strip = (w, h, dx, dz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w * s, 0.006, h * s), sensorMat);
    m.position.set(scrP.x + dx * s, c.ground + 0.003, scrP.z + dz * s);
    group.add(m);
  };
  strip(bw, edge, 0, -(bh - edge) / 2);
  strip(bw, edge, 0, (bh - edge) / 2);
  strip(edge, bh, -(bw - edge) / 2, 0);
  strip(edge, bh, (bw - edge) / 2, 0);

  const sync = (fx, st) => {
    const r = spectroRead(st, fx.id);
    beam.userData.set(wavelengthRgb(r.nm), r.piece ? Math.pow(10, -r.A) : null);
  };
  group.userData.sync = sync;
  sync(f, state);
  return group;
}

/** A tool laid over a cuvette rests on its rim. */
function restHeight(p, state, at) {
  if (p.kind !== 'dropper' && p.kind !== 'rinse') return 0;
  const over = Object.values(state.pieces).some(q => q.kind === 'cuvette' && !q.hidden && Math.abs(q.at.x - at.x) < 9 && Math.abs(q.at.y - at.y) < 10);
  return over ? CUVETTE_TOP + 0.004 : 0;
}

export const CUVETTE_KIT = {
  id: CUVETTE_KIT_ID,
  kinds: {
    cuvette: { r: 9, rect: RECTS.cuvette },
    chip: rect(8, 'chip'),
    motion: rect(9, 'motion'),
    reading: rect(9, 'reading'),
    dropper: { r: 7, rect: RECTS.tool, tool: true },
    rinse: { r: 7, rect: RECTS.tool, tool: true }
  },
  // The straightedge is the built-in recorder tool; what it needs laid on is two readings, so its probe reads two cuvettes first.
  tools: {
    straightedge: {
      ...BUILTIN_TOOLS.straightedge,
      probe(state) {
        const beam = Object.values(state.fixtures).find(f => f.kind === 'spectro' && f.props.slot)?.props.slot;
        const two = Object.values(state.pieces).filter(p => p.kind === 'cuvette' && !p.props.sealed && !p.hidden).slice(0, 2);
        const fx = Object.values(state.fixtures).find(f => f.kind === 'spectro' && f.props.slot)?.id;
        const out = [];
        for (const c of two) out.push({ place: { piece: c.id, to: `slot:${beam}` } }, { run: fx });
        out.push({ lay: { kind: 'straightedge', through: [0, two.length - 1] } });
        return out;
      }
    }
  },
  pairable: (a, b) => (a.kind === 'dropper' || a.kind === 'rinse') && b.kind === 'cuvette',
  planJoin,
  run,
  paintPiece,
  paintFixture,
  piece3d,
  dress3d,
  restHeight,
  slot3d: (zone, state) => (Object.values(state.fixtures).some(f => f.kind === 'spectro' && f.props.slot === zone.id) ? 'well' : null),
  deckStyle: f => (f?.props?.slot ? null : 'instrument'),
  printed: p => String(p.label),
  faceKey
};

registerKit(CUVETTE_KIT);

/** A stage's declaration with the cuvette kit's defaults: the kit, the bounds, a parked recorder strip. */
export function cuvetteTable(spec, { w = 150, recorder = null } = {}) {
  return { kit: CUVETTE_KIT_ID, bounds: { w, h: CUVETTE_BOUNDS_H }, tools: [], recorder: recorder || { at: { x: w - 2.6, y: CUVETTE_BOUNDS_H - 2.4 }, size: { w: 5, h: 3.4 } }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

/** A cuvette of copper(II) sulfate: `drops` of stock in it, or a fixed `conc` (mol/L) when sealed or drawn from the lake. */
export const cuvette = (id, label, at, { drops = 0, conc = null, sealed = false, blank = false, solute = 'cuso4', zone = null, fetchFrom = null, hidden = false } = {}) => ({
  id, kind: 'cuvette', label, at, ...(zone ? { zone } : {}), ...(fetchFrom ? { fetchFrom } : {}), ...(hidden ? { hidden: true } : {}),
  props: { solute, ...(conc != null ? { conc } : { drops }), ...(sealed ? { sealed: true } : {}), ...(blank ? { blank: true } : {}) }
});

// Solute preparation tools: Cu²⁺ stock adds 2.0 mmol/L per drop; Rinse bottle resets to 0.0 mmol/L pure solvent.
export const dropper = (id, at, label = 'Cu²⁺ Stock') => ({ id, kind: 'dropper', label, at, props: {}, caption: '+2.0 mmol/L' });
export const rinser = (id, at, label = 'Rinse') => ({ id, kind: 'rinse', label, at, props: {}, caption: 'Reset to 0' });
export const chip = (id, label, nm, at) => ({ id, kind: 'chip', label, at, props: { nm } });
export const motionCard = (id, label, at) => ({ id, kind: 'motion', label, at, props: {} });
export const readingCard = (id, label, nm, at) => ({ id, kind: 'reading', label, at, props: { nm } });

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

/**
 * The spectrometer: a holder for one cuvette, a live reading, and (as the stage uses them) a wavelength dial (`tune`), a path dial
 * (`pathDial`) and a Record key. `xAxis` is what a recorded point is plotted against: 'nm', 'conc' or 'path'. `region` instead makes it the
 * light dial with a molecule to watch, and `strip` the strip of light that gets through the cuvette in the holder.
 */
export function spectro(id, at, {
  tune = false, pathDial = false, record = true, xAxis = 'conc', word = 'ABSORBANCE', nmFixed = 630, pathFixed = 1, start = 2,
  region = false, molecule = 'HCl', strip = false, label = 'Spectrometer', w = 74, h = 40
} = {}) {
  const size = { w, h };
  const slotId = `${id}.cuv`;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const dials = {};
  const hidden = [];
  if (region) {
    dials.region = { min: 1, max: 3, step: 1, value: 1, label: 'Light', labels: ['Microwave', 'Infrared', 'Ultraviolet and visible'] };
  } else {
    dials.nm = { min: 1, max: COPPER_SWEEP.length, step: 1, value: start, label: 'Wavelength (nm)', labels: COPPER_SWEEP.map(String) };
    dials.path = { min: 1, max: PATHS.length, step: 1, value: 1, label: 'Path', labels: PATHS.map(p => `${p} cm`) };
    if (!tune) hidden.push('nm');
    if (!pathDial) hidden.push('path');
  }
  const noRun = region || strip || !record;
  return {
    fixture: {
      id, kind: 'spectro', label, at: { ...at }, size, ...(noRun ? { noRun: true } : { runLabel: 'Record' }), dials,
      props: {
        backdrop: true, slot: region ? null : slotId, tune, pathDial, xAxis, word, nmFixed, pathFixed, ...(strip ? { strip: true } : {}),
        ...(region ? { molecule } : {}), hidden, readAt: 24
      }
    },
    // The cuvette stands in a well as wide as its stand (18 units); only cuvettes fit in the beam holder.
    slots: region ? [] : [{ id: slotId, label: '', accepts: ['cuvette'], at: { x: x0 + 11, y: y0 + h - 12.5 }, size: { w: 20, h: 22 } }],
    size,
    slotId
  };
}

/** A printed reference: lines of text on a plate. */
export function plaqueFixture(id, label, at, lines, { w = 44 } = {}) {
  return { id, kind: 'plaque', label, at: { ...at }, size: { w, h: 8.4 + lines.length * 3.8 }, noRun: true, dials: {}, props: { lines: lines.slice() } };
}

/** A number to set: a marker the player sets to what they have read. */
export function markerFixture(id, label, at, { min = 0, max = 8, step = 0.5, w = 44 } = {}) {
  return { id, kind: 'marker', label, at: { ...at }, size: { w, h: 16 }, noRun: true, dials: { value: { min, max, step, value: min, label: 'Set' } }, props: {} };
}

export * from './cuvette-read.js';
export { REGIONS };
