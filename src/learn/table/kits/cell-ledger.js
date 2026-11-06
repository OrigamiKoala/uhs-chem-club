/**
 * kits/cell-ledger.js — the half-reaction ledger and the electron tally, registered on the cell kit (`cell-registry.js`). Brinewire's `q1-halves`.
 *
 *   LEDGER  one card for one half-reaction: the species that are always there, and dials that add electrons, hydrogen ions or water to the left
 *           or the right of the arrow, or a "Times" dial that writes the whole half that many times over. The card prints the half as it now
 *           stands (a "Left" line and a "Right" line) and, under it, a row for each element and for charge with the count on the left and on the
 *           right. It prints counts only: no row is marked right or wrong, and the counts that balance are never printed.
 *   TALLY   the electrons given by the halves it watches and the electrons they take, as they now stand.
 *
 * A THIN WRAPPER over `engine/celldata-q1.js` (`ledgerRows`, `scaleHalf`, `tally`): a painter decides nothing. Flat: a ledger is a printed card.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { contentTop } from './heat-draw.js';
import { SPECIES, rowsFor, scaleHalf, sideText } from '../../engine/celldata-q1.js';
import { put } from './cell-board.js';
import './cell-ledger-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const TEXT = PLATE_COLORS.text;

const val = (f, name) => Math.round(f.dials?.[name]?.value ?? 0);

/** The half a ledger card now holds: its fixed species, the multiplier, and the chips the dials have added. */
export function halfOf(f) {
  const p = f.props;
  const k = p.mult ? Math.max(1, val(f, 'k')) : 1;
  const half = scaleHalf(p.base, k);
  for (const c of p.free) {
    const n = val(f, c.dial);
    if (!n) continue;
    if (c.kind === 'e') half[c.side === 'left' ? 'eLeft' : 'eRight'] += n;
    else half[c.side][c.species] = (half[c.side][c.species] || 0) + n;
  }
  return half;
}

/** The rows a card prints now: `[{ label, left, right }]` for the card's own row labels. */
export function ledgerRead(state, fid) {
  const f = state.fixtures[fid];
  const half = halfOf(f);
  const rows = f.props.rows ? rowsFor(half, f.props.rows) : [];
  return { f, half, rows, leftText: sideText(half.left, half.eLeft), rightText: sideText(half.right, half.eRight) };
}

/** The electrons the watched cards give and take, as they now stand. */
export function tallyRead(state, fid) {
  const f = state.fixtures[fid];
  let g = 0; let t = 0;
  for (const id of f.props.cards) { const h = halfOf(state.fixtures[id]); g += h.eRight; t += h.eLeft; }
  return { f, given: g, taken: t };
}

function paintLedger(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = ledgerRead(state, f.id);
  const w = f.size.w;
  const nd = Object.keys(f.dials).filter(n => !p.hidden?.includes(n)).length;
  const top = contentTop(nd);
  put(ctx, 'Left', F.x(3), F.y(top + 2), F.size(2.3, 6.4), { align: 'left', color: DUST, weight: 700 });
  put(ctx, r.leftText, F.x(12), F.y(top + 2), F.size(2.5, 6.8), { align: 'left', color: TEXT, maxW: F.len(w - 15) });
  put(ctx, 'Right', F.x(3), F.y(top + 5.8), F.size(2.3, 6.4), { align: 'left', color: DUST, weight: 700 });
  put(ctx, r.rightText, F.x(12), F.y(top + 5.8), F.size(2.5, 6.8), { align: 'left', color: TEXT, maxW: F.len(w - 15) });
  if (!r.rows.length) return;
  const y0 = top + 10;
  ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(3), F.y(y0 - 1.8)); ctx.lineTo(F.x(w - 3), F.y(y0 - 1.8)); ctx.stroke();
  put(ctx, 'Count', F.x(3), F.y(y0), F.size(2.2, 6.2), { align: 'left', color: DIM });
  put(ctx, 'Left', F.x(w * 0.58), F.y(y0), F.size(2.2, 6.2), { align: 'right', color: DIM });
  put(ctx, 'Right', F.x(w - 3), F.y(y0), F.size(2.2, 6.2), { align: 'right', color: DIM });
  r.rows.forEach((row, i) => {
    const y = y0 + 3.8 + i * 3.6;
    put(ctx, row.label, F.x(3), F.y(y), F.size(2.7, 7.2), { align: 'left', color: DUST, weight: 700 });
    put(ctx, String(row.left), F.x(w * 0.58), F.y(y), F.size(2.8, 7.4), { align: 'right', color: TEXT, weight: 700 });
    put(ctx, String(row.right), F.x(w - 3), F.y(y), F.size(2.8, 7.4), { align: 'right', color: TEXT, weight: 700 });
  });
}

function paintTally(ctx, f, state, b) {
  const F = frameOf(b);
  const r = tallyRead(state, f.id);
  const w = f.size.w;
  put(ctx, 'Electrons given', F.x(3), F.y(5.4), F.size(2.6, 7), { align: 'left', color: DUST });
  put(ctx, String(r.given), F.x(w - 3), F.y(5.4), F.size(3.2, 8), { align: 'right', color: TEXT, weight: 700 });
  put(ctx, 'Electrons taken', F.x(3), F.y(10.6), F.size(2.6, 7), { align: 'left', color: DUST });
  put(ctx, String(r.taken), F.x(w - 3), F.y(10.6), F.size(3.2, 8), { align: 'right', color: TEXT, weight: 700 });
}

registerFixture('cellledger', { paint: paintLedger });
registerFixture('celltally', { paint: paintTally });

/**
 * A ledger card. `base` is the half that is always there (`{ left, right, eLeft, eRight }`, species ids from `celldata.js`). `free` lists the chips
 * its dials add: `{ dial, kind: 'e' | 'sp', species?, side: 'left' | 'right', max }`. `mult` (a number) adds a "Times" dial of 1 up to it. `rows` is
 * the list of row labels to print (element symbols and 'charge'), or null for no rows. Returns the fixture; its height follows from the dials.
 */
export function ledgerFixture(id, at, { title, base, free = [], mult = null, rows = null, w = 70 } = {}) {
  const dials = {};
  for (const c of free) {
    const name = c.kind === 'e' ? 'Electrons' : SPECIES[c.species].text;
    dials[c.dial] = { min: 0, max: c.max, step: 1, value: 0, label: `${name} on the ${c.side}` };
  }
  if (mult) dials.k = { min: 1, max: mult, step: 1, value: 1, label: 'Written this many times' };
  const nd = Object.keys(dials).length;
  const top = contentTop(nd);
  const h = Math.round((top + 8 + (rows ? 4 + 3.6 * rows.length + 1 : 0) + 3) * 10) / 10;
  return {
    id, kind: 'cellledger', label: title, at: { ...at }, size: { w, h }, noRun: true, dials,
    props: { backdrop: true, base, free, mult: Boolean(mult), rows }
  };
}

/** The electron tally for the ledger cards `cards` (their fixture ids). */
export const tallyFixture = (id, at, cards, { w = 44 } = {}) => ({
  id, kind: 'celltally', label: 'Electron tally', at: { ...at }, size: { w, h: 15 }, noRun: true, dials: {}, props: { backdrop: true, cards }
});
