/**
 * kits/heat.js — The heat kit: blocks that touch, a lagged cup, energy shelves, a bond pulled out of its well, a ledger of bonds, a
 * stack of equation cards, cells for particles, and a plot of free energy against temperature.
 *
 * EMBER REACH'S SEVEN BENCHES, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T6): the calorimeter stops being a screen that is read
 * and becomes a table. BLOCKS dragged onto one another touch and settle on one temperature; a CHARGE of chemicals, a hot BLOCK or the
 * heater dial put into the CUP warm or cool its bath; a shelf dial BUILDS an energy diagram; a crank PULLS a bond out of its well;
 * bond CHIPS are sorted into Broken and Formed and the LEDGER sums them; equation CARDS are turned, scaled and stacked until what they
 * leave is the reaction wanted; PARTICLES are put in CELLS and each arrangement is logged; a plot shows ΔG(T) and a dial walks along it.
 *
 * A THIN WRAPPER over `thermodata.js` (`equilibriumTemp`, `heatTransfer`, `bondEnthalpySum`, `hessStackEnthalpy`, `microstateWays`,
 * `gibbsFreeEnergy`, `crossingTemperature`, `entropyOfHeating`), the planners the old calorimeter drew from, and it authors nothing:
 * the temperature a bath reaches, the net of a ledger, the equation a stack adds up to, the temperature where ΔG is zero are the
 * planners' answers, shown as the picture. A stage declares what stands on the table and what to look for; it never declares what the
 * table will read.
 *
 * Only blocks join (`planJoin`); every other piece goes in a slot, a tray or on the rail, and the fixture that owns a place reads
 * whatever stands in it (`heat-read.js`).
 */

import { registerKit } from './registry.js';
import { paintPiece, paintFixture, faceKey, RECTS, contentTop, wrap, wrapN } from './heat-draw.js';
import { buildIngot, buildTin, buildCupWall, buildThermometer } from '../../engine/heat-props.js';
import { buildBathDress, buildPairDress, buildBondChip, buildPhaseCard, buildCellsDress, buildChamberDress, buildParticle } from '../../engine/heat-solids.js';
import { cupRead, wellRead, plotRead, warmRead, cellsOpen, occupiedCells, loggedArrangements, shakesOf, shakeCells, targetMap, BOND_ENTHALPIES, cardTerms, fmtEqn, seatedIn } from './heat-read.js';
import './heat-tour.js';

export const HEAT_KIT_ID = 'heat';
export const HEAT_BOUNDS = Object.freeze({ w: 150, h: 64 });
/** Where the paper strip parks on a table that never prints on it. */
export const HEAT_RECORDER = Object.freeze({ at: { x: 147.4, y: 61.6 }, size: { w: 5, h: 3.4 } });

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fid) {
  const f = state.fixtures[fid];
  if (!f || f.noRun) return null;
  if (f.kind === 'cup') {
    const r = cupRead(state, fid);
    if (!r.item && !r.joules) return { noop: 'Put something in the cup, or turn the heater up, first.' };
    return { x: Math.round(r.dT * 100) / 100, y: Math.round(r.Tf * 100) / 100, label: r.item?.label || 'heater' };
  }
  if (f.kind === 'well') {
    const r = wellRead(state, fid);
    return { x: r.step, y: Math.round(r.forming ? r.D : r.E), label: fid, dials: { [fid]: { pull: 7 } } };
  }
  if (f.kind === 'cells') {
    const g = cellsOpen(state, fid);
    const occ = occupiedCells(state, fid);
    if (occ.length !== f.props.particles) return { noop: `Put all ${f.props.particles} particles in cells first.` };
    if (occ.some(i => i > g.count)) return { noop: 'A particle is behind the shut gate.' };
    const n = loggedArrangements(state, fid);
    const label = `${fid}:${occ.join(',')}`;
    const fresh = !state.recorder.rows.some(r => r.label === label);
    return { x: state.recorder.rows.length + 1, y: n + (fresh ? 1 : 0), label };
  }
  if (f.kind === 'chamber') {
    const k = shakesOf(state, fid).length;
    const cells = shakeCells(fid, k, f.props.cells, f.props.particles);
    return { x: k + 1, y: cells.filter(c => c <= f.props.cells / 2).length, label: `${fid}:${k}` };
  }
  if (f.kind === 'plot') {
    const r = plotRead(state, fid);
    return { x: r.T, y: Math.round(r.dG * 100) / 100, label: 'ΔG' };
  }
  if (f.kind === 'warm') {
    const r = warmRead(state, fid);
    return { x: r.T, y: Math.round(r.dS * 100) / 100, label: 'ΔS' };
  }
  return null;
}

