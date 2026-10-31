/**
 * kits/pot-names.js — the instruments and pieces of Kettle's q2-names (ion chips, the charge needle, the label strip, the window), registered on the pot kit (`pot-registry.js`).
 *
 * ION CHIP (piece `ionchip`): a slab with one ion drawn on it. A single-atom ion is one round atom; a polyatomic ion is its atoms joined inside one outline.
 * The charge is printed on it unless the stage hides it (`hide`).
 * CHARGE NEEDLE (fixture `ionneedle`): the gauge of one tray (a cell). It adds up the charges PRINTED on the chips lying in that tray; a chip that hides
 * its charge adds nothing, so the needle never reveals what a stage keeps hidden.
 * LABEL STRIP (fixture `labeler`): a backdrop with slots for name cards (or formula chips) and the words round them that the label already carries.
 * WINDOW (fixture `window`): one seat for a crate; its key draws what the crate's contents are in water (`Dissolve`) or the atoms of one molecule (`Look`).
 * CRATE (piece `crate`): a box with a name and, if the stage prints it, a line under the name. What is inside (`props.content`) is the sample's declaration,
 * read only by the window.
 *
 * A THIN WRAPPER over `engine/reactdata.js` and `engine/reactdata-names.js`: every figure is a planner's answer; a painter decides nothing.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, say, slab } from './pot-draw.js';
import { seatedIn, piecesInTray } from './heat-read.js';
import { IONS, pretty, chargeText } from '../../engine/reactdata.js';
import { ionPicture, isPolyatomic, printedCharge, saltInWater, moleculeAtoms } from '../../engine/reactdata-names.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;

/** The ink of an atom or ion. */
const INK = Object.freeze({
  H: '#d8d2c4', C: '#4a4640', N: '#6f8fb0', O: '#a0522d', S: '#c9b66a', Cl: '#8fae6a', Na: '#9a8fb8', Mg: '#8aa89a', Ca: '#b8a58a', Fe: '#9a6a52',
  K: '#a890a8', Br: '#a8603a', Al: '#9aa0a6', Cu: '#b8764a', Ag: '#b0b6bc', Zn: '#8a9aa8', P: '#c9a05a', Li: '#b898a0', F: '#a8c0a0', Ba: '#a8a070', Pb: '#7a7a82', I: '#8a6aa0'
});
const inkOf = el => INK[el] || '#b8afa0';

/* ------------------------------------------------------------------
   THE ION CHIP
   ------------------------------------------------------------------ */

export const CHIP_RECT = Object.freeze({ hw: 6.6, hh: 6.6 });

/** An ion chip: `ion` is an id of `reactdata.js` `IONS` (`Mg`, `NO3`, `Fe3`). `hide` keeps its charge off the face. */
export const ionChip = (id, ion, at, { hide = false } = {}, extra = {}) => ({
  id, kind: 'ionchip', label: pretty(IONS[ion].f), at, props: { ion, ...(hide ? { hide: true } : {}) }, ...extra
});

