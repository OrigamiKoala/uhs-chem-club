/**
 * kits/pans-ice.js — the ICE board of `q5-ice` (Equilibrium Concentrations), registered on the pans kit (`pans-registry.js`).
 *
 *   ICE BOARD   a grid with a column for each substance and three rows: what it starts with, the change (a place for the player's chip,
 *               "−x", "+2x"), and what that leaves at equilibrium, written as the sum of the two (the board adds the start and the chip
 *               the player laid; it prints no number for the amount that is left).
 *   CHANGE CHIP "−x", "+x", "−2x", "+2x": a change in a substance, in steps of one unknown x.
 *   SETTLING BARS  one pair of bars for each substance, its start and, after "Settle", where a sealed pan of that reaction ends up. The end
 *               is `iceAmounts` (`engine/eqdata.js`) found by bisection; it is drawn, and printed only for the substance a stage lets be read.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './pans-registry.js';
import { say, slab, frameOf } from './matter-draw.js';
import { iceAmounts, iceExpression, iceChipLabel } from '../../engine/eqdata.js';
import { pieceIn } from './pans-read.js';
import './pans-ice-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;

const INKS = ['#c0652b', '#6f8fb0', '#8a9a5b'];
const fmtM = v => (v === 0 ? '0' : Number((v + 1e-12).toPrecision(3)).toString());

/* ------------------------------------------------------------------ the change chip */

const RECT_CHIP = { hw: 7.5, hh: 4.4 };

function paintChip(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_CHIP, '#1d1a16');
  say(ctx, String(p.label), o.x, box.y0 + box.h / 2, Math.max(7, 3.2 * o.sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 1.6 * o.sc });
}

registerPiece('ichip', {
  kind: { r: 6.3, rect: RECT_CHIP, nojoin: true },
  paint: paintChip,
  faceKey: p => `ichip|${p.label}`,
  printed: p => String(p.label)
});

/** A change chip for a substance whose coefficient is `nu` (negative for a reactant): "−x", "+2x". */
export const changeChip = (id, nu, at, extra = {}) => ({ id, kind: 'ichip', label: iceChipLabel(nu), at, props: { nu }, ...extra });

/* ------------------------------------------------------------------ the ICE board */

const COL = 20; const LABEL_W = 19;

function paintBoard(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const sz = F.size(2.5, 6.2);
  const xs = i => LABEL_W + (i + 0.5) * COL;
  const rows = [['Initial', 18.2], ['Change', 29.2], ['Equilibrium', 42.4]];
  ctx.strokeStyle = STEEL;
  for (const y of [14, 24.2, 34.4, 47]) { ctx.beginPath(); ctx.moveTo(F.x(1), F.y(y)); ctx.lineTo(F.x(f.size.w - 1), F.y(y)); ctx.stroke(); }
  for (const [name, y] of rows) say(ctx, name, F.x(1.6), F.y(y), F.size(2.1, 5.8), { color: DIM, maxW: F.len(LABEL_W - 1.8) });
  p.species.forEach((s, i) => {
    say(ctx, s.name, F.x(xs(i)), F.y(11.2), F.size(2.9, 6.8), { align: 'center', weight: 700 });
    say(ctx, fmtM(s.init), F.x(xs(i)), F.y(18.2), F.size(2.9, 6.8), { align: 'center', color: DUST, weight: 700 });
    const chip = pieceIn(state, p.slots[s.name]);
    if (chip) say(ctx, iceExpression(s.init, chip.props.nu), F.x(xs(i)), F.y(42.4), F.size(2.7, 6.4), { align: 'center', color: AMBER, weight: 700, maxW: F.len(COL - 2) });
  });
}

registerFixture('iceboard', { paint: paintBoard });

/**
 * The board and its change slots. `species` is `[{name, nu, init}]` (nu negative for a reactant). Returns `{fixture, slots}`; stand the
 * slots where they say.
 */
export function boardFixture(id, at, { species, title = 'ICE board' }) {
  const w = LABEL_W + species.length * COL + 1; const h = 49;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const slots = species.map((s, i) => ({ id: `${id}.c${i}`, label: ' ', at: { x: x0 + LABEL_W + (i + 0.5) * COL, y: y0 + 29.2 }, size: { w: 17, h: 9 } }));
  return {
    fixture: { id, kind: 'iceboard', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { backdrop: true, species: species.map(s => ({ name: s.name, nu: s.nu, init: s.init })), slots: Object.fromEntries(species.map((s, i) => [s.name, slots[i].id])) } },
    slots
  };
}

/** The chip laid in each column, or null; true when every column holds the chip with the species' own coefficient. */
export function boardRead(state, fid) {
  const f = state.fixtures[fid];
  const chips = f.props.species.map(s => ({ s, chip: pieceIn(state, f.props.slots[s.name]) }));
  return { chips, full: chips.every(c => c.chip), right: chips.every(c => c.chip && c.chip.props.nu === c.s.nu), wrong: chips.filter(c => c.chip && c.chip.props.nu !== c.s.nu) };
}

