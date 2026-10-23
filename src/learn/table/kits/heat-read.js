/**
 * kits/heat-read.js — What the heat kit's cup, blocks, shelves, ledger, stack and plot read.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. Every figure is `thermodata.js` asked about what the table holds: `equilibriumTemp` for blocks that touch
 * and for a hot block dropped in a bath, `heatTransfer` for the heat a bath catches, `bondEnthalpySum` for a ledger, `hessStackEnthalpy`
 * for a stack of cards, `microstateWays` for the cells, `gibbsFreeEnergy` and `crossingTemperature` for the plot, `entropyOfHeating`
 * for a warmed sample. This file only reads what the table holds: the settings of the dials (indexes into the stage's own lists), the
 * pieces seated in a slot, the chips lying in a tray, the cards in the stack's tray. A stage declares what stands on the table and what
 * to look for; it never declares what a reading is.
 *
 * `thermodata.js` and its planners are the single implementation of every heat figure (the drawn calorimeter, the Crucible's foe model
 * and the quests all ask it); nothing here is a second one.
 */

import {
  SPECIFIC_HEAT_WATER, SPECIFIC_HEATS, BOND_ENTHALPIES, FORMATION_TABLE, FUELS, heatTransfer, equilibriumTemp, blockSpecificHeat,
  molarEnthalpyFromCup, bondEnthalpySum, hessStackEnthalpy, standardReactionChange, microstateWays, gibbsFreeEnergy, crossingTemperature,
  entropyOfHeating
} from '../../engine/thermodata.js';
import { clusterOf } from '../snap.js';

export {
  SPECIFIC_HEAT_WATER, SPECIFIC_HEATS, BOND_ENTHALPIES, FORMATION_TABLE, FUELS, heatTransfer, equilibriumTemp, blockSpecificHeat,
  molarEnthalpyFromCup, bondEnthalpySum, hessStackEnthalpy, standardReactionChange, microstateWays, gibbsFreeEnergy, crossingTemperature,
  entropyOfHeating
};

const live = p => p && !p.hidden;
export const seatedIn = (state, slotId) => (slotId ? Object.values(state.pieces).find(p => live(p) && p.zone === `slot:${slotId}`) || null : null);
export const whereIs = (state, id) => (state.pieces[id]?.zone || '').replace(/^(tray|slot|container):/, '');
export const piecesInTray = (state, trayId) => Object.values(state.pieces).filter(p => live(p) && p.zone === `tray:${trayId}`);

/** The marker (a dial the player sets to a number they have read, or to a named detent). */
export const markerRead = (state, id) => state.fixtures[id].dials.value.value;
/** Which of a dial's positions it stands at, counted from 1. */
export const dialAt = (state, fid, name) => Math.round(state.fixtures[fid].dials[name].value);

/** Significant figures, as a number. */
export const sig = (x, n = 3) => (x === 0 ? 0 : Number(Number(x).toPrecision(n)));
/** A number printed with one decimal, signed when asked. */
export const fixed = (x, d = 1, signed = false) => {
  const s = Math.abs(x) < 0.5 * 10 ** -d ? (0).toFixed(d) : Number(x).toFixed(d);
  return signed && Number(s) > 0 ? `+${s}` : s.replace('-', '−');
};
/** A signed whole or one-decimal figure the way a reaction's ΔH is printed. */
export const signedKJ = x => {
  const r = Math.round(x * 10) / 10;
  const s = Number.isInteger(r) ? String(r) : r.toFixed(1);
  return (r > 0 ? `+${s}` : s).replace('-', '−');
};

/* ------------------------------------------------------------------
   BLOCKS THAT TOUCH
   ------------------------------------------------------------------ */

/**
 * A block (or a bath, which is one more body with a mass and a specific heat) and what it reads. Bodies joined to it settle on one
 * temperature, the heat-capacity-weighted mean of them all. Pulled apart, each is as it began: a split undoes a join.
 */
export function blockRead(state, id) {
  const p = state.pieces[id];
  const group = clusterOf(state, id).map(i => state.pieces[i]).filter(q => q && q.kind === 'block');
  let cap = 0;
  let heat = 0;
  for (const q of group) { const C = q.props.m * q.props.c; cap += C; heat += C * q.props.T; }
  const joined = group.length > 1;
  const T = joined ? heat / cap : p.props.T;
  return { T, T0: p.props.T, m: p.props.m, c: p.props.c, joined, cluster: group.map(q => q.id), mates: group.map(q => q.id).filter(x => x !== id) };
}

/* ------------------------------------------------------------------
   THE CUP
   ------------------------------------------------------------------ */

/**
 * A lagged cup of water with a thermometer: what the bath reads with whatever is in its slot and whatever its dials say. A hot block
 * dropped in settles with the bath (`equilibriumTemp`); a charge of chemicals gives its heat to the bath or takes it (`-ΔH · n`); the
 * heater dial puts joules in. The lid off lets some of the heat out (`LID_LOSS`).
 */
export const LID_LOSS = 0.72;

