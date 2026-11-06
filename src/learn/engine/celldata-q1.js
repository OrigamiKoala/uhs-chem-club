/**
 * THE HALF-REACTION BENCH PLANNERS — Brinewire `q1-halves` (Unit 10, 4.9 redox)
 *
 * Pure functions, no DOM. Built on `celldata.js` (`SPECIES`, `oxNumber`, `oxStates`, `ledgerRows`, `balanceAcidHalf`, `matchElectrons`);
 * nothing in `celldata.js` is edited. Every number the redox beaker, the number probe, the half-reaction ledger and the tally print is
 * computed here, so a stage never types a reading.
 *
 * SIMPLIFICATIONS (said on the bench where they matter): a beaker window shows a few dozen particles, not a mole; oxidation numbers follow
 * the usual rules (oxygen -2, hydrogen +1, alkali metals +1, chlorine -1 away from oxygen, an element on its own 0).
 */

import { SPECIES, oxNumber, oxStates, ledgerRows, balanceAcidHalf, matchElectrons } from './celldata.js';

export { ledgerRows, balanceAcidHalf, matchElectrons, SPECIES };

/** An oxidation number as the probe prints it: a plus sign, a true minus, a plain zero. */
export const oxText = n => (n === 0 ? '0' : n > 0 ? `+${n}` : `−${-n}`);

/* ------------------------------------------------------------------ the cards the number probe reads (stages 1 and 5) */

/**
 * A card stands for ONE kind of atom followed through a beaker: the species it is in the first window (`before`) and in the second
 * (`after`). The probe reads the number of `el` in each. `beaker` is the stage 5 beaker (1 or 2) whose windows the card belongs to.
 */
export const CARDS = Object.freeze({
  zinc:   { id: 'zinc',   label: 'Zinc',                        short: 'Zinc',   el: 'Zn', before: 'Zn',   after: 'Zn2+' },
  copper: { id: 'copper', label: 'Copper',                      short: 'Copper', el: 'Cu', before: 'Cu2+', after: 'Cu' },
  sulfur: { id: 'sulfur', label: 'Sulfur in the sulfate ions',  short: 'Sulfur', el: 'S',  before: 'SO4',  after: 'SO4' },
  oxygen: { id: 'oxygen', label: 'Oxygen in the sulfate ions',  short: 'Oxygen', el: 'O',  before: 'SO4',  after: 'SO4' },
  // stage 5
  cu:     { id: 'cu',     label: 'Cu',   short: 'Cu',   el: 'Cu', before: 'Cu',   after: 'Cu2+', beaker: 1 },
  ag:     { id: 'ag',     label: 'Ag⁺', short: 'Ag⁺', el: 'Ag', before: 'Ag+',  after: 'Ag',   beaker: 1 },
  mg:     { id: 'mg',     label: 'Mg',   short: 'Mg',   el: 'Mg', before: 'Mg',   after: 'Mg2+', beaker: 2 },
  fe:     { id: 'fe',     label: 'Fe²⁺', short: 'Fe²⁺', el: 'Fe', before: 'Fe2+', after: 'Fe',   beaker: 2 }
});

/** What the probe reads on a card: the element and its number in each window. */
export function cardReading(id) {
  const c = CARDS[id];
  return { el: c.el, before: oxNumber(c.before, c.el), after: oxNumber(c.after, c.el) };
}

/** Does the number on this card differ between the windows? */
export const cardChanged = id => { const r = cardReading(id); return r.before !== r.after; };

/** Does the atom on this card give up electrons (its number rises)? */
export const cardGives = id => { const r = cardReading(id); return r.after > r.before; };

/* ------------------------------------------------------------------ whole reactions (stage 8) and their windows (stages 1 and 5) */

/**
 * The states an element is in on one side of a reaction: the sorted distinct oxidation numbers of that element across the species on the
 * side. The four reactions here hold one state per element per side, which `reactionStates` asserts.
 */
function statesOn(side, el) {
  const out = new Set();
  for (const id of side) {
    const sp = SPECIES[id];
    if (sp.comp[el] != null) out.add(oxStates(sp)[el]);
  }
  return [...out].sort((a, b) => a - b);
}