const rect = (r, kind, extra = {}) => ({ r, rect: RECTS[kind], nojoin: true, ...extra });

/** Two blocks that touch hold; nothing else on this table joins. */
function planJoin(a, b) {
  if (a.kind === 'block' && b.kind === 'block') return { holds: true, link: { type: 'contact' }, reason: 'The blocks touch.' };
  return { holds: false, home: true, reason: 'Nothing here joins: put a piece in a place.' };
}

/**
 * A block of metal is an ingot; a charge of chemicals is a tin; a bond chip carries its two atoms as solids; a phase card is a glass box of
 * twelve particles; a particle is a bead. The other cards are cards.
 */
function piece3d(p, state, c) {
  if (p.kind === 'block') return buildIngot(c);
  if (p.kind === 'charge') return buildTin(c);
  if (p.kind === 'bond') return buildBondChip(c, p.props.which);
  if (p.kind === 'phase') return buildPhaseCard(c, p);
  if (p.kind === 'ptc') return buildParticle(c);
  return null;
}

const clamp01 = v => Math.max(0, Math.min(1, v));

/**
 * Solid parts over an instrument's picture, each following the same reading the picture prints:
 *   a cup: a lagged wall round the bath, the bath itself (tinted by which way it moved, as deep as its mass) and a glass thermometer whose
 *     fluid stands as high as the reading;
 *   a well: the two atoms, as far apart as the crank has pulled them, and the rod between them thinning as the bond goes;
 *   cells: a low wall round each cell and the gate across the row; a chamber: its walls and the beads of the last shake.
 */
function dress3d(f, state, c) {
  const { scale: s, toPlate, box } = c;
  const nd = Object.keys(f.dials).length;
  const top = contentTop(nd);
  const group = new c.THREE.Group();
  const put = (obj, ux, uy, y = 0) => { const q = toPlate({ x: ux, y: uy }); obj.position.set(q.x, c.ground + y, q.z); group.add(obj); return obj; };

  if (f.kind === 'cup') {
    const wx = box.x0 + 13;
    const wy = box.y0 + top + 23.5;
    put(buildCupWall(20 * s, 16 * s, { mats: c.mats }), wx, wy, 0.002);
    const tx = box.x0 + 28.5;
    const ty = box.y0 + top + 30;
    put(buildThermometer(0.2, { mats: c.mats }), tx, ty, 0.002);
    const bath = buildBathDress(20 * s, 16 * s, { own: c.own, thermoAt: { x: (tx - wx) * s, z: (ty - wy) * s } });
    put(bath, wx, wy, 0.002);
    group.userData.update = (fx, st) => {
      const r = cupRead(st, fx.id);
      bath.userData.set({
        level: Math.min(1, 0.45 + (r.mWater / (fx.props.vmax || 220)) * 0.5),
        tint: Math.abs(r.c - 4.184) > 0.01 ? 'metal' : r.Tf > r.T0 + 0.05 ? 'warm' : r.Tf < r.T0 - 0.05 ? 'cool' : 'still',
        frac: clamp01(Math.max(0.02, r.Tf / 100)),
        ink: r.Tf > 45 ? 'warm' : r.Tf < 15 ? 'cool' : 'mid'
      });
    };
    return group;
  }

  if (f.kind === 'well') {
    const atoms = f.props.atoms?.length ? f.props.atoms : ['H', 'H'];
    const pair = buildPairDress(atoms, 2.4 * s, { own: c.own });
    put(pair, box.x0 + f.size.w / 2, box.y0 + top + 6, 0.002);
    group.userData.update = (fx, st) => {
      const r = wellRead(st, fx.id);
      pair.userData.set({ gap: (2 + r.frac * (fx.size.w - 20)) * s, strength: 1 - r.frac });
    };
    return group;
  }

  if (f.kind === 'cells') {
    const p = f.props;
    const cw = p.pitch ?? 13;
    const row = box.x0 + (p.x0 ?? 4) + (p.cells * cw - 0.8) / 2;
    const dress = buildCellsDress(p.cells, p.leftCells, (cw - 0.8) * s, (p.ch ?? 13) * s, cw * s, { mats: c.mats });
    put(dress, row, box.y0 + top + 1 + (p.ch ?? 13) / 2, 0.002);
    group.userData.update = (fx, st) => dress.userData.set({ open: cellsOpen(st, fx.id).open });
    return group;
  }

  if (f.kind === 'chamber') {
    const p = f.props;
    const cw = 8.2;
    const dress = buildChamberDress(p.cells, p.particles, cw * s, 9 * s, { mats: c.mats, own: c.own });
    put(dress, box.x0 + 3 + (p.cells * cw - 0.8) / 2, box.y0 + top + 1 + 4.5, 0.002);
    group.userData.update = (fx, st) => {
      const k = shakesOf(st, fx.id);
      dress.userData.set({ cells: k[k.length - 1] || [] });
    };
    return group;
  }

  return null;
}

