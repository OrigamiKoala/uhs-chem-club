/**
 * kits/cloud-read.js — What the cloud kit's plates, rings and films read.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. The probe's dots are `orbitals.js` `sampleOrbital` (the real hydrogen-like |psi|^2, seeded, so the
 * first fifty of five hundred are always the same fifty); the view a cloud is seen from is `cloudplate.js` `projectDots`; the ring
 * a wave fits is `orbitals.js` `ringFits`; the trade a sharper position makes is `cloudplate.js` `blurAt`. This file only COUNTS
 * what those planners return: how many dots a ring holds, how many a film catches, how many a slice leaves, whether a wave closes.
 * A stage declares what stands on the table and what to look for; it never declares what the table will read.
 */

import {
  sampleOrbital, ORBITALS, nodeRadii, shapeOf, ringFits, RING_CIRCUMFERENCE_PM, BOHR_PM
} from '../../engine/orbitals.js';
import { projectDots, blurAt, trackRefusal, DEFAULT_VIEW, TURN_STEP, SLICE_HALF, MAX_SHOTS } from '../../engine/cloudplate.js';

export {
  ORBITALS, shapeOf, ringFits, RING_CIRCUMFERENCE_PM, BOHR_PM, blurAt, trackRefusal, DEFAULT_VIEW, TURN_STEP, SLICE_HALF, MAX_SHOTS, projectDots
};

/** Shots a press of the probe takes, by the exposure dial's setting (1 to 3). */
export const SHOT_STEPS = Object.freeze([1, 50, 500]);

/** Half the thickness, in pm, of the shell a counting ring in `band` mode counts the dots of. */
export const BAND_PM = 10;

/* ------------------------------------------------------------------
   THE DOTS
   ------------------------------------------------------------------ */

const CACHE = new Map();

/** The five hundred positions a plate of orbital `orbital` and `seed` will ever show, in the order they are shot. */
export function pointsOf(orbital, seed = 1) {
  const key = `${orbital}:${seed}`;
  if (!CACHE.has(key)) CACHE.set(key, sampleOrbital(orbital, MAX_SHOTS, seed));
  return CACHE.get(key);
}

const seatedIn = (state, slotId) => Object.values(state.pieces).find(p => !p.hidden && p.zone === `slot:${slotId}`) || null;
export { seatedIn };

/** The axis (x, y or z) a p orbital's two lobes lie along, or null for any other orbital. */
export function axisOf(orbital) {
  const m = /^\d+p([xyz])$/.exec(orbital);
  return m ? m[1] : null;
}

/** The distance, in pm, of an orbital's first empty shell (its node), or null when it has none. */
export function nodePm(orbital) {
  const r = nodeRadii(orbital);
  return r.length ? r[0] * BOHR_PM : null;
}

/* ------------------------------------------------------------------
   THE VIEW — one for every cloud on the table, so two clouds are always compared from the same side
   ------------------------------------------------------------------ */

/** The view fixture's dials, as the angles the plate turns through. `turn` runs 0 to 11 (30 degrees a step), `tilt` -3 to 3. */
export function viewRead(state, viewId) {
  const f = state.fixtures[viewId];
  if (!f) return { yaw: DEFAULT_VIEW.yaw, pitch: DEFAULT_VIEW.pitch, slice: false, turn: 1, tilt: 1 };
  const turn = f.dials.turn.value;
  const tilt = f.dials.tilt.value;
  return { yaw: turn * TURN_STEP, pitch: tilt * TURN_STEP, slice: Boolean(f.dials.slice && f.dials.slice.value >= 1), turn, tilt };
}

/* ------------------------------------------------------------------
   A PLATE
   ------------------------------------------------------------------ */

/**
 * What a plate shows: the dots fired so far, projected the way the plate looks at them (a fixed plane, or the view it shares), and
 * the ones a slice keeps. `all` is every dot fired; `shown` is the ones on the plate.
 */
export function plateRead(state, id) {
  const f = state.fixtures[id];
  const orbital = f.props.orbital;
  const fired = Math.round(f.dials.fired?.value ?? 0);
  const points = pointsOf(orbital, f.props.seed ?? 1);
  const turning = Boolean(f.props.view);
  const view = turning ? viewRead(state, f.props.view) : { yaw: 0, pitch: 0, slice: Boolean(f.dials.slice && f.dials.slice.value >= 1), turn: 0, tilt: 0 };
  const plane = turning ? 'turn' : (f.props.plane || 'xy');
  const v = { yaw: view.yaw, pitch: view.pitch };
  const all = projectDots(points, fired, plane, false, v);
  const shown = view.slice ? projectDots(points, fired, plane, true, v) : all;
  return { id, fixture: f, orbital, fired, points, plane, view: v, turn: view.turn, tilt: view.tilt, slice: view.slice, all, shown, total: all.length };
}