/* ------------------------------------------------------------------ the settling bars */

export function barsRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const nu = Object.fromEntries(p.species.map(s => [s.name, s.nu]));
  const init = Object.fromEntries(p.species.map(s => [s.name, s.init]));
  const { x, amounts } = iceAmounts(nu, init, p.K);
  return { settled: f.dials.s.value >= 1, x, amounts, init, nu };
}

function paintBars(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = barsRead(state, f.id);
  const n = p.species.length;
  const px = 9; const pw = f.size.w - px - 2; const top = 11; const base = f.size.h - 13;
  if (p.info) say(ctx, p.info, F.x(f.size.w - 2), F.y(4.4), F.size(2.0, 5.6), { align: 'right', color: DUST, maxW: F.len(f.size.w - 14) });
  const ph = base - top;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(px), F.y(top), F.len(pw), F.len(ph));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(top)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  const Y = v => base - (v / p.max) * ph;
  const sz = F.size(2.1, 5.8);
  for (const v of [0, p.max / 2, p.max]) say(ctx, fmtM(v), F.x(px - 1.2), F.y(Y(v)), sz, { align: 'right', color: DIM });
  const cw = pw / n;
  p.species.forEach((s, i) => {
    const cx = px + i * cw;
    const bw = Math.min(5.2, cw * 0.32);
    const sx = cx + cw / 2 - bw - 0.5; const ex = cx + cw / 2 + 0.5;
    ctx.strokeStyle = DUST; ctx.setLineDash([2, 2]);
    ctx.strokeRect(Math.round(F.x(sx)) + 0.5, Math.round(F.y(Y(s.init))) + 0.5, Math.round(F.len(bw)), Math.max(1, Math.round(F.len(base - Y(s.init)))));
    ctx.setLineDash([]);
    say(ctx, fmtM(s.init), F.x(sx + bw / 2), F.y(Y(s.init) - 1.9), sz, { align: 'center', color: DUST });
    if (r.settled) {
      const v = r.amounts[s.name];
      ctx.fillStyle = INKS[i % 3];
      ctx.fillRect(F.x(ex), F.y(Y(v)), F.len(bw), F.len(base - Y(v)));
      if (p.reads?.includes(s.name)) say(ctx, fmtM(v), F.x(ex + bw / 2), F.y(Y(v) - 1.9), sz, { align: 'center', color: AMBER, weight: 700 });
    }
    if (p.mark95 === s.name) {
      ctx.strokeStyle = AMBER; ctx.setLineDash([3, 2]); ctx.beginPath();
      ctx.moveTo(F.x(cx + cw / 2 - bw - 1.5), F.y(Y(s.init * 0.95))); ctx.lineTo(F.x(cx + cw / 2 + bw + 1.5), F.y(Y(s.init * 0.95))); ctx.stroke(); ctx.setLineDash([]);
    }
    say(ctx, s.name, F.x(cx + cw / 2), F.y(base + 3.6), F.size(2.6, 6.4), { align: 'center', weight: 700 });
  });
  if (p.mark95) {
    ctx.strokeStyle = AMBER; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(F.x(1.8), F.y(f.size.h - 3.4)); ctx.lineTo(F.x(5.6), F.y(f.size.h - 3.4)); ctx.stroke(); ctx.setLineDash([]);
    say(ctx, '5 % below start', F.x(7), F.y(f.size.h - 3.4), F.size(1.9, 5.6), { color: DIM, maxW: F.len(f.size.w - 7 - 17) });
  }
}

function runBars(state, fid) {
  const f = state.fixtures[fid];
  if (f.dials.s.value >= 1) return { noop: 'The pan has already settled.' };
  const n = state.recorder.rows.length + 1;
  return { x: n, y: 100 + n, label: fid, dials: { [fid]: { s: 1 } } };
}

registerFixture('icebars', { paint: paintBars, run: runBars });

/**
 * Bars for a sealed pan. `species` is `[{name, nu, init}]`; `K` its equilibrium constant; `max` the amount a full bar stands for;
 * `reads` the names whose settled amount is printed; `mark95` the name of the reactant that gets a dashed line 5 % below its start.
 */
export function barsFixture(id, at, { species, K, max, reads = [], mark95 = null, info = '', title = 'Pan', w = 62, h = 42 }) {
  return {
    id, kind: 'icebars', label: title, at: { ...at }, size: { w, h }, runLabel: 'Settle',
    dials: { s: { min: 0, max: 1, step: 1, value: 0, label: 'Settled' } },
    props: { hidden: ['s'], species: species.map(s => ({ name: s.name, nu: s.nu, init: s.init })), K, max, reads, mark95, ...(info ? { info } : {}) }
  };
}