/**
 * A tin that has been in a cup keeps what the bath did (`props.rise`, in degrees), so the readings can be compared once the tins are out
 * again and laid on a rail or in a tray. The reading is the cup's own (`cupRead`), taken whenever a tin stands in a cup's mouth.
 */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'cup') continue;
    const item = seatedIn(state, f.props.slot);
    if (!item) continue;
    const r = cupRead(state, f.id);
    if (item.kind === 'charge') item.props.rise = Math.round(r.dT * 10) / 10;
    // A block that has been in the bath keeps how far the bath rose and how far the block fell.
    if (item.kind === 'block') item.props.trial = { rise: Math.round(r.dT * 10) / 10, fall: Math.round((item.props.T - r.Tf) * 10) / 10 };
  }
}

export const HEAT_KIT = {
  id: HEAT_KIT_ID,
  kinds: {
    block: { r: 8, rect: RECTS.block, split: true },
    charge: rect(7, 'charge'),
    eqn: rect(6.3, 'eqn', { flip: true, scale: true }),
    bond: rect(6.3, 'bond', { scale: true }),
    shelf: rect(10, 'shelf'),
    phase: rect(10, 'phase'),
    stmt: rect(7, 'stmt'),
    tag: rect(6.3, 'tag'),
    note: rect(8.5, 'note'),
    gcard: rect(11, 'gcard'),
    num: rect(6.3, 'num'),
    chip: rect(6.3, 'chip'),
    ptc: { r: 6.3, nojoin: true }
  },
  maxScale: 4,
  planJoin,
  pairable: (a, b) => a.kind === 'block' && b.kind === 'block',
  run,
  paintPiece,
  paintFixture,
  piece3d,
  dress3d,
  settle,
  deckStyle: () => 'instrument',
  slot3d: () => 'well',
  // What a piece's face prints as one line of words: a card its first line (long words break in two), an equation card its equation.
  printed: p => (p.kind === 'tag' ? wrap(p.label, 17)[0] : p.kind === 'note' ? wrapN(p.label, 30, 3)[0] : p.kind === 'stmt' ? wrap(p.label)[0] : p.kind === 'eqn' ? fmtEqn(cardTerms(p)) : p.kind === 'ptc' ? '' : p.kind === 'bond' && (p.props.scale || 1) > 1 ? `${p.label} ×${p.props.scale}` : String(p.label)),
  faceKey
};

registerKit(HEAT_KIT);

