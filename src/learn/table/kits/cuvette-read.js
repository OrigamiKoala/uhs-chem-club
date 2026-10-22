/**
 * kits/cuvette-read.js — What the spectrometer of the cuvette kit reads.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. Every absorbance is `lightdata.js` `planAbsorb` (A = epsilon x b x c, computed with no shortcut: copper(II)
 * sulfate takes in near 630 nm and permanganate near 525 nm, as measured); the kind of light a wavelength is is `regionOf`; what a kind of light
 * does to a molecule is `planRegion`; the colour of a wavelength is `wavelengthRgb`. This file only reads what the table holds: the cuvette in
 * the beam (its drops, or a fixed strength), the wavelength and path the dials stand at, the markers set. A stage declares what stands on the
 * table and what to look for; it never declares what a reading is.
 */

import { planAbsorb, SOLUTES, regionOf, wavelengthRgb, planRegion, REGIONS, VISIBLE } from '../../engine/lightdata.js';

export { planAbsorb, SOLUTES, regionOf, wavelengthRgb, planRegion, REGIONS, VISIBLE };

/** One drop of stock solution makes this much (mol/L) in a cuvette, and a cuvette holds no more than `MAX_DROPS`. */
export const DROP = 0.002;
export const MAX_DROPS = 6;

/** The wavelengths the dial steps through on the way up to, and past, the peak at 630 nm. */
export const COPPER_SWEEP = Object.freeze([450, 500, 550, 600, 630, 680, 730]);
export const PATHS = Object.freeze([1, 2, 4]);

const live = p => p && !p.hidden;
export const seatedIn = (state, slotId) => (slotId ? Object.values(state.pieces).find(p => live(p) && p.zone === `slot:${slotId}`) || null : null);

const round6 = v => Math.round(v * 1e6) / 1e6;

/** The strength of a cuvette, mol/L: a fixed one (a sealed sample, lake water) or its drops. */
export function concOf(piece) {
  return piece.props.conc != null ? piece.props.conc : round6((piece.props.drops || 0) * DROP);
}

/** The kind of light a wavelength is, as the three the stage asks about. */
export function lightOf(nm) {
  const r = regionOf(nm);
  return r === 'infrared' ? 'infrared' : r === 'microwave' ? 'microwave' : 'uv';
}

/** What the light dial (1 to 3) is set to, and what it does to the molecule. */
export function regionRead(state, id) {
  const f = state.fixtures[id];
  const region = REGIONS[Math.round(f.dials.region.value) - 1];
  return { region, motion: planRegion(f.props.molecule || 'HCl', region).motion, detail: planRegion(f.props.molecule || 'HCl', region).detail };
}

/** What the spectrometer shows for the cuvette in its holder at the wavelength and path it is set to. */
export function spectroRead(state, id) {
  const f = state.fixtures[id];
  const piece = seatedIn(state, f.props.slot);
  const nm = f.props.tune ? COPPER_SWEEP[Math.round(f.dials.nm.value) - 1] : (f.props.nmFixed ?? 630);
  const path = f.props.pathDial ? PATHS[Math.round(f.dials.path.value) - 1] : (f.props.pathFixed ?? 1);
  if (!piece) return { piece: null, nm, path, A: null };
  const conc = concOf(piece);
  return { piece, nm, path, conc, A: planAbsorb(piece.props.solute || 'cuso4', nm, path, conc), solute: piece.props.solute || 'cuso4' };
}

/** The reading a cuvette gives at a wavelength and path, for a stage's `check` (no fixture needed). */
export const absorbOf = (piece, nm = 630, path = 1) => planAbsorb(piece.props.solute || 'cuso4', nm, path, concOf(piece));

/* ------------------------------------------------------------------
   COLOURS
   ------------------------------------------------------------------ */

/** The six colours a chip can name, with the wavelength at the middle of each. */
export const COLOURS = Object.freeze([
  { id: 'violet', label: 'Violet', from: 380, to: 450, nm: 415 },
  { id: 'blue', label: 'Blue', from: 450, to: 495, nm: 470 },
  { id: 'green', label: 'Green', from: 495, to: 570, nm: 530 },
  { id: 'yellow', label: 'Yellow', from: 570, to: 590, nm: 580 },
  { id: 'orange', label: 'Orange', from: 590, to: 650, nm: 620 },
  { id: 'red', label: 'Red', from: 650, to: 750, nm: 690 }
]);

/** The colour of a wavelength. */
export function colourOfNm(nm) {
  return COLOURS.find(c => nm >= c.from && nm < c.to) || COLOURS[COLOURS.length - 1];
}

/** The colour a solute takes out of white light: the one its absorption peaks in. */
export const missingColour = solute => colourOfNm(SOLUTES[solute].peak);

/** The share of white light that gets through `piece` at `nm` (1 cm). */
export const gotThrough = (solute, conc, nm) => Math.pow(10, -planAbsorb(solute, nm, 1, conc));

/** The chip standing in a slot, as its colour, or null. */
export function chipIn(state, slotId) {
  const p = seatedIn(state, slotId);
  return p && p.kind === 'chip' ? colourOfNm(p.props.nm) : null;
}

/* ------------------------------------------------------------------
   WAVELENGTHS PRINTED
   ------------------------------------------------------------------ */

/** A wavelength in the unit a person would say it in. */
export function fmtWave(nm) {
  if (nm >= 1e7) return `${Number((nm / 1e7).toPrecision(3))} cm`;
  if (nm >= 1e3) return `${Number((nm / 1e3).toPrecision(3))} µm`;
  return `${Number(nm.toPrecision(3))} nm`;
}

/** The marker (a dial the player sets to a number they read). */
export const markerRead = (state, id) => state.fixtures[id].dials.value.value;