/** The four sealed reactions of stage 8 (species lists use `celldata.js` ids). */
export const SORT = Object.freeze({
  a: { id: 'a', label: 'Reaction A', text: 'Zn + CuSO₄',   left: ['Zn', 'Cu2+', 'SO4'], right: ['Zn2+', 'Cu', 'SO4'] },
  b: { id: 'b', label: 'Reaction B', text: 'AgNO₃ + NaCl', left: ['AgNO3', 'NaCl'],     right: ['AgCl', 'NaNO3'] },
  c: { id: 'c', label: 'Reaction C', text: 'Mg + HCl',          left: ['Mg', 'HCl'],         right: ['MgCl2', 'H2'] },
  d: { id: 'd', label: 'Reaction D', text: 'NaOH + HCl',        left: ['NaOH', 'HCl'],       right: ['NaCl', 'H2O'] }
});

/** Per element of a reaction: its number before and after. Throws if an element holds two states on one side. */
export function reactionStates(id) {
  const rx = SORT[id];
  const els = [];
  for (const sp of [...rx.left, ...rx.right]) for (const el of Object.keys(SPECIES[sp].comp)) if (!els.includes(el)) els.push(el);
  return els.map(el => {
    const b = statesOn(rx.left, el); const a = statesOn(rx.right, el);
    if (b.length !== 1 || a.length !== 1) throw new Error(`reactionStates: ${el} holds more than one state in ${id}`);
    return { el, before: b[0], after: a[0] };
  });
}

/** A reaction is redox when some element's number is different after. */
export const isRedox = id => reactionStates(id).some(r => r.before !== r.after);

/** The elements whose number moves, in order. */
export const movers = id => reactionStates(id).filter(r => r.before !== r.after);

/**
 * The window pair of a metal strip dipped in a solution of another metal's ions (stages 1 and 5): atoms and ions counted from the electrons.
 * `a` strip atoms each give `nM` electrons, `b` ions each take `nI`, with `matchElectrons` (a nM = b nI); the reaction is drawn `scale` times.
 */
export const WINDOWS = Object.freeze({
  zncu: { id: 'zncu', title: 'zinc in copper(II) sulfate', strip: 'Zn', stripIon: 'Zn2+', ion: 'Cu2+', coat: 'Cu', spectator: 'SO4', strip0: 8, ion0: 4, scale: 2 },
  cuag: { id: 'cuag', title: 'copper in silver nitrate',   strip: 'Cu', stripIon: 'Cu2+', ion: 'Ag+',  coat: 'Ag', spectator: 'NO3', strip0: 8, ion0: 6, scale: 2 },
  mgfe: { id: 'mgfe', title: 'magnesium in iron(II) sulfate', strip: 'Mg', stripIon: 'Mg2+', ion: 'Fe2+', coat: 'Fe', spectator: 'SO4', strip0: 8, ion0: 4, scale: 2 }
});

export function windowOf(id) {
  const w = WINDOWS[id];
  const nM = SPECIES[w.stripIon].charge; const nI = SPECIES[w.ion].charge; const nS = -SPECIES[w.spectator].charge;
  const m = matchElectrons(nM, nI);
  const A = m.a * w.scale; const B = m.b * w.scale;
  const spec = (w.ion0 * nI) / nS;
  return {
    ...w, A, B, spec,
    before: { strip: w.strip0, coat: 0, stripIons: 0, ions: w.ion0, spectators: spec },
    after:  { strip: w.strip0 - A, coat: B, stripIons: A, ions: w.ion0 - B, spectators: spec }
  };
}

/** The charge of the dissolved cations and anions of a window side (equal and opposite, always). */
export function windowCharge(id, side) {
  const w = windowOf(id); const s = w[side];
  const plus = s.stripIons * SPECIES[w.stripIon].charge + s.ions * SPECIES[w.ion].charge;
  const minus = s.spectators * -SPECIES[w.spectator].charge;
  return { plus, minus };
}

/* ------------------------------------------------------------------ halves (stages 3, 4, 6, 7) */

/** A half as the ledger holds it, from the main species, balanced in acid by the planner. */
export const targetHalf = (left, right) => balanceAcidHalf(left, right);