/** A stage's declaration with the heat kit's defaults: the kit, the bounds, a parked recorder strip. */
export function heatTable(spec, { w = HEAT_BOUNDS.w, recorder = null } = {}) {
  return { kit: HEAT_KIT_ID, bounds: { w, h: HEAT_BOUNDS.h }, tools: [], recorder: recorder || { ...HEAT_RECORDER }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

const piece = (kind, id, label, at, props = {}, extra = {}) => ({ id, kind, label, at, props, ...extra });

/** A body with a mass, a specific heat and a temperature: a block, or a bath. `mat` is how its mass line ends ("Fe"). */
export const block = (id, label, at, { m, c, T, mat = '', mass = null, latent = null }, extra = {}) =>
  piece('block', id, label, at, { m, c, T, mat, ...(mass ? { mass } : {}), ...(latent ? { latent } : {}) }, extra);
/** A charge of chemicals for the cup: its moles and its ΔH per mole (the system's sign). `shown` replaces the moles line. */
export const charge = (id, label, at, { moles, dH, shown = null }, extra = {}) =>
  piece('charge', id, label, at, { moles, dH, ...(shown ? { shown } : {}) }, extra);
/** A step card: `lhs` and `rhs` are `[[coefficient, species], ...]`, `dH` the step's measured ΔH. */
export const eqn = (id, at, lhs, rhs, dH, extra = {}) => piece('eqn', id, id, at, { lhs, rhs, dH, ...(extra.symbol ? { symbol: extra.symbol } : {}) }, extra);
/** A bond chip: its kind ("C-H"), its energy, and how many of them there are; `note` says where it comes from ("methane"). */
export const bondChip = (id, bond, at, { label = null, dH = null, count = 1, note = '' } = {}, extra = {}) => {
  const e = BOND_ENTHALPIES[bond];
  return piece('bond', id, label ?? `${e?.bond ?? bond}${count > 1 ? ` ×${count}` : ''}`, at, { which: bond, dH: dH ?? e?.dH, ...(count > 1 ? { count } : {}), ...(note ? { note } : {}) }, extra);
};
/** A small energy diagram: before on the left, after on the right. */
export const shelfCard = (id, label, at, { dH, from = '', to = '' }, extra = {}) => piece('shelf', id, label, at, { dH, from, to }, extra);
/** A box of a sample's particles: `phase` is 'solid', 'liquid' or 'gas', `T` the temperature in °C that sets how fast they move. */
export const phaseCard = (id, label, at, phase, extra = {}, T = null) => piece('phase', id, label, at, { phase, ...(T != null ? { T } : {}) }, extra);
/** A card with a statement on it. */
export const stmt = (id, label, at, extra = {}) => piece('stmt', id, label, at, {}, extra);
/** A short card of words (two lines of 17 characters): a part of the bench, a change. */
export const tag = (id, label, at, extra = {}) => piece('tag', id, label, at, {}, extra);
/** A card the player taps to mark. */
export const markCard = (id, label, at, extra = {}) => piece('note', id, label, at, { markable: true }, extra);
/** A longer card of words (three lines of 30 characters). */
export const note = (id, label, at, extra = {}) => piece('note', id, label, at, {}, extra);
/** A card with the line of ΔG against temperature for a reaction of the given ΔH (kJ/mol) and ΔS (J/(mol·K)). */
export const gCard = (id, label, at, { dH, dS, Tmin = 100, Tmax = 600 }, extra = {}) => piece('gcard', id, label, at, { dH, dS, Tmin, Tmax }, extra);
/** A card with a number on it: an answer a stage cannot build. */
export const numCard = (id, label, at, value, extra = {}) => piece('num', id, label, at, { value }, extra);
/** A chip with a short word on it (a part of the bench, a change). */
export const chip = (id, label, at, extra = {}) => piece('chip', id, label, at, {}, extra);
/** A particle, for a cell. */
export const particle = (id, at, extra = {}) => piece('ptc', id, extra.label ?? 'P', at, {}, extra);

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

const nDials = d => Object.keys(d).length;

/**
 * The cup: a lagged cup of water with a thermometer, and a mouth (a slot) for what is dropped in. Dials the stage turns on: `joulesList`
 * (a Heater dial), `waters` (a Water dial, grams), `molesList` (a Moles dial), `lid` (the lid on or off). `showHeat` prints the heat the
 * bath caught, `showVerdict` the word WARMED or COOLED, `boundary` draws the dashed line round the mouth. Returns the fixture and the
 * slot (stand it where it says: it is `{ id, at, size }`).
 */
export function cupFixture(id, at, o = {}) {
  const {
    water = 100, waters = null, T0 = 22, c = null, joules = 0, joulesList = null, joulesStart = 1, molesList = null, molesStart = 1, lid = false,
    showHeat = false, showVerdict = false, boundary = false, title = 'Cup', record = false, runLabel = 'Record', showLid = false, vmax = 220, waterStart = 1
  } = o;
  const dials = {};
  if (waters) dials.water = { min: 1, max: waters.length, step: 1, value: waterStart, label: 'Water', labels: waters.map(g => `${g} g`) };
  if (joulesList) dials.heat = { min: 1, max: joulesList.length, step: 1, value: joulesStart, label: 'Heater', labels: joulesList.map(j => `${j.toLocaleString('en-US')} J`) };
  if (molesList) dials.moles = { min: 1, max: molesList.length, step: 1, value: molesStart, label: 'Moles reacted', labels: molesList.map(n => `${n} mol`) };
  if (lid) dials.lid = { min: 1, max: 2, step: 1, value: 1, label: 'Lid', labels: ['On', 'Off'] };
  const nd = nDials(dials);
  const top = contentTop(nd);
  const w = 46;
  const h = Math.round((top + 33.5) * 10) / 10;
  const slotId = `${id}.mouth`;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'cup', label: title, at: { ...at }, size: { w, h }, dials, ...(record ? { runLabel } : { noRun: true }),
      props: { backdrop: true, slot: slotId, water, ...(waters ? { waters } : {}), T0, ...(c != null ? { c } : {}), joules, ...(joulesList ? { joulesList } : {}), ...(molesList ? { molesList } : {}), showHeat, showVerdict, boundary, showLid, vmax }
    },
    slot: { id: slotId, label: ' ', at: { x: x0 + 13, y: y0 + top + 8.5 }, size: { w: 20, h: 14 } },
    slotId,
    size: { w, h }
  };
}