/** Draw one ion's atoms (joined for a polyatomic ion) centred on (cx, cy), `R` pixels across half the picture. */
export function drawIon(ctx, ion, cx, cy, R, o = {}) {
  const pic = ionPicture(ion);
  const poly = pic.atoms.length > 1;
  const ar = poly ? R * 0.34 : R * 0.82;
  if (poly) {
    ctx.strokeStyle = DUST; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1, R * 0.12);
    for (const [a, b] of pic.bonds) {
      ctx.beginPath(); ctx.moveTo(cx + pic.atoms[a].x * R * 0.9, cy + pic.atoms[a].y * R * 0.9); ctx.lineTo(cx + pic.atoms[b].x * R * 0.9, cy + pic.atoms[b].y * R * 0.9); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  for (const a of pic.atoms) {
    const ax = cx + a.x * R * 0.9; const ay = cy + a.y * R * 0.9;
    ctx.fillStyle = inkOf(a.el);
    ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = DUST; ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.stroke();
    if (o.symbols) say(ctx, a.el, ax, ay, Math.max(6, ar * 1.05), { align: 'center', weight: 700, color: '#0f0e0b' });
  }
}

function paintIonChip(ctx, p, state, o) {
  const box = slab(ctx, o, CHIP_RECT, '#1d1a16');
  const sc = o.sc;
  const ion = IONS[p.props.ion];
  const poly = isPolyatomic(p.props.ion);
  const cx = o.x - 0.6 * sc;
  const R = (poly ? 3.7 : 3.5) * sc;
  const cy = box.y0 + (poly ? 5.2 : 5.8) * sc;
  drawIon(ctx, p.props.ion, cx, cy, R, { symbols: false });
  if (poly) say(ctx, p.label, o.x, box.y0 + box.h - 2.4 * sc, Math.max(6, 2.4 * sc), { align: 'center', weight: 700, maxW: box.w - 1.2 * sc });
  if (!p.props.hide) say(ctx, chargeText(ion.q), box.x0 + box.w - 0.8 * sc, box.y0 + 2.4 * sc, Math.max(6.2, 2.5 * sc), { align: 'right', weight: 700, color: AMBER });
  if (!poly) say(ctx, p.label, o.x, box.y0 + box.h - 1.9 * sc, Math.max(6, 2.2 * sc), { align: 'center', weight: 700, maxW: box.w - 1.2 * sc, color: DUST });
}

registerPiece('ionchip', {
  kind: { r: 6.6, rect: CHIP_RECT, nojoin: true },
  paint: paintIonChip,
  faceKey: p => `ionchip|${p.props.ion}|${p.props.hide ? 1 : 0}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE CRATE
   ------------------------------------------------------------------ */

export const CRATE_RECT = Object.freeze({ hw: 10, hh: 6.6 });

/**
 * A crate. `shown` is the line printed under its name (a name written on it), if any. `content` is what the window finds in it:
 * `{ type: 'salt', cat, an, hide?: [ionIds whose charge the picture keeps off], charges?: 'all'|'none' }` or `{ type: 'molecule', formula }`.
 */
export const crate = (id, label, at, { shown = null, content = null } = {}, extra = {}) => ({
  id, kind: 'crate', label, at, props: { ...(shown ? { shown } : {}), ...(content ? { content } : {}) }, ...extra
});

function paintCrate(ctx, p, state, o) {
  const box = slab(ctx, o, CRATE_RECT, '#201c16');
  const sc = o.sc;
  ctx.strokeStyle = STEEL;
  ctx.beginPath(); ctx.moveTo(box.x0, box.y0 + 2.3 * sc); ctx.lineTo(box.x0 + box.w, box.y0 + 2.3 * sc); ctx.stroke();
  say(ctx, p.label, o.x, box.y0 + (p.props.shown ? 4.8 : 6.4) * sc, Math.max(6.2, 2.3 * sc), { align: 'center', weight: 700, maxW: box.w - 1.2 * sc });
  if (p.props.shown) say(ctx, p.props.shown, o.x, box.y0 + 9.2 * sc, Math.max(6, 2 * sc), { align: 'center', color: AMBER, weight: 700, maxW: box.w - 1.2 * sc });
}

registerPiece('crate', {
  kind: { r: 6.6, rect: CRATE_RECT, nojoin: true },
  paint: paintCrate,
  faceKey: p => `crate|${p.label}|${p.props.shown ?? ''}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE CHARGE NEEDLE
   ------------------------------------------------------------------ */

/** What a tray's needle reads: the charges printed on the ion chips lying in it. */
export function needleRead(state, fid) {
  const f = state.fixtures[fid];
  const chips = piecesInTray(state, f.props.tray).filter(p => p.kind === 'ionchip');
  const printed = printedCharge(chips.map(c => ({ ion: c.props.ion, hide: Boolean(c.props.hide) })));
  return { f, chips, count: chips.length, charge: printed, range: f.props.range || 6 };
}

/** A gauge for the tray `tray`. Returns the fixture; stand it beside the tray. */
export function needleFixture(id, at, { tray, title = 'Charge needle', range = 6, w = 24, h = 22 } = {}) {
  return { id, kind: 'ionneedle', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { tray, range } };
}

function paintNeedle(ctx, f, state, b) {
  const F = frameOf(b);
  const r = needleRead(state, f.id);
  const w = f.size.w;
  const cx = F.x(w / 2); const cy = F.y(f.size.h - 3.6);
  const R = F.len(Math.min(w * 0.4, f.size.h - 15));
  const sweep = 0.55 * Math.PI;
  ctx.strokeStyle = STEEL; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2 - sweep, -Math.PI / 2 + sweep); ctx.stroke();
  for (let t = -r.range; t <= r.range; t++) {
    const a = -Math.PI / 2 + (t / r.range) * sweep;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * (t === 0 ? 0.74 : 0.86), cy + Math.sin(a) * R * (t === 0 ? 0.74 : 0.86));
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }
  const q = r.charge;
  const a = -Math.PI / 2 + (Math.max(-r.range, Math.min(r.range, q)) / r.range) * sweep;
  ctx.strokeStyle = q === 0 ? DUST : AMBER; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); ctx.stroke(); ctx.lineWidth = 1;
  const end = F.size(2.8, 7);
  say(ctx, '−', cx + Math.cos(-Math.PI / 2 - sweep) * R - end * 0.9, cy + Math.sin(-Math.PI / 2 - sweep) * R + end * 0.2, end, { align: 'center', weight: 700, color: DUST });
  say(ctx, '+', cx + Math.cos(-Math.PI / 2 + sweep) * R + end * 0.9, cy + Math.sin(-Math.PI / 2 + sweep) * R + end * 0.2, end, { align: 'center', weight: 700, color: DUST });
  say(ctx, q === 0 ? '0' : `${q > 0 ? '+' : '−'}${Math.abs(q)}`, F.x(w - 2.4), F.y(12.4), F.size(3.4, 8), { align: 'right', weight: 700, color: q === 0 ? DUST : AMBER });
}

