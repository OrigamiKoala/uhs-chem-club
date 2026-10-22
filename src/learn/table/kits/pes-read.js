/**
 * kits/pes-read.js — What the photoelectron bench of the spectrum kit reads.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. Every peak is `electrons.js` `planPES` (through `electronbench.js` `spectrumOf`): one peak per row
 * that holds electrons, its position the energy that row's electrons are held with (the real binding energies, MJ/mol), its height
 * how many of them there are. This file only decides WHICH of those a beam of a given energy knocks loose (an electron comes off
 * when the light carries at least the energy it is held with), which bin of the strip each lands in, and what a stage's `check`
 * reads: the electrons freed, the piles standing in the strip, the atom built to match, the configuration written.
 *
 * A stage declares what stands on the table and what to look for; it never declares what a spectrum is.
 */

import { spectrumOf, shellsOf } from '../../engine/electronbench.js';
import { groundConfig, zOf, symbolOf, nameOf, BINDING, LADDER, capacityOf } from '../../engine/electrons.js';
import { SIZES, rectOf } from '../snap.js';

export { spectrumOf, shellsOf, groundConfig, zOf, symbolOf, nameOf, BINDING, LADDER, capacityOf };

/* ------------------------------------------------------------------
   THE STRIP: twenty bins on a log scale, the most tightly held at the left
   ------------------------------------------------------------------ */

export const AXIS = Object.freeze({ lo: 0.3, hi: 260 });
const LOG_LO = Math.log10(AXIS.lo);
const LOG_HI = Math.log10(AXIS.hi);

/** How many bins the strip has, and the most electrons one pile ever holds (a full 2p or 3p row). */
export const BINS = 20;
export const STACK = 6;

/** The bin an energy (MJ/mol) lands in. The strip reads like a real spectrum: highest binding energy at the left. */
export function binOf(energy) {
  const f = (LOG_HI - Math.log10(energy)) / (LOG_HI - LOG_LO);
  return Math.max(0, Math.min(BINS - 1, Math.floor(f * BINS)));
}

/** The energy (MJ/mol) at the middle of bin `b`. */
export function binEnergy(b) {
  return Math.pow(10, LOG_HI - ((b + 0.5) / BINS) * (LOG_HI - LOG_LO));
}

/** The energies the light can be set to, MJ/mol. The top one is more than any peak of any specimen on the bench. */
export const ENERGY_STEPS = Object.freeze([0.4, 0.6, 0.8, 1.2, 2, 3, 5, 8, 12, 20, 30, 50, 80, 130, 200]);
export const TOP_STEP = ENERGY_STEPS.length;

/** The light's energy at dial setting `i` (1 to TOP_STEP). */
export const energyAt = i => ENERGY_STEPS[Math.max(1, Math.min(TOP_STEP, Math.round(i))) - 1];

/** The peaks of element `sym` that light of `energy` knocks loose: every row held with no more than it carries. */
export function freedBy(sym, energy) {
  return spectrumOf(sym).filter(p => p.energy <= energy + 1e-9);
}

/** The electrons knocked loose in all. */
export const electronsIn = peaks => peaks.reduce((n, p) => n + p.height, 0);

/** The energy of the most tightly held electron: how hard the atom holds on, in one number. */
export function holdOf(sym) {
  return Math.max(...spectrumOf(sym).map(p => p.energy));
}

/** The bins a list of peaks stand in, `{bin: height}`. Two peaks never share one on this bench (`verify:learn` holds every specimen to it). */
export function pilesOf(peaks) {
  const out = {};
  for (const p of peaks) out[binOf(p.energy)] = (out[binOf(p.energy)] || 0) + p.height;
  return out;
}

/* ------------------------------------------------------------------
   THE TABLE: who stands where
   ------------------------------------------------------------------ */

const live = p => p && !p.hidden;
const pieces = state => Object.values(state.pieces);
export const seatedIn = (state, slotId) => pieces(state).find(p => live(p) && p.zone === `slot:${slotId}`) || null;

/** The state of a chamber: what stands in its holder, the light's energy now, and what was last fired and at what energy. */
export function chamberRead(state, id) {
  const f = state.fixtures[id];
  const piece = seatedIn(state, f.props.slot);
  const energy = energyAt(f.dials.energy.value);
  const sources = f.props.sources || [];
  const shown = Math.round(f.dials.shown.value);
  const firedPiece = shown > 0 ? state.pieces[sources[shown - 1]] || null : null;
  const firedEnergy = energyAt(f.dials.at.value);
  const freedNow = piece && piece.props.sym ? freedBy(piece.props.sym, energy) : [];
  const freed = firedPiece ? freedBy(firedPiece.props.sym, firedEnergy) : [];
  return {
    id, fixture: f, piece, sym: piece?.props.sym || null, energy, step: Math.round(f.dials.energy.value),
    freedNow, electronsNow: electronsIn(freedNow),
    fired: Boolean(firedPiece), firedPiece, firedEnergy, freed, piles: pilesOf(freed), electrons: electronsIn(freed)
  };
}