export const HALF = Object.freeze({
  zn:  () => targetHalf({ Zn: 1 }, { 'Zn2+': 1 }),
  cu:  () => targetHalf({ 'Cu2+': 1 }, { Cu: 1 }),
  al:  () => targetHalf({ Al: 1 }, { 'Al3+': 1 }),
  mn:  () => targetHalf({ MnO4: 1 }, { 'Mn2+': 1 }),
  fe:  () => targetHalf({ 'Fe2+': 1 }, { 'Fe3+': 1 })
});

/** A half with its electrons taken off: the species a student starts from. */
export const bare = h => ({ left: { ...h.left }, right: { ...h.right }, eLeft: 0, eRight: 0 });

/** A half scaled by a whole number. */
export function scaleHalf(h, k) {
  const sc = o => Object.fromEntries(Object.entries(o).map(([id, n]) => [id, n * k]));
  return { left: sc(h.left), right: sc(h.right), eLeft: (h.eLeft || 0) * k, eRight: (h.eRight || 0) * k };
}

/** Electrons a half gives (on its right) and takes (on its left). */
export const given = h => h.eRight || 0;
export const taken = h => h.eLeft || 0;

/** The electrons two scaled halves give and take between them. */
export function tally(parts) {
  let g = 0; let t = 0;
  for (const { half, k } of parts) { g += given(half) * k; t += taken(half) * k; }
  return { given: g, taken: t };
}

/** The lowest whole multipliers that make two halves carry the same electrons (their electrons need not be on opposite sides here). */
export function matchedHalves(a, b) {
  const nA = given(a) + taken(a); const nB = given(b) + taken(b);
  return matchElectrons(nA, nB);
}

const sub = (to, id, n) => { to[id] = (to[id] || 0) + n; };

/**
 * The overall equation of two halves, one that gives electrons and one that takes them, each scaled: electrons removed, a species on both
 * sides cancelled. Returns `{ left, right }` as `{id: n}` in the order species first appear, and `charge` on each side.
 */
export function overall(giver, kg, taker, kt) {
  const g = scaleHalf(giver, kg); const t = scaleHalf(taker, kt);
  if (given(g) !== taken(t)) throw new Error('overall: electrons are not equal');
  const left = {}; const right = {};
  for (const [id, n] of Object.entries(t.left)) sub(left, id, n);
  for (const [id, n] of Object.entries(g.left)) sub(left, id, n);
  for (const [id, n] of Object.entries(t.right)) sub(right, id, n);
  for (const [id, n] of Object.entries(g.right)) sub(right, id, n);
  for (const id of Object.keys(left)) {
    if (right[id] == null) continue;
    const m = Math.min(left[id], right[id]);
    left[id] -= m; right[id] -= m;
  }
  for (const o of [left, right]) for (const id of Object.keys(o)) if (o[id] === 0) delete o[id];
  const q = o => Object.entries(o).reduce((s, [id, n]) => s + SPECIES[id].charge * n, 0);
  return { left, right, charge: { left: q(left), right: q(right) } };
}

/** `2 Al + 3 Cu²⁺` as text. */
export function sideText(o, eCount = 0) {
  const parts = Object.entries(o).filter(([, n]) => n > 0).map(([id, n]) => `${n > 1 ? `${n} ` : ''}${SPECIES[id].text}`);
  if (eCount > 0) parts.push(`${eCount > 1 ? `${eCount} ` : ''}e⁻`);
  return parts.join(' + ');
}

/** A whole equation as text. */
export const equationText = (left, right, eL = 0, eR = 0) => `${sideText(left, eL)} → ${sideText(right, eR)}`;

/* ------------------------------------------------------------------ the ledger's rows from a built half */

/** The rows of a built half in a fixed order; a row for a label the half does not have reads 0 and 0. */
export function rowsFor(half, labels) {
  const rows = ledgerRows(half);
  return labels.map(l => rows.find(r => r.label === l) || { label: l, left: 0, right: 0, balanced: true });
}

/** The first row of `labels` that does not balance, or null. */
export const firstOff = (half, labels) => rowsFor(half, labels).find(r => !r.balanced) || null;
