/**
 * kits/pot-read.js — What the pot kit's instruments read (Kettle). Pure: a reading is a planner's answer (`engine/reactdata.js`)
 * about whatever stands in the instrument's slots and whatever its dials say. Nothing here is authored.
 */

import { parseEquation, reactPlan, molarMass, gasVolume, pretty } from '../../engine/reactdata.js';
import { seatedIn, dialAt } from './heat-read.js';
export { seatedIn, dialAt };

/** How a species is shown: its name and the ink of its particles. */
export const SPECIES = Object.freeze({
  H2: { name: 'Hydrogen', ink: '#d8d2c4' }, O2: { name: 'Oxygen', ink: '#a0522d' }, H2O: { name: 'Water', ink: '#6f8fb0' },
  N2: { name: 'Nitrogen', ink: '#8aa0b8' }, NH3: { name: 'Ammonia', ink: '#b7c9a0' },
  Fe2O3: { name: 'Iron ore', ink: '#8a4a32' }, CO: { name: 'Carbon monoxide', ink: '#6b665c' }, Fe: { name: 'Iron', ink: '#9aa0a6' },
  CO2: { name: 'Carbon dioxide', ink: '#4a4640' }, CaCO3: { name: 'Limestone', ink: '#c8c0b0' }, CaO: { name: 'Quicklime', ink: '#e0d8c8' },
  NaCl: { name: 'Salt', ink: '#d8d2c4' }, AgNO3: { name: 'Silver nitrate', ink: '#b0b6bc' }, AgCl: { name: 'Silver chloride', ink: '#e8e4dc' },
  NaNO3: { name: 'Sodium nitrate', ink: '#cfc8b8' }, Al: { name: 'Aluminium', ink: '#b8bcc0' }, Al2O3: { name: 'Alumina', ink: '#e4dccb' }
});
export const nameOfSpecies = f => SPECIES[f]?.name || f;
export const inkOfSpecies = f => SPECIES[f]?.ink || '#b8afa0';

const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;
const EQ = new Map();
const equationOf = text => { if (!EQ.has(text)) EQ.set(text, parseEquation(text)); return EQ.get(text); };

/** Moles in a jar: its mass over the species' molar mass, or its moles. */
export function jarMoles(item) {
  const p = item.props;
  if (p.mol != null) return p.mol;
  if (p.grams != null && p.species) return (p.grams * (p.pure ?? 1)) / molarMass(p.species);
  return 0;
}

/** The label a reactor's run is filed under: the same set-up gives the same label, so "has this been run?" is a lookup. */
const sigOf = (fid, feeds) => `${fid}|${Object.entries(feeds).sort().map(([k, v]) => `${k}=${round(v, 6)}`).join(',')}`;

/**
 * The reactor: what is fed (jars in its seats, or its dial), what the balanced equation makes of it, whether the key has been
 * pressed for this set-up, and what the catch jar would hold.
 */
export function reactorRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const eq = equationOf(p.eq);
  const feeds = {};
  const fedJars = [];
  for (const slot of p.ins || []) {
    const jar = seatedIn(state, slot);
    if (jar && jar.props.species) { feeds[jar.props.species] = (feeds[jar.props.species] || 0) + jarMoles(jar); fedJars.push(jar); }
  }
  if (p.pour) {
    const v = p.pour.list[dialAt(state, fid, 'pour') - 1];
    feeds[p.pour.species] = p.pour.unit === 'g' ? v / molarMass(p.pour.species) : v;
  }
  const fed = Object.keys(feeds).length > 0;
  const plan = fed ? reactPlan(eq, feeds) : null;
  const yieldFrac = p.yieldFrac ?? 1;
  const outSpecies = p.outSpecies || null;
  const outMol = plan && outSpecies ? plan.made[outSpecies] * yieldFrac : 0;
  const outGrams = outSpecies ? round(outMol * molarMass(outSpecies), 4) : 0;
  const sig = sigOf(fid, feeds);
  const ran = fed && state.recorder.rows.some(r => r.label === sig);
  const gas = p.gas && plan ? { mol: plan.made[p.gas.species], L: round(gasVolume(plan.made[p.gas.species], p.gas.tC, p.gas.atm), 2) } : null;
  return { f, eq, feeds, fedJars, fed, plan, ran, outSpecies, outMol, outGrams, gas, sig, yieldFrac, outJar: p.out ? seatedIn(state, p.out) : null };
}

/** What a balance reads: the jar on its pan, and its mass (a jar that holds nothing yet weighs nothing: the jar itself is left out). */
export function weighRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  const grams = item ? round(item.props.grams ?? 0, f.props.digits ?? 1) : null;
  return { f, item, grams };
}

export { pretty };
