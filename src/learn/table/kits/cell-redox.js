/**
 * kits/cell-redox.js — the redox beaker and the number probe, registered on the cell kit (`cell-registry.js`). Brinewire's `q1-halves`.
 *
 *   BEAKER  a metal strip dipped in a solution, drawn as two windows side by side: "Before" and "After". Strip atoms are solid discs, ions are
 *           rings, and the sulfate or nitrate ions that take no part are dim rings. What is drawn is counted by `celldata-q1.js` `windowOf`
 *           (electrons given equal electrons taken), never typed by a stage.
 *   PROBE   a seat. Lay a card on it and the probe prints the number it reads on that atom in the Before window and in the After window (or, for
 *           a sealed reaction, on every element in it). It names no change; the player compares the two numbers. A strip keeps one line for
 *           each card that has been read, so cards can be compared after they leave the seat.
 *
 * A THIN WRAPPER over `engine/celldata-q1.js` and `celldata.js`: a painter decides nothing. Flat, like the board; at `3D On` each window
 * stands in a low glass dish (`dress3d`).
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { seatedIn } from './heat-read.js';
import { SPECIES } from '../../engine/celldata.js';
import { CARDS, SORT, WINDOWS, windowOf, cardReading, reactionStates, oxText } from '../../engine/celldata-q1.js';
import { put, METAL_INK } from './cell-board.js';
import './cell-redox-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

/** Window geometry in units from the beaker fixture's top left. */
export const WIN = Object.freeze({ w: 48, h: 32, y: 12, gap: 4, x: 3, pitch: 6.2, r: 2.75 });
/** Ion slots: 4 columns by 4 rows right of the strip, filled in this fixed order. */
const SLOT_ORDER = [5, 10, 1, 14, 7, 2, 12, 9, 0, 15, 4, 11, 6, 13, 3, 8];
/** Strip atoms leave from the right-hand column first. */
const STRIP_LEAVES = [1, 3, 5, 7, 0, 2, 4, 6];

const INK = { Zn: METAL_INK.zn, Cu: METAL_INK.cu, Ag: METAL_INK.ag, Mg: METAL_INK.mg, Fe: METAL_INK.fe };
const elOf = id => Object.keys(SPECIES[id].comp)[0];

/** Every particle of one side of a window, as `{ kind, x, y, id }` in units inside the window. */
export function windowParticles(id, side) {
  const w = windowOf(id);
  const s = w[side];
  const out = [];
  const { pitch } = WIN;
  const atomAt = i => ({ x: 3.6 + (i % 2) * pitch, y: 6.4 + Math.floor(i / 2) * pitch });
  const leaves = STRIP_LEAVES.slice(0, w.A);
  for (let i = 0; i < w.strip0; i++) {
    if (side === 'after' && leaves.includes(i)) continue;
    out.push({ kind: 'atom', id: w.strip, ...atomAt(i) });
  }
  for (let j = 0; j < s.coat; j++) out.push({ kind: 'atom', id: w.coat, x: 3.6 + 2 * pitch, y: 6.4 + j * pitch });
  const slotAt = k => ({ x: 24.5 + (k % 4) * pitch, y: 6.4 + Math.floor(k / 4) * pitch });
  // Before: ions then spectators fill slots in order. After: the ions that stay keep their slots, the strip's ions take the freed ones.
  const ion0 = w.ion0;
  const freed = SLOT_ORDER.slice(ion0 - w.B, ion0);
  for (let k = 0; k < ion0 - (side === 'after' ? w.B : 0); k++) out.push({ kind: 'ion', id: w.ion, ...slotAt(SLOT_ORDER[k]) });
  if (side === 'after') {
    const spare = SLOT_ORDER.slice(ion0 + w.spec);
    const homes = [...freed, ...spare];
    for (let k = 0; k < s.stripIons; k++) out.push({ kind: 'ion', id: w.stripIon, ...slotAt(homes[k]) });
  }
  for (let k = 0; k < w.spec; k++) out.push({ kind: 'spec', id: w.spectator, ...slotAt(SLOT_ORDER[ion0 + k]) });
  return out;
}

/* ------------------------------------------------------------------ the beaker */

