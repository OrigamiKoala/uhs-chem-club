/**
 * model-parts-lanternfall.js — the solid models Lanternfall's reward cards hold, as parts for `ui/model-viewer.js`.
 *
 * PURE DATA, like `model-parts.js` (which hands it any spec whose `type` it knows). A spec carries only what the bench measured,
 * and every part here is DERIVED from the planners the bench asks (`lightdata.js`, `orbitals.js`, `electrons.js`), so a model is
 * the same fact the player worked out, held in the hand and never a second copy of it:
 *
 *   { type: 'wave', nm: [700, 400] }                          one wave on the desk, tuned from the first wavelength to the last and back
 *   { type: 'photons', metal: 'Na', nm: 400, brightness: 2 }  packets striking a plate, and the electrons that leave it
 *   { type: 'ladder', hi: 3, lo: 2 }                          rungs at their energies, an electron dropped, the packet of light it gave out
 *   { type: 'orbital', orbital: '2pz', dots: 260 }            the dots of one cloud, standing in space where the probe found them
 *   { type: 'rack', z: 8 }                                    the boxes of an atom's rows, an arrow in each place an electron stands
 *   { type: 'radii', items: [{ sym: 'Li', pm: 152 }, ...] }   atoms as spheres to scale
 *   { type: 'cuvette', solute: 'cuso4', conc: 0.01, nm: 630 } a beam through a cell of solution, dimmer on the far side
 *
 * Each returns `{ spheres, bonds, rings, electrons, radius }`; a wave also carries a `wave` descriptor for its animation. A sphere is
 * `{ pos, r, color, kind, seg? }` and a bond `{ a, b, order }`.
 * Colours are the plate's weathered palette; a beam of light takes its own colour from `wavelengthRgb`.
 */

import {
  wavelengthRgb, planPhotocell, planJump, planAbsorb, TRACE_SPAN_NM, SOLUTES
} from './lightdata.js';
import { sampleOrbital, ORBITALS } from './orbitals.js';
import { LADDER, boxesOf, rackFor, groundConfig } from './electrons.js';
import { mulberry32 } from './plates.js';

const AMBER = '#d99423';
const PALE = '#dcd6cc';
const STEEL = '#8c8376';
const DIM = '#6b625a';
const BLUE = '#6f8f9d';