registerFixture('ionneedle', { paint: paintNeedle });

/* ------------------------------------------------------------------
   THE LABEL STRIP
   ------------------------------------------------------------------ */

const SLOT = { w: 28, h: 12.5 };
const WORD = 1.75; // units per character at the strip's word size

/**
 * A label strip. `parts` runs left to right: a string is a word the label already carries, `null` is a slot for a card or chip.
 * Returns the fixture, its slots (stand them where they say) and its size.
 */
export function labelerFixture(id, at, { parts, title = 'Label', slotLabels = [], slotW = SLOT.w, slotH = SLOT.h, gap = 2, pad = 6 } = {}) {
  const top = 10;
  const widths = parts.map(x => (x === null ? slotW : Math.max(3, x.length * WORD + 1)));
  const w = Math.round((widths.reduce((s, v) => s + v, 0) + gap * (parts.length - 1) + 6) * 10) / 10;
  const h = Math.round((top + slotH + pad) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const slots = [];
  const words = [];
  let x = x0 + 3;
  let k = 0;
  parts.forEach((part, i) => {
    if (part === null) {
      k++;
      slots.push({ id: `${id}.s${k}`, label: slotLabels[k - 1] || ' ', at: { x: x + slotW / 2, y: y0 + top + slotH / 2 + 0.5 }, size: { w: slotW, h: slotH } });
    } else words.push({ text: part, x: x - x0, w: widths[i] });
    x += widths[i] + gap;
  });
  return {
    fixture: { id, kind: 'labeler', label: title, at: { ...at }, size: { w, h }, dials: {}, noRun: true, props: { backdrop: true, words, slots: slots.map(s => s.id), top, wordY: top + slotH / 2 + 0.5 } },
    slots, size: { w, h }
  };
}

function paintLabeler(ctx, f, state, b) {
  const F = frameOf(b);
  const size = F.size(3.1, 7);
  for (const wd of f.props.words) say(ctx, wd.text, F.x(wd.x + wd.w / 2), F.y(f.props.wordY), size, { align: 'center', weight: 700, color: DUST, maxW: F.len(wd.w) });
}

registerFixture('labeler', { paint: paintLabeler });

/** The words standing in a strip's slots, in order, as the label reads: the cards' words ('' for an empty slot). */
export function labelWords(state, fid) {
  const f = state.fixtures[fid];
  return f.props.slots.map(sid => seatedIn(state, sid)).map(p => (p ? p.label : ''));
}

/* ------------------------------------------------------------------
   THE WINDOW
   ------------------------------------------------------------------ */

/** A window with one seat and a key. `mode` is `'salt'` (Dissolve) or `'molecule'` (Look). Returns the fixture, its seat and its size. */
export function windowFixture(id, at, { mode = 'salt', title = 'Window', runLabel = mode === 'salt' ? 'Dissolve' : 'Look', w = 84, h = 46 } = {}) {
  const top = 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const slotId = `${id}.seat`;
  return {
    fixture: { id, kind: 'window', label: title, at: { ...at }, size: { w, h }, dials: {}, runLabel, props: { backdrop: true, slot: slotId, mode, top } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 13, y: y0 + top + 8.5 }, size: { w: 22, h: 14 } },
    slotId, size: { w, h }
  };
}

/** What the window holds: the crate on its seat and whether the key has been pressed for it. */
export function windowRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  const content = item?.props?.content || null;
  const sig = item ? `${fid}|${item.id}` : null;
  const ran = Boolean(sig && state.recorder.rows.some(r => r.label === sig));
  return { f, item, content, sig, ran };
}