/** The shots taken at a plate. */
export const shotsOf = (state, id) => Math.round(state.fixtures[id].dials.fired?.value ?? 0);

/**
 * The counting ring on a plate (the plate's `ring` dial, in pm from the nucleus). In `disc` mode it counts the dots that fall inside
 * the circle on the plate; in `band` mode it counts the dots whose real distance from the nucleus lies within `BAND_PM` of the ring,
 * the shell the ring is the cross-section of.
 */
export function ringRead(state, id) {
  const r = plateRead(state, id);
  const dial = r.fixture.dials.ring;
  if (!dial) return null;
  const rpm = dial.value;
  const mode = r.fixture.props.ring || 'disc';
  let count;
  if (mode === 'band') {
    count = r.points.slice(0, r.fired).filter(p => Math.abs(Math.hypot(p.x, p.y, p.z) * BOHR_PM - rpm) <= BAND_PM).length;
  } else {
    count = r.all.filter(p => Math.hypot(p.a, p.b) * BOHR_PM <= rpm).length;
  }
  return { mode, rpm, count, total: r.total, share: r.total ? count / r.total : 0, fired: r.fired };
}

/* ------------------------------------------------------------------
   FILMS — outlines of one area, laid over a plate
   ------------------------------------------------------------------ */

/** Every film has the area of a disc 70 pm across its radius, so the one that catches the most dots is where the dots are thickest. */
export const FILM_AREA_PM2 = Math.PI * 70 * 70;

const ringOuter = r0 => Math.sqrt(r0 * r0 + FILM_AREA_PM2 / Math.PI);

export const FILMS = Object.freeze({
  /** A filled round film. */
  disc: Object.freeze({ id: 'disc', r: 70 }),
  /** A thin ring, a long way out. */
  ring: Object.freeze({ id: 'ring', r0: 150, r1: ringOuter(150) }),
  /** Two round lobes either side of the middle. */
  lobes: Object.freeze({ id: 'lobes', r: Math.sqrt(FILM_AREA_PM2 / (2 * Math.PI)), d: 60 }),
  /** A round film with its middle cut out. */
  hollow: Object.freeze({ id: 'hollow', r0: 35, r1: ringOuter(35) })
});

/** Is the point (x, y), in pm from the nucleus, on film `shape`? */
export function filmHolds(shape, x, y) {
  const f = FILMS[shape];
  if (!f) return false;
  const d = Math.hypot(x, y);
  if (shape === 'disc') return d <= f.r;
  if (shape === 'lobes') return Math.hypot(x - f.d, y) <= f.r || Math.hypot(x + f.d, y) <= f.r;
  return d >= f.r0 && d <= f.r1;
}

/** The area of a film in pm squared, counted off a fine grid (the four are equal; `verify:table` holds them to it). */
export function filmArea(shape) {
  let n = 0;
  const step = 2;
  for (let x = -200; x < 200; x += step) for (let y = -200; y < 200; y += step) if (filmHolds(shape, x + step / 2, y + step / 2)) n++;
  return n * step * step;
}

/** The film laid on a plate (in the slot its `film` prop names), and the dots it catches. */
export function filmRead(state, id) {
  const r = plateRead(state, id);
  const slot = r.fixture.props.film;
  if (!slot) return null;
  const piece = seatedIn(state, slot);
  if (!piece) return { piece: null, shape: null, caught: 0, total: r.total, fired: r.fired };
  const shape = piece.props.shape;
  const caught = r.all.filter(p => filmHolds(shape, p.a * BOHR_PM, p.b * BOHR_PM)).length;
  return { piece, shape, caught, total: r.total, fired: r.fired };
}

/** The share of a plate's dots each film would catch, for the verifier and the stage's own grading. */
export function catchOf(state, id, shape) {
  const r = plateRead(state, id);
  return r.all.filter(p => filmHolds(shape, p.a * BOHR_PM, p.b * BOHR_PM)).length;
}

/* ------------------------------------------------------------------
   THE RING TRACK
   ------------------------------------------------------------------ */

/** The wave on the ring track: the tile in its slot, and whether a whole number of its wavelengths goes round. */
export function trackRead(state, id) {
  const f = state.fixtures[id];
  const piece = seatedIn(state, f.props.slot);
  if (!piece) return { piece: null, nm: null, fits: false, n: null, whole: null };
  const nm = piece.props.pm;
  const fit = ringFits(nm, RING_CIRCUMFERENCE_PM);
  return { piece, nm, n: fit.n, whole: fit.whole, fits: fit.fits };
}

/* ------------------------------------------------------------------
   THE BLUR GAUGE
   ------------------------------------------------------------------ */

/** The blur in position and in speed at the gauge's precision level. */
export function blurRead(state, id) {
  const f = state.fixtures[id];
  const level = f.dials.level.value;
  return { level, ...blurAt(level) };
}

/** What the Track Electron key says when it is pressed. */
export const trackReason = () => trackRefusal().reason;