const hex = rgb => `#${rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
/** The colour of a wavelength; the plate's pale ink for light the eye cannot see. */
const lightColour = nm => { const rgb = wavelengthRgb(nm); return rgb ? hex(rgb) : PALE; };

const empty = radius => ({ spheres: [], bonds: [], rings: [], electrons: [], radius });
const sphere = (pos, r, color, kind, seg) => ({ pos, r, color, kind, ...(seg ? { seg } : {}) });
const bond = (a, b, order = 1) => ({ a, b, order });

/* ------------------------------------------------------------------ waves */

/**
 * ONE wave of light lying flat on the desk, over a length that stands for the bench's 2400 nm ruler.
 * It carries the two wavelengths it is tuned between; `ui/model-viewer.js` animates it from the first to
 * the last and back, so the crests crowd together and the colour shifts as the frequency rises.
 */
function waveParts(spec) {
  const list = (spec.nm && spec.nm.length ? spec.nm : [550]).slice();
  const L = 5.2;
  const x0 = -L / 2;
  const amp = 0.42;
  const parts = empty(3.4);
  const nm = list[0];
  const per = (nm / TRACE_SPAN_NM) * L;
  const colour = lightColour(nm);
  const n = 160;
  for (let i = 0; i < n; i++) {
    const x = x0 + (L * i) / (n - 1);
    const z = amp * Math.cos((2 * Math.PI * (x - x0)) / per);
    parts.spheres.push(sphere([x, 0.05, z], 0.045, colour, 'wave', 6));
  }
  parts.wave = { nm: list, span: TRACE_SPAN_NM, length: L, amp, count: n, y: 0.05 };
  return parts;
}

/* ------------------------------------------------------------------ photons */

const METAL_COLOUR = { Cs: '#c4b383', Na: '#b9b5a4', Zn: '#8e9ba3' };

/** Packets of light striking a plate: as many as the lamp's brightness, as big as their frequency, and the electrons that leave. */
function photonParts(spec) {
  const plan = planPhotocell(spec.metal, spec.nm, spec.brightness);
  const parts = empty(3.4);
  const colour = lightColour(spec.nm);
  const f14 = 3e8 / (spec.nm * 1e-9) / 1e14;
  const r = 0.07 + 0.016 * f14;
  // The plate: a standing wall of metal atoms.
  for (let j = 0; j < 5; j++) for (let k = 0; k < 4; k++) parts.spheres.push(sphere([1.2, -1.0 + j * 0.5, -0.75 + k * 0.5], 0.2, METAL_COLOUR[spec.metal] || STEEL, 'plate', 14));
  // The packets, one lane each, with a faint line from each to the plate.
  const laneY = i => (spec.brightness === 1 ? 0 : -0.9 + (i * 1.8) / (spec.brightness - 1));
  for (let i = 0; i < spec.brightness; i++) {
    const y = laneY(i);
    const z = ((i * 7) % 4) * 0.4 - 0.6;
    const x = -2.4 + (i % 2) * 0.5;
    parts.spheres.push(sphere([x, y, z], r, colour, 'photon', 14));
    parts.bonds.push(bond([x + r, y, z], [1.0, y, z]));
  }
  // The electrons that left, one for each packet that freed one.
  if (plan.freed) {
    for (let i = 0; i < spec.brightness; i++) {
      const y = laneY(i);
      const z = ((i * 7) % 4) * 0.4 - 0.6;
      parts.spheres.push(sphere([1.7 + plan.speed * 0.12, y, z], 0.1, PALE, 'electron', 10));
    }
  }
  return parts;
}

/* ------------------------------------------------------------------ the energy ladder */

/** Rungs at their energies (crowding together as they climb), an electron on the one it dropped to, a packet of light leaving. */
function ladderParts(spec) {
  const parts = empty(3.3);
  const yOf = n => 2.4 * (-1 / (n * n)) + 1.0;
  const rungs = spec.rungs || 6;
  for (let n = 1; n <= rungs; n++) parts.bonds.push(bond([-1.1, yOf(n), 0], [1.1, yOf(n), 0], 2));
  const jump = planJump(spec.hi, spec.lo);
  // The electron stands where it dropped to; a faint one marks the rung it fell from.
  parts.spheres.push(sphere([0.2, yOf(spec.lo) + 0.12, 0], 0.12, PALE, 'electron', 14));
  parts.spheres.push(sphere([-0.5, yOf(spec.hi) + 0.12, 0], 0.1, DIM, 'was', 12));
  parts.bonds.push(bond([-0.5, yOf(spec.hi) + 0.05, 0], [0.2, yOf(spec.lo) + 0.2, 0]));
  // The light it gave out: a packet leaving the atom, in its own colour.
  const colour = lightColour(jump.nm);
  for (let i = 0; i < 4; i++) parts.spheres.push(sphere([1.3 + i * 0.35, (yOf(spec.hi) + yOf(spec.lo)) / 2 + (i % 2 ? 0.08 : -0.08), 0], 0.1 - i * 0.012, colour, 'photon', 12));
  return parts;
}

/* ------------------------------------------------------------------ an orbital */

/** The dots a probe found in one orbital, standing where they were found. A seeded draw: the same card is always the same cloud. */
function orbitalParts(spec) {
  const id = spec.orbital;
  if (!ORBITALS[id]) throw new Error(`model: no orbital "${id}"`);
  const pts = sampleOrbital(id, spec.dots || 260, spec.seed || 1);
  let reach = 1;
  for (const p of pts) reach = Math.max(reach, Math.hypot(p.x, p.y, p.z));
  const k = 2.3 / reach;
  const parts = empty(2.6);
  for (const p of pts) parts.spheres.push(sphere([p.x * k, p.z * k, p.y * k], 0.045, AMBER, 'dot', 6));
  parts.spheres.push(sphere([0, 0, 0], 0.1, PALE, 'nucleus', 12));
  return parts;
}

/* ------------------------------------------------------------------ the rack */

const rowsFor = counts => {
  const filled = LADDER.filter(r => counts[r.id]);
  const top = filled.length ? LADDER.indexOf(filled[filled.length - 1]) : 0;
  return LADDER.slice(0, top + 1);
};

/**
 * The boxes of an atom's rows, lowest at the bottom, with an arrow in each place an electron stands. An up arrow is a rod with its head
 * at the top; a down arrow hangs the other way, with its head at the foot. Which boxes hold one or two comes from `rackFor`.
 */
function rackParts(spec) {
  const counts = spec.counts || groundConfig(spec.z);
  const rack = spec.rack || rackFor(spec.z, spec.counts ? { counts: spec.counts } : {});
  const rows = rowsFor(counts);
  const parts = empty(3.2);
  const pitch = 0.62;
  const yTop = (rows.length - 1) * pitch / 2;
  rows.forEach((row, i) => {
    const y = -yTop + i * pitch;
    const count = boxesOf(row.l);
    for (let k = 0; k < count; k++) {
      const cx = (k - (count - 1) / 2) * 0.72;
      parts.bonds.push(bond([cx - 0.3, y, 0], [cx + 0.3, y, 0], 2));
      const here = rack[`${row.id}:${k}`] || '';
      if (here.includes('u')) {
        parts.bonds.push(bond([cx - 0.1, y, 0], [cx - 0.1, y + 0.38, 0]));
        parts.spheres.push(sphere([cx - 0.1, y + 0.42, 0], 0.09, AMBER, 'up', 10));
      }
      if (here.includes('d')) {
        parts.bonds.push(bond([cx + 0.1, y + 0.4, 0], [cx + 0.1, y + 0.02, 0]));
        parts.spheres.push(sphere([cx + 0.1, y + 0.02, 0], 0.09, PALE, 'down', 10));
      }
    }
  });
  parts.radius = Math.max(2.4, yTop + 1.1, 1.2 + Math.max(...rows.map(r => boxesOf(r.l))) * 0.4);
  return parts;
}

/* ------------------------------------------------------------------ atoms to scale */

const ATOM_COLOUR = { Li: '#cfc8b8', Be: '#9aa28a', B: '#a0522d', C: '#4a4640', N: '#6f8f9d', O: '#a0522d', F: '#c9b66a', Na: '#cfc8b8', Mg: '#9aa28a', K: '#b9b5a4', Cl: '#c9b66a', 'Na+': '#cfc8b8', 'Cl-': '#c9b66a' };

/** Atoms and ions as spheres whose radii are in proportion to the measured radii, side by side. */
function radiiParts(spec) {
  const items = spec.items;
  const k = 0.0046;
  const parts = empty(1);
  let x = 0;
  const placed = items.map(it => { const r = it.pm * k; const c = x + r; x = c + r + 0.25; return { it, r, c }; });
  const shift = x / 2 - 0.12;
  for (const { it, r, c } of placed) parts.spheres.push(sphere([c - shift, 0, 0], r, ATOM_COLOUR[it.sym] || STEEL, it.sym, 24));
  parts.radius = x / 2 + 0.4;
  return parts;
}

/* ------------------------------------------------------------------ a cuvette */

/** A beam through a glass cell of solution: the particles in the cell, the beam going in whole and coming out dimmer by the absorbance. */
function cuvetteParts(spec) {
  const parts = empty(3.3);
  const path = spec.path || 1;
  const w = 0.9 + 0.5 * path;
  const hw = w / 2;
  const hh = 1.0;
  const hd = 0.7;
  const corners = [];
  for (const x of [-hw, hw]) for (const y of [-hh, hh]) for (const z of [-hd, hd]) corners.push([x, y, z]);
  for (let i = 0; i < corners.length; i++) for (let j = i + 1; j < corners.length; j++) {
    const d = corners[i].map((v, k) => Math.abs(v - corners[j][k]));
    if (d.filter(v => v > 1e-9).length === 1) parts.bonds.push(bond(corners[i], corners[j]));
  }
  const rnd = mulberry32(0x9c);
  const n = Math.round(spec.conc * 1800);
  for (let i = 0; i < n; i++) parts.spheres.push(sphere([(rnd() * 2 - 1) * (hw - 0.12), (rnd() * 2 - 1) * (hh - 0.12), (rnd() * 2 - 1) * (hd - 0.12)], 0.05, BLUE, 'solute', 6));
  const A = planAbsorb(spec.solute, spec.nm, path, spec.conc);
  const through = Math.pow(10, -A);
  const colour = lightColour(spec.nm);
  const dots = 9;
  // Going in: every dot of the beam. Coming out: the share that got through.
  for (let i = 0; i < dots; i++) parts.spheres.push(sphere([-3 + (i * (3 - hw - 0.1)) / dots, 0, 0], 0.07, colour, 'beam-in', 10));
  const out = Math.max(1, Math.round(dots * through));
  for (let i = 0; i < out; i++) parts.spheres.push(sphere([hw + 0.2 + (i * (3 - hw - 0.3)) / dots, 0, 0], 0.07, colour, 'beam-out', 10));
  parts.absorbance = A;
  return parts;
}

/* ------------------------------------------------------------------ the registry */

export const LANTERNFALL_MODELS = {
  wave: waveParts,
  photons: photonParts,
  ladder: ladderParts,
  orbital: orbitalParts,
  rack: rackParts,
  radii: radiiParts,
  cuvette: cuvetteParts
};

/** The words under one of these models when its spec gives none. */
export function lanternfallCaption(spec) {
  switch (spec.type) {
    case 'wave': return `One wave tuned from ${spec.nm[0]} nm to ${spec.nm[spec.nm.length - 1]} nm and back: the crests crowd together, more pass each second, and the colour shifts.`;
    case 'photons': return `${spec.brightness} packets of ${spec.nm} nm light striking ${spec.metal}.`;
    case 'ladder': return `An electron dropping from rung ${spec.hi} to rung ${spec.lo}, and the packet of light it gives out.`;
    case 'orbital': return `The ${spec.orbital} cloud: ${spec.dots || 260} dots from the probe.`;
    case 'rack': return `The electrons of element ${spec.z}, one arrow each.`;
    case 'radii': return `${spec.items.map(it => `${it.sym} ${it.pm} pm`).join(', ')}, spheres to scale.`;
    case 'cuvette': return `A beam of ${spec.nm} nm light through ${SOLUTES[spec.solute].name}.`;
    default: return '';
  }
}