function paintBeaker(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  for (const [idx, side] of ['before', 'after'].entries()) {
    const x0 = WIN.x + idx * (WIN.w + WIN.gap);
    const y0 = WIN.y;
    put(ctx, idx ? 'After' : 'Before', F.x(x0 + WIN.w / 2), F.y(7.4), F.size(2.6, 7), { color: DUST, weight: 700 });
    ctx.fillStyle = '#2f4a47'; ctx.fillRect(F.x(x0 + 0.5), F.y(y0 + 3), F.len(WIN.w - 1), F.len(WIN.h - 3.5));
    ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
    ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(y0)); ctx.lineTo(F.x(x0), F.y(y0 + WIN.h)); ctx.lineTo(F.x(x0 + WIN.w), F.y(y0 + WIN.h)); ctx.lineTo(F.x(x0 + WIN.w), F.y(y0)); ctx.stroke();
    ctx.lineWidth = 1;
    // the strip: a bar behind its atoms
    ctx.fillStyle = '#1f1d18'; ctx.fillRect(F.x(x0 + 0.8), F.y(y0 + 2.5), F.len(WIN.pitch * 3 + 0.6), F.len(WIN.h - 3));
    for (const q of windowParticles(p.reaction, side)) {
      const cx = F.x(x0 + q.x); const cy = F.y(y0 + q.y); const r = F.len(WIN.r);
      const ink = INK[elOf(q.id)] || DUST;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (q.kind === 'atom') { ctx.fillStyle = ink; ctx.fill(); ctx.strokeStyle = STEEL; ctx.stroke(); }
      else { ctx.fillStyle = '#1b2a28'; ctx.fill(); ctx.strokeStyle = q.kind === 'ion' ? ink : DIM; ctx.lineWidth = Math.max(1.4, F.len(0.42)); ctx.stroke(); ctx.lineWidth = 1; }
      put(ctx, SPECIES[q.id].text, cx, cy, F.size(2.1, 6.2), { color: q.kind === 'atom' ? '#16140f' : q.kind === 'ion' ? TEXT : DUST, weight: 700, maxW: r * 1.9 });
    }
  }
  put(ctx, 'Solid discs are atoms, rings are ions.', F.x(f.size.w / 2), F.y(f.size.h - 3.4), F.size(2.2, 6.2), { color: DUST });
}