export function cupRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const d = f.dials;
  const mWater = d.water ? p.waters[Math.round(d.water.value) - 1] : (p.water ?? 100);
  const c = p.c ?? SPECIFIC_HEAT_WATER;
  const T0 = p.T0 ?? 22;
  const lidOff = d.lid ? Math.round(d.lid.value) === 2 : Boolean(p.lidOff);
  const loss = lidOff ? LID_LOSS : 1;
  const joules = d.heat ? p.joulesList[Math.round(d.heat.value) - 1] : (p.joules ?? 0);
  const item = seatedIn(state, p.slot);
  const moles = item && item.kind === 'charge' ? (d.moles ? p.molesList[Math.round(d.moles.value) - 1] : item.props.moles) : 0;
  let q = joules * loss;
  let Tf;
  if (item && item.kind === 'block') {
    Tf = equilibriumTemp(mWater, c, T0, item.props.m, item.props.c, item.props.T);
    q = heatTransfer(mWater, c, Tf - T0);
  } else {
    if (item && item.kind === 'charge') q += -item.props.dH * moles * 1000 * loss;
    Tf = T0 + q / (mWater * c);
  }
  return { mWater, c, T0, Tf, dT: Tf - T0, q, joules, item, moles, lidOff, loss };
}

/* ------------------------------------------------------------------
   THE ENERGY SHELVES
   ------------------------------------------------------------------ */

/** The change a pair of shelves draws: the stage's own ΔH, or the one the player has built with the shelf dial, turned round if reversed. */
export function shelvesRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const d = f.dials;
  const dH = d.after ? p.afterList[Math.round(d.after.value) - 1] : (p.dH ?? 0);
  const rev = d.dir ? Math.round(d.dir.value) === 2 : Boolean(p.reverse);
  const signed = rev ? -dH : dH;
  return { dH: signed, up: signed > 0, down: signed < 0, rev, from: rev ? p.productsLabel : p.reactantsLabel, to: rev ? p.reactantsLabel : p.productsLabel, built: Boolean(d.after) };
}

/** The shelf card a piece carries: its own ΔH and labels. */
export const shelfCardRead = p => ({ dH: p.props.dH, up: p.props.dH > 0, down: p.props.dH < 0 });

/* ------------------------------------------------------------------
   THE WELL (a bond pulled apart or let fall)
   ------------------------------------------------------------------ */

/** How much of a bond's well has been climbed at each of the crank's seven settings. */
export const WELL = Object.freeze([0, 0.1, 0.38, 0.72, 0.9, 0.98, 1]);

export function wellRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const k = Math.round(f.dials.pull.value) - 1;
  const D = p.D ?? BOND_ENTHALPIES[p.which].dH;
  // Let fall: the dial runs from the free atoms (1) toward the bond (7), so the climb that is left is the well at the far end.
  const frac = p.forming ? WELL[WELL.length - 1 - k] : WELL[k];
  const free = frac >= 1;
  return { D, frac, E: D * frac, free, bound: frac <= 0, step: k + 1, forming: Boolean(p.forming), released: p.forming ? D * (1 - frac) : 0 };
}

/* ------------------------------------------------------------------
   THE LEDGER
   ------------------------------------------------------------------ */

export function ledgerRead(state, fid) {
  const p = state.fixtures[fid].props;
  const sum = list => list.reduce((a, c) => a + (c.props.dH ?? 0) * (c.props.count || 1), 0);
  const brokenChips = piecesInTray(state, p.broken);
  const formedChips = piecesInTray(state, p.formed);
  const broken = sum(brokenChips);
  const formed = sum(formedChips);
  return { broken, formed, net: broken - formed, brokenChips, formedChips, nBroken: brokenChips.reduce((a, c) => a + (c.props.count || 1), 0), nFormed: formedChips.reduce((a, c) => a + (c.props.count || 1), 0) };
}

/* ------------------------------------------------------------------
   THE STACK OF STEPS
   ------------------------------------------------------------------ */

/** A card as it stands: turned round if flipped, scaled by its multiplier. */
export function cardTerms(card) {
  const sc = card.props.scale || 1;
  const flipped = Boolean(card.props.flipped);
  const L = flipped ? card.props.rhs : card.props.lhs;
  const R = flipped ? card.props.lhs : card.props.rhs;
  return {
    lhs: L.map(([n, s]) => [n * sc, s]),
    rhs: R.map(([n, s]) => [n * sc, s]),
    dH: (flipped ? -1 : 1) * sc * card.props.dH,
    flipped,
    scale: sc
  };
}

const SUB = { '½': 0.5 };
export function fmtCoef(n) {
  if (Math.abs(n - 1) < 1e-9) return '';
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  if (Math.abs(frac) < 1e-9) return `${whole} `;
  if (Math.abs(frac - 0.5) < 1e-9) return whole ? `${whole}½ ` : '½';
  return `${Number(n.toFixed(2))} `;
}
export const fmtSide = terms => terms.map(([n, s]) => `${fmtCoef(n)}${s}`).join(' + ');
export const fmtEqn = ({ lhs, rhs }) => `${fmtSide(lhs)} → ${fmtSide(rhs)}`;
void SUB;