/**
 * Energy shelves: before on the left, after on the right. A stage gives a true `dH` to draw, or `build: {afterList, labels}` to let the
 * player set the after shelf with a dial, or `dir` to let them swap the sides (Reverse). `scale` is the ΔH a full-height step stands for.
 */
export function shelvesFixture(id, at, o = {}) {
  const { reactants = '', products = '', dH = 0, scale = null, hideValue = false, hideVerdict = false, build = null, dir = false, reverse = false, title = 'Energy shelves', w = 44, afterStart = 3, record = false, runLabel = 'Record' } = o;
  const dials = {};
  if (build) dials.after = { min: 1, max: build.afterList.length, step: 1, value: afterStart, label: build.label || 'After shelf', labels: build.labels };
  if (dir) dials.dir = { min: 1, max: 2, step: 1, value: 1, label: 'Direction', labels: ['Forward', 'Reverse'] };
  const top = contentTop(nDials(dials));
  return {
    id, kind: 'shelves', label: title, at: { ...at }, size: { w, h: Math.round((top + 24) * 10) / 10 }, dials, ...(record ? { runLabel } : { noRun: true }),
    props: { reactantsLabel: reactants, productsLabel: products, dH, ...(scale ? { scale } : {}), hideValue, hideVerdict, ...(build ? { afterList: build.afterList } : {}), reverse }
  };
}

/** A bond in its well, and the crank that pulls it (or lets it fall back, `forming`). */
export function wellFixture(id, at, o = {}) {
  const { bond, atoms = ['', ''], D = null, forming = false, hideCost = false, title = 'Bond crank', w = 46, bondLabel = '', record = false, runLabel = 'Let go' } = o;
  const names = forming
    ? ['Free atoms', 'Falling in', 'Closer', 'Closer still', 'Nearly bonded', 'Almost bonded', 'Bonded']
    : ['Bonded', 'Pulled a little', 'Pulled further', 'Further still', 'Nearly free', 'Almost free', 'Free atoms'];
  return {
    id, kind: 'well', label: title, at: { ...at }, size: { w, h: Math.round((contentTop(1) + 24) * 10) / 10 },
    dials: { pull: { min: 1, max: 7, step: 1, value: 1, label: forming ? 'Fall' : 'Crank', labels: names } }, ...(record ? { runLabel } : { noRun: true }),
    props: { which: bond, atoms, ...(D != null ? { D } : {}), forming, hideCost, bondLabel }
  };
}

/** A ledger: the totals of the chips lying in the `broken` and `formed` trays. */
export function ledgerFixture(id, at, { broken, formed, hideNet = false, hideTotals = false, w = 60, title = 'Bond ledger' } = {}) {
  return { id, kind: 'ledger', label: title, at: { ...at }, size: { w, h: 22 }, noRun: true, dials: {}, props: { broken, formed, hideNet, ...(hideTotals ? { hideTotals } : {}) } };
}

/**
 * The stack: the cards lying in `tray` are added, and the equation they leave is printed under the one wanted. `target` is
 * `{ lhs, rhs }` (lists of `[coefficient, species]`); `hideSum` leaves the stack's ΔH off the plate.
 */
export function stackFixture(id, at, { tray, target, hideSum = false, w = 44, h = 30, title = 'Wanted, and the stack', symbol = 'ΔH' } = {}) {
  const fmt = side => side.map(([n, s]) => `${n === 1 ? '' : n === 0.5 ? '½' : `${n} `}${s}`).join(' + ');
  return {
    id, kind: 'stack', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {},
    props: { tray, target: targetMap(target.lhs, target.rhs), targetText: [fmt(target.lhs), fmt(target.rhs)], hideSum, symbol }
  };
}