function runWindow(state, fid) {
  const r = windowRead(state, fid);
  if (!r.item) return { noop: 'Put a crate on the seat first.' };
  if (!r.content) return { noop: 'That crate cannot be looked into.' };
  const atoms = r.content.type === 'salt' ? Object.values(saltInWater(r.content.cat, r.content.an).atoms).reduce((a, b) => a + b, 0) : moleculeAtoms(r.content.formula).atoms.length;
  return { x: state.recorder.rows.length + 1, y: atoms, label: r.sig };
}

function paintWindow(ctx, f, state, b) {
  const F = frameOf(b);
  const r = windowRead(state, f.id);
  const px = 28; const py = f.props.top - 0.6; const pw = f.size.w - px - 3; const ph = f.size.h - py - 9;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(px), F.y(py), F.len(pw), F.len(ph));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(py)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  if (!r.item || !r.content || !r.ran) {
    say(ctx, r.item ? `press ${f.runLabel}` : 'no crate on the seat', F.x(px + pw / 2), F.y(py + ph / 2), F.size(2.2, 6.2), { align: 'center', color: DIM });
    return;
  }
  const c = r.content;
  if (c.type === 'molecule') {
    const m = moleculeAtoms(c.formula);
    const R = F.len(Math.min(ph * 0.42, pw * 0.2));
    const cx = F.x(px + pw / 2); const cy = F.y(py + ph / 2);
    ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1, R * 0.08);
    for (const [i, j, order] of m.bonds) {
      for (let k = 0; k < order; k++) {
        const off = (k - (order - 1) / 2) * R * 0.18;
        ctx.beginPath(); ctx.moveTo(cx + m.atoms[i].x * R * 1.3, cy + m.atoms[i].y * R * 1.3 + off); ctx.lineTo(cx + m.atoms[j].x * R * 1.3, cy + m.atoms[j].y * R * 1.3 + off); ctx.stroke();
      }
    }
    ctx.lineWidth = 1;
    for (const a of m.atoms) {
      const ax = cx + a.x * R * 1.3; const ay = cy + a.y * R * 1.3; const ar = R * 0.34;
      ctx.fillStyle = inkOf(a.el); ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = DUST; ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.stroke();
      say(ctx, a.el, ax, ay, Math.max(6, ar * 1.1), { align: 'center', weight: 700, color: '#0f0e0b' });
    }
    return;
  }
  const w = saltInWater(c.cat, c.an);
  const items = [];
  for (const piece of w.pieces) for (let i = 0; i < piece.count; i++) items.push(piece.ion);
  const cols = Math.min(items.length, 4);
  const rows = Math.ceil(items.length / cols);
  const cellW = pw / cols; const cellH = ph / rows;
  const R = F.len(Math.min(cellW, cellH) * 0.34);
  items.forEach((ion, i) => {
    const cx = F.x(px + (i % cols + 0.5) * cellW); const cy = F.y(py + (Math.floor(i / cols) + 0.5) * cellH);
    drawIon(ctx, ion, cx, cy, R, { symbols: true });
    const hidden = (c.hide || []).includes(ion) || c.charges === 'none';
    if (!hidden) say(ctx, chargeText(IONS[ion].q), cx + R * 1.25, cy - R * 0.9, Math.max(6.2, R * 0.7), { weight: 700, color: AMBER });
  });
}

registerFixture('window', { paint: paintWindow, run: runWindow });

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

addTourText({
  'pot:ionneedle': {
    title: 'Charge needle', dials: false,
    text: 'The needle belongs to the tray named beside it. It adds up the charges printed on the chips lying in that tray: it swings toward + for a positive total, toward − for a negative one, and rests on 0 when they cancel. A chip that prints no charge adds nothing.'
  },
  'pot:window': {
    title: 'Window', dials: false,
    text: 'Drag a crate onto the seat at the left. Press the key on the window and the panel draws what is inside the crate, one small disc for each atom with its symbol on it. Atoms drawn joined inside one outline are held together as one piece.'
  }
}, {
  'pot:ionchip': ['Ion chips', 'Each chip is one ion with its symbol, and its charge in the corner when the chip prints one. Drag a chip into a tray, or tap it and then tap the tray. An ion made of several atoms is drawn with its atoms joined inside one outline.'],
  'pot:crate': ['Crates', 'Each crate holds a sample. A name printed on the crate says what is inside it. Drag a crate onto the seat of the window to look into it.']
});