/** The stack's net: every substance the cards make, less every one they use, with what cancels gone. */
export function stackRead(state, fid) {
  const p = state.fixtures[fid].props;
  const cards = piecesInTray(state, p.tray);
  const net = {};
  for (const c of cards) {
    const t = cardTerms(c);
    for (const [n, s] of t.rhs) net[s] = (net[s] || 0) + n;
    for (const [n, s] of t.lhs) net[s] = (net[s] || 0) - n;
  }
  for (const s of Object.keys(net)) if (Math.abs(net[s]) < 1e-9) delete net[s];
  const dH = hessStackEnthalpy(cards.map(c => ({ dH: c.props.dH, flip: Boolean(c.props.flipped), mult: c.props.scale || 1 })));
  const target = p.target || null;
  const keys = new Set([...Object.keys(net), ...Object.keys(target || {})]);
  const matches = Boolean(target) && cards.length > 0 && [...keys].every(k => Math.abs((net[k] || 0) - (target[k] || 0)) < 1e-9);
  const lhs = Object.entries(net).filter(([, n]) => n < 0).map(([s, n]) => [-n, s]);
  const rhs = Object.entries(net).filter(([, n]) => n > 0).map(([s, n]) => [n, s]);
  return { cards, net, dH, matches, lhs, rhs, empty: cards.length === 0 };
}

/** A target equation `lhs` / `rhs` as the map a stack's net is compared with. */
export function targetMap(lhs, rhs) {
  const m = {};
  for (const [n, s] of rhs) m[s] = (m[s] || 0) + n;
  for (const [n, s] of lhs) m[s] = (m[s] || 0) - n;
  return m;
}

/* ------------------------------------------------------------------
   THE CELLS (microstates)
   ------------------------------------------------------------------ */

/** The same pseudo-random sequence for a name: a shake is the same shake every time. */
export function seededRng(name) {
  let a = 2166136261 >>> 0;
  for (const ch of String(name)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The cells a box has open: all of them when its gate is open, else the left `leftCells`. */
export function cellsOpen(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const open = f.dials.gate ? Math.round(f.dials.gate.value) === 2 : true;
  return { open, count: open ? p.cells : p.leftCells };
}

/** Which cells hold a particle, as indexes counted from 1, left to right. */
export function occupiedCells(state, fid) {
  const f = state.fixtures[fid];
  const out = [];
  for (let i = 1; i <= f.props.cells; i++) if (seatedIn(state, `${fid}.c${i}`)) out.push(i);
  return out;
}

/** The arrangements the board has logged: the distinct pictures its Log key has been pressed on. */
export function loggedArrangements(state, fid) {
  const seen = new Set();
  for (const r of state.recorder.rows) if (r.label && String(r.label).startsWith(`${fid}:`)) seen.add(r.label);
  return seen.size;
}

/** How many arrangements `particles` identical particles can make across `cells` cells. */
export const waysOf = (cells, particles) => microstateWays(cells, particles, false);

/** One shake of a chamber: `n` distinct cells of `cells`, chosen by the shake's own number. */
export function shakeCells(fid, k, cells, n) {
  const rnd = seededRng(`${fid}|${k}`);
  const pool = Array.from({ length: cells }, (_, i) => i + 1);
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out.sort((a, b) => a - b);
}

/** The shakes a chamber has made so far, each as the cells it put the particles in. */
export function shakesOf(state, fid) {
  const f = state.fixtures[fid];
  return state.recorder.rows.filter(r => String(r.label).startsWith(`${fid}:`)).map((r, k) => shakeCells(fid, k, f.props.cells, f.props.particles));
}

/* ------------------------------------------------------------------
   THE PLOT (free energy against temperature)
   ------------------------------------------------------------------ */

export function plotRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const T = p.Ts[Math.round(f.dials.temp.value) - 1];
  return plotAtT(p, T);
}

export function plotAtT(p, T) {
  const dG = gibbsFreeEnergy(p.dH, p.dS, T);
  return { T, dH: p.dH, dS: p.dS, TdS: (T * p.dS) / 1000, dG, cross: crossingTemperature(p.dH, p.dS), spontaneous: dG < 0 };
}

/** What a plot WOULD read with its temperature dial at another setting (counted from 1). */
export function plotAt(state, fid, setting) {
  return plotAtT(state.fixtures[fid].props, state.fixtures[fid].props.Ts[setting - 1]);
}

/* ------------------------------------------------------------------
   A SAMPLE WARMED WITHOUT CHANGING PHASE
   ------------------------------------------------------------------ */

export function warmRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const k = Math.round(f.dials.temp.value) - 1;
  const T = p.Ts[k];
  const dS = entropyOfHeating(p.m, p.c, p.Ts[0], T);
  return { T, T0: p.Ts[0], dS, m: p.m, c: p.c, step: k + 1 };
}

/** The entropy a warm sample would have gained at another setting (counted from 1). */
export function warmAt(state, fid, setting) {
  const f = state.fixtures[fid];
  const p = f.props;
  const T = p.Ts[setting - 1];
  return { T, dS: entropyOfHeating(p.m, p.c, p.Ts[0], T) };
}