/**
 * Cells for particles: a row of `cells` squares, a gate after the first `leftCells`, and a Log key that notes the arrangement standing in
 * them. Returns the fixture and its cell slots.
 */
export function cellsFixture(id, at, { cells = 8, leftCells = 4, particles = 2, hideWays = true, gate = true, title = 'Cells', runLabel = 'Log' } = {}) {
  const dials = gate ? { gate: { min: 1, max: 2, step: 1, value: 1, label: 'Gate', labels: ['Shut', 'Open'] } } : {};
  const top = contentTop(nDials(dials));
  const pitch = 13;
  const w = Math.round((8 + cells * pitch) * 10) / 10;
  const h = Math.round((top + 27) * 10) / 10;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const slots = Array.from({ length: cells }, (_, i) => ({
    id: `${id}.c${i + 1}`, label: ' ', at: { x: x0 + 4 + i * pitch + (pitch - 0.8) / 2, y: y0 + top + 1 + 6.5 }, size: { w: 12, h: 12.6 }
  }));
  return {
    fixture: { id, kind: 'cells', label: title, at: { ...at }, size: { w, h }, dials, runLabel, props: { backdrop: true, cells, leftCells, particles, hideWays, pitch, x0: 4, ch: 13 } },
    slots, size: { w, h }
  };
}

/** A chamber that is shaken: each Shake puts the particles in a new set of cells, and the board tallies how many stood on the left. */
export function chamberFixture(id, at, { cells = 8, particles = 4, title = 'Chamber', runLabel = 'Shake', w = 74 } = {}) {
  return { id, kind: 'chamber', label: title, at: { ...at }, size: { w, h: 42 }, dials: {}, runLabel, props: { cells, particles } };
}

/** The plot of ΔG against temperature for a reaction of the given ΔH (kJ/mol) and ΔS (J/(mol·K)), and the dial that walks along it. */
export function plotFixture(id, at, o = {}) {
  const { dH, dS, Ts, tempStart = 1, hideDG = false, hideTug = false, hideCrossing = true, title = 'Free energy', w = 60, record = false, runLabel = 'Record', eq = '', words = false } = o;
  return {
    id, kind: 'plot', label: title, at: { ...at }, size: { w, h: Math.round((contentTop(1) + 28) * 10) / 10 },
    dials: { temp: { min: 1, max: Ts.length, step: 1, value: tempStart, label: 'Temperature', labels: Ts.map(T => `${T} K`) } },
    ...(record ? { runLabel } : { noRun: true }),
    props: { dH, dS, Ts, hideDG, hideTug, hideCrossing, eq, words }
  };
}

/** A sample that is warmed without changing phase: a dial of temperatures in °C, and what warming it does to its entropy. */
export function warmFixture(id, at, { Ts, m = 100, c = 4.184, hideS = false, title = 'Warm sample', w = 46, record = true, runLabel = 'Record' } = {}) {
  return {
    id, kind: 'warm', label: title, at: { ...at }, size: { w, h: Math.round((contentTop(1) + 22) * 10) / 10 },
    dials: { temp: { min: 1, max: Ts.length, step: 1, value: 1, label: 'Heater', labels: Ts.map(T => `${T} °C`) } },
    ...(record ? { runLabel } : { noRun: true }),
    props: { Ts, m, c, hideS }
  };
}

/** A printed reference: lines of text on a plate. */
export function plaqueFixture(id, label, at, lines, { w = 44 } = {}) {
  return { id, kind: 'plaque', label, at: { ...at }, size: { w, h: 8.4 + lines.length * 3.8 }, noRun: true, dials: {}, props: { lines: lines.slice() } };
}

/** A number to set: a marker the player sets to what they have read. */
export function markerFixture(id, label, at, { min = 0, max = 8, step = 0.5, w = 44, start = null, unit = '' } = {}) {
  return {
    id, kind: 'marker', label, at: { ...at }, size: { w, h: 16 }, noRun: true,
    dials: { value: { min, max, step, value: start ?? min, label: 'Set' } },
    props: { ...(unit ? { unit } : {}) }
  };
}

/** A dial with named positions: set it to the one the table shows. */
export function selectorFixture(id, label, at, { options, start = 1, w = 46 } = {}) {
  return {
    id, kind: 'selector', label, at: { ...at }, size: { w, h: 16 }, noRun: true,
    dials: { value: { min: 1, max: options.length, step: 1, value: start, label: 'Set to', labels: options } },
    props: { options }
  };
}

export * from './heat-read.js';
export * from './heat-parts.js';