/** Low glass dishes round the two windows at `3D On`. */
function dressBeaker(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const group = new T.Group();
  const H = 0.026; const t = 0.005;
  const wall = (cx, cy, lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  for (const idx of [0, 1]) {
    const w = WIN.w * s; const d = WIN.h * s;
    const cx = box.x0 + WIN.x + idx * (WIN.w + WIN.gap) + WIN.w / 2; const cy = box.y0 + WIN.y + WIN.h / 2;
    wall(cx, cy, w + 2 * t, t, 0, -d / 2 - t / 2);
    wall(cx, cy, w + 2 * t, t, 0, d / 2 + t / 2);
    wall(cx, cy, t, d, -w / 2 - t / 2, 0);
    wall(cx, cy, t, d, w / 2 + t / 2, 0);
  }
  return group;
}

registerFixture('cellredox', { paint: paintBeaker, dress3d: dressBeaker });

/** A redox beaker for one of `WINDOWS` (key). Returns the fixture; size is fixed at 107 by 48 units. */
export function beakerFixture(id, at, reaction, { title = 'Beaker' } = {}) {
  if (!WINDOWS[reaction]) throw new Error(`beakerFixture: no such window ${reaction}`);
  return {
    id, kind: 'cellredox', label: title, at: { ...at }, size: { w: WIN.x * 2 + WIN.w * 2 + WIN.gap, h: WIN.y + WIN.h + 8 }, noRun: true, dials: {},
    props: { backdrop: true, reaction }
  };
}

/* ------------------------------------------------------------------ the probe */

/** What the probe reads on the card or reaction in its seat: rows of `{ name, before, after }`. */
export function probeRows(piece) {
  if (!piece) return null;
  if (piece.props.card) { const r = cardReading(piece.props.card); return [{ name: r.el, before: r.before, after: r.after }]; }
  if (piece.props.reaction) return reactionStates(piece.props.reaction).map(r => ({ name: r.el, before: r.before, after: r.after }));
  return null;
}

/** The probe's state: the card in the seat, its rows, and the cards read so far. */
export function probeRead(state, fid) {
  const f = state.fixtures[fid];
  const piece = seatedIn(state, f.props.seat);
  return { f, piece, rows: probeRows(piece), noted: f.props.noted || [] };
}

const noteLine = (f, id) => {
  const c = CARDS[id];
  if (c) { const r = cardReading(id); return { id, name: c.short, before: r.before, after: r.after }; }
  return null;
};

function paintProbe(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = probeRead(state, f.id);
  const w = f.size.w;
  put(ctx, 'Before', F.x(w * 0.52), F.y(p.headY), F.size(2.2, 6.2), { color: DUST, weight: 700 });
  put(ctx, 'After', F.x(w * 0.84), F.y(p.headY), F.size(2.2, 6.2), { color: DUST, weight: 700 });
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(2), F.y(p.rowsY - 2), F.len(w - 4), F.len(p.rowsH));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(2)) + 0.5, Math.round(F.y(p.rowsY - 2)) + 0.5, Math.round(F.len(w - 4)), Math.round(F.len(p.rowsH)));
  if (!r.rows) put(ctx, 'Nothing on the seat', F.x(w / 2), F.y(p.rowsY + 1.5), F.size(2.2, 6.2), { color: DIM });
  else {
    r.rows.forEach((row, i) => {
      const y = p.rowsY + 1.5 + i * 3.6;
      put(ctx, row.name, F.x(4), F.y(y), F.size(2.6, 7), { align: 'left', color: TEXT, weight: 700 });
      put(ctx, oxText(row.before), F.x(w * 0.52), F.y(y), F.size(2.8, 7.4), { color: AMBER, weight: 700 });
      put(ctx, oxText(row.after), F.x(w * 0.84), F.y(y), F.size(2.8, 7.4), { color: AMBER, weight: 700 });
    });
  }
  if (p.strip) {
    const y0 = p.rowsY - 2 + p.rowsH + 3;
    put(ctx, 'Read so far', F.x(3), F.y(y0), F.size(2.1, 6), { align: 'left', color: DUST, weight: 700 });
    r.noted.forEach((id, i) => {
      const line = noteLine(f, id);
      if (!line) return;
      const y = y0 + 3.8 + i * 3.6;
      put(ctx, line.name, F.x(3), F.y(y), F.size(2.4, 6.6), { align: 'left', color: TEXT, maxW: F.len(w * 0.4) });
      put(ctx, oxText(line.before), F.x(w * 0.52), F.y(y), F.size(2.4, 6.6), { color: AMBER, weight: 700 });
      put(ctx, oxText(line.after), F.x(w * 0.84), F.y(y), F.size(2.4, 6.6), { color: AMBER, weight: 700 });
    });
  }
}

/** The probe keeps every card it has had on its seat, in the order they were read. */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'cellprobe') continue;
    const piece = seatedIn(state, f.props.seat);
    const id = piece && (piece.props.card || piece.props.reaction);
    if (!id) continue;
    const noted = f.props.noted || (f.props.noted = []);
    if (!noted.includes(id)) noted.push(id);
  }
}

registerFixture('cellprobe', { paint: paintProbe, settle });

/**
 * The number probe. `rows` is how many lines a reading needs (1 for a card, up to 5 for a reaction), `strip` keeps a line for each card read
 * (cards only). Returns `{ fixture, slot, size }`; the stage adds `slot` to its zones.
 */
export function probeFixture(id, at, { rows = 1, strip = false, stripLines = 0, title = 'Number probe' } = {}) {
  const w = 56;
  const rowsY = 33;
  const rowsH = 4 + rows * 3.6;
  const h = Math.round((rowsY - 2 + rowsH + (strip ? 3 + 3.8 + stripLines * 3.6 : 0) + 3) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const slot = { id: `${id}.seat`, label: ' ', at: { x: x0 + w / 2, y: y0 + 18 }, size: { w: 32, h: 14 } };
  return {
    fixture: {
      id, kind: 'cellprobe', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {},
      props: { backdrop: true, seat: slot.id, headY: 27.4, rowsY, rowsH, strip, noted: [] }
    },
    slot,
    size: { w, h }
  };
}

/** A card the probe reads: a `tag` piece carrying the card id (or a sealed reaction id). */
export const probeCard = (id, cardId, at, extra = {}) => ({
  id, kind: 'tag', label: CARDS[cardId]?.label ?? SORT[cardId]?.label ?? cardId, at,
  props: SORT[cardId] && !CARDS[cardId] ? { reaction: cardId } : { card: cardId }, ...extra
});