/** What a card in the printout shows: the peaks of its element at the energy it was fired at. */
export function printOf(piece) {
  if (!piece?.props.printed) return null;
  return freedBy(piece.props.sym, energyAt(piece.props.printAt));
}

/* ------------------------------------------------------------------
   THE ATOM BUILT TO MATCH A SPECTRUM
   ------------------------------------------------------------------ */

/**
 * What a build fixture stands for: protons in the middle, electrons round them. Whole (neutral) atoms of the elements the bench
 * has measured have a spectrum, the planner's; anything else is an ion or an atom the bench has no spectrum for.
 */
export function buildRead(state, id) {
  const f = state.fixtures[id];
  const protons = Math.round(f.dials.protons.value);
  const electrons = Math.round(f.dials.electrons.value);
  const sym = protons > 0 ? symbolOf(protons) : null;
  const whole = protons > 0 && protons === electrons && Boolean(BINDING[sym]);
  return {
    id, protons, electrons, sym, whole, charge: protons - electrons,
    peaks: whole ? spectrumOf(sym) : [], shells: whole ? shellsOf(sym) : null
  };
}

/** Do two lists of peaks stand at the same energies with the same heights? */
export function sameSpectrum(a, b) {
  if (a.length !== b.length) return false;
  return a.every((p, i) => p.row === b[i].row && p.height === b[i].height && p.energy === b[i].energy);
}

/* ------------------------------------------------------------------
   THE CONFIGURATION WRITTEN
   ------------------------------------------------------------------ */

/** The rows a configuration writer offers, in the order an atom fills them. */
export const WRITER_ROWS = Object.freeze(['1s', '2s', '2p', '3s', '3p']);

/** The electrons the writer has put in each row. */
export function writtenRead(state, id) {
  const f = state.fixtures[id];
  const counts = {};
  for (const row of WRITER_ROWS) counts[row] = Math.round(f.dials[row].value);
  return { id, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

/** The ground-state configuration of element `sym` as the writer holds it: a count for every row it has, zero for the rest. */
export function writerTarget(sym) {
  const g = groundConfig(zOf(sym));
  const out = {};
  for (const row of WRITER_ROWS) out[row] = g[row] || 0;
  return out;
}

/** The marker (a dial the player sets to a number they read). */
export const markerRead = (state, id) => Math.round(state.fixtures[id].dials.value.value);

/* ------------------------------------------------------------------
   WHERE THINGS STAND ON A CHAMBER (table units; the drawn table and the built piles both read this)
   ------------------------------------------------------------------ */

/** The strip of a chamber fixture: where bin 0 starts, how wide a bin is, where the piles stand and how tall one electron is. */
export function stripOf(f) {
  const r = rectOf(f, SIZES.fixture);
  const left = f.props.stripLeft ?? 27;
  const pitch = (r.w - left - 1.5) / BINS;
  const step = f.props.dotStep ?? 2.2;
  const base = r.y0 + (f.props.baseAt ?? 27);
  return { box: r, x0: r.x0 + left, pitch, step, base, top: base - STACK * step, binX: b => r.x0 + left + (b + 0.5) * pitch };
}

/** Where a fixed set of energies are printed along the strip, with the bin edge each stands on. */
export const TICKS = Object.freeze([0.5, 1, 2, 5, 10, 20, 50, 100, 200]);
export const tickAt = (strip, e) => strip.x0 + ((LOG_HI - Math.log10(e)) / (LOG_HI - LOG_LO)) * BINS * strip.pitch;

/**
 * The electrons standing in the strip of every chamber on the table, as instanced piles (`table3d.js` `pilesOf`): one body for the
 * strip, a column of `STACK` slots under every bin, the first `n` of a column shown for the peak that lands there.
 */
export function chamberPiles(state) {
  const out = [];
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'pes') continue;
    const strip = stripOf(f);
    const read = chamberRead(state, f.id);
    const slots = [];
    const shown = [];
    for (let b = 0; b < BINS; b++) {
      for (let k = 0; k < STACK; k++) {
        slots.push({ x: strip.binX(b) - f.at.x, y: strip.base - (k + 0.5) * strip.step - f.at.y, h: 0 });
        shown.push(k < (read.piles[b] || 0));
      }
    }
    out.push({
      id: f.id, at: { x: f.at.x, y: f.at.y }, cap: slots.length, n: shown.filter(Boolean).length, slots, shown,
      r: Math.min(strip.step, strip.pitch) * 0.4, colour: '#78a142'
    });
  }
  return out;
}
